import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scenarios } from "@/data/scenarios";

export const runtime = "nodejs";

const LIVE_HELP_MODEL = "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 20_000;
const VALID_HELP_TYPES = new Set(["hint", "explanation", "repeat"]);
const MAX_AGENT_MESSAGE_CHARS = 400;

const emptyStringOrNull = { type: ["string", "null"] };
const liveHelpJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["hint", "explanation", "repeat"] },
    title: { type: "string", enum: ["Hint", "Explanation", "Repeat"] },
    message: { type: "string" },
    japanese: emptyStringOrNull,
    romaji: emptyStringOrNull,
    english: emptyStringOrNull,
    options: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          japanese: { type: "string" },
          romaji: emptyStringOrNull,
          english: emptyStringOrNull
        },
        required: ["japanese", "romaji", "english"]
      }
    }
  },
  required: ["type", "title", "message", "japanese", "romaji", "english", "options"]
};

function cleanString(value, limit = 1000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text || "");
}

function fallbackMessageFor(helpType, latestAgentMessage) {
  if (helpType === "hint") {
    if (/何名|何人|なんめい|なんにん/.test(latestAgentMessage)) {
      return "Try answering with the number of people.";
    }
    if (/注文|お決まり|決まり/.test(latestAgentMessage)) {
      return "You can say whether you're ready to order.";
    }
    return "Try giving a short answer that fits the last question.";
  }

  if (helpType === "repeat") return "Here is the last message again.";
  return "Here is a simple explanation of the last message.";
}

function normalizeKnownHint(support, latestAgentMessage) {
  if (support.type !== "hint") return support;

  if (/何名|何人|なんめい|なんにん/.test(latestAgentMessage)) {
    return {
      ...support,
      message: "Try answering with the number of people.",
      options: [
        { japanese: "一人です。", romaji: "Hitori desu.", english: "One person." },
        { japanese: "二人です。", romaji: "Futari desu.", english: "Two people." },
        { japanese: "三人です。", romaji: "Sannin desu.", english: "Three people." }
      ]
    };
  }

  if (/注文|お決まり|決まり/.test(latestAgentMessage)) {
    return {
      ...support,
      message: "You can say whether you're ready to order.",
      options: [
        { japanese: "まだです。", romaji: "Mada desu.", english: "Not yet." },
        { japanese: "はい、お願いします。", romaji: "Hai, onegaishimasu.", english: "Yes, please." },
        { japanese: "ラーメンを一つください。", romaji: "Raamen o hitotsu kudasai.", english: "One ramen, please." }
      ]
    };
  }

  return support;
}

function normalizeKnownSupport(support, latestAgentMessage) {
  if (support.type === "hint") return normalizeKnownHint(support, latestAgentMessage);

  if (/何名|何人|なんめい|なんにん/.test(latestAgentMessage)) {
    return {
      ...support,
      message: support.type === "repeat" ? "Here is the last message again." : "The waiter is asking how many people are in your group.",
      japanese: "何名様ですか？",
      romaji: "Nan-mei-sama desu ka?",
      english: "How many people?"
    };
  }

  if (/注文|お決まり|決まり/.test(latestAgentMessage)) {
    return {
      ...support,
      message: support.type === "repeat" ? "Here is the last message again." : "The waiter is asking if you've decided what to order.",
      japanese: "ご注文はお決まりですか？",
      romaji: support.romaji || "Go-chuumon wa okimari desu ka?",
      english: "Have you decided what to order?"
    };
  }

  return support;
}

function findScenario(scenarioId) {
  return scenarios.find((scenario) => scenario.id === scenarioId) || null;
}

function validateSupport(value, helpType, latestAgentMessage) {
  if (!value || typeof value !== "object" || value.type !== helpType) return null;

  const titleByType = {
    hint: "Hint",
    explanation: "Explanation",
    repeat: "Repeat"
  };

  let support = {
    type: helpType,
    title: titleByType[helpType],
    message: cleanString(value.message, 180),
    japanese: cleanString(value.japanese, 160) || null,
    romaji: cleanString(value.romaji, 180) || null,
    english: cleanString(value.english, 180) || null,
    options: []
  };

  if (!support.message) return null;
  if (containsJapanese(support.message)) {
    support.message = fallbackMessageFor(helpType, latestAgentMessage);
  }

  if (Array.isArray(value.options)) {
    support.options = value.options.slice(0, 3).map((option) => ({
      japanese: cleanString(option?.japanese, 80),
      romaji: cleanString(option?.romaji, 100) || null,
      english: cleanString(option?.english, 100) || null
    })).filter((option) => option.japanese);
  }

  if (helpType === "hint") {
    support.japanese = null;
    support.romaji = null;
    support.english = null;
    if (support.options.length === 0) return null;
  }

  if (helpType === "explanation" || helpType === "repeat") {
    support.options = [];
    support.japanese = support.japanese || latestAgentMessage;
    support = normalizeKnownSupport(support, latestAgentMessage);
    if (helpType === "explanation" && !support.english && !containsJapanese(support.message)) {
      support.english = support.message;
    }
    if (!support.english) return null;
  }

  return normalizeKnownSupport(support, latestAgentMessage);
}

function buildSystemPrompt() {
  return [
    "You are a beginner Japanese conversation support helper.",
    "You do not continue the roleplay.",
    "You only help the learner understand or respond to the provided latest agent message.",
    "Rules:",
    "- The learner is a beginner.",
    "- Stay inside the supplied scenario.",
    "- Focus only on the supplied latest agent message.",
    "- Do not use unrelated scenario phrases.",
    "- Do not guess a different conversation state.",
    "- Keep all support short.",
    "- The message field must be a short English learner-facing sentence.",
    "- Use learner-side Japanese for hints.",
    "- Hints should help the learner reply.",
    "- Do not answer for the learner with one mandatory response.",
    "- Provide up to 3 possible response examples when useful.",
    "- For number-of-people questions, show appropriate counters such as 一人, 二人, 三人.",
    "- For explanation, explain the message in one short English sentence.",
    "- For repeat, preserve the meaning of the latest message.",
    "- Romaji must match the Japanese.",
    "- Do not include JLPT labels.",
    "- Do not produce grammar lectures.",
    "- Do not produce post-session feedback.",
    "- Do not score the learner."
  ].join("\n");
}

function buildUserPrompt({ scenario, supportLevel, helpType, latestAgentMessage }) {
  return JSON.stringify({
    scenario: {
      id: scenario.id,
      name: scenario.name,
      role: scenario.role,
      description: scenario.description,
      shortGoal: scenario.shortGoal,
      goals: scenario.goals,
      politenessMode: scenario.politenessMode,
      registerLabel: scenario.registerLabel
    },
    supportLevel,
    helpType,
    latestAgentMessage
  });
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const scenario = findScenario(cleanString(payload?.scenarioId, 80)) || (
    payload?.scenario && typeof payload.scenario === "object" ? {
      id: cleanString(payload.scenario.id, 80) || "custom",
      name: cleanString(payload.scenario.name, 100) || "Conversation",
      role: cleanString(payload.scenario.role, 160),
      description: cleanString(payload.scenario.description, 500),
      shortGoal: cleanString(payload.scenario.shortGoal, 300),
      goals: Array.isArray(payload.scenario.goals) ? payload.scenario.goals.map((goal) => cleanString(goal, 160)).filter(Boolean).slice(0, 8) : [],
      politenessMode: cleanString(payload.scenario.politenessMode, 80),
      registerLabel: cleanString(payload.scenario.registerLabel, 100)
    } : null
  );
  const helpType = cleanString(payload?.helpType, 40);
  const latestAgentMessage = cleanString(payload?.latestAgentMessage, MAX_AGENT_MESSAGE_CHARS);
  const supportLevel = cleanString(payload?.supportLevel, 80) || "Beginner support";

  if (!scenario || !VALID_HELP_TYPES.has(helpType) || !latestAgentMessage) {
    return NextResponse.json({ success: false, message: "Invalid live help request." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: false, message: "Live help is unavailable." }, { status: 503 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse(
      {
        model: LIVE_HELP_MODEL,
        input: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt({ scenario, supportLevel, helpType, latestAgentMessage }) }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "kaiwa_live_help",
            strict: true,
            schema: liveHelpJsonSchema
          }
        }
      },
      { signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS) }
    );

    const support = validateSupport(response.output_parsed, helpType, latestAgentMessage);
    if (!support) {
      return NextResponse.json({ success: false, message: "Live help is unavailable." }, { status: 502 });
    }

    return NextResponse.json({ success: true, support });
  } catch (error) {
    const details = {
      stage: "LIVE_HELP_FAILED",
      errorName: error?.name,
      errorConstructor: error?.constructor?.name,
      status: error?.status,
      code: error?.code
    };
    if (process.env.NODE_ENV === "development") details.errorMessage = error?.message;
    console.warn("Kaiwa live help", details);
    return NextResponse.json({ success: false, message: "Live help is unavailable." }, { status: 502 });
  }
}
