import * as path from "path";
import { setFlagsFromString } from "v8";

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
    "from matplotlib import pyplot as plt",
    "os.chdir('jupyter')", // Hacky
    "from utils import utils"
  ].join("\n");

export const loadCSV = (
  filePathArray: Array<{ name: string, dir: string }>,
  sfreq: number = 128.0,
  ch_ind: Array<number>,
  stim_ind: number,
  replace_ch_names: ?Array<string> | string = "None"
) =>
  [
    `files = ${formatFilePaths(filePathArray)}`,
    `sfreq = ${sfreq}`,
    `ch_ind = [${ch_ind.toString()}]`,
    `stim_ind = ${stim_ind}`,
    `replace_ch_names = ${replace_ch_names}`,
    `raw = utils.load_data(files, sfreq, ch_ind, stim_ind, replace_ch_names)`
  ].join("\n");

export const filterIIR = (low_cutoff: number, high_cutoff: number) =>
  `raw.filter(${low_cutoff}, ${high_cutoff}, method='iir')`;

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
  console.log(command);
  return command;
};

export const plotERP = (ch_ind: number, event_id: { [string]: number }) => [
  `conditions = OrderedDict({key: [value] for (key, value) in ${event_id}.items()})``X, y = utils.plot_conditions(epochs, ch_ind=${ch_ind}, conditions=conditions, 
    ci=97.5, n_boot=1000, title='',)`
];

// -------------------------------------------
// Helper methods

const formatFilePaths = (filePathArray: Array<{ name: string, dir: string }>) =>
  `[${filePathArray.map(
    filepath => `"${path.join(filepath.dir, filepath.name)}"`
  )}]`.replace(/\\/g, "/");
