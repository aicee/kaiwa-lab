# ElevenLabs Agent Setup

Kaiwa Lab uses one ElevenLabs voice agent for live roleplay. The app passes dynamic session values such as scenario, role, level, politeness, romaji, translation, practice mode, and user goal. This avoids creating 12 separate agents.

The final feedback report is generated separately by a backend OpenAI call after the session ends. This keeps voice conversation fast and natural while allowing richer review.

- Recommended agent name: **Kaiwa Lab**
- Purpose: Japanese conversation roleplay tutor for real-life speaking practice
- Primary language: Japanese
- Secondary language: English
- Voice: warm, clear, natural Japanese; avoid overly cute, anime, dramatic, or formal delivery

Dynamic variables:

`{{scenario_name}}`, `{{scenario_role}}`, `{{scenario_description}}`, `{{difficulty_level}}`, `{{politeness_mode}}`, `{{romaji_enabled}}`, `{{translation_enabled}}`, `{{practice_mode}}`, `{{user_goal}}`

Use the system and first-message exports in `lib/elevenlabsAgentConfig.js`. Create/authorize a conversation from a secure server endpoint; never ship an ElevenLabs secret key to the browser.
