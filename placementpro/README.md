# PlacementPro 2027

MERN placement-preparation platform for B.Tech CSE 2027 students: company modules, topic practice, Coding Arena, SQL Lab,
server-timed mock tests, study planner and persistent analytics.

## Honest status (read this first)
- **All 1,055 seeded questions are original practice material.** There are **no** verified previous-year or official-sample
  questions. The data model, validator and UI fully support those labels, but nothing is labelled that way without a source URL,
  verification date and assessment year (the seed validator refuses it).
- **Company pages are preparation templates**, built from commonly reported historical formats. `dateVerified` is `null` and
  confidence is `low` for all ten. Each links to the official careers page for you to verify. Priorities are qualitative; a
  percentage appears only when a documented sample (`evidence.sampleSize/appearedIn/period`) is stored.
- **Coding Arena is a practice interface.** Code is saved, never executed. 25 problems (not 100) with Java + Python reference solutions
  that were compiled/run offline against every example and generated test (`npm run seed:validate`).
- **SQL Lab executes queries** in a throwaway in-memory SQLite (sql.js) inside a worker thread with a timeout; only single
  `SELECT`/`WITH` statements are accepted. It never touches the application database.
- Password-reset emails are not sent (no SMTP). In non-production the reset token is returned by the API so the flow is testable.
- Uses `bcryptjs` (pure JS, bcrypt-compatible) instead of native `bcrypt`.

## Layout
```
server/   Express + Mongoose API   (src/models, routes, services; seed/ JSON + loaders; tests/)
client/   React + Vite + Tailwind  (src/pages, components, lib; src/test/)
```

## Run locally
Prereqs: Node 20+, MongoDB 6+ running locally (or an Atlas URI), JDK + Python 3 only if you run `seed:validate`.
```bash
cd server && cp .env.example .env     # set MONGODB_URI; JWT_SECRET is required in production
npm install
npm run seed                          # idempotent: re-running updates in place, never duplicates
npm run dev                           # API on :5000
cd ../client && npm install && npm run dev   # UI on :5173 (proxies /api to :5000)
```
Production-style single server: `cd client && npm run build`, then `cd ../server && NODE_ENV=production npm start`
(Express serves `client/dist`, so cookies are same-origin).

## Tests
```bash
cd server && npm test        # unit + API integration (needs a MongoDB; uses db "placementpro_test", dropped on start)
cd client && npm test        # Vitest + React Testing Library
cd server && npm run seed:validate   # schema/provenance rules + compiles and runs every Java/Python reference solution
```

## Key design points
- **Auth:** bcrypt-hashed passwords, JWT in an `httpOnly`, `sameSite=lax` cookie (`secure` in production), 12 h expiry, rate-limited auth routes.
- **Mock engine:** the deadline is stored on the server. The client only displays `deadline − serverNow`, so refresh or a wrong device clock cannot reset it.
  Expired attempts auto-submit on next access and via a 30 s background sweeper. Submit is atomic (`in_progress → submitting → submitted`), so double
  clicks return the same result. Section-timed tests only reveal/accept answers for the current section.
- **No answer leaks:** question payloads exclude `correct`, `explanation`, reference solutions and SQL expected output until the attempt is submitted (or a practice answer is checked).
- **Isolation:** every attempt/progress/bookmark/plan query is scoped to the logged-in user; another user's attempt returns 404.
- **Scoring** is computed only on the backend; tests may override marks/negative marking (`scoring.override`).

## API (all under `/api`, cookie auth unless noted)
`POST auth/register|login|logout|forgot-password|reset-password`, `GET auth/me` ·
`GET|PUT profile`, `GET progress/summary|revision` · `GET companies`, `companies/:slug`, `companies/:slug/priorities` ·
`GET questions`, `questions/meta`, `questions/:id`, `POST questions/:id/answer` · `GET topics`, `topics/:slug` · `GET|POST|DELETE bookmarks[/:questionId]` ·
`GET mocks`, `mocks/:slug`, `POST mocks/:slug/start` · `GET attempts/:id`, `PUT attempts/:id/answers`, `POST attempts/:id/advance-section|submit`, `GET attempts/:id/result` ·
`GET coding`, `coding/daily`, `coding/:id`, `POST coding/:id/submissions|reveal` · `GET sql`, `sql/:id`, `POST sql/:id/run|submit|reveal` ·
`GET faqs?q=&category=&company=` · `GET|POST plan`, `PATCH plan/tasks/:id`, `POST plan/reschedule`.
Errors always look like `{ "error": { "code", "message", "details?" } }`.

## Deployment (single service)
1. Create a MongoDB Atlas cluster; allow your host's IPs; copy the connection string.
2. On Render/Railway/Fly (Node 20): build command `cd client && npm ci && npm run build && cd ../server && npm ci`; start command `cd server && npm start`.
3. Env: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (`openssl rand -hex 32`), `CLIENT_ORIGIN=https://your-domain`.
4. Seed once: `cd server && npm run seed`.
5. Put it behind HTTPS (required for the `secure` cookie).

## Adding verified content
Add objects to `server/seed/<company>/*.json` with `provenance: "verified_pyq"`, `verificationStatus: "verified"`, `sourceUrl`, `dateVerified`,
`assessmentYear`. `npm run seed:validate` rejects anything that claims verification without evidence. To enable frequency percentages, set
`priorities[].evidence = { sampleSize, appearedIn, period }` on a `CompanyPattern`.
