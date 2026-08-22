import fs from 'fs';
import path from 'path';

export const IMPORTED_EXPERIMENT_DIR = 'experiment';

const ALLOWED_EXTENSIONS: Record<string, true> = { '.js': true, '.json': true };

export interface ImportedExperimentFile {
  /** POSIX path of the copy, relative to the workspace directory. */
  file: string;
}

/**
 * Copy an externally-authored study into its workspace.
 *
 * The timeline IS the experiment: if the original file moves, the workspace is
 * dead rather than degraded, and it is a small text file, so it is copied rather
 * than referenced. Asset folders are NOT copied — they keep the existing
 * bwfile:// allowlist behaviour.
 *
 * The returned path is POSIX-joined on purpose: the renderer re-joins it with
 * `pathe`, and a Windows backslash would otherwise survive into appState.json.
 */
export function importExperimentFile(
  workspaceDir: string,
  sourcePath: string
): ImportedExperimentFile {
  const extension = path.extname(sourcePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS[extension]) {
    throw new Error(
      `importExperimentFile: expected a .js jsPsych timeline or a .json lab.js study, got "${
        extension || sourcePath
      }"`
    );
  }

  const destinationDir = path.join(workspaceDir, IMPORTED_EXPERIMENT_DIR);
  fs.mkdirSync(destinationDir, { recursive: true });
  const filename = path.basename(sourcePath);
  fs.copyFileSync(sourcePath, path.join(destinationDir, filename));

  return { file: `${IMPORTED_EXPERIMENT_DIR}/${filename}` };
}
