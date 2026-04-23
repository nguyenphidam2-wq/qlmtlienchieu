import { FeatureCollection } from "geojson";

export interface CustomZone {
  _id?: string;
  name: string;
  color: string;
  type: "polygon" | "marker";
  geojson: FeatureCollection;
  created_at: Date;
}

// Default zone colors for different types
export const ZONE_COLORS = {
  danger: "#ff5252",
  warning: "#ffb300",
  success: "#00e676",
  info: "#2196f3",
  purple: "#9c27b0",
} as const;

// Preset zone colors for cycling
export const PRESET_COLORS = [
  "#ff5252",
  "#ffb300",
  "#00e676",
  "#2196f3",
  "#9c27b0",
  "#ff9800",
  "#e91e63",
  "#00bcd4",
  "#8bc34a",
  "#795548",
];