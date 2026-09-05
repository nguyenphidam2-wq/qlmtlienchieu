import mongoose, { Document, Schema } from "mongoose";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "VERIFY"
  | "IMPORT"
  | "DELETE";

export interface IAuditChange {
  field: string;
  before?: unknown;
  after?: unknown;
}

export interface IAuditLog extends Document {
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  actor_id: string;
  actor_name?: string;
  actor_role: string;
  changes: IAuditChange[];
  reason?: string;
  occurred_at: Date;
}

const AuditChangeSchema = new Schema<IAuditChange>(
  {
    field: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const AuditLogSchema = new Schema<IAuditLog>(
  {
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "SUBMIT", "APPROVE", "REJECT", "VERIFY", "IMPORT", "DELETE"],
      required: true,
      index: true,
    },
    actor_id: { type: String, required: true, index: true },
    actor_name: { type: String },
    actor_role: { type: String, required: true },
    changes: { type: [AuditChangeSchema], default: [] },
    reason: { type: String },
    occurred_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

AuditLogSchema.index({ entity_type: 1, entity_id: 1, occurred_at: -1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
