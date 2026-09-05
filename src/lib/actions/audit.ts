"use server";

import connectDB from "@/lib/mongodb";
import { AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/jwt";

export async function getAuditLogs(options: {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
} = {}) {
  const user = await getCurrentUser();
  if (!user || user.role === "guest") return [];

  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.entityType) query.entity_type = options.entityType;
  if (options.entityId) query.entity_id = options.entityId;
  if (options.action) query.action = options.action;

  if (user.role === "officer") {
    query.actor_id = user.id;
  } else if (options.actorId) {
    query.actor_id = options.actorId;
  }

  const limit = Math.min(Math.max(options.limit || 100, 1), 500);
  const logs = await AuditLog.find(query).sort({ occurred_at: -1 }).limit(limit).lean();
  return JSON.parse(JSON.stringify(logs));
}
