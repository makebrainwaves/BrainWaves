"""Combining cleaned sessions whose flagged sensors differ.

A sensor a student flagged bad in one session is excluded only from that
session: `load_clean_epochs` blanks it to NaN in that session's epochs, and the
ERP, topography and PSD average whatever sessions kept it. Before this, MNE
refused to combine files with different `info['bads']`, and Analyze silently
kept showing the previous selection.
"""
from collections import OrderedDict

import numpy as np
import pytest

import utils  # src/renderer/utils/webworker/utils.py (see conftest)
from synthetic import generate_recording, STANDARD_CODE, TARGET_CODE

EVENT_ID = {"STANDARD": STANDARD_CODE, "TARGET": TARGET_CODE}
CONDITIONS = OrderedDict((name, [code]) for name, code in EVENT_ID.items())
FLAGGED = "AF7"


def _save_session(tmp_path, name, seed, bads, event_id=EVENT_ID):
    csv, _ = generate_recording(seed=seed)
    raw = utils.load_data(csv_strings=[csv])
    raw.filter(1, 30, method="iir", verbose=False)
    epochs = utils.get_raw_epochs(raw, event_id, -0.1, 0.8)
    utils.apply_rejection(epochs, [], bads)
    path = str(tmp_path / f"{name}-cleaned-epo.fif")
    epochs.save(path, verbose=False)
    return path, epochs


@pytest.fixture
def flagged(tmp_path):
    return _save_session(tmp_path, "flagged", 1, [FLAGGED])


@pytest.fixture
def unflagged(tmp_path):
    return _save_session(tmp_path, "unflagged", 2, [])


def _channel(epochs, name, code=None):
    """Microvolt trials of one channel, optionally one condition only."""
    data = epochs.get_data(picks=[name])[:, 0] * 1e6
    return data if code is None else data[epochs.events[:, -1] == code]


def _baselined(epochs):
    """As Analyze loads it: baselined on the pre-stimulus interval."""
    return epochs.copy().apply_baseline((None, 0), verbose=False)


def test_sessions_with_different_bads_combine(flagged, unflagged):
    pooled = utils.load_clean_epochs([flagged[0], unflagged[0]])

    assert len(pooled) == len(flagged[1]) + len(unflagged[1])
    assert pooled.info["bads"] == []


def test_flagged_sensor_is_blank_only_in_its_own_session(flagged, unflagged):
    pooled = utils.load_clean_epochs([flagged[0], unflagged[0]])
    n_flagged = len(flagged[1])

    af7 = _channel(pooled, FLAGGED)
    assert np.isnan(af7[:n_flagged]).all()
    assert np.isfinite(af7[n_flagged:]).all()
    others = [ch for ch in pooled.ch_names if ch not in (FLAGGED, "Marker")]
    assert np.isfinite(pooled.get_data(picks=others)).all()


def test_a_single_session_excludes_its_own_flagged_sensor(flagged):
    alone = utils.load_clean_epochs([flagged[0]])

    assert np.isnan(_channel(alone, FLAGGED)).all()


def test_erp_averages_only_sessions_that_kept_the_sensor(flagged, unflagged):
    pooled = utils.load_clean_epochs([flagged[0], unflagged[0]])

    fig, ax = utils.plot_conditions(
        pooled, palette=["r", "b"], ch_ind=pooled.ch_names.index(FLAGGED),
        conditions=CONDITIONS, diff_waveform=None, n_boot=50)

    expected = _channel(_baselined(unflagged[1]), FLAGGED, STANDARD_CODE).mean(
        axis=0)
    assert np.allclose(ax.lines[0].get_ydata(), expected, atol=1e-6)
    band = ax.collections[0].get_paths()[0].vertices
    assert np.isfinite(band).all()


def test_erp_of_a_sensor_flagged_everywhere_fails_loudly(flagged):
    alone = utils.load_clean_epochs([flagged[0]])

    with pytest.raises(ValueError, match="flagged bad"):
        utils.plot_conditions(
            alone, palette=["r", "b"], ch_ind=alone.ch_names.index(FLAGGED),
            conditions=CONDITIONS, diff_waveform=None, n_boot=50)


def test_topo_averages_only_sessions_that_kept_the_sensor(flagged, unflagged):
    pooled = utils.load_clean_epochs([flagged[0], unflagged[0]])

    evokeds = utils.average_conditions(pooled, CONDITIONS)

    for evoked, code in zip(evokeds, EVENT_ID.values()):
        expected = _channel(_baselined(unflagged[1]), FLAGGED, code).mean(axis=0)
        assert np.allclose(
            evoked.get_data(picks=[FLAGGED])[0] * 1e6, expected, atol=1e-6)
        assert evoked.info["bads"] == []
    utils.plot_topo(pooled, CONDITIONS, palette=["r", "b"])


def test_topo_leaves_out_a_sensor_flagged_everywhere(flagged):
    alone = utils.load_clean_epochs([flagged[0]])

    evokeds = utils.average_conditions(alone, CONDITIONS)

    assert all(evoked.info["bads"] == [FLAGGED] for evoked in evokeds)
    utils.plot_topo(alone, CONDITIONS, palette=["r", "b"])


def test_psd_averages_only_sessions_that_kept_the_sensor(flagged, unflagged):
    pooled = utils.load_clean_epochs([flagged[0], unflagged[0]])
    unflagged_only = utils.load_clean_epochs([unflagged[0]])

    psd = utils.average_psd(pooled).get_data(picks=[FLAGGED])
    expected = utils.average_psd(unflagged_only).get_data(picks=[FLAGGED])

    assert np.isfinite(psd).all()
    assert np.allclose(psd, expected)


def test_psd_leaves_out_a_sensor_flagged_everywhere(flagged):
    alone = utils.load_clean_epochs([flagged[0]])

    assert utils.average_psd(alone).info["bads"] == [FLAGGED]
    utils.plot_psd(alone)


def test_a_session_cleaned_before_a_rename_pools_under_the_new_names(tmp_path):
    """Stroop's Incongruent/Congruent became Mismatch/Match on the same codes."""
    current = {"Mismatch": STANDARD_CODE, "Match": TARGET_CODE}
    old, _ = _save_session(tmp_path, "old", 1, [], {
        "Incongruent": STANDARD_CODE, "Congruent": TARGET_CODE})
    new, _ = _save_session(tmp_path, "new", 2, [], current)

    pooled = utils.load_clean_epochs([old, new], current)

    assert pooled.event_id == current
    for label, code in current.items():
        assert len(pooled[label]) == (pooled.events[:, -1] == code).sum() == 50
