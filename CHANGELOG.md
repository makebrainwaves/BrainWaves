# 1.1.0 (October 1, 2026) - Playtest-driven redesign

Every screen a student touches was redesigned after a naive-user playtest, so the app shows where to start and what to do next at each step, from putting on the headset to reading an ERP. This release covers everything since 1.0.2 (190 commits, #256–#289), including the 1.0.3 work that was never released on its own.

## Getting around

- **New Home**:
  - Continue your work (your workspaces, newest first, with Open, Show in folder and a confirmed Delete);
  - Start Faces/Houses, the recommended first experiment;
  - Explore EEG.
  - Every new experiment gets its own unique name, so you never reopen an old one by accident.
- **One shell bar across the app**:
  - shows where you are (gold underline) and the one recommended next step;
  - shows truthful counts such as "4 recordings" and "1 cleaned";
  - hides Clean for behavior-only experiments.
- **Empty areas explain themselves**: Clean and Analyze say what they need, and how to get it, when there is no data yet.

## Headset setup

- **A guided setup dialog**: choose Muse, Neurosity Crown or an LSL stream, see how to wear it, then press `Find my headset`. Searching only starts when you ask.
- **Search time limit**: a search stops after one minute and asks whether the headset is turned on.
- **Signal prep**: after pairing, a signal check walks through skin contact, fit and staying still. It never blocks you from continuing.
- **The device chip in the top bar** opens setup from any screen. When a headset is connected, it now offers **Disconnect**.
- **More reliable connections**:
  - setup reopens if the headset drops;
  - stale search results are discarded;
  - a failed connection no longer breaks later attempts;
  - a failed LSL connection fails gently.
- **Gentler signal-quality thresholds**: a sensor now reads "noisy" above 22.5 µV and "settling" above 15 µV. Decent contact was being shown as red.

## Explore EEG

- **The live view leads with a plain-words status**: Ready, Sensors are still settling, Adjust AF7 and TP10, or No signal. It sits beside the interactive head diagram and sensor help.
- **The plot legend** shows your headset's name and its real sampling rate.
- **Three activities**:
  - *How do I get a cleaner signal?* — three tips beside your live signal.
  - *Where is this noise coming from?* — defines noise, marks each blink on the plot, asks you to predict, then compares a still moment with a blinking one on the same scale.
  - *Eyes-closed activity* — a countdown and chimes mark ten seconds with your eyes closed, then your eyes-open and eyes-closed signal are compared side by side.
- **Paused copies** of your own signal are clearly labelled as paused.
- **Stable trace colors**: each channel keeps the same color in every view.
- **Clear error banners**: Explore says so, and offers a fix, if the signal stream stops or a headset lacks the sensors a lesson needs.
- **No workspace**: Explore never creates a workspace or records anything.

## Preparing an experiment

- **Built-in experiments walk through four steps**: Overview → Background → Protocol → Preview, each with one forward action. You can go to Collect at any time.
- **Protocol** shows the response keys, the conditions, and a flow diagram with each experiment's real trial counts.
- **Faces/Houses' Background** has a face-crowd illustration in place of the old external video, plus a fun-fact illustration.
- **Preview** is clearly labelled and shows a whole participant screen.

## Running experiments

- **BrainWaves participant screens** for the built-in and custom experiments:
  - large instructions with keycaps;
  - a practice → main-task transition;
  - an end screen.
  - The stillness reminder appears only when EEG is recording.
- **Starting a run**:
  - after a preview, `Run & record` starts the real run;
  - a run starts when you press SPACE;
  - an existing session is never overwritten.
- **During a run** the top bar shows `EEG recording` or `Behavior only`, the elapsed time, trial progress and `End experiment early`.
- **Ending early** (the button, or holding Escape) keeps what was recorded as incomplete data. Incomplete data never appears as a finished run in Clean or Analyze.
- **Custom experiments**: condition names and keys show exactly as typed, and `Q` on the instruction screen skips practice again.

## Cleaning data

- **One recording at a time**, with a short explanation of what cleaning does and its five steps.
- **Leave out trials and flag sensors**: click trials to leave them out and click a sensor to flag it. The Live ERP updates as you go.
- **Auto-flag suggestions are only suggestions**: Accept or Restore each one. Clicking a suggestion jumps to that trial and outlines it.
- **Sharper trial traces**, and flagged sensors stay visible so you can un-flag them. Un-flagging after a save now reaches the saved file.
- **Saving**: `Apply exclusions` saves in place. `Save cleaned dataset & analyze` always saves, then opens Analyze. Confirmations appear in the app.
- **Ended-early recordings** stay hidden until you reveal them. Once revealed, they can be moved to the Trash.

## Analyzing data

- **Overview**: a cleaned-recording checklist, a summary of what is included, and the power spectrum and topography side by side.
- **ERPs across the scalp** now draws a head outline under the traces, and its legend colors match each condition.
- **ERP tab**:
  - a head-diagram sensor picker and a readable ERP figure;
  - *Walk me through it*, which builds the average step by step from your own trials.
- **Behavior tab**:
  - response time or accuracy as bars, dots or box plots, with outlier removal;
  - every condition gets its own color;
  - Behavior works before any cleaning.
  - Export summary CSV reports whether the file was saved.
- **Errors and loading**:
  - plots that fail to load offer Try again;
  - EEG tabs say "Clean first" until a cleaned recording exists;
  - stray help panels and broken layouts are gone.

## Under the hood

- **One marker pipeline**: condition labels become numeric codes in one place, and the same codes are used from collection to analysis. Muse markers align to the EEG sample clock.
- **More robust epoching**: recordings missing a condition no longer fail to epoch.
- **Pyodide** uses pinned, compatible Python packages.
- **A design system** with tokens and a Storybook catalog. Every redesigned screen was reviewed there first.
- **Releases need a manual approval step.**
- **Citation**: `CITATION.cff` adds citation metadata, so Zenodo archives each release with its authors.
- **Cleanup**: about 1,100 lines of dead code removed, plus dependency updates (js-yaml, protobufjs, vitest).
- **Single-instance lock removed**: BrainWaves no longer stops a second copy from opening.

# 1.0.2 (September 8, 2026) - Dependency updates

- Routine dev-dependency bumps (postcss-selector-parser, browserslist, fast-uri, @xmldom/xmldom, @humanfs/node).

# 1.0.0 (August 11, 2026) - Classroom MVP

First stable release of the revived BrainWaves desktop app for high-school EEG labs.
Ships the full classroom loop — Design → Collect → Clean → Analyze — for Muse and
Neurosity headsets, with restored custom experiment authoring and a browser-based
analysis backend.

## Hardware & connectivity

- Muse (classic protocol) and Neurosity Crown first-party drivers over Web Bluetooth.
- Lab Streaming Layer (LSL) outlet for EEG epochs + stimulus markers.
- External LSL inlet in `ConnectModal` for third-party recorders (when liblsl is available).
- Packaged macOS `liblsl` is self-contained on Apple Silicon via the `afterPack` hook.
- Emotiv SDK and Epoc+ support removed.

## Experiments

- Built-in experiments: Faces/Houses (N170), Stroop, Multi-tasking, Visual Search.
- Restored custom experiment authoring: pick image folders, set conditions/trials/parameters.
- EEG enable/disable per workspace; behavior-only mode skips Clean.

## Analysis

- MNE-based EEG analysis runs inside the app via Pyodide (Python in WebAssembly).
- Custom `pyodide://` Electron protocol serves WASM assets in dev and packaged builds.
- Fixed Clean → Analyze round-trip: cleaned epochs persist and reload correctly.

## Epoch reviewer

- Interactive artifact rejection across epochs and channels.
- Bad-channel flagging and auto-flag suggestions with adjustable sensitivity.
- Live ERP preview and real condition labels in the reviewer.

## Release & quality

- Release workflow gated on test / typecheck / lint before building.
- Build-artifact tests assert the Pyodide payload is present before publishing.
- macOS, Windows, and Linux installers built on GitHub Actions.

# 0.14.2 (September 19, 2020) - TypeScript and tooling update

- TypeScript
- Dependencies update
- CI
- Remove Windows-specific bluetooth overrides

# 0.13.0 (May 18, 2020) - Improved usability and tasks

- Removed remnants of old experiment backend
- Moved to using lab.js with npm
- Cleaned up UI throughout app
- New stimuli for Faces and Houses study
- Clearer customization workflow

# 0.12.0 (Mar 9, 2020) - Project Cleanup and UI fixes

- Randomization bug fixed
- New EEG Data Explorer component
- Fixed the Explore EEG Data screen
- QA and linting over the whole project

# 0.11.2 (Feb 29, 2020) - Additional Updates to Customize Screen

- Clean up Customization

# 0.11.1 (Feb 25, 2020) - Update Customize Screen

- Update the UI for ease of experiment customization

# 0.11.0 (Feb 4, 2020) - Fixes error logging

- Fix error messaging for authentication with Emotiv in app.

# 0.10.1 (Jan 23, 2020) - Minor fixes

# 0.10.0 (Jan 22, 2020) - Add Explore EEG data tab; compat fixes

- Enable EEG for all experiments
- Explore EEG data tab
- Delay the python kernel launch
- fix emotiv compability

# 0.9.1 (Nov 13, 2019)

- Standardize labjs experiments
- Update task descriptions

# 0.9.0 (Nov 12, 2019) - Redesign on landing page; majority lab.js experiments

- Redesign on landing page
- Now using labjs for the majority of experiments
- Option to enable/disable EEG

# 0.8.2 (Jul 17, 2019) - Added Behavioral Results View

- It is now possible to visualize the behavioral results from the experiment.
- Within the app, we present the individual summary data as well as a toggle to plot the raw data.

# 0.8.1 (Apr 9, 2019) - Updated RxJs and removed debug device from menu

- Updated RxJs
- Removed debug device from menu

# 0.8.0 (Apr 1, 2019) - Better behavioural data and simplified Python environment

- Better behavioural data and simplified Python environment
- This release adds Event Type, Expected Key Press, and Correct columns to behavioural data. Hopefully, this makes it easier for students to work with the behavioral data collected from the app.
- The Python environment has also been greatly simplified. We are now using just the dependencies that we actually use in the app instead of the entire recommended set of dependencies from MNE. This should hopefully reduce issues with installation.

# 0.7.5 (Jan 18, 2019) - Hotfix: Updated Emotiv Credentials

- This release includes new Emotiv credentials into the app that should address issues with being unable to create new sessions on Epoc EEG devices.

# 0.7.4 (Jan 16, 2019) - Hotfix: Improved error handling in device connectivity

- This version should be free of Emotiv connectivity issues, as well as provide better error messages about the connection process.
- In the event of a connection failure, notifications will now indicate where along the process of authentication, requesting sessions, and subscribing to data things went wrong.
- Special characters such as "." and "/" that will lead to corrupt directory names will now be automatically removed from text inputs.
- Some typos were also fixed in the app text.

# 0.7.3 (Jan 15, 2019) - Hotfix: device names not displayed; issues connecting to EEG devices

- This update should address issues with device connectivity in the most recent version of the app.
- Some changes introduced in 0.7.2 have been reverted.

# 0.7.2 (Jan 13, 2019) - Custom stimuli titles; Small tweaks

- Custom stimuli should now appear with the correct names in the Analyze and Clean screens
- The Home screen should allow scrolling through workspaces when many of them are created

# 0.7.1 (Dec 4, 2018) - More comprehensive error handling for Emotiv devices

- Improved error handling of Emotiv devices in connectEpic
- Removed debug tools window

# 0.7.0 (Nov 23, 2018) - Win7 compatibility; Subject names in Images; Layout fixes

- Works on Windows 7
- Reduced scale of Y axis in ERP plots
- Added experiment instructions at beginning of experiment
- Tweaked layouts for smaller rez screens
- Added subject name to image filenames

# 0.6.1 (Nov 16, 2018) - Win7 bugfix; Remove menubar

- This has an important bugfix for the code that tries to make the app run on Windows 7.
- Removed the menubar because I thought it looked better (and we're not using it anyway)

# 0.6.0 (Nov 16, 2018) - Offline experiments, illustrations, and Windows 7 support

- This release includes the ability to create custom behaviour only experiments and should hopefully work on Windows 7 computers (by conditionally dropping Muse connectivity when run on a machine detected to be running Windows 7).
- It also has some more illustrations!

# 0.5.1 (Oct 28, 2018) - Small app tweak

- Addressing comments here: [#27](https://github.com/makebrainwaves/BrainWaves/issues/27)

# 0.5.0 (Oct 14, 2018) - Alpha 5 release (Beta?)

- A complete EEG collection and analysis experience for both Emotiv and Muse, restricted to the N170 experiment and custom experiments based on the 2-stimulus protocol.

# 0.4.0 (Oct 1, 2018) - Alpha 4 release

- Contains the custom experiment design feature, as well as lots of UI tweaks

# 0.3.0 (Sep 24, 2018) - Alpha 3 release

- Includes workspace update and re-design of most of the app's UI

# 0.2.0 (Sep 13, 2018) - Alpha 2 release for experiment testing

- Includes some UI redesign as well as corrections to the core experiment collection code that should increase experiment reliability.

# 0.1.0 (Aug 22, 2018) - Alpha release for teacher training

- An early version of the app that should be suitable for running N170 experiments with Emotiv or Muse and getting a feel for what working with the final version will be like.
