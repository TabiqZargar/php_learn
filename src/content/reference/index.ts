import { REFERENCE_CATEGORIES, getReferenceCategoryLabel } from "./categories.ts";
import { REFERENCE_ENTRIES_ARRAYS } from "./arrays.ts";
import { REFERENCE_ENTRIES_AUTHENTICATION } from "./authentication.ts";
import { REFERENCE_ENTRIES_BASICS } from "./basics.ts";
import { REFERENCE_ENTRIES_CONDITIONALS } from "./conditionals.ts";
import { REFERENCE_ENTRIES_DATA_TYPES } from "./data-types.ts";
import { REFERENCE_ENTRIES_FILES } from "./files.ts";
import { REFERENCE_ENTRIES_FUNCTIONS } from "./functions.ts";
import { REFERENCE_ENTRIES_LOOPS } from "./loops.ts";
import { REFERENCE_ENTRIES_MYSQL } from "./mysql.ts";
import { REFERENCE_ENTRIES_OPERATORS } from "./operators.ts";
import { REFERENCE_ENTRIES_SESSIONS_AND_COOKIES } from "./sessions-and-cookies.ts";
import { REFERENCE_ENTRIES_STRINGS } from "./strings.ts";
import { REFERENCE_ENTRIES_VARIABLES } from "./variables.ts";
import type { ReferenceCategory, ReferenceEntry } from "@/lib/reference/types";

/** All reference entries, in authored category order. */
export const REFERENCE_ENTRIES: readonly ReferenceEntry[] = [
  ...REFERENCE_ENTRIES_BASICS,
  ...REFERENCE_ENTRIES_VARIABLES,
  ...REFERENCE_ENTRIES_DATA_TYPES,
  ...REFERENCE_ENTRIES_OPERATORS,
  ...REFERENCE_ENTRIES_CONDITIONALS,
  ...REFERENCE_ENTRIES_LOOPS,
  ...REFERENCE_ENTRIES_FUNCTIONS,
  ...REFERENCE_ENTRIES_STRINGS,
  ...REFERENCE_ENTRIES_ARRAYS,
  ...REFERENCE_ENTRIES_SESSIONS_AND_COOKIES,
  ...REFERENCE_ENTRIES_FILES,
  ...REFERENCE_ENTRIES_MYSQL,
  ...REFERENCE_ENTRIES_AUTHENTICATION,
];

export { REFERENCE_CATEGORIES, getReferenceCategoryLabel };
export type { ReferenceCategory, ReferenceEntry };
