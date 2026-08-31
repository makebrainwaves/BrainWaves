# P300 Visual Oddball for BrainWaves

A BrainWaves-importable jsPsych version of Josh de Leeuw's P300 oddball demo.

- Original: https://github.com/jodeleeuw/p300-demo
- Runtime required: jsPsych 8.x (ships with BrainWaves)

## What the task does

Participants see a stream of colored circles. Most are blue (standard), but
some are orange (target) or purple (distractor). Their task is to mentally count
the total number of orange and purple circles across three rounds.

## Files

- `p300-demo.js` — the importable timeline. Open this file in BrainWaves.

## Import steps

1. Open BrainWaves and click **Import Experiment** on the Home screen.
2. Select `p300-demo.js`.
3. In Design, go to the **Markers** tab.
4. Set **Condition key** to `condition`.
5. Add these three labels in the exact order shown:

   | Order | Label       | Marker code |
   |------:|-------------|------------:|
   | 1     | `standard`  | 1           |
   | 2     | `target`    | 2           |
   | 3     | `distractor`| 3           |

   The order is the contract: it decides which number BrainWaves writes to the
   EEG `Marker` column. Freeze the same order for every subject.

6. Click **Freeze marker codes**.
7. Go to **Collect** and run a subject.

## EEG analysis notes

- The relevant P300 contrast is typically **target** vs. **standard** (codes 2 vs 1).
- The **distractor** condition (code 3) is included as a novelty control.
- Markers are written automatically from the `condition` data key; the original
  demo's external Python trigger server is not used.
