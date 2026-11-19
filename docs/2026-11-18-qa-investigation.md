# QA investigation: N170 timing, Clean scaling, auto-suggest state, Analyze pooling

Date: 2026-11-18. App: BrainWaves 1.2.0 (main at `ef2d0c7`).

Data: the four Faces/Houses recordings from the launch night, made today on real Muse headsets with the current code. They are in `~/BrainWaves_Workspaces/Faces_and_Houses/Data/`: Beth session 1, austin sessions 1 and 2, and vinay session 1.

Method:
- Code paths were traced to file and line.
- Measurements used native MNE 1.13 (`.venv-analysis`) running the app's own `webworker/utils.py`, so the numbers come from the same code the app runs.
- The Clean component and reducer were run under jsdom, and Analyze was driven in the dev app over CDP.
- Statements that were inferred rather than observed are marked **[inference]**.

## Summary

| # | Concern | Verdict | Cause in one line |
|---|---|---|---|
| 1 | N170 appears around 220 ms | **Real bug, but not new.** The recent refactor changed how it shows up, not whether it exists. | Markers are placed on EEG samples recorded **67–84 ms or more before** the stimulus appeared, because muse-js sample timestamps are not real wall-clock times. Every ERP therefore looks that much later. |
| 2 | Clean scales each epoch on its own | **Real bug.** | Every channel of every epoch is stretched to fill its lane. On real data, louder traces are drawn *shorter*: amplitude and drawn height are negatively correlated (Spearman −0.43 to −0.66). |
| 3 | Raising the auto-suggest threshold and re-running | **Partly a bug.** | The suggestion list is replaced correctly. But suggestions the student already **accepted** stay rejected, vanish from the list (so there is no Restore button), and are then counted as rejected "by you". |
| 4 | Pooled ERP barely changes as datasets are added | **Real bug.** The 4-dataset pool was never computed. | Combining Beth's file with any other fails (the bad-channel mismatch diagnosed earlier). The worker keeps the previous data, and every plot is redrawn from it under the new participant list. |

Also found along the way, all smaller:
- Practice trials were epoched as Face/House: 6 of 126 per session. **Fixed for new recordings**; see the practice-trials section.
- Epochs are baselined over the whole −0.1 to 0.8 s window, not the pre-stimulus period.
- The ERP confidence band is 97.5%, uses an unseeded bootstrap, and plots channels marked bad.
- Auto-suggest still counts a flagged sensor until the session is saved.
- The "participants" label counts sessions, so austin appears twice.

---

## 1. N170 latency: marker timing

### Verdict

The latency bias is real, and its direction matches the report: markers land early in the EEG, so ERPs appear late.

The marker placement rule itself has not changed since 2018. What the September refactor (`3c59c03`) changed is what happens when the headset clock runs ahead of the computer clock. Before it, those markers were silently dropped. Since it, they are kept, but placed 43–90 ms early with per-trial jitter.

Of the four sessions, three (austin 1, austin 2, Beth) are in that clock-ahead situation. Under the old rule they would have kept 1, 0 and 0 of their 126 markers **[inference: old rule replayed against the recorded timestamps]**. So the tester's sense that this is new since the refactor is partly right: these sessions used to produce *no* ERP at all, and now they produce a late, smeared one.

### Marker path and which clock each step uses

| Step | Code | Clock |
|---|---|---|
| The fixation screen ends on an animation frame and lab.js runs the Stimulus screen. The image goes into the page, then the `run` hook fires. | `faces_houses/experiment.ts:110,230` (`run: triggerEEGCallback`); lab.js `html/screen.js:11-14`, `emitter.js:34-45` | browser frame clock |
| `eventCallback(label, Date.now())` | `LabjsExperimentWindow.tsx:90-92` | computer wall clock **M** |
| `emitMarker` → numeric code → `injectMarker(code, M)` | `RunComponent.tsx:160-168`, `utils/eeg/index.ts:50-76`, `muse.ts:151-153` | M |
| `createMarkerStamper` puts the marker on the first arriving sample whose timestamp satisfies `T + 3.9 ms > M` | `markerRegistry.ts:139-157`, `muse.ts:118` | sample clock **T** |
| The CSV `Timestamp` column is the sample's T | `src/main/index.ts:528-547` | T |

**How muse-js computes T** (`node_modules/muse-js/dist/muse.js:277-299`, v3.1.0, checked):
- It records the arrival time of the **first packet after connecting**, then simply counts samples forward (12 samples per packet, 46.875 ms per packet).
- After that first packet, arrival times are never used again.

So T is not the time a sample was recorded. It carries the Bluetooth delay of that first packet, and it drifts with any difference between the headset's crystal and the Mac's clock. The stamper assumes T is wall-clock recording time (an error of at most one sample), which muse-js does not provide.

### Measurements

All four recordings are internally consistent:
- Samples are exactly 3.906 ms apart, with no dropped packets.
- All 126 marker codes match the behavior rows in order.
- The screen refreshes at 120 Hz: the image is written to the page at `run` and shown one to two frames later. Measured `time_show − time_run` has a median of 16.7 ms.

The behavior CSV's `performance.now()` columns were mapped to wall-clock time (each row's ISO timestamp minus `time_commit`; this offset drifted ≤3.6 ms within a session). Each marker's sample T was then compared with the wall-clock time of its trial:

| Session | Marker T − trial `run` time, median [p5, p95] | Marker on first sample of a packet | Situation |
|---|---|---|---|
| vinay 1 | −0.2 ms [−2.4, +2.1] | spread across positions | aligned: the rule works as designed |
| austin 1 | +30.5 ms [+5.6, +56.2] | 125/126 | headset clock ahead |
| austin 2 | +76.2 ms [+53.5, +98.6] | 126/126 | headset clock ahead |
| Beth 1 | +117.6 ms [+94.2, +141.5] | 126/126 | headset clock ahead |

**Clock drift.** austin 1, austin 2 and Beth were all recorded on one headset (Muse-407E) over one connection, 18–41 minutes after it connected (`main.log:371`). A single straight line fits all three: the headset clock runs **+4.2 ms per minute (about 70 ppm) fast**.

Once T gets far enough ahead, the sample whose T matches the marker has already passed through the pipeline. The marker then goes onto the first sample of the next arriving packet batch. That is why 377 of 378 markers sit at packet position 0, with roughly 15 ms of per-trial jitter (SD).

**Where markers should have been.** Moving each marker to the sample recorded at the moment the stimulus appeared shifts it later by:
- vinay: **66.9 ms** (SD 2.0)
- austin 1, austin 2 and Beth: **82–84 ms** (SD about 15)

These are **lower bounds**. They assume zero Bluetooth delay and an instant screen response; both add more, likely bringing the total to about 75–130 ms **[inference]**.

| Source | Effect on the ERP | Size |
|---|---|---|
| `Date.now()` at the `run` hook | none | the hook runs about 2 ms after the frame |
| Image in page → light from the screen | later | 8–17 ms at 120 Hz, plus panel response (not measured) |
| muse-js first-packet anchor | later | about 20 ms (407E), about 30–60 ms (2B81), plus the steady Bluetooth delay (not measured) |
| Headset vs computer clock drift | later on 407E; the direction depends on the headset | 0 → about 166 ms over 40 minutes of connection |
| Clock-ahead fallback to the next packet batch | later, with jitter | 43–90 ms, SD about 15 ms |
| Stamper rounding | later | 0–3.9 ms |
| 1–30 Hz IIR filter | none | zero-phase; confirmed natively with an impulse |

### Do the ERPs themselves confirm it?

Not on their own. Each session has about 60 trials per condition, and in 3 of 4 sessions the Face ERP at TP9/TP10 has no clear negative peak; peaks sit at the edges of the 130–280 ms search window.

The one clean case is vinay. Its negativity is at **250 ms as recorded and 184 ms after moving the markers** by the lower-bound correction, consistent with an N170 recorded about 65 ms or more late.

### Fix

1. **Restamp Muse samples by arrival time** (`utils/eeg/muse.ts`, about 30 lines, no new dependency):
   - Read `client.eegReadings` before `zipSamples` and record `Date.now()` and the packet index for each notification.
   - Track the lower envelope of `arrival − index × 46.875`, which removes Bluetooth jitter, and derive sample times from it.
   - This removes both the drift and the first-packet error, and makes the stamper's one-sample promise true.
2. **Stop-gap:** reset muse-js's anchor at the start of each recording. This bounds drift to one run (about 10 ms) but keeps the first-packet error.
3. **Make it loud:** when the first sample checked after `inject` already has `T ≥ M + 3.9 ms`, the clocks are out of sync. Log and count this instead of silently using the next batch.
4. **Calibrate the remainder once**, as a `MUSE_LATENCY_MS` constant:
   - A Muse 2016 has an AUX port that can take a photodiode, the gold standard.
   - Muse 2/S have no AUX port, so use a flash-evoked calibration run instead **[inference: precision about ±10–20 ms]**.
   - Optionally fire the marker at lab.js `show` rather than `run`, which removes about 15 ms of display delay.
5. **Experiment that needs no hardware:** record arrival times for 30+ minutes connected. This measures drift per headset, the first-packet error and Bluetooth jitter, leaving only the minimum Bluetooth delay and the panel response unknown.

---

## 2. Clean epoch reviewer: each trace scaled on its own

### Verdict

Real bug. Every epoch × channel trace is scaled so its full range fills the lane:
- the code computes `min`, `max` and `mean` from that one trace and sets `scale = 60 px / (max − min)` (`EpochReviewer.tsx:172-195`);
- students cannot change it;
- there is no µV axis, scale bar or threshold line on the canvas.

Because each trace is centred on its own mean and clamped to the lane, a one-sided artifact such as a blink or electrode pop has its larger half cut off, so it is drawn **shorter** than quiet background EEG.

### Evidence

The real `EpochReviewer` was rendered under jsdom with a canvas that records draw calls:

| Trace | Peak-to-peak | Drawn height (of 60 px) |
|---|---|---|
| quiet, ±5 µV | 10 µV | 60.0 |
| noisy, ±150 µV | 300 µV | 60.0 |
| 150 µV one-sided blink | 150 µV | 40.0 |
| 150 µV single-sample pop | 150 µV | 31.1 |

Real data, using the arrays `get_epochs_arrays` produces:
- austin 2: epoch 1 TP9 at **305 µV is drawn 45.5 px tall**, while epoch 5 AF8 at **17 µV is drawn 57.4 px**.
- Across sessions, drawn height is **negatively** correlated with true amplitude: Spearman −0.66 (vinay), −0.49 (austin 1), −0.43 (austin 2).
- Traces the auto-suggest would flag (>100 µV) are drawn about 15% shorter than clean ones.
- Within one session, the scale factor applied to each trace varies 22–91×.
- Beth's sensor flagged bad (AF7, median 553 µV) looks no larger than AF8 (118 µV).

History: a gain ± control was removed in `2b339c7`. It only multiplied the per-trace scale, so it never made epochs comparable either. The Storybook fixture has no artifact epochs (`Clean/fixtures.ts:65-69` names some that are not in the data), which is likely how this passed design review **[inference]**.

### Fix

- Use **one shared scale** for all lanes and epochs.
- Centre traces on 0 instead of their own mean. Epochs are already baseline-corrected (`utils.py:131-132`), so the per-trace mean adds nothing.
- Keep the lane clamp, so hitting the lane edge means "this is big".
- Show a "lane = N µV" label. The cheapest version ties N to the auto-flag slider: a trace that touches both lane edges is then over the threshold, and the slider doubles as a zoom.

Simulated at 100 µV per lane:
- traces ≤100 µV draw 22–44 px (median);
- traces >100 µV draw 55–60 px;
- every full-height trace is over 100 µV.

Worth keeping as a regression test: a ±5 µV trace must draw shorter than a ±150 µV one. Today both draw at 60 px.

---

## 3. Auto-suggest after changing the threshold

### Verdict

Partly a bug:
- **Correct:** each press of Suggest **replaces** the whole suggestion list (`pyodideReducer.ts:143-146`), and a suggestion never becomes a rejection without a click.
- **Wrong:** an accepted suggestion goes into the same `rejected` set as the student's own clicks (`CleanComponent/index.tsx:261-268`), with no record of where it came from. When a re-run at a higher threshold no longer lists it:
  - it **stays rejected**;
  - it disappears from the suggestion list, so there is no Restore button for it;
  - the summary relabels it as rejected "by you".

### Scenarios

Tested against the real Clean component and reducer under vitest, using suggestion lists from native MNE on austin 2 (7 of 7 tests passed):

| Scenario | Outcome |
|---|---|
| S1: suggest at 100 µV, raise to 150, press again | List replaced (51 → 26 rows). Nothing rejected. While the slider has moved but Suggest has not been pressed, the caption shows 150 µV above the old 100 µV list. |
| S2: accept 3 suggestions, raise to 150, press again | **All 3 stay rejected.** 2 vanish from the list. Summary changes from "3 left out (all suggested)" to "(2 by you, 1 suggested)". |
| S3: lower the threshold | The new list contains the old one, and accepted rows still show as left out. Correct. |
| S4: reject a trial by hand, then run suggest | If the trial is in the new list, it shows as an accepted suggestion and is counted as "suggested". Restore on that row undoes the student's own click. |
| S5: suggest results after Save | **No stale-index bug.** New epoch arrays clear the suggestions (`pyodideReducer.ts:116`) and reset `rejected` (`index.tsx:77-80`) in the same render, and the worker runs messages in order. A native check confirms that indices after a save map to the right epochs. No test pins the reducer half of this. |

How much it matters: raising 100 → 150 µV removes 2 / 17 / 25 / **66** suggestions from the list (Beth / austin 1 / austin 2 / vinay, of 126 trials each). That is the most that could stay stuck. At the default 100 µV, auto-suggest flags 51–126 of 126 trials on these Muse recordings, so students will move the slider.

Related: until a session is saved, auto-suggest still counts sensors the student has flagged (`badChannels` only reaches Python on save). For Beth at 150 µV it suggests 124 trials with AF7 counted vs 89 with AF7 excluded.

### Fix

The change fits in `CleanComponent/index.tsx`:
- Keep a `fromSuggestion` set alongside `rejected`.
- When a new suggestion list arrives, un-reject accepted suggestions that it no longer contains, and leave the student's own clicks alone.
- Count "suggested" from `fromSuggestion`.

Smaller extras:
- mark the list as stale while the slider differs from the value it was computed at;
- pass flagged sensors to `suggest_rejections`;
- disable Suggest while saving.

There is a product choice here. The alternative to un-rejecting is to keep lapsed accepted rows visible in the list, labelled "below current threshold". Either is defensible; what the app does today, hiding the decision and attributing it to the student, is not.

---

## 4. Analyze pooling

### Verdict

Real bug. The tester never saw a 4-dataset pool:
1. Any selection that includes Beth 1 plus another file makes `load_clean_epochs` raise `epochs[1].info['bads'] must match`. Beth's file has `AF7` marked bad and the others have none; MNE cannot be told to ignore this, even with `on_mismatch='ignore'`.
2. Because the assignment fails, the worker's global `clean_epochs` keeps the **previous** data.
3. The load message carries no plot or data key, so its error only shows a traceback toast (`pyodideEpics.ts:103-107`).
4. The PSD, topography, info and ERP requests queued after it all succeed on the old data, and Analyze shows them as results under the **new** participant list.

### Reproduced in the dev app

Analyze was driven over CDP with the worker messages logged. The checklist order is Beth, austin 1, austin 2, vinay; this is the order the files are read from disk.

| Ticked | Load result | Data actually plotted | Label shown |
|---|---|---|---|
| Beth | ok | 119 epochs | 1 participant |
| + austin 1 | bad-channel error | **119** (Beth only) | 2 participants |
| + austin 2 | bad-channel error | **119** | 3 participants |
| + vinay | bad-channel error | **119** | 4 participants: Beth, austin, austin, vinay |

- The topography and PSD SVGs were byte-length identical at every step.
- The TP10 Face mean line with "4 selected" matches the Beth-only plot exactly once the y-axis scale is accounted for (residual 0.000 px).
- Only the bootstrap confidence band moves, because it is recomputed without a fixed random seed: about 1.1–1.4 µV RMS on a band about 38 µV wide. That is the "barely changes".
- Adding Beth last instead freezes the display on the previous 3-file pool (189/189 trials).

**When the bad-channel lists match, pooling works:**
- Selecting austin 1, then austin 2, then vinay gives 126 → 252 → 378 epochs, matching native MNE.
- Each file gets its own staging path, so nothing collides or goes stale (`index.ts:63-79`, `webworker.js:110-116`).
- The worker runs messages in order.
- Channel names map to the right data index.

### What correct pooling would look like

Computed natively, with bad-channel lists cleared so all four files combine. This leaves Beth's bad AF7 in, so AF7 figures are inflated.

Change in the pooled ERP at TP9/TP10 with each added dataset, averaged over all 24 add orders:

| Step | RMS change (µV) | Correlation with the previous pool |
|---|---|---|
| 1 → 2 datasets | 4.6 | 0.71 |
| 2 → 3 datasets | 2.6 | 0.83 |
| 3 → 4 datasets | 1.9 | 0.89 |

The confidence band narrows to about 0.6–0.8× at each step. So with working pooling, later additions *would* legitimately look smaller: each new file carries ⅓, then ¼ of the weight, and single-session ERPs are close to noise level. Smaller changes are expected; no change is not.

Pooling also concatenates trials, so it is a trial-weighted average. austin's two sessions supply 51% of the trials. A subject-level grand average (each subject's sessions first, then subjects) differs from the trial-weighted pool by 2.5 µV RMS (max 7.5 µV).

### Smaller findings on the same path

- **Bad channels are still plotted.** `plot_conditions` uses `get_data()` and `plot_topo` uses `average()`, and both keep channels marked bad. Beth's bad AF7 would shift the pooled AF7 by 18 µV RMS.
- **No pre-stimulus baseline.** `get_raw_epochs` defaults to `baseline=(tmin, tmax)` (`utils.py:131-132`). The pre-stimulus mean of the pooled ERP reaches ±3 µV, and +12.5 µV in one dataset. DC offset is not the issue; the 1–30 Hz filter removes it.
- **The band is 97.5%, not 95%** (`index.ts:215`). Its bootstrap is unseeded (`utils.py:262-267`), so replotting the same data moves it.
- **Practice trials are included**: 20 of 497 pooled epochs (see item 1).
- **"N participants" counts sessions** (`storage.ts:123-126`), so austin is listed twice.

### Fix

1. **Fail visibly, never reuse stale data.**
   - Give the load message a key and route its error to a "load failed" state in Analyze.
   - Clear `clean_epochs` before reassigning it, so follow-up requests fail instead of replotting old data.
2. **Agree on bad channels before combining.** The options were laid out in the earlier diagnosis:
   - blank each flagged sensor only in its own session (recommended; the ERP plot already uses `nanmean`, the topography would need the same);
   - or mark it bad for everyone in the combination.

   Either way, the plots must then exclude bad channels.
3. **Pre-stimulus baseline**: apply `apply_baseline((None, 0))` when cleaned files are loaded. This needs no re-clean.
4. **Teaching unit**: offer a subject-level grand average and a per-dataset overlay; label the band correctly and seed the bootstrap.
5. **Exclude practice epochs**: fixed for new recordings (see below).

---

## Shared side finding: practice trials were epoched as conditions (fixed)

- Every Faces/Houses session has 126 markers: 120 main trials plus 6 practice (3 Face, 3 House).
- The practice Stimulus uses the same `run: triggerEEGCallback` hook (`faces_houses/experiment.ts:110`) and the same codes 1 and 2, and `get_raw_epochs` epochs every code.
- The effect is small: about 5% of trials, changing the pooled ERP by 0.7 µV RMS (max 2.4 µV). Latencies are unaffected.
- **Fixed (2026-11-18):** practice trials no longer send markers.
  - `triggerEEGCallback` (`utils/labjs/functions.ts`) returns early when `phase === 'practice'`; this covers Faces/Houses and Custom.
  - Multitasking's `triggerEEGCallback` skips `task === 'training'` blocks.
  - Stroop and Visual Search already sent markers from the main task only.
  - Tested two ways:
    - `markerContract.test.ts` checks that a practice trial sends no marker.
    - In the dev app with the fixture headset, a Faces/Houses run with all 6 practice trials sent no markers during practice; the first marker landed on the first main trial.
  - Recordings made before the fix still contain their 6 practice markers. Analyze has no way to tell them apart from main-task markers, so those sessions keep them unless they are re-recorded.

## Suggested order of work

1. **Analyze stale-data bug plus bad-channel agreement (#4).** Students are currently shown wrong results with no error state.
2. **Clean scaling (#2).** A small, contained change in `EpochReviewer.tsx`, and it decides which trials students keep.
3. **Muse timestamping (#1).** Restamp by arrival time and log desync now; calibrate with a photodiode or flash run later. Re-check vinay-style latencies afterwards.
4. **Auto-suggest provenance (#3)**, after deciding between un-rejecting and showing lapsed rows.
5. **Small items:** pre-stimulus baseline, 95% band and seed, the participant count.

## Reproduction

Scratch scripts and outputs are in `/tmp/bw-qa/` (temporary, not in the repo):

| Folder | Topic | Contents |
|---|---|---|
| `N170Timing/` | timing | `timing.py`, `drift.py`, `erp.py`, `grand.py`, per-trial match CSVs, ERP figure |
| `clean-scaling/` | scaling | `replica.ts`, jsdom harness, `real_ptp.py`, `corr.py`, `fixed_scale.py` |
| `SuggestState/` | auto-suggest | vitest harness, `native_suggest.py` |
| `pooling/` | pooling | `stale.py`, `pool_stats*.py`, worker log, SVGs, screenshots |

Run the Python scripts with `.venv-analysis/bin/python` from `src/renderer/utils/webworker`.
