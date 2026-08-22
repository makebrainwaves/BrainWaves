/**
 * Functions for managing user data stored on disk.
 * All filesystem / shell operations are proxied to the main process
 * via window.electronAPI (defined in src/preload/index.ts).
 */
import path from 'pathe';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import { ExperimentParameters } from '../../constants/interfaces';

// electronAPI is injected by the preload script
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    electronAPI: any; // Stubbed in tests; not worth full IPC typing here.
  }
}

const api = () => window.electronAPI;

// ---------------------------------------------------------------------------------------------
// Creating and Getting

export const getWorkspaceDir = (title: string): Promise<string> =>
  api().getWorkspaceDir(title);

export const createWorkspaceDir = (title: string): Promise<void> =>
  api().createWorkspaceDir(title);

export const openWorkspaceDir = (title: string): Promise<void> =>
  api().openWorkspaceDir(title);

// ---------------------------------------------------------------------------------------------
// Storing

export const storeExperimentState = (
  state: Omit<ExperimentStateType, 'experimentObject'>
): Promise<void> => api().storeExperimentState(state);

export const restoreExperimentState = (
  state: ExperimentStateType
): Promise<void> => api().restoreExperimentState(state);

export const storeBehavioralData = (
  csv: string,
  title: string,
  subject: string,
  group: string,
  session: number
): Promise<void> =>
  api().storeBehavioralData(csv, title, subject, group, session);

export const importExperimentFile = (
  title: string,
  sourcePath: string
): Promise<{ file: string }> => api().importExperimentFile(title, sourcePath);

export const storePyodideImageSvg = (
  title: string,
  imageTitle: string,
  svgContent: string
): Promise<void> => api().storePyodideImageSvg(title, imageTitle, svgContent);

export const storePyodideImagePng = (
  title: string,
  imageTitle: string,
  rawData: ArrayBuffer
): Promise<void> => api().storePyodideImagePng(title, imageTitle, rawData);

// ---------------------------------------------------------------------------------------------
// Reading

export const readWorkspaces = (): Promise<string[]> => api().readWorkspaces();

export const readWorkspaceRawEEGData = (title: string) =>
  api().readWorkspaceRawEEGData(title);

export const readWorkspaceCleanedEEGData = (title: string) =>
  api().readWorkspaceCleanedEEGData(title);

export const readWorkspaceBehaviorData = (title: string) =>
  api().readWorkspaceBehaviorData(title);

export const readAndParseState = (
  dir: string
): Promise<ExperimentStateType | null> => api().readAndParseState(dir);

export const readImages = (dir: string): Promise<string[]> =>
  api().readImages(dir);

export const readAudioFiles = (dir: string): Promise<string[]> =>
  api().readAudioFiles(dir);

export const getImages = (params: ExperimentParameters): Promise<string[]> =>
  api().getImages(params);

export const readBehaviorData = (files: string[]) =>
  api().readBehaviorData(files);

export const storeAggregatedBehaviorData = (
  data: unknown,
  title: string
): Promise<void> => api().storeAggregatedBehaviorData(data, title);

// ---------------------------------------------------------------------------------------------
// Util

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

export const writeSignalQualityReport = (title: string, data: string) =>
  api().writeSignalQualityReport(title, data);

export const getSignalQualityReport = (title: string) =>
  api().getSignalQualityReport(title);

export const getBehavioralCsvs = (title: string) =>
  api().getBehavioralCsvs(title);

export const getExistingExperiments = (): Promise<
  { title: string; date: string }[]
> => api().getExistingExperiments();

export const loadFromSystemDialog = (): Promise<{
  experiment: string;
  date: string;
} | null> => api().loadFromSystemDialog();

// ---------------------------------------------------------------------------------------------
// Workspace helpers

/**
 * Read an imported study back out of its workspace.
 *
 * Both the graph of an imported lab.js study and the text of an imported jsPsych
 * timeline are read from here rather than persisted in appState.json, because
 * saveWorkspaceEpic omits `experimentObject` (it holds unserializable hook
 * functions) and the copied file is the study's only source of truth.
 */
export const readImportedExperimentFile = async (
  title: string,
  file: string
): Promise<string> => {
  const dir = await api().getWorkspaceDir(title);
  const [source] = await api().readFiles([path.join(dir, file)]);
  if (source === undefined) {
    throw new Error(
      `readImportedExperimentFile: ${file} is missing from the ${title} workspace`
    );
  }
  return source;
};
