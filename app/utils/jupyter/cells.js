import * as path from 'path';
import { readFileSync } from 'fs';

export const imports = () =>
  [
    'from mne import Epochs, find_events, set_eeg_reference, read_epochs, concatenate_epochs',
    'from time import time, strftime, gmtime',
    'import os',
    'from collections import OrderedDict',
    'from glob import glob',
    'from mne import create_info, concatenate_raws',
    'from mne.io import RawArray',
    'from mne.io import RawArray',
    'from mne.channels import read_montage',
    'import pandas as pd',
    'import numpy as np',
    'import seaborn as sns',
    'from matplotlib import pyplot as plt',
    "plt.style.use('fivethirtyeight')",
  ].join('\n');

export const utils = () => readFileSync(path.join(__dirname, '/utils/jupyter/utils.py'), 'utf8');

export const loadCSV = (filePathArray: Array<string>) =>
  [
    `files = [${filePathArray.map((filePath) => formatFilePath(filePath))}]`,
    `replace_ch_names = None`,
    `raw = load_data(files, replace_ch_names)`,
  ].join('\n');

export const loadCleanedEpochs = (filePathArray: Array<string>) =>
  [
    `files = [${filePathArray.map((filePath) => formatFilePath(filePath))}]`,
    `clean_epochs = concatenate_epochs([read_epochs(file) for file in files])`,
    `conditions = OrderedDict({key: [value] for (key, value) in clean_epochs.event_id.items()})`,
  ].join('\n');

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = (lowCutoff: number, highCutoff: number) =>
  `raw.filter(${lowCutoff}, ${highCutoff}, method='iir');`;

export const plotPSD = () => [`%matplotlib inline`, `raw.plot_psd(fmin=1, fmax=30)`].join('\n');

export const epochEvents = (
  eventIDs: { [string]: number },
  tmin: number,
  tmax: number,
  reject?: Array<string> | string = 'None'
) => {
  const IDs = Object.keys(eventIDs).filter(k => k !== "").reduce((res,key) => (res[key] = eventIDs[key], res), {} )
  const command = [
    `event_id = ${JSON.stringify(IDs)}`,
    `tmin=${tmin}`,
    `tmax=${tmax}`,
    `baseline= (tmin, tmax)`,
    `picks = None`,
    `reject = ${reject}`,
    'events = find_events(raw)',
    `raw_epochs = Epochs(raw, events=events, event_id=event_id,
                      tmin=tmin, tmax=tmax, baseline=baseline, reject=reject, preload=True,
                      verbose=False, picks=picks)`,
    `conditions = OrderedDict({key: [value] for (key, value) in raw_epochs.event_id.items()})`,
  ].join('\n');
  return command;
};

export const requestEpochsInfo = (variableName: string) => `get_epochs_info(${variableName})`;

export const requestChannelInfo = () => `[ch for ch in clean_epochs.ch_names if ch != 'Marker']`;

export const cleanEpochsPlot = () =>
  [
    `%matplotlib`,
    `raw_epochs.plot(scalings='auto', n_epochs=6, title="Clean Data", events=None)`,
  ].join('\n');

export const plotTopoMap = () =>
  [`%matplotlib inline`, `plot_topo(clean_epochs, conditions)`].join('\n');

export const plotERP = (channelIndex: number) =>
  [
    `%matplotlib inline`,
    `X, y = plot_conditions(clean_epochs, ch_ind=${channelIndex}, conditions=conditions,
    ci=97.5, n_boot=1000, title='', diff_waveform=None)`,
  ].join('\n');

export const saveEpochs = (workspaceDir: string, subject: string) =>
  `raw_epochs.save(${formatFilePath(
    path.join(workspaceDir, 'Data', subject, 'EEG', `${subject}-cleaned-epo.fif`)
  )})`;

// -------------------------------------------
// Helper methods

const formatFilePath = (filePath: string) => `"${filePath.replace(/\\/g, '/')}"`;
