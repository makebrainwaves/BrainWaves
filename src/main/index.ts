/* eslint no-console: off */

/**
 * Electron main process entry point.
 * All Node.js / filesystem / shell operations the renderer needs
 * are handled here via ipcMain handlers and exposed via the preload.
 */
import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Papa from 'papaparse';
import mkdirp from 'mkdirp';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { is, optimizer } from '@electron-toolkit/utils';
import MenuBuilder from './menu';
import { FILE_TYPES } from '../renderer/constants/constants';

// Chrome extension IDs for React and Redux DevTools
const REACT_DEVTOOLS_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
const REDUX_DEVTOOLS_ID = 'lmhkpmbekcpmknklioeibfkpmmfibljd';

// Needed for WASM/SharedArrayBuffer support (pyodide)
app.commandLine.appendSwitch(
  'enable-experimental-web-platform-features',
  'true'
);

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;



const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const sess = session.defaultSession;
  const extDir = path.join(app.getPath('userData'), 'extensions');

  const loadExt = async (id: string) => {
    const extPath = path.join(extDir, id);
    if (!fs.existsSync(extPath)) return;
    const existing = sess.extensions.getAllExtensions().find((e) => e.id === id);
    if (existing && !forceDownload) return;
    if (existing) {
      sess.removeExtension(id);
    }
    await sess.extensions.loadExtension(extPath);
  };

  await Promise.all([REACT_DEVTOOLS_ID, REDUX_DEVTOOLS_ID].map(loadExt)).catch(
    console.log
  );
};

// ------------------------------------------------------------------
// Filesystem helpers (mirroring renderer's storage.ts / write.ts)
// ------------------------------------------------------------------

const workspaces = path.join(os.homedir(), 'BrainWaves_Workspaces');

const getWorkspaceDir = (title: string) => path.join(workspaces, title);

const mkdirPathSync = (dirPath: string) => mkdirp.sync(dirPath);

// Active EEG write streams keyed by a UUID-like id
const activeStreams = new Map<string, fs.WriteStream>();

// ------------------------------------------------------------------
// IPC handlers
// ------------------------------------------------------------------

// Dialogs
ipcMain.handle('dialog:showOpen', (_event, options) =>
  dialog.showOpenDialog(mainWindow!, options)
);

ipcMain.handle('dialog:showMessage', (_event, options) =>
  dialog.showMessageBox(mainWindow!, options)
);

ipcMain.handle('dialog:showSave', (_event, options) =>
  dialog.showSaveDialog(mainWindow!, options)
);

ipcMain.handle('loadDialog', async (_event, fileType) => {
  if (fileType === FILE_TYPES.STIMULUS_DIR) {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select a folder of images',
      properties: ['openDirectory'],
    });
    return result.canceled ? '' : result.filePaths[0];
  }
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select a jsPsych timeline file',
    properties: ['openFile', 'promptToCreate'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Shell
ipcMain.handle('shell:showItemInFolder', (_event, fullPath) =>
  shell.showItemInFolder(fullPath)
);

ipcMain.handle('shell:moveItemToTrash', (_event, fullPath) =>
  shell.trashItem(fullPath)
);

// Workspace management
ipcMain.handle('fs:getWorkspaceDir', (_event, title) =>
  getWorkspaceDir(title)
);

ipcMain.handle('fs:createWorkspaceDir', (_event, title) => {
  mkdirPathSync(getWorkspaceDir(title));
});

ipcMain.handle('fs:readWorkspaces', () => {
  try {
    return fs
      .readdirSync(workspaces)
      .filter((workspace) => workspace !== '.DS_Store');
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      mkdirPathSync(workspaces);
    }
    console.log(e);
    return [];
  }
});

ipcMain.handle('fs:readAndParseState', (_event, dir) => {
  try {
    const state = JSON.parse(
      fs.readFileSync(path.join(workspaces, dir, 'appState.json'), {
        encoding: 'utf8',
      })
    );
    return state;
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log('appState does not exist for recent workspace');
    }
    return null;
  }
});

ipcMain.handle('fs:storeExperimentState', (_event, state: any) => {
  fs.writeFileSync(
    path.join(getWorkspaceDir(state.title), 'appState.json'),
    JSON.stringify(state)
  );
});

ipcMain.handle('fs:restoreExperimentState', (_event, state: any) => {
  if (state.type !== 'NONE') {
    const timestampedState = { ...state, subject: '', group: '', session: 1 };
    if (!timestampedState.title) return;
    fs.writeFileSync(
      path.join(getWorkspaceDir(timestampedState.title), 'appState.json'),
      JSON.stringify(timestampedState)
    );
  }
});

ipcMain.handle('fs:readWorkspaceRawEEGData', (_event, title) => {
  try {
    const files = fs.readdirSync(getWorkspaceDir(title), { recursive: true }) as string[];
    return files
      .filter((filepath) => filepath.slice(-7).includes('raw.csv'))
      .map((filepath) => {
        const fullPath = path.join(getWorkspaceDir(title), filepath);
        return { name: path.basename(filepath), path: fullPath };
      });
  } catch (e: any) {
    if (e.code === 'ENOENT') console.log(e);
    return [];
  }
});

ipcMain.handle('fs:readWorkspaceCleanedEEGData', (_event, title) => {
  try {
    const files = fs.readdirSync(getWorkspaceDir(title), { recursive: true }) as string[];
    return files
      .filter((filepath) => filepath.slice(-7).includes('epo.fif'))
      .map((filepath) => {
        const fullPath = path.join(getWorkspaceDir(title), filepath);
        return { name: path.basename(filepath), path: fullPath };
      });
  } catch (e: any) {
    console.log(e);
    return [];
  }
});

ipcMain.handle('fs:readWorkspaceBehaviorData', (_event, title) => {
  try {
    const files = fs.readdirSync(getWorkspaceDir(title), { recursive: true }) as string[];
    return files
      .filter((filepath) => filepath.slice(-12).includes('behavior.csv'))
      .map((filepath) => {
        const fullPath = path.join(getWorkspaceDir(title), filepath);
        return { name: path.basename(filepath), path: fullPath };
      });
  } catch (e: any) {
    if (e.code === 'ENOENT') console.log(e);
    return [];
  }
});

ipcMain.handle(
  'fs:storeBehavioralData',
  (_event, csv, title, subject, group, session) => {
    const dir = path.join(
      getWorkspaceDir(title),
      'Data',
      subject,
      'Behavior'
    );
    const filename = `${subject}-${group}-${session}-behavior.csv`;
    mkdirPathSync(dir);
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path.join(dir, filename), csv, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
);

ipcMain.handle(
  'fs:storePyodideImage',
  (_event, title, imageTitle, rawData: ArrayBuffer) => {
    const dir = path.join(getWorkspaceDir(title), 'Results', 'Images');
    const filename = `${imageTitle}.png`;
    mkdirPathSync(dir);
    const buffer = Buffer.from(rawData);
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path.join(dir, filename), buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
);

ipcMain.handle('fs:deleteWorkspaceDir', (_event, title) =>
  shell.trashItem(path.join(workspaces, title))
);

ipcMain.handle('fs:readImages', (_event, dir) => {
  return fs.readdirSync(dir).filter((filename) => {
    const ext = filename.slice(-3).toLowerCase();
    return ext === 'png' || ext === 'jpg' || ext === 'gif' || ext === 'peg';
  });
});

ipcMain.handle('fs:getImages', (_event, params: any) => {
  if (!params.stimuli) return [];
  const images: string[] = [];
  for (const stimuli of params.stimuli) {
    const { dir } = stimuli;
    if (dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        images.push(path.join(dir, file));
      }
    }
  }
  return images;
});

ipcMain.handle('fs:readBehaviorData', (_event, files: string[]) => {
  try {
    return files.map((file) => {
      const csv = fs.readFileSync(file, 'utf-8');
      const obj = Papa.parse(csv, { header: true });
      (obj as any).meta.datafile = file;
      return obj;
    });
  } catch (e) {
    console.log('error', e);
    return null;
  }
});

ipcMain.handle(
  'fs:storeAggregatedBehaviorData',
  async (_event, data, title) => {
    const csv = Papa.unparse(data as any);
    await dialog.showSaveDialog(mainWindow!, {
      title: 'Select a folder to save the data',
      defaultPath: path.join(getWorkspaceDir(title), 'Data', 'aggregated.csv'),
    });
    // If user picks a path, write the file
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: path.join(getWorkspaceDir(title), 'Data', 'aggregated.csv'),
    });
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, csv);
    }
  }
);

ipcMain.handle(
  'fs:checkFileExists',
  (_event, title, subject, filename) => {
    const file = path.join(
      getWorkspaceDir(title),
      'Data',
      subject,
      'Behavior',
      filename
    );
    return fs.existsSync(file);
  }
);

ipcMain.handle('fs:readFiles', (_event, filePathsArray: string[]) => {
  return filePathsArray.map((filePath) => {
    console.log('reading file', filePath);
    return fs.readFileSync(filePath, 'utf8');
  });
});

// EEG streaming — main process holds write streams for performance
ipcMain.handle(
  'eeg:createWriteStream',
  (_event, title, subject, group, session) => {
    const dir = path.join(getWorkspaceDir(title), 'Data', subject, 'EEG');
    const filename = `${subject}-${group}-${session}-raw.csv`;
    mkdirPathSync(dir);
    const stream = fs.createWriteStream(path.join(dir, filename));
    const streamId = `${Date.now()}-${Math.random()}`;
    activeStreams.set(streamId, stream);
    return streamId;
  }
);

ipcMain.on('eeg:writeHeader', (_event, streamId, channels: string[]) => {
  const stream = activeStreams.get(streamId);
  if (stream) {
    stream.write(`Timestamp,${channels.join(',')},Marker\n`);
  }
});

ipcMain.on('eeg:writeData', (_event, streamId, eegData: any) => {
  const stream = activeStreams.get(streamId);
  if (!stream) return;
  stream.write(`${eegData.timestamp},`);
  const len = eegData.data.length;
  for (let i = 0; i < len; i++) {
    stream.write(`${eegData.data[i].toString()},`);
  }
  if (eegData.marker !== undefined) {
    stream.write(`${eegData.marker}\n`);
  } else {
    stream.write(`0\n`);
  }
});

ipcMain.handle('eeg:closeStream', (_event, streamId) => {
  return new Promise<void>((resolve) => {
    const stream = activeStreams.get(streamId);
    if (stream) {
      stream.end(() => {
        activeStreams.delete(streamId);
        resolve();
      });
    } else {
      resolve();
    }
  });
});

// Resource path (for experiment file loading)
ipcMain.handle('getResourcePath', () => {
  return is.dev
    ? path.join(__dirname, '../../src/renderer')
    : process.resourcesPath;
});

// Viewer URL — used by ViewerComponent to load the EEG viewer in a webview
ipcMain.handle('getViewerUrl', () => {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    return `${process.env['ELECTRON_RENDERER_URL']}/viewer.html`;
  }
  return `file://${path.join(__dirname, '../renderer/viewer.html')}`;
});

// ------------------------------------------------------------------
// Window creation
// ------------------------------------------------------------------

const createWindow = async () => {
  if (is.dev || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      additionalArguments: [
        // Pass resource path so preload can inject it synchronously
        `--resource-path=${
          is.dev
            ? path.join(__dirname, '../../src/renderer')
            : process.resourcesPath
        }`,
      ],
    },
  });

  mainWindow.setMinimumSize(1075, 708);

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    if (is.dev || process.env.DEBUG_PROD === 'true') {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // eslint-disable-next-line
  new AppUpdater();
};

// ------------------------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  // Enable F12 devtools shortcut and Ctrl+R reload in dev, disable in prod
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // In dev, Vite sets Cache-Control: immutable on pre-bundled deps.  The
  // Electron session cache persists across restarts, so patched dep files
  // may not be picked up.  Clearing the HTTP cache here ensures the renderer
  // always fetches fresh files from the Vite dev server on each launch.
  if (is.dev) {
    await session.defaultSession.clearCache();
  }

  createWindow();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
