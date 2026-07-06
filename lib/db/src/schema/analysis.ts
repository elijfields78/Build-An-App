import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const jurisdictionAnalysisTable = pgTable("jurisdiction_analysis", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }).unique(),
  federalOrState: text("federal_or_state"),
  subjectMatterJurisdiction: text("subject_matter_jurisdiction"),
  federalQuestion: text("federal_question"),
  diversityJurisdiction: text("diversity_jurisdiction"),
  personalJurisdiction: text("personal_jurisdiction"),
  venue: text("venue"),
  statuteOfLimitations: text("statute_of_limitations"),
  properDefendants: text("proper_defendants"),
  governmentDefendantRules: text("government_defendant_rules"),
  administrativeExhaustion: text("administrative_exhaustion"),
  aiAnalysis: text("ai_analysis"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJurisdictionSchema = createInsertSchema(jurisdictionAnalysisTable).omit({ id: true, updatedAt: true });
export type InsertJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type JurisdictionAnalysis = typeof jurisdictionAnalysisTable.$inferSelect;

export const ifpApplicationsTable = pgTable("ifp_applications", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }).unique(),
  formType: text("form_type"), // AO239 | AO240
  monthlyIncome: real("monthly_income"),
  monthlyExpenses: real("monthly_expenses"),
  assets: text("assets"),
  dependents: integer("dependents"),
  employed: boolean("employed"),
  employer: text("employer"),
  receivingBenefits: boolean("receiving_benefits"),
  benefitsDescription: text("benefits_description"),
  totalDebts: real("total_debts"),
  hardshipStatement: text("hardship_statement"),
  generatedText: text("generated_text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIfpSchema = createInsertSchema(ifpApplicationsTable).omit({ id: true, updatedAt: true });
export type InsertIfp = z.infer<typeof insertIfpSchema>;
export type IfpApplication = typeof ifpApplicationsTable.$inferSelect;

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }).unique(),
  complaintText: text("complaint_text"),
  caption: text("caption"),
  juryDemand: boolean("jury_demand").notNull().default(false),
  status: text("status").notNull().default("draft"), // draft | review | final
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
