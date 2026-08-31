# Importing a jsPsych experiment into BrainWaves

BrainWaves can run an externally authored jsPsych v8 experiment and record EEG
markers from it.

## What you need

A single `.js` file written for jsPsych 8. The file must use the plugin globals
that BrainWaves ships, such as:

- `jsPsychHtmlKeyboardResponse`
- `jsPsychSurveyText`
- `jsPsychImageKeyboardResponse`

Do not load plugins from a CDN or from `<script>` tags. BrainWaves injects the
plugins for you.

## How the import process works

1. **Pick the file.** BrainWaves copies it into the current workspace.
2. **Scan.** BrainWaves reads the file text to check:
   - The file is not jsPsych v6.
   - Every plugin it uses is available.
   - Which `data` keys the author set.
3. **Run.** BrainWaves injects its own `initJsPsych` wrapper, displays the
   experiment, and listens for trials that carry a condition label.
4. **Collect.** When a labeled trial starts, BrainWaves writes a numeric marker
   to the EEG stream and records the response in the behavioral CSV.

## Marker setup

jsPsych has no built-in "condition" field. BrainWaves uses a key you choose from
the trial `data` object.

For example, if your trials include:

```js
data: {
  condition: 'target',
}
```

Then in the BrainWaves **Markers** tab you select `condition` as the condition
key and list the possible values in the order you want their marker codes:

| Order | Label  | Marker code |
|------:|--------|------------:|
| 1     | target | 1           |
| 2     | standard | 2         |

The order is the contract. Freeze it before the first subject and keep it the
same for every subject.

## Adapting an existing jsPsych file

Make sure the file:

- Calls `initJsPsych()` and `jsPsych.run([...])`.
- Uses plugin globals, not strings for `type:`.
- Uses `choices: []` instead of the v7 string `"NO_KEYS"`.
- Has a `data` key that names each trial's condition.
- Does not call an external trigger server. BrainWaves writes the markers.
- Does not call `localSave`. BrainWaves saves the data.

See `examples/imported/p300-demo/p300-demo.js` for a working example.
