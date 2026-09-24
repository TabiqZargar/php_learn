import type { ReferenceCategory, ReferenceCategoryId } from "@/lib/reference/types";

/**
 * The fixed category list for the PHP Reference. Order here is the display
 * order in the reference sidebar and the "curriculum order" for content.
 */
export const REFERENCE_CATEGORIES: readonly ReferenceCategory[] = [
  {
    id: "basics",
    label: "Basics",
    description: "PHP tags, comments and the two output constructs.",
  },
  {
    id: "variables",
    label: "Variables",
    description: "Declaring, interpolating and scoping $variables.",
  },
  {
    id: "data-types",
    label: "Data Types",
    description: "The eight scalar + composite types PHP uses.",
  },
  {
    id: "operators",
    label: "Operators",
    description: "Arithmetic, comparison, logical and string operators.",
  },
  {
    id: "conditionals",
    label: "Conditionals",
    description: "Branching with if / else, switch and match.",
  },
  {
    id: "loops",
    label: "Loops",
    description: "Repeating work with for, while and foreach.",
  },
  {
    id: "functions",
    label: "Functions",
    description: "Defining reusable blocks of code with function.",
  },
  {
    id: "strings",
    label: "Strings",
    description: "Common string helpers: length, case, search and split.",
  },
  {
    id: "arrays",
    label: "Arrays",
    description: "Ordered and keyed collections plus array functions.",
  },
  {
    id: "sessions-and-cookies",
    label: "Sessions & Cookies",
    description: "Remembering state across HTTP requests.",
  },
  {
    id: "files",
    label: "Files",
    description: "Reading and writing files with the filesystem functions.",
  },
  {
    id: "mysql",
    label: "MySQL (mysqli)",
    description: "Talking to MySQL with the mysqli extension.",
  },
  {
    id: "authentication",
    label: "Authentication",
    description: "Hashing passwords and signing learners into sessions.",
  },
];

export const REFERENCE_CATEGORY_LABELS: Readonly<Record<ReferenceCategoryId, string>> =
  REFERENCE_CATEGORIES.reduce(
    (labels, category) => {
      labels[category.id] = category.label;
      return labels;
    },
    {} as Record<ReferenceCategoryId, string>,
  );

export function getReferenceCategoryLabel(categoryId: ReferenceCategoryId): string {
  return REFERENCE_CATEGORY_LABELS[categoryId];
}