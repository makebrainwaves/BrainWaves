import { useEffect, useRef, useState } from 'react';
import { FEASIBILITY_SYSTEM_PROMPT } from './prompt';

export interface FeasibilityState {
  /** waiting: request sent; loading: model warming up; writing: answer streaming. */
  status: 'idle' | 'waiting' | 'loading' | 'writing' | 'done' | 'error';
  /** The latest analysis. Kept on screen while a newer one is on its way. */
  text: string;
  error?: string;
}

/**
 * Streams the local LLM's phrasing of `prompt`, re-running (and aborting the
 * stale run) whenever the prompt changes.
 */
export function useFeasibility(prompt: string): FeasibilityState {
  const [state, setState] = useState<FeasibilityState>({
    status: 'idle',
    text: '',
  });
  const requestId = useRef<string | null>(null);
  const hasNewText = useRef(false);

  useEffect(
    () =>
      window.electronAPI.onLLMEvent((event) => {
        if (event.type === 'loading') {
          setState((prev) =>
            prev.status === 'waiting' ? { ...prev, status: 'loading' } : prev
          );
          return;
        }
        if (event.id !== requestId.current) return;
        switch (event.type) {
          case 'chunk': {
            const replace = !hasNewText.current;
            hasNewText.current = true;
            setState((prev) => ({
              status: 'writing',
              text: replace ? event.text : prev.text + event.text,
            }));
            break;
          }
          case 'done':
            setState((prev) => ({ ...prev, status: 'done' }));
            break;
          case 'error':
            setState((prev) => ({
              ...prev,
              status: 'error',
              error: event.message,
            }));
            break;
        }
      }),
    []
  );

  useEffect(() => {
    const id = crypto.randomUUID();
    requestId.current = id;
    hasNewText.current = false;
    setState((prev) => ({ ...prev, status: 'waiting', error: undefined }));
    window.electronAPI.generateLLM({
      id,
      systemPrompt: FEASIBILITY_SYSTEM_PROMPT,
      prompt,
    });
  }, [prompt]);

  useEffect(() => () => window.electronAPI.abortLLM(), []);

  return state;
}
