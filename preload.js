const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Слушаем действия из контекстного меню
  onTriggerAction: (callback) => ipcRenderer.on('trigger-action', (event, action) => callback(action)),
  
  // Удаляем слушатель
  removeTriggerAction: () => ipcRenderer.removeAllListeners('trigger-action')
});