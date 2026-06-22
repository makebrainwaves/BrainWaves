"""Golden-dataset ERP round-trip tests against the app's real analysis code.

Pipeline under test (mirrors webworker/index.ts loadEpochsEpic):
    load_data(csv) -> raw.filter(1, 30, 'iir') -> get_raw_epochs(event_id, ...)
    -> epochs[condition].average()

This is the guardrail for the fall goal: a CSV recorded by the app must yield a
correct ERP. It also locks in the two correctness fixes from this branch:
  * event_id VALUES must equal the numeric codes in the Marker column (T4)
  * the sfreq heuristic must survive timestamp jitter (utils.py)
"""
import numpy as np
import pytest

import utils  # src/renderer/utils/webworker/utils.py (see conftest)
from synthetic import (
    generate_recording,
    ERP_CHANNEL,
    TARGET_CODE,
    STANDARD_CODE,
)

# Mirrors what buildMarkerRegistry() emits in the renderer: label -> CSV code.
EVENT_ID = {"STANDARD": STANDARD_CODE, "TARGET": TARGET_CODE}
TMIN, TMAX = -0.1, 0.8
P300_WINDOW = (0.2, 0.4)


def _epochs_from_csv(csv, event_id=EVENT_ID):
    raw = utils.load_data(csv_strings=[csv])
    raw.filter(1, 30, method="iir", verbose=False)
    return utils.get_raw_epochs(raw, event_id, TMIN, TMAX)


def _peak_in_window(evoked, ch_index, window):
    times = evoked.times
    mask = (times >= window[0]) & (times <= window[1])
    return float(np.max(evoked.data[ch_index, mask]))


def test_sfreq_inferred_as_256():
    csv, _ = generate_recording()
    raw = utils.load_data(csv_strings=[csv])
    assert raw.info["sfreq"] == 256


def test_find_events_recovers_every_injected_marker():
    csv, expected = generate_recording()
    epochs = _epochs_from_csv(csv)
    # Every injected marker is recovered, split correctly by condition.
    assert len(epochs) == expected["total"]
    assert len(epochs["TARGET"]) == expected["TARGET"]
    assert len(epochs["STANDARD"]) == expected["STANDARD"]


def test_planted_erp_is_recovered_on_target_condition():
    csv, _ = generate_recording()
    epochs = _epochs_from_csv(csv)

    target_peak = _peak_in_window(
        epochs["TARGET"].average(), ERP_CHANNEL, P300_WINDOW
    )
    standard_peak = _peak_in_window(
        epochs["STANDARD"].average(), ERP_CHANNEL, P300_WINDOW
    )

    # The planted P300 makes the TARGET average clearly exceed STANDARD in the
    # 200-400ms window on the channel it was planted on.
    assert target_peak > standard_peak * 1.5


def test_index_based_event_id_breaks_epoching():
    """Regression for the T4 contract bug.

    The old analysis keyed event_id by stimulus ARRAY INDEX ({label: 0, 1, ...}).
    The CSV Marker column holds 1-based codes (1, 2), so an index value of 0
    matches no events at all — MNE raises "No matching events found". This is the
    silent-data-loss / broken-analysis failure this branch fixes by deriving
    event_id from the shared MarkerRegistry. The correct mapping recovers every
    epoch.
    """
    csv, expected = generate_recording()

    broken_event_id = {"first": 0, "second": 1}  # array indices, not codes
    with pytest.raises(ValueError, match="No matching events"):
        _epochs_from_csv(csv, broken_event_id)

    correct = _epochs_from_csv(csv)
    assert len(correct) == expected["total"]


def test_sfreq_and_events_survive_timestamp_jitter():
    # 1ms std jitter on every sample after the first two. The rate estimate must
    # stay at 256 and all events must still be recovered.
    csv, expected = generate_recording(timestamp_jitter_std_s=0.001)
    raw = utils.load_data(csv_strings=[csv])
    assert raw.info["sfreq"] == 256
    epochs = _epochs_from_csv(csv)
    assert len(epochs) == expected["total"]


def test_events_survive_dropped_samples():
    # Randomly drop 5% of non-marker samples; every marker still produces an event.
    csv, expected = generate_recording(drop_fraction=0.05)
    epochs = _epochs_from_csv(csv)
    assert len(epochs) == expected["total"]


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
