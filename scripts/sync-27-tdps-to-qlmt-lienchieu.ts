import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const ATLAS_URI = process.env.MONGODB_URI || "";

async function syncTdps() {
  const baseConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const testDb = baseConn.useDb('test');
  const lienChieuDb = baseConn.useDb('qlmt-lienchieu');

  const tdps27 = await testDb.collection('tdps').find({}).toArray();
  console.log(`📋 Loaded ${tdps27.length} new TDPs from 'test' DB.`);

  await lienChieuDb.collection('tdps').deleteMany({});
  await lienChieuDb.collection('tdps').insertMany(tdps27);
  console.log(`✅ Synced ${tdps27.length} TDPs into 'qlmt-lienchieu' DB.`);

  // Now re-map 123 subjects in qlmt-lienchieu DB onto the 27 new TDPs
  const { calculateSmartCoordinates } = await import('../src/lib/services/smartGeocoding');
  const tdpList = tdps27.map(t => ({
    _id: t._id,
    name: t.name,
    center: t.center as [number, number],
    geojson: t.geojson
  }));

  const subjects = await lienChieuDb.collection('subjects').find({}).toArray();
  const tdpClusterCountMap = new Map<string, number>();

  for (const s of subjects) {
    const matchedTDP = calculateSmartCoordinates(s.address_current, s.address_permanent, 0, tdpList).matchedTdpName;
    const currentClusterIdx = (tdpClusterCountMap.get(matchedTDP) || 0) + 1;
    tdpClusterCountMap.set(matchedTDP, currentClusterIdx);

    const geoResult = calculateSmartCoordinates(s.address_current, s.address_permanent, currentClusterIdx, tdpList);

    await lienChieuDb.collection('subjects').updateOne(
      { _id: s._id },
      { $set: { tdp: geoResult.matchedTdpName, lat: geoResult.lat, lng: geoResult.lng } }
    );
  }

  console.log(`🎉 Successfully re-geocoded all ${subjects.length} subjects onto 27 new TDPs in 'qlmt-lienchieu' DB!`);
  await baseConn.close();
}

syncTdps().catch(console.error);
