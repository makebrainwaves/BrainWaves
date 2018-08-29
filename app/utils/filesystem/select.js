// @flow

/**
 *  Functions for selecting files and directories from disk
 */

import { ipcRenderer } from "electron";

export const loadFileFromSystemDialog = (fileType: string) =>
  new Promise(resolve => {
    ipcRenderer.send("loadFile", fileType);
    ipcRenderer.on("loadFileReply", (event, result) => {
      resolve(result);
    });
  });
