/**
 * Script: export-local-data.ts
 * Mục đích: Export subjects, businesses, customzones từ MongoDB local ra file JSON
 * Chạy: npx tsx scripts/export-local-data.ts
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const LOCAL_URI = "mongodb://localhost:27017/qlmt-lienchieu";

async function exportData() {
  console.log("📦 Bắt đầu export dữ liệu từ MongoDB Local...\n");

  const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Đã kết nối MongoDB Local\n");

  const outDir = path.join(process.cwd(), "scripts", "export");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const collections = ["subjects", "businesses", "customzones"];
  
  for (const name of collections) {
    const col = conn.db.collection(name);
    const docs = await col.find({}).toArray();
    const filePath = path.join(outDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
    console.log(`✅ Exported ${docs.length} documents → scripts/export/${name}.json`);
  }

  await conn.close();
  console.log("\n🎉 Export hoàn tất! Kiểm tra thư mục scripts/export/");
  process.exit(0);
}

exportData().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
