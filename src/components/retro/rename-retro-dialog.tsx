"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MAX_TITLE_LENGTH } from "@/lib/state-machines/retro";

interface RenameRetroDialogProps {
  readonly title: string | null;
  readonly roomCode: string;
  readonly onRename: (title: string) => void;
}

/** Facilitator's Rename control. An empty name falls back to the room code. */
export function RenameRetroDialog({
  title,
  roomCode,
  onRename,
}: RenameRetroDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(title ?? "");
        setOpen(next);
      }}
    >
      <DialogTrigger className="text-[10px] font-bold uppercase tracking-[0.12em] text-coffee underline underline-offset-2 transition-colors hover:text-coffee/80">
        Rename
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display tracking-ceremony">
            Rename retro
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onRename(draft);
            setOpen(false);
          }}
        >
          <label htmlFor="retro-title" className="text-sm text-muted-foreground">
            Everyone in the room sees this name. Leave it empty to show the
            room code ({roomCode}).
          </label>
          <Input
            id="retro-title"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Sprint 42 retro"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save name
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
