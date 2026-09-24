# WS5 Early Exit and Incomplete Runs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ending a run early preserves what was recorded as visibly incomplete data, whether the student presses the RunBar button or holds Escape. That data is excluded from Clean, Analyze and workflow badges, and it is never presented as a finished run.

**Architecture:**
- **Abort is teardown.** Every runtime already ends its study when it unmounts. Runtimes gain one optional `onAbort(csv)` callback, which teardown calls with the trials recorded so far. Preview omits it, so stopping a preview records nothing.
- **One settle point.** `RunComponent` owns the single outcome of a run. Whichever reports first wins: `onFinish`, `onAbort`, or a fallback timer.
- **The outcome rides on `Stop`.** `Stop({ data, outcome })` reaches the stop epic, which closes the EEG stream and writes behavior. For an incomplete run it then renames both files to `*.incomplete.csv`.
- **Discovery is untouched.** Every existing discovery filter already skips that suffix. The discovery predicates move into one tested module in main.

**Tech Stack:** React 18, Redux Toolkit, redux-observable 2 / RxJS 7, lab.js 23, jsPsych 8, Electron IPC (main/preload), Vitest.

**Spec:** `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.2, §1.5, §8.4, §11 Workstream 5, §14.

**Skills to read before starting:**
- `.claude/skills/electron-ipc-channel/SKILL.md` — Task 1 adds a channel.
- `.claude/skills/redux-observable-epochs/SKILL.md` — Task 2 edits the recording epic.
- `.claude/skills/electron-playtest/SKILL.md` — Task 5.

## Scope

In this plan (the §11 WS5 engineering bullets that need no new visuals):
- Separate normal-finish and abort callbacks.
- The visible early-exit control and hold-Escape both go through abort. Escape no longer finishes a run normally.
- One shared complete/incomplete outcome for behavior + EEG.
- The EEG stream is closed before either outcome is finalized.
- Incomplete runs are excluded from ordinary discovery, and their files are kept.
- Result-screen copy per §1.2 / §1.5.
- The run screen fits under the RunBar.

Not in this plan:
- **Instruction/practice/main transition screens (§7.2).**
  - Designed in PR #273 (`design/ws5-run-screens`; brief `docs/uxr/2026-09-23-ws5-design-brief.md`).
  - Swapping its `participantScreens.ts` builders into each `experiment.ts` gets its own integration plan after approval.
  - That integration must add `isEEGEnabled` to the params passed to lab.js, because the stillness line reads `this.parameters.isEEGEnabled`.
- **Reveal/delete UI for incomplete recordings.** This belongs to WS6, whose stories include "hidden incomplete data". This plan keeps the files on disk, reachable via Show in folder.
- **An explicit `mode: 'preview' | 'run'` prop.** Nothing consumes it yet. Preview stays distinct because it omits `onAbort` and uses a no-op marker callback. Add the prop when a runtime has to behave differently in Preview.
- **Progress contract (§7.3).** Shipped in #270.

**Sequencing:**
- WS2 (#274) has merged.
- Execute after PR #267 (marker unification) merges. It edits the same runtime files, but only the `eventCallback` lines, which this plan does not touch.
- Code below uses post-#267 signatures: `JsPsychHostConfig` has no `registry`.
- If PR #273 is approved first, Task 4 uses its `RunResult` and `escapeHeld` RunBar prop (see Task 4, Step 4).

## Global Constraints

- "A deliberate click ends immediately; keyboard users can hold Escape briefly to invoke the same action." (§1.5)
- "Do not show a confirmation dialog or offer Resume." (§1.5)
- "Normal completion and early exit use separate runtime callbacks." (§1.5)
- "An early exit preserves collected behavior and EEG as visibly incomplete data." (§1.5)
- "Incomplete recordings are excluded from normal Clean and Analyze selection by default and may be revealed or deleted." (§1.5)
- "The result screen says `Experiment ended early`, never `Recording complete`." (§1.5)
- "After a completed EEG run, `Clean this recording` is primary and `Run another participant` is secondary… A behavior-only run recommends Analyze instead." (§1.2)
- "Close the EEG stream before finalizing either outcome." (§11 WS5)
- "Keep imported studies' internal presentation untouched." "Preserve marker timing and data collected before an early exit." (§11 WS5)
- The overwrite guard from #270 still holds: an incomplete session's number is never reused.
- Existing complete-run file names and contents are unchanged (§14).
- Comments go on definitions, not inside bodies (`.llms/learnings.md`). Mark deliberate corners with `ponytail:`.
- Subagents: skip formatters, project-wide lint, and the full suite. Run only the files named in each task. Task 5 runs everything once.

## Review Focus

1. **The teacher ends a run while an imported study is still loading, or while it sits on its "could not run" error.** No inner runtime exists to report, but the run bar must still clear. Tests: Task 3 (dispatcher reports) and Task 4 (fallback settles).
2. **The study finishes normally in the same moment someone ends it early.** Exactly one `Stop` goes out, as `complete`. Test: Task 4.
3. **A participant taps Escape** (common in keyboard tasks). A tap never ends the run; only a hold does. Test: Task 4.
4. **The next run for the same participant after an early exit.** It must not overwrite the incomplete files. Test: Task 1 (`recordingExists` is still true).
5. **Complete runs must be byte-for-byte what they were.** They keep their names, are still discovered, and are never renamed. Tests: Task 1 (discovery) and Task 2 (the complete run is not marked).

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/main/recordings.ts` | create | session file paths, incomplete marking, discovery predicates |
| `src/main/__tests__/recordings.test.ts` | create | on-disk behavior |
| `src/main/index.ts` (`fs:readWorkspaceRawEEGData`, `fs:readWorkspaceBehaviorData`, `fs:recordingExists`) | modify | use predicates; add `fs:markRecordingIncomplete` |
| `src/preload/index.ts`, `src/renderer/types/electron.d.ts`, `src/renderer/utils/filesystem/storage.ts` | modify | bridge + wrapper for the new channel |
| `src/renderer/actions/experimentActions.ts` | modify | `RunOutcome`, `Stop` payload |
| `src/renderer/epics/experimentEpics.ts` (`startEpic`, `experimentStopEpic`) | modify | remember + close the stream; finalize by outcome |
| `src/renderer/epics/__tests__/experimentEpics.test.ts` | modify | finalize order |
| `src/renderer/components/CollectComponent/PreTestComponent.tsx` (Mousetrap import + `esc` effect) | modify | delete the stray `Mousetrap` `esc` → `Stop` |
| `src/renderer/components/ExperimentRuntime.tsx` | modify | `onAbort` in the contract; the dispatcher reports when no inner runtime exists |
| `src/renderer/components/LabjsExperimentWindow.tsx` | modify | finished/aborting routing; drop Escape → end |
| `src/renderer/utils/jspsych/host.ts` | modify | finished/aborting routing |
| `src/renderer/components/ImportedExperimentWindow.tsx` | modify | a failed host reports abort on teardown |
| `src/renderer/components/__tests__/ExperimentRuntime.test.tsx`, `src/renderer/utils/jspsych/__tests__/host.test.ts` | modify | abort contract |
| `src/renderer/components/CollectComponent/RunComponent.tsx` | modify | settle-once, end early, hold-Escape, result panels, `h-full` root |
| `src/renderer/components/CollectComponent/__tests__/RunComponent.test.tsx` | create | early-exit behavior |
| `src/renderer/containers/AppShellContainer.tsx` | modify | `EndRunContext`; route the RunBar button |
| `src/renderer/components/AppShell/RunBar.tsx` (`onEndRun` docstring) | modify | docstring (no confirm) |

## Dispatch waves (subagent-driven)

Worktree: `git worktree add .worktrees/ws5-early-exit -b feat/ws5-early-exit origin/main` (after #267 lands).

| Wave | Tasks | Why |
|---|---|---|
| 1 | Task 1 ∥ Task 3 | Main/IPC vs runtime files; disjoint |
| 2 | Task 2 | Needs the `markRecordingIncomplete` wrapper (T1) |
| 3 | Task 4 | Needs the `Stop` outcome (T2) and `onAbort` (T3) |
| 4 | Task 5 | Integration verification |

---

### Task 1: Incomplete recordings on disk (main + IPC)

**Files:**
- Create: `src/main/recordings.ts`
- Test: `src/main/__tests__/recordings.test.ts`
- Modify: `src/main/index.ts` — the raw/behavior discovery filters and the `fs:recordingExists` handler
- Modify: `src/preload/index.ts` (after `recordingExists`), `src/renderer/types/electron.d.ts` (after `recordingExists`), `src/renderer/utils/filesystem/storage.ts` (after `storeBehavioralData`)

**Interfaces:**
- Produces (main):
  - `isRawEEGFile(file)`
  - `isBehaviorFile(file)`
  - `recordingExists(workspaceDir, subject, group, session): boolean`
  - `markRecordingIncomplete(workspaceDir, subject, group, session): void`
- Produces (renderer): `markRecordingIncomplete(title: string, subject: string, group: string, session: number): Promise<void>`, exported from `utils/filesystem/storage.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/main/__tests__/recordings.test.ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isBehaviorFile,
  isRawEEGFile,
  markRecordingIncomplete,
  recordingExists,
} from '../recordings';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-recordings-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const write = (rel: string) => {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'x');
};
const csvFiles = () =>
  (fs.readdirSync(dir, { recursive: true }) as string[]).filter((f) =>
    f.endsWith('.csv')
  );

describe('recordings', () => {
  it('complete recordings are discovered', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');
    write('Data/P1/EEG/P1-A-1-raw.csv');

    expect(csvFiles().filter(isRawEEGFile)).toHaveLength(1);
    expect(csvFiles().filter(isBehaviorFile)).toHaveLength(1);
  });

  it('an ended-early run keeps its files and its session, but drops out of discovery', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');
    write('Data/P1/EEG/P1-A-1-raw.csv');

    markRecordingIncomplete(dir, 'P1', 'A', 1);

    expect(csvFiles()).toHaveLength(2);
    expect(csvFiles().filter(isRawEEGFile)).toEqual([]);
    expect(csvFiles().filter(isBehaviorFile)).toEqual([]);
    expect(recordingExists(dir, 'P1', 'A', 1)).toBe(true);
    expect(recordingExists(dir, 'P1', 'A', 2)).toBe(false);
  });

  it('marks a behavior-only run that has no EEG file', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');

    markRecordingIncomplete(dir, 'P1', 'A', 1);

    expect(csvFiles().filter(isBehaviorFile)).toEqual([]);
    expect(recordingExists(dir, 'P1', 'A', 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/main/__tests__/recordings.test.ts`
Expected: FAIL — cannot find module `../recordings`.

- [ ] **Step 3: Implement `recordings.ts`**

```ts
// src/main/recordings.ts
import fs from 'fs';
import path from 'path';

/** Suffix for ended-early runs. Neither discovery predicate below matches it. */
const INCOMPLETE = '.incomplete.csv';

const sessionFiles = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  const dir = path.join(workspaceDir, 'Data', subject);
  const stem = `${subject}-${group}-${session}`;
  return [
    path.join(dir, 'Behavior', `${stem}-behavior.csv`),
    path.join(dir, 'EEG', `${stem}-raw.csv`),
  ];
};

const incomplete = (file: string) => file.replace(/\.csv$/, INCOMPLETE);

/** Raw EEG recordings Clean and the workflow badges may offer; never incomplete ones. */
export const isRawEEGFile = (file: string) => file.endsWith('raw.csv');

/** Behavior files Analyze and the workflow badges may offer; never incomplete ones. */
export const isBehaviorFile = (file: string) => file.endsWith('behavior.csv');

/** True when any artifact of this session exists, complete or ended early. */
export const recordingExists = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) =>
  sessionFiles(workspaceDir, subject, group, session).some(
    (file) => fs.existsSync(file) || fs.existsSync(incomplete(file))
  );

/** Renames the session's behavior and raw EEG files to `*.incomplete.csv`. Nothing is deleted. */
export const markRecordingIncomplete = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  for (const file of sessionFiles(workspaceDir, subject, group, session)) {
    if (fs.existsSync(file)) fs.renameSync(file, incomplete(file));
  }
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/main/__tests__/recordings.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Use it in main and add the channel**

In `src/main/index.ts`:
- Import: `import { isBehaviorFile, isRawEEGFile, markRecordingIncomplete, recordingExists } from './recordings';`
- In `fs:readWorkspaceRawEEGData`: `.filter((filepath) => filepath.slice(-7).includes('raw.csv'))` → `.filter(isRawEEGFile)`
- In `fs:readWorkspaceBehaviorData`: `.filter((filepath) => filepath.slice(-12).includes('behavior.csv'))` → `.filter(isBehaviorFile)`
- Replace the `fs:recordingExists` handler (with its docstring) with:

```ts
/** True when any artifact of a subject/group/session run is on disk, including ended-early ones. */
ipcMain.handle(
  'fs:recordingExists',
  (_event, title, subject, group, session) =>
    recordingExists(getWorkspaceDir(title), subject, group, session)
);

/** Hides an ended-early run from Clean, Analyze and badges; the files stay on disk. */
ipcMain.handle(
  'fs:markRecordingIncomplete',
  (_event, title, subject, group, session) =>
    markRecordingIncomplete(getWorkspaceDir(title), subject, group, session)
);
```

Preload (`src/preload/index.ts`, after `recordingExists`):

```ts
  markRecordingIncomplete: (
    title: string,
    subject: string,
    group: string,
    session: number
  ): Promise<void> =>
    ipcRenderer.invoke(
      'fs:markRecordingIncomplete',
      title,
      subject,
      group,
      session
    ),
```

Types (`src/renderer/types/electron.d.ts`, after `recordingExists`):

```ts
    markRecordingIncomplete: (
      title: string,
      subject: string,
      group: string,
      session: number
    ) => Promise<void>;
```

Wrapper (`storage.ts`, after `storeBehavioralData`):

```ts
/** Marks a session ended early: its files leave ordinary Clean/Analyze discovery. */
export const markRecordingIncomplete = (
  title: string,
  subject: string,
  group: string,
  session: number
): Promise<void> =>
  api().markRecordingIncomplete(title, subject, group, session);
```

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit` → 0 errors.

```bash
git add src/main/recordings.ts src/main/__tests__/recordings.test.ts src/main/index.ts src/preload/index.ts src/renderer/types/electron.d.ts src/renderer/utils/filesystem/storage.ts
git commit -m "feat(recordings): mark ended-early runs incomplete, excluded from discovery"
```

---

### Task 2: `Stop` carries the outcome; the stop epic finalizes in order

**Files:**
- Modify: `src/renderer/actions/experimentActions.ts` (`Stop`)
- Modify: `src/renderer/epics/experimentEpics.ts` (imports, `startEpic`, `experimentStopEpic`)
- Modify: `src/renderer/epics/__tests__/experimentEpics.test.ts`
- Modify: `src/renderer/components/CollectComponent/PreTestComponent.tsx` (Mousetrap import + `esc` effect)
- Modify (compile-only; Task 4 does the final wiring): `RunComponent.tsx` `onFinish`, `AppShellContainer.tsx` `onEndRun`

**Interfaces:**
- Consumes: `markRecordingIncomplete` (Task 1), `closeEEGStream(streamId)` (`utils/filesystem/write.ts`).
- Produces:
  ```ts
  /** How a recorded run ended; an incomplete run is kept but hidden from Clean/Analyze. */
  export type RunOutcome = 'complete' | 'incomplete';
  Stop: createAction<{ data: string; outcome: RunOutcome }, 'STOP'>('STOP')
  ```
- The stop epic runs, in order:
  1. Close the run's EEG stream, if any.
  2. Write behavior, if `data` is non-empty.
  3. If `outcome === 'incomplete'`, mark the session incomplete.
  4. Emit `SetIsRunning(false)`.

  Extra `Stop`s that arrive while finalizing are ignored.

- [ ] **Step 1: Write the failing tests**

Changes to `experimentEpics.test.ts`:
- Add `markRecordingIncomplete: vi.fn().mockResolvedValue(undefined)` to the existing `vi.mock('../../utils/filesystem/storage', …)` factory.
- Make `storeBehavioralData: vi.fn().mockResolvedValue(undefined)`.
- Then append:

```ts
import experimentEpics from '../experimentEpics';
import type { EEGData } from '../../constants/interfaces';
import {
  markRecordingIncomplete,
  storeBehavioralData,
} from '../../utils/filesystem/storage';
import {
  closeEEGStream,
  createEEGWriteStream,
  writeEEGData,
} from '../../utils/filesystem/write';

vi.mock('../../utils/filesystem/write', () => ({
  createEEGWriteStream: vi.fn(),
  writeHeader: vi.fn(),
  writeEEGData: vi.fn(),
  writeEEGEvents: vi.fn().mockResolvedValue(undefined),
  closeEEGStream: vi.fn(),
}));
vi.mock('../../utils/eeg/markerRegistry', () => ({
  resolveMarkerRegistry: () => ({ codeToLabel: {} }),
}));

type Mutable = { experiment: Record<string, unknown>; device: Record<string, unknown> };

const recording = (raw?: Subject<EEGData>) => {
  const s = rootState('My_Custom') as unknown as Mutable;
  s.experiment.subject = 'P1';
  s.experiment.group = 'A';
  if (raw) {
    s.device.connectionStatus = CONNECTION_STATUS.CONNECTED;
    s.device.rawObservable = raw;
    s.device.connectedDevice = { name: 'Fixture', samplingRate: 256, channels: ['AF7'] };
  }
  return s;
};

const runThenStop = async (
  s: Mutable,
  outcome: 'complete' | 'incomplete',
  afterStop?: () => void
) => {
  const actions = new Subject<ExperimentActionType>();
  const state = { value: s } as unknown as import('redux-observable').StateObservable<RootState>;
  const out: ExperimentActionType[] = [];
  const sub = experimentEpics(actions, state, undefined).subscribe((a) => out.push(a));
  actions.next(ExperimentActions.Start());
  await vi.waitFor(() => expect(out).toContainEqual(ExperimentActions.SetIsRunning(true)));
  s.experiment.isRunning = true;
  actions.next(ExperimentActions.Stop({ data: 'csv', outcome }));
  afterStop?.();
  await vi.waitFor(() => expect(out).toContainEqual(ExperimentActions.SetIsRunning(false)));
  sub.unsubscribe();
};

describe('experiment stop', () => {
  afterEach(() => vi.clearAllMocks());

  it('closes the EEG file, then saves behavior, then marks an ended-early run incomplete', async () => {
    const calls: string[] = [];
    vi.mocked(createEEGWriteStream).mockResolvedValue('stream-1');
    vi.mocked(closeEEGStream).mockImplementation(async (id) => {
      calls.push(`close:${id}`);
    });
    vi.mocked(storeBehavioralData).mockImplementation(async () => {
      calls.push('behavior');
    });
    vi.mocked(markRecordingIncomplete).mockImplementation(async () => {
      calls.push('incomplete');
    });
    const raw = new Subject<EEGData>();

    await runThenStop(recording(raw), 'incomplete', () =>
      raw.next({ timestamp: 1, data: [1] } as EEGData)
    );

    expect(calls).toEqual(['close:stream-1', 'behavior', 'incomplete']);
    expect(writeEEGData).not.toHaveBeenCalled();
  });

  it('never marks a completed run', async () => {
    await runThenStop(recording(), 'complete');

    expect(storeBehavioralData).toHaveBeenCalledWith('csv', 'My_Custom', 'P1', 'A', 1);
    expect(markRecordingIncomplete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/renderer/epics/__tests__/experimentEpics.test.ts`
Expected: FAIL — TS/runtime error on `outcome` / `markRecordingIncomplete`, and `closeEEGStream` is never called.

- [ ] **Step 3: Change the action**

In `experimentActions.ts`:

```ts
/** How a recorded run ended; an incomplete run is kept but hidden from Clean/Analyze. */
export type RunOutcome = 'complete' | 'incomplete';
```

and `Stop: createAction<{ data: string; outcome: RunOutcome }, 'STOP'>('STOP'),`.

- [ ] **Step 4: Remember and close the stream; finalize by outcome**

In `experimentEpics.ts`:
- Import `exhaustMap` from `rxjs/operators`, `closeEEGStream` from `../utils/filesystem/write`, `markRecordingIncomplete` from `../utils/filesystem/storage`, and `toast` from `react-toastify`.
- Above `startEpic`:

```ts
/** The open raw-EEG write stream of the current run; closed by the stop epic. */
let activeEEGStream: string | null = null;
```

- In `startEpic`, make `activeEEGStream = null;` the first line inside `mergeMap(async () => {`, and set `activeEEGStream = streamId;` right after the `if (!streamId) return true;` guard.

Replace `experimentStopEpic` with:

```ts
/**
 * Finalizes a run exactly once: closes the EEG stream (the raw subscription
 * already ended on Stop), writes behavior, and for an ended-early run renames
 * both files so Clean and Analyze skip them. Stops arriving meanwhile are ignored.
 */
const experimentStopEpic: Epic<
  ExperimentActionType,
  ExperimentActionType,
  RootState
> = (action$, state$) =>
  action$.pipe(
    filter(isActionOf(ExperimentActions.Stop)),
    filter(() => state$.value.experiment.isRunning),
    exhaustMap(async ({ payload: { data, outcome } }) => {
      const { title, subject, group, session } = state$.value.experiment;
      const streamId = activeEEGStream;
      activeEEGStream = null;
      try {
        if (streamId) await closeEEGStream(streamId);
        if (title) {
          if (data) await storeBehavioralData(data, title, subject, group, session);
          if (outcome === 'incomplete')
            await markRecordingIncomplete(title, subject, group, session);
        }
      } catch (error) {
        toast.error(`Couldn't finish saving this run: ${(error as Error).message}`);
      }
      return ExperimentActions.SetIsRunning(false);
    })
  );
```

- [ ] **Step 5: Remove the stray `Stop` binding and keep callers compiling**

- `PreTestComponent.tsx`: delete the `Mousetrap` import and the `useEffect` that binds `esc` to `props.ExperimentActions.Stop`. It dispatched `Stop` with a KeyboardEvent payload, on a screen that is never running.
- `RunComponent.tsx` `onFinish`: `ExperimentActions.Stop({ data: csv, outcome: 'complete' });` (Task 4 replaces this).
- `AppShellContainer.tsx`: `onEndRun={() => dispatch(ExperimentActions.Stop({ data: '', outcome: 'incomplete' }))}` (Task 4 routes this).
- Confirm no other caller uses the old signature: write `{"action":"references","file":"src/renderer/actions/experimentActions.ts","line":<Stop line>,"symbol":"Stop"}` to `xd://lsp`. Expected: only the files above plus `experimentEpics.ts`.

- [ ] **Step 6: Run tests, typecheck, commit**

Run: `npx vitest run src/renderer/epics/__tests__/experimentEpics.test.ts` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/actions/experimentActions.ts src/renderer/epics src/renderer/components/CollectComponent/PreTestComponent.tsx src/renderer/components/CollectComponent/RunComponent.tsx src/renderer/containers/AppShellContainer.tsx
git commit -m "feat(run): Stop carries outcome; close EEG stream and mark incomplete runs"
```

---

### Task 3: Runtimes report an early teardown through `onAbort`

**Files:**
- Modify: `src/renderer/components/ExperimentRuntime.tsx` (`ExperimentRuntimeProps`, dispatcher)
- Modify: `src/renderer/components/LabjsExperimentWindow.tsx` (`'end'` handler, Escape keydown handler, cleanup)
- Modify: `src/renderer/utils/jspsych/host.ts` (`JsPsychHostConfig`, `createJsPsychHost`)
- Modify: `src/renderer/components/ImportedExperimentWindow.tsx` (host creation effect)
- Test: `src/renderer/components/__tests__/ExperimentRuntime.test.tsx`, `src/renderer/utils/jspsych/__tests__/host.test.ts`

**Interfaces:**
- Produces, on `ExperimentRuntimeProps`:
  ```ts
  /**
   * Called once if the runtime is torn down before the study finishes, with the
   * trials recorded so far ('' if none). Omitted by Preview, which records nothing.
   */
  onAbort?: (csv: string) => void;
  ```
- Rules:
  - A runtime calls exactly one of `onFinish` / `onAbort` per mount.
  - A teardown after `onFinish` reports nothing.
  - Escape no longer ends a lab.js study; Task 4 owns hold-Escape.

- [ ] **Step 1: Write the failing tests**

`host.test.ts`:
- In the existing test "runs a real timeline end to end and reports the CSV", add `const onAbort = vi.fn();` and pass `onAbort` in the config.
- In that test, after `host!.teardown();`, add `expect(onAbort).not.toHaveBeenCalled();`.
- Add:

```ts
  it('teardown mid-run reports the trials so far through onAbort, never onFinish', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const onFinish = vi.fn();
    let host: { teardown: () => void } | undefined;
    const aborted = new Promise<string>((resolve) => {
      host = createJsPsychHost(
        `
        const jsPsych = initJsPsych({});
        jsPsych.run([
          { type: jsPsychCallFunction, func: () => {}, data: { condition: 'Face' } },
          { type: jsPsychHtmlKeyboardResponse, stimulus: 'waiting', data: { condition: 'House' } },
        ]);
        `,
        {
          hostElementId: 'host',
          mapping,
          eventCallback: vi.fn(),
          onFinish,
          onAbort: resolve,
        }
      );
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    host!.teardown();

    expect(await aborted).toContain('1,Face,');
    expect(onFinish).not.toHaveBeenCalled();
  });
```

`ExperimentRuntime.test.tsx` (`importedParams()` already defaults to `kind: 'jspsych'`), add:

```ts
  it('reports an abort itself when torn down before an imported study loads', () => {
    readImportedExperimentFile.mockReturnValue(new Promise(() => undefined));
    const onAbort = vi.fn();
    const { unmount } = render(
      <ExperimentRuntime
        {...baseProps}
        onAbort={onAbort}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{} as never}
        params={importedParams()}
      />
    );

    unmount();

    expect(onAbort).toHaveBeenCalledWith('');
  });

  it('leaves abort reporting to the inner runtime once it is mounted', async () => {
    readImportedExperimentFile.mockResolvedValue('const jsPsych = initJsPsych({});');
    const onAbort = vi.fn();
    const { unmount } = render(
      <ExperimentRuntime
        {...baseProps}
        onAbort={onAbort}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{} as never}
        params={importedParams()}
      />
    );
    await screen.findByTestId('jspsych');

    unmount();

    expect(onAbort).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/host.test.ts src/renderer/components/__tests__/ExperimentRuntime.test.tsx`
Expected: FAIL:
- the jsPsych abort on teardown calls `onFinish`;
- the dispatcher never calls `onAbort`;
- `onAbort` is not in the types.

- [ ] **Step 3: Contract + dispatcher**

In `ExperimentRuntime.tsx`, add `onAbort` (with the docstring above) to `ExperimentRuntimeProps` after `onFinish`. Import `useRef`. Inside `ExperimentRuntime`, after the existing `useEffect`:

```tsx
  const waitingRef = useRef(false);
  waitingRef.current = Boolean(imported) && !resolved;
  const onAbortRef = useRef(runtime.onAbort);
  onAbortRef.current = runtime.onAbort;
  useEffect(
    () => () => {
      if (waitingRef.current) onAbortRef.current?.('');
    },
    []
  );
```

Extend the component docstring: "While an imported study is loading or failed, no inner runtime exists, so the dispatcher itself reports `onAbort('')` on teardown."

- [ ] **Step 4: lab.js window**

In `LabjsExperimentWindow.tsx`, destructure `onAbort`. Replace the `experimentToRun.on('end', …)` handler with:

```ts
    let finished = false;
    let aborting = false;
    const partialCsv = () => {
      try {
        return experimentToRun.global.datastore.exportCsv();
      } catch {
        return '';
      }
    };
    experimentToRun.on('end', () => {
      finished = true;
      if (aborting) onAbort?.(partialCsv());
      else onFinish(experimentToRun.global.datastore.exportCsv());
    });
```

Delete the `experimentToRun.options.events.keydown` Escape handler entirely. Replace the effect cleanup with:

```ts
    return () => {
      try {
        experimentToRun.internals.controller.audioContext.close();
      } catch {
        // No controller before the study prepares; nothing to close.
      }
      if (finished) return;
      aborting = true;
      Promise.resolve()
        .then(() => experimentToRun.end())
        .catch(() => onAbort?.(''));
    };
```

Add `onAbort` to the effect's dependency array. Add a docstring on the component: "Normal end → `onFinish(csv)`; unmount before the end → lab.js `end()` → `onAbort(partial csv)`. Escape is not handled here — see RunComponent's hold-Escape."

- [ ] **Step 5: jsPsych host**

In `host.ts`, add to `JsPsychHostConfig`:

```ts
  /** Teardown before the timeline finished; receives the trials so far. */
  onAbort?: (csv: string) => void;
```

In `createJsPsychHost`, after `let instance…`:

```ts
  let finished = false;
  let aborting = false;
  const route = (csv: string) => {
    finished = true;
    if (aborting) config.onAbort?.(csv);
    else config.onFinish(csv);
  };
```

In the `initJsPsych` wrapper, call `buildJsPsychOptions({ ...config, onFinish: route, getInstance: () => instance, authorOptions })`. In `teardown`, replace the existing try/catch around `abortExperiment` with:

```ts
    if (!finished) {
      aborting = true;
      try {
        instance?.abortExperiment?.();
      } catch {
        config.onAbort?.('');
      }
    }
```

This is why `route` sends to `onAbort`: jsPsych 8's `abortExperiment` resolves `timeline.run()`, and `run()` then calls `on_finish` with the data so far (`node_modules/jspsych/src/JsPsych.ts:150-151, 199-203`).

- [ ] **Step 6: Imported window failure path**

In `ImportedExperimentWindow.tsx`:
- Destructure `onAbort`.
- Pass `onAbort` into the `createJsPsychHost` config.
- Change the catch to:

```tsx
    } catch (failure) {
      setError((failure as Error).message);
      return () => onAbort?.('');
    }
```

- Add `onAbort` to the dependency array.

- [ ] **Step 7: Run tests, typecheck, commit**

Run: `npx vitest run src/renderer/utils/jspsych src/renderer/components/__tests__/ExperimentRuntime.test.tsx src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/components/ExperimentRuntime.tsx src/renderer/components/LabjsExperimentWindow.tsx src/renderer/components/ImportedExperimentWindow.tsx src/renderer/utils/jspsych/host.ts src/renderer/components/__tests__/ExperimentRuntime.test.tsx src/renderer/utils/jspsych/__tests__/host.test.ts
git commit -m "feat(runtime): separate abort callback; Escape no longer ends lab.js studies"
```

---

### Task 4: End early from the RunBar or by holding Escape; honest result screens

**Files:**
- Modify: `src/renderer/components/CollectComponent/RunComponent.tsx`
- Test: `src/renderer/components/CollectComponent/__tests__/RunComponent.test.tsx` (create)
- Modify: `src/renderer/containers/AppShellContainer.tsx` (context + `onEndRun`)
- Modify: `src/renderer/components/AppShell/RunBar.tsx` (`onEndRun` docstring)

**Interfaces:**
- Consumes: `Stop({ data, outcome })` (Task 2), `onAbort` (Task 3).
- Produces:
  ```ts
  // AppShellContainer.tsx
  /** Lets the running Collect screen receive the RunBar's "End experiment early". */
  export const EndRunContext: React.Context<(end: (() => void) | null) => void>;
  ```
- `RunComponent` dispatches exactly one `Stop` per run.

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/components/CollectComponent/__tests__/RunComponent.test.tsx
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONNECTION_STATUS, EXPERIMENTS } from '../../../constants/constants';
import { EndRunContext } from '../../../containers/AppShellContainer';
import Run from '../RunComponent';

const runtime = vi.hoisted(() => ({
  props: null as null | { onFinish(csv: string): void; onAbort?(csv: string): void },
}));

vi.mock('lab.js', () => ({}));
vi.mock('../../ExperimentRuntime', async () => {
  const { useEffect } = await import('react');
  return {
    ExperimentRuntime: (props: { onFinish(csv: string): void; onAbort?(csv: string): void }) => {
      runtime.props = props;
      useEffect(() => () => props.onAbort?.('partial'), [props]);
      return <div data-testid="runtime" />;
    },
  };
});
vi.mock('../../../utils/labjs/functions', () => ({
  getExperimentFromType: () => ({ text: { protocol: {} } }),
}));
vi.mock('../../InputCollect', () => ({ default: () => null }));

const Stop = vi.fn();
const props = {
  type: EXPERIMENTS.N170,
  title: 'Study',
  isRunning: true,
  params: {} as never,
  subject: 'P1',
  experimentObject: {} as never,
  group: 'A',
  session: 1,
  isEEGEnabled: true,
  connectionStatus: CONNECTION_STATUS.CONNECTED,
  ExperimentActions: { Stop, Start: vi.fn(), SetSession: vi.fn() } as never,
};

let endRun: (() => void) | null = null;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EndRunContext.Provider value={(end) => { endRun = end; }}>
    {children}
  </EndRunContext.Provider>
);

describe('ending a run early', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    endRun = null;
  });

  it('keeps the partial run as incomplete and says it ended early', () => {
    const { rerender } = render(<Run {...props} />, { wrapper });

    act(() => endRun!());
    expect(Stop).toHaveBeenCalledWith({ data: 'partial', outcome: 'incomplete' });

    rerender(<Run {...props} isRunning={false} />);
    expect(screen.getByRole('heading', { name: 'Experiment ended early' })).toBeInTheDocument();
    expect(screen.queryByText(/Recording complete/)).toBeNull();
  });

  it('a tap of Escape never ends the run; holding it does', () => {
    vi.useFakeTimers();
    render(<Run {...props} />, { wrapper });

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(400));
    fireEvent.keyUp(window, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(2000));
    expect(Stop).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(1000));
    expect(Stop).toHaveBeenCalledWith({ data: 'partial', outcome: 'incomplete' });
  });

  it('a run that finishes as it is ended early is recorded once, as complete', () => {
    render(<Run {...props} />, { wrapper });

    act(() => runtime.props!.onFinish('full'));
    act(() => endRun!());

    expect(Stop).toHaveBeenCalledTimes(1);
    expect(Stop).toHaveBeenCalledWith({ data: 'full', outcome: 'complete' });
  });
});
```

If `RunComponent` still imports modules that touch Electron at import time (e.g. `utils/eeg`, `lslBridge`), add `vi.mock(<path>, () => ({ emitMarker: vi.fn() }))` and similar for each. The component under test must stay real.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/CollectComponent/__tests__/RunComponent.test.tsx`
Expected: FAIL:
- `EndRunContext` is not exported;
- no `onAbort` is wired;
- Escape does nothing.

- [ ] **Step 3: Shell routing**

In `AppShellContainer.tsx`, add `useCallback, useRef` to the React import (if not already present). After the other contexts:

```tsx
/** Lets the running Collect screen receive the RunBar's "End experiment early". */
export const EndRunContext = createContext<(end: (() => void) | null) => void>(
  () => undefined
);
```

In the component:

```tsx
  const endRun = useRef<(() => void) | null>(null);
  const registerEndRun = useCallback((end: (() => void) | null) => {
    endRun.current = end;
  }, []);
```

`onEndRun={() => endRun.current ? endRun.current() : dispatch(ExperimentActions.Stop({ data: '', outcome: 'incomplete' }))}`. The fallback only fires when no Collect screen is mounted; it keeps the RunBar from getting stuck. Wrap `{children}` in `<EndRunContext.Provider value={registerEndRun}>`.

`RunBar.tsx`, `onEndRun` docstring → `/** Ends the run immediately — no confirm (plan §1.5); data so far is kept as incomplete. */`

- [ ] **Step 4: RunComponent**

Module level, above `Run`:

```tsx
/** How long Escape must be held to end a run early; a tap never ends it. */
const END_EARLY_HOLD_MS = 1000;
/** ponytail: a runtime that never reports on teardown gets this long, then the run ends with no behavior data. */
const ABORT_FALLBACK_MS = 3000;
```

Imports: `useRef` from React; `EndRunContext` next to `RunProgressContext`; `RunOutcome` from `../../actions/experimentActions`.

Replace the `hasFinished` state and the `onFinish` / `handleRunAgain` callbacks with:

```tsx
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [ending, setEnding] = useState(false);
  const settled = useRef(false);
  const registerEndRun = useContext(EndRunContext);

  const settle = useCallback(
    (csv: string, result: RunOutcome) => {
      if (settled.current) return;
      settled.current = true;
      ExperimentActions.Stop({ data: csv, outcome: result });
      setOutcome(result);
    },
    [ExperimentActions]
  );
  const onFinish = useCallback((csv: string) => settle(csv, 'complete'), [settle]);
  const onAbort = useCallback((csv: string) => settle(csv, 'incomplete'), [settle]);
  const endEarly = useCallback(() => setEnding(true), []);

  useEffect(() => {
    if (!isRunning) return undefined;
    registerEndRun(endEarly);
    return () => registerEndRun(null);
  }, [isRunning, endEarly, registerEndRun]);

  useEffect(() => {
    if (!isRunning) return undefined;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.repeat) hold = setTimeout(endEarly, END_EARLY_HOLD_MS);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearTimeout(hold);
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      clearTimeout(hold);
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }, [isRunning, endEarly]);

  useEffect(() => {
    if (!ending) return undefined;
    const fallback = setTimeout(() => onAbort(''), ABORT_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [ending, onAbort]);

  const handleRunAgain = useCallback(() => setOutcome(null), []);
  const handleRunAnother = useCallback(() => {
    setOutcome(null);
    setIsInputCollectOpen(true);
  }, []);
```

Change the existing `isRunning` effect (the one that calls `setGate('off')`) so it resets each run:

```tsx
  useEffect(() => {
    if (!isRunning) return;
    setGate('off');
    setEnding(false);
    settled.current = false;
  }, [isRunning]);
```

Render changes:
- Root: `h-screen` → `h-full`. The run screen sits inside the AppShell content area under the 64px RunBar, so `h-screen` pushes the bottom of every participant screen below the fold. #271 fixed the same bug in `PreTestComponent`.
- Replace every `!hasFinished` with `!outcome`.
- The runtime renders only while not ending: `{isRunning && !ending && (<div …><ExperimentRuntime … onFinish={onFinish} onAbort={onAbort} onProgress={reportProgress} /></div>)}`.
- Add `{isRunning && ending && (<p className="flex h-full items-center justify-center text-ink-muted">Saving what was recorded…</p>)}`.
- Replace the `hasFinished` completion panel with:

```tsx
        {!isRunning && outcome === 'incomplete' && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <h1 className="m-0">Experiment ended early</h1>
            <p className="text-gray-600">
              What <b>{subject}</b> recorded is saved but marked incomplete, so it
              won&apos;t appear in Clean or Analyze.
            </p>
            <Button onClick={handleRunAgain}>Run again</Button>
          </div>
        )}

        {!isRunning && outcome === 'complete' && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <h1 className="m-0">Recording complete 🎉</h1>
            <p className="text-gray-600">
              Saved <b>{subject}</b>&apos;s data.
            </p>
            <div className="flex gap-3 mt-2">
              <Button asChild>
                {isEEGEnabled ? (
                  <Link to={SCREENS.CLEAN.route}>Clean this recording →</Link>
                ) : (
                  <Link to={SCREENS.ANALYZE.route}>Analyze results →</Link>
                )}
              </Button>
              <Button variant="secondary" onClick={handleRunAnother}>
                Run another participant
              </Button>
            </div>
          </div>
        )}
```

**If PR #273 is approved before this task runs:**
- Render its pure-props `RunResult` (`outcome` / `modality` / `subject` + these callbacks) instead of the two inline panels and the "Saving what was recorded…" paragraph. The test keeps asserting the `Experiment ended early` heading either way.
- Wire its `escapeHeld` RunBar prop the way `RunProgressContext` works:
  - `AppShellContainer` owns `const [escapeHeld, setEscapeHeld] = useState(false)`.
  - It exports `EscapeHeldContext = createContext<(held: boolean) => void>(() => undefined)` and provides `setEscapeHeld`.
  - It passes `escapeHeld` through a new optional `AppShell` prop to `RunBar`.
  - In the hold-Escape effect: `setEscapeHeld(true)` when the hold timer starts; `setEscapeHeld(false)` on keyup, when the timer fires, and in the cleanup.

Without #273, the inline panels are interim copy on the current layout.

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run src/renderer/components/CollectComponent` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/components/CollectComponent src/renderer/containers/AppShellContainer.tsx src/renderer/components/AppShell
git commit -m "feat(run): end early via RunBar or held Escape; ended-early result screen"
```

---

### Task 5: Integrated verification and docs

**Files:**
- Modify: `TODOS.md`
- Modify: `.llms/learnings.md` (append by hand; no Prettier)

- [ ] **Step 1: Full checks (once)**

Run: `npm run typecheck && npm run lint && npm test && node tests/electron-smoke.mjs`
Expected: 0 errors, all tests pass, smoke PASS.

- [ ] **Step 2: Electron playtest, Fixture headset (agent, `skill://electron-playtest`)**

For each check, take a screenshot and list `Data/<subject>/` after each run:
1. **Faces/Houses complete run.**
   - The result says "Recording complete 🎉", with `Clean this recording →` / `Run another participant`.
   - Files are `P-A-1-behavior.csv` and `P-A-1-raw.csv`.
   - The raw file's last line is a complete row (the stream was closed).
   - The participant screen's bottom (the Space prompt) is visible without scrolling at 1366×768.
2. **Same participant; press `End experiment early` mid-practice.**
   - The run stops immediately, with no dialog, and "Experiment ended early" appears.
   - Files are `…-behavior.incomplete.csv` (header + rows so far) and `…-raw.incomplete.csv`.
   - The Collect badge count is unchanged, and Clean's dataset list does not show the run.
3. **`Run again`.** The #270 prompt offers session 2, and session 1's incomplete files are byte-identical afterwards.
4. **Escape.** Tap it during a trial: the run continues. Hold it ~1 s: it ends early, same as check 2.
5. **Imported jsPsych study (any bundled sample).** End it early; `.incomplete.csv` contains the trials completed so far.
6. **Behavior-only workspace (EEG off).**
   - A complete run recommends `Analyze results →`.
   - End early: only `…-behavior.incomplete.csv` is written.
7. **Preview on Collect and Design, then `Stop preview`.** No files are written.

- [ ] **Step 3: Docs**

`TODOS.md`:
- Under the Playtest 1 list, note that WS5 early exit shipped (`YYYY-MM-DD, PR #N`).
- Add under Next: "WS5 participant screens (#273): integrate `participantScreens.ts` builders into each built-in `experiment.ts`; pass `isEEGEnabled` to lab.js params."

Append to `.llms/learnings.md`:

```markdown
## Early exit = runtime teardown; incomplete = `*.incomplete.csv`

Runtimes report exactly one of `onFinish(csv)` / `onAbort(csv)` per mount.
Unmounting a running runtime is the abort: lab.js `end()` and jsPsych
`abortExperiment()` both fire their normal end hooks (jsPsych calls
`on_finish` after an abort), so each runtime routes on an `aborting` flag.
`RunComponent` settles once (runtime report, or a 3 s fallback) and
dispatches `Stop({ data, outcome })`; the stop epic closes the EEG stream,
writes behavior, then `fs:markRecordingIncomplete` renames both files to
`*.incomplete.csv`. Every discovery filter (`src/main/recordings.ts`) and the
workflow badges skip that suffix; `recordingExists` still counts it so the
session number is never reused. Before this, "End experiment early" wrote the
partial run as a normal file and `closeEEGStream` was never called.
```

- [ ] **Step 4: Commit and PR**

```bash
git add TODOS.md .llms/learnings.md
git commit -m "docs: WS5 early exit learnings and TODOS"
gh pr create --title "feat(run): WS5 early exit and incomplete runs" --body "Implements docs/superpowers/plans/2026-09-23-ws5-early-exit-incomplete-runs.md. Verification: <Step 1 output, Step 2 screenshots + file listings>."
```
