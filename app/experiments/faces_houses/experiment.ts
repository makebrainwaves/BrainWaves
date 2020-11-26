/* eslint-disable */

import {
  initPracticeLoopWithStimuli,
  initLoopWithStimuli,
  initResponseHandlers,
  triggerEEGCallback,
  resetCorrectResponse,
} from '../../utils/labjs/functions';

// Define study
export const facesHousesExperiment = {
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
      messageHandlers: {},
      title: 'The face-house task',
      content: [
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'continue',
            'keypress(q)': 'skipPractice',
          },
          messageHandlers: {},
          title: 'Instruction',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EThe face-house task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n     ${this.parameters.intro}\n  \u003C\u002Fp\u003E\n  \n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E',
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
          messageHandlers: {
            'before:prepare': initPracticeLoopWithStimuli,
          },
          title: 'Practice loop',
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            messageHandlers: {},
            title: 'Trial',
            content: [
              {
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
                messageHandlers: {},
                viewport: [800, 600],
                title: 'Fixation cross',
                timeout: '${parameters.iti}',
              },
              {
                type: 'lab.html.Screen',
                files: {},
                responses: {},
                parameters: {},
                messageHandlers: {
                  'before:prepare': initResponseHandlers,
                  run: triggerEEGCallback,
                },
                title: 'Stimulus',
                timeout:
                  "${parameters.selfPaced ? '3600000' : parameters.presentationTime}",
                content:
                  '\u003Cmain class="content-horizontal-center content-vertical-center"\u003E\n  \u003Cdiv\u003E\n    \u003Cimg src=${ this.parameters.filepath } height=${ this.parameters.imageHeight } \u002F\u003E\n  \u003C\u002Fdiv\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    ${this.parameters.taskHelp} \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
              },
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
                    text:
                      "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
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
                messageHandlers: {
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
          messageHandlers: {},
          title: 'Main task',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E',
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
          messageHandlers: {
            'before:prepare': initLoopWithStimuli,
          },
          title: 'Experiment loop',
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            messageHandlers: {},
            title: 'Trial',
            content: [
              {
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
                messageHandlers: {},
                viewport: [800, 600],
                title: 'Fixation cross',
                timeout: '${parameters.iti}',
              },
              {
                type: 'lab.html.Screen',
                files: {},
                responses: {},
                parameters: {},
                messageHandlers: {
                  'before:prepare': initResponseHandlers,
                  run: triggerEEGCallback,
                },
                title: 'Stimulus',
                timeout:
                  "${parameters.selfPaced ? '3600000' : parameters.presentationTime}",

                content:
                  '\u003Cmain class="content-horizontal-center content-vertical-center"\u003E\n  \u003Cdiv\u003E\n    \u003Cimg src=${ this.parameters.filepath } height=${ this.parameters.imageHeight } \u002F\u003E\n  \u003C\u002Fdiv\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    ${this.parameters.taskHelp} \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
              },
            ],
          },
        },
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'end',
          },
          messageHandlers: {},
          title: 'End',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Ch1\u003E\n    Thank you!\n  \u003C\u002Fh1\u003E\n  \u003Ch1\u003E\n    Press the space bar to finish the task.\n  \u003C\u002Fh1\u003E\n\u003C\u002Fmain\u003E\n\n',
        },
      ],
    },
  ],
};
