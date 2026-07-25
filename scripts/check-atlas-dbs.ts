import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkAtlas() {
  const uri = process.env.MONGODB_URI || '';
  console.log('Connecting to:', uri.replace(/:[^:@]+@/, ':****@'));
  const conn = await mongoose.connect(uri);
  const admin = conn.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases on cluster:', dbs.databases);

  for (const dbInfo of dbs.databases) {
    const db = conn.connection.useDb(dbInfo.name);
    const collections = await db.db.listCollections().toArray();
    console.log(`\nDB [${dbInfo.name}]: collections:`, collections.map(c => c.name));
    for (const col of collections) {
      const count = await db.db.collection(col.name).countDocuments();
      console.log(`  Collection [${col.name}] count:`, count);
    }
  }

  process.exit(0);
}

checkAtlas();
