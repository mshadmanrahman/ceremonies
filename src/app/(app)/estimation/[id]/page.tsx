"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CardDeck } from "@/components/estimation/card-deck";
import { VoteCard } from "@/components/estimation/vote-card";
import { PhaseBanner } from "@/components/estimation/phase-banner";
import { FacilitatorControls } from "@/components/estimation/facilitator-controls";
import {
  createInitialState,
  transition,
  getVoteSpread,
  type EstimationState,
  type CardValue,
} from "@/lib/state-machines/estimation";

/**
 * Estimation room — local state only (PartyKit real-time comes next).
 *
 * This page demonstrates the full estimation flow:
 * 1. Facilitator loads a ticket
 * 2. Everyone votes (hidden)
 * 3. Facilitator reveals
 * 4. Discussion if spread is large
 * 5. Agree on final estimate
 * 6. Next ticket
 */

const DEMO_USER = { id: "facilitator-1", name: "You" };

export default function EstimationRoom() {
  const [state, setState] = useState<EstimationState>(() => {
    const initial = createInitialState(DEMO_USER.id);
    return transition(initial, {
      type: "PARTICIPANT_JOIN",
      participant: { ...DEMO_USER, joinedAt: Date.now() },
    });
  });
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const [ticketInput, setTicketInput] = useState("");

  const dispatch = useCallback(
    (event: Parameters<typeof transition>[1]) => {
      setState((prev) => transition(prev, event));
    },
    []
  );

  const handleLoadTicket = useCallback(() => {
    if (!ticketInput.trim()) return;
    dispatch({
      type: "LOAD_TICKET",
      ticket: { ref: ticketInput.trim(), title: ticketInput.trim() },
      facilitatorId: DEMO_USER.id,
    });
    setTicketInput("");
    setSelectedCard(null);
  }, [ticketInput, dispatch]);

  const handleVote = useCallback(
    (value: CardValue) => {
      setSelectedCard(value);
      dispatch({
        type: "CAST_VOTE",
        odiedId: DEMO_USER.id,
        odiedName: DEMO_USER.name,
        value,
      });
    },
    [dispatch]
  );

  const spread = state.phase === "revealed" || state.phase === "discussing"
    ? getVoteSpread(state.votes)
    : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Estimation</h1>
          <p className="text-sm text-muted-foreground">
            {state.participants.length} participant
            {state.participants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PhaseBanner phase={state.phase} ticketRef={state.ticket?.ref} />
      </div>

      <Separator className="my-6" />

      {/* Ticket input (waiting phase) */}
      {state.phase === "waiting" && (
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

      {/* Ticket display + voting area */}
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
              const vote = state.votes.find((v) => v.odiedId === p.id);
              return (
                <VoteCard
                  key={p.id}
                  name={p.name}
                  value={vote?.value ?? null}
                  revealed={
                    state.phase === "revealed" ||
                    state.phase === "discussing" ||
                    state.phase === "agreed"
                  }
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
              isFacilitator={true}
              onReveal={() =>
                dispatch({ type: "REVEAL", facilitatorId: DEMO_USER.id })
              }
              onDiscuss={() =>
                dispatch({
                  type: "START_DISCUSSION",
                  facilitatorId: DEMO_USER.id,
                })
              }
              onAgree={(value) =>
                dispatch({
                  type: "AGREE",
                  facilitatorId: DEMO_USER.id,
                  finalEstimate: value as CardValue,
                })
              }
              onNextTicket={() => {
                dispatch({ type: "NEXT_TICKET", facilitatorId: DEMO_USER.id });
                setSelectedCard(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
