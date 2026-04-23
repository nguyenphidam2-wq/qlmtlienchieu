/**
 * Script: push-to-vercel.ts
 * Mục đích: Gửi dữ liệu đã export lên Vercel production qua API
 * Chạy: npx tsx scripts/push-to-vercel.ts
 */

import fs from "fs";
import path from "path";

const VERCEL_URL = "https://qlmtlienchieu.vercel.app";
const SECRET = "import-qlmt-2024";

async function pushCollection(name: string, data: unknown[]) {
  console.log(`📤 Gửi ${data.length} documents lên collection "${name}"...`);
  
  const res = await fetch(`${VERCEL_URL}/api/import-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection: name, data, secret: SECRET }),
  });

  const result = await res.json() as { message: string; count?: number };
  if (res.ok) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ Lỗi: ${result.message}`);
  }
}

async function main() {
  console.log("🚀 Bắt đầu push dữ liệu lên Vercel...\n");

  const exportDir = path.join(process.cwd(), "scripts", "export");
  const collections = ["subjects", "businesses", "customzones"];

  for (const name of collections) {
    const filePath = path.join(exportDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Không tìm thấy file ${name}.json, bỏ qua`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    await pushCollection(name, data);
  }

  console.log("\n🎉 Hoàn tất! Vào https://qlmtlienchieu.vercel.app để kiểm tra.");
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
