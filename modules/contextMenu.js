const { Menu, dialog } = require('electron');

class ContextMenu {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupContextMenu();
  }

  setupContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Новая заметка',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'new-note');
        }
      },
      {
        label: 'Поиск',
        accelerator: 'CmdOrCtrl+F',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'search');
        }
      },
      { type: 'separator' },
      {
        label: 'Вырезать',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Копировать',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Вставить',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Выделить всё',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll'
      },
      { type: 'separator' },
      {
        label: 'Переключить тему',
        accelerator: 'CmdOrCtrl+T',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'toggle-theme');
        }
      },
      {
        label: 'Показать/Скрыть пароли',
        accelerator: 'CmdOrCtrl+H',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'toggle-visibility');
        }
      },
      { type: 'separator' },
      {
        label: 'Экспорт данных',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'export-data');
        }
      },
      {
        label: 'Импорт данных',
        click: () => {
          this.mainWindow.webContents.send('context-menu-action', 'import-data');
        }
      },
      { type: 'separator' },
      {
        label: 'О приложении',
        click: () => {
          dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'О приложении',
            message: 'Notes App',
            detail: 'Приложение для заметок с паролями\nВерсия 1.0.0\n\nСоздано с помощью Electron'
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Инструменты разработчика',
        accelerator: 'F12',
        click: () => {
          this.mainWindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Перезагрузить',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          this.mainWindow.reload();
        }
      },
      {
        label: 'Принудительная перезагрузка',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: () => {
          this.mainWindow.webContents.reloadIgnoringCache();
        }
      }
    ]);

    this.mainWindow.webContents.on('context-menu', (e, params) => {
      contextMenu.popup({ window: this.mainWindow });
    });

    this.mainWindow.webContents.on('context-menu-action', (event, action) => {
      switch (action) {
        case 'new-note':
          this.mainWindow.webContents.send('trigger-action', 'new-note');
          break;
        case 'search':
          this.mainWindow.webContents.send('trigger-action', 'search');
          break;
        case 'toggle-theme':
          this.mainWindow.webContents.send('trigger-action', 'toggle-theme');
          break;
        case 'toggle-visibility':
          this.mainWindow.webContents.send('trigger-action', 'toggle-visibility');
          break;
        case 'export-data':
          this.mainWindow.webContents.send('trigger-action', 'export-data');
          break;
        case 'import-data':
          this.mainWindow.webContents.send('trigger-action', 'import-data');
          break;
      }
    });
  }
}

module.exports = ContextMenu; 