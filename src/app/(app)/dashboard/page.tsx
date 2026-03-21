import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { teams, teamMembers, retros, actionItems, estimationSessions, estimationResults } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { GhostIcon, OwlIcon } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { TeamSelector } from "@/components/teams/team-selector";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { team: activeTeamId } = await searchParams;

  // Fetch user's teams
  let userTeams: Array<{ id: string; name: string; role: string }> = [];
  try {
    const db = getDb();
    userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
  } catch {
    // DB might not be ready
  }

  const currentTeamId = activeTeamId ?? userTeams[0]?.id;

  // Fetch retros for current team or user
  let pastRetros: Awaited<ReturnType<typeof fetchRetros>> = [];
  try {
    pastRetros = await fetchRetros(userId, currentTeamId);
  } catch {
    // DB might not be ready
  }

  // Fetch estimation sessions for current team or user
  let pastEstimations: Awaited<ReturnType<typeof fetchEstimations>> = [];
  try {
    pastEstimations = await fetchEstimations(userId, currentTeamId);
  } catch {
    // DB might not be ready
  }

  return (
    <div className="mx-auto min-h-svh max-w-3xl px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <OwlIcon size={28} className="text-primary" />
          <span className="font-display text-xl font-bold tracking-ceremony">
            ceremonies
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <UserButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="my-5 h-0.5 bg-border" />

      {/* Dashboard content */}
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-ceremony">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your ceremonies, teams, and history.
            </p>
          </div>
          <TeamSelector initialTeams={userTeams} activeTeamId={currentTeamId} />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link
            href={`/retro/${generateRoomCode()}${currentTeamId ? `?team=${currentTeamId}` : ""}`}
            className="flex-1 rounded-md border-2 border-border bg-card p-4 shadow-hard-sm transition-all hover:border-coffee hover:shadow-hard"
          >
            <GhostIcon size={28} className="text-coffee" />
            <p className="mt-2 text-sm font-bold">New retro</p>
            <p className="text-xs text-muted-foreground">Start a retrospective</p>
          </Link>
          <Link
            href={`/estimation/${generateRoomCode()}${currentTeamId ? `?team=${currentTeamId}` : ""}`}
            className="flex-1 rounded-md border-2 border-border bg-card p-4 shadow-hard-sm transition-all hover:border-primary hover:shadow-hard"
          >
            <OwlIcon size={28} className="text-primary" />
            <p className="mt-2 text-sm font-bold">New estimation</p>
            <p className="text-xs text-muted-foreground">Start an estimation session</p>
          </Link>
        </div>

        {/* Estimation sessions */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Estimation sessions ({pastEstimations.length})
          </h2>

          {pastEstimations.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-border p-8 text-center">
              <OwlIcon size={40} className="mx-auto text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                No estimation sessions yet. Start one above!
              </p>
            </div>
          )}

          {pastEstimations.map((session) => (
            <div
              key={session.id}
              className="rounded-md border-2 border-border bg-card p-4 shadow-hard-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">
                    Session {session.roomCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.closedAt
                      ? new Date(session.closedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "In progress"}
                  </p>
                </div>
                <div className="flex gap-3 text-center">
                  <div>
                    <p className="font-mono text-lg font-bold">{session.results.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      tickets
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold">{session.participantCount}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      players
                    </p>
                  </div>
                </div>
              </div>
              {session.results.length > 0 && (
                <div className="mt-3 space-y-1">
                  {session.results.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-muted-foreground">{r.ticketRef}</span>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {r.finalEstimate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Past retros */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Past retros ({pastRetros.length})
          </h2>

          {pastRetros.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-border p-8 text-center">
              <GhostIcon size={40} className="mx-auto text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                No retros yet. Start one above!
              </p>
            </div>
          )}

          {pastRetros.map((retro) => (
            <div
              key={retro.id}
              className="rounded-md border-2 border-border bg-card p-4 shadow-hard-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">
                    Retro {retro.roomCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {retro.closedAt
                      ? new Date(retro.closedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "In progress"}
                  </p>
                </div>
                <div className="flex gap-3 text-center">
                  <div>
                    <p className="font-mono text-lg font-bold">{retro.cardCount}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      cards
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold">{retro.actionCount}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      actions
                    </p>
                  </div>
                </div>
              </div>

              {retro.actions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {retro.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          action.done ? "bg-success" : "bg-coffee"
                        }`}
                      />
                      <span
                        className={
                          action.done
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }
                      >
                        {action.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function fetchRetros(userId: string, teamId?: string) {
  const db = getDb();
  const userRetros = await db
    .select()
    .from(retros)
    .where(eq(retros.createdBy, userId))
    .orderBy(desc(retros.createdAt))
    .limit(20);

  const result = await Promise.all(
    userRetros.map(async (retro) => {
      const actions = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.retroId, retro.id));
      return { ...retro, actions };
    })
  );

  return result;
}

async function fetchEstimations(userId: string, teamId?: string) {
  const db = getDb();

  // Fetch by teamId if available, otherwise by createdBy
  const sessions = teamId
    ? await db
        .select()
        .from(estimationSessions)
        .where(eq(estimationSessions.teamId, teamId))
        .orderBy(desc(estimationSessions.createdAt))
        .limit(20)
    : await db
        .select()
        .from(estimationSessions)
        .where(eq(estimationSessions.createdBy, userId))
        .orderBy(desc(estimationSessions.createdAt))
        .limit(20);

  const result = await Promise.all(
    sessions.map(async (session) => {
      const results = await db
        .select()
        .from(estimationResults)
        .where(eq(estimationResults.sessionId, session.id));
      return { ...session, results };
    })
  );

  return result;
}

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8);
}
