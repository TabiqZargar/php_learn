export type WindowId = "academy" | "programs" | "reference" | "computer";

export interface WindowState {
  id: WindowId;
  title: string;
  minimized: boolean;
  maximized: boolean;
}

export const WINDOW_TITLES: Record<WindowId, string> = {
  academy: "PHP Academy",
  programs: "Programs",
  reference: "PHP Reference",
  computer: "My Computer",
};