import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHP Academy",
  applicationName: "PHP Academy",
  description:
    "A retro Windows XP-inspired environment for learning PHP, one concept at a time.",
  keywords: ["PHP", "learn PHP", "PHP tutorial", "PHP lessons", "PHP reference"],
};

export const viewport: Viewport = {
  themeColor: "#2456b0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
