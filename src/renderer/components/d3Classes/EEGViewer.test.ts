import { afterEach, describe, expect, it, vi } from 'vitest';
import EEGViewer from './EEGViewer';
import type { EEGSnapshot } from '../../../shared/eegVizTypes';
import type {
  ViewerGraphParameters,
  ViewerViewport,
} from '../../../shared/viewerTypes';

const graphs: EEGViewer[] = [];

function createGraph(overrides: Partial<ViewerGraphParameters> = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(svg);
  let width = 548;
  let height = 256;
  vi.spyOn(svg, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  }));
  const onViewport = vi.fn<(viewport: ViewerViewport) => void>();
  const graph = new EEGViewer(
    svg,
    {
      channels: ['AF7', 'AF8'],
      plottingInterval: 250,
      domain: 5000,
      channelColours: ['#66B0A9', '#66B0A9'],
      annotations: [],
      snapshot: null,
      ...overrides,
    },
    onViewport
  );
  graphs.push(graph);
  return {
    graph,
    svg,
    onViewport,
    resize: (nextWidth: number, nextHeight: number) => {
      width = nextWidth;
      height = nextHeight;
      graph.resize();
    },
  };
}

function epoch(startTime: number, data: number[][]) {
  return {
    data,
    info: {
      startTime,
      samplingRate: 2,
      channelNames: ['TP9', 'AF7', 'AF8', 'TP10'],
    },
    signalQuality: { AF7: '#66B0A9', AF8: '#66B0A9' },
  };
}

afterEach(() => {
  graphs.splice(0).forEach((graph) => graph.destroy());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('EEGViewer time and amplitude coordinates', () => {
  it('selects named channels and reports a consistent moving time window', () => {
    const { graph, svg, onViewport } = createGraph();
    graph.updateAnnotations([
      {
        id: 'blink',
        startTime: 2000,
        endTime: 3000,
        label: 'Blink',
        tone: 'blink',
      },
    ]);
    graph.updateData(
      epoch(1000, [
        [999, 999],
        [0, 10],
        [0, -10],
        [999, 999],
      ])
    );
    expect(onViewport.mock.lastCall?.[0].timeWindow).toEqual({
      startTime: -3000,
      endTime: 2000,
    });
    expect(svg.querySelector('.line')?.getAttribute('d')).toContain('L');
    expect(svg.querySelector('.annotation-band')).not.toBeNull();
  });

  it('uses a solid left edge and hides the open eyes-closed right edge', () => {
    const { graph, svg } = createGraph();
    const open = {
      id: 'alpha',
      startTime: 1000,
      endTime: null,
      label: 'Eyes closed',
      endLabel: 'Eyes open',
      tone: 'eyes-closed' as const,
    };
    graph.updateAnnotations([open]);
    graph.updateData(
      epoch(1000, [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ])
    );
    const left = svg.querySelector('line.annotation-band-edge--left');
    const right = svg.querySelector('line.annotation-band-edge--right');
    expect(left?.getAttribute('stroke-width')).toBe('2');
    expect(left?.getAttribute('stroke-dasharray')).toBeNull();
    expect(right?.getAttribute('visibility')).toBe('hidden');

    graph.updateAnnotations([{ ...open, endTime: 1800 }]);
    expect(right?.getAttribute('visibility')).toBe('visible');
  });

  it('renders snapshots without subscribing to live data', () => {
    const calm: EEGSnapshot = {
      channels: ['AF7'],
      data: [[100, 110, 100, 90, 100]],
      samplingRate: 1,
      startTime: 1000,
      endTime: 6000,
      peakToPeak: 20,
    };
    const { svg, onViewport } = createGraph({
      channels: ['AF7'],
      snapshot: calm,
      amplitudeScale: 100,
    });
    const line = svg.querySelector('.line');
    expect(line).not.toBeNull();
    expect(line!.getAttribute('d')).toContain('L');
    expect(onViewport.mock.lastCall?.[0].timeWindow).toEqual({
      startTime: 1000,
      endTime: 6000,
    });
  });

  it('recovers plot geometry when a hidden viewer is revealed', () => {
    const { graph, svg, resize, onViewport } = createGraph();
    resize(0, 0);
    graph.updateData(
      epoch(1000, [
        [0, 0],
        [0, 10],
        [0, -10],
        [0, 0],
      ])
    );
    resize(548, 256);
    const { plotBounds } = onViewport.mock.lastCall![0];
    expect(plotBounds.width).toBeGreaterThan(0);
    expect(plotBounds.height).toBeGreaterThan(0);
    expect(svg.querySelector('.line')!.getAttribute('d')).not.toContain('NaN');
    expect(Number(svg.querySelector('.plot-clip')!.getAttribute('width'))).toBe(
      plotBounds.width
    );
  });
});
