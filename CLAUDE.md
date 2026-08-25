@.llms/CLAUDE.md
@.llms/learnings.md

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

### BrainWaves domain skills (read these first)

These live in `.claude/skills/` and are the source of truth for the hard seams.

- Driving the Electron window via CDP (playtesting, clicking through screens, checking console errors, screenshots) → `electron-playtest`
- Anything that crosses main / preload / renderer (IPC, `electronAPI`, native modules, Bluetooth, FS, dialogs) → `electron-ipc-architecture`, then `electron-ipc-channel` when adding/editing a channel
- Pyodide, MNE, `webworker/`, `InstallMNE.mjs`, plot/data routing, prod-only analysis failures → `pyodide-mne`
- Epics, live EEG, markers, empty ERPs, `buildMarkerRegistry` → `redux-observable-epochs`

### This is an Electron app, not a website

`npm run dev` starts electron-vite, which also serves the renderer at `http://localhost:5173`. That URL is **not** the app.

- `window.electronAPI` and the `pyodide://` protocol exist only inside the Electron window (preload + main).
- Opening `:5173` in Chrome / `/qa` crashes `LSLStatusListener` and fails Pyodide init (`Failed to fetch … pyodide://host/pyodide/pyodide.asm.js`).
- **Never** `/qa`, `/qa-only`, or `/browse` against `localhost:5173`.
- Playtest the Electron window via CDP — see the `electron-playtest` skill (`.claude/skills/electron-playtest/SKILL.md`).
