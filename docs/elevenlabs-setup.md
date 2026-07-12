# ElevenLabs Agent Setup

Kaiwa Lab uses one reusable ElevenLabs voice agent for live Japanese roleplay. The app passes scenario context and learner settings as dynamic variables; it does not create separate agents or scripted conversation trees.

The roleplay is flexible. The opening line may be controlled with `{{scenario_opening}}`, but every reply after that should be generated dynamically from what the learner actually says. The learner can answer in many valid ways, ask unexpected questions, or complete scenario goals in any order.

The opening gives the conversation a reliable start, but it does not determine the learner's reply or the rest of the conversation.

- Recommended agent name: **Kaiwa Lab**
- Purpose: Japanese conversation roleplay tutor for real-life speaking practice
- Primary spoken language: Japanese
- Secondary spoken language: English only when the learner asks for help or says they do not understand
- Voice: warm, clear, natural Japanese; avoid overly cute, anime, dramatic, or stiff delivery

## Dynamic Variables

The app sends these values to the server route for live voice practice:

`{{scenario_name}}`, `{{scenario_role}}`, `{{scenario_description}}`, `{{scenario_opening}}`, `{{difficulty_level}}`, `{{politeness_mode}}`, `{{support_level}}`, `{{romaji_enabled}}`, `{{translation_enabled}}`, `{{practice_mode}}`, `{{user_goal}}`, `{{scenario_goals}}`, `{{useful_phrases}}`

`scenario_goals` are flexible practice outcomes, not ordered steps. `useful_phrases` are optional learner support, not required answers.

## First Message

Leave the ElevenLabs dashboard First Message field empty.

Do not send an app-generated first message such as "Start the session as...". The dashboard system prompt and the `scenario_opening` dynamic variable control the beginning.

## Speaking Behavior

ElevenLabs should speak natural Japanese dialogue.

Romaji should not be spoken aloud. English translation should not automatically be spoken after every Japanese response. Romaji and translation are UI display options only. Spoken English should happen only when the learner asks for help or says they do not understand.

TODO: If the live transcript format later includes separate Japanese, romaji, and English fields, render those separately in the UI instead of treating them as one spoken message.

## Feedback

Detailed correction happens after the session through OpenAI feedback. Goal completion should be evaluated from the completed transcript later, not from exact phrase checks during roleplay.

The public demo flow is preview behavior. It should remain separate from future real transcript analysis.

## Security

Live voice practice starts by calling `/api/elevenlabs/session` after demo access is validated. That server route uses `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` to request a temporary ElevenLabs conversation credential, preferring `/v1/convai/conversation/token` and falling back to `/v1/convai/conversation/get-signed-url`.

The browser receives only the temporary `conversationToken` or `signedUrl` plus the dynamic variables. Never ship `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` to the browser.
