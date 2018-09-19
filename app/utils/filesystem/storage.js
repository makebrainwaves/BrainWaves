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
export const storeExperimentState = (
  state: ExperimentStateType,
  dir: string
) => {
  console.log("writing ", JSON.stringify(state), " to ", dir + "appState.json");

  fs.writeFileSync(path.join(dir, "appState.json"), JSON.stringify(state));
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
  return JSON.parse(
    fs.readFileSync(path.join(workspaces, dir, "appState.json"))
  );
};

// export const readAndParseState = (dir: string) => {
//   const state = JSON.parse(
//     fs.readFileSync(path.join(workspaces, dir, "appState.json")),
//     (key, value) => {
//       if (typeof value !== "string" || value.length < 8) {
//         return value;
//       }

//       const prefix = value.substring(0, 8);

//       if (prefix === "function") {
//         return eval("(" + value + ")");
//       }
//       if (prefix === "_NuFrRa_") {
//         return eval(value.slice(8));
//       }
//       return value;
//     }
//   );
//   return state;
// };

// // Converts a JS Object to JSON but preserves functions
// // TODO: Figure out how to get functions to be recreated when read
// export const stringifyWithFunctions = (object: Object) => {
//   const json = JSON.stringify(
//     object,
//     (key, value) => {
//       if (typeof value === "function") {
//         const fnBody = value.toString();
//         if (fnBody.length < 8 || fnBody.substring(0, 8) !== "function") {
//           //this is ES6 Arrow Function
//           return "_NuFrRa_" + fnBody;
//         }
//         return fnBody;
//       }
//       return value;
//     },
//     2
//   );
//   return json;
// };
