import fs from 'fs';
import path from 'path';

/** Suffix for ended-early runs. Neither discovery predicate below matches it. */
const INCOMPLETE = '.incomplete.csv';

const sessionFiles = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  const dir = path.join(workspaceDir, 'Data', subject);
  const stem = `${subject}-${group}-${session}`;
  return [
    path.join(dir, 'Behavior', `${stem}-behavior.csv`),
    path.join(dir, 'EEG', `${stem}-raw.csv`),
  ];
};

const incomplete = (file: string) => file.replace(/\.csv$/, INCOMPLETE);

/** Raw EEG recordings Clean and the workflow badges may offer; never incomplete ones. */
export const isRawEEGFile = (file: string) => file.endsWith('raw.csv');

/** Behavior files Analyze and the workflow badges may offer; never incomplete ones. */
export const isBehaviorFile = (file: string) => file.endsWith('behavior.csv');

/** Ended-early raw EEG recordings, which Clean lists only so they can be deleted. */
export const isIncompleteRawEEGFile = (file: string) =>
  file.endsWith(`-raw${INCOMPLETE}`);

/**
 * Files `fs:deleteIncompleteRecording` trashes for one ended-early run: the EEG
 * file plus its `Behavior/<stem>-behavior.incomplete.csv` sibling when present.
 * Throws for anything that is not an ended-early raw EEG file inside
 * `<workspaceDir>/Data/`, since `eegPath` comes from the renderer.
 */
export const incompleteRecordingFiles = (
  workspaceDir: string,
  eegPath: string
) => {
  const eeg = path.resolve(eegPath);
  if (
    !eeg.startsWith(path.resolve(workspaceDir, 'Data') + path.sep) ||
    !isIncompleteRawEEGFile(eeg)
  ) {
    throw new Error(`Not an ended-early recording in this workspace: ${eegPath}`);
  }
  const behavior = path.join(
    path.dirname(path.dirname(eeg)),
    'Behavior',
    path.basename(eeg).replace(`-raw${INCOMPLETE}`, `-behavior${INCOMPLETE}`)
  );
  return fs.existsSync(behavior) ? [eeg, behavior] : [eeg];
};

/** True when any artifact of this session exists, complete or ended early. */
export const recordingExists = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) =>
  sessionFiles(workspaceDir, subject, group, session).some(
    (file) => fs.existsSync(file) || fs.existsSync(incomplete(file))
  );

/** Renames the session's behavior and raw EEG files to `*.incomplete.csv`. Nothing is deleted. */
export const markRecordingIncomplete = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  for (const file of sessionFiles(workspaceDir, subject, group, session)) {
    if (fs.existsSync(file)) fs.renameSync(file, incomplete(file));
  }
};
