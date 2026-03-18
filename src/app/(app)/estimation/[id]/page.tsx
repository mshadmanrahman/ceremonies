"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardDeck } from "@/components/estimation/card-deck";
import { VoteCard } from "@/components/estimation/vote-card";
import { PhaseBanner } from "@/components/estimation/phase-banner";
import { FacilitatorControls } from "@/components/estimation/facilitator-controls";
import { useEstimationRoom } from "@/hooks/use-estimation-room";
import { getVoteSpread, type CardValue } from "@/lib/state-machines/estimation";
import { use } from "react";

/**
 * Estimation Room — real-time multiplayer via PartyKit.
 *
 * Flow:
 * 1. Enter your name to join
 * 2. Facilitator loads a ticket
 * 3. Everyone picks a card (hidden)
 * 4. Facilitator reveals all cards
 * 5. Discuss spread, agree on estimate
 * 6. Next ticket
 */

export default function EstimationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);

  if (!joined) {
    return <JoinScreen name={playerName} onNameChange={setPlayerName} onJoin={() => setJoined(true)} />;
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
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-lg font-medium tracking-tight">Join estimation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your name to join the room.
        </p>
        <div className="mt-6 space-y-3">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onJoin()}
            autoFocus
          />
          <Button
            onClick={onJoin}
            disabled={!name.trim()}
            className="w-full"
          >
            Join
          </Button>
        </div>
      </Card>
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
  } = useEstimationRoom({ roomId, playerName });

  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const [ticketInput, setTicketInput] = useState("");

  const handleVote = useCallback(
    (value: CardValue) => {
      setSelectedCard(value);
      vote(value);
    },
    [vote]
  );

  const handleLoadTicket = useCallback(() => {
    if (!ticketInput.trim()) return;
    loadTicket(ticketInput.trim(), ticketInput.trim());
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
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-4 w-32" />
        <Separator className="my-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const isRevealed =
    state.phase === "revealed" ||
    state.phase === "discussing" ||
    state.phase === "agreed";

  const spread = isRevealed ? getVoteSpread(state.votes) : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Estimation</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">
              {state.participants.length} participant
              {state.participants.length !== 1 ? "s" : ""}
            </p>
            <Badge variant={connected ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0">
              {connected ? "live" : "reconnecting"}
            </Badge>
            {isFacilitator && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                facilitator
              </Badge>
            )}
          </div>
        </div>
        <PhaseBanner phase={state.phase} ticketRef={state.ticket?.ref} />
      </div>

      <Separator className="my-6" />

      {/* Ticket input (waiting phase, facilitator only) */}
      {state.phase === "waiting" && isFacilitator && (
        <Card className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Enter a ticket reference to start estimating.
          </p>
          <div className="flex gap-2">
            <Input
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. INS-1234 or a description"
              onKeyDown={(e) => e.key === "Enter" && handleLoadTicket()}
            />
            <Button onClick={handleLoadTicket} disabled={!ticketInput.trim()}>
              Start
            </Button>
          </div>
        </Card>
      )}

      {/* Waiting message for non-facilitators */}
      {state.phase === "waiting" && !isFacilitator && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Waiting for the facilitator to load a ticket...
          </p>
        </Card>
      )}

      {/* Active estimation */}
      {state.ticket && (
        <div className="space-y-8">
          {/* Current ticket */}
          <div className="text-center">
            <span className="font-mono text-sm text-muted-foreground">
              {state.ticket.ref}
            </span>
            {state.ticket.title !== state.ticket.ref && (
              <h2 className="mt-1 text-xl font-medium">{state.ticket.title}</h2>
            )}
          </div>

          {/* Vote cards (all participants) */}
          <div className="flex flex-wrap items-end justify-center gap-4">
            {state.participants.map((p) => {
              const pVote = state.votes.find((v) => v.odiedId === p.id);
              return (
                <VoteCard
                  key={p.id}
                  name={p.id === myId ? `${p.name} (you)` : p.name}
                  value={pVote?.value ?? null}
                  revealed={isRevealed}
                />
              );
            })}
          </div>

          {/* Spread indicator */}
          {spread && (
            <div className="text-center">
              {spread.hasConsensus ? (
                <p className="text-sm font-medium text-[var(--happy)]">
                  Consensus!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Spread: {spread.min} — {spread.max}
                </p>
              )}
            </div>
          )}

          {/* Agreed estimate */}
          {state.phase === "agreed" && state.finalEstimate && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final estimate</p>
              <p className="mt-1 font-mono text-3xl font-bold">
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
            <CardDeck
              selected={selectedCard}
              onSelect={handleVote}
              disabled={false}
            />
          )}

          {/* Facilitator controls */}
          <div className="flex justify-center">
            <FacilitatorControls
              state={state}
              isFacilitator={isFacilitator}
              onReveal={reveal}
              onDiscuss={discuss}
              onAgree={(value) => agree(value as CardValue)}
              onNextTicket={handleNextTicket}
            />
          </div>
        </div>
      )}
    </div>
  );
}
