# Analysis validation tests

Native-MNE tests that prove a CSV recorded by the app yields a correct ERP. They
import the app's real analysis code (`src/renderer/utils/webworker/utils.py`) and
run it against native MNE — no Pyodide — so they're fast and run in CI
(`.github/workflows/analysis.yml`).

## What they lock in

- `load_data` parses the recorded CSV and infers the sample rate correctly,
  including under timestamp jitter and dropped samples.
- `find_events` recovers exactly the markers that were injected, split by
  condition.
- `get_raw_epochs` + `.average()` recovers a planted P300-like ERP on the target
  condition.
- The `event_id` contract: its values must equal the numeric codes written to
  the CSV Marker column (`buildMarkerRegistry` in the renderer). An index-based
  map breaks epoching — the regression test pins that.

## Run locally

```bash
python3 -m venv .venv-test
.venv-test/bin/pip install -r tests/analysis/requirements.txt
MPLBACKEND=agg .venv-test/bin/python -m pytest tests/analysis -v
```

## Fidelity note

The app runs this same Python under Pyodide/WASM. These tests use native MNE for
speed; a slower Pyodide-fidelity smoke job against the same golden dataset is a
TODO to guard against native/WASM divergence.
