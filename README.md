# Anjeze Tracker Dashboard

A production-ready full-stack solution for tracking and visualizing NGO beneficiary data with professional charts and smooth animations.

## 🏗️ Architecture

### `/etl` - Data Import Pipeline (Node.js)
- Reads Excel files and imports data to Supabase
- Applies data cleaning rules with shadow canonical fields
- Idempotent imports (re-runs won't duplicate data)
- Unit tests for parsing and validation

### `/dashboard` - Web Interface (Next.js)
- Interactive dashboard with professional black theme
- URL-persistent filters (shareable links)
- Real-time charts with smooth animations (Recharts + GSAP + Framer Motion)
- Submit form for adding new records
- Deployed on Netlify

### `/supabase` - Database Schema
- PostgreSQL tables with indexes
- `tracker_raw` - Main data table with original + canonical fields
- `dim_assets` - Sub-project images and descriptions
- `facts_clean` - View for analytics

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Netlify account (for deployment)

### 1. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration SQL:
   ```bash
   # Copy the SQL from supabase/migrations/001_init_schema.sql
   # Run it in Supabase SQL Editor
   ```
3. Note your credentials:
   - Database Host: `db.your-project.supabase.co`
   - Database Password: (from project settings)
   - API URL: `https://your-project.supabase.co`
   - Anon Key: (from project settings > API)

### 2. Import Data (ETL)

```bash
cd etl

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Import Excel data
npm run import -- --file "../1.1 Anjeze Tracker - for Kiran.xlsx"

# Seed asset metadata
npm run seed-assets

# Run tests
npm test
```

### 3. Set Up Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and Anon Key

# Run development server
npm run dev

# Open http://localhost:3000
```

### 4. Deploy to Netlify

```bash
cd dashboard

# Build locally (optional)
npm run build

# Deploy to Netlify
# Option 1: Use Netlify CLI
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod

# Option 2: Use Netlify Dashboard
# 1. Push code to GitHub
# 2. Connect repository in Netlify
# 3. Set build command: npm run build
# 4. Set publish directory: .next
# 5. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📊 Data Cleaning Rules

The ETL applies these transformations while preserving all original data:

### Shadow Canonical Fields
- Trim & collapse spaces
- Convert to Title Case
- Fields: `project_canon`, `sub_project_canon`, `institute_canon`, `type_of_institution_canon`, `remarks_canon`

### Year Parsing
- `"2016-17"` → `year_start: 2016, year_end: 2017, year_label: "2016-2017"`
- `"2019"` → `year_start: 2019, year_end: 2019, year_label: "2019"`

### Date Parsing
- Multiple format support (ISO, DD/MM/YYYY, MM/DD/YYYY, etc.)
- Output: `date_iso` in `YYYY-MM-DD` format
- Unparseable dates → `NULL`

### Numeric Parsing
- `"100"` → `100`
- `"Multiple"`, `"NA"` → `NULL` (excluded from calculations)
- Removes formatting (commas, currency symbols)

---

## 🎨 Dashboard Features

### Filters (URL-Persistent)
- **Year** (multi-select)
- **Project**
- **Sub-Project**
- **Institute**
- **Type of Institution**

Filters are saved in URL query params - share filtered views with your team!

### Charts
1. **Pie Chart** - Total beneficiaries by sub-project
2. **Bar Chart with Trend Line** - Yearly beneficiaries with 3-year moving average

### Asset Display
When a sub-project is selected, displays:
- Image (if available)
- Description

### Submit Form
Add new records directly from the web interface

---

## 🛠️ Development

### ETL Project Structure
```
etl/
├── import.js          # Main import script
├── seed-assets.js     # Asset seeding script
├── utils.js           # Data cleaning utilities
├── utils.test.js      # Unit tests
├── package.json
└── .env.example
```

### Dashboard Project Structure
```
dashboard/
├── src/
│   ├── components/    # React components
│   ├── lib/           # Utilities (Supabase, filters)
│   ├── pages/         # Next.js pages & API routes
│   ├── styles/        # Global CSS
├── public/            # Static assets
├── netlify.toml       # Netlify config
└── package.json
```

### Running Tests
```bash
cd etl
npm test
```

### Type Checking
```bash
cd dashboard
npm run typecheck
```

---

## 📈 API Routes

### GET `/api/metrics`
Returns aggregated metrics filtered by query params.

**Query Params:**
- `years` - Comma-separated years (e.g., `2018,2019`)
- `project`, `subProject`, `institute`, `type`

**Response:**
```json
{
  "success": true,
  "data": {
    "bySubProject": [...],
    "byYear": [...],
    "overall": {
      "total_beneficiaries": 1234,
      "total_amount": 56789,
      ...
    }
  }
}
```

### GET `/api/assets`
Returns asset data for a sub-project.

**Query Params:**
- `subProject` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "sub_project_canon": "Infant Goodie Bag",
    "image_url": "https://...",
    "description": "..."
  }
}
```

---

## 🎯 Quality Gates

- ✅ Unit tests for year/date/numeric parsing
- ✅ SQL migrations with indexes
- ✅ TypeScript strict mode
- ✅ Idempotent imports (hash-based deduplication)
- ✅ Null-safe numeric aggregations
- ✅ URL-persistent filters

---

## 🔐 Environment Variables

### ETL (.env)
```env
PGHOST=db.your-project.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your-password
```

### Dashboard (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** For Netlify deployment, add these in Netlify Dashboard > Site Settings > Environment Variables

---

## 📝 Usage Examples

### Import Data
```bash
cd etl
npm run import -- --file "../data.xlsx"
```

### Re-import (Idempotent)
```bash
# Safe to run multiple times - won't create duplicates
npm run import -- --file "../data.xlsx"
```

### Seed Assets
```bash
npm run seed-assets
```

### Update Asset Images
```sql
UPDATE dim_assets
SET image_url = 'https://example.com/image.jpg',
    description = 'Updated description'
WHERE sub_project_canon = 'Infant Goodie Bag';
```

### Query Facts View
```sql
SELECT
  sub_project,
  SUM(beneficiaries) as total_beneficiaries,
  COUNT(*) as records
FROM facts_clean
WHERE year_start = 2023
GROUP BY sub_project
ORDER BY total_beneficiaries DESC;
```

---

## 🎨 Color Palette (Black Theme)

- **Background:** `#000000` to `#1a1a1a`
- **Accent:** `#ffffff` (primary), `#a3a3a3` (secondary)
- **Highlights:**
  - Blue: `#3b82f6`
  - Purple: `#a855f7`
  - Green: `#22c55e`
  - Yellow: `#eab308`
  - Red: `#ef4444`

---

## 🐛 Troubleshooting

### Import Fails with Connection Error
- Check Supabase credentials in `.env`
- Ensure your IP is allowed in Supabase (or disable IP restrictions)

### Charts Not Loading
- Check browser console for errors
- Verify Supabase URL and Anon Key in dashboard `.env`
- Ensure `facts_clean` view has data

### Dates Parsing as NULL
- Check Excel date format
- See `etl/utils.js` `parseDate()` for supported formats
- Run unit tests: `npm test` in `/etl`

---

## 📜 License

MIT

---

## 🙏 Credits

Built with:
- **Next.js** - React framework
- **Supabase** - PostgreSQL database
- **Recharts** - Chart library
- **Framer Motion** - Animations
- **GSAP** - Advanced animations
- **Tailwind CSS** - Styling
- **Netlify** - Deployment

---

## 📞 Support

For issues or questions, please check:
1. This README
2. Code comments in source files
3. Supabase documentation
4. Next.js documentation

---

**Happy Tracking! 📊**
