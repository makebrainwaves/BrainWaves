// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { isNil } from "lodash";
import { EEGData } from "../../constants/interfaces";

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

export const readEEGDataDir = (type: ?EXPERIMENTS) => {
  if (isNil(type)) {
    return [];
  }
  const files = fs.readdirSync(
    path.join(os.homedir(), "BrainWaves Data", type)
  );
  console.log(files);
  return files;
};

export const getCurrentEEGDataDir = (type: ?EXPERIMENTS) => {
  if (isNil(type)) {
    return "none";
  }
  return path.join(os.homedir(), "BrainWaves Data", type);
};

export const writeHeader = (
  writeStream: fs.writeStream,
  channels: Array<string>
) => {
  const headerLabels = `Timestamp, ${channels.join(",")},Marker\n`;
  writeStream.write(headerLabels);
};

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
