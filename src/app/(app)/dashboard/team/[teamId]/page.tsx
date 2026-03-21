"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberList } from "@/components/teams/member-list";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OwlIcon } from "@/components/shared/icons";
import { UserButton } from "@clerk/nextjs";
import { NavArrowLeft, Check } from "iconoir-react";

interface Member {
  readonly id: string;
  readonly userId: string;
  readonly role: "owner" | "facilitator" | "member";
  readonly joinedAt: string;
}

interface TeamData {
  readonly id: string;
  readonly name: string;
  readonly members: ReadonlyArray<Member>;
  readonly myRole: string;
}

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTeam(data);
      setTeamName(data.name);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [teamId, router]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleRename = useCallback(async () => {
    if (!teamName.trim() || saving || teamName === team?.name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTeam((prev) => (prev ? { ...prev, name: updated.name } : null));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [teamName, saving, team?.name, teamId]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } finally {
      setDeleting(false);
    }
  }, [teamId, router]);

  const handleMemberRemoved = useCallback((userId: string) => {
    setTeam((prev) =>
      prev
        ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) }
        : null
    );
  }, []);

  const handleRoleChanged = useCallback((memberId: string, role: string) => {
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.map((m) =>
              m.id === memberId ? { ...m, role: role as Member["role"] } : m
            ),
          }
        : null
    );
  }, []);

  if (loading) {
    return (
      <div className="mx-auto min-h-svh max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!team) return null;

  const isOwner = team.myRole === "owner";
  const canInvite = team.myRole === "owner" || team.myRole === "facilitator";

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground shadow-hard-sm transition-colors hover:border-foreground/40 hover:text-foreground"
            aria-label="Back to dashboard"
          >
            <NavArrowLeft width={16} height={16} />
          </Link>
          <h1 className="font-display text-2xl tracking-ceremony sm:text-3xl">
            Team Settings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <UserButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="my-5 h-0.5 bg-border" />

      <div className="space-y-8">
        {/* Team name */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Team name
          </label>
          <div className="flex gap-2">
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              disabled={!isOwner}
              className="h-11 border-2 border-border bg-card font-bold shadow-hard-sm"
            />
            {isOwner && teamName !== team.name && (
              <Button onClick={handleRename} disabled={saving}>
                {saved ? (
                  <Check width={16} height={16} />
                ) : saving ? (
                  "Saving..."
                ) : (
                  "Save"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Members
            </p>
            {canInvite && (
              <InviteMemberDialog teamId={teamId} onInvited={fetchTeam} />
            )}
          </div>
          <MemberList
            members={team.members as Member[]}
            myRole={team.myRole}
            teamId={teamId}
            onMemberRemoved={handleMemberRemoved}
            onRoleChanged={handleRoleChanged}
          />
        </div>

        {/* Danger zone */}
        {isOwner && (
          <div className="space-y-3 rounded-md border-2 border-destructive/30 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-destructive">
              Danger zone
            </p>
            <p className="text-sm text-muted-foreground">
              Deleting a team removes all members. Session history is preserved.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete team"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
