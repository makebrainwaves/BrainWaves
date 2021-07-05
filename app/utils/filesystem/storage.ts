/**
 *  Functions for managing user data stored on disk
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import recursive from 'recursive-readdir';
import { shell, remote } from 'electron';
import Papa from 'papaparse';
import mkdirp from 'mkdirp';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import { ExperimentParameters } from '../../constants/interfaces';

const workspaces = path.join(os.homedir(), 'BrainWaves_Workspaces');
const { dialog } = remote;

// -----------------------------------------------------------------------------------------------
// Creating and Getting

// Gets the absolute path for a workspace from a given title
export const getWorkspaceDir = (title: string) => path.join(workspaces, title);

// Creates a new directory for a given workspace with the passed title if it doesn't already exist
export const createWorkspaceDir = (title: string) =>
  mkdirPathSync(getWorkspaceDir(title));

// Opens a workspace folder in explorer (or other native OS filesystem browser)
export const openWorkspaceDir = (title: string) =>
  shell.showItemInFolder(path.join(workspaces, title));

// -----------------------------------------------------------------------------------------------
// Storing

// Writes experiment tree state to file as a JSON object
export const storeExperimentState = (state: ExperimentStateType) => {
  fs.writeFileSync(
    path.join(getWorkspaceDir(state.title), 'appState.json'),
    JSON.stringify(state)
  );
};

export const restoreExperimentState = (state: ExperimentStateType) => {
  if (state.type !== 'NONE') {
    const timestampedState: ExperimentStateType = {
      ...state,
      subject: '',
      group: '',
      session: 1,
    };
    if (!timestampedState.title) {
      return;
    }
    fs.writeFileSync(
      path.join(getWorkspaceDir(timestampedState.title), 'appState.json'),
      JSON.stringify(timestampedState)
    );
  }
};

export const storeBehavioralData = (
  csv: string,
  title: string,
  subject: string,
  group: string,
  session: number
) => {
  const dir = path.join(getWorkspaceDir(title), 'Data', subject, 'Behavior');
  const filename = `${subject}-${group}-${session}-behavior.csv`;
  mkdirPathSync(dir);
  fs.writeFile(path.join(dir, filename), csv, (err) => {
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
  fs.writeFile(path.join(dir, filename), rawData, (err) => {
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
    return fs
      .readdirSync(workspaces)
      .filter((workspace) => workspace !== '.DS_Store');
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
      .filter((filepath) => filepath.slice(-7).includes('raw.csv'))
      .map((filepath) => ({
        name: path.basename(filepath),
        path: filepath,
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
      .filter((filepath) => filepath.slice(-7).includes('epo.fif'))
      .map((filepath) => ({
        name: path.basename(filepath),
        path: filepath,
      }));
  } catch (e) {
    console.log(e);
    return [];
  }
};

// Returns a list of the behavioral CSV files in a workspace
export const readWorkspaceBehaviorData = async (
  title: string
): Promise<{ name: string; path: string }[]> => {
  try {
    const files: string[] = await recursive(getWorkspaceDir(title));
    const behaviorFiles = files
      .filter((filepath) => filepath.slice(-12).includes('behavior.csv'))
      .map((filepath) => ({
        name: path.basename(filepath),
        path: filepath,
      }));
    return behaviorFiles;
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(e);
    }
    return [];
  }
};

// Reads an experiment state tree from disk and parses it from JSON
export const readAndParseState = (dir: string): ExperimentStateType | null => {
  try {
    const state = JSON.parse(
      fs.readFileSync(path.join(workspaces, dir, 'appState.json'), {
        encoding: 'utf8',
      })
    );
    return state;
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('appState does not exist for recent workspace');
    }
    return null;
  }
};

// Reads a list of images that are in a directory
export const readImages = (dir: string) =>
  fs.readdirSync(dir).filter((filename) => {
    const extension = filename.slice(-3).toLowerCase();
    return (
      extension === 'png' ||
      extension === 'jpg' ||
      extension === 'gif' ||
      extension === 'peg' // support .jpeg?
    );
  });

// Returns an array of images that are used in a timeline for use in preloading
export const getImages = (params: ExperimentParameters) => {
  if (!params.stimuli) {
    return [];
  }
  const images: string[] = [];

  for (const stimuli of params.stimuli) {
    const { dir } = stimuli;
    if (dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        images.push(path.join(dir, file));
      }
    }
  }
  return images;
};

// -----------------------------------------------------------------------------------------------
// Util

// Creates a directory path if it doesn't exist
export const mkdirPathSync = (dirPath) => {
  mkdirp.sync(dirPath);
};

export const getSubjectNamesFromFiles = (filePaths: Array<string>) =>
  filePaths
    .map((filePath) => path.basename(filePath))
    .map((fileName) => fileName.substring(0, fileName.indexOf('-')));

// Read CSV files with behavioral data and return an object
export const readBehaviorData = (files: Array<string>) => {
  try {
    return files.map((file) => {
      const csv = fs.readFileSync(file, 'utf-8');
      const obj = convertCSVToObject(csv);
      obj.meta.datafile = file;
      return obj;
    });
  } catch (e) {
    console.log('error', e);
    return null;
  }
};

export const storeAggregatedBehaviorData = (data, title) => {
  const csv = convertObjectToSCV(data);
  saveFileOnDisk(csv, title);
};

const saveFileOnDisk = (data, title) => {
  dialog.showSaveDialog({
    title: 'Select a folder to save the data',
    defaultPath: path.join(getWorkspaceDir(title), 'Data', `aggregated.csv`),
  });
};

// convert a csv file to an object with Papaparse
const convertCSVToObject = (csv) => {
  const data = Papa.parse(csv, {
    header: true,
  });
  return data;
};

// convert an object to a csv file with Papaparse
const convertObjectToSCV = (data) => {
  const csv = Papa.unparse(data);
  return csv;
};

// Deletes a workspace folder
export const deleteWorkspaceDir = (title: string) => {
  shell.moveItemToTrash(path.join(workspaces, title));
};

// Check whether the file with the given name already exists in the filesystem
export const checkFileExists = (title, subject, filename) => {
  const file = path.join(
    getWorkspaceDir(title),
    'Data',
    subject,
    'Behavior',
    filename
  );
  const fileExists = fs.existsSync(file);
  return fileExists;
};
