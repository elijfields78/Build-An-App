import { pgTable, text, integer, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const userUsageTable = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  feature: text("feature").notNull(),
  month: text("month").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("user_usage_unique").on(table.userId, table.feature, table.month),
]);

export type UserUsage = typeof userUsageTable.$inferSelect;
