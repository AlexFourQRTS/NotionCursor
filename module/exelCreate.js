const fs = require('fs');
const XLSX = require('xlsx');

function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${month}.${day}.${year}`;
}

async function saveToExcel(data, filename = `Contractor License-${getFormattedDateTime()}.xlsx`) {
  let workbook;
  let worksheet;
  let headers = ['License Number', 'Company name', 'Address', 'Phone number', 'Classification', 'Name'];

  if (fs.existsSync(filename)) {
    workbook = XLSX.readFile(filename);
    worksheet = workbook.Sheets[workbook.SheetNames[0]];
  } else {
    workbook = XLSX.utils.book_new();
    worksheet = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  }

  const lines = data.business_info.split('\n').filter(line => line.trim() !== '');

  let companyNameCell = ""
  let companyAddressCell = ""
  let companyPhoneCell = ""

  const isOther = (lines[1]?.toLowerCase() || '').includes('dba') || false;
  
  switch (lines.length) {
    case 4:
      companyNameCell = lines[0]
      companyAddressCell = `${lines[1]} ${lines[2]}`
      companyPhoneCell = lines[3].split(":")[1].trim()
      break;
    case 5:
      if (isOther) {
        companyNameCell = `${lines[0]} ${lines[1]}`
        companyAddressCell = `${lines[2]} ${lines[3]}`
        companyPhoneCell = lines[4].split(":")[1].trim()
      } 

      if (!isOther) {
        companyNameCell = `${lines[0]}`
        companyAddressCell = `${lines[1]} ${lines[2]} ${lines[3]}`
        companyPhoneCell = lines[4].split(":")[1].trim()
      }
      break;
    case 6:
      if (isOther) {
        companyNameCell = `${lines[0]} ${lines[1]}`
        companyAddressCell = `${lines[2]} ${lines[3]} ${lines[4]}`
        companyPhoneCell = lines[5].split(":")[1].trim()
      } 
      break;
    default:
      console.log("Othe Value", lines)
      console.log("Othe Value", lines.length)
      console.log("license: i", data.license)
      break;
  }

  const newRow = [
    data.license,
    companyNameCell,
    companyAddressCell,
    companyPhoneCell,
    data.classification,
    data.name,
  ];

  const ref = XLSX.utils.decode_range(worksheet['!ref']);
  const rowIndex = ref.e.r + 1;

  XLSX.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });

  const businessInfoCell = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
  worksheet[businessInfoCell].s = {
    alignment: {
      wrapText: '1'
    }
  };

  let colWidths = headers.map((header, colIndex) => {
    let maxWidth = header.length;
    for (let i = 0; i <= rowIndex; i++) {
      let cellValue = XLSX.utils.encode_cell({ r: i, c: colIndex });
      if (worksheet[cellValue] && worksheet[cellValue].v) {
        maxWidth = Math.max(maxWidth, String(worksheet[cellValue].v).length);
      }
    }
    return { wch: maxWidth + 2 };
  });

  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

module.exports = saveToExcel;
