const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  saveCategories: (categories) => ipcRenderer.invoke('save-categories', categories),
  loadCategories: () => ipcRenderer.invoke('load-categories'),
  
  openDevTools: () => ipcRenderer.invoke('open-devtools'),
  
  onTriggerAction: (callback) => ipcRenderer.on('trigger-action', (event, action) => callback(action)),
  
  removeTriggerAction: () => ipcRenderer.removeAllListeners('trigger-action')
});