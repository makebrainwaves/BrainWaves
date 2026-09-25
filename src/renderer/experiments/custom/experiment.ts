import {
  initPracticeLoopWithStimuli,
  initLoopWithStimuli,
  initResponseHandlers,
  triggerEEGCallback,
  resetCorrectResponse,
  skipPracticeOnRequest,
} from '../../utils/labjs/functions';
import {
  customInstructionsScreen,
  customTransitionScreen,
} from '../../utils/labjs/customStimuli';
import { endScreen } from '../shared/participantScreens';
import type { ExperimentParameters } from '../../constants/interfaces';

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

/** Builds the instruction screen from this workspace's conditions when lab.js prepares it. */
function prepareInstructions(this: {
  parameters: unknown;
  options: { content?: string };
}) {
  this.options.content = customInstructionsScreen(
    this.parameters as ExperimentParameters
  );
}

/** Builds the practice → recorded-task screen from this workspace's conditions. */
function prepareTransition(this: {
  parameters: unknown;
  options: { content?: string };
}) {
  this.options.content = customTransitionScreen(
    this.parameters as ExperimentParameters
  );
}

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
          hooks: {
            'before:prepare': prepareInstructions,
            end: skipPracticeOnRequest,
          },
          title: 'Instruction',
          content: '',
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
          hooks: { 'before:prepare': prepareTransition },
          title: 'Main task',
          content: '',
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
          content: endScreen(),
        },
      ],
    },
  ],
};
