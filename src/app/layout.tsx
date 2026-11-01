import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedBook - Doctor Appointment Booking System",
  description:
    "Book doctor appointments online seamlessly. Discover verified specialists, view schedules, and book consultations in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased flex flex-col"
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
