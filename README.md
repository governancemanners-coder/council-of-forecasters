# Council of Forecasters

A multi-agent simulation of a Toronto housing co-operative decision. The Vite + React client and the Hono/tRPC API run together on port 3000. Forecasts come from a deterministic council engine. An optional LLM layer replaces seat statements when a key is set.

## Setup

Node 22 (`.nvmrc` pins 22.23.4).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. On the simulator, load the sample seed and convene the council.

## Checks

```bash
npm test        # deterministic engine
npm run check   # TypeScript
npm run lint    # ESLint
```

## Environment

Copy `.env.example` to `.env`. The dev server starts with none of these set.

| Variable | Role |
| --- | --- |
| `LLM_API_KEY` | OpenAI-compatible key. Empty means the deterministic engine is the whole forecast. |
| `LLM_BASE_URL` | Chat completions base. Default `https://openrouter.ai/api/v1`. |
| `LLM_MODEL_PRIMARY` / `LLM_MODEL_FALLBACK` | Model ids. Defaults are OpenRouter free Gemma models. |
| `DATABASE_URL` | MySQL URL. Empty means runs are not stored. |
| `APP_ID` / `APP_SECRET` | Required only when `NODE_ENV=production`. |

## Database

MySQL 8. `scripts/ensure-mysql.sh` starts a local server, creates the `council` database, and grants the `ubuntu` user via socket auth (no password):

```bash
bash scripts/ensure-mysql.sh
export DATABASE_URL='mysql://ubuntu@localhost/council?socketPath=/tmp/mysql.sock'
npm run db:push
```

`npm run db:push` applies `db/schema.ts`. Stored runs show up on the forecast report across reloads.
