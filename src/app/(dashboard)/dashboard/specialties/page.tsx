"use client";

import * as React from "react";
import {
  Activity,
  Plus,
  Loader2,
  ShieldAlert,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Specialty } from "@/types";

export default function AdminSpecialtiesPage() {
  const { data: session } = useSession();
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // New Specialty Form
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("HeartPulse");

  const currentUserRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  const fetchSpecialties = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/specialties");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSpecialties(json.data);
        }
      }
    } catch (err) {
      console.error("Error loading specialties:", err);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/specialties");
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.data) {
            setSpecialties(json.data);
          }
        }
      } catch (err) {
        console.error("Error loading specialties:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a specialty name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create specialty");
      }

      toast.success(`Specialty "${name}" created successfully`);
      setName("");
      setDescription("");
      setIcon("HeartPulse");
      setAddModalOpen(false);
      fetchSpecialties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create specialty";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Administrator Access Required</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You do not have permission to manage medical specialties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Specialties</h1>
          <p className="text-sm text-muted-foreground">
            Configure clinical practice specialties under which doctors list their consultation services.
          </p>
        </div>

        <Button onClick={() => setAddModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Specialty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Active Specialties
            </span>
            <Badge variant="secondary" className="font-normal text-xs">
              {specialties.length} Total
            </Badge>
          </CardTitle>
          <CardDescription>
            These categories are displayed in the patient search directory and doctor profile onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : specialties.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <HeartPulse className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No specialties created yet</p>
              <p className="text-xs text-muted-foreground">
                Add specialties so doctors can categorize their medical practices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((spec) => (
                <div
                  key={spec.id}
                  className="rounded-lg border p-4 space-y-2 bg-card hover:bg-muted/10 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{spec.name}</span>
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {spec.description || "General clinical consultations and specialized diagnostics."}
                    </p>
                  </div>
                  <div className="pt-2 border-t text-[11px] text-muted-foreground">
                    ID: <span className="font-mono text-[10px]">{spec.id.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Specialty Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSpecialty}>
            <DialogHeader>
              <DialogTitle>Add Medical Specialty</DialogTitle>
              <DialogDescription>
                Create a new clinical discipline for doctor categorization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="specialtyName">
                  Specialty Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="specialtyName"
                  placeholder="e.g. Endocrinology, Oncology, Urology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialtyDesc">Description</Label>
                <Textarea
                  id="specialtyDesc"
                  placeholder="Brief description of symptoms and conditions treated..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialtyIcon">Icon Identifier (Lucide)</Label>
                <Input
                  id="specialtyIcon"
                  placeholder="e.g. HeartPulse, Brain, Eye, Stethoscope"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Specialty
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
