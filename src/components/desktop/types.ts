export type WindowId = "academy" | "programs" | "reference" | "computer" | "practice";

export interface PracticeWindowPayload {
  programSlug: string;
}

export type WindowPayload = PracticeWindowPayload;

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