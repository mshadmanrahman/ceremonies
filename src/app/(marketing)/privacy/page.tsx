import Link from "next/link";
import { OwlIcon } from "@/components/shared/icons";

export const metadata = {
  title: "Privacy Policy | Ceremonies",
  description: "Privacy Policy for Ceremonies, the open-source agile ceremony toolkit.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-0">
      <Link href="/" className="mb-10 flex items-center gap-1.5">
        <OwlIcon size={24} className="text-primary" />
        <span className="font-display text-lg font-bold tracking-ceremony">
          ceremonies
        </span>
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-ceremony">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 23, 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            What we collect
          </h2>
          <p className="mb-3">
            Ceremonies collects the minimum data needed to run the service:
          </p>
          <ul className="list-inside list-disc space-y-1.5 pl-2">
            <li>
              <span className="font-bold text-foreground">Account info:</span>{" "}
              Name, email, and profile picture from your Google or GitHub
              account (via Clerk).
            </li>
            <li>
              <span className="font-bold text-foreground">Team data:</span>{" "}
              Team names, members, retro cards, estimation votes, and action
              items you create.
            </li>
            <li>
              <span className="font-bold text-foreground">Payment info:</span>{" "}
              Processed by Stripe. We never see or store your card number.
              Stripe handles PCI compliance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            How we use it
          </h2>
          <ul className="list-inside list-disc space-y-1.5 pl-2">
            <li>To provide and improve the Ceremonies service</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send transactional emails (e.g. team invites)</li>
          </ul>
          <p className="mt-3">
            We do not sell your data. We do not run ads. We do not use your
            data for training AI models.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Third-party services
          </h2>
          <ul className="list-inside list-disc space-y-1.5 pl-2">
            <li>
              <span className="font-bold text-foreground">Clerk</span>{" "}
              (authentication):{" "}
              <a href="https://clerk.com/privacy" className="underline underline-offset-4 hover:text-foreground">
                clerk.com/privacy
              </a>
            </li>
            <li>
              <span className="font-bold text-foreground">Stripe</span>{" "}
              (payments):{" "}
              <a href="https://stripe.com/privacy" className="underline underline-offset-4 hover:text-foreground">
                stripe.com/privacy
              </a>
            </li>
            <li>
              <span className="font-bold text-foreground">Neon</span>{" "}
              (database):{" "}
              <a href="https://neon.tech/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
                neon.tech/privacy-policy
              </a>
            </li>
            <li>
              <span className="font-bold text-foreground">Vercel</span>{" "}
              (hosting):{" "}
              <a href="https://vercel.com/legal/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
                vercel.com/legal/privacy-policy
              </a>
            </li>
            <li>
              <span className="font-bold text-foreground">PartyKit</span>{" "}
              (real-time):{" "}
              <a href="https://partykit.io/privacy" className="underline underline-offset-4 hover:text-foreground">
                partykit.io/privacy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Cookies
          </h2>
          <p>
            We use essential cookies for authentication (Clerk session tokens).
            No tracking cookies, no analytics cookies, no third-party ad
            cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Data retention
          </h2>
          <p>
            Your data is retained while your account is active. When you delete
            a team, its sessions and data are permanently removed. If you delete
            your account, all associated data is deleted within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Your rights (GDPR)
          </h2>
          <p>
            If you are in the EU/EEA, you have the right to access, correct,
            delete, or export your personal data. Contact us and we will respond
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground tracking-ceremony">
            Contact
          </h2>
          <p>
            Privacy questions? Reach us at{" "}
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
