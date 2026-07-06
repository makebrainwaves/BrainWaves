# TODOS

Deferred and in-flight work. Keep this current — when something ships, delete it or move it under "Done recently". See `ROADMAP.md` for the strategic frame and `.gstack/` CEO plan (2026-07-02 summer-revival-reframe) for the reasoning behind the priorities below.

## Now (Summer 2026 critical path)

- [ ] **Lesson content from Steve Azeka** — owner: Dano. Set a date for the first sample lesson. Fallback: if no lesson by that date, Dano authors one throwaway stub to unblock the lesson surface.
- [ ] **In-app lesson surface v1** — static markdown render only (no editing, no interactivity). Build against a dummy lesson; tune to real content once a sample lands. Confirm markdown is a rich-enough format with Azeka before building.
- [ ] **Land LSL** — merge `device-lsl` to `main` and QA it. Muse-first, Mac + Windows.

## Deferred (post-launch)

- [ ] **Muse S Athena (Gen 3) support** — the Athena uses a multiplexed BLE protocol that muse-js (classic protocol) doesn't speak. Reference implementation is already done in `../muse-lsl` (Python, commit `74fcb91`, ~1200 lines: tag-based packet decoder, GATT-probe routing, EEG/IMU/optics streams). Porting into muse-js or a parallel TS decoder is substantial; not on the LSL critical path.
- [ ] Neurosity SDK polish — revisit only if a partner classroom owns Crowns (~$1000/unit vs ~$250 Muse).
- [ ] External / generic LSL stream support (any EEG device).
- [ ] Lab.js cleanup — remove jspsych, type lab.js data. Not on the content critical path; users never see it.
- [ ] Lesson surface beyond markdown — block-based programming, embedded notebooks (the CLAUDE.md extensibility horizon).

## Known issues / tech debt

- [ ] **Restore the Pyodide worker RPC (request/response correlation)** — the analysis/Clean pipeline is broken and it's pre-existing (identical on `main`, not LSL). Root cause: a past "simplify the epics" refactor deleted the id/OpenPromise correlation layer but left ~10 call sites (`loadCSV`, `filterIIR`, `epochEvents`, `requestEpochsInfo`, `requestChannelInfo`, plots…) still doing `await worker.postMessage(...)`. Native `worker.postMessage` returns `undefined` immediately (resolves on *post*, not on Python completion), so **every `await` in `webworker/index.ts` is a no-op** — sequencing currently works only by luck/timing, and `requestEpochsInfo` returns `undefined` → `getEpochsInfoEpic` crashes on `.map` (cryptic `Cannot read properties of undefined (reading 'map')` at `pyodideEpics.ts:~206`). Fix: reinstate a small `runPython(worker, code, ctx?)` RPC — module-level `Map<id,{resolve,reject}>` + one `message` listener; worker echoes the `id` back with `{results}`/`{error}`. Then epics `await` real results and map to actions; `pyodideMessageEpic` + the `plotKey` switch go away (plots are just requests whose result is an SVG string). Caveats: (1) structured Python returns must cross as JSON strings (`json.dumps` / `JSON.parse`) since `postMessage` can't clone a PyProxy; (2) awaiting naturally keeps one call in flight — add a worker-side one-at-a-time queue only if concurrent chains ever bite. Needs in-app testing (Pyodide/WASM) — not a drive-by. See `.llms/learnings.md` plot-routing note for the current (to-be-replaced) pattern.
- [ ] Pyodide-fidelity smoke test — analysis pipeline is tested against native MNE, not yet under Pyodide/WASM (see `.llms/learnings.md`).
- [ ] Pre-existing TypeScript errors (not regressions): `experimentEpics.ts` (RxJS operator types), `routes.tsx` (Redux container prop types).

## Done recently

<!-- Move finished items here with a date, then prune periodically. -->

- **Cut Emotiv SDK** (2026-07-06) — SDK was already gone from source; corrected the README device claim ("Emotiv Epoc+" → "Muse and Neurosity").
