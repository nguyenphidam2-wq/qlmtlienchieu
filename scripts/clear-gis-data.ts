import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { TDP } from "../src/lib/models/TDP";
import { CustomZone } from "../src/lib/models/CustomZone";
import { PCCCRecord } from "../src/lib/models/PCCC";
import { Subject } from "../src/lib/models/Subject";
import { Business } from "../src/lib/models/Business";

async function clearGISData() {
  try {
    console.log("🚀 Bắt đầu dọn dẹp TOÀN BỘ dữ liệu bản đồ...");
    await connectDB();
    
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(`- Đang kết nối tới Database: ${dbName}`);
    console.log(`- Các collection tìm thấy: ${collections?.map(c => c.name).join(", ")}`);
    
    // 1. Xóa Tổ dân phố (TDP)
    const tdpCount = await TDP.countDocuments();
    console.log(`- Tìm thấy ${tdpCount} Tổ dân phố.`);
    if (tdpCount > 0) {
      await TDP.deleteMany({});
      console.log("✓ Đã xóa sạch layer Tổ dân phố.");
    }

    // 2. Xóa Khu vực tùy chỉnh (Custom Zones)
    const zoneCount = await CustomZone.countDocuments();
    console.log(`- Tìm thấy ${zoneCount} Khu vực tùy chỉnh.`);
    if (zoneCount > 0) {
      await CustomZone.deleteMany({});
      console.log("✓ Đã xóa sạch layer Khu vực tùy chỉnh.");
    }

    // 3. Xóa Dữ liệu PCCC
    const pcccCount = await PCCCRecord.countDocuments();
    console.log(`- Tìm thấy ${pcccCount} điểm PCCC.`);
    if (pcccCount > 0) {
      await PCCCRecord.deleteMany({});
      console.log("✓ Đã xóa sạch layer PCCC.");
    }

    // 4. Xóa Đối tượng (Subjects)
    const subjectCount = await Subject.countDocuments();
    console.log(`- Tìm thấy ${subjectCount} Đối tượng.`);
    if (subjectCount > 0) {
      await Subject.deleteMany({});
      console.log("✓ Đã xóa sạch layer Đối tượng.");
    }

    // 5. Xóa Doanh nghiệp (Businesses)
    const businessCount = await Business.countDocuments();
    console.log(`- Tìm thấy ${businessCount} Doanh nghiệp.`);
    if (businessCount > 0) {
      await Business.deleteMany({});
      console.log("✓ Đã xóa sạch layer Doanh nghiệp.");
    }

    console.log("\n✨ HOÀN TẤT: Hệ thống đã trống rỗng.");
    console.log("Sẵn sàng để nhập dữ liệu chuẩn mới.");

  } catch (error) {
    console.error("❌ Lỗi khi dọn dẹp dữ liệu:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearGISData();
