/* eslint no-console: off */
/**
 * Electron utility-process entry that owns the local LLM (llama.cpp via
 * node-llama-cpp). Runs outside main so loading the model or a stuck
 * generation can never freeze the app shell. The model path arrives as argv[2].
 *
 * Generations are serialized: a new request aborts the one in flight. Each
 * request starts from the system prompt only; keeping one session per system
 * prompt lets llama.cpp reuse its already-evaluated tokens.
 */
import type {
  ChatHistoryItem,
  LlamaChatSession,
  LlamaContextSequence,
} from 'node-llama-cpp';
import type { LLMEvent, LLMWorkerCommand } from '../../shared/llmTypes';

type NodeLlama = typeof import('node-llama-cpp');

const [, , modelPath] = process.argv;
/** The answer is asked to stay under ~90 words. */
const MAX_TOKENS = 200;

const post = (event: LLMEvent) => process.parentPort.postMessage(event);

let loaded:
  | Promise<{ llama: NodeLlama; sequence: LlamaContextSequence }>
  | undefined;
let chat:
  | {
      systemPrompt: string;
      session: LlamaChatSession;
      initial: ChatHistoryItem[];
    }
  | undefined;
let current: AbortController | undefined;
let queue: Promise<void> = Promise.resolve();

function load() {
  loaded ??= (async () => {
    post({ type: 'loading' });
    // node-llama-cpp is ESM-only; keep this a runtime import in the CJS bundle.
    const llama: NodeLlama = await import('node-llama-cpp');
    const runtime = await llama.getLlama();
    const model = await runtime.loadModel({ modelPath });
    const context = await model.createContext({ contextSize: 4096 });
    return { llama, sequence: context.getSequence() };
  })().catch((error) => {
    // Retry the load on the next request instead of caching the failure.
    loaded = undefined;
    throw error;
  });
  return loaded;
}

async function generate(
  command: Extract<LLMWorkerCommand, { type: 'generate' }>,
  signal: AbortSignal
) {
  const { id } = command;
  try {
    const { llama, sequence } = await load();
    if (signal.aborted) return;
    if (chat?.systemPrompt !== command.systemPrompt) {
      chat?.session.dispose({ disposeSequence: false });
      const session = new llama.LlamaChatSession({
        contextSequence: sequence,
        systemPrompt: command.systemPrompt,
      });
      chat = {
        systemPrompt: command.systemPrompt,
        session,
        initial: session.getChatHistory(),
      };
    }
    chat.session.setChatHistory(chat.initial);
    await chat.session.prompt(command.prompt, {
      signal,
      stopOnAbortSignal: true,
      maxTokens: MAX_TOKENS,
      temperature: 0.3,
      // No hidden reasoning: the rules already made the call.
      budgets: { thoughtTokens: 0 },
      onResponseChunk: (chunk) => {
        if (chunk.type !== 'segment' && chunk.text) {
          post({ type: 'chunk', id, text: chunk.text });
        }
      },
    });
    if (!signal.aborted) post({ type: 'done', id });
  } catch (error) {
    console.error('[llm worker]', error);
    post({ type: 'error', id, message: String(error) });
  }
}

process.parentPort.on('message', ({ data }: { data: LLMWorkerCommand }) => {
  current?.abort();
  if (data.type === 'abort') return;
  const controller = new AbortController();
  current = controller;
  queue = queue.then(() => generate(data, controller.signal));
});
