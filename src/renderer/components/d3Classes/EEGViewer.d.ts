import type { EEGSnapshot, PlotAnnotation } from '../../../shared/eegVizTypes';
import type {
  ViewerEpoch,
  ViewerGraphParameters,
} from '../../../shared/viewerTypes';

export default class EEGViewer {
  private resizeObserver?: ResizeObserver;

  constructor(svg: SVGSVGElement, parameters: ViewerGraphParameters);
  destroy(): void;
  updateData(epoch: ViewerEpoch): void;
  updateChannels(channels: string[]): void;
  updateDomain(domain: number): void;
  zoomIn(): void;
  zoomOut(): void;
  updateAnnotations(annotations: PlotAnnotation[]): void;
  updateSnapshot(snapshot: EEGSnapshot | null, amplitudeScale?: number): void;
  resize(): void;
}
