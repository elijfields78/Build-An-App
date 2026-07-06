import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  caseType: text("case_type").notNull().default("plaintiff"), // plaintiff | defendant | research
  status: text("status").notNull().default("intake"), // intake | active | settled | closed
  court: text("court"),
  caseNumber: text("case_number"),
  opposingParty: text("opposing_party"),
  summary: text("summary"),
  storyComplete: boolean("story_complete").notNull().default(false),
  jurisdictionComplete: boolean("jurisdiction_complete").notNull().default(false),
  ifpComplete: boolean("ifp_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;

export const caseStoriesTable = pgTable("case_stories", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  whoHarmedYou: text("who_harmed_you"),
  whatHappened: text("what_happened"),
  whenHappened: text("when_happened"),
  whereHappened: text("where_happened"),
  evidenceDescription: text("evidence_description"),
  rightsViolated: text("rights_violated"),
  damagesSuffered: text("damages_suffered"),
  desiredOutcome: text("desired_outcome"),
  remedySought: text("remedy_sought"),
  additionalContext: text("additional_context"),
  aiSummary: text("ai_summary"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseStorySchema = createInsertSchema(caseStoriesTable).omit({ id: true, updatedAt: true });
export type InsertCaseStory = z.infer<typeof insertCaseStorySchema>;
export type CaseStory = typeof caseStoriesTable.$inferSelect;
