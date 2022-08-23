from glob import glob
import os
from time import time, strftime, gmtime
from collections import OrderedDict

import numpy as np
from matplotlib import pyplot as plt
import pandas as pd  # maybe we can remove this dependency
# import seaborn as sns

from mne import (Epochs, concatenate_raws, concatenate_epochs, create_info,
                 find_events, read_epochs, set_eeg_reference, viz)
from mne.io import RawArray
from io import StringIO


# plt.style.use(fivethirtyeight)

# sns.set_context('talk')
# sns.set_style('white')


def load_data(sfreq=128., replace_ch_names=None):
    """Load CSV files from the /data directory into a RawArray object.

    Parameters
    ----------

    sfreq : float
        EEG sampling frequency
    replace_ch_names : dict | None
        A dict containing a mapping to rename channels.
        Useful when an external electrode was used during recording.

    Returns
    -------
    raw : an instance of mne.io.RawArray
        The loaded data.
    """
    ## js is loaded in loadPackages
    ## TODO: Received attached variable name
    raw = []
    for csv in js.csvArray:
        string_io = StringIO(csv)
        # read the file
        data = pd.read_csv(string_io, index_col=0)

        data = data.dropna()

        # get estimation of sampling rate and use to determine sfreq
        # yes, this could probably be improved
        srate = 1000 / (data.index.values[1] - data.index.values[0])
        if srate >= 200:
            sfreq = 256
        else:
            sfreq = 128

        # name of each channel
        ch_names = list(data.columns)

        # indices of each channel
        ch_ind = list(range(len(ch_names)))

        if replace_ch_names is not None:
            ch_names = [c if c not in replace_ch_names.keys()
                        else replace_ch_names[c] for c in ch_names]

        # type of each channels
        ch_types = ['eeg'] * (len(ch_ind) - 1) + ['stim']

        # get data and exclude Aux channel
        data = data.values[:, ch_ind].T

        # create MNE object
        info = create_info(ch_names=ch_names, ch_types=ch_types,
                           sfreq=sfreq)
        raw.append(RawArray(data=data, info=info).set_montage('standard_1005'))

    # concatenate all raw objects
    raws = concatenate_raws(raw)

    return raws


def plot_topo(epochs, conditions=OrderedDict()):
    # palette = sns.color_palette("hls", len(conditions) + 1)
    # temp hack, just pull in the color palette from seaborn
    palette = [(0.85999999999999999, 0.37119999999999997, 0.33999999999999997),
               (0.33999999999999997, 0.85999999999999999, 0.37119999999999997),
               (0.37119999999999997, 0.33999999999999997, 0.85999999999999999)]
    evokeds = [epochs[name].average() for name in (conditions)]

    evoked_topo = viz.plot_evoked_topo(
        evokeds, vline=None, color=palette[0:len(conditions)], show=False)
    evoked_topo.patch.set_alpha(0)
    evoked_topo.set_size_inches(10, 8)
    for axis in evoked_topo.axes:
        for line in axis.lines:
            line.set_linewidth(2)

    legend_loc = 0
    labels = [e.comment if e.comment else 'Unknown' for e in evokeds]
    legend = plt.legend(labels, loc=legend_loc, prop={'size': 20})
    txts = legend.get_texts()
    for txt, col in zip(txts, palette):
        txt.set_color(col)

    return evoked_topo


def plot_conditions(epochs, ch_ind=0, conditions=OrderedDict(), ci=97.5,
                    n_boot=1000, title='', palette=None, diff_waveform=(4, 3)):
    """Plot Averaged Epochs with ERP conditions.

    Parameters
    ----------
    epochs : an instance of mne.epochs
        EEG epochs
    conditions : an instance of OrderedDict
        An ordered dictionary that contains the names of the
        conditions to plot as keys, and the list of corresponding marker
        numbers as value.

        E.g.,

        conditions = {'Non-target': [0, 1],
                      'Target': [2, 3, 4]}

        ch_ind : int
            An index of channel to plot data from.
        ci : float
            The confidence interval of the measurement within
            the range [0, 100].
        n_boot : int
            Number of bootstrap samples.
        title : str
            Title of the figure.
        palette : list
            Color palette to use for conditions.
        ylim : tuple
            (ymin, ymax)
        diff_waveform : tuple | None
            tuple of ints indicating which conditions to subtract for
            producing the difference waveform.
            If None, do not plot a difference waveform

    Returns
    -------
    fig : an instance of matplotlib.figure.Figure
        A figure object.
    ax : list of matplotlib.axes._subplots.AxesSubplot
        A list of axes
    """
    if isinstance(conditions, dict):
        conditions = OrderedDict(conditions)

    if palette is None:
        palette = sns.color_palette("hls", len(conditions) + 1)

    X = epochs.get_data()
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

    # Round y axis tick labels to 2 decimal places
    # ax.yaxis.set_major_formatter(FormatStrFormatter('%.2f'))

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

    fig.set_size_inches(10, 8)

    return fig, ax

def get_epochs_info(epochs):
    print('Get Epochs Info:')
    return [*[{x: len(epochs[x])} for x in epochs.event_id],
            {"Drop Percentage": round((1 - len(epochs.events) /
                                       len(epochs.drop_log)) * 100, 2)},
            {"Total Epochs": len(epochs.events)}]
