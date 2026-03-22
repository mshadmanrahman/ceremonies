"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { OwlIcon } from "@/components/shared/icons";
import { Sparks } from "iconoir-react";

interface UpgradePromptProps {
  readonly teamId: string;
  readonly limitType: "members" | "sessions" | "teams";
  readonly current: number;
  readonly max: number;
}

const LIMIT_MESSAGES = {
  members: {
    title: "Team is full",
    description: "Free teams are limited to 5 members.",
    cta: "Upgrade for unlimited members",
  },
  sessions: {
    title: "Session limit reached",
    description: "Free teams can save up to 10 sessions.",
    cta: "Upgrade for unlimited history",
  },
  teams: {
    title: "Team limit reached",
    description: "Free accounts can create 1 team.",
    cta: "Upgrade to create more teams",
  },
} as const;

export function UpgradePrompt({ teamId, limitType, current, max }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const messages = LIMIT_MESSAGES[limitType];

  const handleUpgrade = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  return (
    <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <OwlIcon size={28} />
      </div>
      <p className="text-sm font-bold text-primary">{messages.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {messages.description} ({current}/{max} used)
      </p>
      <div className="mt-4 space-y-2">
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full"
        >
          <Sparks width={16} height={16} />
          {loading ? "Redirecting to Stripe..." : messages.cta}
        </Button>
        <p className="text-[10px] text-muted-foreground">
          $5/user/month. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

/** Inline upgrade badge for use in headers. */
export function PlanBadge({ plan }: { readonly plan: "free" | "pro" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
        plan === "pro"
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-muted text-muted-foreground border border-border"
      }`}
    >
      {plan === "pro" && <Sparks width={10} height={10} />}
      {plan}
    </span>
  );
}
