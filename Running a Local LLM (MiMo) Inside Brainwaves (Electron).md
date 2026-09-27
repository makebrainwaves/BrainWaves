# Running a Local LLM (MiMo) Inside Brainwaves (Electron)

Sep 27, 2026 · @Dano

## Overview

Recommended path: run a quantized GGUF build of MiMo through llama.cpp, either via the `node-llama-cpp` bindings in an Electron utility process or as a bundled `llama-server` sidecar. The renderer never touches the model; it talks to it over IPC.

**Model choice.** Xiaomi's MiMo-7B family (Base, SFT, RL) is the realistic local target; larger MiMo releases are MoE models sized for servers, not laptops. MiMo is a reasoning model, so expect `<think>…</think>` blocks before the answer. Confirm the exact GGUF you pick loads in the llama.cpp version you ship, since architecture support lands release by release. Details here are from memory as of mid-2026, so check the Hugging Face model card and license before shipping.

**Hardware to plan for (approximate, 7B model):**

| Quantization | File size | RAM/VRAM needed | Notes |
| --- | --- | --- | --- |
| Q4\_K\_M | \~4.7 GB | \~6–7 GB | Best default for most users |
| Q5\_K\_M | \~5.4 GB | \~7–8 GB | Slightly better quality |
| Q8\_0 | \~8 GB | \~10 GB | Near-lossless, high-end machines only |

Apple Silicon (Metal) and NVIDIA (CUDA) machines run 7B comfortably; CPU-only works but is slow, roughly a few tokens per second.

## Architecture

Keep inference out of both the renderer and the main process: a stuck or crashing model must never freeze the UI or the app shell.

&#91;embedded content: Brainwaves process layout · 4 layers, 1 alternative\]

The renderer asks through a narrow preload API; main relays to a worker that owns the model. The dashed path is the sidecar alternative.

**Runtime options:**

| Option | How it works | Pick it when |
| --- | --- | --- |
| `node-llama-cpp` in a `utilityProcess` (recommended) | Native llama.cpp bindings, prebuilt for Metal, CUDA, Vulkan and CPU | You want one install, tight control, and JS-level streaming |
| Bundled `llama-server` sidecar | Ship the llama.cpp server binary; talk to it over localhost HTTP | You want an OpenAI-compatible API and process isolation for free |
| Ollama as a dependency | User installs Ollama; Brainwaves calls its local API | You accept an external install in exchange for less packaging work |

## Implementation

Five pieces: install, worker, main-process bridge, preload API, renderer. Code targets `node-llama-cpp` v3 and recent Electron; check both changelogs for API drift.

1. **Install the runtime.** `npm install node-llama-cpp`. It ships prebuilt binaries per platform and GPU backend, so most users need no compiler. It is ESM-only, so write the worker as `.mjs`.
2. **Write the inference worker** (`llm-worker.mjs`). It loads the model once, keeps a chat session, and streams chunks back to main.

```js
import { getLlama, LlamaChatSession } from "node-llama-cpp";

let session;

process.parentPort.on("message", async ({ data }) => {
  if (data.type === "load") {
    const llama = await getLlama();            // picks Metal/CUDA/Vulkan/CPU
    const model = await llama.loadModel({ modelPath: data.modelPath });
    const context = await model.createContext({ contextSize: 8192 });
    session = new LlamaChatSession({ contextSequence: context.getSequence() });
    process.parentPort.postMessage({ type: "ready" });
  }

  if (data.type === "prompt") {
    const controller = new AbortController();
    current = controller;
    try {
      const text = await session.prompt(data.text, {
        signal: controller.signal,
        onTextChunk: (chunk) =>
          process.parentPort.postMessage({ type: "chunk", id: data.id, chunk }),
      });
      process.parentPort.postMessage({ type: "done", id: data.id, text });
    } catch (err) {
      process.parentPort.postMessage({ type: "error", id: data.id, message: String(err) });
    }
  }

  if (data.type === "abort") current?.abort();
});

let current;
```

3. **Spawn and relay from main** (`main.js`). Use `utilityProcess`, not `child_process`, so Electron manages the worker's lifecycle.

```js
const { app, utilityProcess, ipcMain } = require("electron");
const path = require("node:path");

let worker;

function startWorker(win) {
  worker = utilityProcess.fork(path.join(__dirname, "llm-worker.mjs"));
  worker.postMessage({
    type: "load",
    modelPath: path.join(app.getPath("userData"), "models", "mimo-7b-q4_k_m.gguf"),
  });
  worker.on("message", (msg) => win.webContents.send("llm:event", msg));
  worker.on("exit", (code) => win.webContents.send("llm:event", { type: "crashed", code }));
}

ipcMain.on("llm:prompt", (_e, { id, text }) => worker.postMessage({ type: "prompt", id, text }));
ipcMain.on("llm:abort", () => worker.postMessage({ type: "abort" }));
app.on("before-quit", () => worker?.kill());
```

4. **Expose a narrow API in preload** (`preload.js`). Keep `contextIsolation: true` and `nodeIntegration: false`.

```js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("llm", {
  prompt: (id, text) => ipcRenderer.send("llm:prompt", { id, text }),
  abort: () => ipcRenderer.send("llm:abort"),
  onEvent: (cb) => {
    const handler = (_e, msg) => cb(msg);
    ipcRenderer.on("llm:event", handler);
    return () => ipcRenderer.removeListener("llm:event", handler);
  },
});
```

5. **Render the stream and split out reasoning.** MiMo emits its chain of thought in `<think>…</think>` before the answer. Buffer chunks, route text inside the tags to a collapsible "thinking" panel, and show the rest as the reply.

```js
let buf = "";
window.llm.onEvent((msg) => {
  if (msg.type !== "chunk") return;
  buf += msg.chunk;
  const end = buf.indexOf("</think>");
  const thinking = end === -1 ? buf.replace("<think>", "") : buf.slice(0, end).replace("<think>", "");
  const answer = end === -1 ? "" : buf.slice(end + 8);
  renderThinking(thinking.trim());
  renderAnswer(answer.trim());
});
```

If you choose the sidecar instead, step 2 becomes spawning `llama-server -m <model> --port <free port>` from main, and the renderer calls `http://127.0.0.1:<port>/v1/chat/completions` with `stream: true` through main. Bind to 127.0.0.1 only.

## Packaging and model delivery

Ship the runtime in the installer; download the model on first run. A 4–5 GB model inside the installer bloats every update.

- **Unpack native code from asar.** Native `.node` binaries and any `llama-server` executable cannot run from inside an asar archive. With electron-builder, add `"asarUnpack": ["**/node_modules/node-llama-cpp/**", "**/node_modules/@node-llama-cpp/**"]`, or the equivalent `unpack` option in Electron Forge.
- **Download on first run.** Fetch the GGUF from a URL you control or Hugging Face into `app.getPath("userData")/models`. Show progress, support resume via HTTP range requests, write to a `.part` file, and verify a SHA-256 checksum before renaming.
- **Check resources before loading.** Read `os.totalmem()` and free disk space; offer a smaller quantization when RAM is under about 8 GB.
- **Sign and notarize.** macOS requires signing every bundled binary, including unpacked native modules; Windows SmartScreen flags unsigned sidecar executables.
- **Build per platform.** Produce separate builds for macOS arm64/x64, Windows x64 and Linux x64 so each gets the right prebuilt backend. CUDA users may need the CUDA-enabled prebuilt; fall back to Vulkan or CPU when it fails to load.
- **Respect the license.** Include MiMo's license and attribution in the app's About or licenses screen.

## Pitfalls and checklist

Most failures come from loading in the wrong process, unbounded context, or unverified model files.

| Pitfall | Fix |
| --- | --- |
| UI freezes during generation | Never load the model in main or the renderer; use the utility process |
| Memory climbs across long chats | Cap `contextSize`; trim or summarize history; dispose contexts on reset |
| Thinking text leaks into answers | Parse `<think>` tags on the stream, not after completion |
| App hangs on quit | Kill the worker or sidecar in `before-quit` |
| Port clash with sidecar | Pick a free port at launch; bind 127.0.0.1 only |
| Corrupt download loads garbage | Verify SHA-256 before first load |

- [ ] Worker loads the chosen MiMo GGUF on macOS, Windows and Linux
- [ ] Streaming, abort and crash recovery work from the UI
- [ ] First-run download resumes and verifies checksums
- [ ] RAM check offers a smaller quantization on low-memory machines
- [ ] Native binaries unpacked from asar, signed and notarized
- [ ] MiMo license included in the app
