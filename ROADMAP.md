# Roadmap

Summer 2026: BrainWaves revival for high school. Execution detail lives in `TODOS.md` — this file is the strategic layer. If the two disagree, `TODOS.md` wins.

## V1 / V1.1 — classroom MVP

Ship a signed-off Muse classroom loop: Design → Collect → Clean → Analyze, including **custom experiments** (P0; they worked in the 2017–2020 app and must work again).

- [x] Cut Emotiv SDK
- [x] Muse + Neurosity first-party drivers (`EEGDriver` registry)
- [x] LSL outlets for connected first-party devices (epochs + stimulus markers)
- [x] External LSL inlet in ConnectModal (when liblsl is available)
- [ ] Restore custom-experiment authoring (see TODOS — P0)
- [ ] QA built-in + custom experiments on Muse hardware
- [ ] First release dry-run (`v1.0.0-rc.1`) + packaged-app smoke
- [ ] Cross-platform LSL packaging verification (macOS x64, Windows, Linux)

CSV is still the system of record. Using LSL *internally* for recording is not a V1 goal.

## V1.5 — visual polish

Epoch-reviewer onboarding (plain language, guided mode). See TODOS "Next".

## V2 — lesson content

- [ ] Neuro content from Steve Azeka (2017 classroom material)
- [ ] Data-science content from Teon Brooks
- [ ] In-app lesson surface (static markdown first)

## Later

- Muse S Athena (Gen 3)
- Neurosity polish (only if a partner classroom owns Crowns)
- Type lab.js / strip leftover jsPsych strings (users never see this)
- Lesson surface beyond markdown (block-based / notebooks)

## Deliberate dual systems (not debt)

- Live EEG in a `<webview>` (thread isolation) vs canvas epoch reviewer (high-frequency interactive) vs Pyodide SVG (static MNE/matplotlib).
- BLE `EEGDriver` (Muse / Neurosity) vs LSL inlet (external recorder). Inlet `injectMarker` is a **no-op on purpose** — the external recorder owns markers. First-party runs still `injectMarker` locally and `sendMarker` to the LSL outlet.
