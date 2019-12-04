// Define study
const studyObject = {
  title: 'root',
  type: 'lab.flow.Sequence',
  parameters: {},
  plugins: [
    {
      type: 'lab.plugins.Metadata'
    },
    {
      type: 'lab.plugins.Download',
      filePrefix: 'visual-search'
    }
  ],
  metadata: {
    title: 'Visual search',
    description:
      'The visual search task is made according to specifications described here\nhttps:\u002F\u002Fwww.psytoolkit.org\u002Fexperiment-library\u002Fsearch.html',
    repository: '',
    contributors: 'Yury Shevchenko \u003Cyury.shevchenko@uni-konstanz.de\u003E'
  },
  files: {},
  responses: {},
  content: [
    {
      type: 'lab.html.Screen',
      files: {},
      parameters: {},
      responses: {
        'keypress(Space)': 'next',
        'keypress(q)': 'skipPractice'
      },
      messageHandlers: {},
      title: 'Instruction',
      content:
        '\u003Cstyle\u003E\n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cheader\u003E\n  \u003Ch1\u003EVisual search task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n \u003Cp\u003E\n   You know how difficult it is to find your keys in a messy room! We want to know how good you are in quickly finding your keys! \u003Cb\u003EInstead\u003C\u002Fb\u003E of keys, we just want to know how quickly you can find an \u003Cb\u003Eorange T\u003C\u002Fb\u003E amongst blue Ts and upside-down orange Ts. Sounds easy! But it is not at all that easy!\n \u003C\u002Fp\u003E\n \u003Cp\u003E\n   Again, all you need to do is to find an \u003Cb\u003Eorange T\u003C\u002Fb\u003E. If you see the \u003Cb\u003Eorange T\u003C\u002Fb\u003E, press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E. Ignore the upside-down orange T, as well as blue Ts! IF THERE IS NO ORANGE T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E.\n \u003C\u002Fp\u003E\n \u003Cp\u003E\n   It is very important to respond \u003Cb\u003EAS FAST AS YOU CAN\u003C\u002Fb\u003E. \n \u003C\u002Fp\u003E \n  \u003Cbr\u003E\n  \u003Cp\u003E\n    Find \n  \u003C\u002Fp\u003E\n  \u003Cbr\u003E\n  \u003Cdiv class="letter" style="color:orange"\u003E\n    T\n  \u003C\u002Fdiv\u003E\n  \u003Cbr\u003E\u003Cbr\u003E\u003Cbr\u003E\n  \u003Cp\u003E\n    But do not respond to any of these distractors:\n  \u003C\u002Fp\u003E\n  \u003Cbr\u003E\n  \n  \u003Cdiv style="display:grid; grid-template-columns: 100px 100px; justify-content: center"\u003E\n    \u003Cdiv class="letter" style="color:lightblue"\u003E\n      T\n    \u003C\u002Fdiv\u003E\n    \u003Cdiv class="letter" style="color:orange; transform: rotate(-180deg)"\u003E\n      T\n    \u003C\u002Fdiv\u003E\n  \u003C\u002Fdiv\u003E\n  \n  \u003Cbr\u003E\u003Cbr\u003E\u003Cbr\u003E\u003Cbr\u003E\n\n  \u003Cp\u003E\n    Press the the space bar on your keyboard to start doing the practice trials.\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    If you want to skip the practice trials and go directly to the task, press the "q" button on your keyboard.\n  \u003C\u002Fp\u003E\n\u003C\u002Fmain\u003E'
    },
    {
      type: 'lab.flow.Loop',
      files: {},
      parameters: {},
      templateParameters: [],
      sample: {
        mode: 'draw-shuffle'
      },
      responses: {},
      messageHandlers: {
        'before:prepare': function anonymous() {
          let practiceTrialParameters = [];

          function shuffle(a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
              j = Math.floor(Math.random() * (i + 1));
              x = a[i];
              a[i] = a[j];
              a[j] = x;
            }
            return a;
          }

          const randomBetween = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          };

          const makeStimuliArray = (arrLen, stLen, isTarget) => {
            let arr = Array(arrLen).fill(0);
            let shuffled = shuffle([...Array(arrLen).keys()]).slice(0, stLen);
            for (let p of shuffled) {
              if (randomBetween(0, 1) === 0) {
                arr[p] = 1;
              } else {
                arr[p] = 2;
              }
            }
            if (isTarget === 'yes') {
              arr[shuffled[0]] = 3;
            }
            return arr;
          };

          const arrLength = 25;
          function trialConstructor(i, stimLength, isTarget) {
            return {
              trialId: i,
              stimuli: makeStimuliArray(arrLength, stimLength, isTarget),
              target: isTarget,
              size: stimLength,
              phase: 'practice'
            };
          }

          const numberTrials = 1;
          for (let i = 1; i <= numberTrials; i++) {
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 5, 'yes')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 5, 'no')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 10, 'yes')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 10, 'no')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 15, 'yes')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 15, 'no')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 20, 'yes')
            );
            practiceTrialParameters = practiceTrialParameters.concat(
              trialConstructor(i, 20, 'no')
            );
          }

          //assign options values to parameters of this task
          this.options.templateParameters = practiceTrialParameters;
          console.log(practiceTrialParameters);
          this.options.shuffle = true; // already shuffled before
        }
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
                  styles: {}
                }
              ],
              files: {},
              parameters: {},
              responses: {},
              messageHandlers: {
                run: function anonymous() {
                  this.data.response = 'noresponse';
                  this.data.correct = false;
                }
              },
              viewport: [800, 600],
              title: 'Fixation cross',
              timeout: '500'
            }
          },
          {
            type: 'lab.html.Screen',
            files: {},
            parameters: {},
            responses: {
              'keypress(b)': 'yes',
              'keypress(n)': 'no'
            },
            messageHandlers: {
              run: function anonymous() {
                const taskgrid = document.querySelector('#taskgrid');
                const stimuli = this.parameters.stimuli;

                for (let s of stimuli) {
                  let d = document.createElement('div');
                  d.classList.add('box');
                  let el = document.createElement('span');
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
              }
            },
            title: 'Stimuli',
            content:
              '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
            correctResponse: '${this.parameters.target}'
          },
          {
            type: 'lab.html.Screen',
            files: {},
            parameters: {},
            responses: {},
            messageHandlers: {
              run: function anonymous() {
                const taskgrid = document.querySelector('#taskgrid');
                const stimuli = this.parameters.stimuli;

                for (let s of stimuli) {
                  let d = document.createElement('div');
                  d.classList.add('box');
                  let el = document.createElement('span');
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
                      d.id = 'target';
                    }
                  }
                  d.appendChild(el);
                  taskgrid.appendChild(d);
                }

                if (this.state.response === 'noresponse') {
                  document.querySelector('#feedback').innerHTML =
                    'Please respond!';
                  return;
                }

                if (this.state.correct) {
                  document.querySelector('#feedback').innerHTML = 'Well done!';
                  document.querySelector('#feedback').style.color = 'green';
                } else {
                  if (this.parameters.target === 'yes') {
                    document.querySelector('#feedback').innerHTML =
                      'Error! There was one!';
                    document.querySelector('#target').style.border = 'solid';
                  } else {
                    document.querySelector('#feedback').innerHTML =
                      'Error! There was none!';
                  }
                }
              },
              'before:prepare': function anonymous() {
                this.data.trial_number =
                  1 +
                  parseInt(
                    this.options.id.split('_')[
                      this.options.id.split('_').length - 2
                    ]
                  );

                this.data.condition = this.parameters.size + ' letters';

                this.data.reaction_time = this.state.duration;
                //this.data.target = this.parameters.target;

                if (this.state.response === this.parameters.target) {
                  this.data.correct_response = true;
                } else {
                  this.data.correct_response = false;
                }

                this.data.response_given =
                  this.parameters.phase === 'practice' ||
                  this.state.response === 'noresponse'
                    ? 'no'
                    : 'yes';
              }
            },
            title: 'Feedback',
            content:
              '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n  .feedback{\n    position: absolute;\n    top: 50px;\n    font-size: 2rem;\n    font-weight: bold;\n    color: #da5b1c;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n  \u003Cdiv id="feedback" class="feedback"\u003E\n    Feedback\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n\n',
            timeout: '2000',
            tardy: true,
            skip: "${ parameters.phase === 'main' }"
          }
        ]
      }
    },
    {
      type: 'lab.html.Screen',
      files: {},
      parameters: {},
      responses: {
        'keypress(Space)': 'continue'
      },
      messageHandlers: {},
      title: 'Main task instruction',
      content:
        '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E\n'
    },
    {
      type: 'lab.flow.Loop',
      files: {},
      parameters: {},
      templateParameters: [],
      sample: {
        mode: 'draw-shuffle'
      },
      responses: {},
      messageHandlers: {
        'before:prepare': function anonymous() {
          let trialParameters = [];

          function shuffle(a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
              j = Math.floor(Math.random() * (i + 1));
              x = a[i];
              a[i] = a[j];
              a[j] = x;
            }
            return a;
          }

          const randomBetween = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          };

          const makeStimuliArray = (arrLen, stLen, isTarget) => {
            let arr = Array(arrLen).fill(0);
            let shuffled = shuffle([...Array(arrLen).keys()]).slice(0, stLen);
            for (let p of shuffled) {
              if (randomBetween(0, 1) === 0) {
                arr[p] = 1;
              } else {
                arr[p] = 2;
              }
            }
            if (isTarget === 'yes') {
              arr[shuffled[0]] = 3;
            }
            return arr;
          };

          const arrLength = 25;
          function trialConstructor(i, stimLength, isTarget) {
            return {
              trialId: i,
              stimuli: makeStimuliArray(arrLength, stimLength, isTarget),
              target: isTarget,
              size: stimLength,
              phase: 'main'
            };
          }

          const numberTrials = 10;
          for (let i = 1; i <= numberTrials; i++) {
            trialParameters = trialParameters.concat(
              trialConstructor(i, 5, 'yes')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 5, 'no')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 10, 'yes')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 10, 'no')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 15, 'yes')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 15, 'no')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 20, 'yes')
            );
            trialParameters = trialParameters.concat(
              trialConstructor(i, 20, 'no')
            );
          }

          //assign options values to parameters of this task
          this.options.templateParameters = trialParameters;
          console.log(trialParameters);
          this.options.shuffle = true; // already shuffled before
        }
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
                  styles: {}
                }
              ],
              files: {},
              parameters: {},
              responses: {},
              messageHandlers: {
                run: function anonymous() {
                  this.data.response = 'noresponse';
                  this.data.correct = false;
                }
              },
              viewport: [800, 600],
              title: 'Fixation cross',
              timeout: '500'
            }
          },
          {
            type: 'lab.html.Screen',
            files: {},
            parameters: {},
            responses: {
              'keypress(b)': 'yes',
              'keypress(n)': 'no'
            },
            messageHandlers: {
              run: function anonymous() {
                const taskgrid = document.querySelector('#taskgrid');
                const stimuli = this.parameters.stimuli;

                for (let s of stimuli) {
                  let d = document.createElement('div');
                  d.classList.add('box');
                  let el = document.createElement('span');
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
              }
            },
            title: 'Stimuli',
            content:
              '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
            correctResponse: '${this.parameters.target}'
          },
          {
            type: 'lab.html.Screen',
            files: {},
            parameters: {},
            responses: {},
            messageHandlers: {
              run: function anonymous() {
                const taskgrid = document.querySelector('#taskgrid');
                const stimuli = this.parameters.stimuli;

                for (let s of stimuli) {
                  let d = document.createElement('div');
                  d.classList.add('box');
                  let el = document.createElement('span');
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
                      d.id = 'target';
                    }
                  }
                  d.appendChild(el);
                  taskgrid.appendChild(d);
                }

                if (this.state.response === 'noresponse') {
                  document.querySelector('#feedback').innerHTML =
                    'Please respond!';
                  return;
                }

                if (this.state.correct) {
                  document.querySelector('#feedback').innerHTML = 'Well done!';
                  document.querySelector('#feedback').style.color = 'green';
                } else {
                  if (this.parameters.target === 'yes') {
                    document.querySelector('#feedback').innerHTML =
                      'Error! There was one!';
                    document.querySelector('#target').style.border = 'solid';
                  } else {
                    document.querySelector('#feedback').innerHTML =
                      'Error! There was none!';
                  }
                }
              },
              'before:prepare': function anonymous() {
                this.data.trial_number =
                  1 +
                  parseInt(
                    this.options.id.split('_')[
                      this.options.id.split('_').length - 2
                    ]
                  );

                this.data.condition = this.parameters.size + ' letters';

                this.data.reaction_time = this.state.duration;
                //this.data.target = this.parameters.target;

                if (this.state.response === this.parameters.target) {
                  this.data.correct_response = true;
                } else {
                  this.data.correct_response = false;
                }

                this.data.response_given =
                  this.parameters.phase === 'practice' ||
                  this.state.response === 'noresponse'
                    ? 'no'
                    : 'yes';
              }
            },
            title: 'Feedback',
            content:
              '\u003Cstyle\u003E\n  #taskgrid{\n    display: grid;\n    grid-template-columns: repeat(5, 100px);\n    grid-template-rows: repeat(5, 100px);\n    grid-row-gap: 10px;\n    grid-column-gap: 10px;\n  }\n  .box{\n    display: grid;\n    align-items: center;\n  } \n  .letter{\n    font-size: 90px;\n    font-weight: bold;\n  }\n  .feedback{\n    position: absolute;\n    top: 50px;\n    font-size: 2rem;\n    font-weight: bold;\n    color: #da5b1c;\n  }\n\u003C\u002Fstyle\u003E\n\n\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n\n  \u003Cdiv id="taskgrid"\u003E\n\n\n  \u003C\u002Fdiv\u003E\n\n  \u003Cdiv id="feedback" class="feedback"\u003E\n    Feedback\n  \u003C\u002Fdiv\u003E\n\n\u003C\u002Fmain\u003E\n\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E if you see the orange T, press \u003Ckbd\u003En\u003C\u002Fkbd\u003E if there is no orange T.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n\n',
            timeout: '2000',
            tardy: true,
            skip: "${ parameters.phase === 'main' }"
          }
        ]
      }
    },
    {
      type: 'lab.html.Screen',
      files: {},
      parameters: {},
      responses: {
        'keypress(Space)': 'end'
      },
      messageHandlers: {},
      title: 'End',
      content:
        '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Ch1\u003E\n    Thank you!\n  \u003C\u002Fh1\u003E\n  \u003Ch1\u003E\n    Press the space bar to finish the task.\n  \u003C\u002Fh1\u003E\n\u003C\u002Fmain\u003E\n\n'
    }
  ]
};
// export
export default studyObject;
