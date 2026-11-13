import { afterEach, describe, expect, it, vi } from 'vitest';
import EEGViewer from './EEGViewer';
import type { EEGSnapshot } from '../../../shared/eegVizTypes';
import type { ViewerGraphParameters } from '../../../shared/viewerTypes';

const graphs: EEGViewer[] = [];

interface Call {
  method: string;
  args: unknown[];
}

/** jsdom's canvas has no 2d context, so record the calls EEGViewer makes on a fake one. */
function fakeContext() {
  const calls: Call[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
    };
  const ctx: Record<string, unknown> = {
    canvas: null,
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    font: '',
    setTransform: record('setTransform'),
    clearRect: record('clearRect'),
    save: record('save'),
    restore: record('restore'),
    beginPath: record('beginPath'),
    rect: record('rect'),
    clip: record('clip'),
    fillRect: record('fillRect'),
    fillText: record('fillText'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    fill: record('fill'),
    roundRect: record('roundRect'),
    setLineDash: record('setLineDash'),
    measureText: (text: string) => ({ width: text.length * 6.5 }),
  };
  let strokeStyle = '';
  let lineWidth = 1;
  Object.defineProperties(ctx, {
    strokeStyle: {
      get: () => strokeStyle,
      set: (v: string) => {
        strokeStyle = v;
        calls.push({ method: 'set:strokeStyle', args: [v] });
      },
    },
    lineWidth: {
      get: () => lineWidth,
      set: (v: number) => {
        lineWidth = v;
        calls.push({ method: 'set:lineWidth', args: [v] });
      },
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

/** Calls since the full-canvas clearRect (the latest redraw; the erase bar's small clearRect comes later in the same pass). */
function lastDraw(calls: Call[]) {
  const start = calls.findLastIndex(
    (c) =>
      c.method === 'clearRect' &&
      (c.args as number[])[0] === 0 &&
      (c.args as number[])[1] === 0
  );
  return calls.slice(start);
}

interface PathPoint {
  kind: 'moveTo' | 'lineTo';
  x: number;
  y: number;
}

/** Trace paths only (lineWidth 1.75), grouped by stroke, with move/line distinction. */
function tracePaths(calls: Call[]): PathPoint[][] {
  const paths: PathPoint[][] = [];
  let current: PathPoint[] = [];
  let width = 0;
  for (const call of lastDraw(calls)) {
    if (call.method === 'set:lineWidth') width = call.args[0] as number;
    else if (call.method === 'beginPath') current = [];
    else if (call.method === 'moveTo' || call.method === 'lineTo')
      current.push({
        kind: call.method,
        x: call.args[0] as number,
        y: call.args[1] as number,
      });
    else if (call.method === 'stroke' && width === 1.75 && current.length)
      paths.push(current);
  }
  return paths;
}

function traceColours(calls: Call[]): string[] {
  const colours: string[] = [];
  let width = 0;
  let stroke = '';
  for (const call of lastDraw(calls)) {
    if (call.method === 'set:lineWidth') width = call.args[0] as number;
    else if (call.method === 'set:strokeStyle') stroke = call.args[0] as string;
    else if (call.method === 'stroke' && width === 1.75) colours.push(stroke);
  }
  return colours;
}

function axisLabels(calls: Call[]) {
  return lastDraw(calls)
    .filter(
      (c) => c.method === 'fillText' && /^-?\d+s$/.test(c.args[0] as string)
    )
    .map((c) => [c.args[0], c.args[1], c.args[2]]);
}

function createGraph(
  overrides: Partial<ViewerGraphParameters> = {},
  instant = true
) {
  const canvas = document.createElement('canvas');
  const { ctx, calls } = fakeContext();
  canvas.getContext = (() => ctx) as unknown as typeof canvas.getContext;
  document.body.appendChild(canvas);
  let width = 548;
  let height = 256;
  vi.spyOn(canvas, 'getBoundingClientRect').mockImplementation(() => ({
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
  const graph = new EEGViewer(canvas, {
    channels: ['AF7', 'AF8'],
    plottingInterval: 250,
    domain: 5000,
    annotations: [],
    snapshot: null,
    ...overrides,
  });
  if (instant) {
    // Existing assertions inspect the fully revealed state; the smooth
    // rAF reveal is covered by its own test with manual frame stepping.
    const rawUpdate = graph.updateData.bind(graph);
    const state = graph as unknown as {
      displayTime: number | null;
      headTime: number | null;
    };
    graph.updateData = (epochData: Parameters<typeof rawUpdate>[0]) => {
      rawUpdate(epochData);
      state.displayTime = state.headTime;
      graph.redraw();
    };
  }
  return {
    graph,
    canvas,
    calls,
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

function epochFor(startTime: number, af7: number[]) {
  return epoch(startTime, [
    af7.map(() => 0),
    af7,
    af7.map(() => 0),
    af7.map(() => 0),
  ]);
}

afterEach(() => {
  graphs.splice(0).forEach((graph) => graph.destroy());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('EEGViewer canvas sweep', () => {
  it('selects named channels and draws annotation bands', () => {
    const { graph, calls } = createGraph();
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
    const paths = tracePaths(calls);
    expect(paths).toHaveLength(2);
    expect(paths[0].length).toBeGreaterThan(1);
    expect(lastDraw(calls).some((c) => c.method === 'fillRect')).toBe(true);
  });

  it('sweep overwrites the old point at the same x and erases ahead of the head in the same draw', () => {
    const { graph, calls } = createGraph({ channels: ['AF7'] });
    graph.updateData(epochFor(1000, [0, 20, 0, 20, 0, 20, 0, 20]));
    // Next sweep: starts exactly one domain later, overwriting x=0 onwards.
    graph.updateData(epochFor(6000, [100, 100]));
    const [path] = tracePaths(calls);
    const atLeftEdge = path.filter((p) => p.x === 44);
    // New value 100 at x=0, not the previous sweep's 0 there.
    expect(atLeftEdge.map((p) => p.y)).toEqual([174.5]);
    // Old sweep still shows beyond the head (e.g. t=3000, offset 2000ms);
    // it leaves via the erase bar, not a hidden time window.
    expect(path.some((p) => Math.abs(p.x - (44 + 197.6)) < 0.01)).toBe(true);
    // Same draw pass clears a full-height slice just ahead of the head
    // (head at offset 1000ms -> x=142.8; the full-canvas clear is [0,0,...]).
    const erases = lastDraw(calls).filter(
      (c) => c.method === 'clearRect' && (c.args as number[])[2] < 10
    );
    expect(erases).toHaveLength(1);
    const [eraseX, eraseY, eraseW, eraseH] = erases[0].args as number[];
    expect(eraseX).toBeCloseTo(44 + 98.8, 1);
    expect(eraseY).toBe(20);
    expect(eraseW).toBeGreaterThanOrEqual(2);
    expect(eraseH).toBe(206);
    // Never a connecting line backwards across the wrap.
    for (let i = 1; i < path.length; i++)
      if (path[i].kind === 'lineTo')
        expect(path[i].x).toBeGreaterThanOrEqual(path[i - 1].x);
    expect(path.some((p, i) => i > 0 && p.kind === 'moveTo')).toBe(true);
  });

  it('keeps time axis labels fixed as wild data advances, with no slide transform', () => {
    const { graph, calls } = createGraph();
    const flat = [
      [0, 0],
      [0, 1],
      [0, -1],
      [0, 0],
    ];
    graph.updateData(epoch(1000, flat));
    const before = axisLabels(calls);
    graph.updateData(
      epoch(2000, [
        [0, 0],
        [99999, -99999],
        [-99999, 99999],
        [0, 0],
      ])
    );
    expect(axisLabels(calls)).toEqual(before);
    expect(before.length).toBeGreaterThan(1);
    expect(before.map(([label]) => label)).toContain('0s');
    const labels = before.map(([label]) => label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(lastDraw(calls).some((c) => c.method === 'translate')).toBe(false);
  });

  it('renders snapshots as a full static plot', () => {
    const calm: EEGSnapshot = {
      channels: ['AF7'],
      data: [[100, 110, 100, 90, 100]],
      samplingRate: 1,
      startTime: 1000,
      endTime: 6000,
      peakToPeak: 20,
    };
    const { calls } = createGraph({
      channels: ['AF7'],
      snapshot: calm,
      amplitudeScale: 100,
    });
    const [path] = tracePaths(calls);
    expect(path.length).toBeGreaterThan(1);
    expect(
      path.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    ).toBe(true);
    expect(path[0].x).toBeLessThan(path[path.length - 1].x);
  });

  it('never plots outside the plot after a snapshot reset with lagging device time', () => {
    const { graph, calls } = createGraph();
    graph.updateSnapshot(null, undefined);
    graph.updateData(
      epoch(Date.now() - 90_000, [
        [0, 0],
        [0, 10],
        [0, -10],
        [0, 0],
      ])
    );
    const xs = tracePaths(calls).flatMap((p) => p.map((pt) => pt.x));
    expect(xs.length).toBeGreaterThan(1);
    expect(Math.max(...xs)).toBeLessThanOrEqual(44 + 494);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(44);
  });

  it('recovers plot geometry when a hidden viewer is revealed', () => {
    const { graph, calls, resize } = createGraph();
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
    const points = tracePaths(calls).flat();
    expect(points.length).toBeGreaterThan(1);
    expect(points.every((p) => Number.isFinite(p.x))).toBe(true);
  });

  it('draws annotation labels as pills and keeps the end pill inside the plot', () => {
    const { graph, calls } = createGraph();
    graph.updateAnnotations([
      {
        id: 'alpha',
        startTime: -1000,
        endTime: 1000,
        label: 'eyes closed',
        endLabel: 'eyes open',
        tone: 'eyes-closed',
      },
    ]);
    graph.updateData(
      epoch(1000, [
        [0, 0],
        [0, 1],
        [0, -1],
        [0, 0],
      ])
    );
    const pills = lastDraw(calls).filter((c) => c.method === 'roundRect');
    expect(pills.length).toBeGreaterThanOrEqual(2);
    for (const pill of pills) {
      const [, , width, height, radius] = pill.args as number[];
      expect(radius).toBeLessThanOrEqual(height / 2);
      expect(width).toBeGreaterThan(2 * height);
    }
    const [, endY, , endHeight] = pills[pills.length - 1].args as number[];
    expect(endY).toBeGreaterThanOrEqual(0);
    expect(endY + endHeight).toBeLessThanOrEqual(20 + 206);
  });

  it('uses a solid left edge and hides the open eyes-closed right edge', () => {
    const { graph, calls } = createGraph();
    const open = {
      id: 'alpha',
      startTime: 1000,
      endTime: null,
      label: 'Eyes closed',
      endLabel: 'Eyes open',
      tone: 'eyes-closed' as const,
    };
    graph.updateAnnotations([open]);
    graph.updateData(epochFor(1000, [0, 0]));
    const solidEdges = () =>
      lastDraw(calls).filter(
        (c, i, all) =>
          c.method === 'stroke' &&
          all
            .slice(0, i)
            .filter((p) => p.method === 'set:lineWidth')
            .pop()?.args[0] === 2
      ).length;
    expect(solidEdges()).toBe(1);
    graph.updateAnnotations([{ ...open, endTime: 1800 }]);
    expect(solidEdges()).toBe(2);
  });

  it('keeps fixed channel colors when epochs report quality', () => {
    const badEpoch = {
      ...epoch(1000, [
        [0, 0],
        [0, 1],
        [0, -1],
        [0, 0],
      ]),
      signalQuality: { AF7: '#ed5a5a', AF8: '#ed5a5a' },
    };
    const fixed = createGraph({ channelColours: ['#123456', '#abcdef'] });
    const quality = createGraph();
    fixed.graph.updateData(badEpoch);
    quality.graph.updateData(badEpoch);
    expect(traceColours(fixed.calls)).toEqual(['#123456', '#abcdef']);
    expect(traceColours(quality.calls)).toEqual(['#ed5a5a', '#ed5a5a']);
  });

  it('applies a new amplitude scale to live data without clearing it', () => {
    const { graph, calls } = createGraph();
    graph.updateData(
      epoch(1000, [
        [0, 0],
        [0, 10],
        [0, -10],
        [0, 0],
      ])
    );
    const span = () => {
      const ys = tracePaths(calls)[0].map((p) => p.y);
      return Math.max(...ys) - Math.min(...ys);
    };
    const wide = span();
    graph.updateSnapshot(null, 50);
    expect(wide).toBeGreaterThan(0);
    expect(span()).toBeCloseTo(wide * 4, 5);
  });

  it('reveals a chunk smoothly over animation frames, not in one jump', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { graph, calls } = createGraph({ channels: ['AF7'] }, false);
    // One 2 s chunk (samples every 500 ms at 2 Hz): 1000, 1500, 2000, 2500.
    graph.updateData(epochFor(1000, [0, 10, 0, -10]));
    const revealed = () => tracePaths(calls)[0]?.length ?? 0;
    expect(revealed()).toBe(1);
    const step = (timestamp: number) => frames.shift()?.(timestamp);
    step(0);
    expect(revealed()).toBe(1);
    step(500);
    expect(revealed()).toBe(2);
    step(1000);
    expect(revealed()).toBe(3);
    step(1500);
    expect(revealed()).toBe(4);
    vi.unstubAllGlobals();
  });
});
