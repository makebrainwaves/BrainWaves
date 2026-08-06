from collections import OrderedDict

import numpy as np
from matplotlib import pyplot as plt
import pandas as pd  # maybe we can remove this dependency

from mne import (concatenate_raws, create_info, viz, find_events, Epochs)
from mne.io import RawArray
from io import StringIO

# import seaborn as sns
# plt.style.use(fivethirtyeight)
# sns.set_context('talk')
# sns.set_style('white')


def load_data(sfreq=128., replace_ch_names=None, csv_strings=None):
    """Load CSV files into a RawArray object.

    Parameters
    ----------

    sfreq : float
        EEG sampling frequency
    replace_ch_names : dict | None
        A dict containing a mapping to rename channels.
        Useful when an external electrode was used during recording.
    csv_strings : list[str] | None
        The recorded CSVs as strings. Defaults to the Pyodide `js.csvArray`
        global injected by the worker. Passing it explicitly lets this run
        outside Pyodide (e.g. native-MNE validation tests) without touching
        `js`, so the same loader code is exercised in CI and in the app.

    Returns
    -------
    raw : an instance of mne.io.RawArray
        The loaded data.
    """
    ## TODO: Receive attached variable name instead of the fixed js.csvArray
    if csv_strings is None:
        # `js` is Pyodide's proxy for the worker's global scope; webworker.js sets
        # self.csvArray before running load_data(). Import it locally (not at module
        # top) so the native-MNE tests, which pass csv_strings, never touch the
        # Pyodide-only `js` module. A prior worker refactor dropped the global import
        # that used to make `js` available here, causing NameError: name 'js'.
        import js
        csv_strings = js.csvArray
    raw = []
    for csv in csv_strings:
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


def get_raw_epochs(raw, event_id, tmin, tmax, baseline=None, reject=None,
                   picks=None):
    """Find stimulus events on the Marker (stim) channel and epoch around them.

    This is the single epoching implementation shared by the in-app analysis
    (webworker/index.ts builds `event_id` from the MarkerRegistry and calls this)
    and the native-MNE validation tests. Keeping it in one place is what stops
    the recorded event codes and the analysis event_id map from drifting apart —
    the bug where event_id was keyed by stimulus array index instead of the
    1-based codes actually written to the CSV silently dropped epochs.

    Parameters
    ----------
    raw : mne.io.RawArray
        Loaded recording whose last channel is the numeric 'stim' (Marker).
    event_id : dict[str, int]
        Label -> code. VALUES must equal the codes in the Marker column.
    tmin, tmax : float
        Epoch window relative to each event onset, in seconds.
    baseline : tuple | None
        Baseline correction window (defaults to (tmin, tmax)).
    reject : dict | None
        Peak-to-peak rejection thresholds passed to mne.Epochs.

    Returns
    -------
    epochs : mne.Epochs
        The epoched data (preload=True).
    """
    if baseline is None:
        baseline = (tmin, tmax)
    events = find_events(raw)
    return Epochs(raw, events=events, event_id=event_id, tmin=tmin, tmax=tmax,
                  baseline=baseline, reject=reject, preload=True,
                  verbose=False, picks=picks)


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
        palette = [
            (0.86, 0.37, 0.34),
            (0.34, 0.86, 0.37),
            (0.37, 0.34, 0.86),
            (0.86, 0.72, 0.34),
        ]

    X = epochs.get_data()
    times = epochs.times
    y = pd.Series(epochs.events[:, -1])
    fig, ax = plt.subplots()

    for cond, color in zip(conditions.values(), palette):
        cond_data = X[y.isin(cond), ch_ind]
        mean = np.nanmean(cond_data, axis=0)
        n_samples = cond_data.shape[0]
        boot_means = np.array([
            np.nanmean(
                cond_data[np.random.randint(0, n_samples, n_samples)], axis=0
            )
            for _ in range(n_boot)
        ])
        alpha = (100 - ci) / 2
        low = np.percentile(boot_means, alpha, axis=0)
        high = np.percentile(boot_means, 100 - alpha, axis=0)
        ax.plot(times, mean, color=color)
        ax.fill_between(times, low, high, color=color, alpha=0.3)

    if diff_waveform:
        diff = (np.nanmean(X[y == diff_waveform[1], ch_ind], axis=0) -
                np.nanmean(X[y == diff_waveform[0], ch_ind], axis=0))
        ax.plot(times, diff, color='k', lw=1)

    ax.set_title(epochs.ch_names[ch_ind])
    ax.axvline(x=0, color='k', lw=1, label='_nolegend_')

    ax.set_xlabel('Time (s)')
    ax.set_ylabel('Amplitude (uV)')

    if diff_waveform:
        legend = (['{} - {}'.format(diff_waveform[1], diff_waveform[0])] +
                  list(conditions.keys()))
    else:
        legend = conditions.keys()
    ax.legend(legend)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()

    if title:
        fig.suptitle(title, fontsize=20)

    fig.set_size_inches(10, 8)

    return fig, ax

def get_epochs_info(epochs):
    print('Get Epochs Info:')
    # drop_log_stats() ignores IGNORED/NO_DATA entries, so the percentage is
    # taken over candidate epochs rather than every drop_log entry.
    return [*[{x: len(epochs[x])} for x in epochs.event_id],
            {"Drop Percentage": round(epochs.drop_log_stats(), 2)},
            {"Total Epochs": len(epochs.events)}]
