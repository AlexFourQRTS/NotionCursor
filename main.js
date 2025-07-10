const { app, BrowserWindow } = require('electron');
const path = require('path');

// Импортируем модули
const IPCHandlers = require('./modules/ipcHandlers');
const ContextMenu = require('./modules/contextMenu');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200, // Устанавливаем минимальную ширину равной начальной
    minHeight: 600,
    center: true, // Центрируем окно
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

  // Инициализируем контекстное меню
  new ContextMenu(mainWindow);
}

app.whenReady().then(() => {
  createWindow();
  
  // Инициализируем обработчики IPC
  new IPCHandlers(app);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
}); 