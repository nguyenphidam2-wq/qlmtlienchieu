"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import { CustomZone, ICustomZone } from "@/lib/models/CustomZone";
import { FeatureCollection } from "geojson";
import { getCurrentUser } from "@/lib/jwt";
import { buildAuditChanges, recordAudit } from "@/lib/audit";

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !["admin", "leader", "officer"].includes(user.role)) throw new Error("Unauthorized");
}

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
  zone_type?: ICustomZone["zone_type"];
  risk_level?: ICustomZone["risk_level"];
  description?: string;
}): Promise<ICustomZone> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "leader", "officer"].includes(currentUser.role)) throw new Error("Unauthorized");
  await connectDB();
  const zone = await CustomZone.create({
    ...data,
    zone_type: currentUser.role === "officer" ? "unclassified" : data.zone_type || "unclassified",
    risk_level: currentUser.role === "officer" ? "green" : data.risk_level || "green",
    approval_status: currentUser.role === "officer" ? "Pending" : "Approved",
    created_by: currentUser.id,
  });
  await recordAudit({
    entity_type: "CustomZone",
    entity_id: zone._id.toString(),
    action: "CREATE",
    actor: currentUser,
    changes: buildAuditChanges(null, zone.toObject()),
  });
  revalidatePath("/gis");
  return JSON.parse(JSON.stringify(zone));
}

// Update custom zone
export async function updateCustomZone(
  id: string,
  data: Partial<{ name: string; color: string; visible: boolean; geojson: FeatureCollection; custom_fields: { label: string; value: string }[]; zone_type: ICustomZone["zone_type"]; risk_level: ICustomZone["risk_level"]; description: string; evidence_images: string[] }>
): Promise<ICustomZone | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "leader", "officer"].includes(currentUser.role)) throw new Error("Unauthorized");
  await connectDB();
  const before = await CustomZone.findById(id).lean();
  const updateData: Record<string, unknown> = { ...data, updated_by: currentUser.id };
  if (currentUser.role === "officer") {
    delete updateData.zone_type;
    delete updateData.risk_level;
  }
  const zone = await CustomZone.findByIdAndUpdate(id, updateData, { new: true }).lean();
  if (zone) {
    await recordAudit({
      entity_type: "CustomZone",
      entity_id: id,
      action: (data.zone_type || data.risk_level) && ["admin", "leader"].includes(currentUser.role) ? "VERIFY" : "UPDATE",
      actor: currentUser,
      changes: buildAuditChanges(before as Record<string, unknown> | null, zone as Record<string, unknown>),
    });
  }
  revalidatePath("/gis");
  return JSON.parse(JSON.stringify(zone));
}

// Delete custom zone
export async function deleteCustomZone(id: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await connectDB();
  const result = await CustomZone.findByIdAndDelete(id);
  if (result) {
    await recordAudit({
      entity_type: "CustomZone",
      entity_id: id,
      action: "DELETE",
      actor: user,
      changes: buildAuditChanges(result.toObject(), {}),
    });
  }
  revalidatePath("/gis");
  return !!result;
}

// Toggle zone visibility
export async function toggleCustomZoneVisibility(
  id: string
): Promise<boolean> {
  await requireEditor();
  await connectDB();
  const zone = await CustomZone.findById(id);
  if (!zone) return false;
  zone.visible = !zone.visible;
  await zone.save();
  await recordAudit({
    entity_type: "CustomZone",
    entity_id: id,
    action: "UPDATE",
    actor: await getCurrentUser() as { id: string; username?: string; role: string },
    changes: [{ field: "visible", before: !zone.visible, after: zone.visible }],
  });
  revalidatePath("/gis");
  return true;
}

// Bulk import zones from GeoJSON file
export async function importGeoJSONZones(
  geojson: FeatureCollection,
  options: { namePrefix?: string; color?: string; defaultVisible?: boolean } = {}
): Promise<number> {
  await requireEditor();
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
