import type { ReferenceCategoryId } from "@/lib/reference/types";

export type WindowId = "academy" | "programs" | "reference" | "computer" | "practice";

export type AcademyWindowPayload = {
  lessonSlug?: string;
  lessonRequest?: number;
};

export type PracticeWindowPayload = {
  programSlug?: string;
};

export type ReferenceWindowPayload = {
  categoryId?: ReferenceCategoryId;
  /** Bumped by the desktop when a lesson/program re-opens the reference. */
  request?: number;
};

export type WindowPayload =
  | AcademyWindowPayload
  | PracticeWindowPayload
  | ReferenceWindowPayload;

export interface WindowState {
  id: WindowId;
  title: string;
  minimized: boolean;
  maximized: boolean;
  payload?: WindowPayload;
}

export const WINDOW_TITLES: Record<WindowId, string> = {
  academy: "PHP Academy",
  programs: "Programs",
  reference: "PHP Reference",
  computer: "My Computer",
  practice: "PHP Practice",
};
