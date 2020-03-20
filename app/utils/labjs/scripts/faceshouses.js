// Define study
const studyObject = {
  "title": "root",
  "type": "lab.flow.Sequence",
  "parameters": {},
  "plugins": [],
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
      "files": {},
      "parameters": {},
      "responses": {},
      "messageHandlers": {},
      "title": "The face-house task",
      "content": [
        {
          "type": "lab.html.Screen",
          "files": {},
          "parameters": {},
          "responses": {
            "keypress(Space)": "continue",
            "keypress(q)": "skipPractice"
          },
          "messageHandlers": {},
          "title": "Instruction",
          "content": "\u003Cheader class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Ch1\u003E${this.parameters.title || \"The face-house task\"}\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n     ${this.parameters.intro}\n  \u003C\u002Fp\u003E\n  \n\u003C\u002Fmain\u003E\n\n\u003Cfooter class=\"content-vertical-center content-horizontal-center\"\u003E\n  \n\u003C\u002Ffooter\u003E"
        },
        {
          "type": "lab.canvas.Frame",
          "context": "\u003Cmain class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Cp\u003E\n    ${this.parameters.taskHelp} \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E",
          "contextSelector": "canvas",
          "files": {},
          "parameters": {},
          "responses": {},
          "messageHandlers": {},
          "title": "Practice frame",
          "tardy": true,
          "skip": "${ state.response === 'skipPractice' }",
          "content": {
            "type": "lab.flow.Loop",
            "files": {},
            "parameters": {},
            "templateParameters": [],
            "sample": {
              "mode": "sequential",
              "n": ""
            },
            "responses": {},
            "messageHandlers": {
              "before:prepare": function anonymous() {
                let initParameters = [...this.parameters.stimuli] || [];
                initParameters = initParameters.filter(t => t.phase === 'practice') || [];
                let numberTrials = this.parameters.nbPracticeTrials;
                if(initParameters.length === 0){
                  numberTrials = 0;
                }
                const randomize = this.parameters.randomize;
                const trialsLength = initParameters.length;
                if(numberTrials > trialsLength){
                  const append = [...initParameters]
                  const multiply = Math.ceil(numberTrials / trialsLength);
                  for (let i = 0; i < multiply; i++){
                    initParameters = initParameters.concat(append)
                  }
                }

                function shuffle(a) {
                  let j, x, i
                  for (i = a.length - 1; i > 0; i--) {
                    j = Math.floor(Math.random() * (i + 1))
                    x = a[i]
                    a[i] = a[j]
                    a[j] = x
                  }
                  return a
                }

                if(randomize === 'random'){
                  shuffle(initParameters);
                }

                const trialConstructor = ( file ) => ({
                    'condition': file.condition,
                    'image': `${file.dir}/${file.filename}`,
                    'correctResponse': file.response,
                    'phase': 'practice',
                    'name': file.name,
                    'type': file.type,
                  })

                // balance design across conditions
                const conditions = Array.from(new Set(initParameters.map(p => p.condition)));
                const conditionsParameters = {};
                for (const c of conditions) {
                	conditionsParameters[c] = initParameters.filter(p => p.condition == c)
                }
                const numberConditionsTrials = Math.ceil(numberTrials / conditions.length);
                let balancedParameters = [];
                for (let i = 0; i < numberConditionsTrials; i++){
                  for (const c of conditions) {
                    balancedParameters = balancedParameters.concat(conditionsParameters[c][i % conditionsParameters[c].length])
                  }
                }
                initParameters = [...balancedParameters.slice(0, numberTrials)];

                let practiceParameters = [];
                for (let i = 0; i < numberTrials; i++){
                  practiceParameters = practiceParameters.concat(trialConstructor(initParameters[i]))
                }

                // assign options values to parameters of this task
                this.options.templateParameters = practiceParameters;
                if(randomize === 'random'){
                  this.options.shuffle = true;
                } else {
                  this.options.shuffle = false;
                }
              }
            },
            "title": "Practice loop",
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
                  "timeout": "${parameters.iti}"
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
const responses = [... new Set(this.parameters.stimuli.map( e => (e.response)))];
this.data.trial_number = 1 + parseInt(this.options.id.split('_')[this.options.id.split('_').length-2]);
this.data.response_given = 'no';

this.options.events = {
  'keydown': (event) => {
    if(responses.includes(event.key)){
      this.data.reaction_time = this.timer;
      if(this.parameters.phase === 'task') this.data.response_given = 'yes';
      this.data.response = event.key;
      if(this.data.response == this.parameters.correctResponse){
        this.data.correct_response = true;
      } else {
        this.data.correct_response = false;
      }
      this.end();
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
                  "timeout": "${parameters.selfPaced ? '3600000' : parameters.presentationTime}",
                },
                {
                  "type": "lab.canvas.Screen",
                  "content": [
                    {
                      "type": "i-text",
                      "version": "2.7.0",
                      "originX": "center",
                      "originY": "center",
                      "left": 0,
                      "top": 0,
                      "width": 895.3,
                      "height": 36.16,
                      "fill": "${ state.correct_response ? 'green' : 'red' }",
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
                      "text": "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
                      "fontSize": "52",
                      "fontWeight": "bold",
                      "fontFamily": "sans-serif",
                      "fontStyle": "normal",
                      "lineHeight": 1.16,
                      "underline": false,
                      "overline": false,
                      "linethrough": false,
                      "textAlign": "center",
                      "textBackgroundColor": "",
                      "charSpacing": 0,
                      "id": "736",
                      "styles": {}
                    }
                  ],
                  "files": {},
                  "parameters": {},
                  "responses": {},
                  "messageHandlers": {
                    "run": function anonymous() {
                      this.data.correct_response = false;
                    }},
                  "viewport": [
                    800,
                    600
                  ],
                  "title": "Feedback",
                  "tardy": true,
                  "timeout": "1000",
                  "skip": "${ parameters.phase === 'task' }"
                }
              ]
            }
          }
        },
        {
          "type": "lab.html.Screen",
          "files": {},
          "parameters": {},
          "responses": {
            "keypress(Space)": "continue"
          },
          "messageHandlers": {},
          "title": "Main task",
          "content": "\u003Cheader class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Ch1\u003EReady for the real data collection?\u003C\u002Fh1\u003E\n\u003C\u002Fheader\u003E\n\u003Cmain\u003E\n\n  \u003Cp\u003E\n    Press the the space bar to start the main task.\n  \u003C\u002Fp\u003E\n\n\u003C\u002Fmain\u003E\n\u003Cfooter class=\"content-vertical-center content-horizontal-center\"\u003E\n  \n\u003C\u002Ffooter\u003E"
        },
        {
          "type": "lab.canvas.Frame",
          "context": "\u003Cmain class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Ccanvas \u002F\u003E\n\u003C\u002Fmain\u003E\n\n\u003Cfooter class=\"content-vertical-center content-horizontal-center\"\u003E\n  \u003Cp\u003E\n    ${this.parameters.taskHelp} \n  \u003C\u002Fp\u003E\n\u003C\u002Ffooter\u003E",
          "contextSelector": "canvas",
          "files": {},
          "parameters": {},
          "responses": {},
          "messageHandlers": {},
          "title": "Task frame",
          "content": {
            "type": "lab.flow.Loop",
            "files": {},
            "parameters": {},
            "templateParameters": [],
            "sample": {
              "mode": "sequential",
              "n": ""
            },
            "responses": {},
            "messageHandlers": {
              "before:prepare": function anonymous() {
                let initialParameters = [...this.parameters.stimuli] || [];
                initialParameters = initialParameters.filter(t => t.phase === 'main') || [];
                let numberTrials = this.parameters.nbTrials;
                if(initialParameters.length === 0){
                  numberTrials = 0;
                }
                const randomize = this.parameters.randomize;
                const trialsLength = initialParameters.length;
                if(numberTrials > trialsLength){
                  const append = [...initialParameters]
                  const multiply = Math.ceil(numberTrials / trialsLength);
                  for (let i = 0; i < multiply; i++){
                    initialParameters = initialParameters.concat(append)
                  }
                }

                function shuffle(a) {
                  let j, x, i
                  for (i = a.length - 1; i > 0; i--) {
                    j = Math.floor(Math.random() * (i + 1))
                    x = a[i]
                    a[i] = a[j]
                    a[j] = x
                  }
                  return a
                }

                if(randomize === 'random'){
                  shuffle(initialParameters);
                }

                const trialConstructor = ( file ) => ({
                    'condition': file.condition,
                    'image': `${file.dir}/${file.filename}`,
                    'correctResponse': file.response,
                    'phase': 'task',
                    'name': file.name,
                    'type': file.type,
                  })
                // balance design across conditions
                const conditions = Array.from(new Set(initialParameters.map(p => p.condition)));
                const conditionsParameters = {};
                for (const c of conditions) {
                	conditionsParameters[c] = initialParameters.filter(p => p.condition == c)
                }
                const numberConditionsTrials = Math.ceil(numberTrials / conditions.length);
                let balancedParameters = [];
                for (let i = 0; i < numberConditionsTrials; i++){
                  for (const c of conditions) {
                    balancedParameters = balancedParameters.concat(conditionsParameters[c][i % conditionsParameters[c].length])
                  }
                }
                initialParameters = [...balancedParameters.slice(0, numberTrials)];

                let trialParameters = [];
                for (let i = 0; i < numberTrials; i++){
                  trialParameters = [...trialParameters.concat(trialConstructor(initialParameters[i]))]
                }
                // assign options values to parameters of this task
                this.options.templateParameters = trialParameters;
                if(randomize === 'random'){
                  this.options.shuffle = true;
                } else {
                  this.options.shuffle = false;
                }

              }
            },
            "title": "Experiment loop",
            "tardy": true,
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
                  "timeout": "${parameters.iti}"
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
                      // On a keydown event, we record the key and the time of response.
                      // We also record whether the response was correct (by comparing the pressed key with the correct response which is defined inside the Experiment loop).
                      // "this" in the code means the lab.js experiment.
                      // extract the possible responses from the parameters
                      const responses = [... new Set(this.parameters.stimuli.map( e => (e.response)))];
                      this.data.trial_number = 1 + parseInt(this.options.id.split('_')[this.options.id.split('_').length-2]);
                      this.data.response_given = 'no';

                      this.options.events = {
                        'keydown': (event) => {
                          if(responses.includes(event.key)){
                            this.data.reaction_time = this.timer;
                            if(this.parameters.phase === 'task') this.data.response_given = 'yes';
                            this.data.response = event.key;
                            if(this.data.response == this.parameters.correctResponse){
                              this.data.correct_response = true;
                            } else {
                              this.data.correct_response = false;
                            }
                            this.end();
                          }
                        }
                      }
                      },
                      'run': function anonymous() {
                        this.parameters.callbackForEEG(this.parameters.type);
                      }
                  },
                  "viewport": [
                    800,
                    600
                  ],
                  "title": "Stimulus",
                  "timeout": "${parameters.selfPaced ? '3600000' : parameters.presentationTime}",
                },
                {
                  "type": "lab.canvas.Screen",
                  "content": [
                    {
                      "type": "i-text",
                      "version": "2.7.0",
                      "originX": "center",
                      "originY": "center",
                      "left": 0,
                      "top": 0,
                      "width": 895.3,
                      "height": 36.16,
                      "fill": "${ state.correct_response ? 'green' : 'red' }",
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
                      "text": "${ state.correct_response ? 'Well done!' : 'Please respond accurately' }",
                      "fontSize": "52",
                      "fontWeight": "bold",
                      "fontFamily": "sans-serif",
                      "fontStyle": "normal",
                      "lineHeight": 1.16,
                      "underline": false,
                      "overline": false,
                      "linethrough": false,
                      "textAlign": "center",
                      "textBackgroundColor": "",
                      "charSpacing": 0,
                      "id": "736",
                      "styles": {}
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
                  "title": "Feedback",
                  "tardy": true,
                  "timeout": "1000",
                  "skip": "${ parameters.phase === 'task' }"
                }
              ]
            }
          }
        },
        {
          "type": "lab.html.Screen",
          "files": {},
          "parameters": {},
          "responses": {
            "keypress(Space)": "end"
          },
          "messageHandlers": {},
          "title": "End",
          "content": "\u003Cheader class=\"content-vertical-center content-horizontal-center\"\u003E\n  \n\u003C\u002Fheader\u003E\n\n\u003Cmain\u003E\n  \u003Ch1\u003E\n    Thank you!\n  \u003C\u002Fh1\u003E\n  \u003Ch1\u003E\n    Press the space bar to finish the task.\n  \u003C\u002Fh1\u003E\n\u003C\u002Fmain\u003E\n\n"
        }
      ]
    }
  ]
}

// export
export default studyObject;
