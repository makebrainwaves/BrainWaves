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
