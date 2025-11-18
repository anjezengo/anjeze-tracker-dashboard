# Anjeze Tracker Dashboard - Implementation Plan

## Project Overview

**Current Status:** ✅ Deployed with Supabase + Manual ETL
**Next Phase:** 🔄 Google Sheets Auto-Sync Integration
**Repository:** https://github.com/anjezengo/anjeze-tracker-dashboard

---

## Current Architecture

```
Excel File (Local)
      ↓ (Manual)
  ETL Script (npm run import)
      ↓
  Supabase PostgreSQL
      ↓
  Next.js Dashboard (Netlify)
```

**Pain Point:** Users edit the Excel file and have to manually run ETL to sync data → duplication of effort

---

## Target Architecture: Google Sheets + Auto-Sync

```
Google Sheets (Live, Collaborative)
      ↓ (Automatic - Every 6 hours)
  Netlify Scheduled Function
      ↓ (Fetch via Google Sheets API)
  Apply Cleaning Rules (Existing Logic)
      ↓ (Sync to cache)
  Supabase PostgreSQL
      ↓ (Fast queries)
  Next.js Dashboard
```

**Benefits:**
- ✅ Users edit Google Sheets directly (familiar interface)
- ✅ Automatic sync every 6 hours (no manual ETL)
- ✅ Real-time collaboration (multiple users can edit)
- ✅ Version history built-in (Google Sheets tracks changes)
- ✅ Fast dashboard queries (cached in Supabase)
- ✅ Reuse 100% of existing cleaning logic
- ✅ Works offline (data cached in Supabase)

---

## Data Cleaning Rules (Already Implemented)

**DO NOT CHANGE - These are production rules:**

### Text Field Canonicalization
- Trim & collapse whitespace
- Title Case conversion
- Shadow fields: `*_canon` (e.g., `project_canon`, `sub_project_canon`, `institute_canon`)

### Date Parsing
- Multi-format support: `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, Excel serial dates
- Output: `date_iso` (ISO 8601 format)
- Supports year ranges: `2016-17` → `year_start=2016, year_end=2017, year_label='2016-2017'`
- Single years: `2019` → `year_start=2019, year_end=2019, year_label='2019'`

### Numeric Parsing
- Safe numeric conversion for `Quantity`, `No. of Beneficiaries`, `Amount`
- Shadow fields: `*_num` (e.g., `quantity_num`, `no_of_beneficiaries_num`, `amount_num`)
- Special values handling:
  - `Multiple`, `NA`, `N/A` (case-insensitive) → `NULL`
  - Non-numeric values → `NULL`
  - Original values always preserved
  - `NULL` values excluded from aggregations

### Data Integrity
- **Original columns NEVER modified**
- **No columns dropped**
- **All shadow fields additive only**
- Idempotent UPSERT (re-runs safe, no duplicates)
- Row hash key: `MD5(sr_no + date + project + sub_project)`

---

## Google Sheets API Integration Plan

### Phase 1: Google Cloud Setup (15 minutes)

#### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: **"Anjeze Tracker Sync"**
3. Enable **Google Sheets API**
4. Enable **Google Drive API** (optional, for file metadata)

#### 1.2 Create Service Account
1. Navigate to **IAM & Admin** → **Service Accounts**
2. Create service account: `anjeze-sheets-sync@PROJECT_ID.iam.gserviceaccount.com`
3. Grant role: **Viewer** (read-only access)
4. Create JSON key → **Download and save securely**

#### 1.3 Share Google Sheet
1. Open your Google Sheet (migrated from Excel)
2. Click **Share**
3. Add the service account email (from step 1.2)
4. Permission: **Viewer** (read-only)

#### 1.4 Get Sheet ID
From the Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```
Copy the `SHEET_ID_HERE` part

---

### Phase 2: Code Implementation

#### 2.1 Environment Variables

Add to `dashboard/.env.local`:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SHEET_ID=your_sheet_id_here
GOOGLE_SHEETS_RANGE=Tracker!A:Z
GOOGLE_SERVICE_ACCOUNT_EMAIL=anjeze-sheets-sync@PROJECT_ID.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Existing Supabase Config (keep these)
NEXT_PUBLIC_SUPABASE_URL=https://bvxejwsqaowacwrzjloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Needed for scheduled function
```

#### 2.2 Install Dependencies

```bash
cd dashboard
npm install googleapis @google-cloud/local-auth
```

#### 2.3 File Structure

```
dashboard/
├── src/
│   ├── lib/
│   │   ├── googleSheets.ts         # NEW: Google Sheets API client
│   │   ├── dataCleaning.ts         # NEW: Port ETL cleaning logic
│   │   └── supabase.ts             # EXISTING
│   ├── pages/
│   │   └── api/
│   │       └── sync/
│   │           └── google-sheets.ts # NEW: Manual sync endpoint
│   └── netlify/
│       └── functions/
│           └── scheduled-sync.ts    # NEW: Auto-sync (6 hours)
├── netlify.toml                     # UPDATE: Add scheduled function
└── package.json
```

---

### Phase 3: Implementation Code

#### 3.1 Google Sheets Client (`src/lib/googleSheets.ts`)

```typescript
import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function fetchSheetData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];

  // Convert to objects (first row = headers)
  const [headers, ...dataRows] = rows;

  return dataRows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
}
```

#### 3.2 Data Cleaning Logic (`src/lib/dataCleaning.ts`)

**NOTE:** Port the existing logic from `etl/utils.js` → TypeScript

```typescript
import crypto from 'crypto';
import dayjs from 'dayjs';

// Port all functions from etl/utils.js:
// - toTitleCase()
// - parseYear()
// - parseDate()
// - parseNumericSafe()
// - cleanRow()

export function cleanRow(rawRow: any) {
  // Copy exact logic from etl/utils.js cleanRow()
  // Returns cleaned row with all shadow fields
}
```

#### 3.3 Manual Sync API Endpoint (`src/pages/api/sync/google-sheets.ts`)

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchSheetData } from '@/lib/googleSheets';
import { cleanRow } from '@/lib/dataCleaning';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Fetch from Google Sheets
    const rawRows = await fetchSheetData();

    // 2. Clean data (apply existing ETL rules)
    const cleanedRows = rawRows.map(cleanRow);

    // 3. Sync to Supabase (UPSERT using row_hash)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side key
    );

    for (const row of cleanedRows) {
      await supabase.from('tracker_raw').upsert(row, {
        onConflict: 'row_hash',
      });
    }

    return res.json({
      success: true,
      rowsProcessed: cleanedRows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

#### 3.4 Scheduled Sync Function (`netlify/functions/scheduled-sync.ts`)

```typescript
import { schedule } from '@netlify/functions';
import { fetchSheetData } from '../../src/lib/googleSheets';
import { cleanRow } from '../../src/lib/dataCleaning';
import { createClient } from '@supabase/supabase-js';

const handler = async () => {
  try {
    console.log('🔄 Starting scheduled Google Sheets sync...');

    // 1. Fetch from Google Sheets
    const rawRows = await fetchSheetData();
    console.log(`📊 Fetched ${rawRows.length} rows from Google Sheets`);

    // 2. Clean data
    const cleanedRows = rawRows.map(cleanRow);

    // 3. Sync to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let synced = 0;
    for (const row of cleanedRows) {
      await supabase.from('tracker_raw').upsert(row, {
        onConflict: 'row_hash',
      });
      synced++;
    }

    console.log(`✅ Synced ${synced} rows successfully`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rowsSynced: synced,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Run every 6 hours
export default schedule('0 */6 * * *', handler);
```

#### 3.5 Netlify Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  directory = "netlify/functions"

# Scheduled function runs every 6 hours
[[functions]]
  name = "scheduled-sync"
  schedule = "0 */6 * * *"
```

---

### Phase 4: Testing & Deployment

#### 4.1 Local Testing

```bash
# Test Google Sheets connection
curl -X POST http://localhost:3000/api/sync/google-sheets

# Expected response:
# {
#   "success": true,
#   "rowsProcessed": 1088,
#   "timestamp": "2025-11-18T..."
# }
```

#### 4.2 Deploy to Netlify

```bash
# Commit changes
git add .
git commit -m "Add Google Sheets auto-sync integration"

# Push to company repo
git push AnjezeNGOaccount main

# Set environment variables in Netlify Dashboard:
# Settings → Environment Variables → Add:
# - GOOGLE_SHEETS_SHEET_ID
# - GOOGLE_SHEETS_RANGE
# - GOOGLE_SERVICE_ACCOUNT_EMAIL
# - GOOGLE_PRIVATE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

#### 4.3 Test Production Sync

```bash
# Trigger manual sync from production
curl -X POST https://your-app.netlify.app/api/sync/google-sheets

# Scheduled function will run automatically every 6 hours
# Check logs: Netlify Dashboard → Functions → scheduled-sync
```

---

## Migration: Excel → Google Sheets

### Option A: Manual Upload
1. Open Google Sheets
2. File → Import → Upload
3. Select `1.1 Anjeze Tracker - for Kiran.xlsx`
4. Import location: **Replace spreadsheet**
5. Rename sheet tab to **"Tracker"** (must match ETL expectation)

### Option B: Keep Excel + Convert on Sync
- Keep Excel file as source of truth
- Users upload to Google Drive manually when changed
- Google Sheets auto-converts Excel files
- **Not recommended** - adds manual step

**Recommendation:** Use Option A (one-time migration to Google Sheets)

---

## Current Data Stats (As of Last Import)

- **Total Records:** 1,088 rows
- **Date Range:** 2016-2026 (10 years)
- **Projects:** 8 unique
- **Sub-Projects:** 27 unique
- **Causes:** Multiple
- **Data Quality:**
  - ✅ 0 parsing errors
  - ✅ 0 unparseable dates
  - ✅ 100% data integrity

---

## Database Schema (Supabase)

### Table: `tracker_raw`

**Original Columns** (from Excel/Google Sheets):
- `sr_no` TEXT
- `year` TEXT
- `month` TEXT
- `date` TEXT
- `cause` TEXT
- `project` TEXT
- `sub_project` TEXT
- `institute` TEXT
- `department` TEXT
- `type_of_institution` TEXT
- `quantity` TEXT
- `no_of_beneficiaries` TEXT
- `amount` TEXT
- `remarks` TEXT
- `comments_by_pankti` TEXT
- `on_account_kind` TEXT

**Shadow Columns** (computed by ETL):
- `month_canon` TEXT (Title Case)
- `cause_canon` TEXT (Title Case)
- `project_canon` TEXT (Title Case)
- `sub_project_canon` TEXT (Title Case)
- `institute_canon` TEXT (Title Case)
- `department_canon` TEXT (Title Case)
- `type_of_institution_canon` TEXT (Title Case)
- `remarks_canon` TEXT (Title Case)
- `year_start` INTEGER
- `year_end` INTEGER
- `year_label` TEXT
- `date_iso` TIMESTAMPTZ
- `quantity_num` NUMERIC
- `no_of_beneficiaries_num` NUMERIC
- `amount_num` NUMERIC
- `row_hash` TEXT (PRIMARY KEY, MD5 hash for idempotency)

**Metadata Columns:**
- `id` BIGSERIAL PRIMARY KEY
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

### View: `facts_clean`

**Purpose:** Exposes only canonical + numeric fields for charts/filters

```sql
CREATE OR REPLACE VIEW facts_clean AS
SELECT
  id,
  sr_no,
  cause_canon AS cause,
  project_canon AS project,
  sub_project_canon AS sub_project,
  institute_canon AS institute,
  department_canon AS department,
  type_of_institution_canon AS type_of_institution,
  remarks_canon AS remarks,
  month_canon AS month,
  year_start,
  year_end,
  year_label,
  date_iso,
  quantity_num AS quantity,
  no_of_beneficiaries_num AS beneficiaries,
  amount_num AS amount,
  created_at
FROM tracker_raw;
```

### Table: `dim_assets`

**Purpose:** Store images/descriptions for sub-projects

```sql
CREATE TABLE dim_assets (
  sub_project_canon TEXT PRIMARY KEY,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Status:** 27 sub-projects seeded, placeholders only (no images yet)

---

## Dashboard Features (Implemented)

### Filters (URL-persisted)
- **Years** (multi-select) - dropdown with checkboxes
- **Project** (single-select)
- **Sub-Project** (single-select)
- **Institute** (single-select)
- **Type of Institution** (single-select)

**URL Format:** `/?years=2018,2019&subProject=Infant%20Goodie%20Bag`

### Charts (Recharts + Framer Motion)
1. **Stats Cards**
   - Total Beneficiaries
   - Total Records
   - Unique Projects
   - Unique Sub-Projects

2. **Beneficiaries Pie Chart**
   - By sub-project
   - Filterable
   - Smooth animations

3. **Yearly Trend Chart**
   - Bar chart by `year_start`
   - Line overlay (moving average)
   - Filterable

4. **Remarks & Quantity Visualization**
   - Top 20 items by quantity
   - Shows institute + sub-project

5. **Cause Cards**
   - Impact grouped by cause
   - Total beneficiaries per cause

### Asset Display
- When sub-project selected → fetch from `dim_assets`
- Shows image + description
- Currently: placeholders only

### Submit Form (`/submit`)
- Simple form to add new records
- Smart dropdowns (pre-populated from existing data)
- "Add New" buttons for custom values
- Mobile-responsive

---

## Future Enhancements (To Be Implemented)

### Phase 2 Features (TBD)
_User will provide detailed requirements later_

**Potential Ideas:**
- [ ] Real-time dashboard updates (websockets)
- [ ] Advanced filtering (date ranges, amount ranges)
- [ ] Export functionality (PDF reports, Excel exports)
- [ ] User authentication (role-based access)
- [ ] Edit existing records (admin panel)
- [ ] Image upload for `dim_assets`
- [ ] Natural language queries (AI-powered filters)
- [ ] Mobile app (React Native)
- [ ] WhatsApp notifications (new submissions)

**Placeholder Section:** _To be filled in when user provides requirements_

---

## Deployment Configuration

### Netlify

**Build Settings:**
- Base directory: `dashboard`
- Build command: `npm run build`
- Publish directory: `.next`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://bvxejwsqaowacwrzjloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (for scheduled functions)
GOOGLE_SHEETS_SHEET_ID=... (to be added)
GOOGLE_SHEETS_RANGE=Tracker!A:Z
GOOGLE_SERVICE_ACCOUNT_EMAIL=... (to be added)
GOOGLE_PRIVATE_KEY=... (to be added)
```

### Supabase

**Project:** Anjeze Tracker Dashboard
**Region:** Asia (ap-south-1)
**Connection:**
- Host: `aws-1-ap-south-1.pooler.supabase.com` (Transaction Pooler, IPv4-compatible)
- Port: `6543`
- Database: `postgres`
- User: `postgres.bvxejwsqaowacwrzjloz`

**Database URL:**
```
postgresql://postgres.bvxejwsqaowacwrzjloz:anjeze123456789012@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## Development Workflow

### Local Development

```bash
# Dashboard (Next.js)
cd dashboard
npm run dev
# → http://localhost:3000

# ETL (Node.js) - DEPRECATED after Google Sheets integration
cd etl
npm run import -- --file "../1.1 Anjeze Tracker - for Kiran.xlsx"
```

### Git Workflow

```bash
# Current branch: main
# Remote: AnjezeNGOaccount (https://github.com/anjezengo/anjeze-tracker-dashboard)

# Make changes
git add .
git commit -m "Description"
git push AnjezeNGOaccount main

# Netlify auto-deploys on push to main
```

---

## Known Issues & Resolutions

### Issue 1: Years Dropdown Z-Index
**Status:** ✅ Fixed (commit eba0eb6)
**Problem:** Years dropdown opened under cards instead of on top
**Solution:** Added `z-index` styling to dropdown container

### Issue 2: Charts Not Rendering
**Status:** 🔍 Under Investigation
**Problem:** Charts load but don't display data
**Possible Causes:**
- API returning empty data
- Recharts configuration issue
- CSS/styling conflict

**Debug Steps:**
1. Check browser console for errors
2. Verify API response: `GET /api/metrics?years=2018,2019`
3. Check Recharts data format

### Issue 3: npm install Path Spaces Error
**Status:** ✅ Resolved
**Problem:** `npm install` failed due to spaces in folder path (iCloud Drive)
**Solution:** Moved project to `~/anjeze-dashboard` (no spaces in path)

**Original Path:**
```
/Users/nirvaanrohira/Library/Mobile Documents/com~apple~CloudDocs/Vastu Chut INC /Brokerage Stuff/...
```

**Working Path:**
```
~/anjeze-dashboard
```

**Note:** Can sync back to iCloud Drive after development if needed

---

## API Reference

### GET `/api/metrics`

**Query Parameters:**
- `years` (optional): Comma-separated years (e.g., `2018,2019`)
- `subProject` (optional): Sub-project name (URL-encoded)
- `project` (optional): Project name
- `institute` (optional): Institute name
- `type` (optional): Institution type

**Response:**
```json
{
  "success": true,
  "data": {
    "bySubProject": [
      {
        "sub_project": "Infant Goodie Bag",
        "total_beneficiaries": 1500,
        "total_amount": 50000,
        "total_quantity": 100,
        "count": 25
      }
    ],
    "byYear": [...],
    "byCause": [...],
    "remarksQuantity": [...],
    "overall": {
      "total_beneficiaries": 10000,
      "total_amount": 500000,
      "total_records": 1088,
      "unique_projects": 8,
      "unique_sub_projects": 27,
      "project_list": [...],
      "sub_project_list": [...]
    }
  }
}
```

### GET `/api/assets`

**Query Parameters:**
- `subProject` (required): Sub-project name

**Response:**
```json
{
  "success": true,
  "data": {
    "sub_project_canon": "Infant Goodie Bag",
    "image_url": null,
    "description": "Placeholder description for Infant Goodie Bag"
  }
}
```

### POST `/api/sync/google-sheets` (To Be Implemented)

**Purpose:** Manually trigger Google Sheets sync

**Request:** `POST` (no body required)

**Response:**
```json
{
  "success": true,
  "rowsProcessed": 1088,
  "timestamp": "2025-11-18T14:30:00.000Z"
}
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion, GSAP
- **Date Handling:** dayjs
- **Deployment:** Netlify

### Backend
- **Database:** Supabase (PostgreSQL 15)
- **API Client:** @supabase/supabase-js
- **Scheduled Jobs:** Netlify Functions (cron)
- **Google Sheets:** googleapis (Node.js client)

### DevOps
- **Version Control:** Git (GitHub)
- **CI/CD:** Netlify (auto-deploy on push)
- **Environment:** Node.js 20+

---

## Timeline & Effort Estimates

### Completed ✅
- Initial ETL pipeline: ~2 hours
- Supabase schema + migrations: ~1 hour
- Next.js dashboard (filters, charts, forms): ~6 hours
- Netlify deployment: ~1 hour
- GitHub migration: ~30 minutes
- **Total:** ~10.5 hours

### Google Sheets Integration (Planned)
- Google Cloud setup: ~15 minutes
- Port ETL logic to TypeScript: ~1 hour
- Google Sheets API client: ~30 minutes
- Scheduled sync function: ~1 hour
- Testing & debugging: ~1 hour
- Netlify env setup: ~15 minutes
- **Total:** ~4 hours

### Future Enhancements (TBD)
- _To be estimated when requirements provided_

---

## Security Considerations

### Secrets Management
- ✅ `.env.local` in `.gitignore` (never commit secrets)
- ✅ Netlify environment variables (encrypted)
- ✅ Supabase RLS policies (row-level security) - **TODO: Enable**
- ✅ Google Service Account (read-only permissions)

### Authentication
- **Current:** Public dashboard (no auth)
- **Future:** Consider adding:
  - Supabase Auth (email/password)
  - Role-based access (viewer, editor, admin)
  - API key protection for sync endpoint

### Data Privacy
- **Consideration:** NGO data may contain sensitive information
- **Recommendation:** Enable Supabase RLS before production launch
- **Compliance:** Ensure GDPR/data protection compliance if needed

---

## Support & Contact

**GitHub Repository:** https://github.com/anjezengo/anjeze-tracker-dashboard

**Key Contacts:**
- Developer: NirvaanRohira (GitHub: @NirvaanRohira)
- Organization: Anjeze NGO (GitHub: @anjezengo)

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Google Sheets API: https://developers.google.com/sheets/api
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Next.js: https://nextjs.org/docs

---

## Changelog

### 2025-11-18
- ✅ Created comprehensive implementation plan
- ✅ Documented Google Sheets integration approach
- ✅ Added scheduled sync strategy (6-hour intervals)
- ✅ Outlined migration steps from Excel to Google Sheets
- 📋 Reserved section for future enhancements (TBD)

### 2025-11-04
- ✅ Migrated repository to company GitHub account (@anjezengo)
- ✅ Fixed dropdown z-index issues
- ✅ Resolved npm install path errors
- ✅ Deployed initial dashboard to production

---

## Quick Start (For Future Reference)

### 1. Clone Repository
```bash
git clone https://github.com/anjezengo/anjeze-tracker-dashboard.git
cd anjeze-tracker-dashboard/dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Deploy to Netlify
```bash
git push AnjezeNGOaccount main
# Auto-deploys via Netlify
```

---

**Document Version:** 1.0
**Last Updated:** November 18, 2025
**Status:** Ready for Google Sheets Integration Phase
