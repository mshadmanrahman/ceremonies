"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FloppyDisk } from "iconoir-react";

export function ClaimRetro() {
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClaim = useCallback(async () => {
    const code = roomCode.trim();
    if (!code) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/retros/claim", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setStatus("success");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [roomCode, router]);

  if (status === "success") {
    return (
      <p className="text-xs font-bold text-primary">
        Retro claimed. It now appears in your history above.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Room code (e.g. ttq74z)"
          className="h-9 border-2 border-border bg-card font-mono text-sm shadow-hard-sm"
          onKeyDown={(e) => e.key === "Enter" && roomCode.trim() && handleClaim()}
          disabled={status === "loading"}
        />
        <Button
          onClick={handleClaim}
          disabled={!roomCode.trim() || status === "loading"}
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
        >
          <FloppyDisk width={14} height={14} />
          {status === "loading" ? "Claiming..." : "Claim"}
        </Button>
      </div>
      {status === "error" && error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
