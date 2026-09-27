import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  incompleteRecordingFiles,
  isBehaviorFile,
  isIncompleteRawEEGFile,
  isRawEEGFile,
  markRecordingIncomplete,
  recordingExists,
} from '../recordings';

let dir: string;
beforeEach(() => {
  dir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'bw-recordings-'))
  );
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const write = (rel: string) => {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'x');
};
/** Workspace CSVs relative to `dir`, with `/` separators (tests alias `path` to `pathe`). */
const csvFiles = () =>
  (fs.readdirSync(dir, { recursive: true }) as string[])
    .map(path.normalize)
    .filter((f) => f.endsWith('.csv'));

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

  it('an ended-early run is listed as incomplete and deletes with its behavior and events siblings', () => {
    write('Data/P1/Behavior/P1-A-1-behavior.csv');
    write('Data/P1/EEG/P1-A-1-raw.csv');
    write('Data/P1/EEG/P1-A-1-events.json');

    markRecordingIncomplete(dir, 'P1', 'A', 1);

    const eeg = path.join(dir, 'Data/P1/EEG/P1-A-1-raw.incomplete.csv');
    expect(csvFiles().filter(isIncompleteRawEEGFile)).toEqual([
      path.join('Data/P1/EEG/P1-A-1-raw.incomplete.csv'),
    ]);
    expect(incompleteRecordingFiles(dir, eeg).map(path.normalize)).toEqual([
      eeg,
      path.join(dir, 'Data/P1/Behavior/P1-A-1-behavior.incomplete.csv'),
      path.join(dir, 'Data/P1/EEG/P1-A-1-events.json'),
    ]);
  });

  it('refuses to delete anything but an ended-early EEG file inside Data', () => {
    write('Data/P1/EEG/P1-A-1-raw.csv');
    write('Other/P1-A-1-raw.incomplete.csv');

    expect(() =>
      incompleteRecordingFiles(
        dir,
        path.join(dir, 'Data/P1/EEG/P1-A-1-raw.csv')
      )
    ).toThrow();
    expect(() =>
      incompleteRecordingFiles(
        dir,
        path.join(dir, 'Other/P1-A-1-raw.incomplete.csv')
      )
    ).toThrow();
    expect(() =>
      incompleteRecordingFiles(
        dir,
        `${dir}/Data/../Other/P1-A-1-raw.incomplete.csv`
      )
    ).toThrow();
  });

  it('refuses symlinks out of Data, the wrong depth, and directories', () => {
    write('Other/P1-A-1-raw.incomplete.csv');
    write('Data/P1-A-1-raw.incomplete.csv');
    fs.mkdirSync(path.join(dir, 'Data/P1/EEG/P1-A-2-raw.incomplete.csv'), {
      recursive: true,
    });
    fs.symlinkSync(
      path.join(dir, 'Other/P1-A-1-raw.incomplete.csv'),
      path.join(dir, 'Data/P1/EEG/P1-A-1-raw.incomplete.csv')
    );

    for (const rel of [
      'Data/P1/EEG/P1-A-1-raw.incomplete.csv',
      'Data/P1-A-1-raw.incomplete.csv',
      'Data/P1/EEG/P1-A-2-raw.incomplete.csv',
    ]) {
      expect(() =>
        incompleteRecordingFiles(dir, path.join(dir, rel))
      ).toThrow();
    }
  });
});
