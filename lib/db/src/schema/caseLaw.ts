import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";
import { researchSessionsTable } from "./research";

export const caseLawSourcesTable = pgTable("case_law_sources", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => casesTable.id, { onDelete: "cascade" }),
  researchSessionId: integer("research_session_id").references(() => researchSessionsTable.id, { onDelete: "set null" }),
  citation: text("citation"),
  caseName: text("case_name").notNull(),
  court: text("court"),
  year: text("year"),
  sourceUrl: text("source_url"),
  sourceProvider: text("source_provider"), // courtlistener | recap | perplexity | manual | future_lexis | future_westlaw
  legalIssue: text("legal_issue"),
  proposition: text("proposition"),
  quoteText: text("quote_text"),
  holdingSummary: text("holding_summary"),
  bindingStatus: text("binding_status").notNull().default("unknown"), // binding | persuasive | background | unknown | not_recommended
  jurisdiction: text("jurisdiction"),
  verificationStatus: text("verification_status").notNull().default("research_lead_only"), // verified | partially_verified | research_lead_only | unverified_do_not_file
  negativeTreatmentStatus: text("negative_treatment_status").notNull().default("not_checked"),
  confidenceLevel: text("confidence_level").notNull().default("low"),
  notes: text("notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const draftCitationsTable = pgTable("draft_citations", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  caseLawSourceId: integer("case_law_source_id").references(() => caseLawSourcesTable.id, { onDelete: "set null" }),
  draftType: text("draft_type").notNull(),
  citationText: text("citation_text").notNull(),
  propositionText: text("proposition_text"),
  placement: text("placement"),
  authorityType: text("authority_type").notNull().default("case_law"), // statute | rule | regulation | case_law | local_rule | secondary_source | research_lead
  verificationStatus: text("verification_status").notNull().default("research_lead_only"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseLawSourceSchema = createInsertSchema(caseLawSourcesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCaseLawSource = z.infer<typeof insertCaseLawSourceSchema>;
export type CaseLawSource = typeof caseLawSourcesTable.$inferSelect;

export const insertDraftCitationSchema = createInsertSchema(draftCitationsTable).omit({ id: true, createdAt: true });
export type InsertDraftCitation = z.infer<typeof insertDraftCitationSchema>;
export type DraftCitation = typeof draftCitationsTable.$inferSelect;
