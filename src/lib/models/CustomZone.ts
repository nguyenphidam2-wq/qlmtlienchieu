import mongoose, { Schema, Document } from "mongoose";
import { FeatureCollection } from "geojson";

export interface ICustomZone extends Document {
  name: string;
  color: string;
  type: "polygon" | "marker" | "circle" | "polyline";
  geojson: FeatureCollection;
  custom_fields?: { label: string; value: string }[];
  visible: boolean;
  zone_type: "unclassified" | "an_tt_hotspot_point" | "an_tt_hotspot_cluster" | "patrol_route" | "dispute_land_area";
  risk_level?: "green" | "yellow" | "red";
  approval_status?: "Pending" | "Approved" | "Rejected" | "NeedsUpdate";
  description?: string;
  evidence_images?: string[];
  last_reviewed_at?: Date;
  reviewed_by?: string;
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

const CustomZoneSchema = new Schema<ICustomZone>(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#3388ff" },
    type: {
      type: String,
      enum: ["polygon", "marker", "circle", "polyline"],
      default: "polygon",
    },
    geojson: { type: Schema.Types.Mixed, required: true },
    custom_fields: { type: [{ label: String, value: String }], default: [] },
    visible: { type: Boolean, default: true },
    zone_type: {
      type: String,
      enum: ["unclassified", "an_tt_hotspot_point", "an_tt_hotspot_cluster", "patrol_route", "dispute_land_area"],
      default: "unclassified",
      index: true,
    },
    risk_level: { type: String, enum: ["green", "yellow", "red"], default: "green", index: true },
    approval_status: { type: String, enum: ["Pending", "Approved", "Rejected", "NeedsUpdate"], default: "Pending", index: true },
    description: { type: String },
    evidence_images: { type: [String], default: [] },
    last_reviewed_at: { type: Date },
    reviewed_by: { type: String },
    created_by: { type: String },
    updated_by: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const CustomZone = mongoose.models.CustomZone || mongoose.model<ICustomZone>("CustomZone", CustomZoneSchema);
