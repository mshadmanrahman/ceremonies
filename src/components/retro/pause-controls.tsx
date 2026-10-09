"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check } from "iconoir-react";

function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };
  return { copied, copy };
}

function CopyLinkButton() {
  const { copied, copy } = useCopyLink();
  return (
    <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
      {copied ? (
        <Check width={14} height={14} aria-hidden />
      ) : (
        <Copy width={14} height={14} aria-hidden />
      )}
      {copied ? "Link copied" : "Copy room link"}
    </Button>
  );
}

/**
 * Facilitator's Pause button. Opens a dialog with the link to come back to.
 * Stays mounted while paused (button hidden) so the dialog survives the pause.
 */
export function PauseButton({
  paused,
  onPause,
}: {
  readonly paused: boolean;
  readonly onPause: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!paused && (
        <button
          onClick={() => {
            onPause();
            setOpen(true);
          }}
          className="text-[10px] font-bold uppercase tracking-[0.12em] text-coffee underline underline-offset-2 transition-colors hover:text-coffee/80"
        >
          Pause
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-ceremony">
              Retro paused
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Everything is saved. Save this link to resume later, from any
            device. The retro stays open until you close it.
          </p>
          <p className="break-all rounded-md border-2 border-border bg-card px-3 py-2 font-mono text-xs">
            {typeof window !== "undefined" ? window.location.href : ""}
          </p>
          <CopyLinkButton />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Shown to everyone while the retro is paused. */
export function PausedBanner({
  isFacilitator,
  onResume,
}: {
  readonly isFacilitator: boolean;
  readonly onResume: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-coffee/40 bg-coffee/10 px-4 py-3"
    >
      <div>
        <p className="text-sm font-bold">Paused. Resume anytime.</p>
        <p className="text-sm text-muted-foreground">
          {isFacilitator
            ? "Nothing changes until you resume. Save the link to come back."
            : "The facilitator paused this retro. Save the link to come back."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyLinkButton />
        {isFacilitator && (
          <Button size="sm" onClick={onResume}>
            Resume retro
          </Button>
        )}
      </div>
    </div>
  );
}

/** Shown to participants when the facilitator is offline. */
export function FacilitatorAwayBanner({
  canClaim,
  onClaim,
}: {
  readonly canClaim: boolean;
  readonly onClaim: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-border bg-card px-4 py-3"
    >
      <p className="text-sm text-muted-foreground">
        {canClaim
          ? "The facilitator is offline. Anyone here can take over."
          : "The facilitator is offline. If they are not back within a minute, you can take over."}
      </p>
      {canClaim && (
        <Button size="sm" variant="outline" onClick={onClaim}>
          Become facilitator
        </Button>
      )}
    </div>
  );
}
