"""Golden synthetic EEG generator for ERP round-trip validation.

Produces a CSV string in exactly the format the app records
(`Timestamp,<channels>,Marker`, with a numeric event code on the single sample
at each stimulus onset and 0 elsewhere), with a known evoked response planted
on one condition. A correct analysis pipeline must recover that response.

        condition TARGET (code 2): noise + planted P300-like bump @ ~300ms
        condition STANDARD (code 1): noise only
                                │
                       averaging over trials
                                ▼
        TARGET evoked shows a clear positive peak ~300ms; STANDARD does not.
"""
from io import StringIO

import numpy as np

# Muse montage — these names exist in MNE's standard_1005, which load_data()
# applies via set_montage.
CHANNELS = ["TP9", "AF7", "AF8", "TP10"]
SFREQ = 256.0
TARGET_CODE = 2
STANDARD_CODE = 1

# Channel index the ERP is planted on (AF7 — a frontal-ish channel).
ERP_CHANNEL = 1


def _erp_kernel(sfreq, peak_latency_s=0.3, width_s=0.06, amplitude=8.0):
    """A Gaussian bump approximating a P300, sampled at sfreq."""
    n = int(round((peak_latency_s + 4 * width_s) * sfreq))
    t = np.arange(n) / sfreq
    return amplitude * np.exp(-0.5 * ((t - peak_latency_s) / width_s) ** 2)


def generate_recording(
    n_trials_per_condition=25,
    noise_std=4.0,
    isi_s=1.0,
    seed=1234,
    timestamp_jitter_std_s=0.0,
    drop_fraction=0.0,
):
    """Generate a synthetic recording.

    Parameters
    ----------
    n_trials_per_condition : int
        Trials per condition (TARGET and STANDARD).
    noise_std : float
        Std of per-sample Gaussian noise on every channel.
    isi_s : float
        Inter-stimulus interval (seconds).
    timestamp_jitter_std_s : float
        If > 0, jitter the per-sample timestamps. Guards the sfreq heuristic in
        load_data (which infers the rate from the first two timestamps).
    drop_fraction : float
        If > 0, randomly drop this fraction of samples (simulating gaps).

    Returns
    -------
    csv : str
        The recording in the app's CSV format.
    expected : dict
        {'TARGET': count, 'STANDARD': count, 'total': count} event counts.
    """
    rng = np.random.default_rng(seed)
    kernel = _erp_kernel(SFREQ)
    isi_samples = int(round(isi_s * SFREQ))

    # Interleave conditions deterministically, then shuffle the order.
    codes = [TARGET_CODE] * n_trials_per_condition + [
        STANDARD_CODE
    ] * n_trials_per_condition
    rng.shuffle(codes)

    # Leave a lead-in before the first event and tail after the last so epochs
    # (tmin=-0.1 .. tmax=0.8) have room.
    lead_in = isi_samples
    n_samples = lead_in + len(codes) * isi_samples + isi_samples

    data = rng.normal(0.0, noise_std, size=(len(CHANNELS), n_samples))
    markers = np.zeros(n_samples, dtype=int)

    for i, code in enumerate(codes):
        onset = lead_in + i * isi_samples
        markers[onset] = code
        if code == TARGET_CODE:
            end = min(onset + kernel.size, n_samples)
            data[ERP_CHANNEL, onset:end] += kernel[: end - onset]

    # Per-sample timestamps in ms (load_data infers sfreq from the first gap).
    sample_interval_ms = 1000.0 / SFREQ
    timestamps = np.arange(n_samples) * sample_interval_ms
    if timestamp_jitter_std_s > 0:
        # Jitter everything except the first two samples, so the rate estimate
        # (index[1] - index[0]) stays clean while the rest is irregular.
        jitter = rng.normal(0.0, timestamp_jitter_std_s * 1000.0, size=n_samples)
        jitter[:2] = 0.0
        timestamps = timestamps + jitter

    keep = np.ones(n_samples, dtype=bool)
    if drop_fraction > 0:
        # Never drop a marker-bearing sample or the first two (rate estimate).
        droppable = np.where((markers == 0))[0]
        droppable = droppable[droppable >= 2]
        n_drop = int(len(droppable) * drop_fraction)
        drop_idx = rng.choice(droppable, size=n_drop, replace=False)
        keep[drop_idx] = False

    buf = StringIO()
    buf.write("Timestamp," + ",".join(CHANNELS) + ",Marker\n")
    for s in range(n_samples):
        if not keep[s]:
            continue
        row = [f"{timestamps[s]:.6f}"]
        row.extend(f"{data[c, s]:.6f}" for c in range(len(CHANNELS)))
        row.append(str(markers[s]))
        buf.write(",".join(row) + "\n")

    expected = {
        "TARGET": codes.count(TARGET_CODE),
        "STANDARD": codes.count(STANDARD_CODE),
        "total": len(codes),
    }
    return buf.getvalue(), expected
