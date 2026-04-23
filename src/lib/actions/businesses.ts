"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { Business, IBusiness } from "@/lib/models";

// Get all businesses
export async function getBusinesses(): Promise<IBusiness[]> {
  await connectDB();
  const businesses = await Business.find().sort({ created_at: -1 }).lean();
  return businesses as IBusiness[];
}

// Get single business by ID
export async function getBusiness(id: string): Promise<IBusiness | null> {
  await connectDB();
  const business = await Business.findById(id).lean();
  return business as IBusiness | null;
}

// Create new business
export async function createBusiness(data: Partial<IBusiness>): Promise<IBusiness> {
  await connectDB();
  const business = await Business.create(data);
  revalidatePath("/businesses");
  revalidatePath("/");
  return business as IBusiness;
}

// Update existing business
export async function updateBusiness(id: string, data: Partial<IBusiness>): Promise<IBusiness | null> {
  await connectDB();
  const business = await Business.findByIdAndUpdate(id, data, { new: true }).lean();
  revalidatePath("/businesses");
  revalidatePath("/");
  return business as IBusiness | null;
}

// Delete business
export async function deleteBusiness(id: string): Promise<boolean> {
  await connectDB();
  const result = await Business.findByIdAndDelete(id);
  revalidatePath("/businesses");
  revalidatePath("/");
  return !!result;
}