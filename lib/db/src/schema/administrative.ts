import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { casesTable } from "./cases";

export const administrativeProcessesTable = pgTable("administrative_processes", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  processType: text("process_type").notNull().default("notice_and_cure"),
  status: text("status").notNull().default("draft"), // draft | active | completed | escalated | closed
  issueSummary: text("issue_summary"),
  requestedCure: text("requested_cure"),
  recipientName: text("recipient_name"),
  recipientAddress: text("recipient_address"),
  recipientEmail: text("recipient_email"),
  deliveryMethod: text("delivery_method"), // certified_mail | email | portal | hand_delivery | other
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const administrativeLettersTable = pgTable("administrative_letters", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => administrativeProcessesTable.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  letterRound: text("letter_round").notNull(), // notice | opportunity_to_cure | intent_to_litigate
  letterTitle: text("letter_title").notNull(),
  body: text("body"),
  status: text("status").notNull().default("draft"), // draft | sent | responded | no_response | closed
  deliveryMethod: text("delivery_method"),
  trackingNumber: text("tracking_number"),
  proofFileId: integer("proof_file_id"),
  responseSummary: text("response_summary"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }),
  responseReceivedAt: timestamp("response_received_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdministrativeProcessSchema = createInsertSchema(administrativeProcessesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdministrativeProcess = z.infer<typeof insertAdministrativeProcessSchema>;
export type AdministrativeProcess = typeof administrativeProcessesTable.$inferSelect;

export const insertAdministrativeLetterSchema = createInsertSchema(administrativeLettersTable).omit({ id: true, generatedAt: true, updatedAt: true });
export type InsertAdministrativeLetter = z.infer<typeof insertAdministrativeLetterSchema>;
export type AdministrativeLetter = typeof administrativeLettersTable.$inferSelect;
