"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Copy, Check, Link as LinkIcon } from "iconoir-react";

interface InviteMemberDialogProps {
  readonly teamId: string;
  readonly onInvited: () => void;
}

export function InviteMemberDialog({ teamId, onInvited }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"member" | "facilitator">("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create invite");
      }

      const invite = await res.json();
      const origin = window.location.origin;
      setInviteLink(`${origin}/join/${invite.code}`);
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }, [role, creating, teamId, onInvited]);

  const handleCopy = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteLink]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset state when closing
      setInviteLink(null);
      setCopied(false);
      setError(null);
      setRole("member");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md border-2 border-border bg-card px-2.5 text-[0.8rem] font-bold shadow-hard-sm transition-all hover:border-primary hover:text-primary h-7">
        <UserPlus width={14} height={14} />
        Invite member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-ceremony">
            Invite a member
          </DialogTitle>
        </DialogHeader>

        {inviteLink ? (
          // ── Link Generated ──
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Share this link with your teammate. They'll join as <span className="font-bold text-foreground">{role}</span>.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border-2 border-border bg-muted px-3 py-2.5">
                <LinkIcon width={14} height={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs">{inviteLink}</span>
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <Check width={14} height={14} />
                ) : (
                  <Copy width={14} height={14} />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              This link doesn't expire. You can revoke it from team settings.
            </p>
          </div>
        ) : (
          // ── Role Selection ──
          <div className="space-y-4 pt-2">
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
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full"
            >
              {creating ? "Creating link..." : "Create invite link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
