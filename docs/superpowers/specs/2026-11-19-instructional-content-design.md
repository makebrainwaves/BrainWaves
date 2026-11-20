# Instructional content rewrite: design

Date: 2026-11-19. Status: approved in conversation; implementation authorised without a separate spec review.

Source critique: "Critique: BrainWaves experiment instructions" (pasted 2026-11-19), covering Faces/Houses, Stroop, Visual Search and Multitasking. Custom and Imported content is teacher-authored and only touched where stated below.

## Goal

A student who finishes Prepare should know what is compared, what is measured, what they predict, and what pattern in Analyze would show them wrong. A participant should be able to read "see X, decide Y, press Z" at a glance, and know what to expect (trial count, time limits, feedback, what to do with their eyes).

## Decisions

| Topic | Decision |
|---|---|
| Structure | One spec, four phased PRs (below). |
| Where content lives | Existing files: `content_*.js`, `prepare.ts`, `screens.ts`, `experiment.ts`, shared `participantScreens.ts`. No new content loader. |
| Predictions | Students pick from 2–3 options (built-ins) or build one from their own conditions (Custom). Saved with the workspace, shown in Analyze. |
| Analyze busyness | Prediction lives in the existing left column of the matching tab, one line plus a collapsed "What to look for". No new panel. |
| Condition names | Rename, and translate older files when they are read. Marker codes never change. |
| Skip practice | Unchanged. |
| Fun facts | Kept, but moved below the core explanation and labelled as an aside. Accuracy caveats kept or added. |

## 1. Prepare structure (PR 1)

### Background slots

Replace `first_column_statement`, `first_column_question`, `second_column_statement`, `second_column_question` with named slots, rendered in this order and skipped when empty:

```ts
background: {
  title: string;
  idea: string;              // the mechanism; paragraphs split on blank lines
  findings?: {               // one finding, hedged, with a named source
    title?: string;          // default "What researchers have found"
    text: string;
    image?: string; imageAlt?: string;   // e.g. Faces/Houses FFA diagram
  };
  discuss?: string;          // one real discussion question
  aside?: { text: string; image?: string };  // the former fun fact, labelled "Aside"
  video?: { caption: string; embedUrl: string };
  links: { name: string; address: string }[];  // name = source + year, e.g. "Stroop (1935), Journal of Experimental Psychology"
}
```

Remove the legacy `BackgroundText` field names from `constants/interfaces.ts` where nothing else uses them; migrate every consumer (PrepareSteps, stories, fixtures, Custom's background file, tests). Custom keeps its own content but moves to the new field names.

### Protocol cards

Under the response diagram and flow timeline:

1. **What we compare and measure.** Condition pair, the measure (response time, accuracy, or the ERP around 170 ms at TP9/TP10), and where it appears in Analyze. Data: `prepare.ts` `compare: { conditions: [string, string]; measure: string; whereInAnalyze: string }`.
2. **Make a prediction.** See section 2.
3. **Teacher note.** One or two lines in `prepare.ts` `teacherNote`: colour-vision check (Stroop, Visual Search), finger placement (Multitasking: one finger on B, one on N), eye guidance for EEG (Faces/Houses and Stroop: blink while the screen is blank; Visual Search: keep the head still, let the eyes search).

### Content corrections (the three misconceptions)

- **Faces/Houses:** never claim EEG locates the fusiform face area. State the testable finding: faces typically produce a larger negative dip around 170 ms after the image, strongest near the ears (TP9/TP10). Hedge the control: houses differ from faces in more than "being a face", so a difference shows face-sensitive processing, not proof of a dedicated module. Break the Background wall of text into idea → finding → caveat. Remove "We look at faces more than anything else". Keep the Oliver Sacks video and the FFA image (as anatomy context, not as what EEG measures). Brad Pitt aside kept, with its "never tested" caveat.
- **Multitasking:** frame as switching rules, not doing two things at once: "People say 'multitasking', but this experiment tests what happens when your brain has to keep switching rules — and what that switching costs." Name the block structure: single-rule blocks, then a mixed block. State the rules in words (top → shape, bottom → dots). The hemispheres / "brain distributors" passage becomes an aside explicitly labelled as an open question.
- **Visual Search:** the variable is how many letters are on screen (5, 10, 15, 20) and whether the target is there. Idea: "More places to check means a longer search — and 'not there' takes longest, because you have to check everywhere before you can say no." Distractor similarity is not the manipulation; mention it at most as a discussion question.

### Other Prepare copy

- **Stroop:** replace the "yes means no" game analogy with the real intuition ("You can't switch reading off — the word grabs the answer before the ink does"). Name Match/Mismatch. Sleep/ADHD: keep only with a verified source, framed as "researchers study whether…"; otherwise drop. Balkan nodding becomes an aside.
- **Links:** name source and year. Prefer primary or university sources; replace "Link 1"/"Link 2" and Psychology Today where a better source exists.
- Candidate sources, each verified before use: Stroop (1935), J. Exp. Psychol. 18:643–662; Bentin et al. (1996), J. Cogn. Neurosci. 8:551–565 (N170); Kanwisher et al. (1997), J. Neurosci. 17:4302–4311 (FFA); Treisman & Gelade (1980), Cognitive Psychology 12:97–136; Rogers & Monsell (1995), J. Exp. Psychol. Gen. 124:207–231; Monsell (2003), Trends Cogn. Sci. 7:134–140; Lansbergen et al. (2007), Neuropsychology 21:251–262 (Stroop and ADHD meta-analysis).

## 2. Predictions (PR 3)

### Shape

```ts
/** Saved as params.prediction. Condition names are the experiment's (post-rename) labels. */
interface Prediction {
  conditions: [string, string];          // A, B
  measure: 'rt' | 'accuracy' | 'erp';
  direction: 'a>b' | 'a=b' | 'a<b';      // for erp: amplitude, so "Face dips lower" is 'a<b'
}
```

### Built-in experiments

`prepare.ts` `prediction`: fixed `conditions` and `measure`, a question, one student-facing label per direction (2–3 options), and a one-sentence `lookFor`. Examples:

| Experiment | Conditions (A, B) | Measure | Options |
|---|---|---|---|
| Faces/Houses | Face, House | erp | Face dips lower ~170 ms / about the same / House dips lower |
| Stroop | Mismatch, Match | rt | Mismatch slower / about the same / Mismatch faster |
| Visual Search | 15 and 20 letters, 5 and 10 letters | rt | More letters slower / about the same / More letters faster |
| Multitasking | Mixed rules, Single rule | rt | Mixed slower / about the same / Mixed faster |

The Protocol card shows the options as a radio group. Picking one dispatches `SetParams({ ...params, prediction })`, which the existing save epic persists with the workspace. Optional; Preview and Collect never require it.

### Custom experiments

A "Make a prediction" card in Custom's design steps, beside the hypothesis (`params.description.hypothesis`): pick two of the student's conditions (default: the first two), a measure (response time, accuracy, and brain response only when EEG is on), and a direction. The hypothesis text is shown as the reason. Same `params.prediction` shape. Imported experiments get no card.

### Analyze

In the existing left column of the tab matching the measure (ERP tab for `erp`, Behavior tab for `rt`/`accuracy`), a compact "Your prediction" section: one line ("Mismatch slower than Match"), and a collapsed "What to look for" toggle with one sentence (built-ins: `lookFor`; Custom: generated from conditions and measure). No prediction: one muted line, "No prediction — add one in Prepare". No automatic verdict.

## 3. Participant screens (PR 4)

### Shared builder (`experiments/shared/participantScreens.ts`)

`InstructionsScreenParams` gains optional:

- `decisionRule`: one line, see X → press Y (e.g. "Face → 1 · House → 9").
- `expect`: what to expect — roughly how many trials and minutes, feedback only in practice, any time limit or pause.
- `eyes`: task-specific EEG guidance that replaces the generic stillness line; still shown only when `isEEGEnabled`.

Transition screens repeat the decision rule.

### Practice feedback names the right answer

Replace "Please respond accurately" with a sentence naming the correct answer and key, e.g. Faces/Houses "That was a house — press 9", Stroop "The ink was blue — press B". Visual Search's existing missed-target outline stays. Main-task trials stay without feedback.

### Per experiment

- **Faces/Houses:** "You will see faces and houses, one at a time. Press 1 for a face, 9 for a house, as soon as you're sure. This isn't a speed test." Remove "press the right key" and "take about 1–1.5 seconds per picture". Eyes: "Keep your eyes on the picture; blink while the screen is blank."
- **Stroop:** add a Match example ("The ink is green and the word says green — still just press G") alongside the two Mismatch examples; use Match/Mismatch. Eyes: as Faces/Houses.
- **Visual Search:** examples as small grids (target present, target absent) instead of lone letters; rule "Only press N after you've checked the whole picture" replaces "without guessing". Eyes: "Keep your head and body still; let your eyes search the picture."
- **Multitasking** (rewrite):
  - Intro uses the critique's text: top → shape (diamond B, rectangle N, ignore the dots); bottom → dots (2 B, 3 N, ignore the shape); single rules first, then mixed; the changing position is the hard part and what is measured; 5 seconds per trial.
  - The HTML instruction deck keeps its four worked examples; remove both "That is easy"; "filling" → "dots" in participant-visible text.
  - The two-line rule table appears on the intro, on every block-description screen, and small in the trial footer.
  - Disclose the 5-second limit, the pause after a wrong key, and the number of blocks and trials. Block screens restate the keys.

Skip-practice is unchanged.

## 4. Names and migration (PR 2)

| Experiment | Old EEG / behavior names | New |
|---|---|---|
| Stroop | Congruent, Incongruent / Match, Mismatch | Match, Mismatch |
| Multitasking | No switching, Switching | Single rule, Mixed rules |
| Visual Search | 5 and 10 letters, 15 and 20 letters | unchanged (Prepare calls the variable "how many letters") |
| Faces/Houses | Face, House | unchanged |

- Marker codes are unchanged (Mismatch = old Incongruent's code, Match = old Congruent's, and so on). Update `params.ts` labels, the emitting hooks (`emitStroopCondition`, multitasking `triggerEEGCallback`, `scoreTaskResponse`), and `markerContract.test.ts`.
- One shared old → new table (Congruent → Match, Incongruent → Mismatch, No switching → Single rule, Switching → Mixed rules), applied:
  - in `load_clean_epochs` (`webworker/utils.py`) before concatenating, renaming each file's `event_id` keys, so old and new sessions pool;
  - in behavior reading (`behavior/compute.js`) for older Multitasking rows (Stroop behavior already used Match/Mismatch).
- Re-cleaning an old raw recording needs no translation: Clean builds `event_id` from the current registry.
- Analyze ERP walkthrough ("What am I looking at?") becomes per experiment: Faces/Houses keeps its text; the others get a short version naming their own conditions. Remove the hard-coded "Face vs House".

## 5. Phasing and testing

| PR | Content | Depends on |
|---|---|---|
| 1 | Prepare structure and content (section 1) | — |
| 2 | Names and migration (section 4) | — |
| 3 | Predictions (section 2) | 2 (predictions store post-rename names) |
| 4 | Participant screens (section 3) | — |

PRs 1, 2 and 4 are built in parallel worktrees; 3 starts after 2 merges. Merge conflicts in shared files (`prepare.ts`, `params.ts`, `experiment.ts`) are resolved by whichever merges second.

Tests defend behaviour, not wording:

- Existing: keys shown = keys accepted (`participantScreens.test.ts`), Prepare trial counts (`prepareContent.test.ts`) keep passing.
- New: Multitasking's rule table and every practice feedback line name a key the trial accepts; every built-in `prediction.conditions` and `compare.conditions` are real condition labels of that experiment; the migration test pools an old-name cleaned file with a new-name one (native MNE) and reads old Multitasking behavior rows; a prediction survives save/reopen and shows on the matching Analyze tab; Custom's prediction options come from the student's conditions.
- Visual: Storybook at 1366×768 for changed Prepare steps and participant screens (existing overflow checks); one fixture-headset run per built-in in a worktree dev instance; Analyze with and without a prediction.

All work happens in `.worktrees/`; the user's main checkout and running app are not touched.
