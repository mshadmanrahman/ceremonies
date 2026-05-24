"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface JiraStatus {
  connected: boolean;
  siteName?: string;
  siteUrl?: string;
  connectedBy?: string;
  connectedAt?: string;
}

interface JiraConnectSectionProps {
  readonly teamId: string;
  readonly isOwner: boolean;
}

export function JiraConnectSection({
  teamId,
  isOwner,
}: JiraConnectSectionProps) {
  const [status, setStatus] = useState<JiraStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch(`/api/jira/${teamId}/status`)
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, [teamId]);

  const handleDisconnect = useCallback(async () => {
    if (!confirm("Disconnect Jira? Existing ticket links will be preserved.")) {
      return;
    }
    setDisconnecting(true);
    try {
      await fetch("/api/jira/disconnect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      setStatus({ connected: false });
    } catch {
      // Swallow -- UI will still show old state
    } finally {
      setDisconnecting(false);
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="rounded-md border-2 border-border bg-card p-4">
        <h3 className="font-bold">Jira Integration</h3>
        <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Connected
  if (status?.connected) {
    return (
      <div className="rounded-md border-2 border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold">Jira Integration</h3>
            <p className="mt-1 text-sm text-foreground/80">
              Connected to{" "}
              <a
                href={status.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {status.siteName}
              </a>
            </p>
            {status.connectedAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Connected {new Date(status.connectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Not connected
  return (
    <div className="rounded-md border-2 border-border bg-card p-4">
      <h3 className="font-bold">Jira Integration</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect Jira to auto-complete tickets in estimation rooms and sync story
        points back automatically.
      </p>
      {isOwner ? (
        <a href={`/api/jira/connect?teamId=${teamId}`}>
          <Button className="mt-3">Connect Jira</Button>
        </a>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Ask a team owner to connect Jira.
        </p>
      )}
    </div>
  );
}
