// Define study
const studyObject = {
  "title": "root",
  "type": "lab.flow.Sequence",
  "parameters": {},
  "plugins": [
    {
      "type": "lab.plugins.Metadata"
    },
    {
      "type": "lab.plugins.Download",
      "filePrefix": "the-face-house-task"
    }
  ],
  "metadata": {
    "title": "The face-house task",
    "description": "Faces contain a lot of information that is relevant to our survival. It's important to be able to quickly recognize people you can trust and read emotions in both strangers and people you know. ",
    "repository": "",
    "contributors": "Yury Shevchenko \u003Cyury.shevchenko@uni-konstanz.de\u003E"
  },
  "files": {},
  "responses": {},
  "content": [
    {
      "type": "lab.flow.Sequence",
      "files": {
        "Annie_3.jpg": "./utils/labjs/scripts/faceshouses/7a536fba60226293bf351cb6f9719fee15f3b693915c0a55b0f107377f10a7e1.jpg",
        "Blake_3.jpg": "./utils/labjs/scripts/faceshouses/3138f2fd1cba5a07f0b0ac61f8ee4754e6e0f07bd3ea520a75bc39c2d05ecece.jpg",
        "Don_3.jpg": "./utils/labjs/scripts/faceshouses/cc6bf44e75c27e0d57956ae95d4c2c64f0d41f666a1e3f9fff20927fe3844dfd.jpg",
        "Estelle_3.jpg": "./utils/labjs/scripts/faceshouses/5ce843ee780ba0c902ee1b06326c7e65fe840769c8621a8d9f8b75b5eb67bcd9.jpg",
        "Frank_3.jpg": "./utils/labjs/scripts/faceshouses/856ae9bd5ec82567011ae41e10dcfa2de9cfa7ddadc5c1388df2998142ab4d7f.jpg",
        "Janie_3.jpg": "./utils/labjs/scripts/faceshouses/a82a652abb85637af9fba1f4dbf7f69d906a14172a70df610e3be33c0058b9f6.jpg",
        "Joan_3.jpg": "./utils/labjs/scripts/faceshouses/d92c1965ad53b7533d5f00ace843e8f1c161ae7e72ad52b4511f3ab84a8eea73.jpg",
        "Jodi_3.jpg": "./utils/labjs/scripts/faceshouses/b746cdfd1099dfbe200a661a81ef2315935a5eafc855b8b373d9b633fadd8e6c.jpg",
        "Joe_3.jpg": "./utils/labjs/scripts/faceshouses/3e55b3ce099ffea5a4ebde02c7a0cb055fb6f9768116efc932e77e4319841bea.jpg",
        "Tim_3.jpg": "./utils/labjs/scripts/faceshouses/56136f19fc574a3a99761c9a7ce1fcc5149d6edcc60e942cc8e5db2f66e0db91.jpg",
        "Tom_3.jpg": "./utils/labjs/scripts/faceshouses/b87301f741db5d27e05e8d127ae729af9bb7e2e38484c8f29b52e442c333989d.jpg",
        "Wallace_3.jpg": "./utils/labjs/scripts/faceshouses/5ba782ee30b8213b554d61adb62091b63c509a539bdd693ed27c1cbc3db40272.jpg",
        "house1.3.jpg": "./utils/labjs/scripts/faceshouses/9f0121c6a70040d4abbcd41daf909797cef7438f406fc471c0def07f477f920e.jpg",
        "house2.2.jpg": "./utils/labjs/scripts/faceshouses/461aa813adbb5117b26b791c02864b2e88e6c2899c821f14d58b042c26628b92.jpg",
        "house3.1.jpg": "./utils/labjs/scripts/faceshouses/269317cfd165abfdbc48e400a6cfc89c2cfcd98a9c738ece5222e8d513bcf83a.jpg",
        "house4.3.jpg": "./utils/labjs/scripts/faceshouses/a87186061326f3e11259a95ba1229cfc3f1a4f4b06fb50c16ad3757105a2b69c.jpg",
        "house5.2.jpg": "./utils/labjs/scripts/faceshouses/f78f496ab685b1ae4661c6071358f1a6ab0e1238a0ed1bd157a32317c41a8eaf.jpg",
        "house6.3.jpg": "./utils/labjs/scripts/faceshouses/b589ac23b4918605f777f45ad32149fa7327fccdd452d4037451c8c28e19c7c0.jpg",
        "house7.1.jpg": "./utils/labjs/scripts/faceshouses/f528aa7c5e2618c4e8b7ae1e1eced370788e698a339b60be085b46c0044b58e3.jpg",
        "house8.4.jpg": "./utils/labjs/scripts/faceshouses/28f97e1e523564c8fa7942675ea1609265532de0c715e1b4058cf8ceb4220f9b.jpg",
        "house9.2.jpg": "./utils/labjs/scripts/faceshouses/6720b60aa89355682657837dca11fc69d684e77cca2cd26029115ac49e940efe.jpg",
        "house10.4.jpg": "./utils/labjs/scripts/faceshouses/c424a87e1b2220efb59423664e7293de2ed37e60d463bfe3261d8b967183740f.jpg",
        "house11.2.jpg": "./utils/labjs/scripts/faceshouses/19a8664bab5a3c491510b7f3485d5498c41b680c4695c317be659b4d8e092358.jpg",
        "house12.1.jpg": "./utils/labjs/scripts/faceshouses/38178a7ec6cc54ed9e61b5fec7790dc85d2debe2dad0b3e960686db660d9428c.jpg"
      },
      "parameters": {
        "fixationCrossDuration": 500,
        "imageDuration": 1000
      },
      "responses": {},
      "messageHandlers": {},
      "title": "The face-house task",
      "notes": "We can change these parameters to manipulate the duration of two screens: the fixation cross screen and the screen with an image. The duration is measured in milliseconds.\nDefault values\n- fixationCrossDuration - 500 ms\n- imageDuration - 1000 ms",
      "content": [
        {
          "type": "lab.html.Screen",
          "files": {},
          "parameters": {},
          "responses": {
            "keypress(Space)": "continue"
          },
          "messageHandlers": {},
          "title": "Instruction",
          "content": "\u003Cheader class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Ch1\u003EThe face-house task\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    You will view a series of faces and houses.\n    Press 1 when a face appears and 9 for a house. \n    \n  \u003C\u002Fp\u003E\n  \n\u003C\u002Fmain\u003E\n\n\u003Cfooter\u003E\n  Press \u003Ckbd\u003ESpace\u003C\u002Fkbd\u003E to continue.\n\u003C\u002Ffooter\u003E"
        },
        {
          "type": "lab.flow.Loop",
          "files": {},
          "parameters": {},
          "templateParameters": [
            {
              "condition": "Face",
              "image": "Annie_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Blake_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Don_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Estelle_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Frank_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Janie_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Joan_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Jodi_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Joe_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Tim_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Tom_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "Face",
              "image": "Wallace_3.jpg",
              "correctResponse": "1"
            },
            {
              "condition": "House",
              "image": "house1.3.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house2.2.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house3.1.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house4.3.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house5.2.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house6.3.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house7.1.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house8.4.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house9.2.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house10.4.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house11.2.jpg",
              "correctResponse": "9"
            },
            {
              "condition": "House",
              "image": "house12.1.jpg",
              "correctResponse": "9"
            }
          ],
          "sample": {
            "mode": "draw-shuffle",
            "n": ""
          },
          "responses": {},
          "messageHandlers": {},
          "title": "Experiment loop",
          "shuffleGroups": [],
          "template": {
            "type": "lab.flow.Sequence",
            "files": {},
            "parameters": {},
            "responses": {},
            "messageHandlers": {},
            "title": "Trial",
            "content": [
              {
                "type": "lab.canvas.Screen",
                "content": [
                  {
                    "type": "rect",
                    "version": "2.7.0",
                    "originX": "center",
                    "originY": "center",
                    "left": 0,
                    "top": 0,
                    "width": 10,
                    "height": "50",
                    "fill": "black",
                    "stroke": null,
                    "strokeWidth": 1,
                    "strokeDashArray": null,
                    "strokeLineCap": "butt",
                    "strokeDashOffset": 0,
                    "strokeLineJoin": "round",
                    "strokeMiterLimit": 4,
                    "scaleX": 1,
                    "scaleY": 1,
                    "angle": 0,
                    "flipX": false,
                    "flipY": false,
                    "opacity": 1,
                    "shadow": null,
                    "visible": true,
                    "clipTo": null,
                    "backgroundColor": "",
                    "fillRule": "nonzero",
                    "paintFirst": "fill",
                    "globalCompositeOperation": "source-over",
                    "transformMatrix": null,
                    "skewX": 0,
                    "skewY": 0,
                    "rx": 0,
                    "ry": 0,
                    "id": "99"
                  },
                  {
                    "type": "rect",
                    "version": "2.7.0",
                    "originX": "center",
                    "originY": "center",
                    "left": 0,
                    "top": 0,
                    "width": 10,
                    "height": "50",
                    "fill": "black",
                    "stroke": null,
                    "strokeWidth": 1,
                    "strokeDashArray": null,
                    "strokeLineCap": "butt",
                    "strokeDashOffset": 0,
                    "strokeLineJoin": "round",
                    "strokeMiterLimit": 4,
                    "scaleX": 1,
                    "scaleY": 1,
                    "angle": 90,
                    "flipX": false,
                    "flipY": false,
                    "opacity": 1,
                    "shadow": null,
                    "visible": true,
                    "clipTo": null,
                    "backgroundColor": "",
                    "fillRule": "nonzero",
                    "paintFirst": "fill",
                    "globalCompositeOperation": "source-over",
                    "transformMatrix": null,
                    "skewX": 0,
                    "skewY": 0,
                    "rx": 0,
                    "ry": 0,
                    "id": "100"
                  }
                ],
                "files": {},
                "parameters": {},
                "responses": {},
                "messageHandlers": {},
                "viewport": [
                  800,
                  600
                ],
                "title": "Fixation cross",
                "timeout": "${parameters.fixationCrossDuration}"
              },
              {
                "type": "lab.canvas.Screen",
                "content": [
                  {
                    "type": "image",
                    "version": "2.7.0",
                    "originX": "center",
                    "originY": "center",
                    "left": 0,
                    "top": 0,
                    "width": 400,
                    "height": 400,
                    "fill": "black",
                    "stroke": null,
                    "strokeWidth": 0,
                    "strokeDashArray": null,
                    "strokeLineCap": "butt",
                    "strokeDashOffset": 0,
                    "strokeLineJoin": "round",
                    "strokeMiterLimit": 4,
                    "scaleX": 1,
                    "scaleY": 1,
                    "angle": 0,
                    "flipX": false,
                    "flipY": false,
                    "opacity": 1,
                    "shadow": null,
                    "visible": true,
                    "clipTo": null,
                    "backgroundColor": "",
                    "fillRule": "nonzero",
                    "paintFirst": "fill",
                    "globalCompositeOperation": "source-over",
                    "transformMatrix": null,
                    "skewX": 0,
                    "skewY": 0,
                    "crossOrigin": "",
                    "cropX": 0,
                    "cropY": 0,
                    "id": "137",
                    "src": "${ this.files[this.parameters.image] }",
                    "filters": [],
                    "naturalWidth": 400,
                    "naturalHeight": 400
                  }
                ],
                "files": {},
                "parameters": {},
                "responses": {},
                "messageHandlers": {
                  "before:prepare": function anonymous(
) {
// This code registers an event listener for this screen.
// We have a timeout for this screen, but we also want to record responses.
// On a keydown event, we record the key and the time of response.
// We also record whether the response was correct (by comparing the pressed key with the correct response which is defined inside the Experiment loop).
// "this" in the code means the lab.js experiment.
this.data.trial_number = 1 + parseInt(this.options.id.split('_')[this.options.id.split('_').length-2]);
this.data.response_given = 'no';

this.options.events = {
  'keydown': (event) => {
    if(['Digit1', 'Digit9'].includes(event.code)){
      this.data.reaction_time = this.timer;
      this.data.response_given = 'yes';
      this.data.response = event.key;
      if(this.data.response == this.parameters.correctResponse){
        this.data.correct_response = true;
      } else {
        this.data.correct_response = false;
      }
    }
  }
}
}
                },
                "viewport": [
                  800,
                  600
                ],
                "title": "Stimulus",
                "timeout": "${parameters.imageDuration}"
              }
            ]
          }
        },
        {
          "type": "lab.html.Screen",
          "files": {},
          "parameters": {},
          "responses": {
            "keypress(Space)": "finish"
          },
          "messageHandlers": {},
          "title": "End",
          "timeout": "10000",
          "content": "\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Thanks for participating. Press \u003Ckbd\u003ESpace\u003C\u002Fkbd\u003E to continue.\n  \u003C\u002Fp\u003E\n  \n\u003C\u002Fmain\u003E"
        }
      ]
    }
  ]
}

// export
export default studyObject;
