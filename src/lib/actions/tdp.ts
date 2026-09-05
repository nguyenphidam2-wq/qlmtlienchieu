"use server";

import { connectDB } from "@/lib/mongodb";
import { TDP, ITDP } from "@/lib/models/TDP";
import { getCurrentUser } from "@/lib/jwt";
import type { ImportResult } from "@/features/types";
import { buildAuditChanges, recordAudit } from "@/lib/audit";

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !["admin", "leader", "officer"].includes(user.role)) throw new Error("Unauthorized");
}

export async function getTDPs() {
  try {
    await connectDB();
    const records = await TDP.find({}).sort({ created_at: -1 }).lean();
    return JSON.parse(JSON.stringify(records));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách TDP:", error);
    return [];
  }
}

export async function getTDPById(id: string) {
  try {
    await connectDB();
    const record = await TDP.findById(id).lean();
    return JSON.parse(JSON.stringify(record));
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết TDP:", error);
    return null;
  }
}

export async function createTDP(data: Partial<ITDP>) {
  try {
    await requireEditor();
    await connectDB();
    // Default empty geojson if not provided
    if (!data.geojson) {
      data.geojson = { type: "FeatureCollection", features: [] };
    }
    const currentUser = await getCurrentUser();
    const newRecord = await TDP.create({
      ...data,
      approval_status: currentUser?.role === "officer" ? "Pending" : "Approved",
      created_by: currentUser?.id,
    });
    await recordAudit({
      entity_type: "TDP",
      entity_id: newRecord._id.toString(),
      action: "CREATE",
      actor: currentUser!,
      changes: buildAuditChanges(null, newRecord.toObject()),
    });
    return JSON.parse(JSON.stringify(newRecord));
  } catch (error) {
    console.error("Lỗi khi tạo mới TDP:", error);
    throw new Error("Không thể tạo mới TDP");
  }
}

export async function updateTDP(id: string, data: Partial<ITDP>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["admin", "leader", "officer"].includes(currentUser.role)) throw new Error("Unauthorized");
    await connectDB();
    const before = await TDP.findById(id).lean();
    const protectedFields = ["risk_status", "color"];
    const updateData = { ...data, updated_by: currentUser.id } as Partial<ITDP>;
    if (currentUser.role === "officer") {
      for (const field of protectedFields) delete (updateData as Record<string, unknown>)[field];
    }
    const updated = await TDP.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) throw new Error("TDP not found");
    await recordAudit({
      entity_type: "TDP",
      entity_id: id,
      action: data.risk_status && ["admin", "leader"].includes(currentUser.role) ? "VERIFY" : "UPDATE",
      actor: currentUser,
      changes: buildAuditChanges(before as Record<string, unknown> | null, updated as Record<string, unknown>),
    });
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    console.error("Lỗi khi cập nhật TDP:", error);
    throw new Error("Không thể cập nhật TDP");
  }
}

export async function deleteTDP(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") throw new Error("Unauthorized");
    await connectDB();
    const deleted = await TDP.findByIdAndDelete(id);
    if (deleted) {
      await recordAudit({
        entity_type: "TDP",
        entity_id: id,
        action: "DELETE",
        actor: user,
        changes: buildAuditChanges(deleted.toObject(), {}),
      });
    }
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa TDP:", error);
    throw new Error("Không thể xóa TDP");
  }
}

export async function importTDPData(data: any[]): Promise<ImportResult> {
  try {
    await requireEditor();
    const conn = await connectDB();
    const { tdpModule } = await import("@/features/tdp/tdp.module");
    const result = await tdpModule.importData(conn.connection.db!.collection("tdps"), data);
    if (typeof result === "number") throw new Error("Invalid TDP import result");
    const user = await getCurrentUser();
    if (user) {
      await recordAudit({
        entity_type: "TDP",
        entity_id: "bulk-import",
        action: "IMPORT",
        actor: user,
        reason: `Imported ${data.length} TDP records`,
      });
    }
    return result;
  } catch (error: any) {
    console.error("Lỗi khi import TDP:", error);
    return {
      success: false,
      message: `Lỗi hệ thống: ${error.message}`,
      inserted: 0,
      updated: 0,
      errors: data.length,
      errorDetails: [error.message]
    };
  }
}
