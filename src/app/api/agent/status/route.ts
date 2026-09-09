import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import os from "os";
import {
  Subject,
  TDP,
  Rental,
  ConditionalBusiness,
  TestSchedule,
  CustomZone,
  User,
  AuditLog,
  AgentTask,
} from "@/lib/models";

export async function GET(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    await connectToDatabase();

    // Query entity counts in parallel
    const [
      subjectTotal,
      subjectApproved,
      subjectPending,
      subjectNeedsUpdate,
      tdpCount,
      rentalCount,
      businessCount,
      scheduleCount,
      customZoneCount,
      userCount,
      auditLogCount,
      taskTotal,
      taskPending,
    ] = await Promise.all([
      Subject.countDocuments().catch(() => 0),
      Subject.countDocuments({ approval_status: "Approved" }).catch(() => 0),
      Subject.countDocuments({ approval_status: "Pending" }).catch(() => 0),
      Subject.countDocuments({ approval_status: "NeedsUpdate" }).catch(() => 0),
      TDP.countDocuments().catch(() => 0),
      Rental.countDocuments().catch(() => 0),
      ConditionalBusiness.countDocuments().catch(() => 0),
      TestSchedule.countDocuments().catch(() => 0),
      CustomZone.countDocuments().catch(() => 0),
      User.countDocuments().catch(() => 0),
      AuditLog.countDocuments().catch(() => 0),
      AgentTask.countDocuments().catch(() => 0),
      AgentTask.countDocuments({ status: "pending" }).catch(() => 0),
    ]);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      host: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime_seconds: Math.floor(os.uptime()),
        cpus: os.cpus().length,
        memory: {
          total_gb: Number((totalMem / (1024 ** 3)).toFixed(2)),
          used_gb: Number((usedMem / (1024 ** 3)).toFixed(2)),
          free_gb: Number((freeMem / (1024 ** 3)).toFixed(2)),
          used_percent: Number(((usedMem / totalMem) * 100).toFixed(1)),
        },
      },
      process: {
        uptime_seconds: Math.floor(process.uptime()),
        memory_mb: {
          rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heap_used: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        },
      },
      database: {
        subjects: {
          total: subjectTotal,
          approved: subjectApproved,
          pending: subjectPending,
          needs_update: subjectNeedsUpdate,
        },
        tdp: tdpCount,
        rentals: rentalCount,
        conditional_businesses: businessCount,
        schedules: scheduleCount,
        custom_zones: customZoneCount,
        users: userCount,
        audit_logs: auditLogCount,
        agent_tasks: {
          total: taskTotal,
          pending: taskPending,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
