/* eslint-disable no-template-curly-in-string */
import * as lab from 'lab.js';

import {
  initSearchTrials,
  initPracticeTrials,
  initGrid,
  initResponses,
} from './utils';

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
      messageHandlers: {},
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
          messageHandlers: {},
          title: 'Instruction',
          content:
            '\u003Cstyle\u003E\n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cheader\u003E\n  \u003Ch1\u003EVisual search task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \n  \u003Cp\u003E\n    ${this.parameters.intro}\n  \u003C\u002Fp\u003E\n  \n   \u003Cp\u003E\n     Again, all you need to do is to find an \u003Cb\u003Eorange T\u003C\u002Fb\u003E. If you see the \u003Cb\u003Eorange T\u003C\u002Fb\u003E, press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E. Ignore the upside-down orange T, as well as blue Ts! IF THERE IS NO ORANGE T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E.\n      It is very important to respond \u003Cb\u003EAS FAST AS YOU CAN\u003C\u002Fb\u003E.\n    \u003C\u002Fp\u003E\n\n    \u003Cdiv style="display:grid; grid-template-columns:1fr 1fr;"\u003E\n      \u003Cdiv\u003E\n      \u003Cp\u003E\n        Find \n      \u003C\u002Fp\u003E\n      \u003Cbr\u003E\n      \u003Cdiv class="letter" style="color:orange; height: 100px;"\u003E\n        T\n      \u003C\u002Fdiv\u003E\n    \u003C\u002Fdiv\u003E\n    \u003Cdiv\u003E\n      \u003Cp\u003E\n        But do not respond to any of these distractors:\n      \u003C\u002Fp\u003E\n      \u003Cbr\u003E\n      \u003Cdiv style="display:grid; grid-template-columns: 100px 50px; justify-content: center; "\u003E\n        \u003Cdiv class="letter" style="color:lightblue;"\u003E\n          T\n        \u003C\u002Fdiv\u003E\n        \u003Cdiv class="letter" style="color:orange; transform: rotate(-180deg);"\u003E\n          T\n        \u003C\u002Fdiv\u003E\n      \u003C\u002Fdiv\u003E\n      \u003C\u002Fdiv\u003E\n  \u003C\u002Fdiv\u003E\n\n  \u003Cp\u003E\n    Press the space bar on your keyboard to start doing the practice trials.\n    If you want to skip the practice trials and go directly to the task, press the "q" button on your keyboard.\n  \u003C\u002Fp\u003E\n\u003C\u002Fmain\u003E',
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
          messageHandlers: {
            'before:prepare': initPracticeTrials,
          },
          title: 'Practice task',
          tardy: true,
          skip: "${ state.response === 'skipPractice' }",
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
                type: 'lab.canvas.Frame',
                context:
                  '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                contextSelector: 'canvas',
                files: {},
                parameters: {},
                responses: {},
                messageHandlers: {},
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
                  messageHandlers: {
                    run: function anonymous(this: lab.flow.Loop) {
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
                messageHandlers: {
                  run: function anonymous(this: lab.core.Component) {
                    const taskgrid = document.querySelector('#taskgrid');
                    const stimuli = this.parameters.stimuli;

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
                messageHandlers: {
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
          messageHandlers: {},
          title: 'Main task instruction',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E\n',
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
          messageHandlers: {
            'before:prepare': initSearchTrials,
          },
          title: 'Main task',
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
                type: 'lab.canvas.Frame',
                context:
                  '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
                contextSelector: 'canvas',
                files: {},
                parameters: {},
                responses: {},
                messageHandlers: {},
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
                  messageHandlers: {
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
                messageHandlers: {
                  run: function anonymous(this: lab.html.Screen) {
                    this.parameters.callbackForEEG(
                      parseInt(this.parameters.size, 10) < 13 ? 2 : 1
                    );
                    const taskgrid = document.querySelector('#taskgrid');
                    if (!taskgrid) return;
                    const stimuli = this.parameters.stimuli;

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
                messageHandlers: {
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
          messageHandlers: {},
          title: 'End',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Ch1\u003E\n    Thank you!\n  \u003C\u002Fh1\u003E\n  \u003Ch1\u003E\n    Press the space bar to finish the task.\n  \u003C\u002Fh1\u003E\n\u003C\u002Fmain\u003E\n\n',
        },
      ],
    },
  ],
};
