import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import {
  Subject,
  TDP,
  Rental,
  ConditionalBusiness,
  TestSchedule,
  AgentTask,
} from "@/lib/models";
import os from "os";

export async function POST(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const { message, sender = "Laptop AI Agent", session_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: "MISSING_MESSAGE", message: "'message' field is required." },
        { status: 400 }
      );
    }

    // 1. Gather live system & database context from Server PC
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptimeSec = Math.floor(os.uptime());
    const uptimeHours = (uptimeSec / 3600).toFixed(1);

    const [
      subjectTotal,
      subjectApproved,
      subjectPending,
      tdpCount,
      rentalCount,
      businessCount,
      scheduleCount,
      pendingTasksCount,
    ] = await Promise.all([
      Subject.countDocuments().catch(() => 0),
      Subject.countDocuments({ approval_status: "Approved" }).catch(() => 0),
      Subject.countDocuments({ approval_status: "Pending" }).catch(() => 0),
      TDP.countDocuments().catch(() => 0),
      Rental.countDocuments().catch(() => 0),
      ConditionalBusiness.countDocuments().catch(() => 0),
      TestSchedule.countDocuments().catch(() => 0),
      AgentTask.countDocuments({ status: "pending" }).catch(() => 0),
    ]);

    const serverContext = {
      hostname: os.hostname(),
      platform: `${os.platform()} (${os.arch()})`,
      uptime: `${uptimeHours} giờ`,
      ram_usage: `${((usedMem / totalMem) * 100).toFixed(1)}% (${(usedMem / 1024 ** 3).toFixed(1)}GB / ${(totalMem / 1024 ** 3).toFixed(1)}GB)`,
      db_stats: {
        subjects: `${subjectTotal} (Đã duyệt: ${subjectApproved}, Chờ duyệt: ${subjectPending})`,
        tdp: `${tdpCount} TDP`,
        rentals: `${rentalCount} nhà trọ`,
        conditional_businesses: `${businessCount} cơ sở có điều kiện`,
        schedules: `${scheduleCount} lịch xét nghiệm`,
        pending_tasks: pendingTasksCount,
      },
    };

    // 2. Generate intelligent, contextual response from Server PC Agent
    let agentReply = "";
    const lowerMsg = message.toLowerCase();

    if (
      lowerMsg.includes("chào") ||
      lowerMsg.includes("hello") ||
      lowerMsg.includes("hi") ||
      lowerMsg.includes("xin chào")
    ) {
      agentReply = `Xin chào ${sender}! Tôi là QLMT Server PC Agent đang trực tiếp vận hành hệ thống trên máy chủ ${os.hostname()}. Hiện tại hệ thống đang hoạt động ổn định (RAM: ${serverContext.ram_usage}, Uptime: ${serverContext.uptime}). Toàn bộ 6 module dữ liệu nghiệp vụ (Đối tượng, 27 TDP, Nhà trọ, Cơ sở có điều kiện, Lịch xét nghiệm) đã sẵn sàng phối hợp cùng bạn.`;
    } else if (
      lowerMsg.includes("tình trạng") ||
      lowerMsg.includes("tài nguyên") ||
      lowerMsg.includes("status") ||
      lowerMsg.includes("kiểm tra")
    ) {
      agentReply = `Báo cáo trạng thái từ Server PC: Hệ điều hành ${serverContext.platform}, RAM đang dùng ${serverContext.ram_usage}. Cơ sở dữ liệu MongoDB đang quản lý: ${serverContext.db_stats.subjects}; ${serverContext.db_stats.tdp}; ${serverContext.db_stats.rentals}; ${serverContext.db_stats.conditional_businesses}; ${serverContext.db_stats.schedules}. Hàng đợi công việc đang có ${pendingTasksCount} nhiệm vụ chờ xử lý.`;
    } else if (
      lowerMsg.includes("nhiệm vụ") ||
      lowerMsg.includes("task") ||
      lowerMsg.includes("hàng đợi")
    ) {
      agentReply = `Hiện tại trên máy chủ đang có ${pendingTasksCount} nhiệm vụ ở trạng thái 'pending'. Bạn có thể gửi thêm chỉ thị qua endpoint /api/agent/tasks hoặc tra cứu dữ liệu trực tiếp qua /api/agent/db.`;
    } else {
      agentReply = `Server PC Agent đã tiếp nhận thông điệp từ ${sender}: "${message}". Trạng thái máy chủ: Bình thường. Dữ liệu: ${subjectTotal} đối tượng, ${tdpCount} TDP. Sẵn sàng thực hiện các yêu cầu điều hành tiếp theo.`;
    }

    // 3. Log conversation to AgentTask for persistence
    const taskId = `chat_${Date.now()}`;
    await AgentTask.create({
      task_id: taskId,
      title: `Đối thoại trực tiếp từ ${sender}`,
      type: "chat",
      status: "completed",
      priority: "normal",
      created_by: sender,
      assigned_to: "server_agent",
      payload: { message, session_id: session_id || null },
      result: { reply: agentReply },
      logs: [
        {
          timestamp: new Date(),
          message: `Received message from ${sender}`,
          level: "info",
        },
        {
          timestamp: new Date(),
          message: `Replied: ${agentReply.substring(0, 100)}...`,
          level: "info",
        },
      ],
      completed_at: new Date(),
    }).catch((err) => console.error("Error logging chat task:", err));

    return NextResponse.json({
      status: "ok",
      sender: "QLMT Server PC Agent",
      recipient: sender,
      timestamp: new Date().toISOString(),
      reply: agentReply,
      server_context: serverContext,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
