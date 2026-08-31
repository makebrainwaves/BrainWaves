import { describe, expect, it } from 'vitest';
import { multitaskingExperimentObject } from '../experiment';

type InstructionScreen = {
  type: string;
  files: Record<string, string>;
  media: { images: string[] };
};

describe('multitasking experiment assets', () => {
  const instructionScreen = multitaskingExperimentObject.content[0]
    .content[1] as InstructionScreen;

  it('routes instruction images through bwfile:// so lab.js can decode them', () => {
    expect(instructionScreen.type).toBe('lab.html.Screen');
    const { images: imageUrls } = instructionScreen.media;
    expect(imageUrls.length).toBeGreaterThan(0);
    for (const url of imageUrls) {
      expect(url).toMatch(/^bwfile:\/\/host\?path=/);
    }
  });

  it('maps each files entry to a bwfile:// URL', () => {
    const { files } = instructionScreen;
    const urls = Object.values(files);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^bwfile:\/\/host\?path=/);
    }
  });
});
