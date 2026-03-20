"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import usePartySocket from "partysocket/react";
import type {
  RetroState,
  CardCategory,
  CardPosition,
  CursorPosition,
  PreviousAction,
} from "@/lib/state-machines/retro";

interface UseRetroRoomOptions {
  readonly roomId: string;
  readonly playerName: string;
}

interface UseRetroRoomResult {
  readonly state: RetroState | null;
  readonly myId: string | null;
  readonly myAnonymousId: string | null;
  readonly isFacilitator: boolean;
  readonly connected: boolean;

  // Lobby
  readonly startRetro: (options?: { teamId?: string; createdBy?: string; previousActions?: ReadonlyArray<PreviousAction> }) => void;

  // Haunting
  readonly markAction: (actionId: string, done: boolean) => void;

  // Phase control
  readonly advancePhase: () => void;

  // Writing (anonymous)
  readonly addCard: (category: CardCategory, text: string) => void;
  readonly removeCard: (cardId: string) => void;

  // Grouping (canvas)
  readonly moveCardPosition: (cardId: string, x: number, y: number) => void;
  readonly scatterCards: (positions: Record<string, CardPosition>) => void;
  readonly sendCursor: (x: number, y: number) => void;
  readonly cursors: ReadonlyMap<string, CursorPosition>;
  readonly createGroup: (label: string, cardIds?: ReadonlyArray<string>) => void;
  readonly renameGroup: (groupId: string, label: string) => void;
  readonly moveCardToGroup: (cardId: string, groupId: string) => void;
  readonly removeCardFromGroup: (cardId: string, groupId: string) => void;

  // Voting
  readonly castVote: (groupId: string) => void;
  readonly removeVote: (groupId: string) => void;
  readonly myVoteCount: number;

  // Discussion
  readonly setTimer: (seconds: number) => void;
  readonly toggleTimer: () => void;
  readonly nextTopic: () => void;

  // Committing
  readonly addActionItem: (text: string, assignees: ReadonlyArray<string>, groupId?: string | null) => void;
  readonly removeActionItem: (itemId: string) => void;
  readonly updateActionItem: (itemId: string, text?: string, assignees?: ReadonlyArray<string>) => void;

  // Close
  readonly closeRetro: () => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useRetroRoom({
  roomId,
  playerName,
}: UseRetroRoomOptions): UseRetroRoomResult {
  const [state, setState] = useState<RetroState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [myAnonymousId, setMyAnonymousId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState<ReadonlyMap<string, CursorPosition>>(new Map());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999",
    party: "retro",
    room: roomId,
    query: { name: playerName },
    onOpen() {
      setConnected(true);
    },
    onClose() {
      setConnected(false);
    },
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "sync") {
        setState(data.state);
        setMyId(data.you);
        setMyAnonymousId(data.anonymousId);
      } else if (data.type === "update") {
        setState(data.state);
      } else if (data.type === "cursor") {
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(data.participantId, {
            participantId: data.participantId,
            name: data.name,
            x: data.x,
            y: data.y,
          });
          return next;
        });
      }
    },
  });

  const send = useCallback(
    (event: Record<string, unknown>) => {
      socket.send(JSON.stringify(event));
    },
    [socket]
  );

  // ── Lobby ──

  const startRetro = useCallback(
    (options?: { teamId?: string; createdBy?: string; previousActions?: ReadonlyArray<PreviousAction> }) => {
      send({
        type: "START_RETRO",
        facilitatorId: myId,
        teamId: options?.teamId,
        createdBy: options?.createdBy,
        previousActions: options?.previousActions,
      });
    },
    [send, myId]
  );

  // ── Haunting ──

  const markAction = useCallback(
    (actionId: string, done: boolean) => {
      send({ type: "MARK_ACTION", facilitatorId: myId, actionId, done });
    },
    [send, myId]
  );

  // ── Phase control ──

  const advancePhase = useCallback(() => {
    send({ type: "ADVANCE_PHASE", facilitatorId: myId });
  }, [send, myId]);

  // ── Writing ──

  const addCard = useCallback(
    (category: CardCategory, text: string) => {
      send({ type: "ADD_CARD", category, text });
    },
    [send]
  );

  const removeCard = useCallback(
    (cardId: string) => {
      send({ type: "REMOVE_CARD", cardId, anonymousId: myAnonymousId });
    },
    [send, myAnonymousId]
  );

  // ── Grouping (canvas) ──

  const moveCardPosition = useCallback(
    (cardId: string, x: number, y: number) => {
      send({ type: "MOVE_CARD_POSITION", cardId, x, y });
    },
    [send]
  );

  const scatterCards = useCallback(
    (positions: Record<string, CardPosition>) => {
      send({ type: "SCATTER_CARDS", positions });
    },
    [send]
  );

  const sendCursor = useCallback(
    (x: number, y: number) => {
      send({ type: "CURSOR_MOVE", x, y });
    },
    [send]
  );

  const createGroup = useCallback(
    (label: string, cardIds?: ReadonlyArray<string>) => {
      send({
        type: "CREATE_GROUP",
        group: {
          id: generateId(),
          label,
          cardIds: cardIds ?? [],
          voteCount: 0,
        },
      });
    },
    [send]
  );

  const renameGroup = useCallback(
    (groupId: string, label: string) => {
      send({ type: "RENAME_GROUP", groupId, label });
    },
    [send]
  );

  const moveCardToGroup = useCallback(
    (cardId: string, groupId: string) => {
      send({ type: "MOVE_CARD_TO_GROUP", cardId, groupId });
    },
    [send]
  );

  const removeCardFromGroup = useCallback(
    (cardId: string, groupId: string) => {
      send({ type: "REMOVE_CARD_FROM_GROUP", cardId, groupId });
    },
    [send]
  );

  // ── Voting ──

  const castVote = useCallback(
    (groupId: string) => {
      send({ type: "CAST_VOTE", odiedId: myId, groupId });
    },
    [send, myId]
  );

  const removeVote = useCallback(
    (groupId: string) => {
      send({ type: "REMOVE_VOTE", odiedId: myId, groupId });
    },
    [send, myId]
  );

  const myVoteCount = state?.votes.filter((v) => v.odiedId === myId).length ?? 0;

  // ── Discussion ──

  const setTimer = useCallback(
    (seconds: number) => {
      send({ type: "SET_TIMER", facilitatorId: myId, seconds });
    },
    [send, myId]
  );

  const toggleTimer = useCallback(() => {
    send({ type: "TOGGLE_TIMER", facilitatorId: myId });
  }, [send, myId]);

  const nextTopic = useCallback(() => {
    send({ type: "NEXT_TOPIC", facilitatorId: myId });
  }, [send, myId]);

  // ── Committing ──

  const addActionItem = useCallback(
    (text: string, assignees: ReadonlyArray<string>, groupId?: string | null) => {
      send({
        type: "ADD_ACTION_ITEM",
        item: {
          id: generateId(),
          text,
          assignees,
          groupId: groupId ?? null,
          createdAt: Date.now(),
        },
      });
    },
    [send]
  );

  const removeActionItem = useCallback(
    (itemId: string) => {
      send({ type: "REMOVE_ACTION_ITEM", facilitatorId: myId, itemId });
    },
    [send, myId]
  );

  const updateActionItem = useCallback(
    (itemId: string, text?: string, assignees?: ReadonlyArray<string>) => {
      send({ type: "UPDATE_ACTION_ITEM", itemId, text, assignees });
    },
    [send]
  );

  // ── Close ──

  const closeRetro = useCallback(() => {
    send({ type: "CLOSE_RETRO", facilitatorId: myId });
  }, [send, myId]);

  const isFacilitator = Boolean(myId && state && state.facilitatorId === myId);

  return {
    state,
    myId,
    myAnonymousId,
    isFacilitator,
    connected,
    startRetro,
    markAction,
    advancePhase,
    addCard,
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
  };
}
