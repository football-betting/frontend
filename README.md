# football-betting · frontend

[![frontend-ci](https://github.com/football-betting/frontend/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/football-betting/frontend/actions/workflows/frontend-ci.yml)
[![codecov](https://codecov.io/gh/football-betting/frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/football-betting/frontend)

Next.js 16 frontend for the office football-prediction game. Replaces the
archived [em2024-frontend](https://github.com/football-betting/em2024-frontend).

## Stack

- Next.js 16 (App Router) + TypeScript (strict)
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

Seed users (all share password `test1234`):

| Email | Username | Department |
|---|---|---|
| `me@dev.local` | TestUser | Langenfeld |
| `ada@dev.local` | AdaLovelace | Maintz |
| `alan@dev.local` | AlanTuring | Maintz |
| `marie@dev.local` | MarieCurie | Mannheim |
| `nikola@dev.local` | NikolaTesla | Mannheim |
| `rosa@dev.local` | RosaParks | Mannheim |
| `albert@dev.local` | AlbertEinstein | Langenfeld |
| `isaac@dev.local` | IsaacNewton | Langenfeld |

See [docs in the workspace repo](https://github.com/football-betting/workspace)
for the full functional spec and ticket backlog.
