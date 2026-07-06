import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const caseTasksTable = pgTable("case_tasks", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  phase: text("phase").notNull(), // pre-filing | filing | service | response | discovery | motions | trial | appeal
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseTaskSchema = createInsertSchema(caseTasksTable).omit({ id: true, createdAt: true });
export type InsertCaseTask = z.infer<typeof insertCaseTaskSchema>;
export type CaseTask = typeof caseTasksTable.$inferSelect;
