import { interpolateRainbow } from 'd3';

/**
 * Stable per-channel trace colors sampled from d3's rainbow (i / n), so any
 * channel count gets distinct hues without a fixed palette. Used where traces
 * must keep their color while the signal-quality colors change underneath
 * (the noise demonstration). d3 ships no types; the import is untyped.
 */
export function traceColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => interpolateRainbow(i / count));
}
