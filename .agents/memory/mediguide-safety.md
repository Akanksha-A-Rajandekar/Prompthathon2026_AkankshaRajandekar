---
name: MediGuide safety model
description: Durable product safety and explainability decisions for the healthcare companion.
---

MediGuide AI is intentionally framed as educational guidance rather than diagnosis. The consultation flow asks one question at a time, detects a small explicit set of emergency signals, pauses normal intake for red-risk cases, and shows a plain-language reason for every risk result.

**Why:** Healthcare users need clear escalation guidance without false certainty, and the uploaded product brief explicitly prohibited exposing internal reasoning.

**How to apply:** Any future AI or intake integration must preserve the visible disclaimer, structured risk explanation, emergency pause, and user-facing explanations without revealing hidden model reasoning.