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
  } | null>(null);

  if (sessionSummary) {
    return (
      <SessionSummaryScreen
        roomId={roomId}
        teamId={teamId}
        summary={sessionSummary}
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
      onLeave={() => {
        setJoined(false);
        setPlayerName("");
      }}
      onEndSession={(history, participants) => {
        setSessionSummary({ history, participants, playerName });
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
  onLeave,
  onEndSession,
}: {
  roomId: string;
  playerName: string;
  onLeave: () => void;
  onEndSession: (history: ReadonlyArray<CompletedEstimate>, participants: number) => void;
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
  } = useEstimationRoom({ roomId, playerName });

  const { fire: fireConfetti, reset: resetConfetti } = useConfetti();
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const [ticketInput, setTicketInput] = useState("");

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

  const handleLoadTicket = useCallback(() => {
    const ref = ticketInput.trim() || "Quick vote";
    loadTicket(ref, ref);
    setTicketInput("");
    setSelectedCard(null);
  }, [ticketInput, loadTicket]);

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
    onEndSession(history, state.participants.length);
  }, [state, onEndSession]);

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
        <div className="stagger-in rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
          <p className="mb-4 text-sm font-bold tracking-wide text-primary/80">
            What are we estimating?
          </p>
          <div className="mx-auto flex max-w-md gap-2">
            <Input
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. INS-1234 (optional)"
              onKeyDown={(e) => e.key === "Enter" && handleLoadTicket()}
              className="h-11 border-2 border-border bg-card text-center shadow-hard-sm"
            />
            <Button
              onClick={handleLoadTicket}
              className="h-11"
            >
              {ticketInput.trim() ? "Start" : "Quick vote"}
            </Button>
          </div>
        </div>
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
  onDone,
}: {
  roomId: string;
  teamId?: string;
  summary: {
    history: ReadonlyArray<CompletedEstimate>;
    participants: number;
    playerName: string;
  };
  onDone: () => void;
}) {
  const { isSignedIn } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

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

  const handleSave = useCallback(async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");

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

      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [roomId, summary, saveStatus]);

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
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Results
            </p>
            <div className="space-y-1.5">
              {summary.history.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                >
                  <span className="text-sm font-medium truncate mr-3">
                    {item.ticket.ref === "Quick vote"
                      ? `Quick vote #${i + 1}`
                      : item.ticket.ref}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
                    {VALUE_DISPLAY[item.finalEstimate]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save prompt */}
        {totalEstimated > 0 && (
          <div className="rounded-md border-2 border-dashed border-primary/30 bg-primary/5 p-4">
            {isSignedIn ? (
              <>
                {saveStatus === "idle" && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-primary/80">
                      Save this session?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saved sessions unlock The Haunting: past action items follow you into your next retro.
                    </p>
                    <Button onClick={handleSave} variant="outline" className="mt-2 w-full border-primary/40 text-primary hover:bg-primary/10">
                      <FloppyDisk width={16} height={16} />
                      Save session
                    </Button>
                  </div>
                )}
                {saveStatus === "saving" && (
                  <p className="text-sm font-bold text-primary/80 animate-pulse">
                    Saving...
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
                      Failed to save
                    </p>
                    <Button onClick={handleSave} variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                      Try again
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">
                  Sign in to save sessions
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Without saving, your estimates vanish. No haunting. No accountability.
                </p>
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
