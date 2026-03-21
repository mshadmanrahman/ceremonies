"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash, EditPencil } from "iconoir-react";

interface Member {
  readonly id: string;
  readonly userId: string;
  readonly role: "owner" | "facilitator" | "member";
  readonly joinedAt: string;
}

interface MemberListProps {
  readonly members: ReadonlyArray<Member>;
  readonly myRole: string;
  readonly teamId: string;
  readonly onMemberRemoved: (userId: string) => void;
  readonly onRoleChanged: (memberId: string, role: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/15 text-primary border-primary/30",
  facilitator: "bg-coffee/15 text-coffee border-coffee/30",
  member: "bg-muted text-muted-foreground border-border",
};

const ROLE_CYCLE: Record<string, string> = {
  member: "facilitator",
  facilitator: "owner",
  owner: "member",
};

export function MemberList({
  members,
  myRole,
  teamId,
  onMemberRemoved,
  onRoleChanged,
}: MemberListProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = useCallback(
    async (userId: string) => {
      setRemoving(userId);
      try {
        const res = await fetch(`/api/teams/${teamId}/members`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          onMemberRemoved(userId);
        }
      } finally {
        setRemoving(null);
      }
    },
    [teamId, onMemberRemoved]
  );

  const handleCycleRole = useCallback(
    async (memberId: string, currentRole: string) => {
      const nextRole = ROLE_CYCLE[currentRole] ?? "member";
      try {
        const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: nextRole }),
        });
        if (res.ok) {
          onRoleChanged(memberId, nextRole);
        }
      } catch {
        // Silently fail, UI stays as-is
      }
    },
    [teamId, onRoleChanged]
  );

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Members ({members.length})
      </p>
      <div className="space-y-1.5">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {member.userId.slice(0, 12)}...
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${ROLE_COLORS[member.role]}`}
              >
                {member.role}
              </Badge>
            </div>
            {myRole === "owner" && member.role !== "owner" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCycleRole(member.id, member.role)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  title="Change role"
                >
                  <EditPencil width={12} height={12} />
                </button>
                <button
                  onClick={() => handleRemove(member.userId)}
                  disabled={removing === member.userId}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remove member"
                >
                  <Trash width={12} height={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
