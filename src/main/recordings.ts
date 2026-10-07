import fs from 'fs';
import path from 'path';

/** Suffix for ended-early runs. Neither discovery predicate below matches it. */
const INCOMPLETE = '.incomplete.csv';

/** The artifacts one run can leave: behavior CSV, raw EEG CSV, and the raw file's marker sidecar. */
type SessionFileKind = 'behavior' | 'raw' | 'events';

/** Path of one artifact of a subject/group/session run. */
export const sessionFile = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number,
  kind: SessionFileKind
) => {
  const stem = `${subject}-${group}-${session}`;
  return path.join(
    workspaceDir,
    'Data',
    subject,
    kind === 'behavior' ? 'Behavior' : 'EEG',
    kind === 'events' ? `${stem}-events.json` : `${stem}-${kind}.csv`
  );
};

const incomplete = (file: string) => file.replace(/\.csv$/, INCOMPLETE);

/**
 * Creates a new session file and returns its open fd. Throws rather than
 * overwrite or append when the file, or its ended-early copy, already exists.
 */
const createSessionFile = (file: string) => {
  if (fs.existsSync(incomplete(file))) {
    throw new Error(`${path.basename(incomplete(file))} already exists`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return fs.openSync(file, 'wx');
};

/** Writes a new session file in one go; never overwrites (see `createSessionFile`). */
export const writeSessionFile = (file: string, data: string) => {
  const fd = createSessionFile(file);
  try {
    fs.writeFileSync(fd, data);
  } finally {
    fs.closeSync(fd);
  }
};

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

/**
 * True when any artifact of this session exists, complete or ended early. The
 * one test of whether a session is taken: the run-start guard and
 * `createRawEEGStream` both use it.
 */
export const recordingExists = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) =>
  (['behavior', 'raw', 'events'] as const).some((kind) => {
    const file = sessionFile(workspaceDir, subject, group, session, kind);
    return fs.existsSync(file) || fs.existsSync(incomplete(file));
  });

/**
 * Opens the raw EEG file of a new run. Throws if the session is taken, so a
 * run never writes into another run's session, and a second start of the
 * same session fails instead of truncating the first.
 */
export const createRawEEGStream = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  if (recordingExists(workspaceDir, subject, group, session)) {
    throw new Error(
      `Session ${session} for ${subject} (${group}) is already recorded`
    );
  }
  const file = sessionFile(workspaceDir, subject, group, session, 'raw');
  return fs.createWriteStream(file, { fd: createSessionFile(file) });
};

/**
 * Renames the session's behavior and raw EEG files to `*.incomplete.csv`.
 * Nothing is deleted or overwritten: if any target already exists, it throws
 * before renaming anything.
 */
export const markRecordingIncomplete = (
  workspaceDir: string,
  subject: string,
  group: string,
  session: number
) => {
  const files = (['behavior', 'raw'] as const)
    .map((kind) => sessionFile(workspaceDir, subject, group, session, kind))
    .filter((file) => fs.existsSync(file));
  const taken = files.map(incomplete).find((file) => fs.existsSync(file));
  if (taken) throw new Error(`${path.basename(taken)} already exists`);
  for (const file of files) fs.renameSync(file, incomplete(file));
};
