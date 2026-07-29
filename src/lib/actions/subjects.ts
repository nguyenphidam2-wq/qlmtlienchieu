"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Subject, ISubject, Business } from "@/lib/models";
import { getCurrentUser } from "@/lib/jwt";

// Các vai trò được phép tạo/sửa đối tượng
const ALLOWED_ROLES_FOR_CREATE_UPDATE = ["admin", "leader", "officer"];

// Chỉ admin được phép xóa
const ALLOWED_ROLES_FOR_DELETE = ["admin"];

// Chỉ admin và leader được phép duyệt (approve) đối tượng
const ALLOWED_ROLES_FOR_APPROVE = ["admin", "leader"];

/**
 * Lấy tất cả đối tượng với bộ lọc tùy chọn
 * Mặc định chỉ trả về đối tượng đã được duyệt (Approved) cho Dashboard/GIS
 */
export async function getSubjects(status?: string, startDate?: string, endDate?: string, includePending = false): Promise<ISubject[]> {
  await connectDB();
  const query: any = {};
  if (status) {
    const nfcStatus = status.normalize("NFC");
    query.status = { $regex: new RegExp("^" + nfcStatus.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "$", "i") };
  }



  // Nếu không yêu cầu includePending (mặc định), lấy đối tượng đã duyệt
  // HOẶC đối tượng chưa có trường approval_status (dữ liệu cũ từ import thủ công)
  if (!includePending) {
    query.$or = [
      { approval_status: "Approved" },
      { approval_status: { $exists: false } },
      { approval_status: null },
    ];
  }

  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.created_at.$lte = end;
    }
  }

  const conn = await connectDB();
  const db = conn.connection?.db || mongoose.connection?.db;
  if (!db) {
    const subjects = await Subject.find(query).sort({ created_at: -1 }).lean();
    return subjects.map(sanitizeSubject);
  }

  const rawSubjects = await db.collection("subjects").find(query).sort({ created_at: -1 }).toArray();
  const sanitized = rawSubjects.map(sanitizeSubject);
  console.log(`[getSubjects] count=${sanitized.length}, sample#1=${sanitized[0]?.full_name}, vh=${JSON.stringify(sanitized[0]?.violation_histories)}`);
  return sanitized;
}

function parseAndCalculateDates(rawDate: string, decisionStr: string, rawDuration: string, notesStr: string = "") {
  let date = (rawDate || "").trim();
  const decision = (decisionStr || "").trim();
  let duration = (rawDuration || "").trim();
  const notes = (notesStr || "").trim();

  // Tự động bóc tách ngày áp dụng / ngày QĐ từ quyết định hoặc ghi chú nếu chưa có ngày phát hiện
  if (!date && (decision || notes)) {
    const textToSearch = `${decision} ${notes}`;
    const dateMatch = textToSearch.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\b/);
    if (dateMatch) {
      const d = dateMatch[1].padStart(2, '0');
      const m = dateMatch[2].padStart(2, '0');
      const y = dateMatch[3];
      date = `${d}/${m}/${y}`;
    }
  }

  // Tự động tính mốc thời hạn 02 năm nếu có ngày bắt đầu mà chưa có thời hạn kết thúc
  if (!duration && date) {
    const parts = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (parts) {
      const d = parts[1].padStart(2, '0');
      const m = parts[2].padStart(2, '0');
      const startYear = parseInt(parts[3], 10);
      const endYear = startYear + 2;
      duration = `${d}/${m}/${startYear} - ${d}/${m}/${endYear} (02 năm)`;
    }
  } else if (duration && !duration.includes("02 năm") && duration.includes(" - ")) {
    duration = `${duration} (02 năm)`;
  }

  return { date, decision, duration };
}

function sanitizeSubject(s: any): any {
  if (!s) return null;

  let histories = Array.isArray(s.violation_histories) && s.violation_histories.length > 0
    ? s.violation_histories.map((vh: any) => {
        const parsed = parseAndCalculateDates(
          vh.date || s.date,
          vh.decision_num_date || s.decision_num_date,
          vh.duration || s.duration,
          s.notes
        );
        return {
          action: String(vh.action || s.status || "Quản lý / Xử lý"),
          date: parsed.date,
          decision_num_date: parsed.decision,
          duration: parsed.duration,
        };
      })
    : [];

  if (histories.length === 0 && (s.decision_num_date || s.duration || s.date || s.notes)) {
    const parsed = parseAndCalculateDates(s.date, s.decision_num_date, s.duration, s.notes);
    histories.push({
      action: String(s.status || "Quản lý / Xử lý"),
      date: parsed.date,
      decision_num_date: parsed.decision,
      duration: parsed.duration,
    });
  }

  const plain = JSON.parse(JSON.stringify(s));
  plain._id = s._id ? s._id.toString() : undefined;
  plain.violation_histories = histories;
  return plain;
}

// Get single subject by ID
export async function getSubject(id: string): Promise<ISubject | null> {
  const conn = await connectDB();
  const db = conn.connection?.db || mongoose.connection?.db;
  if (!db) {
    const subject: any = await Subject.findById(id).lean();
    return sanitizeSubject(subject);
  }
  const { ObjectId } = await import("mongodb");
  const subject: any = await db.collection("subjects").findOne({ _id: new ObjectId(id) });
  return sanitizeSubject(subject);
}

// Create new subject - chỉ admin, leader, officer được phép
export async function createSubject(data: Partial<ISubject>): Promise<{ success: boolean; data?: ISubject; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role)) {
    return { success: false, error: "Bạn không có quyền tạo đối tượng mới" };
  }

  await connectDB();

  // Officer tạo mới sẽ có trạng thái chờ duyệt (Pending)
  // Admin và leader tạo mới sẽ được duyệt luôn (Approved)
  const approvalStatus = currentUser.role === "officer" ? "Pending" : "Approved";

  const subject = await Subject.create({
    ...data,
    approval_status: approvalStatus,
    created_by: currentUser.id,
  });

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true, data: JSON.parse(JSON.stringify(subject)) };
}

// Update existing subject - chỉ admin, leader, officer được phép
export async function updateSubject(id: string, data: Partial<ISubject>): Promise<{ success: boolean; data?: ISubject | null; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_CREATE_UPDATE.includes(currentUser.role)) {
    return { success: false, error: "Bạn không có quyền chỉnh sửa đối tượng" };
  }

  await connectDB();

  // Nếu đang cập nhật approval_status, chỉ admin và leader được phép
  if (data.approval_status && !ALLOWED_ROLES_FOR_APPROVE.includes(currentUser.role)) {
    return { success: false, error: "Chỉ admin và leader mới có quyền duyệt đối tượng" };
  }

  const subject = await Subject.findByIdAndUpdate(
    id,
    {
      ...data,
      updated_by: currentUser.id,
    },
    { new: true }
  ).lean();

  if (!subject) {
    return { success: false, error: "Không tìm thấy đối tượng" };
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true, data: JSON.parse(JSON.stringify(subject)) };
}

// Delete subject - chỉ admin được phép
export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_DELETE.includes(currentUser.role)) {
    return { success: false, error: "Chỉ admin mới có quyền xóa đối tượng" };
  }

  await connectDB();
  const result = await Subject.findByIdAndDelete(id);

  if (!result) {
    return { success: false, error: "Không tìm thấy đối tượng để xóa" };
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true };
}

// Duyệt đối tượng - chỉ admin và leader được phép
export async function approveSubject(id: string): Promise<{ success: boolean; data?: ISubject | null; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_APPROVE.includes(currentUser.role)) {
    return { success: false, error: "Chỉ admin và leader mới có quyền duyệt đối tượng" };
  }

  await connectDB();

  const subject = await Subject.findByIdAndUpdate(
    id,
    {
      approval_status: "Approved",
      approved_by: currentUser.id,
      approved_at: new Date(),
    },
    { new: true }
  ).lean();

  if (!subject) {
    return { success: false, error: "Không tìm thấy đối tượng" };
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true, data: subject as ISubject };
}

// Duyệt nhiều đối tượng cùng lúc - chỉ admin và leader được phép
export async function bulkApproveSubjects(ids: string[]): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_APPROVE.includes(currentUser.role)) {
    return { success: false, error: "Không có quyền thực hiện" };
  }

  if (!ids || ids.length === 0) {
    return { success: false, error: "Không có đối tượng nào được chọn" };
  }

  await connectDB();

  await Subject.updateMany(
    { _id: { $in: ids } },
    {
      approval_status: "Approved",
      approved_by: currentUser.id,
      approved_at: new Date(),
    }
  );

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true };
}

// Xóa nhiều đối tượng cùng lúc - chỉ admin được phép
export async function bulkDeleteSubjects(ids: string[]): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Người dùng chưa đăng nhập" };
  }

  if (!ALLOWED_ROLES_FOR_DELETE.includes(currentUser.role)) {
    return { success: false, error: "Chỉ admin mới có quyền xóa đối tượng" };
  }

  if (!ids || ids.length === 0) {
    return { success: false, error: "Không có đối tượng nào được chọn" };
  }

  await connectDB();
  await Subject.deleteMany({ _id: { $in: ids } });

  revalidatePath("/subjects");
  revalidatePath("/");
  return { success: true };
}


// Lấy thông tin user hiện tại (dùng cho client)
export async function getCurrentUserInfo() {
  return await getCurrentUser();
}

// Get stats for dashboard - chỉ thống kê các đối tượng đã được duyệt
export async function getStats(startDate?: string, endDate?: string): Promise<{
  total_subjects: number;
  total_businesses: number;
  status_counts: Record<string, number>;
  tdp_stats: Record<string, number>;
  timeline_stats: Array<{ month: string; count: number }>;
}> {
  await connectDB();

  // Chỉ thống kê các đối tượng đã được duyệt
  const approvedFilter = { approval_status: "Approved" };

  const matchQuery: any = { ...approvedFilter };
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
  let timelineStats: any[];

  if (startDate || endDate) {
    const statusMatch = { status: { $exists: true, $ne: null }, ...approvedFilter } as any;
    statusMatch.created_at = matchQuery.created_at;

    total_subjects = await Subject.countDocuments(matchQuery);
    total_businesses = await Business.countDocuments();
    statusCounts = await Subject.aggregate([{ $match: statusMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
    // @ts-ignore
    const tdpQ: any = { tdp: { $exists: true, $ne: null, $ne: "" }, ...approvedFilter };
    tdpQ.created_at = matchQuery.created_at;
    tdpStats = await Subject.aggregate([{ $match: tdpQ }, { $group: { _id: "$tdp", count: { $sum: 1 } } }]);
    timelineStats = await Subject.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
  } else {
    const statusMatch: any = { status: { $exists: true, $ne: null }, ...approvedFilter };
    // @ts-ignore
    const tdpMatch: any = { tdp: { $exists: true, $ne: null, $ne: "" }, ...approvedFilter };

    total_subjects = await Subject.countDocuments(matchQuery);
    total_businesses = await Business.countDocuments();
    statusCounts = await Subject.aggregate([
      { $match: statusMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    tdpStats = await Subject.aggregate([
      { $match: tdpMatch },
      { $group: { _id: "$tdp", count: { $sum: 1 } } },
    ]);
    timelineStats = await Subject.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
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

  const timeline_stats = timelineStats.map((item: any) => ({
    month: item._id,
    count: item.count,
  }));

  return {
    total_subjects,
    total_businesses,
    status_counts,
    tdp_stats,
    timeline_stats,
  };
}