/**
 * Script: migrate-to-atlas.ts
 * Mục đích: Export toàn bộ dữ liệu từ MongoDB local và import lên MongoDB Atlas
 * Chạy: npx tsx scripts/migrate-to-atlas.ts
 */

import mongoose from "mongoose";

const LOCAL_URI = "mongodb://localhost:27017/qlmt-lienchieu";
const ATLAS_URI = process.env.MONGODB_URI || "mongodb://admin:M2QKeyQwumScBLuN@ac-ywyb5s8-shard-00-00.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-01.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-02.129xiqk.mongodb.net:27017/?authSource=admin&replicaSet=atlas-upfdpr-shard-0&tls=true";

async function migrate() {
  console.log("🔄 Bắt đầu migrate dữ liệu từ Local → Atlas...\n");

  // Kết nối LOCAL
  console.log("📡 Kết nối MongoDB Local...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Đã kết nối Local\n");

  // Lấy tất cả collections
  const collections = await localConn.db.listCollections().toArray();
  console.log(`📦 Tìm thấy ${collections.length} collections:`, collections.map(c => c.name).join(", "));

  // Kết nối ATLAS
  console.log("\n📡 Kết nối MongoDB Atlas...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log("✅ Đã kết nối Atlas\n");

  let totalMigrated = 0;

  for (const collectionInfo of collections) {
    const collName = collectionInfo.name;
    
    // Bỏ qua users (không migrate, sẽ dùng setup API)
    if (collName === "users") {
      console.log(`⏭️  Bỏ qua collection: ${collName} (dùng setup API để tạo users)`);
      continue;
    }

    const localCollection = localConn.db.collection(collName);
    const atlasCollection = atlasConn.db.collection(collName);

    const docs = await localCollection.find({}).toArray();

    // Xóa dữ liệu cũ trên Atlas để đồng bộ tuyệt đối với Local
    await atlasCollection.deleteMany({});
    
    if (docs.length === 0) {

      console.log(`🧹 Collection "${collName}": trống ở Local → Đã xóa sạch trên Atlas`);
      continue;
    }

    console.log(`📋 Collection "${collName}": ${docs.length} documents`);
    const result = await atlasCollection.insertMany(docs);
    console.log(`✅ Đã migrate ${result.insertedCount} documents lên Atlas`);
    totalMigrated += result.insertedCount;

  }

  console.log(`\n🎉 Hoàn tất! Tổng cộng đã migrate ${totalMigrated} documents lên MongoDB Atlas`);
  console.log("🌐 Truy cập https://qlmtlienchieu.vercel.app để xem dữ liệu\n");

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Lỗi migrate:", err.message);
  process.exit(1);
});
