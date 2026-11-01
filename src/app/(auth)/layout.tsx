import * as React from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
            <Stethoscope className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Med<span className="text-primary">Book</span>
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Secure Doctor Appointment & Consultation System
        </p>
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
