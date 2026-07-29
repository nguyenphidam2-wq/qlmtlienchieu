import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d) {
        const day = String(d.d).padStart(2, '0');
        const month = String(d.m).padStart(2, '0');
        const year = d.y;
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // fallback
    }
  }
  const str = String(val).trim();
  if (str === 'undefined' || str === 'null') return '';
  return str;
}

function parseAndCalculateDates(rawDate: string, decisionStr: string, rawDuration: string, notesStr: string = '') {
  let date = (rawDate || '').trim();
  let decision = (decisionStr || '').trim();
  let duration = (rawDuration || '').trim();
  const notes = (notesStr || '').trim();

  if (date === 'undefined') date = '';
  if (decision === 'undefined') decision = '';
  if (duration === 'undefined') duration = '';

  // Bóc tách ngày từ quyết định hoặc ghi chú
  if (!date && (decision || notes)) {
    const textToSearch = `${decision} ${notes}`;
    const dateMatch = textToSearch.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\b/);
    if (dateMatch) {
      const d = dateMatch[1].padStart(2, '0');
      const m = dateMatch[2].padStart(2, '0');
      const y = dateMatch[3];
      date = `${d}/${m}/${y}`;
    }
  }

  // Tự động tính mốc thời hạn 02 năm nếu có ngày bắt đầu
  if (!duration && date) {
    const parts = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (parts) {
      const d = parts[1].padStart(2, '0');
      const m = parts[2].padStart(2, '0');
      const startYear = parseInt(parts[3], 10);
      const endYear = startYear + 2;
      duration = `${d}/${m}/${startYear} - ${d}/${m}/${endYear} (02 năm)`;
    }
  } else if (duration && !duration.includes('02 năm') && duration.includes(' - ')) {
    duration = `${duration} (02 năm)`;
  }

  return { date, decision, duration };
}

function isValidName(name: any): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const upper = trimmed.toUpperCase();
  if (upper.includes('HỌ VÀ TÊN') || upper.includes('DANH SÁCH') || upper.includes('CÔNG AN') || upper.includes('BIỂU MẪU') || upper.includes('STT')) {
    return false;
  }
  return true;
}

async function main() {
  const uri = process.env.MONGODB_URI || '';
  console.log('🔄 Đang kết nối trực tiếp cơ sở dữ liệu qlmt-lienchieu...');
  const conn = await mongoose.connect(uri, { dbName: 'qlmt-lienchieu' });
  const subjectsColl = conn.connection.db.collection('subjects');

  const countBefore = await subjectsColl.countDocuments();
  console.log(`📊 Tổng số đối tượng hiện tại trong qlmt-lienchieu.subjects: ${countBefore}`);

  const excelPath = path.resolve(process.cwd(), 'DS ma túy Mẫu 1, Mẫu 2 bổ sung 27.01.2026.xlsx');
  const workbook = XLSX.readFile(excelPath);

  const sheetConfigs = [
    { sheetName: 'Mẫu 1', defaultStatus: 'Sử dụng' },
    { sheetName: 'Mẫu 2', defaultStatus: 'Nghiện' },
    { sheetName: 'Mẫu 3', defaultStatus: 'Sau cai' },
    { sheetName: 'Mẫu 4', defaultStatus: 'Khởi tố' },
    { sheetName: 'Mẫu 5', defaultStatus: 'Quản lý sau cai' },
    { sheetName: 'Mẫu 6', defaultStatus: 'Quản lý sau cai' },
    { sheetName: 'Thanh loại', defaultStatus: 'Thanh loại' }
  ];

  let matchedCount = 0;
  let updatedCount = 0;

  for (const config of sheetConfigs) {
    const ws = workbook.Sheets[config.sheetName];
    if (!ws) continue;

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const nameCandidate = row[1];
      if (!isValidName(nameCandidate)) continue;

      const fullName = String(nameCandidate).trim();
      const col7 = row[7] ? parseExcelDate(row[7]) : '';
      const col8 = row[8] ? String(row[8]).trim() : '';
      const col9 = row[9] ? String(row[9]).trim() : '';
      const col10 = row[10] ? String(row[10]).trim() : '';
      const col11 = row[11] ? String(row[11]).trim() : '';

      let status = config.defaultStatus;
      if (row[12] && typeof row[12] === 'string' && row[12].trim()) {
        status = row[12].trim();
      }

      let dateVal = col7;
      let decisionVal = '';
      let durationVal = '';

      if (config.sheetName === 'Mẫu 1' || config.sheetName === 'Thanh loại') {
        dateVal = col7;
        decisionVal = col8;
        durationVal = col9 || col10;
      } else {
        dateVal = col7;
        decisionVal = [col8, col9, col10].filter(Boolean).filter(x => x !== 'undefined').join(' - ');
        durationVal = col11;
      }

      const notes = [row[12], row[13], row[14]].filter(Boolean).map(x => String(x).trim()).join(' | ');
      const parsedDates = parseAndCalculateDates(dateVal, decisionVal, durationVal, notes);

      const historyItem = {
        action: status,
        date: parsedDates.date,
        decision_num_date: parsedDates.decision,
        duration: parsedDates.duration
      };

      // Update matched subject in qlmt-lienchieu.subjects
      const updateResult = await subjectsColl.updateMany(
        { full_name: new RegExp(`^${fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        {
          $set: {
            date: parsedDates.date,
            decision_num_date: parsedDates.decision,
            duration: parsedDates.duration,
            violation_histories: [historyItem],
            status: status,
            updated_at: new Date()
          }
        }
      );

      if (updateResult.matchedCount > 0) {
        matchedCount += updateResult.matchedCount;
        updatedCount += updateResult.modifiedCount;
      }
    }
  }

  console.log(`✅ ĐÃ CẬP NHẬT TRỰC TIẾP TRONG DB qlmt-lienchieu: Khớp ${matchedCount} bản ghi, Đã cập nhật thành công ${updatedCount} bản ghi!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
