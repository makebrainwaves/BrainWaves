import * as path from 'path';
const rootFolder = __dirname;
const assetsDirectory = path.join(rootFolder, 'assets', 'labjs', 'faceshouses');

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
      filePrefix: 'the-face-house-task'
    }
  ],
  metadata: {
    title: 'The face-house task',
    description:
      "Faces contain a lot of information that is relevant to our survival. It's important to be able to quickly recognize people you can trust and read emotions in both strangers and people you know. ",
    repository: '',
    contributors: 'Yury Shevchenko \u003Cyury.shevchenko@uni-konstanz.de\u003E'
  },
  files: {},
  responses: {},
  content: [
    {
      type: 'lab.flow.Sequence',
      files: {
        'Annie_3.jpg': `${assetsDirectory}/7a536fba60226293bf351cb6f9719fee15f3b693915c0a55b0f107377f10a7e1.jpg`,
        'Blake_3.jpg': `${assetsDirectory}/3138f2fd1cba5a07f0b0ac61f8ee4754e6e0f07bd3ea520a75bc39c2d05ecece.jpg`,
        'Don_3.jpg': `${assetsDirectory}/cc6bf44e75c27e0d57956ae95d4c2c64f0d41f666a1e3f9fff20927fe3844dfd.jpg`,
        'Estelle_3.jpg': `${assetsDirectory}/5ce843ee780ba0c902ee1b06326c7e65fe840769c8621a8d9f8b75b5eb67bcd9.jpg`,
        'Frank_3.jpg': `${assetsDirectory}/856ae9bd5ec82567011ae41e10dcfa2de9cfa7ddadc5c1388df2998142ab4d7f.jpg`,
        'Janie_3.jpg': `${assetsDirectory}/a82a652abb85637af9fba1f4dbf7f69d906a14172a70df610e3be33c0058b9f6.jpg`,
        'Joan_3.jpg': `${assetsDirectory}/d92c1965ad53b7533d5f00ace843e8f1c161ae7e72ad52b4511f3ab84a8eea73.jpg`,
        'Jodi_3.jpg': `${assetsDirectory}/b746cdfd1099dfbe200a661a81ef2315935a5eafc855b8b373d9b633fadd8e6c.jpg`,
        'Joe_3.jpg': `${assetsDirectory}/3e55b3ce099ffea5a4ebde02c7a0cb055fb6f9768116efc932e77e4319841bea.jpg`,
        'Tim_3.jpg': `${assetsDirectory}/56136f19fc574a3a99761c9a7ce1fcc5149d6edcc60e942cc8e5db2f66e0db91.jpg`,
        'Tom_3.jpg': `${assetsDirectory}/b87301f741db5d27e05e8d127ae729af9bb7e2e38484c8f29b52e442c333989d.jpg`,
        'Wallace_3.jpg': `${assetsDirectory}/5ba782ee30b8213b554d61adb62091b63c509a539bdd693ed27c1cbc3db40272.jpg`,
        'house1.3.jpg': `${assetsDirectory}/9f0121c6a70040d4abbcd41daf909797cef7438f406fc471c0def07f477f920e.jpg`,
        'house2.2.jpg': `${assetsDirectory}/461aa813adbb5117b26b791c02864b2e88e6c2899c821f14d58b042c26628b92.jpg`,
        'house3.1.jpg': `${assetsDirectory}/269317cfd165abfdbc48e400a6cfc89c2cfcd98a9c738ece5222e8d513bcf83a.jpg`,
        'house4.3.jpg': `${assetsDirectory}/a87186061326f3e11259a95ba1229cfc3f1a4f4b06fb50c16ad3757105a2b69c.jpg`,
        'house5.2.jpg': `${assetsDirectory}/f78f496ab685b1ae4661c6071358f1a6ab0e1238a0ed1bd157a32317c41a8eaf.jpg`,
        'house6.3.jpg': `${assetsDirectory}/b589ac23b4918605f777f45ad32149fa7327fccdd452d4037451c8c28e19c7c0.jpg`,
        'house7.1.jpg': `${assetsDirectory}/f528aa7c5e2618c4e8b7ae1e1eced370788e698a339b60be085b46c0044b58e3.jpg`,
        'house8.4.jpg': `${assetsDirectory}/28f97e1e523564c8fa7942675ea1609265532de0c715e1b4058cf8ceb4220f9b.jpg`,
        'house9.2.jpg': `${assetsDirectory}/6720b60aa89355682657837dca11fc69d684e77cca2cd26029115ac49e940efe.jpg`,
        'house10.4.jpg': `${assetsDirectory}/c424a87e1b2220efb59423664e7293de2ed37e60d463bfe3261d8b967183740f.jpg`,
        'house11.2.jpg': `${assetsDirectory}/19a8664bab5a3c491510b7f3485d5498c41b680c4695c317be659b4d8e092358.jpg`,
        'house12.1.jpg': `${assetsDirectory}/38178a7ec6cc54ed9e61b5fec7790dc85d2debe2dad0b3e960686db660d9428c.jpg`,
        'AF0302_1110_00F.jpg': `${assetsDirectory}/70a3f9e412de0797fa723d86ac31bbd4d75746aff3b15bf53bb018fabb33fd9d.jpg`,
        'AF0315_1100_00F.jpg': `${assetsDirectory}/1e88f7847b3969fd2b73a7b49d38b4852504c565f173dee03ee13369c613a668.jpg`,
        'AF0321_2200_00F.jpg': `${assetsDirectory}/aae1fbd345962daf79d4a6b767b975fd30274c54b5e7309b1e37ca350df93879.jpg`,
        'AM0313_1100_00F.jpg': `${assetsDirectory}/488ccf69ae44248357b2b6c8c2a8f6d4179774b61ec88a6df7e8534c95b469c9.jpg`,
        'AM0314_1100_00F.jpg': `${assetsDirectory}/bbb27ec39d1cba3fd1f2a4f540e570b3558cb8fd4cbbf321ae87d4842a9f4998.jpg`,
        'AM0315_1100_00F.jpg': `${assetsDirectory}/b1f41a2da113c1ba97b45eef80f4eef0408d54b6e59fa1245daf143e17fff480.jpg`,
        'AM0318_1100_00F.jpg': `${assetsDirectory}/7c5ac52e4b25464801c1412a3778dc8ebb5e6babe7cc3ef797caab9cae27c197.jpg`,
        'AM0319_1100_00F.jpg': `${assetsDirectory}/ea660b6c9f3ec624e236b1618322c47a55647d581953e0cc170897001e23a226.jpg`,
        'BF0605_1110_00F.jpg': `${assetsDirectory}/03b688a2807aaa6343710173543419029db8e51715004efeb61bd5eb035c0446.jpg`,
        'BF0607_1100_00F.jpg': `${assetsDirectory}/c7f17415c7cfe36c1490bb08612d670e45842f6188deb13e60025d0f9bf7ceb6.jpg`,
        'BF0608_1100_00F.jpg': `${assetsDirectory}/31ef42758af1d135fc1d2686d506acb91eac475a207b608dc4f938f400a8e4d4.jpg`,
        'BF0624_1100_00F.jpg': `${assetsDirectory}/94d291d64fabe19805a372bbc0f8fbff2ce0cbe97185aa8e163dd6a7bff46524.jpg`,
        'BM0606_1100_00F.jpg': `${assetsDirectory}/2677434b03b871c2139762dce2eb843ec1dc1b75e42fea432adfd1888006ad0e.jpg`,
        'BM0608_1100_00F.jpg': `${assetsDirectory}/1dd9c91d7bb26a3a51558c1a940327731801bfa977c27334ba97b442a2ee362d.jpg`,
        'BM0617_1100_00F.jpg': `${assetsDirectory}/acbb530c69d58f601f66ca34777bf496ab468a86a50f76e5c2c11773e4272f62.jpg`,
        'CF0015_1110_00F.jpg': `${assetsDirectory}/5f0d58fd0cd3b2ff39910cf46fc7e55d945b32fb8a278ac22edbec14ef58163c.jpg`,
        'CF0042_1100_00F.jpg': `${assetsDirectory}/bd9a46351771da8ef21695b866c7c9a62a64f4dcadba5c0572d181561fdc1d38.jpg`,
        'CF0043_1100_00F.jpg': `${assetsDirectory}/1a36367a6a23993bf08c7f8caad7e210549dd8e1a87e6b9912b7629ad5017acc.jpg`,
        'CF0046_1100_00F.jpg': `${assetsDirectory}/009e2538252f1302569399283a2878f1d86ed02d89c39bb0b26cc5910a582079.jpg`,
        'CF0055_1100_00F.jpg': `${assetsDirectory}/974820af1bd5429c6c43ea754dab319bf3a8dfa542e9a811ecf1eb03734603c8.jpg`,
        'CF0056_1110_00F.jpg': `${assetsDirectory}/748f2a112c4fa53bebac4bfe78c34f37c6a31db224771c859a9e51e0a63a4937.jpg`,
        'CF0056_3320_00F.jpg': `${assetsDirectory}/32060851f844f9058a1a2776ed95560d1bd3335d337e1dfe447602a1d6fef6ab.jpg`,
        'CF0058_1100_00F.jpg': `${assetsDirectory}/e91446554380ed60688ead5fb7aab4d9b397ceb6bdecf12b9f8743d3b058b784.jpg`,
        'CM0016_1100_00F.jpg': `${assetsDirectory}/b8902affff25f8061dd97bf4d905e7d480586276ed0630a535b176d6e093da00.jpg`,
        'CM0021_1100_00F.jpg': `${assetsDirectory}/d0190be6fcfd09fa786f4e6dff3bcc53974554955e30daa72d48d920f545240d.jpg`,
        'CM0024_3100_00F.jpg': `${assetsDirectory}/c0d18474c1dcc6f9d6caabba236da70c49e9166656f9e5b63f74fffe4e80814d.jpg`,
        'CM0026_1100_00F.jpg': `${assetsDirectory}/63a86c2f2a060c9444ee619c3cc4d39b1799470ee238e857efa6df20a67a644f.jpg`,
        'CM0042_1100_00F.jpg': `${assetsDirectory}/74db8cd385018c3d93975f87c2756cbaab74c9b56655f2b90b5b820894a136f5.jpg`,
        'CM0043_1100_00F.jpg': `${assetsDirectory}/f8763af353d54eeb072057bf17b70f9650f204ad086bd2f9a962c5fa51c6f925.jpg`,
        'CM0046_1100_00F.jpg': `${assetsDirectory}/14a181fe15d24ba56ceab20c61a4c097982e4aa38b443f6dc66c9222e0f03732.jpg`,
        'CM0048_1100_00F.jpg': `${assetsDirectory}/b372d238ccb53efccd09226c9e017076013a827735789ac28edd59e3609ab597.jpg`,
        'CM0051_1100_00F.jpg': `${assetsDirectory}/89f220b5b6b83a9df58b485b3cd76c16dad6dc7d0d817f31299ba243e86ae062.jpg`,
        'HF1202_1100_00F.jpg': `${assetsDirectory}/5ed0de1a6d92d3ca63ce032ad6285b5f227620ae8ef4c4c0c1c669d9d4bd7ca3.jpg`,
        'HF1205_1100_00F.jpg': `${assetsDirectory}/4b5157afe34909cd3588d7c4a06d2071365598ff0495ed2556a1f1cc9218468e.jpg`,
        'HF1206_1100_00F.jpg': `${assetsDirectory}/bd8663a2365e03036c62ff178fb60138b7b60c6e77322d2118454751992af602.jpg`,
        'HF1209_1100_00F.jpg': `${assetsDirectory}/257cf12508011aff84563c9b3e3e0813ed64a903741149e1b4538bf673d89106.jpg`,
        'HF1210_1100_00F.jpg': `${assetsDirectory}/aeca2419dc19debf3046d849e8a06e2b788689c02ad8027ced8a3f2375e2500f.jpg`,
        'HF1211_2200_00F.jpg': `${assetsDirectory}/2cfa14ecfa28acea2bbd2edb311875551c8676af978e468c0b052d54c91b9262.jpg`,
        'HF1213_1100_00F.jpg': `${assetsDirectory}/eb2a37ebd9eaafc2d7ea9a00dc7a6be843e407d4fadb1cfb17ae5cd58a7b3086.jpg`,
        'HF1215_1100_00F.jpg': `${assetsDirectory}/6e2ddbf68d808a85e5dc7fd3406af22bcf38c5923d4ecbb6c1c4db7e8ba2de95.jpg`,
        'HF1216_2220_00F.jpg': `${assetsDirectory}/0df04c58e1531ea697b0708731f901c2a06408209244de8c8ab1859330f90948.jpg`,
        'HM1201_3101_00F.jpg': `${assetsDirectory}/8a86092e8797bb6116e68c6252fd96f1a807dc12bf38128a23b9a13ed6940a56.jpg`,
        'MF0908_1100_00F.jpg': `${assetsDirectory}/099ff3b2e3ec46af119f39fba91e436d8ec2f488ba1084ae1c91ca99d30a86ac.jpg`,
        'MF0909_1100_00F.jpg': `${assetsDirectory}/3b1c8917d8128434d8819bb7c7daeca03afa0fa2d6b268e617385e8bd411f188.jpg`,
        'MF0912_1100_00F.jpg': `${assetsDirectory}/ccbb7f216a8f0dd084895791d5638ac1f76549fac047bd2a1483a7a8aa0d6603.jpg`,
        'MF0915_1100_00F.jpg': `${assetsDirectory}/5b2b2d8213a53028b1715442d717c1bdab9cb8ed317fced7fe5c21c23ff5f292.jpg`,
        'MF0918_1100_00F.jpg': `${assetsDirectory}/cc31283d02899710fc81a2f22876d67193b961644b7e07f562748289330df0f0.jpg`,
        'MF0918_1100_30L.jpg': `${assetsDirectory}/5b697d98b0115ba9a7439108d74087237e2fd70a59266487b053fc07d7365f42.jpg`,
        'MF0918_2200_00F.jpg': `${assetsDirectory}/dbca65a369505941349cbfee2c40b424bef24b16f6ca8da4c885e76da538d439.jpg`,
        'MM0901_1100_00F.jpg': `${assetsDirectory}/3e291ae00783cadfc1b258aa308cec137ee3c6a312dbf0b44a62bd21e19046d0.jpg`,
        'MM0905_1110_00F.jpg': `${assetsDirectory}/8b0eb6baf2e6c016cf6c78424a0c405c093a64ddcbd6293bdaac4ad25cdf6ef1.jpg`
      },
      parameters: {
        fixationCrossDuration: 500,
        imageDuration: 1000
      },
      responses: {},
      messageHandlers: {},
      title: 'The face-house task',
      notes:
        'We can change these parameters to manipulate the duration of two screens: the fixation cross screen and the screen with an image. The duration is measured in milliseconds.\nDefault values\n- fixationCrossDuration - 500 ms\n- imageDuration - 1000 ms',
      content: [
        {
          type: 'lab.html.Screen',
          files: {},
          parameters: {},
          responses: {
            'keypress(Space)': 'continue',
            'keypress(q)': 'skipPractice'
          },
          messageHandlers: {},
          title: 'Instruction',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EThe face-house task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    You will view a series of faces and houses.\n    Press 1 when a face appears and 9 for a house. \n  \u003C\u002Fp\u003E\n\n  \u003Cp\u003E\n    Press the the space bar on your keyboard to start doing the practice trials.\n  \u003C\u002Fp\u003E\n  \u003Cp\u003E\n    If you want to skip the practice trials and go directly to the task, press the "q" button on your keyboard.\n  \u003C\u002Fp\u003E\n  \n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E'
        },
        {
          type: 'lab.canvas.Frame',
          context:
            '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003E1\u003C\u002Fkbd\u003E for a face and \u003Ckbd\u003E9\u003C\u002Fkbd\u003E for a house. \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
          contextSelector: 'canvas',
          files: {},
          parameters: {},
          responses: {},
          messageHandlers: {},
          title: 'Practice frame',
          tardy: true,
          skip: "${ state.response === 'skipPractice' }",
          content: {
            type: 'lab.flow.Loop',
            files: {},
            parameters: {},
            templateParameters: [
              {
                condition: 'Face',
                image: 'Annie_3.jpg',
                correctResponse: '1',
                phase: 'practice'
              },
              {
                condition: 'Face',
                image: 'Joan_3.jpg',
                correctResponse: '1',
                phase: 'practice'
              },
              {
                condition: 'Face',
                image: 'Jodi_3.jpg',
                correctResponse: '1',
                phase: 'practice'
              },
              {
                condition: 'House',
                image: 'house1.3.jpg',
                correctResponse: '9',
                phase: 'practice'
              },
              {
                condition: 'House',
                image: 'house2.2.jpg',
                correctResponse: '9',
                phase: 'practice'
              },
              {
                condition: 'House',
                image: 'house3.1.jpg',
                correctResponse: '9',
                phase: 'practice'
              }
            ],
            sample: {
              mode: 'draw-shuffle',
              n: ''
            },
            responses: {},
            messageHandlers: {},
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
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 10,
                      height: '50',
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
                      rx: 0,
                      ry: 0,
                      id: '99'
                    },
                    {
                      type: 'rect',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 10,
                      height: '50',
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
                      angle: 90,
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
                      rx: 0,
                      ry: 0,
                      id: '100'
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {},
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${parameters.fixationCrossDuration}'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'image',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 400,
                      height: 400,
                      fill: 'black',
                      stroke: null,
                      strokeWidth: 0,
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
                      crossOrigin: '',
                      cropX: 0,
                      cropY: 0,
                      id: '137',
                      src: '${ this.files[this.parameters.image] }',
                      filters: [],
                      naturalWidth: 400,
                      naturalHeight: 400
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    'before:prepare': function anonymous() {
                      // This code registers an event listener for this screen.
                      // We have a timeout for this screen, but we also want to record responses.
                      // On a keydown event, we record the key and the time of response.
                      // We also record whether the response was correct (by comparing the pressed key with the correct response which is defined inside the Experiment loop).
                      // "this" in the code means the lab.js experiment.
                      this.data.trial_number =
                        1 +
                        parseInt(
                          this.options.id.split('_')[
                            this.options.id.split('_').length - 2
                          ]
                        );
                      this.data.response_given = 'no';

                      this.options.events = {
                        keydown: event => {
                          if (['Digit1', 'Digit9'].includes(event.code)) {
                            this.data.reaction_time = this.timer;
                            if (this.parameters.phase === 'task')
                              this.data.response_given = 'yes';
                            this.data.response = event.key;
                            if (
                              this.data.response ==
                              this.parameters.correctResponse
                            ) {
                              this.data.correct_response = true;
                            } else {
                              this.data.correct_response = false;
                            }
                            this.end();
                          }
                        }
                      };
                    }
                  },
                  viewport: [800, 600],
                  title: 'Stimulus'
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
                      top: 0,
                      width: 895.3,
                      height: 36.16,
                      fill: "${ state.correct_response ? 'green' : 'red' }",
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
                        "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
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
                      id: '736',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {},
                  viewport: [800, 600],
                  title: 'Feedback',
                  tardy: true,
                  timeout: '1000',
                  skip: "${ parameters.phase === 'task' }"
                }
              ]
            }
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
          title: 'Main task',
          content:
            '\u003Cheader class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \n\u003C\u002Ffooter\u003E'
        },
        {
          type: 'lab.canvas.Frame',
          context:
            '\u003Cmain class="content-vertical-center content-horizontal-center"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class="content-vertical-center content-horizontal-center"\u003E\n  \u003Cp\u003E\n    Press \u003Ckbd\u003E1\u003C\u002Fkbd\u003E for a face and \u003Ckbd\u003E9\u003C\u002Fkbd\u003E for a house. \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E',
          contextSelector: 'canvas',
          files: {},
          parameters: {},
          responses: {},
          messageHandlers: {},
          title: 'Task frame',
          content: {
            type: 'lab.flow.Loop',
            files: {},
            parameters: {},
            templateParameters: [
              {
                condition: 'Face',
                image: 'AF0302_1110_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AF0315_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AF0321_2200_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AM0313_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AM0314_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AM0315_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AM0318_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'AM0319_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'BF0605_1110_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'BF0607_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'BF0608_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'Face',
                image: 'BF0624_1100_00F.jpg',
                correctResponse: '1',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house1.3.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house2.2.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house3.1.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house4.3.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house5.2.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house6.3.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house7.1.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house8.4.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house9.2.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house10.4.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house11.2.jpg',
                correctResponse: '9',
                phase: 'task'
              },
              {
                condition: 'House',
                image: 'house12.1.jpg',
                correctResponse: '9',
                phase: 'task'
              }
            ],
            sample: {
              mode: 'draw-shuffle',
              n: '96'
            },
            responses: {},
            messageHandlers: {},
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
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 10,
                      height: '50',
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
                      rx: 0,
                      ry: 0,
                      id: '99'
                    },
                    {
                      type: 'rect',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 10,
                      height: '50',
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
                      angle: 90,
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
                      rx: 0,
                      ry: 0,
                      id: '100'
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {},
                  viewport: [800, 600],
                  title: 'Fixation cross',
                  timeout: '${parameters.fixationCrossDuration}'
                },
                {
                  type: 'lab.canvas.Screen',
                  content: [
                    {
                      type: 'image',
                      version: '2.7.0',
                      originX: 'center',
                      originY: 'center',
                      left: 0,
                      top: 0,
                      width: 400,
                      height: 400,
                      fill: 'black',
                      stroke: null,
                      strokeWidth: 0,
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
                      crossOrigin: '',
                      cropX: 0,
                      cropY: 0,
                      id: '137',
                      src: '${ this.files[this.parameters.image] }',
                      filters: [],
                      naturalWidth: 400,
                      naturalHeight: 400
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {
                    'before:prepare': function anonymous() {
                      // This code registers an event listener for this screen.
                      // We have a timeout for this screen, but we also want to record responses.
                      // On a keydown event, we record the key and the time of response.
                      // We also record whether the response was correct (by comparing the pressed key with the correct response which is defined inside the Experiment loop).
                      // "this" in the code means the lab.js experiment.
                      this.data.trial_number =
                        1 +
                        parseInt(
                          this.options.id.split('_')[
                            this.options.id.split('_').length - 2
                          ]
                        );
                      this.data.response_given = 'no';

                      this.options.events = {
                        keydown: event => {
                          if (['Digit1', 'Digit9'].includes(event.code)) {
                            this.data.reaction_time = this.timer;
                            if (this.parameters.phase === 'task')
                              this.data.response_given = 'yes';
                            this.data.response = event.key;
                            if (
                              this.data.response ==
                              this.parameters.correctResponse
                            ) {
                              this.data.correct_response = true;
                            } else {
                              this.data.correct_response = false;
                            }
                            this.end();
                          }
                        }
                      };
                    }
                  },
                  viewport: [800, 600],
                  title: 'Stimulus'
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
                      top: 0,
                      width: 895.3,
                      height: 36.16,
                      fill: "${ state.correct_response ? 'green' : 'red' }",
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
                        "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
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
                      id: '736',
                      styles: {}
                    }
                  ],
                  files: {},
                  parameters: {},
                  responses: {},
                  messageHandlers: {},
                  viewport: [800, 600],
                  title: 'Feedback',
                  tardy: true,
                  timeout: '1000',
                  skip: "${ parameters.phase === 'task' }"
                }
              ]
            }
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
    }
  ]
};

// export
export default studyObject;
