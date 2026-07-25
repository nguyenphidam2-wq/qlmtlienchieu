import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { calculateSmartCoordinates, TDPItem } from '../src/lib/services/smartGeocoding';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const ATLAS_URI = process.env.MONGODB_URI || "mongodb://admin:M2QKeyQwumScBLuN@ac-ywyb5s8-shard-00-00.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-01.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-02.129xiqk.mongodb.net:27017/?authSource=admin&replicaSet=atlas-upfdpr-shard-0&tls=true";

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
    } catch (e) {}
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
  return /[\p{L}]{2,}/u.test(trimmed);
}

async function syncToQlmtLienChieu() {
  console.log("🚀 BẮT ĐẦU ĐỒNG BỘ 123 ĐỐI TƯỢNG VÀO DATABASE 'qlmt-lienchieu' VÀ 'test' trên ATLAS...");

  const baseConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  const dbNames = ['qlmt-lienchieu', 'test'];

  for (const dbName of dbNames) {
    console.log(`\n========================================`);
    console.log(`📌 XỬ LÝ DATABASE: "${dbName}"`);
    console.log(`========================================`);

    const db = baseConn.useDb(dbName);

    // Lấy 27 TDPs
    const tdpDocs = await db.collection('tdps').find({}).toArray();
    console.log(`📋 [${dbName}] Đã tải ${tdpDocs.length} TDPs.`);

    const tdpList: TDPItem[] = tdpDocs.map(t => ({
      _id: t._id,
      name: t.name,
      center: t.center as [number, number],
      geojson: t.geojson
    }));

    // Đọc Excel
    const excelPath = path.resolve(process.cwd(), 'DS ma túy Mẫu 1, Mẫu 2 bổ sung 27.01.2026.xlsx');
    const workbook = XLSX.readFile(excelPath);

    const sheetConfigs = [
      { sheetName: 'Thanh loại', defaultStatus: 'Thanh loại', priority: 1 },
      { sheetName: 'Mẫu 6', defaultStatus: 'Quản lý sau cai', priority: 2 },
      { sheetName: 'Mẫu 5', defaultStatus: 'Quản lý sau cai', priority: 2 },
      { sheetName: 'Mẫu 4', defaultStatus: 'Khởi tố', priority: 3 },
      { sheetName: 'Mẫu 3', defaultStatus: 'Sau cai', priority: 4 },
      { sheetName: 'Mẫu 2', defaultStatus: 'Nghiện', priority: 5 },
      { sheetName: 'Mẫu 1', defaultStatus: 'Sử dụng', priority: 6 }
    ];

    const uniqueMap = new Map<string, any>();

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

        const key = (idCard && idCard !== '—' && idCard.length > 5)
          ? `ID_${idCard}`
          : `NAME_${fullName.toLowerCase()}_${dobStr || yob}`;

        const existing = uniqueMap.get(key);
        if (!existing || config.priority < existing.priority) {
          uniqueMap.set(key, {
            fullName,
            dobStr,
            yob,
            gender,
            idCard,
            addressPerm,
            addressCurr,
            status,
            notes: [row[13], row[14]].filter(Boolean).map(x => String(x).trim()).join(' | '),
            priority: config.priority
          });
        }
      }
    }

    const rawUniqueList = Array.from(uniqueMap.values());
    console.log(`✅ [${dbName}] Lọc được ${rawUniqueList.length} đối tượng duy nhất.`);

    const tdpClusterCountMap = new Map<string, number>();
    const subjectsToInsert: any[] = [];

    for (const s of rawUniqueList) {
      const matchedTDP = calculateSmartCoordinates(s.addressCurr, s.addressPerm, 0, tdpList).matchedTdpName;
      const currentClusterIdx = (tdpClusterCountMap.get(matchedTDP) || 0) + 1;
      tdpClusterCountMap.set(matchedTDP, currentClusterIdx);

      const geoResult = calculateSmartCoordinates(s.addressCurr, s.addressPerm, currentClusterIdx, tdpList);

      subjectsToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        full_name: s.fullName,
        dob: s.dobStr,
        yob: s.yob,
        gender: s.gender,
        id_card: s.idCard,
        ethnicity: 'Kinh',
        address_permanent: s.addressPerm,
        address_current: s.addressCurr,
        tdp: geoResult.matchedTdpName,
        drug_types_used: ['MET', 'OPI'],
        status: s.status,
        notes: s.notes,
        lat: geoResult.lat,
        lng: geoResult.lng,
        is_drug: 1,
        approval_status: 'Approved'
      });
    }

    await db.collection('subjects').deleteMany({});
    await db.collection('subjects').insertMany(subjectsToInsert);
    console.log(`🎉 [${dbName}] Đã xoá cũ và lưu lại ${subjectsToInsert.length} đối tượng mới!`);

    const statsAgg = await db.collection('subjects').aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    console.log(`📊 [${dbName}] Phân bố theo trạng thái:`, statsAgg);
  }

  await baseConn.close();
  console.log("\n🚀 ĐÃ HOÀN TẤT ĐỒNG BỘ TOÀN BỘ CÁC DATABASE TRÊN ATLAS!");
}

syncToQlmtLienChieu().catch(console.error);
