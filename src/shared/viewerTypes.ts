import type {
  EEGSnapshot,
  PlotAnnotation,
  PlotTimeWindow,
} from './eegVizTypes';

export interface ViewerEpoch {
  data: number[][];
  info: {
    samplingRate: number;
    startTime: number;
    channelNames?: string[];
  };
  signalQuality: Record<string, string>;
}

export interface ViewerGraphParameters {
  channels: string[];
  plottingInterval: number;
  domain: number;
  channelColours: string[];
  annotations: PlotAnnotation[];
  snapshot: EEGSnapshot | null;
  amplitudeScale?: number;
}

/** Guest CSS-pixel geometry excludes the sensor-label gutter and time axis. */
export interface ViewerViewport {
  timeWindow: PlotTimeWindow;
  plotBounds: { left: number; top: number; width: number; height: number };
}

export interface ViewerSnapshotUpdate {
  snapshot: EEGSnapshot | null;
  amplitudeScale?: number;
}

export interface ViewerMessages {
  initGraph: ViewerGraphParameters;
  newData: ViewerEpoch;
  zoomIn: undefined;
  zoomOut: undefined;
  navigate: { type: 'left' | 'right' | 'escape' };
  updateChannels: string[];
  updateDomain: number;
  updateAnnotations: PlotAnnotation[];
  updateSnapshot: ViewerSnapshotUpdate;
  updateAmplitudeScale: number | undefined;
  autoScale: undefined;
}

type ViewerListener<K extends keyof ViewerMessages> = (
  callback: (message: ViewerMessages[K]) => void
) => () => void;

export interface ViewerNavigateMessage {
  type: 'left' | 'right' | 'escape';
}

export interface ViewerAPI {
  onInitGraph: ViewerListener<'initGraph'>;
  onNewData: ViewerListener<'newData'>;
  onZoomIn: ViewerListener<'zoomIn'>;
  onZoomOut: ViewerListener<'zoomOut'>;
  onNavigate: ViewerListener<'navigate'>;
  onUpdateChannels: ViewerListener<'updateChannels'>;
  onUpdateDomain: ViewerListener<'updateDomain'>;
  onUpdateAnnotations: ViewerListener<'updateAnnotations'>;
  onUpdateSnapshot: ViewerListener<'updateSnapshot'>;
  onUpdateAmplitudeScale: ViewerListener<'updateAmplitudeScale'>;
  onAutoScale: ViewerListener<'autoScale'>;
  reportViewport: (viewport: ViewerViewport) => void;
  reportNavigation: (message: ViewerNavigateMessage) => void;
}
