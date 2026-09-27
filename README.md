# Esports Tracker

[![CI](https://github.com/blabunch/esports-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/blabunch/esports-tracker/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack web app for looking up player statistics in **Valorant**, **Dota 2** and **CS2 (Faceit)** — search any player, see their recent form and match scoreboards, and **follow how their rating changes over time**.

Built with **React + TypeScript + Vite** on the frontend and **Node.js / Express + Prisma + PostgreSQL** on the backend, which aggregates data from three public game APIs.

![Home page](docs/screenshots/home.jpg)

| CS2 (Faceit) | Dota 2 |
| --- | --- |
| ![CS2 profile](docs/screenshots/cs2.jpg) | ![Dota 2 profile](docs/screenshots/dota.jpg) |

## Features

**Player lookup**
- **Valorant** (HenrikDev API): rank, peak rank, K/D, ACS, ADR, headshot %, main role, top agents, map pool, frequent duo partner
- **Dota 2** (OpenDota API): search by Steam 32/64-bit ID or profile URL; win rate, KDA, GPM/XPM, signature hero, best teammates, all-time totals
- **CS2** (Faceit Data API): Faceit level and ELO, K/D, headshot %, win streaks, top maps
- Performance trend charts and clickable per-match scoreboards for every game

**Progress tracking**
- Every lookup stores a daily snapshot of the player's rating
- A progress chart shows MMR / Faceit ELO / win rate over time with the change since tracking started

**Shareable profile links**
- Every profile has its own URL — `/valorant/TenZ/0505`, `/cs2/ZywOo`, `/dota/86745912` — that survives reloads and can be sent to friends

**Accounts**
- Registration and login with JWT authentication
- Link your own Valorant, Dota 2 and Faceit accounts for one-click access
- Search history and favorite profiles synced to your account

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router, Recharts, SCSS |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Testing | Vitest, Testing Library, Supertest |
| Tooling | ESLint, GitHub Actions CI, Docker Compose |

## Architecture

```
React SPA ──► Express API ──► HenrikDev (Valorant)
                  │        ──► OpenDota (Dota 2)
                  │        ──► Faceit Data API (CS2)
                  ▼
             PostgreSQL (users, search history, favorites, rating snapshots)
```

- The backend keeps third-party API keys away from the browser and normalizes three different APIs into a consistent response shape.
- Player lookups are cached in memory for 5 minutes to stay within external rate limits.
- Optional data sections degrade gracefully: if OpenDota fails to return teammates or recent matches, the profile still loads with a notice.
- Game pages are lazy-loaded, so the initial bundle stays small.

### Security

- Passwords hashed with bcrypt; JWT signed with a validated secret (min. 32 characters, HS256 only)
- Stricter rate limit on login and registration against brute force
- All user input is type-checked, length-limited and URL-encoded before it reaches external APIs (prevents path traversal against upstream APIs)
- Internal errors are logged server-side and never leaked to the client
- Security headers via Helmet, CORS allow-list, request body size limit
- Covered by automated tests (see `server/tests/security.test.ts`)

## Getting Started

### Option 1: Docker (fastest)

Requires [Docker](https://www.docker.com/).

```bash
cp .env.docker.example .env   # set JWT_SECRET and your API keys
docker compose up --build
```

Open http://localhost:8080. The API runs on http://localhost:5001, and migrations are applied automatically.

### Option 2: Local development

Requires Node.js 20.19+, PostgreSQL and API keys from [Faceit Developers](https://developers.faceit.com/) and [HenrikDev](https://docs.henrikdev.xyz/).

```bash
# Frontend
npm install
cp .env.example .env.local

# Backend
cd server
npm install
cp .env.example .env           # fill in DATABASE_URL, JWT_SECRET and API keys
npx prisma migrate deploy
npm run dev                    # http://localhost:5001

# In another terminal, from the project root
npm run dev                    # http://localhost:3000
```

### Environment Variables

**Frontend** (`.env.local`, read at build time)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend URL, e.g. `http://localhost:5001/api` |

**Backend** (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | At least 32 random characters |
| `FRONTEND_URL` | yes | Allowed frontend origin(s), comma-separated |
| `FACEIT_API_KEY` | yes | Faceit Data API key |
| `HENRIKDEV_API_KEY` | yes | HenrikDev Valorant API key |
| `TRUST_PROXY_HOPS` | no | Reverse proxies in front of the server (default `1`) |

## Testing

```bash
npm test                 # frontend: routing, search flow, progress chart
npm run lint

cd server
npm test                 # backend: auth, history, favorites, security, stats normalization
```

Backend tests run against a separate database whose name must contain `test`. Locally, create one and put its URL into `server/.env.test`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/tracker_test?schema=public"
```

GitHub Actions runs lint, type checks, both test suites and production builds on every push.

## Deployment

**Backend** — any Node.js host or the included `server/Dockerfile`:
```bash
npm ci && npm run build && npm run prisma:deploy && npm start
```
Healthcheck endpoint: `GET /api/health`

**Frontend** — any static host or the included `Dockerfile` (nginx):
- Set `VITE_API_URL` **before** running `npm run build`
- Rewrite all unknown paths to `/index.html` (single-page app routing); the included `nginx.conf` already does this

## Project Structure

```
├── src/                   # React frontend
│   ├── api/               # API client and types
│   ├── components/        # Player cards, progress chart, match modals, auth
│   ├── hooks/             # Player stats, favorites/history, modal behaviour
│   ├── pages/             # Home, Valorant, Dota 2, CS2, History, 404
│   └── routes.ts          # Shareable profile URLs
├── server/                # Express backend
│   ├── prisma/            # Schema and migrations
│   ├── src/
│   │   ├── app.ts         # Express app and routes
│   │   ├── controllers/   # Auth
│   │   ├── middlewares/   # JWT verification, error handler
│   │   ├── services/      # Valorant, Dota 2, Faceit, progress tracking
│   │   └── utils/         # Cache, HTTP client, errors
│   └── tests/             # API tests
├── docker-compose.yml     # Full stack: PostgreSQL + API + web
└── .github/workflows/     # CI
```

## License

[MIT](LICENSE)
