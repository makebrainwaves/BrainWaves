import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { persistExperimentState } from '../workspaceState';

describe('persistExperimentState', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-workspace-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('creates the workspace directory and writes appState.json when the dir is missing', () => {
    const file = persistExperimentState(root, {
      title: 'My_Custom',
      type: 'Custom',
      params: {
        description: {
          question: 'Do faces pop?',
          hypothesis: 'Yes',
          methods: 'Show pictures',
        },
      },
    });

    expect(file).toBe(path.join(root, 'My_Custom', 'appState.json'));
    expect(fs.existsSync(file!)).toBe(true);
    const written = JSON.parse(fs.readFileSync(file!, 'utf8'));
    expect(written.params.description.hypothesis).toBe('Yes');
  });

  it('does not write when title is missing', () => {
    expect(persistExperimentState(root, { type: 'Custom' })).toBeNull();
    expect(fs.readdirSync(root)).toEqual([]);
  });
});
