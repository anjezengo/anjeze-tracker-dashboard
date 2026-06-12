# Anjeze Tracker Dashboard — Build Log
> Last updated: 2026-06-13

---

## Current State of the Project

Migrated from Supabase (kept pausing) to **Neon PostgreSQL** (no pausing, free tier).
ETL has been updated for new Excel column names. Dashboard is fully wired to Neon.
1,104 rows imported. Dashboard compiles cleanly, API endpoints return live data.

---

## Service Dependency Map

| Service | Purpose | Account | Status |
|---|---|---|---|
| **GitHub** | Version control | `anjezengo@gmail.com` | ✅ Correct |
| **Netlify** | Hosting | `anjezengo@gmail.com` | ✅ Already on correct account |
| **Neon** | Database (Postgres, no pausing) | `anjezengo@gmail.com` | ✅ Live — ep-falling-moon-aonztjun |
| **Microsoft OneDrive** | Excel source | `team@anjeze.org` | ✅ Share URL in ETL .env |
| **Supabase** | Database (old) | — | ❌ Dropped |
| **Google Cloud / Sheets** | Sync (old) | — | ❌ Dropped |

### Active credentials (.env files)
- `DATABASE_URL` — Neon pooler connection string — in `etl/.env` and `dashboard/.env.local`
- `ONEDRIVE_SHARE_URL` — OneDrive Excel share URL — in `etl/.env`

---

## Excel Schema Change (old file → new `updated_1.1 Anjeze Tracker - for Kiran.xlsx`)

| Old Column | New Column | DB Impact |
|---|---|---|
| `Sr.No` | `Sr-No-` | ETL row_hash key |
| `Cause` | `Initiatives` | Renamed in DB + all UI |
| `Name of Institute / Area of Service` | `Name of Institute - Area of Service` | ETL mapping |
| `No. of Beneficiaries` | `No- of Beneficiaries` | ETL mapping |
| `Services / Remarks` | `Services-Remarks` | ETL mapping |
| `Comments by Pankti` | `Comments` | Renamed in DB |
| `On account/ Kind` | `On account- Kind` | ETL mapping |

---

## Migration & Rebuild Checklist

### Phase 1 — Infrastructure Setup
- [x] **1.1** Neon account created with `anjezengo@gmail.com`
- [x] **1.2** Neon project `ep-falling-moon-aonztjun` (ap-southeast-1), connection string saved
- [x] **1.3** Netlify already on `anjezengo@gmail.com` — no transfer needed
- [x] **1.4** Azure app registration abandoned — using OneDrive share URL instead (no auth needed)
- [ ] **1.5** Connect Neon ↔ Netlify integration (auto-inject DATABASE_URL into Netlify env vars)
- [ ] **1.6** Connect Neon ↔ GitHub integration (branch previews per PR) — optional

### Phase 2 — Database Rebuild (Neon)
- [x] **2.1** Schema uses `initiatives` / `initiatives_canon` (not `cause`)
- [x] **2.2** Schema uses `comments` (not `comments_by_pankti`)
- [x] **2.3** Migration run against Neon PostgreSQL 18.4 ✅
- [x] **2.4** `facts_clean` view verified — returns 1,104 rows

### Phase 3 — ETL Rebuild
- [x] **3.1** `etl/utils.js` column mappings updated for new Excel headers
- [x] **3.2** Row hash uses `Sr-No-` via fallback pattern
- [x] **3.3** `etl/.env` points to Neon via `DATABASE_URL`
- [x] **3.4** Import run: 1,104 rows, 0 errors
- [x] **3.5** `dim_assets` seeded: 20 sub-projects
- [ ] **3.6** `etl/sync-onedrive.js` — write OneDrive auto-sync script (downloads Excel from share URL, processes, upserts)

### Phase 4 — Dashboard Code Changes
- [x] **4.1** Replaced `@supabase/supabase-js` with `pg` — no Supabase deps remain
- [x] **4.2** Created `dashboard/src/lib/db.ts` — Neon pool with DNS fix (Google DNS fallback)
- [x] **4.3** Deleted `src/lib/googleSheets.ts`
- [x] **4.4** `api/sync/google-sheets.ts` → stubbed (returns 410 Gone)
- [x] **4.5** `netlify/functions/scheduled-sync.ts` → stubbed (ETL handles sync)
- [x] **4.6** All UI: "Cause" → "Initiatives"; `causes` filter → `initiatives`
- [x] **4.7** API query params: `causes` → `initiatives`; `byCause` → `byInitiatives`
- [x] **4.8** `dashboard/.env.local` updated — only `DATABASE_URL` needed
- [x] **4.9** `package.json` updated — removed `@supabase/supabase-js`, `googleapis`; added `pg`
- [x] **4.10** New API routes: `/api/filter-options`, `/api/assets`, `/api/submit`
- [x] **4.11** `dashboard/src/pages/submit.tsx` rewritten (no SmartSelect, uses `/api/submit`)
- [x] **4.12** TypeScript typecheck passes clean (0 errors)
- [ ] **4.13** Set Netlify env var `DATABASE_URL` in Netlify dashboard or via Neon integration

### Phase 5 — Harness Rebuild
- [ ] **5.1** Strip `CLAUDE.md` to ~30 lines (identity, tech stack, pointers only)
- [ ] **5.2** Create `AGENTS.md` with multi-agent orchestration spec
- [ ] **5.3** Skill: `etl-workflow` — how to run imports and validate data
- [ ] **5.4** Skill: `db-migrations` — schema change + migration run process
- [ ] **5.5** Skill: `dashboard-dev` — how to run, test, and deploy dashboard

### Phase 6 — Verification
- [x] **6.1** ETL import: 1,104 rows in Neon with 0 errors
- [x] **6.2** `facts_clean` view returns correct data (verified via API)
- [x] **6.3** Dashboard locally: filter-options returns 10 projects, 4 initiatives, 20 sub-projects
- [x] **6.4** `/api/metrics` returns 610k+ beneficiaries across 11 years
- [ ] **6.5** Set Netlify `DATABASE_URL` and deploy — confirm site loads in production
- [ ] **6.6** Smoke test in production: select sub-project, verify `dim_assets` shows
- [ ] **6.7** OneDrive auto-sync implemented and tested

---

## Remaining TODOs (Next Session)

**Priority 1 — Deploy to Netlify:**
1. In Netlify dashboard → Site settings → Environment variables → Add `DATABASE_URL`
   (or use Neon ↔ Netlify integration to auto-inject)
2. Trigger a new deploy

**Priority 2 — OneDrive Auto-Sync:**
- Write `etl/sync-onedrive.js` that downloads from `ONEDRIVE_SHARE_URL`, runs import, updates `sync_metadata`
- Add Netlify scheduled function to call this every 6h

**Priority 3 — Harness cleanup (Phase 5)**

---

## Data Flow (Current Architecture)

```
team@anjeze.org OneDrive
  └── updated_1.1 Anjeze Tracker.xlsx
        │
        ▼ Manual: npm run import (etl/import.js)
  Neon PostgreSQL (ep-falling-moon-aonztjun, ap-southeast-1)
  ├── tracker_raw         (1,104 rows, raw + canonical fields)
  ├── dim_assets          (20 sub-projects, images TBD)
  └── facts_clean (VIEW)  (canonical + numeric fields for charts)
        │
        ▼ pg (Node.js, DNS fix for local dev)
  Next.js API Routes
  ├── GET /api/filter-options  → dropdown options
  ├── GET /api/metrics         → aggregated charts data
  ├── GET /api/assets          → sub-project image/description
  └── POST /api/submit         → manual row insert
        │
        ▼
  Dashboard (Netlify) — Filters (incl. Initiatives), Charts, Asset Display
```

---

## Notes
- Local dev DNS issue: user's router blocks cloud hostnames → `lib/db.ts` uses `dns.resolve4()` with Google DNS (8.8.8.8) to pre-resolve Neon hostname to IP, then connects to IP with SSL SNI
- ETL has same fix in `import.js` and `seed-assets.js`
- `dim_assets` image URLs are all null — manual task for NGO team
- `iCloud Drive` path has spaces → `npm install` fails for `unrs-resolver` postinstall; use `~/anjeze-dashboard` for running dev server; rsync from iCloud to local after edits
