# MigrationOps — Cloud Service Deprecation Analytics

A full-stack analytics platform simulating a cloud service deprecation and customer migration program.

**[Live Demo →](https://service-migration-strategy--madmonk409.replit.app/)** &nbsp;|&nbsp; Built with PostgreSQL · Express · React · Recharts · TanStack Table

---

## What This Demonstrates

| Skill | How It Shows Up |
|-------|----------------|
| SQL analytics | 5 production queries for user segmentation, churn scoring, migration funnel |
| KQL / Azure telemetry | 5 Kusto queries for DAU, error spikes, latency percentiles, version trends |
| Product thinking | Full migration PRD with KPI definitions, communication plan, priority matrix |
| Data-driven prioritization | Churn risk composite scoring (0–100), P0–P3 segment framework |
| PM program management | 4-phase migration plan, escalation playbook, automation ideas |

---

## The Four Pages

### 1. Main Dashboard
8 KPI cards tracking migration program health: total users, deprecated-version users, migration rate, high-churn-risk count, pending migrations, and more. Charts include a 90-day DAU time series, version distribution donut, migration funnel, error rate trends, regional breakdown, and churn risk matrix.

### 2. User Explorer
Filterable, paginated table of all 2,000 simulated users. Filter by service version (v1/v2/v3), region (US-East, EU-West, APAC, etc.), subscription tier (Enterprise → Free), and churn risk level. Exportable as CSV. This is the operational view a CSM or program manager would use to build their outreach list.

### 3. Telemetry & Events
Event-level log of ~70,000 API calls with error code detection, latency, and error spike feed. Shows the KQL-style telemetry layer — daily active users by version, usage frequency segmentation, and anomaly detection.

### 4. Migration Strategy & PRD
Complete internal product document: priority segmentation table (P0–P3), 4-phase migration timeline, 4-touchpoint customer communication plan, automation ideas, 7 KPI definitions with formulas and targets, 5 SQL scripts, and 5 KQL queries. Exportable as PDF.

---

## The Data

- **2,000 simulated users** across v1 (19%), v2 (30%), v3 (51%)
- **~70,000 events** over 90 days in a real PostgreSQL database
- Error rates reflect real deprecation dynamics: v1 ~15%, v2 ~7%, v3 ~3%
- Migration status distribution weighted by version to produce a realistic funnel
- All data is deterministically seeded — re-seeding always produces the same dataset

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL + Drizzle ORM |
| API | Node.js + Express 5 + OpenAPI spec |
| Frontend | React + Vite + shadcn/ui |
| Charts | Recharts |
| Data Table | TanStack Table |
| Query Hooks | React Query (generated from OpenAPI) |
| Monorepo | pnpm workspaces + TypeScript 5 |

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Seed 2,000 users + ~70k events
pnpm --filter @workspace/scripts run seed

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/data-app run dev
```

---

## SQL Highlights

```sql
-- Churn risk composite score (0–100)
SELECT
    user_id,
    service_version,
    subscription_tier,
    LEAST(100, (days_since_active * 0.8) + (error_rate * 200)) AS risk_score
FROM service_users
WHERE service_version IN ('v1', 'v2')
ORDER BY risk_score DESC;
```

```sql
-- Migration funnel snapshot
SELECT
    COUNT(*) FILTER (WHERE migration_status = 'migrated') * 100.0
    / NULLIF(COUNT(*), 0) AS migration_rate_pct,
    COUNT(*) FILTER (WHERE migration_status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE migration_status = 'contacted') AS contacted,
    COUNT(*) FILTER (WHERE migration_status = 'not_started') AS not_started
FROM service_users
WHERE service_version IN ('v1', 'v2');
```

---

## KQL Highlights (Azure Data Explorer)

```kql
// Daily active users by version — last 90 days
ServiceEvents
| where timestamp >= ago(90d)
| summarize DAU = dcount(userId), ErrorRate = round(countif(isnotempty(errorCode)) * 100.0 / count(), 2)
    by serviceVersion, bin(timestamp, 1d)
| render timechart
```

```kql
// Error spike detection (hours where error rate > 15%)
ServiceEvents
| where timestamp >= ago(30d)
| summarize Errors = countif(isnotempty(errorCode)), Total = count(), Users = dcount(userId)
    by serviceVersion, region, bin(timestamp, 1h)
| extend ErrorRate = round(Errors * 100.0 / Total, 2)
| where ErrorRate > 15
| order by timestamp desc
```

---

*All data is simulated.*
