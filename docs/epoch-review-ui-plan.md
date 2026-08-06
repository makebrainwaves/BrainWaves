# Interactive Epoch Review UI — Preliminary Plan

**Status:** Preliminary / discussion. Written to seed a planning loop — vision and
context first, deep technical decisions deliberately left open (flagged as Open
Questions). Not yet an implementation spec.

**Owner:** Dano · **Drafted:** 2026-07-06

---

## 1. Vision

Replace MNE's native Matplotlib "clean epochs" GUI — which **cannot run in the
Pyodide/WASM port** — with a first-class, fully interactive React experience for
reviewing and cleaning epoched EEG.

This is not just a feature port. It is a chance to make epoch review **an
onboarding experience to EEG signal analysis** as much as a tool. The target
user is a student who may be seeing epoched EEG for the first time. The UI should
teach *what an epoch is, what artifacts look like, and why we reject them* while
they do the work — in the app's lighthearted, student-friendly voice (per
`.llms/CLAUDE.md`). It must also be a genuinely capable tool an experienced user
trusts. Both, not either.

It should be **fully featured and interactive** — at least at parity with what
MNE's GUI offered, and ideally beyond it (guided artifact detection, live ERP
feedback, explanations) because we control the whole surface.

---

## 2. Why this exists — the WASM gap

BrainWaves runs its analysis (MNE-Python) **in-browser via Pyodide/WASM inside a
web worker** (see the `pyodide-mne` skill and `docs/pyodide-in-electron-vite.md`).
That environment has hard constraints:

- The worker uses Matplotlib's **`agg` backend** — headless, buffer-based. There
  is **no GUI event loop and no window**. WebAgg (Matplotlib's browser backend)
  does not work in a worker context at all.
- Every *static* plot we render today (PSD, topo map, ERP) works by having Python
  `savefig()` an **SVG string**, tagging it with a `plotKey`, and shipping that
  string back over the worker message channel to render in `PyodidePlotWidget`.
- `epochs.plot()` is the **only** analysis call that tried to be *interactive*.
  It returns a live Matplotlib Figure object, which (a) has no GUI to display in,
  and (b) can't even cross the worker boundary — a `PyProxy`/Figure isn't
  `structuredClone`-able, so `postMessage` throws `DataCloneError`.

**This is not an MNE-version problem.** We are already on **MNE 1.12.1** (current).
The recent errors (`plot_psd` → `compute_psd`, `events=None` → `events=False`) are
just the code catching up to the modern MNE API; bumping MNE won't remove them.
The interactive-GUI problem is architectural: **native Matplotlib GUIs don't exist
in WASM, and no MNE version changes that.** The only path to interactive epoch
review is to build the UI ourselves — which is what this plan is for.

---

## 3. What MNE's Matplotlib GUI did (the experience to replicate)

`epochs.plot()` opened an interactive browser. Reference behavior:

**Layout**
- Epochs laid out **side by side horizontally**; channels **stacked vertically**.
- Vertical divider lines between epochs; epoch index labels along the bottom.
- A configurable window of `n_epochs` visible at once (our call used 6).
- Epochs colored by **event/condition** (our numeric marker codes → conditions),
  with a legend.
- Event markers drawn as vertical lines within each epoch.

**Navigation**
- Scroll through epochs (←/→ / Page keys) and channels (↑/↓).
- Amplitude **scaling** up/down (`scalings='auto'` set the initial scale).
- Butterfly mode, DC-removal toggle, annotation toggle, help overlay.

**The core action — rejection**
- **Click an epoch** → toggle it "bad" (visually greyed). On window close, the
  marked epochs are **dropped** (`epochs.drop(indices)`).
- **Click a channel label** → mark the channel bad (`epochs.info['bads']`),
  excluding it from downstream analysis.

**Result**
- On close, the Epochs object is mutated: bad epochs dropped, bad channels
  flagged. That cleaned object is what gets saved (`-cleaned-epo.fif`) and fed to
  topo/PSD/ERP.

**Adjacent MNE capability we should exploit**
- MNE can **auto-flag** epochs via peak-to-peak `reject` thresholds, recording
  *why* each was dropped in the **`drop_log`**. This is gold for onboarding:
  "we flagged these as likely blinks — here's the trace, do you agree?"

---

## 4. What "cleaning" actually means (and a caveat)

Cleaning = **removing artifact-contaminated epochs and bad channels** so the
average (ERP) reflects brain activity, not blinks/muscle/movement. Common
artifacts a student should learn to recognize:

- **Eye blinks** — large, slow frontal deflections (AF7/AF8 on Muse).
- **Muscle/EMG** — high-frequency bursts.
- **Movement/drift** — slow baseline wander.
- **Electrode pop** — sudden step in one channel.

**Caveat that raises the stakes:** filtering already happens at load (`filterIIR`
1–30 Hz). So *without* interactive rejection, today's "Clean Data" does no real
cleaning — it just re-saves every epoch. The interactive review **is** the
feature; there's no meaningful non-interactive fallback. (A read-only static SVG
of the epochs is possible as a stopgap, but it can't clean anything.)

---

## 5. Design goals

1. **Onboarding-first.** A newcomer should leave understanding epochs and
   artifacts. Explanations, a guided mode, plain-language cues — not jargon walls.
2. **Fully featured & interactive.** Parity-plus with MNE's GUI: reject epochs,
   flag channels, scroll, scale, zoom, condition coloring.
3. **A tool experts trust.** Auto-suggestions must be overridable; nothing hidden
   or magic; the resulting cleaned data must be exactly what MNE would produce.
4. **Live feedback.** Ideally, show the **ERP updating as you reject** — the
   single most powerful teaching moment (see the signal get cleaner).
5. **Hackable & extensible.** Fits the CLAUDE.md horizon (block-based programming,
   embedded notebooks). Don't leak MNE/Pyodide abstractions into the UI.
6. **Device-agnostic.** Works for 4-ch Muse today, N-ch (Neurosity, external LSL)
   tomorrow.

---

## 6. Replicating it in React — the pieces

Four concerns. Each has real design choices (deferred to the planning loop).

### 6a. Data path: Python → renderer
We stop shipping a *GUI object* and instead ship the **raw numbers**, then render
them ourselves. Needed from Python per "clean" request:
- Epoch data array: `epochs.get_data()` → shape `(n_epochs, n_channels, n_times)`.
- Metadata: `ch_names`, `sfreq`, `times`, per-epoch condition (from the marker
  registry), and the **auto-reject flags + `drop_log`** for suggestions.

**Transport is the crux** (and the lesson from this whole debugging session):
don't JSON-serialize float arrays, and don't return a `PyProxy`. Get the numpy
buffer as a **`Float32Array` / `ArrayBuffer`** and send it as a **transferable**
over `postMessage` (zero-copy). Small metadata rides as JSON alongside. This
sidesteps the serialization wall entirely — buffers cross cleanly; Figures don't.

### 6b. Rendering
Muse is tiny (4 ch × ~256 samples × dozens of epochs), but we must not design for
4 channels — Neurosity (8) and external LSL devices (32–64) are on the roadmap.
- **Canvas 2D** is the pragmatic default (smooth for thousands of points).
- **WebGL** if channel/epoch counts get large.
- **SVG/DOM overlay** on top for interaction targets (epoch columns, channel
  labels, tooltips, selection highlights) — cheap hit-testing and accessibility.
- Likely a **hybrid**: canvas traces + DOM/SVG interaction layer.

### 6c. Interaction model (parity-plus with MNE)
- Click/tap an epoch → toggle reject (clear visual state).
- Click a channel label → toggle bad channel.
- Scroll/scrub epochs and channels; amplitude scaling; horizontal zoom.
- Condition coloring + legend.
- **Beyond MNE:** hover tooltips ("this looks like a blink"), a "reject all
  flagged" / "review flagged only" mode, keyboard-first flow, undo.

### 6d. Apply path: renderer → Python
- Collect rejected epoch indices + bad channels → dispatch an action → epic posts
  to the worker → Python `epochs.drop(indices)` + set `info['bads']` → save
  `-cleaned-epo.fif` via the existing MEMFS/`saveEpochs` path.
- The result must be **bit-identical to what MNE's GUI would have produced** — the
  UI changes, the science does not.

### 6e. The onboarding layer (the differentiator)
- Plain-language explanations of epochs and each artifact type.
- **Guided mode** (default for newcomers): step through auto-flagged epochs with
  "why we flagged this," student confirms/overrides → teaches artifact spotting.
- Channel legend tied to head position (Muse 10-20: TP9/AF7/AF8/TP10).
- **Live ERP preview** pane that updates as epochs are rejected.
- Tone: encouraging, lighthearted, student-facing.

---

## 7. Architecture fit & constraints

- **Worker protocol** (`pyodide-mne` skill): today's plots use fire-and-forget
  `postMessage` + `plotKey`/`dataKey` reply routing through `pyodideMessageEpic`.
  A data-heavy request/response (fetch epoch arrays, get result back, then let the
  user act) pushes toward finally doing the **`runPython` RPC** already tracked in
  `TODOS.md` ("Optional Full Pyodide worker RPC"). This feature is the strongest
  reason yet to build it — worth deciding early.
- **New Python helpers** (`webworker/utils.py`): `get_epochs_arrays(epochs)` →
  buffer + metadata; `apply_rejection(epochs, drop_indices, bad_channels)`. Keep
  them native-testable (the `tests/analysis/` pattern) so cleaning logic is
  verified against real MNE in CI.
- **New epic(s)** in `pyodideEpics.ts` + **new actions** (fetch/set epoch data,
  apply rejection). Reuse `buildMarkerRegistry` for condition labels/colors.
- **New React component** (`EpochReviewer` or similar) replacing the plot area in
  `CleanComponent`. Styling: shadcn/ui + Tailwind, brand teal, student tone.
- **Constraints to respect:** headless `agg` in the worker; no large-array JSON;
  transferables for buffers; keep main/renderer/worker separation clean; don't
  leak Pyodide/MNE types into React.

---

## 8. Open questions (for the planning loop)

1. **Rendering tech** — Canvas 2D now, or WebGL up front for future high-channel
   devices?
2. **RPC first?** — Do we build the `runPython` request/response RPC as a
   prerequisite (cleaner data fetch), or bolt this onto the current fire-and-forget
   `dataKey` pattern?
3. **Onboarding depth** — Is guided mode the default? How much curriculum
   (tooltips only vs. a real walkthrough)?
4. **Auto-rejection** — Expose peak-to-peak thresholds to the user, or keep them
   as invisible "suggestions"? What defaults?
5. **Bad channels on Muse** — dropping 1 of 4 channels is drastic; do we support
   channel rejection for low-channel devices, or epochs-only there?
6. **Live ERP preview** — in-scope for v1 (big teaching win, more compute) or a
   fast-follow?
7. **Static fallback** — keep a read-only SVG epochs view for environments where
   the interactive UI can't run, or all-in on the React UI?

---

## 9. Rough phases (to be firmed up in planning)

- **Phase 0 — Transport & read-only render.** Ship epoch arrays + metadata across
  the worker boundary (transferable buffers); render static traces in React.
  Proves the data path and rendering choice.
- **Phase 1 — Core interaction.** Click-to-reject epochs, scroll/scale/zoom, apply
  → `epochs.drop` → save `-cleaned-epo.fif`. Reaches functional parity with the
  *essential* MNE workflow.
- **Phase 2 — Full parity.** Bad-channel flagging, condition coloring/legend,
  auto-flag suggestions from `drop_log`/peak-to-peak.
- **Phase 3 — Onboarding layer.** Explanations, guided mode, artifact tutorials,
  live ERP preview.
- **Phase 4 — Polish & generalize.** N-channel devices (Neurosity/LSL),
  accessibility, keyboard flow, performance.

---

## 10. Context references

- **Skills:** `pyodide-mne` (worker↔Python protocol, plot routing, `pyodide://`),
  `redux-observable-epochs` (epic anatomy, numeric marker-code contract).
- **Docs:** `docs/pyodide-in-electron-vite.md`, `docs/user-flow.md`.
- **Learnings** (`.llms/learnings.md`): agg backend / WebAgg-in-worker limits;
  plot-result routing pattern; PyProxy serialization; marker registry / numeric
  event codes; the analysis pipeline testability pattern.
- **Code today:** `src/renderer/utils/webworker/{index.ts,webworker.js,utils.py}`
  (worker + Python), `src/renderer/epics/pyodideEpics.ts` (epics),
  `src/renderer/components/CleanComponent/`, `PyodidePlotWidget.tsx` (existing
  static-plot render path), `src/renderer/utils/eeg/markerRegistry.ts`.
- **Related TODO:** `TODOS.md` → "Optional Full Pyodide worker RPC" (this feature
  is the strongest motivation to build it).
