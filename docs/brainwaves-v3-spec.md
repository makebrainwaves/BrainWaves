# BrainWaves V3 — AI-Assisted Analysis Layer

*Gotham Data Clinic. Drafted 24 August 2026. Status: high-level spec, pre-implementation.*

*Companions: `gdc-lycee-shared-understanding.md` (positioning), `curation-layer-spec.md` (component 5).*

---

## Position in roadmap

- **V1** — shipped. EEG collection, ERP-specialized experiment flow, custom experiment builder.
- **V2** — re-introduction of neuroscience instructional content.
- **V3** — this document. AI-assisted analysis, data curation, structured statistical reasoning.

**Sequencing note:** the LFNY pitch rests on presenting BrainWaves as an existing working thing. Most of the pitch content is V3. Resolve before the first meeting: either lead with V1/V2 as the working program and position V3 as what pilot revenue funds, or pull the curation game forward as a standalone demo (it needs no hardware and is the most novel asset available).

**Open sequencing question:** the no-hardware behavioral tier (browser-based reaction-time tasks via the existing jsPsych fork) may belong earlier than V3. It removes the single point of failure from any pilot, makes data collection parallel rather than serial, and demos in a browser with zero setup.

---

## Thesis

The model translates student intent into executable analysis. It never interprets.

Students should use AI as part of doing science — it removes technical friction with no pedagogical value. But the tool must be engineered so it cannot cross from **incidental difficulty** (pandas syntax, CSV parsing, plot axes, filter coefficients — offloading is pure gain) into **constitutive difficulty** (choosing the test, identifying confounds, judging signal from noise, saying what the data means — offloading destroys the product).

*A bicycle amplifies locomotion, not navigation.*

---

## Non-negotiable constraints

These are the rails. Every component below is subordinate to them.

1. **The model emits code, values, and plots. Never verdicts, conclusions, interpretations, or research questions.** A verdict on a specified test is still a verdict: the model returns 0.03, the student decides what 0.03 means.
2. **No free-text prompt box.** A prompt is an assessment leak — the prompt itself becomes the gradeable artifact. Intent is expressed through structured input only.
3. **Generated code is always visible, runnable, and editable.** The widget is scaffolding that fades: click → read → edit → write.
4. **Execution is client-side via Pyodide.** No install; student biosignal data never leaves the browser.
5. **Silence before commitment; feedback after.** A verdict delivered *before* a decision replaces the decision. The identical sentence delivered *after* the student commits is instruction. This timing rule is what makes components 3 and 6 possible without weakening constraint 1.
6. **Every interaction is logged as evidence of student process.** This is the answer to the teacher's real objection — that AI destroys assessability. The log gives richer visibility into reasoning than a finished report ever did.

---

## Component 1 — Structure declaration

Before any statistical test is visible, the student declares four things about their own experiment. None can be inferred by the tool.

| Slot | Options |
|---|---|
| What is being compared | free selection from their own variables |
| How many groups / conditions | 1, 2, 3+ |
| Outcome data type | continuous / ordinal / categorical |
| Observation structure | independent / paired (same subjects) |

**Design notes**
- Needs custom iconography in the existing BrainWaves illustration style. The ordinal-vs-categorical icon in particular is a *definition* the student must then apply — ordered-but-unequally-spaced (Likert ladder) vs. unordered bins. Highest-reuse asset in the product; it will end up in the PD deck and the pitch.
- The declaration remains visible on screen throughout test selection.
- This flow is the point at which the prerequisite curriculum (normal vs. non-normal, categorical vs. ordinal, paired vs. independent, what a p-value is) becomes load-bearing. The tool does not teach it; the tool is unusable without it. Good framing for PD: *this tool has a prerequisite, and the prerequisite is the course.*

---

## Component 2 — Test palette and statistical spine

The tool presents the **full test list, unfiltered and unsorted**, alongside the student's own structure declaration. It never narrows the list, never sorts by fit, never highlights. The mapping from structure to test is the thing the student must supply.

| Structure | Parametric | Non-parametric |
|---|---|---|
| 2 groups, independent, continuous | Independent t-test | Mann-Whitney U |
| 2 conditions, same subjects, continuous | Paired t-test | Wilcoxon signed-rank |
| 3+ groups, continuous | One-way ANOVA | Kruskal-Wallis |
| 2 continuous variables | Pearson correlation | Spearman |
| 2 categorical variables | Chi-squared | — |
| Description only | Mean, SD, error bars | Median, IQR |

Superset of the IB's own published flow chart (chi-squared, t-test, standard deviation as error bars), which is useful to be able to say out loud.

**Hover documentation.** Each test gets on-hover explanatory text, disableable per context (e.g. assessment mode).
- Content describes **structure and assumptions**: *"Compares means of two independent groups. Assumes roughly normal distributions and similar variances."*
- Content must **never** describe applicability: *"Use this when you have two groups and continuous data"* hands over the structure-to-test mapping and converts component 1 into theater.
- Flagged risk: the fatal phrasing is how nearly every stats reference online is written, and is what an LLM will produce by default if asked to draft hover copy. Review every string by hand.

**Grade progression**
- Middle school: description row only. Plot, describe, no inference.
- Early high school: + chi-squared, + t-tests.
- DP: full palette, including the parametric/non-parametric choice — where the normality curriculum pays off.

**Effect size is always reported adjacent to p, never subordinate to it.** Cohen's d, r, or equivalent, as a value and never a verdict. Cheapest available correction for p-value fetishism and directly serves the IB's emphasis on magnitude.

**Incompatible tests run anyway.** If the chosen test contradicts the declared structure, the tool executes it, reports the result, and logs the mismatch. Rationale: refusing is a verdict; refusing couples data collection to analysis and makes the system brittle; mistakes that persist create a longer and more valuable correction cycle; and the mismatch is precisely what component 6 exists to catch. The teacher sees the mismatch flag today; nobody sees it now.

---

## Component 3 — Predict before you run

Partially exists in V1 as the research question / hypothesis / prediction fields in the custom experiment flow. V3 crystallizes it into an enforced, logged mechanic.

- Student states expected **direction** and rough **magnitude** before the test executes.
- Both are logged and timestamped prior to result.
- Kills post-hoc rationalization; produces a second reasoning artifact for the teacher; makes surprising results feel like something.

---

## Component 4 — The compiler

Widget specification in, executable analysis out.

- Input: structure declaration + test selection + parameters (alpha, tails, variables).
- Output: Python source, executed in Pyodide, plus values and plots.
- The model handles the **long tail** — compositions the palette didn't anticipate, messy real data. If it cannot earn its place on the tail, this is a Jupyter template with latency and a vendor bill. This is a live risk and should be tested early against real student data.
- Palette sizing principle: a widget per **decision**, not per operation. Roughly a dozen, not eighty.
- Prior art worth reading before designing the input surface: `gvwilson/tidyblocks` (archived Aug 2024, JavaScript/Blockly, not R) — for its block definitions and its post-mortem. Blocks as a *specification* surface that emits disposable code, never as a *construction* surface.

---

## Component 5 — Data curation layer

See `curation-layer-spec.md`. Partially implemented already.

Summary: units are rendered condition-blind; student makes keep/reject calls with failure-class tags; after ~25–40 calls the system infers the threshold rule the student was implicitly following; student accepts or tunes it; rule applies to the remainder; exclusion log exports as a writeup artifact.

Instantiates the general principle: **a decision becomes a detail once the student has earned it.**

---

## Component 6 — Post-submission agentic review

Asynchronous AI-written review of submitted work, modeled on industry code review / executive pre-read. Structurally, this is where the timing rule (constraint 5) pays off: it is the place feedback can live without corrupting the decision.

**Constraints, in priority order**

1. **It asks questions. It never supplies sentences.** Direct consequence of the IB prohibition on generative AI in the IA report. *"Your evaluation should note that exclusions were concentrated in frontal channels"* is a pasteable sentence and therefore a malpractice vector. *"You excluded 14% of epochs — were they evenly spread across conditions?"* forces the student to investigate and write it themselves. Enforce interrogative output at the output layer, not via prompt instruction.
2. **Reviews process, not conclusions.** Operates on logged artifacts — structure declaration, test chosen, prior prediction, curation calls, revision history. Never comments on whether a finding is correct or interesting.
3. **Delayed, not instant.** Overnight. Creates a real revision cycle, matches the industry experience being modeled, and sits on the right side of the immediate-vs-delayed feedback evidence.
4. **Student and teacher receive the identical artifact.** Student-only makes it a private tutor and invites gaming. Teacher-only makes it surveillance.
5. **Never scored.** Scoring produces review-shaped work. Vary question phrasing across submissions to further blunt gaming.

**What it can catch, from data already logged:** test contradicting declared structure; prediction inconsistent with reported conclusion; exclusions concentrated in one condition; p-value discussed without effect size; curation rule tuned after condition labels were revealed. Each is a real methodological failure, invisible in a finished report, currently caught by nobody.

**Commercial note:** this is the labor-relief argument for the teacher who would otherwise resist on grading tractability. Lead with it.

---

## Feedback design — evidence base

Review properly before designing interactions. Broad shape, which supports the constraints above:

- Elaborated feedback outperforms verification feedback ("wrong" helps little).
- Feedback that supplies the answer produces the least durable learning; hints and prompts outperform solutions. A confirm-button that fixes the error is the weakest available design.
- Immediate feedback favors procedural skill; delayed favors transfer and retention. Statistical reasoning is a transfer target.
- Task-directed feedback helps; person-directed feedback can harm. Kluger & DeNisi found roughly a third of feedback interventions *decreased* performance.

Starting sources: Shute, *Focus on Formative Feedback* (2008); Hattie & Timperley (2007); Kluger & DeNisi (1996). Worth citing in the pitch — signals evidence over vibes to a room of teachers.

---

## Cross-cutting requirements

- **Bilingual throughout.** French and English, including failure-class labels, hover documentation, and icon captions. Not yet designed for. Note: line noise is 50 Hz in France, 60 Hz in the US — a free teaching moment.
- **Logging schema** must be stable and exportable; it is simultaneously the assessment evidence, the input to component 6, and the research instrument for testing the mentor-substitution assumption.

---

## Upstream dependencies

**Likely the largest hidden work item in V3.** BrainWaves is currently over-specified for ERP experiments. Supporting the statistical spine above requires the collection layer to emit **tidy trial-level data**, not only averaged waveforms.

Action: code agent to cross-reference the component 2 test table against current app capabilities and scope the collection-side work.

---

## TODOs

- [ ] Audit BrainWaves curriculum for statistical-test content. If absent, write it — it is the prerequisite for component 1.
- [ ] Code agent: cross-reference test table vs. app capability; scope collection-side changes for tidy trial-level output.
- [ ] Decide V3-slice-forward question for the LFNY demo.
- [ ] Review feedback literature before designing component 6 interaction.
- [ ] Hand-review all hover strings against the applicability prohibition.

---

## Explicitly out of scope

- Student-facing AI writing assistance of any kind.
- Free-text prompting.
- Any tool output that narrows, sorts, ranks, or recommends statistical tests.
- Any tool output phrased as a conclusion about the student's data.
