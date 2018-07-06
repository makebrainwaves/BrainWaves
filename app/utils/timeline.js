// Helper function
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

const post_trial_gap = function() {
  return Math.floor(Math.random() * jitter) + iti;
};

// Experiment parameters
const trial_duration = 300;
const stim_duration = 200;
const iti = 300;
const jitter = 200;
const n_trials = 2010;
const prob = 0.15;
const plugin_name = "callback_image_display";

/**
 *
 * Example callback:
 *
 * const callback =  (targetID) => {
 *    console.log(targetID)
 * }
 *
 */
export function timelineFactory(experimentType, callback) {

  const start_callback = function() {
    callback("start");
  };
  const target_callback = function() {
    callback("target");
  };
  const nontarget_callback = function() {
    callback("nontarget");
  };
  const stop_callback = function() {
    callback("stop");
  };

  const base_path = "../assets/p300";
  let targets = [
    require("../assets/p300/target-1.jpg"),
    require("../assets/p300/target-2.jpg")    
  ];
  let nontargets = [
    require("../assets/p300/nontarget-1.jpg"),
    require("../assets/p300/nontarget-2.jpg")
  ];

//   targets = targets.map(target => require(`${base_path}${target}`));
//   nontargets = nontargets.map(nontarget => require(`${base_path}${nontarget}`));

  const stimuli_order = [];

  for (let counter = 0; counter < n_trials; counter++) {
    stimuli_order.push(Math.random() > prob);
  }

  const stim_list = [];
  const images = [];
  let trial, image;
  for (let counter = 0; counter < n_trials; counter++) {
    if (stimuli_order[counter] === true) {
      let photo_idx = getRandomInt(0, targets.length);
      trial = {
        stimulus: targets[photo_idx],
        on_start: target_callback
      };
      image = targets[photo_idx];
    } else {
      let photo_idx = getRandomInt(0, nontargets.length);
      trial = {
        stimulus: nontargets[photo_idx],
        on_start: nontarget_callback
      };
      image = nontargets[photo_idx];
    }

    images.push(image);
    stim_list.push(trial);
  }

  // Create timeline
  const timeline = [];

  const welcome_block = {
    type: "callback_html_display",
    stimulus: "Welcome to the experiment. Press any key to begin.",
    post_trial_gap: 500,
    on_start: start_callback
  };
  timeline.push(welcome_block);

  const test_trials = {
    stimulus: "stimulus",
    type: plugin_name,
    timeline: stim_list,
    choices: ["f", "j"],
    trial_duration: trial_duration,
    stimulus_duration: stim_duration,
    post_trial_gap: post_trial_gap()
  };
  timeline.push(test_trials);

  const end_block = {
    type: "callback_html_display",
    stimulus: "Thanks for participating!",
    post_trial_gap: 500,
    on_start: stop_callback
  };

  timeline.push(end_block);

  return timeline;
}
