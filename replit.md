# MigrationOps — Cloud Service Deprecation Analytics

A full-stack analytics platform simulating a cloud service deprecation and customer migration scenario for Azure-style SaaS platforms. Built for a Product/Program Manager portfolio context.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/data-app run dev` — run the frontend dashboard
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — re-seed 2000 users + ~70k events

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Drizzle ORM + PostgreSQL
- Frontend: React + Vite + Recharts + TanStack Table + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/users.ts` — `service_users` table
- `lib/db/src/schema/events.ts` — `service_events` table
- `artifacts/api-server/src/routes/analytics.ts` — KPI, funnel, regional, error trend endpoints
- `artifacts/api-server/src/routes/users.ts` — filterable user list + frequency segments
- `artifacts/api-server/src/routes/telemetry.ts` — event log + error spike detection
- `artifacts/data-app/src/pages/` — dashboard, user explorer, telemetry, strategy pages
- `scripts/src/seed.ts` — deterministic seed script (2000 users, ~70k events)
- `.agents/outputs/sql-scripts.sql` — 6 production-ready SQL queries
- `.agents/outputs/kql-queries.kql` — 7 KQL queries for Azure Data Explorer
- `.agents/outputs/migration-prd.md` — PRD-style migration strategy document

## Architecture decisions

- All simulated data is generated deterministically via a seeded RNG — re-seeding always produces the same dataset
- v1 users have ~12–20% error rate, v2 ~4–11%, v3 ~1–3% to reflect realistic deprecation signal
- Migration status distribution is weighted by version (v1 users have higher contact/in-progress rates) to show realistic funnel data
- Events table (~70k rows, 90 days) is the source for all DAU, error trend, and spike queries — more accurate than user-level fields
- The Strategy page embeds SQL and KQL as styled code blocks — no runtime fetching needed

## Product

Four-page dashboard:
1. **Main Dashboard** — 8 KPI cards + DAU area chart + version donut + migration funnel + regional bar + error trend + churn matrix
2. **User Explorer** — paginated TanStack table with version/region/tier/churn-risk filters
3. **Telemetry & Events** — event log, error spike feed, DAU trends, frequency segments
4. **Migration Strategy** — PRD-style internal doc with SQL scripts, KQL queries, migration playbook, KPI definitions

## User preferences

- Project should look human-made and business-realistic, not AI-generated
- Suitable for Product/Program Manager portfolio at companies like Microsoft Azure Data

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- Re-seed after schema changes: `pnpm --filter @workspace/scripts run seed`
- Event queries can be slow without the index on `timestamp` — add if needed for production scale
