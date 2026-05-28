import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { sql, eq, and, lte, gte, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const {
    version,
    region,
    tier,
    churnRisk,
    activeOnly,
    deprecated,
    page = "1",
    limit = "50",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (version) conditions.push(eq(usersTable.serviceVersion, version));
  if (region) conditions.push(eq(usersTable.region, region));
  if (tier) conditions.push(eq(usersTable.subscriptionTier, tier));
  if (churnRisk) conditions.push(eq(usersTable.churnRisk, churnRisk));
  if (activeOnly === "true") conditions.push(lte(usersTable.daysSinceActive, 30));
  if (deprecated === "true")
    conditions.push(inArray(usersTable.serviceVersion, ["v1", "v2"]));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(where);

  const users = await db
    .select()
    .from(usersTable)
    .where(where)
    .orderBy(usersTable.id)
    .limit(limitNum)
    .offset(offset);

  res.json({
    users: users.map((u) => ({
      id: u.id,
      userId: u.userId,
      serviceVersion: u.serviceVersion,
      lastActiveDate: u.lastActiveDate.toISOString().split("T")[0],
      usageFrequency: u.usageFrequency,
      region: u.region,
      errorRate: Number((u.errorRate * 100).toFixed(2)),
      subscriptionTier: u.subscriptionTier,
      migrationStatus: u.migrationStatus,
      churnRisk: u.churnRisk,
      daysSinceActive: u.daysSinceActive,
    })),
    total: countRow.total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/users/frequency-segments", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      version: usersTable.serviceVersion,
      frequency: usersTable.usageFrequency,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.serviceVersion, usersTable.usageFrequency)
    .orderBy(usersTable.serviceVersion, usersTable.usageFrequency);

  res.json(rows);
});

export default router;
