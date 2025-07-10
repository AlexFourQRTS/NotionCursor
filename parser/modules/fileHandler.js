class FileHandler {
  constructor() {
    this.filePath = null;
    this.selectedFilePath = null;
  }

  setupFileHandlers(logMessages, errorMessage) {
    const excelParam = document.getElementById('excel-param');
    const selectFileButton = document.getElementById('select-file');
    const excelDataContainer = document.getElementById('excel-data-container');

    // Select file button handler
    selectFileButton.addEventListener('click', async () => {
      excelDataContainer.innerHTML = '';
      excelParam.value = '';
      setTimeout(() => {
        excelParam.click();
      }, 100);
    });

    // File input change handler
    excelParam.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFilePath = window.electron?.getFileFromInput?.(excelParam) || file.path || file.name;
        logMessages.textContent += 'File selected: ' + this.selectedFilePath + '\n';
        return file;
      } else {
        errorMessage.textContent = 'No file selected.';
        logMessages.textContent += 'No file selected via input.\n';
        return null;
      }
    });
  }

  setupDownloadHandlers(logMessages, errorMessage) {
    const downloadButton = document.getElementById('download-button');

    // Download processed file
    downloadButton.addEventListener('click', () => {
      if (this.filePath) {
        logMessages.textContent += 'Downloading file: ' + this.filePath + '\n';
        window.electron.send('download-file', this.filePath);
      } else {
        errorMessage.textContent = 'No file available for download.';
        logMessages.textContent += 'Download clicked but no file ready.\n';
      }
    });
  }

  setupElectronHandlers(logMessages, errorMessage) {
    // File ready handler
    window.electron.on('file-ready', (filePath) => {
      const fileName = filePath.split(/\/|\\/).pop();
      console.log('file: ', fileName);
      
      const button = document.createElement('button');
      button.textContent = fileName;
      button.classList.add('button');
      button.addEventListener('click', () => {
        const relativePath = `./${fileName}`;
        const absolutePath = `file://${filePath}`;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = relativePath;
        downloadLink.download = fileName;
        downloadLink.click();
        
        if (downloadLink.href !== absolutePath) {
          downloadLink.href = absolutePath;
          downloadLink.click();
        }
      });
      
      const list = document.getElementById('list');
      list.appendChild(button);
      logMessages.textContent += 'File ready at: ' + filePath + '\n';
    });

    // Error handler
    window.electron.on('app-error', (error) => {
      errorMessage.textContent = 'Error: ' + error;
      logMessages.textContent += 'App error: ' + error + '\n';
    });

    // Log handler
    window.electron.on('app-log', (log) => {
      logMessages.textContent += log + '\n';
    });
  }

  setFilePath(path) {
    this.filePath = path;
  }

  getFilePath() {
    return this.filePath;
  }

  getSelectedFilePath() {
    return this.selectedFilePath;
  }
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileHandler;
} else {
  window.FileHandler = FileHandler;
} 