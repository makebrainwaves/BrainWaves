import * as lab from 'lab.js';

import {
  emitSearchCondition,
  initSearchTrials,
  initPracticeTrials,
  initGrid,
  initResponses,
} from './utils';
import { skipPracticeOnRequest } from '../../utils/labjs/functions';
import {
  endScreen,
  instructionsScreen,
  transitionScreen,
} from '../shared/participantScreens';
import { instructions } from './screens';

// Define study
export const searchExperimentObject = {
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
      title: 'Visual search',
      content: [
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'next',
            'keypress(q)': 'skipPractice',
          },
          hooks: { end: skipPracticeOnRequest },
          title: 'Instruction',
          content: instructionsScreen(instructions),
        },
        {
          type: 'lab.flow.Loop',
          files: {},
          parameters: {},
          templateParameters: [],
          sample: {
            mode: 'draw-shuffle',
          },
          responses: {},
          hooks: {
            'before:prepare': initPracticeTrials,
          },
          title: 'Practice task',
          tardy: true,
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            hooks: {},
            title: 'Trial',
            content: [
              {
                type: 'lab.canvas.Frame',
                context:
                  '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                contextSelector: 'canvas',
                files: {},
                parameters: {},
                responses: {},
                hooks: {},
                title: 'Frame',
                content: {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 18.05,
                      height: 36.16,
                      fill: 'black',
                      stroke: null,
                      strokeWidth: 1,
                      strokeDashArray: null,
                      strokeLineCap: 'butt',
                      strokeDashOffset: 0,
                      strokeLineJoin: 'round',
                      strokeMiterLimit: 4,
                      scaleX: 1,
                      scaleY: 1,
                      angle: 0,
                      flipX: false,
                      flipY: false,
                      opacity: 1,
                      shadow: null,
                      visible: true,
                      clipTo: null,
                      backgroundColor: '',
                      fillRule: 'nonzero',
                      paintFirst: 'fill',
                      globalCompositeOperation: 'source-over',
                      transformMatrix: null,
                      skewX: 0,
                      skewY: 0,
                      text: '+',
                      fontSize: '50',
                      fontWeight: 'bold',
                      fontFamily: 'Times New Roman',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '15',
                      styles: {},
                    },
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  hooks: {
                    run: function anonymous(
                      this: lab.flow.Loop<Record<string, unknown>>
                    ) {
                      this.data.response = 'noresponse';
                      this.data.correct = false;
                    },
                  },
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${this.parameters.iti}',
                },
              },
              {
                type: 'lab.html.Screen',
                files: {},
                parameters: {},
                responses: {
                  'keypress(b)': 'yes',
                  'keypress(n)': 'no',
                },
                hooks: {
                  run: function anonymous(this: lab.core.Component) {
                    const taskgrid = document.querySelector('#taskgrid');
                    const { stimuli } = this.parameters;

                    for (const s of stimuli) {
                      const d = document.createElement('div');
                      d.classList.add('box');
                      const el = document.createElement('span');
                      el.classList.add('letter');

                      if (s > 0) {
                        if (s === 1) {
                          el.innerHTML = 'T';
                          el.style.color = 'lightblue';
                        }
                        if (s === 2) {
                          el.innerHTML = 'T';
                          el.style.color = 'orange';
                          el.style.transform = 'rotate(-180deg)';
                        }
                        if (s === 3) {
                          el.innerHTML = 'T';
                          el.style.color = 'orange';
                        }
                      }
                      d.appendChild(el);
                      taskgrid?.appendChild(d);
                    }
                  },
                },
                title: 'Stimuli',
                content:
                  '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                correctResponse: '${this.parameters.target}',
              },
              {
                type: 'lab.html.Screen',
                files: {},
                parameters: {},
                responses: {},
                hooks: {
                  run: initGrid,
                  'before:prepare': initResponses,
                },
                title: 'Feedback',
                content:
                  '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n  .feedback{\n    position: absolute;\n    top: 50px;\n    font-size: 2rem;\n    font-weight: bold;\n    color: #da5b1c;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n  \u003Cdiv id="feedback" class="feedback"\u003E\n    Feedback\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n\n',
                timeout: '2000',
                tardy: true,
                skip: "${ parameters.phase === 'main' }",
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
          title: 'Main task instruction',
          content: transitionScreen(instructions),
        },
        {
          type: 'lab.flow.Loop',
          files: {},
          parameters: {},
          templateParameters: [],
          sample: {
            mode: 'draw-shuffle',
          },
          responses: {},
          hooks: {
            'before:prepare': initSearchTrials,
          },
          title: 'Main task',
          shuffleGroups: [],
          template: {
            type: 'lab.flow.Sequence',
            files: {},
            parameters: {},
            responses: {},
            hooks: {},
            title: 'Trial',
            content: [
              {
                type: 'lab.canvas.Frame',
                context:
                  '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                contextSelector: 'canvas',
                files: {},
                parameters: {},
                responses: {},
                hooks: {},
                title: 'Frame',
                content: {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 18.05,
                      height: 36.16,
                      fill: 'black',
                      stroke: null,
                      strokeWidth: 1,
                      strokeDashArray: null,
                      strokeLineCap: 'butt',
                      strokeDashOffset: 0,
                      strokeLineJoin: 'round',
                      strokeMiterLimit: 4,
                      scaleX: 1,
                      scaleY: 1,
                      angle: 0,
                      flipX: false,
                      flipY: false,
                      opacity: 1,
                      shadow: null,
                      visible: true,
                      clipTo: null,
                      backgroundColor: '',
                      fillRule: 'nonzero',
                      paintFirst: 'fill',
                      globalCompositeOperation: 'source-over',
                      transformMatrix: null,
                      skewX: 0,
                      skewY: 0,
                      text: '+',
                      fontSize: '50',
                      fontWeight: 'bold',
                      fontFamily: 'Times New Roman',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '15',
                      styles: {},
                    },
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  hooks: {
                    run: function anonymous(this: lab.core.Component) {
                      this.data.response = 'noresponse';
                      this.data.correct = false;
                    },
                  },
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${this.parameters.iti}',
                },
              },
              {
                type: 'lab.html.Screen',
                files: {},
                parameters: {},
                responses: {
                  'keypress(b)': 'yes',
                  'keypress(n)': 'no',
                },
                hooks: {
                  run: function anonymous(this: lab.html.Screen) {
                    emitSearchCondition.call(this);
                    const taskgrid = document.querySelector('#taskgrid');
                    if (!taskgrid) return;
                    const { stimuli } = this.parameters;

                    for (const s of stimuli) {
                      const d = document.createElement('div');
                      d.classList.add('box');
                      const el = document.createElement('span');
                      el.classList.add('letter');

                      if (s > 0) {
                        if (s === 1) {
                          el.innerHTML = 'T';
                          el.style.color = 'lightblue';
                        }
                        if (s === 2) {
                          el.innerHTML = 'T';
                          el.style.color = 'orange';
                          el.style.transform = 'rotate(-180deg)';
                        }
                        if (s === 3) {
                          el.innerHTML = 'T';
                          el.style.color = 'orange';
                        }
                      }
                      d.appendChild(el);
                      taskgrid.appendChild(d);
                    }
                  },
                },
                title: 'Stimuli',
                content:
                  '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                correctResponse: '${this.parameters.target}',
              },
              {
                type: 'lab.html.Screen',
                files: {},
                parameters: {},
                responses: {},
                hooks: {
                  run: initGrid,
                  'before:prepare': initResponses,
                },
                title: 'Feedback',
                content:
                  '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n  .feedback{\n    position: absolute;\n    top: 50px;\n    font-size: 2rem;\n    font-weight: bold;\n    color: #da5b1c;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n  \u003Cdiv id="feedback" class="feedback"\u003E\n    Feedback\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n\n',
                timeout: '2000',
                tardy: true,
                skip: "${ parameters.phase === 'main' }",
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
          hooks: {},
          title: 'End',
          content: endScreen(),
        },
      ],
    },
  ],
};
