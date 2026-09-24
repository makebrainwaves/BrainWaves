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
