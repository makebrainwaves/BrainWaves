# WS2 Headset Setup Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ConnectModal` with the approved `HeadsetSetup` stories wired to live device state: discovery starts only from `Find my headset`, search is open-ended and cancellable, the shell device chip opens setup, and signal prep follows pairing on Collect/Explore.

**Architecture:** One `HeadsetSetupDialog` container, mounted once in `AppShellContainer`, turns Redux device state plus local screen state into the pure `HeadsetSetup` view through a tested `pairingStep()` function. Collect, Explore and the device chip open it through a `HeadsetSetupContext` (same pattern as `RunProgressContext`). The existing `EEGDriver` interface and device actions stay; the only new action is `CancelSearch`, which replaces the 3-second `searchTimerEpic`.

**Tech Stack:** React 18, Redux Toolkit, redux-observable 2 / RxJS 7, Radix Dialog, Vitest + Testing Library, Electron (Web Bluetooth via `select-bluetooth-device`).

**Spec:** `docs/uxr/playtest_naive_1_design_implementation_plan.md` §3.1, §4, §11 Workstream 2, §14. Approved design: `src/renderer/components/HeadsetSetup/` (PR #272, Storybook `Domain/HeadsetSetup`).

**Skills to read before starting:** `.claude/skills/electron-ipc-architecture/SKILL.md` (Bluetooth crosses main/renderer), `.claude/skills/electron-playtest/SKILL.md` (Task 6).

## Global Constraints

- First-time discovery uses Web Bluetooth `requestDevice()`, which requires an explicit user action. `SetDeviceAvailability(SEARCHING)` MUST be dispatched synchronously inside the click handler; `searchEpic` calls `scan()` synchronously in `map` (see the NOTE above it in `deviceEpics.ts`). Never move `scan()` behind `from()`, `await`, or a timer.
- "Remove automatic first-time scanning from the Collect mount effect." (§4.3)
- "Replace the fixed three-second failure path with a cancellable search that remains active until a device is found, the user cancels, or the platform reports failure." (§4.3)
- "Cancel the pending Bluetooth picker when the setup UI closes." (§4.3)
- "Preserve the current driver interface and Redux actions unless an actual missing state requires a minimal extension." (§11 WS2)
- "Feed the shell chip from the same connection state and keep `Connected` distinct from `Recording`." (§11 WS2). No second connection state machine.
- The chip opens setup "outside a run" (§3.1): the `RunBar` chip stays non-interactive.
- No multi-headset picker, no IPC changes. Main still auto-selects the first advertised device (§4.3, §13).
- Signal prep never gates (the `SignalPrep` docstring).
- Obsolete UI is deleted, not parked (§14). `ConnectModal.tsx`, `searchTimerEpic`, and `SEARCH_TIMER` go away.
- Do not restyle `HeadsetSetup.tsx` / `SignalPrep.tsx`. They are the approved design. Wiring only.
- Comments go on definitions (docstrings), not narrating inside function bodies (`.llms/learnings.md`).
- Subagents: skip formatters, project-wide lint, and the full test suite. Run only the files named in each task. Task 6 runs everything once.

## Review Focus

1. **Closing mid-search** (×, Escape, overlay click) must cancel the pending `requestDevice()`. If it doesn't, the next `Find my headset` hangs or fails. The test is in Task 3.
2. **A headset that drops on Collect** reopens setup at "Which headset?" and must NOT start a scan without a click. The test is in Task 4.
3. **A rejected `connect()`** currently errors `connectEpic`'s stream and kills every device epic until reload. After a failure, "Try again" must still work. The test is in Task 1.
4. **Cancel during Connecting** must never be followed by a late `CONNECTED` from the abandoned promise. The test is in Task 1.
5. **LSL discovery IPC rejects** (liblsl hiccup). The student must land on "couldn't find", not a spinner forever. The test is in Task 1.

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/renderer/actions/deviceActions.ts` | modify | add `CancelSearch` |
| `src/renderer/epics/deviceEpics.ts` | modify | open-ended search, `cancelSearchEpic`, connect failure/cancel, LSL discovery failure; delete `searchTimerEpic` |
| `src/renderer/constants/constants.ts` | modify | delete `SEARCH_TIMER` |
| `src/main/index.ts:694-696` | modify | comment only: renderer cancels, not a timer |
| `src/renderer/epics/__tests__/deviceEpics.test.ts` | create | epic behavior |
| `src/renderer/components/HeadsetSetup/pairingStep.ts` | create | pure Redux+screen → `PairingStep` |
| `src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts` | create | precedence rules |
| `src/renderer/components/HeadsetSetup/HeadsetSetupDialog.tsx` | create | container: Radix dialog + handlers |
| `src/renderer/components/HeadsetSetup/__tests__/HeadsetSetupDialog.test.tsx` | create | no-scan-on-open, cancel-on-close |
| `src/renderer/containers/AppShellContainer.tsx` | modify | mount dialog, `HeadsetSetupContext`, chip click, signal-prep flag |
| `src/renderer/components/AppShell/DeviceChip.tsx`, `AppShell.tsx` | modify | optional `onClick` / `onDeviceClick` |
| `src/renderer/components/CollectComponent/index.tsx` | modify | open via context, no scan, signal prep |
| `src/renderer/components/EEGExplorationComponent.tsx` | modify | open via context, signal prep |
| `src/renderer/components/CollectComponent/ConnectModal.tsx` | delete | replaced |
| `src/renderer/components/CollectComponent/__tests__/CollectModal.test.tsx` | modify | new contract |
| `src/renderer/components/HeadsetSetup/LiveSignalPrep.tsx` | create | subscribes to quality stream → `SignalPrep` |

## Dispatch waves (subagent-driven)

Work in one worktree: `git worktree add .worktrees/ws2-headset-setup -b feat/ws2-headset-setup` (see `superpowers:using-git-worktrees`).

| Wave | Tasks | Why |
|---|---|---|
| 1 | Task 1 ∥ Task 2 | Disjoint files; Task 2 is pure |
| 2 | Task 3 | Needs `pairingStep` (T2) and `CancelSearch` (T1) |
| 3 | Task 4 | Needs `HeadsetSetupContext` (T3) |
| 4 | Task 5 | Extends the context (T3) and the hosts (T4) |
| 5 | Task 6 | Integration verification: agent via CDP with the Fixture; the human with a real Muse |

---

### Task 1: Open-ended, cancellable discovery and safe connect in `deviceEpics`

**Files:**
- Modify: `src/renderer/actions/deviceActions.ts:45` (after `Cleanup`)
- Modify: `src/renderer/epics/deviceEpics.ts:37-148, 256-265, 330-344`
- Modify: `src/renderer/constants/constants.ts:66` (delete `SEARCH_TIMER`)
- Modify: `src/main/index.ts:694-696` (comment)
- Test: `src/renderer/epics/__tests__/deviceEpics.test.ts` (create)

**Interfaces:**
- Consumes: `getDriver(type).scan() / cancelScan() / connect(device)` from `src/renderer/utils/eeg` (unchanged `EEGDriver`).
- Produces: `DeviceActions.CancelSearch()` → driver `cancelScan()` + `SetDeviceAvailability(NONE)`. After this task:
  - A search only ends via `DeviceFound`, `SetDeviceAvailability(NONE)` (scan rejected or returned nothing), or `CancelSearch`.
  - A failed connect emits `SetConnectionStatus(DISCONNECTED)`.
  - `DisconnectFromDevice` abandons an in-flight connect.
  - A failed LSL discovery emits `SetAvailableLSLStreams([])`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/renderer/epics/__tests__/deviceEpics.test.ts
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateObservable } from 'redux-observable';
import { DeviceActions } from '../../actions';
import type { DeviceActionType } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import type { RootState } from '../../reducers';
import deviceEpics from '../deviceEpics';

const driver = vi.hoisted(() => ({
  scan: vi.fn(),
  cancelScan: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
const lsl = vi.hoisted(() => ({ discoverLSLStreams: vi.fn() }));

vi.mock('../../utils/eeg', () => ({
  getDriver: () => driver,
  setActiveDriver: vi.fn(),
}));
vi.mock('../../utils/eeg/muse', () => ({
  createMuseSignalQualityObservable: vi.fn(),
}));
vi.mock('../../utils/eeg/lslInlet', () => lsl);
vi.mock('../../utils/eeg/lslBridge', () => ({}));

const MUSE = { id: 'muse-1', name: 'Muse-4A2F' };
const INFO = { name: 'Muse-4A2F', samplingRate: 256, channels: ['AF7'] };

function harness(device: Partial<RootState['device']> = {}) {
  const actions = new Subject<DeviceActionType>();
  const state = {
    value: {
      device: {
        deviceType: DEVICES.MUSE,
        deviceAvailability: DEVICE_AVAILABILITY.NONE,
        connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
        availableDevices: [],
        ...device,
      },
    },
  } as unknown as StateObservable<RootState>;
  const out: DeviceActionType[] = [];
  const sub = deviceEpics(actions, state, undefined).subscribe((a) =>
    out.push(a)
  );
  return { actions, state, out, sub };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('device discovery', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('keeps searching until the driver answers — no timeout gives up', async () => {
    vi.useFakeTimers();
    driver.scan.mockReturnValue(new Promise(() => undefined));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    await vi.advanceTimersByTimeAsync(60_000);

    expect(h.out).toEqual([]);
    expect(driver.cancelScan).not.toHaveBeenCalled();
    h.sub.unsubscribe();
  });

  it('ends the search as not found when the platform rejects the scan', async () => {
    driver.scan.mockRejectedValue(new Error('NotFoundError'));
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });

    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
    await flush();

    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('cancelling stops the platform search and ends it without a not-found echo', async () => {
    let reject: (e: Error) => void = () => undefined;
    driver.scan.mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      })
    );
    const h = harness({ deviceAvailability: DEVICE_AVAILABILITY.SEARCHING });
    h.actions.next(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    h.actions.next(DeviceActions.CancelSearch());
    h.state.value.device.deviceAvailability = DEVICE_AVAILABILITY.NONE;
    reject(new Error('cancelled'));
    await flush();

    expect(driver.cancelScan).toHaveBeenCalledTimes(1);
    expect(h.out).toEqual([
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
    ]);
    h.sub.unsubscribe();
  });

  it('reports not found when LSL discovery fails', async () => {
    lsl.discoverLSLStreams.mockRejectedValue(new Error('liblsl'));
    const h = harness({ deviceType: DEVICES.LSL });

    h.actions.next(DeviceActions.DiscoverLSLStreams());
    await flush();

    expect(h.out).toEqual([DeviceActions.SetAvailableLSLStreams([])]);
    h.sub.unsubscribe();
  });
});

describe('device connection', () => {
  afterEach(() => vi.clearAllMocks());

  it('reports a failed connect and still connects on the next try', async () => {
    driver.connect
      .mockRejectedValueOnce(new Error('GATT'))
      .mockResolvedValueOnce(INFO);
    const h = harness();

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
    );

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    await flush();
    expect(h.out).toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    h.sub.unsubscribe();
  });

  it('never reports connected after the attempt was cancelled', async () => {
    let resolve: (info: typeof INFO) => void = () => undefined;
    driver.connect.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const h = harness({ connectionStatus: CONNECTION_STATUS.CONNECTING });

    h.actions.next(DeviceActions.ConnectToDevice(MUSE));
    h.actions.next(DeviceActions.DisconnectFromDevice());
    resolve(INFO);
    await flush();

    expect(h.out).not.toContainEqual(
      DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
    );
    h.sub.unsubscribe();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/renderer/epics/__tests__/deviceEpics.test.ts`
Expected: FAIL. `CancelSearch` is not a function. The timeout test sees `SetDeviceAvailability(NONE)` + `cancelScan`. The reject test sees no output. The connect-retry test errors (the epic stream dies). The cancel-connect test sees `CONNECTED`. LSL sees no output.

- [ ] **Step 3: Add the action**

In `deviceActions.ts`, after `Cleanup`:

```ts
  /** Stops an in-progress Bluetooth search; the pending requestDevice() rejects. */
  CancelSearch: createAction<void, 'CANCEL_SEARCH'>('CANCEL_SEARCH'),
```

- [ ] **Step 4: Rewrite search, cancel, connect, and LSL discovery in `deviceEpics.ts`**

Replace `searchMuseEpic` (lines 37-59) with:

```ts
/**
 * Runs one discovery per SEARCHING. `scan()` is called synchronously inside the
 * dispatch so Web Bluetooth keeps the user gesture (Observable.from loses it).
 * The search stays open until the driver answers; a rejected or empty scan
 * ends it as not found. Results after a cancel are dropped.
 */
const searchEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.SetDeviceAvailability)),
    pluck('payload'),
    filter((status) => status === DEVICE_AVAILABILITY.SEARCHING),
    map(() => getDriver(state$.value.device.deviceType).scan()),
    mergeMap((promise) =>
      promise.then(
        (devices) =>
          devices?.length
            ? DeviceActions.DeviceFound(devices)
            : DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE),
        () => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE)
      )
    ),
    filter(
      () =>
        state$.value.device.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    )
  );
```

Replace `searchTimerEpic` (lines 84-111) with:

```ts
/** User cancelled: reject the pending requestDevice() in main and end the search. */
const cancelSearchEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.CancelSearch)),
    tap(() => getDriver(state$.value.device.deviceType).cancelScan()),
    map(() => DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE))
  );
```

Replace `connectEpic` (lines 113-140) with this. The success branch body is unchanged from lines 123-139:

```ts
/**
 * Connects the chosen device. A rejected connect reports DISCONNECTED (the
 * setup flow's "failed" state) without killing the epic; DisconnectFromDevice
 * abandons an in-flight attempt so a late success cannot report CONNECTED.
 */
const connectEpic: Epic<DeviceActionType, DeviceActionType, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    filter(isActionOf(DeviceActions.ConnectToDevice)),
    pluck('payload'),
    mergeMap((device) =>
      from(getDriver(state$.value.device.deviceType).connect(device)).pipe(
        catchError(() => of(null)),
        takeUntil(
          action$.pipe(filter(isActionOf(DeviceActions.DisconnectFromDevice)))
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mergeMap<DeviceInfo | null, ObservableInput<any>>((deviceInfo) => {
          if (deviceInfo != null && deviceInfo.samplingRate != null) {
            setActiveDriver(state$.value.device.deviceType);
            return of(
              DeviceActions.SetDeviceType(state$.value.device.deviceType),
              DeviceActions.SetDeviceInfo(deviceInfo),
              DeviceActions.SetConnectionStatus(CONNECTION_STATUS.CONNECTED)
            );
          }
          return of(
            DeviceActions.SetConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
          );
        })
      )
    )
  );
```

In `discoverLSLStreamsEpic` (line 263), make the inner observable fail soft:

```ts
    mergeMap(() =>
      from(discoverLSLStreams()).pipe(catchError(() => of([])))
    ),
```

In `combineEpics` (lines 330-344): rename `searchMuseEpic` → `searchEpic`, replace `searchTimerEpic` with `cancelSearchEpic`. Remove `timer` and `SEARCH_TIMER` from the imports.

- [ ] **Step 5: Delete `SEARCH_TIMER` and fix the main-process comment**

Delete `export const SEARCH_TIMER = 3000;` from `constants.ts:66`. Confirm there are no other users: `grep -rn SEARCH_TIMER src` should print nothing. In `src/main/index.ts` replace lines 694-696 with:

```ts
      // Nothing visible yet — keep scanning. The event fires again as devices
      // appear; the renderer's Cancel calls bluetooth:cancelSearch to reject.
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run src/renderer/epics/__tests__/deviceEpics.test.ts`
Expected: 6 passed.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/actions/deviceActions.ts src/renderer/epics/deviceEpics.ts src/renderer/epics/__tests__/deviceEpics.test.ts src/renderer/constants/constants.ts src/main/index.ts
git commit -m "feat(device): open-ended cancellable discovery; connect failures no longer kill epics"
```

---

### Task 2: `pairingStep()` — which setup screen to show

**Files:**
- Create: `src/renderer/components/HeadsetSetup/pairingStep.ts`
- Test: `src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts`

**Interfaces:**
- Consumes: `PairingStep` from `./HeadsetSetup` (exists).
- Produces:
  ```ts
  export type SetupScreen = 'choose' | 'wear' | 'ready' | 'discovery';
  export interface PairingInputs {
    screen: SetupScreen;
    isLSL: boolean;
    availability: DEVICE_AVAILABILITY;
    connectionStatus: CONNECTION_STATUS;
    lslSearching: boolean;
    foundCount: number;
  }
  export function pairingStep(i: PairingInputs): PairingStep;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts
import { describe, expect, it } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../../../constants/constants';
import { PairingInputs, pairingStep } from '../pairingStep';

const base: PairingInputs = {
  screen: 'discovery',
  isLSL: false,
  availability: DEVICE_AVAILABILITY.NONE,
  connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
  lslSearching: false,
  foundCount: 0,
};

describe('pairingStep', () => {
  it('shows connected whenever a device is connected, even when reopened from the chip', () => {
    expect(
      pairingStep({
        ...base,
        screen: 'choose',
        connectionStatus: CONNECTION_STATUS.CONNECTED,
      })
    ).toBe('connected');
  });

  it('keeps the student on their setup screen until they search, ignoring stale results', () => {
    expect(
      pairingStep({
        ...base,
        screen: 'ready',
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
      })
    ).toBe('ready');
  });

  it('follows a Bluetooth search to found or not found', () => {
    expect(
      pairingStep({ ...base, availability: DEVICE_AVAILABILITY.SEARCHING })
    ).toBe('searching');
    expect(
      pairingStep({
        ...base,
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
      })
    ).toBe('found');
    expect(pairingStep(base)).toBe('notFound');
  });

  it('shows a failed connect, but a fresh search replaces the old failure', () => {
    const failed = {
      ...base,
      availability: DEVICE_AVAILABILITY.AVAILABLE,
      foundCount: 1,
      connectionStatus: CONNECTION_STATUS.DISCONNECTED,
    };
    expect(pairingStep(failed)).toBe('failed');
    expect(
      pairingStep({ ...failed, availability: DEVICE_AVAILABILITY.SEARCHING })
    ).toBe('searching');
  });

  it('shows connecting while an attempt is in flight', () => {
    expect(
      pairingStep({
        ...base,
        availability: DEVICE_AVAILABILITY.AVAILABLE,
        foundCount: 1,
        connectionStatus: CONNECTION_STATUS.CONNECTING,
      })
    ).toBe('connecting');
  });

  it('follows LSL discovery from its own stream list, not Bluetooth availability', () => {
    const lsl = { ...base, isLSL: true, availability: DEVICE_AVAILABILITY.SEARCHING };
    expect(pairingStep({ ...lsl, lslSearching: true })).toBe('searching');
    expect(pairingStep({ ...lsl, foundCount: 2 })).toBe('found');
    expect(pairingStep(lsl)).toBe('notFound');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts`
Expected: FAIL. Cannot find module `../pairingStep`.

- [ ] **Step 3: Implement**

```ts
// src/renderer/components/HeadsetSetup/pairingStep.ts
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
} from '../../constants/constants';
import type { PairingStep } from './HeadsetSetup';

/** Screens the student moves through by hand; `discovery` hands over to device state. */
export type SetupScreen = 'choose' | 'wear' | 'ready' | 'discovery';

export interface PairingInputs {
  screen: SetupScreen;
  /** LSL lists streams from its own discovery, not Bluetooth availability. */
  isLSL: boolean;
  availability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  lslSearching: boolean;
  /** Headsets or EEG streams currently listable. */
  foundCount: number;
}

/**
 * The pairing screen to show. A live connection always wins; before the
 * student presses search their own screen wins; after that Redux device state
 * decides. A new search outranks a previous failed connect.
 */
export function pairingStep(i: PairingInputs): PairingStep {
  if (i.connectionStatus === CONNECTION_STATUS.CONNECTED) return 'connected';
  if (i.screen !== 'discovery') return i.screen;
  if (i.connectionStatus === CONNECTION_STATUS.CONNECTING) return 'connecting';
  if (i.isLSL) {
    if (i.lslSearching) return 'searching';
    return i.foundCount ? 'found' : 'notFound';
  }
  if (i.availability === DEVICE_AVAILABILITY.SEARCHING) return 'searching';
  if (i.connectionStatus === CONNECTION_STATUS.DISCONNECTED) return 'failed';
  if (i.availability === DEVICE_AVAILABILITY.AVAILABLE && i.foundCount)
    return 'found';
  return 'notFound';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/HeadsetSetup/pairingStep.ts src/renderer/components/HeadsetSetup/__tests__/pairingStep.test.ts
git commit -m "feat(headset): derive pairing step from device state"
```

---

### Task 3: `HeadsetSetupDialog` container, shell mount, clickable chip

**Files:**
- Create: `src/renderer/components/HeadsetSetup/HeadsetSetupDialog.tsx`
- Test: `src/renderer/components/HeadsetSetup/__tests__/HeadsetSetupDialog.test.tsx`
- Modify: `src/renderer/containers/AppShellContainer.tsx:1-21, 81-110`
- Modify: `src/renderer/components/AppShell/DeviceChip.tsx` (whole component)
- Modify: `src/renderer/components/AppShell/AppShell.tsx:9-48, 96`

**Interfaces:**
- Consumes:
  - `pairingStep`, `SetupScreen` (Task 2)
  - `DeviceActions.CancelSearch` (Task 1)
  - `HeadsetSetup` props (`HeadsetSetup.tsx:48-76`)
- Produces:
  ```ts
  // AppShellContainer.tsx
  export interface HeadsetSetupApi {
    /** Opens pairing at "Which headset?" (or Connected); never starts a search. */
    openHeadsetSetup(): void;
  }
  export const HeadsetSetupContext: React.Context<HeadsetSetupApi>;
  // HeadsetSetupDialog.tsx
  export default function HeadsetSetupDialog(props: {
    open: boolean;
    onClose(): void;
    onDone(device: SetupDevice): void;
  }): JSX.Element;
  ```
  Task 5 adds `signalPrep` and `finishSignalPrep` to `HeadsetSetupApi`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/components/HeadsetSetup/__tests__/HeadsetSetupDialog.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeviceActions } from '../../../actions';
import {
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../../constants/constants';
import HeadsetSetupDialog from '../HeadsetSetupDialog';

const store = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: {
    device: {
      availableDevices: [],
      availableLSLStreams: [],
      connectionStatus: 'NOT_YET_CONNECTED',
      deviceAvailability: 'NONE',
      deviceType: 'MUSE',
    },
  },
}));
vi.mock('react-redux', () => ({
  useDispatch: () => store.dispatch,
  useSelector: (select: (s: unknown) => unknown) => select(store.state),
}));

describe('HeadsetSetupDialog', () => {
  it('searches only when asked, and closing mid-search cancels the platform search', () => {
    const onClose = vi.fn();
    const ui = (
      <HeadsetSetupDialog open onClose={onClose} onDone={vi.fn()} />
    );
    const { rerender } = render(ui);

    fireEvent.click(screen.getByRole('button', { name: 'Muse' }));
    fireEvent.click(screen.getByRole('button', { name: 'It’s on' }));
    expect(store.dispatch).not.toHaveBeenCalledWith(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Find my headset' }));
    expect(store.dispatch).toHaveBeenCalledWith(
      DeviceActions.SetDeviceType(DEVICES.MUSE)
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    store.state.device.deviceAvailability = DEVICE_AVAILABILITY.SEARCHING;
    rerender(ui);
    expect(screen.getByText(/Looking for your Muse/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close setup' }));
    expect(store.dispatch).toHaveBeenCalledWith(DeviceActions.CancelSearch());
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/HeadsetSetup/__tests__/HeadsetSetupDialog.test.tsx`
Expected: FAIL. Cannot find module `../HeadsetSetupDialog`.

- [ ] **Step 3: Implement the container**

```tsx
// src/renderer/components/HeadsetSetup/HeadsetSetupDialog.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogOverlay, DialogPortal } from '../ui/dialog';
import HeadsetSetup, { FoundHeadset, SetupDevice } from './HeadsetSetup';
import { pairingStep, SetupScreen } from './pairingStep';
import { DeviceActions } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import { RootState } from '../../store';

const MODEL: Record<Exclude<SetupDevice, DEVICES.LSL>, string> = {
  [DEVICES.MUSE]: 'Muse headset',
  [DEVICES.NEUROSITY]: 'Neurosity Crown',
  [DEVICES.FIXTURE]: 'Synthetic EEG replay',
};

const isWorn = (d?: SetupDevice) =>
  d === DEVICES.MUSE || d === DEVICES.NEUROSITY;

interface Props {
  open: boolean;
  onClose(): void;
  /** "Check my signal" pressed on the Connected screen. */
  onDone(device: SetupDevice): void;
}

/**
 * Live pairing dialog around the approved `HeadsetSetup` view. The student's
 * own screens (choose → wear → ready) are local; once they press search,
 * Redux device state picks the screen via `pairingStep`. Closing while
 * searching or connecting cancels that attempt.
 */
export default function HeadsetSetupDialog({ open, onClose, onDone }: Props) {
  const dispatch = useDispatch();
  const {
    availableDevices,
    availableLSLStreams,
    connectionStatus,
    deviceAvailability,
    deviceType,
  } = useSelector((s: RootState) => s.device);
  const [device, setDevice] = useState<SetupDevice>();
  const [screen, setScreen] = useState<SetupScreen>('choose');
  const [selectedId, setSelectedId] = useState<string>();
  const [lslSearching, setLslSearching] = useState(false);
  const [showLSL, setShowLSL] = useState(false);

  useEffect(() => {
    window.electronAPI
      ?.isLSLAvailable?.()
      .then(setShowLSL)
      .catch(() => setShowLSL(false));
  }, []);

  useEffect(() => {
    if (open) {
      setScreen('choose');
      setSelectedId(undefined);
    }
  }, [open]);

  useEffect(() => setLslSearching(false), [availableLSLStreams]);

  const connected = connectionStatus === CONNECTION_STATUS.CONNECTED;
  const shownDevice = connected ? (deviceType as SetupDevice) : device;
  const isLSL = shownDevice === DEVICES.LSL;
  const found: FoundHeadset[] = isLSL
    ? availableLSLStreams
        .filter((s) => s.type === 'EEG')
        .map((s) => ({
          id: s.uid,
          name: s.name,
          model: `${s.channelCount} channels at ${s.sampleRate} Hz`,
        }))
    : availableDevices.map((d) => ({
        id: d.id,
        name: d.name ?? d.id,
        model: shownDevice ? MODEL[shownDevice as keyof typeof MODEL] : '',
      }));
  const step = pairingStep({
    screen,
    isLSL,
    availability: deviceAvailability,
    connectionStatus,
    lslSearching,
    foundCount: found.length,
  });

  /**
   * Starts discovery. Must stay synchronous: Web Bluetooth's requestDevice()
   * only runs inside the click that dispatched SEARCHING.
   */
  function find() {
    if (!device) return;
    setSelectedId(undefined);
    setScreen('discovery');
    if (device === DEVICES.LSL) {
      setLslSearching(true);
      dispatch(DeviceActions.DiscoverLSLStreams());
      return;
    }
    if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
      dispatch(
        DeviceActions.SetConnectionStatus(CONNECTION_STATUS.NOT_YET_CONNECTED)
      );
    }
    dispatch(DeviceActions.SetDeviceType(device));
    dispatch(DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING));
  }

  function cancel() {
    if (step === 'searching' && !isLSL) dispatch(DeviceActions.CancelSearch());
    if (step === 'connecting') dispatch(DeviceActions.DisconnectFromDevice());
    setLslSearching(false);
    setScreen(isWorn(device) ? 'ready' : 'wear');
  }

  function close() {
    if (step === 'searching' || step === 'connecting') cancel();
    onClose();
  }

  function connect() {
    if (isLSL) {
      const stream = availableLSLStreams.find((s) => s.uid === selectedId);
      if (stream) dispatch(DeviceActions.ConnectToLSLStream(stream));
      return;
    }
    const target = availableDevices.find((d) => d.id === selectedId);
    if (target) dispatch(DeviceActions.ConnectToDevice(target));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Headset setup
          </DialogPrimitive.Title>
          <HeadsetSetup
            step={step}
            device={shownDevice}
            found={found}
            selectedId={selectedId}
            showFixture={import.meta.env.DEV}
            showLSL={showLSL}
            onChooseDevice={(d) => {
              setDevice(d);
              setScreen('wear');
            }}
            onBack={() => setScreen(screen === 'wear' ? 'choose' : 'wear')}
            onContinue={() => setScreen('ready')}
            onFindHeadset={find}
            onCancel={cancel}
            onSelectHeadset={(id) =>
              setSelectedId(selectedId === id ? undefined : id)
            }
            onConnect={connect}
            onStartSoftwareSource={find}
            onDone={() => shownDevice && onDone(shownDevice)}
            onClose={close}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
```

`Title` is required. Without it Radix logs a `console.error`, and `tests/electron-smoke.mjs` fails on any console error.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/renderer/components/HeadsetSetup/__tests__/HeadsetSetupDialog.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Make the chip optionally interactive**

Replace the body of `DeviceChip` (`DeviceChip.tsx:14-40`):

```tsx
export default function DeviceChip({
  device,
  deviceName = 'Headset',
  onClick,
}: {
  device: DeviceState;
  /** Shown when connected, e.g. `Muse 2`. */
  deviceName?: string;
  /** Opens headset setup. Omitted during a run, where the chip is status only. */
  onClick?(): void;
}) {
  const [label, aria] = {
    none: ['No headset', 'Device: no headset connected'],
    connected: [
      `${deviceName} · Connected`,
      `Device: ${deviceName} connected, not recording`,
    ],
    fixture: ['Fixture', 'Device: fixture data, no headset'],
  }[device];
  const className =
    'flex h-[32px] items-center gap-[8px] whitespace-nowrap rounded-full border border-[#e0e0e0] bg-white px-[12px] text-[13px] text-ink';
  const content = (
    <>
      <span aria-hidden className={`h-[10px] w-[10px] ${GLYPH[device]}`} />
      <span>{label}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      aria-label={`${aria}. Open headset setup`}
      onClick={onClick}
      className={cn(
        className,
        'cursor-pointer hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
      )}
    >
      {content}
    </button>
  ) : (
    <div role="status" aria-label={aria} className={className}>
      {content}
    </div>
  );
}
```

Add `import { cn } from '../ui/utils';`. In `AppShell.tsx`:
- Add to `AppShellProps`: `/** Opens headset setup from the chip; not offered during a run. */ onDeviceClick?(): void;`
- Destructure it.
- Pass it only to the header chip at line 96: `<DeviceChip device={device} deviceName={deviceName} onClick={onDeviceClick} />`.
- Leave `RunBar` untouched.

- [ ] **Step 6: Mount the dialog and context in `AppShellContainer`**

After `RunProgressContext` (line 21):

```tsx
export interface HeadsetSetupApi {
  /** Opens pairing at "Which headset?" (or Connected); never starts a search. */
  openHeadsetSetup(): void;
}

/** Lets Collect and Explore open the one shell-owned headset setup dialog. */
export const HeadsetSetupContext = createContext<HeadsetSetupApi>({
  openHeadsetSetup: () => undefined,
});
```

In the component:
- Add `const [setupOpen, setSetupOpen] = useState(false);` and `const openHeadsetSetup = () => setSetupOpen(true);`.
- Pass `onDeviceClick={openHeadsetSetup}` to `<AppShell>`.
- Wrap the children and mount the dialog:

```tsx
      <RunProgressContext.Provider value={setProgress}>
        <HeadsetSetupContext.Provider value={{ openHeadsetSetup }}>
          {children}
        </HeadsetSetupContext.Provider>
      </RunProgressContext.Provider>
      <HeadsetSetupDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onDone={() => setSetupOpen(false)}
      />
```

Import `HeadsetSetupDialog from '../components/HeadsetSetup/HeadsetSetupDialog'`.

- [ ] **Step 7: Typecheck the touched surface and commit**

Run: `npx tsc --noEmit` → 0 errors. `npx vitest run src/renderer/components/HeadsetSetup src/renderer/components/AppShell` → pass.

```bash
git add src/renderer/components/HeadsetSetup src/renderer/components/AppShell src/renderer/containers/AppShellContainer.tsx
git commit -m "feat(headset): shell-owned setup dialog; device chip opens it"
```

---

### Task 4: Collect and Explore open the new dialog; delete `ConnectModal`

**Files:**
- Modify: `src/renderer/components/CollectComponent/index.tsx:1-118`
- Modify: `src/renderer/components/EEGExplorationComponent.tsx:16, 205-284`
- Delete: `src/renderer/components/CollectComponent/ConnectModal.tsx`
- Modify: `src/renderer/components/CollectComponent/__tests__/CollectModal.test.tsx`
- Modify: whichever containers pass `availableLSLStreams` to Collect/Explore (find with `grep -rn availableLSLStreams src/renderer/containers`)

**Interfaces:**
- Consumes: `HeadsetSetupContext` / `openHeadsetSetup()` (Task 3).
- Produces: Collect opens setup whenever EEG is on, no run is open, and the headset is neither connected nor connecting. It never dispatches `SetDeviceAvailability(SEARCHING)` itself.

- [ ] **Step 1: Rewrite the Collect test to the new contract (it will fail)**

Replace lines 1-115 of `CollectModal.test.tsx`. Keep `baseProps` (lines 28-59) as they are, except remove `availableLSLStreams`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../../constants/constants';
import { HeadsetSetupContext } from '../../../containers/AppShellContainer';
import Collect, { Props as CollectProps } from '../index';

const mockSetDeviceAvailability = vi.fn();
const openHeadsetSetup = vi.fn();

vi.mock('lab.js', () => ({}));
vi.mock('../PreTestComponent', () => ({
  default: () => <div data-testid="pretest">PreTest</div>,
}));
vi.mock('../RunComponent', () => ({
  default: () => <div data-testid="run">Run</div>,
}));

// baseProps: unchanged from the current file, minus availableLSLStreams

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HeadsetSetupContext.Provider value={{ openHeadsetSetup }}>
    {children}
  </HeadsetSetupContext.Provider>
);
const renderCollect = (overrides: Partial<CollectProps> = {}) =>
  render(
    <Collect {...(baseProps as unknown as CollectProps)} {...overrides} />,
    { wrapper }
  );

describe('Collect headset setup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens headset setup on arrival without starting a Bluetooth search', () => {
    renderCollect();

    expect(openHeadsetSetup).toHaveBeenCalled();
    expect(mockSetDeviceAvailability).not.toHaveBeenCalledWith(
      DEVICE_AVAILABILITY.SEARCHING
    );
  });

  it('does not open headset setup when EEG is disabled', () => {
    renderCollect({ isEEGEnabled: false });

    expect(openHeadsetSetup).not.toHaveBeenCalled();
  });

  it('reopens headset setup when a connected headset drops', () => {
    const { rerender } = renderCollect({
      connectionStatus: CONNECTION_STATUS.CONNECTED,
    });
    expect(openHeadsetSetup).not.toHaveBeenCalled();

    rerender(
      <Collect
        {...(baseProps as unknown as CollectProps)}
        connectionStatus={CONNECTION_STATUS.NOT_YET_CONNECTED}
      />
    );

    expect(openHeadsetSetup).toHaveBeenCalled();
    expect(mockSetDeviceAvailability).not.toHaveBeenCalledWith(
      DEVICE_AVAILABILITY.SEARCHING
    );
  });
});
```

The old "closes the connect modal when CONNECTED" test is deleted. The dialog now stays open on its Connected screen until the student presses "Check my signal". `DEVICES` stays imported for `baseProps`.

Run: `npx vitest run src/renderer/components/CollectComponent/__tests__/CollectModal.test.tsx`
Expected: FAIL. `openHeadsetSetup` is not called, and `SetDeviceAvailability(SEARCHING)` is still dispatched.

- [ ] **Step 2: Rewire Collect**

In `CollectComponent/index.tsx`:
- Delete `import ConnectModal`, the `isConnectModalOpen` state, the close-on-CONNECTED effect (lines 63-67), `handleStartConnect`, `handleConnectModalClose`, and the `<ConnectModal …/>` element.
- Delete `DEVICE_AVAILABILITY`, `DiscoveredStream`, and `availableLSLStreams` from imports and Props if they have no other users.
- Add `import React, { useContext, useEffect, useState } from 'react';` and `import { HeadsetSetupContext } from '../../containers/AppShellContainer';`.
- Replace the reprompt effect (lines 49-61) with:

```tsx
  const { openHeadsetSetup } = useContext(HeadsetSetupContext);

  useEffect(() => {
    if (
      props.isEEGEnabled &&
      !isRunComponentOpen &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTED &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTING
    ) {
      openHeadsetSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.connectionStatus, props.isEEGEnabled, isRunComponentOpen]);
```

The render returns just `<PreTestComponent …/>`. Drop the fragment.

- [ ] **Step 3: Rewire Explore**

In `EEGExplorationComponent.tsx`:
- Delete `import ConnectModal` (line 16), `isConnectModalOpen` + its effect (206-211), `handleStartConnect`, and the `<ConnectModal …/>` element (270-281).
- Add `const { openHeadsetSetup } = useContext(HeadsetSetupContext);`, then `<Button size="lg" onClick={openHeadsetSetup}>`.
- `handleStopConnect` becomes `props.DeviceActions.DisconnectFromDevice();` only. `Cleanup` already resets availability.
- Remove now-unused props (`availableLSLStreams`, `availableDevices`, `deviceAvailability`, `deviceType`) only if `tsc` shows no remaining use, and drop them from the Explore container's props mapping.

- [ ] **Step 4: Delete `ConnectModal.tsx` and verify nothing references it**

```bash
git rm src/renderer/components/CollectComponent/ConnectModal.tsx
grep -rn "ConnectModal" src    # expected: no output
```

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run src/renderer/components/CollectComponent src/renderer/components/HeadsetSetup` → pass. `npx tsc --noEmit` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add -A src/renderer/components/CollectComponent src/renderer/components/EEGExplorationComponent.tsx src/renderer/containers
git commit -m "feat(headset): Collect and Explore use headset setup; remove ConnectModal and auto-scan"
```

---

### Task 5: Signal prep after "Check my signal"

**Files:**
- Create: `src/renderer/components/HeadsetSetup/LiveSignalPrep.tsx`
- Modify: `src/renderer/containers/AppShellContainer.tsx` (context + `onDone`)
- Modify: `src/renderer/components/CollectComponent/index.tsx` (render branch)
- Modify: `src/renderer/components/EEGExplorationComponent.tsx` (connected branch)

**Interfaces:**
- Consumes: `SignalPrep` props `{ device: DEVICES.MUSE | DEVICES.NEUROSITY; sensors: SensorReading[]; onContinue(): void }` (`SignalPrep.tsx:18-22`), `SignalQualityData.signalQuality: Record<string, SIGNAL_QUALITY>` (`constants/interfaces.ts:181-183`).
- Produces: `HeadsetSetupApi` gains:
  ```ts
  /** Worn headset just paired via "Check my signal"; hosts show SignalPrep until finished. */
  signalPrep: DEVICES.MUSE | DEVICES.NEUROSITY | null;
  finishSignalPrep(): void;
  ```

- [ ] **Step 1: Create `LiveSignalPrep`**

```tsx
// src/renderer/components/HeadsetSetup/LiveSignalPrep.tsx
import React, { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import SignalPrep from './SignalPrep';
import { DEVICES, SIGNAL_QUALITY } from '../../constants/constants';
import { SignalQualityData } from '../../constants/interfaces';

interface Props {
  device: DEVICES.MUSE | DEVICES.NEUROSITY;
  observable: Observable<SignalQualityData> | null | undefined;
  /** Connected device's channel names; missing readings show as disconnected. */
  channels: string[];
  onContinue(): void;
}

/** `SignalPrep` fed by the live signal-quality stream. */
export default function LiveSignalPrep({
  device,
  observable,
  channels,
  onContinue,
}: Props) {
  const [quality, setQuality] = useState<Record<string, SIGNAL_QUALITY>>({});

  useEffect(() => {
    const sub = observable?.subscribe((chunk) =>
      setQuality(chunk.signalQuality)
    );
    return () => sub?.unsubscribe();
  }, [observable]);

  return (
    <SignalPrep
      device={device}
      sensors={channels.map((channel) => ({
        channel,
        quality: quality[channel] ?? SIGNAL_QUALITY.DISCONNECTED,
      }))}
      onContinue={onContinue}
    />
  );
}
```

- [ ] **Step 2: Extend the context in `AppShellContainer`**

- Add the two members to `HeadsetSetupApi`, with defaults `signalPrep: null, finishSignalPrep: () => undefined`.
- Add state and an effect:

```tsx
  const [signalPrep, setSignalPrep] = useState<
    DEVICES.MUSE | DEVICES.NEUROSITY | null
  >(null);
  useEffect(() => {
    if (device.connectionStatus !== CONNECTION_STATUS.CONNECTED)
      setSignalPrep(null);
  }, [device.connectionStatus]);
```

- Provider value: `{{ openHeadsetSetup, signalPrep, finishSignalPrep: () => setSignalPrep(null) }}`.
- Dialog `onDone`:

```tsx
        onDone={(d) => {
          setSetupOpen(false);
          if (d === DEVICES.MUSE || d === DEVICES.NEUROSITY) setSignalPrep(d);
        }}
```

- [ ] **Step 3: Render prep in the hosts**

Collect: destructure `signalPrep, finishSignalPrep` from the context. Return:

```tsx
  return signalPrep ? (
    <div className="flex h-full justify-center overflow-auto py-[40px]">
      <LiveSignalPrep
        device={signalPrep}
        observable={props.signalQualityObservable}
        channels={props.connectedDevice?.channels ?? []}
        onContinue={finishSignalPrep}
      />
    </div>
  ) : (
    <PreTestComponent …unchanged props… />
  );
```

Explore: in the `connected ?` branch, render the same `LiveSignalPrep` wrapper when `signalPrep` is set; otherwise render `<ConnectedExplore …/>`. Use `props.signalQualityObservable` and `props.connectedDevice?.channels ?? []`.

- [ ] **Step 4: Typecheck, run the touched tests, commit**

Run: `npx tsc --noEmit` → 0 errors. `npx vitest run src/renderer/components/CollectComponent src/renderer/components/HeadsetSetup` → pass.

```bash
git add src/renderer/components/HeadsetSetup/LiveSignalPrep.tsx src/renderer/containers/AppShellContainer.tsx src/renderer/components/CollectComponent/index.tsx src/renderer/components/EEGExplorationComponent.tsx
git commit -m "feat(headset): signal prep after pairing on Collect and Explore"
```

---

### Task 6: Integrated verification, hardware check, docs

**Files:**
- Modify: `TODOS.md` (Playtest 1 P0 list)
- Modify: `.llms/learnings.md` (append by hand; do not run Prettier on it)

- [ ] **Step 1: Full checks (once, here only)**

Run: `npm run typecheck && npm run lint && npm test && node tests/electron-smoke.mjs`
Expected: 0 type errors, 0 lint errors, all tests pass, smoke PASS. The smoke fails on any console error, which catches a missing Radix `Title`.

- [ ] **Step 2: Electron playtest with the Fixture (agent, via `skill://electron-playtest`)**

Record a screenshot at each check:
1. Home → chip reads `No headset` and is a button. Click → "Which headset are you using?", with `Use fixture data` visible (dev).
2. `Use fixture data` → `Start fixture data` → "Is this your headset?" lists `Fixture (Synthetic EEG)`. Select → `Connect to …` → "… is connected / Nothing is being recorded". The chip reads `Fixture`.
3. Open a workspace → Collect while disconnected. The dialog opens on "Which headset?" and no "Looking for…" appears before a click.
4. Choose Muse → `It’s on` → `Find my headset` (no headset present). "Looking for your Muse…" stays past 10 s with no auto "couldn't find". Press ×. Reopen via the chip, find again: the search starts, with no "already in progress" error in the console.
5. Start a run from Collect. The RunBar chip is not clickable.
6. Check that the `wear` screen's cue bullets render. The global `li { list-style: none }` reset (learnings) may hide `list-disc` in `HeadsetSetup.tsx:294`. If hidden, report it with a screenshot. Do not restyle; it is a design follow-up.

- [ ] **Step 3: Real Muse (human, required by §14 for Bluetooth claims)**

Collect → Muse → wear → `Find my headset`:
- Found → select → Connect → Connected → `Check my signal` → signal prep with live per-sensor labels → `Continue` → pre-run screen.
- Headset off → search → Cancel → back on "Ready". Headset on → `Search again` finds it.
- Connect, then power the headset off. Collect reopens setup at "Which headset?" with no scan until a click.
- Leave the search running with the headset off for 2+ minutes. Note whether the platform ever ends it (→ "couldn't find") or it runs until Cancel. Both are acceptable; record which.

- [ ] **Step 4: Docs**

`TODOS.md`, under "Playtest 1 fixes (P0)":
- Strike "Collect: ConnectModal fails to appear on first navigation…" and "Device chip is display-only…" with `shipped YYYY-MM-DD (WS2, PR #N)`.

Append to `.llms/learnings.md`:

```markdown
## Headset setup: discovery is open-ended and gesture-bound

`HeadsetSetupDialog` (mounted once in `AppShellContainer`, opened via
`HeadsetSetupContext`) replaced `ConnectModal`. Bluetooth search has no timer:
it ends on `DeviceFound`, a rejected/empty `scan()` (→ not found), or
`DeviceActions.CancelSearch` (→ driver `cancelScan()` → `bluetooth:cancelSearch`
rejects the pending `requestDevice()`). `SetDeviceAvailability(SEARCHING)` must
be dispatched synchronously in the click — `searchEpic` calls `scan()` inside
that dispatch, and Web Bluetooth rejects without the user gesture. Which screen
shows is `pairingStep()`; add states there, not in the view.
```

- [ ] **Step 5: Commit and PR**

```bash
git add TODOS.md .llms/learnings.md
git commit -m "docs: WS2 headset setup learnings and TODOS"
gh pr create --title "feat(headset): WS2 headset setup integration" --body "Implements docs/superpowers/plans/2026-09-23-ws2-headset-setup.md. Verification: <paste Step 1 output, Step 2 screenshots, Step 3 hardware notes>."
```
