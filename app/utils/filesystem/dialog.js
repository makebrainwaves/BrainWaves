/**
 * Functions involved handling system dialogs
 * These functions are all executed in the main process
 */

import { dialog } from "electron";
import { FILE_TYPES } from "../../constants/constants";

export const loadFile = (event, arg) => {
  switch (arg) {
    case FILE_TYPES.TIMELINE:
    default:
      selectTimeline(event);
  }
};

const selectTimeline = event => {
  dialog.showOpenDialog(
    {
      title: "Select a jsPsych timeline file",
      properties: ["openFile", "promptToCreate"]
    },
    filePaths => {
      if (filePaths) {
        event.sender.send("loadFileReply", filePaths[0]);
      }
    }
  );
};
