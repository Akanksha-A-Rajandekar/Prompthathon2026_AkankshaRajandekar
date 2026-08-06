import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, consultationsTable } from "@workspace/db";
import {
  AnswerConsultationBody,
  AnswerConsultationParams,
  AnswerConsultationResponse,
  CreateConsultationBody,
  CreateConsultationResponse,
  GetConsultationParams,
  GetConsultationResponse,
  GetDashboardSummaryResponse,
  GetReportParams,
  GetReportResponse,
  ListConsultationsResponse,
  ListWorkflowAgentsResponse,
} from "@workspace/api-zod";
import {
  answerConsultation,
  buildDashboard,
  createConsultationDetail,
  toConsultation,
  toReport,
  workflowAgents,
} from "../lib/mediguide";
import type { ConsultationDetail } from "@workspace/api-zod";

const router: IRouter = Router();

function rowToDetail(row: typeof consultationsTable.$inferSelect): ConsultationDetail {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    title: row.title,
    symptomPreview: row.symptomPreview,
    riskLevel: row.riskLevel as ConsultationDetail["riskLevel"],
    riskLabel: row.riskLabel,
    status: row.status as ConsultationDetail["status"],
    progress: Number(row.progress),
    nextQuestion: row.nextQuestion,
    messages: row.messages,
    summary: row.summary,
  };
}

async function getDetails(): Promise<ConsultationDetail[]> {
  const rows = await db
    .select()
    .from(consultationsTable)
    .orderBy(desc(consultationsTable.createdAt));
  return rows.map(rowToDetail);
}

async function getDetail(id: string): Promise<ConsultationDetail | undefined> {
  const [row] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, id));
  return row ? rowToDetail(row) : undefined;
}

async function saveDetail(detail: ConsultationDetail): Promise<void> {
  await db
    .insert(consultationsTable)
    .values({
      id: detail.id,
      createdAt: new Date(detail.createdAt),
      updatedAt: new Date(detail.updatedAt),
      title: detail.title,
      symptomPreview: detail.symptomPreview,
      riskLevel: detail.riskLevel,
      riskLabel: detail.riskLabel,
      status: detail.status,
      progress: String(detail.progress),
      nextQuestion: detail.nextQuestion,
      messages: detail.messages,
      summary: detail.summary,
    })
    .onConflictDoUpdate({
      target: consultationsTable.id,
      set: {
        updatedAt: new Date(detail.updatedAt),
        title: detail.title,
        symptomPreview: detail.symptomPreview,
        riskLevel: detail.riskLevel,
        riskLabel: detail.riskLabel,
        status: detail.status,
        progress: String(detail.progress),
        nextQuestion: detail.nextQuestion,
        messages: detail.messages,
        summary: detail.summary,
      },
    });
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const summary = buildDashboard(await getDetails());
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/consultations", async (_req, res): Promise<void> => {
  const consultations = (await getDetails()).map(toConsultation);
  res.json(ListConsultationsResponse.parse(consultations));
});

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const detail = createConsultationDetail(
    parsed.data.message,
    crypto.randomUUID(),
  );
  await saveDetail(detail);
  res.status(201).json(CreateConsultationResponse.parse(detail));
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  const params = GetConsultationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  res.json(GetConsultationResponse.parse(detail));
});

router.post("/consultations/:id", async (req, res): Promise<void> => {
  const params = AnswerConsultationParams.safeParse(req.params);
  const body = AnswerConsultationBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const current = await getDetail(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  const updated = answerConsultation(current, body.data.answer);
  await saveDetail(updated);
  res.json(AnswerConsultationResponse.parse(updated));
});

router.get("/workflow/agents", (_req, res): void => {
  res.json(ListWorkflowAgentsResponse.parse(workflowAgents));
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getDetail(params.data.id);
  const report = detail ? toReport(detail) : null;
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(GetReportResponse.parse(report));
});

export default router;