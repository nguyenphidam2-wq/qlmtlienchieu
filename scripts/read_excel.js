const XLSX = require('xlsx');
const fs = require('fs');

const file = fs.readFileSync('Mẫu thống kê làm apps.xlsx');
const workbook = XLSX.read(file, {type: 'buffer'});
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 5; i < 10; i++) {
  console.log(`Row ${i + 1}:`, data[i] ? data[i].slice(0, 15) : 'empty');
}
