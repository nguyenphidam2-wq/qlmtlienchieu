import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'DS ma túy Mẫu 1, Mẫu 2 bổ sung 27.01.2026.xlsx');
const wb = XLSX.readFile(filePath);

console.log('Sheet Names:', wb.SheetNames);
wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n--- Sheet: "${sheetName}" | Total Rows: ${data.length} ---`);
  // Print non-empty data rows count
  let dataRows = 0;
  data.forEach((r, idx) => {
    if (r && r[1]) { // If column B (usually name) exists
      dataRows++;
    }
  });
  console.log(`Valid subjects/data rows (with name): ${dataRows}`);
});
