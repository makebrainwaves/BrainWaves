// @flow

/**
 *  Functions for managing user data stored on disk
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ExperimentStateType } from "../../reducers/experimentReducer";
import { mkdirPathSync } from "./write";

const workspaces = path.join(os.homedir(), "BrainWaves Workspaces");

// -----------------------------------------------------------------------------------------------
// Creating and Getting

// Creates a new directory for a given workspace with the passed title if it doesn't already exist
export const createWorkspaceDir = (title: string) =>
  mkdirPathSync(getWorkspaceDir(title));

// Gets the absolute path for a workspace from a given title
export const getWorkspaceDir = (title: string) => path.join(workspaces, title);

// -----------------------------------------------------------------------------------------------
// Storing

// Writes 'experiment' store state to file as a JSON object
export const storeExperimentState = (state: ExperimentStateType) =>
  fs.writeFileSync(
    path.join(getWorkspaceDir(state.title), "appState.json"),
    JSON.stringify(state)
  );

export const storeBehaviouralData = (
  csv: string,
  title: string,
  subject: string,
  session: string
) => {
  const dir = path.join(getWorkspaceDir(title), "data", subject, "Behavior");
  const filename = `${subject}-${session}-behavior.csv`;
  mkdirPathSync(dir);
  fs.writeFileSync(path.join(dir, filename), csv);
};

// -----------------------------------------------------------------------------------------------
// Reading

// Returns a list of workspaces in the workspaces directory. Will make the workspaces dir if it doesn't exist yet
export const readWorkspaces = () => {
  try {
    return fs.readdirSync(workspaces);
  } catch (e) {
    if (e.code === "ENOENT") {
      mkdirPathSync(workspaces);
    }
    console.log(e);
    return [];
  }
};

// Returns a list of the raw EEG files in a workspace
// TODO: Test this
export const readWorkspaceRawEEGData = async (title: string) => {
  try {
    // const files = await recursive(getWorkspaceDir(title));
    const files = [];
    console.log(files);
    const rawFiles = files
      .filter(filepath => filepath.slice(-7).includes("raw.csv"))
      .map(filepath => ({
        name: path.basename(filepath),
        path: filepath
      }));
    console.log(rawFiles);
    return rawFiles;
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log(e);
      return [];
    }
  }
};

// Returns a list of the cleaned EEG files in a workspace
// TODO: Test this
export const readWorkspaceCleanedEEGData = async (title: string) => {
  try {
    // const files = await recursive(getWorkspaceDir(title));
    const files = [];
    return files
      .filter(filepath => filepath.slice(-7).includes("epo.fif"))
      .map(filepath => ({
        name: path.basename(filepath),
        path: filepath
      }));
  } catch (e) {
    if (e.code === "ENOENT") {
      mkdirPathSync(dir);
    }
    console.log(e);
    return [];
  }
};

// Reads an experiment state tree from disk and parses it from JSON
export const readAndParseState = (dir: string) => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(workspaces, dir, "appState.json"))
    );
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log("appState does not exist for recent workspace");
    }
    return null;
  }
};