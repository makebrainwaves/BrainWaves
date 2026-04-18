/**
 * TypeScript declarations for `window.electronAPI`.
 *
 * Keep this in sync with the contextBridge.exposeInMainWorld('electronAPI', ...)
 * block in src/preload/index.ts.
 */
import type {
  DiscoveredStream,
  LSLEpoch,
  LSLInletEpoch,
  LSLMarker,
  LSLStatus,
} from '../../shared/lslTypes';

export {};

declare global {
  interface ElectronAPI {
    // Dialogs
    showOpenDialog: (
      options: Electron.OpenDialogOptions
    ) => Promise<Electron.OpenDialogReturnValue>;
    showMessageBox: (
      options: Electron.MessageBoxOptions
    ) => Promise<Electron.MessageBoxReturnValue>;
    showSaveDialog: (
      options: Electron.SaveDialogOptions
    ) => Promise<Electron.SaveDialogReturnValue>;
    loadDialog: (fileType: string) => Promise<string | null>;

    // Shell
    showItemInFolder: (fullPath: string) => Promise<void>;
    moveItemToTrash: (fullPath: string) => Promise<void>;

    // Filesystem — workspace management
    getWorkspaceDir: (title: string) => Promise<string>;
    createWorkspaceDir: (title: string) => Promise<void>;
    readWorkspaces: () => Promise<string[]>;
    readAndParseState: (dir: string) => Promise<unknown>;
    storeExperimentState: (state: unknown) => Promise<void>;
    restoreExperimentState: (state: unknown) => Promise<void>;
    readWorkspaceRawEEGData: (
      title: string
    ) => Promise<Array<{ name: string; path: string }>>;
    readWorkspaceCleanedEEGData: (
      title: string
    ) => Promise<Array<{ name: string; path: string }>>;
    readWorkspaceBehaviorData: (
      title: string
    ) => Promise<Array<{ name: string; path: string }>>;
    storeBehavioralData: (
      csv: string,
      title: string,
      subject: string,
      group: string,
      session: number
    ) => Promise<void>;
    storePyodideImageSvg: (
      title: string,
      imageTitle: string,
      svgContent: string
    ) => Promise<void>;
    storePyodideImagePng: (
      title: string,
      imageTitle: string,
      rawData: ArrayBuffer
    ) => Promise<void>;
    deleteWorkspaceDir: (title: string) => Promise<void>;
    readImages: (dir: string) => Promise<string[]>;
    getImages: (params: unknown) => Promise<string[]>;
    readBehaviorData: (files: string[]) => Promise<unknown>;
    storeAggregatedBehaviorData: (
      data: unknown,
      title: string
    ) => Promise<void>;
    checkFileExists: (
      title: string,
      subject: string,
      filename: string
    ) => Promise<boolean>;
    readFiles: (filePathsArray: string[]) => Promise<string[]>;

    // EEG streaming
    createEEGWriteStream: (
      title: string,
      subject: string,
      group: string,
      session: number
    ) => Promise<string>;
    writeEEGHeader: (streamId: string, channels: string[]) => void;
    writeEEGData: (streamId: string, data: unknown) => void;
    closeEEGStream: (streamId: string) => Promise<void>;

    // Misc
    getResourcePath: () => Promise<string>;
    getViewerUrl: () => Promise<string>;

    // Bluetooth
    cancelBluetoothSearch: () => Promise<void>;

    // LSL
    sendLSLEpoch: (epoch: LSLEpoch) => void;
    sendLSLMarker: (marker: LSLMarker) => void;
    discoverLSLStreams: () => Promise<DiscoveredStream[]>;
    subscribeLSLStream: (uid: string) => void;
    unsubscribeLSLStream: (uid: string) => void;
    onLSLInletData: (
      handler: (epoch: LSLInletEpoch) => void
    ) => () => void;
    onLSLInletDisconnected: (
      handler: (payload: { uid: string }) => void
    ) => () => void;
    onLSLStatus: (handler: (status: LSLStatus) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}
