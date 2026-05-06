"use server";

import connectDB from "@/lib/mongodb";
import { PCCCRecord, IPCCCRecord } from "@/lib/models/PCCC";
import { revalidatePath } from "next/cache";

export async function getPCCCRecords(): Promise<IPCCCRecord[]> {
  await connectDB();
  const records = await PCCCRecord.find().sort({ created_at: -1 }).lean();
  return JSON.parse(JSON.stringify(records));
}

export async function createPCCCRecord(data: Partial<IPCCCRecord>): Promise<IPCCCRecord> {
  await connectDB();
  const record = await PCCCRecord.create(data);
  revalidatePath("/pccc");
  revalidatePath("/gis");
  return JSON.parse(JSON.stringify(record));
}
