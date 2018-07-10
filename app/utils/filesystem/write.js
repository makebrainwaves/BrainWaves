// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as fs from "fs";
import {} from "lodash";

export const writeHeader = (
  writeStream: fs.writeStream,
  channels: Array<string>
) => {
  const headerLabels = `Timestamp, ${channels}, Marker`;
  writeStream.write(headerLabels);
};

