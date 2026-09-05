import type { ClientSession } from "mongoose";
import { AuditLog, type AuditAction, type IAuditChange } from "@/lib/models/AuditLog";

const REDACTED_FIELDS = new Set([
  "password_hash",
  "id_card",
  "owner_id_card",
  "phone",
  "owner_phone",
  "face_image_url",
  "house_image_url",
  "subject_images",
  "attached_files",
]);

function plainValue(value: unknown): unknown {
  if (value && typeof value === "object" && "toObject" in value && typeof (value as { toObject?: unknown }).toObject === "function") {
    return (value as { toObject: () => unknown }).toObject();
  }
  return value;
}

function safeValue(field: string, value: unknown): unknown {
  return REDACTED_FIELDS.has(field) ? "[REDACTED]" : plainValue(value);
}

function equalValue(before: unknown, after: unknown): boolean {
  return JSON.stringify(plainValue(before)) === JSON.stringify(plainValue(after));
}

export function buildAuditChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
  fields?: string[]
): IAuditChange[] {
  const source = new Set(fields || [...Object.keys(before || {}), ...Object.keys(after)]);
  const ignored = new Set(["_id", "__v", "created_at", "updated_at"]);
  const changes: IAuditChange[] = [];

  for (const field of source) {
    if (ignored.has(field)) continue;
    const oldValue = before?.[field];
    const newValue = after[field];
    if (!equalValue(oldValue, newValue)) {
      changes.push({
        field,
        before: safeValue(field, oldValue),
        after: safeValue(field, newValue),
      });
    }
  }

  return changes;
}

export async function recordAudit(input: {
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  actor: { id: string; username?: string; role: string };
  changes?: IAuditChange[];
  reason?: string;
  session?: ClientSession;
}) {
  const [entry] = await AuditLog.create(
    [
      {
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        actor_id: input.actor.id,
        actor_name: input.actor.username,
        actor_role: input.actor.role,
        changes: input.changes || [],
        reason: input.reason,
        occurred_at: new Date(),
      },
    ],
    input.session ? { session: input.session } : undefined
  );
  return entry;
}
