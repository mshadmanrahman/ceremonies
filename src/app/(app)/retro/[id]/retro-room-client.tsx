"use client";

import { useState, useCallback, useMemo, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { GhostIcon, OwlIcon } from "@/components/shared/icons";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { PhaseIndicator } from "@/components/retro/phase-indicator";
import { HauntingPhase } from "@/components/retro/haunting-phase";
import { WritingPhase } from "@/components/retro/writing-phase";
import { GroupingPhase } from "@/components/retro/grouping-phase";
import { VotingPhase } from "@/components/retro/voting-phase";
import { DiscussActPhase } from "@/components/retro/discuss-act-phase";
import { useRetroRoom } from "@/hooks/use-retro-room";
import { getRetroStats, type RetroState, type CardGroup } from "@/lib/state-machines/retro";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NavArrowLeft, LogOut, Copy, Check, Download } from "iconoir-react";
import { generateCSV, downloadCSV } from "@/lib/csv";

export function RetroRoomClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? undefined;
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);

  if (!joined) {
    return (
      <JoinScreen
        name={playerName}
        onNameChange={setPlayerName}
        onJoin={() => setJoined(true)}
      />
    );
  }

  return (
    <RetroRoom
      roomId={roomId}
      teamId={teamId}
      playerName={playerName}
      onLeave={() => {
        setJoined(false);
        setPlayerName("");
      }}
    />
  );
}

// ── Join Screen ──

function JoinScreen({
  name,
  onNameChange,
  onJoin,
}: {
  name: string;
  onNameChange: (name: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col px-4">
      <div className="px-2 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          <NavArrowLeft width={16} height={16} />
          Back
        </Link>
      </div>

      <div className="stagger-in mx-auto flex flex-1 w-full max-w-sm flex-col items-center justify-center space-y-8 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-md border-2 border-coffee/40 bg-coffee/10 text-coffee shadow-hard">
          <GhostIcon size={52} />
        </div>

        <div>
          <h1 className="font-display text-4xl tracking-ceremony sm:text-5xl">
            Retro
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Enter your name to join the room.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onJoin()}
            autoFocus
            className="h-12 border-2 border-border bg-card text-center font-bold shadow-hard placeholder:text-muted-foreground/50 focus:border-coffee"
          />
          <Button
            onClick={onJoin}
            disabled={!name.trim()}
            className="h-12 w-full"
            size="lg"
          >
            Join retro
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Retro Room ──

function RetroRoom({
  roomId,
  teamId,
  playerName,
  onLeave,
}: {
  roomId: string;
  teamId?: string;
  playerName: string;
  onLeave: () => void;
}) {
  const { userId: clerkUserId } = useAuth();

  const {
    state,
    myId,
    myAnonymousId,
    isFacilitator,
    connected,
    startRetro,
    markAction,
    advancePhase,
    addCard,
    editCard,
    removeCard,
    moveCardPosition,
    scatterCards,
    sendCursor,
    cursors,
    createGroup,
    renameGroup,
    moveCardToGroup,
    removeCardFromGroup,
    castVote,
    removeVote,
    myVoteCount,
    setTimer,
    toggleTimer,
    nextTopic,
    addActionItem,
    removeActionItem,
    updateActionItem,
    closeRetro,
    typingOthers,
    startTyping,
    stopTyping,
  } = useRetroRoom({ roomId, playerName, clerkUserId });

  // Unresolved items from previous retro (groups without action items)
  const [unresolvedItems, setUnresolvedItems] = useState<ReadonlyArray<{ id: string; label: string; category?: string; voteCount?: number }>>([]);

  const myVotesByGroup = useMemo(() => {
    if (!state || !myId) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const vote of state.votes) {
      if (vote.odiedId === myId) {
        map.set(vote.groupId, (map.get(vote.groupId) ?? 0) + 1);
      }
    }
    return map;
  }, [state, myId]);

  // Loading state
  if (!state) {
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
        <ConnectionStatus connected={connected} hasState={false} />
        {connected && (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-4 h-4 w-32" />
            <div className="mt-12 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col px-4 py-6 sm:py-8">
      <ConnectionStatus connected={connected} hasState={!!state} />
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground shadow-hard-sm transition-colors hover:border-foreground/40 hover:text-foreground"
              aria-label="Back to home"
            >
              <NavArrowLeft width={16} height={16} />
            </Link>
            <h1 className="font-display text-3xl tracking-ceremony sm:text-4xl">
              Retro
            </h1>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {state.participants.length} participant
              {state.participants.length !== 1 ? "s" : ""}
            </span>
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                connected ? "bg-success" : "bg-destructive animate-pulse"
              )}
            />
            {isFacilitator && (
              <span className="rounded-md bg-coffee/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-coffee">
                Facilitator
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {state.phase !== "lobby" && state.phase !== "closed" && (
            <div className="hidden sm:block">
              <PhaseIndicator phase={state.phase} />
            </div>
          )}
          <button
            onClick={onLeave}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            <LogOut width={14} height={14} />
            Leave
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile phase indicator */}
      {state.phase !== "lobby" && state.phase !== "closed" && (
        <div className="mt-3 overflow-x-auto sm:hidden">
          <PhaseIndicator phase={state.phase} />
        </div>
      )}

      {/* Divider */}
      <div className="my-5 h-0.5 bg-border" />

      {/* Phase content */}
      <div className="flex-1">
        {state.phase === "lobby" && (
          <LobbyPhase
            teamId={teamId}
            isFacilitator={isFacilitator}
            participantCount={state.participants.length}
            participants={state.participants}
            onStart={startRetro}
            onUnresolvedItems={setUnresolvedItems}
          />
        )}

        {state.phase === "haunting" && (
          <HauntingPhase
            actions={state.previousActions}
            unresolvedItems={unresolvedItems}
            isFacilitator={isFacilitator}
            onMark={markAction}
            onAdvance={advancePhase}
          />
        )}

        {state.phase === "writing" && (
          <WritingPhase
            cards={state.cards}
            myAnonymousId={myAnonymousId}
            onAddCard={addCard}
            onEditCard={editCard}
            onRemoveCard={removeCard}
            isFacilitator={isFacilitator}
            onAdvance={advancePhase}
            participantCount={state.participants.length}
            typingOthers={typingOthers}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
          />
        )}

        {state.phase === "grouping" && (
          <GroupingPhase
            cards={state.cards}
            groups={state.groups}
            cardPositions={state.cardPositions}
            cursors={cursors}
            myId={myId}
            isFacilitator={isFacilitator}
            onMoveCard={moveCardPosition}
            onScatterCards={scatterCards}
            onSendCursor={sendCursor}
            onRenameGroup={renameGroup}
            onAdvance={advancePhase}
          />
        )}

        {state.phase === "voting" && (
          <VotingPhase
            groups={state.groups}
            cards={state.cards}
            participants={state.participants}
            votes={state.votes}
            myVoteCount={myVoteCount}
            maxVotes={state.maxVotesPerPerson}
            myVotesByGroup={myVotesByGroup}
            isFacilitator={isFacilitator}
            onVote={castVote}
            onRemoveVote={removeVote}
            onAdvance={advancePhase}
          />
        )}

        {(state.phase === "discussing" || state.phase === "committing") && (
          <DiscussActPhase
            groups={state.groups}
            cards={state.cards}
            rankedGroupIds={state.rankedGroupIds}
            actionItems={state.actionItems}
            participants={state.participants}
            isFacilitator={isFacilitator}
            onAddItem={(text, assignees, groupId) =>
              addActionItem(text, assignees, groupId)
            }
            onRemoveItem={removeActionItem}
            onClose={closeRetro}
          />
        )}

        {state.phase === "closed" && (
          <ClosedPhase state={state} onDone={onLeave} />
        )}
      </div>
    </div>
  );
}

// ── Lobby Phase ──

function LobbyPhase({
  teamId,
  isFacilitator,
  participantCount,
  participants,
  onStart,
  onUnresolvedItems,
}: {
  teamId?: string;
  isFacilitator: boolean;
  participantCount: number;
  participants: ReadonlyArray<{ id: string; name: string }>;
  onStart: (options?: { teamId?: string; createdBy?: string; previousActions?: ReadonlyArray<import("@/lib/state-machines/retro").PreviousAction> }) => void;
  onUnresolvedItems: (items: ReadonlyArray<{ id: string; label: string; category?: string; voteCount?: number }>) => void;
}) {
  const { user } = useUser();
  const [previousActions, setPreviousActions] = useState<ReadonlyArray<import("@/lib/state-machines/retro").PreviousAction>>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch previous retro data when facilitator joins (requires a real team ID)
  useEffect(() => {
    if (!isFacilitator || !teamId || loaded) return;
    setLoadingActions(true);
    fetch(`/api/retros/previous-actions?teamId=${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.actions?.length > 0) {
          setPreviousActions(
            data.actions.map((a: { id: string; text: string; assignees: string[]; done: boolean }) => ({
              id: a.id,
              text: a.text,
              assignees: a.assignees ?? [],
              done: a.done,
            }))
          );
        }
        // Collect unresolved items: groups without action items
        const unresolved: Array<{ id: string; label: string; category?: string; voteCount?: number }> = [];
        if (data.groups?.length > 0) {
          for (const g of data.groups as Array<{ id: string; label: string; voteCount: number; hasActions: boolean }>) {
            if (!g.hasActions) {
              unresolved.push({ id: g.id, label: g.label, voteCount: g.voteCount });
            }
          }
        }
        onUnresolvedItems(unresolved);
      })
      .catch(() => {}) // DB might not be set up yet, that's OK
      .finally(() => {
        setLoadingActions(false);
        setLoaded(true);
      });
  }, [isFacilitator, teamId, loaded, onUnresolvedItems]);

  const handleStart = () => {
    onStart({
      teamId,
      createdBy: user?.id,
      previousActions: previousActions.length > 0 ? previousActions : undefined,
    });
  };

  return (
    <div className="stagger-in mx-auto max-w-md space-y-6 text-center">
      <div className="flex justify-center text-coffee">
        <GhostIcon size={64} />
      </div>
      <div>
        <h2 className="font-display text-3xl tracking-ceremony">
          Ready for retro?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {participantCount} participant{participantCount !== 1 ? "s" : ""}{" "}
          in the room
        </p>
      </div>

      {/* Participant list */}
      <div className="flex flex-wrap justify-center gap-2">
        {participants.map((p) => (
          <span
            key={p.id}
            className="rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-bold shadow-hard-sm"
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* Previous actions preview */}
      {previousActions.length > 0 && (
        <div className="rounded-md border-2 border-coffee/30 bg-coffee/5 p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-coffee mb-2">
            <GhostIcon size={12} className="inline mr-1" />
            {previousActions.length} action item{previousActions.length !== 1 ? "s" : ""} from last retro
          </p>
          {previousActions.slice(0, 3).map((a) => (
            <p key={a.id} className="text-xs text-muted-foreground truncate">
              {a.done ? "Done" : "Pending"}: {a.text}
            </p>
          ))}
          {previousActions.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{previousActions.length - 3} more...
            </p>
          )}
        </div>
      )}

      {isFacilitator ? (
        <Button
          onClick={handleStart}
          disabled={loadingActions}
          className="h-12"
          size="lg"
        >
          {loadingActions ? "Loading previous actions..." : "Start retro"}
        </Button>
      ) : (
        <p className="text-xs font-bold text-muted-foreground">
          Waiting for facilitator to start...
        </p>
      )}
    </div>
  );
}

// ── Closed Phase ──

function ClosedPhase({
  state,
  onDone,
}: {
  state: RetroState;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const stats = getRetroStats(state);

  // Build summary text grouped by topic
  const rankedGroups = state.rankedGroupIds
    .map((id) => state.groups.find((g) => g.id === id))
    .filter(Boolean) as ReadonlyArray<CardGroup>;
  const allGroups = [
    ...rankedGroups,
    ...state.groups.filter((g) => !state.rankedGroupIds.includes(g.id)),
  ];

  const summaryLines: string[] = [
    "Retro Summary",
    "=".repeat(40),
    `Cards: ${stats.totalCards} | Groups: ${stats.groupCount} | Actions: ${stats.actionCount}`,
    "",
  ];
  for (const group of allGroups) {
    const actions = state.actionItems.filter((a) => a.groupId === group.id);
    summaryLines.push(`## ${group.label} (${group.voteCount} votes)`);
    for (const a of actions) {
      summaryLines.push(`  - [ ] ${a.text}${a.assignees.length > 0 ? ` (${a.assignees.join(", ")})` : ""}`);
    }
    summaryLines.push("");
  }
  const generalActions = state.actionItems.filter((a) => !a.groupId);
  if (generalActions.length > 0) {
    summaryLines.push("## General");
    for (const a of generalActions) {
      summaryLines.push(`  - [ ] ${a.text}${a.assignees.length > 0 ? ` (${a.assignees.join(", ")})` : ""}`);
    }
  }
  const summaryText = summaryLines.join("\n");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [summaryText]);

  const handleDownloadCSV = useCallback(() => {
    const csv = generateCSV(
      ["Action Item", "Assignees", "Topic", "Votes"],
      state.actionItems.map((item) => {
        const group = state.groups.find((g) => g.id === item.groupId);
        return [
          item.text,
          item.assignees.join("; "),
          group?.label ?? "General",
          String(group?.voteCount ?? 0),
        ];
      })
    );
    downloadCSV(csv, `retro-actions-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [state]);

  return (
    <div className="stagger-in mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <GhostIcon size={64} className="mx-auto text-coffee" />
        <h2 className="mt-4 font-display text-3xl tracking-ceremony sm:text-4xl">
          Retro complete
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Great session. Here's your snapshot.
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4">
        <StatBox value={stats.totalCards} label="cards" />
        <StatBox value={stats.groupCount} label="groups" />
        <StatBox value={stats.actionCount} label="actions" />
      </div>

      {/* Snapshot: Topics + Action Items */}
      {allGroups.map((group, i) => {
        const actions = state.actionItems.filter((a) => a.groupId === group.id);
        if (group.voteCount === 0 && actions.length === 0) return null;
        return (
          <div key={group.id} className="rounded-md border-2 border-border bg-card p-4 shadow-hard-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 font-mono text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold">{group.label}</h3>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {group.voteCount} vote{group.voteCount !== 1 ? "s" : ""}
              </span>
            </div>
            {actions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {actions.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <GhostIcon size={14} className="mt-0.5 shrink-0 text-coffee" />
                    <div>
                      <span className="font-medium">{item.text}</span>
                      {item.assignees.length > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          ({item.assignees.join(", ")})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* General actions */}
      {generalActions.length > 0 && (
        <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            General action items
          </p>
          {generalActions.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm mb-1.5">
              <GhostIcon size={14} className="mt-0.5 shrink-0 text-coffee" />
              <span className="font-medium">{item.text}</span>
              {item.assignees.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({item.assignees.join(", ")})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCopy} variant="outline">
            {copied ? (
              <><Check width={16} height={16} /> Copied!</>
            ) : (
              <><Copy width={16} height={16} /> Copy summary</>
            )}
          </Button>
          {state.actionItems.length > 0 && (
            <Button onClick={handleDownloadCSV} variant="outline">
              <Download width={16} height={16} />
              Export actions
            </Button>
          )}
        </div>
        <Button onClick={onDone} className="w-full">
          Done
        </Button>
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md bg-muted px-4 py-3 text-center">
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

