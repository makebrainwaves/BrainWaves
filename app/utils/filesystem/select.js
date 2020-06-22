// @flow

/**
 *  Functions for selecting files and directories from disk
 */

import { ipcRenderer } from 'electron';
import { FILE_TYPES } from '../../constants/constants';

export const loadFromSystemDialog = (fileType: FILE_TYPES) =>
  new Promise(resolve => {
    ipcRenderer.send('loadDialog', fileType);
    ipcRenderer.on('loadDialogReply', (event, result) => {
      resolve(result);
    });
  });
