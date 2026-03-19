import Link from "next/link";
import { LinkButton } from "@/components/shared/link-button";
import { OwlIcon, GhostIcon, CardsIcon, CrystalBallIcon } from "@/components/shared/icons";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-xl font-bold tracking-ceremony">
          ceremonies
        </span>
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
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">
          {/* Mascot row */}
          <div className="flex items-center justify-center gap-8">
            <div
              className="text-primary transition-transform hover:scale-110 hover:-rotate-6"
              style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-bounce)" }}
            >
              <OwlIcon size={64} />
            </div>
            <div
              className="text-accent transition-transform hover:scale-110 hover:rotate-6"
              style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-bounce)" }}
            >
              <GhostIcon size={64} />
            </div>
          </div>

          <h1 className="font-display text-5xl tracking-ceremony sm:text-7xl">
            Agile ceremonies,
            <br />
            <span className="text-primary">done right.</span>
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
              href="/estimation/demo"
              variant="outline"
              size="xl"
            >
              Run a retro
            </LinkButton>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid w-full max-w-3xl gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<CardsIcon size={36} />}
            title="Estimation"
            description="Modified Fibonacci with coffee cup. Votes visible after the big reveal. Push to Jira."
          />
          <FeatureCard
            icon={<CrystalBallIcon size={36} />}
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

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        <p>
          Built by{" "}
          <Link
            href="https://github.com/mshadmanrahman"
            className="font-bold underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Shadman Rahman
          </Link>
          . Open source under MIT.
        </p>
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
    <div
      className="group rounded-md border-2 border-border bg-card p-6 shadow-hard hover-lift"
    >
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
