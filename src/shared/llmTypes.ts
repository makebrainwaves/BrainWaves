/**
 * Local LLM protocol shared by renderer, main, and the utility-process worker.
 * Main relays worker events to the renderer unchanged.
 */

/** One stateless generation: a fresh chat with this system prompt and message. */
export interface LLMRequest {
  id: string;
  systemPrompt: string;
  prompt: string;
}

export type LLMEvent =
  /** The model is loading into memory (first request after launch). */
  | { type: 'loading' }
  /** A piece of the visible answer. */
  | { type: 'chunk'; id: string; text: string }
  | { type: 'done'; id: string }
  | { type: 'error'; id: string; message: string };

/** Messages main sends to the worker. */
export type LLMWorkerCommand =
  | ({ type: 'generate' } & LLMRequest)
  | { type: 'abort' };
