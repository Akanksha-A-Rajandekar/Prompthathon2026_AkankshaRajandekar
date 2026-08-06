# Prompthathon2026_AkankshaRajandekar
# MediGuide AI

MediGuide AI is an Agentic AI-powered virtual healthcare assistant developed for PROMPT-A-THON 2026. The application provides an interactive and user-friendly platform where users can describe their symptoms, receive AI-guided follow-up questions, obtain a structured health summary, assess the urgency of their condition, and access educational health recommendations.

> MediGuide AI is designed for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.

# Problem Statement

Build an Agentic AI assistant that:

* Guides users based on symptoms
* Asks intelligent follow-up questions
* Summarizes the user's case
* Recommends next steps
* Determines urgency level
* Maintains user consultation history

# Features

## Secure Authentication

* User Sign Up
* User Login
* Secure session management
* Individual user consultation history

## AI Symptom Consultation

* Interactive chat interface
* One-question-at-a-time conversation
* Dynamic follow-up questions
* Intelligent symptom collection

## Agentic AI Workflow

The application follows a modular multi-agent architecture consisting of logical AI agents:

* Symptom Intake Agent
* Follow-up Question Agent
* Medical Knowledge Agent
* Risk Assessment Agent
* Case Summary Agent
* Recommendation Agent
* Memory Agent

These agents work together through a centralized AI orchestrator to provide personalized guidance.

## AI Case Summary

After collecting sufficient information, the AI generates a structured report including:

* Primary symptoms
* Duration
* Associated symptoms
* Possible conditions (educational only)
* Risk level
* Recommended next steps
* Self-care suggestions
* Medical disclaimer

## Risk Assessment

The assistant classifies consultations into:

* 🟢 Low
* 🟡 Moderate
* 🟠 High
* 🔴 Emergency

Emergency symptoms trigger an alert advising the user to seek immediate medical attention.

## Consultation Memory

The system stores previous consultations, allowing users to:

* View consultation history
* Review previous reports
* Compare symptoms over time
* Maintain a personalized health record

## Dashboard

The dashboard provides:

* Welcome page
* Start Consultation
* Previous consultations
* Reports
* Timeline
* User profile

# System Architecture

User

   │

   ▼

Symptom Intake Agent

   │

   ▼

Follow-up Question Agent

   │

   ▼

Medical Knowledge Agent

   │

   ▼

Risk Assessment Agent

   │

   ▼

Case Summary Agent

   │

   ▼

Recommendation Agent

   │

   ▼

Memory Agent

   │

   ▼

Final Consultation Report
```

---

#  Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide Icons
* Framer Motion

## Backend

* Supabase
* PostgreSQL
* Supabase Authentication

## AI

* OpenAI GPT Models
* Modular Prompt Engineering
* Agentic AI Workflow

## Deployment

* Vercel

# Database

The application stores:

* User Information
* Consultation History
* Symptoms
* Follow-up Responses
* AI Case Summary
* Risk Level
* Recommendations
* Timestamp

---

# AI Workflow

1. User enters symptoms.
2. Symptom Intake Agent extracts the primary complaint.
3. Follow-up Question Agent gathers additional information.
4. Medical Knowledge Agent interprets the collected data.
5. Risk Assessment Agent evaluates urgency.
6. Case Summary Agent generates a structured report.
7. Recommendation Agent provides educational guidance.
8. Memory Agent stores the consultation for future reference.

---

# User Flow

```
Landing Page

↓

Sign Up / Login

↓

Dashboard

↓

Start Consultation

↓

AI Conversation

↓

Case Summary

↓

Risk Assessment

↓

Recommendations

↓

Save Consultation

↓

View Reports & Timeline
```

---

# Key Highlights

* Agentic AI Architecture
* Prompt Engineering
* Interactive AI Conversation
* Persistent Consultation History
* Risk Assessment
* Educational Health Recommendations
* Responsive User Interface
* Secure Authentication

---

# Safety & Disclaimer

MediGuide AI does **not** provide medical diagnoses or replace licensed healthcare professionals.

The AI offers educational guidance based on user-provided information and encourages users to consult qualified medical professionals for diagnosis and treatment. In emergency situations, users are advised to contact their local emergency medical services immediately.

---

# Future Enhancements

* Daily Health Journal
* Health Analytics Dashboard
* PDF Consultation Reports
* Voice-Based Consultation
* Image Upload for Symptom Analysis
* Medication Reminders
* Health Trend Visualization
* Multilingual Support
* AI Wellness Insights
* Smart Health Notifications

# Developed For

**PROMPT-A-THON 2026**

An Agentic AI competition focused on solving real-world problems using intelligent AI workflows, prompt engineering, planning, reasoning, memory, and automation.

## Thank You

Thank you for exploring **MediGuide AI**. Feedback and suggestions are always welcome.
