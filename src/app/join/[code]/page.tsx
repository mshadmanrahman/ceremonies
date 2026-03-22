"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { OwlIcon } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";

type InviteState =
  | { status: "loading" }
  | { status: "preview"; teamName: string; role: string; teamId: string }
  | { status: "joining" }
  | { status: "joined"; teamId: string }
  | { status: "already-member"; teamId: string }
  | { status: "error"; message: string };

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<InviteState>({ status: "loading" });

  // Fetch invite preview
  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${code}`);
        if (!res.ok) {
          const data = await res.json();
          setState({ status: "error", message: data.error ?? "Invalid invite" });
          return;
        }
        const data = await res.json();
        setState({
          status: "preview",
          teamName: data.teamName,
          role: data.role,
          teamId: data.teamId,
        });
      } catch {
        setState({ status: "error", message: "Failed to load invite" });
      }
    }
    fetchInvite();
  }, [code]);

  const handleJoin = useCallback(async () => {
    setState({ status: "joining" });
    try {
      const res = await fetch(`/api/invites/${code}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Failed to join" });
        return;
      }

      if (data.alreadyMember) {
        setState({ status: "already-member", teamId: data.teamId });
      } else {
        setState({ status: "joined", teamId: data.teamId });
      }
    } catch {
      setState({ status: "error", message: "Something went wrong" });
    }
  }, [code]);

  // Auto-redirect after join
  useEffect(() => {
    if (state.status === "joined" || state.status === "already-member") {
      const timer = setTimeout(() => {
        router.push(`/dashboard?team=${state.teamId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="flex min-h-svh flex-col px-4">
      <header className="flex items-center justify-between px-2 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          <NavArrowLeft width={16} height={16} />
          Back
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex flex-1 w-full max-w-sm flex-col items-center justify-center space-y-6 text-center">
        <OwlIcon size={64} className="text-primary" />

        {state.status === "loading" && (
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted mx-auto" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted mx-auto" />
          </div>
        )}

        {state.status === "preview" && (
          <div className="stagger-in space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                You've been invited to join
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-ceremony sm:text-4xl">
                {state.teamName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                as a <span className="font-bold text-foreground">{state.role}</span>
              </p>
            </div>

            {isLoaded && isSignedIn ? (
              <Button onClick={handleJoin} size="lg" className="h-12 w-full">
                Join team
              </Button>
            ) : isLoaded ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to join this team.
                </p>
                <Link href={`/sign-in?redirect_url=/join/${code}`}>
                  <Button size="lg" className="h-12 w-full">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {state.status === "joining" && (
          <p className="text-sm font-bold text-primary animate-pulse">
            Joining...
          </p>
        )}

        {state.status === "joined" && (
          <div className="stagger-in space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="font-display text-2xl tracking-ceremony">
              You're in!
            </h2>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {state.status === "already-member" && (
          <div className="stagger-in space-y-3">
            <h2 className="font-display text-2xl tracking-ceremony">
              Already a member
            </h2>
            <p className="text-sm text-muted-foreground">
              You're already on this team. Redirecting...
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="stagger-in space-y-4">
            <h2 className="font-display text-2xl tracking-ceremony text-destructive">
              Invite invalid
            </h2>
            <p className="text-sm text-muted-foreground">
              {state.message}
            </p>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
