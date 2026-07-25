import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log("MONGODB_URI from .env.local:", process.env.MONGODB_URI);

async function checkVercelDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found!");
    return;
  }

  const conn = await mongoose.createConnection(uri).asPromise();
  console.log("Connected DB name:", conn.db.databaseName);

  const collections = await conn.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const subjectsCol = conn.db.collection('subjects');
  const count = await subjectsCol.countDocuments({});
  console.log("Total subjects count in this DB:", count);

  const statuses = await subjectsCol.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]).toArray();
  console.log("Status distribution:", statuses);

  const approvals = await subjectsCol.aggregate([
    { $group: { _id: "$approval_status", count: { $sum: 1 } } }
  ]).toArray();
  console.log("Approval distribution:", approvals);

  // Check if there are other databases on this cluster
  const adminDb = conn.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log("Databases on cluster:", dbs.databases.map(d => d.name));

  for (const dbInfo of dbs.databases) {
    if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
    const testConn = conn.useDb(dbInfo.name);
    const subCount = await testConn.collection('subjects').countDocuments({});
    console.log(`DB "${dbInfo.name}" -> subjects count: ${subCount}`);
    if (subCount > 0) {
      const dbStatuses = await testConn.collection('subjects').aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray();
      console.log(`DB "${dbInfo.name}" statuses:`, dbStatuses);
    }
  }

  await conn.close();
}

checkVercelDb().catch(console.error);
