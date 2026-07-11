import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scenarios } from "@/data/scenarios";
import {
  DEMO_ACCESS_COOKIE_NAME,
  reserveCompletedVoiceFeedback,
  validateDemoAccessToken
} from "@/lib/demoAccess";
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

function logFeedbackEligibility(details) {
  debugFeedback("FEEDBACK_ELIGIBILITY", {
    stage: "FEEDBACK_ELIGIBILITY",
    ...details
  });
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

function hasStableCompletedSessionKey(sessionData, transcript) {
  if (typeof sessionData?.conversationId === "string" && sessionData.conversationId.trim()) {
    return true;
  }

  return Boolean(
    typeof sessionData?.endedAt === "string" &&
    sessionData.endedAt.trim() &&
    transcript.length > 0 &&
    transcript.some((turn) => typeof turn.id === "string" && turn.id.trim())
  );
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
  const sessionKeyPresent = hasStableCompletedSessionKey(sessionData, transcript);

  debugFeedback("request received", {
    sessionKey,
    transcriptTurnCount: transcript.length,
    scenarioId,
    level: sessionData?.level,
    practiceMode: sessionData?.practiceMode
  });

  if (sessionData?.practiceMode !== "Voice Mode") {
    logFeedbackEligibility({
      demoAccessValid: false,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "Sample feedback is shown for Demo Mode and Text Mode.",
      code: "ineligible_practice_mode",
      details: { sessionKey }
    });
  }

  const access = validateDemoAccessToken(request.cookies.get(DEMO_ACCESS_COOKIE_NAME)?.value);
  if (!access.success) {
    logFeedbackEligibility({
      demoAccessValid: false,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "invalid_demo_access",
      details: { sessionKey }
    });
  }

  if (!sessionKeyPresent) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent: false,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      status: 400,
      code: "invalid_session",
      details: { sessionKey }
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: "openai_not_configured",
      details: { sessionKey }
    });
  }

  if (!scenario) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      status: 400,
      code: "invalid_session",
      details: { sessionKey }
    });
  }

  if (!VALID_LEVELS.has(sessionData?.level) || !VALID_POLITENESS_MODES.has(sessionData?.politenessMode)) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      status: 400,
      code: "invalid_session",
      details: { sessionKey }
    });
  }

  const userTurnCount = transcript.filter((turn) => turn.role === "user").length;
  if (userTurnCount < MIN_USER_TURNS_FOR_FEEDBACK) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We didn't capture enough conversation to create a detailed report.",
      code: "insufficient_transcript",
      details: { sessionKey, transcriptTurnCount: transcript.length }
    });
  }

  const feedbackReservation = reserveCompletedVoiceFeedback(access.sessionId, sessionKey);
  if (!feedbackReservation.success) {
    logFeedbackEligibility({
      demoAccessValid: true,
      practiceMode: sessionData?.practiceMode,
      sessionKeyPresent,
      conversationIdPresent: Boolean(sessionData?.conversationId),
      transcriptTurnCount: transcript.length,
      feedbackEligible: false
    });
    return fallbackResponse({
      scenarioId,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: feedbackReservation.code || "feedback_already_requested",
      details: { sessionKey }
    });
  }

  logFeedbackEligibility({
    demoAccessValid: true,
    practiceMode: sessionData?.practiceMode,
    sessionKeyPresent,
    conversationIdPresent: Boolean(sessionData?.conversationId),
    transcriptTurnCount: transcript.length,
    feedbackEligible: true
  });

  // TODO: Move feedback request IDs and usage limits to durable storage before full monetization.
  try {
    debugFeedback("OPENAI_REQUEST_STARTED", {
      stage: "OPENAI_REQUEST_STARTED",
      sessionKey,
      scenarioId: scenario.id,
      transcriptTurnCount: transcript.length
    });

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
        code: "feedback_schema_invalid",
        details: { sessionKey, validationError: validation.error }
      });
    }

    return NextResponse.json({
      feedback: validation.feedback,
      source: "openai",
      message: "Live feedback generated."
    });
  } catch (error) {
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    debugFeedback("OpenAI request failed", {
      sessionKey,
      scenarioId: scenario.id,
      errorName: error?.name,
      errorMessage: error?.message
    });

    return fallbackResponse({
      scenarioId: scenario.id,
      message: "We couldn't generate live feedback, so here's a sample report.",
      code: isTimeout ? "openai_timeout" : "openai_request_failed",
      details: { sessionKey }
    });
  }
}
