# Contributing to Ceremonies

Thanks for wanting to contribute! Ceremonies is open source under MIT and welcomes contributions of all kinds.

## Development Setup

### Prerequisites

- Node.js 20+
- npm
- A [Clerk](https://clerk.com) account (free tier)
- A [Neon](https://neon.tech) database (free tier)

### Getting Started

```bash
git clone https://github.com/mshadmanrahman/ceremonies.git
cd ceremonies
npm install
cp .env.example .env.local
# Fill in Clerk + Neon credentials
npm run db:push
npm run dev
```

This starts:
- Next.js dev server on port 3456
- PartyKit dev server on port 1999

### Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both Next.js + PartyKit |
| `npm run dev:next` | Start only Next.js (port 3456) |
| `npm run dev:party` | Start only PartyKit (port 1999) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Drizzle schema to Neon |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run storybook` | Start Storybook (port 6006) |

## Code Style

- **TypeScript** everywhere. No `any` types.
- **Immutable patterns.** Create new objects, don't mutate.
- **Small files.** 200-400 lines typical, 800 max.
- **shadcn/ui** for UI primitives. Don't build raw HTML controls.
- **iconoir-react** for icons. Custom SVGs only when iconoir doesn't have what you need.
- **Tailwind CSS v4** for styling. Use design tokens from `globals.css`.

## Architecture

### State Machines

Ceremony flows are driven by state machines in `src/lib/state-machines/`. Each ceremony has defined phases with explicit transitions. Changes to ceremony flow should start by updating the state machine.

### Real-time (PartyKit)

WebSocket servers live in `party/`. Each ceremony type has its own PartyKit server. The client hooks (`src/hooks/`) handle connection, reconnection, and message parsing.

### Persistence

PartyKit servers call Next.js API routes (`src/app/api/`) to persist session data to Neon Postgres via Drizzle ORM when a ceremony closes.

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run build` to verify
4. Write a clear PR description explaining what and why
5. Link any related issues

### PR Guidelines

- Keep PRs focused. One feature or fix per PR.
- Include screenshots for UI changes.
- Don't change unrelated code.
- Update component stories if you modify UI components.

## Reporting Issues

Use [GitHub Issues](https://github.com/mshadmanrahman/ceremonies/issues). Include:

- What you expected
- What actually happened
- Steps to reproduce
- Browser and OS

## Design System

If you're making UI changes, read `.impeccable.md` at the project root for the full design system reference (colors, shadows, typography, interaction patterns).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
