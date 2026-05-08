import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import mongoose from "mongoose";

async function listDatabases() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not found");
    
    console.log(`Connecting to Atlas...`);
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    const admin = db.admin();
    const dbs = await admin.listDatabases();
    console.log("Databases on this cluster:");
    for (const d of dbs.databases) {
        console.log(`- ${d.name}`);
    }
    
    const dbNamesToCheck = ["test", "qlmt-lienchieu", "qlmt"];
    
    for (const name of dbNamesToCheck) {
        console.log(`\n--- Checking database: ${name} ---`);
        await mongoose.disconnect();
        // Construct URI with DB name
        const newUri = uri.includes("/?") ? uri.replace("/?", `/${name}?`) : uri + (uri.endsWith("/") ? name : `/${name}`);
        try {
            await mongoose.connect(newUri);
            const collections = await mongoose.connection.db?.listCollections().toArray();
            if (collections && collections.length > 0) {
                console.log(`Collections: ${collections.map(c => c.name).join(", ")}`);
                for (const collInfo of collections) {
                    const coll = mongoose.connection.db?.collection(collInfo.name);
                    const count = await coll?.countDocuments();
                    console.log(`  - [${collInfo.name}]: ${count} docs`);
                    if (count! > 0 && collInfo.name === "customzones") {
                         const doc = await coll?.findOne({});
                         console.log(`    Sample CustomZone: ${doc?.name}`);
                    }
                }
            } else {
                console.log("No collections found or empty.");
            }
        } catch (err) {
            console.log(`Could not connect to ${name}: ${err}`);
        }
    }

  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listDatabases();
