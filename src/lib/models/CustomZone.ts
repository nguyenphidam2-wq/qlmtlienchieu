import mongoose, { Schema, Document } from "mongoose";
import { FeatureCollection } from "geojson";

export interface ICustomZone extends Document {
  name: string;
  color: string;
  type: "polygon" | "marker" | "circle" | "polyline";
  geojson: FeatureCollection;
  custom_fields?: { label: string; value: string }[];
  visible: boolean;
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
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const CustomZone = mongoose.models.CustomZone || mongoose.model<ICustomZone>("CustomZone", CustomZoneSchema);