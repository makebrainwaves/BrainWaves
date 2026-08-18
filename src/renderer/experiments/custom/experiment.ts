import {
  initPracticeLoopWithStimuli,
  initLoopWithStimuli,
  initResponseHandlers,
  triggerEEGCallback,
  resetCorrectResponse,
} from '../../utils/labjs/functions';

// The stimulus screen renders whatever the trial carries: an image
// (`filepath`), a sound (`audiopath`), or both. Sounds start playing when the
// screen appears — the same moment triggerEEGCallback fires the EEG marker.
// Audio-only trials show a speaker glyph so the participant knows the trial
// is live. The `${...}` placeholders are lab.js templates (lodash template
// with the parameter context as `this`), evaluated at trial prepare time —
// hence the `\${` escapes.
const stimulusScreenContent = `<main class="content-horizontal-center content-vertical-center">
  <div>
    \${ this.parameters.filepath ? '<img src="' + this.parameters.filepath + '" style="max-height: ' + this.parameters.imageHeight + '; max-width: 100%; object-fit: contain;" />' : (this.parameters.audiopath ? '<div style="font-size: 96px; line-height: 1;">🔊</div>' : '') }
    \${ this.parameters.audiopath ? '<audio src="' + this.parameters.audiopath + '" autoplay></audio>' : '' }
  </div>
</main>

<footer class="content-vertical-center content-horizontal-center">
  <p>
    \${this.parameters.taskHelp}
  </p>
</footer>`;

const fixationCross = {
  type: 'lab.canvas.Screen',
  content: [
    {
      type: 'rect',
      left: 0,
      top: 0,
      angle: 0,
      width: 10,
      height: '50',
      stroke: null,
      strokeWidth: 1,
      fill: 'black',
    },
    {
      type: 'rect',
      left: 0,
      top: 0,
      angle: 90,
      width: 10,
      height: '50',
      stroke: null,
      strokeWidth: 1,
      fill: 'black',
    },
  ],
  files: {},
  parameters: {},
  responses: {},
  hooks: {},
  viewport: [800, 600],
  title: 'Fixation cross',
  timeout: '${parameters.iti}',
};

const stimulusScreen = {
  type: 'lab.html.Screen',
  files: {},
  responses: {},
  parameters: {},
  hooks: {
    'before:prepare': initResponseHandlers,
    run: triggerEEGCallback,
  },
  title: 'Stimulus',
  timeout: "${parameters.selfPaced ? '3600000' : parameters.presentationTime}",
  content: stimulusScreenContent,
};

export const customExperiment = {
  title: 'root',
  type: 'lab.flow.Sequence',
  parameters: {},
  plugins: [],
  metadata: {},
  files: {},
  responses: {},
  content: [
    {
      type: 'lab.flow.Sequence',
      files: {},
      parameters: {},
      responses: {},
      hooks: {},
      title: 'Custom experiment',
      content: [
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'continue',
            'keypress(q)': 'skipPractice',
          },
          hooks: {},
          title: 'Instruction',
          content: `<header class="content-vertical-center content-horizontal-center">
  <h1>Welcome to your experiment</h1>
</header>

<main>

  <p>
     \${this.parameters.intro}
  </p>

</main>

<footer class="content-vertical-center content-horizontal-center">
  <p>Press the space bar to begin with a few practice trials.</p>
</footer>`,
        },
        {
          type: 'lab.flow.Loop',
          files: {},
          parameters: {},
          templateParameters: [],
          sample: {
            mode: 'draw-shuffle',
            n: '',
          },
          responses: {},
          hooks: {
            'before:prepare': initPracticeLoopWithStimuli,
          },
          title: 'Practice loop',
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            hooks: {},
            title: 'Trial',
            content: [
              fixationCross,
              stimulusScreen,
              {
                type: 'lab.canvas.Screen',
                content: [
                  {
                    type: 'i-text',
                    left: 0,
                    top: 0,
                    angle: 0,
                    width: 895.3,
                    height: 36.16,
                    stroke: null,
                    strokeWidth: 1,
                    fill: "${ state.correct_response ? 'green' : 'red' }",
                    text: "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
                    fontStyle: 'normal',
                    fontWeight: 'bold',
                    fontSize: '52',
                    fontFamily: 'sans-serif',
                    lineHeight: 1.16,
                    textAlign: 'center',
                  },
                ],
                files: {},
                parameters: {},
                responses: {},
                hooks: {
                  end: resetCorrectResponse,
                },
                viewport: [800, 600],
                title: 'Feedback',
                tardy: true,
                timeout: '1000',
                skip: "${ parameters.phase === 'task' }",
              },
            ],
          },
        },
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'continue',
          },
          hooks: {},
          title: 'Main task',
          content: `<header class="content-vertical-center content-horizontal-center">
  <h1>Ready for the real data collection?</h1>
</header>
<main>

  <p>
    Press the space bar to start the main task.
  </p>

</main>
<footer class="content-vertical-center content-horizontal-center">

</footer>`,
        },
        {
          type: 'lab.flow.Loop',
          files: {},
          parameters: {},
          templateParameters: [],
          sample: {
            mode: 'draw-shuffle',
            n: '',
          },
          responses: {},
          hooks: {
            'before:prepare': initLoopWithStimuli,
          },
          title: 'Experiment loop',
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            hooks: {},
            title: 'Trial',
            content: [fixationCross, stimulusScreen],
          },
        },
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'end',
          },
          hooks: {},
          title: 'End',
          content: `<header class="content-vertical-center content-horizontal-center">

</header>

<main>
  <h1>
    Thank you!
  </h1>
  <h1>
    Press the space bar to finish the task.
  </h1>
</main>
`,
        },
      ],
    },
  ],
};
