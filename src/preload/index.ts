/**
 * Preload script for the main BrainWaves window.
 *
 * Exposes a safe `window.electronAPI` object to the renderer via contextBridge.
 * All Node.js / Electron API access that the renderer needs must go through here.
 */
import { contextBridge, ipcRenderer } from 'electron';

// Inject the resource path synchronously so renderer module-level code can use it
// (The main process passes it as --resource-path in additionalArguments)
const resourcePathArg = process.argv.find((arg) =>
  arg.startsWith('--resource-path=')
);
const resourcePath = resourcePathArg
  ? resourcePathArg.replace('--resource-path=', '')
  : '';

contextBridge.exposeInMainWorld('__ELECTRON_RESOURCE_PATH__', resourcePath);

contextBridge.exposeInMainWorld('electronAPI', {
  // ------------------------------------------------------------------
  // Dialogs
  // ------------------------------------------------------------------
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:showOpen', options),

  showMessageBox: (options: Electron.MessageBoxOptions) =>
    ipcRenderer.invoke('dialog:showMessage', options),

  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:showSave', options),

  loadDialog: (fileType: string): Promise<string | null> =>
    ipcRenderer.invoke('loadDialog', fileType),

  // ------------------------------------------------------------------
  // Shell
  // ------------------------------------------------------------------
  showItemInFolder: (fullPath: string) =>
    ipcRenderer.invoke('shell:showItemInFolder', fullPath),

  moveItemToTrash: (fullPath: string) =>
    ipcRenderer.invoke('shell:moveItemToTrash', fullPath),

  // ------------------------------------------------------------------
  // Filesystem — workspace management
  // ------------------------------------------------------------------
  getWorkspaceDir: (title: string): Promise<string> =>
    ipcRenderer.invoke('fs:getWorkspaceDir', title),

  createWorkspaceDir: (title: string): Promise<void> =>
    ipcRenderer.invoke('fs:createWorkspaceDir', title),

  readWorkspaces: (): Promise<string[]> =>
    ipcRenderer.invoke('fs:readWorkspaces'),

  readAndParseState: (dir: string) =>
    ipcRenderer.invoke('fs:readAndParseState', dir),

  storeExperimentState: (state: unknown): Promise<void> =>
    ipcRenderer.invoke('fs:storeExperimentState', state),

  restoreExperimentState: (state: unknown): Promise<void> =>
    ipcRenderer.invoke('fs:restoreExperimentState', state),

  readWorkspaceRawEEGData: (title: string) =>
    ipcRenderer.invoke('fs:readWorkspaceRawEEGData', title),

  readWorkspaceCleanedEEGData: (title: string) =>
    ipcRenderer.invoke('fs:readWorkspaceCleanedEEGData', title),

  readWorkspaceBehaviorData: (title: string) =>
    ipcRenderer.invoke('fs:readWorkspaceBehaviorData', title),

  storeBehavioralData: (
    csv: string,
    title: string,
    subject: string,
    group: string,
    session: number
  ): Promise<void> =>
    ipcRenderer.invoke(
      'fs:storeBehavioralData',
      csv,
      title,
      subject,
      group,
      session
    ),

  storePyodideImage: (
    title: string,
    imageTitle: string,
    rawData: ArrayBuffer
  ): Promise<void> =>
    ipcRenderer.invoke('fs:storePyodideImage', title, imageTitle, rawData),

  deleteWorkspaceDir: (title: string): Promise<void> =>
    ipcRenderer.invoke('fs:deleteWorkspaceDir', title),

  readImages: (dir: string): Promise<string[]> =>
    ipcRenderer.invoke('fs:readImages', dir),

  getImages: (params: unknown): Promise<string[]> =>
    ipcRenderer.invoke('fs:getImages', params),

  readBehaviorData: (files: string[]) =>
    ipcRenderer.invoke('fs:readBehaviorData', files),

  storeAggregatedBehaviorData: (data: unknown, title: string): Promise<void> =>
    ipcRenderer.invoke('fs:storeAggregatedBehaviorData', data, title),

  checkFileExists: (
    title: string,
    subject: string,
    filename: string
  ): Promise<boolean> =>
    ipcRenderer.invoke('fs:checkFileExists', title, subject, filename),

  readFiles: (filePathsArray: string[]): Promise<string[]> =>
    ipcRenderer.invoke('fs:readFiles', filePathsArray),

  // ------------------------------------------------------------------
  // EEG streaming — main process holds the write stream for performance
  // ------------------------------------------------------------------
  createEEGWriteStream: (
    title: string,
    subject: string,
    group: string,
    session: number
  ): Promise<string> =>
    ipcRenderer.invoke('eeg:createWriteStream', title, subject, group, session),

  writeEEGHeader: (streamId: string, channels: string[]): void =>
    ipcRenderer.send('eeg:writeHeader', streamId, channels),

  writeEEGData: (streamId: string, data: unknown): void =>
    ipcRenderer.send('eeg:writeData', streamId, data),

  closeEEGStream: (streamId: string): Promise<void> =>
    ipcRenderer.invoke('eeg:closeStream', streamId),

  // ------------------------------------------------------------------
  // Misc
  // ------------------------------------------------------------------
  getResourcePath: (): Promise<string> =>
    ipcRenderer.invoke('getResourcePath'),

  getViewerUrl: (): Promise<string> =>
    ipcRenderer.invoke('getViewerUrl'),
});
