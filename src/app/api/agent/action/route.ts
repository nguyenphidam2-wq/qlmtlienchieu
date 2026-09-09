import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import {
  Subject,
  TDP,
  Rental,
  ConditionalBusiness,
  TestSchedule,
  AuditLog,
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
    const { action, params = {} } = body;

    if (!action) {
      return NextResponse.json(
        {
          error: "MISSING_ACTION",
          message: "'action' field is required. Allowed: health_check, fetch_logs, sync_status, data_integrity_check",
        },
        { status: 400 }
      );
    }

    switch (action) {
      case "health_check": {
        const mem = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        return NextResponse.json({
          status: "ok",
          action: "health_check",
          timestamp: new Date().toISOString(),
          checks: {
            database: "connected",
            system: {
              hostname: os.hostname(),
              uptime_seconds: Math.floor(os.uptime()),
              app_uptime_seconds: Math.floor(process.uptime()),
              memory_used_percent: Number((((totalMem - freeMem) / totalMem) * 100).toFixed(1)),
              heap_used_mb: Math.round(mem.heapUsed / (1024 * 1024)),
              rss_mb: Math.round(mem.rss / (1024 * 1024)),
            },
          },
        });
      }

      case "fetch_logs": {
        const limit = Math.min(parseInt(params.limit || "50", 10), 200);
        const logType = params.type || "audit"; // 'audit' | 'agent_tasks'

        if (logType === "agent_tasks") {
          const tasks = await AgentTask.find()
            .sort({ updated_at: -1 })
            .limit(limit)
            .select("task_id title status priority logs created_at updated_at")
            .lean();
          return NextResponse.json({
            status: "ok",
            action: "fetch_logs",
            type: "agent_tasks",
            count: tasks.length,
            logs: tasks,
          });
        }

        const auditLogs = await AuditLog.find()
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean();

        return NextResponse.json({
          status: "ok",
          action: "fetch_logs",
          type: "audit",
          count: auditLogs.length,
          logs: auditLogs,
        });
      }

      case "sync_status": {
        const [
          subjectCount,
          tdpCount,
          rentalCount,
          businessCount,
          scheduleCount,
          lastAudit,
          recentTasks,
        ] = await Promise.all([
          Subject.countDocuments(),
          TDP.countDocuments(),
          Rental.countDocuments(),
          ConditionalBusiness.countDocuments(),
          TestSchedule.countDocuments(),
          AuditLog.findOne().sort({ timestamp: -1 }).lean(),
          AgentTask.find().sort({ created_at: -1 }).limit(5).lean(),
        ]);

        return NextResponse.json({
          status: "ok",
          action: "sync_status",
          timestamp: new Date().toISOString(),
          counts: {
            subjects: subjectCount,
            tdp: tdpCount,
            rentals: rentalCount,
            conditional_businesses: businessCount,
            schedules: scheduleCount,
          },
          last_activity: lastAudit ? (lastAudit as any).timestamp : null,
          recent_tasks: recentTasks,
        });
      }

      case "data_integrity_check": {
        // Find anomalies: subjects without coordinates or invalid status
        const [
          subjectsMissingCoords,
          subjectsMissingTDP,
          rentalsMissingCoords,
          businessesMissingCoords,
        ] = await Promise.all([
          Subject.countDocuments({
            $or: [
              { "location.coordinates": { $exists: false } },
              { "location.coordinates": { $size: 0 } },
              { "location.coordinates.0": 0, "location.coordinates.1": 0 },
            ],
          }),
          Subject.countDocuments({
            $or: [{ tdp_id: { $exists: false } }, { tdp_id: null }, { tdp_id: "" }],
          }),
          Rental.countDocuments({
            $or: [
              { "location.coordinates": { $exists: false } },
              { "location.coordinates": { $size: 0 } },
            ],
          }),
          ConditionalBusiness.countDocuments({
            $or: [
              { "location.coordinates": { $exists: false } },
              { "location.coordinates": { $size: 0 } },
            ],
          }),
        ]);

        return NextResponse.json({
          status: "ok",
          action: "data_integrity_check",
          timestamp: new Date().toISOString(),
          anomalies: {
            subjects_missing_coordinates: subjectsMissingCoords,
            subjects_missing_tdp: subjectsMissingTDP,
            rentals_missing_coordinates: rentalsMissingCoords,
            businesses_missing_coordinates: businessesMissingCoords,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            error: "UNKNOWN_ACTION",
            message: `Action '${action}' is not recognized. Allowed: health_check, fetch_logs, sync_status, data_integrity_check`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
