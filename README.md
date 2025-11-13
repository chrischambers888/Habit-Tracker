## Habit Tracker

Single-user habit tracking and daily planning app built with the AI-friendly stack:

- Next.js 16 (App Router) + React 19
- TypeScript + TailwindCSS + shadcn/ui
- React Query for data fetching
- MongoDB via Mongoose

### Features
- Create habits with daily, weekly, or monthly cadence
- Log progress once per period with rating (`bad`, `okay`, `good`) and notes
- Visualize recent trend lines and history for each habit
- Plan the current day and tomorrow with time-blocked events
- Save favorite events for quick reuse
- Maintain a single-level categorized backlog and mark items complete

---

## 1. Environment Setup

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later
- MongoDB deployment (Atlas or local)

### Install dependencies

```bash
npm install
```

### Environment variables
Create `/Users/chrischambers/Documents/Websites/Habit Tracker/.env.local`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/habit-tracker
MONGODB_DB_NAME=habit-tracker
# Optional: defaults to your system time zone
# APP_TIMEZONE=America/New_York
```

**MongoDB quick start**
1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or run `mongod` locally).
2. Add a database user and copy the connection string.
3. Replace `<user>`/`<password>`/`<cluster>` above.
4. The app will automatically create collections on first run—no manual migrations needed.

---

## 2. Development Workflow

### Start the dev server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

### Lint & typecheck
```bash
npm run lint
```

### Run smoke tests
```bash
npm test
```

---

## 3. Project Structure
- `src/app/(dashboard)/habits` – habit dashboard UI
- `src/app/(dashboard)/schedule` – schedule + backlog experience
- `src/app/api` – REST endpoints for habits, logs, schedule, favorites, backlog
- `src/lib/models` – Mongoose models
- `src/lib/schemas` – shared Zod schemas & response parsing
- `src/hooks` – React Query hooks for data access
- `src/components` – shadcn-based UI building blocks

---

## 4. Deployment Notes
- Ready for Vercel; set environment variables in the project dashboard.
- Add `MONGODB_URI` and `MONGODB_DB_NAME` to the host environment.
- `npm run build` performs a production compile with React Compiler + Turbopack.

---

## 5. Roadmap Ideas
- Authentication for multi-user support
- Push/email reminders based on habit cadence
- Deeper analytics (streaks, category rollups)
- Mobile-first PWA enhancements
