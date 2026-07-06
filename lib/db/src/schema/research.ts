import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const researchSessionsTable = pgTable("research_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  caseId: integer("case_id").references(() => casesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResearchSessionSchema = createInsertSchema(researchSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchSession = typeof researchSessionsTable.$inferSelect;

export const researchMessagesTable = pgTable("research_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => researchSessionsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResearchMessageSchema = createInsertSchema(researchMessagesTable).omit({ id: true, createdAt: true });
export type InsertResearchMessage = z.infer<typeof insertResearchMessageSchema>;
export type ResearchMessage = typeof researchMessagesTable.$inferSelect;
