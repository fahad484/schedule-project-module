"use client";

import * as React from "react";
import {
  Users as UsersIcon,
  Search,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  phone: string | null;
  image: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const currentUserRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/admin/users?page=${page}&limit=10`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.data) {
            setUsers(json.data.items || []);
            setTotalPages(json.data.totalPages || 1);
            setTotalCount(json.data.total || 0);
          }
        }
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [page]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update user role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRecord["role"] } : u))
      );
      toast.success("User role updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (currentUserRole !== "admin") {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Administrator Access Required</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You do not have permission to view or manage registered system users.
          </p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700 gap-1 text-[11px]">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
        );
      case "doctor":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 gap-1 text-[11px]">
            <Stethoscope className="h-3 w-3" /> Doctor
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            <UserCheck className="h-3 w-3" /> Patient
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Administration</h1>
        <p className="text-sm text-muted-foreground">
          View registered accounts, monitor platform access, and manage user security roles.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user by name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-56">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="patient">Patients Only</SelectItem>
                  <SelectItem value="doctor">Doctors Only</SelectItem>
                  <SelectItem value="admin">Administrators Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table / List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              Registered Accounts
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {totalCount} Total Registered
            </span>
          </CardTitle>
          <CardDescription>
            Manage role permissions across the healthcare booking platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs text-muted-foreground">
                No accounts match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={u.image || ""} />
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(u.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{u.name}</span>
                        {getRoleBadge(u.role)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{u.email}</span>
                        {u.phone && <span>• {u.phone}</span>}
                        <span>• Joined {formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                      Change Role:
                    </span>
                    <Select
                      value={u.role}
                      disabled={updatingId === u.id || u.id === session?.user?.id}
                      onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingId === u.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className="gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
