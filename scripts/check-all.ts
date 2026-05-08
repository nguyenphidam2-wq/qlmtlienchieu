import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";

async function checkAllCollections() {
  try {
    console.log("📊 Kiểm tra tất cả collection trên Atlas...");
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    const dbName = db.databaseName;
    console.log(`- Database Name: ${dbName}`);

    const collections = await db.listCollections().toArray();
    for (const collInfo of collections) {
      const coll = db.collection(collInfo.name);
      const count = await coll.countDocuments();
      console.log(`- Collection [${collInfo.name}]: ${count} docs`);
    }
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAllCollections();
