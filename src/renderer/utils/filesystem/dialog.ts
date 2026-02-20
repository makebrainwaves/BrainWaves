/**
 * Dialog helpers — proxied to the main process via window.electronAPI.
 * The actual electron.dialog calls live in src/main/index.ts IPC handlers.
 */

export const showOpenDialog = (
  options: Record<string, unknown>
): Promise<{ canceled: boolean; filePaths: string[] }> =>
  window.electronAPI.showOpenDialog(options);
