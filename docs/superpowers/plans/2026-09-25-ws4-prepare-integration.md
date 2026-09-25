# WS4 Prepare Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The approved Prepare screens (#276) become the real Prepare surface for the four built-in experiments. The protocol diagram's keys and its trial timeline come from each experiment's real code, not hand-copied fixtures or the stale `nbTrials` param.

**Architecture:**
- `PrepareSteps` (#276) becomes the shell of the built-in Design screen: it owns the gold step pill, the centered column, the step content and the sticky action row. `DesignComponent/index.tsx` supplies the content and wiring. Custom and Imported keep their own authoring flows.
- Per-experiment data moves from `PrepareSteps/fixtures.ts` into each experiment as `prepare.ts`, next to WS5b's `screens.ts`. Story fixtures then read those modules, so Storybook shows what runs.
- Trial counts are derived from each experiment's real loop structure, because `params.nbTrials` is stale for Stroop and Search (says 150, unused; real counts are 96 and 80).
- One preview label app-wide: `PreviewLabel` (#276) replaces `PreviewButtonComponent`'s inline status, and the preview box is tall enough to show a participant screen without scrolling.

**Tech Stack:** React 18, Redux Toolkit, lab.js study objects (read-only), TypeScript, Vitest, Storybook 9.

**Spec:**
- `docs/uxr/playtest_naive_1_design_implementation_plan.md` §1.2, §1.4, §3.2, §3.3, §6, §11 WS4.
- Approved design: PR #276 (`src/renderer/components/PrepareSteps/`, `PreviewLabel.tsx`).

## Global Constraints

- "Keep `Prepare` stable in the global workflow while local headings use Learn, Design, or Configure." (§11 WS4). The global bar is untouched.
- "Add action-specific Back and forward controls without turning visited sections into Collect prerequisites." (§11 WS4). No lesson or preview completion gates Collect (§1.4, §13).
- "Generate built-in experiment flow descriptions from known parameters where possible." (§11 WS4) — here, from the real loops.
- "Do not persist lesson-completed or preview-completed flags solely for gating." (§11 WS4)
- "Package a licensed local Oliver Sacks clip only when rights and captions are available; otherwise implement the illustrated fallback." (§11 WS4) The fallback ships; no remote player.
- The stillness line's source of truth is WS5b's `isEEGEnabled` parameter. The EEG toggle keeps setting the workspace's `isEEGEnabled` exactly as today.
- Real trial counts: Faces/Houses 6 practice / 120 recorded; Stroop 8 / 96; Visual Search 8 / 80; Multitasking is block-based with no study-wide total (per #270's known gap).
- `params.nbTrials` / `nbPracticeTrials` are NOT the source of counts.
- Rule A: at 1366×768 and 1280×720, each step's content and its primary action are visible without a page scroll.
- Comments go on definitions, not inside bodies. No one-expression wrapper functions. No new dependencies.
- Subagents: skip formatters, project-wide lint and the full suite. Run only the files named per task. Task 4 runs everything once.

## Open contracts (verify before coding)

Four details are not pinned in the task text. Each implementer resolves them by reading the code and records the answer in its report.

1. **`PrepareFixture` location.** It is exported from `PrepareSteps.tsx` today. If `experiments/*/prepare.ts` importing it creates an import cycle (experiments → components → experiments), move `PrepareFixture`, `ResponseMapping` and `FlowPhase` into `PrepareSteps/flow.ts` and re-export them. Check with `lsp` references before moving.
2. **`ResponseMapping.when`.** The type has no `when` field, but the approved Protocol diagram shows per-rule labels ("Shape on top: answer the shape"). Either add `when?: string` and render it, or fold the rule label into `label` strings. Do the former if `PrepareSteps` already has a slot for it; otherwise the latter, and say so.
3. **Multitasking's keys.** `multitasking/content_protocol.js` has no `condition_first_key` / `condition_second_key`. Derive `responses` from the real `b`/`n` mapping in `multitasking/experiment.ts` and the rule wording from `content_protocol.js`'s `condition_first` / `condition_second`. Do not invent keys.
4. **`Experiment.prepare` on the type.** `constants/interfaces.ts`'s `Experiment` interface has `icon`, `experimentObject`, `params`, `text`. Adding `prepare?: PrepareFixture` is the intent; confirm `imported/` and `custom/` compile without it (they should, since it's optional).

### Rulings

- **Ruling 1 (Multitasking).** Its `prepare.ts` describes a block task with two rules on the same keys, not a linear trial count. `flowFromStructure` has a `blocks` variant, and the timeline never claims a study-wide total. Cost if wrong: Multitasking's Protocol reads like a linear task and its counts are wrong.
- **Ruling 2 (EEG toggle + Customize).** They move into `PrepareSteps`'s action row as optional props (`isEEGEnabled`, `onEEGEnabledChange`, `onCustomize`), since `PrepareSteps` owns the step chrome now. Cost if wrong: one extra prop pass-through and a story to remove.
- **Ruling 3 (SecondaryNavComponent name).** Keep the name and add a docstring saying it's now the Custom/Imported authoring nav. Renaming risks touching unrelated callers for no user-visible gain. Cost if wrong: a later rename PR.
- **Ruling 4 (preview box height).** `min-h-[420px]`, growing with content, instead of `h-[330px]`. Cost if wrong: one line of CSS.

## Review Focus

1. **A key or count that drifts** between the diagram and the task. WS5b added `experiments/__tests__/participantScreens.test.ts` for participant screens; Task 1 adds the same style of test for Prepare.
2. **Multitasking.** Two rules on the same keys is the hardest diagram; verify it reads clearly and never claims a study-wide total.
3. **The preview box.** At 330px tall the participant screen scrolled (logged in TODOS). Task 3 must prove the whole first participant screen, keys included, is visible without scrolling at both sizes.
4. **Custom and Imported must not regress.** They keep their own steps and the `SecondaryNavComponent` header. Task 2's test covers both.
5. **Workspaces already on disk** (`appState.json`) carry no prepare data. It's derived at render time from `type`, so no migration is needed. Note it for the reviewer.

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/renderer/experiments/{faces_houses,stroop,search,multitasking}/prepare.ts` | create | per-experiment `responses` + `flow` (real counts) |
| `src/renderer/components/PrepareSteps/flow.ts` | create | `flowFromStructure`, `FlowPhase`, `LoopStructure` |
| `src/renderer/components/PrepareSteps/fixtures.ts` | modify | re-export the per-experiment modules |
| `src/renderer/experiments/__tests__/prepareContent.test.ts` | create | keys and counts match the real studies |
| `src/renderer/constants/interfaces.ts`, `experiments/*/index.ts` | modify | `prepare?: PrepareFixture` on `Experiment` |
| `src/renderer/components/DesignComponent/index.tsx` | modify | built-ins render `PrepareSteps` |
| `src/renderer/components/DesignComponent/__tests__/DesignPrepare.test.tsx` | create | step flow + Custom/Imported untouched |
| `src/renderer/components/SecondaryNavComponent/index.tsx` | modify | docstring: Custom/Imported authoring nav |
| `src/renderer/components/PreviewButtonComponent.tsx` + `__tests__/PreviewButton.test.tsx` | modify / create | one preview label |
| `src/renderer/components/PrepareSteps/PrepareSteps.tsx` | modify | optional EEG/Customize props; preview box height |
| `TODOS.md`, `.llms/learnings.md` | modify | notes |

## Dispatch waves

Worktree: `git worktree add .worktrees/ws4-integration -b feat/ws4-prepare-integration origin/main`, from `main` after #279 merges (Task 4 touches `RunComponent` only via `PreviewExperimentComponent`; if #279 is still open, base on `origin/main` and rebase before the PR).

| Wave | Tasks | Why |
|---|---|---|
| 1 | Task 1 ∥ Task 3 | per-experiment modules vs PreviewButton; disjoint |
| 2 | Task 2 | needs Task 1's modules |
| 3 | Task 4 | needs Task 2's shell |
| 4 | verification, docs, PR | |

---

### Task 1: Per-experiment Prepare data and the real trial counts

**Files:**
- Create: `src/renderer/experiments/{faces_houses,stroop,search,multitasking}/prepare.ts`
- Create: `src/renderer/components/PrepareSteps/flow.ts`
- Test: `src/renderer/experiments/__tests__/prepareContent.test.ts`
- Modify: `src/renderer/components/PrepareSteps/fixtures.ts` (re-export)

**Interfaces:**
- Consumes: each experiment's `content_overview.js` / `content_background.js` / `content_protocol.js`, its stimulus images, and its real loop structure.
- Produces:

```ts
// flow.ts
export interface FlowPhase { label: string; count?: number }
export interface LoopStructure {
  /** Trials the participant practices before the recorded task. */
  practice?: number;
  /** Trials recorded for analysis. */
  recorded?: number;
  /** Block-structured tasks (Multitasking) instead of practice/recorded. */
  blocks?: Array<{ label: string; practice?: number; recorded?: number }>;
}
export function flowFromStructure(s: LoopStructure): FlowPhase[]
```

```ts
// each experiments/<name>/prepare.ts
export const prepare: PrepareFixture; // { overview, background, protocol, responses, flow, icon }
```

- [ ] **Step 1: Write the failing test**

```ts
// src/renderer/experiments/__tests__/prepareContent.test.ts
import { describe, expect, it, vi } from 'vitest';
import { flowFromStructure } from '../../components/PrepareSteps/flow';
import { prepare as faces } from '../faces_houses/prepare';
import { prepare as stroop } from '../stroop/prepare';
import { prepare as search } from '../search/prepare';
import { prepare as multi } from '../multitasking/prepare';

vi.mock('lab.js', () => ({}));

/** Keys shown in the protocol diagram. */
const shownKeys = (p: { responses: { key: string }[] }) =>
  new Set(p.responses.map(({ key }) => key.toLowerCase()));

describe('flowFromStructure', () => {
  it('describes a linear task with practice and recorded trials', () => {
    expect(flowFromStructure({ practice: 6, recorded: 120 })).toEqual([
      { label: 'Instructions' },
      { label: 'Practice trials', count: 6 },
      { label: 'Main-task reminder' },
      { label: 'Recorded trials', count: 120 },
      { label: 'Completion' },
    ]);
  });

  it('describes a block task without a study-wide total', () => {
    const flow = flowFromStructure({
      blocks: [
        { label: 'Practice blocks', practice: 2 },
        { label: 'Recorded blocks', recorded: 4 },
      ],
    });
    expect(flow).toEqual([
      { label: 'Instructions' },
      { label: 'Practice blocks', count: 2 },
      { label: 'Main-task reminder' },
      { label: 'Recorded blocks', count: 4 },
      { label: 'Completion' },
    ]);
  });
});

describe('per-experiment prepare content', () => {
  it('Faces/Houses shows the keys its stimuli accept, and 6 practice / 120 recorded', () => {
    expect(shownKeys(faces)).toEqual(new Set(['1', '9']));
    expect(faces.flow).toContainEqual({ label: 'Practice trials', count: 6 });
    expect(faces.flow).toContainEqual({ label: 'Recorded trials', count: 120 });
  });

  it('Stroop shows r/g/b/y, and 8 practice / 96 recorded', () => {
    expect(shownKeys(stroop)).toEqual(new Set(['r', 'g', 'b', 'y']));
    expect(stroop.flow).toContainEqual({ label: 'Practice trials', count: 8 });
    expect(stroop.flow).toContainEqual({ label: 'Recorded trials', count: 96 });
  });

  it('Visual Search shows b/n, and 8 practice / 80 recorded', () => {
    expect(shownKeys(search)).toEqual(new Set(['b', 'n']));
    expect(search.flow).toContainEqual({ label: 'Practice trials', count: 8 });
    expect(search.flow).toContainEqual({ label: 'Recorded trials', count: 80 });
  });

  it('Multitasking shows its rules on b/n and never claims a study-wide total', () => {
    expect(shownKeys(multi)).toEqual(new Set(['b', 'n']));
    expect(multi.flow.some((p) => /recorded trials/i.test(p.label))).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/experiments/__tests__/prepareContent.test.ts`
Expected: FAIL — cannot find `../faces_houses/prepare` and `../../components/PrepareSteps/flow`.

- [ ] **Step 3: Implement `flow.ts`**

```ts
// src/renderer/components/PrepareSteps/flow.ts
/** One phase of a task's timeline, as shown in the protocol diagram. */
export interface FlowPhase {
  label: string;
  /** Omit for a phase with no fixed count (e.g. Multitasking's blocks). */
  count?: number;
}

/** A task's real loop structure. Multitasking uses `blocks`. */
export interface LoopStructure {
  practice?: number;
  recorded?: number;
  blocks?: Array<{ label: string; practice?: number; recorded?: number }>;
}

/**
 * Builds the vertical timeline from a task's real loop structure. Never reads
 * `params.nbTrials`, which is stale for Stroop and Search.
 */
export function flowFromStructure(structure: LoopStructure): FlowPhase[] {
  const phases: FlowPhase[] = [{ label: 'Instructions' }];
  if (structure.blocks) {
    for (const block of structure.blocks) {
      if (block.practice) phases.push({ label: block.label, count: block.practice });
    }
    phases.push({ label: 'Main-task reminder' });
    for (const block of structure.blocks) {
      if (block.recorded) phases.push({ label: block.label, count: block.recorded });
    }
    phases.push({ label: 'Completion' });
    return phases;
  }
  if (structure.practice) phases.push({ label: 'Practice trials', count: structure.practice });
  phases.push({ label: 'Main-task reminder' });
  if (structure.recorded) phases.push({ label: 'Recorded trials', count: structure.recorded });
  phases.push({ label: 'Completion' });
  return phases;
}
```

- [ ] **Step 4: Implement the four `prepare.ts`**

Each file is one self-contained object importing its own content and images, exactly as `PrepareSteps/fixtures.ts` does today. Faces/Houses:

```ts
// src/renderer/experiments/faces_houses/prepare.ts
import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import face from './stimuli/faces/Face1.jpg';
import house from './stimuli/houses/House1.jpg';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/** What Prepare shows for Faces/Houses: its keys and its real 6 / 120 trials. */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  responses: [
    { key: '1', label: 'Face', stimulus: { src: face, alt: 'A face photo' } },
    { key: '9', label: 'House', stimulus: { src: house, alt: 'A house photo' } },
  ],
  // faces_houses/params.ts: nbPracticeTrials 6, nbTrials 120.
  flow: flowFromStructure({ practice: 6, recorded: 120 }),
};
```

Stroop: the `word`/`color` stimulus variant as today (`{ word: 'green', color: 'red' }`, etc., from `stroop/experiment.ts`'s canvas text) and `flow: flowFromStructure({ practice: 8, recorded: 96 })` (comment the source lines, as #276's fixtures do). Search: its `conditionOrangeT.png` / `conditionNoOrangeT.png` stimuli and `{ practice: 8, recorded: 80 }`.

Multitasking (`multitasking/prepare.ts`) is the exception: two rules on the same `b`/`n` keys (Open contract 3), and `flow: flowFromStructure({ blocks: [...] })` (Ruling 1) describing its block structure without a study-wide total.

- [ ] **Step 5: Point fixtures at the real modules**

`PrepareSteps/fixtures.ts` becomes a thin re-export plus `SACKS_STAND_IN` and `NOOP_HANDLERS`:

```ts
export { prepare as FACES_HOUSES } from '../../experiments/faces_houses/prepare';
export { prepare as STROOP } from '../../experiments/stroop/prepare';
export { prepare as SEARCH } from '../../experiments/search/prepare';
export { prepare as MULTITASKING } from '../../experiments/multitasking/prepare';
```

Delete `buildFlow`, the three hand-written fixtures and now-unused imports. Keep `SACKS_STAND_IN`, `NOOP_HANDLERS` and `PrepareFixture` (or move it per Open contract 1).

- [ ] **Step 6: Run, typecheck, commit**

Run: `npx vitest run src/renderer/experiments/__tests__/prepareContent.test.ts` → pass. `npx tsc --noEmit` → 0 errors. `npx vitest run src/renderer/components/PrepareSteps` → stories still compile.

```bash
git add src/renderer/experiments src/renderer/components/PrepareSteps
git commit -m "feat(prepare): per-experiment protocol data and real trial counts"
```

---

### Task 2: The built-in Design screen renders `PrepareSteps`

**Files:**
- Modify: `src/renderer/components/DesignComponent/index.tsx`
- Modify: `src/renderer/constants/interfaces.ts`, `src/renderer/experiments/*/index.ts`
- Modify: `src/renderer/components/SecondaryNavComponent/index.tsx` (docstring)
- Test: `src/renderer/components/DesignComponent/__tests__/DesignPrepare.test.tsx`

**Interfaces:**
- Consumes: `PrepareSteps` props (#276), `prepare` from Task 1's modules, `DesignProps`.
- Produces: `DesignComponent` renders `PrepareSteps` for the four built-ins. Custom (`CustomDesign`) and Imported (`ImportedDesign`) are unchanged in behavior.

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/components/DesignComponent/__tests__/DesignPrepare.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Design from '../index';
import { EXPERIMENTS } from '../../../constants/constants';

vi.mock('lab.js', () => ({}));
vi.mock('../CustomDesignComponent', () => ({ default: () => <div data-testid="custom-design" /> }));
vi.mock('../ImportedDesignComponent', () => ({ default: () => <div data-testid="imported-design" /> }));
vi.mock('../../PreviewExperimentComponent', () => ({ default: () => <div data-testid="preview-experiment" /> }));

const baseProps = {
  navigate: vi.fn(),
  type: EXPERIMENTS.N170,
  title: 'Faces_Houses_1',
  params: {} as never,
  experimentObject: {} as never,
  ExperimentActions: { SetEEGEnabled: vi.fn(), SaveWorkspace: vi.fn(), CreateNewWorkspace: vi.fn() } as never,
  isEEGEnabled: true,
};

describe('Design — built-in Prepare', () => {
  it('renders the Prepare steps with the experiment keys and the real trial counts', () => {
    render(<Design {...baseProps} />);
    expect(screen.getByRole('navigation', { name: 'Prepare steps' })).toBeInTheDocument();
    expect(screen.getByText('Face')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next: Background/ })).toBeInTheDocument();
  });

  it('walks Overview → Background → Protocol → Preview and offers Try the experiment', () => {
    render(<Design {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Next: Background/ }));
    expect(screen.getByText(/BACKGROUND/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next: Protocol/ }));
    expect(screen.getByText('WHAT HAPPENS IN THIS TASK')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try the experiment/ }));
    expect(screen.getByTestId('preview-experiment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run & record/ })).toBeInTheDocument();
  });

  it('keeps Custom on its authoring flow', () => {
    render(<Design {...baseProps} type={EXPERIMENTS.CUSTOM} />);
    expect(screen.getByTestId('custom-design')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Prepare steps' })).not.toBeInTheDocument();
  });

  it('keeps Imported on its authoring flow', () => {
    render(<Design {...baseProps} type={EXPERIMENTS.IMPORTED} />);
    expect(screen.getByTestId('imported-design')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Prepare steps' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/DesignComponent/__tests__/DesignPrepare.test.tsx`
Expected: FAIL — `Prepare steps` navigation absent.

- [ ] **Step 3: Wire `PrepareSteps` into `DesignComponent`**

For the four built-ins (N170, STROOP, SEARCH, MULTI), replace the `SecondaryNavComponent` + `renderSectionContent()` pair with `PrepareSteps`:

```tsx
  const prepare = getExperimentFromType(props.type).prepare;
  return (
    <PrepareSteps
      step={activeStep}
      overview={prepare.overview}
      background={prepare.background}
      protocol={prepare.protocol}
      responses={prepare.responses}
      flow={prepare.flow}
      icon={prepare.icon}
      mediaFallback={props.type === EXPERIMENTS.N170 ? SACKS_STAND_IN : undefined}
      isEEGEnabled={props.isEEGEnabled}
      onEEGEnabledChange={handleEEGEnabled}
      onCustomize={() => setIsNewExperimentModalOpen(true)}
      onStep={setActiveStep}
      onCollect={() => props.navigate(SCREENS.COLLECT.route)}
      onPreviewStart={() => setIsPreviewing(true)}
      onPreviewStop={() => setIsPreviewing(false)}
      onPreviewAgain={() => setIsPreviewing(true)}
      isPreviewing={isPreviewing}
      hasPreviewed={hasPreviewed}
    />
  );
```

- Add `prepare?: PrepareFixture` to `Experiment` in `constants/interfaces.ts`, and export `prepare` from each built-in's `index.ts` (Open contract 4).
- `DESIGN_STEPS` maps to `PrepareStepId`: `OVERVIEW → 'overview'`, `BACKGROUND → 'background'`, `PROTOCOL → 'protocol'`, `PREVIEW → 'preview'`.
- `hasPreviewed` becomes a `useState` flipped by `onPreviewStart`.
- Pass `isEEGEnabled` / `onEEGEnabledChange` / `onCustomize` to `PrepareSteps` per Ruling 2; add its stories for those states.
- Delete `renderSectionContent`, the four `case` blocks and now-unused imports (`renderConditionIcon`, `renderOverviewIcon`, `SecondaryNavComponent`, `InputModal` if only used for Customize).

- [ ] **Step 4: Custom and Imported keep their flow**

`CustomDesignComponent` and `ImportedDesignComponent` still render `SecondaryNavComponent` with `CUSTOM_STEPS` / `IMPORTED_STEPS`. Keep the name and add a docstring (Ruling 3). The test above covers both.

- [ ] **Step 5: Run, typecheck, commit**

Run: `npx vitest run src/renderer/components/DesignComponent` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/components/DesignComponent src/renderer/constants/interfaces.ts src/renderer/experiments/*/index.ts
git commit -m "feat(prepare): built-in Design screen renders the approved Prepare steps"
```

---

### Task 3: One preview label app-wide

**Files:**
- Modify: `src/renderer/components/PreviewButtonComponent.tsx`
- Test: `src/renderer/components/__tests__/PreviewButton.test.tsx` (create) + `PreviewButtonComponent.stories.tsx` (create)
- Modify: `src/renderer/components/PrepareSteps/PrepareSteps.tsx` (preview box height only)

**Interfaces:**
- Consumes: `PreviewLabel` (#276).
- Produces: `PreviewButton` renders `PreviewLabel` instead of its inline `<b>PREVIEW</b> · nothing is being recorded` span.

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/components/__tests__/PreviewButton.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreviewButton from '../PreviewButtonComponent';

describe('PreviewButton', () => {
  it('shows the one shared preview label while previewing', () => {
    render(<PreviewButton isPreviewing onClick={vi.fn()} />);
    expect(screen.getByText('PREVIEW')).toBeInTheDocument();
    expect(screen.getByText(/not recording/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop preview' })).toBeInTheDocument();
  });

  it('offers Run & record once a preview has run', () => {
    const onRun = vi.fn();
    const { rerender } = render(<PreviewButton isPreviewing={false} onClick={vi.fn()} onRunAndRecord={onRun} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview experiment' }));
    rerender(<PreviewButton isPreviewing={false} onClick={vi.fn()} onRunAndRecord={onRun} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run & record' }));
    expect(onRun).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/renderer/components/__tests__/PreviewButton.test.tsx`
Expected: FAIL — the shared label's glyph and layout differ from today's inline span.

- [ ] **Step 3: Use `PreviewLabel`**

Replace the inline status span with `<PreviewLabel />`. Keep the `hasPreviewed` state and the "Preview experiment" / "Preview again" / "Run & record" button order exactly as they are. Remove the now-unused inline markup.

- [ ] **Step 4: The preview box shows a full participant screen**

Raise the preview area so the first participant screen (title, keys, notes and the Space line) is visible without scrolling (Ruling 4): `min-h-[420px]` growing with content, instead of `h-[330px]`. Add a `PreviewRunningFull` story that renders the Preview step with a real participant screen and asserts no internal scroll at both sizes.

- [ ] **Step 5: Run, typecheck, commit**

Run: `npx vitest run src/renderer/components/__tests__/PreviewButton.test.tsx src/renderer/components/PrepareSteps` → pass. `npx tsc --noEmit` → 0 errors.

```bash
git add src/renderer/components/PreviewButtonComponent.tsx src/renderer/components/PrepareSteps
git commit -m "feat(preview): one preview label; preview box shows a full participant screen"
```

---

### Task 4: Shared surfaces, Rule A, verification and docs

**Files:**
- Modify: `src/renderer/components/CollectComponent/PreTestComponent.tsx` (preview label now shared)
- Modify: `TODOS.md`, `.llms/learnings.md`

- [ ] **Step 1: Collect preview uses the same label**

`PreTestComponent`'s preview area and `PreviewButton` now share `PreviewLabel`. Verify the Design and Collect previews read identically at both sizes. If `PreTestComponent` has its own copy of the "nothing is being recorded" text, replace it.

- [ ] **Step 2: Rule A measurement**

For Overview, Background, Protocol (×3 fixtures) and Preview (stopped/running/finished), at 1366×768 and 1280×720: the step's primary action is inside the viewport and the page doesn't scroll. Record the numbers in the PR. If Background or Protocol scrolls internally, that's acceptable: the action row must stay visible.

- [ ] **Step 3: Docs**

`TODOS.md`: strike "Design preview box clips participant screens" (Task 3 fixes it) and note the WS4 Prepare integration shipped (`YYYY-MM-DD, PR #N`). Add to Next: "Multitasking's Prepare protocol diagram describes two rules on the same keys; verify with a teacher whether it reads clearly."

Append to `.llms/learnings.md`:

```markdown
## Prepare: `PrepareSteps` owns the built-in step chrome

`DesignComponent` renders `PrepareSteps` for the four built-in studies;
Custom and Imported keep `SecondaryNavComponent` and their authoring steps.
Per-experiment data lives in each experiment's `prepare.ts`
(`responses` + `flow`), re-exported by `PrepareSteps/fixtures.ts`, so
Storybook shows what runs. Trial counts come from `flowFromStructure` and
the experiment's real loops — never `params.nbTrials`, which is stale for
Stroop (real 8/96) and Search (real 8/80). `PreviewLabel` is the single
preview status, used by `PreviewButtonComponent`.
```

- [ ] **Step 4: Full checks and the playtest**

Run: `npm run typecheck && npm run lint && npm test && node tests/electron-smoke.mjs` → all green.

Electron playtest (Fixture headset, `skill://electron-playtest`, screenshots in `/tmp/ws4-integration/`):
1. **Faces/Houses Design.** Gold pill step bar. Overview → Background → Protocol shows the face → 1 / house → 9 diagram and a vertical timeline reading 6 practice / 120 recorded.
2. **Stroop Design.** Diagram shows R/G/B/Y with the ink-color words; timeline reads 8 / 96.
3. **Visual Search Design.** Diagram shows B/N with the T examples; timeline reads 8 / 80.
4. **Multitasking Design.** Diagram shows its rules on B/N and a block timeline with no study-wide total.
5. **Preview.** `PreviewLabel` next to `Stop preview`; the participant screen and its keys are visible without scrolling. `Run & record` appears after a preview.
6. **Custom and Imported Design** still open their authoring flows.
7. **Keyboard.** Tab order reaches the step pills, the action row and the EEG toggle.

- [ ] **Step 5: PR**

```bash
git add TODOS.md .llms/learnings.md
git commit -m "docs: WS4 Prepare integration notes"
gh pr create --title "feat(prepare): WS4 Prepare integration" --body "Implements docs/superpowers/plans/2026-09-25-ws4-prepare-integration.md. Verification: <checks output, Rule A numbers, playtest screenshots>."
```
