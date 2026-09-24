import { REFERENCE_CATEGORIES, getReferenceCategoryLabel } from "./categories";
import { REFERENCE_ENTRIES_ARRAYS } from "./arrays";
import { REFERENCE_ENTRIES_AUTHENTICATION } from "./authentication";
import { REFERENCE_ENTRIES_BASICS } from "./basics";
import { REFERENCE_ENTRIES_CONDITIONALS } from "./conditionals";
import { REFERENCE_ENTRIES_DATA_TYPES } from "./data-types";
import { REFERENCE_ENTRIES_FILES } from "./files";
import { REFERENCE_ENTRIES_FUNCTIONS } from "./functions";
import { REFERENCE_ENTRIES_LOOPS } from "./loops";
import { REFERENCE_ENTRIES_MYSQL } from "./mysql";
import { REFERENCE_ENTRIES_OPERATORS } from "./operators";
import { REFERENCE_ENTRIES_SESSIONS_AND_COOKIES } from "./sessions-and-cookies";
import { REFERENCE_ENTRIES_STRINGS } from "./strings";
import { REFERENCE_ENTRIES_VARIABLES } from "./variables";
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
