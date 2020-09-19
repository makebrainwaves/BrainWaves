# Roadmap

## Overview

July/August 2020: Jiffy Lube & Pyodide
Fall 2020+: LSL & Lab.js

## Pyodide

- Successfully added pyodide via webworker
- TODO: Create plots to pass to js side as MIME strings
- TODO: Update app flow to get rid of Clean step -- using rejection critera in Epoch instead
- TODO: Generate epochs CSV in pyodide and pass back to JS for writing to disk
- TODO: Add micropip to package pure python dependencies for offline usage
- TODO: Figure out how to keep pyodide updated? Decide on version that's suitable for long term support

## LSL

- Cut out emotiv SDK garbage
- Make EEG logic simpler
- Support multiple devices (e.g. Notion)
- May require reliance on outside LSL stream creation (via Emotiv client or BlueMuse or Notion SDK)
- Will involve translating markers to LSL stream: will increase accuracy and improve results likely
- Opens up door for cool stuff like eye tracking and microphone input
- TODO: Talk to Neurosity about suitability of Notion
- TODO: Talk to LSL about how to get easy cross-platform LSL clients for arbitrary EEG headsets
- Consider platform requirements (win/mac)

## Lab.js

- Type lab.js data (pending lab.js TypeScript library update)
- Remove jspsych and refactor lab.js usage

## Non-technical stuff

- Share on HN/reddit
- Consider writing short papers for JOSS and/or Journal of Open Source Education
- UCSD
