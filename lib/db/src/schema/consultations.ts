import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

type ConsultationMessageRecord = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: string;
};

type CaseSummaryRecord = {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string;
  associatedSymptoms: string[];
  medicalHistory: string;
  possibleConditions: string[];
  confidenceScore: number;
  riskLevel: "green" | "yellow" | "orange" | "red";
  riskReason: string;
  recommendedAction: string;
  selfCareAdvice: string[];
  doctorRecommendation: string;
  disclaimer: string;
};

export const consultationsTable = pgTable("consultations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  title: text("title").notNull(),
  symptomPreview: text("symptom_preview").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskLabel: text("risk_label").notNull(),
  status: text("status").notNull(),
  progress: text("progress").notNull(),
  nextQuestion: text("next_question"),
  messages: jsonb("messages").$type<ConsultationMessageRecord[]>().notNull(),
  summary: jsonb("summary").$type<CaseSummaryRecord | null>(),
});

export type ConsultationRow = typeof consultationsTable.$inferSelect;