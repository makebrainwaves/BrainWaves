# TODOS

Deferred and in-flight work. Keep this current — when something ships, delete it or move it under "Done recently". See `ROADMAP.md` for the strategic frame and `.gstack/` CEO plan (2026-07-02 summer-revival-reframe) for the reasoning behind the priorities below.

## Now (Summer 2026 critical path)

- [ ] **Lesson content from Steve Azeka** — owner: Dano. Set a date for the first sample lesson. Fallback: if no lesson by that date, Dano authors one throwaway stub to unblock the lesson surface.
- [ ] **In-app lesson surface v1** — static markdown render only (no editing, no interactivity). Build against a dummy lesson; tune to real content once a sample lands. Confirm markdown is a rich-enough format with Azeka before building.
- [ ] **Cross-platform LSL packaging verification** — `macOS arm64` is done + self-contained (see Done recently). Still needs each build machine: **macOS x64** (`patchDeps` only symlinks on arm64, so an Intel build uses node-labstreaminglayer's original x86_64 dylib — `otool -L` the packaged liblsl to confirm self-contained; the `afterPack` hook bundles whatever external deps it finds, arch-agnostic), **Windows x64** (bundled `lsl_amd64.dll` is a self-contained PE — confirm koffi loads it from the packaged app), **Linux/Ubuntu** (bundled `.so` is x86_64 ELF — `ldd` it + Web-Bluetooth smoke test, `--enable-experimental-web-platform-features` already set).

## Deferred (post-launch)

- [ ] **Muse S Athena (Gen 3) support** — the Athena uses a multiplexed BLE protocol that muse-js (classic protocol) doesn't speak. Reference implementation is already done in `../muse-lsl` (Python, commit `74fcb91`, ~1200 lines: tag-based packet decoder, GATT-probe routing, EEG/IMU/optics streams). Porting into muse-js or a parallel TS decoder is substantial; not on the LSL critical path.
- [ ] Neurosity SDK polish — revisit only if a partner classroom owns Crowns (~$1000/unit vs ~$250 Muse).
- [ ] External / generic LSL stream support (any EEG device).
- [ ] Lab.js cleanup — remove jspsych, type lab.js data. Not on the content critical path; users never see it.
- [ ] Lesson surface beyond markdown — block-based programming, embedded notebooks (the CLAUDE.md extensibility horizon).
- [ ] **Epoch reviewer Phase 3 — onboarding layer.** Plan: `docs/epoch-review-ui-plan.md` §9. Plain-language explanations of epochs + each artifact type, a **guided mode** (step through auto-flagged epochs with "why we flagged this," student confirms/overrides), channel legend tied to head position (Muse 10-20), student-facing tone. Builds on the Phase 0-2 reviewer (PRs #223/#224/#225). **Open question OQ3 (onboarding depth) is still unresolved** — how much curriculum (tooltips only vs. a real walkthrough), guided-mode-as-default? This is product-shaped, not architecture — take it through `/office-hours` or `/plan-ceo-review` before forging. Note it overlaps the "in-app lesson surface" critical-path work above; sequence deliberately.
- [ ] **Epoch reviewer Phase 4 — polish & generalize.** Plan: `docs/epoch-review-ui-plan.md` §9. N-channel devices (Neurosity 8-ch, external LSL 32-64-ch) — the renderer already windows/downsamples but needs real testing at scale and possibly the WebGL swap behind `drawEpochs` (OQ1 left that a later swap). Accessibility, keyboard-first flow, performance. Also OQ7 (keep a read-only static-SVG fallback for environments where the interactive UI can't run?) is still open.

## Known issues / tech debt

- [ ] **(Optional) Full Pyodide worker RPC** — the analysis/Clean pipeline crash is now **fixed** (harvested from PR #194): a `dataKey` routing pattern parallel to `plotKey` — the worker echoes `dataKey` + PyProxy-converted results, and `pyodideMessageEpic` routes `epochsInfo`→`SetEpochInfo` / `channelInfo`→`SetChannelInfo`; the info epics are fire-and-forget. This unblocks the pipeline without the bigger refactor. The deeper latent issue remains, though: `worker.postMessage` returns `undefined` on *post*, so the `await`s in `webworker/index.ts` are no-ops and cross-message sequencing still relies on worker FIFO. A true `runPython(worker, code, ctx?)` RPC — `Map<id,{resolve,reject}>` + one `message` listener, worker echoes `id` — would let epics `await` real results and delete the `plotKey`/`dataKey` switch entirely. Only worth doing if the FIFO sequencing ever actually bites; not urgent now.
- [ ] Pyodide-fidelity smoke test — analysis pipeline is tested against native MNE, not yet under Pyodide/WASM (see `.llms/learnings.md`). **In progress:** the epoch-review Phase 0 (see `docs/epoch-review-ui-plan.md` §0) adds a *narrow* Pyodide test for the `get_epochs_arrays` float32 buffer path (byteLength, decode-vs-native, transfer detaches source); the full-pipeline Pyodide job remains deferred.
- [ ] Pre-existing TypeScript errors (not regressions): `experimentEpics.ts` (RxJS operator types), `routes.tsx` (Redux container prop types).
- [ ] **Epoch reviewer Phase 2 polish (from PR #225 review).** Three non-blocking behaviors flagged during the Phase 2 forge: (1) `get_epochs_arrays`/`suggest_rejections` use `pick_types(eeg=True)` whose MNE default is `exclude='bads'`, so after a Clean that flags a bad channel the re-fetched reviewer omits that channel from the display (saved `.fif` is unaffected) — decide whether to keep bad channels visible-but-greyed (`exclude=[]`) instead of vanishing; (2) re-running "Auto-flag" with the same threshold re-adds suggestions the user had manually unclicked (additive union merge in `CleanComponent.componentDidUpdate`); (3) the auto-flag threshold `<input>` has no min guard (0 µV flags everything). All in `src/renderer/components/CleanComponent/` + `webworker/utils.py`.

## Done recently

<!-- Move finished items here with a date, then prune periodically. -->

- **Land LSL** (2026-07-06) — `device-lsl` merged (PR #204), Muse-first. macOS arm64 packaging made self-contained (PR #221): the Homebrew liblsl links `/opt/homebrew/.../libpugixml.1.dylib` (breaks on clean Macs); the `afterPack` hook bundles external deps and rewrites load paths to `@loader_path`. Remaining per-platform packaging checks broken out under "Now".
- **Cut Emotiv SDK** (2026-07-06) — SDK was already gone from source; corrected the README device claim ("Emotiv Epoc+" → "Muse and Neurosity").
