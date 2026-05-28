# Design Implementation Notes

Reference notes for Claude Code when implementing the Next.js frontend from
the HTML mockups in this folder.

**Status of the HTML files:** visual references only — NOT 1:1 templates.
Several elements diverge from the actual system spec and must be corrected
during implementation.

**Source of truth for behaviour:** `../../docs/FRONTEND_FUNKTIONS_SPEC.md`.
If anything in this folder conflicts with the spec, the spec wins.

**Source of truth for visuals:** `DESIGN.md` (design tokens). Port these into
`frontend/tailwind.config.ts` when bootstrapping.

---

## Cross-cutting rules (apply to all files)

### Replace external assets with local ones
- All `<img src="https://lh3.googleusercontent.com/...">` references are
  AI-generated placeholders. Replace with:
  - **Flags**: SVG files in `public/svg/<TLA>.svg` (24 country files already
    exist in `em2024-frontend/public/svg/` — copy them over).
  - **Stadium / hero backgrounds**: use a CSS gradient (`stadium-glow` class
    pattern in `signup.html` lines 117–119) or commission one real asset
    later. Do not link external URLs.

### Drop over-engineered effects
- The login.html 3D parallax tilt (lines 184–206) — remove. Looks gimmicky
  and breaks on touch devices.
- Mouse-following gradients — remove.
- Keep: live-pulse animation on Live badge, hover transitions, focus rings,
  save-button success state.

### Use the Tailwind token names from `DESIGN.md`
- The tailwind config in every HTML file already defines `headline-lg`,
  `data-mono`, `label-caps`, `surface-container`, etc. Port these to
  `frontend/tailwind.config.ts` as a single design-system file. Then every
  page references the same tokens.

### Real data, not mock data
- Replace "Marco R. / Sarah K. / Lukas M." (dashboard.html ranking widget)
  with whatever the Rust `/rating` API returns at runtime.
- Replace "Test User" with the actually-logged-in user.
- Replace "2,491 USERS" pagination footer (ranking_table.html line 246) —
  pull real count from the API. The office pool will have ~10–50 users,
  not 2.5k.

### Scoring system — single source of truth
The correct point values are **4 / 2 / 1 / 0** with bonus **+15 / +7**.
Every page that mentions points must use these.

| Outcome | Points | Color token |
|---|---|---|
| Exact score | **4** | success / green |
| Goal difference correct (wrong score) | **2** | warning / yellow |
| Correct winner or draw | **1** | neutral / no special color |
| Wrong | **0** | error / red |
| Tournament winner predicted (signup) | **+15** | (shown in BONUS column) |
| Secret winner predicted (signup) | **+7**  | (shown in BONUS column) |

---

## File-by-file changes

### `login.html`

| Where | What | Action |
|---|---|---|
| Line 136 | Subtitle "PRO-GRADE ANALYTICS & FORECASTING" | **Remove** — sounds like a SaaS product. Tagline is optional; if kept use "Office Tournament Pool". |
| Line 179 | Footer "© 2024 TOURNAMENT PREDICTOR / DATA SECURED" | **Remove the "/ DATA SECURED"** — it's filler. Keep only the © line. |
| Lines 184–206 | 3D parallax tilt JS | **Remove entirely.** |
| Line 126 | External stadium image URL | Replace with CSS gradient (see signup.html `stadium-glow`). |
| Line 11–104 | Tailwind config inline | Move to `frontend/tailwind.config.ts`. |

### `signup.html`

| Where | What | Action |
|---|---|---|
| Line 135 | Subtitle "Strategic Analytics & Forecasts" | **Remove.** |
| Line 172 | Label "Security Credential" | **Rename to "Password"**. |
| After line 177 | (Missing) Repeat-Password field | **Add a second password field**. The spec requires a client-side check `password !== rePassword` before submit. |
| Line 191 | Label "Public Champion" | **Rename to "Tournament Winner"**. |
| Line 202 | Label "Secret Dark Horse" | **Rename to "Secret Winner"**. |
| Lines 194–197 | Hardcoded teams list inline `<script>` | Move to `lib/data/teams.ts`. Don't inline. |
| Lines 223–226 | Footer "System: Live-Sync Active / Ver: 2.4.0-Stable" | **Remove.** Pure fiction. |
| Lines 183–185 | Department options Langenfeld/Mannheim/Mainz | ✅ Correct — keep. |
| Lines 229–232 | Background atmospheric blur divs | Keep — purely visual, no fake feature. |

### `dashboard.html`

| Where | What | Action |
|---|---|---|
| Lines 340–353 | "QUICK STATS" widget with 85% Accuracy / 12 Correct Tips | **Remove entirely OR replace** with a 4-tile grid showing the real stats from the user object: EXACT, DIFF, WINS, BONUS. There is no "accuracy %" concept in the system. |
| Lines 252–339 | Right-column ranking sidebar | ✅ Layout is correct (top 3 + active user + neighbors with primary highlight). Keep. |
| Lines 152–188 | Live-match card with YOUR TIP + POINTS EARNED | ✅ Correct. Keep the +4 / +2 / +1 / 0 color treatment. |
| Lines 189–249 | Upcoming fixtures with input + SAVE | ✅ Correct. Keep. |
| Lines 256–262 | Ranking tabs (Global / Langenfeld / Mannheim / Mainz) | ✅ Correct. Keep. |
| Lines 357–370 | Bottom nav (Dashboard / Ranking / Profile) | ✅ Correct mobile pattern. Keep. |

### `ranking_table.html`

| Where | What | Action |
|---|---|---|
| Line 152 | Subtitle "Global and local standings for the European Championship." | **Remove "European Championship"** — make it tournament-agnostic. Use "Office tournament standings" or pull tournament name from a config. |
| Line 246 | "SHOWING 124-130 OF 2,491 USERS" | **Use real count from API.** Realistic range: 5–50 users. |
| Lines 262–268 | Scoring System box — **WRONG VALUES** | **Fix the values:**<br>• "Exact Score 5 Pts" → **4 Pts**<br>• "Goal Difference 3 Pts" → **2 Pts**<br>• "Correct Outcome 2 Pts" → **1 Pt**<br>• Add: "Tournament Winner +15 Pts (bonus)"<br>• Add: "Secret Winner +7 Pts (bonus)" |
| Lines 270–277 | "Season Rewards / Tournament Prizes" block with stadium image | **Remove entirely.** There are no rewards or prizes — it's an office pool. |
| Lines 281–294 | Bottom nav | ✅ Correct. Keep. |

### `match_detail.html`

| Where | What | Action |
|---|---|---|
| Line 209 (and similar around 220–234) | Label "Correct Outcome" paired with "2 pts" | **Label/value mismatch.** 2 pts = goal-difference, not correct-outcome. Fix the label to **"Goal Difference"** wherever 2 pts is shown. |
| Username list (Marie Curie, Alan Turing, Nikola Tesla, etc.) | Mock names | Replace with real data from API endpoint `GET /game/{id}` (Rust). |
| Line 148 | "FINISHED" badge | ✅ Correct. Add IN_PLAY (pulsing red) and SCHEDULED variants. |
| Line 165 | "FULL TIME" sublabel | ✅ Correct for finished matches. For IN_PLAY use match minute (e.g. "64'"). For SCHEDULED use kick-off time. |
| Score color tokens (4 pts green, 2 pts yellow, 1 pt neutral, 0 pts red) | ✅ Correct. Match the dashboard's live-match colors. |

### `profile.html`

| Where | What | Action |
|---|---|---|
| Lines 127–161 | Header: username, Global Ranking #142, Total Points 1845, EXACT/DIFF/WINS/BONUS tiles | ✅ Layout is correct. Pull values from API at runtime. |
| Lines 163–189 | Tournament Winner + Secret Winner cards with trophy / hidden-eye icons | ✅ Excellent solution. Keep. |
| Line 195 | "SEASON 2024" label | **Make dynamic** — pull from a tournament config rather than hardcoding. |
| Lines 213, 230, 247, 264, 281 | Sub-labels "Semi-final / Quarter-final / Round of 16" under each match | **Remove.** No tournament stages exist in the system. Replace with the match date (e.g. "15. Juni 2024"). |
| Lines 223, 240, 257, 274, 291 | Points column shows `+150`, `+50`, `0` | **Fix to the real 4 / 2 / 1 / 0 scale.** Tournament-winner bonus (+15) and secret-winner bonus (+7) appear ONLY in the BONUS stat tile at the top, NEVER per-match. |
| Lines 169, 181 | External flag image URLs | Replace with local SVG flags from `public/svg/`. |
| Lines 305–317 | Bottom nav | ✅ Correct. Keep. |

---

## Typography (font stack)

All HTML files currently use **Hanken Grotesk** as the only font, including
for the `data-mono` token — which is wrong, because Hanken Grotesk is a
proportional font, not monospaced.

### Recommendation

Keep Hanken Grotesk for the UI, add a real mono font for tabular data.

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
}
```

| Use case | Font | Why |
|---|---|---|
| Headlines, body, labels, buttons | **Hanken Grotesk** | Modern grotesque, clean, broadcast feel, 5 weights (400–900). Already in design. |
| Scores in match cards (`2 : 1`) | **JetBrains Mono** | Tabular alignment — `1` and `0` same width as `8`. Critical for grids and tables. |
| Points per match (`+4`, `+2`, `0`) | **JetBrains Mono** | Same reason — column alignment in ranking + history tables. |
| Ranking numbers (`#142`, position) | **JetBrains Mono** | Avoids the kerning jiggle when numbers change. |
| Times (`20:00`) | **JetBrains Mono** | Same. |

### Fix the `data-mono` token

In every HTML's tailwind config, change:
```js
"data-mono": ["Hanken Grotesk"],
```
to:
```js
"data-mono": ["JetBrains Mono", "ui-monospace", "monospace"],
```

And add the Google Fonts import next to the existing Hanken link:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
```

In Next.js this becomes `next/font/google` imports in `app/layout.tsx`:
```ts
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const mono   = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

### Alternatives considered

| Font | Verdict |
|---|---|
| **Hanken Grotesk only** (current) | Works, but mono-numbers look wrong in tables — `1` is narrower than `8`. |
| **Inter** | Safer pick than Hanken (more battle-tested), but more generic, less "broadcast". Would still need a mono font. |
| **Bebas Neue + Inter** | Classic sports-broadcast combo (Bebas for headlines). More vintage feel — fits if you want "stadium scoreboard" vibe. |
| **Geist + Geist Mono** | Modern but reads as "tech startup", less sport. |
| **Hanken Grotesk + JetBrains Mono** (recommendation) | Keeps current visual identity, fixes tabular-data problem. |

---

## Icons (font-loaded + browser-cached only)

**The hard rule**: an icon must add **zero meaningful bytes** to the HTML
that the server sends. The icon asset itself is downloaded **once** by the
browser (font file or sprite image) and reused for every icon on every
page after that.

### Why this matters
- An inline `<svg>` is 10–50 lines of markup **per icon usage**. A page
  with 12 icons can easily ship 500+ extra lines of HTML — every render,
  every navigation, every refresh.
- Inlined paths also bloat the React Server Component payload and the
  client hydration JSON.
- A page that ships clean text-icon markup like `<span>home</span>` plus
  one cached font file stays small forever, no matter how many icons it
  uses.

### Allowed mechanisms

**Primary: Material Symbols icon font (REQUIRED for all UI icons)**

This is what the HTML mockups already use. Keep it.

- **Setup once** in `app/layout.tsx`:
  ```tsx
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    rel="stylesheet"
  />
  ```
- **Use as a span with a name**:
  ```tsx
  <span className="material-symbols-outlined">person</span>
  ```
- **One Unicode character per icon** — zero markup bloat regardless of how
  many icons appear on the page.
- **Variants via CSS**: weight, fill, grade, optical size are font
  variation settings — no extra DOM elements.
  ```tsx
  <span
    className="material-symbols-outlined"
    style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
  >
    star
  </span>
  ```

### Icons used across the mockups (reference list)

From scanning the HTML files:
- `dashboard`, `leaderboard`, `person` — bottom nav + sidebar nav
- `chevron_left`, `chevron_right` — pagination
- `more_vert` — divider in ranking sidebar
- `emoji_events` — trophy on Tournament Winner card
- `visibility_off` — eye on Secret Winner card
- `info` — Scoring System box header
- `mail`, `lock` — signup field icons
- `progress_activity` — loading spinner

All of these exist in Material Symbols. No replacement needed.

### Flag SVGs: as `<img>`, never inline

The 24 country flags in `em2024-frontend/public/svg/` should be copied to
`frontend/public/svg/` and rendered as `<img>` tags:

```tsx
<img src={`/svg/${tla}.svg`} alt={teamName} className="w-6 h-6" />
```

- Browser caches the file → no bandwidth cost after first load
- Zero markup per usage — just an `<img>` tag
- Works for both server- and client-rendered components

**Do NOT** inline flags via `dangerouslySetInnerHTML`, SVG-as-React-component
imports, or icon libraries with flag sets.

### Fallback (only if Material Symbols is genuinely missing the icon)

**Plan B: a single PNG sprite or a single SVG file referenced as `<img>`**.

Both are external files the browser caches like the icon font:

```tsx
// PNG sprite — one file, cached, positioned via background-position
<span className="icon-sprite icon-sprite--foo" aria-hidden />

// Or a single .svg file as <img> (NOT inline, NOT a React component)
<img src="/icons/foo.svg" alt="" className="w-5 h-5" />
```

Same principle: the asset lives in `public/icons/`, ships once, no
markup explosion in the HTML.

### Forbidden mechanisms

❌ **Inline `<svg>...</svg>` in JSX** — every usage re-ships the paths
❌ **`dangerouslySetInnerHTML` with SVG content** — same problem
❌ **SVG-as-React-component** (`import Icon from './icon.svg'`) — webpack/SVGR
   inlines the SVG into the bundle, and every usage re-renders the full
   markup
❌ **SVGR loader** — same as above
❌ **Icon libraries that ship per-icon React components**:
   - `lucide-react`
   - `@heroicons/react`
   - `react-icons`
   - `@radix-ui/react-icons`
   - `@tabler/icons-react`
   - any other "import { Icon } from 'lib'; <Icon />" pattern that
     resolves to inline `<svg>`

### Verification grep (run in CI / pre-merge)

```bash
# These must all return zero matches in app/, components/, lib/
grep -rn "<svg" app/ components/ lib/ 2>/dev/null
grep -rn "dangerouslySetInnerHTML" app/ components/ lib/ 2>/dev/null
grep -rn "lucide-react\|@heroicons\|react-icons\|@radix-ui/react-icons\|@tabler/icons-react" \
  --include='*.ts' --include='*.tsx' --include='*.json' .
```

Flags (24 files in `public/svg/`) are the **only** SVGs in the project,
and they are referenced as `<img src="/svg/{tla}.svg" />`, never inlined.

---

## Stack versions

- **Next.js 15+** with App Router and TypeScript (strict mode).
- **Tailwind CSS v4** — note the setup is different from v3:
  - No `tailwind.config.ts` file by default. Configuration lives in a CSS
    file via the `@theme` directive (e.g. `app/globals.css`).
  - The HTML mockups still use the v3 inline-config pattern — these need to
    be translated into v4 `@theme` blocks.
  - PostCSS plugin is `@tailwindcss/postcss` (not `tailwindcss`).
  - First-party `@plugin "@tailwindcss/forms"` works inside CSS too.
- **Drizzle ORM** (same as old frontend — copy schema as-is).
- **Lucia v3** with `@lucia-auth/adapter-drizzle` + Argon2id via `oslo/password`.
- **pnpm** as package manager (matches CI in old repo).
- **Node 22 LTS** or higher (some pnpm v11 features require it).

## What to do BEFORE writing components

1. **Bootstrap Next.js** in `frontend/` with TypeScript + App Router:
   `pnpm create next-app@latest frontend --typescript --tailwind --app --no-src-dir`
2. **Verify Tailwind v4** is installed — `pnpm ls tailwindcss` should show
   `4.x`. The Next.js scaffold ships with v4 by default in recent versions.
3. **Port `DESIGN.md` tokens** into the `@theme` block in `app/globals.css`.
   Colors, font sizes, spacing, border-radius. Single source of truth for
   the design system.
4. **Copy SVG flags** from `em2024-frontend/public/svg/` → `frontend/public/svg/`.
5. **Set up Drizzle schema** in `frontend/db/schema.ts` (copy from old repo).
6. **Set up Lucia auth** with Drizzle adapter (copy patterns from old repo).
7. **Set up `fetchApi` helper** for calls to the Rust `betting-api` (port 8080).
8. **Configure fonts** via `next/font/google` in `app/layout.tsx`:
   - Hanken Grotesk → `--font-sans`
   - JetBrains Mono → `--font-mono`
   - Material Symbols Outlined → via `<link>` in `<head>` (font-family `'Material Symbols Outlined'`).

## Then build pages in this order

1. **Login + Signup** (the easy ones — no API calls beyond auth)
2. **Dashboard** (touches API + DB — biggest page, do it second)
3. **Ranking table** (just API + render)
4. **Match detail** (just API + render)
5. **User profile** (mostly API + render — `profile.html` mockup available)

Each page → one ticket in `tickets/backlog/todo/`. Use the ticket template at
`.claude/templates/ticket-template.md`.

## Things the HTML mockups do NOT show but the spec requires

Make sure the implementation covers these even though they're not in the
visual reference:

- **Login error states**: wrong password, missing email, network error
- **Signup error states**: duplicate email, winner === secretWinner, missing fields
- **Empty states**:
  - Dashboard with no live matches (hide the Live block, don't show empty)
  - Dashboard with no upcoming matches (show "No upcoming fixtures" placeholder)
  - User profile with no tips yet (show "No predictions yet")
  - Ranking with empty department (show "No users in this department")
- **Loading states**: skeleton placeholders while API fetches
- **Tip-form validation**: numbers 0–20, both required
- **Tip-form disabled state**: when match has started or has a score
