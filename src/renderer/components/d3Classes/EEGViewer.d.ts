import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import type {
  ViewerEpoch,
  ViewerGraphParameters,
  ViewerViewport,
} from '../../../shared/viewerTypes';

export default class EEGViewer {
  private resizeObserver?: ResizeObserver;

  constructor(
    svg: SVGSVGElement,
    parameters: ViewerGraphParameters,
    reportViewport?: (viewport: ViewerViewport) => void
  );
  destroy(): void;
  updateData(epoch: ViewerEpoch): void;
  updateChannels(channels: string[]): void;
  updateDomain(domain: number): void;
  zoomIn(): void;
  zoomOut(): void;
  autoScale(): void;
  updateAnnotations(annotations: PlotAnnotation[]): void;
  updateSnapshot(snapshot: EEGSnapshot | null, amplitudeScale?: number): void;
  updateAmplitudeScale(scale?: number): void;
  resize(): void;
}
