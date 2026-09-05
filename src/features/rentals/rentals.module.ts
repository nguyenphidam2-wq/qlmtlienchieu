import type { Collection } from "mongodb";
import type { IFeatureModule } from "../types";

export const rentalsModule: IFeatureModule = {
  collectionName: "rentals",

  async importData(collection: Collection, data: unknown[]): Promise<number> {
    if (data.length === 0) return 0;
    const records = data.map((item) => ({
      ...(item as Record<string, unknown>),
      approval_status: "Pending",
    }));
    const result = await collection.insertMany(records);
    return result.insertedCount;
  },
};
