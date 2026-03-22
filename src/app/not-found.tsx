import Link from "next/link";
import { GhostIcon } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col px-4">
      <header className="flex items-center justify-between px-2 py-5 sm:px-8">
        <Link
          href="/"
          className="text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Back to home
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex flex-1 w-full max-w-sm flex-col items-center justify-center space-y-6 text-center">
        {/* Floating ghost */}
        <div className="ghost-float text-coffee">
          <GhostIcon size={80} />
        </div>

        <div>
          <h1 className="font-display text-4xl tracking-ceremony sm:text-5xl">
            Boo!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page has vanished into thin air.
            <br />
            Even The Haunting can't find it.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border-2 border-border bg-primary px-6 text-sm font-bold text-primary-foreground shadow-hard-sm transition-all hover-lift"
        >
          Take me home
        </Link>
      </div>
    </div>
  );
}
