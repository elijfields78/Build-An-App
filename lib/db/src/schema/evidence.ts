import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  description: text("description"),
  aiSummary: text("ai_summary"),
  extractedDates: text("extracted_dates"),
  extractedNames: text("extracted_names"),
  keyFacts: text("key_facts"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({ id: true, uploadedAt: true });
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidenceTable.$inferSelect;

export const courtDocumentsTable = pgTable("court_documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  documentType: text("document_type"),
  plainEnglishSummary: text("plain_english_summary"),
  deadlinesIdentified: text("deadlines_identified"),
  whatItMeans: text("what_it_means"),
  whatToDoNext: text("what_to_do_next"),
  proceduralWarnings: text("procedural_warnings"),
  draftResponse: text("draft_response"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCourtDocumentSchema = createInsertSchema(courtDocumentsTable).omit({ id: true, uploadedAt: true });
export type InsertCourtDocument = z.infer<typeof insertCourtDocumentSchema>;
export type CourtDocument = typeof courtDocumentsTable.$inferSelect;
