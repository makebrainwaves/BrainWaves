// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import {} from "lodash";
import { EEGData } from "../../constants/interfaces";

export const writeHeader = (
  writeStream: fs.writeStream,
  channels: Array<string>
) => {
  const headerLabels = `Timestamp, ${channels.join(",")}, Marker,`;
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
