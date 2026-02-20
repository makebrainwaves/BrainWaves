import * as lab from 'lab.js';

function shuffle(a) {
  let j;
  let x;

  for (let i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const makeStimuliArray = (arrLen, stLen, isTarget) => {
  const arr = Array(arrLen).fill(0);
  const shuffled = shuffle([...Array(arrLen).keys()]).slice(0, stLen);
  for (const p of shuffled) {
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

function trialConstructor(
  i: number,
  stimLength: number,
  isTarget: 'yes' | 'no',
  phase: 'main' | 'practice',
  arrLength: number
) {
  return {
    trialId: i,
    stimuli: makeStimuliArray(arrLength, stimLength, isTarget),
    target: isTarget,
    size: stimLength,
    phase,
  };
}

function constructTrials(
  nbTrials: number,
  phase: 'practice' | 'main',
  arrLength: number
) {
  let parameters: any = [];
  for (let i = 1; i <= nbTrials; i++) {
    parameters = parameters.concat([
      trialConstructor(i, 5, 'yes', phase, arrLength),
      trialConstructor(i, 5, 'no', phase, arrLength),
      trialConstructor(i, 10, 'yes', phase, arrLength),
      trialConstructor(i, 10, 'no', phase, arrLength),
      trialConstructor(i, 15, 'yes', phase, arrLength),
      trialConstructor(i, 15, 'no', phase, arrLength),
      trialConstructor(i, 20, 'yes', phase, arrLength),
      trialConstructor(i, 20, 'no', phase, arrLength),
    ]);
  }
  return parameters;
  // assign options values to parameters of this task
}

export function initSearchTrials(this: lab.flow.Loop) {
  this.options.templateParameters = constructTrials(10, 'main', 25);
  this.options.shuffle = true; // already shuffled before
}

export function initPracticeTrials(this: lab.flow.Loop) {
  this.options.templateParameters = constructTrials(1, 'practice', 25);
  this.options.shuffle = true; // already shuffled before
}

export function initGrid(this: lab.html.Screen) {
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
        d.id = 'target';
      }
    }
    d.appendChild(el);
    taskgrid?.appendChild(d);
  }

  const feedbackDiv = document.querySelector<HTMLElement>('#feedback');
  const targetDiv = document.querySelector<HTMLElement>('#target');

  if (!feedbackDiv) return;

  if (this.state.response === 'noresponse') {
    feedbackDiv.innerHTML = 'Please respond.';
    return;
  }

  if (this.state.correct) {
    feedbackDiv.innerHTML = 'Well done!';
    feedbackDiv.style.color = 'green';
  } else if (this.parameters.target === 'yes') {
    feedbackDiv.innerHTML = 'Error! There was one!';
    if (targetDiv) {
      targetDiv.style.border = 'solid';
    }
  } else {
    feedbackDiv.innerHTML = 'Error! There was none!';
  }
}

export function initResponses(this: lab.html.Screen) {
  if (!this.options.id) return;
  this.data.trial_number =
    1 +
    parseInt(
      this.options.id.split('_')[this.options.id.split('_').length - 2],
      10
    );

  this.data.condition = `${this.parameters.size} letters`;

  this.data.reaction_time = this.state.duration;

  if (this.state.response === this.parameters.target) {
    this.data.correct_response = true;
  } else {
    this.data.correct_response = false;
  }

  this.data.response_given =
    this.parameters.phase === 'practice' || this.state.response === 'noresponse'
      ? 'no'
      : 'yes';
}
