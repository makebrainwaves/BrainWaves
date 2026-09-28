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
  /** Fixed trace colors, index-aligned with `channels`; absent = each epoch's quality colors. */
  channelColours?: string[];
  annotations: PlotAnnotation[];
  snapshot: EEGSnapshot | null;
  amplitudeScale?: number;
}

export interface ViewerSnapshotUpdate {
  snapshot: EEGSnapshot | null;
  amplitudeScale?: number;
}

export interface ViewerChannelsUpdate {
  channels: string[];
  /** Same contract as `ViewerGraphParameters.channelColours`. */
  channelColours?: string[];
}

export interface ViewerMessages {
  initGraph: ViewerGraphParameters;
  newData: ViewerEpoch;
  zoomIn: undefined;
  zoomOut: undefined;
  updateChannels: ViewerChannelsUpdate;
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
