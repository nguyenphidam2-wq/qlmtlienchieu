import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as turf from '@turf/turf';
import { connectDB } from '../src/lib/mongodb';
import { TDP } from '../src/lib/models/TDP';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#6366f1", "#8b5cf6", 
  "#ec4899", "#f43f5e", "#06b6d4", "#14b8a6", 
  "#f59e0b", "#10b981"
];

function formatTdpName(rawName: string): string {
  let name = rawName.trim();
  
  if (/^tổ\s+dân\s+phố\s+/i.test(name)) {
    name = name.replace(/^tổ\s+dân\s+phố\s+/i, 'Tổ Dân Phố ');
  } else if (/^tổ\s+/i.test(name)) {
    name = name.replace(/^tổ\s+/i, 'Tổ Dân Phố ');
  } else {
    name = 'Tổ Dân Phố ' + name;
  }
  
  return name.split(' ').map((word, idx) => {
    if (word.toUpperCase() === 'CC') return 'CC';
    if (idx === 0 && /^tổ$/i.test(word)) return 'Tổ';
    if (idx === 1 && /^dân$/i.test(word)) return 'Dân';
    if (idx === 2 && /^phố$/i.test(word)) return 'Phố';
    if (word.includes('-')) {
      return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
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

async function importAllTdpData() {
  console.log('🚀 Nạp dữ liệu TDP ranh giới đầy đủ...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI không tồn tại');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('✅ Đã kết nối MongoDB (qlmt-lienchieu)');

    // Clear existing TDPs
    await TDP.deleteMany({});
    console.log('🧹 Đã xóa TDP cũ.');

    // 1. First read tdp_export.geojson (Polygons)
    const geojsonPath1 = path.resolve(process.cwd(), 'tdp_export.geojson');
    const geojsonPath2 = path.resolve(process.cwd(), 'Dean_Sat_Nhap_TDP_25_6_Complete.geojson');

    const mapByName = new Map<string, any>();

    if (fs.existsSync(geojsonPath1)) {
      const data1 = JSON.parse(fs.readFileSync(geojsonPath1, 'utf-8'));
      for (const f of data1.features || []) {
        const rawName = f.properties?.name || f.properties?.Ten || f.properties?.TEN_TDP;
        if (rawName) {
          mapByName.set(formatTdpName(rawName), f);
        }
      }
    }

    if (fs.existsSync(geojsonPath2)) {
      const data2 = JSON.parse(fs.readFileSync(geojsonPath2, 'utf-8'));
      for (const f of data2.features || []) {
        const rawName = f.properties?.name || f.properties?.Ten || f.properties?.TEN_TDP;
        if (rawName) {
          const name = formatTdpName(rawName);
          if (!mapByName.has(name) || f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
            mapByName.set(name, f);
          }
        }
      }
    }

    console.log(`📋 Tổng số TDP thu thập được: ${mapByName.size}`);

    let count = 0;
    for (const [formattedName, f] of mapByName.entries()) {
      try {
        let lat = 16.075;
        let lng = 108.145;
        let areaSqm = 0;

        if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
          areaSqm = Math.round(turf.area(f));
          const centroid = turf.centroid(f);
          [lng, lat] = centroid.geometry.coordinates;
        } else if (f.geometry?.type === 'Point') {
          [lng, lat] = f.geometry.coordinates;
          areaSqm = f.properties?.area ? Math.round(f.properties.area * 10000) : 15000;
        }

        const cleanFeature = JSON.parse(JSON.stringify(f));
        if (cleanFeature.geometry && cleanFeature.geometry.coordinates) {
          cleanFeature.geometry.coordinates = roundCoordinates(cleanFeature.geometry.coordinates);
        }

        const singleFeatureCollection = {
          type: "FeatureCollection",
          features: [cleanFeature]
        };

        const tdpData = {
          name: formattedName,
          households: f.properties?.households || f.properties?.SoHo || 0,
          population: f.properties?.population || f.properties?.SoDan || 0,
          area_sqm: areaSqm,
          risk_status: (f.properties?.risk_status || 'green') as 'green' | 'yellow' | 'red',
          color: f.properties?.color || PRESET_COLORS[count % PRESET_COLORS.length],
          center: [lat, lng] as [number, number],
          geojson: singleFeatureCollection,
          leader_name: f.properties?.leader_name || undefined,
          leader_phone: f.properties?.leader_phone || undefined
        };

        await TDP.create(tdpData);
        count++;
      } catch (e: any) {
        console.error(`Lỗi khi tạo TDP ${formattedName}:`, e.message);
      }
    }

    console.log(`✅ Đã nhập ${count} TDP vào DB.`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

importAllTdpData();
