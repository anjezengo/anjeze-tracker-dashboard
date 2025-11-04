/**
 * Quick check of Excel columns
 */

import XLSX from 'xlsx';

const excelPath = '../1.1 Anjeze Tracker - for Kiran.xlsx';

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = 'Tracker';
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('📋 Excel Column Headers:');
  console.log(data[0]);

  console.log('\n📊 Sample rows with values:');
  for (let i = 1; i <= Math.min(10, data.length - 1); i++) {
    const row = data[i];
    console.log(`\nRow ${i}:`);
    data[0].forEach((header, index) => {
      if (row[index]) {
        console.log(`  ${header}: ${row[index]}`);
      }
    });
  }
} catch (error) {
  console.error('Error:', error.message);
}
