# football-betting · frontend

Next.js 15 frontend for the office football-prediction game. Replaces the
archived [em2024-frontend](https://github.com/football-betting/em2024-frontend).

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS v4 (`@theme` in `app/globals.css`)
- Drizzle ORM + better-sqlite3
- Lucia v3 auth + Argon2id (`oslo/password`)
- Hanken Grotesk + JetBrains Mono via `next/font/google`
- Material Symbols Outlined (icon font — no inline SVG libraries)

## Sibling services

| Service          | Role                                   |
|------------------|----------------------------------------|
| `betting-api/`   | Rust read API (`/rating`, `/user/{id}`, `/game/{id}`) |
| `macht-api/`     | Rust cron importer (external football API → SQLite)    |

Shared SQLite DB lives at `../shared/db/database.db`. Schema authority is
`db/schema.ts` in this repo; the Rust services consume the same tables.

## Development

```bash
pnpm install
pnpm db:reset      # wipe + migrate + seed (FE-007)
pnpm dev           # http://localhost:3000
```

See [docs in the workspace repo](https://github.com/football-betting/workspace)
for the full functional spec and ticket backlog.
