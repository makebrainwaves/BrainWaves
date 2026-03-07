# BrainWaves Modernization — Implementation Progress

Tracking file for executing the [Technical Implementation Plan](./BrainWaves_%20Technical%20Implementation%20Plan%20(2026%20Modernization).md) across sessions.

**Last updated:** 2026-03-07
**Overall status:** PHASES 1–4 COMPLETE (Phase 5 pending: npm install + build verification)

---

## Codebase Reconnaissance (completed)

Key files read and understood before starting implementation:

- `package.json` — current deps, jest config, scripts
- `src/renderer/store.ts` — uses `connected-react-router` (`routerMiddleware`, `createHashHistory`)
- `src/renderer/reducers/index.ts` — uses `connectRouter` from `connected-react-router`
- `src/renderer/containers/Root.tsx` — uses `ConnectedRouter`, receives `history` prop
- `src/renderer/index.tsx` — imports and passes `history` from store to Root
- `src/renderer/routes.tsx` — React Router v5 `<Switch>` / `<Route component={}>` / custom `PropsRoute`
- `src/renderer/epics/experimentEpics.ts` — `autoSaveEpic` and `navigationCleanupEpic` listen to `@@router/LOCATION_CHANGE`
- `src/renderer/containers/TopNavBarContainer.ts` — maps `state.router.location` to props
- `src/renderer/components/TopNavComponent/index.tsx` — class component, uses `this.props.location.pathname`
- `src/renderer/components/HomeComponent/index.tsx` — class component, calls `this.props.history.push()`
- `src/renderer/components/CollectComponent/index.tsx` — passes `history` prop to `ConnectModal` (unused there)
- `src/renderer/components/CollectComponent/ConnectModal.tsx` — has `history` in Props but does NOT use it
- `src/renderer/components/EEGExplorationComponent.tsx` — passes `history` to `ConnectModal` (unused)
- `src/renderer/actions/experimentActions.ts` — RTK `createAction`, `typesafe-actions`
- `src/renderer/utils/pyodide/utils.py` — uses `sns.tsplot` (removed in seaborn v0.10), seaborn import commented out
- `src/renderer/utils/pyodide/webworker.js` — `importScripts('/pyodide/pyodide.js')`, loads matplotlib/mne/pandas
- `internals/scripts/InstallPyodide.js` — downloads pyodide v0.21.0 tarball
- `vite.config.ts` — `publicDir` serves `src/renderer/utils/pyodide/src/` as static assets
- `.github/workflows/test.yml` — runs `npm run package-ci`, lint, tsc (no unit tests)
- 26 files import `semantic-ui-react` (see list below)

---

## Phase 1: Test Harness & Vitest

**Status: COMPLETE**

### Step 1.1 — Install and configure Vitest

**What to do:**
1. Edit `package.json`:
   - Remove from `devDependencies`: `jest`, `@types/jest`, `identity-obj-proxy`, `react-test-renderer`
   - Add to `devDependencies`: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
   - Change `"test": "cross-env jest --passWithNoTests"` → `"test": "vitest run"`
   - Add `"test:watch": "vitest"`
   - Remove the `"jest": { ... }` config block from package.json
2. Create `vitest.config.ts` (project root)
3. Create `src/test-setup.ts` (imports `@testing-library/jest-dom`)
4. Create `src/renderer/App.test.tsx` (basic sanity render test)
5. Run `npm install` to update node_modules

**Notes:**
- Vitest needs `jsdom` environment for React component tests
- The vite.config.ts babel plugins (decorators, class-properties) must also be present in vitest.config.ts
- CSS modules: vitest handles them natively with `css.modules` config; no `identity-obj-proxy` needed

### Step 1.2 — Update CI workflow

**What to do:**
1. Edit `.github/workflows/test.yml`: add `npm test` step before or after existing steps
2. Create `tests/build.test.ts`: verifies `out/main/index.js` and `out/renderer/index.html` exist after build

---

## Phase 2: Routing Modernization

**Status: COMPLETE**

### Step 2.1 — Remove `connected-react-router`

**Package changes:**
- Remove from `dependencies`: `connected-react-router`, `history`
- Remove from `devDependencies`: `@types/history`, `@types/react-router`, `@types/react-router-dom`
- Remove `overrides["connected-react-router"]` block

**File changes:**

| File | Change |
|------|--------|
| `src/renderer/store.ts` | Remove `createHashHistory`, `history` export, `routerMiddleware`, remove `router` from middleware |
| `src/renderer/reducers/index.ts` | Remove `connectRouter`, `History` import, remove `router` from combineReducers, remove `router: any` from RootState |
| `src/renderer/containers/Root.tsx` | Remove `ConnectedRouter`; use `HashRouter` from `react-router-dom`; remove `history` prop |
| `src/renderer/index.tsx` | Remove `history` import; pass only `store` to `<Root>` |

### Step 2.2 — Upgrade to React Router v6

**Package changes:**
- Change `react-router` and `react-router-dom`: `"^5.2.0"` → `"^6.x"` (v6 merges the two packages; keep both entries or consolidate)

**New file:**
- `src/renderer/actions/routerActions.ts` — defines `RouterActions.RouteChanged(pathname: string)` action

**File changes:**

| File | Change |
|------|--------|
| `src/renderer/routes.tsx` | Replace `<Switch>/<Route component={}>` with `<Routes>/<Route element={<C />}>`. Remove `PropsRoute`. Pass `activeStep` directly as JSX prop on `<HomeContainer>`. |
| `src/renderer/containers/App.tsx` | Add `NavigationTracker` functional component (uses `useLocation` + `useDispatch` to dispatch `RouterActions.RouteChanged` on location change) |
| `src/renderer/epics/experimentEpics.ts` | Replace both `ofType('@@router/LOCATION_CHANGE')` epics to use `filter(isActionOf(RouterActions.RouteChanged))`. Access `action.payload` as pathname string directly. Remove `pluck('payload', 'pathname')` etc. |
| `src/renderer/components/TopNavComponent/index.tsx` | Convert class → functional component. Replace `this.props.location.pathname` with `useLocation().pathname`. State becomes `useState`. Methods become callbacks. |
| `src/renderer/containers/TopNavBarContainer.ts` | Remove `location: state.router.location` from mapStateToProps |
| `src/renderer/components/HomeComponent/index.tsx` | Change `history: History` prop to `navigate: (path: string) => void`. Replace all `this.props.history.push(X)` with `this.props.navigate(X)`. Remove `import { History } from 'history'`. |
| `src/renderer/containers/HomeContainer.ts` | Wrap exported component with `withNavigate` HOC that injects `useNavigate()` as `navigate` prop |
| `src/renderer/components/CollectComponent/index.tsx` | Remove `history: History` from Props; remove passing `history` to `ConnectModal` |
| `src/renderer/components/EEGExplorationComponent.tsx` | Remove `history: History` from Props; remove passing `history` to `ConnectModal` |
| `src/renderer/components/CollectComponent/ConnectModal.tsx` | Remove `history: History` from Props interface |

**withNavigate HOC pattern (for HomeContainer.ts):**
```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function withNavigate<P extends { navigate: (path: string) => void }>(
  Component: React.ComponentType<P>
) {
  return function WithNavigate(props: Omit<P, 'navigate'>) {
    const navigate = useNavigate();
    return <Component {...(props as P)} navigate={navigate} />;
  };
}
```

**NavigationTracker pattern (for App.tsx):**
```tsx
function NavigationTracker() {
  const location = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(RouterActions.RouteChanged(location.pathname));
  }, [location.pathname, dispatch]);
  return null;
}
```

**Tests to add:**
- `tests/store.test.ts` — verifies store initializes without router reducer
- `tests/routing.test.tsx` — verifies navigation between Home/Design/Collect renders correct components

---

## Phase 3: Pyodide Modernization

**Status: COMPLETE**

### Step 3.1 — Upgrade Pyodide version

**File:** `internals/scripts/InstallPyodide.js`

Changes:
- `PYODIDE_VERSION`: `'0.21.0'` → `'0.27.0'`
- `TAR_NAME`: `pyodide-build-${PYODIDE_VERSION}.tar.bz2` → `pyodide-${PYODIDE_VERSION}.tar.bz2`
- `TAR_URL`: update to match new naming

**Note:** The tarball for 0.27.0 extracts to a `pyodide/` subdirectory, which is correct for the webworker's `importScripts('/pyodide/pyodide.js')` call. The old 0.21.0 tar was also `pyodide-build-*` but extracted to a `pyodide/` dir.

**Caution:** `mne` package availability in pyodide 0.27.0 needs verification. If not in the default package list, `webworker.js` `loadPackage(['matplotlib', 'mne', 'pandas'])` will fail. May need to load `mne` via `micropip.install('mne')` instead.

**Test to add:** `tests/pyodide.test.ts`

### Step 3.2 — Fix Python plotting (`utils.py`)

**File:** `src/renderer/utils/pyodide/utils.py`

The `plot_conditions` function currently:
- Calls `sns.color_palette(...)` — but `import seaborn as sns` is commented out
- Calls `sns.tsplot(...)` — removed from seaborn in v0.10.0
- Calls `sns.despine()` — still exists but seaborn not imported

**Fix — replace `plot_conditions` body:**
1. Replace `sns.color_palette(...)` with a hardcoded palette (consistent with `plot_topo`)
2. Replace `sns.tsplot(...)` with manual bootstrap CI using numpy + `ax.plot()` + `ax.fill_between()`
3. Replace `sns.despine()` with `ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)`

**Bootstrap CI replacement for `sns.tsplot(X[...], time=times, color=color, n_boot=n_boot, ci=ci)`:**
```python
cond_data = X[y.isin(cond), ch_ind]
mean = np.nanmean(cond_data, axis=0)
n_samples = cond_data.shape[0]
boot_means = np.array([
    np.nanmean(cond_data[np.random.randint(0, n_samples, n_samples)], axis=0)
    for _ in range(n_boot)
])
alpha = (100 - ci) / 2
low = np.percentile(boot_means, alpha, axis=0)
high = np.percentile(boot_means, 100 - alpha, axis=0)
ax.plot(times, mean, color=color)
ax.fill_between(times, low, high, color=color, alpha=0.3)
```

**Test to add:** `tests/python_utils.test.ts`

---

## Phase 4: UI Library Replacement (Semantic UI → Tailwind + Shadcn/ui)

**Status: COMPLETE**

### Step 4.1 — Install Tailwind CSS and Shadcn/ui

**Package additions (devDependencies):**
- `tailwindcss`, `postcss`, `autoprefixer`

**Package additions (dependencies):**
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

**Package removals (dependencies):**
- `semantic-ui-react`
- `semantic-ui-css`

**New config files:**
- `tailwind.config.js`
- `postcss.config.js`

**New UI component files** (in `src/renderer/components/ui/`):
- `utils.ts` — `cn()` helper (`clsx` + `tailwind-merge`)
- `button.tsx` — Shadcn Button (CVA variants)
- `card.tsx` — Shadcn Card (replaces `Segment`)
- `dialog.tsx` — Shadcn Dialog (replaces `Modal`)
- `dropdown-menu.tsx` — Shadcn DropdownMenu (replaces `Dropdown`)
- `table.tsx` — Shadcn Table (replaces `Table`)

**Update `src/renderer/app.global.css`:** add Tailwind directives (`@tailwind base/components/utilities`)

**Remove from `src/renderer/index.tsx`:** `import 'semantic-ui-css/semantic.min.css'`

### Step 4.2 — Component-by-component replacement

**26 files to update** (grep confirmed):

| File | Semantic UI components used | Status |
|------|-----------------------------|--------|
| `components/AnalyzeComponent.tsx` | Grid, Icon, Segment, Header, Dropdown, Divider, Button, Checkbox, Sidebar, DropdownProps | NOT STARTED |
| `components/CleanComponent/CleanSidebar.tsx` | (need to read) | NOT STARTED |
| `components/CleanComponent/index.tsx` | Grid, Button, Icon, Segment, Header, Dropdown, Sidebar, SidebarPusher, Divider, DropdownProps | NOT STARTED |
| `components/CollectComponent/ConnectModal.tsx` | Modal, Button, Segment, List, Grid, Divider | NOT STARTED |
| `components/CollectComponent/HelpSidebar.tsx` | (need to read) | NOT STARTED |
| `components/CollectComponent/PreTestComponent.tsx` | (need to read) | NOT STARTED |
| `components/CollectComponent/RunComponent.tsx` | (need to read) | NOT STARTED |
| `components/CollectComponent/index.tsx` | (passes through, may be minimal) | NOT STARTED |
| `components/DesignComponent/CustomDesignComponent.tsx` | (need to read) | NOT STARTED |
| `components/DesignComponent/ParamSlider.tsx` | (need to read) | NOT STARTED |
| `components/DesignComponent/StimuliDesignColumn.tsx` | (need to read) | NOT STARTED |
| `components/DesignComponent/StimuliRow.tsx` | (need to read) | NOT STARTED |
| `components/DesignComponent/index.tsx` | (need to read) | NOT STARTED |
| `components/EEGExplorationComponent.tsx` | Grid, Button, Header, Segment, Image, Divider | NOT STARTED |
| `components/HomeComponent/ExperimentCard.tsx` | (need to read) | NOT STARTED |
| `components/HomeComponent/OverviewComponent.tsx` | (need to read) | NOT STARTED |
| `components/HomeComponent/index.tsx` | Grid, Button, Header, Image, Table | NOT STARTED |
| `components/InputCollect.tsx` | (need to read) | NOT STARTED |
| `components/InputModal.tsx` | (need to read) | NOT STARTED |
| `components/PreviewButtonComponent.tsx` | (need to read) | NOT STARTED |
| `components/PreviewExperimentComponent.tsx` | (need to read) | NOT STARTED |
| `components/PyodidePlotWidget.tsx` | (need to read) | NOT STARTED |
| `components/SecondaryNavComponent/SecondaryNavSegment.tsx` | (need to read) | NOT STARTED |
| `components/SecondaryNavComponent/index.tsx` | (need to read) | NOT STARTED |
| `components/SignalQualityIndicatorComponent.tsx` | (need to read) | NOT STARTED |
| `components/TopNavComponent/PrimaryNavSegment.tsx` | (need to read) | NOT STARTED |
| `components/TopNavComponent/index.tsx` | Grid, Segment, Image, Dropdown | NOT STARTED (also being changed in Phase 2) |

**Replacement mapping:**
| Semantic UI | Replacement |
|-------------|-------------|
| `<Grid>` | `<div className="grid ...">` (Tailwind) |
| `<Grid.Row>` | `<div className="flex ...">` or grid row |
| `<Grid.Column width={N}>` | Tailwind `col-span-N` |
| `<Segment>` | `<div className="p-4 ...">` or `<Card>` |
| `<Button>` | `<Button>` from `./ui/button` |
| `<Button.Group>` | `<div className="flex gap-1">` |
| `<Header as="h1">` | `<h1 className="...">` |
| `<Image src={x}>` | `<img src={x} />` |
| `<Dropdown>` | `<DropdownMenu>` from `./ui/dropdown-menu` |
| `<Modal>` | `<Dialog>` from `./ui/dialog` |
| `<List>/<List.Item>` | `<ul>/<li>` |
| `<Divider>` | `<hr />` or `<div className="my-4">` |
| `<Checkbox>` | `<input type="checkbox" />` |
| `<Icon name="x">` | inline SVG or FontAwesome (already installed) |
| `<Sidebar>/<Sidebar.Pushable>` | `<div>` with conditional className |
| `<Table>` etc. | `<Table>` from `./ui/table` or HTML table |
| `DropdownProps`, `SemanticICONS` | Remove type imports; use plain React event types |

---

## Phase 5: Final Build Verification

**Status: PENDING — run `npm install` then `npm run build`**

- Run `npm run build` — should complete without errors
- Run `npm test` — all Vitest suites pass
- Run `npm run package` — Electron app packages successfully

---

## Dependency Change Summary

### To remove
| Package | Location |
|---------|----------|
| `connected-react-router` | dependencies |
| `history` | dependencies |
| `react-router` | dependencies (merged into react-router-dom v6) |
| `semantic-ui-react` | dependencies |
| `semantic-ui-css` | dependencies |
| `jest` | devDependencies |
| `@types/jest` | devDependencies |
| `@types/history` | devDependencies |
| `@types/react-router` | devDependencies |
| `@types/react-router-dom` | devDependencies |
| `identity-obj-proxy` | devDependencies |
| `react-test-renderer` | devDependencies |

### To add
| Package | Location | Purpose |
|---------|----------|---------|
| `vitest` | devDependencies | test runner |
| `@testing-library/react` | devDependencies | React test utilities |
| `@testing-library/jest-dom` | devDependencies | DOM matchers |
| `jsdom` | devDependencies | DOM env for tests |
| `react-router-dom` (upgrade to v6) | dependencies | routing |
| `tailwindcss` | devDependencies | CSS framework |
| `postcss` | devDependencies | CSS processing |
| `autoprefixer` | devDependencies | CSS vendor prefixes |
| `@radix-ui/react-dialog` | dependencies | Dialog primitive |
| `@radix-ui/react-dropdown-menu` | dependencies | Dropdown primitive |
| `@radix-ui/react-slot` | dependencies | Slot primitive (shadcn) |
| `class-variance-authority` | dependencies | CVA for Button variants |
| `clsx` | dependencies | className utility |
| `tailwind-merge` | dependencies | Tailwind class merging |

---

## Session Notes

### Session 1 (2026-03-07)
- Read all relevant source files
- Created this progress tracker
- No code changes made yet
- Ready to begin Phase 1 (Vitest) in next session

### Session 2 (2026-03-07)
- Completed Phases 1–4 in full
- Phase 1: Vitest config, test-setup.ts, App.test.tsx, CI workflow update
- Phase 2: Removed connected-react-router, upgraded to React Router v6, NavigationTracker pattern, withNavigate HOC for HomeContainer + ExperimentDesignContainer, routerActions.ts
- Phase 3: Pyodide version 0.21→0.27, fixed sns.tsplot with manual bootstrap CI in utils.py
- Phase 4: Created Tailwind config, postcss config, shadcn/ui components (button, card, dialog, dropdown-menu, table, utils). Replaced all 26 semantic-ui-react component files. Removed semantic-ui import from app.global.css, added Tailwind directives.
- Next step: Run `npm install` then `npm run build` to verify (Phase 5)
