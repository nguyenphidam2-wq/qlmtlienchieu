import type { Collection } from "mongodb";

export interface ImportResult {
  success: boolean;
  message: string;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails: string[];
}

export interface IFeatureModule {
  id?: string;
  name?: string;
  description?: string;
  collectionName: string;
  importData(collection: Collection, data: unknown[]): Promise<number | ImportResult>;
}
