import type { Collection } from "mongodb";
import type { IFeatureModule } from "../types";

export const businessesModule: IFeatureModule = {
  collectionName: "businesses",

  async importData(collection: Collection, data: unknown[]): Promise<number> {
    await collection.deleteMany({});
    if (data.length === 0) return 0;
    const result = await collection.insertMany(data as Document[]);
    return result.insertedCount;
  },
};