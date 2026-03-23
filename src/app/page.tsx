import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { LinkButton } from "@/components/shared/link-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "@/components/shared/mobile-nav";
import { OwlIcon, GhostIcon, CardsIcon, CrystalBallIcon } from "@/components/shared/icons";

function roomCode() {
  return Math.random().toString(36).slice(2, 8);
}

export default function Home() {
  const estRoom = roomCode();
  const retroRoom = roomCode();
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <header className="relative flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-1.5">
          <OwlIcon size={32} className="text-primary" />
          <span className="font-display text-xl font-bold tracking-ceremony">
            ceremonies
          </span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <Link
            href="https://github.com/mshadmanrahman/ceremonies"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <LinkButton href="/dashboard" variant="outline" size="sm">
            Dashboard
          </LinkButton>
          <Show when="signed-out">
            <LinkButton href="/sign-in" variant="outline" size="sm">
              Sign in
            </LinkButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <ThemeToggle />
        </nav>
        {/* Mobile nav */}
        <MobileNav />
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Floating decorative shapes — gentle drift animations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-[10%] top-[15%] h-4 w-4 rounded-full border-2 border-primary/20 animate-[drift-a_8s_ease-in-out_infinite]" />
          <svg className="absolute right-[12%] top-[20%] h-5 w-5 text-coffee/25 animate-[drift-b_10s_ease-in-out_infinite]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 2 L18 18 L2 18 Z" />
          </svg>
          <div className="absolute left-[8%] top-[55%] h-3 w-3 border-2 border-coffee/20 animate-[drift-c_9s_ease-in-out_infinite]" />
          <div className="absolute right-[9%] top-[50%] h-5 w-5 rounded-full border-2 border-primary/15 animate-[drift-a_11s_ease-in-out_infinite_reverse]" />
          <div className="absolute bottom-[25%] left-[15%] h-3.5 w-3.5 rotate-45 border-2 border-primary/20 animate-[drift-b_7s_ease-in-out_infinite]" />
          <div className="absolute bottom-[30%] right-[14%] h-2.5 w-2.5 rounded-full bg-coffee/15 animate-[drift-c_12s_ease-in-out_infinite_reverse]" />
        </div>

        <div className="relative max-w-2xl space-y-6">
          {/* Mascot row: slightly tilted, ~20% smaller */}
          <div className="!mb-0 flex items-center justify-center gap-6">
            <div
              className="-rotate-6 text-primary transition-transform hover:scale-110 hover:-rotate-12"
              style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-bounce)" }}
            >
              <OwlIcon size={68} />
            </div>
            <div
              className="rotate-6 text-coffee transition-transform hover:scale-110 hover:rotate-12"
              style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-bounce)" }}
            >
              <GhostIcon size={68} />
            </div>
          </div>

          <h1 className="font-display text-5xl tracking-ceremony sm:text-7xl">
            Agile ceremonies,
            <br />
            <span className="relative inline-block text-primary">
              done right.
              {/* Squiggly underline */}
              <svg
                className="absolute -bottom-2 left-0 w-full text-primary/40"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 15 2, 30 8 Q 45 14, 60 8 Q 75 2, 90 8 Q 105 14, 120 8 Q 135 2, 150 8 Q 165 14, 180 8 Q 195 2, 198 8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground">
            Estimation and retros in one place. Opinionated phases, true
            anonymity, and action items that haunt you. Open source.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <LinkButton
              href={`/estimation/${estRoom}`}
              size="xl"
            >
              Start estimating
            </LinkButton>
            <LinkButton
              href={`/retro/${retroRoom}`}
              variant="outline"
              size="xl"
            >
              Run a retro
            </LinkButton>
          </div>
        </div>

        {/* Feature cards (clickable) */}
        <div className="relative mt-24 grid w-full max-w-3xl gap-5 sm:grid-cols-3">
          <Link href={`/estimation/${estRoom}`} className="h-full">
            <FeatureCard
              icon={<CardsIcon size={36} />}
              title="Estimation"
              description="Modified Fibonacci with coffee cup. Votes visible after the big reveal. Push to Jira."
            />
          </Link>
          <Link href={`/retro/${retroRoom}`} className="h-full">
            <FeatureCard
              icon={<CrystalBallIcon width={36} height={36} />}
              title="Retros"
              description="Happy, Sad, Confused. True anonymous writing. Enforced phases with timers."
            />
          </Link>
          <Link href={`/retro/${retroRoom}`} className="h-full">
            <FeatureCard
              icon={<GhostIcon size={36} />}
              title="The Haunting"
              description="Last retro's action items open the next one. No more forgotten commitments."
            />
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl tracking-ceremony sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            No setup. No accounts required for participants. Just share a link.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <StepCard
              step={1}
              title="Create a room"
              description="Click a button. Get a unique room link. That's it."
            />
            <StepCard
              step={2}
              title="Invite your team"
              description="Share the link. Everyone joins with just their name. No signup."
            />
            <StepCard
              step={3}
              title="Run the ceremony"
              description="Facilitator controls the flow. Phases are enforced. Results are saved."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative px-6 py-20 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl tracking-ceremony sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            Free for small teams. Pro when you need more.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-md border-2 border-border bg-card p-6 shadow-hard">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Free
              </p>
              <p className="mt-2 font-display text-4xl tracking-ceremony">$0</p>
              <p className="mt-1 text-sm text-muted-foreground">Forever free</p>
              <div className="my-6 h-px bg-border" />
              <ul className="space-y-2.5 text-sm">
                <PricingItem>1 team</PricingItem>
                <PricingItem>5 members</PricingItem>
                <PricingItem>10 saved sessions</PricingItem>
                <PricingItem>Estimation + Retro rooms</PricingItem>
                <PricingItem>Real-time collaboration</PricingItem>
              </ul>
              <div className="mt-6">
                <LinkButton href={`/estimation/${estRoom}`} variant="outline" className="w-full">
                  Get started free
                </LinkButton>
              </div>
            </div>
            {/* Pro tier */}
            <div className="relative rounded-md border-2 border-primary bg-card p-6 shadow-hard">
              <span className="absolute -top-3 right-4 rounded-md bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                Pro
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                Pro
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl tracking-ceremony">$5</span>
                <span className="text-sm text-muted-foreground">/user/mo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">For growing teams</p>
              <div className="my-6 h-px bg-border" />
              <ul className="space-y-2.5 text-sm">
                <PricingItem highlight>Unlimited teams</PricingItem>
                <PricingItem highlight>Unlimited members</PricingItem>
                <PricingItem highlight>Unlimited sessions</PricingItem>
                <PricingItem>Everything in Free</PricingItem>
                <PricingItem>Jira integration (coming soon)</PricingItem>
                <PricingItem>Team analytics (coming soon)</PricingItem>
              </ul>
              <div className="mt-6">
                <LinkButton href="/sign-in" className="w-full">
                  Start free trial
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative px-6 py-12 md:px-12">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-4">
          <Link
            href="https://github.com/mshadmanrahman/ceremonies"
            className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-card px-4 py-2 text-xs font-bold shadow-hard-sm transition-colors hover:border-foreground/40"
          >
            <GitHubIcon />
            Open source on GitHub
          </Link>
          <span className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-card px-4 py-2 text-xs font-bold shadow-hard-sm">
            <ShieldIcon />
            MIT License
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-card px-4 py-2 text-xs font-bold shadow-hard-sm">
            <UsersIcon />
            Built for teams of 5-12
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t-2 border-border px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5">
            <OwlIcon size={20} className="text-primary" />
            <span className="font-display text-sm font-bold tracking-ceremony">
              ceremonies
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link href="https://github.com/mshadmanrahman/ceremonies" className="transition-colors hover:text-foreground">
              GitHub
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/sign-in" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground/60">
            Built with{" "}
            <span className="inline-block" title="love" aria-label="love"><HeartIcon /></span>
            {" "}by{" "}
            <Link href="https://github.com/mshadmanrahman" className="font-bold underline underline-offset-4 transition-colors hover:text-foreground">
              Shadman Rahman
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group h-full rounded-md border-2 border-border bg-card p-6 shadow-hard hover-lift">
      <div
        className="text-primary transition-transform group-hover:scale-110"
        style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-bounce)" }}
      >
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg tracking-ceremony">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline -mt-0.5 text-destructive">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5 text-coffee">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v3" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </svg>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border-2 border-primary bg-primary/10 font-mono text-lg font-bold text-primary shadow-hard-sm">
        {step}
      </div>
      <h3 className="mt-4 font-display text-lg tracking-ceremony">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingItem({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={highlight ? "text-primary" : "text-muted-foreground"}>
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span className={highlight ? "font-bold" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
