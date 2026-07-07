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

**This is not an MNE-version problem — it's architectural.** We install the latest
MNE from PyPI (`internals/scripts/InstallMNE.mjs` lists `mne` **unpinned** in
`PYPI_PACKAGES`, so `postinstall` grabs whatever is current — a modern 1.x). The
recent errors (`plot_psd` → `compute_psd`, `events=None` → `events=False`) were
just the code catching up to the modern MNE API; no MNE version brings back native
Matplotlib GUIs in WASM. The only path to interactive epoch review is to build the
UI ourselves — which is what this plan is for.

> **Note (grounding):** MNE is unpinned today. If exact-reproducibility of the
> cleaned output matters (design goal 3), consider pinning the MNE version in
> `InstallMNE.mjs` so a silent upstream bump can't change epoching/averaging
> behavior out from under the tests.

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
  (Returns float64; see the transport note below on downcasting to Float32.)
- Metadata: `ch_names`, `sfreq`, `times`, **per-epoch condition codes**
  (`epochs.events[:, -1]` — the numeric marker codes, *labeled* via the marker
  registry's `codeToLabel`, not stored on the registry itself), and the
  **auto-reject flags + `drop_log`** for suggestions.

> **Grounding — exclude the Marker/stim channel from the arrays.** `get_data()`
> returns *all* channels, including the trailing `Marker` channel that carries the
> numeric event codes. The existing channel picker already drops it
> (`requestChannelInfo` runs `[ch for ch in clean_epochs.ch_names if ch !=
> 'Marker']`); `get_epochs_arrays` must do the same, or the reviewer renders the
> raw code channel as a bogus "trace" and `ch_names` / the channel count are
> off-by-one. (The per-epoch condition codes still come from `epochs.events[:,
> -1]`, which is unaffected by dropping the channel.)

> **Grounding correction — the registry gives labels, not colors.**
> `buildMarkerRegistry` (`markerRegistry.ts`) returns only `{ codeToLabel,
> eventId }`. There is **no color** on it. Condition colors today are hardcoded
> RGB palettes inside `utils.py` (`plot_topo`, `plot_conditions`). So condition
> coloring in the React UI needs a **new color source** — decide whether to (a)
> define a palette UI-side keyed by condition label, or (b) promote the `utils.py`
> palette into a single shared source both Python plots and the React reviewer
> read from (preferred, avoids the ERP/topo legend and the reviewer disagreeing on
> which color is which condition). Track this as a small design decision, not a
> reuse of existing code.

**Transport is the crux** (the lesson of this whole debugging session): don't
JSON-serialize float arrays and don't return a `PyProxy`. Get the numpy buffer as
an **`ArrayBuffer`** and post it as a **transferable** (zero-copy); the metadata
above rides as JSON on the same message. Buffers cross cleanly; Figures don't.

> **Downcasting to Float32 is safe here — and only here.** `get_data()` is
> float64; halving it to Float32 loses precision, but this buffer is *display
> only*. The apply path (§6d) is **index-based** (`epochs.drop(indices)`) — the
> epoch samples never round-trip out of Python and back, so the cleaned `.fif`
> stays bit-identical to what MNE would produce (design goal 3). Keep it that way:
> never reconstruct epochs from the Float32 buffer on the Python side.

**This means extending the worker message contract, not just adding a Python
helper (grounded in `webworker.js` today).** The current handler is
one-size-fits-all: it runs `data`, and if the result has `.toJs` it converts the
`PyProxy` and posts `{ results, plotKey, dataKey }` **with no transfer list** — so
it can't ship a zero-copy buffer. Phase 0 must:
- Return the numpy buffer as an `ArrayBuffer` (e.g. `arr.tobytes()` off the
  `PyProxy`, or via the emscripten heap) and `self.postMessage({ buffer, meta,
  dataKey }, [buffer])` — the `[buffer]` transfer list is mandatory, or the buffer
  is structured-cloned (a copy).
- Route it on a **new `dataKey`** (e.g. `'epochArrays'`) so it bypasses the
  existing PyProxy→`toJs`→SVG-string switch in `pyodideMessageEpic` (which assumes
  results are plain JS or an SVG string).

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
  `-cleaned-epo.fif`.
- The result must be **bit-identical to what MNE's GUI would have produced** — the
  UI changes, the science does not.

**Persistence is a real gap — the Clean→Analyze round-trip is broken today.**
Traced end to end against `webworker/`, `src/main/index.ts`, `src/preload/index.ts`:
- **Save side:** `saveEpochs` (`webworker/index.ts`) posts `raw_epochs.save("<host
  OS path>")`, but Pyodide's worker FS is **MEMFS (in-memory)** — there is **no
  NODEFS/`syncfs`/mount anywhere in `webworker/`**, so the write lands in the WASM
  virtual FS, never on host disk.
- **Load side:** the Analyze screen re-reads *host disk* both times — at
  `componentDidMount` it calls `readWorkspaceCleanedEEGData` (main-process `fs`) to
  populate the picker, then on selection `LoadCleanedEpochs` → `writeEpochsToMemfs`
  → `fs:readFileAsBytes` stages host bytes into MEMFS. It never reuses in-session
  MEMFS epochs.
- **The gap:** nothing ever writes the cleaned `.fif` *to* host disk. Main has
  write IPC (`fs:storePyodideImagePng`, `eeg:createWriteStream`,
  `fs:storeAggregatedBehaviorData`) but **none writes an epoch `.fif` from the
  worker**, so a fresh workspace has nothing for Analyze to load. The fix is a
  **new MEMFS→host write-back bridge**, and because the worker can't reach
  `ipcMain` it must cross every process boundary (see the `electron-ipc-channel`
  skill) — don't collapse it to "postMessage → handler". The full chain: Python
  `save()` to a MEMFS path → worker `pyodide.FS.readFile(path)` + `postMessage` the
  bytes back on a **new `dataKey`** (e.g. `'savedEpochs'`, routed in
  `pyodideMessageEpic` beside the existing `epochsInfo`/`channelInfo` cases — which
  return no transfer list today, so shipping bytes zero-copy means extending that
  reply path too) → a new epic → a new `window.electronAPI` method → the preload
  bridge → a new main handler. **Reuse anchor, not new machinery:**
  `fs:storePyodideImagePng` (`src/main/index.ts` line 315) is already this pattern —
  `(title, imageTitle, rawData: ArrayBuffer)` → `Buffer.from(rawData)` →
  `fs.writeFile` to disk; the write-back handler should mirror *it* (a binary
  renderer→disk write), not `fs:readFileAsBytes`. This is not a "persist" nicety —
  **it repairs a currently broken flow**.

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
  Note the `dataKey` pattern **already does request/response round-trips**
  (`epochsInfo` → `SetEpochInfo`, `channelInfo` → `SetChannelInfo`), so fetching
  epoch arrays and applying rejection can be built on it directly — a `runPython`
  RPC is **not a hard prerequisite**. The `TODOS.md` item ("(Optional) Full
  Pyodide worker RPC") itself says it's only worth doing "if the FIFO sequencing
  ever actually bites." Where it *would* help this feature: an `await`-able RPC
  lets an apply-then-refresh sequence (drop epochs → save → re-fetch stats/ERP)
  read real results instead of relying on worker FIFO ordering across several
  fire-and-forget messages. Treat it as an ergonomics/scaling call, not a blocker
  (see Open Question 2).
- **New Python helpers** (`webworker/utils.py`): `get_epochs_arrays(epochs)` →
  buffer + metadata; `apply_rejection(epochs, drop_indices, bad_channels)`. Keep
  them native-testable (the `tests/analysis/` pattern) so cleaning logic is
  verified against real MNE in CI.
- **New epic(s)** in `pyodideEpics.ts` + **new actions** (fetch/set epoch data,
  apply rejection). Reuse `buildMarkerRegistry` for condition **labels** (code↔label
  only, no colors — see §6a for where condition colors must come from).
- **New React component** (`EpochReviewer` or similar) **added to**
  `CleanComponent`. Correction: `CleanComponent` has **no plot area** to replace —
  today it renders only subject/recording `<select>`s, Load/Clean buttons, and
  epoch-count stats (`renderEpochLabels`). The static plots (`PyodidePlotWidget`,
  which renders an SVG string via an `<img>`) live in `AnalyzeComponent` and
  `HomeComponent`, not here. So the reviewer is a genuinely new interactive
  surface on the Clean screen, wired to the `Load Dataset`/`Clean Data` flow that
  already dispatches `LoadEpochs`/`CleanEpochs`. Styling: shadcn/ui + Tailwind,
  brand teal, student tone.
- **Constraints to respect:** headless `agg` in the worker; no large-array JSON;
  transferables for buffers (which means extending the worker's `postMessage` to
  pass a transfer list — see 6a); keep main/renderer/worker separation clean;
  don't leak Pyodide/MNE types into React.

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
8. **Save persistence — resolved (see §6d), not really open.** The Clean→Analyze
   round-trip is broken today; the MEMFS→host write-back bridge fixes it. Only
   residual decision: write to the existing
   `Data/<subject>/EEG/<subject>-cleaned-epo.fif` path that
   `readWorkspaceCleanedEEGData` scans for (`epo.fif` suffix, confirmed in
   `src/main/index.ts`) so Analyze's picker finds it unchanged.

---

## 9. Rough phases (to be firmed up in planning)

- **Phase 0 — Transport & read-only render.** Extend the worker message contract
  to return an `ArrayBuffer` on a new `dataKey` with a real transfer list (see
  6a); add the `get_epochs_arrays` Python helper; ship epoch arrays + metadata
  across the worker boundary; render static traces in React. Proves the data path
  and rendering choice. **Prerequisite input:** the rendering-tech decision (Open
  Question 1, Canvas 2D vs WebGL) must be made *before* the "render static traces"
  step — it determines the component's core. **Also (cheap, do it first):** the
  one-line runtime confirmation of the broken Clean→Analyze round-trip (Open
  Question 8) — now a sanity check, not a research task, since §6d resolves it
  statically.
- **Phase 1 — Core interaction.** Click-to-reject epochs, scroll/scale/zoom, apply
  → `epochs.drop` → save `-cleaned-epo.fif` **via the new MEMFS→host write-back
  bridge (see §6d)**. Reaches functional parity with the *essential* MNE workflow.
  - **Sequencing note:** the write-back bridge is *not* intrinsically a Phase-1
    dependency. It reuses the same worker-message-contract extension as Phase 0
    (§6a) and independently fixes a live bug (§6d), so it can land early and
    standalone — make the existing `Clean Data` button actually persist alongside
    the Phase-0 transport work, de-risking the apply path before the reject flow
    exists. Phase 1 then just points the apply action at a bridge that works.
- **Phase 2 — Full parity.** Bad-channel flagging, condition coloring/legend,
  auto-flag suggestions from `drop_log`/peak-to-peak.
- **Phase 3 — Onboarding layer.** Explanations, guided mode, artifact tutorials,
  live ERP preview.
- **Phase 4 — Polish & generalize.** N-channel devices (Neurosity/LSL),
  accessibility, keyboard flow, performance.

---

## 10. Context references

- **Skills:** `pyodide-mne` (worker↔Python protocol, plot routing, `pyodide://`),
  `redux-observable-epochs` (epic anatomy, numeric marker-code contract),
  `electron-ipc-architecture` + `electron-ipc-channel` (the four files a new IPC
  channel must keep in sync — needed for the §6d write-back bridge).
- **Docs:** `docs/pyodide-in-electron-vite.md`, `docs/user-flow.md`.
- **Learnings** (`.llms/learnings.md`): agg backend / WebAgg-in-worker limits;
  plot-result routing pattern; PyProxy serialization; marker registry / numeric
  event codes; the analysis pipeline testability pattern.
- **Code today:** `src/renderer/utils/webworker/{index.ts,webworker.js,utils.py}`
  (worker + Python), `src/renderer/epics/pyodideEpics.ts` (epics),
  `src/renderer/components/CleanComponent/`, `PyodidePlotWidget.tsx` (existing
  static-plot render path), `src/renderer/utils/eeg/markerRegistry.ts`.
- **Related TODO:** `TODOS.md` → "(Optional) Full Pyodide worker RPC" — an
  `await`-able apply-then-refresh ergonomics win, **not** a prerequisite (§7, OQ2).
