<p align="center">
  <img src="public/ceremonies_favicon.svg" height="80" alt="Ceremonies owl logo" />
</p>

<h1 align="center">Ceremonies</h1>

<p align="center">
  Open-source agile ceremony toolkit.<br />
  Estimation and retros in one place. Opinionated phases, true anonymity, and action items that haunt you.
</p>

<p align="center">
  <a href="https://ceremonies.dev">Live Demo</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#self-hosting">Self-Hosting</a> &middot;
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/mshadmanrahman/ceremonies/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://ceremonies.dev"><img src="https://img.shields.io/badge/demo-ceremonies.dev-orange.svg" alt="Live Demo" /></a>
</p>

---

## Why Ceremonies?

Most teams use one tool for estimation and another for retros. Neither talks to the other. Action items get forgotten. Anonymity is fake (you can see who's typing). Ceremonies fixes all of that.

**Opinionated by design:**

- Retros are anonymous. Estimation votes are visible. Not configurable. Core product belief.
- Ceremony phases are enforced. You can't skip the uncomfortable parts.
- Last retro's action items open the next retro ("The Haunting"). No more forgotten commitments.
- Modified Fibonacci includes 4 (the 3-to-5 gap causes most estimation arguments).
- Zero auth for participants. Join with a room code. Only facilitators need an account.

## Features

### Estimation Room

- **Card deck:** 1, 2, 3, 4, 5, 8, 13, ?, and coffee cup (trivial, skip estimating)
- **Big reveal:** votes hidden until everyone's in, then animated reveal with names
- **? triggers discussion:** anyone voting ? forces a conversation before re-vote
- **Session history:** past rounds with final estimates, copy summary for Slack
- **Real-time:** instant sync via PartyKit WebSockets

### Retro Room

- **Phase 0 - The Haunting:** review action items from the last retro (done or not done?)
- **Phase 1 - Silent Write:** add Happy, Sad, or Confused cards with TRUE anonymity (no typing indicators, no avatars)
- **Phase 2 - Group & Label:** shared canvas with real-time cursors, proximity-based auto-clustering
- **Phase 3 - Vote:** 3 anonymous votes per person, mystery box reveal when all votes are in
- **Phase 4 - Discuss & Act:** topics ranked by votes, inline action items per topic
- **Close:** summary persisted, action items carry forward to next retro

### Dashboard

- Past retros with action item status
- Quick-start buttons for new sessions
- Team management (create, invite, manage members)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Real-time | PartyKit (WebSocket rooms) |
| Auth | Clerk (Google + GitHub SSO) |
| Database | Neon Postgres + Drizzle ORM |
| Icons | iconoir-react + custom SVGs |
| Typography | Newsreader (display) + Space Grotesk (body) + Geist Mono (code) |
| Deploy | Vercel + PartyKit Cloud |

## Quick Start

### Prerequisites

- Node.js 20+
- A [Clerk](https://clerk.com) account (free tier works)
- A [Neon](https://neon.tech) database (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/mshadmanrahman/ceremonies.git
cd ceremonies

# Install
npm install

# Configure environment
cp .env.example .env.local
# Fill in your Clerk and Neon credentials (see .env.example for details)

# Push database schema
npm run db:push

# Run (starts Next.js on :3456 + PartyKit on :1999)
npm run dev
```

Open [http://localhost:3456](http://localhost:3456).

## Self-Hosting

Ceremonies is MIT-licensed and designed to be self-hosted.

### Vercel + PartyKit Cloud (recommended)

1. Fork this repo
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variables (Clerk keys, Neon database URL)
4. Deploy PartyKit: `npx partykit deploy`
5. Set `NEXT_PUBLIC_PARTYKIT_HOST` to your PartyKit deployment URL

### Docker (coming soon)

Docker support is planned for teams that need to run everything on their own infrastructure.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes (retro save, estimation save, teams)
    (app)/                # Authenticated app routes
      dashboard/          # Team dashboard
      estimation/[id]/    # Estimation room
      retro/[id]/         # Retro room
  components/
    estimation/           # Card deck, vote card, facilitator controls
    retro/                # 6 phase components (haunting, writing, grouping, voting, discuss-act)
    teams/                # Team CRUD, member management
    shared/               # Theme toggle, icons, nav
    ui/                   # shadcn/ui primitives
  db/                     # Drizzle schema + connection
  hooks/                  # useEstimationRoom, useRetroRoom (PartyKit hooks)
  lib/                    # State machines, utilities
party/                    # PartyKit servers (estimation + retro)
```

## Design

Ceremonies uses a warm neobrutalist design system:

- **Palette:** Warm amber primary, cornflower blue accent, cream/dark backgrounds
- **Interactions:** Hard vertical shadows that press down on hover (inspired by iconoir.com)
- **Border radius:** 4px (nearly sharp, intentional)
- **Mascots:** Owl (estimation) and Ghost (retro/haunting) in iconoir stroke style

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## License

MIT. See [LICENSE](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/mshadmanrahman">Shadman Rahman</a>
</p>
