# Database Migrations

## Why this file exists

On 2026-04-30 the dashboard was silently empty for 11 days because a schema
change (three nullable columns added to `estimation_results`) was applied
directly with `db:push` instead of through a versioned migration file. The push
succeeded in production but left no record of what changed or when. When a
subsequent query relied on those columns the dashboard caught the error and
swallowed it, so nobody noticed until the dashboards were audited.

This document locks down the correct workflow so it cannot happen again.

## The correct workflow

### 1. Generate a migration file

After changing `src/lib/db/schema.ts`, run:

```bash
npm run db:generate
```

This calls `drizzle-kit generate` and writes a numbered SQL file to `drizzle/`.
Example output: `drizzle/0004_add_nullable_estimation_columns.sql`.

Commit that file alongside the schema change. The file is the source of truth
for what changed and when.

### 2. Apply the migration in production

During the deploy process (CI or manual), run:

```bash
npx dotenv -e .env.production.local -- npx drizzle-kit migrate
```

`drizzle-kit migrate` applies only the SQL files that have not yet been applied,
using the `__drizzle_migrations` table as a ledger.

### 3. Never use `db:push` against production

`db:push` compares the live schema to your local schema and applies the diff
directly, with no audit trail. It has been renamed `db:push:dangerous` in
`package.json` to create a moment of pause. The script still works; the name is
the warning.

Use `db:push:dangerous` only for:
- Fresh local dev databases where no migration history matters
- Throwaway Neon branches used for feature testing

Never run it against the production database or any shared environment.

## Adding a new migration

1. Edit `src/lib/db/schema.ts`.
2. `npm run db:generate` to produce `drizzle/NNNN_<description>.sql`.
3. Review the generated SQL before committing. Destructive changes (DROP COLUMN,
   ALTER TYPE) require extra care.
4. Commit both the schema change and the migration file in the same PR.
5. In the deploy, run `drizzle-kit migrate` before the Next.js build so the
   schema is ready when the app starts.

## Rollback

Drizzle does not automatically generate rollback SQL. If you need to roll back:

1. Write a manual `drizzle/NNNN_rollback_<description>.sql`.
2. Apply it with `drizzle-kit migrate` or `psql`.
3. Revert the schema change in `src/lib/db/schema.ts`.
4. Generate a new migration that brings the schema back to its previous state.
