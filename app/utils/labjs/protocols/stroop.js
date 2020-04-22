import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const buildStroopTimeline = () => ({
  overview_title: `Stroop Experiment`,
  overview: `The stroop effect occurs when different properties of something you see or hear contradict one another.
    The most common example is a mismatch between the meaning and color of a word (e.g., the word BLUE written in red ink).
    In the Stroop task, you will explore how these types of mismatches affect your behavior and what that may tell us about
    how your brain processes information.`,
  background_first_column: `You may have played a game with your friends or siblings with the following seemingly simple rule:
    “yes” means “no” and “no” means “yes”. If so, you are all too familiar with Stroop-like effect:
    the information you receive points to different concepts and you have to “ignore” one source of information.`,
  background_first_column_question: `Fun fact: in some Balkan countries, nodding means “no” and shaking your head means “yes”.`,
  background_second_column: `Researchers have used different kinds of Stroop tasks to ask how our brains deal with contradictory information.
    This may be more difficult under some conditions (for example, when we don’t get enough sleep) and for some people
    (for example, children with Attention-deficit/hyperactivity disorder (ADHD)).`,
  background_second_column_question: `You can read more about the Stroop task at Link 1. `,
  protocol_title: `What participants are shown`,
  protocol: `In the Stroop task, participants will see different words written in different colors
    (e.g., the word “GREEN” may be written in a green-colored font, but it may also be written in a red font).
    Participants need to respond only to the color of the font, ignoring the meaning of the word.
    If the font is red, they should press the key ‘r’; if yellow, press ‘y’; if blue, press ‘b’; and if green, press ‘g’.`,
  protocol_condition_first_img: `conditionCongruent`,
  protocol_condition_first_title: `"Green" written in green`,
  protocol_condition_first: `The color is green, so the correct response is ‘g’.`,
  protocol_condition_second_img: `conditionIncongruent`,
  protocol_condition_second_title: `"Green" written in red`,
  protocol_condition_second: `The color is red, so the correct response is ‘r’.`,
  overview_links: [],
  background_links: [
    {
      name: 'Link 1',
      address:
        'https://www.psychologytoday.com/us/blog/play-in-mind/201204/when-red-looks-blue-and-yes-means-no',
    },
  ],
  protocal_links: [],
  params: {
    trialDuration: 1000,
    nbTrials: 150,
    iti: 500,
    jitter: 200,
    sampleType: 'with-replacement',
    pluginName: 'callback-image-display',
    intro: `In this experiment, your task will be to identify the color of the word shown on the screen. The word itself is immaterial - you can safely ignore it.`,
    showProgressBar: false,
    stimulus1: {
      dir: facesDir,
      title: 'Incongruent',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    stimulus2: {
      dir: housesDir,
      title: 'Congruent',
      type: EVENTS.STIMULUS_2,
      response: '9',
    },
  },
  mainTimeline: ['intro', 'stroopTimeline', 'end'], // array of trial and timeline ids
  trials: {
    intro: {
      type: 'callback-html-display',
      id: 'intro',
      post_trial_gap: 1000,
    },
    end: {
      id: 'end',
      type: 'callback-html-display',
      stimulus: 'Thanks for participating. Press any key to continue',
      response_ends_trial: true,
      post_trial_gap: 500,
    },
  },
  timelines: {
    faceHouseTimeline: {
      id: 'stroopTimeline',
      timeline: [
        {
          id: 'interTrial',
          type: 'callback-image-display',
          stimulus: fixation,
          response_ends_trial: false,
        },
        {
          id: 'trial',
          response_ends_trial: false,
        },
      ],
    },
  },
});
