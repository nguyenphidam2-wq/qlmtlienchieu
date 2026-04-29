"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { Business, IBusiness } from "@/lib/models";
import { getCurrentUserInfo } from "./subjects";

// Re-export for use in BusinessList
export { getCurrentUserInfo } from "./subjects";

// Get all businesses with optional pending filter
export async function getBusinesses(
  includePending = false
): Promise<IBusiness[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (!includePending) {
    filter.$or = [
      { approval_status: "Approved" },
      { approval_status: { $exists: false } },
    ];
  }

  const businesses = await Business.find(filter).sort({ created_at: -1 }).lean();
  return businesses as IBusiness[];
}

// Get single business by ID
export async function getBusiness(id: string): Promise<IBusiness | null> {
  await connectDB();
  const business = await Business.findById(id).lean();
  return business as IBusiness | null;
}

// Create new business
export async function createBusiness(data: Partial<IBusiness>): Promise<{ success: boolean; error?: string; business?: IBusiness }> {
  try {
    await connectDB();

    const currentUser = await getCurrentUserInfo();

    // If role is officer, set to Pending; otherwise Approved
    const approval_status: "Pending" | "Approved" =
      currentUser?.role === "officer" ? "Pending" : "Approved";

    const business = await Business.create({
      ...data,
      approval_status,
      created_by: currentUser?.id,
    });

    revalidatePath("/businesses");
    revalidatePath("/");

    return { success: true, business: business as IBusiness };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Update existing business
export async function updateBusiness(
  id: string,
  data: Partial<IBusiness>
): Promise<{ success: boolean; error?: string; business?: IBusiness }> {
  try {
    await connectDB();
    const business = await Business.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!business) return { success: false, error: "Business not found" };

    revalidatePath("/businesses");
    revalidatePath("/");

    return { success: true, business: business as IBusiness };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Delete business
export async function deleteBusiness(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const result = await Business.findByIdAndDelete(id);
    if (!result) return { success: false, error: "Business not found" };

    revalidatePath("/businesses");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Approve single business
export async function approveBusiness(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const currentUser = await getCurrentUserInfo();

    await Business.findByIdAndUpdate(id, {
      approval_status: "Approved",
      approved_by: currentUser?.id,
      approved_at: new Date(),
    });

    revalidatePath("/businesses");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// Bulk approve businesses
export async function bulkApproveBusinesses(
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const currentUser = await getCurrentUserInfo();

    await Business.updateMany(
      { _id: { $in: ids } },
      {
        approval_status: "Approved",
        approved_by: currentUser?.id,
        approved_at: new Date(),
      }
    );

    revalidatePath("/businesses");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}