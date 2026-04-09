"use client";

import { useState, useCallback, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardDeck } from "@/components/estimation/card-deck";
import { VoteCard } from "@/components/estimation/vote-card";
import { PhaseBanner } from "@/components/estimation/phase-banner";
import { FacilitatorControls } from "@/components/estimation/facilitator-controls";
import { SessionHistory } from "@/components/estimation/session-history";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useEstimationRoom } from "@/hooks/use-estimation-room";
import { useConfetti } from "@/hooks/use-confetti";
import { getVoteSpread, type CardValue, type CompletedEstimate } from "@/lib/state-machines/estimation";
import { cn } from "@/lib/utils";
import { OwlIcon } from "@/components/shared/icons";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { TicketInput } from "@/components/estimation/ticket-input";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { NavArrowLeft, LogOut, Copy, Check, FloppyDisk, Download } from "iconoir-react";
import { generateCSV, downloadCSV } from "@/lib/csv";

export default function EstimationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? undefined;
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    history: ReadonlyArray<CompletedEstimate>;
    participants: number;
    playerName: string;
    autoSaveTriggered: boolean;
  } | null>(null);

  if (sessionSummary) {
    return (
      <SessionSummaryScreen
        roomId={roomId}
        teamId={teamId}
        summary={sessionSummary}
        autoSaveTriggered={sessionSummary.autoSaveTriggered}
        onDone={() => {
          setSessionSummary(null);
          setJoined(false);
          setPlayerName("");
        }}
      />
    );
  }

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
    <EstimationRoom
      roomId={roomId}
      playerName={playerName}
      teamId={teamId}
      onLeave={() => {
        setJoined(false);
        setPlayerName("");
      }}
      onEndSession={(history, participants, autoSaved) => {
        setSessionSummary({ history, participants, playerName, autoSaveTriggered: autoSaved });
      }}
    />
  );
}

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
      {/* Back link */}
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
        {/* Owl mascot */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-md border-2 border-primary/40 bg-primary/10 text-primary shadow-hard">
          <OwlIcon size={52} />
        </div>

        <div>
          <h1 className="font-display text-4xl tracking-ceremony sm:text-5xl">
            Estimation
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
            className="h-12 border-2 border-border bg-card text-center font-bold shadow-hard placeholder:text-muted-foreground/50 focus:border-primary"
          />
          <Button
            onClick={onJoin}
            disabled={!name.trim()}
            className="h-12 w-full"
            size="lg"
          >
            Join room
          </Button>
        </div>
      </div>
    </div>
  );
}

function EstimationRoom({
  roomId,
  playerName,
  teamId,
  onLeave,
  onEndSession,
}: {
  roomId: string;
  playerName: string;
  teamId?: string;
  onLeave: () => void;
  onEndSession: (history: ReadonlyArray<CompletedEstimate>, participants: number, autoSaveTriggered: boolean) => void;
}) {
  const {
    state,
    myId,
    isFacilitator,
    connected,
    vote,
    loadTicket,
    reveal,
    discuss,
    agree,
    nextTicket,
    revote,
    nudge,
    nudgeReceived,
    saveSession,
    saveResult,
  } = useEstimationRoom({ roomId, playerName });

  const { fire: fireConfetti, reset: resetConfetti } = useConfetti();
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const [jiraConnected, setJiraConnected] = useState(false);

  // Check if team has Jira connected
  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/jira/${teamId}/status`)
      .then((r) => r.json())
      .then((data) => setJiraConnected(data.connected === true))
      .catch(() => setJiraConnected(false));
  }, [teamId]);

  // Clear card selection on new round
  useEffect(() => {
    if (state?.phase === "waiting" || state?.phase === "voting") {
      const myVote = state.votes.find((v) => v.odiedId === myId);
      if (!myVote) {
        setSelectedCard(null);
      }
    }
  }, [state?.phase, state?.votes, myId]);

  // Reset confetti when new round starts
  useEffect(() => {
    if (state?.phase === "voting" || state?.phase === "waiting") {
      resetConfetti();
    }
  }, [state?.phase, resetConfetti]);

  // Fire confetti on consensus
  useEffect(() => {
    if (!state) return;
    const isRevealed =
      state.phase === "revealed" ||
      state.phase === "discussing" ||
      state.phase === "agreed";
    if (isRevealed) {
      const spread = getVoteSpread(state.votes, state.participants.length);
      if (spread.hasConsensus) {
        fireConfetti();
      }
    }
  }, [state, fireConfetti]);

  const handleVote = useCallback(
    (value: CardValue) => {
      setSelectedCard(value);
      vote(value);
    },
    [vote]
  );

  const handleLoadTicket = useCallback(
    (ref: string, title: string, url?: string) => {
      loadTicket(ref, title, url);
      setSelectedCard(null);
    },
    [loadTicket]
  );

  const handleNextTicket = useCallback(() => {
    nextTicket();
    setSelectedCard(null);
  }, [nextTicket]);

  const handleEndSession = useCallback(() => {
    if (!state) return;
    // Include the current ticket in history if it has an estimate
    // (mirrors NEXT_TICKET logic in the state machine)
    let history = state.history;
    if (state.ticket && state.finalEstimate) {
      history = [
        ...history,
        {
          ticket: state.ticket,
          finalEstimate: state.finalEstimate,
          participantCount: state.participants.length,
          completedAt: Date.now(),
        },
      ];
    }
    // Auto-save via PartyKit server (no Clerk auth needed)
    const willAutoSave = isFacilitator && history.length > 0;
    if (willAutoSave) {
      saveSession(teamId);
    }
    onEndSession(history, state.participants.length, willAutoSave);
  }, [state, onEndSession, isFacilitator, saveSession, teamId]);

  // Loading state
  if (!state) {
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
        <ConnectionStatus connected={connected} hasState={false} />
        {connected && (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-4 h-4 w-32" />
            <div className="mt-12 flex justify-center gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-16 rounded-md" />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const isRevealed =
    state.phase === "revealed" ||
    state.phase === "discussing" ||
    state.phase === "agreed";

  const spread = isRevealed
    ? getVoteSpread(state.votes, state.participants.length)
    : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-6 sm:py-8">
      <ConnectionStatus connected={connected} hasState={!!state} />
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="relative top-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground shadow-hard-sm transition-colors hover:border-foreground/40 hover:text-foreground"
              aria-label="Back to home"
            >
              <NavArrowLeft width={16} height={16} />
            </Link>
            <h1 className="font-display text-3xl tracking-ceremony sm:text-4xl">
              Estimation
            </h1>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {state.participants.length} player{state.participants.length !== 1 ? "s" : ""}
            </span>
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                connected ? "bg-success" : "bg-destructive animate-pulse"
              )}
            />
            {isFacilitator && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Facilitator
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PhaseBanner phase={state.phase} ticketRef={state.ticket?.ref} />
          {/* Leave / End session */}
          {isFacilitator ? (
            <button
              onClick={handleEndSession}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive"
            >
              <LogOut width={14} height={14} />
              End
            </button>
          ) : (
            <button
              onClick={onLeave}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              <LogOut width={14} height={14} />
              Leave
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Divider */}
      <div className="my-5 h-0.5 bg-border" />

      {/* Session history */}
      <SessionHistory history={state.history} />

      {/* Ticket input (waiting phase, facilitator only) */}
      {state.phase === "waiting" && isFacilitator && (
        <TicketInput
          teamId={teamId}
          jiraConnected={jiraConnected}
          onLoad={handleLoadTicket}
        />
      )}

      {/* Waiting for facilitator */}
      {state.phase === "waiting" && !isFacilitator && (
        <div className="stagger-in rounded-md border-2 border-dashed border-border p-8 text-center">
          <div className="text-muted-foreground"><OwlIcon size={48} /></div>
          <p className="mt-3 text-sm font-bold tracking-wide text-muted-foreground">
            Waiting for facilitator...
          </p>
        </div>
      )}

      {/* Active estimation */}
      {state.ticket && (
        <div className="space-y-8">
          {/* Current ticket */}
          <div className="text-center">
            <span className="rounded-md bg-muted px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {state.ticket.ref}
            </span>
            {state.ticket.title !== state.ticket.ref && (
              <h2 className="mt-3 font-display text-xl font-bold tracking-ceremony">
                {state.ticket.title}
              </h2>
            )}
          </div>

          {/* Vote cards (all participants) */}
          <div className="flex flex-wrap items-end justify-center gap-5">
            {state.participants.map((p, i) => {
              const pVote = state.votes.find((v) => v.odiedId === p.id);
              return (
                <VoteCard
                  key={p.id}
                  name={p.name}
                  value={pVote?.value ?? null}
                  revealed={isRevealed}
                  isYou={p.id === myId}
                  index={i}
                />
              );
            })}
          </div>

          {/* Spread indicator */}
          {spread && (
            <div className="text-center space-y-1.5">
              {!spread.allVoted && (
                <p className="font-mono text-xs font-bold text-destructive/70">
                  {spread.voteCount}/{state.participants.length} voted
                </p>
              )}
              {spread.hasConsensus ? (
                <div className="consensus-enter">
                  <p className="font-display text-3xl tracking-ceremony text-primary">
                    Consensus!
                  </p>
                </div>
              ) : spread.min !== "-" ? (
                <p className="rounded-md bg-muted px-4 py-2 font-mono text-sm font-bold text-muted-foreground inline-block">
                  Spread: {spread.min} — {spread.max}
                </p>
              ) : null}
            </div>
          )}

          {/* Agreed estimate */}
          {state.phase === "agreed" && state.finalEstimate && (
            <div className="consensus-enter text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Final estimate
              </p>
              <p className="mt-2 inline-block rounded-md border-2 border-primary bg-primary/10 px-6 py-3 font-mono text-5xl font-bold text-primary shadow-hard sm:text-6xl">
                {state.finalEstimate === "coffee"
                  ? "☕"
                  : state.finalEstimate === "question"
                    ? "❓"
                    : state.finalEstimate}
              </p>
            </div>
          )}

          {/* Card deck (voting phase) */}
          {state.phase === "voting" && (
            <>
              <CardDeck
                selected={selectedCard}
                onSelect={handleVote}
                disabled={false}
              />
              {/* Nudge button */}
              {!isFacilitator &&
                selectedCard !== null &&
                state.votes.length >= state.participants.length && (
                  <div className="text-center">
                    <Button
                      onClick={nudge}
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      All voted — Nudge to reveal
                    </Button>
                  </div>
                )}
            </>
          )}

          {/* Facilitator controls */}
          <div className="flex justify-center">
            <FacilitatorControls
              state={state}
              isFacilitator={isFacilitator}
              nudgeReceived={nudgeReceived}
              onReveal={reveal}
              onDiscuss={discuss}
              onAgree={(value) => agree(value as CardValue)}
              onNextTicket={handleNextTicket}
              onRevote={() => {
                revote();
                setSelectedCard(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Session Summary Screen (Level 2) ──

const VALUE_DISPLAY: Record<CardValue, string> = {
  coffee: "☕", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "8": "8", "13": "13", question: "❓",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SessionSummaryScreen({
  roomId,
  teamId,
  summary,
  autoSaveTriggered,
  onDone,
}: {
  roomId: string;
  teamId?: string;
  summary: {
    history: ReadonlyArray<CompletedEstimate>;
    participants: number;
    playerName: string;
  };
  autoSaveTriggered: boolean;
  onDone: () => void;
}) {
  const { isSignedIn } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    autoSaveTriggered ? "saving" : "idle"
  );

  // Poll once to confirm auto-save completed
  useEffect(() => {
    if (!autoSaveTriggered) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/estimation/check?roomCode=${encodeURIComponent(roomId)}`
        );
        if (res.ok) {
          const data = await res.json() as { found: boolean };
          setSaveStatus(data.found ? "saved" : "error");
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoSaveTriggered, roomId]);

  const totalEstimated = summary.history.length;
  const estimates = summary.history.map((h) => h.finalEstimate);
  const numericEstimates = estimates
    .filter((e): e is CardValue => e !== "coffee" && e !== "question")
    .map(Number);
  const totalPoints = numericEstimates.reduce((sum, n) => sum + n, 0);

  const summaryText = [
    `Estimation Session Summary`,
    `${"─".repeat(30)}`,
    `Tickets estimated: ${totalEstimated}`,
    `Participants: ${summary.participants}`,
    `Total points: ${totalPoints}`,
    ``,
    ...summary.history.map(
      (h, i) =>
        `${i + 1}. ${h.ticket.ref === "Quick vote" ? `Quick vote #${i + 1}` : h.ticket.ref} → ${VALUE_DISPLAY[h.finalEstimate]}`
    ),
  ].join("\n");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [summaryText]);

  const handleDownloadCSV = useCallback(() => {
    const csv = generateCSV(
      ["#", "Ticket", "Estimate", "Participants", "Completed At"],
      summary.history.map((h, i) => [
        String(i + 1),
        h.ticket.ref === "Quick vote" ? `Quick vote #${i + 1}` : h.ticket.ref,
        VALUE_DISPLAY[h.finalEstimate],
        String(h.participantCount),
        new Date(h.completedAt).toISOString(),
      ])
    );
    downloadCSV(csv, `estimation-${roomId}.csv`);
  }, [summary.history, roomId]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/estimation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomId,
          teamId,
          participantCount: summary.participants,
          history: summary.history.map((h) => ({
            ticket: { ref: h.ticket.ref, title: h.ticket.title },
            finalEstimate: h.finalEstimate,
            participantCount: h.participantCount,
            completedAt: h.completedAt,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSaveStatus("saved");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSaveError(message);
      setSaveStatus("error");
    }
  }, [roomId, teamId, summary, saveStatus]);

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="stagger-in w-full max-w-md space-y-6 text-center">
        <OwlIcon size={64} className="mx-auto text-primary" />

        <div>
          <h1 className="font-display text-3xl tracking-ceremony sm:text-4xl">
            Session complete
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nice work, {summary.playerName}.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-4">
          <div className="rounded-md bg-muted px-4 py-3 text-center">
            <p className="font-mono text-2xl font-bold">{totalEstimated}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              tickets
            </p>
          </div>
          <div className="rounded-md bg-muted px-4 py-3 text-center">
            <p className="font-mono text-2xl font-bold">{summary.participants}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              players
            </p>
          </div>
          <div className="rounded-md bg-muted px-4 py-3 text-center">
            <p className="font-mono text-2xl font-bold">{totalPoints}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              points
            </p>
          </div>
        </div>

        {/* Estimate list */}
        {totalEstimated > 0 && (
          <EstimateResultsList history={summary.history} />
        )}

        {/* Save status */}
        {totalEstimated > 0 && (
          <div className="rounded-md border-2 border-dashed border-primary/30 bg-primary/5 p-4">
            {saveStatus === "saving" && (
              <p className="text-sm font-bold text-primary/80 animate-pulse">
                Saving session...
              </p>
            )}
            {saveStatus === "saved" && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">
                  Saved!
                </p>
                <p className="text-xs text-muted-foreground">
                  This session is now part of your history. The Haunting remembers.
                </p>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-destructive">
                  {autoSaveTriggered ? "Auto-save failed" : "Failed to save"}
                </p>
                {saveError && (
                  <p className="text-xs text-destructive/70">{saveError}</p>
                )}
                {isSignedIn ? (
                  <Button onClick={handleSave} variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                    <FloppyDisk width={16} height={16} />
                    Save manually
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    Sign in to save manually, or copy/download below.
                  </p>
                )}
              </div>
            )}
            {saveStatus === "idle" && !autoSaveTriggered && (
              <div className="space-y-2">
                {isSignedIn ? (
                  <>
                    <p className="text-sm font-bold text-primary/80">
                      Save this session?
                    </p>
                    <Button onClick={handleSave} variant="outline" className="mt-2 w-full border-primary/40 text-primary hover:bg-primary/10">
                      <FloppyDisk width={16} height={16} />
                      Save session
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    Session not saved. Copy or download below to keep your estimates.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          {totalEstimated > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <>
                      <Check width={16} height={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy width={16} height={16} />
                      Copy summary
                    </>
                  )}
                </Button>
                <Button onClick={handleDownloadCSV} variant="outline">
                  <Download width={16} height={16} />
                  Download CSV
                </Button>
              </div>
            </>
          )}
          <Button onClick={onDone} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Estimate Results with Sort ──

const ESTIMATE_ORDER: Record<string, number> = {
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "8": 8, "13": 13, coffee: 0, question: -1,
};

type SortMode = "chronological" | "highest" | "lowest";

function EstimateResultsList({
  history,
}: {
  history: ReadonlyArray<CompletedEstimate>;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("highest");

  const sorted = [...history].sort((a, b) => {
    if (sortMode === "chronological") return 0; // keep original order
    const aVal = ESTIMATE_ORDER[a.finalEstimate] ?? 0;
    const bVal = ESTIMATE_ORDER[b.finalEstimate] ?? 0;
    return sortMode === "highest" ? bVal - aVal : aVal - bVal;
  });

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Results
        </p>
        <div className="flex gap-1">
          {(["highest", "lowest", "chronological"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSortMode(mode)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                sortMode === mode
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "highest" ? "High→Low" : mode === "lowest" ? "Low→High" : "Order"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {sorted.map((item, i) => (
          <div
            key={`${item.ticket.ref}-${item.completedAt}`}
            className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
          >
            <span className="text-sm font-medium truncate mr-3">
              {item.ticket.ref === "Quick vote"
                ? `Quick vote #${history.indexOf(item) + 1}`
                : item.ticket.ref}
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
              {VALUE_DISPLAY[item.finalEstimate]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
