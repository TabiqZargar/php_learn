import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHP Academy",
  description:
    "A retro Windows XP-inspired environment for learning PHP, one concept at a time.",
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