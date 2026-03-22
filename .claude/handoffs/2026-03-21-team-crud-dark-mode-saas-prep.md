# Handoff: Team CRUD + Dark Mode + SaaS Prep
**Date:** 2026-03-21
**Session:** Estimation save, mobile nav, team CRUD, dark mode polish, favicon

## What shipped (4 commits, bf8a034..fbcf530)

1. **Estimation client-side save** — Opt-in save on session summary. Clerk auth required. "Save to unlock The Haunting" CTA. Unsigned users see nudge.
2. **Mobile viewport** — Hamburger nav with shadcn Sheet. Desktop nav hidden on mobile, mobile nav hidden on desktop.
3. **Team CRUD (full)** — Schema (team_members table), 4 API routes, team selector dropdown, create team dialog, invite member dialog, member list with role cycling, team settings page with rename + delete.
4. **Dark mode polish** — Layered surfaces (Vercel-inspired), neutral-warm borders, adapted shadows. Lifted from pitch black to warm charcoal.
5. **Button system restored** — shadcn add sheet had overwritten button.tsx. Restored Ceremonies tokens.
6. **Favicon** — SVG orange owl on dark rounded-rect. Visible on both light/dark browser chrome.
7. **Sign-in redirect** — Replaced Clerk modal with LinkButton to /sign-in (custom branded page).
8. **Estimation icon** — Swapped to playing cards SVG. Haunting card height equalized.

## Clerk setup
- New instance: "Ceremonies" (was clerk-citron-jacket)
- Keys updated in .env.local (pk_test_bWF0dXJl... / sk_test_lUKMQR...)
- GitHub + Google social sign-in enabled
- Production keys needed when going live (Clerk Dashboard > Configure > Production)

## DB state
- `drizzle-kit push` completed. team_members table live. estimation_sessions.teamId nullable.
- Command: `npx dotenv -e .env.local -- npx drizzle-kit push`

## SaaS roadmap (next session priorities)

### Billing (Stripe)
- Free tier: 1 team, 5 members, unlimited sessions
- Pro tier: unlimited teams, unlimited members, Jira integration, session export
- Stripe Checkout + webhook for subscription management
- Vercel Marketplace integration for unified billing

### Jira Integration (paid wedge)
- Push estimation results to Jira (update story points)
- Pull tickets into estimation room (search by project)
- OAuth flow for Jira Cloud

### Session Export
- Export estimation history as CSV/JSON
- Export retro cards + action items as markdown
- Shareable session links (read-only view)

### The Haunting (wire up)
- Dashboard shows open action items from last retro
- When starting a new retro, "haunting phase" auto-loads previous action items
- Action item done/not-done tracking persists across retros

### Team onboarding
- Email-based invites (currently accepts Clerk userId only)
- Invite link generation (share URL, auto-join team)
- Team avatar/logo upload (Vercel Blob)

### Production readiness
- Clerk production keys
- Custom domain (ceremonies.dev or similar)
- OG image (Satori with owl mascot)
- Error boundaries on all pages
- Rate limiting on API routes
- Observability (Vercel Analytics + Speed Insights)

## Files touched this session
- src/app/globals.css (dark mode overhaul)
- src/app/page.tsx (cards, icons, nav, sign-in)
- src/app/(app)/dashboard/page.tsx (team selector, estimation history)
- src/app/(app)/dashboard/team/[teamId]/page.tsx (NEW: team settings)
- src/app/(app)/estimation/[id]/page.tsx (save wiring, teamId)
- src/app/api/estimation/save/route.ts (auth, nullable teamId)
- src/app/api/teams/route.ts (NEW: list + create)
- src/app/api/teams/[teamId]/route.ts (NEW: read + update + delete)
- src/app/api/teams/[teamId]/members/route.ts (NEW: add + remove)
- src/app/api/teams/[teamId]/members/[memberId]/route.ts (NEW: role change)
- src/components/teams/* (NEW: 4 components)
- src/components/shared/mobile-nav.tsx (NEW)
- src/components/shared/icons.tsx (CardsIcon swap)
- src/components/shared/link-button.tsx (onClick prop)
- src/components/shared/theme-toggle.tsx (accent fix)
- src/components/ui/button.tsx (Ceremonies tokens restored)
- src/components/ui/sheet.tsx (NEW: shadcn add)
- src/lib/db/schema.ts (team_members, nullable teamId)
- src/app/icon.svg (NEW: SVG favicon)
