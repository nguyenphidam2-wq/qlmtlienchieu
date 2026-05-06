import { IFeatureModule } from "../types";
import { Collection } from "mongodb";

export const pcccModule: IFeatureModule = {
  collectionName: "pcccrecords",
  importData: async (collection: Collection, data: any[]) => {
    // Clear existing PCCC data for clean import
    await collection.deleteMany({});
    
    const preparedData = data.map(item => ({
      ...item,
      created_at: new Date(),
      updated_at: new Date(),
      lastChecked: item.lastChecked ? new Date(item.lastChecked) : new Date()
    }));

    const result = await collection.insertMany(preparedData);
    return result.insertedCount;
  }
};
