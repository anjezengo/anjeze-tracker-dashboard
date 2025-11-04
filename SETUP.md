# Setup Guide - Anjeze Tracker Dashboard

Follow these steps to get the project running:

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
   - Project name: **Anjeze Tracker Dashboard**
   - Database password: Save this securely (or use: `xc6A-cwdtZfm@5!`)
   - Region: Choose closest to you

2. Once the project is created, go to **SQL Editor** and run the migration:
   ```bash
   # Copy and paste the entire contents of:
   supabase/migrations/001_init_schema.sql
   ```

3. Note your credentials from **Project Settings > Database**:
   - Host: `db.xxxxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (your database password)

4. Note your API credentials from **Project Settings > API**:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: `eyJhbG...`

## Step 2: Set Up ETL (Data Import)

```bash
cd etl

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials:
# PGHOST=db.xxxxx.supabase.co
# PGPORT=5432
# PGDATABASE=postgres
# PGUSER=postgres
# PGPASSWORD=your-password (percent-encode special chars if needed)
```

## Step 3: Import Data

```bash
cd etl

# Import the Excel file
npm run import -- --file "../1.1 Anjeze Tracker - for Kiran.xlsx"

# You should see:
# ✓ Database connected
# ✓ Parsed XXX rows
# ✓ Processed XXX/XXX rows
# ✅ Import completed!

# Seed asset metadata
npm run seed-assets

# Run tests to verify everything works
npm test
```

## Step 4: Set Up Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase API credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## Step 5: Run Development Server

```bash
cd dashboard

# Start development server
npm run dev

# Open browser to:
# http://localhost:3000
```

You should see the dashboard with:
- Statistics cards at the top
- Filters
- Pie chart and bar chart
- Professional black theme

## Step 6: Deploy to Netlify

### Option A: Netlify CLI

```bash
cd dashboard

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod

# Add environment variables in Netlify Dashboard:
# Site Settings > Environment Variables
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Option B: Netlify Dashboard

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Click "Deploy site"

## Step 7: Test the Dashboard

1. **Filters**: Try selecting different years, projects, and sub-projects
2. **Charts**: Verify they update based on filters
3. **URL Persistence**: Copy the URL with filters - it should work when shared
4. **Asset Display**: Select a sub-project filter to see its description
5. **Submit Form**: Go to `/submit` and add a new record

## Troubleshooting

### Import fails with "connection refused"
- Check Supabase credentials in `etl/.env`
- Verify your IP is allowed (Supabase > Settings > Database > Connection pooling)

### Dashboard shows "No data available"
- Verify ETL import completed successfully
- Check browser console for API errors
- Test Supabase connection: `psql -h db.xxxxx.supabase.co -U postgres -d postgres`

### Charts not loading
- Open browser console (F12) and check for errors
- Verify environment variables in `dashboard/.env`
- Check API routes are working: `/api/metrics` and `/api/assets`

### Dates showing as NULL
- Check Excel date format in source file
- See `etl/utils.test.js` for supported date formats
- Run `npm test` in `/etl` to verify parsing

## Next Steps

1. **Add Images**: Update `dim_assets` table with image URLs for sub-projects
   ```sql
   UPDATE dim_assets
   SET image_url = 'https://your-image-url.com/image.jpg'
   WHERE sub_project_canon = 'Infant Goodie Bag';
   ```

2. **Customize Theme**: Edit colors in `dashboard/tailwind.config.js`

3. **Add More Charts**: Create new components in `dashboard/src/components/`

4. **Set Up CI/CD**: Add GitHub Actions for automatic deployments

## Support

If you encounter issues:
1. Check the main README.md
2. Review code comments
3. Check Supabase logs (Dashboard > Logs)
4. Check Netlify deploy logs

---

**You're all set! 🚀**
