import type { IFeatureModule } from "./types";
import { subjectsModule } from "./subjects/subjects.module";
import { customzonesModule } from "./customzones/customzones.module";
import { tdpModule } from "./tdp/tdp.module";
import { rentalsModule } from "./rentals/rentals.module";
import { conditionalBusinessesModule } from "./conditional-businesses/conditional-businesses.module";

export const appModules: IFeatureModule[] = [
  subjectsModule,
  customzonesModule,
  tdpModule,
  rentalsModule,
  conditionalBusinessesModule,
];
