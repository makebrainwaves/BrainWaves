/** IPC bridge between an EEG webview guest and its owning renderer component. */
import { contextBridge, ipcRenderer } from 'electron';
import type { ViewerAPI, ViewerMessages } from '../shared/viewerTypes';

function listen<K extends keyof ViewerMessages>(
  channel: K,
  callback: (message: ViewerMessages[K]) => void
): () => void {
  const listener = (
    _event: Electron.IpcRendererEvent,
    message: ViewerMessages[K]
  ) => callback(message);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const viewerAPI: ViewerAPI = {
  onInitGraph: (callback) => listen('initGraph', callback),
  onNewData: (callback) => listen('newData', callback),
  onZoomIn: (callback) => listen('zoomIn', callback),
  onZoomOut: (callback) => listen('zoomOut', callback),
  onUpdateChannels: (callback) => listen('updateChannels', callback),
  onUpdateDomain: (callback) => listen('updateDomain', callback),
  onUpdateAnnotations: (callback) => listen('updateAnnotations', callback),
  onUpdateSnapshot: (callback) => listen('updateSnapshot', callback),
  reportNavigation: (message) =>
    ipcRenderer.sendToHost('viewer:navigate', message),
};

contextBridge.exposeInMainWorld('viewerAPI', viewerAPI);
