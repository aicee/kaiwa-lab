# Kaiwa Lab

Kaiwa Lab is a responsive Japanese conversation practice app for building confidence through real-life roleplay. Learners choose a scenario, adjust the language level and support settings, practice by demo, typing, or protected live voice, and receive a focused post-session report.

## Features

- 12 roleplay scenarios across food, shopping, travel, daily life, and work
- JLPT-oriented N5, N3, and N1 difficulty settings
- Public no-microphone Demo Mode
- Text practice with typing
- Demo-code protected live Voice Mode
- Politeness, romaji, and translation controls
- Goal checklist and in-session language help
- Post-session corrections, vocabulary, natural phrases, and next-scenario guidance
- Responsive setup, conversation, and feedback screens

## Tech stack

- Next.js 14 App Router
- React 18
- Lucide React icons
- ElevenLabs voice agent integration placeholder
- OpenAI feedback integration placeholder
- Vercel serverless API routes and deployment

## Local setup

Requirements: Node.js 18.17 or newer and npm.

```bash
git clone <your-repository-url>
cd kaiwa-lab
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo Mode works without environment variables, API keys, microphone access, or a demo code.

Create a production build with:

```bash
npm run build
npm start
```

## Environment variables

Copy `.env.example` to `.env.local`:

```env
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
DEMO_ACCESS_CODE=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and `DEMO_ACCESS_CODE` are server-side secrets. Never add them to frontend code or expose them with a `NEXT_PUBLIC_` prefix. Only `NEXT_PUBLIC_APP_URL` is safe for browser use.

## Demo Access and API Protection

Demo Mode is public and does not use paid APIs. It uses the local mock transcript and mock feedback, so portfolio visitors can try Kaiwa Lab safely.

Voice Mode requires a demo code. The code is stored in `DEMO_ACCESS_CODE` and checked only on the server through `/api/demo-code/validate`; the real code is never returned to the frontend.

OpenAI feedback uses the real API only for unlocked demo sessions. If there is no `OPENAI_API_KEY`, or if a visitor has not unlocked demo access, the app falls back to mock feedback while still showing a feedback report.

The current server limits are intentionally simple in-memory demo protections: one live Voice Mode session per browser session, up to 10 live messages, and up to 5 minutes. If Kaiwa Lab is monetized later, replace the demo code with user accounts, Stripe, credits, and database-backed or Redis-backed rate limits.

The current API routes degrade safely:

- `/api/demo-code/validate` validates the server-side demo code and returns a signed session token when valid.
- `/api/feedback` returns mock feedback when `OPENAI_API_KEY` is absent or demo access is missing.
- `/api/elevenlabs/session` requires demo access before preparing a live session when ElevenLabs credentials are configured.
- `/api/transcribe` is a placeholder for a future transcription service.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New -> Project** and import the repository.
3. Keep the detected Next.js build settings.
4. Add the environment variables from `.env.example` in **Project Settings -> Environment Variables**.
5. Set `NEXT_PUBLIC_APP_URL` to the production domain.
6. Deploy. Future pushes to the production branch will trigger new deployments.

You can also deploy with the Vercel CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

## AI architecture

- Demo Mode uses local sample transcript and feedback data, so it works without API keys or microphone permission.
- ElevenLabs will handle live Japanese voice roleplay through a server-created agent session.
- OpenAI will handle structured post-session feedback using the scenario, level, politeness mode, goals, and transcript.
- Provider API keys stay server-side only and are never sent to the browser.
- V1 uses Vercel App Router API routes for the backend boundary. Fly.io is not part of V1.

Supporting integration notes are available in [docs/elevenlabs-setup.md](docs/elevenlabs-setup.md) and [docs/backend-feedback-setup.md](docs/backend-feedback-setup.md).
