/** D3 guest receiving data from its own host webview and reporting the plotted viewport. */
import EEGGraph from './components/d3Classes/EEGViewer';
import type { ViewerAPI, ViewerNavigateMessage } from '../shared/viewerTypes';

let graph: EEGGraph | null = null;

declare global {
  interface Window {
    viewerAPI: ViewerAPI;
  }
}

function shouldForwardKey(event: KeyboardEvent) {
  const { target } = event;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, select, textarea, button'))
  )
    return false;
  return true;
}

const api = window.viewerAPI;

function sendNavigation(type: ViewerNavigateMessage['type']) {
  api.reportNavigation({ type });
}
const unsubscribe = [
  api.onInitGraph((parameters) => {
    const svg = document.getElementById('graph');
    if (!(svg instanceof SVGSVGElement)) return;
    graph?.destroy();
    graph = new EEGGraph(svg, parameters, api.reportViewport);
  }),
  api.onNewData((epoch) => graph?.updateData(epoch)),
  api.onZoomIn(() => graph?.zoomIn()),
  api.onZoomOut(() => graph?.zoomOut()),
  api.onUpdateChannels((channels) => graph?.updateChannels(channels)),
  api.onUpdateDomain((domain) => graph?.updateDomain(domain)),
  api.onUpdateAnnotations((annotations) =>
    graph?.updateAnnotations(annotations)
  ),
  api.onUpdateSnapshot(({ snapshot, amplitudeScale }) =>
    graph?.updateSnapshot(snapshot, amplitudeScale)
  ),
  api.onUpdateAmplitudeScale((scale) => graph?.updateAmplitudeScale(scale)),
  api.onAutoScale(() => graph?.autoScale()),
];

function onKeyDown(event: KeyboardEvent) {
  if (!shouldForwardKey(event)) return;
  let handled = true;
  if (event.key === 'ArrowUp') graph?.zoomIn();
  else if (event.key === 'ArrowDown') graph?.zoomOut();
  else if (event.key === 'ArrowLeft') sendNavigation('left');
  else if (event.key === 'ArrowRight') sendNavigation('right');
  else if (event.key === 'Escape') sendNavigation('escape');
  else handled = false;
  if (handled) event.preventDefault();
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener(
  'beforeunload',
  () => {
    unsubscribe.forEach((stop) => stop());
    window.removeEventListener('keydown', onKeyDown);
    graph?.destroy();
    graph = null;
  },
  { once: true }
);
