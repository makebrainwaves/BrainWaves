/**
 * In-memory fake of the `node-labstreaminglayer` native module.
 *
 * Models a tiny "LSL network" entirely in JS so the outlet/inlet managers can
 * be integration-tested without liblsl installed on the machine (or CI runner):
 *
 *   - Creating a StreamOutlet registers its StreamInfo on a shared broker.
 *   - resolveStreams() returns the StreamInfos of all live outlets.
 *   - A StreamInlet opened against a discovered StreamInfo reads, via
 *     pullChunk(), exactly the samples that outlet has pushed since the last
 *     pull — the same contract the real liblsl exposes.
 *
 * The classes expose the exact subset of the API that src/main/lsl/outlets.ts
 * and inlets.ts call, plus a few inspection fields (`destroyed`, `pushedChunks`)
 * the tests assert against.
 */

export type Chunk = { samples: number[][]; timestamps: number[] };

let uidCounter = 0;

export class FakeStreamInfo {
  destroyed = false;

  channelLabels: string[] = [];

  channelTypesValue: string | null = null;

  channelUnitsValue: string | null = null;

  private readonly _uid: string;

  constructor(
    private readonly _name: string,
    private readonly _type: string,
    private readonly _channelCount: number,
    private readonly _srate: number,
    public readonly format: string,
    private readonly _sourceId: string
  ) {
    this._uid = `uid-${++uidCounter}`;
  }

  name(): string {
    return this._name;
  }

  type(): string {
    return this._type;
  }

  channelCount(): number {
    return this._channelCount;
  }

  nominalSrate(): number {
    return this._srate;
  }

  sourceId(): string {
    return this._sourceId;
  }

  uid(): string {
    return this._uid;
  }

  setChannelLabels(labels: string[]): void {
    this.channelLabels = labels;
  }

  setChannelTypes(type: string): void {
    this.channelTypesValue = type;
  }

  setChannelUnits(unit: string): void {
    this.channelUnitsValue = unit;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

export class FakeBroker {
  outlets: FakeStreamOutlet[] = [];

  // When true, every inlet's pullChunk throws — simulates a network drop so the
  // inlet manager's error/disconnect path can be exercised.
  failInletPulls = false;
}

export class FakeStreamOutlet {
  destroyed = false;

  pushedChunks: Chunk[] = [];

  pushedSamples: unknown[][] = [];

  // Cumulative buffer that inlets read from.
  readonly buffer: Chunk = { samples: [], timestamps: [] };

  constructor(
    public readonly info: FakeStreamInfo,
    private readonly broker: FakeBroker
  ) {
    broker.outlets.push(this);
  }

  pushChunk(samples: number[][], timestamps: number[]): void {
    this.pushedChunks.push({ samples, timestamps });
    this.buffer.samples.push(...samples);
    this.buffer.timestamps.push(...timestamps);
  }

  pushSample(sample: unknown[]): void {
    this.pushedSamples.push(sample);
  }

  destroy(): void {
    this.destroyed = true;
    this.broker.outlets = this.broker.outlets.filter((o) => o !== this);
  }
}

export class FakeStreamInlet {
  opened = false;

  closed = false;

  destroyed = false;

  private readPos = 0;

  // When true, pullChunk throws to simulate a mid-stream disconnect.
  failOnPull = false;

  constructor(
    public readonly info: FakeStreamInfo,
    private readonly broker: FakeBroker
  ) {}

  openStream(_timeout: number): void {
    this.opened = true;
  }

  pullChunk(_timeout: number): [number[][], number[]] {
    if (this.failOnPull || this.broker.failInletPulls) {
      throw new Error('simulated inlet disconnect');
    }
    const outlet = this.broker.outlets.find(
      (o) => o.info.uid() === this.info.uid()
    );
    if (!outlet) return [[], []];
    const samples = outlet.buffer.samples.slice(this.readPos);
    const timestamps = outlet.buffer.timestamps.slice(this.readPos);
    this.readPos = outlet.buffer.samples.length;
    return [samples, timestamps];
  }

  closeStream(): void {
    this.closed = true;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

export interface FakeLSLModule {
  StreamInfo: typeof FakeStreamInfo;
  StreamOutlet: new (info: FakeStreamInfo) => FakeStreamOutlet;
  StreamInlet: new (info: FakeStreamInfo) => FakeStreamInlet;
  resolveStreams: (waitTime: number) => FakeStreamInfo[];
  IRREGULAR_RATE: number;
}

/**
 * Build a fresh fake module + broker. The StreamOutlet/StreamInlet constructors
 * are bound to the broker so callers can `new lsl.StreamOutlet(info)` with a
 * single argument exactly as they do against the real module.
 */
export function createFakeLSL(): { module: FakeLSLModule; broker: FakeBroker } {
  const broker = new FakeBroker();
  const module: FakeLSLModule = {
    StreamInfo: FakeStreamInfo,
    StreamOutlet: class extends FakeStreamOutlet {
      constructor(info: FakeStreamInfo) {
        super(info, broker);
      }
    },
    StreamInlet: class extends FakeStreamInlet {
      constructor(info: FakeStreamInfo) {
        super(info, broker);
      }
    },
    resolveStreams: () => broker.outlets.map((o) => o.info),
    IRREGULAR_RATE: 0,
  };
  return { module, broker };
}
