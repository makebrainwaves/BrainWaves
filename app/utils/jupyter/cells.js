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
  subject: string,
  session: number,
  data_dir: string,
  sfreq: number = 128.0,
  ch_ind: Array<number>,
  stim_ind: number,
  replace_ch_names: ?Array<string> | string = "None"
) =>
  `raw = utils.load_data("${data_dir}", "${subject}", ${session}, ${sfreq}, [${ch_ind.toString()}], ${stim_ind}, ${replace_ch_names})`;

export const filterIIR = (low_cutoff: number, high_cutoff: number) =>
  `raw.filter(${low_cutoff}, ${high_cutoff}, method='iir')`;

export const plotPSD = () => "raw.plot_psd()";

export const epochEvents = (
  event_id: { [string]: number },
  tmin: number,
  tmax: number,
  reject?: Array<string> = "None"
) =>
  [
    "events = find_events(raw)",
    `epochs = Epochs(raw, events=events, event_id=${event_id}, 
                    tmin=${tmin}, tmax=${tmax}, baseline=(${tmin},${tmax}), reject=${reject}, preload=True, 
                    verbose=False, picks=None)`
  ].join("\n");

export const plotERP = (ch_ind: number, event_id: { [string]: number }) => [
  `conditions = OrderedDict({key: [value] for (key, value) in ${event_id}.items()})``X, y = utils.plot_conditions(epochs, ch_ind=${ch_ind}, conditions=conditions, 
    ci=97.5, n_boot=1000, title='',)`
];
