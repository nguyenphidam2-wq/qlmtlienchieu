import type { IFeatureModule } from "./types";
import { subjectsModule } from "./subjects/subjects.module";
import { businessesModule } from "./businesses/businesses.module";
import { customzonesModule } from "./customzones/customzones.module";
import { pcccModule } from "./pccc/pccc.module";
import { tdpModule } from "./tdp/tdp.module";

export const appModules: IFeatureModule[] = [
  subjectsModule,
  businessesModule,
  customzonesModule,
  pcccModule,
  tdpModule,
];