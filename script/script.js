// Импортируем модули
// В браузере они должны быть загружены через script теги в HTML

class ParserApp {
  constructor() {
    this.excelProcessor = new ExcelProcessor();
    this.fileHandler = new FileHandler();
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', async () => {
      this.setupUI();
      this.setupEventListeners();
    });
  }

  setupUI() {
    const errorMessage = document.getElementById('error-message');
    const logMessages = document.getElementById('log-messages');
    errorMessage.textContent = '';
    logMessages.textContent = '';

    // Setup input validation
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const runExel = document.getElementById('runExel');

    const checkInputFields = () => {
      if (fromInput.value.trim() === '' || toInput.value.trim() === '') {
        runExel.disabled = true;
      } else {
        runExel.disabled = false;
      }
    };

    checkInputFields();
    fromInput.addEventListener('input', checkInputFields);
    toInput.addEventListener('input', checkInputFields);
  }

  setupEventListeners() {
    const errorMessage = document.getElementById('error-message');
    const logMessages = document.getElementById('log-messages');

    // Setup file handlers
    this.fileHandler.setupFileHandlers(logMessages, errorMessage);
    this.fileHandler.setupDownloadHandlers(logMessages, errorMessage);
    this.fileHandler.setupElectronHandlers(logMessages, errorMessage);

    // Setup Excel file processing
    const excelParam = document.getElementById('excel-param');
    excelParam.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.excelProcessor.readExcelFile(file, logMessages, errorMessage);
      }
    });

    // Setup run button
    document.getElementById('runExel').addEventListener('click', async () => {
      document.getElementById('excel-data-container');
      await this.processNextParameter();
    });
  }

  async processNextParameter() {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const logMessages = document.getElementById('log-messages');
    const errorMessage = document.getElementById('error-message');

    const from = parseInt(fromInput.value);
    const to = parseInt(toInput.value);
    const firstColumnData = this.excelProcessor.getFirstColumnData();
    const currentIndex = this.excelProcessor.getCurrentIndex();

    if (currentIndex >= firstColumnData.length) {
      logMessages.textContent += 'All parameters processed.\n';
      return;
    }

    const parameter = firstColumnData[currentIndex];
    logMessages.textContent += `Processing parameter ${currentIndex + 1}/${firstColumnData.length}: ${parameter}\n`;

    try {
      if (window.electron) {
        window.electron.send('process-parameter', { parameter, from, to });
      } else {
        // Fallback for browser environment
        logMessages.textContent += `Would process: ${parameter} from ${from} to ${to}\n`;
        this.excelProcessor.setCurrentIndex(currentIndex + 1);
        setTimeout(() => this.processNextParameter(), 1000);
      }
    } catch (error) {
      errorMessage.textContent = 'Error processing parameter: ' + error.message;
      logMessages.textContent += 'Processing error: ' + error.message + '\n';
      this.excelProcessor.setCurrentIndex(currentIndex + 1);
      setTimeout(() => this.processNextParameter(), 1000);
    }
  }
}

// Status function for compatibility
async function status() {
  document.getElementById('root').innerHTML = 'Parser is running...';
}

// Создаем глобальный экземпляр приложения
let parserApp;

// Инициализируем приложение
document.addEventListener('DOMContentLoaded', () => {
  parserApp = new ParserApp();
});

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParserApp;
} else {
  window.ParserApp = ParserApp;
} 