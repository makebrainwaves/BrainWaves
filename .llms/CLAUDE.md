# BrainWaves — Claude Code Rules

## Project Overview
BrainWaves is an Electron + React desktop application for running EEG experiments. It uses electron-vite for bundling, Redux + redux-observable for state management, and Pyodide (WASM) for in-app Python data analysis. Its primary usecase is making EEG data collection and analysis easy for students

## Background
This app is fairly complex in that it involves communicating with external EEG devices over bluetooth, with high precision and speed goals, and doing scientific computing within a frontier python-in-the-browser environment.
Reliability and visibility of these different sources of complexity is thus most important for developers.
The UI of the app should have a lighthearted and fun feel, since its target audience is students.
Redux Observables are hard to learn, but powerful. They help encapsulate complex temporally sensitive logic into functions. They should be maintained as an approach going forward, at least until a refactor is made.
A priority for this codebase is extensibility modularity and hackability. There are many features on the horizon such as swapping out hard-coded analysis for block-based programming, or even an embedd notebook environment. As such, effort should be taken not to hard-code things or cut corners by leaking abstractions.

## Stack
- **Runtime**: Electron (main) + React 18 (renderer)
- **Bundler**: electron-vite / Vite
- **State**: Redux Toolkit + redux-observable (RxJS epics)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui (components in `src/renderer/components/ui/`)
- **Testing**: Vitest
- **Linting**: ESLint + Prettier (single quotes, ES5 trailing commas)

## Key Directories
- `src/main/` — Electron main process
- `src/renderer/` — React renderer process
- `src/preload/` — Electron preload scripts
- `src/renderer/experiments/` — Lab.js experiment files
- `src/renderer/utils/webworker/` — Pyodide WASM Python runtime

## Dev Workflow
```bash
npm run dev          # Start dev server (patches deps first)
npm run build        # Build all processes
npm test             # Run Vitest tests
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run lint-fix     # ESLint + Prettier auto-fix
npm run package      # Build + package for current platform
```

## Conventions
- Use TypeScript; avoid `any` unless strictly necessary
- Redux state changes go through RTK slices or typed actions via `typesafe-actions`
- Side effects belong in RxJS epics (`redux-observable`)
- Do not commit secrets or device credentials
- Keep Electron main/renderer separation strict — use preload IPC bridges

## Out of Scope
- Do not modify `src/renderer/utils/webworker/src/` directly; it is managed by `internals/scripts/InstallPyodide.mjs` (Pyodide runtime) and `internals/scripts/InstallMNE.mjs` (scientific packages)
- Do not alter `electron-builder` publish config without confirming release intent

## LLM Context
Shared context for agents and developers lives in `.llms/`:
- `.llms/CLAUDE.md` — this file; stable conventions and architecture
- `.llms/learnings.md` — accumulated codebase insights from agents and developers

When you discover something non-obvious about the codebase (a gotcha, a hidden dependency, a tricky pattern), add it to `.llms/learnings.md` so future agents and developers benefit.
