const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class IPCHandlers {
  constructor(app) {
    this.app = app;
    this.setupHandlers();
  }

  setupHandlers() {
    ipcMain.handle('save-data', async (event, data) => {
      try {
        const userDataPath = this.app.getPath('userData');
        const dataPath = path.join(userDataPath, 'data.json');
        
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
        const userDataPath = this.app.getPath('userData');
        const userDataFilePath = path.join(userDataPath, 'data.json');
        
        if (fs.existsSync(userDataFilePath)) {
          const data = fs.readFileSync(userDataFilePath, 'utf8');
          return { success: true, data: JSON.parse(data) };
        }
        
        let appDataPath = path.join(__dirname, '..', 'data.json');
        
        if (!fs.existsSync(appDataPath)) {
          appDataPath = path.join(process.resourcesPath, 'data.json');
        }
        
        if (fs.existsSync(appDataPath)) {
          const data = fs.readFileSync(appDataPath, 'utf8');
          const parsedData = JSON.parse(data);
          
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

    ipcMain.handle('open-devtools', async () => {
      try {
        const BrowserWindow = require('electron').BrowserWindow;
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.openDevTools();
          return { success: true };
        }
        return { success: false, error: 'No focused window' };
      } catch (error) {
        console.error('Error opening DevTools:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

module.exports = IPCHandlers; 