import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { StimulusFileAccess } from '../stimulusFileAccess';
import { toStimulusFileUrl } from '../../shared/stimulusUrl';

describe('StimulusFileAccess', () => {
  let root: string;
  let selected: string;
  let outside: string;
  let access: StimulusFileAccess;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-stimulus-'));
    selected = path.join(root, 'selected');
    outside = path.join(root, 'outside');
    fs.mkdirSync(selected);
    fs.mkdirSync(outside);
    access = new StimulusFileAccess(path.join(root, 'authorized.json'));
    access.authorizeDirectory(selected);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('resolves encoded files beneath a selected directory', () => {
    // '#' and '&' are URL-reserved but legal in filenames on every OS;
    // '?' is illegal on Windows, so it's only exercised in the pure
    // string round-trip test below.
    const file = path.join(selected, 'face #1 & 2.jpeg');
    fs.writeFileSync(file, 'image');
    expect(access.resolveUrl(toStimulusFileUrl(file))).toBe(
      fs.realpathSync(file)
    );
  });

  it('rejects files outside selected directories', () => {
    const file = path.join(outside, 'secret.png');
    fs.writeFileSync(file, 'image');

    expect(() => access.resolveUrl(toStimulusFileUrl(file))).toThrow(
      'StimulusFileAccess.resolveUrl: file is not in an authorized directory'
    );
  });

  it('reloads selected directories for restored workspaces', () => {
    const reloaded = new StimulusFileAccess(path.join(root, 'authorized.json'));
    const file = path.join(selected, 'restored.webp');
    fs.writeFileSync(file, 'image');
    expect(reloaded.resolveUrl(toStimulusFileUrl(file))).toBe(
      fs.realpathSync(file)
    );
  });
});

describe('toStimulusFileUrl', () => {
  it('round-trips Windows paths and URL-reserved characters', () => {
    const windowsPath = String.raw`C:\Users\Student\faces\face #1?.png`;
    const url = new URL(toStimulusFileUrl(windowsPath));

    expect(url.searchParams.get('path')).toBe(windowsPath);
  });
});
