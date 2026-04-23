"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Subject, ISubject, Business } from "@/lib/models";

// Get all subjects with optional status filter and date range
export async function getSubjects(status?: string, startDate?: string, endDate?: string): Promise<ISubject[]> {
  await connectDB();
  const query: any = {};
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.created_at.$lte = end;
    }
  }

  const subjects = await Subject.find(query).sort({ created_at: -1 }).lean();
  return subjects as ISubject[];
}

// Get single subject by ID
export async function getSubject(id: string): Promise<ISubject | null> {
  await connectDB();
  const subject = await Subject.findById(id).lean();
  return subject as ISubject | null;
}

// Create new subject
export async function createSubject(data: Partial<ISubject>): Promise<ISubject> {
  await connectDB();
  const subject = await Subject.create({
    ...data,
  });
  revalidatePath("/subjects");
  revalidatePath("/");
  return subject as ISubject;
}

// Update existing subject
export async function updateSubject(id: string, data: Partial<ISubject>): Promise<ISubject | null> {
  await connectDB();
  const subject = await Subject.findByIdAndUpdate(
    id,
    {
      ...data,
    },
    { new: true }
  ).lean();
  revalidatePath("/subjects");
  revalidatePath("/");
  return subject as ISubject | null;
}

// Delete subject
export async function deleteSubject(id: string): Promise<boolean> {
  await connectDB();
  const result = await Subject.findByIdAndDelete(id);
  revalidatePath("/subjects");
  revalidatePath("/");
  return !!result;
}

// Get stats for dashboard
export async function getStats(startDate?: string, endDate?: string): Promise<{
  total_subjects: number;
  total_businesses: number;
  status_counts: Record<string, number>;
  tdp_stats: Record<string, number>;
}> {
  await connectDB();

  const matchQuery: any = {};
  if (startDate || endDate) {
    matchQuery.created_at = {};
    if (startDate) matchQuery.created_at.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchQuery.created_at.$lte = end;
    }
  }

  let statusCounts: any[];
  let tdpStats: any[];
  let total_subjects: number;
  let total_businesses: number;

  if (startDate || endDate) {
    const statusMatch = { status: { $exists: true, $ne: null } } as any;
    statusMatch.created_at = matchQuery.created_at;

    total_subjects = await Subject.countDocuments(matchQuery);
    total_businesses = await Business.countDocuments();
    statusCounts = await Subject.aggregate([{ $match: statusMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
    // @ts-ignore
    const tdpQ: any = { tdp: { $exists: true, $ne: null, $ne: "" } };
    tdpQ.created_at = matchQuery.created_at;
    tdpStats = await Subject.aggregate([{ $match: tdpQ }, { $group: { _id: "$tdp", count: { $sum: 1 } } }]);
  } else {
    const statusMatch: any = { status: { $exists: true, $ne: null } };
    // @ts-ignore
    const tdpMatch: any = { tdp: { $exists: true, $ne: null, $ne: "" } };

    total_subjects = await Subject.countDocuments();
    total_businesses = await Business.countDocuments();
    statusCounts = await Subject.aggregate([
      { $match: statusMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    tdpStats = await Subject.aggregate([
      { $match: tdpMatch },
      { $group: { _id: "$tdp", count: { $sum: 1 } } },
    ]);
  }

  const status_counts: Record<string, number> = {};
  statusCounts.forEach((item: any) => {
    if (item._id) status_counts[item._id] = item.count;
  });

  const tdp_stats: Record<string, number> = {};
  tdpStats.forEach((item: any) => {
    if (item._id) tdp_stats[item._id] = item.count;
  });

  return {
    total_subjects,
    total_businesses,
    status_counts,
    tdp_stats,
  };
}