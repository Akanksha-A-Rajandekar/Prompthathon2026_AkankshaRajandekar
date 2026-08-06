# MediGuide AI — Agentic Architecture

## Product identity

MediGuide AI is a private, calm healthcare companion. It helps users organize what they are experiencing, asks one focused question at a time, highlights urgency, and prepares an educational summary that can support a conversation with a clinician.

## Orchestration sequence

```text
User
  ↓
Symptom Intake Agent
  ↓
Follow-up Question Agent
  ↓
Medical Knowledge Agent
  ↓
Risk Assessment Agent
  ↓
Case Summary Agent
  ↓
Recommendation Agent
  ↓
Memory Agent
  ↓
Final Report
```

## Agent contract

Every agent is modeled with:

- `name`
- `role`
- `system prompt`
- `input`
- `output`

Agents communicate through structured JSON in a production model integration. The current implementation keeps the behavior deterministic and testable while preserving the same modular boundaries.

## Agents

### 1. Symptom Intake Agent

- Role: collect the initial concern
- Input: the user's first message
- Output: normalized symptom context
- Constraint: preserve the user's language and avoid premature diagnosis

### 2. Follow-up Question Agent

- Role: ask exactly one question at a time
- Input: symptom context and prior answers
- Output: the next focused question
- Constraint: stop once enough context is available

### 3. Medical Knowledge Agent

- Role: organize broad educational context
- Input: structured symptom context
- Output: possible educational explanations
- Constraint: never present possibilities as a diagnosis

### 4. Risk Assessment Agent

- Role: check urgency
- Input: symptoms, answers, and red-flag signals
- Output: risk level and plain-language reason
- Levels: green / low, yellow / moderate, orange / high, red / emergency

### 5. Case Summary Agent

- Role: build a readable case record
- Input: all consultation context
- Output: structured case summary
- Fields: chief complaint, symptoms, duration, severity, associated symptoms, medical history, possible conditions, confidence, risk, and next steps

### 6. Recommendation Agent

- Role: suggest safe next steps
- Input: risk assessment and case summary
- Output: recommended action, self-care advice, and clinician recommendation

### 7. Memory Agent

- Role: keep the timeline useful
- Input: completed consultation
- Output: saved consultation record for later review and comparison

## Emergency handling

The normal consultation is paused when the input includes signals such as chest pain, difficulty breathing, stroke symptoms, severe bleeding, loss of consciousness, seizures, blue lips, or severe allergic reaction. The user is told to seek immediate emergency medical care.

## Explainability

The user sees why a question is being asked and why a risk level was assigned. Internal chain-of-thought is never exposed.