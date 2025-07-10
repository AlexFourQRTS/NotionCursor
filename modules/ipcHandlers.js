const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class IPCHandlers {
  constructor(app) {
    this.app = app;
    this.setupHandlers();
  }

  setupHandlers() {
    // Обработчики для работы с файлами
    ipcMain.handle('save-data', async (event, data) => {
      try {
        // Используем пользовательскую папку данных вместо папки приложения
        const userDataPath = this.app.getPath('userData');
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
        const userDataPath = this.app.getPath('userData');
        const userDataFilePath = path.join(userDataPath, 'data.json');
        
        if (fs.existsSync(userDataFilePath)) {
          const data = fs.readFileSync(userDataFilePath, 'utf8');
          return { success: true, data: JSON.parse(data) };
        }
        
        // Если файла нет в пользовательской папке, пробуем загрузить из ресурсов приложения (для первой загрузки)
        let appDataPath = path.join(__dirname, '..', 'data.json');
        
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

    // Обработчики для работы с категориями
    ipcMain.handle('save-categories', async (event, categories) => {
      try {
        const userDataPath = this.app.getPath('userData');
        const categoriesPath = path.join(userDataPath, 'category.json');
        
        // Создаем папку если её нет
        const userDataDir = path.dirname(categoriesPath);
        if (!fs.existsSync(userDataDir)) {
          fs.mkdirSync(userDataDir, { recursive: true });
        }
        
        fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
        return { success: true };
      } catch (error) {
        console.error('Error saving categories:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('load-categories', async () => {
      try {
        const userDataPath = this.app.getPath('userData');
        const userCategoriesPath = path.join(userDataPath, 'category.json');
        
        if (fs.existsSync(userCategoriesPath)) {
          const data = fs.readFileSync(userCategoriesPath, 'utf8');
          return { success: true, data: JSON.parse(data) };
        }
        
        // Если файла нет, создаем с дефолтными категориями
        const defaultCategories = ['Все', 'Пароли', 'Команды', 'Заметки', 'Избранное', 'Архив'];
        
        const userDataDir = path.dirname(userCategoriesPath);
        if (!fs.existsSync(userDataDir)) {
          fs.mkdirSync(userDataDir, { recursive: true });
        }
        fs.writeFileSync(userCategoriesPath, JSON.stringify(defaultCategories, null, 2));
        
        return { success: true, data: defaultCategories };
      } catch (error) {
        console.error('Error loading categories:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

module.exports = IPCHandlers; 