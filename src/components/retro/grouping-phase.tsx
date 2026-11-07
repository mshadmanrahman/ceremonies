"use client";

import {
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import type {
  RetroCard,
  CardGroup,
  CardCategory,
  CardPosition,
  CursorPosition,
} from "@/lib/state-machines/retro";
import { scatterCardPositions } from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { HappyIcon, SadIcon, ConfusedIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { EditPencil } from "iconoir-react";

interface GroupingPhaseProps {
  readonly phase: "grouping" | "labeling";
  readonly cards: ReadonlyArray<RetroCard>;
  readonly groups: ReadonlyArray<CardGroup>;
  readonly cardPositions: Readonly<Record<string, CardPosition>>;
  readonly cursors: ReadonlyMap<string, CursorPosition>;
  readonly myId: string | null;
  readonly isFacilitator: boolean;
  readonly onMoveCard: (cardId: string, x: number, y: number) => void;
  readonly onScatterCards: (positions: Record<string, CardPosition>) => void;
  readonly onSendCursor: (x: number, y: number) => void;
  readonly onRenameGroup: (groupId: string, label: string) => void;
  readonly onAdvance: () => void;
}

const CANVAS_WIDTH = 1200;
const BASE_CANVAS_HEIGHT = 900;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 72;
/** Stored gap between stacked cards. Stays under the grouping radius (120). */
const STACK_STEP = 24;
/** Frame padding around a group column, in canvas units. */
const BLOCK_PAD = 10;
const DRAG_KEY = "__dragging";
/** Space kept between a stack and a block pushed below it, in canvas units. */
const BLOCK_GAP = 16;
/** Narrowest the canvas renders, in px, so cards stay about 126px wide. */
const CANVAS_MIN_PX = 840;

/** Scale canvas height based on card count to prevent overcrowding */
function getCanvasHeight(cardCount: number): number {
  if (cardCount <= 16) return BASE_CANVAS_HEIGHT;
  // Add ~60px of canvas height per additional card beyond 16
  const extra = (cardCount - 16) * 60;
  return Math.min(BASE_CANVAS_HEIGHT + extra, 2400); // cap at 2400
}

const CATEGORY_ICON: Record<
  CardCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  happy: HappyIcon,
  sad: SadIcon,
  confused: ConfusedIcon,
};

const CATEGORY_STYLE: Record<
  CardCategory,
  { border: string; bg: string; color: string }
> = {
  happy: { border: "border-happy/40", bg: "bg-happy/15", color: "text-happy" },
  sad: { border: "border-sad/40", bg: "bg-sad/15", color: "text-sad" },
  confused: {
    border: "border-confused/40",
    bg: "bg-confused/15",
    color: "text-confused",
  },
};

// Cursor colors for participants
const CURSOR_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function GroupingPhase({
  phase,
  cards,
  groups,
  cardPositions,
  cursors,
  myId,
  isFacilitator,
  onMoveCard,
  onScatterCards,
  onSendCursor,
  onRenameGroup,
  onAdvance,
}: GroupingPhaseProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  // Drawn blocks (one per group, plus the card being dragged), for drop
  // targeting and for sizing the canvas to fit its tallest stack.
  const blockRefs = useRef(new Map<string, HTMLDivElement>());
  const [dragging, setDragging] = useState<{
    cardId: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [hasScattered, setHasScattered] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  // Last measured height of each drawn block, in canvas units.
  const [blockHeights, setBlockHeights] = useState<Record<string, number>>({});

  const baseHeight = getCanvasHeight(cards.length);
  const canvasHeight = Math.max(baseHeight, contentHeight);
  const isLabeling = phase === "labeling";

  // Safe access: old state may not have cardPositions at all
  const safePositions = cardPositions ?? {};

  // Scatter cards on first render if no positions exist
  useEffect(() => {
    if (hasScattered) return;
    const hasPositions = Object.keys(safePositions).length > 0;
    if (!hasPositions && cards.length > 0) {
      const positions = scatterCardPositions(
        cards,
        CANVAS_WIDTH,
        baseHeight,
        CARD_WIDTH,
        CARD_HEIGHT,
      );
      onScatterCards(positions);
      setHasScattered(true);
    } else if (hasPositions) {
      setHasScattered(true);
    }
  }, [cards, safePositions, hasScattered, onScatterCards, baseHeight]);

  // Stacks grow downward with their text, so grow the canvas to fit them
  // instead of clipping the bottom card. Runs after every render because any
  // move or new card can change a stack's height; the 8-unit dead band and
  // the functional update stop it from looping.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.height === 0) return;
    const unitsPerPx = canvasHeight / rect.height;
    let bottom = 0;
    const measured: Record<string, number> = {};
    for (const [key, el] of blockRefs.current) {
      const r = el.getBoundingClientRect();
      bottom = Math.max(bottom, r.bottom - rect.top);
      measured[key] = Math.ceil(r.height * unitsPerPx);
    }
    const needed = Math.ceil(bottom * unitsPerPx + 40);
    setContentHeight((prev) => (Math.abs(prev - needed) > 8 ? needed : prev));
    setBlockHeights((prev) =>
      Object.keys(measured).some(
        (k) => Math.abs((prev[k] ?? 0) - measured[k]) > 2,
      )
        ? measured
        : prev,
    );
  });

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (clientY - rect.top) * (canvasHeight / rect.height),
      };
    },
    [canvasHeight],
  );

  // Track cursor on canvas
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const { x, y } = toCanvas(e.clientX, e.clientY);
      onSendCursor(x, y);

      // If dragging, move the card. Cards lock in place during labeling so the
      // facilitator can focus on names without changing groups.
      if (dragging && !isLabeling) {
        const newX = Math.max(
          0,
          Math.min(CANVAS_WIDTH - CARD_WIDTH, x - dragging.offsetX),
        );
        const newY = Math.max(
          0,
          Math.min(canvasHeight - CARD_HEIGHT, y - dragging.offsetY),
        );
        onMoveCard(dragging.cardId, newX, newY);
        if (!dragging.moved) setDragging({ ...dragging, moved: true });
      }
    },
    [onSendCursor, onMoveCard, dragging, canvasHeight, isLabeling, toCanvas],
  );

  const handlePointerDown = useCallback(
    (cardId: string, e: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasRef.current || isLabeling) return;
      if (!safePositions[cardId]) return;
      // Measure from where the card is drawn. Inside a stack that is below
      // its stored spot, and the card should not jump when picked up.
      const pointer = toCanvas(e.clientX, e.clientY);
      const drawn = e.currentTarget.getBoundingClientRect();
      const topLeft = toCanvas(drawn.left, drawn.top);
      setDragging({
        cardId,
        offsetX: pointer.x - topLeft.x,
        offsetY: pointer.y - topLeft.y,
        moved: false,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [safePositions, isLabeling, toCanvas],
  );

  // Every group draws as one column, so its cards never cover each other.
  // Cards no group covers yet (right after the scatter) draw on their own.
  const draggingId = dragging?.moved ? dragging.cardId : null;
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const byPosition = (a: string, b: string) =>
    safePositions[a].y - safePositions[b].y ||
    safePositions[a].x - safePositions[b].x;
  const grouped = new Set(groups.flatMap((g) => g.cardIds));
  const blocks: Array<{
    key: string;
    group: CardGroup | null;
    members: string[];
    framed: boolean;
  }> = [
    ...groups.map((group) => ({
      key: group.id,
      group,
      members: group.cardIds.filter(
        (id) => id !== draggingId && safePositions[id] && cardById.has(id),
      ),
    })),
    ...cards
      .filter(
        (c) => !grouped.has(c.id) && c.id !== draggingId && safePositions[c.id],
      )
      .map((c) => ({ key: `solo-${c.id}`, group: null, members: [c.id] })),
  ]
    .filter((b) => b.members.length > 0)
    .map((b) => ({
      ...b,
      members: [...b.members].sort(byPosition),
      framed: b.group !== null && (b.members.length > 1 || isLabeling),
    }));

  // A stack grows down with its text and can reach a card below it. Draw
  // blocks top to bottom and push any block that would collide down past
  // the one above. This only moves where a block is drawn: stored positions
  // and therefore groups stay as they are.
  const drawnTop = new Map<string, number>();
  {
    const placed: Array<{
      left: number;
      right: number;
      top: number;
      bottom: number;
    }> = [];
    const ordered = [...blocks].sort((a, b) =>
      byPosition(a.members[0], b.members[0]),
    );
    for (const block of ordered) {
      const anchor = safePositions[block.members[0]];
      const pad = block.framed ? BLOCK_PAD : 0;
      const left = anchor.x - pad;
      const right = anchor.x + CARD_WIDTH + pad;
      const height = blockHeights[block.key] ?? CARD_HEIGHT;
      let top = anchor.y - pad;
      let moved = true;
      while (moved) {
        moved = false;
        for (const p of placed) {
          const overlapsX = left < p.right && right > p.left;
          const overlapsY = top < p.bottom + BLOCK_GAP && top + height > p.top;
          if (overlapsX && overlapsY) {
            top = p.bottom + BLOCK_GAP;
            moved = true;
          }
        }
      }
      placed.push({ left, right, top, bottom: top + height });
      drawnTop.set(block.key, top);
    }
  }

  // Dropping a card anywhere over a stack adds it to the bottom of that
  // stack. Its stored spot goes one small step below the last card, which
  // keeps it inside the proximity radius that defines the group.
  const handlePointerUp = useCallback(() => {
    const drag = dragging;
    setDragging(null);
    if (!drag?.moved) return;
    const dragged = blockRefs.current.get(DRAG_KEY);
    if (!dragged) return;
    const r = dragged.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (const block of blocks) {
      const el = blockRefs.current.get(block.key);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) continue;
      const last = safePositions[block.members[block.members.length - 1]];
      onMoveCard(
        drag.cardId,
        last.x,
        Math.min(canvasHeight - CARD_HEIGHT, last.y + STACK_STEP),
      );
      return;
    }
  }, [dragging, blocks, safePositions, onMoveCard, canvasHeight]);

  const setBlockRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) blockRefs.current.set(key, el);
    else blockRefs.current.delete(key);
  };

  const renderCard = (cardId: string, isDragging: boolean) => {
    const card = cardById.get(cardId);
    if (!card) return null;
    const style = CATEGORY_STYLE[card.category];
    const Icon = CATEGORY_ICON[card.category];
    return (
      <div
        key={card.id}
        className={cn(
          "flex items-start gap-2 rounded-md border-2 p-2.5 text-xs font-medium select-none transition-shadow",
          style.border,
          style.bg,
          isDragging
            ? "shadow-hard-lg scale-105 cursor-grabbing"
            : isLabeling
              ? "shadow-hard-sm cursor-default"
              : "shadow-hard-sm cursor-grab hover:shadow-hard",
        )}
        onPointerDown={(e) => handlePointerDown(card.id, e)}
      >
        <Icon size={24} className={cn("shrink-0 mt-0.5", style.color)} />
        <span className="min-w-0 break-words leading-snug">{card.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-ceremony">
            {isLabeling ? "Label groups" : "Group cards"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLabeling
              ? "Facilitator: review each group name before the team votes."
              : "Drop a card on another card to group them. Everyone moves cards in real-time."}
          </p>
        </div>
        {isFacilitator && (
          <Button onClick={onAdvance} className="relative z-10 h-11 shrink-0">
            {isLabeling ? "Move to voting" : "Move to labeling"}
          </Button>
        )}
      </div>

      {/* Canvas. On phones it keeps a readable width and scrolls sideways
          instead of shrinking cards to an unreadable sliver. */}
      <div className="overflow-x-auto pb-1">
        <div
          ref={canvasRef}
          className="relative overflow-hidden rounded-md border-2 border-border bg-card shadow-hard dark:bg-background"
          style={{
            width: "100%",
            minWidth: `${CANVAS_MIN_PX}px`,
            aspectRatio: `${CANVAS_WIDTH} / ${canvasHeight}`,
            minHeight: "400px",
          }}
          onMouseMove={handleMouseMove}
          onPointerUp={handlePointerUp}
        >
          {/* Dot grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Groups, each a column of cards */}
          {blocks.map((block) => {
            const anchor = safePositions[block.members[0]];
            const framed = block.framed;
            const pad = framed ? BLOCK_PAD : 0;
            const top = drawnTop.get(block.key) ?? anchor.y - pad;
            return (
              <div
                key={block.key}
                ref={setBlockRef(block.key)}
                className={cn(
                  "absolute z-10 flex flex-col gap-2",
                  framed &&
                    "rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.04] p-2",
                )}
                style={{
                  left: `${((anchor.x - pad) / CANVAS_WIDTH) * 100}%`,
                  top: `${(top / canvasHeight) * 100}%`,
                  width: `${((CARD_WIDTH + pad * 2) / CANVAS_WIDTH) * 100}%`,
                }}
              >
                {framed && block.group && (
                  <GroupLabel
                    group={block.group}
                    canRename={isLabeling && isFacilitator}
                    onRename={onRenameGroup}
                  />
                )}
                {block.members.map((id) => renderCard(id, false))}
              </div>
            );
          })}

          {/* The card being dragged follows the pointer on its own */}
          {draggingId && safePositions[draggingId] && (
            <div
              ref={setBlockRef(DRAG_KEY)}
              className="absolute z-30"
              style={{
                left: `${(safePositions[draggingId].x / CANVAS_WIDTH) * 100}%`,
                top: `${(safePositions[draggingId].y / canvasHeight) * 100}%`,
                width: `${(CARD_WIDTH / CANVAS_WIDTH) * 100}%`,
              }}
            >
              {renderCard(draggingId, true)}
            </div>
          )}

          {/* Other participants' cursors */}
          {Array.from(cursors.entries()).map(([id, cursor], i) => {
            if (id === myId) return null;
            const color = CURSOR_COLORS[i % CURSOR_COLORS.length];
            return (
              <div
                key={id}
                className="pointer-events-none absolute z-40 transition-all duration-75"
                style={{
                  left: `${(cursor.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(cursor.y / canvasHeight) * 100}%`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                {/* Cursor arrow */}
                <svg
                  width="16"
                  height="20"
                  viewBox="0 0 16 20"
                  fill={color}
                  className="drop-shadow-sm"
                >
                  <path d="M0 0 L16 12 L8 12 L12 20 L8 18 L4 12 L0 16 Z" />
                </svg>
                {/* Name label */}
                <span
                  className="absolute left-4 top-4 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {cursor.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group summary below canvas */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground self-center">
            {groups.length} group{groups.length !== 1 ? "s" : ""} formed:
          </span>
          {groups.map((g) =>
            isLabeling && isFacilitator ? (
              <RenameableChip key={g.id} group={g} onRename={onRenameGroup} />
            ) : (
              <span
                key={g.id}
                className="rounded-md border-2 border-border bg-muted px-2.5 py-1 text-xs font-bold"
              >
                {g.label} ({g.cardIds.length})
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Inline-editable chip for renaming a group from the summary row. */
function RenameableChip({
  group,
  onRename,
}: {
  group: CardGroup;
  onRename: (groupId: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(group.label);

  // Sync when an external rename (e.g. canvas boundary) changes the label.
  useEffect(() => {
    if (!editing) setLabel(group.label);
  }, [group.label, editing]);

  const handleSave = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== group.label) {
      onRename(group.id, trimmed);
    } else {
      setLabel(group.label);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setLabel(group.label);
            setEditing(false);
          }
        }}
        autoFocus
        className="h-7 rounded-md border-2 border-primary bg-card px-2 text-xs font-bold focus:outline-none"
        style={{ minWidth: "6rem" }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 rounded-md border-2 border-border bg-muted px-2.5 py-1 text-xs font-bold transition-colors hover:border-primary hover:bg-primary/10"
      title="Click to rename group"
    >
      {group.label} ({group.cardIds.length})
      <EditPencil
        width={10}
        height={10}
        className="shrink-0 text-muted-foreground"
      />
    </button>
  );
}

/** Name of a group, shown at the top of its column. Wraps instead of cutting off. */
function GroupLabel({
  group,
  canRename,
  onRename,
}: {
  group: CardGroup;
  canRename: boolean;
  onRename: (groupId: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(group.label);

  const handleRename = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== group.label) {
      onRename(group.id, trimmed);
    } else {
      setLabel(group.label);
    }
    setEditing(false);
  };

  // Sync label when group label changes externally
  useEffect(() => {
    if (!editing) setLabel(group.label);
  }, [group.label, editing]);

  if (canRename && editing) {
    return (
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleRename}
        onKeyDown={(e) => e.key === "Enter" && handleRename()}
        autoFocus
        className="h-7 w-full rounded border-2 border-primary bg-card px-2 text-xs font-bold focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  if (canRename) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="flex w-full items-start gap-1 rounded-md bg-primary/15 px-2 py-1 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/25"
      >
        <span className="min-w-0 break-words">{group.label}</span>
        <EditPencil width={10} height={10} className="mt-0.5 shrink-0" />
      </button>
    );
  }

  return (
    <span className="rounded-md bg-muted/80 px-2 py-1 text-xs font-bold break-words text-muted-foreground">
      {group.label}
    </span>
  );
}
