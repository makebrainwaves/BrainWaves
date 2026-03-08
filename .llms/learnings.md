# BrainWaves — Codebase Learnings

Accumulated insights from agents and developers working on this codebase.
Add entries here when you discover something non-obvious — gotchas, hidden dependencies, tricky patterns, debugging tips.

Format: brief heading + explanation + (optional) relevant file paths.

---

<!-- Add entries below this line -->

## React Router v6 + redux connect + class components: TypeScript inference gap

`withRouter<P>(Component: ComponentType<P & WithRouterProps>): ComponentType<P>`
works at runtime but TypeScript cannot infer `P` when the argument is a
`ConnectedComponent` (react-redux). Pragmatic solution: cast in `routes.tsx` with
a comment; or fully convert the class component to a functional component using
`useNavigate()` directly. See `src/renderer/utils/withRouter.tsx` and `routes.tsx`.

## connected-react-router → RouteChanged action pattern

Instead of listening to `@@router/LOCATION_CHANGE` in epics, dispatch
`ExperimentActions.RouteChanged(pathname)` from a `RouteChangeTracker`
component (uses `useLocation`). Epics then filter on this action. See
`src/renderer/epics/experimentEpics.ts` and
`src/renderer/components/RouteChangeTracker.tsx`.

## Tailwind v4 setup

Tailwind v4 uses `@tailwindcss/vite` plugin (no `tailwind.config.js`, no PostCSS
config). Add the plugin to the `renderer` section of `vite.config.ts` and
`@import 'tailwindcss'` at the top of the main CSS file.

## Shadcn/ui components live in src/renderer/components/ui/

Button, Card, Dialog — plus the `cn()` utility at `src/renderer/utils/cn.ts`.
Use these instead of Semantic UI equivalents.

## Pyodide v0.27.0 URL format change

v0.21.0 archive: `pyodide-build-{version}.tar.bz2`
v0.27.0+ archive: `pyodide-{version}.tar.bz2` (no "build-" prefix).
`InstallPyodide.js` must be updated accordingly when changing versions.

## sns.tsplot removed in Seaborn 0.10

`plot_conditions()` in `utils.py` used `sns.tsplot` which was removed in
Seaborn 0.10. Replaced with `plt.plot` + `fill_between` for mean ± SEM.
Seaborn is not imported at all now — matplotlib only for this function.
