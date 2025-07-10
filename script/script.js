async function status() {
  document.getElementById('root').innerHTML = 'Parser is running...';
}

document.addEventListener('DOMContentLoaded', async () => {

  const excelParam = document.getElementById('excel-param');

  const selectFileButton = document.getElementById('select-file');

  const runExel = document.getElementById('runExel');

  const downloadButton = document.getElementById('download-button');
  const errorMessage = document.getElementById('error-message');
  const logMessages = document.getElementById('log-messages');
  errorMessage.textContent = '';
  logMessages.textContent = '';
  let filePath = null; //
  let selectedFilePath = null;
  let firstColumnData = [];
  let currentIndex = 0;

  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');

  function checkInputFields() {
    if (fromInput.value.trim() === '' || toInput.value.trim() === '') {
      runExel.disabled = true;
    } else {
      runExel.disabled = false;
    }
  }

  checkInputFields();

  fromInput.addEventListener('input', checkInputFields);
  toInput.addEventListener('input', checkInputFields);


  const excelDataContainer = document.getElementById(
    'excel-data-container'
  );
  //-------------selectFile
  selectFileButton.addEventListener('click', async () => {
    excelDataContainer.innerHTML = '';
    excelParam.value = '';
    setTimeout(() => {
      excelParam.click();
    }, 100);
  });

  excelParam.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFilePath =
        window.electron?.getFileFromInput?.(excelParam) ||
        file.path ||
        file.name;
      logMessages.textContent +=
        'File selected: ' + selectedFilePath + '\n';
      readExcelFile(file);
    } else {
      errorMessage.textContent = 'No file selected.';
      logMessages.textContent += 'No file selected via input.\n';
    }
  });


  window.electron.on('file-ready', (filePath) => {
    const fileName = filePath.split(/\/|\\/).pop();
    console.log('file: ', fileName);
    const button = document.createElement('button');
    button.textContent = fileName;
    button.classList.add('button');
    button.addEventListener('click', () => {
      const relativePath = `./${fileName}`; //
      const absolutePath = `file://${filePath}`; //
      //
      const downloadLink = document.createElement('a');
      downloadLink.href = relativePath;
      downloadLink.download = fileName;
      downloadLink.click();
      //
      if (downloadLink.href !== absolutePath) {
        downloadLink.href = absolutePath;
        downloadLink.click();
      }
    });
    const list = document.getElementById('list');
    list.appendChild(button);
    logMessages.textContent += 'File ready at: ' + filePath + '\n';
    currentIndex++;
    processNextParameter();
  });

  window.electron.on('app-error', (error) => {
    errorMessage.textContent = 'Error: ' + error;
    logMessages.textContent += 'App error: ' + error + '\n';
    currentIndex++;
    processNextParameter();
  });

  window.electron.on('app-log', (log) => {
    logMessages.textContent += log + '\n';
  });
  // Download processed file
  downloadButton.addEventListener('click', () => {
    if (filePath) {
      logMessages.textContent += 'Downloading file: ' + filePath + '\n';
      window.electron.send('download-file', filePath);
    } else {
      errorMessage.textContent = 'No file available for download.';
      logMessages.textContent += 'Download clicked but no file ready.\n';
    }
  });

  function readExcelFile(file) {
    logMessages.textContent +=
      'Starting to read Excel file: ' + file.name + '\n';
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = e.target.result;
        logMessages.textContent += 'File read successfully, parsing...\n';
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        logMessages.textContent +=
          'Excel file parsed, ' + jsonData.length + ' rows found.\n';
        processExcelData(jsonData);

      } catch (error) {
        errorMessage.textContent =
          'Error parsing Excel file: ' + error.message;
        logMessages.textContent +=
          'Parsing error: ' + error.message + '\n';
      }
    };
    reader.onerror = function (error) {
      errorMessage.textContent = 'Error reading file: ' + error;
      logMessages.textContent += 'Read error: ' + error + '\n';
    };
    reader.readAsBinaryString(file);
  }

  function processExcelData(jsonData) {
    let rowCount = 0
    let exitData = true
    while (exitData) {
      firstColumnData = jsonData
        .map((row) => row[rowCount])
        .filter((value) => value);
      logMessages.textContent +=
        'Processed ' +
        firstColumnData.length +
        ' rows from first column.\n';
      if (firstColumnData.length > 0) {
        displayExcelData(firstColumnData, rowCount);
        rowCount++
      } else {
        exitData = false
      }
    }
  }

  function displayExcelData(data, column) {
    if (data.length === 0) {
      excelDataContainer.textContent = 'No data to display.';
      logMessages.textContent += 'No data found in first column.\n';
      return;
    }
    data.forEach((value) => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      const hr = document.createElement('hr');

      div.textContent = value;
      span.textContent = column;

      span.classList.add('data-span');
      div.classList.add('data-div');
      hr.classList.add('data-hr');

      excelDataContainer.appendChild(span);
      excelDataContainer.appendChild(div);
      excelDataContainer.appendChild(hr);

    });
    logMessages.textContent += 'Displayed ' + data.length + ' items.\n';
  }

  //--------------------------


  document.getElementById('runExel').addEventListener('click', async () => {
    document.getElementById('excel-data-container');
    await processNextParameter();
  });

  async function processNextParameter() {
    const fromValue = document.getElementById('from').value;
    const toValue = document.getElementById('to').value;
    return await window.electron.invoke('run-app-js', { from: fromValue, to: toValue });
  }

});










