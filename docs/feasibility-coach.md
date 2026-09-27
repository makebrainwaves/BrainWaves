# Feasibility Coach (prototype)

A "computational thinking in the age of AI" prototype. The custom experiment
designer is split into two phases with a checkpoint between them:

1. **Design**: Overview (question, hypothesis, methods) → Conditions (names and
   keys) → Trials (counts and order) → Parameters.
2. **Feasibility check**: a blocking modal. The student waits while a local
   model writes up the analysis, then chooses "Revise my design" (back to
   editing) or "Continue" ("Continue anyway" on yellow or red), which is the
   only way through. There is no chat.
3. **Build**: Stimuli (image and sound folders, trial list) → Instructions →
   Preview.

The student does all the experimental thinking alone, gets the feedback, and
only then spends time finding and downloading pictures and sounds. They can
always continue, whatever the verdict.

Background research on local LLMs in Electron: `Running a Local LLM (MiMo)
Inside Brainwaves (Electron).md` (repo root).

## Design: rules decide, a small model phrases

The judgment is deterministic; the model only writes it up.

1. **Rules** (`src/renderer/utils/feasibility/rules.ts`, `assessFeasibility`)
   read the design and return `{ verdict, target, reason, pitfalls, suggestion }`.
   - `SIGNAL_RULES`: keyword rules over question/hypothesis/methods. The most
     limiting match wins (not feasible > stretch > feasible), so "the amygdala
     reacts to faces" is not rescued by the word "faces".
     - Not feasible: lie detection, reading thoughts, deep structures,
       diagnosis / IQ / comparing people, locating brain regions.
     - Stretch: emotions, motor imagery.
     - Feasible: N170 (faces), P300 (oddball), alpha, blinks/jaw, ERPs,
       reaction time/accuracy.
     - No match: `unclear`, asking for a specific prediction.
   - Structural pitfalls from the parameters: no hypothesis, fewer than two
     conditions, fewer than 50 trials in the smallest condition (EEG designs
     only), session over 20 min, talking/moving in the methods. There is no
     ITI rule: the ITI starts after the participant responds, so the 500 ms
     default leaves no overlap problem.
   - This is where neuroscience advisors should edit. Each rule is one object;
     `__tests__/rules.test.ts` pins the precedence and thresholds.
2. **Phrasing** (`prompt.ts`): a short fixed system prompt plus a per-request
   message holding the student's question, hypothesis and the assessment. The
   model is told not to add judgments or numbers.
3. **UI** (`DesignComponent/FeasibilityDialog.tsx`): verdicts map to three
   bands (green "Great experiment idea" = feasible; yellow "Oh, this could get
   complicated" = stretch or unclear; red "This probably won't work" = not
   feasible), shown as the card's top band and a chip. The chip and the
   "Things to watch" list come straight from the rules; only the paragraph is
   model text. With no model installed, or on any model error, the paragraph
   falls back to the rules' own reason and suggestion, so the feature still
   works without AI.

The designer has no structured "what are you measuring?" field yet, so the
target is inferred from free text by keyword. That is the known ceiling (it is
marked `ponytail:` in the code). The upgrade is a structured choice in the
Overview step feeding the same rule table.

## Model

Small instruct models with thinking off, 4k context, 200-token cap:

| Tier | File (bartowski GGUF) | Download | Picked when |
| --- | --- | --- | --- |
| 1 | `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf` | 2.5 GB | installed and RAM ≥ 8 GB |
| 2 | `Qwen_Qwen3.5-2B-Q4_K_M.gguf` | 1.4 GB | installed and RAM ≥ 4 GB |

Both are Apache-2.0. `src/main/llm/models.ts` picks the best installed tier the
machine's RAM can hold. `BW_LLM_MODEL=/path/to.gguf` overrides it.

MiMo was the first pick and was dropped. The laptop-sized MiMo is a 9B
reasoning model (5.8 GB at Q4_K_M) that emits hundreds of thinking tokens,
which is too slow on classroom CPUs for a task that only needs a few grounded
sentences. Swapping it back in only means adding a tier.

Install for development (the app looks in `<userData>/models`):

```bash
cd ~/Library/Application\ Support/BrainWaves/models   # mkdir -p first
curl -L -C - -O https://huggingface.co/bartowski/Qwen_Qwen3.5-2B-GGUF/resolve/main/Qwen_Qwen3.5-2B-Q4_K_M.gguf
curl -L -C - -O https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

## Process architecture

```
renderer                     preload             main                      utility process
FeasibilityDialog            electronAPI         src/main/llm/index.ts     src/main/llm/worker.ts
 ├ assessFeasibility (rules)
 └ useFeasibility ──send──►  generateLLM ──────► llm:generate ──fork──────► node-llama-cpp (Metal/CUDA/CPU)
                             abortLLM   ───────► llm:abort   ──postMessage► abort in-flight run
              ◄── onLLMEvent ◄──────────── llm:event ◄──────────── loading | chunk | done | error
```

This follows the Pyodide pattern: heavy compute runs off the UI thread behind a
small message protocol (`src/shared/llmTypes.ts`). llama.cpp is native, so it
runs in an Electron `utilityProcess` owned by main instead of a web worker. A
crash or a hung generation cannot freeze the renderer or the app shell.

- **Worker**: loads the model on the first request and keeps one session per
  system prompt. Each request resets the history to just the system prompt, so
  llama.cpp reuses the system prompt tokens it has already evaluated. A new
  request aborts the one in flight.
- **Main**: forks the worker lazily, so users who never reach the feature pay
  no RAM. It relays events verbatim, turns a worker crash into an `error` for
  the in-flight request, and kills the worker on quit. The worker is bundled
  through electron-vite's `?modulePath` import.
- **IPC**: `llm:generate` and `llm:abort` use `send`, because the answer
  streams back as events rather than returning one value. `llm:event` is the
  push channel.
- **Hook** (`useFeasibility`): sends one request when the dialog mounts and
  aborts it when the dialog closes.
- **Gate** (`CustomDesignComponent`): opening any build step (from the nav or
  from "Check feasibility →" on Parameters) opens the dialog if the design has
  changed since the last check. The phrasing prompt serves as the design's
  fingerprint. The buttons stay disabled until the model finishes or fails,
  and Escape and outside clicks are ignored. Only Continue passes the check: it
  records the design as `params.feasibilityCheckedPrompt`, which is saved with
  the workspace. Revise just closes the dialog, so the next attempt to open a
  build step asks again. The student is never hard-blocked, because Continue
  is always offered.
- **Chip**: while `feasibilityCheckedPrompt` matches the current design, a
  `FeasibilityChip` in the design nav shows the verdict band. It disappears
  before the first check and as soon as an edit changes the analysis. That same
  edit re-arms the gate.
- **Trial counts are planned, not derived.** `balanceStimuliByCondition`
  already samples `ceil(nbTrials / conditions)` trials per condition from
  whatever stimuli exist, so counts are set on the Trials step before any
  folder is chosen. Picking folders no longer overwrites them (`countPhases`
  is gone). Custom defaults are now 100 experimental and 10 practice trials.
  The rules count conditions from their names (`plannedConditions`), so the
  check works with no folders.

The LLM channels are generic (system prompt + message in, text out), so other
features can reuse the runtime with their own prompt module.

## Packaging

`node-llama-cpp` and `@node-llama-cpp/*` are in `asarUnpack`, because the
prebuilt native binaries cannot load from inside the asar. The model is not
bundled.

## Not built yet

- In-app model download (progress, resume, SHA-256 check). Until then, models
  are installed by hand as above.
- A benchmark on a real lab PC (4-core CPU, 8 GB); so far only Apple Silicon
  has been run.
- Advisor review of `SIGNAL_RULES`, and a structured "what are you measuring?"
  field to replace keyword matching.
- Windows and Linux verification (prebuilts exist).
