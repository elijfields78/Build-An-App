import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const caseDeadlinesTable = pgTable("case_deadlines", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  deadlineType: text("deadline_type").notNull(), // answer_deadline | motion_response_deadline | discovery_response_deadline | appeal_deadline | default_review | custom
  triggerEvent: text("trigger_event"),
  triggerDate: timestamp("trigger_date", { withTimezone: true }),
  calculationRule: text("calculation_rule"),
  calculatedDueAt: timestamp("calculated_due_at", { withTimezone: true }),
  manualDueAt: timestamp("manual_due_at", { withTimezone: true }),
  responsibleParty: text("responsible_party"), // user | opposing_party | court | other
  partyName: text("party_name"),
  courtSystem: text("court_system"),
  jurisdiction: text("jurisdiction"),
  ruleCitation: text("rule_citation"),
  confidenceLevel: text("confidence_level").notNull().default("manual"), // high | medium | low | manual
  verificationRequired: boolean("verification_required").notNull().default(true),
  status: text("status").notNull().default("open"), // open | completed | missed | verified | dismissed
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const docketActivitiesTable = pgTable("docket_activities", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  docketNumber: text("docket_number"),
  filedAt: timestamp("filed_at", { withTimezone: true }),
  filedBy: text("filed_by"),
  documentType: text("document_type"),
  title: text("title").notNull(),
  source: text("source"), // manual | pacer_upload | recap | courtlistener | nef_email
  sourceUrl: text("source_url"),
  responseRequired: boolean("response_required").notNull().default(false),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }),
  assignedWorkflow: text("assigned_workflow"),
  status: text("status").notNull().default("needs_review"), // needs_review | in_progress | responded | no_response | closed
  aiSummary: text("ai_summary"),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseDeadlineSchema = createInsertSchema(caseDeadlinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaseDeadline = z.infer<typeof insertCaseDeadlineSchema>;
export type CaseDeadline = typeof caseDeadlinesTable.$inferSelect;

export const insertDocketActivitySchema = createInsertSchema(docketActivitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocketActivity = z.infer<typeof insertDocketActivitySchema>;
export type DocketActivity = typeof docketActivitiesTable.$inferSelect;
