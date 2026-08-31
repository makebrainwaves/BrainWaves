/**
 * P300 visual oddball — BrainWaves-importable jsPsych timeline.
 *
 * These globals are injected by BrainWaves before this file runs:
 *   - initJsPsych
 *   - jsPsychHtmlKeyboardResponse
 *   - jsPsychSurveyText
 */
/* global initJsPsych, jsPsychHtmlKeyboardResponse, jsPsychSurveyText */
/**
 * Adapted from Josh de Leeuw's p300-demo:
 *   https://github.com/jodeleeuw/p300-demo
 *
 * Changes made for BrainWaves:
 *   - Removed the external `fetch(.../trigger/tcp/...)` handler. BrainWaves
 *     writes EEG markers automatically from the `condition` data key.
 *   - Added a semantic `condition` label (standard / target / distractor)
 *     alongside the display `color`, so the Markers tab can map trials to
 *     stable numeric codes.
 *   - Changed the v7 string `"NO_KEYS"` to the v8-compatible empty array.
 *   - Removed the `localSave` call; BrainWaves collects the behavioral data.
 *
 * How to import:
 *   1. In BrainWaves Home, click "Import Experiment" and select this file.
 *   2. On the Markers tab, choose "condition" as the Condition key.
 *   3. Add the three condition labels in the order you want their marker codes:
 *        standard  -> 1
 *        target    -> 2
 *        distractor-> 3
 *      (Order is the contract — freeze it before the first subject.)
 *   4. Click "Freeze marker codes", then go to Collect.
 */

const jsPsych = initJsPsych();

const subject_id = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: "Please enter the subject ID as a two digit number, e.g., 05",
    },
  ],
  data: {
    task: "subject_id",
  },
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<div style="width:600px;">
    <p>A series of colored circles will appear. Most of the circles will be blue, but some will be orange and some will be purple.</p>
    <p>Your task is to count the total number of orange and purple circles.</p>
    <p>You do not need to keep track of the number of orange and purple separately. For example, if you have seen 3 purple circles and 1 orange circle you only need to report the number 4.</p>
    <p>You'll complete 3 rounds, and each round will take about 3 minutes.</p>
    <p>When you are ready for the first round, press the spacebar.</p>
    </div>`,
  choices: [" "],
  post_trial_gap: 1000,
};

const circle_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: () => {
    return `<div style="width:400px; height: 400px; border-radius: 400px; background-color: ${jsPsych.timelineVariable(
      "color"
    )};"></div>`;
  },
  trial_duration: 350,
  post_trial_gap: 350,
  data: {
    task: "circle",
  },
};

const p300_block = {
  timeline: [circle_trial],
  timeline_variables: [
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#0000ff", data: { condition: "standard" } },
    { color: "#ffaa00", data: { condition: "target" } },
    { color: "#8000ff", data: { condition: "distractor" } },
  ],
  repetitions: 25,
  randomize_order: true,
};

const count_break = {
  type: jsPsychSurveyText,
  preamble: `<p>That's the end of the round.</p>`,
  questions: [
    {
      prompt:
        "How many orange and purple circles did you see in that round?",
    },
  ],
  post_trial_gap: 1000,
  data: {
    task: "count",
  },
};

const begin_next_round = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>When you are ready for the next round, press the spacebar.</p>`,
  choices: [" "],
};

const end = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>The experiment is complete. Thanks!</p>`,
  choices: [],
};

jsPsych.run([
  subject_id,
  instructions,
  p300_block,
  count_break,
  begin_next_round,
  p300_block,
  count_break,
  begin_next_round,
  p300_block,
  count_break,
  end,
]);
