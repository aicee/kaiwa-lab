import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scenarios } from "@/data/scenarios";
import { checkLiveFeedbackLimits, DEMO_ACCESS_COOKIE_NAME, validateDemoAccessToken } from "@/lib/demoAccess";
import { buildFeedbackSystemPrompt, buildFeedbackUserPrompt } from "@/lib/feedbackPrompt";
import {
  FEEDBACK_MODEL,
  MAX_FEEDBACK_TRANSCRIPT_CHARS,
  MAX_FEEDBACK_TRANSCRIPT_TURNS,
  kaiwaFeedbackJsonSchema,
  mockFeedbackToStructured,
  resolveScenarioById,
  validateFeedbackReport
} from "@/lib/feedbackSchema";

export const runtime = "nodejs";

const VALID_LEVELS = new Set(["N5 Beginner", "N3 Intermediate", "N1 Advanced"]);
const VALID_POLITENESS_MODES = new Set(["Casual", "Polite", "Business"]);
const VALID_ROLES = new Set(["agent", "user"]);
const MIN_USER_TURNS_FOR_FEEDBACK = 1;
const OPENAI_TIMEOUT_MS = 25000;

function debugFeedback(message, details = {}) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("Kaiwa feedback", { message, ...details });
}

function fallbackResponse({ scenarioId, message, status = 200, code = "feedback_fallback", details = {} }) {
  debugFeedback("fallback", { scenarioId, code, ...details });
  return NextResponse.json(
    {
      feedback: mockFeedbackToStructured(scenarioId, message),
      source: "sample",
      message,
      code
    },
    { status }
  );
}

function getScenarioId(sessionData) {
  const scenarioId = sessionData?.scenario?.id;
  return typeof scenarioId === "string" ? scenarioId : "";
}

function normalizeFeedbackTranscript(turns) {
  if (!Array.isArray(turns)) return [];

  const normalized = [];
  let totalChars = 0;

  for (const turn of turns) {
    if (turn?.isFinal !== true) continue;
    const role = turn.role;
    const text = typeof turn.text === "string" ? turn.text.trim() : "";
    if (!VALID_ROLES.has(role) || !text) continue;

    totalChars += text.length;
    if (totalChars > MAX_FEEDBACK_TRANSCRIPT_CHARS) break;

    normalized.push({
      id: typeof turn.id === "string" ? turn.id : `${role}:${normalized.length + 1}`,
      role,
      text,
      timestamp: turn.timestamp ?? normalized.length + 1,
      isFinal: true
    });

    if (normalized.length >= MAX_FEEDBACK_TRANSCRIPT_TURNS) break;
  }

  return normalized;
}

function getSessionKey(sessionData, transcript) {
  if (typeof sessionData?.conversationId === "string" && sessionData.conversationId.trim()) {
    return sessionData.conversationId.trim();
  }
  return [
    getScenarioId(sessionData) || "unknown-scenario",
    sessionData?.endedAt || "unknown-end",
    transcript.length,
    transcript.map((turn) => turn.id).join("|").slice(0, 160)
  ].join(":");
}

async function createOpenAIFeedback({ scenario, sessionData, transcript }) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const validScenarioIds = scenarios.map((item) => item.id);

  const response = await client.responses.parse(
    {
      model: FEEDBACK_MODEL,
      input: [
        {
          role: "system",
          content: buildFeedbackSystemPrompt()
        },
        {
          role: "user",
          content: buildFeedbackUserPrompt({
            scenario,
            level: sessionData.level,
            politenessMode: sessionData.politenessMode,
            practiceMode: sessionData.practiceMode,
            duration: Number(sessionData.duration || sessionData.durationSeconds || 0),
            transcript,
            validScenarioIds
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "kaiwa_feedback_report",
          strict: true,
          schema: kaiwaFeedbackJsonSchema
        }
      }
    },
    { signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS) }
  );

  return response.output_parsed;
}

export async function POST(request) {
  let sessionData;

  try {
    sessionData = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON session payload is required." }, { status: 400 });
  }

  const scenarioId = getScenarioId(sessionData);
  const scenario = resolveScenarioById(scenarioId);
  const transcript = normalizeFeedbackTranscript(sessionData?.transcript);
  const sessionKey = getSessionKey(sessionData, transcript);

  debugFeedback("request received", {
    sessionKey,
    transcriptTurnCount: transcript.length,
    scenarioId,
    level: sessionData?.level,
    practiceMode: sessionData?.practiceMode
  });

  if (sessionData?.practiceMode !== "Voice Mode") {
    return fallbackResponse({
      scenarioId,
      message: "Sample feedback is shown for Demo Mode and Text Mode.",
      code: "non_voice_mode",
      details: { sessionKey }
    });
  }

  const access = validateDemoAccessToken(request.cookies.get(DEMO_ACCESS_COOKIE_NAME)?.value);
  if (!access.success) {
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "missing_demo_access",
      details: { sessionKey }
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "missing_openai_key",
      details: { sessionKey }
    });
  }

  if (!scenario) {
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      status: 400,
      code: "invalid_scenario",
      details: { sessionKey }
    });
  }

  if (!VALID_LEVELS.has(sessionData?.level) || !VALID_POLITENESS_MODES.has(sessionData?.politenessMode)) {
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      status: 400,
      code: "invalid_session_settings",
      details: { sessionKey }
    });
  }

  const userTurnCount = transcript.filter((turn) => turn.role === "user").length;
  if (userTurnCount < MIN_USER_TURNS_FOR_FEEDBACK) {
    return fallbackResponse({
      scenarioId,
      message: "We didn't capture enough conversation to create a detailed report.",
      code: "insufficient_transcript",
      details: { sessionKey, transcriptTurnCount: transcript.length }
    });
  }

  const limit = checkLiveFeedbackLimits(access.sessionId, {
    ...sessionData,
    transcript,
    durationSeconds: Number(sessionData?.duration || sessionData?.durationSeconds || 0)
  });

  if (!limit.success) {
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "demo_limit",
      details: { sessionKey }
    });
  }

  // TODO: Move feedback request IDs and usage limits to durable storage before full monetization.
  try {
    const rawFeedback = await createOpenAIFeedback({ scenario, sessionData, transcript });
    const validation = validateFeedbackReport(rawFeedback, { currentScenarioId: scenario.id });

    debugFeedback("schema validation complete", {
      sessionKey,
      scenarioId: scenario.id,
      validationSuccess: validation.success
    });

    if (!validation.success) {
      return fallbackResponse({
        scenarioId: scenario.id,
        message: "We couldn't generate live feedback, so here's a sample report.",
        code: "invalid_openai_feedback",
        details: { sessionKey, validationError: validation.error }
      });
    }

    return NextResponse.json({
      feedback: validation.feedback,
      source: "openai",
      message: "Live feedback generated."
    });
  } catch (error) {
    debugFeedback("OpenAI request failed", {
      sessionKey,
      scenarioId: scenario.id,
      errorName: error?.name,
      errorMessage: error?.message
    });

    return fallbackResponse({
      scenarioId: scenario.id,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "openai_failed",
      details: { sessionKey }
    });
  }
}
