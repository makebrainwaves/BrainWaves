/* eslint @typescript-eslint/ban-ts-comment: off */
import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    } else {
      this.setupEditableContextMenu();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      const editItems = MenuBuilder.editableContextItems(props);
      Menu.buildFromTemplate([
        ...editItems,
        ...(editItems.length > 0
          ? [{ type: 'separator' } as MenuItemConstructorOptions]
          : []),
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  /** Right-click Cut/Copy/Paste for text fields (prod has no other context menu). */
  setupEditableContextMenu() {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const items = MenuBuilder.editableContextItems(props);
      if (items.length > 0) {
        Menu.buildFromTemplate(items).popup({ window: this.mainWindow });
      }
    });
  }

  static editableContextItems(
    props: Electron.ContextMenuParams
  ): MenuItemConstructorOptions[] {
    if (!props.isEditable) return [];
    return [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ];
  }

  buildDarwinTemplate() {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'BrainWaves',
      submenu: [
        {
          label: 'About BrainWaves',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    // Standard Edit menu (undo/redo/cut/copy/paste/selectAll). Without it,
    // ⌘V and friends do nothing in any text field on macOS.
    const subMenuEdit: MenuItemConstructorOptions = { role: 'editMenu' };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click() {
            shell.openExternal('https://github.com/makebrainwaves/BrainWaves/');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal(
              'https://github.com/makebrainwaves/BrainWaves/issues'
            );
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault: MenuItemConstructorOptions[] = [
      { role: 'editMenu' },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
            },
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://github.com/makebrainwaves/BrainWaves/'
              );
            },
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal(
                'https://github.com/makebrainwaves/BrainWaves/issues'
              );
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
