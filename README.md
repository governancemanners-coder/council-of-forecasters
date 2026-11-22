# Council of Forecasters

A 12-seat deliberation simulator for Toronto housing co-operative governance. You seed a proposed action; the Council caucuses across four rounds and the Report Agent dockets a probability-banded forecast.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The simulator works out of the box on the **deterministic engine** — no database or LLM key required.

## Optional upgrades

| Variable | Effect |
|---|---|
| `LLM_API_KEY` | Live per-seat deliberation + ReportAgent synthesis via an OpenAI-compatible API (default OpenRouter). Falls back per-layer if rate-limited. |
| `DATABASE_URL` | MySQL / PlanetScale docket. When unset, runs persist to `.data/simulation-runs.json`. |
| `APP_ID` / `APP_SECRET` | Required only in production (`NODE_ENV=production`). |

```bash
# With MySQL configured:
npm run db:push   # or apply db/migrations/0000_simulation_runs.sql
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite + Hono API on port 3000 |
| `npm run build` | Client + server bundle → `dist/` |
| `npm start` | Serve production build |
| `npm run check` | TypeScript project build |
| `npm test` | Vitest (engine + API) |
| `npm run lint` | ESLint |

## Architecture

- **`src/engine`** — deterministic preference-map math (stances, cascade, vetoes, bands)
- **`api/services/deliberation.ts`** — optional LLM overlay on top of the engine
- **`api/queries/runs.ts`** — MySQL or local JSON docket
- **`src/pages/Simulator`** — seed → caucus reveal → stance board
- **`src/pages/Report`** — forecast docket (localStorage + server restore)
