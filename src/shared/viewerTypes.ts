import type { EEGSnapshot, PlotAnnotation } from './eegVizTypes';

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

export interface ViewerSnapshotUpdate {
  snapshot: EEGSnapshot | null;
  amplitudeScale?: number;
}

export interface ViewerMessages {
  initGraph: ViewerGraphParameters;
  newData: ViewerEpoch;
  zoomIn: undefined;
  zoomOut: undefined;
  updateChannels: string[];
  updateDomain: number;
  updateAnnotations: PlotAnnotation[];
  updateSnapshot: ViewerSnapshotUpdate;
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
  onUpdateChannels: ViewerListener<'updateChannels'>;
  onUpdateDomain: ViewerListener<'updateDomain'>;
  onUpdateAnnotations: ViewerListener<'updateAnnotations'>;
  onUpdateSnapshot: ViewerListener<'updateSnapshot'>;
  reportNavigation: (message: ViewerNavigateMessage) => void;
}
