"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { Rental, type IRental } from "@/lib/models";
import { getCurrentUser } from "@/lib/jwt";
import { buildAuditChanges, recordAudit } from "@/lib/audit";

const EDITOR_ROLES = ["admin", "leader", "officer"];

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !EDITOR_ROLES.includes(user.role)) throw new Error("Unauthorized");
  return user;
}

export async function getRentals(tdp?: string) {
  await connectDB();
  const query = tdp ? { tdp } : {};
  const rows = await Rental.find(query).sort({ updated_at: -1 }).lean();
  return JSON.parse(JSON.stringify(rows));
}

export async function createRental(data: Partial<IRental>) {
  const user = await requireEditor();
  await connectDB();
  const rental = await Rental.create({
    ...data,
    approval_status: user.role === "officer" ? "Pending" : "Approved",
    created_by: user.id,
  });
  await recordAudit({
    entity_type: "Rental",
    entity_id: rental._id.toString(),
    action: "CREATE",
    actor: user,
    changes: buildAuditChanges(null, rental.toObject()),
  });
  revalidatePath("/rentals");
  return JSON.parse(JSON.stringify(rental));
}

export async function updateRental(id: string, data: Partial<IRental>) {
  const user = await requireEditor();
  await connectDB();
  const before = await Rental.findById(id).lean();
  const rental = await Rental.findByIdAndUpdate(id, { ...data, updated_by: user.id }, { new: true }).lean();
  if (!rental) return null;
  await recordAudit({
    entity_type: "Rental",
    entity_id: id,
    action: "UPDATE",
    actor: user,
    changes: buildAuditChanges(before as Record<string, unknown> | null, rental as Record<string, unknown>),
  });
  revalidatePath("/rentals");
  return JSON.parse(JSON.stringify(rental));
}

export async function approveRental(id: string, approval_status: "Approved" | "Rejected" | "NeedsUpdate") {
  const user = await getCurrentUser();
  if (!user || !["admin", "leader"].includes(user.role)) throw new Error("Unauthorized");
  await connectDB();
  const before = await Rental.findById(id).lean();
  const rental = await Rental.findByIdAndUpdate(id, { approval_status, updated_by: user.id }, { new: true }).lean();
  if (!rental) return null;
  await recordAudit({
    entity_type: "Rental",
    entity_id: id,
    action: approval_status === "Approved" ? "APPROVE" : "REJECT",
    actor: user,
    changes: buildAuditChanges(before as Record<string, unknown> | null, rental as Record<string, unknown>),
  });
  revalidatePath("/rentals");
  return JSON.parse(JSON.stringify(rental));
}
