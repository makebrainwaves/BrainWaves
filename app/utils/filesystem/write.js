// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import mkdirp from "mkdirp";
import { has } from "lodash";
import { EEGData } from "../../constants/interfaces";
import { EXPERIMENTS } from "../../constants/constants";

// Creates an appropriate filename and returns a writestream that will write to that file
export const createEEGWriteStream = (
  type: EXPERIMENTS,
  subject: string,
  session: number
) => {
  const dir = getCurrentEEGDataDir(type);
  const fileName = `${subject}_${session}.csv`;

  return fs.createWriteStream(path.join(dir, fileName));
};

// Returns a list of the files in a directory for a given experiment
export const readEEGDataDir = (type: EXPERIMENTS) => {
  if (type === EXPERIMENTS.NONE) {
    return [];
  }
  const dir = path.join(os.homedir(), "BrainWaves Data", type);
  try {
    const fileNames = fs.readdirSync(dir);
    return fileNames.map(fileName => ({ name: fileName, dir }));
  } catch (e) {
    if (e.code === "ENOENT") {
      mkdirPathSync(dir);
    }
    console.log(e);
    return [];
  }
};

// Gets what the EEG directory path should be for a given experiment
export const getCurrentEEGDataDir = (type: EXPERIMENTS) => {
  if (type === EXPERIMENTS.NONE) {
    return "none";
  }
  return path.join(os.homedir(), "BrainWaves Data", type);
};

// Writes the header for a simple CSV EEG file format.
// timestamp followed by channels, followed by markers
export const writeHeader = (
  writeStream: fs.WriteStream,
  channels: Array<string>
) => {
  const headerLabels = `Timestamp, ${channels.join(",")},Marker\n`;
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
  }
  writeStream.write(`0\n`);
};

// ------------------------------------------------------------------------
// Helper functions

// Creates a directory path if it doesn't exist
const mkdirPathSync = dirPath => {
  mkdirp(dirPath, err => {
    if (err) console.error(err);
    else console.log("Created ", dirPath);
  });
};
