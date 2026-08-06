"""Native-MNE tests for the artifact-suggestion step (Phase 2 epoch review).

Verifies `utils.suggest_rejections` flags epochs whose worst EEG-channel
peak-to-peak amplitude exceeds a microvolt threshold. It is advisory only — it
never drops anything (the real drop goes through `apply_rejection`) — so these
tests only check which epochs it *suggests*, and the shape of each suggestion.
"""
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


def test_threshold_gating():
    epochs = _build_epochs()
    assert len(epochs) > 3

    # Very high threshold: nothing is anomalous.
    assert utils.suggest_rejections(epochs, 1e9) == []

    # Very low threshold: every epoch is flagged.
    suggestions = utils.suggest_rejections(epochs, 0)
    assert len(suggestions) == len(epochs)
    for s in suggestions:
        assert set(s.keys()) == {"index", "channel", "peak_uv", "reason"}
        assert isinstance(s["index"], int)
        assert 0 <= s["index"] < len(epochs)
        assert s["channel"] in epochs.ch_names
        assert isinstance(s["peak_uv"], float)
        assert s["peak_uv"] > 0
        assert isinstance(s["reason"], str)


def test_detects_injected_artifact():
    epochs = _build_epochs()
    assert len(epochs) > 3

    ep = epochs.copy()
    k = 2
    # A single-sample 5 mV (5000 µV) spike on one EEG channel of one epoch.
    # It must be a spike, not a DC offset added to every sample — offsetting
    # the whole trace leaves peak-to-peak unchanged and nothing gets flagged.
    data = ep._data
    data[k, 0, data.shape[2] // 2] += 5e-3

    # Threshold between the normal ptp and the artifact.
    suggestions = utils.suggest_rejections(ep, 1000)
    indices = [s["index"] for s in suggestions]

    assert k in indices
    flagged = next(s for s in suggestions if s["index"] == k)
    assert flagged["peak_uv"] > 1000


def test_ptp_in_physiological_range():
    """Regression guard for the µV→V units bug (QA plan 6e).

    load_data must scale Muse µV amplitudes into MNE volts. If it doesn't,
    peak-to-peak comes back inflated ~1e6× (tens of millions of "µV"), which
    made auto-flag reject every epoch. Assert normal-recording ptp lands in a
    physiological band so that regression can't return silently.
    """
    epochs = _build_epochs()
    # threshold 0 → one suggestion per epoch, each carrying its worst ptp.
    peaks = [s["peak_uv"] for s in utils.suggest_rejections(epochs, 0)]
    assert peaks, "expected at least one epoch"
    # Synthetic noise is a few µV; real Muse is tens. A correct scale keeps
    # every epoch well under 1000 µV — the units bug put these at ~1e7.
    assert all(1.0 < p < 1000.0 for p in peaks), f"ptp out of range: {peaks}"


def test_marker_channel_excluded():
    epochs = _build_epochs()
    suggestions = utils.suggest_rejections(epochs, 0)
    assert all(s["channel"] != "Marker" for s in suggestions)
