# Anjeze Tracker Dashboard — Full Handover Document

> Written for a non-technical user. No prior technical knowledge required.

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [How to Access the Dashboard](#2-how-to-access-the-dashboard)
3. [Using the Dashboard — Feature by Feature](#3-using-the-dashboard--feature-by-feature)
4. [How to Update the Data](#4-how-to-update-the-data)
5. [All Accounts & Credentials](#5-all-accounts--credentials)
6. [Troubleshooting Guide](#6-troubleshooting-guide)
7. [Maintenance Calendar](#7-maintenance-calendar)
8. [Who to Contact](#8-who-to-contact)

---

## 1. What This System Does

The Anjeze Tracker Dashboard is a private, password-protected website that reads data from the Anjeze NGO Excel tracker and displays it as interactive charts and statistics. It allows you to:

- See the total number of beneficiaries, activities, and amounts across all years
- Filter data by year, project, sub-project, institute, and type
- Search using plain English (e.g. "What did we do in 2020?")
- Add new records directly through the website (without touching Excel)
- Upload a new version of the Excel file to refresh all the data

---

## 2. How to Access the Dashboard

### Website URL
```
https://anjezeprogresstracker.netlify.app
```

Open this in any web browser (Chrome, Safari, Firefox, Edge). It works on mobile and desktop.

### Login Credentials
| Field    | Value             |
|----------|-------------------|
| Email    | admin@anjeze.org  |
| Password | Trustor@1949      |

**Steps:**
1. Open the URL above in your browser
2. You will see a login screen titled "Anjeze Tracker"
3. Type the email address and password exactly as shown above
4. Click **Sign In**
5. You are now on the main dashboard

> **Note:** The session stays logged in on the same device/browser. You will not need to log in again unless you clear your browser history or use a different device.

---

## 3. Using the Dashboard — Feature by Feature

### 3.1 The Main Dashboard (Home Page)

When you log in you will see the main page with all charts and data. Here is what each section does, from top to bottom:

---

#### Search Bar (Natural Language Search)
At the very top is a search bar with a magnifying glass icon.

**What it does:** You type a question in plain English and the dashboard automatically applies the right filters and updates all charts.

**How to use it:**
1. Click inside the search bar
2. Type your question, for example:
   - `What did we do in 2020?`
   - `Show medical activities`
   - `Goodie bags from 2018 to 2022`
   - `Holistic care work last few years`
3. Click the **Search** button (or press Enter)
4. Wait 3–5 seconds (the AI is processing your question)
5. A green message will appear confirming what filters were applied
6. All the charts and numbers below will update automatically

**Example chips:** Below the search bar are three example questions you can click to try instantly.

**If search fails:** A red message will appear. This usually means the AI service is temporarily unavailable. Try again in a minute, or use the manual filters below instead.

---

#### Filters Bar
Below the search bar is a row of dropdown filters.

| Filter | What it does |
|--------|-------------|
| **Year** | Show data from specific years only. You can select multiple years. |
| **Project** | Filter by the main project category (e.g. Holistic Care, Education) |
| **Sub-Project** | Filter by the specific activity type (e.g. Medicines, Goodie Bags) |
| **Institute** | Filter by the partner institution or hospital |
| **Type** | Filter by the type of institution |

**How to use filters:**
1. Click on any filter dropdown (e.g. "Year")
2. Select one or more options from the list
3. The charts and numbers update automatically
4. To remove a filter, click the × next to the selected value, or click "Clear All"

**Sharing a filtered view:** The filters are saved in the URL. If you want to share a specific view with someone, simply copy the URL from your browser's address bar and send it. When they open it, they will see the same filters applied.

---

#### Statistics Cards (5 numbers at the top)
Five cards showing summary numbers for the current filter selection:

| Card | What it shows |
|------|--------------|
| **Total Beneficiaries** | Number of people helped (highlighted in teal) |
| **Total Amount** | Total ₹ spent across all activities |
| **Initiatives** | Number of unique initiative categories |
| **Projects** | Number of unique projects |
| **Sub-Projects** | Number of unique sub-project types |

**Hover tip:** Hover your mouse over the Initiatives, Projects, or Sub-Projects card to see a full list of what's included.

---

#### Charts (Pie + Bar)
Two charts displayed side by side:

**Beneficiaries by Sub-Project (Pie Chart — left)**
- Shows what proportion of beneficiaries each sub-project accounts for
- Hover over a slice to see the exact number
- The chart updates when you change filters

**Yearly Trend (Bar Chart — right)**
- Shows beneficiary counts for each year
- The orange/red line shows the moving average trend
- Useful for seeing whether impact is growing or declining over time

---

#### Impact by Initiatives (Cards at the bottom)
Dark-coloured cards showing each initiative's total beneficiaries. Each card shows:
- The initiative name
- Total beneficiaries (large number)
- Number of activities

These update when you apply filters.

---

### 3.2 Submit New Record

Use this page to add a single new activity record directly to the database, without modifying the Excel file.

**URL:** `https://anjezeprogresstracker.netlify.app/submit`

Or click **Submit** in the navigation bar at the top.

**How to submit a record:**
1. Select the **Year** from the dropdown
2. Enter the **Date** using the date picker
3. Select the **Project** (required)
4. Select the **Sub-Project** (optional)
5. Select the **Institute** (optional)
6. Select the **Type of Institution** (optional)
7. Enter **Quantity**, **Beneficiaries**, and **Amount** (numbers only; leave blank if unknown)
8. Add any **Remarks** in the text box
9. Click **Submit Record**
10. A green success message confirms the record was saved

> **Note:** The record appears in the dashboard charts immediately after submitting.

---

### 3.3 Upload New Excel File

Use this page when there is a new version of the main Excel tracker file and you want to refresh all the data in the dashboard.

**URL:** `https://anjezeprogresstracker.netlify.app/upload`

Or click the upload icon (↑) in the bottom-right corner of the main dashboard.

**How to upload:**
1. Open the Upload page
2. Drag and drop your `.xlsx` file onto the grey dashed box, **OR** click the box and browse for the file on your computer
3. The filename will appear in the box once selected
4. Click **Import [filename]**
5. Wait 10–30 seconds — a progress bar will appear
6. A green result box will confirm:
   - Total rows processed
   - How many were imported/updated
   - Any errors (usually 0)
7. The dashboard charts now show the updated data

**Important rules for the Excel file:**
- The file must be `.xlsx` format (not `.csv` or `.pdf`)
- The sheet must be named **Tracker** (it should already be, as this is the standard file)
- Uploading is safe — existing records are updated, not duplicated
- The original Excel file is NOT modified in any way

---

## 4. How to Update the Data

There are two ways to keep the data current:

### Option A — Upload the Excel File (Recommended for bulk updates)
When Kiran or the team updates the master Excel tracker:
1. Export or save it as `.xlsx`
2. Go to the Upload page
3. Follow the steps in Section 3.3 above
4. Done — all data is refreshed

### Option B — Submit Individual Records (For quick additions)
When a single new activity happens and you want to record it immediately:
1. Go to the Submit page
2. Follow the steps in Section 3.2 above
3. The record appears instantly in the charts

---

## 5. All Accounts & Credentials

> Keep this section confidential. Do not share these credentials publicly.

---

### 5.1 Dashboard Login (for daily users)
| | |
|---|---|
| **URL** | https://anjezeprogresstracker.netlify.app |
| **Email** | admin@anjeze.org |
| **Password** | Trustor@1949 |

---

### 5.2 Netlify (hosts the website)
Netlify is the service that runs the website 24/7.

| | |
|---|---|
| **URL** | https://app.netlify.com |
| **Account** | AnjezeNGO account (log in with the AnjezeNGO email) |
| **Project name** | anjezeprogresstracker |
| **Direct admin link** | https://app.netlify.com/projects/anjezeprogresstracker |

**What you can do here:**
- See deployment history (every time the site updates)
- Check if the site is online
- View build logs if something goes wrong
- Add or change environment variables (API keys)

**Monthly build credits:** The free plan gives 300 build minutes per month (resets on the 5th of each month). Each automatic update uses ~35 seconds of credits. If credits run out, updates pause until the 5th.

---

### 5.3 GitHub (stores the code)
GitHub is where all the website's code is stored.

| | |
|---|---|
| **URL** | https://github.com/anjezengo/anjeze-tracker-dashboard |
| **Account** | AnjezeNGO GitHub account |

**What it does:** Every time a developer makes a change to the code, it goes to GitHub first, then Netlify automatically picks it up and updates the live site. You do not need to use GitHub for daily operations — it is only needed when a developer is making changes.

---

### 5.4 Neon (the database)
Neon is where all the tracker data is stored (the actual numbers behind the charts).

| | |
|---|---|
| **URL** | https://console.neon.tech |
| **Database name** | neondb |
| **Connection** | Managed automatically — dashboard connects to it without any action needed |

**You do not need to log in to Neon for normal use.** Data is managed through the Upload and Submit pages on the dashboard.

---

### 5.5 Ollama Cloud (AI for the search bar)
Ollama Cloud powers the natural language search feature.

| | |
|---|---|
| **URL** | https://ollama.com |
| **API Key** | c2088336d9954b03b546551404fa6723.kuW38fplDVbkWF7O7e2l6IRA |
| **Model in use** | gemma4:31b (free tier) |

**You do not need to manage this.** If the search bar stops working, see the Troubleshooting section below.

---

### 5.6 Environment Variables in Netlify
These are the secret configuration values stored in Netlify. A developer would need these if rebuilding from scratch.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Connection string for the Neon database |
| `OLLAMA_URL` | Ollama Cloud API base URL |
| `OLLAMA_API_KEY` | Ollama Cloud API key |
| `OLLAMA_MODEL` | AI model name (gemma4:31b) |

To view or change these: Netlify Dashboard → Project → Site configuration → Environment variables.

---

## 6. Troubleshooting Guide

### The website is not opening / shows an error page

**Step 1:** Check if Netlify is having issues: https://www.netlifystatus.com  
**Step 2:** Try opening the site in a different browser (Chrome, Safari, Firefox)  
**Step 3:** Try on your phone using mobile data (rules out a local internet issue)  
**Step 4:** If the site is down for more than 1 hour, contact the developer  

---

### I can't log in — "Invalid email or password"

**Check:**
- Email must be exactly: `admin@anjeze.org` (no spaces, all lowercase)
- Password must be exactly: `Trustor@1949` (capital T, capital A at the end, no spaces)
- Make sure Caps Lock is not on

**If it still doesn't work:** Contact the developer to reset credentials.

---

### The charts are empty / show no data

**Most likely cause:** A filter is active that returns no results.

**Fix:**
1. Look at the filter bar at the top
2. Click **Clear All** or remove any selected filters
3. The charts should refill with data

**If charts are still empty after clearing filters:**
1. The database may be empty — try uploading the Excel file again (Section 3.3)
2. Or contact the developer

---

### The search bar returns an error

**"API 403" or "subscription required":** The AI model being used requires an upgrade. Contact the developer to switch to a different free model.

**"OLLAMA_URL not set":** The environment variables are missing in Netlify. The developer needs to re-add them (Section 5.6).

**"Search failed":** The Ollama Cloud service may be temporarily down. Wait 5–10 minutes and try again. Use manual filters in the meantime.

---

### I uploaded the Excel file but the data didn't change

**Check the result box after uploading:**
- If it shows **0 imported** — the file may have the wrong sheet name. Make sure the sheet is named `Tracker` (capital T, no spaces)
- If it shows errors — the file may be corrupted. Try saving it again from Excel and re-uploading
- If the import succeeded but charts look wrong — check if a filter is active that's hiding some data

---

### The site says "Build skipped — account credit usage exceeded"

This means Netlify's free monthly build minutes are used up for this billing period.

**What it means:** The website itself still works perfectly — visitors can use it normally. This only affects automatic code updates (when a developer pushes a code change).

**Fix:** Wait until the 5th of the next month when credits reset. Or, a developer can deploy manually using the Netlify CLI without using build credits.

**This does not affect:**
- The live website (still accessible)
- Data uploads (still work)
- The submit form (still works)
- The charts and search (still work)

---

### The website is very slow

**Step 1:** Check your internet connection  
**Step 2:** Try refreshing the page (Ctrl+R or Cmd+R)  
**Step 3:** Clear your browser cache (Ctrl+Shift+Delete → Clear cached images and files)  
**Step 4:** If consistently slow, it may be a Netlify CDN issue — check https://www.netlifystatus.com  

---

### A submitted record isn't showing in the charts

- Records submitted via the Submit form appear immediately
- If you don't see it, check that no filters are active that would exclude it
- Verify you clicked "Submit Record" and saw the green success message

---

## 7. Maintenance Calendar

| When | What to do | How long it takes |
|------|-----------|-------------------|
| **Whenever the Excel is updated** | Upload the new `.xlsx` via the Upload page | 2 minutes |
| **First week of each month** | Netlify build credits reset on the 5th — no action needed | — |
| **If the search bar stops working** | Check Ollama Cloud API key is still valid at ollama.com | 5 minutes |
| **Annually** | Review and rotate the dashboard password | 2 minutes |
| **Annually** | Check if the Neon free tier storage limit is being approached | 5 minutes |

### Neon Free Tier Storage Limit
Neon's free plan includes 512 MB of storage. The current database is well under this limit with ~1,100 rows. At the current rate of growth, this will last several years. If you ever see a database error about storage, contact the developer to evaluate an upgrade (the paid tier is $19/month).

---

## 8. Who to Contact

For any issues that cannot be resolved using this guide:

**Developer:** Nirvaan Rohira  
**Email:** rohiranirvaan@gmail.com

**When contacting the developer, please provide:**
1. What you were trying to do
2. What happened instead (copy any error message you see)
3. A screenshot if possible
4. The URL in your browser at the time of the issue

---

*Document prepared June 2026. Dashboard version: main@607ebae*
