# 🚀 Quick Start - Get Up and Running in 15 Minutes

## Step 1: Get Your Supabase Anon Key (2 minutes)

You have the database credentials, now you need the **Anon Key** for the dashboard:

1. Go to: https://supabase.com/dashboard
2. Select project: **Anjeze Tracker Dashboard**
3. Go to: **Settings** → **API**
4. Copy the **"anon" "public"** key (long string starting with `eyJ...`)

## Step 2: Set Up Database (3 minutes)

1. Go to: https://supabase.com/dashboard (your project)
2. Click **SQL Editor** on the left
3. Click **New Query**
4. Copy the entire content from: `supabase/migrations/001_init_schema.sql`
5. Paste and click **Run**
6. You should see: "Success. No rows returned"

## Step 3: Import Your Data (5 minutes)

```bash
cd etl

# Install dependencies (first time only)
npm install

# The .env file is already configured with your credentials!
# Just verify it looks correct:
cat .env

# Import the Excel file
npm run import -- --file "../1.1 Anjeze Tracker - for Kiran.xlsx"

# Wait for completion (you'll see progress)
# Expected: ✅ Import completed!

# Seed asset metadata
npm run seed-assets
```

## Step 4: Set Up Dashboard (3 minutes)

```bash
cd dashboard

# Install dependencies (first time only)
npm install

# Edit .env.local with your Anon Key
# Replace YOUR_ANON_KEY_HERE with the key from Step 1
nano .env.local  # or use any text editor
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bvxejwsqaowacwrzjloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (your actual key)
```

## Step 5: Test Locally (2 minutes)

```bash
cd dashboard
npm run dev
```

Open browser: http://localhost:3000

You should see:
- ✅ Dashboard with statistics
- ✅ Filters working
- ✅ Charts showing your data
- ✅ Black professional theme

Try clicking filters and see charts update!

## Step 6: Deploy to Netlify (Optional - 5 minutes)

### Via Netlify Website:

1. Push your code to GitHub (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to: https://netlify.com
3. Click: **Add new site** → **Import an existing project**
4. Connect your GitHub repository
5. Build settings:
   - Base directory: `dashboard`
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Environment variables (click "Advanced"):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://bvxejwsqaowacwrzjloz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key from Step 1)
7. Click: **Deploy site**
8. Wait 2-3 minutes
9. Your site is live! 🎉

---

## 🎯 What You Can Do Now

### View Dashboard
- **Local**: http://localhost:3000
- **Live**: https://your-site.netlify.app

### Add New Data

**Option 1: Web Form** (for 1-10 records)
1. Go to: http://localhost:3000/submit (or your Netlify URL/submit)
2. Smart dropdowns show existing values
3. Click "Add New" to type custom values
4. Submit → data appears in dashboard instantly!

**Option 2: Excel Import** (for bulk data)
```bash
cd etl
npm run import -- --file "../new-data.xlsx"
```

---

## 🎨 Smart Dropdown Features

When you use the submit form:

1. **Click any field** → See dropdown with existing values
2. **Type to search** → Filter the dropdown
3. **Select existing** → Ensures consistency
4. **Click "Add New"** → Enter custom value
5. **Submit** → New value appears in future dropdowns!

**Example:**
- Project field shows: "Health", "Education", "Community"
- Select "Health" → Fast and consistent
- Or click "Add New" → Type "New Project" → Available for next time

---

## 📱 Share With Your Team

Send them the submit page URL:
```
https://your-site.netlify.app/submit
```

They can add data from:
- ✅ Desktop
- ✅ Tablet
- ✅ Phone (mobile-optimized!)

No technical knowledge needed!

---

## 🔧 Troubleshooting

### Dashboard shows "No data"
1. Check if ETL import completed successfully
2. Verify `.env.local` has correct credentials
3. Check browser console (F12) for errors

### ETL import fails
1. Verify `etl/.env` has correct database password
2. Check Excel file has "Tracker" sheet
3. Ensure Supabase is accessible (check firewall)

### Charts not loading
1. Open browser console (F12)
2. Look for red error messages
3. Verify Supabase URL and Anon Key are correct

---

## 📚 Next Steps

1. ✅ Test adding a record via web form
2. ✅ Test filters and charts
3. ✅ Share submit page with team
4. ✅ Read `DATA_INPUT_GUIDE.md` for detailed workflow
5. ✅ Customize colors in `tailwind.config.js` if desired

---

## 💡 Pro Tips

1. **Bookmark the submit page** for quick access
2. **Use Excel import for monthly bulk updates**
3. **Use web form for daily individual entries**
4. **Filter URLs are shareable** - send filtered views to colleagues!
5. **Mobile-friendly** - add to home screen on phone

---

**Need Help?**
- Check `README.md` for detailed documentation
- Check `DATA_INPUT_GUIDE.md` for workflow details
- Check `SETUP.md` for step-by-step setup

**Questions?**
- All components have detailed comments in code
- TypeScript types help prevent errors
- Unit tests verify data cleaning logic

---

## ✅ Checklist

- [ ] Supabase database set up
- [ ] SQL migration run
- [ ] ETL dependencies installed (`npm install` in /etl)
- [ ] Data imported via ETL
- [ ] Assets seeded
- [ ] Dashboard dependencies installed (`npm install` in /dashboard)
- [ ] `.env.local` configured with Anon Key
- [ ] Dashboard running locally
- [ ] Tested submit form
- [ ] (Optional) Deployed to Netlify
- [ ] Team members have submit page URL

---

**You're ready to go! 🎉**

Your professional tracking dashboard is live with:
- 📊 Beautiful charts
- 🎨 Professional black theme
- ⚡ Smooth animations
- 🔄 Smart dropdowns
- 📱 Mobile-friendly
- 🔗 Shareable filter URLs
