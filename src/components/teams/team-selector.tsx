"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateTeamDialog } from "./create-team-dialog";
import { cn } from "@/lib/utils";
import { NavArrowDown, Settings } from "iconoir-react";
import Link from "next/link";

interface Team {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

interface TeamSelectorProps {
  readonly initialTeams: ReadonlyArray<Team>;
  readonly activeTeamId?: string;
}

export function TeamSelector({ initialTeams, activeTeamId }: TeamSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<ReadonlyArray<Team>>(initialTeams);
  const [open, setOpen] = useState(false);

  const currentTeamId = activeTeamId ?? searchParams.get("team") ?? teams[0]?.id;
  const currentTeam = teams.find((t) => t.id === currentTeamId) ?? teams[0];

  const selectTeam = useCallback(
    (teamId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("team", teamId);
      router.push(`/dashboard?${params.toString()}`);
      setOpen(false);
    },
    [router, searchParams]
  );

  const handleCreated = useCallback(
    (team: { id: string; name: string }) => {
      const newTeam: Team = { ...team, role: "owner" };
      setTeams((prev) => [...prev, newTeam]);
      selectTeam(team.id);
    },
    [selectTeam]
  );

  // No teams: show create prompt
  if (teams.length === 0) {
    return (
      <div className="rounded-md border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm font-bold text-primary/80">
          Create your first team to get started
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Teams let you save sessions and unlock The Haunting.
        </p>
        <div className="mt-3">
          <CreateTeamDialog onCreated={handleCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border-2 border-border bg-card px-3 py-1.5 text-sm font-bold shadow-hard-sm transition-colors hover:border-primary"
      >
        <span className="max-w-[200px] truncate">{currentTeam?.name ?? "Select team"}</span>
        <NavArrowDown
          width={14}
          height={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-md border-2 border-border bg-card p-2 shadow-hard">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center gap-1">
                <button
                  onClick={() => selectTeam(team.id)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted",
                    team.id === currentTeamId && "bg-primary/10 text-primary font-bold"
                  )}
                >
                  <span className="block truncate">{team.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {team.role}
                  </span>
                </button>
                {(team.role === "owner" || team.role === "facilitator") && (
                  <Link
                    href={`/dashboard/team/${team.id}`}
                    onClick={() => setOpen(false)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`${team.name} settings`}
                  >
                    <Settings width={14} height={14} />
                  </Link>
                )}
              </div>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <CreateTeamDialog onCreated={handleCreated} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
