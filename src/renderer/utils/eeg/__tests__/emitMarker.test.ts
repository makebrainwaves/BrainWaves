/**
 * emitMarker is the single emission point: label → code via the registry, one
 * clock, both sinks (driver injectMarker + LSL sendMarker). The bugs this
 * guards: three call sites once chose their own clocks, and the LSL label was
 * String(code) instead of the condition label.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitMarker, setActiveDriver } from '../index';
import { fixtureDriver } from '../fixture';
import { sendMarker } from '../lslBridge';
import { DEVICES } from '../../../constants/constants';
import type { MarkerRegistry } from '../markerRegistry';

vi.mock('../lslBridge', () => ({ sendMarker: vi.fn() }));
vi.mock('../muse', () => ({ museDriver: {} }));
vi.mock('../neurosity', () => ({ neurosityDriver: {} }));

const registry: MarkerRegistry = {
  codeToLabel: { 1: 'Face', 2: 'House' },
  eventId: { Face: 1, House: 2 },
};

describe('emitMarker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActiveDriver(null);
  });

  it('resolves the label to its code and writes both sinks on one clock', () => {
    const inject = vi
      .spyOn(fixtureDriver, 'injectMarker')
      .mockImplementation(() => {});
    setActiveDriver(DEVICES.FIXTURE);
    emitMarker(registry, 'House', 1234);
    expect(inject).toHaveBeenCalledWith(2, 1234);
    expect(sendMarker).toHaveBeenCalledWith({
      label: 'House',
      rendererTimestamp: 1234,
    });
  });

  it('logs loudly and writes nothing for an unknown label', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const inject = vi
      .spyOn(fixtureDriver, 'injectMarker')
      .mockImplementation(() => {});
    emitMarker(registry, 'Stroop', 1);
    expect(error).toHaveBeenCalled();
    expect(inject).not.toHaveBeenCalled();
    expect(sendMarker).not.toHaveBeenCalled();
  });
});
