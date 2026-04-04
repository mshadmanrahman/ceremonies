/**
 * Retro ceremony state machine.
 *
 * Phases: haunting → writing → grouping → voting → discussing → committing → closed
 *
 * Key design decisions:
 * - Writing phase is TRUE anonymous: server strips sender identity, assigns random IDs
 * - Votes are anonymous (3 per person on groups)
 * - Facilitator controls phase transitions (enforced, can't skip)
 * - Action items persist for next retro's "Haunting" phase
 */

// ── Types ──

export type RetroPhase =
  | "lobby"
  | "haunting"
  | "writing"
  | "grouping"
  | "voting"
  | "discussing"
  | "committing"
  | "closed";

export type CardCategory = "happy" | "sad" | "confused";

export interface CardPosition {
  readonly x: number;
  readonly y: number;
}

export interface RetroCard {
  readonly id: string;
  readonly category: CardCategory;
  readonly text: string;
  readonly anonymousId: string; // NOT the real participant ID
  readonly createdAt: number;
}

export interface CardGroup {
  readonly id: string;
  readonly label: string;
  readonly cardIds: ReadonlyArray<string>;
  readonly voteCount: number;
}

/** Cursor visible to other participants on the canvas */
export interface CursorPosition {
  readonly participantId: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

export interface RetroVote {
  readonly odiedId: string; // real participant ID (server-side only for dedup)
  readonly groupId: string;
}

export interface ActionItem {
  readonly id: string;
  readonly text: string;
  readonly assignees: ReadonlyArray<string>; // participant names
  readonly groupId: string | null; // which topic this action belongs to
  readonly createdAt: number;
}

export interface PreviousAction {
  readonly id: string;
  readonly text: string;
  readonly assignees: ReadonlyArray<string>;
  readonly done: boolean | null; // null = not yet reviewed
}

export interface Participant {
  readonly id: string;
  readonly name: string;
  readonly joinedAt: number;
}

export interface DiscussionState {
  readonly currentGroupIndex: number;
  readonly timerSeconds: number; // time allocated per topic
  readonly timerRunning: boolean;
  readonly timerRemaining: number; // seconds left
}

export interface RetroState {
  readonly phase: RetroPhase;
  readonly facilitatorId: string;
  readonly teamId: string | null; // set when retro starts (from authenticated user)
  readonly createdBy: string | null; // Clerk user ID of facilitator
  readonly participants: ReadonlyArray<Participant>;
  readonly previousActions: ReadonlyArray<PreviousAction>;
  readonly cards: ReadonlyArray<RetroCard>;
  readonly cardPositions: Readonly<Record<string, CardPosition>>; // cardId → {x, y}
  readonly groups: ReadonlyArray<CardGroup>;
  readonly votes: ReadonlyArray<RetroVote>;
  readonly maxVotesPerPerson: number;
  readonly discussion: DiscussionState;
  readonly actionItems: ReadonlyArray<ActionItem>;
  readonly rankedGroupIds: ReadonlyArray<string>; // groups sorted by votes for discussion
  readonly renamedLabels: Readonly<Record<string, string>>; // fingerprint(cardIds) → user label
}

// ── Events ──

export type RetroEvent =
  | { type: "PARTICIPANT_JOIN"; participant: Participant }
  | { type: "PARTICIPANT_LEAVE"; participantId: string }
  | { type: "START_RETRO"; facilitatorId: string; teamId?: string; createdBy?: string; previousActions?: ReadonlyArray<PreviousAction> }
  | { type: "MARK_ACTION"; facilitatorId: string; actionId: string; done: boolean }
  | { type: "ADVANCE_PHASE"; facilitatorId: string }
  | { type: "ADD_CARD"; card: RetroCard }
  | { type: "EDIT_CARD"; cardId: string; text: string; anonymousId: string }
  | { type: "REMOVE_CARD"; cardId: string; anonymousId: string }
  | { type: "MOVE_CARD_POSITION"; cardId: string; x: number; y: number }
  | { type: "SCATTER_CARDS"; positions: Readonly<Record<string, CardPosition>> }
  | { type: "CREATE_GROUP"; group: CardGroup }
  | { type: "RENAME_GROUP"; groupId: string; label: string }
  | { type: "MOVE_CARD_TO_GROUP"; cardId: string; groupId: string }
  | { type: "REMOVE_CARD_FROM_GROUP"; cardId: string; groupId: string }
  | { type: "CAST_VOTE"; odiedId: string; groupId: string }
  | { type: "REMOVE_VOTE"; odiedId: string; groupId: string }
  | { type: "SET_TIMER"; facilitatorId: string; seconds: number }
  | { type: "TOGGLE_TIMER"; facilitatorId: string }
  | { type: "TICK_TIMER" }
  | { type: "NEXT_TOPIC"; facilitatorId: string }
  | { type: "ADD_ACTION_ITEM"; item: ActionItem }
  | { type: "REMOVE_ACTION_ITEM"; facilitatorId: string; itemId: string }
  | { type: "UPDATE_ACTION_ITEM"; itemId: string; text?: string; assignees?: ReadonlyArray<string> }
  | { type: "CLOSE_RETRO"; facilitatorId: string };

// ── Initial State ──

export function createInitialState(facilitatorId: string): RetroState {
  return {
    phase: "lobby",
    facilitatorId,
    teamId: null,
    createdBy: null,
    participants: [],
    previousActions: [],
    cards: [],
    cardPositions: {},
    groups: [],
    votes: [],
    maxVotesPerPerson: 3,
    discussion: {
      currentGroupIndex: 0,
      timerSeconds: 300, // 5 minutes default
      timerRunning: false,
      timerRemaining: 300,
    },
    actionItems: [],
    rankedGroupIds: [],
    renamedLabels: {},
  };
}

// ── Helpers ──

function isFacilitator(state: RetroState, id: string): boolean {
  return state.facilitatorId === id;
}

function getVotesForPerson(votes: ReadonlyArray<RetroVote>, odiedId: string): number {
  return votes.filter((v) => v.odiedId === odiedId).length;
}

function rankGroups(groups: ReadonlyArray<CardGroup>): ReadonlyArray<string> {
  return [...groups]
    .sort((a, b) => b.voteCount - a.voteCount)
    .filter((g) => g.voteCount > 0)
    .map((g) => g.id);
}

/** Stable key for a group based on its member cards — used to persist user-renamed labels */
function groupFingerprint(cardIds: ReadonlyArray<string>): string {
  return [...cardIds].sort().join(",");
}

function recalcGroupVotes(
  groups: ReadonlyArray<CardGroup>,
  votes: ReadonlyArray<RetroVote>
): ReadonlyArray<CardGroup> {
  return groups.map((g) => ({
    ...g,
    voteCount: votes.filter((v) => v.groupId === g.id).length,
  }));
}

// ── Phase Order ──

const PHASE_ORDER: ReadonlyArray<RetroPhase> = [
  "lobby",
  "haunting",
  "writing",
  "grouping",
  "voting",
  "discussing",
  "committing",
  "closed",
];

function nextPhase(current: RetroPhase): RetroPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

// ── Transition ──

export function transition(state: RetroState, event: RetroEvent): RetroState {
  switch (event.type) {
    case "PARTICIPANT_JOIN": {
      const exists = state.participants.some((p) => p.id === event.participant.id);
      if (exists) return state;
      return {
        ...state,
        participants: [...state.participants, event.participant],
      };
    }

    case "PARTICIPANT_LEAVE": {
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== event.participantId),
        votes: state.votes.filter((v) => v.odiedId !== event.participantId),
      };
    }

    case "START_RETRO": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      if (state.phase !== "lobby") return state;
      const hasActions = (event.previousActions ?? []).length > 0;
      return {
        ...state,
        phase: hasActions ? "haunting" : "writing",
        teamId: event.teamId ?? state.teamId,
        createdBy: event.createdBy ?? state.createdBy,
        previousActions: (event.previousActions ?? []).map((a) => ({
          ...a,
          done: null,
        })),
      };
    }

    case "MARK_ACTION": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      if (state.phase !== "haunting") return state;
      return {
        ...state,
        previousActions: state.previousActions.map((a) =>
          a.id === event.actionId ? { ...a, done: event.done } : a
        ),
      };
    }

    case "ADVANCE_PHASE": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      const next = nextPhase(state.phase);
      if (!next) return state;

      // When advancing to discussing, compute ranked groups
      if (next === "discussing") {
        const ranked = rankGroups(state.groups);
        return {
          ...state,
          phase: next,
          rankedGroupIds: ranked,
          discussion: {
            ...state.discussion,
            currentGroupIndex: 0,
            timerRemaining: state.discussion.timerSeconds,
            timerRunning: false,
          },
        };
      }

      // When advancing to voting, auto-group ungrouped cards
      if (next === "voting") {
        const groupedCardIds = new Set(state.groups.flatMap((g) => g.cardIds));
        const ungrouped = state.cards.filter((c) => !groupedCardIds.has(c.id));
        const newGroups = ungrouped.map((c) => ({
          id: `auto-${c.id}`,
          label: c.text.slice(0, 40),
          cardIds: [c.id] as ReadonlyArray<string>,
          voteCount: 0,
        }));
        return {
          ...state,
          phase: next,
          groups: [...state.groups, ...newGroups],
        };
      }

      return { ...state, phase: next };
    }

    case "ADD_CARD": {
      if (state.phase !== "writing") return state;
      return {
        ...state,
        cards: [...state.cards, event.card],
      };
    }

    case "EDIT_CARD": {
      if (state.phase !== "writing") return state;
      const editTarget = state.cards.find((c) => c.id === event.cardId);
      if (!editTarget || editTarget.anonymousId !== event.anonymousId) return state;
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === event.cardId ? { ...c, text: event.text } : c
        ),
      };
    }

    case "REMOVE_CARD": {
      if (state.phase !== "writing") return state;
      const card = state.cards.find((c) => c.id === event.cardId);
      if (!card || card.anonymousId !== event.anonymousId) return state;
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== event.cardId),
      };
    }

    case "MOVE_CARD_POSITION": {
      if (state.phase !== "grouping") return state;
      const newPositions = {
        ...state.cardPositions,
        [event.cardId]: { x: event.x, y: event.y },
      };
      // Auto-group by proximity after every move, then restore any user-renamed labels
      const rawGroups = computeProximityGroups(state.cards, newPositions);
      const newGroups = rawGroups.map((g) => {
        const fp = groupFingerprint(g.cardIds);
        const savedLabel = state.renamedLabels[fp];
        return savedLabel ? { ...g, label: savedLabel } : g;
      });
      return {
        ...state,
        cardPositions: newPositions,
        groups: newGroups,
      };
    }

    case "SCATTER_CARDS": {
      return {
        ...state,
        cardPositions: event.positions,
      };
    }

    case "CREATE_GROUP": {
      if (state.phase !== "grouping") return state;
      return {
        ...state,
        groups: [...state.groups, event.group],
      };
    }

    case "RENAME_GROUP": {
      if (state.phase !== "grouping") return state;
      const target = state.groups.find((g) => g.id === event.groupId);
      if (!target) return state;
      const fp = groupFingerprint(target.cardIds);
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === event.groupId ? { ...g, label: event.label } : g
        ),
        renamedLabels: { ...state.renamedLabels, [fp]: event.label },
      };
    }

    case "MOVE_CARD_TO_GROUP": {
      if (state.phase !== "grouping") return state;
      // Remove from all other groups first
      const cleaned = state.groups.map((g) => ({
        ...g,
        cardIds: g.cardIds.filter((id) => id !== event.cardId),
      }));
      return {
        ...state,
        groups: cleaned.map((g) =>
          g.id === event.groupId
            ? { ...g, cardIds: [...g.cardIds, event.cardId] }
            : g
        ),
      };
    }

    case "REMOVE_CARD_FROM_GROUP": {
      if (state.phase !== "grouping") return state;
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === event.groupId
            ? { ...g, cardIds: g.cardIds.filter((id) => id !== event.cardId) }
            : g
        ),
      };
    }

    case "CAST_VOTE": {
      if (state.phase !== "voting") return state;
      // Check vote limit
      if (getVotesForPerson(state.votes, event.odiedId) >= state.maxVotesPerPerson) {
        return state;
      }
      // Can vote multiple times on same group (stacking)
      const newVotes = [...state.votes, { odiedId: event.odiedId, groupId: event.groupId }];
      const updatedGroups = recalcGroupVotes(state.groups, newVotes);
      return {
        ...state,
        votes: newVotes,
        groups: updatedGroups,
      };
    }

    case "REMOVE_VOTE": {
      if (state.phase !== "voting") return state;
      // Remove first matching vote for this person on this group
      let removed = false;
      const newVotes = state.votes.filter((v) => {
        if (!removed && v.odiedId === event.odiedId && v.groupId === event.groupId) {
          removed = true;
          return false;
        }
        return true;
      });
      if (!removed) return state;
      const updatedGroups = recalcGroupVotes(state.groups, newVotes);
      return {
        ...state,
        votes: newVotes,
        groups: updatedGroups,
      };
    }

    case "SET_TIMER": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      return {
        ...state,
        discussion: {
          ...state.discussion,
          timerSeconds: event.seconds,
          timerRemaining: event.seconds,
        },
      };
    }

    case "TOGGLE_TIMER": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      if (state.phase !== "discussing") return state;
      return {
        ...state,
        discussion: {
          ...state.discussion,
          timerRunning: !state.discussion.timerRunning,
        },
      };
    }

    case "TICK_TIMER": {
      if (state.phase !== "discussing") return state;
      if (!state.discussion.timerRunning) return state;
      if (state.discussion.timerRemaining <= 0) return state;
      return {
        ...state,
        discussion: {
          ...state.discussion,
          timerRemaining: state.discussion.timerRemaining - 1,
        },
      };
    }

    case "NEXT_TOPIC": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      if (state.phase !== "discussing") return state;
      const nextIdx = state.discussion.currentGroupIndex + 1;
      if (nextIdx >= state.rankedGroupIds.length) return state;
      return {
        ...state,
        discussion: {
          ...state.discussion,
          currentGroupIndex: nextIdx,
          timerRemaining: state.discussion.timerSeconds,
          timerRunning: false,
        },
      };
    }

    case "ADD_ACTION_ITEM": {
      // Action items can be added during discussing (merged discuss+commit)
      if (state.phase !== "discussing" && state.phase !== "committing") return state;
      return {
        ...state,
        actionItems: [...state.actionItems, event.item],
      };
    }

    case "REMOVE_ACTION_ITEM": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      if (state.phase !== "discussing" && state.phase !== "committing") return state;
      return {
        ...state,
        actionItems: state.actionItems.filter((a) => a.id !== event.itemId),
      };
    }

    case "UPDATE_ACTION_ITEM": {
      if (state.phase !== "discussing" && state.phase !== "committing") return state;
      return {
        ...state,
        actionItems: state.actionItems.map((a) =>
          a.id === event.itemId
            ? {
                ...a,
                ...(event.text !== undefined ? { text: event.text } : {}),
                ...(event.assignees !== undefined ? { assignees: event.assignees } : {}),
              }
            : a
        ),
      };
    }

    case "CLOSE_RETRO": {
      if (!isFacilitator(state, event.facilitatorId)) return state;
      // Can close from discussing (merged discuss+commit) or committing
      if (state.phase !== "discussing" && state.phase !== "committing") return state;
      return { ...state, phase: "closed" };
    }

    default:
      return state;
  }
}

// ── Utilities ──

export function getCardsByCategory(
  cards: ReadonlyArray<RetroCard>,
  category: CardCategory
): ReadonlyArray<RetroCard> {
  return cards.filter((c) => c.category === category);
}

export function getUngroupedCards(
  cards: ReadonlyArray<RetroCard>,
  groups: ReadonlyArray<CardGroup>
): ReadonlyArray<RetroCard> {
  const groupedIds = new Set(groups.flatMap((g) => g.cardIds));
  return cards.filter((c) => !groupedIds.has(c.id));
}

/** Get voting status: who has used ALL their votes and who hasn't */
export function getVotingStatus(
  participants: ReadonlyArray<Participant>,
  votes: ReadonlyArray<RetroVote>,
  maxVotesPerPerson: number
): {
  voted: ReadonlyArray<string>; // participant names who used ALL votes
  notVoted: ReadonlyArray<string>; // participant names who still have votes left
  allVoted: boolean;
} {
  // Count votes per participant
  const voteCounts = new Map<string, number>();
  for (const v of votes) {
    voteCounts.set(v.odiedId, (voteCounts.get(v.odiedId) ?? 0) + 1);
  }
  const voted = participants
    .filter((p) => (voteCounts.get(p.id) ?? 0) >= maxVotesPerPerson)
    .map((p) => p.name);
  const notVoted = participants
    .filter((p) => (voteCounts.get(p.id) ?? 0) < maxVotesPerPerson)
    .map((p) => p.name);
  return { voted, notVoted, allVoted: notVoted.length === 0 && participants.length > 0 };
}

// ── Proximity-Based Auto-Grouping ──

const PROXIMITY_THRESHOLD = 120; // px: cards within this distance cluster together

/**
 * Union-Find for clustering cards by proximity.
 * Cards within PROXIMITY_THRESHOLD pixels of each other form a group.
 * Groups get a default label from the first card's text.
 */
export function computeProximityGroups(
  cards: ReadonlyArray<RetroCard>,
  positions: Readonly<Record<string, CardPosition>>
): ReadonlyArray<CardGroup> {
  const cardIds = cards.map((c) => c.id).filter((id) => id in positions);
  if (cardIds.length === 0) return [];

  // Union-Find
  const parent = new Map<string, string>();
  for (const id of cardIds) parent.set(id, id);

  function find(a: string): string {
    let root = a;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // Path compression
    let curr = a;
    while (curr !== root) {
      const next = parent.get(curr)!;
      parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Cluster cards within threshold
  for (let i = 0; i < cardIds.length; i++) {
    for (let j = i + 1; j < cardIds.length; j++) {
      const posA = positions[cardIds[i]];
      const posB = positions[cardIds[j]];
      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PROXIMITY_THRESHOLD) {
        union(cardIds[i], cardIds[j]);
      }
    }
  }

  // Collect clusters
  const clusters = new Map<string, string[]>();
  for (const id of cardIds) {
    const root = find(id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(id);
  }

  // Every cluster becomes a group — solo cards are groups of 1
  const groups: CardGroup[] = [];
  for (const [root, members] of clusters) {
    const firstCard = cards.find((c) => c.id === members[0]);
    const label = firstCard
      ? firstCard.text.slice(0, 30) + (firstCard.text.length > 30 ? "..." : "")
      : "Group";
    groups.push({
      id: `prox-${root}`,
      label,
      cardIds: members,
      voteCount: 0,
    });
  }

  return groups;
}

/**
 * Scatter cards randomly across a canvas of given dimensions.
 * Used when transitioning from writing → grouping phase.
 */
export function scatterCardPositions(
  cards: ReadonlyArray<RetroCard>,
  canvasWidth: number,
  canvasHeight: number,
  cardWidth = 180,
  cardHeight = 80,
  padding = 20
): Record<string, CardPosition> {
  const positions: Record<string, CardPosition> = {};
  const usableW = canvasWidth - cardWidth - padding * 2;
  const usableH = canvasHeight - cardHeight - padding * 2;

  // Cap columns so each cell is at least cardWidth wide (prevents overlap)
  const maxCols = Math.max(1, Math.floor(usableW / (cardWidth + 8)));
  const cols = Math.min(Math.ceil(Math.sqrt(cards.length * (usableW / usableH))), maxCols);
  const rows = Math.ceil(cards.length / cols);
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Position within cell with some jitter
    const jitterX = (Math.random() - 0.5) * cellW * 0.4;
    const jitterY = (Math.random() - 0.5) * cellH * 0.4;
    positions[card.id] = {
      x: Math.max(padding, Math.min(usableW + padding, padding + col * cellW + cellW / 2 + jitterX)),
      y: Math.max(padding, Math.min(usableH + padding, padding + row * cellH + cellH / 2 + jitterY)),
    };
  });

  return positions;
}

export function getRetroStats(state: RetroState): {
  totalCards: number;
  happyCount: number;
  sadCount: number;
  confusedCount: number;
  groupCount: number;
  actionCount: number;
} {
  return {
    totalCards: state.cards.length,
    happyCount: state.cards.filter((c) => c.category === "happy").length,
    sadCount: state.cards.filter((c) => c.category === "sad").length,
    confusedCount: state.cards.filter((c) => c.category === "confused").length,
    groupCount: state.groups.length,
    actionCount: state.actionItems.length,
  };
}
