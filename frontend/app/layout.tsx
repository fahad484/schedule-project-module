import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediNest | Care, made simple",
  description: "Find a doctor, view available times, and manage your appointments with MediNest.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
