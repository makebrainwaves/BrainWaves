const STIMULUS_SCHEME_ORIGIN = 'bwfile://host';

export function toStimulusFileUrl(absolutePath: string): string {
  const url = new URL(STIMULUS_SCHEME_ORIGIN);
  url.searchParams.set('path', absolutePath);
  return url.href;
}
