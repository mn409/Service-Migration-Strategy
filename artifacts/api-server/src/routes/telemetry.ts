import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db";
import { sql, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/telemetry/event-log", async (req, res): Promise<void> => {
  const days = Math.min(Number(req.query.days) || 7, 30);
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(eventsTable)
    .where(gte(eventsTable.timestamp, since))
    .orderBy(desc(eventsTable.timestamp))
    .limit(limit);

  res.json(
    events.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      userId: e.userId,
      serviceVersion: e.serviceVersion,
      region: e.region,
      eventType: e.eventType,
      errorCode: e.errorCode ?? null,
      latencyMs: e.latencyMs,
    }))
  );
});

router.get("/telemetry/error-spikes", async (req, res): Promise<void> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      hour: sql<string>`to_char(date_trunc('hour', ${eventsTable.timestamp}), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      version: eventsTable.serviceVersion,
      region: eventsTable.region,
      totalEvents: sql<number>`count(*)::int`,
      errorEvents: sql<number>`count(*) filter (where ${eventsTable.errorCode} is not null)::int`,
      affectedUsers: sql<number>`count(distinct ${eventsTable.userId}) filter (where ${eventsTable.errorCode} is not null)::int`,
    })
    .from(eventsTable)
    .where(gte(eventsTable.timestamp, since))
    .groupBy(
      sql`date_trunc('hour', ${eventsTable.timestamp})`,
      eventsTable.serviceVersion,
      eventsTable.region
    )
    .having(
      sql`(count(*) filter (where ${eventsTable.errorCode} is not null)::numeric / count(*)) > 0.15`
    )
    .orderBy(desc(sql`date_trunc('hour', ${eventsTable.timestamp})`))
    .limit(50);

  res.json(
    rows.map((r) => ({
      timestamp: r.hour,
      version: r.version,
      errorRate: Number(((r.errorEvents / Math.max(r.totalEvents, 1)) * 100).toFixed(1)),
      affectedUsers: r.affectedUsers,
      region: r.region,
    }))
  );
});

export default router;
