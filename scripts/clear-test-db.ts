import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { TDP } from "../src/lib/models/TDP";
import { CustomZone } from "../src/lib/models/CustomZone";
import { PCCCRecord } from "../src/lib/models/PCCC";
import { Subject } from "../src/lib/models/Subject";
import { Business } from "../src/lib/models/Business";

async function clearTestDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not found");
    
    // Đảm bảo kết nối tới database 'test' nơi chứa dữ liệu thừa
    const testUri = uri.includes("/?") ? uri.replace("/?", "/test?") : uri + "/test";
    
    console.log("🚀 Đang kết nối tới database 'test' để dọn dẹp...");
    await mongoose.connect(testUri);
    
    const db = mongoose.connection.db;
    console.log(`- Đã kết nối: ${db?.databaseName}`);

    const models = [
        { name: "Tổ dân phố", model: TDP },
        { name: "Khu vực", model: CustomZone },
        { name: "PCCC", model: PCCCRecord },
        { name: "Đối tượng", model: Subject },
        { name: "Doanh nghiệp", model: Business }
    ];

    for (const m of models) {
        const count = await m.model.countDocuments();
        console.log(`- Tìm thấy ${count} ${m.name}.`);
        if (count > 0) {
            await m.model.deleteMany({});
            console.log(`  ✓ Đã xóa sạch ${m.name}.`);
        }
    }

    console.log("\n✨ HOÀN TẤT: Database 'test' đã được dọn sạch hoàn toàn.");

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearTestDatabase();
