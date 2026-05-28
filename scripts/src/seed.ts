import { db } from "@workspace/db";
import { usersTable, eventsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const REGIONS = ["US-East", "US-West", "EU-West", "EU-North", "APAC", "LATAM"];
const TIERS = ["Enterprise", "Professional", "Standard", "Free"];
const VERSIONS = ["v1", "v2", "v3"];
const EVENT_TYPES = ["api_call", "login", "data_export", "config_change", "dashboard_view", "report_run"];
const ERROR_CODES = ["ERR_TIMEOUT", "ERR_AUTH", "ERR_RATE_LIMIT", "ERR_INTERNAL", "ERR_DEPRECATED_API"];
const MIGRATION_STATUSES = ["not_started", "contacted", "in_progress", "migrated"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function weightedPick<T>(items: T[], weights: number[], rand: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

async function seed() {
  const rand = seededRandom(42);

  console.log("Truncating existing data...");
  await db.execute(sql`TRUNCATE TABLE service_users, service_events RESTART IDENTITY CASCADE`);

  // --- Generate 2000 users ---
  console.log("Seeding 2000 users...");

  const versionWeights = [0.18, 0.32, 0.50]; // v1=18%, v2=32%, v3=50%
  const regionWeights = [0.28, 0.20, 0.22, 0.10, 0.12, 0.08];
  const tierWeights = [0.15, 0.30, 0.38, 0.17];

  const userBatch: (typeof usersTable.$inferInsert)[] = [];

  const now = new Date();
  const baseDate = new Date("2024-01-01");

  for (let i = 0; i < 2000; i++) {
    const version = weightedPick(VERSIONS, versionWeights, rand);
    const region = weightedPick(REGIONS, regionWeights, rand);
    const tier = weightedPick(TIERS, tierWeights, rand);

    // v1 users have higher error rates and more inactivity
    const baseErrorRate =
      version === "v1" ? 0.08 + rand() * 0.12
      : version === "v2" ? 0.04 + rand() * 0.07
      : 0.01 + rand() * 0.03;

    const daysSinceActive =
      version === "v1" ? Math.floor(rand() * 90)
      : version === "v2" ? Math.floor(rand() * 45)
      : Math.floor(rand() * 20);

    const lastActiveDate = new Date(now.getTime() - daysSinceActive * 24 * 60 * 60 * 1000);

    // Usage frequency based on days since active + tier
    let frequency: string;
    if (daysSinceActive <= 7 && tier !== "Free") frequency = "high";
    else if (daysSinceActive <= 20) frequency = "medium";
    else frequency = "low";

    // Churn risk logic
    let churnRisk: string;
    if (baseErrorRate > 0.12 || daysSinceActive > 60) churnRisk = "high";
    else if (baseErrorRate > 0.06 || daysSinceActive > 30) churnRisk = "medium";
    else churnRisk = "low";

    // Migration status for deprecated versions
    let migrationStatus = "not_started";
    if (version === "v1" || version === "v2") {
      const r = rand();
      if (version === "v1") {
        if (r < 0.35) migrationStatus = "migrated";
        else if (r < 0.55) migrationStatus = "in_progress";
        else if (r < 0.72) migrationStatus = "contacted";
        else migrationStatus = "not_started";
      } else {
        if (r < 0.22) migrationStatus = "migrated";
        else if (r < 0.40) migrationStatus = "in_progress";
        else if (r < 0.60) migrationStatus = "contacted";
        else migrationStatus = "not_started";
      }
    }

    userBatch.push({
      userId: `USR-${String(i + 1).padStart(5, "0")}`,
      serviceVersion: version,
      lastActiveDate,
      usageFrequency: frequency,
      region,
      errorRate: baseErrorRate,
      subscriptionTier: tier,
      migrationStatus,
      churnRisk,
      daysSinceActive,
    });
  }

  // Insert in batches of 250
  for (let i = 0; i < userBatch.length; i += 250) {
    await db.insert(usersTable).values(userBatch.slice(i, i + 250));
  }

  // --- Generate ~25k events over 90 days ---
  console.log("Seeding events...");

  const allUsers = await db.select({ userId: usersTable.userId, serviceVersion: usersTable.serviceVersion, region: usersTable.region }).from(usersTable);
  const eventBatch: (typeof eventsTable.$inferInsert)[] = [];

  for (let day = 89; day >= 0; day--) {
    const dayDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

    // Each day pick a subset of users who were active (simulate DAU)
    const dauCount = Math.floor(250 + rand() * 150 - (day > 60 ? 50 : 0));
    const activeSample = [...allUsers].sort(() => rand() - 0.5).slice(0, dauCount);

    for (const user of activeSample) {
      // Each active user generates 1-5 events per day
      const evtCount = Math.floor(1 + rand() * 4);
      for (let e = 0; e < evtCount; e++) {
        const hourOffset = Math.floor(rand() * 24 * 60 * 60 * 1000);
        const eventTime = new Date(dayDate.getTime() + hourOffset);

        // Error probability based on version
        const errorProb =
          user.serviceVersion === "v1" ? 0.15
          : user.serviceVersion === "v2" ? 0.08
          : 0.02;

        const isError = rand() < errorProb;
        const eventType = EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)];
        const errorCode = isError ? ERROR_CODES[Math.floor(rand() * ERROR_CODES.length)] : null;
        const latencyMs =
          user.serviceVersion === "v1"
            ? Math.floor(300 + rand() * 800)
            : user.serviceVersion === "v2"
            ? Math.floor(120 + rand() * 400)
            : Math.floor(40 + rand() * 150);

        eventBatch.push({
          timestamp: eventTime,
          userId: user.userId,
          serviceVersion: user.serviceVersion,
          region: user.region,
          eventType,
          errorCode,
          latencyMs,
        });
      }
    }
  }

  console.log(`Inserting ${eventBatch.length} events...`);
  for (let i = 0; i < eventBatch.length; i += 1000) {
    await db.insert(eventsTable).values(eventBatch.slice(i, i + 1000));
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
