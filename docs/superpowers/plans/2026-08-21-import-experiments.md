# Import Experiments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a teacher import an externally-authored jsPsych v8 timeline (`.js`) or lab.js study (`.json`), declare its conditions once, and run it through BrainWaves' existing Collect → Clean → Analyze pipeline with real EEG markers.

**Architecture:** `ExperimentWindow` is renamed `LabjsExperimentWindow` and gains a sibling, `ImportedExperimentWindow`, behind a new `ExperimentRuntime` dispatcher — so third-party code lives in exactly one file. BrainWaves owns the `initJsPsych()` call the author's file makes, injecting `display_element`, `override_safe_mode`, and chained `on_trial_start`/`on_finish` hooks that emit numeric markers and a BrainWaves-schema behavioral CSV. Numeric marker codes come from an ordered condition-label list the teacher freezes in a new imported-only **Markers** tab; `buildMarkerRegistry` gains a second entry point so collection and MNE analysis stay derived from that one list.

**Tech Stack:** Electron 39 + React 18 + Redux Toolkit + redux-observable, electron-vite, Vitest + @testing-library/react, `jspsych@8.3.0` + all 52 official `@jspsych/plugin-*` packages, papaparse.

**Spec:** `docs/superpowers/specs/2026-08-21-import-experiments-design.md`

## Global Constraints

- **jsPsych version floor:** `jspsych@^8.3.0`. jsPsych v6 files are **rejected at import** with an actionable message; there is no partial v6 support (spec §3.3).
- **Plugin set:** all **52** official `@jspsych/plugin-*` packages, at the exact versions listed in Task 5. (Spec §2 decision 4 says "53"; upstream `docs/plugins/list-of-plugins.md` enumerates 52, and 52 is the verified count. `@jspsych/extension-*` packages are **out of scope** — npm ≥7 will auto-install `@jspsych/extension-webgazer@^1.2.0` as a declared peer of the three `plugin-webgazer-*` packages; that is expected and harmless.)
- **`EXPERIMENTS.CUSTOM` keeps the value `'Custom'`.** It is persisted as `type` in `appState.json` and re-derived by `getExperimentFromType`; changing the value breaks every saved workspace. Only its **display label** changes, to `Experiment Builder` (spec §2 decision 8).
- **New enum value:** `EXPERIMENTS.IMPORTED = 'Imported'`.
- **The imported file is copied into the workspace** at `<workspace>/experiment/<basename>`; asset folders are referenced in place through the existing `bwfile://` allowlist (spec §2 decision 7, §4.3).
- **Numeric codes are BrainWaves plumbing.** The author's file never declares them. Codes come from the declared label order: `conditionLabels[i]` → code `i + 1` (spec §2 decisions 5 and 6).
- **No conditions declared → the experiment still imports and runs**, and EEG is forced off (spec §4.5, decision 1).
- **Language/style:** TypeScript strict, single quotes, ES5 trailing commas (`prettier` config in `package.json:224-227`). Side effects in epics, never reducers or components (`.llms/CLAUDE.md`).
- **Verification commands:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Single file: `npx vitest run <path>`. Single test: `npx vitest run <path> -t '<name>'`.
- **Playtest is Electron only.** `npm run dev` opens the Electron window. `http://localhost:5173` has no `electronAPI` and no `pyodide://` — never QA there.

### Two deliberate refinements to spec §7 / §5.2

Both preserve the spec's decisions; they only pick the lower-machinery expression of them. Recorded here so a reviewer sees they are intentional, not drift.

1. **Where the imported study's contract is persisted.** §7 lists `experimentReducer.ts` ("Persist condition map, condition key, imported file path"). This plan instead puts an `imported?: ImportedExperiment` field on `ExperimentParameters`. `params` is already the reducer-managed, `appState.json`-persisted bag of "everything the Design screens can change" — `SetParams` + `saveWorkspaceEpic` + `readAndParseState` already carry it end to end. No new action, no new reducer case, no new persistence path.
2. **How the declared conditions are shaped.** §5.2 says `buildMarkerRegistry` gains a constructor taking a `{ label → code }` map. This plan passes an **ordered label array** instead, with code = index + 1. Same information, one source of truth, and a map that disagrees with itself (two labels claiming code 2) cannot be represented.

### Deliberately un-clever, do not "improve" these back

A review pass argued each of these should be bigger or smaller than it is. The
conclusions, so the next reviewer does not re-litigate them:

| Decision | Why it stays |
|---|---|
| **Ship every official plugin, not a "common 10"** | The renderer bundle is built by Vite at package time. A teacher holding the `.dmg` cannot add a plugin, so "install `@jspsych/plugin-x` and restart" is not an actionable message — it is a dead end dressed as help. Measured cost of the full set is ~9 MB of `node_modules` (mean 181 KB/package, mostly sourcemaps and duplicate build formats) next to an already-shipping Pyodide runtime an order of magnitude larger. Bounded disk against unfixable classroom failure. |
| **`plugins.ts` derives global names instead of listing them** | One list, not two. A hand-written name list next to a hand-written import list can drift, and the test that checked them against each other could only ever agree with itself. Deriving from upstream's `info.name` makes the naming rule executable. |
| **`scan.ts` uses a regex, not a brace-matching parser** | Every consumer of `dataKeys` treats it as a *hint* — the Markers tab has an explicit "Add a label the scan missed" input, because randomization and timeline variables make the true value set statically unknowable at any precision. A parser would buy precision nothing downstream can spend. |
| **`assets.ts` is one regex pass, not two** | Two passes (whole literals, then HTML attributes) overlap on the same bytes and make the output order-dependent. One quote-delimited pattern covers both shapes because the path is quote-bounded in both. |
| **`resolveTrialData` reaches past the public API** | `trialObject.data` is `deepCopy(description)` and `processParameters()` never evaluates `data`, so the "public" path returns a `TimelineVariable` **object** for `data: { condition: jsPsych.timelineVariable('c') }` — the single most common way authors attach conditions. Relying on it yields a completed run, a clean behavioral CSV, and an all-zero EEG Marker column. `getDataParameter()` is the resolver; a non-string result now logs loudly rather than silently skipping. |
| **`ExperimentRuntime` dispatcher and its `ResolvedImport` union stay** | There are two real runtimes, not one. Deleting the dispatcher duplicates an async read plus a loading and an error path across `RunComponent` and `PreviewExperimentComponent` — duplication on an error path. The union is the repo's own stated idiom: make bad states unrepresentable (`.llms/CLAUDE.md`). |

### Two upstream facts that will bite whoever ignores them

Both were read out of the jsPsych v8 source, not inferred.

1. **`trialObject.data` is NOT resolved at `on_trial_start`.** `Trial.trialObject` is `deepCopy(description)` (`packages/jspsych/src/timeline/Trial.ts:36`), and `processParameters()` only evaluates keys declared in `pluginInfo.parameters` — `data` is not one of them. So for the near-universal pattern `data: { condition: jsPsych.timelineVariable('cond') }`, `trialObject.data.condition` is still a `TimelineVariable` **object**, not a string. The resolver is `TimelineNode.getDataParameter()` (`packages/jspsych/src/timeline/TimelineNode.ts:162`), which evaluates functions, resolves timeline variables, and merges parent-timeline `data`. It is public on the `Trial` node, and the running `Trial` is reachable at `on_trial_start` because `Timeline.run()` assigns `this.currentChild = childNode` **before** `await childNode.run()` (`packages/jspsych/src/timeline/Timeline.ts:82,87`). Task 7 reads it via `instance.timeline.getLatestNode().getDataParameter()`.
2. **In `on_finish` the same `data` keys are FLAT, not nested.** `Trial.processResult()` spreads them: `{ ...this.getDataParameter(), ...result, trial_type, trial_index, plugin_version }` (`Trial.ts:216-222`). So markers read `resolved[conditionKey]` from `getDataParameter()`, and normalization reads `trial[conditionKey]` off the flat row. Two shapes, one key.

---

## File Structure

**New files**

| Path | Responsibility |
|---|---|
| `src/renderer/experiments/imported/params.ts` | Default `ExperimentParameters` for an imported study, including an empty `imported` contract. |
| `src/renderer/experiments/imported/content.ts` | Overview/background/protocol copy for the imported Design screen. |
| `src/renderer/experiments/imported/index.ts` | The `Experiment` pack `getExperimentFromType(IMPORTED)` returns. |
| `src/renderer/utils/jspsych/normalize.ts` | jsPsych trial rows → BrainWaves behavioral schema + `toBehavioralCsv`. |
| `src/renderer/utils/jspsych/scan.ts` | Static scan of a timeline file: v6 rejection, `data` keys/values, missing plugin globals. |
| `src/renderer/utils/jspsych/plugins.ts` | Every official plugin class, exposed under a global name **derived** from each plugin's own `info.name`. |
| `src/renderer/utils/jspsych/assets.ts` | Rewrite relative asset URLs in an author's source to `bwfile://`. |
| `src/renderer/utils/jspsych/host.ts` | The `initJsPsych` wrapper: option merging, marker emission, teardown. |
| `src/renderer/components/ExperimentRuntime.tsx` | `ExperimentRuntimeProps` + the dispatcher that resolves an imported file and picks a runtime. |
| `src/renderer/components/ImportedExperimentWindow.tsx` | The one file third-party code touches. |
| `src/renderer/components/DesignComponent/ImportedDesignComponent.tsx` | Overview / Markers / Preview tabs for an imported study. |
| `src/main/importExperimentFile.ts` | Copy an imported timeline into a workspace. |

**Modified files**

| Path | Change |
|---|---|
| `src/renderer/components/ExperimentWindow.tsx` → `LabjsExperimentWindow.tsx` | Renamed; props type renamed; internals unchanged. |
| `src/renderer/constants/constants.ts:1-10` | `EXPERIMENTS.IMPORTED`. |
| `src/renderer/constants/interfaces.ts:16-19`, `:32-53` | `ImportedExperiment`, `WorkSpaceInfo.imported`, `ExperimentParameters.imported`. |
| `src/renderer/utils/labjs/functions.ts:21-36` | `getExperimentFromType` handles `IMPORTED`. |
| `src/renderer/utils/eeg/markerRegistry.ts` | `buildMarkerRegistryFromLabels` + `resolveMarkerRegistry`. |
| `src/renderer/epics/experimentEpics.ts:25`, `:49-58`, `:86-98` | Workspace creation merges `imported`; sidecar uses `resolveMarkerRegistry`. |
| `src/renderer/epics/pyodideEpics.ts:190-198` | `event_id` from `resolveMarkerRegistry`. |
| `src/renderer/components/HomeComponent/index.tsx:262-303` | Import card; `Custom` → `Experiment Builder`. |
| `src/renderer/components/DesignComponent/index.tsx:74-88`, `:107-109` | Route `IMPORTED` to `ImportedDesign`; overview icon. |
| `src/renderer/components/CollectComponent/RunComponent.tsx:13`, `:124-130`, `:195-205` | Render `ExperimentRuntime`. |
| `src/renderer/components/PreviewExperimentComponent.tsx:2`, `:19-21`, `:35-45` | Render `ExperimentRuntime`. |
| `src/renderer/utils/filesystem/storage.ts` | `importExperimentFile`, `readImportedExperimentFile`. |
| `src/main/index.ts:31`, `:186-191`, new handler after `:393` | Timeline dialog filters; `fs:importExperimentFile`. |
| `src/preload/index.ts:130-131` | Bridge `importExperimentFile`. |
| `src/renderer/types/electron.d.ts:73` | Type `importExperimentFile`. |
| `src/renderer/app.global.css:63-65`, `:71-73` | Own the `.jspsych-*` overrides instead of orphaning them. |
| `package.json:174-214` | `jspsych` + 52 plugins. |
| `TODOS.md:31`, `ROADMAP.md:34`, `.llms/learnings.md` | jsPsych is a supported runtime, not cleanup debt. |

---

## Task 1: The `IMPORTED` experiment type

**Files:**
- Modify: `src/renderer/constants/constants.ts:1-10`
- Modify: `src/renderer/constants/interfaces.ts:16-19`, `:32-53`
- Create: `src/renderer/experiments/imported/params.ts`
- Create: `src/renderer/experiments/imported/content.ts`
- Create: `src/renderer/experiments/imported/index.ts`
- Modify: `src/renderer/utils/labjs/functions.ts:1-36`
- Test: `src/renderer/utils/labjs/__tests__/getExperimentFromType.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `EXPERIMENTS.IMPORTED = 'Imported'`
  - `type ImportedExperimentKind = 'jspsych' | 'labjs'`
  - `interface ImportedExperiment { kind: ImportedExperimentKind; file: string; conditionKey: string; correctKey: string; conditionLabels: string[]; assetDir?: string }`
  - `ExperimentParameters.imported?: ImportedExperiment`
  - `WorkSpaceInfo.imported?: ImportedExperiment`
  - `getExperimentFromType(EXPERIMENTS.IMPORTED)` → the imported pack

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe` in `src/renderer/utils/labjs/__tests__/getExperimentFromType.test.ts`:

```ts
  it('returns the imported pack, with an empty condition contract, for EXPERIMENTS.IMPORTED', () => {
    const imported = getExperimentFromType(EXPERIMENTS.IMPORTED);

    expect(imported.params.imported).toEqual({
      kind: 'jspsych',
      file: '',
      conditionKey: '',
      correctKey: '',
      conditionLabels: [],
    });
    // Nothing deserializes an imported study through lab.core.deserialize, and
    // the lab.js runtime bails on a missing `type`, so the graph stays empty.
    expect(imported.experimentObject).toEqual({});
    expect(imported.params.stimuli).toEqual([]);
    expect(imported.text.overview.title).toBe('Imported Experiment');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/utils/labjs/__tests__/getExperimentFromType.test.ts`
Expected: FAIL — `Property 'IMPORTED' does not exist on type 'typeof EXPERIMENTS'`.

- [ ] **Step 3: Add the enum value**

In `src/renderer/constants/constants.ts`, replace lines 1-10 with:

```ts
export enum EXPERIMENTS {
  NONE = 'NONE',
  N170 = 'Faces_and_Houses',
  STROOP = 'Stroop_Task',
  MULTI = 'Multi-tasking',
  SEARCH = 'Visual_Search',
  CUSTOM = 'Custom',
  IMPORTED = 'Imported',
  // P300 = 'Visual Oddball',
  // SSVEP = 'Steady-state Visual Evoked Potential',
}
```

- [ ] **Step 4: Add the interfaces**

In `src/renderer/constants/interfaces.ts`, replace lines 16-19 (`WorkSpaceInfo`) with:

```ts
export type ImportedExperimentKind = 'jspsych' | 'labjs';

/**
 * Everything BrainWaves needs in order to run an externally-authored study.
 *
 * `conditionLabels` is ORDERED and the order is the contract: the label at
 * index i carries marker code i + 1. It is frozen in the Markers tab before the
 * first subject runs, because interning labels on encounter order would give
 * subject A `Face=1` and subject B `Face=2` under different randomization —
 * silently corrupting cross-subject ERP averaging. Editing a later label can
 * never renumber an earlier one.
 *
 * An empty `conditionLabels` is a legitimate, first-class state: the study runs
 * behavior-only and EEG is forced off.
 */
export interface ImportedExperiment {
  kind: ImportedExperimentKind;
  /** POSIX path of the copied study file, relative to the workspace directory. */
  file: string;
  /** Author `data` key holding the condition label; '' until chosen. */
  conditionKey: string;
  /** Author `data` key holding trial correctness; '' means "not measured". */
  correctKey: string;
  /** Condition labels in code order. */
  conditionLabels: string[];
  /**
   * Absolute path of the folder the author's relative asset URLs resolve
   * against. Authorized through the same StimulusFileAccess allowlist as
   * custom-experiment stimulus folders.
   */
  assetDir?: string;
}

export interface WorkSpaceInfo {
  title: string;
  type: EXPERIMENTS;
  /** Set only when the workspace is created from an imported study. */
  imported?: ImportedExperiment;
}
```

In the same file, add to `ExperimentParameters` after line 52 (`stimulus4?: StimulusCondition;`):

```ts
  // Set only for EXPERIMENTS.IMPORTED: the externally-authored study and the
  // condition contract the Markers tab froze for it.
  imported?: ImportedExperiment;
```

- [ ] **Step 5: Create the imported params**

Create `src/renderer/experiments/imported/params.ts`:

```ts
import { ExperimentParameters } from '../../constants/interfaces';

/**
 * An imported study owns its own trial structure, timing, and instructions —
 * they live in the author's file, not here. These fields exist only because
 * ExperimentParameters requires them and shared Design/Collect code reads them.
 */
export const params = {
  intro: '',
  iti: 0,
  nbTrials: 0,
  presentationTime: 0,
  randomize: 'sequential',
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimuli: [],
  taskHelp: '',
  trialDuration: 0,
  imported: {
    kind: 'jspsych',
    file: '',
    conditionKey: '',
    correctKey: '',
    conditionLabels: [],
  },
} satisfies ExperimentParameters;
```

- [ ] **Step 6: Create the imported copy**

Create `src/renderer/experiments/imported/content.ts`:

```ts
export const overview = {
  title: `Imported Experiment`,
  overview: `This experiment was written outside BrainWaves. BrainWaves runs it,
  records the responses, and — once you have named its conditions on the Markers
  tab — records EEG markers for it too.`,
  links: [
    {
      address: 'https://www.jspsych.org/latest/overview/timeline/',
      name: 'jsPsych timelines',
    },
  ],
};

// `Experiment.text` requires all three blocks, and DesignComponent renders
// `background`/`protocol` for built-in studies. ImportedDesign does not render
// them — but "not currently rendered" is not a reason to ship copy that lies, so
// these say only what is true of EVERY imported study. In particular there are
// no condition images: an arbitrary timeline has no faces and no houses, and
// `renderConditionIcon` already falls through to its default for ''.
export const background = {
  links: [],
  first_column_statement: `A jsPsych timeline has no condition concept — only a
  free-form "data" bag the author filled in however they liked.`,
  first_column_question: `Which key in that bag names the condition?`,
  second_column_statement: `Marker codes are numbers because MNE recovers events
  from a numeric channel. BrainWaves assigns them from the order you confirm, so
  the same condition gets the same code for every subject.`,
  second_column_question: `Have you frozen the condition order before running
  your first subject?`,
};

export const protocol = {
  title: `What participants are shown`,
  protocol: `Whatever the imported file shows them. Use the Preview tab to watch
  it run before you record anyone.`,
  condition_first_img: ``,
  condition_first_title: ``,
  condition_first: ``,
  condition_second_img: ``,
  condition_second_title: ``,
  condition_second: ``,
  links: [],
};
```

- [ ] **Step 7: Create the imported experiment pack**

Create `src/renderer/experiments/imported/index.ts`:

```ts
import { params } from './params';
import { background, overview, protocol } from './content';
import icon from '../custom/icon.png';
import type { Experiment } from '../../constants/interfaces';

/**
 * An imported study has no BrainWaves-authored lab.js graph. For a jsPsych
 * timeline there is nothing to deserialize at all; for an imported lab.js study
 * the graph is read back from the copied file by ExperimentRuntime, because
 * saveWorkspaceEpic deliberately omits `experimentObject` from appState.json.
 * Either way this stays empty, which is what LabjsExperimentWindow's
 * `!experimentObject?.type` guard expects.
 */
export default {
  icon,
  experimentObject: {},
  params,
  text: { protocol, background, overview },
} as Experiment;
```

- [ ] **Step 8: Wire `getExperimentFromType`**

In `src/renderer/utils/labjs/functions.ts`, add after line 13:

```ts
import importedExperiment from '../../experiments/imported';
```

and replace lines 21-36 with:

```ts
export function getExperimentFromType(type: EXPERIMENTS): Experiment {
  switch (type) {
    case EXPERIMENTS.MULTI:
      return multitaskingExperiment;
    case EXPERIMENTS.STROOP:
      return stroopExperiment;
    case EXPERIMENTS.SEARCH:
      return searchExperiment;
    case EXPERIMENTS.CUSTOM:
      return customExperiment;
    case EXPERIMENTS.IMPORTED:
      return importedExperiment;
    case EXPERIMENTS.NONE:
    case EXPERIMENTS.N170:
    default:
      return facesHousesExperiment;
  }
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run src/renderer/utils/labjs/__tests__/getExperimentFromType.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 10: Commit**

```bash
git add src/renderer/constants/constants.ts src/renderer/constants/interfaces.ts \
  src/renderer/experiments/imported src/renderer/utils/labjs/functions.ts \
  src/renderer/utils/labjs/__tests__/getExperimentFromType.test.ts
git commit -m "feat: add EXPERIMENTS.IMPORTED experiment type and contract"
```

---

## Task 2: Marker codes from declared labels

The one genuine convergence point (spec §5.2). Collection writes numeric codes into the CSV `Marker` column and the `-events.json` sidecar; MNE filters events with an `event_id` map whose **values** must equal those codes. Both ends must keep deriving from one function or epochs vanish with no error.

**Files:**
- Modify: `src/renderer/utils/eeg/markerRegistry.ts`
- Modify: `src/renderer/epics/experimentEpics.ts:25`, `:86-98`
- Modify: `src/renderer/epics/pyodideEpics.ts:190-198` (and its `buildMarkerRegistry` import)
- Test: `src/renderer/utils/eeg/__tests__/markerRegistry.test.ts`

**Interfaces:**
- Consumes: `ImportedExperiment`, `ExperimentParameters` (Task 1); existing `MarkerRegistry { codeToLabel: Record<number, string>; eventId: Record<string, number> }`.
- Produces:
  - `buildMarkerRegistryFromLabels(labels?: string[]): MarkerRegistry`
  - `resolveMarkerRegistry(params: ExperimentParameters | null | undefined): MarkerRegistry`

- [ ] **Step 1: Write the failing tests**

Change the import on line 9 of `src/renderer/utils/eeg/__tests__/markerRegistry.test.ts` to:

```ts
import {
  buildMarkerRegistry,
  buildMarkerRegistryFromLabels,
  resolveMarkerRegistry,
} from '../markerRegistry';
```

and append to the end of the file:

```ts
describe('buildMarkerRegistryFromLabels', () => {
  it('assigns codes from the declared order, 1-based', () => {
    expect(buildMarkerRegistryFromLabels(['Face', 'House'])).toEqual({
      codeToLabel: { 1: 'Face', 2: 'House' },
      eventId: { Face: 1, House: 2 },
    });
  });

  it('keeps position as the code, so editing a later label cannot renumber an earlier one', () => {
    const before = buildMarkerRegistryFromLabels(['Face', 'House', 'Scene']);
    const after = buildMarkerRegistryFromLabels(['Face', 'House', 'Object']);
    expect(after.eventId.Face).toBe(before.eventId.Face);
    expect(after.eventId.House).toBe(before.eventId.House);
    expect(after.eventId.Object).toBe(3);
  });

  it('skips blanks and duplicates without shifting the codes of other labels', () => {
    const { codeToLabel, eventId } = buildMarkerRegistryFromLabels([
      'Face',
      '',
      'House',
      'Face',
    ]);
    expect(eventId).toEqual({ Face: 1, House: 3 });
    expect(codeToLabel).toEqual({ 1: 'Face', 3: 'House' });
  });

  it('produces a round-trippable code<->label pair', () => {
    const { eventId, codeToLabel } = buildMarkerRegistryFromLabels([
      'Face',
      'House',
    ]);
    for (const [label, code] of Object.entries(eventId)) {
      expect(codeToLabel[code]).toBe(label);
    }
  });

  it('returns empty maps for no labels', () => {
    expect(buildMarkerRegistryFromLabels([])).toEqual({
      codeToLabel: {},
      eventId: {},
    });
    expect(buildMarkerRegistryFromLabels()).toEqual({
      codeToLabel: {},
      eventId: {},
    });
  });
});

describe('resolveMarkerRegistry', () => {
  const imported = {
    kind: 'jspsych' as const,
    file: 'experiment/task.js',
    conditionKey: 'condition',
    correctKey: '',
    conditionLabels: ['Face', 'House'],
  };

  it('uses the declared labels for an imported experiment', () => {
    expect(
      resolveMarkerRegistry({ stimuli: [], imported } as never).eventId
    ).toEqual({ Face: 1, House: 2 });
  });

  it('uses the stimuli for a built-in or custom experiment', () => {
    expect(
      resolveMarkerRegistry({
        stimuli: [stimC('Face1', EVENTS.STIMULUS_1, 'Face')],
      } as never).eventId
    ).toEqual({ Face: 1 });
  });

  it('returns empty maps when there are no params at all', () => {
    expect(resolveMarkerRegistry(null)).toEqual({
      codeToLabel: {},
      eventId: {},
    });
    expect(resolveMarkerRegistry(undefined)).toEqual({
      codeToLabel: {},
      eventId: {},
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/markerRegistry.test.ts`
Expected: FAIL — `buildMarkerRegistryFromLabels is not a function`.

- [ ] **Step 3: Implement both entry points**

In `src/renderer/utils/eeg/markerRegistry.ts`, change line 22 to:

```ts
import { ExperimentParameters, Stimulus } from '../../constants/interfaces';
```

and append to the end of the file:

```ts
/**
 * Build the registry from the ordered condition labels an imported experiment
 * declared in its Markers tab. `labels[i]` gets code `i + 1`.
 *
 * Position — not sequence-of-kept-entries — is the code, so a blank or repeated
 * label leaves a gap rather than renumbering its neighbours. MNE does not care
 * about gaps; a code that silently changed meaning between two subjects would
 * be a corrupted ERP average.
 */
export const buildMarkerRegistryFromLabels = (
  labels: string[] = []
): MarkerRegistry => {
  const codeToLabel: Record<number, string> = {};
  const eventId: Record<string, number> = {};
  labels.forEach((label, index) => {
    if (!label || label in eventId) return;
    const code = index + 1;
    codeToLabel[code] = label;
    eventId[label] = code;
  });
  return { codeToLabel, eventId };
};

/**
 * The single entry point collection AND analysis use. Built-in and Custom
 * experiments derive their codes from stimuli; imported experiments derive them
 * from the labels frozen in the Markers tab. Anything that needs codes must
 * come through here — a hand-built code map anywhere else is the bug this
 * module exists to prevent.
 */
export const resolveMarkerRegistry = (
  params: ExperimentParameters | null | undefined
): MarkerRegistry =>
  params?.imported
    ? buildMarkerRegistryFromLabels(params.imported.conditionLabels)
    : buildMarkerRegistry(params?.stimuli);
```

- [ ] **Step 4: Route the events sidecar through the resolver**

In `src/renderer/epics/experimentEpics.ts`, change line 25 to:

```ts
import { resolveMarkerRegistry } from '../utils/eeg/markerRegistry';
```

and replace lines 86-98 with:

```ts
        // Persist the code->label event map next to the CSV so the numeric
        // Marker codes are self-describing. Same registry the analysis uses,
        // so the recording and its interpretation can never drift apart.
        const { codeToLabel } = resolveMarkerRegistry(
          state$.value.experiment.params
        );
        void writeEEGEvents(
          state$.value.experiment.title,
          state$.value.experiment.subject,
          state$.value.experiment.group,
          state$.value.experiment.session,
          codeToLabel
        );
```

- [ ] **Step 5: Route MNE's `event_id` through the resolver**

In `src/renderer/epics/pyodideEpics.ts`, replace lines 190-198 with:

```ts
      // event_id VALUES must equal the numeric codes written to the CSV Marker
      // column. resolveMarkerRegistry keeps this in lockstep with collection for
      // built-in, custom, AND imported experiments — array indices silently
      // dropped codes that didn't match.
      const { eventId } = resolveMarkerRegistry(state$.value.experiment.params);
      if (Object.keys(eventId).length > 0) {
        epochEvents(worker, eventId, -0.1, 0.8);
      }
```

and change that file's `buildMarkerRegistry` import to `resolveMarkerRegistry`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/eeg src/renderer/epics && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/utils/eeg/markerRegistry.ts \
  src/renderer/utils/eeg/__tests__/markerRegistry.test.ts \
  src/renderer/epics/experimentEpics.ts src/renderer/epics/pyodideEpics.ts
git commit -m "feat: derive marker codes from declared condition labels"
```

---

## Task 3: Behavioral schema normalization

`src/renderer/utils/behavior/compute.js` is strict in ways nothing enforces today. Read these before writing the mapping:

- `filterData` (`compute.js:127`) drops any row with a **falsy** `trial_number`. jsPsych's `trial_index` is **0-based**, so trial 0 disappears unless it is made 1-based.
- It compares `correct_response` against the **string** `'true'` (`compute.js:143`, `:189`, `:227`, `:276`) and `response_given` against `'yes'`/`'no'` (`compute.js:22`, `:136`).
- It drops rows whose `phase` is exactly `'practice'` (`compute.js:127`).
- **Every** reaction-time and accuracy plot filters `correct_response === 'true'`. A study that declares no correctness field therefore plots nothing — which is why the Markers tab makes "not measured" an explicit, teacher-chosen option that counts every trial as correct, instead of silently emitting a blank column.

**Files:**
- Create: `src/renderer/utils/jspsych/normalize.ts`
- Test: `src/renderer/utils/jspsych/__tests__/normalize.test.ts`

**Interfaces:**
- Consumes: `papaparse` (already a dependency, `package.json:196`).
- Produces:
  - `interface BehavioralRow { trial_number: number; condition: string; reaction_time: number | ''; response_given: 'yes' | 'no'; correct_response: 'true' | 'false'; phase: string; trial_type: string; time_elapsed: number | '' }`
  - `interface BehavioralMapping { conditionKey: string; correctKey: string }`
  - `BEHAVIORAL_COLUMNS: (keyof BehavioralRow)[]`
  - `normalizeJsPsychTrials(trials: Record<string, unknown>[], mapping: BehavioralMapping): BehavioralRow[]`
  - `toBehavioralCsv(rows: BehavioralRow[]): string`

- [ ] **Step 1: Write the failing tests**

Create `src/renderer/utils/jspsych/__tests__/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import { normalizeJsPsychTrials, toBehavioralCsv } from '../normalize';
import { aggregateBehaviorDataToSave } from '../../behavior/compute';

const mapping = { conditionKey: 'condition', correctKey: 'correct' };

const trials = [
  {
    trial_index: 0,
    trial_type: 'image-keyboard-response',
    time_elapsed: 1200,
    rt: 480,
    response: 'f',
    condition: 'Face',
    correct: true,
  },
  {
    trial_index: 1,
    trial_type: 'image-keyboard-response',
    time_elapsed: 2600,
    rt: 610,
    response: 'j',
    condition: 'House',
    correct: true,
  },
  {
    trial_index: 2,
    trial_type: 'image-keyboard-response',
    time_elapsed: 4000,
    rt: null,
    response: null,
    condition: 'House',
    correct: false,
  },
];

describe('normalizeJsPsychTrials', () => {
  it('makes trial_number 1-based so compute.js does not drop the first trial', () => {
    // compute.js filterData: .filter((row) => row.trial_number && ...)
    expect(normalizeJsPsychTrials(trials, mapping).map((r) => r.trial_number)).toEqual(
      [1, 2, 3]
    );
  });

  it('derives response_given from rt and emits the strings compute.js compares', () => {
    const rows = normalizeJsPsychTrials(trials, mapping);
    expect(rows.map((r) => r.response_given)).toEqual(['yes', 'yes', 'no']);
    expect(rows.map((r) => r.correct_response)).toEqual([
      'true',
      'true',
      'false',
    ]);
    expect(rows.map((r) => r.reaction_time)).toEqual([480, 610, '']);
  });

  it('reads the condition off the flat trial row under the chosen key', () => {
    expect(
      normalizeJsPsychTrials(trials, {
        conditionKey: 'condition',
        correctKey: '',
      }).map((r) => r.condition)
    ).toEqual(['Face', 'House', 'House']);
  });

  it('counts every trial as correct when correctness is not measured', () => {
    const rows = normalizeJsPsychTrials(trials, {
      conditionKey: 'condition',
      correctKey: '',
    });
    expect(rows.every((r) => r.correct_response === 'true')).toBe(true);
  });

  it('defaults phase to test and passes practice through verbatim', () => {
    expect(
      normalizeJsPsychTrials(
        [
          { trial_index: 0, rt: 100, condition: 'Face', phase: 'practice' },
          { trial_index: 1, rt: 100, condition: 'Face' },
        ],
        mapping
      ).map((r) => r.phase)
    ).toEqual(['practice', 'test']);
  });

  it('emits an empty condition when no condition key has been chosen', () => {
    const rows = normalizeJsPsychTrials(trials, {
      conditionKey: '',
      correctKey: '',
    });
    expect(rows.every((r) => r.condition === '')).toBe(true);
  });
});

describe('toBehavioralCsv', () => {
  it('emits a stable header even with no rows', () => {
    expect(toBehavioralCsv([])).toBe(
      'trial_number,condition,reaction_time,response_given,correct_response,phase,trial_type,time_elapsed'
    );
  });

  it('round-trips through Papa.parse into rows compute.js aggregates', () => {
    const csv = toBehavioralCsv(normalizeJsPsychTrials(trials, mapping));
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

    const aggregated = aggregateBehaviorDataToSave(
      [
        {
          data: parsed.data,
          meta: { ...parsed.meta, datafile: '/tmp/Sub1-GroupA-1-behavior.csv' },
        },
      ],
      false
    );

    expect(aggregated).toEqual([
      {
        subject: 'Sub1',
        group: 'GroupA',
        session: '1',
        RT_Face: 480,
        Accuracy_Face: 100,
        RT_House: 610,
        Accuracy_House: 50,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/normalize.test.ts`
Expected: FAIL — cannot resolve `../normalize`.

- [ ] **Step 3: Implement the mapping**

Create `src/renderer/utils/jspsych/normalize.ts`:

```ts
/**
 * jsPsych trial rows -> the behavioral schema `utils/behavior/compute.js`
 * consumes.
 *
 * WHAT compute.js ACTUALLY REQUIRES (nothing else enforces it):
 *   - `filterData` (compute.js:127) drops rows with a FALSY `trial_number`, and
 *     jsPsych's `trial_index` is 0-based — so it must become 1-based or the
 *     first trial of every session disappears.
 *   - `correct_response` is compared against the STRING 'true', and
 *     `response_given` against 'yes'/'no'.
 *   - a `phase` of exactly 'practice' is excluded from analysis.
 *   - every RT and accuracy plot filters `correct_response === 'true'`, so a
 *     study with no correctness field would plot nothing. That is why
 *     `correctKey: ''` is an explicit teacher choice meaning "not measured —
 *     count every trial as correct", not a silent default.
 *
 * The jsPsych `data` parameter's keys arrive FLAT on each row: Trial.ts:216-222
 * spreads `getDataParameter()` into the result alongside `trial_type`,
 * `trial_index`, and `plugin_version`. (At `on_trial_start` the same keys are
 * still nested under `trialObject.data` and unresolved — see host.ts.)
 */
import Papa from 'papaparse';

export interface BehavioralRow {
  trial_number: number;
  condition: string;
  reaction_time: number | '';
  response_given: 'yes' | 'no';
  correct_response: 'true' | 'false';
  phase: string;
  trial_type: string;
  time_elapsed: number | '';
}

export interface BehavioralMapping {
  /** Author `data` key holding the condition label; '' emits a blank column. */
  conditionKey: string;
  /** Author `data` key holding correctness; '' means "not measured". */
  correctKey: string;
}

const DEFAULT_PHASE = 'test';

export const BEHAVIORAL_COLUMNS: (keyof BehavioralRow)[] = [
  'trial_number',
  'condition',
  'reaction_time',
  'response_given',
  'correct_response',
  'phase',
  'trial_type',
  'time_elapsed',
];

export const normalizeJsPsychTrials = (
  trials: Record<string, unknown>[],
  { conditionKey, correctKey }: BehavioralMapping
): BehavioralRow[] =>
  trials.map((trial, index) => {
    const rt = trial.rt;
    const responded = typeof rt === 'number' && Number.isFinite(rt);
    const trialIndex = trial.trial_index;
    const timeElapsed = trial.time_elapsed;
    const condition = conditionKey === '' ? undefined : trial[conditionKey];
    const phase = trial.phase;

    return {
      trial_number: typeof trialIndex === 'number' ? trialIndex + 1 : index + 1,
      condition: condition == null ? '' : String(condition),
      reaction_time: responded ? (rt as number) : '',
      response_given: responded ? 'yes' : 'no',
      correct_response:
        correctKey === '' || trial[correctKey] ? 'true' : 'false',
      phase:
        typeof phase === 'string' && phase.length > 0 ? phase : DEFAULT_PHASE,
      trial_type: typeof trial.trial_type === 'string' ? trial.trial_type : '',
      time_elapsed: typeof timeElapsed === 'number' ? timeElapsed : '',
    };
  });

export const toBehavioralCsv = (rows: BehavioralRow[]): string =>
  Papa.unparse(rows, { columns: BEHAVIORAL_COLUMNS });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/normalize.test.ts`
Expected: PASS (8 tests).

If the round-trip assertion's aggregate numbers disagree with what `compute.js` returns, do **not** change `normalize.ts`. Read the printed value, confirm it follows from `compute.js:20-42` (House has one correct and one incorrect trial, and only `response_given === 'yes'` rows enter `RT_*`), and correct the expectation.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/utils/jspsych/normalize.ts \
  src/renderer/utils/jspsych/__tests__/normalize.test.ts
git commit -m "feat: normalize jsPsych trials into the BrainWaves behavioral schema"
```

---

## Task 4: Static scan of an imported timeline

Three jobs, all before anything runs: reject jsPsych v6, surface the `data` keys the teacher must choose between, and name any plugin global this build does not ship (spec §8: "A missing plugin global is named explicitly at import rather than dying mid-run with a bare `ReferenceError`").

The v6 tokens are verified upstream: `jsPsych.init(...)` was the v6 entry point (`jspsych.js` v6.3.1) and is a `MigrationError` getter in v8 (`packages/jspsych/src/migration.ts`); `jsPsych.ALL_KEYS`/`NO_KEYS` were v6 constants (`core.ALL_KEYS = 'allkeys'`) and are migration getters in v8; v6 named plugins by **string** (`type: 'html-keyboard-response'`) where v8 requires a class and throws `Plugin not recognized` (`Trial.ts:39-43`).

**Files:**
- Create: `src/renderer/utils/jspsych/scan.ts`
- Test: `src/renderer/utils/jspsych/__tests__/scan.test.ts`

**Interfaces:**
- Consumes: nothing. The shipped global names are injected, so this module stays independent of the 52-import plugin barrel and its tests stay fast.
- Produces:
  - `interface TimelineScan { v6Token: string | null; dataKeys: Record<string, string[]>; missingPluginGlobals: string[] }`
  - `scanTimelineSource(source: string, shippedPluginGlobals: string[]): TimelineScan`
  - `V6_MIGRATION_URL: string`

- [ ] **Step 1: Write the failing tests**

Create `src/renderer/utils/jspsych/__tests__/scan.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scanTimelineSource } from '../scan';

const SHIPPED = ['jsPsychHtmlKeyboardResponse', 'jsPsychImageKeyboardResponse'];

describe('scanTimelineSource — v6 rejection', () => {
  it('rejects jsPsych.init(...)', () => {
    expect(
      scanTimelineSource('jsPsych.init({ timeline: [] });', SHIPPED).v6Token
    ).toBe('jsPsych.init');
  });

  it('rejects jsPsych.NO_KEYS and jsPsych.ALL_KEYS', () => {
    expect(scanTimelineSource('choices: jsPsych.NO_KEYS', SHIPPED).v6Token).toBe(
      'jsPsych.NO_KEYS'
    );
    expect(
      scanTimelineSource('choices: jsPsych.ALL_KEYS', SHIPPED).v6Token
    ).toBe('jsPsych.ALL_KEYS');
  });

  it('rejects string plugin types', () => {
    expect(
      scanTimelineSource(
        "var t = { type: 'html-keyboard-response', stimulus: 'hi' };",
        SHIPPED
      ).v6Token
    ).toBe("type: 'html-keyboard-response'");
  });

  it('accepts a v8 file', () => {
    const source = `
      const jsPsych = initJsPsych({});
      const trial = { type: jsPsychHtmlKeyboardResponse, stimulus: 'hi' };
      jsPsych.run([trial]);
    `;
    expect(scanTimelineSource(source, SHIPPED).v6Token).toBeNull();
  });
});

describe('scanTimelineSource — data keys', () => {
  it('collects keys and their string values from data object literals', () => {
    const source = `
      const a = { type: jsPsychImageKeyboardResponse,
        data: { condition: 'Face', phase: 'practice' } };
      const b = { type: jsPsychImageKeyboardResponse,
        data: { condition: "House", correct: true } };
    `;
    expect(scanTimelineSource(source, SHIPPED).dataKeys).toEqual({
      condition: ['Face', 'House'],
      phase: ['practice'],
      correct: [],
    });
  });

  it('records a key with no literal values when the value is dynamic', () => {
    // The key is real; its values only exist at runtime. The Markers tab is
    // where the teacher adds the values the scan could not see.
    expect(
      scanTimelineSource(
        `const a = { data: { condition: jsPsych.timelineVariable('cond') } };`,
        SHIPPED
      ).dataKeys
    ).toEqual({ condition: [] });
  });

  it('returns no keys for a timeline with no data parameter', () => {
    expect(
      scanTimelineSource('const a = { stimulus: "hi" };', SHIPPED).dataKeys
    ).toEqual({});
  });
});

describe('scanTimelineSource — missing plugin globals', () => {
  it('names every referenced plugin global this build does not ship', () => {
    const source = `
      const a = { type: jsPsychHtmlKeyboardResponse };
      const b = { type: jsPsychSurveyText };
      const c = { type: jsPsychVideoButtonResponse };
    `;
    expect(scanTimelineSource(source, SHIPPED).missingPluginGlobals).toEqual([
      'jsPsychSurveyText',
      'jsPsychVideoButtonResponse',
    ]);
  });

  it('does not report jsPsychModule, which the host always installs', () => {
    expect(
      scanTimelineSource('jsPsychModule.ParameterType.HTML_STRING', SHIPPED)
        .missingPluginGlobals
    ).toEqual([]);
  });

  it('reports nothing when every referenced plugin ships', () => {
    expect(
      scanTimelineSource(
        'const a = { type: jsPsychImageKeyboardResponse };',
        SHIPPED
      ).missingPluginGlobals
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/scan.test.ts`
Expected: FAIL — cannot resolve `../scan`.

- [ ] **Step 3: Implement the scan**

Create `src/renderer/utils/jspsych/scan.ts`:

```ts
/**
 * Static scan of an author's timeline file, run BEFORE anything is evaluated.
 *
 * It exists because the three ways an import fails are all cheap to see in the
 * text and expensive to see at runtime:
 *   - a jsPsych v6 file dies mid-run with a MigrationError or a bare
 *     "Plugin not recognized";
 *   - a plugin this build does not ship dies with a bare ReferenceError;
 *   - the condition key is unguessable, because jsPsych has NO condition
 *     concept — `data` is a free-form bag and `trial_type` holds the plugin
 *     name, so Face and House trials rendered by image-keyboard-response are
 *     byte-identical there.
 *
 * The scan is deliberately NOT a source of truth for condition values: it only
 * sees branches spelled out as literals. Randomization, conditional nodes, and
 * timeline variables make the full set unknowable statically, which is exactly
 * why the Markers tab lets the teacher add what the scan missed.
 */

export const V6_MIGRATION_URL =
  'https://www.jspsych.org/7.0/support/migration-v7/';

export interface TimelineScan {
  /** Non-null when the file is jsPsych v6: the v6-only token that proved it. */
  v6Token: string | null;
  /** Every `data:` key found, mapped to the string literal values seen for it. */
  dataKeys: Record<string, string[]>;
  /** `jsPsych*` globals the file references but this build does not ship. */
  missingPluginGlobals: string[];
}

const V6_PATTERNS: RegExp[] = [
  /\bjsPsych\s*\.\s*init\s*\(/,
  /\bjsPsych\s*\.\s*NO_KEYS\b/,
  /\bjsPsych\s*\.\s*ALL_KEYS\b/,
  // v6 named plugins by string; v8 requires the plugin class.
  /\btype\s*:\s*(['"])[a-z][a-z0-9-]*\1/,
];

/** Reported token per pattern; null means "report the matched text itself". */
const V6_TOKENS: (string | null)[] = [
  'jsPsych.init',
  'jsPsych.NO_KEYS',
  'jsPsych.ALL_KEYS',
  null,
];

const DATA_BLOCK = /\bdata\s*:\s*\{([\s\S]*?)\}/g;
const PROPERTY = /([A-Za-z_$][\w$]*)\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)?/g;
const PLUGIN_GLOBAL = /\bjsPsych[A-Z][A-Za-z0-9]*\b/g;
const ALWAYS_INSTALLED = new Set(['jsPsychModule']);

const findV6Token = (source: string): string | null => {
  for (let i = 0; i < V6_PATTERNS.length; i += 1) {
    const match = V6_PATTERNS[i].exec(source);
    if (match) return V6_TOKENS[i] ?? match[0];
  }
  return null;
};

/**
 * Best-effort `data` key/value hints.
 *
 * The block regex is non-greedy to the first `}`, so a nested object or a `}`
 * inside a string truncates the block and later keys in it are missed. That is
 * acceptable BY DESIGN, and the design decision is the point: every consumer
 * treats this as a hint, and the Markers tab's "Add a label the scan missed"
 * input is the real completeness guarantee. A truncated block can also surface a
 * spurious inner key (`data: { a: { b: 1 } }` offers both `a` and `b`), which
 * costs one unused row in a dropdown. Randomization, conditional nodes,
 * and timeline variables make the full value set unknowable statically no matter
 * how good the parser is — so a brace-matching scanner would buy precision that
 * nothing downstream is able to spend.
 */
const collectDataKeys = (source: string): Record<string, string[]> => {
  const dataKeys: Record<string, string[]> = {};
  DATA_BLOCK.lastIndex = 0;
  let block: RegExpExecArray | null = DATA_BLOCK.exec(source);
  while (block) {
    const body = block[1];
    PROPERTY.lastIndex = 0;
    let property: RegExpExecArray | null = PROPERTY.exec(body);
    while (property) {
      const [, key, single, double, template] = property;
      const values = (dataKeys[key] ??= []);
      const value = single ?? double ?? template;
      if (value !== undefined && !values.includes(value)) values.push(value);
      property = PROPERTY.exec(body);
    }
    block = DATA_BLOCK.exec(source);
  }
  return dataKeys;
};

const collectMissingPluginGlobals = (
  source: string,
  shippedPluginGlobals: string[]
): string[] => {
  const shipped = new Set(shippedPluginGlobals);
  const missing = new Set<string>();
  PLUGIN_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null = PLUGIN_GLOBAL.exec(source);
  while (match) {
    const name = match[0];
    if (!shipped.has(name) && !ALWAYS_INSTALLED.has(name)) missing.add(name);
    match = PLUGIN_GLOBAL.exec(source);
  }
  return [...missing].sort();
};

export const scanTimelineSource = (
  source: string,
  shippedPluginGlobals: string[]
): TimelineScan => ({
  v6Token: findV6Token(source),
  dataKeys: collectDataKeys(source),
  missingPluginGlobals: collectMissingPluginGlobals(
    source,
    shippedPluginGlobals
  ),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/scan.test.ts && npx tsc --noEmit`
Expected: PASS (10 tests), no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/utils/jspsych/scan.ts \
  src/renderer/utils/jspsych/__tests__/scan.test.ts
git commit -m "feat: statically scan imported timelines for version, data keys, plugins"
```

---

## Task 5: Ship every official jsPsych plugin

A script-style timeline writes `type: jsPsychHtmlKeyboardResponse` — a bare global. Each plugin package's own IIFE build assigns exactly that name (`makeRollupConfig("jsPsychHtmlKeyboardResponse")` in `packages/plugin-html-keyboard-response/rollup.config.mjs`), and the rule `'jsPsych' + CamelCase(dashed name)` was verified against **all 52** upstream `rollup.config.mjs` files with zero mismatches.

These are **ESM** imports, not the IIFE builds, on purpose: each plugin's published `dist/index.js` begins `import { ParameterType } from 'jspsych';`, and only Vite can resolve that bare specifier. `window.jsPsychModule` is still installed (Task 7), because a plugin IIFE or an author defining an inline plugin expects it.

**Files:**
- Modify: `package.json:174-214`
- Create: `src/renderer/utils/jspsych/plugins.ts`
- Test: `src/renderer/utils/jspsych/__tests__/plugins.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `JSPSYCH_PLUGIN_GLOBALS: Record<string, unknown>` — 52 entries, keyed by global name.

- [ ] **Step 1: Install the dependencies**

Add to the `dependencies` block of `package.json`, keeping it alphabetically sorted (`@jspsych/*` sorts after `@electron-toolkit/*` and before `@neurosity/pipes`; `jspsych` sorts between `events` and `lab.js`):

```json
    "@jspsych/plugin-animation": "^2.1.0",
    "@jspsych/plugin-audio-button-response": "^2.1.1",
    "@jspsych/plugin-audio-keyboard-response": "^2.2.0",
    "@jspsych/plugin-audio-slider-response": "^2.1.1",
    "@jspsych/plugin-browser-check": "^2.1.0",
    "@jspsych/plugin-call-function": "^2.1.0",
    "@jspsych/plugin-canvas-button-response": "^2.1.0",
    "@jspsych/plugin-canvas-keyboard-response": "^2.2.0",
    "@jspsych/plugin-canvas-slider-response": "^2.1.0",
    "@jspsych/plugin-categorize-animation": "^2.1.0",
    "@jspsych/plugin-categorize-html": "^2.1.0",
    "@jspsych/plugin-categorize-image": "^2.1.0",
    "@jspsych/plugin-cloze": "^2.2.0",
    "@jspsych/plugin-external-html": "^2.1.0",
    "@jspsych/plugin-free-sort": "^2.1.0",
    "@jspsych/plugin-fullscreen": "^2.1.0",
    "@jspsych/plugin-html-audio-response": "^2.1.1",
    "@jspsych/plugin-html-button-response": "^2.1.0",
    "@jspsych/plugin-html-keyboard-response": "^2.2.0",
    "@jspsych/plugin-html-slider-response": "^2.1.0",
    "@jspsych/plugin-html-video-response": "^2.1.0",
    "@jspsych/plugin-iat-html": "^2.1.0",
    "@jspsych/plugin-iat-image": "^2.1.0",
    "@jspsych/plugin-image-button-response": "^2.2.0",
    "@jspsych/plugin-image-keyboard-response": "^2.2.0",
    "@jspsych/plugin-image-slider-response": "^2.1.0",
    "@jspsych/plugin-initialize-camera": "^2.1.0",
    "@jspsych/plugin-initialize-microphone": "^2.1.0",
    "@jspsych/plugin-instructions": "^2.1.0",
    "@jspsych/plugin-maxdiff": "^2.1.0",
    "@jspsych/plugin-mirror-camera": "^2.1.0",
    "@jspsych/plugin-preload": "^2.1.0",
    "@jspsych/plugin-reconstruction": "^2.1.0",
    "@jspsych/plugin-resize": "^2.1.0",
    "@jspsych/plugin-same-different-html": "^2.1.0",
    "@jspsych/plugin-same-different-image": "^2.1.0",
    "@jspsych/plugin-serial-reaction-time": "^2.1.0",
    "@jspsych/plugin-serial-reaction-time-mouse": "^2.2.0",
    "@jspsych/plugin-sketchpad": "^2.1.0",
    "@jspsych/plugin-survey-html-form": "^2.1.0",
    "@jspsych/plugin-survey-likert": "^2.2.0",
    "@jspsych/plugin-survey-multi-choice": "^2.2.1",
    "@jspsych/plugin-survey-multi-select": "^2.1.1",
    "@jspsych/plugin-survey-text": "^2.1.1",
    "@jspsych/plugin-video-button-response": "^2.1.1",
    "@jspsych/plugin-video-keyboard-response": "^2.2.0",
    "@jspsych/plugin-video-slider-response": "^2.1.1",
    "@jspsych/plugin-virtual-chinrest": "^3.1.0",
    "@jspsych/plugin-visual-search-circle": "^2.2.0",
    "@jspsych/plugin-webgazer-calibrate": "^2.1.0",
    "@jspsych/plugin-webgazer-init-camera": "^2.1.0",
    "@jspsych/plugin-webgazer-validate": "^2.1.0",
```

and:

```json
    "jspsych": "^8.3.0",
```

Then:

```bash
npm install
```

Expect npm to also pull `@jspsych/extension-webgazer` (a declared peer of the three `plugin-webgazer-*` packages, 9 KB, imports only `jspsych`) and `detect-browser` (a real dependency of `plugin-browser-check`). Both are expected.

- [ ] **Step 2: Write the failing test**

Create `src/renderer/utils/jspsych/__tests__/plugins.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import { JSPSYCH_PLUGIN_GLOBALS } from '../plugins';

describe('JSPSYCH_PLUGIN_GLOBALS', () => {
  // These assert the DERIVATION against names upstream controls. An earlier
  // draft asserted "there are exactly 52 keys" and "every key round-trips
  // through camelCase(info.name)" against a hand-written key list — a test that
  // could only ever agree with itself, and that would need editing every time
  // jsPsych published a plugin. Deleted.
  it('exposes html-keyboard-response under the global a script timeline writes', () => {
    expect(JSPSYCH_PLUGIN_GLOBALS.jsPsychHtmlKeyboardResponse).toBe(
      jsPsychHtmlKeyboardResponse
    );
  });

  it('derives a jsPsych-prefixed CamelCase global for every shipped plugin', () => {
    const names = Object.keys(JSPSYCH_PLUGIN_GLOBALS);
    // Floor, not an exact count: publishing a 53rd plugin should not fail CI.
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) {
      expect(name, name).toMatch(/^jsPsych[A-Z][A-Za-z0-9]*$/);
      expect(typeof JSPSYCH_PLUGIN_GLOBALS[name], name).toBe('function');
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/plugins.test.ts`
Expected: FAIL — cannot resolve `../plugins`.

- [ ] **Step 4: Create the plugin barrel**

Create `src/renderer/utils/jspsych/plugins.ts`:

```ts
/**
 * Every official jsPsych v8 plugin, exposed under the global name a script-style
 * timeline expects.
 *
 * A timeline writes `type: jsPsychHtmlKeyboardResponse` — a bare global — so the
 * class must be reachable as a global before the author's file is evaluated.
 *
 * The global name is DERIVED, never hand-written: each plugin class carries its
 * own `info.name` (the dashed package name), and every upstream package passes
 * `makeRollupConfig('jsPsych' + CamelCase(info.name))` in its rollup config.
 * Deriving it means the name list cannot drift from the import list, because
 * there is only one list.
 *
 * ESM imports, not each package's IIFE build: the published `dist/index.js`
 * starts with `import { ParameterType } from 'jspsych'`, and only Vite can
 * resolve that bare specifier.
 *
 * WHY THE WHOLE SET, and not a "common" subset. The renderer bundle is built by
 * Vite at package time, so a teacher holding the .dmg cannot add a plugin. A
 * timeline referencing an unshipped plugin can NEVER run on their machine, and
 * no message we show them is actionable — "npm install and rebuild" is not a
 * thing a classroom can do. Measured cost of the full set: ~9 MB of node_modules
 * (mean 181 KB/package, mostly sourcemaps and duplicate build formats; the
 * tree-shaken bundle contribution is a fraction of that) against a Pyodide
 * runtime an order of magnitude larger that already ships. Bounded, one-time
 * disk cost against an unfixable classroom failure — take the disk.
 * `@jspsych/extension-*` still stays out: extensions only fire for trials that
 * declare them in the author's own file, so shipping them wholesale buys nothing.
 */
import jsPsychAnimation from '@jspsych/plugin-animation';
import jsPsychAudioButtonResponse from '@jspsych/plugin-audio-button-response';
import jsPsychAudioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import jsPsychAudioSliderResponse from '@jspsych/plugin-audio-slider-response';
import jsPsychBrowserCheck from '@jspsych/plugin-browser-check';
import jsPsychCallFunction from '@jspsych/plugin-call-function';
import jsPsychCanvasButtonResponse from '@jspsych/plugin-canvas-button-response';
import jsPsychCanvasKeyboardResponse from '@jspsych/plugin-canvas-keyboard-response';
import jsPsychCanvasSliderResponse from '@jspsych/plugin-canvas-slider-response';
import jsPsychCategorizeAnimation from '@jspsych/plugin-categorize-animation';
import jsPsychCategorizeHtml from '@jspsych/plugin-categorize-html';
import jsPsychCategorizeImage from '@jspsych/plugin-categorize-image';
import jsPsychCloze from '@jspsych/plugin-cloze';
import jsPsychExternalHtml from '@jspsych/plugin-external-html';
import jsPsychFreeSort from '@jspsych/plugin-free-sort';
import jsPsychFullscreen from '@jspsych/plugin-fullscreen';
import jsPsychHtmlAudioResponse from '@jspsych/plugin-html-audio-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlSliderResponse from '@jspsych/plugin-html-slider-response';
import jsPsychHtmlVideoResponse from '@jspsych/plugin-html-video-response';
import jsPsychIatHtml from '@jspsych/plugin-iat-html';
import jsPsychIatImage from '@jspsych/plugin-iat-image';
import jsPsychImageButtonResponse from '@jspsych/plugin-image-button-response';
import jsPsychImageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import jsPsychImageSliderResponse from '@jspsych/plugin-image-slider-response';
import jsPsychInitializeCamera from '@jspsych/plugin-initialize-camera';
import jsPsychInitializeMicrophone from '@jspsych/plugin-initialize-microphone';
import jsPsychInstructions from '@jspsych/plugin-instructions';
import jsPsychMaxdiff from '@jspsych/plugin-maxdiff';
import jsPsychMirrorCamera from '@jspsych/plugin-mirror-camera';
import jsPsychPreload from '@jspsych/plugin-preload';
import jsPsychReconstruction from '@jspsych/plugin-reconstruction';
import jsPsychResize from '@jspsych/plugin-resize';
import jsPsychSameDifferentHtml from '@jspsych/plugin-same-different-html';
import jsPsychSameDifferentImage from '@jspsych/plugin-same-different-image';
import jsPsychSerialReactionTime from '@jspsych/plugin-serial-reaction-time';
import jsPsychSerialReactionTimeMouse from '@jspsych/plugin-serial-reaction-time-mouse';
import jsPsychSketchpad from '@jspsych/plugin-sketchpad';
import jsPsychSurveyHtmlForm from '@jspsych/plugin-survey-html-form';
import jsPsychSurveyLikert from '@jspsych/plugin-survey-likert';
import jsPsychSurveyMultiChoice from '@jspsych/plugin-survey-multi-choice';
import jsPsychSurveyMultiSelect from '@jspsych/plugin-survey-multi-select';
import jsPsychSurveyText from '@jspsych/plugin-survey-text';
import jsPsychVideoButtonResponse from '@jspsych/plugin-video-button-response';
import jsPsychVideoKeyboardResponse from '@jspsych/plugin-video-keyboard-response';
import jsPsychVideoSliderResponse from '@jspsych/plugin-video-slider-response';
import jsPsychVirtualChinrest from '@jspsych/plugin-virtual-chinrest';
import jsPsychVisualSearchCircle from '@jspsych/plugin-visual-search-circle';
import jsPsychWebgazerCalibrate from '@jspsych/plugin-webgazer-calibrate';
import jsPsychWebgazerInitCamera from '@jspsych/plugin-webgazer-init-camera';
import jsPsychWebgazerValidate from '@jspsych/plugin-webgazer-validate';

type PluginClass = { info?: { name?: string } };

const ALL_PLUGINS: PluginClass[] = [
  jsPsychAnimation,
  jsPsychAudioButtonResponse,
  jsPsychAudioKeyboardResponse,
  jsPsychAudioSliderResponse,
  jsPsychBrowserCheck,
  jsPsychCallFunction,
  jsPsychCanvasButtonResponse,
  jsPsychCanvasKeyboardResponse,
  jsPsychCanvasSliderResponse,
  jsPsychCategorizeAnimation,
  jsPsychCategorizeHtml,
  jsPsychCategorizeImage,
  jsPsychCloze,
  jsPsychExternalHtml,
  jsPsychFreeSort,
  jsPsychFullscreen,
  jsPsychHtmlAudioResponse,
  jsPsychHtmlButtonResponse,
  jsPsychHtmlKeyboardResponse,
  jsPsychHtmlSliderResponse,
  jsPsychHtmlVideoResponse,
  jsPsychIatHtml,
  jsPsychIatImage,
  jsPsychImageButtonResponse,
  jsPsychImageKeyboardResponse,
  jsPsychImageSliderResponse,
  jsPsychInitializeCamera,
  jsPsychInitializeMicrophone,
  jsPsychInstructions,
  jsPsychMaxdiff,
  jsPsychMirrorCamera,
  jsPsychPreload,
  jsPsychReconstruction,
  jsPsychResize,
  jsPsychSameDifferentHtml,
  jsPsychSameDifferentImage,
  jsPsychSerialReactionTime,
  jsPsychSerialReactionTimeMouse,
  jsPsychSketchpad,
  jsPsychSurveyHtmlForm,
  jsPsychSurveyLikert,
  jsPsychSurveyMultiChoice,
  jsPsychSurveyMultiSelect,
  jsPsychSurveyText,
  jsPsychVideoButtonResponse,
  jsPsychVideoKeyboardResponse,
  jsPsychVideoSliderResponse,
  jsPsychVirtualChinrest,
  jsPsychVisualSearchCircle,
  jsPsychWebgazerCalibrate,
  jsPsychWebgazerInitCamera,
  jsPsychWebgazerValidate,
];

const toGlobalName = (dashedName: string) =>
  'jsPsych' +
  dashedName
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

export const JSPSYCH_PLUGIN_GLOBALS: Record<string, unknown> =
  Object.fromEntries(
    ALL_PLUGINS.map((plugin, index) => {
      const name = plugin?.info?.name;
      if (!name) {
        // Crash at module load, naming the culprit, rather than hand a timeline
        // an `undefined` global and let it die later as a bare ReferenceError.
        throw new Error(
          `plugins.ts: the plugin at index ${index} has no info.name — it is ` +
            `probably resolving to its CJS build. Add that package to ` +
            `renderer.optimizeDeps.include in vite.config.ts.`
        );
      }
      return [toGlobalName(name), plugin];
    })
  );
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/plugins.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests), no type errors.

If the barrel throws `plugins.ts: the plugin at index N has no info.name`, that
package is resolving to its CJS build. Do **not** special-case it — add it to
`renderer.optimizeDeps.include` in `vite.config.ts:47-52` and re-run. The throw
names the index so `ALL_PLUGINS[N]` identifies the package directly.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/renderer/utils/jspsych/plugins.ts \
  src/renderer/utils/jspsych/__tests__/plugins.test.ts
git commit -m "feat: ship every official jsPsych plugin under its script global"
```

---

## Task 6: Rewrite relative asset URLs to `bwfile://`

An author's file says `stimulus: 'stimuli/face1.png'`. In production the renderer is loaded with `mainWindow.loadFile(...)` (`src/main/index.ts:745`), so that relative URL resolves inside the app bundle; in dev it resolves against the Vite dev server. Both are wrong. The authorized folder is served over `bwfile://` (`src/main/index.ts:805`), and `img-src`/`media-src` already allow it (`src/renderer/index.html:7`).

This is a text transform with an explicit, tested scope: a quoted literal that is entirely a relative asset path, and a `src`/`href`/`poster` attribute inside an HTML string. Anything else is left alone and, if it was an asset, fails visibly in Preview rather than silently.

**Files:**
- Create: `src/renderer/utils/jspsych/assets.ts`
- Test: `src/renderer/utils/jspsych/__tests__/assets.test.ts`

**Interfaces:**
- Consumes: `toStimulusFileUrl` from `src/shared/stimulusUrl.ts`; `pathe` (aliased as `path` in both the renderer build and vitest).
- Produces: `rewriteRelativeAssetUrls(source: string, assetDir: string): string`

- [ ] **Step 1: Write the failing tests**

Create `src/renderer/utils/jspsych/__tests__/assets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rewriteRelativeAssetUrls } from '../assets';
import { toStimulusFileUrl } from '../../../../shared/stimulusUrl';

const DIR = '/Users/teacher/Documents/faces';
const url = (relative: string) => toStimulusFileUrl(`${DIR}/${relative}`);

describe('rewriteRelativeAssetUrls', () => {
  it('rewrites a literal that is entirely a relative asset path', () => {
    expect(rewriteRelativeAssetUrls("stimulus: 'stimuli/face1.png'", DIR)).toBe(
      `stimulus: '${url('stimuli/face1.png')}'`
    );
  });

  it('rewrites ./-prefixed and multi-segment paths', () => {
    expect(rewriteRelativeAssetUrls('"./a/b/c.jpg"', DIR)).toBe(
      `"${url('a/b/c.jpg')}"`
    );
  });

  it('rewrites audio and video extensions too', () => {
    expect(rewriteRelativeAssetUrls("'sounds/beep.mp3'", DIR)).toBe(
      `'${url('sounds/beep.mp3')}'`
    );
    expect(rewriteRelativeAssetUrls("'clips/intro.mp4'", DIR)).toBe(
      `'${url('clips/intro.mp4')}'`
    );
  });

  it('rewrites src attributes inside an HTML string', () => {
    expect(
      rewriteRelativeAssetUrls(
        `stimulus: '<img src="stimuli/face1.png" width="400">'`,
        DIR
      )
    ).toBe(`stimulus: '<img src="${url('stimuli/face1.png')}" width="400">'`);
  });

  it('rewrites src attributes with escaped quotes', () => {
    expect(
      rewriteRelativeAssetUrls(
        'stimulus: "<img src=\\"stimuli/face1.png\\">"',
        DIR
      )
    ).toBe(`stimulus: "<img src=\\"${url('stimuli/face1.png')}\\">"`);
  });

  it('leaves absolute and already-schemed URLs alone', () => {
    const source = [
      "'https://example.org/a.png'",
      "'data:image/png;base64,AAAA'",
      "'/absolute/a.png'",
    ].join('\n');
    expect(rewriteRelativeAssetUrls(source, DIR)).toBe(source);
  });

  it('leaves non-asset strings alone', () => {
    const source = "prompt: 'Press f for face', choices: ['f', 'j']";
    expect(rewriteRelativeAssetUrls(source, DIR)).toBe(source);
  });

  it('returns the source unchanged when there is no asset folder', () => {
    const source = "stimulus: 'stimuli/face1.png'";
    expect(rewriteRelativeAssetUrls(source, '')).toBe(source);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/assets.test.ts`
Expected: FAIL — cannot resolve `../assets`.

- [ ] **Step 3: Implement the rewrite**

Create `src/renderer/utils/jspsych/assets.ts`:

```ts
/**
 * Point an author's relative asset URLs at their authorized folder.
 *
 * A jsPsych file written for a web server says `stimulus: 'stimuli/face1.png'`.
 * In production BrainWaves loads the renderer with `mainWindow.loadFile(...)`,
 * so that resolves inside the app bundle; in dev it resolves against the Vite
 * dev server. The folder the teacher actually picked is reachable only over
 * `bwfile://`, whose allowlist is the gate on disk access.
 *
 * SCOPE: a relative asset path that is quote-delimited on both sides. That one
 * shape covers both cases that matter, because the path is quote-bounded in
 * both. Anything else is untouched — an asset URL built at runtime by string
 * concatenation 404s visibly in Preview rather than being silently mangled.
 */
import path from 'pathe';
import { toStimulusFileUrl } from '../../../shared/stimulusUrl';

const ASSET_EXTENSIONS =
  'png|jpe?g|gif|webp|svg|bmp|mp3|wav|ogg|m4a|mp4|webm|ogv';

/** A relative path ending in an asset extension — no scheme, not root-anchored. */
const RELATIVE_ASSET = new RegExp(
  `^(?![A-Za-z][\\w+.-]*:|//|/|#)[\\w.@ -]+(?:/[\\w.@ -]+)*\\.(?:${ASSET_EXTENSIONS})$`,
  'i'
);

/**
 * A relative asset path with the SAME quote on both sides.
 *
 *   stimulus: 'stimuli/face1.png'          → the whole string literal
 *   stimulus: '<img src="stimuli/a.png">'  → an attribute inside a literal
 *
 * One pass, deliberately. An earlier draft ran two — one for whole literals, one
 * for `src|href|poster` attributes — which overlapped on the same bytes and made
 * the result depend on pass order. The delimiter is captured and re-emitted, so
 * an escaped inner quote (\") inside a double-quoted literal survives untouched.
 */
const DELIMITED_ASSET = new RegExp(
  `(\\\\?['"\`])` +
    `((?![A-Za-z][\\w+.-]*:|//|/|#)[\\w.@ -]+(?:/[\\w.@ -]+)*` +
    `\\.(?:${ASSET_EXTENSIONS}))\\1`,
  'gi'
);

export const rewriteRelativeAssetUrls = (
  source: string,
  assetDir: string
): string =>
  assetDir
    ? source.replace(
        DELIMITED_ASSET,
        (_match, quote: string, relative: string) =>
          `${quote}${toStimulusFileUrl(path.join(assetDir, relative))}${quote}`
      )
    : source;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/assets.test.ts && npx tsc --noEmit`
Expected: PASS (8 tests), no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/utils/jspsych/assets.ts \
  src/renderer/utils/jspsych/__tests__/assets.test.ts
git commit -m "feat: rewrite imported relative asset URLs to bwfile://"
```

---

## Task 7: The jsPsych host

BrainWaves owns the `initJsPsych()` call the author's file makes. Three consequences, all load-bearing:

- **`override_safe_mode: true` is mandatory and dev will never show you why.** jsPsych's constructor checks `window.location.protocol == "file:"` and, unless overridden, sets `use_webaudio = false` and disables video preloading (`packages/jspsych/src/JsPsych.ts:72-84`). Production uses `loadFile`; dev uses `http://localhost:5173` and looks perfect. Same prod-only class of bug `TODOS.md:13` already tracks for Pyodide.
- **Author callbacks chain, never clobber.**
- **Marker timing carries a known offset.** `on_trial_start` fires before the plugin writes DOM (`Trial.ts:63-72`). For a synchronous plugin the write happens later in the same task, so a `requestAnimationFrame` callback scheduled from `on_trial_start` lands after the write and before paint. For an **async** plugin (audio/video preload) the write happens in a later task and the marker is early. This ordering is read from source, not measured — Task 15 measures it.

**Files:**
- Create: `src/renderer/utils/jspsych/host.ts`
- Test: `src/renderer/utils/jspsych/__tests__/host.test.ts`

**Interfaces:**
- Consumes: `JSPSYCH_PLUGIN_GLOBALS` (Task 5); `BehavioralMapping`, `normalizeJsPsychTrials`, `toBehavioralCsv` (Task 3); `MarkerRegistry` (Task 2); `initJsPsych` from `jspsych`.
- Produces:
  - `resolveTrialData(instance: unknown, trialObject: Record<string, unknown> | undefined): Record<string, unknown>`
  - `interface JsPsychHostConfig { hostElementId: string; mapping: BehavioralMapping; registry: MarkerRegistry; eventCallback: (code: number, time: number) => void; onFinish: (csv: string) => void }`
  - `buildJsPsychOptions(args: JsPsychHostConfig & { getInstance: () => unknown; authorOptions: Record<string, unknown> }): Record<string, unknown>`
  - `interface JsPsychHost { teardown: () => void }`
  - `createJsPsychHost(source: string, config: JsPsychHostConfig): JsPsychHost`

- [ ] **Step 1: Write the failing tests**

Create `src/renderer/utils/jspsych/__tests__/host.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildJsPsychOptions,
  createJsPsychHost,
  resolveTrialData,
} from '../host';
import { buildMarkerRegistryFromLabels } from '../../eeg/markerRegistry';

const registry = buildMarkerRegistryFromLabels(['Face', 'House']);
const mapping = { conditionKey: 'condition', correctKey: '' };

const fakeInstance = (data: Record<string, unknown>) => ({
  timeline: { getLatestNode: () => ({ getDataParameter: () => data }) },
});

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

describe('resolveTrialData', () => {
  it('prefers the running Trial node, because trialObject.data is unresolved', () => {
    // jsPsych keeps `trialObject` as deepCopy(description): a
    // `jsPsych.timelineVariable('cond')` in `data` is still a TimelineVariable
    // OBJECT at on_trial_start. getDataParameter() is the resolver.
    expect(
      resolveTrialData(fakeInstance({ condition: 'House' }), {
        data: { condition: { placeholder: true } },
      })
    ).toEqual({ condition: 'House' });
  });

  it('falls back to the raw trial data when no node is reachable', () => {
    expect(resolveTrialData({}, { data: { condition: 'Face' } })).toEqual({
      condition: 'Face',
    });
  });

  it('returns an empty object when there is no data at all', () => {
    expect(resolveTrialData({}, {})).toEqual({});
    expect(resolveTrialData(undefined, undefined)).toEqual({});
  });
});

describe('buildJsPsychOptions', () => {
  const build = (
    authorOptions: Record<string, unknown> = {},
    resolved: Record<string, unknown> = { condition: 'House' }
  ) => {
    const eventCallback = vi.fn();
    const onFinish = vi.fn();
    const options = buildJsPsychOptions({
      hostElementId: 'host',
      mapping,
      registry,
      eventCallback,
      onFinish,
      getInstance: () => fakeInstance(resolved),
      authorOptions,
    });
    return { options, eventCallback, onFinish };
  };

  it('forces the display element and override_safe_mode', () => {
    const { options } = build({ display_element: 'author-div' });
    expect(options.display_element).toBe('host');
    // Without this, prod (file://) silently disables WebAudio.
    expect(options.override_safe_mode).toBe(true);
  });

  it('preserves author options it does not own', () => {
    const { options } = build({ show_progress_bar: true, default_iti: 250 });
    expect(options.show_progress_bar).toBe(true);
    expect(options.default_iti).toBe(250);
  });

  it('emits the declared code for the resolved condition on the next frame', async () => {
    const { options, eventCallback } = build();
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    expect(eventCallback).not.toHaveBeenCalled();
    await nextFrame();
    expect(eventCallback).toHaveBeenCalledTimes(1);
    expect(eventCallback.mock.calls[0][0]).toBe(2); // House
  });

  it('emits nothing for a trial whose condition was never declared', async () => {
    const { options, eventCallback } = build({}, { condition: 'Scene' });
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(eventCallback).not.toHaveBeenCalled();
  });

  it('shouts when the condition key resolves to a non-string', async () => {
    // The single worst failure mode in the feature: an unresolved
    // TimelineVariable means no marker, a perfect-looking behavioral CSV, and an
    // EEG Marker column of zeros discovered only at analysis. It must be loud.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { options, eventCallback } = build({}, { condition: { unresolved: true } });
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(eventCallback).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("condition key 'condition' resolved to a object")
    );
    error.mockRestore();
  });

  it('stays silent when the trial simply has no condition key at all', async () => {
    // Not every trial is a stimulus trial. Instructions and fixation screens
    // legitimately carry no condition, and warning on those would train the
    // teacher to ignore the console.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { options } = build({}, {});
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('chains the author on_trial_start rather than clobbering it', () => {
    const authorOnTrialStart = vi.fn();
    const { options } = build({ on_trial_start: authorOnTrialStart });
    const trialObject = { data: {} };
    (options.on_trial_start as (t: unknown) => void)(trialObject);
    expect(authorOnTrialStart).toHaveBeenCalledWith(trialObject);
  });

  it('chains the author on_finish and hands BrainWaves a behavioral CSV', () => {
    const authorOnFinish = vi.fn();
    const { options, onFinish } = build({ on_finish: authorOnFinish });
    const data = {
      values: () => [
        { trial_index: 0, rt: 480, condition: 'Face', trial_type: 'x' },
      ],
    };
    (options.on_finish as (d: unknown) => void)(data);
    expect(authorOnFinish).toHaveBeenCalledWith(data);
    const csv = onFinish.mock.calls[0][0] as string;
    expect(csv.split('\n')[0]).toBe(
      'trial_number,condition,reaction_time,response_given,correct_response,phase,trial_type,time_elapsed'
    );
    expect(csv.split('\n')[1]).toBe('1,Face,480,yes,true,test,x,');
  });
});

describe('createJsPsychHost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('runs a real timeline end to end and reports the CSV', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    let csv = '';
    let host: { teardown: () => void } | undefined;
    const finished = new Promise<void>((resolve) => {
      host = createJsPsychHost(
        `
        const jsPsych = initJsPsych({});
        jsPsych.run([
          { type: jsPsychCallFunction, func: () => {}, data: { condition: 'Face' } },
          { type: jsPsychCallFunction, func: () => {}, data: { condition: 'House' } },
        ]);
        `,
        {
          hostElementId: 'host',
          mapping,
          registry,
          eventCallback: vi.fn(),
          onFinish: (value) => {
            csv = value;
            resolve();
          },
        }
      );
    });
    await finished;
    host!.teardown();

    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('1,Face,');
    expect(csv).toContain('2,House,');
    // Globals are restored, so previewing then running never redeclares.
    expect(
      (window as unknown as Record<string, unknown>).jsPsychCallFunction
    ).toBeUndefined();
  });

  it('re-declaring the same top-level names twice does not throw', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const config = {
      hostElementId: 'host',
      mapping,
      registry,
      eventCallback: vi.fn(),
      onFinish: vi.fn(),
    };
    const source = 'const jsPsych = initJsPsych({});';
    createJsPsychHost(source, config).teardown();
    expect(() => createJsPsychHost(source, config).teardown()).not.toThrow();
  });

  it('throws with the author error message when the file is broken', () => {
    document.body.innerHTML = '<div id="host"></div>';
    expect(() =>
      createJsPsychHost('thisIsNotDefined();', {
        hostElementId: 'host',
        mapping,
        registry,
        eventCallback: vi.fn(),
        onFinish: vi.fn(),
      })
    ).toThrow(/createJsPsychHost: .*thisIsNotDefined/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/host.test.ts`
Expected: FAIL — cannot resolve `../host`.

- [ ] **Step 3: Implement the host**

Create `src/renderer/utils/jspsych/host.ts`:

```ts
/**
 * The one place third-party jsPsych code meets BrainWaves.
 *
 * The author's file calls `initJsPsych()` exactly as jsPsych documents. We make
 * that OUR function, injected onto `window` before the file is evaluated, and
 * that single interception buys markers, behavioral data, and the prod-only
 * safe-mode override without the author changing a line.
 */
import { initJsPsych } from 'jspsych';
import * as jsPsychModule from 'jspsych';
import { MarkerRegistry } from '../eeg/markerRegistry';
import { JSPSYCH_PLUGIN_GLOBALS } from './plugins';
import {
  BehavioralMapping,
  normalizeJsPsychTrials,
  toBehavioralCsv,
} from './normalize';

export interface JsPsychHostConfig {
  /** id of the div jsPsych renders into. Must already be in the document. */
  hostElementId: string;
  mapping: BehavioralMapping;
  registry: MarkerRegistry;
  eventCallback: (code: number, time: number) => void;
  onFinish: (csv: string) => void;
}

interface BuildJsPsychOptionsArgs extends JsPsychHostConfig {
  /** Reads back the instance our own initJsPsych wrapper created. */
  getInstance: () => unknown;
  authorOptions: Record<string, unknown>;
}

interface TrialNode {
  getDataParameter?: () => Record<string, unknown>;
}

interface JsPsychInternals {
  timeline?: { getLatestNode?: () => TrialNode | undefined };
  abortExperiment?: (endMessage?: string) => void;
}

/**
 * The resolved, parent-merged `data` values for the trial that is starting.
 *
 * `trialObject` is `deepCopy(description)` (Trial.ts:36) and `processParameters`
 * only evaluates keys declared in the plugin's `info.parameters` — `data` is not
 * one of them. So `trialObject.data.condition` is still a TimelineVariable
 * object for the near-universal
 * `data: { condition: jsPsych.timelineVariable('cond') }` pattern.
 *
 * `TimelineNode.getDataParameter()` (TimelineNode.ts:162) is the resolver: it
 * evaluates functions, resolves timeline variables, and merges parent-timeline
 * `data`. It is public on the Trial node, and the running Trial is reachable
 * here because `Timeline.run()` assigns `currentChild` BEFORE awaiting the child
 * (Timeline.ts:82,87). Reaching past initJsPsych's public surface for it is the
 * same contained third-party coupling as
 * `experimentToRun.internals.controller.audioContext` in LabjsExperimentWindow.
 */
export const resolveTrialData = (
  instance: unknown,
  trialObject: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const node = (
    instance as JsPsychInternals | undefined
  )?.timeline?.getLatestNode?.();
  const resolved = node?.getDataParameter?.();
  if (resolved) return resolved;
  const raw = trialObject?.data;
  return typeof raw === 'object' && raw !== null
    ? (raw as Record<string, unknown>)
    : {};
};

export const buildJsPsychOptions = ({
  hostElementId,
  mapping,
  registry,
  eventCallback,
  onFinish,
  getInstance,
  authorOptions,
}: BuildJsPsychOptionsArgs): Record<string, unknown> => ({
  ...authorOptions,
  display_element: hostElementId,
  // MANDATORY, and dev will never reveal why. jsPsych's constructor checks
  // `window.location.protocol == "file:"` and, unless overridden, sets
  // use_webaudio = false and disables video preloading (JsPsych.ts:72-84).
  // Production loads the renderer with mainWindow.loadFile(...); development
  // runs on http://localhost:5173 and looks perfect.
  override_safe_mode: true,
  on_trial_start: (trialObject: Record<string, unknown>) => {
    const label = resolveTrialData(getInstance(), trialObject)[
      mapping.conditionKey
    ];
    if (typeof label === 'string') {
      const code = registry.eventId[label];
      if (code !== undefined) {
        // on_trial_start fires BEFORE the plugin writes DOM (Trial.ts:63-72).
        // For a synchronous plugin the write happens later in the same task, so
        // this rAF callback lands after the write and before paint. Async
        // plugins (audio/video preload) write in a later task and take an early
        // marker.
        requestAnimationFrame(() => eventCallback(code, Date.now()));
      }
    } else if (label !== undefined) {
      // A non-string condition means resolution failed — in practice an
      // unresolved TimelineVariable. Silence here is the worst failure in the
      // whole feature: the run completes, the behavioral CSV looks perfect, and
      // the EEG file carries a Marker column of zeros that nobody notices until
      // analysis, after 25 children have been recorded. Say it loudly.
      console.error(
        `jsPsych host: condition key '${mapping.conditionKey}' resolved to a ` +
          `${typeof label}, not a string — no marker written for this trial. ` +
          `Check that the Markers tab names a key this timeline actually sets.`
      );
    }
    (authorOptions.on_trial_start as ((t: unknown) => void) | undefined)?.(
      trialObject
    );
  },
  on_finish: (data: { values: () => Record<string, unknown>[] }) => {
    (authorOptions.on_finish as ((d: unknown) => void) | undefined)?.(data);
    onFinish(toBehavioralCsv(normalizeJsPsychTrials(data.values(), mapping)));
  },
});

export interface JsPsychHost {
  /** Aborts any running experiment and restores every global this installed. */
  teardown: () => void;
}

export const createJsPsychHost = (
  source: string,
  config: JsPsychHostConfig
): JsPsychHost => {
  const scope = window as unknown as Record<string, unknown>;
  const replaced = new Map<string, unknown>();
  let instance: JsPsychInternals | undefined;

  const install = (key: string, value: unknown) => {
    if (!replaced.has(key)) replaced.set(key, scope[key]);
    scope[key] = value;
  };

  const teardown = () => {
    try {
      instance?.abortExperiment?.();
    } catch {
      // A finished run has nothing left to abort; that is not an error.
    }
    instance = undefined;
    for (const [key, value] of replaced) {
      if (value === undefined) delete scope[key];
      else scope[key] = value;
    }
    replaced.clear();
  };

  for (const [key, value] of Object.entries(JSPSYCH_PLUGIN_GLOBALS)) {
    install(key, value);
  }
  // Plugin IIFE builds take this as their argument, and an author defining an
  // inline plugin needs ParameterType from it.
  install('jsPsychModule', jsPsychModule);
  install('initJsPsych', (authorOptions: Record<string, unknown> = {}) => {
    instance = initJsPsych(
      buildJsPsychOptions({
        ...config,
        getInstance: () => instance,
        authorOptions,
      })
    ) as unknown as JsPsychInternals;
    return instance;
  });

  try {
    // 'unsafe-eval' is already in the renderer CSP (index.html:7). A Function
    // body rather than an injected <script> keeps the author's top-level
    // `const jsPsych = …` function-scoped, so previewing and then running in one
    // session cannot throw "Identifier 'jsPsych' has already been declared" —
    // and a syntax or reference error throws HERE, where we can show it, instead
    // of landing on window.onerror. jsPsych's own migration shim also makes a v6
    // `jsPsych.init(...)` throw into this catch.
    // eslint-disable-next-line no-new-func
    new Function(source)();
  } catch (error) {
    teardown();
    throw new Error(
      `createJsPsychHost: the imported experiment threw while loading — ${
        (error as Error).message
      }`
    );
  }

  return { teardown };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/jspsych/__tests__/host.test.ts && npx tsc --noEmit`
Expected: PASS (14 tests), no type errors.

If the end-to-end test hangs, jsPsych is waiting on `document.readyState` (`JsPsych.ts:311-317`). Add `window.dispatchEvent(new Event('load'));` immediately after the `createJsPsychHost(...)` call in that test and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/utils/jspsych/host.ts \
  src/renderer/utils/jspsych/__tests__/host.test.ts
git commit -m "feat: add the jsPsych host that owns initJsPsych"
```

---

## Task 8: Split the runtime seam

`ExperimentWindow` is already a leaky lab.js abstraction, not a neutral host: `import * as lab`, `lab.core.deserialize` at line 40, `experimentToRun.internals.controller.audioContext` at lines 88 and 99. Branching jsPsych inside it would compound that on the exact component the P0 custom-experiment path depends on. Two siblings behind one props type, plus a dispatcher. No registry, no class hierarchy, no plugin architecture.

The dispatcher also owns **resolving** an imported study, because `saveWorkspaceEpic` deliberately omits `experimentObject` from `appState.json` (`experimentEpics.ts:191-194`) — so an imported lab.js graph must be re-read from the copied file on every load, and a jsPsych timeline must be read as text. One async read, one loading state, both kinds.

**Files:**
- Rename: `src/renderer/components/ExperimentWindow.tsx` → `src/renderer/components/LabjsExperimentWindow.tsx`
- Create: `src/renderer/components/ExperimentRuntime.tsx`
- Create: `src/renderer/components/ImportedExperimentWindow.tsx` (stub here; Task 9 replaces the body)
- Modify: `src/renderer/utils/filesystem/storage.ts`
- Modify: `src/renderer/components/CollectComponent/RunComponent.tsx:13`, `:124-130`, `:195-205`
- Modify: `src/renderer/components/PreviewExperimentComponent.tsx:2`, `:19-21`, `:35-45`
- Test: `src/renderer/components/__tests__/ExperimentRuntime.test.tsx`

**Interfaces:**
- Consumes: `EXPERIMENTS.IMPORTED`, `ImportedExperiment` (Task 1).
- Produces:
  - `interface ExperimentRuntimeProps { title: string; fullScreen?: boolean; eventCallback: (code: number, time: number) => void; onFinish: (csv: string) => void }`
  - `ExperimentRuntime` (named export), props `ExperimentRuntimeProps & { type: EXPERIMENTS; experimentObject: ExperimentObject; params: ExperimentParameters }`
  - `LabjsExperimentWindow` (named export), props `LabjsExperimentWindowProps = ExperimentRuntimeProps & { experimentObject: ExperimentObject; params: ExperimentParameters }`
  - `ImportedExperimentWindow` (named export), props `ImportedExperimentWindowProps = ExperimentRuntimeProps & { source: string; imported: ImportedExperiment }`
  - `readImportedExperimentFile(title: string, file: string): Promise<string>` in `storage.ts`

- [ ] **Step 1: Write the failing test**

Create `src/renderer/components/__tests__/ExperimentRuntime.test.tsx`:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../constants/constants';
import { ExperimentRuntime } from '../ExperimentRuntime';

vi.mock('../LabjsExperimentWindow', () => ({
  LabjsExperimentWindow: (props: { experimentObject: unknown }) => (
    <div data-testid="labjs">{JSON.stringify(props.experimentObject)}</div>
  ),
}));

vi.mock('../ImportedExperimentWindow', () => ({
  ImportedExperimentWindow: (props: { source: string }) => (
    <div data-testid="jspsych">{props.source}</div>
  ),
}));

const readImportedExperimentFile = vi.fn();
vi.mock('../../utils/filesystem/storage', () => ({
  readImportedExperimentFile: (...args: string[]) =>
    readImportedExperimentFile(...args),
}));

const baseProps = {
  title: 'My_Study',
  eventCallback: vi.fn(),
  onFinish: vi.fn(),
};

const importedParams = (
  overrides: Record<string, unknown> = {}
): never =>
  ({
    stimuli: [],
    imported: {
      kind: 'jspsych',
      file: 'experiment/task.js',
      conditionKey: 'condition',
      correctKey: '',
      conditionLabels: ['Face'],
      ...overrides,
    },
  }) as never;

describe('ExperimentRuntime', () => {
  beforeEach(() => {
    readImportedExperimentFile.mockReset();
  });

  it('renders the lab.js runtime for a built-in experiment and reads nothing', () => {
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.N170}
        experimentObject={{ type: 'lab.flow.Sequence' }}
        params={{ stimuli: [] } as never}
      />
    );
    expect(screen.getByTestId('labjs')).toBeInTheDocument();
    expect(readImportedExperimentFile).not.toHaveBeenCalled();
  });

  it('reads the copied file and renders the jsPsych runtime for an imported timeline', async () => {
    readImportedExperimentFile.mockResolvedValue('initJsPsych({});');
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams()}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('jspsych')).toHaveTextContent('initJsPsych({});')
    );
    expect(readImportedExperimentFile).toHaveBeenCalledWith(
      'My_Study',
      'experiment/task.js'
    );
  });

  it('parses an imported lab.js study and hands it to the lab.js runtime', async () => {
    readImportedExperimentFile.mockResolvedValue('{"type":"lab.flow.Sequence"}');
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams({ kind: 'labjs', file: 'experiment/study.json' })}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('labjs')).toHaveTextContent('lab.flow.Sequence')
    );
  });

  it('shows the failure instead of a blank screen when the copy is unreadable', async () => {
    readImportedExperimentFile.mockRejectedValue(new Error('ENOENT: gone'));
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams()}
      />
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('ENOENT: gone')
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/components/__tests__/ExperimentRuntime.test.tsx`
Expected: FAIL — cannot resolve `../ExperimentRuntime`.

- [ ] **Step 3: Rename the lab.js runtime**

```bash
git mv src/renderer/components/ExperimentWindow.tsx \
  src/renderer/components/LabjsExperimentWindow.tsx
```

In `src/renderer/components/LabjsExperimentWindow.tsx`, replace lines 12-29 with:

```tsx
import { ExperimentRuntimeProps } from './ExperimentRuntime';

export type LabjsExperimentWindowProps = ExperimentRuntimeProps & {
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
};

export const LabjsExperimentWindow: React.FC<LabjsExperimentWindowProps> = ({
  title,
  experimentObject,
  params,
  fullScreen = true,
  eventCallback,
  onFinish,
}) => {
```

Everything from line 30 (`useEffect(() => {`) down is unchanged. If `npm run lint` flags the now-unused `Stimulus` import on line 8, drop it.

- [ ] **Step 4: Add the workspace read helper**

Append to `src/renderer/utils/filesystem/storage.ts`:

```ts
/**
 * Read an imported study back out of its workspace.
 *
 * Both the graph of an imported lab.js study and the text of an imported jsPsych
 * timeline are read from here rather than persisted in appState.json, because
 * saveWorkspaceEpic omits `experimentObject` (it holds unserializable hook
 * functions) and the copied file is the study's only source of truth.
 */
export const readImportedExperimentFile = async (
  title: string,
  file: string
): Promise<string> => {
  const dir = await api().getWorkspaceDir(title);
  const [source] = await api().readFiles([path.join(dir, file)]);
  if (source === undefined) {
    throw new Error(
      `readImportedExperimentFile: ${file} is missing from the ${title} workspace`
    );
  }
  return source;
};
```

`readFiles` is already declared at `src/renderer/types/electron.d.ts:87`, so no type change is needed. Note that `fs:readFiles` (`src/main/index.ts:475-480`) uses `readFileSync`, so a missing file rejects the invoke — which is what surfaces in the alert.

- [ ] **Step 5: Create the dispatcher**

Create `src/renderer/components/ExperimentRuntime.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { EXPERIMENTS } from '../constants/constants';
import {
  ExperimentObject,
  ExperimentParameters,
  ImportedExperiment,
} from '../constants/interfaces';
import { readImportedExperimentFile } from '../utils/filesystem/storage';
import { LabjsExperimentWindow } from './LabjsExperimentWindow';
import { ImportedExperimentWindow } from './ImportedExperimentWindow';

/**
 * The contract every experiment runtime honours. Collect and Preview render the
 * dispatcher and never learn which runtime ran, so Preview comes free: same
 * component, fullScreen=false, no-op marker callback.
 */
export interface ExperimentRuntimeProps {
  title: string;
  fullScreen?: boolean;
  eventCallback: (code: number, time: number) => void;
  onFinish: (csv: string) => void;
}

type Props = ExperimentRuntimeProps & {
  type: EXPERIMENTS;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
};

/** What an imported file resolved to. A half-resolved study is unrepresentable. */
type ResolvedImport =
  | { kind: 'jspsych'; source: string }
  | { kind: 'labjs'; study: ExperimentObject };

const resolveImport = async (
  title: string,
  imported: ImportedExperiment
): Promise<ResolvedImport> => {
  const source = await readImportedExperimentFile(title, imported.file);
  if (imported.kind === 'jspsych') return { kind: 'jspsych', source };
  return { kind: 'labjs', study: JSON.parse(source) as ExperimentObject };
};

export const ExperimentRuntime: React.FC<Props> = ({
  type,
  experimentObject,
  params,
  ...runtime
}) => {
  const imported = type === EXPERIMENTS.IMPORTED ? params.imported : undefined;
  const [resolved, setResolved] = useState<ResolvedImport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imported?.file) return undefined;
    let cancelled = false;
    setResolved(null);
    setError(null);
    resolveImport(runtime.title, imported)
      .then((value) => {
        if (!cancelled) setResolved(value);
      })
      .catch((failure: Error) => {
        if (!cancelled) setError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [imported, runtime.title]);

  if (imported) {
    if (error) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center h-full p-4 text-center"
        >
          <div>
            <h2>This experiment could not be opened</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }
    if (!resolved) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Loading the imported experiment…</p>
        </div>
      );
    }
    if (resolved.kind === 'labjs') {
      return (
        <LabjsExperimentWindow
          {...runtime}
          experimentObject={resolved.study}
          params={params}
        />
      );
    }
    return (
      <ImportedExperimentWindow
        {...runtime}
        source={resolved.source}
        imported={imported}
      />
    );
  }

  return (
    <LabjsExperimentWindow
      {...runtime}
      experimentObject={experimentObject}
      params={params}
    />
  );
};
```

- [ ] **Step 6: Add a temporary stub so the dispatcher compiles**

Create `src/renderer/components/ImportedExperimentWindow.tsx`. Task 9 replaces the whole body:

```tsx
import React from 'react';
import { ImportedExperiment } from '../constants/interfaces';
import { ExperimentRuntimeProps } from './ExperimentRuntime';

export type ImportedExperimentWindowProps = ExperimentRuntimeProps & {
  source: string;
  imported: ImportedExperiment;
};

export const ImportedExperimentWindow: React.FC<
  ImportedExperimentWindowProps
> = () => <div />;
```

- [ ] **Step 7: Point Collect at the dispatcher**

In `src/renderer/components/CollectComponent/RunComponent.tsx`, replace line 13 with:

```ts
import { ExperimentRuntime } from '../ExperimentRuntime';
```

replace lines 124-130 with:

```tsx
  const onFinish = useCallback(
    (csv: string) => {
      ExperimentActions.Stop({ data: csv });
      setHasFinished(true);
    },
    [ExperimentActions]
  );
```

and replace lines 195-205 with:

```tsx
        {isRunning && (
          <div className="h-full w-full">
            <ExperimentRuntime
              type={type}
              title={title}
              experimentObject={experimentObject}
              params={params}
              eventCallback={eventCallback}
              onFinish={onFinish}
            />
          </div>
        )}
```

- [ ] **Step 8: Point Preview at the dispatcher**

In `src/renderer/components/PreviewExperimentComponent.tsx`, replace line 2 with:

```ts
import { ExperimentRuntime } from './ExperimentRuntime';
```

replace lines 19-21 with:

```ts
function insertPreviewMarkerCallback(code: number, time: number) {
  console.log('EEG marker', code, time);
}
```

and replace lines 35-45 with:

```tsx
  return (
    <div className="h-full w-full flex">
      <ExperimentRuntime
        type={props.type}
        title={props.title}
        experimentObject={props.experimentObject}
        params={props.params}
        eventCallback={insertPreviewMarkerCallback}
        fullScreen={false}
        onFinish={props.onEnd}
      />
    </div>
  );
```

- [ ] **Step 9: Confirm nothing else imports the old name**

Run: `npx tsc --noEmit`
Expected: no errors. If `src/renderer/components/DesignComponent/__tests__/CustomDesignComponent.test.tsx` now fails while loading the jsPsych chain, add `vi.mock('../../ImportedExperimentWindow', () => ({ ImportedExperimentWindow: () => null }));` next to its existing `vi.mock('lab.js', () => ({}))`.

- [ ] **Step 10: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 11: Commit**

```bash
git add -A src/renderer/components src/renderer/utils/filesystem/storage.ts
git commit -m "refactor: split experiment runtimes behind an ExperimentRuntime dispatcher"
```

---

## Task 9: `ImportedExperimentWindow`

All third-party weirdness lives here, so a later move to iframe or webview isolation is a one-file change (spec §3.1). This file also carries the honest security note: imported code shares a realm with `window.electronAPI` under a CSP that already permits `'unsafe-eval'`. Component separation makes that exposure **auditable**, not prevented (spec §6).

**Files:**
- Modify (replace the Task 8 stub entirely): `src/renderer/components/ImportedExperimentWindow.tsx`
- Test: `src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx`

**Interfaces:**
- Consumes: `createJsPsychHost` (Task 7); `rewriteRelativeAssetUrls` (Task 6); `buildMarkerRegistryFromLabels` (Task 2); `ExperimentRuntimeProps`, `ImportedExperimentWindowProps` (Task 8).
- Produces: `ImportedExperimentWindow` (named export), props type unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx`:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportedExperimentWindow } from '../ImportedExperimentWindow';

const teardown = vi.fn();
const createJsPsychHost = vi.fn(() => ({ teardown }));
vi.mock('../../utils/jspsych/host', () => ({
  createJsPsychHost: (...args: unknown[]) => createJsPsychHost(...args),
}));
vi.mock('jspsych/css/jspsych.css', () => ({}));

const imported = {
  kind: 'jspsych' as const,
  file: 'experiment/task.js',
  conditionKey: 'condition',
  correctKey: 'correct',
  conditionLabels: ['Face', 'House'],
};

const baseProps = {
  title: 'My_Study',
  source: "const jsPsych = initJsPsych({}); const s = 'stimuli/face1.png';",
  eventCallback: vi.fn(),
  onFinish: vi.fn(),
};

describe('ImportedExperimentWindow', () => {
  beforeEach(() => {
    createJsPsychHost.mockReset();
    createJsPsychHost.mockReturnValue({ teardown });
    teardown.mockReset();
  });

  it('hosts the timeline in a div that exists before the host is created', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    const [, config] = createJsPsychHost.mock.calls[0] as [
      string,
      { hostElementId: string },
    ];
    expect(document.getElementById(config.hostElementId)).toBeInTheDocument();
  });

  it('passes the declared registry and mapping through', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    const [, config] = createJsPsychHost.mock.calls[0] as [
      string,
      { registry: { eventId: Record<string, number> }; mapping: unknown },
    ];
    expect(config.registry.eventId).toEqual({ Face: 1, House: 2 });
    expect(config.mapping).toEqual({
      conditionKey: 'condition',
      correctKey: 'correct',
    });
  });

  it('leaves the source alone when no asset folder is authorized', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    expect(createJsPsychHost.mock.calls[0][0]).toBe(baseProps.source);
  });

  it('rewrites relative asset URLs when an asset folder is authorized', () => {
    render(
      <ImportedExperimentWindow
        {...baseProps}
        imported={{ ...imported, assetDir: '/Users/teacher/faces' }}
      />
    );
    expect(createJsPsychHost.mock.calls[0][0]).toContain('bwfile://');
  });

  it('tears the host down on unmount', () => {
    const { unmount } = render(
      <ImportedExperimentWindow {...baseProps} imported={imported} />
    );
    unmount();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('shows the author error instead of a blank screen', async () => {
    createJsPsychHost.mockImplementation(() => {
      throw new Error('createJsPsychHost: boom');
    });
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'createJsPsychHost: boom'
      )
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx`
Expected: FAIL — `createJsPsychHost.mock.calls[0]` is undefined; the stub calls nothing.

- [ ] **Step 3: Implement the component**

Replace the whole of `src/renderer/components/ImportedExperimentWindow.tsx`:

```tsx
/**
 * The only file in BrainWaves that third-party experiment code touches.
 *
 * SECURITY POSTURE, on the record: imported code shares a realm with
 * `window.electronAPI` — including deleteWorkspaceDir, writeCleanedEpochs, and
 * the LSL bridge — under a CSP that already permits 'unsafe-eval'. Keeping the
 * execution in one component makes that exposure AUDITABLE, not prevented. It is
 * a deliberate, informed v1 tradeoff (design doc §6). Because the seam is
 * ExperimentRuntimeProps and nothing else, a later move to a cross-origin iframe
 * or an out-of-process webview edits this file and no other.
 */
import React, { useEffect, useRef, useState } from 'react';
import 'jspsych/css/jspsych.css';
import { buildMarkerRegistryFromLabels } from '../utils/eeg/markerRegistry';
import { rewriteRelativeAssetUrls } from '../utils/jspsych/assets';
import { createJsPsychHost } from '../utils/jspsych/host';
import { ImportedExperiment } from '../constants/interfaces';
import { ExperimentRuntimeProps } from './ExperimentRuntime';

export type ImportedExperimentWindowProps = ExperimentRuntimeProps & {
  source: string;
  imported: ImportedExperiment;
};

// jsPsych resolves a string display_element with
// `document.querySelector('#' + id)` (JsPsych.ts:340-343), so the id must be a
// bare CSS identifier — React's useId returns colons and would throw there. A
// module counter keeps ids unique if a Preview and a Run ever mount at once.
let hostCounter = 0;

export const ImportedExperimentWindow: React.FC<
  ImportedExperimentWindowProps
> = ({ source, imported, fullScreen = true, eventCallback, onFinish }) => {
  const hostElementId = useRef(
    `brainwaves-jspsych-host-${(hostCounter += 1)}`
  ).current;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prepared = imported.assetDir
      ? rewriteRelativeAssetUrls(source, imported.assetDir)
      : source;
    try {
      const host = createJsPsychHost(prepared, {
        hostElementId,
        mapping: {
          conditionKey: imported.conditionKey,
          correctKey: imported.correctKey,
        },
        registry: buildMarkerRegistryFromLabels(imported.conditionLabels),
        eventCallback,
        onFinish,
      });
      return host.teardown;
    } catch (failure) {
      setError((failure as Error).message);
      return undefined;
    }
  }, [eventCallback, hostElementId, imported, onFinish, source]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center h-full w-full p-4 text-center"
      >
        <div>
          <h2>This experiment could not run</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${fullScreen ? 'h-screen' : 'h-full'}`}>
      <div id={hostElementId} className="w-full h-full" />
    </div>
  );
};
```

Note the jsPsych CSS import: `jspsych/css/jspsych.css` is ~475 KB, almost all of it base64 `@font-face` rules for Open Sans, which is exactly what a classroom machine with no network needs. Every one of its selectors is `.jspsych-*`-scoped, so it cannot bleed into the app's Tailwind styles.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/ImportedExperimentWindow.tsx \
  src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx
git commit -m "feat: run imported jsPsych timelines in ImportedExperimentWindow"
```

---

## Task 10: Copy the imported file into the workspace

The timeline **is** the experiment: if the original moves, the workspace is dead, not degraded. It is also a small text file, so disk duplication is irrelevant (spec §2 decision 7). Assets stay referenced in place, keeping `TODOS.md:17`'s pending user-testing decision open rather than pre-empting it.

There is no generic `fs:copyFile` channel and this plan does not add one — a narrow, domain-named handler is the house pattern (`fs:storeBehavioralData`, `fs:writeCleanedEpochs`).

**Files:**
- Create: `src/main/importExperimentFile.ts`
- Modify: `src/main/index.ts:31` (import), `:186-191` (dialog), new handler after `:393`
- Modify: `src/preload/index.ts:130-131`
- Modify: `src/renderer/types/electron.d.ts:73`
- Modify: `src/renderer/utils/filesystem/storage.ts`
- Test: `src/main/__tests__/importExperimentFile.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `IMPORTED_EXPERIMENT_DIR = 'experiment'`
  - `interface ImportedExperimentFile { file: string }`
  - main: `importExperimentFile(workspaceDir: string, sourcePath: string): ImportedExperimentFile`
  - IPC channel `fs:importExperimentFile`
  - bridge + type: `importExperimentFile: (title: string, sourcePath: string) => Promise<{ file: string }>`
  - renderer: `importExperimentFile(title: string, sourcePath: string): Promise<{ file: string }>` in `storage.ts`

- [ ] **Step 1: Write the failing test**

Create `src/main/__tests__/importExperimentFile.test.ts`:

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importExperimentFile } from '../importExperimentFile';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-import-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const writeSource = (name: string, contents = 'initJsPsych({});') => {
  const file = path.join(root, name);
  fs.writeFileSync(file, contents);
  return file;
};

describe('importExperimentFile', () => {
  it('copies the file into the workspace and returns its POSIX-relative path', () => {
    const workspace = path.join(root, 'workspace');
    expect(importExperimentFile(workspace, writeSource('task.js'))).toEqual({
      file: 'experiment/task.js',
    });
    expect(
      fs.readFileSync(path.join(workspace, 'experiment', 'task.js'), 'utf8')
    ).toBe('initJsPsych({});');
  });

  it('creates the workspace directory if it does not exist yet', () => {
    const workspace = path.join(root, 'brand', 'new', 'workspace');
    importExperimentFile(workspace, writeSource('task.js'));
    expect(fs.existsSync(path.join(workspace, 'experiment', 'task.js'))).toBe(
      true
    );
  });

  it('is idempotent: re-importing overwrites the same copy', () => {
    const workspace = path.join(root, 'workspace');
    const first = writeSource('task.js', 'v1');
    importExperimentFile(workspace, first);
    fs.writeFileSync(first, 'v2');

    expect(importExperimentFile(workspace, first)).toEqual({
      file: 'experiment/task.js',
    });
    expect(fs.readdirSync(path.join(workspace, 'experiment'))).toEqual([
      'task.js',
    ]);
    expect(
      fs.readFileSync(path.join(workspace, 'experiment', 'task.js'), 'utf8')
    ).toBe('v2');
  });

  it('accepts a .json lab.js study', () => {
    expect(
      importExperimentFile(
        path.join(root, 'workspace'),
        writeSource('study.json', '{}')
      )
    ).toEqual({ file: 'experiment/study.json' });
  });

  it('rejects any other extension by name', () => {
    expect(() =>
      importExperimentFile(
        path.join(root, 'workspace'),
        writeSource('bundle.zip')
      )
    ).toThrow(/importExperimentFile: expected a \.js/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/main/__tests__/importExperimentFile.test.ts`
Expected: FAIL — cannot resolve `../importExperimentFile`.

- [ ] **Step 3: Implement the copy**

Create `src/main/importExperimentFile.ts`:

```ts
import fs from 'fs';
import path from 'path';

export const IMPORTED_EXPERIMENT_DIR = 'experiment';

const ALLOWED_EXTENSIONS = new Set(['.js', '.json']);

export interface ImportedExperimentFile {
  /** POSIX path of the copy, relative to the workspace directory. */
  file: string;
}

/**
 * Copy an externally-authored study into its workspace.
 *
 * The timeline IS the experiment: if the original file moves, the workspace is
 * dead rather than degraded, and it is a small text file, so it is copied rather
 * than referenced. Asset folders are NOT copied — they keep the existing
 * bwfile:// allowlist behaviour.
 *
 * The returned path is POSIX-joined on purpose: the renderer re-joins it with
 * `pathe`, and a Windows backslash would otherwise survive into appState.json.
 */
export function importExperimentFile(
  workspaceDir: string,
  sourcePath: string
): ImportedExperimentFile {
  const extension = path.extname(sourcePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(
      `importExperimentFile: expected a .js jsPsych timeline or a .json lab.js study, got "${
        extension || sourcePath
      }"`
    );
  }

  const destinationDir = path.join(workspaceDir, IMPORTED_EXPERIMENT_DIR);
  fs.mkdirSync(destinationDir, { recursive: true });
  const filename = path.basename(sourcePath);
  fs.copyFileSync(sourcePath, path.join(destinationDir, filename));

  return { file: `${IMPORTED_EXPERIMENT_DIR}/${filename}` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/main/__tests__/importExperimentFile.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Wire the IPC channel and widen the dialog**

In `src/main/index.ts`, add after line 31:

```ts
import { importExperimentFile } from './importExperimentFile';
```

Replace lines 186-191 — the `loadDialog` fall-through that has been reachable by nothing since `openexp/jspsych-react` was removed in v0.9.0 — with:

```ts
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select a jsPsych timeline (.js) or lab.js study (.json)',
    properties: ['openFile'],
    filters: [
      { name: 'Experiment', extensions: ['js', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
```

Add after line 393 (the `fs:deleteWorkspaceDir` handler):

```ts
ipcMain.handle(
  'fs:importExperimentFile',
  (_event, title: string, sourcePath: string) =>
    importExperimentFile(getWorkspaceDir(title), sourcePath)
);
```

- [ ] **Step 6: Bridge it**

In `src/preload/index.ts`, add after line 131 (`deleteWorkspaceDir`):

```ts
  importExperimentFile: (
    title: string,
    sourcePath: string
  ): Promise<{ file: string }> =>
    ipcRenderer.invoke('fs:importExperimentFile', title, sourcePath),
```

In `src/renderer/types/electron.d.ts`, add after line 73 (`deleteWorkspaceDir`):

```ts
    importExperimentFile: (
      title: string,
      sourcePath: string
    ) => Promise<{ file: string }>;
```

In `src/renderer/utils/filesystem/storage.ts`, add under the "Storing" section after `storeBehavioralData`:

```ts
export const importExperimentFile = (
  title: string,
  sourcePath: string
): Promise<{ file: string }> => api().importExperimentFile(title, sourcePath);
```

- [ ] **Step 7: Verify all four ends of the channel**

A half-wired channel fails silently — the renderer call just resolves to `undefined`.

Run: `npx vitest run src/main && npx tsc --noEmit`
Then:

```bash
grep -n "fs:importExperimentFile" src/main/index.ts src/preload/index.ts
grep -n "importExperimentFile" src/renderer/types/electron.d.ts src/renderer/utils/filesystem/storage.ts
```

Expected: the channel string in both main and preload; the method in both the type and the storage helper.

- [ ] **Step 8: Commit**

```bash
git add src/main/importExperimentFile.ts src/main/__tests__/importExperimentFile.test.ts \
  src/main/index.ts src/preload/index.ts src/renderer/types/electron.d.ts \
  src/renderer/utils/filesystem/storage.ts
git commit -m "feat: copy imported experiment files into the workspace"
```

---

## Task 11: The import flow on Home

`FILE_TYPES.TIMELINE` and its "Select a jsPsych timeline file" dialog have been in tree, reachable by nothing, since `openexp/jspsych-react` was removed in v0.9.0. This is where they get a caller.

The scan runs on the **original** file, before anything is copied, so a rejected import leaves no workspace behind to clean up.

**Files:**
- Modify: `src/renderer/components/HomeComponent/index.tsx` (imports; new `handleImportExperiment`; cards at `:262-303`)
- Modify: `src/renderer/epics/experimentEpics.ts:49-58`
- Test: `src/renderer/components/HomeComponent/__tests__/importExperiment.test.tsx`

**Interfaces:**
- Consumes: `scanTimelineSource`, `V6_MIGRATION_URL` (Task 4); `JSPSYCH_PLUGIN_GLOBALS` (Task 5); `importExperimentFile` renderer helper (Task 10); `WorkSpaceInfo.imported`, `ImportedExperimentKind` (Task 1); existing `loadFromSystemDialog`, `readFiles`.
- Produces: `createNewWorkspaceEpic` merges `workspaceInfo.imported` into the params it dispatches.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/components/HomeComponent/__tests__/importExperiment.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import Home, { Props } from '../index';

const loadFromSystemDialog = vi.fn();
vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: () => loadFromSystemDialog(),
}));

const importExperimentFile = vi.fn();
vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaces: vi.fn(async () => []),
  readAndParseState: vi.fn(async () => null),
  openWorkspaceDir: vi.fn(),
  deleteWorkspaceDir: vi.fn(),
  importExperimentFile: (...args: string[]) => importExperimentFile(...args),
}));

const readFiles = vi.fn();
vi.mock('../../../utils/filesystem/read', () => ({
  readFiles: (...args: unknown[]) => readFiles(...args),
}));

const toastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), { error: (message: string) => toastError(message) }),
}));

vi.mock('lab.js', () => ({}));

const makeProps = (): Props =>
  ({
    availableDevices: [],
    availableLSLStreams: [],
    connectedDevice: null,
    DeviceActions: {},
    ExperimentActions: { CreateNewWorkspace: vi.fn() },
    navigate: vi.fn(),
    PyodideActions: { Launch: vi.fn() },
    activeStep: 'EXPERIMENT BANK',
  }) as unknown as Props;

describe('Home — import experiment', () => {
  beforeEach(() => {
    loadFromSystemDialog.mockReset();
    importExperimentFile.mockReset();
    readFiles.mockReset();
    toastError.mockReset();
  });

  it('relabels the Custom card as Experiment Builder', () => {
    render(<Home {...makeProps()} />);
    expect(screen.getByText('Experiment Builder')).toBeInTheDocument();
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
  });

  it('creates an imported workspace from a v8 timeline', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/faces_task.js');
    readFiles.mockResolvedValue([
      "const t = { type: jsPsychImageKeyboardResponse, data: { condition: 'Face' } };",
    ]);
    importExperimentFile.mockResolvedValue({ file: 'experiment/faces_task.js' });

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(props.ExperimentActions.CreateNewWorkspace).toHaveBeenCalledWith({
        title: 'faces_task',
        type: EXPERIMENTS.IMPORTED,
        imported: {
          kind: 'jspsych',
          file: 'experiment/faces_task.js',
          conditionKey: '',
          correctKey: '',
          conditionLabels: [],
        },
      })
    );
    expect(props.navigate).toHaveBeenCalledWith('/design');
  });

  it('rejects a jsPsych v6 file before copying anything', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/old_task.js');
    readFiles.mockResolvedValue(['jsPsych.init({ timeline: [] });']);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('jsPsych.init')
      )
    );
    expect(importExperimentFile).not.toHaveBeenCalled();
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });

  it('names a missing plugin instead of letting it die mid-run', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/survey_task.js');
    readFiles.mockResolvedValue(['const t = { type: jsPsychNotARealPlugin };']);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('jsPsychNotARealPlugin')
      )
    );
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });

  it('imports a lab.js study without scanning it as jsPsych', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/my_study.json');
    importExperimentFile.mockResolvedValue({ file: 'experiment/my_study.json' });

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(props.ExperimentActions.CreateNewWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          imported: expect.objectContaining({ kind: 'labjs' }),
        })
      )
    );
    expect(readFiles).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is cancelled', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue(null);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() => expect(loadFromSystemDialog).toHaveBeenCalled());
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/components/HomeComponent/__tests__/importExperiment.test.tsx`
Expected: FAIL — no `Import Experiment` text; `Custom` still present.

If rendering `Home` pulls in slow children (`EEGExplorationComponent` reaches
plotly), add `vi.mock('../../EEGExplorationComponent', () => ({ default: () => null }));`
alongside the other mocks. The suite under test is the import flow, not the
EEG-exploration tab.

- [ ] **Step 3: Add the imports to Home**

In `src/renderer/components/HomeComponent/index.tsx`:

Replace the constants import (lines 10-16) with:

```ts
import {
  EXPERIMENTS,
  SCREENS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
  FILE_TYPES,
} from '../../constants/constants';
```

Replace the storage import (lines 24-29) with:

```ts
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
  importExperimentFile,
} from '../../utils/filesystem/storage';
```

Add after that import block:

```ts
import path from 'pathe';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { readFiles } from '../../utils/filesystem/read';
import { scanTimelineSource, V6_MIGRATION_URL } from '../../utils/jspsych/scan';
import { JSPSYCH_PLUGIN_GLOBALS } from '../../utils/jspsych/plugins';
import type { ImportedExperimentKind } from '../../constants/interfaces';
```

- [ ] **Step 4: Add the import handler**

In the same file, add after `handleLoadCustomExperiment` (which ends at line 142):

```ts
  async function handleImportExperiment() {
    const sourcePath = await loadFromSystemDialog(FILE_TYPES.TIMELINE);
    if (!sourcePath) return;

    const kind: ImportedExperimentKind =
      path.extname(sourcePath).toLowerCase() === '.json' ? 'labjs' : 'jspsych';
    const title = path.parse(sourcePath).name.replace(/[^\w-]/g, '_');

    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    if (recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }

    // Scan the ORIGINAL file: a rejected import must not leave a workspace
    // behind to clean up.
    if (kind === 'jspsych') {
      const [source] = await readFiles([sourcePath]);
      const scan = scanTimelineSource(
        source,
        Object.keys(JSPSYCH_PLUGIN_GLOBALS)
      );
      if (scan.v6Token) {
        toast.error(
          `This file is written for jsPsych 6 (it uses ${scan.v6Token}). BrainWaves runs jsPsych 8. Migration guide: ${V6_MIGRATION_URL}`
        );
        return;
      }
      if (scan.missingPluginGlobals.length > 0) {
        toast.error(
          `This experiment uses plugins BrainWaves does not ship: ${scan.missingPluginGlobals.join(
            ', '
          )}`
        );
        return;
      }
    }

    const { file } = await importExperimentFile(title, sourcePath);
    props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.IMPORTED,
      imported: {
        kind,
        file,
        conditionKey: '',
        correctKey: '',
        conditionLabels: [],
      },
    });
    props.navigate(SCREENS.DESIGN.route);
  }
```

- [ ] **Step 5: Update the experiment bank cards**

In the same file, replace the `EXPERIMENTS.CUSTOM` card (lines 295-301) with:

```tsx
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.CUSTOM)}
              icon={customIcon}
              title="Experiment Builder"
              description={`Design your own image experiment. Choose
                        condition folders and key responses.`}
            />
            <ExperimentCard
              onClick={handleImportExperiment}
              icon={customIcon}
              title="Import Experiment"
              description={`Already have a jsPsych timeline or a lab.js study?
                        Run it here, with EEG markers and analysis.`}
            />
```

The enum value `EXPERIMENTS.CUSTOM = 'Custom'` is untouched: it is persisted as `type` in every saved workspace and re-derived by `getExperimentFromType`.

- [ ] **Step 6: Let workspace creation carry the imported contract**

Dispatching `SetParams` from the component after `CreateNewWorkspace` would race the epic's own `SetParams` (the epic body is `mergeMap(async …)`). Instead, in `src/renderer/epics/experimentEpics.ts` replace lines 49-58 with:

```ts
    mergeMap(async (workspaceInfo) => {
      await createWorkspaceDir(workspaceInfo.title);
      const experiment = getExperimentFromType(workspaceInfo.type);
      // An imported study's contract arrives WITH the workspace request, so
      // there is no window in which `type` is IMPORTED but `params.imported` is
      // still the empty default.
      const params = workspaceInfo.imported
        ? { ...experiment.params, imported: workspaceInfo.imported }
        : experiment.params;
      return [
        ExperimentActions.SetTitle(workspaceInfo.title),
        ExperimentActions.SetType(workspaceInfo.type),
        ExperimentActions.SetExperimentObject(experiment?.experimentObject),
        ExperimentActions.SetParams(params),
      ];
    }),
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components/HomeComponent src/renderer/epics && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/components/HomeComponent src/renderer/epics/experimentEpics.ts
git commit -m "feat: import a jsPsych timeline or lab.js study from Home"
```

---

## Task 12: The Markers tab

jsPsych has **no condition concept**. `data` is a free-form key-value bag; the official docs' own examples use `image_type: 'A'`, `condition: 'conditionA'`, and `subject`. `trial_type` holds the *plugin name*, so Face and House trials both rendered by `image-keyboard-response` are byte-identical there. There is no jsPsych-side string to pair against automatically — only the key one particular author happened to choose. This tab is where that choice is named once and frozen.

Codes must be frozen **before the first subject**. A dry-run, or alphabetical interning of observed values, only ever sees the branches one pass took; randomization, conditional nodes, and timeline variables would then give subject A `Face=1` and subject B `Face=2`.

**Files:**
- Create: `src/renderer/components/DesignComponent/ImportedDesignComponent.tsx`
- Modify: `src/renderer/components/DesignComponent/index.tsx:13` (import), `:74-88`, `:107-109`
- Test: `src/renderer/components/DesignComponent/__tests__/ImportedDesignComponent.test.tsx`

**Interfaces:**
- Consumes: `DesignProps` (`DesignComponent/index.tsx:42-50`); `scanTimelineSource` (Task 4); `JSPSYCH_PLUGIN_GLOBALS` (Task 5); `readImportedExperimentFile` (Task 8); `loadFromSystemDialog` + `FILE_TYPES.STIMULUS_DIR` (existing — that dialog branch already calls `StimulusFileAccess.authorizeDirectory`, `src/main/index.ts:183`); `PreviewExperimentComponent`, `SecondaryNavComponent`, `PreviewButton`.
- Produces: default export `ImportedDesign`.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/components/DesignComponent/__tests__/ImportedDesignComponent.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import type { DesignProps } from '../index';
import ImportedDesign from '../ImportedDesignComponent';

const readImportedExperimentFile = vi.fn();
vi.mock('../../../utils/filesystem/storage', () => ({
  readImportedExperimentFile: (...args: string[]) =>
    readImportedExperimentFile(...args),
}));

const loadFromSystemDialog = vi.fn();
vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: () => loadFromSystemDialog(),
}));

vi.mock('lab.js', () => ({}));
vi.mock('../../PreviewExperimentComponent', () => ({
  default: () => <div data-testid="preview" />,
}));

const imported = {
  kind: 'jspsych' as const,
  file: 'experiment/task.js',
  conditionKey: '',
  correctKey: '',
  conditionLabels: [],
};

const makeProps = (overrides: Partial<DesignProps> = {}): DesignProps =>
  ({
    navigate: vi.fn(),
    type: EXPERIMENTS.IMPORTED,
    title: 'faces_task',
    params: { stimuli: [], imported },
    experimentObject: {},
    isEEGEnabled: true,
    ExperimentActions: {
      SetParams: vi.fn(),
      SaveWorkspace: vi.fn(),
      SetEEGEnabled: vi.fn(),
    },
    ...overrides,
  }) as unknown as DesignProps;

const goToMarkers = async () => {
  await waitFor(() => expect(readImportedExperimentFile).toHaveBeenCalled());
  fireEvent.click(screen.getByText('MARKERS'));
  await waitFor(() => expect(screen.getByLabelText('Condition key')).toBeInTheDocument());
};

const chooseConditionKey = (key: string) =>
  fireEvent.change(screen.getByLabelText('Condition key'), {
    target: { value: key },
  });

describe('ImportedDesign — Markers tab', () => {
  beforeEach(() => {
    readImportedExperimentFile.mockReset();
    readImportedExperimentFile.mockResolvedValue(
      `const a = { data: { condition: 'Face', correct: true } };
       const b = { data: { condition: 'House' } };`
    );
    loadFromSystemDialog.mockReset();
  });

  it('offers every data key the scan found as the condition key', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();

    expect(
      [...screen.getByLabelText('Condition key').querySelectorAll('option')].map(
        (option) => option.textContent
      )
    ).toEqual(['Choose a key', 'condition', 'correct']);
  });

  it('pre-populates the label order from the scanned values and shows the codes', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();
    chooseConditionKey('condition');

    expect(screen.getByTestId('code-Face')).toHaveTextContent('1');
    expect(screen.getByTestId('code-House')).toHaveTextContent('2');
  });

  it('persists the frozen contract when the teacher confirms', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.change(screen.getByLabelText('Correctness key'), {
      target: { value: 'correct' },
    });
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: {
          ...imported,
          conditionKey: 'condition',
          correctKey: 'correct',
          conditionLabels: ['Face', 'House'],
        },
      })
    );
    expect(props.ExperimentActions.SaveWorkspace).toHaveBeenCalled();
  });

  it('adds a label the scan could not see on a dynamic branch', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.change(screen.getByLabelText('Add a label the scan missed'), {
      target: { value: 'Scene' },
    });
    fireEvent.click(screen.getByText('Add label'));
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: expect.objectContaining({
          conditionLabels: ['Face', 'House', 'Scene'],
        }),
      })
    );
  });

  it('reorders labels and renumbers the codes to match', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.click(screen.getByLabelText('Move House up'));

    expect(screen.getByTestId('code-House')).toHaveTextContent('1');
    expect(screen.getByTestId('code-Face')).toHaveTextContent('2');
  });

  it('forces EEG off and says so when no conditions are declared', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    expect(props.ExperimentActions.SetEEGEnabled).toHaveBeenCalledWith(false);
    expect(
      screen.getByText(/records responses but no brain data/i)
    ).toBeInTheDocument();
  });

  it('does not keep re-dispatching SetEEGEnabled once EEG is already off', async () => {
    const props = makeProps({ isEEGEnabled: false });
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    expect(props.ExperimentActions.SetEEGEnabled).not.toHaveBeenCalled();
  });

  it('authorizes an asset folder for relative stimulus URLs', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Documents/faces');
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    fireEvent.click(screen.getByText('Select asset folder'));
    await waitFor(() =>
      expect(screen.getByText('/Users/t/Documents/faces')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: expect.objectContaining({
          assetDir: '/Users/t/Documents/faces',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/components/DesignComponent/__tests__/ImportedDesignComponent.test.tsx`
Expected: FAIL — cannot resolve `../ImportedDesignComponent`.

- [ ] **Step 3: Implement the screen**

Create `src/renderer/components/DesignComponent/ImportedDesignComponent.tsx`:

```tsx
/**
 * Design screen for an imported study.
 *
 * The Markers tab is the whole reason importing works. jsPsych has no condition
 * concept: `data` is a free-form bag, and `trial_type` holds the PLUGIN name, so
 * Face and House trials both rendered by image-keyboard-response are identical
 * there. There is no jsPsych-side string to pair against automatically — only
 * the key one author happened to pick.
 *
 * Codes are frozen HERE, before the first subject, and never interned on
 * encounter order: a code that meant Face for subject A and House for subject B
 * corrupts a cross-subject ERP average with no error anywhere.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { SCREENS, FILE_TYPES } from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { DesignProps } from './index';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { readImportedExperimentFile } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { scanTimelineSource } from '../../utils/jspsych/scan';
import { JSPSYCH_PLUGIN_GLOBALS } from '../../utils/jspsych/plugins';

const IMPORTED_STEPS = {
  OVERVIEW: 'OVERVIEW',
  MARKERS: 'MARKERS',
  PREVIEW: 'PREVIEW',
};

const SHIPPED_PLUGIN_GLOBALS = Object.keys(JSPSYCH_PLUGIN_GLOBALS);

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function ImportedDesign(props: DesignProps) {
  const imported = props.params.imported;
  const [activeStep, setActiveStep] = useState(IMPORTED_STEPS.OVERVIEW);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [conditionKey, setConditionKey] = useState(imported?.conditionKey ?? '');
  const [correctKey, setCorrectKey] = useState(imported?.correctKey ?? '');
  const [labels, setLabels] = useState<string[]>(
    imported?.conditionLabels ?? []
  );
  const [assetDir, setAssetDir] = useState(imported?.assetDir ?? '');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (!imported?.file) return undefined;
    let cancelled = false;
    readImportedExperimentFile(props.title, imported.file)
      .then((text) => {
        if (!cancelled) setSource(text);
      })
      .catch((failure: Error) => {
        if (!cancelled) setReadError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [imported?.file, props.title]);

  const scan = useMemo(
    () =>
      source ? scanTimelineSource(source, SHIPPED_PLUGIN_GLOBALS) : null,
    [source]
  );

  const dataKeys = useMemo(
    () => (scan ? Object.keys(scan.dataKeys).sort() : []),
    [scan]
  );

  // No declared conditions means no EEG markers, so an EEG recording would be a
  // technically-valid file of nothing. Behavior-only is an honest, already
  // first-class mode; force it rather than pretend. Guarded on the current value
  // so this settles instead of dispatching on every render.
  useEffect(() => {
    if (labels.length === 0 && props.isEEGEnabled) {
      props.ExperimentActions.SetEEGEnabled(false);
    }
  }, [labels.length, props.isEEGEnabled, props.ExperimentActions]);

  function handleConditionKeyChange(key: string) {
    setConditionKey(key);
    // Pre-populate from the static scan; the teacher confirms or edits.
    setLabels(scan?.dataKeys[key] ?? []);
  }

  function handleAddLabel() {
    const label = newLabel.trim();
    if (!label || labels.includes(label)) return;
    setLabels([...labels, label]);
    setNewLabel('');
  }

  async function handleSelectAssetFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.STIMULUS_DIR);
    if (dir) setAssetDir(dir);
  }

  function handleFreeze() {
    if (!imported) return;
    const nextParams: ExperimentParameters = {
      ...props.params,
      imported: {
        ...imported,
        conditionKey,
        correctKey,
        conditionLabels: labels,
        ...(assetDir ? { assetDir } : {}),
      },
    };
    props.ExperimentActions.SetParams(nextParams);
    props.ExperimentActions.SaveWorkspace();
  }

  function renderLabelEditor() {
    return (
      <div className="space-y-2">
        <span className="font-semibold">Conditions, in code order</span>
        <p className="text-gray-600">
          The order is the contract: it decides which number is written to the
          EEG Marker column, and it must not change once you have recorded a
          subject. The scan only sees branches spelled out in the file, so add
          anything it missed.
        </p>
        {labels.length === 0 ? (
          <p>No conditions yet.</p>
        ) : (
          <ul className="space-y-1">
            {labels.map((label, index) => (
              <li
                key={label}
                className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-2 items-center border border-gray-300 rounded px-2 py-1"
              >
                <span data-testid={`code-${label}`} className="font-mono">
                  {index + 1}
                </span>
                <span>{label}</span>
                <button
                  aria-label={`Move ${label} up`}
                  onClick={() => setLabels(move(labels, index, index - 1))}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${label} down`}
                  onClick={() => setLabels(move(labels, index, index + 1))}
                >
                  ↓
                </button>
                <button
                  aria-label={`Remove ${label}`}
                  onClick={() =>
                    setLabels(labels.filter((_, i) => i !== index))
                  }
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <label htmlFor="new-label">Add a label the scan missed</label>
            <input
              id="new-label"
              className="border border-gray-300 rounded px-2 py-1 w-full"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={handleAddLabel}>
            Add label
          </Button>
        </div>
      </div>
    );
  }

  function renderMarkers() {
    if (readError) {
      return (
        <div role="alert" className="p-4">
          <h2>This experiment could not be read</h2>
          <p className="text-gray-600">{readError}</p>
        </div>
      );
    }
    if (!scan) return <p className="p-4">Reading the study file…</p>;

    return (
      <div className="p-4 space-y-6 max-w-3xl overflow-y-auto h-[85%]">
        {labels.length === 0 && (
          <div className="border-2 border-gray-300 rounded p-3">
            Until you name at least one condition, this experiment records
            responses but no brain data. EEG is switched off.
          </div>
        )}

        {imported?.kind === 'labjs' && (
          <div className="border-2 border-gray-300 rounded p-3">
            This is an imported lab.js study. BrainWaves records its responses
            through lab.js&apos;s own datastore, so the keys below do not apply.
            Markers only reach the EEG file if the study itself calls
            <code> parameters.callbackForEEG</code> — the hook BrainWaves wires
            into the experiments it authors. Otherwise this runs behavior-only.
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="condition-key" className="font-semibold">
            Condition key
          </label>
          <p className="text-gray-600">
            jsPsych has no condition concept — pick the <code>data</code> key
            this author used to label their trials.
          </p>
          <select
            id="condition-key"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={conditionKey}
            onChange={(event) => handleConditionKeyChange(event.target.value)}
          >
            <option value="">Choose a key</option>
            {dataKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="correct-key" className="font-semibold">
            Correctness key
          </label>
          <p className="text-gray-600">
            Reaction-time and accuracy plots only count correct trials. If this
            study does not record correctness, leave this as “not measured” and
            every trial is counted as correct so reaction times still plot.
          </p>
          <select
            id="correct-key"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={correctKey}
            onChange={(event) => setCorrectKey(event.target.value)}
          >
            <option value="">
              Not measured — count every trial as correct
            </option>
            {dataKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {renderLabelEditor()}

        <div className="space-y-1">
          <span className="font-semibold">Asset folder</span>
          <p className="text-gray-600">
            Only needed if the study points at images or sounds with relative
            paths like <code>stimuli/face1.png</code>.
          </p>
          {assetDir ? (
            <div className="inline-grid grid-cols-[1fr_auto] gap-2.5 border-2 border-gray-300 p-2 rounded items-center">
              <span>{assetDir}</span>
              <button
                onClick={() => setAssetDir('')}
                aria-label="Remove asset folder"
              >
                ✕
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleSelectAssetFolder}>
              Select asset folder
            </Button>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <Button onClick={handleFreeze}>Freeze marker codes</Button>
          <Button
            variant="secondary"
            onClick={() => props.navigate(SCREENS.COLLECT.route)}
          >
            Go to Collect
          </Button>
        </div>
      </div>
    );
  }

  function renderSectionContent() {
    switch (activeStep) {
      case IMPORTED_STEPS.MARKERS:
        return renderMarkers();
      case IMPORTED_STEPS.PREVIEW:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-3/4 h-full border border-brand rounded">
              <PreviewExperimentComponent
                title={props.title}
                params={props.params}
                experimentObject={props.experimentObject}
                isPreviewing={isPreviewing}
                onEnd={() => setIsPreviewing(false)}
                type={props.type}
              />
            </div>
            <div className="w-1/4 flex justify-center">
              <PreviewButton
                isPreviewing={isPreviewing}
                onClick={(event) => {
                  event.currentTarget.blur();
                  setIsPreviewing((previous) => !previous);
                }}
              />
            </div>
          </div>
        );
      case IMPORTED_STEPS.OVERVIEW:
      default:
        return (
          <div className="p-4 max-w-3xl space-y-3">
            <h1>{props.title}</h1>
            <p>
              This experiment was written outside BrainWaves. BrainWaves runs it
              and records the responses. Name its conditions on the Markers tab
              and it records EEG markers too.
            </p>
            <p className="text-gray-600">
              Study file: <code>{imported?.file}</code>
            </p>
          </div>
        );
    }
  }

  return (
    <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      <SecondaryNavComponent
        title="Imported Experiment"
        steps={IMPORTED_STEPS}
        activeStep={activeStep}
        onStepClick={setActiveStep}
        enableEEGToggle={
          <input
            type="checkbox"
            checked={props.isEEGEnabled}
            disabled={labels.length === 0}
            onChange={(event) => {
              props.ExperimentActions.SetEEGEnabled(event.target.checked);
              props.ExperimentActions.SaveWorkspace();
            }}
            className="scale-75"
          />
        }
      />
      {renderSectionContent()}
    </div>
  );
}
```

- [ ] **Step 4: Route `IMPORTED` to the new screen**

In `src/renderer/components/DesignComponent/index.tsx`, add after line 13:

```ts
import ImportedDesign from './ImportedDesignComponent';
```

replace lines 107-109 with:

```tsx
  if (props.type === EXPERIMENTS.CUSTOM) {
    return <CustomDesign {...props} />;
  }

  if (props.type === EXPERIMENTS.IMPORTED) {
    return <ImportedDesign {...props} />;
  }
```

and replace lines 74-88 with:

```tsx
function renderOverviewIcon(type: EXPERIMENTS) {
  switch (type) {
    case EXPERIMENTS.N170:
      return facesHousesOverview;
    case EXPERIMENTS.STROOP:
      return stroopOverview;
    case EXPERIMENTS.MULTI:
      return multitaskingOverview;
    case EXPERIMENTS.SEARCH:
      return searchOverview;
    case EXPERIMENTS.CUSTOM:
    case EXPERIMENTS.IMPORTED:
    default:
      return customOverview;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components/DesignComponent && npx tsc --noEmit`
Expected: PASS (9 new tests plus the two existing DesignComponent suites), no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/DesignComponent
git commit -m "feat: add the imported-only Markers tab that freezes condition codes"
```

---

## Task 13: Full-suite gate and an Electron click-through

Automated tests prove the units. This proves the feature, in the Electron window, against a realistically-shaped third-party timeline. `http://localhost:5173` has no `electronAPI` and no `pyodide://` — it will crash `LSLStatusListener` and Pyodide. Do not use it.

**Files:**
- No source changes expected. Any bug found here is fixed in the file that owns it, with its own commit.
- Scratch fixture written to `~/Desktop/faces_houses_jspsych.js` — deliberately outside the repo, since it is a user's file, not app code.

**Interfaces:**
- Consumes: everything from Tasks 1-12.
- Produces: nothing.

- [ ] **Step 1: Run the full gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all four pass.

- [ ] **Step 2: Write the click-through fixture**

Run:

```bash
cat > ~/Desktop/faces_houses_jspsych.js <<'TIMELINE'
const jsPsych = initJsPsych({
  on_finish: function () {
    console.log('author on_finish ran');
  },
});

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus:
    '<p>Press <b>f</b> for FACE and <b>j</b> for HOUSE.</p><p>Press any key to begin.</p>',
};

const trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable('shape'),
  choices: ['f', 'j'],
  trial_duration: 1000,
  data: {
    condition: jsPsych.timelineVariable('condition'),
    correct: true,
  },
};

const block = {
  timeline: [trial],
  timeline_variables: [
    { shape: '<h1>FACE</h1>', condition: 'Face' },
    { shape: '<h1>HOUSE</h1>', condition: 'House' },
  ],
  randomize_order: true,
  repetitions: 6,
};

jsPsych.run([instructions, block]);
TIMELINE
```

This fixture matters because `data.condition` is a `jsPsych.timelineVariable(...)`: it is exactly the case where `trialObject.data.condition` is an unresolved `TimelineVariable` at `on_trial_start`, so it exercises `resolveTrialData`'s real path rather than its fallback. `randomize_order: true` means encounter order differs run to run, which is what the frozen label order defends against.

- [ ] **Step 3: Click through the import**

Run: `npm run dev`

In the Electron window:
1. **EXPERIMENT BANK** — confirm the Custom card now reads **Experiment Builder**, with an **Import Experiment** card beside it.
2. Click **Import Experiment** and pick `~/Desktop/faces_houses_jspsych.js`.
3. Confirm you land on Design with tabs **OVERVIEW / MARKERS / PREVIEW**, and the Overview shows `experiment/faces_houses_jspsych.js`.
4. **MARKERS** — confirm the banner says EEG is off, the **Condition key** select lists `condition` and `correct`, and picking `condition` pre-populates `Face` = 1 and `House` = 2.
5. Set **Correctness key** to `correct`, click **Freeze marker codes**, and confirm the EEG toggle in the nav becomes enabled.
6. **PREVIEW** — click Preview and confirm the instructions render inside the preview pane (not full screen) with jsPsych styling, and `f`/`j` advance trials.
7. Confirm the workspace on disk:

```bash
cat ~/BrainWaves_Workspaces/faces_houses_jspsych/appState.json | jq '.type, .params.imported'
ls ~/BrainWaves_Workspaces/faces_houses_jspsych/experiment/
```

Expected: `"Imported"`, an `imported` object with `conditionLabels: ["Face","House"]` and `correctKey: "correct"`, and the copied `.js` on disk.

- [ ] **Step 4: Reload the workspace from Home**

Navigate Home → **MY EXPERIMENTS** → **Open Experiment** on `faces_houses_jspsych`. Confirm the Markers tab still shows `Face` = 1 / `House` = 2 and Preview still runs. This is the check that `experimentObject` being omitted from `appState.json` is genuinely covered by re-reading the copied file.

- [ ] **Step 5: Run Collect behavior-only and check the CSV**

Turn the EEG toggle **off** on the Design nav, go to Collect, enter subject `Sub1` / group `GroupA`, and run the whole 13-trial timeline to the end. Then:

```bash
head -3 ~/BrainWaves_Workspaces/faces_houses_jspsych/Data/Sub1/Behavior/Sub1-GroupA-1-behavior.csv
```

Expected: the header `trial_number,condition,reaction_time,response_given,correct_response,phase,trial_type,time_elapsed`, a **1-based** `trial_number` on the first data row, `condition` values of `Face`/`House` (never blank, never `[object Object]`), `response_given` of `yes`/`no`, and `correct_response` of `true`. Confirm `author on_finish ran` appears in the DevTools console — the author's callback chained rather than being clobbered.

- [ ] **Step 6: Confirm markers reach the EEG CSV**

This needs a device or the replay/fixture `EEGDriver` from `TODOS.md:10`. With one connected and the EEG toggle on, run the timeline again as subject `Sub2`, then:

```bash
cd ~/BrainWaves_Workspaces/faces_houses_jspsych/Data/Sub2/EEG
cut -d, -f6 Sub2-*-raw.csv | sort | uniq -c
cat Sub2-*-events.json
```

Expected: non-zero counts for both `1` and `2` in the `Marker` column, roughly 6 of each, and an events sidecar of `{"1":"Face","2":"House"}`. If every marker is `0`, the failure is upstream of analysis — check `injectMarker` wiring and `setActiveDriver`, not the registry.

- [ ] **Step 7: Confirm epochs come back non-empty**

Go to **Clean**. Expected: epoch counts per condition, not "No matching events". An empty result here with non-zero CSV markers means `event_id` and the CSV codes disagree — re-check that `pyodideEpics.loadEpochsEpic` derives `eventId` from `resolveMarkerRegistry` (Task 2, Step 5).

- [ ] **Step 8: Import a lab.js study**

Export a study from the lab.js builder (it produces `<title>-YYYY-MM-DD--HH:mm.study.json`), import it via the same card, and confirm it reaches Preview through `LabjsExperimentWindow`. Rename it to something without `:` first if the OS objects.

- [ ] **Step 9: Reject a v6 file**

```bash
printf "jsPsych.init({ timeline: [] });\n" > ~/Desktop/old_v6_task.js
```

Import it and confirm a toast naming `jsPsych.init` and linking the migration guide, that no `~/BrainWaves_Workspaces/old_v6_task` directory was created, and that you stay on Home.

- [ ] **Step 10: Commit any fixes**

```bash
git status --short
# Commit each fix separately, in the file that owns it.
```

---

## Task 14: Own the leftovers and record what was learned

`TODOS.md:31` and `ROADMAP.md:34` both list removing the leftover `.jspsych-*` strings as cleanup. They are now load-bearing, so they get adopted rather than deleted — and the two non-obvious upstream facts get written down where the next agent will find them.

**Files:**
- Modify: `src/renderer/app.global.css:63-65`, `:71-73`
- Modify: `TODOS.md:31`, and the "Done recently" list at `:43`
- Modify: `ROADMAP.md:34`
- Modify: `.llms/learnings.md`

**Interfaces:**
- Consumes: everything from Tasks 1-13.
- Produces: nothing.

- [ ] **Step 1: Own the CSS overrides**

In `src/renderer/app.global.css`, replace lines 63-65 and 71-73 with a single owned block placed after the `img` rule at line 59-61:

```css
/* jsPsych overrides. jspsych.css is imported by ImportedExperimentWindow and
   is fully .jspsych-*-scoped, so these are the only app-side adjustments: make
   an image stimulus fill the host div, and let the display element use the full
   width of the pane it is mounted in (Collect is full screen, Preview is not).
   These two rules predate this feature — they are leftovers from the pre-0.9.0
   jspsych-react runtime — and are now genuinely in use again. */
#jspsych-image-keyboard-response-stimulus {
  width: 100% !important;
}

.jspsych-display-element {
  width: 100% !important;
}
```

(The `button:active` rule that currently sits between them at lines 67-69 stays exactly where it is; move it above the block if the grouping reads better.)

- [ ] **Step 2: Retarget the TODOS entry**

In `TODOS.md`, replace line 31 with:

```markdown
- [ ] Lab.js cleanup — type lab.js data, and normalize the lab.js `onFinish` path to the typed `BehavioralRow`/`toBehavioralCsv` shape the imported runtime already uses (today the six columns `compute.js` requires are enforced by nothing but habit on that path). Deferred because it edits the P0 custom-experiment path awaiting the click-through QA above. **jsPsych is no longer cleanup**: it is a supported runtime for imported experiments (`src/renderer/utils/jspsych/`, `ImportedExperimentWindow`).
```

Add to "Done recently" (after line 44):

```markdown
- **Import experiments** (2026-08-21) — externally-authored jsPsych v8 timelines (`.js`) and lab.js studies (`.study.json`) import, preview, and run inside BrainWaves. `ExperimentWindow` became `LabjsExperimentWindow` behind a new `ExperimentRuntime` dispatcher; `ImportedExperimentWindow` owns all third-party execution. BrainWaves owns `initJsPsych` (forcing `override_safe_mode`, chaining author callbacks) and emits numeric markers from an ordered condition-label list frozen in a new imported-only Markers tab. `buildMarkerRegistryFromLabels` + `resolveMarkerRegistry` keep collection and MNE `event_id` derived from that one list. All 52 official `@jspsych/plugin-*` packages ship; jsPsych v6 is rejected at import. See `docs/superpowers/specs/2026-08-21-import-experiments-design.md`.
```

- [ ] **Step 3: Retarget the ROADMAP entry**

In `ROADMAP.md`, replace line 34 with:

```markdown
- Type lab.js data / normalize the lab.js behavioral path to typed rows (jsPsych is now a supported imported-experiment runtime, not a leftover)
```

- [ ] **Step 4: Record the learnings**

Append to `.llms/learnings.md`:

```markdown
## jsPsych: `trial.data` is unresolved at `on_trial_start`

`Trial.trialObject` is `deepCopy(description)` and `processParameters()` only
evaluates keys declared in the plugin's `info.parameters` — `data` is not one of
them. So for the near-universal `data: { condition: jsPsych.timelineVariable('cond') }`
pattern, `trialObject.data.condition` is still a `TimelineVariable` **object** in
an `on_trial_start` callback, not a string. Reading it directly means markers
silently never fire.

The resolver is `TimelineNode.getDataParameter()` — public on the `Trial` node,
evaluates functions, resolves timeline variables, merges parent-timeline `data`.
The running `Trial` is reachable from the instance at `on_trial_start` because
`Timeline.run()` assigns `currentChild` *before* awaiting the child. See
`resolveTrialData` in `src/renderer/utils/jspsych/host.ts`.

In `on_finish`, by contrast, the same `data` keys arrive **flat** on each row
(`Trial.processResult` spreads them). Two shapes, one key.

## jsPsych `override_safe_mode` is a prod-only trap

jsPsych's constructor checks `window.location.protocol == "file:"` and, unless
`override_safe_mode: true` is passed, sets `use_webaudio = false` and disables
video preloading. Production loads the renderer with `mainWindow.loadFile(...)`,
so the check fires; development runs on `http://localhost:5173` and looks
perfect. Same prod-only class as the Pyodide issue in `TODOS.md`.

## jsPsych plugin globals are mechanically derivable

Every official plugin's IIFE build assigns `'jsPsych' + CamelCase(dashed name)`
(the `makeRollupConfig("…")` argument). Verified against all 52 upstream
`rollup.config.mjs` files with zero mismatches, so `plugins.ts` and its test can
round-trip `info.name` back to the global key. The plugins are imported as ESM,
not as their IIFE builds, because each published `dist/index.js` starts with
`import { ParameterType } from 'jspsych'` and only Vite can resolve that.
```

- [ ] **Step 5: Verify nothing regressed**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/app.global.css TODOS.md ROADMAP.md .llms/learnings.md
git commit -m "docs: adopt jsPsych as a supported runtime and record the gotchas"
```

---

## Task 15: Hardware verification runbook

Everything in §3.2 of the design doc about marker timing is **inference from source**, not measurement. Nothing in this feature may be described as ERP-ready until this task's numbers exist. This is a runbook, not code: the deliverable is recorded measurements.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-21-import-experiments-design.md` (§9 open questions — replace the inference with the measured number)
- Modify: `TODOS.md` (add whatever this uncovers)

**Interfaces:**
- Consumes: a packaged build and a Muse headset.
- Produces: a measured `on_trial_start` + rAF offset, recorded in the design doc.

- [ ] **Step 1: Package the app**

Run: `npm run package`
Expected: an installable artifact in `release/`. Launch **that**, not `npm run dev` — the whole point is `file://`.

- [ ] **Step 2: Confirm WebAudio survives `file://`**

Import a timeline using `jsPsychAudioKeyboardResponse` with a sound from an authorized asset folder. In the packaged app, confirm the sound plays and the DevTools console shows **no** jsPsych warning containing "Web Audio and video preloading have been disabled". If that warning appears, `override_safe_mode: true` is not reaching the constructor — check `buildJsPsychOptions` is not being shadowed by an author-supplied `override_safe_mode: false` (author options are spread *before* ours, so this should be impossible; if it happens, the spread order regressed).

- [ ] **Step 3: Measure the marker offset against the Muse sample clock**

Connect a Muse, EEG on, and run the Task 13 fixture as a new subject. Then, from the recording:

```bash
cd ~/BrainWaves_Workspaces/faces_houses_jspsych/Data/<subject>/EEG
# First 20 rows carrying a non-zero marker, with their timestamps.
awk -F, 'NR==1 || $6!=0' <subject>-*-raw.csv | head -21
```

Compare each marker's EEG-sample timestamp with the visual stimulus onset. A photodiode on the screen is the gold standard; failing that, use a high-frame-rate screen recording with the system clock visible. Record the mean and spread.

`synchronizeTimestamp` (`src/renderer/utils/eeg/muse.ts:179`) attaches a marker to the EEG sample falling within `INTER_SAMPLE_INTERVAL` (`muse.ts:27`, `-3.90625 ms` at 256 Hz) *before* the marker's own timestamp, so transport delay does not displace it as long as it arrives before that sample has flowed through the observable. Any residual offset is the `on_trial_start` + rAF gap this step is measuring.

- [ ] **Step 4: Record the result in the design doc**

In `docs/superpowers/specs/2026-08-21-import-experiments-design.md`, replace the second bullet of §9 ("What is the true offset between `on_trial_start` + rAF and physical stimulus onset?") with the measured mean and spread, the method used, and the date. If the offset is large enough to matter for ERP work, open a TODOS item for the trial-level `on_load` alternative and note there that §3.2 rejected timeline-walking on dynamic-timeline grounds.

- [ ] **Step 5: Note the async-plugin caveat with a number**

Repeat Step 3 with an `jsPsychAudioKeyboardResponse` or `jsPsychVideoKeyboardResponse` trial. Those plugins write DOM in a later task, so the rAF marker fires early by construction. Record how early. If it is significant, add a TODOS item; do **not** silently "fix" it by moving the marker, because that would change timing for the synchronous plugins that make up almost every classroom experiment.

- [ ] **Step 6: Commit the measurements**

```bash
git add docs/superpowers/specs/2026-08-21-import-experiments-design.md TODOS.md
git commit -m "docs: record measured jsPsych marker offset on Muse hardware"
```

---

## Coverage map (spec → task)

| Spec section | Where it lands |
|---|---|
| §1 Markers contract | Tasks 2, 7 |
| §1 Behavioral schema contract | Task 3 |
| §1 Stimulus registry contract | Task 2 |
| §1 Prior art (`FILE_TYPES.TIMELINE`, `.jspsych-*` CSS) | Tasks 10, 11, 14 |
| §2 decision 1 (opt-in adapter, behavior-only fallback) | Tasks 12 (EEG forced off), 3 |
| §2 decision 2 (same renderer, distinct component) | Tasks 8, 9 |
| §2 decision 3 (single `.js` + optional assets) | Tasks 10, 6, 12 |
| §2 decision 4 (all official plugins) | Task 5 |
| §2 decision 5 (author labels, BrainWaves codes) | Tasks 2, 12 |
| §2 decision 6 (post-import Markers tab, static scan) | Tasks 4, 12 |
| §2 decision 7 (copy the file, reference assets) | Task 10 |
| §2 decision 8 (relabel Custom only) | Task 11 |
| §3.1 runtime seam | Task 8 |
| §3.2 jsPsych host, `override_safe_mode`, chained callbacks, marker timing | Task 7 (+ Task 15 measurement) |
| §3.3 plugin loading, v6 rejection | Tasks 5, 4, 11 |
| §3.4 lab.js import | Tasks 8, 10, 11. Limitation made explicit in the Markers tab (Task 12): an imported lab.js study exports behavior through lab.js's own datastore, and emits markers only if the study itself calls `parameters.callbackForEEG` — the hook BrainWaves hand-wires into the graphs it authors. Otherwise it is behavior-only, which is decision 1's already-first-class mode. |
| §4.1-4.3 import flow, workspace copy, asset folder | Tasks 10, 11, 12, 6 |
| §4.4 Markers tab | Task 12 |
| §4.5 no conditions → behavior-only | Task 12 |
| §5.1 markers need no new abstraction | Tasks 7, 8 (`eventCallback` unchanged) |
| §5.2 second registry constructor | Task 2 |
| §5.3 behavioral mapping table | Task 3 |
| §6 security posture | Task 9 (documented in the component) |
| §7 files touched | File Structure table |
| §8 unit verification | Tasks 2, 3, 4, 5, 7 |
| §8 integration verification | Task 13 |
| §8 hardware verification | Task 15 |
| §9 open question: measured offset | Task 15 |
| §9 open question: `contextBridge` shadowing | Explicitly **not** in scope — §6 records the exposure as accepted for v1, and §9 marks the mitigation as untested. Not promised anywhere in this plan. |
| §10 out of scope | Honoured: no `@jspsych-contrib`, no `jspsych-builder` bundles, no v6, no extensions, no in-app authoring, no realm isolation, and the lab.js typed-row conversion is a named follow-up in `TODOS.md` (Task 14). |
