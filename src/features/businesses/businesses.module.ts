import type { Collection } from "mongodb";
import type { IFeatureModule } from "../types";

export const businessesModule: IFeatureModule = {
  collectionName: "businesses",

  async importData(collection: Collection, data: unknown[]): Promise<number> {
    await collection.deleteMany({});
    if (data.length === 0) return 0;
    
    // Add Pending approval status to all imported records
    const dataWithPendingStatus = data.map((item: any) => ({
      ...item,
      approval_status: "Pending"
    }));
    
    const result = await collection.insertMany(dataWithPendingStatus as Document[]);
    return result.insertedCount;
  },
};