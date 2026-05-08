"use server";

import { connectDB } from "@/lib/mongodb";
import { TDP, ITDP } from "@/lib/models/TDP";

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
    await connectDB();
    // Default empty geojson if not provided
    if (!data.geojson) {
      data.geojson = { type: "FeatureCollection", features: [] };
    }
    const newRecord = await TDP.create(data);
    return JSON.parse(JSON.stringify(newRecord));
  } catch (error) {
    console.error("Lỗi khi tạo mới TDP:", error);
    throw new Error("Không thể tạo mới TDP");
  }
}

export async function updateTDP(id: string, data: Partial<ITDP>) {
  try {
    await connectDB();
    const updated = await TDP.findByIdAndUpdate(id, data, { new: true }).lean();
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    console.error("Lỗi khi cập nhật TDP:", error);
    throw new Error("Không thể cập nhật TDP");
  }
}

export async function deleteTDP(id: string) {
  try {
    await connectDB();
    await TDP.findByIdAndDelete(id);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa TDP:", error);
    throw new Error("Không thể xóa TDP");
  }
}

export async function importTDPData(data: any[]) {
  try {
    const { tdpModule } = await import("@/features/tdp/tdp.module");
    return await tdpModule.importData(data);
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
