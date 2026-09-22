# Marker Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One marker pipeline: experiment hooks emit condition labels, the marker util resolves label → code and fans out to both sinks on one clock, and every device adapter stamps the Marker column by the same timestamp-attached rule.

**Architecture:** Deepen `src/renderer/utils/eeg/markerRegistry.ts` (the marker util) with a shared `createMarkerStamper` factory implementing the adopted timing rule, and add `emitMarker` to `src/renderer/utils/eeg/index.ts` (the existing "unified marker dispatch"). The runtime seam (`ExperimentRuntimeProps.eventCallback`) carries labels, not numbers. Per-experiment condition mapping stays in each pack's hooks.

**Tech Stack:** TypeScript (strict), Vitest, redux-observable, lab.js, jsPsych, muse-js, RxJS.

**Spec:** `CONTEXT.md` (Marker code contract, Marker util, Condition label, Marker timing rule). Design decisions settled in the architecture review grilling: hooks emit labels; the util owns code assignment, one clock, and fan-out; the marker timing rule is `{code, timestamp}` attached to the one sample whose interval contains the timestamp (error ≤ 1 sample) — adopted in the marker-timestamp PR, `src/renderer/utils/eeg/__tests__/muse.test.ts` is its executable spec.

## Global Constraints

- Labels, never numbers, cross `callbackForEEG` / `eventCallback`. The numeric code exists only inside the marker util and the adapter `injectMarker` contract.
- `resolveMarkerRegistry(params)` is the only registry entry point (markerRegistry.ts docblock contract).
- Marker column semantics: exactly one sample per marker event, chosen by timestamp interval containment (`sample.timestamp + sampleIntervalMs > markerTimestamp`, and not yet marked). Last un-stamped injection wins (matches Muse).
- Markers injected before a stream exists are dropped (every adapter's current contract; muse.test.ts pins it).
- One clock at emission: `Date.now()` epoch ms, forwarded to both sinks unchanged.
- Comment style: comments on definitions only; no narrating comments inside logic.
- All existing `markerRegistry.test.ts` and `muse.test.ts` cases stay green unchanged.
- LSL inlet mode is out of scope (its `injectMarker` no-ops by design).

---

### Task 1: Shared marker stamper (the timing rule)

**Files:**
- Create: `src/renderer/utils/eeg/__tests__/markerStamper.test.ts`
- Modify: `src/renderer/utils/eeg/markerRegistry.ts`

**Interfaces:**
- Consumes: `EEGData` (`{ data: number[]; timestamp: number; marker?: number }`, `src/renderer/constants/interfaces.ts`).
- Produces: `createMarkerStamper(sampleIntervalMs: number): { inject(code: number, timestamp: number): void; clear(): void; stamp<T extends EEGData>(sample: T): T }` exported from `markerRegistry.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
/**
 * The adopted marker timing rule (CONTEXT.md "Marker timing rule"): a marker is
 * buffered as {code, timestamp} and attached to the one sample whose interval
 * contains the timestamp — error bounded to one sample interval. These cases
 * mirror muse.test.ts, which is the executable spec the three adapters share.
 */
import { describe, it, expect } from 'vitest';
import { createMarkerStamper } from '../markerRegistry';
import type { EEGData } from '../../../constants/interfaces';

const INTERVAL = 1000 / 256;
const sample = (timestamp: number): EEGData => ({ data: [0], timestamp });

describe('createMarkerStamper', () => {
  it('attaches the marker to the sample whose interval contains its timestamp', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(42, 1005);
    const seen = [1000, 1003.9, 1007.8].map((t) => stamper.stamp(sample(t)));
    expect(seen[0].marker).toBeUndefined();
    expect(seen[1].marker).toBe(42);
    expect(seen[2].marker).toBeUndefined();
  });

  it('does not attach before the containing interval', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(77, 1015);
    const seen = [1000, 1003.9, 1007.8, 1011.7].map((t) =>
      stamper.stamp(sample(t))
    );
    expect(seen.slice(0, 3).every((s) => s.marker === undefined)).toBe(true);
    expect(seen[3].marker).toBe(77);
  });

  it('attaches a late marker to the next sample', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(5, 2000);
    expect(stamper.stamp(sample(2010)).marker).toBe(5);
  });

  it('lets a newer injection replace an un-stamped one', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(1, 1005);
    stamper.inject(2, 1005);
    expect(stamper.stamp(sample(1003.9)).marker).toBe(2);
  });

  it('clear() drops a pending marker', () => {
    const stamper = createMarkerStamper(INTERVAL);
    stamper.inject(9, 1005);
    stamper.clear();
    expect(stamper.stamp(sample(1003.9)).marker).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/markerStamper.test.ts`
Expected: FAIL — `createMarkerStamper` is not exported from `../markerRegistry`.

- [ ] **Step 3: Implement `createMarkerStamper` in `markerRegistry.ts`**

Add below `resolveMarkerRegistry` (docstring on the definition):

```ts
export interface MarkerStamper {
  /** Queue `{code, timestamp}`; replaces any un-stamped marker (last wins). */
  inject(code: number, timestamp: number): void;
  /** Drop the pending marker (stream teardown / restart). */
  clear(): void;
  /** Attach the pending marker to the one sample whose interval contains its timestamp. */
  stamp<T extends EEGData>(sample: T): T;
}

/**
 * The shared marker timing rule (CONTEXT.md "Marker timing rule"): buffer
 * `{code, timestamp}`, attach it to the first sample whose collection interval
 * contains the timestamp, then forget it — one marked sample per event, error
 * bounded to one sample interval. Every adapter stamps through this so the
 * Marker column has one shape regardless of device.
 */
export const createMarkerStamper = (
  sampleIntervalMs: number
): MarkerStamper => {
  let pending: { code: number; timestamp: number } | null = null;
  return {
    inject(code, timestamp) {
      pending = { code, timestamp };
    },
    clear() {
      pending = null;
    },
    stamp(sample) {
      if (pending === null) return sample;
      if (sample.timestamp + sampleIntervalMs > pending.timestamp) {
        const marked = { ...sample, marker: pending.code };
        pending = null;
        return marked;
      }
      return sample;
    },
  };
};
```

Add `EEGData` to the existing `interfaces` import at the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/markerStamper.test.ts src/renderer/utils/eeg/__tests__/markerRegistry.test.ts`
Expected: PASS, and the existing markerRegistry tests stay green.

---

### Task 2: One emission point — `emitMarker`

**Files:**
- Create: `src/renderer/utils/eeg/__tests__/emitMarker.test.ts`
- Modify: `src/renderer/utils/eeg/index.ts`

**Interfaces:**
- Consumes: `MarkerRegistry` (`markerRegistry.ts`), `injectMarker` (index.ts), `sendMarker` (`lslBridge.ts`).
- Produces: `emitMarker(registry: MarkerRegistry, label: string, time?: number): void` exported from `src/renderer/utils/eeg/index.ts`. `time` defaults to `Date.now()`.

- [ ] **Step 1: Write the failing tests**

```ts
/**
 * emitMarker is the single emission point: label → code via the registry, one
 * clock, both sinks (driver injectMarker + LSL sendMarker). The bugs this
 * guards: three call sites once chose their own clocks, and the LSL label was
 * String(code) instead of the condition label.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitMarker, setActiveDriver } from '../index';
import { fixtureDriver } from '../fixture';
import { sendMarker } from '../lslBridge';
import type { MarkerRegistry } from '../markerRegistry';

vi.mock('../lslBridge', () => ({ sendMarker: vi.fn() }));
vi.mock('../muse', () => ({ museDriver: {} }));
vi.mock('../neurosity', () => ({ neurosityDriver: {} }));

const registry: MarkerRegistry = {
  codeToLabel: { 1: 'Face', 2: 'House' },
  eventId: { Face: 1, House: 2 },
};

describe('emitMarker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActiveDriver(null);
  });

  it('resolves the label to its code and writes both sinks on one clock', () => {
    const inject = vi.spyOn(fixtureDriver, 'injectMarker').mockImplementation(() => {});
    setActiveDriver('FIXTURE' as never);
    emitMarker(registry, 'House', 1234);
    expect(inject).toHaveBeenCalledWith(2, 1234);
    expect(sendMarker).toHaveBeenCalledWith({
      label: 'House',
      rendererTimestamp: 1234,
    });
  });

  it('logs loudly and writes nothing for an unknown label', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const inject = vi.spyOn(fixtureDriver, 'injectMarker').mockImplementation(() => {});
    emitMarker(registry, 'Stroop', 1);
    expect(error).toHaveBeenCalled();
    expect(inject).not.toHaveBeenCalled();
    expect(sendMarker).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/emitMarker.test.ts`
Expected: FAIL — `emitMarker` is not exported from `../index`.

- [ ] **Step 3: Implement `emitMarker` in `src/renderer/utils/eeg/index.ts`**

```ts
/**
 * The one emission point. Resolves the condition label to its numeric code via
 * the registry, stamps one clock, and writes both sinks (driver `injectMarker`
 * + LSL `sendMarker`). Unknown labels are the worst silent failure in the app
 * (an all-zero Marker column discovered after 25 children were recorded), so
 * they are logged loudly and write nothing.
 */
export const emitMarker = (
  registry: MarkerRegistry,
  label: string,
  time: number = Date.now()
): void => {
  const code = registry.eventId[label];
  if (code === undefined) {
    console.error(
      `emitMarker: unknown condition label "${label}" — no marker written. ` +
        `Check the experiment's declared conditions (Markers tab / params.stimuli).`
    );
    return;
  }
  injectMarker(code, time);
  sendMarker({ label, rendererTimestamp: time });
};
```

Imports to add: `sendMarker` from `./lslBridge`, and `MarkerRegistry` type from `./markerRegistry` (type-only where possible). Extend the file docstring: emission goes through `emitMarker`, not `injectMarker` directly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/emitMarker.test.ts`
Expected: PASS.

---

### Task 3: The runtime seam carries labels

**Files:**
- Modify: `src/renderer/components/ExperimentRuntime.tsx` (the `ExperimentRuntimeProps` contract)
- Modify: `src/renderer/components/CollectComponent/RunComponent.tsx:107-120` (the `eventCallback` callback)
- Modify: `src/renderer/components/LabjsExperimentWindow.tsx:75-78` (`callbackForEEG` wiring)
- Modify: `src/renderer/utils/jspsych/host.ts` (`on_trial_start` emission + drop the registry lookup)
- Modify: `src/renderer/components/ImportedExperimentWindow.tsx` (drop `buildMarkerRegistryFromLabels` + the `registry` config key)
- Modify: `src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx:47-53` (contract changed)

**Interfaces:**
- Consumes: `emitMarker`, `resolveMarkerRegistry` (Tasks 2, existing).
- Produces: `ExperimentRuntimeProps.eventCallback: (label: string, time: number) => void` — the seam every runtime (lab.js hooks, jsPsych host) honours.

- [ ] **Step 1: Update the ImportedExperimentWindow test to the new contract**

Replace the registry assertions in `it('passes the declared registry and mapping through')` — rename to `it('passes the mapping through')` and assert only the mapping (the registry now resolves at the emission point, not in the host):

```ts
  it('passes the mapping through', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    const [, config] = createJsPsychHost.mock.calls[0] as unknown as [
      string,
      { mapping: unknown },
    ];
    expect(config.mapping).toEqual({
      conditionKey: 'condition',
      correctKey: 'correct',
    });
  });
```

- [ ] **Step 2: Run tests to verify the expected failure**

Run: `npx vitest run src/renderer/components/__tests__/ImportedExperimentWindow.test.tsx`
Expected: FAIL on the renamed test (`config` still carries `registry`; the mock's config shape assertions and remaining cases show the old contract).

- [ ] **Step 3: Migrate the seam**

`ExperimentRuntime.tsx`:

```ts
export interface ExperimentRuntimeProps {
  title: string;
  fullScreen?: boolean;
  /** Emitted at stimulus onset with the trial's condition label and one clock reading. */
  eventCallback: (label: string, time: number) => void;
  onFinish: (csv: string) => void;
}
```

`RunComponent.tsx` — replace the `eventCallback` callback body (and swap `injectMarker`/`sendMarker` imports for `emitMarker` + `resolveMarkerRegistry`):

```ts
  const registry = useMemo(() => resolveMarkerRegistry(params), [params]);
  const eventCallback = useCallback(
    (label: string, time: number) => {
      if (isEEGEnabled) {
        emitMarker(registry, label, time);
      }
    },
    [isEEGEnabled, registry]
  );
```

`LabjsExperimentWindow.tsx`:

```ts
    experimentToRun.parameters.callbackForEEG = (label: string) => {
      eventCallback(label, Date.now());
    };
```

`host.ts` `on_trial_start` — the label is already resolved from trial data; drop the `registry.eventId` lookup and the `registry` field of `BuildJsPsychOptionsArgs`, and emit the label:

```ts
    if (typeof label === 'string') {
      // on_trial_start fires BEFORE the plugin writes DOM (Trial.ts:63-72).
      // For a synchronous plugin the write happens later in the same task, so
      // this rAF callback lands after the write and before paint. Async
      // plugins (audio/video preload) write in a later task and take an early
      // marker.
      requestAnimationFrame(() => eventCallback(label, Date.now()));
    } else if (label !== undefined) {
      // (keep the existing loud unresolved-timeline-variable error unchanged)
    }
```

`ImportedExperimentWindow.tsx` — remove the `buildMarkerRegistryFromLabels(...)` construction and the `registry` key passed to `buildJsPsychOptions` (keep `mapping`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components/__tests__/ src/renderer/utils/jspsych/__tests__/`
Expected: PASS (host.test.ts may reference `registry` in its `buildJsPsychOptions` fixtures — update those to the new arg shape if the contract change breaks them).

---

### Task 4: Hooks emit labels; params declare conditions

**Files:**
- Modify: `src/renderer/utils/labjs/functions.ts:191-193` (`triggerEEGCallback` → label; add `emitStroopCondition`)
- Modify: `src/renderer/experiments/multitasking/utils.ts:119-124` (`triggerEEGCallback` → `this.parameters.cond`)
- Create: `src/renderer/experiments/search/utils.ts` addition (`emitSearchCondition`)
- Modify: `src/renderer/experiments/search/experiment.ts:325-328` (inline hook delegates to `emitSearchCondition`)
- Modify: `src/renderer/experiments/stroop/experiment.ts:617-621` (`run: emitStroopCondition`, import it)
- Modify: `src/renderer/experiments/stroop/params.ts` (add `condition` to both stimuli, add `satisfies ExperimentParameters`)
- Modify: `src/renderer/experiments/search/params.ts` (`stimulus:` → `stimuli:`, add `condition`, add `satisfies`)
- Modify: `src/renderer/experiments/multitasking/params.ts` (add `stimuli` derived from `stimulus1/2` with `condition`, add `satisfies`)
- Create: `src/renderer/utils/eeg/__tests__/markerContract.test.ts`

**Interfaces:**
- Consumes: `resolveMarkerRegistry`, hook `this.parameters.callbackForEEG(label)`.
- Produces: `emitStroopCondition` (`utils/labjs/functions.ts`), `emitSearchCondition` (`experiments/search/utils.ts`). Labels: stroop `'Congruent' | 'Incongruent'`; search `'5 and 10 letters' | '15 and 20 letters'`; multitasking `'Switching' | 'No switching'` (its `cond` values); generic `triggerEEGCallback` emits `stimulus.condition` (faces_houses `'Face' | 'House'`; custom condition titles).

- [ ] **Step 1: Write the failing contract tests** (this is the inversion-killer)

```ts
/**
 * Regression: every hook-emitted condition label must resolve to the marker
 * code that pack's params declare. Three hooks once hand-rolled `? 1 : 2`
 * ternaries that contradicted their own params — multitasking inverted
 * (Switching emitted 1, params declared 2) and search pointed at the wrong
 * stimulus. Labels + this contract make that bug class unrepresentable.
 */
import { describe, it, expect, vi } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import { resolveMarkerRegistry } from '../markerRegistry';
import {
  triggerEEGCallback as emitFaceHouseCondition,
  emitStroopCondition,
} from '../../labjs/functions';
import { triggerEEGCallback as emitMultiCondition } from '../../experiments/multitasking/utils';
import { emitSearchCondition } from '../../experiments/search/utils';
import { params as stroopParams } from '../../experiments/stroop/params';
import { params as searchParams } from '../../experiments/search/params';
import { params as multiParams } from '../../experiments/multitasking/params';
import { params as facesParams } from '../../experiments/faces_houses/params';

const emit = (
  fn: (this: unknown) => void,
  parameters: Record<string, unknown>
): string => {
  let emitted: string | undefined;
  fn.call({
    parameters: { ...parameters, callbackForEEG: (l: string) => (emitted = l) },
    data: {},
  });
  return emitted!;
};

it('stroop: congruent trial emits the label declared as STIMULUS_2', () => {
  const label = emit(emitStroopCondition, { congruent: 'yes' });
  expect(resolveMarkerRegistry(stroopParams).eventId[label]).toBe(
    EVENTS.STIMULUS_2
  );
});

it('stroop: incongruent trial emits the label declared as STIMULUS_1', () => {
  const label = emit(emitStroopCondition, { congruent: 'no' });
  expect(resolveMarkerRegistry(stroopParams).eventId[label]).toBe(
    EVENTS.STIMULUS_1
  );
});

it('search: a 5/10-letter trial emits the label declared as STIMULUS_1', () => {
  const label = emit(emitSearchCondition, { size: '5' });
  expect(resolveMarkerRegistry(searchParams).eventId[label]).toBe(
    EVENTS.STIMULUS_1
  );
});

it('search: a 15/20-letter trial emits the label declared as STIMULUS_2', () => {
  const label = emit(emitSearchCondition, { size: '15' });
  expect(resolveMarkerRegistry(searchParams).eventId[label]).toBe(
    EVENTS.STIMULUS_2
  );
});

it('multitasking: Switching emits the label declared as STIMULUS_2', () => {
  const label = emit(emitMultiCondition, { cond: 'Switching' });
  expect(resolveMarkerRegistry(multiParams).eventId[label]).toBe(
    EVENTS.STIMULUS_2
  );
});

it('multitasking: No switching emits the label declared as STIMULUS_1', () => {
  const label = emit(emitMultiCondition, { cond: 'No switching' });
  expect(resolveMarkerRegistry(multiParams).eventId[label]).toBe(
    EVENTS.STIMULUS_1
  );
});

it('faces/houses: the generic hook emits the declared condition label', () => {
  const label = emit(emitFaceHouseCondition, { condition: 'Face' });
  expect(resolveMarkerRegistry(facesParams).eventId[label]).toBe(
    EVENTS.STIMULUS_1
  );
});

it('every built-in pack resolves to a non-empty registry', () => {
  for (const params of [stroopParams, searchParams, multiParams, facesParams]) {
    expect(Object.keys(resolveMarkerRegistry(params).eventId).length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/markerContract.test.ts`
Expected: FAIL — `emitStroopCondition` / `emitSearchCondition` missing, hooks emit numbers, search registry empty (`stimulus:` key), multitasking registry empty (no `stimuli`).

- [ ] **Step 3: Migrate hooks and params**

`functions.ts`:

```ts
/** Emits this trial's condition label to the marker pipeline. */
export function triggerEEGCallback(this: lab.core.Component) {
  this.parameters.callbackForEEG(
    (this.parameters as unknown as Stimulus).condition
  );
}

/** Emits 'Congruent'/'Incongruent' for the stroop trial's derived congruency. */
export function emitStroopCondition(this: lab.core.Component) {
  this.parameters.callbackForEEG(
    this.parameters.congruent === 'yes' ? 'Congruent' : 'Incongruent'
  );
}
```

`multitasking/utils.ts` `triggerEEGCallback`:

```ts
export function triggerEEGCallback(this: lab.core.Component) {
  this.parameters.callbackForEEG(this.parameters.cond);
  this.data.correct = 'empty';
}
```

`search/utils.ts`:

```ts
/** Emits the search trial's condition label from its display size. */
export function emitSearchCondition(this: lab.html.Screen) {
  this.parameters.callbackForEEG(
    parseInt(this.parameters.size, 10) < 13
      ? '5 and 10 letters'
      : '15 and 20 letters'
  );
}
```

`search/experiment.ts` inline hook: first statement becomes `emitSearchCondition.call(this);` (import from `./utils`), the DOM code below it is untouched.

`stroop/experiment.ts`: replace the anonymous `run` with `run: emitStroopCondition` and add it to the existing `import { initStroopTrial, emitStroopCondition } from '../../utils/labjs/functions';`.

`stroop/params.ts` — stimuli entries gain `condition` (`'Incongruent'` / `'Congruent'`, matching their `title`) and the export gains `satisfies ExperimentParameters` (import the type).

`search/params.ts` — `stimulus:` becomes `stimuli:`; entries gain `condition: '5 and 10 letters'` / `'15 and 20 letters'`; add `satisfies ExperimentParameters`.

`multitasking/params.ts` — keep `stimulus1/2`, add:

```ts
  stimuli: [
    { title: 'No switching', condition: 'No switching', type: EVENTS.STIMULUS_1, response: '1' },
    { title: 'Switching', condition: 'Switching', type: EVENTS.STIMULUS_2, response: '9' },
  ],
```

and add `satisfies ExperimentParameters`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/markerContract.test.ts && npm run typecheck`
Expected: PASS, and typecheck green (this is where `satisfies` proves the `stimulus:`-class typo is now a compile error).

---

### Task 5: All adapters stamp through the shared rule

**Files:**
- Modify: `src/renderer/utils/eeg/muse.ts` (replace `pendingMuseMarker` with the stamper)
- Modify: `src/renderer/utils/eeg/neurosity.ts` (replace `pendingMarker: number` with the stamper)
- Modify: `src/renderer/utils/eeg/fixture.ts` (replace `activeMarker`/`pendingMarker` latch with the stamper; baked-in CSV markers pass through per row)
- Modify: `src/renderer/utils/eeg/__tests__/fixture.test.ts` (three marker tests rewrite to the adopted rule)
- Modify: `src/renderer/utils/eeg/__tests__/neurosity.test.ts` (the marker test rewrites to the adopted rule)

**Interfaces:**
- Consumes: `createMarkerStamper` (Task 1).
- Produces: unchanged `EEGDriver` contract (`injectMarker(code, time)`); `muse.test.ts` must stay green untouched.

- [ ] **Step 1: Rewrite the fixture marker tests to the adopted rule**

Replace the three latch tests in `fixture.test.ts` with:

```ts
  it('attaches an injected marker to the one sample whose interval contains it', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 5; i++) vi.advanceTimersToNextTimer();

    injectFixtureMarker(42, Date.now() + 2 * SAMPLE_INTERVAL_MS);
    for (let i = 0; i < 5; i++) vi.advanceTimersToNextTimer();

    const marked = seen.filter((s) => s.marker === 42);
    expect(marked).toHaveLength(1);
  });

  it('replays a baked-in CSV marker on its own row only', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 135; i++) vi.advanceTimersToNextTimer();

    const marked = seen.filter((s) => s.marker !== undefined);
    expect(marked).toHaveLength(1);
    expect(marked[0].data[0]).toBe(128);
    expect(marked[0].marker).toBe(1);
  });

  it('an injected marker wins over the baked-in marker on its sample', async () => {
    vi.useFakeTimers();
    const obs = await createRawFixtureObservable();
    const seen: EEGData[] = [];
    obs.subscribe((d) => seen.push(d));
    for (let i = 0; i < 127; i++) vi.advanceTimersToNextTimer();

    // Row 128 fires next and carries baked-in marker 1; land the injection there.
    injectFixtureMarker(99, Date.now() + SAMPLE_INTERVAL_MS);
    vi.advanceTimersToNextTimer();

    const row128 = seen.find((s) => s.data[0] === 128);
    expect(row128?.marker).toBe(99);
  });
```

(`SAMPLE_INTERVAL_MS` is already module-defined in fixture.ts; export or duplicate the constant in the test as `1000 / 256`.) Keep the `injectMarker before stream starts does not leak` test.

- [ ] **Step 2: Rewrite the neurosity marker test to the adopted rule**

In `neurosity.test.ts`, replace `attaches an injected marker to the next emitted sample, once` with a case that injects a timestamp inside one sample's interval and asserts exactly that sample is marked (samples in the fake epoch are `startTime + i * (1000 / 256)`):

```ts
  it('attaches an injected marker to the sample whose interval contains its timestamp', async () => {
    const observable = await createRawNeurosityObservable();
    const seen: EEGData[] = [];
    const sub = observable.subscribe((d) => seen.push(d));

    // Epoch startTime 2000 → samples at 2000, ~2003.9, ~2007.8 (256 Hz).
    injectNeurosityMarker(2, 2005);
    h.holder.observer?.next({
      data: [
        [10, 11, 12],
        [20, 21, 22],
      ],
      info: { samplingRate: 256, startTime: 2000 },
    });

    expect(seen[0].marker).toBeUndefined();
    expect(seen[1].marker).toBe(2);
    expect(seen[2].marker).toBeUndefined();
    sub.unsubscribe();
  });
```

- [ ] **Step 3: Run tests to verify the expected failures**

Run: `npx vitest run src/renderer/utils/eeg/__tests__/fixture.test.ts src/renderer/utils/eeg/__tests__/neurosity.test.ts`
Expected: FAIL — fixture still latches (`activeMarker`) and neurosity still stamps the next sample.

- [ ] **Step 4: Migrate the three adapters**

Each adapter replaces its marker state with a stamper (module-level `let markerStamper: MarkerStamper | null = null` created in `createRaw*Observable`, nulled on teardown; `inject*Marker` calls `markerStamper?.inject(code, timestamp)` — the no-stream no-op contract is preserved). Sample emission routes through `markerStamper!.stamp(sample)`.

`muse.ts` keeps its behavior exactly: replace `pendingMuseMarker` with the stamper created in `createRawMuseObservable` (`createMarkerStamper(MUSE_SAMPLE_INTERVAL_MS)`, cleared via `disconnectFromMuse`/stream start), and `map((sample) => markerStamper!.stamp(sample))` replaces the inline `pendingMuseMarker` block. `muse.test.ts` must pass unchanged.

`neurosity.ts`: `createRawNeurosityObservable` creates `createMarkerStamper(sampleIntervalMs)` per epoch-driven loop — note the interval is known per epoch (`info.samplingRate`); create the stamper lazily on the first epoch and keep one per stream. `injectNeurosityMarker` drops its `_time`-ignoring shape and forwards both arguments. The `eegData` construction becomes `subject.next(markerStamper!.stamp(eegData))`.

`fixture.ts`: delete `activeMarker`; the emission body becomes `subject.next(markerStamper!.stamp({ data: [...row.data], timestamp: ... }))` with a per-row fallback — `stamp` result carries `marker` only for injected markers, so baked-in pass-through is `const stamped = markerStamper!.stamp(eegData); if (stamped.marker === undefined && row.marker !== null) stamped.marker = row.marker;` (write the fallback on the produced object before `next`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/renderer/utils/eeg/`
Expected: PASS — markerStamper, emitMarker, markerContract, muse (unchanged), fixture, neurosity all green.

---

### Task 6: Consumers resolve through the one entry point

**Files:**
- Modify: `src/renderer/components/CleanComponent/index.tsx` (`codeToLabelFor` → `resolveMarkerRegistry(params).codeToLabel`)
- Create: `src/renderer/components/CleanComponent/__tests__/CleanLegend.test.tsx` (copy the render harness from `CleanRejections.test.tsx`)

**Interfaces:**
- Consumes: `resolveMarkerRegistry`.
- Produces: none (call-site migration).

- [ ] **Step 1: Write the failing test**

Render `Clean` with `params={{ imported: { kind: 'jspsych', file: 'x.js', conditionKey: 'c', correctKey: '', conditionLabels: ['Face', 'House'] } }}` and assert the epoch legend resolves imported labels (e.g. `screen.findByText('Face')` against the legend rendered with `codeToLabel`), mirroring the `CleanRejections.test.tsx` harness. Expected pre-fix: no legend labels (the `buildMarkerRegistry([])` bypass yields empty maps for imported params).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/renderer/components/CleanComponent/__tests__/CleanLegend.test.tsx`

- [ ] **Step 3: Swap the call site**

```ts
// Memoized by params reference so we don't rebuild the registry every render.
const codeToLabelFor = memoize(
  (params: ExperimentParameters | null | undefined) =>
    resolveMarkerRegistry(params).codeToLabel
);
```

Call site: `const codeToLabel = codeToLabelFor(props.params);`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/components/CleanComponent/`
Expected: PASS.

---

### Task 7: Docs sync and full verification

**Files:**
- Modify: `.claude/skills/redux-observable-epochs/SKILL.md` (marker injection paragraph: the UI calls `emitMarker(registry, label, time)`; `buildMarkerRegistry` details stay)
- Modify: `src/shared/lslTypes.ts` (`LSLMarker.label` doc: condition label; `rendererTimestamp` doc: same clock as the driver marker)

- [ ] **Step 1: Update the two doc sites** (factual sync with Tasks 2–3 — symbols renamed at the seam).

- [ ] **Step 2: Full suite**

Run: `npm run test-all`
Expected: green (lint, typecheck, build, all tests, build-check).

- [ ] **Step 3: Electron smoke test**

Run: `node tests/electron-smoke.mjs`
Expected: PASS.

- [ ] **Step 4: Commit the workstream** (include the Task 1–7 files only; the dead-weight changes from the previous workstream stay uncommitted and separate):

```bash
git add src/renderer/utils/eeg src/renderer/components/ExperimentRuntime.tsx \
  src/renderer/components/CollectComponent/RunComponent.tsx \
  src/renderer/components/LabjsExperimentWindow.tsx \
  src/renderer/components/ImportedExperimentWindow.tsx \
  src/renderer/components/CleanComponent src/renderer/utils/labjs \
  src/renderer/utils/jspsych src/renderer/experiments \
  src/shared/lslTypes.ts .claude/skills/redux-observable-epochs/SKILL.md
git commit -m "feat: unify marker pipeline — labels at the seam, one emit point, shared stamping rule"
```

## Self-review

- Spec coverage: label-at-seam (Task 3–4), one emit point + clock (Task 2), shared timing rule (Tasks 1, 5), single registry entry point (Tasks 4, 6), search `stimulus:` drift + `satisfies` (Task 4), LSL label (Task 2), docs (Task 7). Markers-tab `index + 1` display intentionally unchanged: it matches `buildMarkerRegistryFromLabels` position-codes exactly (verified, not a bypass).
- Placeholder scan: none.
- Type consistency: `createMarkerStamper`/`MarkerStamper` (Task 1) used verbatim in Task 5; `emitMarker(registry, label, time?)` (Task 2) used in Task 3; `emitStroopCondition`/`emitSearchCondition` (Task 4) names match Task 4's tests.
