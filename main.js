const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Notes App',
    // Убираем стандартное меню
    autoHideMenuBar: true,
    // Делаем окно более нативным
    titleBarStyle: 'default'
  });
  
  mainWindow.loadFile('index.html');
  
  // Открываем DevTools в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Убираем стандартное меню полностью
  mainWindow.setMenu(null);

  // Создаем кастомное контекстное меню
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Новая заметка',
      accelerator: 'CmdOrCtrl+N',
      click: () => {
        mainWindow.webContents.send('context-menu-action', 'new-note');
      }
    },
    {
      label: 'Поиск',
      accelerator: 'CmdOrCtrl+F',
      click: () => {
        mainWindow.webContents.send('context-menu-action', 'search');
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
        mainWindow.webContents.send('context-menu-action', 'toggle-theme');
      }
    },
    {
      label: 'Показать/Скрыть пароли',
      accelerator: 'CmdOrCtrl+H',
      click: () => {
        mainWindow.webContents.send('context-menu-action', 'toggle-visibility');
      }
    },
    { type: 'separator' },
    {
      label: 'Экспорт данных',
      click: () => {
        mainWindow.webContents.send('context-menu-action', 'export-data');
      }
    },
    {
      label: 'Импорт данных',
      click: () => {
        mainWindow.webContents.send('context-menu-action', 'import-data');
      }
    },
    { type: 'separator' },
    {
      label: 'О приложении',
      click: () => {
        dialog.showMessageBox(mainWindow, {
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
        mainWindow.webContents.toggleDevTools();
      }
    },
    {
      label: 'Перезагрузить',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        mainWindow.reload();
      }
    },
    {
      label: 'Принудительная перезагрузка',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: () => {
        mainWindow.webContents.reloadIgnoringCache();
      }
    }
  ]);

  // Применяем контекстное меню
  mainWindow.webContents.on('context-menu', (e, params) => {
    contextMenu.popup({ window: mainWindow });
  });

  // Обработка действий из контекстного меню
  ipcMain.on('context-menu-action', (event, action) => {
    switch (action) {
      case 'new-note':
        mainWindow.webContents.send('trigger-action', 'new-note');
        break;
      case 'search':
        mainWindow.webContents.send('trigger-action', 'search');
        break;
      case 'toggle-theme':
        mainWindow.webContents.send('trigger-action', 'toggle-theme');
        break;
      case 'toggle-visibility':
        mainWindow.webContents.send('trigger-action', 'toggle-visibility');
        break;
      case 'export-data':
        mainWindow.webContents.send('trigger-action', 'export-data');
        break;
      case 'import-data':
        mainWindow.webContents.send('trigger-action', 'import-data');
        break;
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Обработчики для работы с файлами
  ipcMain.handle('save-data', async (event, data) => {
    try {
      // Используем пользовательскую папку данных вместо папки приложения
      const userDataPath = app.getPath('userData');
      const dataPath = path.join(userDataPath, 'data.json');
      
      // Создаем папку если её нет
      const userDataDir = path.dirname(dataPath);
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-data', async () => {
    try {
      // Сначала пробуем загрузить из пользовательской папки данных
      const userDataPath = app.getPath('userData');
      const userDataFilePath = path.join(userDataPath, 'data.json');
      
      if (fs.existsSync(userDataFilePath)) {
        const data = fs.readFileSync(userDataFilePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
      }
      
      // Если файла нет в пользовательской папке, пробуем загрузить из ресурсов приложения (для первой загрузки)
      let appDataPath = path.join(__dirname, 'data.json');
      
      // В production режиме файл может быть в resources
      if (!fs.existsSync(appDataPath)) {
        appDataPath = path.join(process.resourcesPath, 'data.json');
      }
      
      if (fs.existsSync(appDataPath)) {
        const data = fs.readFileSync(appDataPath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Копируем данные в пользовательскую папку для будущих изменений
        const userDataDir = path.dirname(userDataFilePath);
        if (!fs.existsSync(userDataDir)) {
          fs.mkdirSync(userDataDir, { recursive: true });
        }
        fs.writeFileSync(userDataFilePath, JSON.stringify(parsedData, null, 2));
        
        return { success: true, data: parsedData };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error loading data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('export-data', async (event, data) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: 'notes-backup.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      
      if (!result.canceled) {
        fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
        return { success: true, path: result.filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('import-data', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const data = fs.readFileSync(result.filePaths[0], 'utf8');
        return { success: true, data: JSON.parse(data) };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});










