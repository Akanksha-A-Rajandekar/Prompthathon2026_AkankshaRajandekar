import type {
  CaseSummary,
  Consultation,
  ConsultationDetail,
  ConsultationMessage,
  DashboardSummary,
  Report,
  WorkflowAgent,
} from "@workspace/api-zod";

const now = () => new Date().toISOString();

const intakeQuestions = [
  "How long have you been experiencing this, and has it been getting better, worse, or staying the same?",
  "Where exactly do you feel it, and how would you describe the sensation?",
  "On a scale from 1 to 10, how severe is it right now?",
  "Have you noticed any other symptoms alongside this?",
  "Do you have any relevant medical conditions or take any regular medications?",
];

const emergencyTerms = [
  "chest pain",
  "difficulty breathing",
  "can't breathe",
  "cannot breathe",
  "stroke",
  "face droop",
  "severe bleeding",
  "loss of consciousness",
  "passed out",
  "seizure",
  "blue lips",
  "anaphylaxis",
  "severe allergic",
];

export const workflowAgents: WorkflowAgent[] = [
  {
    id: "intake",
    name: "Symptom Intake",
    role: "Collects the initial concern",
    description: "Turns an open-ended concern into a clear chief complaint and symptom set.",
    input: "The user's first message",
    output: "Normalized symptom context",
    order: 1,
  },
  {
    id: "follow-up",
    name: "Follow-up Questions",
    role: "Asks one question at a time",
    description: "Selects the next most useful question based on what the user has already shared.",
    input: "Symptom context and prior answers",
    output: "One focused follow-up question",
    order: 2,
  },
  {
    id: "knowledge",
    name: "Medical Knowledge",
    role: "Organizes educational context",
    description: "Connects the reported pattern with broad, educational possibilities without diagnosing.",
    input: "Structured symptom context",
    output: "Possible educational context",
    order: 3,
  },
  {
    id: "risk",
    name: "Risk Assessment",
    role: "Checks urgency",
    description: "Screens for red-flag combinations and assigns a transparent urgency level.",
    input: "Symptoms, answers, and red-flag signals",
    output: "Risk level and plain-language reason",
    order: 4,
  },
  {
    id: "summary",
    name: "Case Summary",
    role: "Builds a readable record",
    description: "Creates a structured summary the user can review or share with a clinician.",
    input: "All consultation context",
    output: "Structured case summary",
    order: 5,
  },
  {
    id: "recommendation",
    name: "Recommendation",
    role: "Suggests next steps",
    description: "Offers safe, educational next steps matched to the assessed urgency.",
    input: "Risk assessment and case summary",
    output: "Action and self-care guidance",
    order: 6,
  },
  {
    id: "memory",
    name: "Memory",
    role: "Keeps the timeline useful",
    description: "Stores the consultation as a private timeline entry for future comparison.",
    input: "Completed consultation",
    output: "Saved consultation record",
    order: 7,
  },
];

function detectRisk(text: string): { level: Consultation["riskLevel"]; label: string; reason: string } {
  const normalized = text.toLowerCase();
  if (emergencyTerms.some((term) => normalized.includes(term))) {
    return {
      level: "red",
      label: "Emergency",
      reason: "Your description includes a symptom that can require immediate medical attention.",
    };
  }
  if (/(severe|worst|10\/10|9\/10|8\/10|worsening|faint|high fever)/i.test(text)) {
    return {
      level: "orange",
      label: "High",
      reason: "The severity or change you described suggests you should seek prompt clinical advice.",
    };
  }
  if (/(fever|vomit|vomiting|dizzy|persistent|7\/10|6\/10)/i.test(text)) {
    return {
      level: "yellow",
      label: "Moderate",
      reason: "Some of the details you shared are worth monitoring and discussing with a clinician if they continue.",
    };
  }
  return {
    level: "green",
    label: "Low",
    reason: "No urgent red flags are visible in the information shared so far.",
  };
}

function makeSummary(title: string, messages: ConsultationMessage[], risk: ReturnType<typeof detectRisk>): CaseSummary {
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
  const symptom = title || "Reported symptoms";
  const complete = messages.filter((message) => message.role === "user").length >= 5;
  return {
    chiefComplaint: symptom,
    symptoms: [symptom, "Further details gathered through guided intake"],
    duration: userText.match(/(\d+\s*(?:day|days|week|weeks|month|months))/i)?.[1] ?? "Not specified",
    severity: userText.match(/(?:severity|scale|pain)[^\d]*(\d{1,2})/i)?.[1]
      ? `${userText.match(/(?:severity|scale|pain)[^\d]*(\d{1,2})/i)?.[1]}/10`
      : "Not specified",
    associatedSymptoms: userText.match(/fever|vomit|dizzy|nausea|fatigue|cough/gi) ?? [],
    medicalHistory: "Not provided",
    possibleConditions: ["A symptom pattern that may have several explanations"],
    confidenceScore: complete ? 86 : 62,
    riskLevel: risk.level,
    riskReason: risk.reason,
    recommendedAction:
      risk.level === "red"
        ? "Call your local emergency number or go to the nearest emergency department now."
        : risk.level === "orange"
          ? "Arrange prompt medical advice today, especially if symptoms continue or worsen."
          : "Monitor the symptoms and arrange routine medical advice if they persist or concern you.",
    selfCareAdvice: [
      "Rest and keep a simple note of changes in symptoms.",
      "Avoid starting new medication based only on this summary.",
      "Seek care sooner if new or severe symptoms appear.",
    ],
    doctorRecommendation:
      risk.level === "green"
        ? "Consider routine care if symptoms do not improve."
        : "A clinician should review this with you; bring this summary and your medication list.",
    disclaimer:
      "MediGuide AI provides educational guidance, not a diagnosis or a substitute for professional medical care.",
  };
}

export function createConsultationDetail(message: string, id: string): ConsultationDetail {
  const timestamp = now();
  const risk = detectRisk(message);
  const title = message.trim().slice(0, 42) || "New consultation";
  const emergency = risk.level === "red";
  const assistantContent = emergency
    ? "I’m concerned by what you described. Please pause this consultation and seek immediate emergency medical care now. If you can, call your local emergency number."
    : "I’m here to help you organize what you’re experiencing. I’ll ask one focused question at a time, and I won’t diagnose you. " + intakeQuestions[0];
  const messages: ConsultationMessage[] = [
    { id: `${id}-user-1`, role: "user", content: message, timestamp },
    { id: `${id}-assistant-1`, role: "assistant", content: assistantContent, timestamp: now() },
  ];
  const consultation: Consultation = {
    id,
    createdAt: timestamp,
    updatedAt: now(),
    title,
    symptomPreview: message.trim().slice(0, 94),
    riskLevel: risk.level,
    riskLabel: risk.label,
    status: emergency ? "emergency" : "in_progress",
    progress: emergency ? 100 : 16,
    nextQuestion: emergency ? null : intakeQuestions[0],
  };
  return { ...consultation, messages, summary: emergency ? makeSummary(title, messages, risk) : null };
}

export function answerConsultation(detail: ConsultationDetail, answer: string): ConsultationDetail {
  const risk = detectRisk(`${detail.symptomPreview} ${answer}`);
  const answerCount = detail.messages.filter((message) => message.role === "user").length;
  const timestamp = now();
  const messages: ConsultationMessage[] = [
    ...detail.messages,
    { id: `${detail.id}-user-${answerCount + 1}`, role: "user", content: answer, timestamp },
  ];
  if (risk.level === "red") {
    messages.push({
      id: `${detail.id}-assistant-emergency`,
      role: "assistant",
      content: "Please stop here and seek immediate emergency medical care. This combination of symptoms can be urgent.",
      timestamp: now(),
    });
    return {
      ...detail,
      updatedAt: now(),
      riskLevel: risk.level,
      riskLabel: risk.label,
      status: "emergency",
      progress: 100,
      nextQuestion: null,
      messages,
      summary: makeSummary(detail.title, messages, risk),
    };
  }

  const nextIndex = answerCount;
  const isComplete = nextIndex >= intakeQuestions.length;
  if (!isComplete) {
    messages.push({
      id: `${detail.id}-assistant-${answerCount + 1}`,
      role: "assistant",
      content: intakeQuestions[nextIndex],
      timestamp: now(),
    });
  } else {
    messages.push({
      id: `${detail.id}-assistant-final`,
      role: "assistant",
      content: "Thank you. I’ve gathered enough context to prepare your educational summary. You can review it below.",
      timestamp: now(),
    });
  }
  return {
    ...detail,
    updatedAt: now(),
    riskLevel: risk.level,
    riskLabel: risk.label,
    status: isComplete ? "complete" : "in_progress",
    progress: isComplete ? 100 : Math.min(96, (answerCount + 1) * 16),
    nextQuestion: isComplete ? null : intakeQuestions[nextIndex],
    messages,
    summary: isComplete ? makeSummary(detail.title, messages, risk) : null,
  };
}

export function toConsultation(detail: ConsultationDetail): Consultation {
  const { messages: _messages, summary: _summary, ...consultation } = detail;
  return consultation;
}

export function toReport(detail: ConsultationDetail): Report | null {
  return detail.summary
    ? { consultation: toConsultation(detail), summary: detail.summary, generatedAt: now() }
    : null;
}

export function buildDashboard(details: ConsultationDetail[]): DashboardSummary {
  const consultations = details.map(toConsultation);
  const completed = consultations.filter((item) => item.status === "complete" || item.status === "emergency");
  const counts = consultations.reduce(
    (result, item) => ({ ...result, [item.riskLevel]: result[item.riskLevel] + 1 }),
    { green: 0, yellow: 0, orange: 0, red: 0 },
  );
  return {
    totalConsultations: consultations.length,
    completedConsultations: completed.length,
    latestConsultation: consultations[0] ?? null,
    averageRisk: consultations.length ? consultations[0].riskLabel : "No data yet",
    recentReports: consultations.slice(0, 4),
    riskBreakdown: counts,
  };
}