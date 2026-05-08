import mongoose from "mongoose";
// connectDB will fall back to local if process.env.MONGODB_URI is not set
import { connectDB } from "../src/lib/mongodb";

async function checkLocal() {
  try {
    console.log("📊 Kiểm tra Local MongoDB...");
    // Force local by clearing env
    delete process.env.MONGODB_URI;
    
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
      
      if (count > 0) {
        const doc = await coll.findOne({});
        console.log(`  Sample: ${doc?.name || doc?._id}`);
      }
    }
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkLocal();
