/**
 * Functions for selecting files and directories from disk.
 * Uses the electronAPI bridge exposed by the preload script.
 */
import { FILE_TYPES } from '../../constants/constants';

export const loadFromSystemDialog = (
  fileType: FILE_TYPES
): Promise<string | null> => window.electronAPI.loadDialog(fileType);
