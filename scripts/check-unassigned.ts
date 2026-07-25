import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../src/lib/mongodb';
import { Subject } from '../src/lib/models/Subject';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkUnassigned() {
  await connectDB();
  const unassigned = await Subject.find({ tdp: 'Chưa phân tổ' }).select('full_name address_current address_permanent');
  console.log(`Total unassigned subjects: ${unassigned.length}`);
  unassigned.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.full_name} -> Curr: "${s.address_current}" | Perm: "${s.address_permanent}"`);
  });
  await mongoose.disconnect();
}

checkUnassigned();
