/**
 * Functions involved handling system dialogs
 * These functions are all executed in the main process
 */

import { dialog } from 'electron';
import { FILE_TYPES } from '../../constants/constants';

export const loadDialog = (event, arg) => {
  switch (arg) {
    case FILE_TYPES.STIMULUS_DIR:
      return selectStimulusFolder(event);

    case FILE_TYPES.TIMELINE:
    default:
      return selectTimeline(event);
  }
};

const selectTimeline = (event) => {
  const filePaths = dialog.showOpenDialog({
    title: 'Select a jsPsych timeline file',
    properties: ['openFile', 'promptToCreate'],
  });
  if (filePaths) {
    event.sender.send('loadDialogReply', filePaths[0]);
  }
};

const selectStimulusFolder = (event) => {
  const dirs = dialog.showOpenDialog({
    title: 'Select a folder of images',
    properties: ['openDirectory'],
  });
  if (dirs) {
    event.sender.send('loadDialogReply', dirs[0]);
  } else {
    event.sender.send('loadDialogReply', '');
  }
};
