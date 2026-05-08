import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import { TDP } from '../src/lib/models/TDP'; // Đường dẫn đúng

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function importData() {
    console.log('🚀 Bắt đầu nạp dữ liệu TDP chuẩn vào Database...');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Đã kết nối MongoDB');

        // Đọc file Excel
        const filePath = path.resolve(process.cwd(), 'public/Mau_Nhap_Lieu_TDP_Chuan.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('❌ Không tìm thấy file:', filePath);
            process.exit(1);
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        console.log(`📋 Đã đọc được ${rows.length} dòng từ Excel.`);

        let successCount = 0;
        let errorCount = 0;

        for (const row of rows) {
            try {
                // Parse GeoJSON
                let geojson = null;
                if (row.geojson) {
                    try {
                        geojson = JSON.parse(row.geojson);
                    } catch (e) {
                        console.warn(`⚠️ Lỗi parse GeoJSON cho ${row.name}`);
                    }
                }

                const tdpData = {
                    name: row.name,
                    households: row.households || 0,
                    population: row.population || 0,
                    area_sqm: row.area_sqm || 0,
                    risk_status: row.risk_status || 'Bình thường',
                    color: row.color || '#3b82f6',
                    leader_name: row.leader_name || '',
                    leader_phone: String(row.leader_phone || ''),
                    geojson: geojson
                };

                // Cập nhật hoặc tạo mới
                await TDP.findOneAndUpdate(
                    { name: row.name },
                    { $set: tdpData },
                    { upsert: true, new: true }
                );
                successCount++;
            } catch (err) {
                console.error(`❌ Lỗi khi import ${row.name}:`, err.message);
                errorCount++;
            }
        }

        console.log(`🎉 Import hoàn tất: ${successCount} thành công, ${errorCount} lỗi.`);

    } catch (error) {
        console.error('❌ Lỗi kết nối hoặc xử lý:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

importData();
