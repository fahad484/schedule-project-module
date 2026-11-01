"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Search,
  Bell,
  User,
  Clock,
  CalendarCheck,
  Star,
  Settings,
  Activity,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  const patientNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Appointments", href: "/appointments", icon: Calendar },
    { title: "Find Doctors", href: "/doctors", icon: Search },
    { title: "Notifications", href: "/notifications", icon: Bell },
    { title: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const doctorNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Schedule", href: "/dashboard/schedule", icon: Clock },
    { title: "Appointments", href: "/appointments", icon: Calendar },
    { title: "Availability", href: "/dashboard/availability", icon: CalendarCheck },
    { title: "Reviews", href: "/dashboard/reviews", icon: Star },
    { title: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const adminNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Doctors", href: "/doctors", icon: Stethoscope },
    { title: "Appointments", href: "/appointments", icon: Calendar },
    { title: "Specialties", href: "/dashboard/specialties", icon: Activity },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  let items = patientNav;
  if (userRole === "doctor") {
    items = doctorNav;
  } else if (userRole === "admin") {
    items = adminNav;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">
            Med<span className="text-primary">Book</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Health Portal
          </span>
        </Link>
      </div>

      {/* User Info Bar */}
      {session?.user && (
        <div className="flex items-center gap-3 border-b border-border/60 p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>{getInitials(session.user.name || "U")}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{session.user.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
