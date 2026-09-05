import mongoose, { Document, Schema } from "mongoose";

export interface IInspectionRecord {
  inspected_at: Date | string;
  inspected_by?: string;
  result?: string;
  notes?: string;
}

export interface IRental extends Document {
  name: string;
  owner_name?: string;
  owner_phone?: string;
  owner_id_card?: string;
  address?: string;
  tdp?: string;
  lat?: number;
  lng?: number;
  total_rooms?: number;
  current_tenants?: number;
  foreign_tenants?: number;
  security_assessment?: "safe" | "complex" | "unknown";
  fire_safety_status?: "compliant" | "needs_review" | "unknown";
  inspection_history?: IInspectionRecord[];
  approval_status?: "Pending" | "Approved" | "Rejected" | "NeedsUpdate";
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

const InspectionSchema = new Schema<IInspectionRecord>(
  {
    inspected_at: { type: Date, required: true },
    inspected_by: { type: String },
    result: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const RentalSchema = new Schema<IRental>(
  {
    name: { type: String, required: true, index: true },
    owner_name: { type: String },
    owner_phone: { type: String },
    owner_id_card: { type: String },
    address: { type: String },
    tdp: { type: String, index: true },
    lat: { type: Number },
    lng: { type: Number },
    total_rooms: { type: Number, default: 0 },
    current_tenants: { type: Number, default: 0 },
    foreign_tenants: { type: Number, default: 0 },
    security_assessment: { type: String, enum: ["safe", "complex", "unknown"], default: "unknown", index: true },
    fire_safety_status: { type: String, enum: ["compliant", "needs_review", "unknown"], default: "unknown" },
    inspection_history: { type: [InspectionSchema], default: [] },
    approval_status: { type: String, enum: ["Pending", "Approved", "Rejected", "NeedsUpdate"], default: "Pending", index: true },
    created_by: { type: String },
    updated_by: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Rental = mongoose.models.Rental || mongoose.model<IRental>("Rental", RentalSchema);
