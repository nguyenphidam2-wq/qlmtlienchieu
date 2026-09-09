import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import { AgentTask } from "@/lib/models";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("task_id");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    if (taskId) {
      const task = await AgentTask.findOne({ task_id: taskId }).lean();
      if (!task) {
        return NextResponse.json({ error: "TASK_NOT_FOUND", message: `Task ${taskId} not found.` }, { status: 404 });
      }
      return NextResponse.json({ status: "ok", task });
    }

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const tasks = await AgentTask.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: "ok",
      count: tasks.length,
      tasks,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const { action, task_id, title, type, payload, status, result, error, log_message, priority, created_by, assigned_to } = body;

    // Action 1: Claim next pending task
    if (action === "claim") {
      const agentName = assigned_to || "server_agent";
      const claimedTask = await AgentTask.findOneAndUpdate(
        { status: "pending" },
        {
          $set: {
            status: "in_progress",
            assigned_to: agentName,
            updated_at: new Date(),
          },
          $push: {
            logs: {
              timestamp: new Date(),
              message: `Task claimed by ${agentName}`,
              level: "info",
            },
          },
        },
        { sort: { priority: -1, created_at: 1 }, new: true }
      );

      if (!claimedTask) {
        return NextResponse.json({ status: "ok", message: "No pending tasks available", task: null });
      }
      return NextResponse.json({ status: "ok", message: "Task claimed successfully", task: claimedTask });
    }

    // Action 2: Update existing task
    if (action === "update" || (task_id && (status || result !== undefined || error !== undefined || log_message))) {
      if (!task_id) {
        return NextResponse.json({ error: "MISSING_TASK_ID", message: "task_id is required for update" }, { status: 400 });
      }

      const updateFields: Record<string, any> = { updated_at: new Date() };
      if (status) {
        updateFields.status = status;
        if (status === "completed" || status === "failed" || status === "cancelled") {
          updateFields.completed_at = new Date();
        }
      }
      if (result !== undefined) updateFields.result = result;
      if (error !== undefined) updateFields.error = error;

      const pushFields: Record<string, any> = {};
      if (log_message) {
        pushFields.logs = {
          timestamp: new Date(),
          message: log_message,
          level: error ? "error" : "info",
        };
      }

      const updateQuery: Record<string, any> = { $set: updateFields };
      if (Object.keys(pushFields).length > 0) {
        updateQuery.$push = pushFields;
      }

      const updatedTask = await AgentTask.findOneAndUpdate(
        { task_id },
        updateQuery,
        { new: true }
      );

      if (!updatedTask) {
        return NextResponse.json({ error: "TASK_NOT_FOUND", message: `Task ${task_id} not found.` }, { status: 404 });
      }

      return NextResponse.json({ status: "ok", message: "Task updated successfully", task: updatedTask });
    }

    // Action 3: Create new task (Default)
    if (!title) {
      return NextResponse.json({ error: "MISSING_TITLE", message: "title is required to create a task" }, { status: 400 });
    }

    const generatedId = task_id || `task_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const newTask = await AgentTask.create({
      task_id: generatedId,
      title,
      type: type || "general",
      action: body.sub_action || null,
      payload: payload || {},
      status: status || "pending",
      priority: priority || "normal",
      created_by: created_by || "laptop_agent",
      assigned_to: assigned_to || "server_agent",
      result: result || null,
      error: error || null,
      logs: [
        {
          timestamp: new Date(),
          message: log_message || `Task created by ${created_by || "laptop_agent"}`,
          level: "info",
        },
      ],
    });

    return NextResponse.json({
      status: "ok",
      message: "Task created successfully",
      task: newTask,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
