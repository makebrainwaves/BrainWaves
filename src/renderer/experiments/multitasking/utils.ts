import * as lab from 'lab.js';

export function initMultitaskingResponseHandlers(
  this: lab.flow.Loop<Record<string, unknown>>
) {
  if (!this.options.events) return;

  this.options.events.keydown = (e: Event) => {
    const { code } = e as unknown as { code: string };
    if (code === 'KeyQ') {
      this.data.skipTraining = true;
      this.end();
    }

    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const instructions =
        document.querySelectorAll<HTMLElement>('div.instruction');
      let notFound = true;
      instructions.forEach((i) => {
        if (i.style.display === 'block' && notFound) {
          const cur_id = parseInt(i.id.split('screen_')[1], 10);
          let next_id;
          if (code === 'ArrowLeft') {
            next_id = cur_id - 1;
          }
          if (code === 'ArrowRight') {
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

export function initTasks(this: lab.flow.Loop<Record<string, unknown>>) {
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

  // Each numberBlocks iteration emits blocks.length * 4 trials, so divide by
  // both factors to avoid generating ~2x num_trials before truncation.
  const numberBlocks = Math.ceil(
    this.parameters.num_trials / (blocks.length * 4)
  );

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

/** Emits the block's condition label. Training blocks emit no marker, so practice is never epoched as data. */
export function triggerEEGCallback(this: lab.core.Component) {
  if (this.parameters.task !== 'training')
    this.parameters.callbackForEEG(this.parameters.cond);
  this.data.correct = 'empty';
}

/**
 * Stimulus-screen `end` hook: writes the behavior-analysis fields
 * (`trial_number`, `condition`, `reaction_time`, `correct_response`,
 * `response_given`) on the trial's own row. lab.js has stored `response`
 * and `duration` (show → response) by then and commits the row after the
 * hook. Uses `this.id`: loop clones have no `this.options.id`.
 */
export function scoreTaskResponse(this: lab.core.Component) {
  const parts = this.id?.split('_') ?? [];
  if (parts.length < 2) return;
  this.data.trial_number = 1 + parseInt(parts[parts.length - 2], 10);
  this.data.condition = this.parameters.cond;
  this.data.reaction_time = this.data.duration;
  this.data.correct_response =
    this.data.response === this.parameters.cor_response;
  this.data.response_given = this.data.response === undefined ? 'no' : 'yes';
  if (this.parameters.task === 'training') this.data.phase = 'practice';
}
