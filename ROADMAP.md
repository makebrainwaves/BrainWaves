# Roadmap

Summer 2026: BrainWaves revival for high school. Execution detail lives in `TODOS.md` — this file is the strategic layer. If the two disagree, `TODOS.md` wins.

## V1 / V1.1 — classroom MVP

Ship a signed-off Muse classroom loop: Design → Collect → Clean → Analyze, including **custom experiments** (P0; they worked in the 2017–2020 app and must work again). **Shipped as v1.0.0 on 2026-08-11.**

- [x] Cut Emotiv SDK
- [x] Muse + Neurosity first-party drivers (`EEGDriver` registry)
- [x] LSL outlets for connected first-party devices (epochs + stimulus markers)
- [x] External LSL inlet in ConnectModal (when liblsl is available)
- [x] Restore custom-experiment authoring (see TODOS — P0)
- [x] QA built-in + custom experiments on Muse hardware
- [x] First release dry-run (`v1.0.0-rc.1`) + packaged-app smoke
- [ ] Cross-platform LSL packaging verification (macOS x64, Windows, Linux)

CSV is still the system of record. Using LSL *internally* for recording is not a V1 goal.

## V1.5 — visual polish

Epoch-reviewer onboarding (plain language, guided mode). See TODOS "Next".

## V2 — lesson content

- [ ] Neuro content from Steve Azeka (2017 classroom material)
- [ ] Data-science content from Teon Brooks
- [ ] In-app lesson surface (static markdown first)

## V3 - AI-powered data analysis
- [ ] **Emit tidy trial-level data from the collection layer.** De-specialize from ERP-only averaged waveforms. Blocks everything below. *(Scope first — likely the largest hidden work item.)*
- [ ] **Write/audit the statistical curriculum.** Normal vs. non-normal, categorical vs. ordinal, paired vs. independent, p-values. The analysis UI is unusable without it and does not teach it.
- [ ] **Build the specification → compiler loop.** Four-slot structure declaration with custom iconography → unfiltered test palette (6 tests + non-parametric siblings) → generated Python, visible and editable, run client-side in Pyodide. Predict-before-you-run enforced and logged; effect size always adjacent to p. No free-text input; no output that narrows, ranks, or recommends a test.
- [ ] **Generalize the data curation layer.** Condition-blind unit review, failure-class tagging, threshold inferred from the student's own calls, exclusion log exported as a writeup artifact. Cut seams for a second instrument; don't build a plugin loader yet.
- [ ] **Ship post-submission agentic review.** Overnight, interrogative-only output, process not conclusions, identical artifact to student and teacher, never scored.

## Later

- Muse S Athena (Gen 3)
- Neurosity polish (only if a partner classroom owns Crowns)
- ~~Type lab.js / strip leftover jsPsych strings~~ → jsPsych is now a **supported runtime** for imported timelines (v1 shipped 2026-08-21)
- Lesson surface beyond markdown (block-based / notebooks)

## Deliberate dual systems (not debt)

- Live EEG in a `<webview>` (thread isolation) vs canvas epoch reviewer (high-frequency interactive) vs Pyodide SVG (static MNE/matplotlib).
- BLE `EEGDriver` (Muse / Neurosity) vs LSL inlet (external recorder). Inlet `injectMarker` is a **no-op on purpose** — the external recorder owns markers. First-party runs still `injectMarker` locally and `sendMarker` to the LSL outlet.
