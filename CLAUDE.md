@.llms/CLAUDE.md
@.llms/learnings.md

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

### BrainWaves domain skills (read these first)

These live in `.claude/skills/` and are the source of truth for the hard seams.

- Anything that crosses main / preload / renderer (IPC, `electronAPI`, native modules, Bluetooth, FS, dialogs) → `electron-ipc-architecture`, then `electron-ipc-channel` when adding/editing a channel
- Pyodide, MNE, `webworker/`, `InstallMNE.mjs`, plot/data routing, prod-only analysis failures → `pyodide-mne`
- Epics, live EEG, markers, empty ERPs, `buildMarkerRegistry` → `redux-observable-epochs`

### This is an Electron app, not a website

`npm run dev` starts electron-vite, which also serves the renderer at `http://localhost:5173`. That URL is **not** the app.

- `window.electronAPI` and the `pyodide://` protocol exist only inside the Electron window (preload + main).
- Opening `:5173` in Chrome / `/qa` crashes `LSLStatusListener` and fails Pyodide init (`Failed to fetch … pyodide://host/pyodide/pyodide.asm.js`).
- **Never** `/qa`, `/qa-only`, or `/browse` against `localhost:5173`.
- Playtest the Electron window. A dedicated `electron-playtest` skill (CDP attach via `--remote-debugging-port`) is the planned harness — see `TODOS.md`. Until that exists: `npm run dev` and drive the desktop app, not the Vite URL.
