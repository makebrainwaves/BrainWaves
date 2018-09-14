// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import recursive from "recursive-readdir";
import mkdirp from "mkdirp";
import { has } from "lodash";
import { EEGData } from "../../constants/interfaces";
import { EXPERIMENTS } from "../../constants/constants";

// Creates an appropriate filename and returns a writestream that will write to that file
export const createEEGWriteStream = (
  title: string,
  subject: string,
  session: number
) => {
  const dir = path.join(
    os.homedir(),
    "BrainWaves Workspaces",
    title,
    "data",
    subject,
    "EEG"
  );
  mkdirPathSync(dir);
  const fileName = `${subject}_${session}_raw.csv`;

  return fs.createWriteStream(path.join(dir, fileName));
};

// Returns a list of the files in a directory for a given experiment
export const readWorkspaceRawEEGData = async (title: string) => {
  const dir = path.join(os.homedir(), "BrainWaves Workspaces", title, "data");
  // let files = [];
  const files = await recursive(dir);
  return files.map(filepath => ({
    name: path.basename(filepath),
    path: filepath
  }));
};

// Gets what the EEG directory path should be for a given experiment
export const getCurrentEEGDataDir = (title: string) => {
  return path.join(os.homedir(), "BrainWaves Workspaces", title);
};

// Writes the header for a simple CSV EEG file format.
// timestamp followed by channels, followed by markers
export const writeHeader = (
  writeStream: fs.WriteStream,
  channels: Array<string>
) => {
  const headerLabels = `Timestamp,${channels.join(",")},Marker\n`;
  writeStream.write(headerLabels);
};

// Writes an array of EEG data to a CSV through an active WriteStream
export const writeEEGData = (writeStream: fs.WriteStream, eegData: EEGData) => {
  writeStream.write(`${eegData.timestamp},`);
  const len = eegData.data.length;
  for (let i = 0; i < len; i++) {
    writeStream.write(`${eegData.data[i].toString()},`); // Round data
  }
  if (has(eegData, "marker")) {
    writeStream.write(`${eegData["marker"]}\n`);
  } else {
    writeStream.write(`0\n`);
  }
};

// ------------------------------------------------------------------------
// Helper functions

// Creates a directory path if it doesn't exist
export const mkdirPathSync = dirPath => {
  mkdirp(dirPath, err => {
    if (err) console.error(err);
    else console.log("Created ", dirPath);
  });
};
