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

### 2.1 Light Mode + Dark Mode System
- **Centralized Theme Provider (`client/src/lib/theme.jsx`):** Supports `system` (auto-detects OS preference via `prefers-color-scheme`), `light`, and `dark` modes with instant switching without page reload.
- **Anti-FOUC Pre-Hydration:** Head script in `index.html` resolves the active theme and sets `<html>` classes and `color-scheme` before DOM rendering, preventing flashes of wrong theme.
- **Accessible Sun/Moon Theme Toggle (`client/src/components/ThemeToggle.jsx`):** Integrated across top navigation header, mobile drawer menu, full-screen TestRunner header, authentication cards, and user profile settings.
- **Dynamic Chart Theming:** Recharts tooltips, gridlines, and axes in `Dashboard.jsx` and `Result.jsx` adapt colors dynamically based on active theme.
- **Form Controls & Accessibility:** Styled select dropdown options, date pickers, range sliders, and added `prefers-reduced-motion` compliance.

### 2.2 Premium Student Dashboard & Modern SaaS Redesign
- **Visual System & Theme Palette:** Sky Blue (`#0ea5e9`, `#0284c7`, `#38bdf8`), Crisp White (`#ffffff`), and High-Energy Orange / Coral (`#f97316`, `#ea580c`, `#ff5722`).
- **Multi-Layer Wave Area Chart:** Smooth flowing waves with translucent Sky Blue, Orange, and Indigo gradient curves.
- **3 Iconic Circular Progress Gauge Cards:** Orange/Coral (Questions), Purple/Periwinkle (Study Streak), Sky Blue (Syllabus Progress).
- **Target Company Live Tracker Panel:** Company avatars with active green status indicators and question counts.

### 2.3 Branding Update
- Rebranded the platform to **Prepo by Avneesh** across layout headers, index page titles, auth flows, and smoke tests.

### 2.4 Practice Links Integration
- Added direct LeetCode problem practice links to all 25 Coding Arena problems and all 22 SQL Lab problems.

### 2.5 Notification System — Complete Lifecycle Overhaul
**Backend:**
- **`server/src/models/Notification.js`** — Rewritten schema with `status` enum (`unread`, `read`, `dismissed`, `completed`, `expired`), `entityType`, `entityId` (for deduplication), `dismissedAt`, `completedAt`, `expiresAt`, `metadata` fields. Compound indexes for performance. Pre-save hook to keep `read` boolean in sync with `status`.
- **`server/src/services/notifications.js`** — New service layer with:
  - `createNotification()` — deduplication by entityType + entityId
  - `resolveNotification()` — marks related notifications as completed
  - `expireOldNotifications()` — TTL-based expiry
  - `getNotificationCounts()` — returns `{unread, active, completed, total}`
  - `generateContextualNotifications()` — onboarding (only for truly new users, prevents re-seeding after dismissal) and streak/company context-aware notifications
- **`server/src/routes/notifications.js`** — Complete rewrite:
  - `GET /api/notifications` — Lists active notifications with `counts` object, calls `generateContextualNotifications` + `expireOldNotifications`
  - `PATCH /api/notifications/:id/read` — Mark single as read with status lifecycle
  - `PATCH /api/notifications/read-all` — Mark all unread as read
  - `PATCH /api/notifications/:id/dismiss` — Dismiss single notification
  - `PATCH /api/notifications/dismiss-all` — Dismiss all active notifications
  - `DELETE /api/notifications/:id` — Hard-delete single notification
  - `DELETE /api/notifications` — Clear all notifications
- **`server/src/routes/mocks.js`** — Added `resolveNotification` call on test submit to auto-resolve test notifications

**Frontend (`client/src/components/Layout.jsx`):**
- `notifCounts` state and `notifFilter` state (all/unread tabs)
- `fetchNotifications()` clears state on logout
- `markAsRead()` updates both `read` and `status` fields in local state, syncs counts from server
- `markAllAsRead()` syncs counts
- `dismissNotif()` uses `PATCH /:id/dismiss` with fallback to `DELETE /:id`
- `clearAllNotifs()` uses `PATCH /dismiss-all` with fallback to `DELETE /`
- Notification dropdown has All/Unread filter tabs with counts
- Shows "Done" badge for completed notifications

**Root cause fixes:**
- **Re-seeding bug:** `ensureDefaultNotifications()` checked `countDocuments === 0` → after user dismissed all, welcome notifications re-appeared. Fixed by checking total historic count.
- **State persistence:** Database is now source of truth, not frontend state. Refresh/login/logout preserves correct notification state.

### 2.6 Multi-Select Filters
**Backend:**
- **`server/src/routes/questions.js`** — All filter fields accept `z.union([z.string(), z.array(z.string())])`. Added `parseMultiParam()` helper that splits comma-separated values. `buildFilter()` uses `$in` for multi-value MongoDB queries. Filter logic: **OR within same group, AND between groups**.
- **`server/src/routes/admin.js`** — Same multi-param support for admin question listing.
- **`client/src/lib/api.js`** — `qs()` updated to handle array values (joins with commas).

**Frontend:**
- **`client/src/components/MultiSelect.jsx`** — New component with:
  - `MultiSelect` — Checkbox-based dropdown with search (when >6 options), select all/clear, count badges, sky-blue checked styling, outside-click close
  - `FilterChips` — Renders dismissible chips for active filters with clear-all button
- **`client/src/pages/Practice.jsx`** — Fully rewritten with `MultiSelect` for Subject, Topic, Company, Difficulty, Status. URL params store comma-separated multi-values. Includes `FilterChips` row, mobile filter drawer, "Updating results…" indicator, skeleton loaders.

### 2.7 Loading System Overhaul
**Core hook rewrite (`client/src/lib/useApi.js`):**
- `isFetching` state (true during any request) vs `loading` (true only on initial empty load)
- Request sequence tracking via `reqIdRef` to prevent stale responses overwriting newer data
- `isMountedRef` to prevent state updates after unmount
- Falsy path resolves immediately to `loading: false` (prevents infinite loading for conditional paths)
- Retains existing data during background re-fetching

**New UI components (`client/src/components/ui.jsx`):**
- `Btn` — accepts `loading` prop (shows spinner, disables button)
- `QuestionCardSkeleton` — skeleton for question cards
- `CardSkeleton` — grid of skeleton cards
- `TableSkeleton` — skeleton for table rows

**Loading pattern fixes — `if (loading && !data)` applied across all pages:**

| File | Component | Fix Applied |
|:---|:---|:---|
| `Dashboard.jsx` | Dashboard | ✅ Correct pattern + crash-safe optional chaining |
| `Companies.jsx` | Companies | ✅ Uses `CardSkeleton` |
| `Companies.jsx` | CompanyDetail | ✅ Correct pattern |
| `Practice.jsx` | Practice | ✅ Full rewrite with skeleton loaders |
| `Mocks.jsx` | MockList | ✅ Uses `CardSkeleton` |
| `Drill.jsx` | Drill | ✅ Correct pattern |
| `Coding.jsx` | CodingList | ✅ Correct pattern |
| `Coding.jsx` | CodingProblem | ✅ Fixed `if (loading)` → `if (loading && !data)` |
| `Sql.jsx` | SqlList | ✅ Correct pattern |
| `Sql.jsx` | SqlExercise | ✅ Fixed `if (loading)` → `if (loading && !data)` |
| `Faqs.jsx` | Faqs | ✅ Fixed `loading ?` → `loading && !data ?` |
| `Topic.jsx` | Topic | ✅ Fixed `if (loading)` → `if (loading && !data)` |
| `AdventureMap.jsx` | AdventureMap | ✅ Added loading + error guards for profile hook |
| `Materials.jsx` | Materials | ✅ Correct pattern |
| `StudyPlan.jsx` | StudyPlan | ✅ Correct pattern |
| `Result.jsx` | Result | ✅ Correct pattern |
| `Profile.jsx` | Profile | ✅ Correct pattern + `loading` prop on save button |
| `Auth.jsx` | Login/Register | ✅ `loading` prop on buttons |

### 2.8 Dashboard Crash Prevention
- **`Dashboard.jsx` line 326:** `s.streak.current` → `s.streak?.current || 0` (prevents crash for new users without streak data)
- **`Dashboard.jsx` line 338:** `s.streak.longest` → `s.streak?.longest || 0`
- **`Dashboard.jsx` line 554:** `s.subjects[k]` → `(s.subjects || {})[k]` (prevents crash when subjects undefined)

### 2.9 Drill Engine & Hierarchical Syllabus Explorer
- Real-time syllabus analysis endpoint (`GET /api/drill/syllabus`).
- Custom drill generator with practice mode selection.
- Dedicated Drill page integrated into sidebar and routing.

### 2.10 PWA Installation & Offline Support
- Web App Manifest with standalone display mode and responsive assets.
- Service Worker with network-first caching for app shell and static assets.

---

## 3. Features Verification Matrix

| Requirement / Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| **Light & Dark Theme** | **Complete** | ThemeProvider, ThemeToggle, anti-FOUC script, localStorage persistence, chart adaptation, accessible contrast. |
| **Authentication & Sessions** | **Complete** | Password hashing (`bcryptjs`), JWT in `httpOnly` cookie + Bearer header, rate limiting, password reset. |
| **User Profile & Stats** | **Complete** | College, graduation year, target companies, study hours, active streaks, category accuracies, revision list, theme preference selector. |
| **Company Modules** | **Complete** | 10 companies: TCS NQT, Infosys, Wipro, Accenture, Capgemini, Cognizant, Tech Mahindra, HCLTech, LTIMindtree, General SDE. |
| **Curated Practice Banks** | **Complete** | Aptitude (560), Reasoning (307), CS Fundamentals (80), English (61), Coding (25), SQL (22). |
| **Timed Mock Engine** | **Complete** | 24 mock tests. Server-backed timer, section locking, zero answer leakage, sweeper auto-submission. |
| **Coding Arena** | **Complete** | Practice interface with code editor, reference Java/Python solutions, self-grading, LeetCode links. |
| **SQL Lab** | **Complete** | In-memory SQLite sandbox, read-only validation, automated grading, LeetCode links. |
| **Notification System** | **Complete** | Full lifecycle (unread → read → dismissed/completed/expired), deduplication, server-side source of truth, accurate counters. |
| **Multi-Select Filters** | **Complete** | Checkbox-based dropdowns for Subject, Topic, Company, Difficulty, Status. OR within groups, AND between groups. |
| **Loading State Management** | **Complete** | `useGet` rewrite with stale-while-revalidate pattern, skeleton loaders, sequence tracking, no infinite loading. |
| **Study Planner** | **Complete** | 30/60/90-day plan generator, task tracking, overdue reschedule. |
| **Analytics & Revision** | **Complete** | Mistakes tracked, 14-day activity chart, weak topics, revision queues. |
| **Responsive UI** | **Complete** | Tailwind CSS with mobile drawer, responsive grids, desktop full-screen mock layout. |
| **PWA Support** | **Complete** | Manifest, service worker, offline caching. |

---

## 4. Test Results Summary

All tests executed on 2026-11-06 with actual results:

| Suite / Command | Scope | Passed | Failed |
| :--- | :--- | :---: | :---: |
| `npx vitest run` (client) | Timer logic, palette states, auth, test runner, practice card, theme suite | **18** | **0** |
| `npm run build` (client) | Vite production bundling (2,342 modules) | **Success** | **0** |
| `npx jest --runInBand --forceExit` (server) | Scoring, SQL sandbox, provenance, Auth, Mock Engine, Planner, Notifications (lifecycle + dismiss), Multi-select filters, Admin CRUD | **52** | **0** |
| `node tests/smoke.js` (server) | Live HTTP socket, cookie auth, zero answer leakage, 10 checkpoints | **10** | **0** |
| `npm run seed:validate` (server) | Schema validation + Java/Python offline reference test runner | **151 runs** | **0** |
| `npm run seed` (server) | Idempotent database population | **1,055 questions** | **0** |

### New tests added in this session:
- **Notification lifecycle tests (3 tests):** List with counts validation, mark-as-read + dismiss lifecycle, delete + clear-all with counts verification.
- **Multi-select filter tests (4 tests):** Comma-separated subjects, comma-separated difficulties, combined subject + difficulty AND/OR logic, single filter backward compatibility.

---

## 5. Files Modified (Complete List)

### Backend
| File | Changes |
|:---|:---|
| `server/src/models/Notification.js` | Schema rewrite: status enum, entityType/entityId deduplication, indexes |
| `server/src/services/notifications.js` | **New file**: createNotification, resolveNotification, expireOldNotifications, getNotificationCounts, generateContextualNotifications |
| `server/src/routes/notifications.js` | Full rewrite: 7 endpoints with counts, dismiss lifecycle, generate/expire on list |
| `server/src/routes/questions.js` | Multi-select: parseMultiParam, $in queries, Zod union schemas |
| `server/src/routes/admin.js` | Multi-param support for admin question listing |
| `server/src/routes/mocks.js` | resolveNotification on test submit |
| `server/tests/api.test.js` | Updated notification tests (3 tests), added multi-select filter tests (4 tests) |

### Frontend
| File | Changes |
|:---|:---|
| `client/src/lib/useApi.js` | Full rewrite: isFetching, reqIdRef, isMountedRef, falsy path handling |
| `client/src/lib/api.js` | `qs()` handles arrays with comma-join |
| `client/src/components/ui.jsx` | Added Btn loading prop, QuestionCardSkeleton, CardSkeleton, TableSkeleton |
| `client/src/components/MultiSelect.jsx` | **New file**: MultiSelect + FilterChips components |
| `client/src/components/Layout.jsx` | Notification state overhaul: notifCounts, notifFilter, dismiss lifecycle |
| `client/src/pages/Practice.jsx` | Full rewrite with MultiSelect filters, skeleton loaders, mobile drawer |
| `client/src/pages/Dashboard.jsx` | Crash-safe optional chaining for streak/subjects |
| `client/src/pages/Faqs.jsx` | Loading pattern fix |
| `client/src/pages/Topic.jsx` | Loading pattern fix |
| `client/src/pages/Coding.jsx` | CodingProblem loading pattern fix |
| `client/src/pages/Sql.jsx` | SqlExercise loading pattern fix |
| `client/src/pages/AdventureMap.jsx` | Added loading + error guards for profile hook |
| `client/src/pages/Companies.jsx` | Loading pattern (already correct, verified) |
| `client/src/pages/Mocks.jsx` | CardSkeleton, loading button props |
| `client/src/pages/Drill.jsx` | Loading pattern fix, loading button prop |
| `client/src/pages/Materials.jsx` | Loading pattern fix |
| `client/src/pages/StudyPlan.jsx` | Loading pattern fix |
| `client/src/pages/Result.jsx` | Loading pattern fix |
| `client/src/pages/Profile.jsx` | Loading pattern fix, save button loading prop |
| `client/src/pages/Auth.jsx` | Login/Register button loading props |

---

## 6. Production Deployment Guide

### A. Deployment Options
1. **Option 1: Monolithic Single-Service (Recommended)**
   - Express serves both API (`/api/*`) and built React frontend (`client/dist/*`).
   - Platforms: Render, Railway, Fly.io, AWS EC2, or DigitalOcean App Platform.
2. **Option 2: Decoupled Multi-Service**
   - Frontend on Vercel/Netlify; backend on Render/Railway/Fly.io; database on MongoDB Atlas.
   - Requires setting `VITE_API_URL` on frontend and `CLIENT_ORIGIN` on backend.

### B. Required Environment Variables

#### Backend (`server/.env`)
| Variable | Required in Prod | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production security optimizations. |
| `PORT` | Optional | `5000` | Port for Express server. |
| `MONGODB_URI` | **Yes** | `mongodb+srv://...` | MongoDB connection string. |
| `JWT_SECRET` | **Yes** | 32+ char hex string | Secret key for signing JWTs. |
| `JWT_EXPIRES_IN` | No | `12h` | Session validity window. |
| `CLIENT_ORIGIN` | **Yes** | `https://yourdomain.com` | CORS whitelist. |
| `SQL_TIMEOUT_MS` | No | `3000` | SQLite sandbox timeout. |

#### Frontend (`client/.env`)
| Variable | Required in Prod | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Only if decoupled | `/api` or `https://api.yourdomain.com/api` | Base URL for API. |

### C. Step-by-Step Deployment (Monolith)
1. **Database Setup:** Create MongoDB Atlas cluster, configure network access, create user.
2. **Build & Deploy:**
   - Build: `cd client && npm ci && npm run build && cd ../server && npm ci`
   - Start: `cd server && npm start`
   - Set environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`.
3. **Seed Database:** Run once: `cd server && npm run seed` (idempotent, safe to re-run).
4. **Health Check:** `GET /api/health` → `HTTP 200` with `{"ok": true, "db": "connected"}`.

---

## 7. Known Scope Boundaries & Next Steps
- **Provenance Honesty:** All questions are original practice material. No official PYQs published without documented source evidence.
- **Email Delivery:** Password reset tokens are generated securely (SHA-256 hashed in DB). SMTP transport not configured in this release; reset tokens returned by API in non-production. Integrate SendGrid/Resend/AWS SES for production.
- **Bundle Optimization:** Vite build emits a warning that `index.js` exceeds 500 kB. Implement route-level `React.lazy()` / dynamic imports for larger views (Coding.jsx, TestRunner.jsx) post-launch.
- **WebSocket Notifications:** Current notification system is REST-based (poll on route change). For real-time push notifications, add Socket.IO or Server-Sent Events.
