import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isBehaviorFile,
  isRawEEGFile,
  markRecordingIncomplete,
  recordingExists,
} from '../recordings';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-recordings-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const write = (rel: string) => {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'x');
};
const csvFiles = () =>
  (fs.readdirSync(dir, { recursive: true }) as string[]).filter((f) =>
    f.endsWith('.csv')
  );

describe('recordings', () => {
  it('complete recordings are discovered', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');
    write('Data/P1/EEG/P1-A-1-raw.csv');

    expect(csvFiles().filter(isRawEEGFile)).toHaveLength(1);
    expect(csvFiles().filter(isBehaviorFile)).toHaveLength(1);
  });

  it('an ended-early run keeps its files and its session, but drops out of discovery', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');
    write('Data/P1/EEG/P1-A-1-raw.csv');

    markRecordingIncomplete(dir, 'P1', 'A', 1);

    expect(csvFiles()).toHaveLength(2);
    expect(csvFiles().filter(isRawEEGFile)).toEqual([]);
    expect(csvFiles().filter(isBehaviorFile)).toEqual([]);
    expect(recordingExists(dir, 'P1', 'A', 1)).toBe(true);
    expect(recordingExists(dir, 'P1', 'A', 2)).toBe(false);
  });

  it('marks a behavior-only run that has no EEG file', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');

    markRecordingIncomplete(dir, 'P1', 'A', 1);

    expect(csvFiles().filter(isBehaviorFile)).toEqual([]);
    expect(recordingExists(dir, 'P1', 'A', 1)).toBe(true);
  });
});
