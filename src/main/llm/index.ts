/**
 * Main-process owner of the local LLM utility process. The worker is forked
 * lazily on the first request (so users who never reach the feature pay no
 * RAM) and its events are forwarded to the renderer by `emit`.
 */
/// <reference types="electron-vite/node" />
import { app, utilityProcess, type UtilityProcess } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { LLMEvent, LLMRequest } from '../../shared/llmTypes';
import { pickModelFile } from './models';
// electron-vite bundles the worker as its own entry and resolves its path.
import workerPath from './worker?modulePath';

/**
 * The GGUF to load: `BW_LLM_MODEL` if set, else the best tier installed in
 * `<userData>/models` that fits this machine's RAM (see docs/feasibility-coach.md).
 */
function resolveModelPath(): string | undefined {
  if (process.env.BW_LLM_MODEL) return process.env.BW_LLM_MODEL;
  const dir = path.join(app.getPath('userData'), 'models');
  const installed = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  const file = pickModelFile(installed, os.totalmem());
  return file && path.join(dir, file);
}

let worker: UtilityProcess | null = null;
let inFlightId: string | null = null;

export function generateLLM(request: LLMRequest, emit: (e: LLMEvent) => void) {
  const modelPath = resolveModelPath();
  if (!modelPath || !fs.existsSync(modelPath)) {
    emit({
      type: 'error',
      id: request.id,
      message: 'No model that fits this computer is installed.',
    });
    return;
  }
  if (!worker) {
    worker = utilityProcess.fork(workerPath, [modelPath], {
      serviceName: 'BrainWaves LLM',
    });
    worker.on('message', (event: LLMEvent) => {
      if (
        (event.type === 'done' || event.type === 'error') &&
        event.id === inFlightId
      ) {
        inFlightId = null;
      }
      emit(event);
    });
    worker.on('exit', (code) => {
      worker = null;
      if (inFlightId) {
        emit({
          type: 'error',
          id: inFlightId,
          message: `LLM process exited (${code})`,
        });
        inFlightId = null;
      }
    });
  }
  inFlightId = request.id;
  worker.postMessage({ type: 'generate', ...request });
}

export function abortLLM() {
  inFlightId = null;
  worker?.postMessage({ type: 'abort' });
}

export function stopLLM() {
  worker?.kill();
  worker = null;
}
