import mongoose, { Schema, Document } from "mongoose";

export type AgentTaskStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type AgentTaskPriority = "low" | "normal" | "high" | "urgent";

export interface IAgentTaskLog {
  timestamp: Date;
  message: string;
  level?: "info" | "warn" | "error";
}

export interface IAgentTask extends Document {
  task_id: string;
  title: string;
  type: string;
  action?: string;
  payload: Record<string, any>;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  created_by: string;
  assigned_to: string;
  result?: any;
  error?: string | null;
  logs: IAgentTaskLog[];
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const AgentTaskSchema = new Schema<IAgentTask>(
  {
    task_id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    type: { type: String, default: "general", index: true },
    action: { type: String },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    created_by: { type: String, default: "laptop_agent" },
    assigned_to: { type: String, default: "server_agent" },
    result: { type: Schema.Types.Mixed },
    error: { type: String, default: null },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        message: { type: String, required: true },
        level: { type: String, enum: ["info", "warn", "error"], default: "info" },
      },
    ],
    completed_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const AgentTask =
  mongoose.models.AgentTask || mongoose.model<IAgentTask>("AgentTask", AgentTaskSchema);
