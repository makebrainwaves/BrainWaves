import { interpolateRainbow } from 'd3';

/**
 * A channel's trace color from d3's rainbow, indexed by its position in the
 * device's full channel list so the color never changes when a view
 * down-selects channels. d3 ships no types; the import is untyped.
 */
export function channelColor(
  name: string,
  allChannels: readonly string[]
): string {
  return interpolateRainbow(allChannels.indexOf(name) / allChannels.length);
}
