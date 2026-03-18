"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import usePartySocket from "partysocket/react";
import type {
  EstimationState,
  EstimationEvent,
  CardValue,
} from "@/lib/state-machines/estimation";

interface UseEstimationRoomOptions {
  readonly roomId: string;
  readonly playerName: string;
}

interface UseEstimationRoomResult {
  readonly state: EstimationState | null;
  readonly myId: string | null;
  readonly isFacilitator: boolean;
  readonly connected: boolean;
  readonly vote: (value: CardValue) => void;
  readonly loadTicket: (ref: string, title: string) => void;
  readonly reveal: () => void;
  readonly discuss: () => void;
  readonly agree: (value: CardValue) => void;
  readonly nextTicket: () => void;
}

export function useEstimationRoom({
  roomId,
  playerName,
}: UseEstimationRoomOptions): UseEstimationRoomResult {
  const [state, setState] = useState<EstimationState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999",
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
      } else if (data.type === "update") {
        setState(data.state);
      }
    },
  });

  const send = useCallback(
    (event: EstimationEvent) => {
      socket.send(JSON.stringify(event));
    },
    [socket]
  );

  const vote = useCallback(
    (value: CardValue) => {
      send({
        type: "CAST_VOTE",
        odiedId: myId ?? "",
        odiedName: playerName,
        value,
      });
    },
    [send, myId, playerName]
  );

  const loadTicket = useCallback(
    (ref: string, title: string) => {
      send({
        type: "LOAD_TICKET",
        ticket: { ref, title },
        facilitatorId: myId ?? "",
      });
    },
    [send, myId]
  );

  const reveal = useCallback(() => {
    send({ type: "REVEAL", facilitatorId: myId ?? "" });
  }, [send, myId]);

  const discuss = useCallback(() => {
    send({ type: "START_DISCUSSION", facilitatorId: myId ?? "" });
  }, [send, myId]);

  const agree = useCallback(
    (value: CardValue) => {
      send({ type: "AGREE", facilitatorId: myId ?? "", finalEstimate: value });
    },
    [send, myId]
  );

  const nextTicket = useCallback(() => {
    send({ type: "NEXT_TICKET", facilitatorId: myId ?? "" });
  }, [send, myId]);

  const isFacilitator = Boolean(
    myId && state && state.facilitatorId === myId
  );

  return {
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
  };
}
