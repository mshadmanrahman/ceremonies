"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus } from "iconoir-react";

interface CreateTeamDialogProps {
  readonly onCreated: (team: { id: string; name: string }) => void;
}

export function CreateTeamDialog({ onCreated }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create team");
      }

      const team = await res.json();
      onCreated(team);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [name, saving, onCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md border-2 border-border bg-card px-2.5 text-[0.8rem] font-bold shadow-hard-sm transition-all hover:border-primary hover:text-primary h-7">
        <Plus width={14} height={14} />
        New team
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-ceremony">
            Create a team
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Insanity"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            className="h-11 border-2 border-border bg-card text-center font-bold shadow-hard-sm"
          />
          {error && (
            <p className="text-sm font-bold text-destructive">{error}</p>
          )}
          <div className="flex gap-3">
            <DialogClose className="flex-1 inline-flex items-center justify-center rounded-md border-2 border-transparent px-3 h-8 text-sm font-bold transition-all hover:bg-muted hover:text-foreground">
              Cancel
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || saving}
              className="flex-1"
            >
              {saving ? "Creating..." : "Create team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
