import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { TDP } from '../src/lib/models/TDP';
import { Subject } from '../src/lib/models/Subject';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to DB');
  
  const tdpCount = await TDP.countDocuments();
  const subjectCount = await Subject.countDocuments();
  console.log(`Current TDP count: ${tdpCount}`);
  console.log(`Current Subject count: ${subjectCount}`);

  const sampleTdps = await TDP.find().select('name center').limit(15);
  console.log('Sample TDPs:', sampleTdps.map(t => ({ name: t.name, center: t.center })));

  const sampleSubjects = await Subject.find().limit(5);
  console.log('Sample Subjects:', sampleSubjects.map(s => ({ name: s.full_name, tdp: s.tdp, address: s.address_current, lat: s.lat, lng: s.lng })));

  await mongoose.disconnect();
}

checkDb();
