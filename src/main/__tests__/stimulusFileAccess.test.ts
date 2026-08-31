import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  StimulusFileAccess,
  authorizeBuiltInStimulusDirectories,
} from '../stimulusFileAccess';
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

  it('resolves files under an implicit directory', () => {
    const implicit = path.join(root, 'built-in', 'stimuli');
    fs.mkdirSync(implicit, { recursive: true });
    access.addImplicitDirectory(implicit);

    const file = path.join(implicit, 'builtin.png');
    fs.writeFileSync(file, 'image');
    expect(access.resolveUrl(toStimulusFileUrl(file))).toBe(
      fs.realpathSync(file)
    );
  });

  it('does not persist implicit directories', () => {
    const implicit = path.join(root, 'built-in', 'stimuli');
    fs.mkdirSync(implicit, { recursive: true });
    access.addImplicitDirectory(implicit);

    const reloaded = new StimulusFileAccess(path.join(root, 'authorized.json'));
    const file = path.join(implicit, 'builtin.png');
    fs.writeFileSync(file, 'image');
    expect(() => reloaded.resolveUrl(toStimulusFileUrl(file))).toThrow(
      'StimulusFileAccess.resolveUrl: file is not in an authorized directory'
    );
  });
});

describe('authorizeBuiltInStimulusDirectories', () => {
  let root: string;
  let access: StimulusFileAccess;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-builtin-'));
    access = new StimulusFileAccess(path.join(root, 'authorized.json'));

    // Simulate <resource>/experiments/<experiment>/stimuli layout.
    fs.mkdirSync(path.join(root, 'experiments', 'faces_houses', 'stimuli'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(root, 'experiments', 'multitasking', 'stimuli'), {
      recursive: true,
    });
    // A directory without stimuli should be ignored.
    fs.mkdirSync(path.join(root, 'experiments', 'custom'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('authorizes every experiments/<experiment>/stimuli directory', () => {
    authorizeBuiltInStimulusDirectories(access, root);

    const face = path.join(
      root,
      'experiments',
      'faces_houses',
      'stimuli',
      'face.jpg'
    );
    const shape = path.join(
      root,
      'experiments',
      'multitasking',
      'stimuli',
      'shape.png'
    );
    fs.writeFileSync(face, 'image');
    fs.writeFileSync(shape, 'image');

    expect(access.resolveUrl(toStimulusFileUrl(face))).toBe(
      fs.realpathSync(face)
    );
    expect(access.resolveUrl(toStimulusFileUrl(shape))).toBe(
      fs.realpathSync(shape)
    );
  });

  it('does not write built-in directories to the persisted allowlist', () => {
    authorizeBuiltInStimulusDirectories(access, root);

    const reloaded = new StimulusFileAccess(path.join(root, 'authorized.json'));
    const file = path.join(
      root,
      'experiments',
      'faces_houses',
      'stimuli',
      'face.jpg'
    );
    fs.writeFileSync(file, 'image');
    expect(() => reloaded.resolveUrl(toStimulusFileUrl(file))).toThrow(
      'StimulusFileAccess.resolveUrl: file is not in an authorized directory'
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
