import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importExperimentFile } from '../importExperimentFile';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-import-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const writeSource = (name: string, contents = 'initJsPsych({});') => {
  const file = path.join(root, name);
  fs.writeFileSync(file, contents);
  return file;
};

describe('importExperimentFile', () => {
  it('copies the file into the workspace and returns its POSIX-relative path', () => {
    const workspace = path.join(root, 'workspace');
    expect(importExperimentFile(workspace, writeSource('task.js'))).toEqual({
      file: 'experiment/task.js',
    });
    expect(
      fs.readFileSync(path.join(workspace, 'experiment', 'task.js'), 'utf8')
    ).toBe('initJsPsych({});');
  });

  it('creates the workspace directory if it does not exist yet', () => {
    const workspace = path.join(root, 'brand', 'new', 'workspace');
    importExperimentFile(workspace, writeSource('task.js'));
    expect(fs.existsSync(path.join(workspace, 'experiment', 'task.js'))).toBe(
      true
    );
  });

  it('is idempotent: re-importing overwrites the same copy', () => {
    const workspace = path.join(root, 'workspace');
    const first = writeSource('task.js', 'v1');
    importExperimentFile(workspace, first);
    fs.writeFileSync(first, 'v2');

    expect(importExperimentFile(workspace, first)).toEqual({
      file: 'experiment/task.js',
    });
    expect(fs.readdirSync(path.join(workspace, 'experiment'))).toEqual([
      'task.js',
    ]);
    expect(
      fs.readFileSync(path.join(workspace, 'experiment', 'task.js'), 'utf8')
    ).toBe('v2');
  });

  it('accepts a .json lab.js study', () => {
    expect(
      importExperimentFile(
        path.join(root, 'workspace'),
        writeSource('study.json', '{}')
      )
    ).toEqual({ file: 'experiment/study.json' });
  });

  it('rejects any other extension by name', () => {
    expect(() =>
      importExperimentFile(
        path.join(root, 'workspace'),
        writeSource('bundle.zip')
      )
    ).toThrow(/importExperimentFile: expected a \.js/);
  });
});
