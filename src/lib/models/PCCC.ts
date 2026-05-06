import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPCCCRecord extends Document {
  name: string;
  type: "hydrant" | "building" | "water_source" | "equipment";
  status: "active" | "inactive" | "maintenance";
  address?: string;
  lat?: number;
  lng?: number;
  lastChecked?: Date;
  details?: {
    extinguishers_count?: number;
    capacity_m3?: number;
    accessibility?: "easy" | "difficult" | "impossible";
  };
  tdp?: string;
  created_at: Date;
  updated_at: Date;
}

const PCCCSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["hydrant", "building", "water_source", "equipment"], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["active", "inactive", "maintenance"], 
      default: "active" 
    },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    lastChecked: { type: Date },
    details: {
      extinguishers_count: { type: Number },
      capacity_m3: { type: Number },
      accessibility: { 
        type: String, 
        enum: ["easy", "difficult", "impossible"] 
      },
    },
    tdp: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const PCCCRecord: Model<IPCCCRecord> = 
  mongoose.models.PCCCRecord || mongoose.model<IPCCCRecord>("PCCCRecord", PCCCSchema);
