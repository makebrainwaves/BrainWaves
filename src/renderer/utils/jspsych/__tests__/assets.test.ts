import { describe, it, expect } from 'vitest';
import { rewriteRelativeAssetUrls } from '../assets';
import { toStimulusFileUrl } from '../../../../shared/stimulusUrl';

const DIR = '/Users/teacher/Documents/faces';
const url = (relative: string) => toStimulusFileUrl(`${DIR}/${relative}`);

describe('rewriteRelativeAssetUrls', () => {
  it('rewrites a literal that is entirely a relative asset path', () => {
    expect(rewriteRelativeAssetUrls("stimulus: 'stimuli/face1.png'", DIR)).toBe(
      `stimulus: '${url('stimuli/face1.png')}'`
    );
  });

  it('rewrites ./-prefixed and multi-segment paths', () => {
    expect(rewriteRelativeAssetUrls('"./a/b/c.jpg"', DIR)).toBe(
      `"${url('a/b/c.jpg')}"`
    );
  });

  it('rewrites audio and video extensions too', () => {
    expect(rewriteRelativeAssetUrls("'sounds/beep.mp3'", DIR)).toBe(
      `'${url('sounds/beep.mp3')}'`
    );
    expect(rewriteRelativeAssetUrls("'clips/intro.mp4'", DIR)).toBe(
      `'${url('clips/intro.mp4')}'`
    );
  });

  it('rewrites src attributes inside an HTML string', () => {
    expect(
      rewriteRelativeAssetUrls(
        `stimulus: '<img src="stimuli/face1.png" width="400">'`,
        DIR
      )
    ).toBe(`stimulus: '<img src="${url('stimuli/face1.png')}" width="400">'`);
  });

  it('rewrites src attributes with escaped quotes', () => {
    expect(
      rewriteRelativeAssetUrls(
        'stimulus: "<img src=\\"stimuli/face1.png\\">"',
        DIR
      )
    ).toBe(`stimulus: "<img src=\\"${url('stimuli/face1.png')}\\">"`);
  });

  it('leaves absolute and already-schemed URLs alone', () => {
    const source = [
      "'https://example.org/a.png'",
      "'data:image/png;base64,AAAA'",
      "'/absolute/a.png'",
    ].join('\n');
    expect(rewriteRelativeAssetUrls(source, DIR)).toBe(source);
  });

  it('leaves non-asset strings alone', () => {
    const source = "prompt: 'Press f for face', choices: ['f', 'j']";
    expect(rewriteRelativeAssetUrls(source, DIR)).toBe(source);
  });

  it('returns the source unchanged when there is no asset folder', () => {
    const source = "stimulus: 'stimuli/face1.png'";
    expect(rewriteRelativeAssetUrls(source, '')).toBe(source);
  });
});
