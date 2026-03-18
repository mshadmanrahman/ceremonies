import Link from "next/link";
import { LinkButton } from "@/components/shared/link-button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="text-lg font-medium tracking-tight">ceremonies</span>
        <nav className="flex items-center gap-4">
          <Link
            href="https://github.com/mshadmanrahman/ceremonies"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <LinkButton href="/estimation/demo" variant="outline" size="sm">
            Try it
          </LinkButton>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Agile ceremonies,
            <br />
            done right.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Estimation and retros in one place. Opinionated phases, true
            anonymity, and action items that actually get done. Open source.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LinkButton href="/estimation/demo" size="lg">
              Start estimating
            </LinkButton>
            <LinkButton href="/estimation/demo" variant="outline" size="lg">
              Run a retro
            </LinkButton>
          </div>
        </div>

        <div className="mt-24 grid w-full max-w-2xl gap-px rounded-lg border bg-border sm:grid-cols-3">
          <Feature
            title="Estimation"
            description="Modified Fibonacci with coffee cup. Votes visible after reveal. Push to Jira."
          />
          <Feature
            title="Retros"
            description="Happy, Sad, Confused. True anonymous writing. Enforced phases with timers."
          />
          <Feature
            title="The Haunting"
            description="Last retro's action items open the next one. No more forgotten commitments."
          />
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground md:px-12">
        <p>
          Built by{" "}
          <Link
            href="https://github.com/mshadmanrahman"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Shadman Rahman
          </Link>
          . Open source under MIT.
        </p>
      </footer>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-6">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
