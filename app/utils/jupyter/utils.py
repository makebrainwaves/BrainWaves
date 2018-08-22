from glob import glob
import os
from collections import OrderedDict
from mne import create_info, concatenate_raws
from mne.io import RawArray
from mne.channels import read_montage
import pandas as pd
import numpy as np
import seaborn as sns
from matplotlib import pyplot as plt


sns.set_context('talk')
sns.set_style('white')


def load_csv_as_raw(filename, sfreq, ch_ind, stim_ind, replace_ch_names):
    """Load CSV files into a Raw object.

    Args:
        filename (str or list): path or paths to CSV files to load

    Keyword Args:
        sfreq (float): EEG sampling frequency
        ch_ind (list): indices of the EEG channels to keep
        stim_ind (int): index of the stim channel
        replace_ch_names (dict or None): dictionary containing a mapping to
            rename channels.

    Returns:
        (mne.io.array.array.RawArray): loaded EEG
    """
    n_channel = len(ch_ind)

    raw = []
    print(filename)
    for fname in filename:
        # read the file
        data = pd.read_csv(fname, index_col=0)

        # name of each channels
        ch_names = list(data.columns)[0:n_channel] + ['Stim']

        if replace_ch_names is not None:
            ch_names = [c if c not in replace_ch_names.keys()
                        else replace_ch_names[c] for c in ch_names]

        # type of each channels
        ch_types = ['eeg'] * n_channel + ['stim']
        montage = read_montage('standard_1005')

        # get data and exclude Aux channel
        data = data.values[:, ch_ind + [stim_ind]].T

        # create MNE object
        info = create_info(ch_names=ch_names, ch_types=ch_types,
                           sfreq=sfreq, montage=montage)
        raw.append(RawArray(data=data, info=info))

    # concatenate all raw objects
    raws = concatenate_raws(raw)

    return raws


def load_data(fnames, sfreq=128.,
              ch_ind=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
              stim_ind=14, replace_ch_names=None):
    """Load CSV files from the /data directory into a Raw object.

    Args:
        fnames (array): CSV filepaths from which to load data

    Keyword Args:
        sfreq (float): EEG sampling frequency
        ch_ind (list): indices of the EEG channels to keep
        stim_ind (int): index of the stim channel
        replace_ch_names (dict or None): dictionary containing a mapping to
            rename channels. Useful when an external electrode was used.

    Returns:
        (mne.io.array.array.RawArray): loaded EEG
    """

    return load_csv_as_raw(fnames, sfreq=sfreq, ch_ind=ch_ind,
                           stim_ind=stim_ind,
                           replace_ch_names=replace_ch_names)


def plot_conditions(epochs, ch_ind=0, conditions=OrderedDict(), ci=97.5, n_boot=1000,
                    title='', palette=None,
                    diff_waveform=(4, 3)):
    """Plot Averaged Epochs with ERP conditions.

    Args:
        epochs (mne.epochs): EEG epochs

    Keyword Args:
        conditions (OrderedDict): dictionary that contains the names of the
            conditions to plot as keys, and the list of corresponding marker
            numbers as value. E.g.,

                conditions = {'Non-target': [0, 1],
                               'Target': [2, 3, 4]}

        ch_ind (int): index of channel to plot data from
        ci (float): confidence interval in range [0, 100]
        n_boot (int): number of bootstrap samples
        title (str): title of the figure
        palette (list): color palette to use for conditions
        ylim (tuple): (ymin, ymax)
        diff_waveform (tuple or None): tuple of ints indicating which
            conditions to subtract for producing the difference waveform.
            If None, do not plot a difference waveform

    Returns:
        (matplotlib.figure.Figure): figure object
        (list of matplotlib.axes._subplots.AxesSubplot): list of axes
    """
    if isinstance(conditions, dict):
        conditions = OrderedDict(conditions)

    if palette is None:
        palette = sns.color_palette("hls", len(conditions) + 1)

    X = epochs.get_data() * 1e6
    times = epochs.times
    y = pd.Series(epochs.events[:, -1])
    fig, ax = plt.subplots()

    for cond, color in zip(conditions.values(), palette):
        sns.tsplot(X[y.isin(cond), ch_ind], time=times, color=color,
                   n_boot=n_boot, ci=ci)

    if diff_waveform:
        diff = (np.nanmean(X[y == diff_waveform[1], ch_ind], axis=0) -
                np.nanmean(X[y == diff_waveform[0], ch_ind], axis=0))
        ax.plot(times, diff, color='k', lw=1)

    ax.set_title(epochs.ch_names[ch_ind])
    ax.axvline(x=0, color='k', lw=1, label='_nolegend_')

    ax.set_xlabel('Time (s)')
    ax.set_ylabel('Amplitude (uV)')
    ax.set_xlabel('Time (s)')
    ax.set_ylabel('Amplitude (uV)')

    if diff_waveform:
        legend = (['{} - {}'.format(diff_waveform[1], diff_waveform[0])] +
                  list(conditions.keys()))
    else:
        legend = conditions.keys()
    ax.legend(legend)
    sns.despine()
    plt.tight_layout()

    if title:
        fig.suptitle(title, fontsize=20)

    return fig, ax


def plot_highlight_regions(x, y, hue, hue_thresh=0, xlabel='', ylabel='',
                           legend_str=()):
    """Plot a line with highlighted regions based on additional value.

    Plot a line and highlight ranges of x for which an additional value
    is lower than a threshold. For example, the additional value might be
    pvalues, and the threshold might be 0.05.

    Args:
        x (array_like): x coordinates
        y (array_like): y values of same shape as `x`

    Keyword Args:
        hue (array_like): values to be plotted as hue based on `hue_thresh`.
            Must be of the same shape as `x` and `y`.
        hue_thresh (float): threshold to be applied to `hue`. Regions for which
            `hue` is lower than `hue_thresh` will be highlighted.
        xlabel (str): x-axis label
        ylabel (str): y-axis label
        legend_str (tuple): legend for the line and the highlighted regions

    Returns:
        (matplotlib.figure.Figure): figure object
        (list of matplotlib.axes._subplots.AxesSubplot): list of axes
    """
    fig, axes = plt.subplots(1, 1, figsize=(10, 5), sharey=True)

    axes.plot(x, y, lw=2, c='k')
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)

    kk = 0
    a = []
    while kk < len(hue):
        if hue[kk] < hue_thresh:
            b = kk
            kk += 1
            while kk < len(hue):
                if hue[kk] > hue_thresh:
                    break
                else:
                    kk += 1
            a.append([b, kk - 1])
        else:
            kk += 1

    st = (x[1] - x[0]) / 2.0
    for p in a:
        axes.axvspan(x[p[0]]-st, x[p[1]]+st, facecolor='g', alpha=0.5)
    plt.legend(legend_str)
    sns.despine()

    return fig, axes
