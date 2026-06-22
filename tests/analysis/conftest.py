"""Pytest config for the native-MNE analysis validation tests.

These tests import the app's real analysis code (src/renderer/utils/webworker/
utils.py) and run it against native MNE — no Pyodide. This proves that a CSV
recorded by the app yields a correct ERP, end to end, and runs fast in CI.

We add the webworker dir to sys.path so `import utils` resolves, and force the
non-interactive matplotlib backend (utils.py imports pyplot at module load;
'agg' is also what the app uses inside the worker).
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "agg")

WEBWORKER_DIR = (
    Path(__file__).resolve().parents[2]
    / "src"
    / "renderer"
    / "utils"
    / "webworker"
)
sys.path.insert(0, str(WEBWORKER_DIR))
