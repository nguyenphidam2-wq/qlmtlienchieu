import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { connectDB } from '../src/lib/mongodb';
import { Subject } from '../src/lib/models/Subject';
import { TDP } from '../src/lib/models/TDP';
import { calculateSmartCoordinates, TDPItem } from '../src/lib/services/smartGeocoding';

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

function extractYob(dobStr: string): number {
  if (!dobStr) return 0;
  const match = dobStr.match(/\b(19\d\d|20\d\d)\b/);
  return match ? parseInt(match[1], 10) : 0;
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

function parseAndCalculateDates(rawDate: string, decisionStr: string, rawDuration: string, notesStr: string = '') {
  let date = (rawDate || '').trim();
  let decision = (decisionStr || '').trim();
  let duration = (rawDuration || '').trim();
  const notes = (notesStr || '').trim();

  if (date === 'undefined') date = '';
  if (decision === 'undefined') decision = '';
  if (duration === 'undefined') duration = '';

  // Extract date from decision or notes if date is missing
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

  // Calculate 2-year duration if duration is missing or lacks end year
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

async function main() {
  console.log('🚀 Bắt đầu re-import và nạp ngày chuẩn cho toàn bộ đối tượng vào qlmt-lienchieu...');
  await connectDB();

  await Subject.deleteMany({});
  console.log('🧹 Đã xóa sạch dữ liệu cũ trong qlmt-lienchieu.subjects');

  const tdpsFromDb = await TDP.find({}).lean();
  const tdpList: TDPItem[] = tdpsFromDb.map(t => ({
    name: t.name,
    geojson_geometry: t.geojson_geometry
  }));

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

  const tdpClusterCountMap = new Map<string, number>();
  const subjectsToInsert: any[] = [];
  let totalImported = 0;

  for (const config of sheetConfigs) {
    const ws = workbook.Sheets[config.sheetName];
    if (!ws) continue;

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let countInSheet = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const nameCandidate = row[1];
      if (!isValidName(nameCandidate)) continue;

      const fullName = String(nameCandidate).trim();
      const rawDob = row[2];
      const dobStr = parseExcelDate(rawDob);
      const yob = extractYob(dobStr);
      const gender = (row[3] || 'Nam').toString().trim();
      const idCard = row[4] ? String(row[4]).trim() : '';
      const addressPerm = row[5] ? String(row[5]).trim() : '';
      const addressCurr = row[6] ? String(row[6]).trim() : addressPerm;

      let status = config.defaultStatus;
      if (row[12] && typeof row[12] === 'string' && row[12].trim()) {
        status = row[12].trim();
      }

      const col7 = row[7] ? parseExcelDate(row[7]) : '';
      const col8 = row[8] ? String(row[8]).trim() : '';
      const col9 = row[9] ? String(row[9]).trim() : '';
      const col10 = row[10] ? String(row[10]).trim() : '';
      const col11 = row[11] ? String(row[11]).trim() : '';

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

      const violationHistories: any[] = [];
      if (parsedDates.date || parsedDates.decision || parsedDates.duration) {
        violationHistories.push({
          action: status,
          date: parsedDates.date,
          decision_num_date: parsedDates.decision,
          duration: parsedDates.duration
        });
      }

      const matchedTDP = calculateSmartCoordinates(addressCurr, addressPerm, 0, tdpList).matchedTdpName;
      const currentClusterIdx = (tdpClusterCountMap.get(matchedTDP) || 0) + 1;
      tdpClusterCountMap.set(matchedTDP, currentClusterIdx);

      const geoResult = calculateSmartCoordinates(addressCurr, addressPerm, currentClusterIdx, tdpList);

      subjectsToInsert.push({
        full_name: fullName,
        dob: dobStr,
        yob: yob,
        gender: gender,
        id_card: idCard || undefined,
        ethnicity: 'Kinh',
        drug_types_used: ['MET', 'OPI'],
        tdp: matchedTDP,
        address_permanent: addressPerm,
        address_current: addressCurr,
        date: parsedDates.date,
        decision_num_date: parsedDates.decision,
        duration: parsedDates.duration,
        violation_histories: violationHistories,
        status: status,
        notes: notes,
        lat: geoResult.lat,
        lng: geoResult.lng,
        approval_status: 'Approved',
        created_at: new Date(),
        updated_at: new Date()
      });

      countInSheet++;
      totalImported++;
    }
    console.log(`  ✓ Sheet "${config.sheetName}": đã nạp ${countInSheet} đối tượng`);
  }

  await Subject.insertMany(subjectsToInsert);
  console.log(`\n🎉 Đã nạp thành công ${totalImported} đối tượng hoàn chỉnh vào MongoDB qlmt-lienchieu!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
