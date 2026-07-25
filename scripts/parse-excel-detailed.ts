import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'DS ma túy Mẫu 1, Mẫu 2 bổ sung 27.01.2026.xlsx');
const wb = XLSX.readFile(filePath);

console.log('=== DETAILED EXCEL ANALYSIS ===\n');

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n======================================================`);
  console.log(`SHEET: "${sheetName}" | Total Rows: ${data.length}`);
  console.log(`======================================================`);

  let count = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Usually row[1] is Full Name when row[0] is STT (number or string)
    const nameCandidate = row[1];
    const isName = nameCandidate && typeof nameCandidate === 'string' && 
                   !nameCandidate.includes('Họ và tên') && 
                   !nameCandidate.includes('CÁN BỘ') && 
                   !nameCandidate.includes('TRƯỞNG') &&
                   !nameCandidate.includes('DANH SÁCH');

    if (isName) {
      count++;
      console.log(`Row ${i + 1} [#${count}]:`);
      console.log(`  Name: ${row[1]}`);
      console.log(`  DOB: ${row[2]}`);
      console.log(`  Gender: ${row[3]}`);
      console.log(`  CCCD: ${row[4]}`);
      console.log(`  Address Perm: ${row[5]}`);
      console.log(`  Address Curr: ${row[6]}`);
      console.log(`  Col 7 (Result/Form): ${row[7]}`);
      console.log(`  Col 8 (Dec1): ${row[8]}`);
      console.log(`  Col 9 (Dec2): ${row[9]}`);
      console.log(`  Col 10 (Dec3/Duration): ${row[10]}`);
      console.log(`  Col 11 (Duration/Status): ${row[11]}`);
      console.log(`  Col 12 (Status): ${row[12]}`);
      console.log(`  Col 13 (Reason/Notes): ${row[13]}`);
      console.log(`  Col 14 (Notes/Changes): ${row[14]}`);
      console.log('---');
    }
  }
  console.log(`Total subjects found in "${sheetName}": ${count}`);
});
