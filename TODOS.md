# TODOS

Deferred and in-flight work. Keep this current — when something ships, delete it or move it under "Done recently". See `ROADMAP.md` for the strategic frame and `.gstack/` CEO plan (2026-07-02 summer-revival-reframe) for the reasoning behind the priorities below.

## Now (Summer 2026 critical path)

- [ ] **Lesson content from Steve Azeka** — owner: Dano. Set a date for the first sample lesson. Fallback: if no lesson by that date, Dano authors one throwaway stub to unblock the lesson surface.
- [ ] **In-app lesson surface v1** — static markdown render only (no editing, no interactivity). Build against a dummy lesson; tune to real content once a sample lands. Confirm markdown is a rich-enough format with Azeka before building.
- [ ] **Land LSL** — merge `device-lsl` to `main` and QA it. Muse-first, Mac + Windows.

## Deferred (post-launch)

- [ ] Neurosity SDK polish — revisit only if a partner classroom owns Crowns (~$1000/unit vs ~$250 Muse).
- [ ] External / generic LSL stream support (any EEG device).
- [ ] Lab.js cleanup — remove jspsych, type lab.js data. Not on the content critical path; users never see it.
- [ ] Lesson surface beyond markdown — block-based programming, embedded notebooks (the CLAUDE.md extensibility horizon).

## Known issues / tech debt

- [ ] Pyodide-fidelity smoke test — analysis pipeline is tested against native MNE, not yet under Pyodide/WASM (see `.llms/learnings.md`).
- [ ] Pre-existing TypeScript errors (not regressions): `experimentEpics.ts` (RxJS operator types), `routes.tsx` (Redux container prop types).

## Done recently

<!-- Move finished items here with a date, then prune periodically. -->

- **Cut Emotiv SDK** (2026-07-06) — SDK was already gone from source; corrected the README device claim ("Emotiv Epoc+" → "Muse and Neurosity").
