/**
 * Preload script for the EEG Viewer window.
 *
 * The viewer uses ipcRenderer directly to receive graph data from the main
 * process. We expose a minimal API for the D3-based viewer renderer.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('viewerAPI', {
  onInitGraph: (callback: (message: unknown) => void) =>
    ipcRenderer.on('initGraph', (_event, message) => callback(message)),

  onNewData: (callback: (message: unknown) => void) =>
    ipcRenderer.on('newData', (_event, message) => callback(message)),

  onZoomIn: (callback: () => void) =>
    ipcRenderer.on('zoomIn', () => callback()),

  onZoomOut: (callback: () => void) =>
    ipcRenderer.on('zoomOut', () => callback()),

  onUpdateChannels: (callback: (message: unknown) => void) =>
    ipcRenderer.on('updateChannels', (_event, message) => callback(message)),

  onUpdateDomain: (callback: (message: unknown) => void) =>
    ipcRenderer.on('updateDomain', (_event, message) => callback(message)),

  onUpdateDownsampling: (callback: (message: unknown) => void) =>
    ipcRenderer.on('updateDownsampling', (_event, message) => callback(message)),

  onAutoScale: (callback: () => void) =>
    ipcRenderer.on('autoScale', () => callback()),
});
