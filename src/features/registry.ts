import type { IFeatureModule } from "./types";
import { subjectsModule } from "./subjects/subjects.module";
import { businessesModule } from "./businesses/businesses.module";
import { customzonesModule } from "./customzones/customzones.module";

export const appModules: IFeatureModule[] = [
  subjectsModule,
  businessesModule,
  customzonesModule,
];