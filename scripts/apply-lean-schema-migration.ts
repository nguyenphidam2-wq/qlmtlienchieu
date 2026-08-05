import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { Subject } from '../src/lib/models/Subject';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function runMigration() {
  console.log('🚀 Bắt đầu nâng cấp Cơ sở dữ liệu theo Ponytail Lean Schema...');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI không tồn tại');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối thành công tới MongoDB.');

    const subjectColl = mongoose.connection.db.collection('subjects');

    // 1. Loại bỏ các trường thừa / trùng lặp (Father/Mother/Spouse, Single drug_type)
    const unsetResult = await subjectColl.updateMany(
      {},
      {
        $unset: {
          father_name: "",
          mother_name: "",
          spouse_name: "",
          phone_father: "",
          phone_mother: "",
          phone_spouse: "",
          drug_type: "",
          vneid_account: "",
          audit_logs: "",
          location_geojson: ""
        }
      }
    );
    console.log(`🧹 Đã làm sạch và xóa các trường trùng lặp trên ${unsetResult.modifiedCount} bản ghi.`);

    // 2. Tạo các chỉ mục tối ưu hiệu suất (Indexes)
    console.log('⚡ Đang khởi tạo các Index tối ưu hiệu suất truy vấn...');
    await Subject.syncIndexes();
    console.log('✅ Đã đồng bộ các Index: id_card, full_name, tdp, status, risk_level, registered_vehicles.license_plate!');

    console.log('\n🎉 NÂNG CẤP SCHEMA VÀ MIGRATION HOÀN TẤT THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi khi thực thi migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
  }
}

runMigration();
