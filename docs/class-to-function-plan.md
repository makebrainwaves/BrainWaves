# Plan: class components → function components

## What's actually broken

The stated pain is *"wasting too much time reading through every piece of this app."*
That is not caused by `class` — it's caused by file size and prop indirection:

| Symptom | Cause | Fixed by |
|---|---|---|
| 644-line `CustomDesignComponent.tsx` | `renderSectionContent()` is a 400-line method | splitting render methods into sibling files |
| "where does `deviceType` come from?" | `connect()` container → 15 spread props | `useSelector` at point of use |
| "will this break?" | 20 components, ~4200 lines, ~3 renderer component tests | one characterization test per conversion |

Class→function is the **vehicle** for those three, not the goal. Converting a class to a
function and leaving a 644-line file behind buys nothing.

## What already exists (don't rebuild it)

Testing "fixtures" are already installed and working — **nothing to add here**:

- `vitest` + `jsdom` + `globals: true` (`vitest.config.ts`)
- `@testing-library/react` v16, `@testing-library/dom`, `@testing-library/jest-dom`
- `src/test-setup.ts` wired as `setupFiles`
- `eslint-plugin-react-hooks` `recommended-latest` already on (`eslint.config.mjs:47`) —
  the exhaustive-deps safety net for hooks is live from day one
- Good precedent test to copy: `src/renderer/components/CleanComponent/__tests__/EpochReviewer.test.tsx`

The only new test helper worth writing is **one** file (see step 0).

## Inventory

20 classes, 4255 lines. Grouped by difficulty:

**Tier A — trivial (`setState` + render only, no lifecycle).** Mechanical, ~15 min each.
`PreviewButtonComponent` (24), `PreviewExperimentComponent` (49), `InputModal` (84),
`PyodidePlotWidget` (87), `SecondaryNavComponent` (116), `CollectComponent/index` (138),
`HelpSidebar` (191), `CleanSidebar` (172), `PreTestComponent` (175), `InputCollect` (155)

**Tier B — has `componentDidMount`/`componentDidUpdate`, still simple state.**
`ConnectModal` (306), `StimuliDesignColumn` (203), `EEGExplorationComponent` (144),
`DesignComponent/index` (319)

**Tier C — RxJS subscription lifecycle.** The only genuinely interesting ones.
`SignalQualityIndicatorComponent` (70), `ViewerComponent` (148)

**Tier D — big, must be split, not just converted.**
`HomeComponent/index` (379), `CleanComponent/index` (471), `AnalyzeComponent` (560),
`CustomDesignComponent` (644)

## Step 0 — the one new fixture (~30 lines, do this first)

`src/renderer/test-utils.tsx`:

```tsx
// renderWithStore: mounts a component against a real store built from the app's
// reducers, so tests exercise selectors/actions instead of hand-mocked props.
export function renderWithStore(ui, { preloadedState } = {}) {
  const store = configureStore({ reducer: rootReducer, preloadedState });
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
```

Plus a `MemoryRouter` wrapper for the four components that touch `navigate`.
That's it. **Skipped: MSW, storybook, snapshot testing, a component-props factory
library.** Add MSW when there's an HTTP call to mock (there isn't — it's all IPC).

## Step 1 — the per-component loop

For each component, in Tier order (A → B → C → D):

1. **Characterization test first, against the class.** 2–4 assertions: renders without
   crashing given realistic props, and the one interaction that matters (click → callback
   fired with expected args). Do NOT assert on markup details; assert on behavior.
2. **Convert.** `this.state.x` → `useState`; `componentDidMount` → `useEffect(…, [])`;
   `componentDidUpdate(prev)` → `useEffect(…, [dep])`; handler methods → plain functions
   in the body (no `useCallback` unless a profiler says so).
3. **Test stays green, unmodified.** If the test needed edits, behavior changed — that's
   the whole point of writing it first.
4. `npm run typecheck && npm run lint` — `react-hooks/exhaustive-deps` catches the
   classic `componentDidUpdate` → `useEffect` dependency mistakes.

One PR per tier, not per component. Tier D gets one PR per component.

## Step 2 — Tier C: the subscription pattern

`SignalQualityIndicatorComponent` and `ViewerComponent` both do: subscribe in
`componentDidMount`, re-subscribe in `componentDidUpdate` when the observable prop
changes, unsubscribe in `componentWillUnmount`. That is exactly one `useEffect`:

```tsx
useEffect(() => {
  if (!observable) return;
  const sub = observable.subscribe(setSignalQuality);
  return () => sub.unsubscribe();
}, [observable]);
```

The class version has a latent bug worth checking while you're in there: it unsubscribes
in *both* `componentWillUnmount` and the re-subscribe path with no guard against a null
observable arriving mid-flight. The effect form makes that unrepresentable.

Extract it as `useObservable(observable)` **only after both call sites exist and are
identical** — not before.

## Step 3 — Tier D: split, don't just convert

The four big ones. Convert *and* split in the same PR, because converting alone leaves
the file just as unreadable:

- `AnalyzeComponent` (560): `renderEpochLabels`, `renderHelpContent`, `renderHelp`,
  `renderSectionContent` → 4 sibling components in `components/AnalyzeComponent/`.
- `CustomDesignComponent` (644): `renderSectionContent` is ~395 lines and is really
  three screens (question/hypothesis/methods vs. conditions vs. preview). Split by screen.
- `CleanComponent/index` (471): `renderStats`, `renderAnalyzeButton`, `renderSelect`,
  `renderReview` → siblings. `renderReview` (125 lines) probably wants its own test.
- `HomeComponent/index` (379): already has `ExperimentCard`/`OverviewComponent` siblings;
  continue that pattern for the workspace list.

Target: **no component file over ~250 lines** when done. That's the metric that actually
answers the original complaint.

## Step 4 — delete the container layer

`src/renderer/containers/*Container.ts` exist only to wire `connect()` + inject
`navigate`. Once the component is a function, that indirection is pure cost — it's why
reading `HomeComponent` means opening `HomeContainer` to find out what `deviceType` is.

Per component: replace the `connect()` HOC with `useSelector`/`useDispatch` inside the
component, drop `navigate` prop for `useNavigate()`, delete the container, point the route
at the component directly. Deletes 5 files (`Home`, `Analyze`, `Clean`, `Collect`,
`ExperimentDesign`, `TopNavBar` containers) and shrinks every `Props` interface.

Do this **after** the conversion, per component, not as a big bang — a converted component
still taking props works fine; that's the safe intermediate state.

## Step 5 — cleanup (5 minutes, satisfying)

`vitest.config.ts` loads `@babel/plugin-proposal-decorators` and
`@babel/plugin-proposal-class-properties`. There are **zero decorators** in the codebase
and class properties are native in every supported target. Once the classes are gone,
delete both plugins from the config and both devDependencies. Faster test startup, two
fewer deps.

## What I'm deliberately not doing

- **No Storybook.** It's a 4-screen Electron app whose components need IPC and a Pyodide
  worker. The setup cost exceeds the value. Add it if a design system emerges.
- **No snapshot tests.** They'd all churn during the split in step 3 and teach nothing.
- **No `React.memo`/`useCallback` pass.** No measured render problem exists. Adding memo
  during a refactor hides the regression it's supposed to prevent.
- **No RTL coverage target.** One behavior test per converted component; that's the
  regression net, not a coverage goal.
- **Not converting `ExperimentWindow`, `RunComponent`, `EpochReviewer`, etc.** — already
  function components.

## Sequencing / effort

| Step | Scope | Est. |
|---|---|---|
| 0 | `test-utils.tsx` | 0.5h |
| 1 | Tier A (10 components) | 1 day |
| 1 | Tier B (4 components) | 0.5 day |
| 2 | Tier C (2 components) | 0.5 day |
| 3 | Tier D (4 components, split + test) | 2–3 days |
| 4 | delete containers | 0.5 day |
| 5 | babel plugin cleanup | 0.1h |

Tiers A–C are safe to do in any order and are individually shippable. Step 3 is where the
actual reading-time win lands — if time is short, **do step 3 first on
`CustomDesignComponent` and `AnalyzeComponent`** and leave Tier A as classes indefinitely.
A 24-line class component costs nobody anything.
