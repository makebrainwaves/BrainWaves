# Plan: class components → function components

Rip sheet. Conversion only. One branch, one PR.

**Non-goals:** no component splitting, no container edits, no file moves, no prop-shape changes, no `useCallback` / `useMemo` (except the two cases named below), no new hooks, no renaming the `Home` class in `EEGExplorationComponent.tsx`.

Do not touch `src/renderer/containers/*` (already functions). Do not touch `src/renderer/components/d3Classes/EEGViewer.js` (not a React component). Leave `SettingsDropdown` and `HelpButton` — they are already functions.

---

## Rip rules

Apply in every file. Same diff shape everywhere.

| Class | Function |
|---|---|
| `export default class X extends Component<Props, State>` | `export default function X(props: Props)` |
| `class X … export default X` | `export default function X(props: Props)` |
| `export class HelpSidebar` | `export function HelpSidebar` — keep the named export |
| `extends PureComponent` | plain function. Do not add `React.memo` |
| `constructor` state init | **one `useState` per field** |
| `this.state.foo` | `foo` |
| `this.setState({ foo })` | `setFoo(foo)` |
| `this.setState({ foo, bar })` | `setFoo(foo); setBar(bar);` — React 18 batches |
| `this.setState(prev => ({ foo: … }))` | `setFoo(prev => …)` — drop the object wrapper |
| `this.setState(prev => ({ …prev, foo }))` | `setFoo(…)` only; other fields are other hooks |
| `this.props.foo` | `props.foo` — **do not destructure** `props` in the signature |
| `handleX() {}` / `handleX = () => {}` | `function handleX() {}` in the body |
| `renderX() {}` | `function renderX() {}` in the body, same file |
| `static foo()` | module-level `function foo()` above the component |
| `componentDidMount` | `useEffect(() => {…}, [])` |
| async `componentDidMount` | same; `void` the promise or use an inner async fn. Guard `setState` after unmount with a `cancelled` flag |
| `componentWillUnmount` | cleanup return of that same `[]` effect |
| `componentDidUpdate` guarded on one prop | `useEffect(() => {…}, [thatProp])` |
| instance field that is a constant from initial props | `useState(() => …)` and never set it |
| instance field that is mutable across renders (`conditionParams`, subscriptions, DOM nodes) | `useRef` |
| `debounce(this.handleX.bind(this), n)` in the constructor | `useMemo(() => debounce(function handleX() {…}, n, opts), [])` plus `useEffect(() => () => handleX.cancel(), [handleX])` |

**Do not** keep a single `useState<State>` object. Class `setState` merges; hook `setState` replaces. Per-field setters cannot wipe sibling fields.

**Do not** add `useCallback` / `useMemo` / `React.memo` except:

1. Debounced handlers (above) — `useMemo` holds the lodash instance so it is not recreated every render.
2. `StimuliDesignColumn` — `React.memo` with a compare that matches the existing `shouldComponentUpdate`. The file exists for that skip. See its card.

Keep `Props` / `State` interfaces. `State` documents the `useState` group.

Keep the default-vs-named export style of the file you are in. Keep the function name equal to the class name (`Analyze`, `Home`, `Clean`, `Collect`, `Design`, `CustomDesign`, `PreviewButton`, …). Default-export local name does not matter to importers; don't rename.

Import `useState` / `useEffect` / `useRef` / `useMemo` from `'react'` as needed. Drop `Component` / `PureComponent`.

---

## Conversion order

Do not skip ahead. Tests land first so a silent behavior change fails the file you are about to touch.

### A. Tests (against the current classes)

Write these before converting the matching file. If the test needs edits after conversion, behavior changed — stop and fix the component, not the test.

Style: `src/renderer/components/CleanComponent/__tests__/EpochReviewer.test.tsx`. `render(<X {...props} />)`, 2–4 behavioral assertions, no snapshots, no `Provider`.

**A1. Rewrite `CustomDesignComponent.test.ts` first.**

It currently does `new CustomDesign(makeProps())` and assigns `design.setState`. That dies the moment the class is gone. Replace with RTL before converting the component.

The contract to keep: an older `handleConditionChange('dir', …)` must not overwrite a newer `handleConditionChange('title', …)`. Drive it through the UI (change the folder, then the title, then resolve the deferred `readImages`). Assert `stimulus1.title` is still the newer title. Same mocks (`finishRead` deferred `readImages`) stay.

**A2. `SignalQualityIndicatorComponent`** — new test file.

- `Subject` as `signalQualityObservable`. After mount, `subject.observed === true`.
- `unmount()` → `subject.observed === false`.
- `rerender` with a new `Subject` → old unsubscribed, new observed.
- Do **not** assert `setSignalQuality` — there is no React state. The subscribe body paints D3 on `#${channelId}`.

**A3. `CollectComponent/index`** — new test file.

- `isEEGEnabled` + not `CONNECTED` → connect modal opens on mount (`handleStartConnect`).
- `rerender` with `connectionStatus={CONNECTION_STATUS.CONNECTED}` → modal closes.
- Need dummy `DeviceActions` / `ExperimentActions` / device props; look at `Props` in the file.

**A4. `CleanComponent/index`** — new test file.

- Render with `suggestedRejections={[]}`.
- `rerender` with `suggestedRejections={[{ index: 2 }, { index: 5 }]}`.
- Those indices appear in whatever the review UI uses to mark rejected epochs (the `rejected` set passed to `EpochReviewer`). Stub `readWorkspaceRawEEGData` so mount does not hit the filesystem.

**A5. `StimuliDesignColumn.test.tsx`** — extend, do not replace.

Existing test: mount with `audioDir="/tones"` shows `( 2 sounds )`.
Add: `rerender` with a different `audioDir`; `readAudioFiles` resolves a different list; the label updates.

**A6. `ViewerComponent`** — new test file. jsdom cannot exercise `<webview>` IPC or `dom-ready`. Do not pretend.

- Mock `window.electronAPI.getViewerUrl` → resolve `'http://viewer.local'`.
- First paint: `container` is empty (`viewerUrl === ''` → `return null`).
- After the promise: a `webview` with that `src`.
- Playtest of channels / domain / autoScale / signal-quality IPC is Electron-only (`npm run dev`, desktop window, not `:5173`).

Skipped: Storybook, MSW, snapshots, coverage target, tests for the other 14 files. `npm run typecheck` is the net for those.

---

### B. Easy files — table rules only

Convert top to bottom. After each file: it must typecheck in isolation (no leftover `this.`, no `Component` import).

| # | File | Lines | State fields | Notes |
|---|---|---|---|---|
| 1 | `PreviewButtonComponent.tsx` | 24 | none | `PureComponent` → function. Drop `Pure`. |
| 2 | `PreviewExperimentComponent.tsx` | 49 | none | `static insertPreviewLabJsCallback` → module-level function. `handleImages` is unused in render except… it is **never called**. Leave the function in the body; do not delete. |
| 3 | `PyodidePlotWidget.tsx` | 87 | none | Constructor only binds. Two handlers + render. |
| 4 | `InputCollect.tsx` | 155 | `subject`, `group`, `session`, `isSubjectError`, `isSessionError` | `this.setState({ [field]: … })` is already a `switch` — each branch calls the matching setter. |
| 5 | `CleanComponent/CleanSidebar.tsx` | 172 | `helpStep` | Menu / next / back. |
| 6 | `CollectComponent/HelpSidebar.tsx` | 191 | `helpStep` | **Named export.** `HelpButton` below it stays. Updater form: `setHelpStep(prev => prev + 1)` / `prev - 1`. |
| 7 | `CollectComponent/PreTestComponent.tsx` | 175 | `isPreviewing`, `isSidebarVisible` | `componentDidMount`/`WillUnmount` bind/unbind Mousetrap `esc`. Updater form on preview + sidebar toggle. |
| 8 | `SecondaryNavComponent/index.tsx` | 116 | none | **Drop `shouldComponentUpdate`.** Do not wrap in `memo`. The SCU only compared `activeStep`, so title / `saveButton` / `enableEEGToggle` already could not update — that is a latent skip, not a behavior we keep. `SettingsDropdown` stays. |
| 9 | `DesignComponent/index.tsx` | 319 | `activeStep`, `isPreviewing`, `isNewExperimentModalOpen`, `recentWorkspaces` | async mount: `setRecentWorkspaces(await readWorkspaces())`. One updater on preview toggle. |
| 10 | `HomeComponent/index.tsx` | 379 | `activeStep`, `recentWorkspaces`, `workspaceStates`, `isNewExperimentModalOpen`, `isOverviewComponentOpen`, `overviewExperimentType` | async mount launches Pyodide then reads workspaces. `loadWorkspaceStates` stays a function in the body. |
| 11 | `AnalyzeComponent.tsx` | 560 | 16 fields — see constructor | Biggest mechanical file. Several handlers set 2–3 fields at once; emit 2–3 setters. async mount reads cleaned EEG + behavior. |
| 12 | `CleanComponent/index.tsx` | 471 | 10 fields + `icons` | `icons` is a constructor-only instance field from `props.type`. `const [icons] = useState(() => props.type === EXPERIMENTS.N170 ? ['😊', '🏠', '✕', '📖'] : ['★', '☆', '✕', '📖']);` — never set. `componentDidUpdate` on `suggestedRejections` → `useEffect` that `setRejectedEpochs(prev => { const next = new Set(prev); for (const s of suggested) next.add(s.index); return next; })`. |

---

### C. Judgement files — do these by hand, in this order

#### C1. `InputModal.tsx` (84) — debounce

Constructor:

```ts
this.handleTextEntry = debounce(this.handleTextEntry, 100).bind(this);
```

Target:

```tsx
const handleTextEntry = useMemo(
  () =>
    debounce((event: React.ChangeEvent<HTMLInputElement>) => {
      setEnteredText(event.target.value);
    }, 100),
  []
);
useEffect(() => () => handleTextEntry.cancel(), [handleTextEntry]);
```

Default lodash trailing debounce. Do not change the 100ms. Other handlers are plain functions.

#### C2. `ConnectModal.tsx` (306) — debounce + `UNSAFE_componentWillUpdate`

Two constructor debounces (preserve timings and `{ leading: true, trailing: false }`):

```tsx
const propsRef = useRef(props);
propsRef.current = props;

const handleSearch = useMemo(
  () =>
    debounce(function handleSearch() {
      setInstructionProgress(0);
      propsRef.current.DeviceActions.SetDeviceAvailability(
        DEVICE_AVAILABILITY.SEARCHING
      );
    }, 300, { leading: true, trailing: false }),
  []
);
const handleConnect = useMemo(
  () =>
    debounce(function handleConnect() {
      /* body of handleConnect, read props via propsRef.current */
    }, 1000, { leading: true, trailing: false }),
  []
);
useEffect(
  () => () => {
    handleSearch.cancel();
    handleConnect.cancel();
  },
  [handleSearch, handleConnect]
);
```

`static getDeviceName` → module-level `function getDeviceName`. Call sites currently `ConnectModal.getDeviceName(…)` become `getDeviceName(…)`.

`UNSAFE_componentWillUpdate` runs **before** the render that sees the new `deviceAvailability`, so `instructionProgress` updates in the same paint. `useEffect` runs after; one extra frame. Accept that.

```tsx
useEffect(() => {
  if (props.deviceAvailability === DEVICE_AVAILABILITY.NONE) {
    setInstructionProgress(INSTRUCTION_PROGRESS.TURN_ON); // 1
  }
}, [props.deviceAvailability]);
```

**Stop. That is not equivalent.** The class only fires on the *transition*:

- `SEARCHING → NONE` → `instructionProgress = 1` (`TURN_ON`)
- `NONE → AVAILABLE` → `instructionProgress = 0` (`SEARCHING`)

`handleSearch` also sets progress to `0` independently, so progress is not a pure function of `deviceAvailability`. Use a ref for the previous value:

```tsx
const prevAvailability = useRef(props.deviceAvailability);
useEffect(() => {
  const prev = prevAvailability.current;
  const next = props.deviceAvailability;
  prevAvailability.current = next;
  if (next === DEVICE_AVAILABILITY.NONE && prev === DEVICE_AVAILABILITY.SEARCHING) {
    setInstructionProgress(INSTRUCTION_PROGRESS.TURN_ON);
  }
  if (next === DEVICE_AVAILABILITY.AVAILABLE && prev === DEVICE_AVAILABILITY.NONE) {
    setInstructionProgress(INSTRUCTION_PROGRESS.SEARCHING);
  }
}, [props.deviceAvailability]);
```

`componentDidMount` LSL probe stays a `[]` effect.

#### C3. `SignalQualityIndicatorComponent.tsx` (70)

There is **no React state**. The first-draft snippet `subscribe(setSignalQuality)` is wrong. The subscribe body paints D3:

```ts
d3.select(`#${key}`)
  .transition()
  .duration(this.props.plottingInterval) // live `this.props` at fire time
```

Class also does **not** unsubscribe when the observable becomes `null` — `didUpdate` only resubscribes when the new value is non-null. Preserve that (skip the effect body when null; do not add a cleanup that runs on the null transition unless you also skip registering an effect). Simplest faithful form:

```tsx
export default function SignalQualityIndicatorComponent(props: Props) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const subRef = useRef<Subscription | null>(null);

  useEffect(() => {
    const observable = props.signalQualityObservable;
    if (observable == null) return;
    subRef.current?.unsubscribe();
    subRef.current = observable.subscribe(
      (epoch) => {
        Object.keys(epoch.signalQuality).forEach((key) => {
          d3.select(`#${key}`)
            .attr('visibility', 'show')
            .attr('stroke', '#000')
            .transition()
            .duration(propsRef.current.plottingInterval)
            .ease(d3.easeLinear)
            .attr('fill', epoch.signalQuality[key]);
        });
      },
      (error) => new Error(`Error in signalQualitySubscription ${error}`)
    );
  }, [props.signalQualityObservable]);

  useEffect(() => () => {
    subRef.current?.unsubscribe();
  }, []);

  return (
    <div>
      <SignalQualityIndicatorSVG />
    </div>
  );
}
```

Do **not** extract a shared `useObservable` hook for this and Viewer.

#### C4. `CollectComponent/index.tsx` (138) and `EEGExplorationComponent.tsx` (144)

Same modal-close pattern. Class compares **previous state**:

```ts
if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTED && prevState.isConnectModalOpen) {
  this.setState({ isConnectModalOpen: false });
}
```

```tsx
useEffect(() => {
  if (props.connectionStatus === CONNECTION_STATUS.CONNECTED) {
    setIsConnectModalOpen(false);
  }
}, [props.connectionStatus]);
```

Equivalent: the guard only skipped a redundant `setState(false)`. Setting state to the current value is a React no-op.

Collect also auto-opens the modal on mount when EEG is on and not connected — that stays a `[]` effect calling `handleStartConnect`.

EEGExploration's class name is `Home`. Keep `export default function Home`.

#### C5. `StimuliDesignColumn.tsx` (203) — the memo exception

File comment: extracted so text input is not slow. `shouldComponentUpdate` skips unless `title` / `response` / `dir` / `audioDir` / `numberImages` / `numberSounds` change. **Preserve that skip.**

```tsx
function StimuliDesignColumn(props: Props) {
  const [numberImages, setNumberImages] = useState<number | undefined>(undefined);
  const [numberSounds, setNumberSounds] = useState<number | undefined>(undefined);

  useEffect(() => {
    void refreshSoundCount(props.audioDir);
  }, [props.audioDir]); // covers mount + audioDir change

  async function refreshSoundCount(audioDir: string) {
    if (!audioDir) return;
    const sounds = await readAudioFiles(audioDir);
    setNumberSounds(sounds.length);
  }
  // …handlers, render
}

export default React.memo(StimuliDesignColumn, (prev, next) => {
  return (
    prev.title === next.title &&
    prev.response === next.response &&
    prev.dir === next.dir &&
    prev.audioDir === next.audioDir &&
    prev.num === next.num &&
    prev.numberImages === next.numberImages
  );
});
```

Note: class SCU also compared **state** `numberImages` / `numberSounds`. `React.memo` only sees props; state changes still re-render the memoized component, which is what we want. `onChange` identity is ignored (same as the class — SCU did not compare `onChange`). Include `num` so a reused column with a new index still updates.

`refreshSoundCount` on mount and on `audioDir` change collapses into one `[props.audioDir]` effect.

#### C6. `CustomDesignComponent.tsx` (651)

Two instance fields, not state:

```ts
private conditionParams: ExperimentParameters; // latest saved-or-in-flight params
private conditionRevision = 0;                 // stale-folder-scan guard
```

```tsx
const conditionParamsRef = useRef(mergeCustomParams(props.params));
const conditionRevisionRef = useRef(0);
```

Every `this.conditionParams` → `conditionParamsRef.current`. Every `++this.conditionRevision` / `this.conditionRevision` → `conditionRevisionRef`.

`componentWillUnmount` writes the ref back to Redux:

```tsx
useEffect(() => {
  return () => {
    props.ExperimentActions.SetParams(conditionParamsRef.current);
    props.ExperimentActions.SaveWorkspace();
  };
}, [props.ExperimentActions]);
```

`handleSaveParams` default arg `params = this.conditionParams` becomes `params = conditionParamsRef.current`.

This is the largest file. Convert in place. Do not split.

The A1 RTL test must already be green before you start this file.

#### C7. `ViewerComponent.tsx` (148) — last, alone

Genuinely risky. Playtest in the Electron window after this file.

What the class does:

1. Mount: `getViewerUrl()` then `setState({ viewerUrl })`. `<webview>` is **not** in the DOM yet.
2. `didUpdate` when `viewerUrl` goes `'' → non-empty`: `querySelector('webview')`, attach `dom-ready`. That handler reads `this.props.plottingInterval` and `this.state.channels/domain` **at fire time**, then `setKeyListeners`, then maybe subscribe.
3. `props.channels` change → `setState({ channels })`.
4. `props.signalQualityObservable` identity change + non-null → resubscribe (same null-skip as SignalQuality).
5. If `this.graphView` is still null, return. Else IPC: `channels` / `domain` / `autoScale` state changes.
6. Unmount: unsubscribe + `Mousetrap.unbind('up'|'down')`.

`componentDidUpdate` does not run on mount; `useEffect` does. The `if (!graphViewRef.current) return` early-out on the IPC effects is what prevents a mount-time `send` into a missing webview.

Target shape:

```tsx
export default function ViewerComponent(props: Props) {
  const [channels, setChannels] = useState(() => props.channels ?? MUSE_CHANNELS);
  const [domain] = useState(VIEWER_DEFAULTS.domain);
  const [autoScale] = useState(VIEWER_DEFAULTS.autoScale);
  const [viewerUrl, setViewerUrl] = useState('');

  const graphViewRef = useRef<WebviewTag | null>(null);
  const subRef = useRef<Subscription | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  function subscribeToObservable(observable: Observable<SignalQualityData>) {
    subRef.current?.unsubscribe();
    subRef.current = observable.subscribe({
      next: (chunk) => {
        graphViewRef.current?.send('newData', chunk);
      },
      error: (error) =>
        console.error('[viewer] signal quality observable error:', error),
    });
  }

  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getViewerUrl().then((url) => {
      if (!cancelled) setViewerUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Attach once viewerUrl makes <webview> exist. Class did this in didUpdate
  // keyed on prevState.viewerUrl being empty — equivalent to [viewerUrl] plus
  // "only when non-empty".
  useEffect(() => {
    if (!viewerUrl) return;
    const el = document.querySelector('webview') as WebviewTag | null;
    graphViewRef.current = el;
    const onDomReady = () => {
      const p = propsRef.current;
      el?.send('initGraph', {
        plottingInterval: p.plottingInterval,
        channels: channelsRef.current,
        domain,
        channelColours: channelsRef.current.map(() => '#66B0A9'),
      });
      Mousetrap.bind('up', () => graphViewRef.current?.send('zoomIn'));
      Mousetrap.bind('down', () => graphViewRef.current?.send('zoomOut'));
      if (p.signalQualityObservable != null) {
        subscribeToObservable(p.signalQualityObservable);
      }
    };
    el?.addEventListener('dom-ready', onDomReady);
    // Class never removed this listener. No StrictMode in the tree, so do not
    // invent a removeEventListener unless you also need it for correctness.
  }, [viewerUrl, domain]);

  useEffect(() => {
    if (props.channels) setChannels(props.channels);
  }, [props.channels]);

  useEffect(() => {
    if (props.signalQualityObservable == null) return;
    subscribeToObservable(props.signalQualityObservable);
  }, [props.signalQualityObservable]);

  useEffect(() => {
    if (!graphViewRef.current) return;
    graphViewRef.current.send('updateChannels', channels);
  }, [channels]);

  useEffect(() => {
    if (!graphViewRef.current) return;
    graphViewRef.current.send('updateDomain', domain);
  }, [domain]);

  useEffect(() => {
    if (!graphViewRef.current) return;
    graphViewRef.current.send('autoScale');
  }, [autoScale]);

  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      Mousetrap.unbind('up');
      Mousetrap.unbind('down');
    };
  }, []);

  if (!viewerUrl) return null;
  const trueAsString = 'true' as any;
  return (
    <webview
      id="eegView"
      src={viewerUrl}
      autosize={trueAsString}
      plugins={trueAsString}
    />
  );
}
```

`domain` / `autoScale` are never written after init (`VIEWER_DEFAULTS`). Keep the IPC effects anyway — they match the class. They no-op on mount because `graphViewRef` is still null when those effects first run (webview is not in the tree until `viewerUrl` is set, which is a later paint).

---

## Cleanup (after every class is gone)

Babel plugins are in **two** configs, not one. First draft missed `vite.config.ts`.

1. Delete the `babel.plugins` array from `vitest.config.ts` and from `vite.config.ts` (the comment "Legacy decorator support (used throughout the codebase)" is false — zero decorators in `src/`).
2. Remove `@babel/plugin-proposal-decorators` and `@babel/plugin-proposal-class-properties` from `package.json` `devDependencies`.
3. `npm install` to refresh the lockfile.

---

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

`react-hooks/exhaustive-deps` (`eslint.config.mjs:47`, `recommended-latest`) is the signal to check by hand, not to silence.

Playtest `npm run dev` — the **desktop window**, not `localhost:5173` — Home → Design → Collect → Clean → Analyze. Device connected for Viewer + SignalQuality. Type in a StimuliDesignColumn title field and confirm it is not janky (the memo). Open ConnectModal and watch the SEARCHING → none-found → TURN_ON copy.

---

## Inventory (20 classes, 4442 lines)

| File | Lines | Bucket |
|---|---|---|
| `PreviewButtonComponent.tsx` | 24 | easy |
| `PreviewExperimentComponent.tsx` | 49 | easy |
| `PyodidePlotWidget.tsx` | 87 | easy |
| `InputCollect.tsx` | 155 | easy |
| `CleanComponent/CleanSidebar.tsx` | 172 | easy |
| `CollectComponent/HelpSidebar.tsx` | 191 | easy (named export) |
| `CollectComponent/PreTestComponent.tsx` | 175 | easy |
| `SecondaryNavComponent/index.tsx` | 116 | easy (drop SCU) |
| `DesignComponent/index.tsx` | 319 | easy |
| `HomeComponent/index.tsx` | 379 | easy |
| `AnalyzeComponent.tsx` | 560 | easy, large |
| `CleanComponent/index.tsx` | 471 | easy + `icons` lazy state |
| `InputModal.tsx` | 84 | judgement — debounce |
| `CollectComponent/ConnectModal.tsx` | 306 | judgement — debounce + willUpdate |
| `SignalQualityIndicatorComponent.tsx` | 70 | judgement — D3 + live props |
| `CollectComponent/index.tsx` | 138 | judgement — prevState modal |
| `EEGExplorationComponent.tsx` | 144 | judgement — same modal |
| `DesignComponent/StimuliDesignColumn.tsx` | 203 | judgement — `React.memo` |
| `DesignComponent/CustomDesignComponent.tsx` | 651 | judgement — refs + test rewrite |
| `ViewerComponent.tsx` | 148 | judgement — last |

---

## Audit of the first draft

Keep these corrections; do not re-introduce the original claims.

- **Not true:** "no `shouldComponentUpdate` / legacy `componentWill*`." Actual: `SecondaryNavComponent` and `StimuliDesignColumn` have `shouldComponentUpdate`. `ConnectModal` has `UNSAFE_componentWillUpdate`.
- **Not true:** SignalQuality "state" + `subscribe(setSignalQuality)`. It has zero React state; it mutates D3. `plottingInterval` is read live inside the subscriber — needs `propsRef`, same trap as Viewer.
- **Not true:** only Viewer needs a ref for live props. SignalQuality does too.
- **Not true:** cleanup is only `vitest.config.ts`. Plugins also live in `vite.config.ts`.
- **Not true:** 4255 lines. `wc -l` is 4442.
- **Missed:** `InputModal` constructor debounce (100ms). Two debounce files, not one.
- **Missed:** `ConnectModal` constructor debounces (300 / 1000, leading). Recreating them every render resets the timer and breaks leading-edge.
- **Missed:** `CustomDesign.conditionParams` + `conditionRevision` instance fields. These are the stale-scan guard the existing test covers.
- **Missed:** `CustomDesignComponent.test.ts` instantiates the class. Rewrite to RTL before converting that file or CI goes red mid-pass.
- **Missed:** `Clean.icons` constructor field derived from `props.type`.
- **Missed:** `ConnectModal.getDeviceName` and `PreviewExperimentComponent.insertPreviewLabJsCallback` statics → module functions.
- **Missed:** HelpSidebar is a named export.
- **Wrong judgement count:** four files. Real judgement list is C1–C7 above.
- **Still true:** no `defaultProps`, no `createRef` / `this.refs`, no `forceUpdate`, no `setState(partial, callback)`, no `getDerivedStateFromProps`. Nine updater-form `setState` sites (Clean ×3, HelpSidebar ×2, PreTest ×2, CustomDesign ×1, Design ×1). No maintained TS class-component codemod worth adding.
- **Still true:** existing function components (`RunComponent`, `ExperimentWindow`) destructure props. We still keep `props.` on converted files so the diff is `this.props.` → `props.`. Do not "fix" that to match `RunComponent` in this PR.

---

## Post-review notes (ponytail-review of PR #245)

These are non-cosmetic findings that need fixing before merge. Address in order; each is a silent behavior change or a latent bug.

### 1. `InputModal.tsx` — debounced event handler is unsafe
**Location:** `handleTextEntry` in the converted file.
**Problem:** The debounced callback receives the raw `React.ChangeEvent<HTMLInputElement>`. React 16 pools synthetic events; after the 100 ms debounce delay, `event.target.value` may read from a recycled event object and return `null`/`undefined`.
**Fix:** Change the `onChange` prop to extract `event.target.value` synchronously and pass the string into the debounce:
```tsx
onChange={(e) => handleTextEntry(e.target.value)}
const handleTextEntry = useMemo(
  () => debounce((value: string) => setEnteredText(value), 100),
  []
);
```

### 2. `AnalyzeComponent.tsx` — `setHelpMode` dropped from two handlers
**Location:** `handleRemoveOutliers` and `handleDisplayModeChange`.
**Problem:** The class version did `this.setState({ helpMode: 'outliers' })` inside `handleRemoveOutliers` and `this.setState({ helpMode: displayMode })` inside `handleDisplayModeChange`. The conversion initializes `helpMode` to `'errorbars'` and never updates it, so the help sidebar content is permanently stale.
**Fix:** Restore `setHelpMode('outliers')` / `setHelpMode(displayMode)` in those two handlers.

### 3. `ViewerComponent.tsx` — two dead `useEffect` hooks
**Location:** Effects keyed on `[channels, domain]` and `[autoScale]`.
**Problem:** `domain` and `autoScale` are `useState` constants initialized from `VIEWER_DEFAULTS` and never written after mount. The class `componentDidUpdate` never reached these branches on a real transition because the state never changed. The effects fire once on mount but `graphViewRef.current` is still `null` at that point, so they silently no-op every time.
**Fix:** Delete the two effects. Keep `domain` / `autoScale` as local constants for the `initGraph` call only.

### 4. `CustomDesignComponent.tsx` — `handleSetText` no longer persists to Redux
**Location:** `handleSetText` body.
**Problem:** The class called `this.handleSaveParams(params)` at the end of `handleSetText`, which dispatched `SetParams` + `SaveWorkspace` to Redux on every keystroke. The conversion only updates local `params` state and `saved` flag, deferring persistence to `handleStepClick` or unmount. If the user refreshes or crashes before changing steps, the text edits are lost.
**Fix:** Decide if fewer Redux writes is intentional. If not, restore `handleSaveParams(newParams)` at the end of `handleSetText`.

### 5. `SignalQualityIndicatorComponent.tsx` — swallowed error handler
**Location:** Observable subscribe error callback.
**Problem:** `(error) => new Error(...)` builds an `Error` instance and immediately discards it. The class version had the same bug; the `ViewerComponent` conversion in this PR already fixed the equivalent site to `console.error`.
**Fix:** Replace with `console.error('[signal-quality] subscription error:', error)`.

### 6. `StimuliDesignColumn.test.tsx` — invalid React import
**Location:** Line 2.
**Problem:** `import { act } from 'react';` is invalid in the classic JSX runtime (React 16). The file already imports `act` from `@testing-library/react` on the next line, so this import is redundant and will fail at build time.
**Fix:** Delete the line.

### 7. `CleanComponent/index.tsx` — unused import
**Location:** Top of file.
**Problem:** `useCallback` was added to the React import during conversion but is never referenced.
**Fix:** Remove `useCallback` from the import.

### 8. `SecondaryNavComponent/index.tsx` — redundant JSX guard
**Location:** `SettingsDropdown` render.
**Problem:** `{saveButton && saveButton}` is equivalent to `{saveButton}`; JSX already renders `undefined` / `null` as nothing.
**Fix:** Simplify to `{saveButton}`.

### 9. `ViewerComponent.tsx` — unnecessary double cast
**Location:** `const trueAsString = 'true' as unknown as boolean;`
**Problem:** The original class used `'true' as any`. The double cast is longer with no added type safety (the webview attribute still expects a string literal at runtime).
**Fix:** Revert to `'true' as any` or `'true' as string`.

### 10. `CustomDesignComponent.tsx` / `DesignComponent/index.tsx` — dead `FIELDS` / `static` helpers
**Location:** `CustomDesignComponent.tsx` top-level `FIELDS` object; `DesignComponent/index.tsx` moved `renderConditionIcon` and `renderOverviewIcon` to module-level.
**Problem:** `FIELDS` is no longer referenced after the conversion inlined the labels. The `DesignComponent` static-to-module-level move is correct, but verify no remaining `Design.renderX` call sites exist in other files.
**Fix:** Delete `FIELDS` if nothing imports it.
