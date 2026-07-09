# Hanasu AI

Hanasu AI is a responsive Japanese conversation practice app for building confidence through real-life roleplay. Learners choose a scenario, adjust the language level and support settings, practice by voice or text, and receive a focused post-session report.

## Features

- 12 roleplay scenarios across food, shopping, travel, daily life, and work
- JLPT-oriented N5, N3, and N1 difficulty settings
- Voice, text, and no-microphone Demo Mode
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
cd hanasu-ai
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo Mode works without environment variables, API keys, or microphone access.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_AGENT_ID` are server-side secrets. Never add them to frontend code or expose them with a `NEXT_PUBLIC_` prefix. Only `NEXT_PUBLIC_APP_URL` is safe for browser use.

The current API routes degrade safely:

- `/api/feedback` returns mock feedback when `OPENAI_API_KEY` is absent.
- `/api/elevenlabs/session` returns a clear setup response when ElevenLabs credentials are absent.
- `/api/transcribe` is a placeholder for a future transcription service.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected Next.js build settings.
4. Add the environment variables from `.env.example` in **Project Settings → Environment Variables**.
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
