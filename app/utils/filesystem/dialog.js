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

const selectTimeline = event => {
  dialog.showOpenDialog(
    {
      title: 'Select a jsPsych timeline file',
      properties: ['openFile', 'promptToCreate']
    },
    filePaths => {
      if (filePaths) {
        event.sender.send('loadDialogReply', filePaths[0]);
      }
    }
  );
};

const selectStimulusFolder = event => {
  dialog.showOpenDialog(
    {
      title: 'Select a folder of images',
      properties: ['openDirectory']
    },
    dir => {
      if(dir){
        event.sender.send('loadDialogReply', dir[0]);
      } else {
        event.sender.send('loadDialogReply', '');
      }
    }
  );
};
