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

// Creates a new directory for a given workspace with the passed title if it doesn't already exist
export const createWorkspaceDir = (title: string) => {
  const workspaceDir = path.join(workspaces, title);
  console.log(workspaceDir);
  mkdirPathSync(workspaceDir);
  return workspaceDir;
};

// Writes 'experiment' store state to file as a JSON object
export const storeExperimentState = (state: ExperimentStateType) => {
  const workspaceDir = path.join(workspaces, state.title);
  fs.writeFileSync(
    path.join(workspaceDir, "appState.json"),
    JSON.stringify(state)
  );
  return workspaceDir;
};

// Returns a list of the files in the workspaces directory
export const readWorkspacesDir = () => {
  const dir = path.join(workspaces);
  try {
    return fs.readdirSync(dir);
  } catch (e) {
    if (e.code === "ENOENT") {
      mkdirPathSync(dir);
    }
    console.log(e);
    return [];
  }
};

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
