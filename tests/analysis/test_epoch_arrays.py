"""Native-MNE tests for the epoch-array serializer (Phase 0 epoch review).

Verifies `utils.get_epochs_arrays` writes a float32 buffer matching the frozen
contract consumed by the React canvas renderer: Marker/stim channel excluded,
C-order [epoch][channel][time] layout, and a metadata dict whose shape/labels
match the buffer exactly.
"""
import numpy as np
import mne

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


def test_marker_excluded_and_channel_count_matches(tmp_path):
    epochs = _build_epochs()
    meta = utils.get_epochs_arrays(epochs, str(tmp_path / "arr.f32"))

    assert meta["n_channels"] == len(meta["ch_names"])
    assert "Marker" not in meta["ch_names"]


def test_buffer_matches_epoch_data(tmp_path):
    epochs = _build_epochs()
    path = str(tmp_path / "arr.f32")
    meta = utils.get_epochs_arrays(epochs, path)

    with open(path, "rb") as f:
        raw_bytes = f.read()
    arr = np.frombuffer(raw_bytes, dtype=np.float32).reshape(
        meta["n_epochs"], meta["n_channels"], meta["n_times"]
    )

    # get_epochs_arrays emits microvolts (volts * 1e6) for the epoch viewer.
    expected = (epochs.get_data(
        picks=mne.pick_types(epochs.info, eeg=True)
    ) * 1e6).astype(np.float32)
    assert np.allclose(arr, expected, rtol=1e-5, atol=1e-3)


def test_metadata_lengths_and_event_codes(tmp_path):
    epochs = _build_epochs()
    meta = utils.get_epochs_arrays(epochs, str(tmp_path / "arr.f32"))

    assert len(meta["times"]) == meta["n_times"]
    assert len(meta["event_codes"]) == meta["n_epochs"]
    assert meta["event_codes"] == epochs.events[:, -1].tolist()


def test_byte_length_matches_shape(tmp_path):
    epochs = _build_epochs()
    path = str(tmp_path / "arr.f32")
    meta = utils.get_epochs_arrays(epochs, path)

    with open(path, "rb") as f:
        n_bytes = len(f.read())
    assert n_bytes == (
        meta["n_epochs"] * meta["n_channels"] * meta["n_times"] * 4
    )
