import Link from "next/link";
import { Stethoscope, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Med<span className="text-primary">Book</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your trusted partner in healthcare. Find top-rated specialists, book appointments 24/7, and manage your health seamlessly.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-primary transition-colors">
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="hover:text-primary transition-colors">
                  Appointments
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Specialties</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/doctors" className="hover:text-primary transition-colors">
                  Cardiology
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-primary transition-colors">
                  Dermatology
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-primary transition-colors">
                  Pediatrics
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-primary transition-colors">
                  Neurology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Legal & Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>&copy; 2026 MedBook Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with care for modern healthcare <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" />
          </p>
        </div>
      </div>
    </footer>
  );
}
