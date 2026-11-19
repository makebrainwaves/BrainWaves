"""What Analyze draws from cleaned epochs: ERPs baselined on the
pre-stimulus interval, and a reproducible 95% confidence band.

Clean epochs whole-window demeaned (`get_raw_epochs` defaults to
`baseline=(tmin, tmax)`), so an ERP's pre-stimulus level wandered by several
µV. The band was a 97.5% interval from an unseeded bootstrap, so replotting
the same data moved it.
"""
from collections import OrderedDict

import numpy as np

import utils  # src/renderer/utils/webworker/utils.py (see conftest)
from synthetic import generate_recording, STANDARD_CODE, TARGET_CODE

EVENT_ID = {"STANDARD": STANDARD_CODE, "TARGET": TARGET_CODE}
CONDITIONS = OrderedDict((name, [code]) for name, code in EVENT_ID.items())


def _cleaned(tmp_path, seed=3):
    csv, _ = generate_recording(seed=seed)
    raw = utils.load_data(csv_strings=[csv])
    raw.filter(1, 30, method="iir", verbose=False)
    epochs = utils.get_raw_epochs(raw, EVENT_ID, -0.1, 0.8)
    path = str(tmp_path / "s-cleaned-epo.fif")
    epochs.save(path, verbose=False)
    return utils.load_clean_epochs([path])


def test_erp_is_zero_before_the_stimulus(tmp_path):
    epochs = _cleaned(tmp_path)
    pre = epochs.times <= 0  # MNE's (None, 0) baseline includes t = 0
    for evoked in utils.average_conditions(epochs, CONDITIONS):
        assert np.abs(evoked.data[:, pre].mean(axis=1)).max() < 1e-12


def _band(fig):
    return [p.get_paths()[0].vertices.copy() for p in fig.axes[0].collections]


def test_confidence_band_is_reproducible(tmp_path):
    epochs = _cleaned(tmp_path)
    first, _ = utils.plot_conditions(epochs, ["C0", "C1"], ch_ind=0,
                                     conditions=CONDITIONS, diff_waveform=None)
    second, _ = utils.plot_conditions(epochs, ["C0", "C1"], ch_ind=0,
                                      conditions=CONDITIONS, diff_waveform=None)
    for a, b in zip(_band(first), _band(second)):
        np.testing.assert_array_equal(a, b)


def test_confidence_band_defaults_to_95_percent():
    import inspect
    assert inspect.signature(utils.plot_conditions).parameters["ci"].default == 95
