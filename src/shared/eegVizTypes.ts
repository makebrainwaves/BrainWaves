/** Sample-clock timestamps in milliseconds, shared by plots and lesson annotations. */
export interface PlotTimeWindow {
  startTime: number;
  endTime: number;
}

export interface PlotAnnotation extends Omit<PlotTimeWindow, 'endTime'> {
  id: string;
  endTime: number | null;
  label: string;
  endLabel?: string;
  tone: 'blink' | 'eyes-closed';
}

/** An owned, frozen copy of channel-major samples in microvolts. */
export interface EEGSnapshot extends PlotTimeWindow {
  data: number[][];
  channels: string[];
  samplingRate: number;
  peakToPeak: number;
}
