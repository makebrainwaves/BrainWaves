/**
 * EEG Viewer renderer — uses the viewerAPI exposed by src/preload/viewer.ts
 * to receive graph data from the main process via IPC.
 */
import EEGGraph from './components/d3Classes/EEGViewer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let graph: any = {};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    viewerAPI: any;
  }
}

window.viewerAPI.onInitGraph((message: unknown) => {
  graph = new EEGGraph(document.getElementById('graph'), message);
});

window.viewerAPI.onNewData((message: unknown) => {
  graph.updateData(message);
});

window.viewerAPI.onZoomIn(() => {
  graph.zoomOut();
});

window.viewerAPI.onZoomOut(() => {
  graph.zoomIn();
});

window.viewerAPI.onUpdateChannels((message: unknown) => {
  graph.updateChannels(message);
});

window.viewerAPI.onUpdateDomain((message: unknown) => {
  graph.updateDomain(message);
});

window.viewerAPI.onUpdateDownsampling((message: unknown) => {
  graph.updateDownsampling(message);
});

window.viewerAPI.onAutoScale(() => {
  graph.autoScale();
});
