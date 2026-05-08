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
  if (status) query.status = status;

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

  const subjects = await Subject.find(query).sort({ created_at: -1 }).lean();
  return JSON.parse(JSON.stringify(subjects));
}

// Get single subject by ID
export async function getSubject(id: string): Promise<ISubject | null> {
  await connectDB();
  const subject = await Subject.findById(id).lean();
  return JSON.parse(JSON.stringify(subject));
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