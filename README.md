<p align="center">
  <img src="public/ceremonies_favicon.svg" height="80" alt="Ceremonies owl logo" />
</p>

<h1 align="center">Ceremonies</h1>

<p align="center">
  The agile ceremony tool that actually remembers what your team committed to.
</p>

<p align="center">
  <a href="https://ceremonies.dev">ceremonies.dev</a> &middot;
  <a href="#try-it-in-30-seconds">Try it</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#why-ceremonies">Why Ceremonies?</a> &middot;
  <a href="#self-hosting">Self-Hosting</a> &middot;
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/mshadmanrahman/ceremonies/stargazers"><img src="https://img.shields.io/github/stars/mshadmanrahman/ceremonies?style=social" alt="GitHub stars" /></a>
  <a href="https://github.com/mshadmanrahman/ceremonies/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://ceremonies.dev"><img src="https://img.shields.io/badge/live-ceremonies.dev-orange.svg" alt="Live Product" /></a>
</p>

---

Your team uses one tool for estimation and another for retros. Action items get written in a doc nobody opens again. And every sprint retrospective starts with a vague memory of what you all agreed to fix last time.

Ceremonies is a single, focused web app for the two ceremonies that matter most: **estimation** and **retrospectives**. It's opinionated about how those ceremonies should run — and it doesn't let you skip the uncomfortable parts.

---

## Try it in 30 seconds

No install. No signup for participants. Just go to **[ceremonies.dev](https://ceremonies.dev)**.

- Facilitators sign in to create rooms
- Participants join with a room code — no account needed
- Works in the browser, on any device

---

## Why Ceremonies?

Most ceremony tools are whiteboards dressed up in agile clothing. They give you sticky notes and call it a retro. They let you type numbers and call it estimation. They don't have opinions about *how* the ceremony should work — they just give you a canvas.

Ceremonies is different. It has opinions baked in.

### True anonymity in retros

In most tools, "anonymous" means your name isn't on the card. But everyone can see who's typing. Everyone can see the cursor moving. The social pressure is still there — you just can't see the names.

Ceremonies removes it entirely. No typing indicators. No avatars. No presence hints during the writing phase. You write what you actually think.

### The Haunting

Every retro opens with Phase 0: a review of the action items from your last retro. Done or not done? No skipping it, no pretending it didn't happen.

Most teams forget 80% of what they commit to in retros. The Haunting is the fix. It's named that for a reason — the unfinished work comes back.

### Modified Fibonacci with 4

Standard Fibonacci goes 3 → 5. That gap is where most estimation arguments live — "is this a 3 or a 5?" teams go in circles. Ceremonies adds 4 to the deck. The 3-to-5 gap closes. Arguments shorten.

### Enforced phases

You can't jump from writing to voting. You can't skip grouping. The phases exist because the research on group dynamics shows they matter — writing before discussing prevents anchoring, voting before discussing prevents groupthink. The tool enforces the structure so the facilitator doesn't have to.

### Zero auth for participants

Participants join with a room code. That's it. No account, no email, no friction. Only facilitators need a login.

---

## Features

### Estimation Room

A clean, focused poker planning experience for your whole team.

- **Card deck:** 1, 2, 3, 4, 5, 8, 13, ?, and coffee cup (trivial — skip estimating)
- **Big reveal:** votes stay hidden until everyone's in, then animated simultaneous reveal with names
- **? forces a conversation:** anyone who votes ? triggers a mandatory discussion before re-vote
- **Session history:** past rounds with final estimates, copy summary for Slack in one click
- **Real-time sync:** instant updates via WebSockets — no refreshing, no lag

### Retro Room

A structured five-phase retrospective with permanent memory.

- **Phase 0 — The Haunting:** open with last retro's action items. Acknowledge what got done. Acknowledge what didn't.
- **Phase 1 — Silent Write:** add Happy, Sad, or Confused cards with true anonymity — no typing indicators, no avatars, no social pressure
- **Phase 2 — Group and Label:** shared canvas with real-time cursors, proximity-based auto-clustering to find themes
- **Phase 3 — Vote:** 3 anonymous votes per person, mystery box reveal when all votes are cast
- **Phase 4 — Discuss and Act:** topics ranked by votes, inline action items per topic so nothing gets lost in a doc
- **Close:** full summary persisted, action items carry forward automatically to the next retro

### Dashboard

- Past retros with action item status at a glance
- Quick-start buttons for new estimation or retro sessions
- Team management — create, invite, and manage members

---

## How it compares to Miro, Mural, and FigJam

Those tools are general-purpose collaborative canvases. They're great for brainstorming, diagramming, and workshops. But they have no opinions about how a retro or estimation session should run. You're responsible for enforcing the phases, preventing anchoring, ensuring real anonymity, and remembering last sprint's action items.

Ceremonies is purpose-built. The phases are built in. The anonymity is structural, not cosmetic. The memory persists across sessions. You don't have to set it up or enforce it — it just works that way.

If your team runs ceremonies in Miro or FigJam, you're using the wrong tool for the job.

---

## Self-Hosting

Ceremonies is MIT-licensed and designed to be self-hosted.

### Vercel + PartyKit Cloud (recommended)

1. Fork this repo
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variables (Clerk keys, Neon database URL — see `.env.example`)
4. Deploy PartyKit: `npx partykit deploy`
5. Set `NEXT_PUBLIC_PARTYKIT_HOST` to your PartyKit deployment URL

### Run locally

```bash
git clone https://github.com/mshadmanrahman/ceremonies.git
cd ceremonies
npm install
cp .env.example .env.local
# Fill in Clerk and Neon credentials
npm run db:push
npm run dev
```

Opens at [http://localhost:3456](http://localhost:3456). PartyKit runs on `:1999` in parallel.

**Prerequisites:** Node.js 20+, a [Clerk](https://clerk.com) account (free tier), a [Neon](https://neon.tech) database (free tier).

### Docker

Docker support is planned for teams that need everything on their own infrastructure.

---

## Tech Stack

For contributors and the technically curious.

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Real-time | PartyKit (WebSocket rooms) |
| Auth | Clerk (Google + GitHub SSO) |
| Database | Neon Postgres + Drizzle ORM |
| Deploy | Vercel + PartyKit Cloud |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

---

## Works Great With

- **[Granola](https://www.granola.ai?via=shadman-rahman)** -- AI meeting notes that capture everything. Use Granola during your ceremonies, then let the transcript feed into your retro action items and estimation context. No more "what did we agree on?"

---

## Support

If this saved you time, give it a star -- it helps others find it and keeps development going.

[![GitHub stars](https://img.shields.io/github/stars/mshadmanrahman/ceremonies?style=social)](https://github.com/mshadmanrahman/ceremonies/stargazers)

---

## See Also

- **[pm-pilot](https://github.com/mshadmanrahman/pm-pilot)** -- Claude Code configured for PMs. 25 skills out of the box.
- **[root-kg](https://github.com/mshadmanrahman/root-kg)** -- Personal knowledge graph. Ask questions across all your notes, meetings, and emails.
- **[morning-digest](https://github.com/mshadmanrahman/morning-digest)** -- Your morning briefed in 30 seconds. Calendar, email, Slack, and action items.
- **[discovery-md](https://github.com/mshadmanrahman/discovery-md)** -- AI product discovery for PMs. From braindump to stakeholder one-pager.
- **[bug-shepherd](https://github.com/mshadmanrahman/bug-shepherd)** -- Zero-code bug triage for PMs. Reproduce and sync bugs without reading code.
- **[claudecode-guide](https://github.com/mshadmanrahman/claudecode-guide)** -- The friendly guide to Claude Code.

---

## License

MIT. See [LICENSE](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/mshadmanrahman">Shadman Rahman</a>
</p>
