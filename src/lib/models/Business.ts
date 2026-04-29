import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  business_type: string;
  address: string;
  address_detail?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_id_card?: string;
  license_number?: string;
  operation_hours?: string;
  num_staff?: number;
  risk_level: string;
  inspection_count: number;
  last_inspection?: string;
  violations?: string;
  notes?: string;
  lat?: number;
  lng?: number;

  // Approval workflow fields
  approval_status?: "Pending" | "Approved";
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;

  created_at: Date;
  updated_at: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, index: true },
    business_type: { type: String, required: true },
    address: { type: String, required: true },
    address_detail: { type: String },
    owner_name: { type: String },
    owner_phone: { type: String },
    owner_id_card: { type: String },
    license_number: { type: String },
    operation_hours: { type: String },
    num_staff: { type: Number, default: 0 },
    risk_level: { type: String, default: "Trung bình" },
    inspection_count: { type: Number, default: 0 },
    last_inspection: { type: String },
    violations: { type: String },
    notes: { type: String },
    lat: { type: Number },
    lng: { type: Number },

    // Approval workflow fields
    approval_status: { type: String, enum: ["Pending", "Approved"], default: "Pending", index: true },
    created_by: { type: String },
    approved_by: { type: String },
    approved_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

BusinessSchema.index({ lat: 1, lng: 1 });
BusinessSchema.index({ risk_level: 1 });
BusinessSchema.index({ approval_status: 1 });

export const Business = mongoose.models.Business || mongoose.model<IBusiness>("Business", BusinessSchema);