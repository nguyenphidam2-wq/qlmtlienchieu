import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  const startMs = Date.now();
  let dbStatus = "disconnected";
  let dbLatencyMs = -1;

  try {
    await connectToDatabase();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "connecting";
    dbLatencyMs = Date.now() - startMs;
  } catch (err: any) {
    dbStatus = "error: " + err.message;
  }

  const mem = process.memoryUsage();

  return NextResponse.json({
    status: "ok",
    server_time: new Date().toISOString(),
    service: "qlmt-agent-bridge",
    version: "0.1.0",
    node_version: process.version,
    uptime_seconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latency_ms: dbLatencyMs,
    },
    memory_mb: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heap_used: Math.round(mem.heapUsed / (1024 * 1024)),
      heap_total: Math.round(mem.heapTotal / (1024 * 1024)),
    },
  });
}
