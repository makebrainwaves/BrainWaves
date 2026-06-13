# Pyodide Analysis Workflow — Fix Plan

**Review date:** 2026-03-15
**Reviewer:** Claude Code (plan-eng-review)
**Base branch:** `main`
**Coworker branch:** `teonbrooks/pyodide-upgrade` (fetch from `git@github.com:teonbrooks/BrainWaves.git`)

---

## Context

Analysis workflow (EEG data → Pyodide → plots) was completely broken due to stacked bugs.
`teonbrooks/pyodide-upgrade` has QA'd Pyodide loading in-browser and addressed infrastructure issues.
This plan documents what that branch resolves and what still needs to be applied on top.

---

## What `teonbrooks/pyodide-upgrade` has already fixed

| Bug | Status |
|-----|--------|
| Pyodide from npm (0.29.3), ESM worker, `import { loadPyodide }` | ✅ Done |
| Local HTTP asset server (port 17173) to serve .whl files past Vite SPA fallback | ✅ Done |
| Vite `serve-pyodide-assets` dev middleware | ✅ Done |
| `patches.py` Pyolite relative import — removed `patch_matplotlib` entirely; MPLBACKEND set in worker init | ✅ Done |
| `csvArray` scope — now passed in message context, not on `window` | ✅ Done |
| Inverted error toast (`if (results && !error)`) — fixed | ✅ Done |
| `plotKey` routing in worker + `pyodideMessageEpic` — plots routed directly to Redux slots | ✅ Done |
| SVG output for all plots (PSD, Topo, ERP, test) | ✅ Done |
| `plotTopoMap` restored in `index.ts` (SVG version) | ✅ Done |
| Directory renamed: `utils/pyodide/` → `utils/webworker/` | ✅ Done |
| New IPC handlers: `fs:storePyodideImageSvg`, `fs:storePyodideImagePng` | ✅ Done |

---

## What still needs to be fixed (apply on top of teonbrooks branch)

### CRITICAL — analysis data pipeline still broken

#### 1. `requestEpochsInfo` / `requestChannelInfo` still return `void`
**File:** `src/renderer/utils/webworker/index.ts`
**Epics affected:** `getEpochsInfoEpic`, `getChannelInfoEpic`

`worker.postMessage()` returns `void`. Both functions `await worker.postMessage(...)`, getting `undefined`.
The epic then calls `.map()` on `undefined` → throws.

**Fix approach:** Extend the `plotKey` pattern with a `dataKey` for data-returning calls.
Worker sends `{ results, dataKey }`. `pyodideMessageEpic` routes `dataKey: 'epochsInfo'` →
`SetEpochInfo`, `dataKey: 'channelInfo'` → `SetChannelInfo`.
Update `loadEpochsEpic` and `loadCleanedEpochsEpic` to use `dataKey` in the message.

```
loadEpochsEpic flow (fixed):
  LoadEpochs action
  → loadCSV (fire-and-forget, no return needed)
  → filterIIR (fire-and-forget)
  → epochEvents (fire-and-forget)
  → worker.postMessage({ data: 'get_epochs_info(raw_epochs)', dataKey: 'epochsInfo' })
     └─ worker responds { results: [...], dataKey: 'epochsInfo' }
        └─ pyodideMessageEpic routes → SetEpochInfo
  → loadEpochsEpic emits EMPTY (like plot epics)
```

#### 2. `launchEpic` race condition
**File:** `src/renderer/epics/pyodideEpics.ts`

`loadPatches`, `applyPatches`, `loadUtils` all fire simultaneously in `tap()`.
Even with patches.py simplified, `applyPatches()` can still NameError if patches.py hasn't
finished running.

**Fix:** Make `launchEpic` dispatch `SetPyodideWorker` only after `loadUtils` signals ready via
the existing `plotKey: 'ready'` mechanism. The epic should wait for `SetWorkerReady` before
completing, not fire-and-forget in tap.

OR: simpler — sequence the init via `mergeMap(async (worker) => { ... await run each step ... })`.
The `plotKey: 'ready'` approach is also fine if the app gates analysis on `workerReady` state.

#### 3. `loadTopoEpic` still uses `plotTestPlot`, not `plotTopoMap`
**File:** `src/renderer/epics/pyodideEpics.ts:239`
The `plotTopoMap` function exists in `index.ts` (SVG version). The epic still calls `plotTestPlot`.
One-line fix: `tap(() => plotTopoMap(state$.value.pyodide.worker!))`.

### SIGNIFICANT — bugs that cause silent failures

#### 4. `saveEpochs` missing closing parenthesis
**File:** `src/renderer/utils/webworker/index.ts` (saveEpochs function)

Generated Python: `raw_epochs.save("/path/to/file"` — SyntaxError, no closing `)`.
Fix: add `)` before the closing backtick of the template literal.

#### 5. `loadCleanedEpochs` passes OS paths to WASM filesystem
**File:** `src/renderer/utils/webworker/index.ts` (loadCleanedEpochs function)

`read_epochs(file)` receives `/Users/dano/BrainWaves_Workspaces/.../subj-cleaned-epo.fif`.
Pyodide's WASM filesystem has no access to host OS paths → `FileNotFoundError`.

**Fix:** Read `.fif` file bytes via IPC (`window.electronAPI.readFile(path)` returning `Uint8Array`),
write to Pyodide MEMFS via `pyodide.FS.writeFile('/tmp/subj.fif', bytes)`, pass `/tmp/subj.fif`
to `read_epochs`. Requires:
- New IPC handler: `fs:readFileAsBytes` in `src/main/index.ts`
- New helper in `index.ts`: `writeEpochsToMemfs(worker, filePaths)`
- Update `loadCleanedEpochs` to use MEMFS paths

#### 6. Channel index 0 falsy bug
**File:** `src/renderer/epics/pyodideEpics.ts:268`

```typescript
if (index) { return index; }  // 0 is falsy → first channel always wrong
```
Fix: `if (index !== null)`.

#### 7. `renderAnalyzeButton` drop threshold inverted
**File:** `src/renderer/components/CleanComponent/index.tsx:131`

```typescript
if (drop && typeof drop === 'number' && drop >= 2) {  // shows button when data is bad
```
Fix: show button when `epochsInfo !== null` (any loaded data). User sees the drop % and
can judge themselves.

### MINOR — API compatibility

#### 8. `raw.plot_psd()` deprecated MNE API
**File:** `src/renderer/utils/webworker/index.ts` (plotPSD function)

`raw.plot_psd(fmin=1, fmax=30, show=False)` was deprecated in MNE 1.0 and removed in 1.2+.
Pyodide 0.29.3 ships MNE 1.x. Fix: `raw.compute_psd(fmin=1, fmax=30).plot(show=False)`.

---

## `SetWorkerReady` action — verify it exists
**File:** `src/renderer/actions/pyodideActions.ts`

`pyodideMessageEpic` references `PyodideActions.SetWorkerReady()`. Verify this action is defined.
If not, add it. Consider adding a `workerReady: boolean` field to `PyodideStateType` and gate
analysis dispatch on it.

---

## Data flow diagram (target state)

```
User clicks "Load Dataset" (CleanComponent)
  ↓
LoadEpochs action
  ↓
loadEpochsEpic:
  loadCSV({ data: 'raw = load_data()', csvArray }) → fire-and-forget
  filterIIR({ data: 'raw.filter(...)' })            → fire-and-forget
  epochEvents({ data: 'raw_epochs = Epochs(...)' })  → fire-and-forget
  worker.postMessage({ data: 'get_epochs_info(raw_epochs)', dataKey: 'epochsInfo' })
  mergeMap(() => EMPTY)
  ↓
pyodideMessageEpic receives { results: [...], dataKey: 'epochsInfo' }
  → SetEpochInfo([...]) → Redux state → CleanComponent re-renders stats

User clicks "Analyze Dataset" (always available when epochsInfo !== null)
  ↓
LoadCleanedEpochs action
  ↓
loadCleanedEpochsEpic:
  writeEpochsToMemfs(worker, filePaths)  → IPC read bytes → pyodide.FS.writeFile
  loadCleanedEpochs({ data: 'clean_epochs = concatenate_epochs(...)' })
  dispatch GetEpochsInfo, GetChannelInfo, LoadTopo
  ↓
Parallel:
  getEpochsInfoEpic → { dataKey: 'epochsInfo' } → SetEpochInfo
  getChannelInfoEpic → { dataKey: 'channelInfo' } → SetChannelInfo
  loadTopoEpic → plotTopoMap({ plotKey: 'topo' }) → worker → SetTopoPlot(svg)

User selects channel → LoadERP(channelName)
  ↓
loadERPEpic: index lookup (if (index !== null)) → plotERP({ plotKey: 'erp' })
  → worker → SetERPPlot(svg) → AnalyzeComponent renders via PyodidePlotWidget
```

---

## Files to change

| File | Changes |
|------|---------|
| `src/renderer/utils/webworker/index.ts` | saveEpochs closing paren; plotPSD API; loadCleanedEpochs MEMFS |
| `src/renderer/epics/pyodideEpics.ts` | dataKey routing for epochs/channel info; launch sequencing; loadTopoEpic; channel index 0 |
| `src/renderer/components/CleanComponent/index.tsx` | renderAnalyzeButton condition |
| `src/renderer/actions/pyodideActions.ts` | Verify/add SetWorkerReady, ReceiveError(string) |
| `src/main/index.ts` | Add `fs:readFileAsBytes` IPC handler |
| `src/renderer/utils/webworker/webworker.js` | Add `dataKey` passthrough (similar to existing `plotKey`) |

---

## Tests to write

- `__tests__/pyodideWorker.test.ts` — dataKey routing (mock worker, verify SetEpochInfo dispatched)
- `__tests__/pyodideEpics.test.ts` — launch sequencing, loadEpochsEpic chain, channel index 0 fix
- `__tests__/pyodideIndex.test.ts` — Python code string generation: saveEpochs has correct syntax, plotPSD uses correct MNE API

---

## NOT in scope

- Worker health monitoring / auto-restart on crash
- Cancellation of in-progress analysis
- Progress callbacks
- MNE/pandas version upgrades beyond what Pyodide 0.29.3 ships

---

## TODO (deferred)

- Pyodide integration test suite: load real Pyodide + MNE in Node/jsdom, run known-good CSV
  through the analysis pipeline, verify output shape. High value but non-trivial setup.
  Blocked by: Jest/Vitest compatibility with WASM workers.
