"use client";

import { useState, useCallback, useEffect, use } from "react";
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
import { getVoteSpread, type CardValue } from "@/lib/state-machines/estimation";
import { cn } from "@/lib/utils";
import { OwlIcon } from "@/components/shared/icons";

export default function EstimationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
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

  return <EstimationRoom roomId={roomId} playerName={playerName} />;
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
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="stagger-in w-full max-w-sm space-y-8 text-center">
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
}: {
  roomId: string;
  playerName: string;
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

  // Loading state
  if (!state) {
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-4 w-32" />
        <div className="mt-12 flex justify-center gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-16 rounded-md" />
          ))}
        </div>
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
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-ceremony sm:text-4xl">
            Estimation
          </h1>
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
              <span className="rounded-md border-2 border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Facilitator
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PhaseBanner phase={state.phase} ticketRef={state.ticket?.ref} />
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
            <span className="rounded-md border-2 border-border bg-card px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-hard-sm">
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
                <p className="rounded-lg border-2 border-border bg-card px-4 py-2 font-mono text-sm font-bold text-muted-foreground shadow-hard-sm inline-block">
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
