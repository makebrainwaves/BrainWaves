// @flow

/**
 *  Functions for managing user data stored on disk
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import recursive from 'recursive-readdir';
import { shell } from 'electron';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import { mkdirPathSync } from './write';

const workspaces = path.join(os.homedir(), 'BrainWaves Workspaces');

// -----------------------------------------------------------------------------------------------
// Creating and Getting

// Creates a new directory for a given workspace with the passed title if it doesn't already exist
export const createWorkspaceDir = (title: string) =>
  mkdirPathSync(getWorkspaceDir(title));

// Gets the absolute path for a workspace from a given title
export const getWorkspaceDir = (title: string) => path.join(workspaces, title);

// Opens a workspace folder in explorer (or other native OS filesystem browser)
export const openWorkspaceDir = (title: string) =>
  shell.openItem(path.join(workspaces, title));

// -----------------------------------------------------------------------------------------------
// Storing

// Writes 'experiment' store state to file as a JSON object
export const storeExperimentState = (state: ExperimentStateType) =>
  fs.writeFileSync(
    path.join(getWorkspaceDir(state.title), 'appState.json'),
    JSON.stringify(state)
  );

export const storeBehaviouralData = (
  csv: string,
  title: string,
  subject: string,
  session: number
) => {
  const dir = path.join(getWorkspaceDir(title), 'Data', subject, 'Behavior');
  const filename = `${subject}-${session}-behavior.csv`;
  mkdirPathSync(dir);
  fs.writeFile(path.join(dir, filename), csv, err => {
    if (err) {
      console.error(err);
    }
  });
};

// Stores an image to workspace dir
export const storeJupyterImage = (
  title: string,
  imageTitle: string,
  rawData: Buffer
) => {
  const dir = path.join(getWorkspaceDir(title), 'Results', 'Images');
  const filename = `${imageTitle}.png`;
  mkdirPathSync(dir);
  fs.writeFile(path.join(dir, filename), rawData, err => {
    if (err) {
      console.error(err);
    }
  });
};

// -----------------------------------------------------------------------------------------------
// Reading

// Returns a list of workspaces in the workspaces directory. Will make the workspaces dir if it doesn't exist yet
export const readWorkspaces = () => {
  try {
    return fs.readdirSync(workspaces);
  } catch (e) {
    if (e.code === 'ENOENT') {
      mkdirPathSync(workspaces);
    }
    console.log(e);
    return [];
  }
};

// Returns a list of the raw EEG files in a workspace
export const readWorkspaceRawEEGData = async (title: string) => {
  try {
    const files = await recursive(getWorkspaceDir(title));
    const rawFiles = files
      .filter(filepath => filepath.slice(-7).includes('raw.csv'))
      .map(filepath => ({
        name: path.basename(filepath),
        path: filepath
      }));
    return rawFiles;
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(e);
      return [];
    }
  }
};

// Returns a list of the cleaned EEG files in a workspace
export const readWorkspaceCleanedEEGData = async (title: string) => {
  try {
    const files = await recursive(getWorkspaceDir(title));
    return files
      .filter(filepath => filepath.slice(-7).includes('epo.fif'))
      .map(filepath => ({
        name: path.basename(filepath),
        path: filepath
      }));
  } catch (e) {
    console.log(e);
    return [];
  }
};

// Returns a list of the behavioral CSV files in a workspace
export const readWorkspaceBehaviorData = async (title: string) => {
  try {
    const files = await recursive(getWorkspaceDir(title));
    const behaviorFiles = files
      .filter(filepath => filepath.slice(-12).includes('behavior.csv'))
      .map(filepath => ({
        name: path.basename(filepath),
        path: filepath
      }));
    return behaviorFiles;
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(e);
      return [];
    }
  }
};

// Reads an experiment state tree from disk and parses it from JSON
export const readAndParseState = (dir: string) => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(workspaces, dir, 'appState.json'))
    );
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('appState does not exist for recent workspace');
    }
    return null;
  }
};

// Reads a list of images that are in a directory
export const readImages = (dir: string) =>
  fs.readdirSync(dir).filter(filename => {
    const extension = filename.slice(-3);
    return (
      extension === 'png' ||
      extension === 'jpg' ||
      extension === 'gif' ||
      extension === 'peg' // support .jpeg?
    );
  });

// -----------------------------------------------------------------------------------------------
// Util

export const getSubjectNamesFromFiles = (filePaths: Array<?string>) =>
  filePaths
    .map(filePath => path.basename(filePath))
    .map(fileName => fileName.substring(0, fileName.indexOf('-')));
