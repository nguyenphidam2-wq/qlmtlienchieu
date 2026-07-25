import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function copyData() {
  const uri = process.env.MONGODB_URI || "";
  console.log("Connecting to Atlas cluster...");
  const conn = await mongoose.connect(uri);

  const testDb = conn.connection.useDb("test");
  const targetDb = conn.connection.useDb("qlmt-lienchieu");

  const collections = await testDb.db.listCollections().toArray();
  console.log("Found collections in 'test' DB:", collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name;
    const docs = await testDb.db.collection(name).find({}).toArray();
    console.log(`Copying ${docs.length} docs from test.${name} -> qlmt-lienchieu.${name}...`);

    if (docs.length > 0) {
      await targetDb.db.collection(name).deleteMany({});
      const res = await targetDb.db.collection(name).insertMany(docs);
      console.log(`✅ Copied ${res.insertedCount} docs to qlmt-lienchieu.${name}`);
    }
  }

  console.log("\n🎉 Copy finished successfully!");
  process.exit(0);
}

copyData().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
