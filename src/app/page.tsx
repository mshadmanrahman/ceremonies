import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { LinkButton } from "@/components/shared/link-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OwlIcon, GhostIcon, CardsIcon, CrystalBallIcon } from "@/components/shared/icons";

export default function Home() {
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
        <nav className="flex items-center gap-4">
          <Link
            href="https://github.com/mshadmanrahman/ceremonies"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <LinkButton href="/estimation/demo" variant="outline" size="sm">
            Try it
          </LinkButton>
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-md border-2 border-border bg-card px-3 py-1.5 text-sm font-bold shadow-hard-sm transition-colors hover:border-primary hover:text-primary hover-lift">
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <ThemeToggle />
        </nav>
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
              href="/estimation/demo"
              size="xl"
            >
              Start estimating
            </LinkButton>
            <LinkButton
              href="/retro/demo"
              variant="outline"
              size="xl"
            >
              Run a retro
            </LinkButton>
          </div>
        </div>

        {/* Feature cards */}
        <div className="relative mt-24 grid w-full max-w-3xl gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<CardsIcon size={36} />}
            title="Estimation"
            description="Modified Fibonacci with coffee cup. Votes visible after the big reveal. Push to Jira."
          />
          <FeatureCard
            icon={<CrystalBallIcon width={36} height={36} />}
            title="Retros"
            description="Happy, Sad, Confused. True anonymous writing. Enforced phases with timers."
          />
          <FeatureCard
            icon={<GhostIcon size={36} />}
            title="The Haunting"
            description="Last retro's action items open the next one. No more forgotten commitments."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative px-6 py-10 text-center md:px-12">
        <div className="mx-auto max-w-md space-y-3">
          <p className="text-sm text-muted-foreground">
            Built with{" "}
            <span className="inline-block" title="love" aria-label="love">
              <HeartIcon />
            </span>
            {" "}and mass amounts of{" "}
            <span className="inline-block" title="coffee" aria-label="coffee">
              <CoffeeIcon />
            </span>
            {" "}by{" "}
            <Link
              href="https://github.com/mshadmanrahman"
              className="font-bold underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Shadman Rahman
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Open source under MIT. Go build something great.
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
    <div className="group rounded-md border-2 border-border bg-card p-6 shadow-hard hover-lift">
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
      {/* Steam */}
      <path d="M6 2v3" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </svg>
  );
}
