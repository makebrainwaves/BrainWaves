import * as lab from 'lab.js';

export function initMultitaskingResponseHandlers(this: lab.flow.Loop) {
  if (!this.options.events) return;

  // @ts-expect-error
  this.options.events.keydown = (e: { code: string }) => {
    if (e.code === 'KeyQ') {
      this.data.skipTraining = true;
      this.end();
    }

    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      const instructions = document.querySelectorAll<HTMLElement>(
        'div.instruction'
      );
      let notFound = true;
      instructions.forEach((i) => {
        if (i.style.display === 'block' && notFound) {
          const cur_id = parseInt(i.id.split('screen_')[1], 10);
          let next_id;
          if (e.code === 'ArrowLeft') {
            next_id = cur_id - 1;
          }
          if (e.code === 'ArrowRight') {
            next_id = cur_id + 1;
          }
          if (next_id > 0 && next_id <= 10) {
            i.style.display = 'none';
            next_id = `screen_${next_id}`;

            const nextElement = document.querySelector<HTMLElement>(
              `#${next_id}`
            );
            if (nextElement) {
              nextElement.style.display = 'block';
            }
            notFound = false;
          }
        }
      });
    }
  };
}

export function initTasks(this: lab.flow.Loop) {
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

  let tasksParameters: {
    type: string;
    dots: number;
    form: string;
    cor_response: string;
  }[] = [];
  const blocks: string[] =
    this.parameters.block === 'mixed'
      ? ['shape', 'filling']
      : [this.parameters.block, this.parameters.block];

  function trialConstructor(
    block: string,
    dots: number,
    form: string,
    cor_response: string
  ) {
    return {
      type: block,
      dots,
      form,
      cor_response,
    };
  }

  const numberBlocks = Math.ceil(this.parameters.num_trials / 4);

  for (let i = 1; i <= numberBlocks; i++) {
    for (const block of blocks) {
      if (block === 'shape') {
        tasksParameters = tasksParameters.concat([
          trialConstructor(block, 2, 'diamond', 'b'),
          trialConstructor(block, 2, 'square', 'n'),
          trialConstructor(block, 3, 'diamond', 'b'),
          trialConstructor(block, 3, 'square', 'n'),
        ]);
      } else if (block === 'filling') {
        tasksParameters = tasksParameters.concat([
          trialConstructor(block, 2, 'diamond', 'b'),
          trialConstructor(block, 2, 'square', 'b'),
          trialConstructor(block, 3, 'diamond', 'n'),
          trialConstructor(block, 3, 'square', 'n'),
        ]);
      }
    }
  }

  const tasksParametersShuffled = shuffle(tasksParameters);
  // assign options values to parameters of this task
  this.options.templateParameters = tasksParametersShuffled.slice(
    0,
    this.parameters.num_trials
  );
}

export function triggerEEGCallback(this: lab.core.Component) {
  this.parameters.callbackForEEG(
    //  TODO: is this parameter ever handled?
    this.parameters.cond === 'Switching' ? 1 : 2
  );
  this.data.correct = 'empty';
}

export function initTaskScreen(this: lab.core.Component) {
  const { id } = this.options;
  if (!id) return;

  this.data.trial_number =
    1 + parseInt(id.split('_')[id.split('_').length - 2], 10);
  this.data.condition = this.parameters.cond;
  this.data.reaction_time = this.state.duration;

  if (this.state.response === this.parameters.cor_response) {
    this.data.correct_response = true;
  } else {
    this.data.correct_response = false;
  }

  if (this.parameters.task === 'main') {
    this.data.response_given = this.state.correct === 'empty' ? 'no' : 'yes';
  } else {
    this.data.phase = 'practice';
  }
}
