"use client";

import { useRef, useCallback, useEffect, useState } from "react";
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
const CANVAS_HEIGHT = 900;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 72;

const CATEGORY_ICON: Record<CardCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  happy: HappyIcon,
  sad: SadIcon,
  confused: ConfusedIcon,
};

const CATEGORY_STYLE: Record<CardCategory, { border: string; bg: string; color: string }> = {
  happy: { border: "border-happy/40", bg: "bg-happy/15", color: "text-happy" },
  sad: { border: "border-sad/40", bg: "bg-sad/15", color: "text-sad" },
  confused: { border: "border-confused/40", bg: "bg-confused/15", color: "text-confused" },
};

// Cursor colors for participants
const CURSOR_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#a855f7",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16",
];

export function GroupingPhase({
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
  const [dragging, setDragging] = useState<{
    cardId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [hasScattered, setHasScattered] = useState(false);

  // Safe access: old state may not have cardPositions at all
  const safePositions = cardPositions ?? {};

  // Scatter cards on first render if no positions exist
  useEffect(() => {
    if (hasScattered) return;
    const hasPositions = Object.keys(safePositions).length > 0;
    if (!hasPositions && cards.length > 0) {
      const positions = scatterCardPositions(cards, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT);
      onScatterCards(positions);
      setHasScattered(true);
    } else if (hasPositions) {
      setHasScattered(true);
    }
  }, [cards, safePositions, hasScattered, onScatterCards]);

  // Track cursor on canvas
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      onSendCursor(x, y);

      // If dragging, move the card
      if (dragging) {
        const newX = Math.max(0, Math.min(CANVAS_WIDTH - CARD_WIDTH, x - dragging.offsetX));
        const newY = Math.max(0, Math.min(CANVAS_HEIGHT - CARD_HEIGHT, y - dragging.offsetY));
        onMoveCard(dragging.cardId, newX, newY);
      }
    },
    [onSendCursor, onMoveCard, dragging]
  );

  const handlePointerDown = useCallback(
    (cardId: string, e: React.PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const pos = safePositions[cardId];
      if (!pos) return;
      setDragging({
        cardId,
        offsetX: canvasX - pos.x,
        offsetY: canvasY - pos.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cardPositions]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Group cluster boundaries for visual feedback
  const groupBounds = groups.map((group) => {
    const positions = group.cardIds
      .map((id) => safePositions[id])
      .filter(Boolean);
    if (positions.length === 0) return null;
    const minX = Math.min(...positions.map((p) => p.x)) - 12;
    const minY = Math.min(...positions.map((p) => p.y)) - 12;
    const maxX = Math.max(...positions.map((p) => p.x)) + CARD_WIDTH + 12;
    const maxY = Math.max(...positions.map((p) => p.y)) + CARD_HEIGHT + 12;
    return { group, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-ceremony">
            Group & Label
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag cards close together to form groups. Everyone moves cards in real-time.
          </p>
        </div>
        {isFacilitator && (
          <Button onClick={onAdvance} className="h-11 shrink-0">
            Move to voting
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-md border-2 border-border bg-card shadow-hard dark:bg-background"
        style={{
          width: "100%",
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          minHeight: "400px",
        }}
        onMouseMove={handleMouseMove}
        onPointerUp={handlePointerUp}
      >
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Group boundaries (auto-generated from proximity) */}
        {groupBounds.map((bounds) => {
          if (!bounds) return null;
          return (
            <GroupBoundary
              key={bounds.group.id}
              group={bounds.group}
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              canvasWidth={CANVAS_WIDTH}
              onRename={onRenameGroup}
            />
          );
        })}

        {/* Cards */}
        {cards.map((card) => {
          const pos = safePositions[card.id];
          if (!pos) return null;
          const style = CATEGORY_STYLE[card.category];
          const Icon = CATEGORY_ICON[card.category];
          const isDragging = dragging?.cardId === card.id;

          return (
            <div
              key={card.id}
              className={cn(
                "absolute flex items-start gap-2 rounded-md border-2 p-2.5 text-xs font-medium select-none transition-shadow",
                style.border,
                style.bg,
                isDragging ? "shadow-hard-lg z-30 scale-105 cursor-grabbing" : "shadow-hard-sm z-10 cursor-grab hover:shadow-hard"
              )}
              style={{
                left: `${(pos.x / CANVAS_WIDTH) * 100}%`,
                top: `${(pos.y / CANVAS_HEIGHT) * 100}%`,
                width: `${(CARD_WIDTH / CANVAS_WIDTH) * 100}%`,
                minHeight: `${(CARD_HEIGHT / CANVAS_HEIGHT) * 100}%`,
                transition: isDragging ? "none" : "box-shadow 0.15s, transform 0.15s",
              }}
              onPointerDown={(e) => handlePointerDown(card.id, e)}
            >
              <Icon size={20} className={cn("shrink-0 mt-0.5", style.color)} />
              <span className="line-clamp-4 leading-snug">{card.text}</span>
            </div>
          );
        })}

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
                top: `${(cursor.y / CANVAS_HEIGHT) * 100}%`,
                transform: "translate(-2px, -2px)",
              }}
            >
              {/* Cursor arrow */}
              <svg width="16" height="20" viewBox="0 0 16 20" fill={color} className="drop-shadow-sm">
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

      {/* Group summary below canvas */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground self-center">
            {groups.length} group{groups.length !== 1 ? "s" : ""} formed:
          </span>
          {groups.map((g) => (
            <span
              key={g.id}
              className="rounded-md border-2 border-border bg-muted px-2.5 py-1 text-xs font-bold"
            >
              {g.label} ({g.cardIds.length})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Visual boundary around a proximity-detected group */
function GroupBoundary({
  group,
  x,
  y,
  width,
  height,
  canvasWidth,
  onRename,
}: {
  group: CardGroup;
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
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

  return (
    <div
      className="absolute z-0 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.04] transition-all duration-200"
      style={{
        left: `${(x / canvasWidth) * 100}%`,
        top: `${(y / CANVAS_HEIGHT) * 100}%`,
        width: `${(width / canvasWidth) * 100}%`,
        height: `${(height / CANVAS_HEIGHT) * 100}%`,
      }}
    >
      {/* Group label */}
      <div className="absolute -top-3 left-2 z-20">
        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            className="h-6 rounded border-2 border-primary bg-card px-2 text-[10px] font-bold focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/25"
          >
            {group.label}
            <EditPencil width={10} height={10} />
          </button>
        )}
      </div>
    </div>
  );
}

