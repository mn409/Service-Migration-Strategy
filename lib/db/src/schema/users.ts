import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("service_users", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  serviceVersion: text("service_version").notNull(),
  lastActiveDate: timestamp("last_active_date", { withTimezone: true }).notNull(),
  usageFrequency: text("usage_frequency").notNull(),
  region: text("region").notNull(),
  errorRate: real("error_rate").notNull(),
  subscriptionTier: text("subscription_tier").notNull(),
  migrationStatus: text("migration_status").notNull().default("not_started"),
  churnRisk: text("churn_risk").notNull(),
  daysSinceActive: integer("days_since_active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServiceUser = typeof usersTable.$inferSelect;
