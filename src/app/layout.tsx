import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoWeb - Restaurant Website Generator",
  description: "Beautiful restaurant websites, automatically generated",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
