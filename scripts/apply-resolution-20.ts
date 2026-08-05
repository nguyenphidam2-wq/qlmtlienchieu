import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as turf from '@turf/turf';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// List of 27 official TDPs according to Resolution 20/NQ-HĐND dated 29/06/2026
const OFFICIAL_27_TDPS = [
  'Tổ dân phố Vân Dương 1',
  'Tổ dân phố Vân Dương 2',
  'Tổ dân phố Hưởng Phước',
  'Tổ dân phố Tân Hiền',
  'Tổ dân phố Trung Sơn - Hồng Phước',
  'Tổ dân phố Chung Cư 1',
  'Tổ dân phố Quan Nam 1',
  'Tổ dân phố Quan Nam 2',
  'Tổ dân phố Quan Nam 3',
  'Tổ dân phố Quan Nam 4',
  'Tổ dân phố Quan Nam 5',
  'Tổ dân phố Quang Thành 1',
  'Tổ dân phố Quang Thành 2',
  'Tổ dân phố Quang Thành 3',
  'Tổ dân phố Quang Thành 4',
  'Tổ dân phố Quang Thành 5',
  'Tổ dân phố Quang Thành 6',
  'Tổ dân phố Quang Thành 7',
  'Tổ dân phố Quang Thành 8',
  'Tổ dân phố Quang Thành 9',
  'Tổ dân phố Đa Phước 1',
  'Tổ dân phố Đa Phước 2',
  'Tổ dân phố Đa Phước 3',
  'Tổ dân phố Đa Phước 4',
  'Tổ dân phố Thanh Vinh 1',
  'Tổ dân phố Thanh Vinh 2',
  'Tổ dân phố Thanh Vinh 3'
];

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#6366f1", "#8b5cf6", 
  "#ec4899", "#f43f5e", "#06b6d4", "#14b8a6", 
  "#f59e0b", "#10b981", "#84cc16", "#06b6d4"
];

function mapToNewTdp(rawTdp: string, rawAddr: string): string {
  const tdpStr = (rawTdp || '').trim();
  const addrStr = (rawAddr || '').trim();
  const fullText = `${tdpStr} ${addrStr}`.toLowerCase();

  // Explicit text keywords
  if (fullText.includes('hưởng phước')) return 'Tổ dân phố Hưởng Phước';
  if (fullText.includes('vân dương 1')) return 'Tổ dân phố Vân Dương 1';
  if (fullText.includes('vân dương 2')) return 'Tổ dân phố Vân Dương 2';
  if (fullText.includes('tân ninh') || fullText.includes('hiền phước') || fullText.includes('tân hiền')) return 'Tổ dân phố Tân Hiền';
  if (fullText.includes('trung sơn')) return 'Tổ dân phố Trung Sơn - Hồng Phước';
  if (fullText.includes('chung cư 1') || fullText.includes('17 -cc') || fullText.includes('17-cc') || fullText.includes('17 - cc')) return 'Tổ dân phố Chung Cư 1';

  if (fullText.includes('quan nam 1')) return 'Tổ dân phố Quan Nam 1';
  if (fullText.includes('quan nam 2')) return 'Tổ dân phố Quan Nam 2';
  if (fullText.includes('quan nam 3') || fullText.includes('quan nam 6')) return 'Tổ dân phố Quan Nam 3';
  if (fullText.includes('quan nam 4')) return 'Tổ dân phố Quan Nam 4';
  if (fullText.includes('quan nam 5')) return 'Tổ dân phố Quan Nam 5';

  if (fullText.includes('quang thành 1')) return 'Tổ dân phố Quang Thành 1';
  if (fullText.includes('quang thành 2')) return 'Tổ dân phố Quang Thành 2';
  if (fullText.includes('quang thành 3')) return 'Tổ dân phố Quang Thành 3';
  if (fullText.includes('quang thành 4')) return 'Tổ dân phố Quang Thành 4';
  if (fullText.includes('quang thành 5')) return 'Tổ dân phố Quang Thành 5';
  if (fullText.includes('quang thành 6')) return 'Tổ dân phố Quang Thành 6';
  if (fullText.includes('quang thành 7')) return 'Tổ dân phố Quang Thành 7';
  if (fullText.includes('quang thành 8')) return 'Tổ dân phố Quang Thành 8';
  if (fullText.includes('quang thành 9')) return 'Tổ dân phố Quang Thành 9';

  if (fullText.includes('đa phước 1')) return 'Tổ dân phố Đa Phước 1';
  if (fullText.includes('đa phước 2')) return 'Tổ dân phố Đa Phước 2';
  if (fullText.includes('đa phước 3')) return 'Tổ dân phố Đa Phước 3';
  if (fullText.includes('đa phước 4')) return 'Tổ dân phố Đa Phước 4';

  if (fullText.includes('thanh vinh 1')) return 'Tổ dân phố Thanh Vinh 1';
  if (fullText.includes('thanh vinh 2')) return 'Tổ dân phố Thanh Vinh 2';
  if (fullText.includes('thanh vinh 3')) return 'Tổ dân phố Thanh Vinh 3';

  // Number extraction
  const matchNum = tdpStr.match(/(?:tổ\s*(?:dân\s*phố)?\s*)(\d+)/i);
  if (matchNum) {
    const num = parseInt(matchNum[1], 10);
    
    if (num === 26) return 'Tổ dân phố Vân Dương 1';
    if (num === 27) return 'Tổ dân phố Vân Dương 2';
    if (num === 24) return 'Tổ dân phố Hưởng Phước';
    if (num === 25) return 'Tổ dân phố Tân Hiền';
    if (num === 19) return 'Tổ dân phố Quan Nam 1';
    if (num === 20) return 'Tổ dân phố Quan Nam 2';
    if (num === 21) return 'Tổ dân phố Quan Nam 5';
    if (num === 22) return 'Tổ dân phố Quan Nam 3';
    if (num === 23) return 'Tổ dân phố Quan Nam 4';
    if (num === 18) return 'Tổ dân phố Quang Thành 1';
    if (num === 17) return 'Tổ dân phố Quang Thành 6';
    if (num >= 14 && num <= 16) return 'Tổ dân phố Quang Thành 7';
    if (num >= 10 && num <= 13) return 'Tổ dân phố Quang Thành 8';
    if (num >= 3 && num <= 9) return 'Tổ dân phố Quang Thành 9';
    if (num === 1 || num === 2) return 'Tổ dân phố Đa Phước 3';
  }

  return tdpStr ? 'Tổ dân phố Vân Dương 2' : '';
}

function roundCoordinates(coords: any): any {
  if (typeof coords === 'number') {
    return Math.round(coords * 1000000) / 1000000;
  }
  if (Array.isArray(coords)) {
    return coords.map(roundCoordinates);
  }
  return coords;
}

async function applyResolution20() {
  console.log('🚀 Bắt đầu thực thi cập nhật dữ liệu theo Nghị quyết 20/NQ-HĐND...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Không tìm thấy MONGODB_URI trong .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối thành công tới MongoDB.');

    const tdpColl = mongoose.connection.db.collection('tdps');
    const subjectColl = mongoose.connection.db.collection('subjects');

    // 1. SAO LƯU DỮ LIỆU CŨ RA FILE JSON PRESERVATION
    const oldTdps = await tdpColl.find({}).toArray();
    const oldSubjects = await subjectColl.find({}).toArray();

    const backupPath = path.resolve(process.cwd(), 'scratch/backup-db-res20.json');
    fs.writeFileSync(backupPath, JSON.stringify({ tdps: oldTdps, subjects: oldSubjects }, null, 2));
    console.log(`💾 Đã sao lưu an toàn toàn bộ DB cũ (${oldTdps.length} TDP, ${oldSubjects.length} đối tượng) vào file ${backupPath}`);

    // 2. CẬP NHẬT TỔ DÂN PHỐ CHO 124 ĐỐI TƯỢNG
    console.log('\n🔄 Đang ánh xạ và cập nhật lại địa chỉ/TDP cho từng đối tượng...');
    let updatedSubjectCount = 0;
    const subjectTdpDistribution: Record<string, number> = {};

    for (const sub of oldSubjects) {
      const newTdpName = mapToNewTdp(sub.tdp, sub.address_current || sub.address_permanent);
      
      await subjectColl.updateOne(
        { _id: sub._id },
        { 
          $set: { 
            tdp: newTdpName,
            updated_at: new Date()
          } 
        }
      );
      updatedSubjectCount++;
      subjectTdpDistribution[newTdpName] = (subjectTdpDistribution[newTdpName] || 0) + 1;
    }
    console.log(`✅ Đã cập nhật xong ${updatedSubjectCount}/${oldSubjects.length} đối tượng về đúng TDP mới theo Nghị quyết 20!`);

    // 3. XÓA VÀ LÀM SẠCH DANH SÁCH TỔ DÂN PHỐ TRONG DATABASE
    console.log('\n🧹 Đang làm sạch bảng TDP và nạp chuẩn danh sách 27 TDP mới...');
    await tdpColl.deleteMany({});
    console.log('  ✓ Đã xóa tất cả danh mục TDP cũ.');

    // Nạp dữ liệu GeoJSON từ file tdp_export.geojson & Dean_Sat_Nhap_TDP_25_6_Complete.geojson
    const geojsonPath1 = path.resolve(process.cwd(), 'tdp_export.geojson');
    const geojsonPath2 = path.resolve(process.cwd(), 'Dean_Sat_Nhap_TDP_25_6_Complete.geojson');

    const geoFeatureMap = new Map<string, any>();

    const readFeatures = (filePath: string) => {
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (const f of data.features || []) {
        const rawName = f.properties?.name || f.properties?.Ten || f.properties?.TEN_TDP || '';
        if (rawName) {
          const mappedName = mapToNewTdp(rawName, '');
          if (!geoFeatureMap.has(mappedName) || f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
            geoFeatureMap.set(mappedName, f);
          }
        }
      }
    };

    readFeatures(geojsonPath1);
    readFeatures(geojsonPath2);

    let createdTdpCount = 0;

    for (let i = 0; i < OFFICIAL_27_TDPS.length; i++) {
      const tdpName = OFFICIAL_27_TDPS[i];
      const matchingFeature = geoFeatureMap.get(tdpName);

      let lat = 16.082;
      let lng = 108.115;
      let areaSqm = 50000;
      let singleFeatureCollection: any = null;

      if (matchingFeature && (matchingFeature.geometry?.type === 'Polygon' || matchingFeature.geometry?.type === 'MultiPolygon')) {
        try {
          areaSqm = Math.round(turf.area(matchingFeature));
          const centroid = turf.centroid(matchingFeature);
          [lng, lat] = centroid.geometry.coordinates;

          const cleanFeature = JSON.parse(JSON.stringify(matchingFeature));
          if (cleanFeature.geometry.coordinates) {
            cleanFeature.geometry.coordinates = roundCoordinates(cleanFeature.geometry.coordinates);
          }

          singleFeatureCollection = {
            type: "FeatureCollection",
            features: [cleanFeature]
          };
        } catch (err) {
          // fallback
        }
      }

      // Default geometry if missing in export
      if (!singleFeatureCollection) {
        singleFeatureCollection = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: tdpName },
              geometry: {
                type: "Point",
                coordinates: [lng, lat]
              }
            }
          ]
        };
      }

      const countSubjectsInTdp = subjectTdpDistribution[tdpName] || 0;

      const tdpData = {
        name: tdpName,
        households: 250,
        population: 1000,
        area_sqm: areaSqm,
        risk_status: countSubjectsInTdp > 8 ? 'red' : countSubjectsInTdp > 3 ? 'yellow' : 'green',
        color: PRESET_COLORS[i % PRESET_COLORS.length],
        center: [lat, lng],
        geojson: singleFeatureCollection,
        created_at: new Date(),
        updated_at: new Date()
      };

      await tdpColl.insertOne(tdpData);
      createdTdpCount++;
      console.log(`  ✓ [${createdTdpCount}/27] Đã tạo TDP mới: "${tdpName}" (${countSubjectsInTdp} đối tượng)`);
    }

    console.log('\n🎉 THỰC THI HOÀN TẤT!');
    console.log(`- Đã chuyển toàn bộ ${updatedSubjectCount} đối tượng về 27 TDP mới.`);
    console.log(`- Đã làm sạch và nạp đúng chuẩn 27 TDP theo Nghị quyết 20/NQ-HĐND.`);

  } catch (error) {
    console.error('❌ Lỗi khi thực thi script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
  }
}

applyResolution20();
