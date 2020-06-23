

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import * as path from "path";
import mkdirp from "mkdirp";
import { has } from "lodash";
import { getWorkspaceDir } from "./storage";
import { EEGData } from "../../constants/interfaces";

// Creates an appropriate filename and returns a writestream that will write to that file
export const createEEGWriteStream = (title: string, subject: string, group: string, session: number) => {
  try {
    const dir = path.join(getWorkspaceDir(title), 'Data', subject, 'EEG');
    const filename = `${subject}-${group}-${session}-raw.csv`;
    mkdirPathSync(dir);
    return fs.createWriteStream(path.join(dir, filename));
  } catch (e) {
    console.log('createEEGWriteStream: ', e);
  }
};

// Writes the header for a simple CSV EEG file format.
// timestamp followed by channels, followed by markers
export const writeHeader = (writeStream: fs.WriteStream, channels: Array<string>) => {
  try {
    const headerLabels = `Timestamp,${channels.join(',')},Marker\n`;
    writeStream.write(headerLabels);
  } catch (e) {
    console.log('writeHeader: ', e);
  }
};

// Writes an array of EEG data to a CSV through an active WriteStream
export const writeEEGData = (writeStream: fs.WriteStream, eegData: EEGData) => {
  writeStream.write(`${eegData.timestamp},`);
  const len = eegData.data.length;
  for (let i = 0; i < len; i++) {
    writeStream.write(`${eegData.data[i].toString()},`); // Round data
  }
  if (has(eegData, 'marker')) {
    writeStream.write(`${eegData['marker']}\n`);
  } else {
    writeStream.write(`0\n`);
  }
};

// ------------------------------------------------------------------------
// Helper functions

// Creates a directory path if it doesn't exist
export const mkdirPathSync = dirPath => {
  mkdirp.sync(dirPath);
};