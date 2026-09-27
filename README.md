# Esports Tracker

React + Express tracker for Valorant, Dota 2 and CS2 stats.

## Local Setup

1. Install frontend dependencies in the project root:
   `npm install`
2. Install backend dependencies:
   `cd server && npm install`
3. Copy environment templates:
   `cp .env.example .env.local`
   `cp server/.env.example server/.env`
4. Fill backend secrets in `server/.env`.
5. Run database migrations:
   `cd server && npx prisma migrate deploy`
6. Start backend:
   `cd server && npm run dev`
7. Start frontend:
   `npm start`

## Deploy Notes

Frontend needs `REACT_APP_API_URL`, for example:
`https://your-api.example.com/api`

Backend needs:

- `DATABASE_URL`
- `FRONTEND_URL`
- `JWT_SECRET` with at least 32 random characters
- `FACEIT_API_KEY`
- `HENRIKDEV_API_KEY`
- optional `DOTA_API_KEY` and `STRATZ_API_KEY`

- optional `TRUST_PROXY_HOPS` — number of reverse proxies in front of the server (default `1`)

`FRONTEND_URL` may contain several comma-separated origins. Requests from other origins are rejected by CORS.

For backend deployment, run migrations before starting the server:
`npm install && npm run build && npm run prisma:deploy && npm start`

Healthcheck endpoint: `GET /api/health`

The frontend is a single-page app: configure your static host to rewrite all unknown paths to `/index.html`, otherwise refreshing `/valorant`, `/profile` etc. returns 404.

## Verification

- Frontend build: `npm run build`
- Frontend tests: `npm test -- --watchAll=false`
- Backend typecheck: `cd server && npm test`
- Prisma schema validation: `cd server && npx prisma validate`
