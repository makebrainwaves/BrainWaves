import type { ExperimentProgress } from '../../components/ExperimentRuntime';

interface StackComponent {
  options?: { templateParameters?: unknown; content?: unknown };
  parameters?: Record<string, unknown>;
}

const PHASES: Record<string, ExperimentProgress['phase']> = {
  practice: 'practice',
  main: 'main',
  // Stroop's loops say 'task' for the recorded block.
  task: 'main',
};

/**
 * Position within the innermost loop on lab.js' active component stack
 * (root → leaf), or null outside any loop. Loops are recognised by their
 * `templateParameters`, not their class name, which minification mangles.
 */
export function progressFromStack(
  stack: StackComponent[]
): ExperimentProgress | null {
  for (let i = stack.length - 2; i >= 0; i -= 1) {
    const { templateParameters, content } = stack[i].options ?? {};
    const index = Array.isArray(content) ? content.indexOf(stack[i + 1]) : -1;
    if (Array.isArray(templateParameters) && index >= 0) {
      const phase = stack[i + 1].parameters?.phase;
      return {
        phase: typeof phase === 'string' ? PHASES[phase] : undefined,
        current: index + 1,
        total: (content as unknown[]).length,
      };
    }
  }
  return null;
}
