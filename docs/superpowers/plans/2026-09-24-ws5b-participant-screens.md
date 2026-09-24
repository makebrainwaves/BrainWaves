# WS5b Participant Screens Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every BrainWaves-owned lab.js experiment shows the approved participant screens (#273) instead of its hand-written instruction, practice→main and end screens. The keys a participant is shown always match the keys the trials accept.

**Architecture:**
- **Built-ins** (Faces/Houses, Stroop, Visual Search, Multitasking) get a `screens.ts` next to `experiment.ts` holding their `InstructionsScreenParams`. `experiment.ts` sets `content: instructionsScreen(instructions)` / `transitionScreen(instructions)` / `endScreen()`.
- **Custom**'s keys and condition names are the teacher's settings, so its two screens are built at `before:prepare` from `this.parameters`. This is the same pattern `initLoopWithStimuli` uses. Setting an option in a hook still gets lab.js's `${…}` templating: the options proxy parses on set once armed, and `arm()` parses everything otherwise (`node_modules/lab.js/dist/es2022/base/util/options.js:84-112`).
- The stillness line reads `this.parameters.isEEGEnabled`. `LabjsExperimentWindow` sets it from a new `isEEGEnabled` runtime prop, which `RunComponent` passes.
- Story fixtures move to the real sources, so Storybook shows what runs.

**Tech Stack:** lab.js 23, React 18, TypeScript, Vitest (+ real lab.js under jsdom, per #275's `LabjsExperimentWindow.test.tsx` shims).

**Spec:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §7.1–7.4 and §11 WS5.
- Approved design: PR #273 (`src/renderer/experiments/shared/participantScreens.ts`, `src/renderer/components/ParticipantScreens/`, brief `docs/uxr/2026-09-23-ws5-design-brief.md`).

**Prerequisite:** PR #275 (WS5 early exit) merged. Task 3 edits `LabjsExperimentWindow.tsx`, `ExperimentRuntime.tsx` and `RunComponent.tsx` as #275 leaves them, and extends #275's `LabjsExperimentWindow.test.tsx`.

## Global Constraints

- "Preserve the content and layout of imported Lab.js and jsPsych studies." (§7.1) Only the five BrainWaves-owned studies change. `imported/` is untouched.
- "Show response mappings before practice and again before the recorded task." (§7.2)
- "Accuracy and response-speed language must come from the experiment protocol." (§7.4) The pacing lines come from each protocol, exactly as approved in #273.
- The stillness line appears only when EEG is on (brief).
- Keep every screen's `responses` (`keypress(Space)`, `keypress(q)` → `skipPractice`, `next`, `end`), `hooks`, `title` and position unchanged. Only `content` changes, so lab.js flow, skip-practice and progress (`utils/labjs/progress.ts`) behave exactly as before.
- Multitasking: only its Intro and End screens change. Its multi-page Instructions screen and canvas block screens stay (out of scope in #273).
- Marker emission, trial screens and `taskHelp` footers are untouched.
- Obsolete copy is deleted, not parked (§14): the built-ins' `params.intro` text, and the old screen HTML.
- Comments go on definitions, not inside bodies. No one-expression wrapper functions (fewer than 3 call sites and not an exported domain name).
- Subagents: skip formatters, project-wide lint and the full suite. Run only the files named. Task 4 runs everything once.

## Review Focus

1. **A participant is shown a key the task doesn't accept, or the reverse.** The approved fixtures were hand-copied from the protocols. Test: Task 1 contract test, which compares the keys shown on the screen that actually runs with the keys its trials accept.
2. **Custom with 1, 3 or 4 conditions, a condition with a folder but no key, and empty slots.** Test: Task 2.
3. **A teacher's intro containing `${`** must not be evaluated as a template. It is inserted as the `${this.parameters.intro}` placeholder (a single interpolation, as today), never pasted into the template source. Test: Task 2.
4. **Behavior-only run** must not show the stillness line; an EEG run must. Test: Task 3 (real lab.js).
5. **Existing workspaces** still carry the old `intro` in `appState.json`. That is harmless: `experimentObject` is always rebuilt from the type (`HomeScreen.tsx`, `experimentEpics.ts`) and built-in screens no longer read `intro`. No test needed; noted for the reviewer.

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/renderer/experiments/{faces_houses,stroop,search,multitasking}/screens.ts` | create | each built-in's participant-screen params |
| `src/renderer/experiments/{faces_houses,stroop,search,multitasking}/experiment.ts` | modify | Instruction / Main task / End `content` → builders |
| `src/renderer/experiments/{faces_houses,stroop,search,multitasking}/params.ts` | modify | delete obsolete `intro` |
| `src/renderer/constants/interfaces.ts` | modify | `intro?: string` |
| `src/renderer/experiments/__tests__/participantScreens.test.ts` | create | shown keys == accepted keys, built-ins |
| `src/renderer/utils/labjs/customStimuli.ts` | modify | `customResponseRules`, `customInstructionsScreen`, `customTransitionScreen` |
| `src/renderer/utils/labjs/__tests__/customScreens.test.ts` | create | custom screens behavior |
| `src/renderer/experiments/custom/experiment.ts` | modify | hooks build Instruction / Main task; End → `endScreen()` |
| `src/renderer/components/ExperimentRuntime.tsx`, `LabjsExperimentWindow.tsx`, `CollectComponent/RunComponent.tsx` | modify | `isEEGEnabled` → lab.js parameters |
| `src/renderer/components/__tests__/LabjsExperimentWindow.test.tsx` | modify | stillness line on/off, real lab.js |
| `src/renderer/components/ParticipantScreens/{fixtures.ts,ParticipantScreens.stories.tsx}` | modify | stories import the real sources |

## Dispatch waves

Worktree: `git worktree add .worktrees/ws5b-screens -b feat/ws5b-participant-screens origin/main` (after #275).

| Wave | Tasks | Why |
|---|---|---|
| 1 | Task 1 ∥ Task 3 | built-in experiments + stories vs runtime files; disjoint |
| 2 | Task 2 | edits the same stories/fixtures files as Task 1 |
| 3 | Task 4 | integration verification |

---

### Task 1: Built-in experiments show the approved screens

**Files:**
- Create: `src/renderer/experiments/faces_houses/screens.ts`, `stroop/screens.ts`, `search/screens.ts`, `multitasking/screens.ts`
- Modify: the four `experiment.ts`, the four `params.ts`, `src/renderer/constants/interfaces.ts`
- Modify: `src/renderer/components/ParticipantScreens/fixtures.ts`, `ParticipantScreens.stories.tsx`
- Test: `src/renderer/experiments/__tests__/participantScreens.test.ts`

**Interfaces:**
- Consumes: `instructionsScreen`, `transitionScreen`, `endScreen`, `keycap`, `stimulusExamples`, `InstructionsScreenParams` from `src/renderer/experiments/shared/participantScreens.ts`.
- Produces: `export const instructions: InstructionsScreenParams` in each built-in's `screens.ts`. `transitionScreen(instructions)` is valid, because `TransitionScreenParams` is `{ rules, pacing }` and a variable carries no excess-property check.

- [ ] **Step 1: Write the failing contract test**

```ts
// src/renderer/experiments/__tests__/participantScreens.test.ts
import { describe, expect, it, vi } from 'vitest';
import { facesHousesExperiment } from '../faces_houses/experiment';
import { params as facesHousesParams } from '../faces_houses/params';
import { stroopExperiment } from '../stroop/experiment';
import { searchExperimentObject } from '../search/experiment';
import { multitaskingExperimentObject } from '../multitasking/experiment';

vi.mock('lab.js', () => ({}));

type Node = { title?: string; content?: unknown; responses?: Record<string, string> };

/** Every non-Space, non-skip key any screen in the study responds to. */
const acceptedKeys = (node: unknown, out = new Set<string>()): Set<string> => {
  if (Array.isArray(node)) node.forEach((child) => acceptedKeys(child, out));
  else if (node && typeof node === 'object') {
    for (const key of Object.keys((node as Node).responses ?? {})) {
      const match = /^key(?:press|down)\((.+)\)$/.exec(key);
      if (match && match[1] !== 'Space' && match[1] !== 'q') out.add(match[1].toLowerCase());
    }
    Object.values(node).forEach((child) => acceptedKeys(child, out));
  }
  return out;
};

/** The `content` of the first screen with this title. */
const screenContent = (node: unknown, title: string): string | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = screenContent(child, title);
      if (found) return found;
    }
  } else if (node && typeof node === 'object') {
    if ((node as Node).title === title && typeof (node as Node).content === 'string')
      return (node as Node).content as string;
    for (const child of Object.values(node)) {
      const found = screenContent(child, title);
      if (found) return found;
    }
  }
  return undefined;
};

/** Response keycaps on a participant screen (Space and the Q skip hint excluded). */
const shownKeys = (html: string) =>
  new Set(
    [...html.matchAll(/<kbd class="bw-participant-key">([^<]+)<\/kbd>/g)]
      .map(([, key]) => key.toLowerCase())
      .filter((key) => key !== 'q')
  );

const stimulusKeys = (stimuli: Array<{ response?: string }> = []) =>
  stimuli.map(({ response }) => response ?? '').filter(Boolean);

describe.each([
  ['Faces/Houses', facesHousesExperiment, 'Instruction', 'Main task', stimulusKeys(facesHousesParams.stimuli)],
  ['Stroop', stroopExperiment, 'Instruction', 'Main task', []],
  ['Visual Search', searchExperimentObject, 'Instruction', 'Main task instruction', []],
  ['Multitasking', multitaskingExperimentObject, 'Intro', undefined, []],
])('%s participant screens', (_, study, instructionTitle, transitionTitle, dynamicKeys) => {
  const accepted = new Set([...acceptedKeys(study), ...dynamicKeys]);

  it('show exactly the keys the trials accept before practice', () => {
    const html = screenContent(study, instructionTitle as string) ?? '';
    expect(shownKeys(html)).toEqual(accepted);
  });

  it.runIf(transitionTitle)('show the same keys again before the recorded task', () => {
    const html = screenContent(study, transitionTitle as string) ?? '';
    expect(shownKeys(html)).toEqual(accepted);
  });
});
```

Faces/Houses trials get their keys at runtime from each stimulus's `response` (`initResponseHandlers`), so the test adds `params.stimuli` responses. If `stroop/experiment.ts` does not export `stroopExperiment` under that name, import whatever `stroop/index.ts` imports as `experimentObject`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/experiments/__tests__/participantScreens.test.ts`
Expected: FAIL. The current screens contain no `bw-participant-key` keycaps, so every shown set is empty.

- [ ] **Step 3: Create the four `screens.ts`**

Move each object out of `components/ParticipantScreens/fixtures.ts` verbatim. The approved copy is unchanged:

```ts
// src/renderer/experiments/faces_houses/screens.ts
import type { InstructionsScreenParams } from '../shared/participantScreens';

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Faces and houses',
  summary:
    'You will see a series of face and house images. Press the right key when an image appears',
  rules: [
    {
      keys: [
        { key: '1', meaning: 'Face' },
        { key: '9', meaning: 'House' },
      ],
    },
  ],
  pacing:
    "This isn't a speed test. Take about 1–1.5 seconds per picture and answer carefully.",
  canSkipPractice: true,
};
```

```ts
// src/renderer/experiments/stroop/screens.ts
import {
  keycap,
  stimulusExamples,
  type InstructionsScreenParams,
} from '../shared/participantScreens';

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Stroop task',
  summary:
    'You will see color words printed in colored ink. Press the key for the ink color, not the word.',
  example: stimulusExamples([
    {
      stimulus: '<span style="color: red">green</span>',
      label: 'Red ink',
      detail: `The word says “green”. Press ${keycap('r')}`,
    },
    {
      stimulus: '<span style="color: blue">yellow</span>',
      label: 'Blue ink',
      detail: `The word says “yellow”. Press ${keycap('b')}`,
    },
  ]),
  rules: [
    {
      keys: [
        { key: 'r', meaning: 'Red' },
        { key: 'g', meaning: 'Green' },
        { key: 'b', meaning: 'Blue' },
        { key: 'y', meaning: 'Yellow' },
      ],
    },
  ],
  pacing: 'Answer quickly, and as accurately as you can.',
  canSkipPractice: true,
};
```

```ts
// src/renderer/experiments/search/screens.ts
import { stimulusExamples, type InstructionsScreenParams } from '../shared/participantScreens';

/** A search-task letter with the same `letter` class and inline styles the task's run hook sets. */
const searchLetter = (style: string) =>
  `<span class="letter" style="${style}">T</span>`;

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Visual search',
  summary:
    'Look for the right-side-up orange T. Ignore upside-down orange Ts and blue Ts.',
  example: stimulusExamples([
    { stimulus: searchLetter('color: orange'), label: 'Find this', detail: 'Orange T, right side up' },
    { stimulus: searchLetter('color: orange; transform: rotate(-180deg)'), label: 'Ignore', detail: 'Upside-down orange T' },
    { stimulus: searchLetter('color: lightblue'), label: 'Ignore', detail: 'Blue T' },
  ]),
  rules: [
    {
      keys: [
        { key: 'b', meaning: 'Orange T is there' },
        { key: 'n', meaning: 'No orange T' },
      ],
    },
  ],
  pacing:
    'Speed counts here: find the orange T as quickly as you can, without guessing.',
  canSkipPractice: true,
};
```

```ts
// src/renderer/experiments/multitasking/screens.ts
import type { InstructionsScreenParams } from '../shared/participantScreens';

/**
 * The intro screen. Space continues to Multitasking's own instruction screens
 * (skip-practice lives there), so no Q hint.
 */
export const instructions: InstructionsScreenParams = {
  title: 'Multitasking',
  summary:
    'You will see a shape with dots inside. Where it appears tells you which rule to follow. The next screens explain each rule with examples.',
  rules: [
    {
      when: 'Shape on top: answer the shape',
      keys: [
        { key: 'b', meaning: 'Diamond' },
        { key: 'n', meaning: 'Rectangle' },
      ],
    },
    {
      when: 'Shape on the bottom: count the dots',
      keys: [
        { key: 'b', meaning: '2 dots' },
        { key: 'n', meaning: '3 dots' },
      ],
    },
  ],
  pacing: 'Speed counts here: answer as fast as you can without making errors.',
  start: 'see the instructions',
};
```

- [ ] **Step 4: Swap the screen contents**

In each built-in `experiment.ts`, add:

```ts
import {
  endScreen,
  instructionsScreen,
  transitionScreen,
} from '../shared/participantScreens';
import { instructions } from './screens';
```

Then replace only the `content:` value of these screens. Leave every other property as it is:

| Experiment | `title: 'Instruction'` / `'Intro'` | transition screen | `title: 'End'` |
|---|---|---|---|
| faces_houses | `instructionsScreen(instructions)` | `'Main task'` → `transitionScreen(instructions)` | `endScreen()` |
| stroop | `instructionsScreen(instructions)` | `'Main task'` → `transitionScreen(instructions)` | `endScreen()` (the `keypress(Space)': 'end'` screen) |
| search | `instructionsScreen(instructions)` | `'Main task instruction'` → `transitionScreen(instructions)` | `endScreen()` |
| multitasking | `'Intro'` → `instructionsScreen(instructions)` | — (its `Instructions` and block screens stay) | `endScreen()` |

Search's old Instruction content defined `.letter` in a `<style>` block. That styling now comes from `.bw-participant-example-stimulus .letter` in `app.global.css`. The trial screens keep their own `<style>` blocks.

Use `import { instructions, instructions as … }`, or read the exports, to confirm the exported study names match (`facesHousesExperiment`, `searchExperimentObject`, `multitaskingExperimentObject`, and Stroop's export). Adjust the test imports to match; don't rename the exports.

- [ ] **Step 5: Delete the obsolete intro copy**

- Delete the `intro:` entry from `faces_houses/params.ts`, `stroop/params.ts`, `search/params.ts` and `multitasking/params.ts`. It still contains "Press the the space bar", and nothing reads it once the screens are swapped.
- In `constants/interfaces.ts`, change `intro: string;` to `/** Teacher-written intro for custom experiments; built-ins' screens carry their own copy. */ intro?: string;`.
- `grep -rn "parameters.intro\|params.intro" src/renderer` should now list only `custom/`, `CustomDesignComponent.tsx` and the ParticipantScreens custom stories.

- [ ] **Step 6: Point the stories at the real sources**

In `ParticipantScreens/fixtures.ts`, delete `searchLetter`, `FACES_HOUSES`, `STROOP`, `VISUAL_SEARCH` and `MULTITASKING`, plus any imports left unused. Keep the Custom fixtures; Task 2 converts them. In `ParticipantScreens.stories.tsx`:

```ts
import { instructions as FACES_HOUSES } from '../../experiments/faces_houses/screens';
import { instructions as STROOP } from '../../experiments/stroop/screens';
import { instructions as VISUAL_SEARCH } from '../../experiments/search/screens';
import { instructions as MULTITASKING } from '../../experiments/multitasking/screens';
```

The Transition story becomes `content: transitionScreen(FACES_HOUSES)`.

- [ ] **Step 7: Run, typecheck, commit**

Run: `npx vitest run src/renderer/experiments/__tests__/participantScreens.test.ts` → 7 passed (4 instruction + 3 transition). `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/experiments src/renderer/constants/interfaces.ts src/renderer/components/ParticipantScreens
git commit -m "feat(experiments): built-in studies show the approved participant screens"
```

---

### Task 2: Custom experiments build their screens from the teacher's conditions

**Files:**
- Modify: `src/renderer/utils/labjs/customStimuli.ts`
- Modify: `src/renderer/experiments/custom/experiment.ts` (Instruction, Main task, End screens)
- Modify: `src/renderer/components/ParticipantScreens/fixtures.ts`, `ParticipantScreens.stories.tsx` (Custom stories)
- Test: `src/renderer/utils/labjs/__tests__/customScreens.test.ts`

**Interfaces:**
- Consumes: `CONDITION_SLOTS`, `conditionTitle`, the private `isActiveSlot` (same file); `instructionsScreen`, `transitionScreen`, `ResponseRule` (Task-1-independent, from #273).
- Produces (exported from `customStimuli.ts`):
  - `customResponseRules(params: ExperimentParameters): ResponseRule[]`
  - `customInstructionsScreen(params: ExperimentParameters): string`
  - `customTransitionScreen(params: ExperimentParameters): string`

- [ ] **Step 1: Write the failing test**

```ts
// src/renderer/utils/labjs/__tests__/customScreens.test.ts
import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import type { ExperimentParameters } from '../../../constants/interfaces';
import {
  customInstructionsScreen,
  customResponseRules,
  customTransitionScreen,
} from '../customStimuli';

const slot = (type: EVENTS, title: string, dir: string, response: string) => ({
  type, title, dir, audioDir: '', response,
});

const params = {
  intro: 'Look at ${danger} each animal',
  stimulus1: slot(EVENTS.STIMULUS_1, 'Dog', '/pics/dogs', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Condition 2', '/pics/cats', '9'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Bird', '/pics/birds', ''),
  stimulus4: slot(EVENTS.STIMULUS_4, '', '', ''),
} as unknown as ExperimentParameters;

describe('custom participant screens', () => {
  it('list every condition with a folder, its key, and no empty slots', () => {
    expect(customResponseRules(params)).toEqual([
      {
        keys: [
          { key: '1', meaning: 'Dog' },
          { key: '9', meaning: 'cats' },
          { key: undefined, meaning: 'Bird' },
        ],
      },
    ]);
  });

  it('show the configured keys before practice and again before the recorded task', () => {
    for (const html of [customInstructionsScreen(params), customTransitionScreen(params)]) {
      expect(html).toContain('<kbd class="bw-participant-key">1</kbd>');
      expect(html).toContain('<kbd class="bw-participant-key">9</kbd>');
      expect(html).toContain('No key');
    }
  });

  it("keeps the teacher's intro out of the template source", () => {
    const html = customInstructionsScreen(params);
    expect(html).toContain('${this.parameters.intro}');
    expect(html).not.toContain('${danger}');
  });
});
```

The `'cats'` case pins `conditionTitle`'s existing placeholder → folder-basename rule, so the screen names a condition exactly as the behavior CSV and ERP labels do.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/utils/labjs/__tests__/customScreens.test.ts`
Expected: FAIL. The three functions are not exported.

- [ ] **Step 3: Implement in `customStimuli.ts`**

```ts
import {
  instructionsScreen,
  transitionScreen,
  type ResponseRule,
} from '../../experiments/shared/participantScreens';

/**
 * What a participant is told to press: each condition with a stimulus folder,
 * named as it is recorded (`conditionTitle`), with its key or none.
 */
export function customResponseRules(params: ExperimentParameters): ResponseRule[] {
  return [
    {
      keys: CONDITION_SLOTS.flatMap(({ name }) => {
        const slot = params[name];
        return slot && isActiveSlot(slot)
          ? [{ key: slot.response || undefined, meaning: conditionTitle(slot) }]
          : [];
      }),
    },
  ];
}

/**
 * The custom instruction screen. The teacher's intro stays a lab.js
 * placeholder so its text is interpolated once, never parsed as a template.
 */
export function customInstructionsScreen(params: ExperimentParameters): string {
  return instructionsScreen({
    title: 'Welcome to your experiment',
    summary: '${this.parameters.intro}',
    rules: customResponseRules(params),
    canSkipPractice: true,
  });
}

/** The custom practice → recorded-task screen, with the same keys again. */
export function customTransitionScreen(params: ExperimentParameters): string {
  return transitionScreen({ rules: customResponseRules(params) });
}
```

Check whether `participantScreens.ts` imports anything from `utils/labjs`. If it does, move these three functions into `experiments/custom/screens.ts` instead, to avoid an import cycle.

- [ ] **Step 4: Build the custom screens at prepare time**

In `custom/experiment.ts`:
- Import `customInstructionsScreen`, `customTransitionScreen` from `../../utils/labjs/customStimuli`, `endScreen` from `../shared/participantScreens`, and `ExperimentParameters` as a type.
- Add, above `customExperiment`:

```ts
/** Builds the instruction screen from this workspace's conditions when lab.js prepares it. */
function prepareInstructions(this: { parameters: unknown; options: { content?: string } }) {
  this.options.content = customInstructionsScreen(this.parameters as ExperimentParameters);
}

/** Builds the practice → recorded-task screen from this workspace's conditions. */
function prepareTransition(this: { parameters: unknown; options: { content?: string } }) {
  this.options.content = customTransitionScreen(this.parameters as ExperimentParameters);
}
```

- `title: 'Instruction'` screen: set `hooks: { 'before:prepare': prepareInstructions }` and `content: ''`.
- `title: 'Main task'` screen: set `hooks: { 'before:prepare': prepareTransition }` and `content: ''`.
- `title: 'End'` screen: `content: endScreen()`.
- `responses` stay as they are.

- [ ] **Step 5: Custom stories render what runs**

In `ParticipantScreens/fixtures.ts`, replace `CUSTOM` and `CUSTOM_FOUR_KEYS` (the `InstructionsScreenParams` objects) with parameter fixtures. Keep `CUSTOM_INTRO` / `CUSTOM_LONG_INTRO`:

```ts
import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

const slot = (type: EVENTS, title: string, response: string) => ({
  type, title, dir: `/pics/${title.toLowerCase()}`, audioDir: '', response,
});
const emptySlot = (type: EVENTS) => ({ type, title: '', dir: '', audioDir: '', response: '' });

/** Two keyed conditions and one watched-only condition. */
export const CUSTOM_PARAMS = {
  stimulus1: slot(EVENTS.STIMULUS_1, 'Dog', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Cat', '9'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Bird', ''),
  stimulus4: emptySlot(EVENTS.STIMULUS_4),
} as unknown as ExperimentParameters;

/** Four conditions on the default keys for four (1, 4, 6, 9). */
export const CUSTOM_FOUR_KEYS_PARAMS = {
  stimulus1: slot(EVENTS.STIMULUS_1, 'Monkey', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Parrot', '4'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Frog', '6'),
  stimulus4: slot(EVENTS.STIMULUS_4, 'Jaguar', '9'),
} as unknown as ExperimentParameters;
```

Stories: `InstructionsCustom` → `content: customInstructionsScreen(CUSTOM_PARAMS)`; `InstructionsCustomLongIntro` → `content: customInstructionsScreen(CUSTOM_FOUR_KEYS_PARAMS)`. Keep their `parameters: { isEEGEnabled: true, intro: … }`. Update both docstrings, since the no-key condition now reads its own title ("Bird") next to a "No key" cap.

- [ ] **Step 6: Run, typecheck, commit**

Run: `npx vitest run src/renderer/utils/labjs/__tests__/customScreens.test.ts src/renderer/experiments/custom` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/utils/labjs src/renderer/experiments/custom src/renderer/components/ParticipantScreens
git commit -m "feat(custom): participant screens built from the teacher's conditions"
```

---

### Task 3: The stillness line follows the run's EEG setting

**Files:**
- Modify: `src/renderer/components/ExperimentRuntime.tsx` (`ExperimentRuntimeProps`)
- Modify: `src/renderer/components/LabjsExperimentWindow.tsx` (after `experimentToRun.parameters.title = title;`, destructure, deps)
- Modify: `src/renderer/components/CollectComponent/RunComponent.tsx` (`<ExperimentRuntime …>`)
- Test: `src/renderer/components/__tests__/LabjsExperimentWindow.test.tsx` (from #275; reuse its `vi.hoisted` shims)

**Interfaces:**
- Produces, on `ExperimentRuntimeProps`:
  ```ts
  /** EEG is being recorded; lab.js screens read it as `parameters.isEEGEnabled` (the stillness line). */
  isEEGEnabled?: boolean;
  ```
- Preview omits the prop, so preview screens hide the stillness line. That's fine: nothing is recorded.

- [ ] **Step 1: Write the failing test**

Append to `LabjsExperimentWindow.test.tsx`:

```tsx
import { instructionsScreen, STILLNESS_LINE } from '../../experiments/shared/participantScreens';

const instructionsStudy = {
  type: 'lab.flow.Sequence',
  content: [
    {
      type: 'lab.html.Screen',
      content: instructionsScreen({
        title: 'Faces and houses',
        summary: 'summary',
        rules: [{ keys: [{ key: '1', meaning: 'Face' }] }],
      }),
    },
  ],
};

it.each([
  [true, true],
  [false, false],
])('EEG %s → stillness line shown: %s', async (isEEGEnabled, shown) => {
  const { unmount } = render(
    <LabjsExperimentWindow
      title="Study"
      experimentObject={instructionsStudy as never}
      params={{} as never}
      isEEGEnabled={isEEGEnabled}
      eventCallback={vi.fn()}
      onFinish={vi.fn()}
    />
  );
  await screen.findByText('Faces and houses', {}, { timeout: 3000 });

  expect(Boolean(screen.queryByText(STILLNESS_LINE))).toBe(shown);
  unmount();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/__tests__/LabjsExperimentWindow.test.tsx`
Expected: FAIL. TS error (`isEEGEnabled` is not a prop), and the EEG-on case shows no stillness line.

- [ ] **Step 3: Implement**

- `ExperimentRuntime.tsx`: add the `isEEGEnabled` member (docstring above) to `ExperimentRuntimeProps`. The dispatcher already spreads `...runtime` into both windows; `ImportedExperimentWindow` ignores it.
- `LabjsExperimentWindow.tsx`:
  - destructure `isEEGEnabled`;
  - after `experimentToRun.parameters.title = title;`, add `experimentToRun.parameters.isEEGEnabled = Boolean(isEEGEnabled);`;
  - add `isEEGEnabled` to the effect's dependency array.
- `RunComponent.tsx`: pass `isEEGEnabled={isEEGEnabled}` to `<ExperimentRuntime>` (the prop is already in scope).

- [ ] **Step 4: Run, typecheck, commit**

Run: `npx vitest run src/renderer/components/__tests__/LabjsExperimentWindow.test.tsx src/renderer/components/CollectComponent` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/components/ExperimentRuntime.tsx src/renderer/components/LabjsExperimentWindow.tsx src/renderer/components/CollectComponent/RunComponent.tsx src/renderer/components/__tests__/LabjsExperimentWindow.test.tsx
git commit -m "feat(runtime): lab.js screens know whether EEG is recording"
```

---

### Task 4: Integrated verification and docs

**Files:** `TODOS.md`; `.llms/learnings.md` (append by hand; no Prettier).

- [ ] **Step 1: Full checks (once)**

Run: `npm run typecheck && npm run lint && npm test && node tests/electron-smoke.mjs`
Expected: 0 errors, all tests pass, smoke PASS.

- [ ] **Step 2: Electron playtest with the Fixture headset (agent, `skill://electron-playtest`)**

Screenshot each screen at the Electron window's default size and at 1280×720:
1. **Faces/Houses, EEG workspace, Collect → Run & record.**
   - The Instruction screen matches the approved `InstructionsFacesHouses` story, including the stillness line.
   - Press `Q`: practice is skipped, and the transition screen appears with the same keys.
   - Space → trials. Let it finish, or end it early, to reach the End screen.
2. **Stroop, Visual Search, Multitasking:** the instruction screen matches its story. Multitasking's Space leads into its original multi-page instructions.
3. **Custom workspace with two condition folders** (any two image folders): the instruction screen names both conditions with their assigned keys (defaults 1/9). The transition shows them again.
4. **Behavior-only workspace (EEG off):** no stillness line anywhere.
5. **Preview on Design and Collect:** the new screens appear, without the stillness line, and nothing is recorded.
6. **Imported jsPsych study:** unchanged (§7.1).
7. **Progress:** the RunBar still shows `Practice trial N of 6` → `Trial N of 120` for Faces/Houses.

- [ ] **Step 3: Docs**

`TODOS.md`: add under the Playtest 1 list: `~~BrainWaves-owned participant screens (§7.2)~~ — shipped YYYY-MM-DD (WS5b, PR #N)`.

Append to `.llms/learnings.md`:

```markdown
## Participant screens: built-ins own `screens.ts`; Custom builds at prepare

Built-in lab.js studies take their instruction / practice→main / end screen
content from `experiments/shared/participantScreens.ts` builders fed by each
experiment's `screens.ts`; `experiments/__tests__/participantScreens.test.ts`
fails if the keys a screen shows ever drift from the keys its trials accept.
Custom studies can't be static (keys and names are the teacher's), so their
screens are built in `before:prepare` hooks from `this.parameters` —
setting `this.options.content` there is still run through lab.js's `${…}`
templating (options proxy parses on set/arm). The teacher's intro stays a
`${this.parameters.intro}` placeholder so its text is never parsed as a
template. The stillness line reads `parameters.isEEGEnabled`, which
`LabjsExperimentWindow` sets from the `isEEGEnabled` runtime prop.
```

- [ ] **Step 4: Commit and PR**

```bash
git add TODOS.md .llms/learnings.md
git commit -m "docs: WS5b participant screens learnings and TODOS"
gh pr create --title "feat(experiments): WS5b participant screens in built-in and custom studies" --body "Implements docs/superpowers/plans/2026-09-24-ws5b-participant-screens.md. Verification: <Step 1 output, Step 2 screenshots>."
```
