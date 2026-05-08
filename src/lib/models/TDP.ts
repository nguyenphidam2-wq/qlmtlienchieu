import mongoose, { Schema, Document } from "mongoose";
import { FeatureCollection } from "geojson";

export interface ITDP extends Document {
  name: string;
  households: number;
  population: number;
  area_sqm: number;
  risk_status: "green" | "yellow" | "red";
  color: string;
  geojson: FeatureCollection;
  center?: [number, number];
  leader_name?: string;
  leader_phone?: string;
  created_at: Date;
  updated_at: Date;
}

const TDPSchema = new Schema<ITDP>(
  {
    name: { type: String, required: true },
    households: { type: Number, default: 0 },
    population: { type: Number, default: 0 },
    area_sqm: { type: Number, default: 0 },
    risk_status: { type: String, enum: ["green", "yellow", "red"], default: "green" },
    color: { type: String, default: "#3388ff" }, // Default blue
    geojson: { type: Schema.Types.Mixed, required: true },
    center: { type: [Number], required: false }, // [lng, lat] or [lat, lng], usually [lat, lng] for leaflet
    leader_name: { type: String },
    leader_phone: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const TDP = mongoose.models.TDP || mongoose.model<ITDP>("TDP", TDPSchema);
