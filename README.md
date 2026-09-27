# Esports Tracker

A full-stack web app for looking up player statistics in **Valorant**, **Dota 2** and **CS2 (Faceit)** — one place to search any player, see their recent form, performance trends and match scoreboards.

Built with **React + TypeScript** on the frontend and **Node.js / Express + Prisma + PostgreSQL** on the backend, which aggregates data from several public game APIs.

## Features

**Valorant** (via HenrikDev API)
- Search any player by Riot ID and tag
- Current and peak rank, K/D, ACS, ADR, headshot %
- Main role, top agents, map pool with win rates, frequent duo partner
- ACS performance trend chart and per-match scoreboards

**Dota 2** (via OpenDota API)
- Search by Steam 32-bit ID, Steam 64-bit ID or profile URL
- Win rate, KDA, GPM / XPM, hero damage, healing, tower damage
- Signature hero, most played heroes, best teammates, all-time totals
- KDA / GPM trend chart and detailed match view

**CS2** (via Faceit Data API)
- Search by Faceit nickname or profile URL
- Faceit level and ELO, K/D, headshot %, win streaks, recent form
- Top maps and K/D per map chart, match statistics modal

**Accounts**
- Registration and login with JWT authentication
- Link your own Valorant, Dota 2 and Faceit accounts for one-click access
- Synced search history and favorite profiles per user

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, React Router, Recharts, SCSS, Axios |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth & security | JWT, bcrypt, Helmet, CORS allow-list, rate limiting, input validation |

## Architecture

```
React SPA  ──►  Express API  ──►  HenrikDev (Valorant)
                    │         ──►  OpenDota (Dota 2)
                    │         ──►  Faceit Data API (CS2)
                    ▼
               PostgreSQL (users, search history, favorites)
```

The backend hides third-party API keys from the browser, normalizes responses from three different APIs into a consistent shape, and caches player lookups in memory for 5 minutes to stay within external rate limits.

Security measures:
- Passwords hashed with bcrypt, JWT signed with a validated secret (min. 32 chars)
- Stricter rate limit on login / registration against brute force
- All user input is validated and URL-encoded before it reaches external APIs
- Internal errors are logged server-side and never leaked to the client
- Security headers via Helmet and a CORS allow-list

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- API keys: [Faceit Developers](https://developers.faceit.com/), [HenrikDev](https://docs.henrikdev.xyz/)

### Installation

```bash
# 1. Frontend dependencies
npm install

# 2. Backend dependencies
cd server && npm install

# 3. Environment files
cp .env.example .env.local          # in the project root
cp server/.env.example server/.env  # fill in your secrets

# 4. Database migrations
cd server && npx prisma migrate deploy

# 5. Start the backend (http://localhost:5001)
cd server && npm run dev

# 6. Start the frontend (http://localhost:3000)
npm start
```

### Environment Variables

**Frontend** (`.env.local`)

| Variable | Description |
| --- | --- |
| `REACT_APP_API_URL` | Backend URL, e.g. `http://localhost:5001/api` |

**Backend** (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | At least 32 random characters |
| `FRONTEND_URL` | yes | Allowed frontend origin(s), comma-separated |
| `FACEIT_API_KEY` | yes | Faceit Data API key |
| `HENRIKDEV_API_KEY` | yes | HenrikDev Valorant API key |
| `TRUST_PROXY_HOPS` | no | Reverse proxies in front of the server (default `1`) |

## Deployment

**Backend**
```bash
npm install && npm run build && npm run prisma:deploy && npm start
```
Healthcheck endpoint: `GET /api/health`

**Frontend**
- Set `REACT_APP_API_URL` **before** running `npm run build`
- Serve the `build/` folder and rewrite all unknown paths to `/index.html` (single-page app routing)

## Scripts

| Command | Where | Description |
| --- | --- | --- |
| `npm start` | root | Frontend dev server |
| `npm run build` | root | Frontend production build |
| `npm test -- --watchAll=false` | root | Frontend tests |
| `npm run dev` | `server/` | Backend with auto-reload |
| `npm run build` | `server/` | Generate Prisma client and compile TypeScript |
| `npm test` | `server/` | Backend type check |

## Project Structure

```
├── src/                  # React frontend
│   ├── api/              # API client and types
│   ├── components/       # Player cards, match modals, auth, header
│   ├── hooks/            # Data fetching, history and favorites
│   ├── pages/            # Home, Valorant, Dota 2, CS2, History
│   └── styles/           # SCSS variables and mixins
└── server/               # Express backend
    ├── prisma/           # Schema and migrations
    └── src/
        ├── controllers/  # Auth
        ├── middlewares/  # JWT verification, error handler
        ├── services/     # Valorant, Dota 2, Faceit integrations
        └── utils/        # Cache, HTTP client, errors
```

## License

[MIT](LICENSE)
