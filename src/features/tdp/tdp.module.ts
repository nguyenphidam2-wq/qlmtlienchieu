import type { Collection } from "mongodb";
import type { IFeatureModule, ImportResult } from "../types";

export const tdpModule: IFeatureModule = {
  collectionName: "tdps",

  async importData(collection: Collection, data: unknown[]): Promise<ImportResult> {
    if (data.length === 0) return { success: false, message: "Dữ liệu rỗng", inserted: 0, updated: 0, errors: 0, errorDetails: [] };
    const temporary = `${collection.collectionName}_import_${Date.now()}`;
    const tempCollection = collection.db.collection(temporary);
    try {
      const result = await tempCollection.insertMany(data as Document[]);
      await collection.drop().catch(() => undefined);
      await tempCollection.rename(collection.collectionName);
      return { success: true, message: `Đã import ${result.insertedCount} bản ghi`, inserted: result.insertedCount, updated: 0, errors: 0, errorDetails: [] };
    } catch (error) {
      await tempCollection.drop().catch(() => undefined);
      throw error;
    }
  },
};
