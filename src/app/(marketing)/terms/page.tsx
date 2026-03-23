import Link from "next/link";
import { OwlIcon } from "@/components/shared/icons";

export const metadata = {
  title: "Terms of Service | Ceremonies",
  description: "Terms of Service for Ceremonies, the open-source agile ceremony toolkit.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-0">
      <Link href="/" className="mb-10 flex items-center gap-1.5">
        <OwlIcon size={24} className="text-primary" />
        <span className="font-display text-lg font-bold tracking-ceremony">
          ceremonies
        </span>
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-ceremony">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 23, 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            1. What Ceremonies is
          </h2>
          <p>
            Ceremonies is an open-source agile ceremony toolkit for running
            estimation and retrospective sessions. The hosted version at
            ceremonies.dev is operated by Shadman Rahman ("we", "us").
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            2. Accounts
          </h2>
          <p>
            You sign in via Google or GitHub through Clerk. You are responsible
            for keeping your account credentials secure. We may suspend accounts
            that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            3. Free and Pro plans
          </h2>
          <p>
            The Free plan includes 1 team, 5 members, and 10 sessions per month.
            The Pro plan removes these limits and is billed monthly via Stripe.
            You can cancel at any time through the billing portal. Refunds are
            handled on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            4. Acceptable use
          </h2>
          <p>
            Use Ceremonies for legitimate agile ceremonies with your team. Do
            not abuse the service, attempt to disrupt other users, or use it
            for unlawful purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            5. Your data
          </h2>
          <p>
            You own the content you create (retro cards, estimation results,
            action items). We store it to provide the service. You can delete
            your teams and data at any time. See our{" "}
            <Link href="/privacy" className="font-bold text-foreground underline underline-offset-4">
              Privacy Policy
            </Link>{" "}
            for details on data handling.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            6. Open source
          </h2>
          <p>
            The Ceremonies source code is licensed under MIT. The hosted service
            at ceremonies.dev is a separate offering with its own terms. You are
            free to self-host the open-source version without these terms
            applying.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            7. Availability and liability
          </h2>
          <p>
            We aim for high availability but provide the service "as is" without
            guarantees. We are not liable for data loss, downtime, or damages
            arising from use of the service. Our total liability is limited to
            the amount you paid us in the 12 months prior.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            8. Changes
          </h2>
          <p>
            We may update these terms. Continued use after changes constitutes
            acceptance. We will notify users of material changes via the app.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Contact
          </h2>
          <p>
            Questions? Reach us at{" "}
            <a
              href="mailto:hello@ceremonies.dev"
              className="font-bold text-foreground underline underline-offset-4"
            >
              hello@ceremonies.dev
            </a>{" "}
            or open an issue on{" "}
            <a
              href="https://github.com/mshadmanrahman/ceremonies"
              className="font-bold text-foreground underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
