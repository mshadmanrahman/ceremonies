# Why Your Retro Action Items Disappear (And What I Built About It)

**Subtitle:** I got tired of retros that forget everything, so I made a tool that haunts you with last sprint's commitments.

---

## TLDR

- Most retro tools are sticky-note canvases that let teams skip the uncomfortable parts
- Ceremonies.dev is a free, open-source agile tool with enforced phases, true anonymity, and something called "The Haunting"
- The Haunting = every retro opens by confronting last sprint's unfinished action items
- Estimation room adds 4 to the Fibonacci scale (the 3-to-5 gap is where teams waste the most time arguing)
- Live at [ceremonies.dev](https://ceremonies.dev). No install. Participants don't even need accounts. [GitHub](https://github.com/mshadmanrahman/ceremonies)

---

Here's a number that should bother you: teams forget roughly 80% of what they commit to in retrospectives.

Not because they don't care. Because nothing makes them remember.

Your team finishes a retro. You've got five action items on a Miro board. Everyone nods. Sprint starts. Three standups later, nobody can tell you what those five things were.

Two weeks pass. New retro. "So... what did we commit to last time?" Someone scrolls through Confluence. Someone else opens Slack. Someone shrugs.

You start fresh. Again.

I've been a PM long enough to watch this loop play out dozens of times. And I finally got frustrated enough to do something about it.

## The problem isn't discipline. It's tooling.

Miro, FigJam, EasyRetro. They all give you a canvas. Sticky notes. Maybe a timer. They call it a retrospective.

But they don't have opinions. They don't enforce phases. They don't prevent anchoring bias. They definitely don't remember what your team said it would do.

They're whiteboards dressed up in agile clothing.

## So I built Ceremonies

[Ceremonies](https://ceremonies.dev) is a focused web app for two things: estimation and retrospectives. It's opinionated about how those ceremonies should work.

**The big idea: The Haunting.**

Every retro opens with Phase 0. Your previous action items appear on screen. Done or not done? No skipping. No pretending. The unfinished work comes back to haunt you.

It's named that for a reason.

## What makes this different from [insert tool]

**True anonymity.** Not "your name is hidden but everyone can see you typing." No typing indicators. No avatars. No cursor movement during the writing phase. You write what you actually think.

**Enforced phases.** You can't jump from writing to voting. You can't skip grouping. Research on group dynamics shows these phases prevent anchoring and groupthink. The tool enforces the structure so the facilitator doesn't have to fight for it.

**Modified Fibonacci with 4.** Standard Fibonacci goes 3, 5. That gap is where estimation arguments live. "Is this a 3 or a 5?" over and over. Adding 4 closes the gap. Arguments get shorter.

**Zero auth for participants.** Room code, join, done. No account, no email, no friction. Only facilitators need to sign in.

## The tech (for the curious)

- Next.js + PartyKit for real-time WebSocket sync
- Clerk for auth (Google + GitHub SSO)
- Neon Postgres for persistence
- Proximity-based auto-clustering in the grouping phase (like Miro's canvas, but with Union-Find algorithm that groups cards within 120px of each other)
- Open source, MIT licensed

We've stress-tested it with 15 simultaneous participants and 45 cards. The grouping holds up.

## What I've learned shipping this

Building a ceremony tool taught me something I should have known as a PM: the hard part isn't the features. It's the opinions.

Deciding that teams *must* confront last sprint's action items before writing new cards. That's a product decision that will annoy some people. But it's the right one.

Deciding that voting should be anonymous with a simultaneous reveal. That's a choice that prevents groupthink but takes away the facilitator's ability to read the room during voting.

Every opinionated feature is a trade-off. The tool I wanted to build isn't a canvas with no opinions. It's a facilitator that never gets tired of running the process correctly.

## Try it

[ceremonies.dev](https://ceremonies.dev)

No install. No credit card. No 14-day trial. Participants don't even need accounts.

The free plan gives you 10 saved sessions. If your team needs more, there's a Pro plan. But the tool works without paying.

And if you're the kind of person who wants to self-host: [it's all on GitHub](https://github.com/mshadmanrahman/ceremonies).

---

*If you've built tools for your own team's process, I'd love to hear about it. What ceremony or workflow drives you crazy enough to build something?*
