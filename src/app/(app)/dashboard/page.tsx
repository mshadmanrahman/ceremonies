import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { retros, actionItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { GhostIcon, OwlIcon } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let pastRetros: Awaited<ReturnType<typeof fetchRetros>> = [];
  try {
    pastRetros = await fetchRetros(userId);
  } catch {
    // DB might not be ready yet
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
        <div>
          <h1 className="font-display text-3xl tracking-ceremony">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your past retros and action items.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link
            href={`/retro/${generateRoomCode()}`}
            className="flex-1 rounded-md border-2 border-border bg-card p-4 shadow-hard-sm transition-all hover:border-coffee hover:shadow-hard"
          >
            <GhostIcon size={28} className="text-coffee" />
            <p className="mt-2 text-sm font-bold">New retro</p>
            <p className="text-xs text-muted-foreground">Start a retrospective</p>
          </Link>
          <Link
            href={`/estimation/${generateRoomCode()}`}
            className="flex-1 rounded-md border-2 border-border bg-card p-4 shadow-hard-sm transition-all hover:border-primary hover:shadow-hard"
          >
            <OwlIcon size={28} className="text-primary" />
            <p className="mt-2 text-sm font-bold">New estimation</p>
            <p className="text-xs text-muted-foreground">Start an estimation session</p>
          </Link>
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

              {/* Action items from this retro */}
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

async function fetchRetros(userId: string) {
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

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8);
}
