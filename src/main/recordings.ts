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
 * file plus, when present, its `Behavior/<stem>-behavior.incomplete.csv` and
 * `EEG/<stem>-events.json` siblings. `eegPath` comes from the renderer, so after
 * resolving symlinks it must be a regular file at exactly
 * `<workspaceDir>/Data/<subject>/EEG/<stem>-raw.incomplete.csv` (and each sibling
 * a regular file in its expected folder); otherwise throws.
 */
export const incompleteRecordingFiles = (
  workspaceDir: string,
  eegPath: string
) => {
  const reject = (): never => {
    throw new Error(
      `Not an ended-early recording in this workspace: ${eegPath}`
    );
  };
  const dataDir = fs.realpathSync(path.join(workspaceDir, 'Data'));
  const eeg = fs.realpathSync(eegPath);
  const [subject, folder, file, ...rest] = path
    .relative(dataDir, eeg)
    .split(path.sep);
  if (
    rest.length > 0 ||
    !file ||
    subject === '..' ||
    folder !== 'EEG' ||
    !isIncompleteRawEEGFile(file) ||
    !fs.statSync(eeg).isFile()
  ) {
    reject();
  }
  const stem = file.slice(0, -`-raw${INCOMPLETE}`.length);
  const siblings = [
    path.join(dataDir, subject, 'Behavior', `${stem}-behavior${INCOMPLETE}`),
    path.join(dataDir, subject, 'EEG', `${stem}-events.json`),
  ].filter((sibling) => fs.existsSync(sibling));
  const realSiblings = siblings.map((sibling) => {
    const real = fs.realpathSync(sibling);
    if (
      path.dirname(real) !== path.dirname(sibling) ||
      !fs.statSync(real).isFile()
    ) {
      reject();
    }
    return real;
  });
  return [eeg, ...realSiblings];
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
