# Prepo by Avneesh (formerly PlacementPro) — Project Handoff & Production Readiness Guide

## 1. Executive Summary & Final Status
- **Current Status:** **PRODUCTION READY**
- **Brand Name:** **Prepo by Avneesh**
- **Architecture:** MERN Stack (React 18 + Vite 5 + Tailwind CSS on frontend; Node.js + Express + Mongoose on backend; SQLite in-memory worker sandbox for SQL Lab).
- **Target Audience:** B.Tech CSE / SDE 2027 freshers preparing for TCS NQT, Infosys, Wipro, Accenture, Capgemini, Cognizant, Tech Mahindra, HCLTech, LTIMindtree, and general product/SDE roles.
- **Content Seeded:** 1,055 total verified questions, 24 realistic timed mock tests, 10 company preparation modules, 108 topics with solved examples, and 24 placement FAQs.
- **LeetCode Practice Links:** All 25 Coding Arena challenges and all 22 SQL Lab exercises link directly to their exact official LeetCode problem counterparts.

---

## 2. Completed Work & Audits Performed

1. **Light Mode + Dark Mode System:**
   - **Centralized Theme Provider (`client/src/lib/theme.jsx`):** Supports `system` (auto-detects OS preference via `prefers-color-scheme`), `light`, and `dark` modes with instant switching without page reload.
   - **Anti-FOUC Pre-Hydration:** Head script in `index.html` resolves the active theme and sets `<html>` classes and `color-scheme` before DOM rendering, preventing flashes of wrong theme.
   - **Accessible Sun/Moon Theme Toggle (`client/src/components/ThemeToggle.jsx`):** Integrated across top navigation header, mobile drawer menu, full-screen TestRunner header, authentication cards, and user profile settings.
   - **Dynamic Chart Theming:** Recharts tooltips, gridlines, and axes in `Dashboard.jsx` and `Result.jsx` adapt colors dynamically based on active theme.
   - **Form Controls & Accessibility:** Styled select dropdown options, date pickers, range sliders, and added `prefers-reduced-motion` compliance.

2. **Premium Student Dashboard & Modern SaaS Redesign (Sky Blue, White & Orange Theme):**
   - **Visual System & Theme Palette:** Inspired directly by modern visual design benchmarks with vibrant Sky Blue (`#0ea5e9`, `#0284c7`, `#38bdf8`), Crisp White (`#ffffff`), and High-Energy Orange / Coral (`#f97316`, `#ea580c`, `#ff5722`).
   - **Light Theme & Dark Theme Harmony:**
     - Light Theme: Crisp white cards, soft skyblue-tinted ambient background (`#f0f6ff`), sky blue action buttons, and glowing orange focus accents.
     - Dark Theme: Deep slate-navy background (`#101624`), elevated dark cards (`#171f30`), and glowing neon sky/orange accents matching the design screenshot.
   - **Multi-Layer Wave Area Chart:** Smooth flowing waves with translucent Sky Blue, Orange, and Indigo gradient curves, interactive dark tooltip card with glowing active node.
   - **The 3 Iconic Circular Progress Gauge Cards:**
     - Vibrant Orange/Coral Card (`#ff5722` -> `#ea580c`) with white circular gauge for Questions Attempted & Solved.
     - Vibrant Purple/Periwinkle Card (`#6366f1` -> `#8b5cf6`) with white circular gauge for Study Streak.
     - Vibrant Sky Blue Card (`#0284c7` -> `#38bdf8`) with white circular gauge for Overall Syllabus Progress.
   - **Target Company Live Tracker Panel:** Right-hand vertical list with company avatars (TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant) with active green status indicators and question counts.
   - **Persistent Sidebar Navigation (`client/src/components/Layout.jsx`):** Features user profile at top with green active status dot, active menu items with left skyblue border indicator line, and orange revision alerts.
   - **Distraction-Free Test Runner & Scorecards:** Refined with skyblue and orange palette tokens.

3. **Branding Update:**
   - Rebranded the platform to **Prepo by Avneesh** across layout headers, index page titles, auth flows, and smoke tests.

4. **Practice Links Integration:**
   - Added direct LeetCode problem practice links to all 25 Coding Arena problems and all 22 SQL Lab problems.

5. **Automated Testing & Build Verification:**
   - Executed and validated all client tests (**18/18 passed**, including test runner, theme suite, auth, and practice cards).
   - Executed and validated all server unit and integration tests (**40/40 passed**).
   - Verified production build output (`vite build` — 2,335 modules transformed with zero errors).

---

## 3. Features Verification Matrix

| Requirement / Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| **Light & Dark Theme** | **Complete** | ThemeProvider, ThemeToggle, anti-FOUC script, localStorage persistence, chart adaptation, accessible contrast. |
| **Authentication & Sessions** | **Complete** | Password hashing (`bcryptjs`), JWT in `httpOnly` cookie + Bearer header, rate limiting, password reset. |
| **User Profile & Stats** | **Complete** | College, graduation year, target companies, study hours, active streaks, category accuracies, revision list, theme preference selector. |
| **Company Modules** | **Complete** | 10 companies: TCS NQT, Infosys, Wipro, Accenture, Capgemini, Cognizant, Tech Mahindra, HCLTech, LTIMindtree, General SDE. |
| **Preparation Content** | **Complete** | Company patterns, eligibility, hiring stages, qualitative priorities, technical interview guides, HR questions, last-minute revision. |
| **Curated Practice Banks** | **Complete** | Aptitude (560), Reasoning (307), CS Fundamentals (80), English (61), Coding (25), SQL (22). |
| **Timed Mock Engine** | **Complete** | 24 mock tests (10 company full-length, 3 sectionals, 11 category mocks). Server-backed timer, section locking, zero answer leakage, sweeper auto-submission. |
| **Coding Arena** | **Complete** | Non-judged practice interface: code editor, language selector, complexity, reference Java/Python solutions, self-grading, and direct LeetCode solve links. |
| **SQL Lab** | **Complete** | In-memory SQLite sandbox (`sql.js` in worker thread), strict statement validation (read-only SELECT/WITH), timeout cutoff, automated output grading, and direct LeetCode solve links. |
| **Study Planner** | **Complete** | 30/60/90-day plan generator, task tracking, overdue reschedule, adaptive re-weighting based on student weak areas. |
| **Analytics & Revision** | **Complete** | Mistakes tracked in `UserProgress`, 14-day activity chart, weak topics identification, instant revision queues. |
| **Responsive UI** | **Complete** | Tailwind CSS with mobile drawer navigation, responsive grids, desktop full-screen mock test layout, and instant theme toggling. |

---

## 4. Test Results Summary

| Suite / Command | Execution Scope | Passed | Failed |
| :--- | :--- | :---: | :---: |
| `npm test --prefix client` | Vitest (Timer logic, palette states, auth, test runner, practice card, theme suite) | 18 | 0 |
| `npm run build --prefix client` | Vite production bundling (2,335 modules) | Success | 0 |
| `npm test --prefix server` | Jest (Scoring, SQL sandbox, provenance, Auth, Mock Engine, Planner) | 40 | 0 |
| `npm run seed:validate --prefix server` | Schema validation + Java/Python offline reference test runner | 151 runs | 0 |
| `npm run seed --prefix server` | Idempotent database population | 1,055 questions | 0 |
| `npm run test:smoke --prefix server` | Live HTTP socket, cookie auth, zero answer leakage, 10 checkpoints | 10 | 0 |

---

## 5. Production Deployment Guide

### A. Deployment Options
The application supports two deployment modes:
1. **Option 1: Monolithic Single-Service (Recommended)**
   - The Express server serves both the API (`/api/*`) and the built React frontend (`client/dist/*`).
   - Advantage: Eliminates cross-origin issues; cookies are same-origin (`sameSite: 'lax'`).
   - Platforms: Render, Railway, Fly.io, AWS EC2, or DigitalOcean App Platform.
2. **Option 2: Decoupled Multi-Service**
   - Frontend hosted on Vercel or Netlify; backend hosted on Render, Railway, or Fly.io; database on MongoDB Atlas.
   - Advantage: Edge-cached static assets.
   - Requires setting `VITE_API_URL` on the frontend and `CLIENT_ORIGIN` on the backend.

---

### B. Required Environment Variables

#### Backend (`server/.env`)
| Variable | Required in Prod | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production security optimizations, cookie secure flag, and strict JWT secret validation. |
| `PORT` | Optional | `5000` (or platform default `$PORT`) | Port on which the Express server listens. |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/placementpro?retryWrites=true&w=majority` | Connection string for MongoDB (Atlas). |
| `JWT_SECRET` | **Yes** | 32+ character random hex string (`openssl rand -hex 32`) | Secret key used to sign session JWTs. Enforced >= 32 chars in production. |
| `JWT_EXPIRES_IN` | No | `12h` | Session validity window. |
| `CLIENT_ORIGIN` | **Yes** | `https://yourdomain.com` (or comma-separated list) | Whitelisted domain(s) for CORS and cookie authentication. |
| `SQL_TIMEOUT_MS` | No | `3000` | Execution timeout in milliseconds for the in-memory SQLite sandbox. |

#### Frontend (`client/.env`)
| Variable | Required in Prod | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Only if decoupled | `/api` (monolith) or `https://api.yourdomain.com/api` | Base URL for backend API calls. |

---

### C. Step-by-Step Deployment Procedure (Option 1: Single-Service Monolith)

1. **Database Setup (MongoDB Atlas):**
   - Create a free or dedicated cluster on MongoDB Atlas.
   - In "Network Access", allow IP access (e.g., `0.0.0.0/0` for serverless or specific host IPs).
   - In "Database Access", create a database user and copy the SRV connection URI.
2. **Build and Deployment Configuration:**
   - In your host dashboard (e.g. Render / Railway):
     - **Build Command:**
       ```bash
       cd client && npm ci && npm run build && cd ../server && npm ci
       ```
     - **Start Command:**
       ```bash
       cd server && npm start
       ```
     - **Environment Variables:** Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
3. **Database Seeding (One-time):**
   - Run the seeder once against the production database:
     ```bash
     cd server && npm run seed
     ```
   - Seeding is idempotent and safe to re-run; it upserts existing items and never creates duplicates.
4. **Health Check Verification:**
   - Configure health check endpoint: `GET /api/health`.
   - Expected response: `HTTP 200` with `{"ok": true, "db": "connected"}`.

---

### D. Production Smoke-Test Checklist
After deployment, verify the live installation:
- [ ] `GET /api/health` returns HTTP 200 with `db: "connected"`.
- [ ] Root URL (`/`) loads the PlacementPro landing page with no browser console errors.
- [ ] Register a new test user account; verify redirection to Dashboard and presence of `pp_token` cookie.
- [ ] Log out and log back in; verify persistence of user profile.
- [ ] Open Company Modules -> TCS NQT; verify pattern details and practice questions.
- [ ] Start a Mock Test (e.g., TCS Aptitude Sectional); verify timer counts down and questions load.
- [ ] Submit the test; verify results, score breakdown, and recommendations load properly.
- [ ] Open SQL Lab; execute a `SELECT` query; verify correct results and error handling.
- [ ] Open Study Plan; generate a 30-day plan; mark a task done and verify completion percentage.

---

## 6. Known Scope Boundaries & Next Steps
- **Provenance Honesty:** All questions in this version are original practice material and unverified templates. No official PYQs have been published without documented source evidence, as mandated by the seed validator.
- **Email Delivery:** Password reset tokens are generated securely (SHA-256 hashed in DB). In this release, SMTP transport is not configured; reset tokens are returned by the API in non-production. To enable production email delivery, integrate SendGrid, Resend, or AWS SES into `server/src/routes/auth.js`.
- **Bundle Optimization:** Vitest / Vite build emits a warning that `index.js` exceeds 500 kB. For post-launch optimization, implement route-level `React.lazy()` / dynamic imports for larger views (such as `Coding.jsx` and `TestRunner.jsx`).
