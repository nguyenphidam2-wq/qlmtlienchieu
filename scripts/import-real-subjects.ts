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
  return String(val).trim();
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
  if (
    trimmed.startsWith('(') ||
    trimmed.startsWith('STT') ||
    trimmed.includes('Họ và tên') ||
    trimmed.includes('CÁN BỘ') ||
    trimmed.includes('TRƯỞNG') ||
    trimmed.includes('DANH SÁCH') ||
    trimmed.includes('Biểu mẫu') ||
    trimmed.includes('ĐƠN VỊ') ||
    trimmed.startsWith('Lợi:') ||
    trimmed.startsWith('Hùng:') ||
    trimmed.startsWith('Quý:')
  ) {
    return false;
  }
  // Must contain at least two letters
  return /[\p{L}]{2,}/u.test(trimmed);
}

async function runImport() {
  console.log('🚀 Bắt đầu quá trình xóa đối tượng ảo & nhập đối tượng ma túy thực tế...');

  await connectDB();
  console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB');

  // 1. Xóa toàn bộ dữ liệu đối tượng ảo/cũ
  const deleteResult = await Subject.deleteMany({});
  console.log(`🧹 Đã xóa sạch ${deleteResult.deletedCount} đối tượng ảo/cũ khỏi cơ sở dữ liệu.`);

  // 2. Lấy danh sách TDP ranh giới đầy đủ
  const tdps = await TDP.find({});
  console.log(`📋 Đã tải ${tdps.length} Tổ Dân Phố ranh giới làm cơ sở định vị.`);

  const tdpList: TDPItem[] = tdps.map(t => ({
    _id: t._id,
    name: t.name,
    center: t.center as [number, number],
    geojson: t.geojson
  }));

  // File Excel nguồn
  const excelPath = path.resolve(process.cwd(), 'DS ma túy Mẫu 1, Mẫu 2 bổ sung 27.01.2026.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Không tìm thấy file Excel:', excelPath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);

  const sheetConfigs: { sheetName: string; defaultStatus: string }[] = [
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
    if (!ws) {
      console.warn(`⚠️ Không tìm thấy sheet "${config.sheetName}"`);
      continue;
    }

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n📄 Đang xử lý sheet "${config.sheetName}"...`);

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
      const idCard = row[4] ? String(row[4]).trim() : undefined;
      const addressPerm = row[5] ? String(row[5]).trim() : '';
      const addressCurr = row[6] ? String(row[6]).trim() : addressPerm;

      let status = config.defaultStatus;
      if (row[12] && typeof row[12] === 'string' && row[12].trim()) {
        status = row[12].trim();
      }

      const violationHistories: any[] = [];
      const col7 = row[7] ? String(row[7]).trim() : '';
      const col8 = row[8] ? String(row[8]).trim() : '';
      const col9 = row[9] ? String(row[9]).trim() : '';
      const col10 = row[10] ? String(row[10]).trim() : '';

      if (col8 || col9 || col10) {
        violationHistories.push({
          action: status,
          date: col7,
          decision_num_date: [col8, col9].filter(Boolean).join(' - '),
          duration: col10
        });
      }

      const notes = [row[13], row[14]].filter(Boolean).map(x => String(x).trim()).join(' | ');

      // --- LOGIC ĐỊNH VỊ THÔNG MINH ---
      const matchedTDP = calculateSmartCoordinates(addressCurr, addressPerm, 0, tdpList).matchedTdpName;
      const currentClusterIdx = (tdpClusterCountMap.get(matchedTDP) || 0) + 1;
      tdpClusterCountMap.set(matchedTDP, currentClusterIdx);

      const geoResult = calculateSmartCoordinates(addressCurr, addressPerm, currentClusterIdx, tdpList);

      const subjectData = {
        full_name: fullName,
        dob: dobStr,
        yob: yob,
        gender: gender,
        id_card: idCard,
        ethnicity: 'Kinh',
        address_permanent: addressPerm,
        address_current: addressCurr,
        tdp: geoResult.matchedTdpName,
        drug_types_used: ['MET', 'OPI'],
        status: status,
        violation_histories: violationHistories,
        notes: notes,
        lat: geoResult.lat,
        lng: geoResult.lng,
        is_drug: 1,
        approval_status: 'Approved'
      };

      subjectsToInsert.push(subjectData);
      countInSheet++;
      totalImported++;
    }

    console.log(`  ✓ Đã nhập ${countInSheet} đối tượng từ "${config.sheetName}"`);
  }

  // 3. Nạp vào database
  if (subjectsToInsert.length > 0) {
    await Subject.insertMany(subjectsToInsert);
    console.log(`\n🎉 THÀNH CÔNG! Đã nạp tổng cộng ${totalImported} đối tượng ma túy thực tế vào database.`);
  } else {
    console.warn('⚠️ Không tìm thấy đối tượng hợp lệ để nạp.');
  }

  // Statistics by TDP
  console.log('\n📊 THỐNG KÊ ĐỐI TƯỢNG THEO TỔ DÂN PHỐ:');
  const tdpStats = await Subject.aggregate([
    { $group: { _id: "$tdp", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  tdpStats.forEach(st => {
    console.log(`- ${st._id}: ${st.count} đối tượng`);
  });

  await mongoose.disconnect();
  console.log('\n🔌 Đã hoàn tất và ngắt kết nối MongoDB.');
}

runImport().catch(e => {
  console.error('❌ Lỗi quá trình import:', e);
  process.exit(1);
});
