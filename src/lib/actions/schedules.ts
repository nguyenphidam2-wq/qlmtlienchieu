"use server";

import connectDB from "@/lib/mongodb";
import { TestSchedule, Subject, ITestSchedule } from "@/lib/models";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

function sanitizeSchedule(s: any): any {
  if (!s) return null;
  const plain = JSON.parse(JSON.stringify(s));
  plain._id = s._id ? s._id.toString() : undefined;
  if (Array.isArray(plain.participants)) {
    plain.participants = plain.participants.map((p: any) => ({
      ...p,
      _id: p._id ? p._id.toString() : undefined,
      subject_id: p.subject_id ? p.subject_id.toString() : undefined,
    }));
  }
  return plain;
}

// Lấy danh sách đợt kiểm tra
export async function getTestSchedules(statusFilter?: string): Promise<any[]> {
  const conn = await connectDB();
  const db = conn.connection?.db || mongoose.connection?.db;

  const query: any = {};
  if (statusFilter && statusFilter !== "All") {
    query.status = statusFilter;
  }

  if (db) {
    const rawSchedules = await db.collection("test_schedules").find(query).sort({ scheduled_date: -1 }).toArray();
    return rawSchedules.map(sanitizeSchedule);
  }

  const schedules = await TestSchedule.find(query).sort({ scheduled_date: -1 }).lean();
  return schedules.map(sanitizeSchedule);
}

// Lấy chi tiết 1 đợt kiểm tra kèm thông tin đối tượng
export async function getTestSchedule(id: string): Promise<any | null> {
  const conn = await connectDB();
  const db = conn.connection?.db || mongoose.connection?.db;

  if (db) {
    const { ObjectId } = await import("mongodb");
    const schedule: any = await db.collection("test_schedules").findOne({ _id: new ObjectId(id) });
    if (!schedule) return null;

    // Populating subject details for each participant
    if (Array.isArray(schedule.participants) && schedule.participants.length > 0) {
      const subjectIds = schedule.participants.map((p: any) => p.subject_id).filter(Boolean);
      const subjects = await db.collection("subjects").find({ _id: { $in: subjectIds } }).toArray();
      const subjectMap = new Map(subjects.map((s: any) => [s._id.toString(), s]));

      schedule.participants = schedule.participants.map((p: any) => {
        const sub = subjectMap.get(p.subject_id?.toString());
        return {
          ...p,
          full_name: sub?.full_name || p.full_name || "Đối tượng",
          status_at_test: sub?.status || p.status_at_test || "",
          tdp: sub?.tdp || p.tdp || "",
          face_image_url: sub?.face_image_url || "",
          id_card: sub?.id_card || "",
        };
      });
    }

    return sanitizeSchedule(schedule);
  }

  const schedule: any = await TestSchedule.findById(id).populate("participants.subject_id").lean();
  return sanitizeSchedule(schedule);
}

// Tạo đợt kiểm tra mới
export async function createTestSchedule(data: {
  title: string;
  type: "Periodic" | "Adhoc" | "CallIn";
  test_type: "UrinaryTest" | "RollCall" | "Interview";
  test_location: string;
  scheduled_date: string;
  assigned_officers?: string[];
  subject_ids: string[];
  notes?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const conn = await connectDB();
    const db = conn.connection?.db || mongoose.connection?.db;

    const { ObjectId } = await import("mongodb");

    // Lấy thông tin chi tiết của các đối tượng được chọn
    let subjects: any[] = [];
    const objectIds = data.subject_ids.map((id) => new ObjectId(id));
    if (db) {
      subjects = await db.collection("subjects").find({ _id: { $in: objectIds } }).toArray();
    } else {
      subjects = await Subject.find({ _id: { $in: objectIds } }).lean();
    }

    const participants = subjects.map((s: any) => ({
      subject_id: s._id,
      full_name: s.full_name,
      status_at_test: s.status || "Sử dụng",
      tdp: s.tdp || "",
      result: "Pending",
      substances_detected: [],
    }));

    const newSchedule = {
      title: data.title,
      type: data.type || "Periodic",
      test_type: data.test_type || "UrinaryTest",
      test_location: data.test_location || "Trụ sở Công an phường Liên Chiểu",
      scheduled_date: new Date(data.scheduled_date),
      assigned_officers: data.assigned_officers || [],
      participants: participants,
      status: "Upcoming",
      notes: data.notes || "",
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (db) {
      const res = await db.collection("test_schedules").insertOne(newSchedule);
      revalidatePath("/schedules");
      return { success: true, data: { _id: res.insertedId.toString(), ...newSchedule } };
    }

    const schedule = await TestSchedule.create(newSchedule);
    revalidatePath("/schedules");
    return { success: true, data: sanitizeSchedule(schedule) };
  } catch (err: any) {
    console.error("❌ Lỗi khi tạo đợt kiểm tra:", err);
    return { success: false, error: err.message || "Không thể tạo đợt kiểm tra" };
  }
}

// Nhập kết quả kiểm tra cho từng đối tượng
export async function updateParticipantResult(data: {
  schedule_id: string;
  subject_id: string;
  result: "Pending" | "Negative" | "Positive" | "Absent_Excused" | "Absent_Unexcused" | "Refused";
  substances_detected?: string[];
  notes?: string;
  tested_by?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const conn = await connectDB();
    const db = conn.connection?.db || mongoose.connection?.db;
    const { ObjectId } = await import("mongodb");

    const scheduleId = new ObjectId(data.schedule_id);
    const subjectId = new ObjectId(data.subject_id);
    const now = new Date();

    const resultTextMap: Record<string, string> = {
      Negative: "🟢 Âm tính (Chấp hành tốt)",
      Positive: `🔴 DƯƠNG TÍNH (${(data.substances_detected || []).join(", ") || "Chưa xác định"})`,
      Absent_Excused: "🟡 Vắng mặt có lý do",
      Absent_Unexcused: "⚠️ Vắng mặt KHÔNG lý do (Cảnh báo trốn)",
      Refused: "🛑 Từ chối thử test / Chống đối",
    };

    if (db) {
      // Update participant inside test_schedules
      await db.collection("test_schedules").updateOne(
        { _id: scheduleId, "participants.subject_id": subjectId },
        {
          $set: {
            "participants.$.result": data.result,
            "participants.$.substances_detected": data.substances_detected || [],
            "participants.$.notes": data.notes || "",
            "participants.$.tested_at": now,
            "participants.$.tested_by": data.tested_by || "Cảnh sát khu vực",
            updated_at: now,
          },
        }
      );

      // Tự động đẩy lịch sử đợt kiểm tra vào Subjects violation_histories
      const historyItem = {
        action: `Kiểm tra ma túy: ${resultTextMap[data.result] || data.result}`,
        date: `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`,
        decision_num_date: `Đợt kiểm tra test ma túy ngày ${now.toLocaleDateString("vi-VN")}`,
        duration: data.notes || "Kiểm tra định kỳ/đột xuất",
      };

      const subjectUpdate: any = {
        $push: { violation_histories: historyItem },
        $set: { updated_at: now },
      };

      // Nếu Dương tính -> Đổi cảnh báo/ghi chú
      if (data.result === "Positive") {
        subjectUpdate.$set.notes = `🔴 CẢNH BÁO DƯƠNG TÍNH THỬ TEST NGÀY ${now.toLocaleDateString("vi-VN")} (${(data.substances_detected || []).join(", ")})`;
      } else if (data.result === "Absent_Unexcused") {
        subjectUpdate.$set.notes = `⚠️ CẢNH BÁO VẮNG MẶT KHÔNG LÝ DO NGÀY ${now.toLocaleDateString("vi-VN")}`;
      }

      await db.collection("subjects").updateOne({ _id: subjectId }, subjectUpdate);

      // Kiểm tra xem tất cả participant trong đợt đã có kết quả chưa -> Đổi status đợt thành Completed
      const updatedSchedule: any = await db.collection("test_schedules").findOne({ _id: scheduleId });
      if (updatedSchedule && Array.isArray(updatedSchedule.participants)) {
        const hasPending = updatedSchedule.participants.some((p: any) => p.result === "Pending");
        if (!hasPending) {
          await db.collection("test_schedules").updateOne({ _id: scheduleId }, { $set: { status: "Completed" } });
        } else {
          await db.collection("test_schedules").updateOne({ _id: scheduleId }, { $set: { status: "In_Progress" } });
        }
      }
    }

    revalidatePath("/schedules");
    revalidatePath("/subjects");
    return { success: true };
  } catch (err: any) {
    console.error("❌ Lỗi khi cập nhật kết quả test:", err);
    return { success: false, error: err.message || "Không thể cập nhật kết quả" };
  }
}
