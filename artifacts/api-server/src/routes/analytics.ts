import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, eventsTable } from "@workspace/db";
import { sql, gte, and, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totals] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeUsers30d: sql<number>`count(*) filter (where ${usersTable.lastActiveDate} >= ${thirtyDaysAgo})::int`,
      deprecatedVersionUsers: sql<number>`count(*) filter (where ${usersTable.serviceVersion} in ('v1','v2'))::int`,
      migratedUsers: sql<number>`count(*) filter (where ${usersTable.migrationStatus} = 'migrated')::int`,
      avgErrorRate: sql<number>`round(avg(${usersTable.errorRate})::numeric, 4)`,
      highChurnUsers: sql<number>`count(*) filter (where ${usersTable.churnRisk} = 'high')::int`,
    })
    .from(usersTable);

  const total = totals.totalUsers || 1;
  const migrationRate = Number(((totals.migratedUsers / Math.max(totals.deprecatedVersionUsers, 1)) * 100).toFixed(1));
  const pendingMigrations = totals.deprecatedVersionUsers - totals.migratedUsers;

  res.json({
    totalUsers: totals.totalUsers,
    activeUsers30d: totals.activeUsers30d,
    deprecatedVersionUsers: totals.deprecatedVersionUsers,
    migratedUsers: totals.migratedUsers,
    migrationRate,
    avgErrorRate: Number((totals.avgErrorRate * 100).toFixed(2)),
    highChurnUsers: totals.highChurnUsers,
    pendingMigrations: Math.max(0, pendingMigrations),
  });
});

router.get("/analytics/version-distribution", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      version: usersTable.serviceVersion,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.serviceVersion)
    .orderBy(usersTable.serviceVersion);

  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  const result = rows.map((r) => ({
    version: r.version,
    count: r.count,
    percentage: Number(((r.count / total) * 100).toFixed(1)),
    isDeprecated: r.version === "v1" || r.version === "v2",
  }));

  res.json(result);
});

router.get("/analytics/migration-funnel", async (req, res): Promise<void> => {
  const [counts] = await db
    .select({
      identified: sql<number>`count(*) filter (where ${usersTable.serviceVersion} in ('v1','v2'))::int`,
      contacted: sql<number>`count(*) filter (where ${usersTable.serviceVersion} in ('v1','v2') and ${usersTable.migrationStatus} in ('contacted','in_progress','migrated'))::int`,
      inProgress: sql<number>`count(*) filter (where ${usersTable.migrationStatus} = 'in_progress')::int`,
      migrated: sql<number>`count(*) filter (where ${usersTable.migrationStatus} = 'migrated')::int`,
    })
    .from(usersTable);

  const identified = counts.identified || 1;
  const result = [
    { stage: "Identified", count: counts.identified, percentage: 100 },
    { stage: "Contacted", count: counts.contacted, percentage: Number(((counts.contacted / identified) * 100).toFixed(1)) },
    { stage: "In Progress", count: counts.inProgress, percentage: Number(((counts.inProgress / identified) * 100).toFixed(1)) },
    { stage: "Migrated", count: counts.migrated, percentage: Number(((counts.migrated / identified) * 100).toFixed(1)) },
  ];

  res.json(result);
});

router.get("/analytics/regional-distribution", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      region: usersTable.region,
      totalUsers: sql<number>`count(*)::int`,
      activeUsers: sql<number>`count(*) filter (where ${usersTable.daysSinceActive} <= 30)::int`,
      avgErrorRate: sql<number>`round(avg(${usersTable.errorRate})::numeric, 4)`,
      v1Users: sql<number>`count(*) filter (where ${usersTable.serviceVersion} = 'v1')::int`,
      v2Users: sql<number>`count(*) filter (where ${usersTable.serviceVersion} = 'v2')::int`,
      v3Users: sql<number>`count(*) filter (where ${usersTable.serviceVersion} = 'v3')::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.region)
    .orderBy(sql`count(*) desc`);

  res.json(
    rows.map((r) => ({
      region: r.region,
      totalUsers: r.totalUsers,
      activeUsers: r.activeUsers,
      avgErrorRate: Number((r.avgErrorRate * 100).toFixed(2)),
      v1Users: r.v1Users,
      v2Users: r.v2Users,
      v3Users: r.v3Users,
    }))
  );
});

router.get("/analytics/daily-active-users", async (req, res): Promise<void> => {
  const days = Math.min(Number(req.query.days) || 90, 180);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${eventsTable.timestamp}), 'YYYY-MM-DD')`,
      v1: sql<number>`count(distinct ${eventsTable.userId}) filter (where ${eventsTable.serviceVersion} = 'v1')::int`,
      v2: sql<number>`count(distinct ${eventsTable.userId}) filter (where ${eventsTable.serviceVersion} = 'v2')::int`,
      v3: sql<number>`count(distinct ${eventsTable.userId}) filter (where ${eventsTable.serviceVersion} = 'v3')::int`,
    })
    .from(eventsTable)
    .where(gte(eventsTable.timestamp, since))
    .groupBy(sql`date_trunc('day', ${eventsTable.timestamp})`)
    .orderBy(sql`date_trunc('day', ${eventsTable.timestamp})`);

  res.json(
    rows.map((r) => ({
      date: r.date,
      total: r.v1 + r.v2 + r.v3,
      v1: r.v1,
      v2: r.v2,
      v3: r.v3,
    }))
  );
});

router.get("/analytics/error-trends", async (req, res): Promise<void> => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${eventsTable.timestamp}), 'YYYY-MM-DD')`,
      v1ErrorRate: sql<number>`round(
        (count(*) filter (where ${eventsTable.serviceVersion} = 'v1' and ${eventsTable.errorCode} is not null)::numeric /
         nullif(count(*) filter (where ${eventsTable.serviceVersion} = 'v1'), 0)) * 100, 2
      )`,
      v2ErrorRate: sql<number>`round(
        (count(*) filter (where ${eventsTable.serviceVersion} = 'v2' and ${eventsTable.errorCode} is not null)::numeric /
         nullif(count(*) filter (where ${eventsTable.serviceVersion} = 'v2'), 0)) * 100, 2
      )`,
      v3ErrorRate: sql<number>`round(
        (count(*) filter (where ${eventsTable.serviceVersion} = 'v3' and ${eventsTable.errorCode} is not null)::numeric /
         nullif(count(*) filter (where ${eventsTable.serviceVersion} = 'v3'), 0)) * 100, 2
      )`,
    })
    .from(eventsTable)
    .where(gte(eventsTable.timestamp, since))
    .groupBy(sql`date_trunc('day', ${eventsTable.timestamp})`)
    .orderBy(sql`date_trunc('day', ${eventsTable.timestamp})`);

  res.json(
    rows.map((r) => ({
      date: r.date,
      v1ErrorRate: Number(r.v1ErrorRate) || 0,
      v2ErrorRate: Number(r.v2ErrorRate) || 0,
      v3ErrorRate: Number(r.v3ErrorRate) || 0,
    }))
  );
});

router.get("/analytics/churn-risk", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      churnRisk: usersTable.churnRisk,
      tier: usersTable.subscriptionTier,
      count: sql<number>`count(*)::int`,
      avgErrorRate: sql<number>`round(avg(${usersTable.errorRate})::numeric, 4)`,
      avgDaysSinceActive: sql<number>`round(avg(${usersTable.daysSinceActive})::numeric, 1)`,
    })
    .from(usersTable)
    .groupBy(usersTable.churnRisk, usersTable.subscriptionTier)
    .orderBy(usersTable.churnRisk, usersTable.subscriptionTier);

  res.json(
    rows.map((r) => ({
      churnRisk: r.churnRisk,
      tier: r.tier,
      count: r.count,
      avgErrorRate: Number((r.avgErrorRate * 100).toFixed(2)),
      avgDaysSinceActive: Number(r.avgDaysSinceActive),
    }))
  );
});

export default router;
