import * as path from "path";
import { readFileSync } from "fs";
import {
  DEVICES,
  EMOTIV_CHANNELS,
  MUSE_CHANNELS
} from "../../constants/constants";

export const imports = () =>
  [
    "from mne import Epochs, find_events, set_eeg_reference",
    "from time import time, strftime, gmtime",
    "import os",
    "from collections import OrderedDict",
    "from glob import glob",
    "from mne import create_info, concatenate_raws",
    "from mne.io import RawArray",
    "from mne.io import RawArray",
    "from mne.channels import read_montage",
    "import pandas as pd",
    "import numpy as np",
    "import seaborn as sns",
    "from matplotlib import pyplot as plt"
  ].join("\n");

export const utils = () =>
  readFileSync(path.join(__dirname, "/utils/jupyter/utils.py"), "utf8");

export const loadCSV = (
  filePathArray: Array<{ name: string, dir: string }>,
  deviceType: DEVICES
) =>
  [
    `files = ${formatFilePaths(filePathArray)}`,
    `sfreq = ${deviceType === DEVICES.EMOTIV ? 128.0 : 256.0}`,
    `ch_ind = [${
      deviceType === DEVICES.EMOTIV
        ? EMOTIV_CHANNELS.map((_, i) => i).toString()
        : MUSE_CHANNELS.slice(0, MUSE_CHANNELS.length - 1)
            .map((_, i) => i)
            .toString()
    }]`,
    `stim_ind = ${
      deviceType === DEVICES.EMOTIV
        ? EMOTIV_CHANNELS.length
        : MUSE_CHANNELS.length
    }`,
    `replace_ch_names = None`,
    `raw = load_data(files, sfreq, ch_ind, stim_ind, replace_ch_names)`
  ].join("\n");

export const loadCSVWithAux = (
  filePathArray: Array<{ name: string, dir: string }>,
  auxChannel: string
) =>
  [
    `files = ${formatFilePaths(filePathArray)}`,
    `sfreq = ${deviceType === DEVICES.EMOTIV ? 128.0 : 256.0}`,
    `ch_ind = [${MUSE_CHANNELS.map((_, i) => i).toString()}]`,
    `stim_ind = ${MUSE_CHANNELS.length}`,
    `replace_ch_names = {'Right AUX': ${auxChannel}`,
    `raw = load_data(files, sfreq, ch_ind, stim_ind, replace_ch_names)`
  ].join("\n");

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = (low_cutoff: number, high_cutoff: number) =>
  `raw.filter(${low_cutoff}, ${high_cutoff}, method='iir');`;

export const cleanEpochsPlot = () =>
  [
    `%matplotlib`,
    `epochs.plot(scalings='auto')`,
    `fig = plt.gcf()`,
    `fig.canvas.manager.window.activateWindow()`,
    `fig.canvas.manager.window.raise_()`
  ].join("\n");

export const plotPSD = () => "raw.plot_psd()";

export const epochEvents = (
  event_ids: { [string]: number },
  tmin: number,
  tmax: number,
  reject?: Array<string> | string = "None"
) => {
  const command = [
    `event_ids = ${JSON.stringify(event_ids)}`,
    `tmin=${tmin}`,
    `tmax=${tmax}`,
    `baseline= (tmin, tmax)`,
    `picks = None`,
    `reject = ${reject}`,
    "events = find_events(raw)",
    `epochs = Epochs(raw, events=events, event_id=event_ids, 
                    tmin=tmin, tmax=tmax, baseline=baseline, reject=reject, preload=True, 
                    verbose=False, picks=picks)`
  ].join("\n");
  return command;
};

export const requestEpochsInfo = () =>
  `get_epochs_info(epochs, events, event_ids)`;

export const plotERP = (ch_ind: number) =>
  [
    `conditions = OrderedDict({key: [value] for (key, value) in event_ids.items()})`,
    `X, y = plot_conditions(epochs, ch_ind=${ch_ind}, conditions=conditions, 
    ci=97.5, n_boot=1000, title='')`
  ].join("\n");

// -------------------------------------------
// Helper methods

const formatFilePaths = (filePathArray: Array<{ name: string, dir: string }>) =>
  `[${filePathArray.map(
    filepath => `"${path.join(filepath.dir, filepath.name)}"`
  )}]`.replace(/\\/g, "/");
