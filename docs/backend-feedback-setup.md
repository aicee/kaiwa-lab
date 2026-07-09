# Backend Feedback Setup

All AI calls must use secure backend routes. The frontend must never call OpenAI or ElevenLabs with secret API keys.

Suggested flow:

1. The learner selects a scenario and settings.
2. The frontend sends these settings to the backend.
3. The backend prepares an ElevenLabs conversation with dynamic variables.
4. The voice agent runs the live roleplay.
5. The frontend receives transcript events.
6. On session end, the frontend sends transcript, scenario, level, goals, and settings to the backend.
7. The backend asks OpenAI for structured feedback using `lib/feedbackPrompt.js`.
8. The backend returns validated structured feedback.
9. The frontend renders the report.

Suggested routes:

- `POST /api/session/start`
- `POST /api/session/message`
- `POST /api/session/transcribe`
- `POST /api/session/feedback`
- `POST /api/session/save`

Validate inputs, keep provider keys server-only, rate-limit public routes, and treat transcripts as private user data.
