import path from 'pathe';
import patchesPy from './patches.py?raw';
import utilsPy from './utils.py?raw';
import { CONDITION_PALETTE_RGB } from '../eeg/conditionPalette';

// ---------------------------------
// This file contains the JS functions that allow the app to access python-wasm through pyodide
// These functions wrap the python strings defined in the
// Python source files (loaded as raw strings via Vite's ?raw import)

// -----------------------------
// Imports and Utility functions

export const loadPyodide = async () => {
  // Module worker — required for Pyodide 0.26+ which ships pyodide.mjs as ESM.
  const freshWorker = new Worker(new URL('./webworker.js', import.meta.url), {
    type: 'module',
  });
  return freshWorker;
};

export const loadPatches = async (worker: Worker) =>
  worker.postMessage({
    data: patchesPy,
  });

export const applyPatches = async (worker: Worker) =>
  worker.postMessage({
    data: `apply_patches()`,
  });

export const loadUtils = async (worker: Worker) =>
  worker.postMessage({
    data: utilsPy,
    plotKey: 'ready',
  });

export const loadCSV = async (worker: Worker, csvArray: Array<unknown>) => {
  // TODO: Pass attached variable name as parameter to load_data
  await worker.postMessage({ data: `raw = load_data()`, csvArray });
};

// ---------------------------
// MNE-Related Data Processing

export const loadCleanedEpochs = (
  worker: Worker,
  memfsPaths: string[],
  fsFiles: Array<{ path: string; bytes: Uint8Array }>
) => {
  worker.postMessage({
    fsFiles,
    data: [
      `clean_epochs = concatenate_epochs([read_epochs(file) for file in ${JSON.stringify(memfsPaths)}])`,
      `conditions = OrderedDict({key: [value] for (key, value) in clean_epochs.event_id.items()})`,
    ].join('\n'),
  });
};

// .fif epochs live on the host OS filesystem, which Pyodide's WASM FS can't
// reach. Read the bytes via IPC and stage them at /tmp/<name> in MEMFS; the
// worker writes `fsFiles` into MEMFS before running the read_epochs Python.
export const writeEpochsToMemfs = async (
  filePaths: string[]
): Promise<{
  memfsPaths: string[];
  fsFiles: Array<{ path: string; bytes: Uint8Array }>;
}> => {
  const memfsPaths: string[] = [];
  const fsFiles: Array<{ path: string; bytes: Uint8Array }> = [];
  for (const filePath of filePaths) {
    const bytes: Uint8Array =
      await window.electronAPI.readFileAsBytes(filePath);
    const memfsPath = `/tmp/${path.basename(filePath)}`;
    memfsPaths.push(memfsPath);
    fsFiles.push({ path: memfsPath, bytes });
  }
  return { memfsPaths, fsFiles };
};

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = async (
  worker: Worker,
  lowCutoff: number,
  highCutoff: number
) =>
  worker.postMessage({
    data: `raw.filter(${lowCutoff}, ${highCutoff}, method='iir');`,
  });

export const epochEvents = async (
  worker: Worker,
  eventIDs: { [k: string]: number },
  tmin: number,
  tmax: number,
  reject?: string[] | 'None'
) =>
  worker.postMessage({
    data: [
      `event_id = ${JSON.stringify(eventIDs)}`,
      `tmin=${tmin}`,
      `tmax=${tmax}`,
      // Emit a valid Python literal: a reject dict, or None. Interpolating an
      // undefined `reject` directly produced `reject = undefined` (a NameError
      // that silently broke epoching whenever no reject was passed).
      `reject = ${reject && reject !== 'None' ? JSON.stringify(reject) : 'None'}`,
      // Epoching lives in get_raw_epochs() (webworker/utils.py) so the in-app
      // analysis and the native-MNE validation tests share one implementation.
      `raw_epochs = get_raw_epochs(raw, event_id, tmin, tmax, reject=reject)`,
      `conditions = OrderedDict({key: [value] for (key, value) in raw_epochs.event_id.items()})`,
    ].join('\n'),
  });

export const requestEpochsInfo = (worker: Worker, variableName: string) => {
  // Fire-and-forget: the result comes back on the worker message channel,
  // tagged with dataKey, and pyodideMessageEpic routes it to SetEpochInfo.
  worker.postMessage({
    data: `get_epochs_info(${variableName})`,
    dataKey: 'epochsInfo',
  });
};

export const requestChannelInfo = (worker: Worker) => {
  worker.postMessage({
    data: `[ch for ch in clean_epochs.ch_names if ch != 'Marker']`,
    dataKey: 'channelInfo',
  });
};

// Fetch epoch data arrays for the interactive reviewer. get_epochs_arrays writes
// a float32 buffer to a MEMFS path and returns metadata; the worker reads the
// buffer back (readFileAfter) and posts it zero-copy on dataKey 'epochArrays'.
export const requestEpochArrays = (worker: Worker, variableName: string) => {
  const outPath = '/tmp/epoch_arrays.f32';
  worker.postMessage({
    data: `get_epochs_arrays(${variableName}, "${outPath}")`,
    dataKey: 'epochArrays',
    readFileAfter: outPath,
  });
};

// Apply the user's rejection to raw_epochs in Python: drop the marked epoch
// indices + set bad channels, mutating in place. Trailing ';' suppresses the
// return value — apply_rejection returns the Epochs object, which cannot cross
// postMessage (PyProxy is not structured-cloneable). Fire-and-forget; the epic
// then triggers saveEpochs + requestEpochArrays, which the worker runs in order.
export const applyRejection = (
  worker: Worker,
  variableName: string,
  dropIndices: number[],
  badChannels: string[]
) => {
  worker.postMessage({
    data: `apply_rejection(${variableName}, ${JSON.stringify(dropIndices)}, ${JSON.stringify(badChannels)});`,
  });
};

// -----------------------------
// Plot functions

export const cleanEpochsPlot = async (worker: Worker) => {
  await worker.postMessage({
    // MNE 1.x validates `events` as bool|ndarray — events=None raises TypeError;
    // False is the "no events overlaid" default. Also close the returned Figure
    // so the worker doesn't try to structuredClone a PyProxy back (this plot is
    // not routed to the UI; wiring it to a plotKey would be a separate feature).
    data: [
      `_fig = raw_epochs.plot(scalings='auto', n_epochs=6, title="Clean Data", events=False)`,
      `plt.close(_fig)`,
    ].join('\n'),
  });
};

export const plotPSD = async (worker: Worker) => {
  worker.postMessage({
    plotKey: 'psd',
    data: [
      'import io',
      '_fig = raw.compute_psd(fmin=1, fmax=30).plot(show=False)',
      '_buf = io.BytesIO()',
      '_fig.savefig(_buf, format="svg", bbox_inches="tight")',
      'plt.close(_fig)',
      '_buf.getvalue().decode()',
    ].join('\n'),
  });
};

export const plotTopoMap = async (worker: Worker) => {
  worker.postMessage({
    plotKey: 'topo',
    data: [
      'import io',
      `_fig = plot_topo(clean_epochs, conditions, palette=${JSON.stringify(CONDITION_PALETTE_RGB)})`,
      '_buf = io.BytesIO()',
      '_fig.savefig(_buf, format="svg", bbox_inches="tight")',
      'plt.close(_fig)',
      '_buf.getvalue().decode()',
    ].join('\n'),
  });
};

export const plotTestPlot = async (worker: Worker | null) => {
  if (!worker) return;
  worker.postMessage({
    plotKey: 'topo',
    data: [
      'import io',
      'import matplotlib.pyplot as plt',
      '_fig, _ax = plt.subplots()',
      '_ax.plot([1, 2, 3, 4], [1, 4, 2, 3])',
      '_ax.set_title("Test Plot")',
      '_buf = io.BytesIO()',
      '_fig.savefig(_buf, format="svg", bbox_inches="tight")',
      'plt.close(_fig)',
      '_buf.getvalue().decode()',
    ].join('\n'),
  });
};

export const plotERP = async (worker: Worker, channelIndex: number) => {
  worker.postMessage({
    plotKey: 'erp',
    data: [
      'import io',
      `_fig, _ = plot_conditions(clean_epochs, ch_ind=${channelIndex}, conditions=conditions, ci=97.5, n_boot=1000, title='', diff_waveform=None, palette=${JSON.stringify(CONDITION_PALETTE_RGB)})`,
      '_buf = io.BytesIO()',
      '_fig.savefig(_buf, format="svg", bbox_inches="tight")',
      'plt.close(_fig)',
      '_buf.getvalue().decode()',
    ].join('\n'),
  });
};

// Cleaned epochs are saved into the worker's in-memory MEMFS, then read back and
// shipped to the renderer (dataKey 'savedEpochs') which writes them to host disk
// via the fs:writeCleanedEpochs IPC bridge — Pyodide's FS can't reach host paths.
export const saveEpochs = (worker: Worker, subject: string) => {
  const memfsPath = `/tmp/${subject}-cleaned-epo.fif`;
  worker.postMessage({
    data: `raw_epochs.save("${memfsPath}", overwrite=True)`,
    dataKey: 'savedEpochs',
    readFileAfter: memfsPath,
  });
};
