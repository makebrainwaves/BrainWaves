"""Native-MNE tests for the epoch-rejection step (Phase 1 epoch review).

Verifies `utils.apply_rejection` drops the user-selected epoch indices and marks
bad channels producing a result that is bit-identical to what MNE itself would
produce from the same `epochs.drop(...)` / `info['bads']` operations. The UI that
chooses the indices is new; the science is unchanged.
"""
import numpy as np

import utils  # src/renderer/utils/webworker/utils.py (see conftest)
from synthetic import (
    generate_recording,
    TARGET_CODE,
    STANDARD_CODE,
)

EVENT_ID = {"STANDARD": STANDARD_CODE, "TARGET": TARGET_CODE}
TMIN, TMAX = -0.1, 0.8


def _build_epochs():
    csv, _ = generate_recording()
    raw = utils.load_data(csv_strings=[csv])
    raw.filter(1, 30, method="iir", verbose=False)
    return utils.get_raw_epochs(raw, EVENT_ID, TMIN, TMAX)


def test_bit_identical_to_manual_mne():
    epochs = _build_epochs()
    assert len(epochs) > 3

    bad = [epochs.ch_names[0]]
    drops = [0, 2]

    manual = epochs.copy()
    manual.info["bads"] = list(bad)
    manual.drop(list(drops))

    actual = epochs.copy()
    utils.apply_rejection(actual, drops, bad)

    assert np.array_equal(actual.get_data(), manual.get_data())
    assert actual.info["bads"] == manual.info["bads"]
    assert len(actual) == len(manual)


def test_drop_count():
    epochs = _build_epochs()
    n0 = len(epochs.copy())
    assert n0 > 4

    rejected = utils.apply_rejection(epochs.copy(), [1, 3], [])
    assert len(rejected) == n0 - 2


def test_empty_args_are_no_ops():
    epochs = _build_epochs()
    before_len = len(epochs)
    before_data = epochs.get_data()

    result = utils.apply_rejection(epochs.copy(), [], [])

    assert len(result) == before_len
    assert np.array_equal(result.get_data(), before_data)
    assert result.info["bads"] == []


def test_returns_the_same_object():
    e = _build_epochs().copy()
    assert utils.apply_rejection(e, [], []) is e
