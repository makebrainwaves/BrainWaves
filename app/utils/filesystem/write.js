// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
  mkdirPathSync(dir);

  return fs.createWriteStream(path.join(dir, fileName));
};

// Returns a list of the files in a directory for a given experiment
export const readEEGDataDir = (type: EXPERIMENTS) => {
  if (type === EXPERIMENTS.NONE) {
    return [];
  }

  try {
    const dir = fs.realpathSync(
      path.join(os.homedir(), "BrainWaves Data", type)
    );
    const fileNames = fs.readdirSync(dir);
    return fileNames.map(fileName => ({ name: fileName, dir }));
  } catch (e) {
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
  for (let i = 0; i < len - 1; i++) {
    writeStream.write(`${eegData.data[i].toString()},`); // Round data
  }
  writeStream.write(`${eegData.data[len - 1].toString()}\n`);
};

// ------------------------------------------------------------------------
// Helper functions

// Creates a directory path if it doesn't exist
// From https://stackoverflow.com/questions/13696148/node-js-create-folder-or-use-existing/24311711
const mkdirPathSync = dirPath => {
  const parts = dirPath.split(path.sep);
  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
};

const mkdirSync = dirPath => {
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};
