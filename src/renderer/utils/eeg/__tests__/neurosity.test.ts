/**
 * Tests for the Neurosity Crown driver.
 *
 * @neurosity/sdk is mocked with a fake client whose brainwaves() stream we can
 * drive manually, so we can assert the channel-major Crown epoch is flattened
 * into the per-sample EEGData shape the rest of the app consumes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import type { EEGData } from '../../../constants/interfaces';

// Self-contained fake client (no imports allowed inside vi.hoisted).
const h = vi.hoisted(() => {
  const holder: {
    observer: {
      next: (v: unknown) => void;
      error: (e: unknown) => void;
    } | null;
  } = { observer: null };
  const client: Record<string, unknown> = {
    bluetooth: {
      requestDevice: async () => ({ id: 'crown-1', name: 'Crown-ABCD' }),
      connect: async () => undefined,
    },
    brainwaves: () => ({
      subscribe: (observer: {
        next: (v: unknown) => void;
        error: (e: unknown) => void;
      }) => {
        holder.observer = observer;
        return {
          unsubscribe: () => {
            holder.observer = null;
          },
        };
      },
    }),
    status: () => of({ state: 'online' }),
    disconnect: async () => undefined,
  };
  // Must be `new`-able — neurosity.ts does `new Neurosity(...)`. Returning an
  // object from the constructor makes every instance the shared fake client.
  function Neurosity() {
    return client;
  }
  return { holder, client, Neurosity };
});

vi.mock('@neurosity/sdk', () => ({ Neurosity: h.Neurosity }));

import {
  connectToNeurosity,
  createRawNeurosityObservable,
  disconnectFromNeurosity,
  neurosityDisconnect$,
} from '../neurosity';
import { NEUROSITY_CHANNELS } from '../../../constants/constants';

afterEach(async () => {
  await disconnectFromNeurosity();
  h.client.status = () => of({ state: 'online' });
  vi.clearAllMocks();
});

describe('connectToNeurosity', () => {
  it('returns DeviceInfo with the Crown montage', async () => {
    const info = await connectToNeurosity({
      id: 'crown-1',
      name: 'Crown-ABCD',
    });
    expect(info).toEqual({
      name: 'Neurosity Crown',
      samplingRate: 256,
      channels: NEUROSITY_CHANNELS,
    });
  });
});

describe('createRawNeurosityObservable', () => {
  it('flattens a channel-major Crown epoch into per-sample EEGData', async () => {
    const observable = await createRawNeurosityObservable();
    const collected = firstValueFrom(
      observable.pipe(take(2), toArray())
    ) as Promise<EEGData[]>;

    // 2 channels, 2 samples each.
    h.holder.observer?.next({
      data: [
        [10, 11],
        [20, 21],
      ],
      info: { samplingRate: 256, startTime: 1000 },
    });

    const result = await collected;
    expect(result.map((s) => s.data)).toEqual([
      [10, 20],
      [11, 21],
    ]);
    expect(result[0].timestamp).toBe(1000);
    expect(result[1].timestamp).toBeCloseTo(1000 + 1000 / 256, 5);
  });

  it('skips empty epochs without emitting', async () => {
    const observable = await createRawNeurosityObservable();
    const seen: EEGData[] = [];
    const sub = observable.subscribe((d) => seen.push(d));

    h.holder.observer?.next({
      data: [],
      info: { samplingRate: 256, startTime: 0 },
    });

    expect(seen).toHaveLength(0);
    sub.unsubscribe();
  });
});

describe('neurosityDisconnect$', () => {
  it('emits when the Crown transitions to offline', async () => {
    h.client.status = () => of({ state: 'offline' });
    const emitted = await firstValueFrom(neurosityDisconnect$().pipe(take(1)));
    expect(emitted).toBeUndefined();
  });
});
