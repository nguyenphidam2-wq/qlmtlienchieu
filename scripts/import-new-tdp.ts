import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as turf from '@turf/turf';
import { TDP } from '../src/lib/models/TDP';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Preset colors for TDPs to make them look vibrant and beautiful
const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#6366f1", "#8b5cf6", 
  "#ec4899", "#f43f5e", "#06b6d4", "#14b8a6", 
  "#f59e0b", "#10b981"
];

function formatTdpName(rawName: string): string {
  let name = rawName.trim();
  
  if (/^tổ\s+dân\s+phố\s+/i.test(name)) {
    // Đã có tiền tố "Tổ dân phố", chuẩn hóa phần còn lại
    name = name.replace(/^tổ\s+dân\s+phố\s+/i, 'Tổ dân phố ');
  } else if (/^tổ\s+/i.test(name)) {
    // Chỉ có "Tổ", thay thế thành "Tổ dân phố"
    name = name.replace(/^tổ\s+/i, 'Tổ dân phố ');
  } else {
    // Chưa có gì, thêm "Tổ dân phố"
    name = 'Tổ dân phố ' + name;
  }
  
  // Standardize Title Case for Vietnamese names
  return name.split(' ').map((word, idx) => {
    if (word.toUpperCase() === 'CC') return 'CC';
    
    // Đảm bảo "Tổ dân phố" được viết hoa đúng chuẩn
    if (idx === 0 && /^tổ$/i.test(word)) return 'Tổ';
    if (idx === 1 && /^dân$/i.test(word)) return 'Dân';
    if (idx === 2 && /^phố$/i.test(word)) return 'Phố';
    
    if (word.includes('-')) {
      return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

async function importNewTdpData() {
  console.log('🚀 Bắt đầu xóa dữ liệu TDP cũ và nhập dữ liệu từ tdp_export.geojson...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI không tồn tại trong .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối thành công tới MongoDB');

    // 1. Xóa toàn bộ TDP cũ
    const deleteResult = await TDP.deleteMany({});
    console.log(`🧹 Đã xóa thành công ${deleteResult.deletedCount} Tổ dân phố cũ khỏi database.`);

    // 2. Đọc file GeoJSON mới
    const geojsonPath = path.resolve(process.cwd(), 'tdp_export.geojson');
    if (!fs.existsSync(geojsonPath)) {
      console.error('❌ Không tìm thấy file GeoJSON tại:', geojsonPath);
      process.exit(1);
    }

    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
    const features = geojsonData.features || [];

    // Lọc các feature có hình học là Polygon hoặc MultiPolygon đại diện cho ranh giới TDP
    const tdpFeatures = features.filter((f: any) => 
      f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
    );

    console.log(`📋 Tìm thấy ${tdpFeatures.length} vùng ranh giới TDP trong file GeoJSON.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tdpFeatures.length; i++) {
      const f = tdpFeatures[i];
      try {
        const rawName = f.properties?.name || `TỔ ${i + 1}`;
        const formattedName = formatTdpName(rawName);
        
        // Tính toán diện tích sử dụng Turf (trả về mét vuông)
        const areaSqm = Math.round(turf.area(f));
        
        // Tính toán tâm hình học (Centroid) dùng Turf
        const centroid = turf.centroid(f);
        const [lng, lat] = centroid.geometry.coordinates;
        
        // Làm tròn tọa độ GeoJSON xuống 6 chữ số thập phân (chuẩn hóa độ chính xác)
        const cleanFeature = JSON.parse(JSON.stringify(f));
        if (cleanFeature.geometry.coordinates) {
          cleanFeature.geometry.coordinates = roundCoordinates(cleanFeature.geometry.coordinates);
        }

        // Bọc feature đơn lẻ vào một FeatureCollection để lưu trữ đúng schema
        const singleFeatureCollection = {
          type: "FeatureCollection",
          features: [cleanFeature]
        };

        const tdpData = {
          name: formattedName,
          households: f.properties?.households || 0,
          population: f.properties?.population || 0,
          area_sqm: areaSqm || Math.round((f.properties?.area || 0) * 10000),
          risk_status: (f.properties?.risk_status || 'green') as 'green' | 'yellow' | 'red',
          color: f.properties?.color || PRESET_COLORS[i % PRESET_COLORS.length],
          center: [lat, lng] as [number, number], // Dùng kiểu [lat, lng] cho Leaflet
          geojson: singleFeatureCollection,
          leader_name: f.properties?.leader_name || undefined,
          leader_phone: f.properties?.leader_phone || undefined
        };

        // Lưu vào Database
        await TDP.create(tdpData);
        console.log(`  ✓ Đã nhập: ${formattedName} (Diện tích: ${tdpData.area_sqm.toLocaleString()} m², Tâm: [${lat.toFixed(6)}, ${lng.toFixed(6)}])`);
        successCount++;
      } catch (err: any) {
        console.error(`  ❌ Lỗi khi nhập feature thứ ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 HOÀN TẤT NHẬP DỮ LIỆU:`);
    console.log(`- Nhập thành công: ${successCount}/${tdpFeatures.length} TDP mới.`);
    console.log(`- Lỗi: ${errorCount}`);

  } catch (error) {
    console.error('❌ Lỗi kết nối hoặc xử lý dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

// Hàm đệ quy làm tròn tọa độ xuống 6 chữ số thập phân
function roundCoordinates(coords: any): any {
  if (typeof coords === 'number') {
    return Math.round(coords * 1000000) / 1000000;
  }
  if (Array.isArray(coords)) {
    return coords.map(roundCoordinates);
  }
  return coords;
}

importNewTdpData();
