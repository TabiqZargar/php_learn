export type WindowId = "academy" | "programs" | "reference" | "computer" | "practice";

export interface PracticeWindowPayload {
  programSlug: string;
}

export interface AcademyWindowPayload {
  lessonSlug: string;
  /** Bumped on every related-lesson click so repeated clicks still remount. */
  lessonRequest: number;
}

export type WindowPayload = PracticeWindowPayload | AcademyWindowPayload;

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