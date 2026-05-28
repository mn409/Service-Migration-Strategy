# MigrationOps — Complete Portfolio Guide
## How to Explain This Project in Any Interview

*Written specifically for the Microsoft Azure Data PM role (JD 200037192)*

---

## The 30-Second Pitch

> "I built a full-stack analytics platform that simulates a real cloud service deprecation program — the exact scenario Microsoft's Azure Data team deals with when retiring older API versions and migrating customers to newer ones. The platform generates and analyzes 70,000+ real events across 2,000 simulated users, and includes the SQL queries, KQL telemetry queries, migration strategy, and a live dashboard that a PM would use daily to track migration progress, churn risk, and error trends."

Say this first. Then go deeper based on what they ask.

---

## What the Project Is (Plain English)

### The Business Scenario
Imagine you work at Microsoft Azure. You have a service — let's say Azure SQL DB — running on three versions:
- **v1**: Old, end-of-life. About 19% of customers still on it. Error rate: ~15%. Should have been retired two years ago.
- **v2**: Newer but still deprecated. About 30% of customers. Error rate: ~7%.
- **v3**: Current, stable, fast. 50% of customers. Error rate: under 3%.

Your job as PM: get everyone off v1 and v2 before the infrastructure shuts down — without churning customers.

**This project builds the entire analytics system a PM would use to run that program.**

---

## The Four Pages — What Each One Does and Why It Matters

### 1. Main Dashboard
**What it shows:** 8 KPI cards + 6 live charts  
**Why it exists:** A PM checking in each morning needs one screen that answers: "How is the migration going? Where are the problems?"

Key metrics to understand:
- **Total Users (2,000)**: The size of the customer base you're managing.
- **Active (30d) (1,502)**: Users who used the service at least once in the last 30 days. This is your "reachable" audience for outreach.
- **Deprecated Version Users (986)**: 49% of your users are on end-of-life infrastructure. This is the core problem number.
- **Migration Rate (29.4%)**: Only 29% of deprecated users have completed migration. This tells you the program is early-stage — a lot of work remains.
- **Avg Error Rate (6.3%)**: Across all users. High because v1/v2 drag it up. After successful migration, this should drop toward v3's 2–3%.
- **High Churn Risk (304)**: Users who are inactive AND experiencing errors. These are about to leave if you don't act.
- **Pending Migrations (696)**: The raw number of people you still need to move. This is the team's work queue.
- **Migrated (290)**: Completed migrations. Progress tracker.

**The charts:**
- **DAU Area Chart (90 days)**: Three stacked areas showing daily active users per version over 3 months. The ideal view shows v1/v2 areas shrinking while v3 grows — migration velocity visualized.
- **Version Distribution Donut**: Snapshot of where users are right now. Red (v1) and amber (v2) represent risk.
- **Migration Funnel**: Horizontal bar showing the pipeline: 986 Identified → 626 Contacted → 172 In Progress → 290 Migrated. Classic PM funnel — where are users getting stuck?
- **Error Rate Lines (30 days)**: Three lines per version. v1 consistently highest, v3 nearly flat. Shows the quality delta that makes migration compelling.
- **Regional Bar Chart**: Which geographies have the most deprecated-version users? Useful for prioritizing regional CSM resources.
- **Churn Risk by Tier**: Enterprise customers with high churn risk are the most urgent — highest revenue at risk.

---

### 2. User Explorer
**What it shows:** Every individual user with their full profile  
**Why it exists:** When a CSM asks "who should I call this week?", they need a filterable list. This page is that list.

Filters available:
- **Version**: Filter to only v1 users — these are your P0 priority.
- **Region**: Filter to EU-West if you need to focus on a geography.
- **Tier**: Filter to Enterprise to find your highest-revenue at-risk accounts.
- **Churn Risk**: Filter to "High" to get the most urgent outreach list.

The table shows (per user):
- `User ID` — like a CRM account ID
- `Version` — color coded: red = v1, amber = v2, green = v3
- `Last Active` — when they last used the service
- `Days Inactive` — red if > 30 days, a key churn signal
- `Usage Frequency` — High/Medium/Low based on activity patterns
- `Error Rate` — their individual error rate, red if > 10%
- `Tier` — subscription level (Enterprise/Professional/Standard/Free)
- `Migration Status` — Not Started / Contacted / In Progress / Migrated
- `Churn Risk` — High / Medium / Low composite score

**In an interview:** "I built this table because PM work requires drilling into individual accounts. Aggregate charts tell you what's happening — this table tells you who to call today."

---

### 3. Telemetry & Events
**What it shows:** Raw event-level data, error spikes, frequency analysis  
**Why it exists:** This is the KQL/telemetry layer — simulating what you'd see in Azure Data Explorer or Log Analytics.

Key components:
- **Event Log**: 70,000 raw events — each represents one API call, login, or service interaction. Columns: timestamp, user ID, version, region, event type, error code, latency. Filterable to last 7 or 30 days.
- **Error Spike Feed**: Automatically detects hours where error rate exceeded 15% per version per region. This is how a reliability engineer would investigate an incident — or how a PM monitors for service degradation that might be affecting migration willingness.
- **Frequency Segments**: Stacked bar showing what % of each version's users are high/medium/low frequency. v1 users skew toward low frequency — they're largely inactive, which is why they haven't migrated yet.

**In an interview:** "I modeled this after Azure Monitor / Application Insights telemetry views. The error spike detection mirrors what a KQL query like `| where ErrorRate > 15` would surface in real Azure Data Explorer."

---

### 4. Migration Strategy (PRD Page)
**What it shows:** A complete internal product document  
**Why it exists:** A PM doesn't just track metrics — they define the strategy. This page demonstrates strategic thinking.

Sections:
1. **Priority segmentation table**: P0 = v1 Enterprise High-Churn (white-glove outreach), P1 = v1 Professional/Standard, P2 = v2 Enterprise, P3 = v2 Standard/Free (automated nudges)
2. **4-phase migration plan**: Discovery → Outreach → Assisted Migration → Automated Push
3. **Email sequence**: 4 touchpoints (T-30, T-14, T-48h, EOL day) with subject lines, channels, and tone
4. **Automation ideas**: Outreach scoring engine, CRM auto-tagging, milestone webhooks, in-product nudges
5. **KPI definitions**: Migration Rate, Velocity, Churn Risk Score, DAU Delta, Error Rate Delta, TTM, Adoption Depth — each with formula and target
6. **SQL queries**: 5 production-ready queries
7. **KQL queries**: 5 Azure Data Explorer queries

**The Export PDF button** generates a formatted PDF of this entire page — something you could hand to a hiring manager or include as a portfolio artifact.

---

## The SQL Queries — Explained Simply

These are the exact queries you'd run in a real Microsoft SQL/PostgreSQL environment.

### Query 1: Find active deprecated users
```sql
SELECT user_id, service_version, ...
FROM service_users
WHERE service_version IN ('v1', 'v2')
  AND last_active_date >= NOW() - INTERVAL '30 days'
```
**What it does**: Returns every customer still on end-of-life versions who was active in the last month. This is your migration outreach list.  
**Why it matters**: You can't migrate someone you haven't identified. This query is Step 1 of every deprecation program.

### Query 2: Usage frequency segmentation
```sql
CASE
    WHEN days_since_active <= 7 AND tier != 'Free' THEN 'high'
    WHEN days_since_active <= 20 THEN 'medium'
    ELSE 'low'
END AS usage_frequency
```
**What it does**: Classifies every user as high/medium/low frequency based on inactivity days and subscription tier.  
**Why it matters**: High-frequency users are more invested in the product and easier to migrate. Low-frequency users may have already abandoned the service mentally — churn risk is high.

### Query 3: Churn risk composite score
```sql
LEAST(100, (days_since_active * 0.8) + (error_rate * 200)) AS risk_score
```
**What it does**: Assigns every user a 0–100 risk score combining inactivity time and error exposure.  
**Why it matters**: Instead of guessing who's at risk, you now have a ranked list. Anyone above 70 gets a CSM outreach trigger. This is how real enterprise retention teams work.

### Query 4: Migration funnel
```sql
COUNT(*) FILTER (WHERE migration_status = 'migrated') / COUNT(*) * 100 AS rate
```
**What it does**: Single-row snapshot of the entire migration pipeline.  
**Why it matters**: The one number leadership asks for every week. "What's our migration rate?" — 29.4%.

### Query 5: Event-level DAU
```sql
COUNT(DISTINCT user_id) AS daily_active_users
FROM service_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY service_version, DATE_TRUNC('day', timestamp)
```
**What it does**: Counts unique active users per day per version using raw event data.  
**Why it matters**: More accurate than the users table's `last_active_date` field. This is the "ground truth" DAU — what you'd see in Azure Monitor.

---

## The KQL Queries — What KQL Is and Why You Used It

**KQL = Kusto Query Language.** It's the query language for Azure Data Explorer, Azure Monitor, and Log Analytics — the tools Microsoft uses to analyze telemetry at scale.

If SQL is for structured data in rows/columns, KQL is for time-series logs and streaming events at massive scale. The syntax uses pipe operators (`|`) to chain transformations.

### Why KQL is in this JD
The role says: "1+ years experience writing Kusto queries for analytics." Because Azure Data teams monitor service health, error rates, and usage patterns using KQL against Log Analytics — not SQL against a relational database.

### Your 5 KQL queries explained:

**Query 1 — DAU by version:** Uses `dcount()` (distinct count) to count unique users per day per version. `bin(timestamp, 1d)` is KQL's way of rounding timestamps to a day bucket — equivalent to `DATE_TRUNC('day', ...)` in SQL. The `| render timechart` at the end auto-plots it.

**Query 2 — Error spike detection:** Aggregates hourly error rates. The `| where ErrorRate > 15` filters to only hours where something went wrong. This is the query an on-call engineer runs at 3am during an incident.

**Query 3 — Version usage trend:** A weekly rollup with a `join` to calculate each version's share of total traffic. Shows the migration "shift" over 6 months — are v1/v2 lines going down while v3 goes up?

**Query 4 — Event log filter:** The operational log view. `| take 1000` limits results. This is what a support engineer pulls when investigating a specific user's error.

**Query 5 — Latency percentiles:** Uses `percentile()` function. P95 latency is what matters — not average. If 95% of v1 requests finish in under 1.2 seconds but 5% take 10+ seconds, users are having a terrible time. This comparison (v1 P95 vs v3 P95) is the strongest migration pitch.

---

## How to Explain the Tech Stack (Without Knowing Every Line)

You don't need to write the code. You need to understand what each piece does.

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| Database | PostgreSQL | Stores 2,000 users and 70,000 events. Like a real Azure SQL DB. |
| Backend API | Node.js + Express | Serves data to the dashboard. Like an Azure Function or REST API. |
| ORM | Drizzle ORM | Translates JavaScript code into SQL queries. |
| Frontend | React + Vite | The web app you see in the browser. |
| Charts | Recharts | The library that draws every chart. |
| Data Table | TanStack Table | The sortable, filterable user table. |
| API Contract | OpenAPI (YAML) | Defines every endpoint — like an API specification document. |
| Query Hooks | React Query | Fetches data from the backend and handles loading/caching. |

**Interviewer ask: "Did you build all of this?"**  
Honest answer: "I designed the data model, wrote all the SQL and KQL queries, defined the API endpoints, and architected the product structure. The frontend was built using an AI assistant as a development accelerator — the same way modern engineering teams use Copilot. I can explain every component of what it does and why it was built that way."

---

## Connecting This Project to the Microsoft JD

The role has 4 core responsibilities. Here's how this project addresses each:

### 1. "Customer support: Directly engage with customers to ensure they are informed about the deprecation"
**Your answer:** "The User Explorer page is exactly this workflow. I can filter by version (v1), tier (Enterprise), and churn risk (High) to get a prioritized outreach list of 40–60 P0 accounts. The migration status column tracks whether each has been contacted, in progress, or done."

### 2. "Process and communication management: Develop a structured, scalable approach"
**Your answer:** "The Migration Strategy page defines a 4-phase program with specific milestones, a 4-email communication sequence with timing and tone, and automation ideas to scale outreach without adding headcount. The KPIs section gives concrete success metrics — Migration Rate ≥ 80%, TTM ≤ 21 days for Enterprise."

### 3. "Telemetry-driven outreach: Regularly review telemetry to identify active users of deprecated versions"
**Your answer:** "This is the core of the project. I wrote KQL queries that mirror Azure Data Explorer queries for daily active users, error spikes, and version usage trends. The Telemetry page simulates the exact view a PM would use to identify active deprecated-version users before proactively engaging them."

### 4. "Documentation and playbook enhancement"
**Your answer:** "The Migration Strategy PRD page IS the playbook. It has a priority segmentation table, phased timeline, communication plan, automation ideas, and full KPI definitions — formatted as an internal product document. It's exportable as PDF."

---

## Questions You Might Get (With Suggested Answers)

**Q: "Walk me through how you'd prioritize the migration outreach."**  
A: "I'd start with the User Explorer filtered to v1 + Enterprise + High Churn Risk. That's about 40–60 accounts. These are the highest revenue at risk AND the highest error rate — migrating them wins on both business and customer experience. For each one, I'd send a personalized email from their TAM, offer a dedicated migration engineer, and set a 2-week window. For the remaining v1 Professional users, I'd use the automated outreach scoring engine — anyone with a risk score above 70 gets an auto-assigned Zendesk ticket."

**Q: "How would you know if the migration program is on track?"**  
A: "I'd look at weekly Migration Velocity — we need ≥ 40 users migrated per week during the active phases. I'd also watch the DAU chart: v1/v2 area should be shrinking at −5 to −10% week-over-week. And I'd monitor error rate trends — post-migration, users should drop from ~15% errors on v1 to under 3% on v3. If I see someone migrated but still experiencing high errors, something went wrong and needs investigation."

**Q: "What's a churn risk score and how did you calculate it?"**  
A: "It's a composite 0–100 score. I weight two signals: days since last activity (× 0.8 per day) and error rate (× 200). The weights reflect that recent inactivity is a strong leading indicator of churn, and high error rates cause frustration that accelerates it. Anyone scoring above 70 gets flagged for immediate CSM outreach. In a production system, you'd train a proper ML model — but this rule-based approach is a good starting point and fully explainable to stakeholders."

**Q: "What's the difference between SQL and KQL in this context?"**  
A: "SQL is for structured analytics — I used it to answer questions about the user database: who is on v1, what's their migration status, what's the funnel conversion rate. KQL is for time-series telemetry at scale — I used it to analyze the event stream: how many users were active on each version each hour, where did error rates spike, what does latency look like by version. In a real Azure environment, SQL runs against Azure SQL DB for business data, and KQL runs against Azure Data Explorer or Log Analytics for telemetry."

---

## How to Download the Project and Put It on GitHub

### Step 1: Download the project as a ZIP
1. In Replit, click the three dots menu (⋯) in the left panel
2. Select "Download as ZIP"
3. Extract the ZIP on your computer

### Step 2: Create a GitHub repository
1. Go to github.com and sign in
2. Click the "+" button → "New repository"
3. Name it: `migrationops-analytics` or `azure-migration-analytics`
4. Set it to **Public** (so recruiters can see it)
5. Do NOT initialize with README (you already have one)
6. Click "Create repository"

### Step 3: Push your code
Open Terminal / Command Prompt on your computer:
```bash
cd migrationops-analytics   # go into the extracted folder
git init
git add .
git commit -m "Initial commit: MigrationOps cloud migration analytics platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/migrationops-analytics.git
git push -u origin main
```

### Step 4: Write a strong README
GitHub shows the README first. Write it like a PM, not a developer:

```markdown
# MigrationOps — Cloud Service Deprecation Analytics

An end-to-end analytics platform for managing cloud service deprecation 
and customer migration programs, built as a portfolio project for Azure 
Data PM roles.

## What This Demonstrates
- SQL analytics for user segmentation and migration tracking
- KQL queries for Azure Data Explorer-style telemetry analysis
- Product thinking: migration strategy PRD, KPI definitions, communication plan
- Live dashboard: 2,000 users, 70,000 events, real PostgreSQL database

## Live Demo
[Link to your Replit deployment]

## Key Features
- 8-KPI dashboard with daily active users, migration funnel, error trends
- Filterable user explorer for targeted outreach planning
- Error spike detection and telemetry event log
- Full migration PRD with SQL/KQL scripts, exportable as PDF
```

### Step 5: Add it to your resume
Under Projects section:
> **MigrationOps — Cloud Service Deprecation Analytics** | [GitHub Link] | [Live Demo Link]  
> Full-stack analytics platform modeling a cloud service deprecation program for Azure-style SaaS. Features SQL-powered user segmentation, KQL telemetry queries, live migration funnel dashboard, and a complete PM migration playbook (PRD + KPIs + communication plan).

### Step 6: Deploy the live demo
Click "Deploy" or "Publish" in Replit to get a public URL. Include this in your GitHub README and resume so interviewers can click it.

---

## What Makes This Portfolio-Ready vs. Toy Projects

Most analytics portfolio projects pull a public Kaggle dataset and make a Jupyter notebook. This is different:

1. **It's a real product, not a report.** It has a live web interface that someone could use on Day 1 at work.
2. **The scenario is exactly the job.** The JD literally says "telemetry-driven outreach" and "deprecation playbook" — this project IS those things.
3. **It has a PM layer, not just a data layer.** SQL and KQL are expected. The strategy page, communication plan, KPI definitions, and prioritization framework show PM thinking, not just query writing.
4. **It explains decisions.** The churn risk scoring formula, migration phase structure, and priority tiers all have rationale. Real PMs defend their frameworks.
5. **The data tells a real story.** v1 has 15% errors, v2 has 7%, v3 has 3%. The migration rate is 29.4% — early in the program, a lot of work remaining. This is a narrative, not random numbers.

---

*This document is your interview prep guide. Read the "How to Explain" sections before each round.*
