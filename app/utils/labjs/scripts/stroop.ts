// Define study
const studyObject = {
  messageHandlers: {},
  title: 'root',
  type: 'lab.flow.Sequence',
  plugins: [],
  metadata: {},
  parameters: {},
  files: {},
  responses: {},
  content: [
    {
      type: 'lab.flow.Sequence',
      files: {},
      parameters: {},
      responses: {},
      messageHandlers: {},
      title: 'Stroop task',
      content: [
        {
          messageHandlers: {},
          type: 'lab.html.Screen',
          responses: {
            'keypress(Space)': 'continue',
            'keypress(q)': 'skipPractice'
          },
          title: 'Instruction',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EStroop Task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Cp\u003E\n    Welcome to the \u003Cstrong\u003EStroop experiment\u003C\u002Fstrong\u003E!\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    ${this.parameters.intro}\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    To indicate the color of the word, please use the keys \u003Cstrong\u003Er\u003C\u002Fstrong\u003E, \u003Cstrong\u003Eg\u003C\u002Fstrong\u003E, \u003Cstrong\u003Eb\u003C\u002Fstrong\u003E and \u003Cstrong\u003Ey\u003C\u002Fstrong\u003E for \u003Cspan style="color: red;"\u003Ered\u003C\u002Fspan\u003E, \u003Cspan style="color: green;"\u003Egreen\u003C\u002Fspan\u003E, \u003Cspan style="color: blue;"\u003Eblue\u003C\u002Fspan\u003E and \u003Cspan style="color: #c5ad0b;"\u003Eyellow\u003C\u002Fspan\u003E, respectively.\n      \u003Cbr\u003E\n      Please answer quickly, and as accurately as you can.\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    Press the the space bar on your keyboard to start doing the practice trials.\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    If you want to skip the practice trials and go directly to the task, press the "q" button on your keyboard.\n  \u003C\u002Fp\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E\n\n\n',
          parameters: {},
          files: {}
        },
        {
          type: 'lab.canvas.Frame',
          context:
            '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    What\'s the \u003Cem\u003Ecolor\u003C\u002Fem\u003E of \n    the word shown above? \u003Cbr\u003E\n    Please press \u003Ckbd\u003Er\u003C\u002Fkbd\u003E for red,\n    \u003Ckbd\u003Eg\u003C\u002Fkbd\u003E for green,\n    \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E for blue and \u003Ckbd\u003Ey\u003C\u002Fkbd\u003E for yellow.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n',
          contextSelector: 'canvas',
          files: {},
          parameters: {},
          responses: {},
          messageHandlers: {},
          title: 'Practice frame',
          tardy: true,
          skip: "${ state.response === 'skipPractice' }",
          content: {
            messageHandlers: {},
            type: 'lab.flow.Loop',
            responses: {},
            templateParameters: [
              {
                color: 'red',
                word: 'red',
                phase: 'practice'
              },
              {
                color: 'green',
                word: 'green',
                phase: 'practice'
              },
              {
                color: 'blue',
                word: 'blue',
                phase: 'practice'
              },
              {
                color: '#ffe32a',
                word: 'yellow',
                phase: 'practice'
              },
              {
                color: 'red',
                word: 'green',
                phase: 'practice'
              },
              {
                color: 'green',
                word: 'blue',
                phase: 'practice'
              },
              {
                color: 'blue',
                word: 'yellow',
                phase: 'practice'
              },
              {
                color: '#ffe32a',
                word: 'red',
                phase: 'practice'
              }
            ],
            title: 'Practice task',
            parameters: {},
            files: {},
            sample: {
              mode: 'draw-shuffle'
            },
            shuffleGroups: [],
            template: {
              messageHandlers: {},
              type: 'lab.flow.Sequence',
              responses: {},
              title: 'Trial',
              parameters: {},
              files: {},
              content: [
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.4.4',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 18.69,
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
                      fontSize: '72',
                      fontWeight: 'normal',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '5',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    run: function anonymous() {
                      this.data.correct = 'empty';
                    }
                  },
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${this.parameters.iti}'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.4.4',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 331.08,
                      height: 36.16,
                      fill: '${ this.parameters.color }',
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
                      text: '${ this.parameters.word }',
                      fontSize: '72',
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '6',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {
                    'keydown(r)': 'red',
                    'keydown(g)': 'green',
                    'keydown(b)': 'blue',
                    'keydown(y)': '#ffe32a'
                  },
                  messageHandlers: {},
                  viewport: [800, 600],
                  title: 'Stroop screen',
                  correctResponse: '${ this.parameters.color }'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: "${ parameters.phase == 'practice' ? 0 : 1000 }",
                      width: 1246.91,
                      height: 58.76,
                      fill: "${ state.correct ? 'green' : 'red' }",
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
                      text:
                        "${ state.correct ? 'Well done!' : 'Please respond accurately' }",
                      fontSize: '52',
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '24',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    'before:prepare': function anonymous() {
                      this.data.trial_number =
                        1 +
                        parseInt(
                          this.options.id.split('_')[
                            this.options.id.split('_').length - 2
                          ]
                        );

                      this.data.condition =
                        this.parameters.congruent === 'yes'
                          ? 'Match'
                          : 'Mismatch';

                      this.data.reaction_time = this.state.duration;

                      if (this.state.response === this.parameters.color) {
                        this.data.correct_response = true;
                      } else {
                        this.data.correct_response = false;
                      }

                      this.data.response_given =
                        this.state.correct === 'empty' ? 'no' : 'yes';
                    }
                  },
                  viewport: [800, 600],
                  title: 'Inter-trial interval',
                  timeout: "${ parameters.phase == 'practice' ? 1000 : 500 }",
                  tardy: true
                }
              ]
            }
          }
        },
        {
          messageHandlers: {},
          type: 'lab.html.Screen',
          responses: {
            'keypress(Space)': 'continue'
          },
          title: 'Main task',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E\n\n\n',
          parameters: {},
          files: {}
        },
        {
          type: 'lab.canvas.Frame',
          context:
            '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    What\'s the \u003Cem\u003Ecolor\u003C\u002Fem\u003E of \n    the word shown above? \u003Cbr\u003E\n    Please press \u003Ckbd\u003Er\u003C\u002Fkbd\u003E for red,\n    \u003Ckbd\u003Eg\u003C\u002Fkbd\u003E for green,\n    \u003Ckbd\u003Eb\u003C\u002Fkbd\u003E for blue and \u003Ckbd\u003Ey\u003C\u002Fkbd\u003E for yellow.\n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E\n',
          contextSelector: 'canvas',
          files: {},
          parameters: {},
          responses: {},
          messageHandlers: {},
          title: 'Task frame',
          content: {
            messageHandlers: {},
            type: 'lab.flow.Loop',
            responses: {},
            templateParameters: [
              {
                color: 'red',
                word: 'red',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'red',
                word: 'red',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'red',
                word: 'red',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'red',
                word: 'green',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'red',
                word: 'blue',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'red',
                word: 'yellow',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'green',
                word: 'red',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'green',
                word: 'green',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'green',
                word: 'green',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'green',
                word: 'green',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'green',
                word: 'blue',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'green',
                word: 'yellow',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'blue',
                word: 'red',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'blue',
                word: 'green',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: 'blue',
                word: 'blue',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'blue',
                word: 'blue',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'blue',
                word: 'blue',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: 'blue',
                word: 'yellow',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: '#ffe32a',
                word: 'red',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: '#ffe32a',
                word: 'green',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: '#ffe32a',
                word: 'blue',
                phase: 'task',
                congruent: 'no'
              },
              {
                color: '#ffe32a',
                word: 'yellow',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: '#ffe32a',
                word: 'yellow',
                phase: 'task',
                congruent: 'yes'
              },
              {
                color: '#ffe32a',
                word: 'yellow',
                phase: 'task',
                congruent: 'yes'
              }
            ],
            title: 'Stroop task',
            parameters: {},
            files: {},
            sample: {
              mode: 'draw-shuffle',
              n: '96'
            },
            shuffleGroups: [],
            template: {
              messageHandlers: {},
              type: 'lab.flow.Sequence',
              responses: {},
              title: 'Trial',
              parameters: {},
              files: {},
              content: [
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.4.4',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 18.69,
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
                      fontSize: '72',
                      fontWeight: 'normal',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '5',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    run: function anonymous() {
                      this.data.correct = 'empty';
                    }
                  },
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${this.parameters.iti}'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.4.4',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 331.08,
                      height: 36.16,
                      fill: '${ this.parameters.color }',
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
                      text: '${ this.parameters.word }',
                      fontSize: '72',
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '6',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {
                    'keydown(r)': 'red',
                    'keydown(g)': 'green',
                    'keydown(b)': 'blue',
                    'keydown(y)': '#ffe32a'
                  },
                  messageHandlers: {
                    run: function anonymous() {
                      this.parameters.callbackForEEG(
                        this.parameters.congruent === 'yes' ? 1 : 2
                      );
                    }
                  },
                  viewport: [800, 600],
                  title: 'Stroop screen',
                  correctResponse: '${ this.parameters.color }'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'i-text',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: "${ parameters.phase == 'practice' ? 0 : 1000 }",
                      width: 1246.91,
                      height: 58.76,
                      fill: "${ state.correct ? 'green' : 'red' }",
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
                      text:
                        "${ state.correct ? 'Well done!' : 'Please respond accurately' }",
                      fontSize: '52',
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      fontStyle: 'normal',
                      lineHeight: 1.16,
                      underline: false,
                      overline: false,
                      linethrough: false,
                      textAlign: 'center',
                      textBackgroundColor: '',
                      charSpacing: 0,
                      id: '24',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    'before:prepare': function anonymous() {
                      this.data.trial_number =
                        1 +
                        parseInt(
                          this.options.id.split('_')[
                            this.options.id.split('_').length - 2
                          ]
                        );

                      this.data.condition =
                        this.parameters.congruent === 'yes'
                          ? 'Match'
                          : 'Mismatch';

                      this.data.reaction_time = this.state.duration;

                      if (this.state.response === this.parameters.color) {
                        this.data.correct_response = true;
                      } else {
                        this.data.correct_response = false;
                      }

                      this.data.response_given =
                        this.state.correct === 'empty' ? 'no' : 'yes';
                    }
                  },
                  viewport: [800, 600],
                  title: 'Inter-trial interval',
                  timeout: "${ parameters.phase == 'practice' ? 1000 : 500 }",
                  tardy: true
                }
              ]
            }
          }
        },
        {
          messageHandlers: {},
          type: 'lab.html.Screen',
          responses: {
            'keypress(Space)': 'end'
          },
          title: 'Thanks',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Ch1\u003E\n    Thank you!\n  \u003C\u002Fh1\u003E\n  \u003Ch1\u003E\n    Press the space bar to finish the task.\n  \u003C\u002Fh1\u003E\n\u003C\u002Fmain\u003E\n\n',
          parameters: {},
          files: {}
        }
      ]
    }
  ]
};

// export
export default studyObject;
