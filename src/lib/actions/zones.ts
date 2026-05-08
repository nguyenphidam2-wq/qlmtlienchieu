"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { CustomZone, ICustomZone } from "@/lib/models/CustomZone";
import { FeatureCollection } from "geojson";

// Get all custom zones
export async function getCustomZones(): Promise<ICustomZone[]> {
  await connectDB();
  const zones = await CustomZone.find().sort({ created_at: -1 }).lean();
  return JSON.parse(JSON.stringify(zones));
}

// Create custom zone from GeoJSON file upload
export async function createCustomZone(data: {
  name: string;
  color: string;
  type: "polygon" | "marker" | "circle" | "polyline";
  geojson: FeatureCollection;
}): Promise<ICustomZone> {
  await connectDB();
  const zone = await CustomZone.create(data);
  revalidatePath("/gis");
  return JSON.parse(JSON.stringify(zone));
}

// Update custom zone
export async function updateCustomZone(
  id: string,
  data: Partial<{ name: string; color: string; visible: boolean; geojson: FeatureCollection; custom_fields: { label: string; value: string }[] }>
): Promise<ICustomZone | null> {
  await connectDB();
  const zone = await CustomZone.findByIdAndUpdate(id, data, { new: true }).lean();
  revalidatePath("/gis");
  return JSON.parse(JSON.stringify(zone));
}

// Delete custom zone
export async function deleteCustomZone(id: string): Promise<boolean> {
  await connectDB();
  const result = await CustomZone.findByIdAndDelete(id);
  revalidatePath("/gis");
  return !!result;
}

// Toggle zone visibility
export async function toggleCustomZoneVisibility(
  id: string
): Promise<boolean> {
  await connectDB();
  const zone = await CustomZone.findById(id);
  if (!zone) return false;
  zone.visible = !zone.visible;
  await zone.save();
  revalidatePath("/gis");
  return true;
}

// Bulk import zones from GeoJSON file
export async function importGeoJSONZones(
  geojson: FeatureCollection,
  options: { namePrefix?: string; color?: string; defaultVisible?: boolean } = {}
): Promise<number> {
  await connectDB();
  const { namePrefix = "Zone", color = "#3388ff", defaultVisible = true } = options;

  const zones = geojson.features.map((feature, index) => {
    const props = feature.properties || {};
    // Extract a meaningful name if it exists in properties
    const propName = props.name || props.Name || props.NAME || props.Tên || props.ten || props.id || props.ID || `${namePrefix} ${index + 1}`;
    
    // Map all other properties to custom_fields
    const customFields = Object.keys(props)
      .filter(key => key.toLowerCase() !== 'name' && key !== 'Name' && key !== 'NAME' && key !== 'Tên' && key !== 'ten')
      .map(key => ({
        label: key,
        value: String(props[key])
      }));

    return {
      name: String(propName),
      color,
      type: "polygon" as const,
      geojson: { type: "FeatureCollection" as const, features: [feature] },
      custom_fields: customFields,
      visible: defaultVisible,
    };
  });

  await CustomZone.insertMany(zones);
  revalidatePath("/gis");
  return zones.length;
}