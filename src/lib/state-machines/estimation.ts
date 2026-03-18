/**
 * Estimation ceremony state machine.
 *
 * States: waiting → voting → revealed → discussing → agreed → (next or closed)
 * Only the facilitator can advance phases.
 * Votes are hidden until the facilitator triggers reveal.
 */

export const CARD_VALUES = [
  "coffee",
  "1",
  "2",
  "3",
  "4",
  "5",
  "8",
  "13",
  "question",
] as const;

export type CardValue = (typeof CARD_VALUES)[number];

export type EstimationPhase =
  | "waiting"
  | "voting"
  | "revealed"
  | "discussing"
  | "agreed";

export interface Vote {
  readonly odiedId: string;
  readonly odiedName: string;
  readonly value: CardValue;
  readonly votedAt: number;
}

export interface EstimationTicket {
  readonly ref: string;
  readonly title: string;
  readonly url?: string;
}

export interface EstimationState {
  readonly phase: EstimationPhase;
  readonly facilitatorId: string;
  readonly ticket: EstimationTicket | null;
  readonly votes: ReadonlyArray<Vote>;
  readonly finalEstimate: CardValue | null;
  readonly participants: ReadonlyArray<Participant>;
}

export interface Participant {
  readonly id: string;
  readonly name: string;
  readonly joinedAt: number;
}

export type EstimationEvent =
  | { type: "LOAD_TICKET"; ticket: EstimationTicket; facilitatorId: string }
  | { type: "CAST_VOTE"; odiedId: string; odiedName: string; value: CardValue }
  | { type: "REVEAL"; facilitatorId: string }
  | { type: "START_DISCUSSION"; facilitatorId: string }
  | { type: "AGREE"; facilitatorId: string; finalEstimate: CardValue }
  | { type: "NEXT_TICKET"; facilitatorId: string }
  | { type: "PARTICIPANT_JOIN"; participant: Participant }
  | { type: "PARTICIPANT_LEAVE"; participantId: string };

export function createInitialState(facilitatorId: string): EstimationState {
  return {
    phase: "waiting",
    facilitatorId,
    ticket: null,
    votes: [],
    finalEstimate: null,
    participants: [],
  };
}

function isFacilitator(state: EstimationState, id: string): boolean {
  return state.facilitatorId === id;
}

function hasEveryoneVoted(state: EstimationState): boolean {
  const participantIds = new Set(state.participants.map((p) => p.id));
  const voterIds = new Set(state.votes.map((v) => v.odiedId));
  return participantIds.size > 0 && participantIds.size === voterIds.size;
}

export function transition(
  state: EstimationState,
  event: EstimationEvent
): EstimationState {
  switch (event.type) {
    case "PARTICIPANT_JOIN": {
      const exists = state.participants.some(
        (p) => p.id === event.participant.id
      );
      if (exists) return state;
      return {
        ...state,
        participants: [...state.participants, event.participant],
      };
    }

    case "PARTICIPANT_LEAVE": {
      return {
        ...state,
        participants: state.participants.filter(
          (p) => p.id !== event.participantId
        ),
        votes: state.votes.filter((v) => v.odiedId !== event.participantId),
      };
    }

    case "LOAD_TICKET": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return {
        ...state,
        phase: "voting",
        ticket: event.ticket,
        votes: [],
        finalEstimate: null,
      };
    }

    case "CAST_VOTE": {
      if (state.phase !== "voting") return state;
      const withoutPrevious = state.votes.filter(
        (v) => v.odiedId !== event.odiedId
      );
      const newVote: Vote = {
        odiedId: event.odiedId,
        odiedName: event.odiedName,
        value: event.value,
        votedAt: Date.now(),
      };
      return {
        ...state,
        votes: [...withoutPrevious, newVote],
      };
    }

    case "REVEAL": {
      if (state.phase !== "voting") return state;
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return { ...state, phase: "revealed" };
    }

    case "START_DISCUSSION": {
      if (state.phase !== "revealed") return state;
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return { ...state, phase: "discussing" };
    }

    case "AGREE": {
      if (state.phase !== "discussing" && state.phase !== "revealed")
        return state;
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return {
        ...state,
        phase: "agreed",
        finalEstimate: event.finalEstimate,
      };
    }

    case "NEXT_TICKET": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return {
        ...state,
        phase: "waiting",
        ticket: null,
        votes: [],
        finalEstimate: null,
      };
    }

    default:
      return state;
  }
}

export function getVoteSpread(votes: ReadonlyArray<Vote>): {
  min: string;
  max: string;
  hasConsensus: boolean;
} {
  const numericVotes = votes.filter(
    (v) => v.value !== "coffee" && v.value !== "question"
  );
  if (numericVotes.length === 0) {
    return { min: "-", max: "-", hasConsensus: true };
  }
  const values = numericVotes.map((v) => parseInt(v.value, 10));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    min: String(min),
    max: String(max),
    hasConsensus: min === max,
  };
}
