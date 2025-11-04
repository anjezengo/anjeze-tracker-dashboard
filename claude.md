You are a senior full-stack engineer. Build a production-ready solution with **two projects**: `/etl` (Node) and `/dashboard` (Next.js). Use **Supabase (Postgres)**. Source file: `1.1 Anjeze Tracker - for Kiran.xlsx`, sheet `Tracker`.

**Data cleaning rules (must keep all originals + add shadow fields):**

* Trim & collapse spaces for text fields; keep `_canon` copies: `project_canon`, `sub_project_canon`, `institute_canon`, `type_of_institution_canon`, `remarks_canon` (Title Case).
* `Year` → derive `year_start`, `year_end`, `year_label` (supports `2016-17`, `2019`).
* `Date` → `date_iso` (`YYYY-MM-DD`) with multi-format parse; unparseable → `NULL`.
* Numeric-safe casts for `Quantity`, `No. of Beneficiaries`, `Amount` → `*_num`. If value in {`Multiple`,`NA`} (case/space-insensitive) or non-numeric → `NULL` (ignore in calcs, but keep original).
* Do **not** drop columns; do **not** change original cells.

**DB schema (SQL + indexes):**

* Table `tracker_raw` (all original columns + shadow fields above), plus `created_at timestamptz default now()`.
* Table `dim_assets(sub_project_canon text primary key, image_url text, description text)`.
* Indexes: `tracker_raw(year_start, project_canon, sub_project_canon)`, `tracker_raw(date_iso)`.
* View `facts_clean` exposing only canonical/text and numeric fields for charts.

**/etl deliverables:**

* Node script `etl/import.js` using `xlsx`, `dayjs`, `pg`: reads sheet, applies rules, UPSERTs to `tracker_raw`.
* Idempotent: re-runs won’t duplicate (hash key on `Sr.No` + `Date` + `Project` where present).
* CLI:

  * `npm run import -- --file ./1.1 Anjeze Tracker - for Kiran.xlsx`
  * `npm run seed-assets` → creates `dim_assets` rows for each distinct `sub_project_canon` if missing.

**/dashboard deliverables (Next.js on Netlify, Supabase client):**

* Filters: **Year (multi)**, **Project**, **Sub-Project**, **Institute**, **Type**. Persist in URL query.
* Charts with Recharts:

  * Home: Pie of total beneficiaries by sub-project (all years, filterable).
  * Query: “Goodie bags 2016–2025” → Bar by `year_start` from `facts_clean` where `sub_project_canon='Infant Goodie Bag'`, add line trend (moving avg).
* When a Sub-Project is selected: fetch from `dim_assets` and show **image + description**.
* API routes:

  * `GET /api/metrics?years=2018,2019&subProject=Infant%20Goodie%20Bag` → grouped JSON.
  * `GET /api/assets?subProject=…` → image/description.
* Optional AI: NL→intent only (few-shot) returning `{metric, filters, years}`; if parse fails, show filters.

**Quality gates:**

* Unit tests for year/date parsing and safe numerics.
* SQL migrations (e.g., drizzle/knex) and `.env.example`.
* CI: lint + typecheck; fail if parsing increases `date_iso IS NULL` rate by >2%.
* Docs: `README.md` with “Import data → Deploy Netlify” steps.

**Commands to generate now:**

1. Create Supabase tables/migrations + view.
2. Implement `/etl/import.js` and run against the provided Excel.
3. Scaffold `/dashboard` with pages: `/`, `/submit` (simple form to append `tracker_raw`), and API routes above.
4. Prepare Netlify deploy config and Supabase env wiring.

**Acceptance criteria:** Import completes; `facts_clean` returns rows; dashboard renders filters + charts; selecting “Health Kit/Infant Goodie Bag” shows correct image/description; non-numeric “Multiple/NA” don’t break sums; URLs shareable with filters.

make sure the graphs are great, smooth animations and professional, if needed you can use reactbits or gsap as well if it woudl help you make the animations smooth and professional 

It will be deployed in netlify and supabase 
the supabase credentials are: 
Project name: Anjeze Tracker Dashboard
Database Password: xc6A-cwdtZfm@5!
Note: If using the Postgres connection string, you will need to percent-encode the password

THE DATA SOUDL BE THE SAME EXCEL WITH THE CLEANING BASED ON THE RULES ABOVE