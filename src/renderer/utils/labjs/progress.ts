import type { ExperimentProgress } from '../../components/ExperimentRuntime';

interface StackComponent {
  options?: { templateParameters?: unknown; content?: unknown };
  parameters?: Record<string, unknown>;
}

const PHASES: Record<string, ExperimentProgress['phase']> = {
  practice: 'practice',
  main: 'main',
  // Stroop's loops say phase 'task' for the recorded block.
  task: 'main',
  // Multitasking says task 'training' | 'main' instead of a phase.
  training: 'practice',
};

type Loop = StackComponent & {
  options: { templateParameters: unknown[]; content: StackComponent[] };
};

/** Loops are the only components with `templateParameters`; class names get minified. */
const isLoop = (component: StackComponent | undefined): component is Loop =>
  Array.isArray(component?.options?.templateParameters) &&
  Array.isArray(component?.options?.content);

/**
 * Position within the innermost trial loop on lab.js' active component stack
 * (root → leaf), or null outside one. A loop whose iterations contain another
 * loop is a block loop (Multitasking): its screens are between trials.
 */
export function progressFromStack(
  stack: StackComponent[]
): ExperimentProgress | null {
  for (let i = stack.length - 2; i >= 0; i -= 1) {
    const loop = stack[i];
    const child = stack[i + 1];
    if (isLoop(loop) && loop.options.content.includes(child)) {
      const children = child.options?.content;
      if (Array.isArray(children) && children.some(isLoop)) return null;
      const { phase, task } = child.parameters ?? {};
      const label = phase ?? task;
      return {
        phase: typeof label === 'string' ? PHASES[label] : undefined,
        current: loop.options.content.indexOf(child) + 1,
        total: loop.options.content.length,
      };
    }
  }
  return null;
}
