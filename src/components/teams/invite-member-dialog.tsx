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
import { UserPlus } from "iconoir-react";

interface InviteMemberDialogProps {
  readonly teamId: string;
  readonly onInvited: () => void;
}

export function InviteMemberDialog({ teamId, onInvited }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"member" | "facilitator">("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = useCallback(async () => {
    if (!userId.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to invite");
      }

      onInvited();
      setUserId("");
      setRole("member");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [userId, role, saving, teamId, onInvited]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <UserPlus width={14} height={14} />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-ceremony">
            Invite a member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Clerk User ID
            </label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_..."
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              autoFocus
              className="mt-1 h-11 border-2 border-border bg-card font-mono text-sm shadow-hard-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Role
            </label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setRole("member")}
                className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  role === "member"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                Member
              </button>
              <button
                onClick={() => setRole("facilitator")}
                className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  role === "facilitator"
                    ? "border-coffee bg-coffee/10 text-coffee"
                    : "border-border bg-card text-muted-foreground hover:border-coffee/40"
                }`}
              >
                Facilitator
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm font-bold text-destructive">{error}</p>
          )}
          <div className="flex gap-3">
            <DialogClose>
              <Button variant="ghost" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleInvite}
              disabled={!userId.trim() || saving}
              className="flex-1"
            >
              {saving ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
