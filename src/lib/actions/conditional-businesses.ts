"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { ConditionalBusiness, type IConditionalBusiness } from "@/lib/models";
import { getCurrentUser } from "@/lib/jwt";
import { buildAuditChanges, recordAudit } from "@/lib/audit";

const EDITOR_ROLES = ["admin", "leader", "officer"];

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !EDITOR_ROLES.includes(user.role)) throw new Error("Unauthorized");
  return user;
}

export async function getConditionalBusinesses(tdp?: string) {
  await connectDB();
  const query = tdp ? { tdp } : {};
  const rows = await ConditionalBusiness.find(query).sort({ updated_at: -1 }).lean();
  return JSON.parse(JSON.stringify(rows));
}

export async function createConditionalBusiness(data: Partial<IConditionalBusiness>) {
  const user = await requireEditor();
  await connectDB();
  const business = await ConditionalBusiness.create({
    ...data,
    approval_status: user.role === "officer" ? "Pending" : "Approved",
    created_by: user.id,
  });
  await recordAudit({
    entity_type: "ConditionalBusiness",
    entity_id: business._id.toString(),
    action: "CREATE",
    actor: user,
    changes: buildAuditChanges(null, business.toObject()),
  });
  revalidatePath("/conditional-businesses");
  return JSON.parse(JSON.stringify(business));
}

export async function updateConditionalBusiness(id: string, data: Partial<IConditionalBusiness>) {
  const user = await requireEditor();
  await connectDB();
  const before = await ConditionalBusiness.findById(id).lean();
  const business = await ConditionalBusiness.findByIdAndUpdate(id, { ...data, updated_by: user.id }, { new: true }).lean();
  if (!business) return null;
  await recordAudit({
    entity_type: "ConditionalBusiness",
    entity_id: id,
    action: "UPDATE",
    actor: user,
    changes: buildAuditChanges(before as Record<string, unknown> | null, business as Record<string, unknown>),
  });
  revalidatePath("/conditional-businesses");
  return JSON.parse(JSON.stringify(business));
}

export async function approveConditionalBusiness(id: string, approval_status: "Approved" | "Rejected" | "NeedsUpdate") {
  const user = await getCurrentUser();
  if (!user || !["admin", "leader"].includes(user.role)) throw new Error("Unauthorized");
  await connectDB();
  const before = await ConditionalBusiness.findById(id).lean();
  const business = await ConditionalBusiness.findByIdAndUpdate(id, { approval_status, updated_by: user.id }, { new: true }).lean();
  if (!business) return null;
  await recordAudit({
    entity_type: "ConditionalBusiness",
    entity_id: id,
    action: approval_status === "Approved" ? "APPROVE" : "REJECT",
    actor: user,
    changes: buildAuditChanges(before as Record<string, unknown> | null, business as Record<string, unknown>),
  });
  revalidatePath("/conditional-businesses");
  return JSON.parse(JSON.stringify(business));
}
