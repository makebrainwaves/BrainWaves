import fs from 'fs';
import path from 'path';

/** Write appState.json, creating the workspace directory if needed. */
export function persistExperimentState(
  workspacesRoot: string,
  state: { title?: unknown } & Record<string, unknown>
): string | null {
  if (typeof state.title !== 'string' || state.title.length < 1) {
    return null;
  }
  const dir = path.join(workspacesRoot, state.title);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'appState.json');
  fs.writeFileSync(file, JSON.stringify(state));
  return file;
}
