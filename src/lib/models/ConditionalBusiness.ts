import mongoose, { Document, Schema } from "mongoose";

export type ConditionalBusinessType =
  | "hotel"
  | "karaoke"
  | "massage"
  | "pawn_shop"
  | "bar_pub"
  | "game_internet"
  | "loan_service"
  | "other_sensitive_service";

export interface IBusinessInspection {
  inspected_at: Date | string;
  inspected_by?: string;
  result?: string;
  violation?: string;
  notes?: string;
}

export interface IConditionalBusiness extends Document {
  business_name: string;
  business_type: ConditionalBusinessType;
  address?: string;
  tdp?: string;
  lat?: number;
  lng?: number;
  tax_code?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_id_card?: string;
  security_license_no?: string;
  security_license_issued_at?: Date | string;
  security_license_issuer?: string;
  employees_count?: number;
  vietnamese_employees?: number;
  foreign_employees?: number;
  fire_safety_status?: "compliant" | "needs_review" | "unknown";
  risk_level?: "green" | "yellow" | "red";
  inspection_history?: IBusinessInspection[];
  approval_status?: "Pending" | "Approved" | "Rejected" | "NeedsUpdate";
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

const BusinessInspectionSchema = new Schema<IBusinessInspection>(
  {
    inspected_at: { type: Date, required: true },
    inspected_by: { type: String },
    result: { type: String },
    violation: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const ConditionalBusinessSchema = new Schema<IConditionalBusiness>(
  {
    business_name: { type: String, required: true, index: true },
    business_type: {
      type: String,
      enum: ["hotel", "karaoke", "massage", "pawn_shop", "bar_pub", "game_internet", "loan_service", "other_sensitive_service"],
      required: true,
      index: true,
    },
    address: { type: String },
    tdp: { type: String, index: true },
    lat: { type: Number },
    lng: { type: Number },
    tax_code: { type: String },
    owner_name: { type: String },
    owner_phone: { type: String },
    owner_id_card: { type: String },
    security_license_no: { type: String },
    security_license_issued_at: { type: String },
    security_license_issuer: { type: String },
    employees_count: { type: Number, default: 0 },
    vietnamese_employees: { type: Number, default: 0 },
    foreign_employees: { type: Number, default: 0 },
    fire_safety_status: { type: String, enum: ["compliant", "needs_review", "unknown"], default: "unknown" },
    risk_level: { type: String, enum: ["green", "yellow", "red"], default: "green", index: true },
    inspection_history: { type: [BusinessInspectionSchema], default: [] },
    approval_status: { type: String, enum: ["Pending", "Approved", "Rejected", "NeedsUpdate"], default: "Pending", index: true },
    created_by: { type: String },
    updated_by: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const ConditionalBusiness =
  mongoose.models.ConditionalBusiness || mongoose.model<IConditionalBusiness>("ConditionalBusiness", ConditionalBusinessSchema);
