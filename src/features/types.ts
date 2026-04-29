import type { Collection } from "mongodb";

export interface IFeatureModule {
  collectionName: string;
  importData(collection: Collection, data: unknown[]): Promise<number>;
}