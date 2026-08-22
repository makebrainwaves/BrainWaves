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
