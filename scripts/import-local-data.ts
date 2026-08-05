/**
 * Script: import-local-data.ts
 * Mục đích: Import subjects, businesses, customzones từ thư mục scripts/export vào MongoDB local
 * Chạy: npx tsx scripts/import-local-data.ts
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const LOCAL_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/qlmt-lienchieu";

async function importData() {
  console.log("📦 Bắt đầu import dữ liệu vào MongoDB Local...\n");

  const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Đã kết nối MongoDB Local\n");

  const exportDir = path.join(process.cwd(), "scripts", "export");
  if (!fs.existsSync(exportDir)) {
    console.error("❌ Không tìm thấy thư mục scripts/export/ chứa dữ liệu.");
    process.exit(1);
  }

  const collections = ["subjects", "businesses", "customzones"];

  for (const name of collections) {
    const filePath = path.join(exportDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Không tìm thấy file ${name}.json, bỏ qua...`);
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const docs = JSON.parse(fileContent);

    if (!Array.isArray(docs) || docs.length === 0) {
      console.log(`ℹ️ File ${name}.json rỗng, bỏ qua...`);
      continue;
    }

    const col = conn.db.collection(name);
    
    // Convert string _id back to ObjectId if needed
    const formattedDocs = docs.map((doc: any) => {
      if (doc._id && typeof doc._id === "string") {
        try {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        } catch (e) {
          // Keep as is if not ObjectId
        }
      }
      return doc;
    });

    await col.deleteMany({});
    await col.insertMany(formattedDocs);
    console.log(`✅ Imported ${formattedDocs.length} documents vào collection '${name}'`);
  }

  await conn.close();
  console.log("\n🎉 Khôi phục dữ liệu thành công!");
  process.exit(0);
}

importData().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
