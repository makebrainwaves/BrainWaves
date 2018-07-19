import * as path from "path";

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

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = (low_cutoff: number, high_cutoff: number) =>
  `raw.filter(${low_cutoff}, ${high_cutoff}, method='iir');`;

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
                    verbose=False, picks=picks)`,
    `{"totalEpochs": len(epochs.events), "dropPercentage": (1 - len(epochs.events)/len(events)) * 100, **{x: len(epochs[x]) for x in event_ids}}`
  ].join("\n");
  console.log(command);
  return command;
};

export const plotERP = (ch_ind: number) =>
  [
    `conditions = OrderedDict({key: [value] for (key, value) in event_ids.items()})`,
    `X, y = utils.plot_conditions(epochs, ch_ind=${ch_ind}, conditions=conditions, 
    ci=97.5, n_boot=1000, title='')`
  ].join("\n");

// -------------------------------------------
// Helper methods

const formatFilePaths = (filePathArray: Array<{ name: string, dir: string }>) =>
  `[${filePathArray.map(
    filepath => `"${path.join(filepath.dir, filepath.name)}"`
  )}]`.replace(/\\/g, "/");
