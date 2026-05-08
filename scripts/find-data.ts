import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";

async function findData() {
  try {
    console.log("🔍 Tìm kiếm dữ liệu 'Khu vực 81'...");
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    const collections = await db.listCollections().toArray();
    for (const collInfo of collections) {
      const coll = db.collection(collInfo.name);
      const doc = await coll.findOne({ name: /Khu vực 81/i });
      if (doc) {
        console.log(`✅ Tìm thấy trong collection: ${collInfo.name}`);
        console.log(JSON.stringify(doc, null, 2).substring(0, 500) + "...");
        return;
      }
    }
    console.log("❌ Không tìm thấy 'Khu vực 81' trong bất kỳ collection nào.");
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

findData();
