/**
 * Functions for managing user data stored on disk.
 * All filesystem / shell operations are proxied to the main process
 * via window.electronAPI (defined in src/preload/index.ts).
 */
import path from 'pathe';
import Papa from 'papaparse';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import { ExperimentParameters } from '../../constants/interfaces';

// electronAPI is injected by the preload script
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    electronAPI: any;
  }
}

const api = () => window.electronAPI;

// -----------------------------------------------------------------------------------------------
// Creating and Getting

export const getWorkspaceDir = (title: string): Promise<string> =>
  api().getWorkspaceDir(title);

export const createWorkspaceDir = (title: string): Promise<void> =>
  api().createWorkspaceDir(title);

export const openWorkspaceDir = (title: string): Promise<void> =>
  api().showItemInFolder(path.join('BrainWaves_Workspaces', title));

// -----------------------------------------------------------------------------------------------
// Storing

export const storeExperimentState = (state: ExperimentStateType): Promise<void> =>
  api().storeExperimentState(state);

export const restoreExperimentState = (state: ExperimentStateType): Promise<void> =>
  api().restoreExperimentState(state);

export const storeBehavioralData = (
  csv: string,
  title: string,
  subject: string,
  group: string,
  session: number
): Promise<void> => api().storeBehavioralData(csv, title, subject, group, session);

export const storePyodideImage = (
  title: string,
  imageTitle: string,
  rawData: ArrayBuffer
): Promise<void> => api().storePyodideImage(title, imageTitle, rawData);

// -----------------------------------------------------------------------------------------------
// Reading

export const readWorkspaces = (): Promise<string[]> => api().readWorkspaces();

export const readWorkspaceRawEEGData = (title: string) =>
  api().readWorkspaceRawEEGData(title);

export const readWorkspaceCleanedEEGData = (title: string) =>
  api().readWorkspaceCleanedEEGData(title);

export const readWorkspaceBehaviorData = (title: string) =>
  api().readWorkspaceBehaviorData(title);

export const readAndParseState = (dir: string): Promise<ExperimentStateType | null> =>
  api().readAndParseState(dir);

export const readImages = (dir: string): Promise<string[]> =>
  api().readImages(dir);

export const getImages = (params: ExperimentParameters): Promise<string[]> =>
  api().getImages(params);

export const readBehaviorData = (files: string[]) =>
  api().readBehaviorData(files);

export const storeAggregatedBehaviorData = (data: unknown, title: string): Promise<void> =>
  api().storeAggregatedBehaviorData(data, title);

// -----------------------------------------------------------------------------------------------
// Util

export const mkdirPathSync = (_dirPath: string): void => {
  // Directory creation is handled in the main process; this is a no-op in the renderer
};

export const getSubjectNamesFromFiles = (filePaths: string[]): string[] =>
  filePaths
    .map((filePath) => path.basename(filePath))
    .map((fileName) => fileName.substring(0, fileName.indexOf('-')));

export const deleteWorkspaceDir = (title: string): Promise<void> =>
  api().deleteWorkspaceDir(title);

export const checkFileExists = (
  title: string,
  subject: string,
  filename: string
): Promise<boolean> => api().checkFileExists(title, subject, filename);

// Kept for backward compatibility — converts CSV string to parsed object using PapaParse
export const convertCSVToObject = (csv: string) =>
  Papa.parse(csv, { header: true });
