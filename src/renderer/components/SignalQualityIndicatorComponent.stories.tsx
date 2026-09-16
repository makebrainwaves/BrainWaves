import type { Meta, StoryObj } from '@storybook/react-vite';
import { interval, map, Observable } from 'rxjs';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import { SIGNAL_QUALITY } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';

const ELECTRODES = [
  'Fpz',
  'AF7',
  'AF3',
  'AF4',
  'AF8',
  'F3',
  'F4',
  'FC5',
  'FC6',
  'T7',
  'T8',
  'M1',
  'M2',
  'TP9',
  'TP10',
  'P7',
  'P8',
  'O1',
  'O2',
];

const QUALITIES = [
  SIGNAL_QUALITY.GREAT,
  SIGNAL_QUALITY.OK,
  SIGNAL_QUALITY.BAD,
  SIGNAL_QUALITY.DISCONNECTED,
];

function fakeSignalQuality(
  pick: (electrodeIndex: number, tick: number) => SIGNAL_QUALITY
): Observable<SignalQualityData> {
  return interval(1000).pipe(
    map((tick) => ({
      epoch: [],
      signalQuality: Object.fromEntries(
        ELECTRODES.map((el, i) => [el, pick(i, tick)])
      ) as unknown as SIGNAL_QUALITY,
      timestamp: Date.now(),
    }))
  );
}

const meta: Meta<typeof SignalQualityIndicatorComponent> = {
  title: 'Domain/SignalQualityIndicator',
  component: SignalQualityIndicatorComponent,
  args: { plottingInterval: 1000 },
};
export default meta;
type Story = StoryObj<typeof SignalQualityIndicatorComponent>;

export const LiveMixedSignal: Story = {
  args: {
    signalQualityObservable: fakeSignalQuality(
      (i, tick) => QUALITIES[(i + tick) % QUALITIES.length]
    ),
  },
};

export const AllGreat: Story = {
  args: {
    signalQualityObservable: fakeSignalQuality(() => SIGNAL_QUALITY.GREAT),
  },
};

export const Disconnected: Story = {
  args: {
    signalQualityObservable: fakeSignalQuality(
      () => SIGNAL_QUALITY.DISCONNECTED
    ),
  },
};

/**
 * Devices rarely populate the full montage — a Muse only reports TP9, AF7,
 * AF8, TP10. Absent electrodes stay hidden.
 */
export const PartialMontageMuse: Story = {
  args: {
    signalQualityObservable: interval(1000).pipe(
      map((tick) => ({
        epoch: [],
        signalQuality: Object.fromEntries(
          ['TP9', 'AF7', 'AF8', 'TP10'].map((el, i) => [
            el,
            QUALITIES[(i + tick) % QUALITIES.length],
          ])
        ) as unknown as SIGNAL_QUALITY,
        timestamp: Date.now(),
      }))
    ),
  },
};

/** No observable yet — the head map renders with all electrodes hidden. */
export const NoData: Story = {
  args: { signalQualityObservable: null },
};
