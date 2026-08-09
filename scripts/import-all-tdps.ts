import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as turf from '@turf/turf';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { TDP } from '../src/lib/models/TDP';

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#6366f1", "#8b5cf6", 
  "#ec4899", "#f43f5e", "#06b6d4", "#14b8a6", 
  "#f59e0b", "#10b981"
];

async function importAllTdpData() {
  console.log('🚀 Nạp dữ liệu TDP từ bản tổng hợp mới nhất...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI không tồn tại');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ Đã kết nối MongoDB: ${uri.split('@')[1] || uri}`);

    // Xoá trắng TDP cũ
    await TDP.deleteMany({});
    console.log('🧹 Đã xóa toàn bộ TDP cũ khỏi hệ thống.');

    const geojsonPath = path.resolve(process.cwd(), 'data/final_tdps_2026.geojson');
    if (!fs.existsSync(geojsonPath)) {
      console.error('❌ Không tìm thấy file data/final_tdps_2026.geojson');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
    const features = data.features || [];
    console.log(`📋 Sẽ nạp ${features.length} TDP vào hệ thống.`);

    let count = 0;
    for (const f of features) {
      try {
        const props = f.properties || {};
        
        // Tính toán tọa độ tâm và diện tích
        let lat = 16.075;
        let lng = 108.145;
        let areaSqm = 0;

        if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
          areaSqm = Math.round(turf.area(f));
          const centroid = turf.centroid(f);
          [lng, lat] = centroid.geometry.coordinates;
        }

        const singleFeatureCollection = {
          type: "FeatureCollection",
          features: [f]
        };

        const tdpData = {
          name: props.name,
          households: props.households || 0,
          population: props.population || 0,
          area_sqm: areaSqm,
          risk_status: 'green',
          color: PRESET_COLORS[count % PRESET_COLORS.length],
          center: [lat, lng],
          geojson: singleFeatureCollection,
          leader_name: props.leader_name || undefined,
          leader_phone: props.leader_phone || undefined,
          police_name: props.police_name || undefined,
          police_phone: props.police_phone || undefined,
          boundary_info: props.boundary_info || undefined
        };

        await TDP.create(tdpData);
        count++;
      } catch (e: any) {
        console.error(`❌ Lỗi khi nạp TDP ${f.properties?.name}:`, e.message);
      }
    }

    console.log(`✅ Đã nhập thành công ${count} TDP vào DB.`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

importAllTdpData();
