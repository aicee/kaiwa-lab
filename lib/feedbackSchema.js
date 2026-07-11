import { scenarios } from "@/data/scenarios";
import { mockFeedback } from "@/data/mockFeedback";

export const FEEDBACK_MODEL = "gpt-5-mini";
export const MAX_FEEDBACK_TRANSCRIPT_TURNS = 40;
export const MAX_FEEDBACK_TRANSCRIPT_CHARS = 12000;

const goalStatusValues = ["completed", "partial", "not_completed"];
const scenarioIds = scenarios.map((scenario) => scenario.id);

const stringField = { type: "string" };

function objectSchema(properties, required = Object.keys(properties)) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

export const kaiwaFeedbackJsonSchema = objectSchema({
  overallScore: { type: "integer", minimum: 0, maximum: 100 },
  performanceLabel: stringField,
  performanceSummary: stringField,
  goalCompletion: {
    type: "array",
    items: objectSchema({
      goal: stringField,
      status: { type: "string", enum: goalStatusValues },
      evidence: stringField
    })
  },
  strengths: {
    type: "array",
    maxItems: 3,
    items: objectSchema({
      title: stringField,
      explanation: stringField,
      evidence: stringField
    })
  },
  corrections: {
    type: "array",
    maxItems: 3,
    items: objectSchema({
      userSaid: stringField,
      betterJapanese: stringField,
      romaji: stringField,
      explanation: stringField
    })
  },
  naturalPhrases: {
    type: "array",
    maxItems: 3,
    items: objectSchema({
      japanese: stringField,
      romaji: stringField,
      english: stringField,
      reason: stringField
    })
  },
  vocabulary: {
    type: "array",
    maxItems: 5,
    items: objectSchema({
      japanese: stringField,
      reading: stringField,
      romaji: stringField,
      english: stringField,
      context: stringField
    })
  },
  misunderstoodLanguage: {
    type: "array",
    maxItems: 3,
    items: objectSchema({
      japanese: stringField,
      reading: stringField,
      romaji: stringField,
      english: stringField,
      learnerContext: stringField,
      explanation: stringField
    })
  },
  grammarNote: objectSchema({
    title: stringField,
    explanation: stringField
  }),
  politenessNote: objectSchema({
    title: stringField,
    explanation: stringField
  }),
  keyFocus: objectSchema({
    title: stringField,
    explanation: stringField,
    practiceExample: stringField
  }),
  suggestedNextScenario: objectSchema({
    scenarioId: { type: "string", enum: scenarioIds },
    reason: stringField
  }),
  retryChallenge: stringField
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text || "");
}

function isEnglishHelpPhrase(text) {
  const normalized = cleanString(text).toLowerCase().replace(/[.!?]+$/, "");
  return normalized === "i don't understand" || normalized === "i dont understand";
}

function validateStringObject(value, fields) {
  if (!isPlainObject(value)) return null;
  const next = {};
  for (const field of fields) {
    const text = cleanString(value[field]);
    if (!text) return null;
    next[field] = text;
  }
  return next;
}

function validateArray(value, limit, validator) {
  if (!Array.isArray(value)) return null;
  const next = [];
  for (const item of value.slice(0, limit)) {
    const validated = validator(item);
    if (validated) next.push(validated);
  }
  return next;
}

export function resolveScenarioById(scenarioId) {
  return scenarios.find((scenario) => scenario.id === scenarioId) || null;
}

export function getFallbackScenarioId(currentScenarioId) {
  const current = resolveScenarioById(currentScenarioId);
  if (current?.next && resolveScenarioById(current.next)) return current.next;
  return scenarios.find((scenario) => scenario.id !== currentScenarioId)?.id || scenarios[0]?.id || "ramen";
}

export function validateFeedbackReport(value, options = {}) {
  if (!isPlainObject(value)) {
    return { success: false, error: "Feedback must be an object." };
  }

  const overallScore = Number(value.overallScore);
  if (!Number.isInteger(overallScore) || overallScore < 0 || overallScore > 100) {
    return { success: false, error: "Score must be an integer from 0 to 100." };
  }

  const performanceLabel = cleanString(value.performanceLabel);
  const performanceSummary = cleanString(value.performanceSummary);
  if (!performanceLabel || !performanceSummary) {
    return { success: false, error: "Performance fields are required." };
  }

  const goalCompletion = validateArray(value.goalCompletion, 10, (item) => {
    const goal = cleanString(item?.goal);
    const evidence = cleanString(item?.evidence);
    const status = cleanString(item?.status);
    if (!goal || !evidence || !goalStatusValues.includes(status)) return null;
    return { goal, status, evidence };
  });

  if (!goalCompletion) return { success: false, error: "Goal completion must be an array." };

  const strengths = validateArray(value.strengths, 3, (item) => validateStringObject(item, ["title", "explanation", "evidence"]));
  const corrections = validateArray(value.corrections, 3, (item) => validateStringObject(item, ["userSaid", "betterJapanese", "romaji", "explanation"]));
  const naturalPhrases = validateArray(value.naturalPhrases, 3, (item) => validateStringObject(item, ["japanese", "romaji", "english", "reason"]));
  const vocabulary = validateArray(value.vocabulary, 5, (item) => validateStringObject(item, ["japanese", "reading", "romaji", "english", "context"]));
  const misunderstoodLanguage = validateArray(value.misunderstoodLanguage, 3, (item) => {
    const validated = validateStringObject(item, ["japanese", "reading", "romaji", "english", "learnerContext", "explanation"]);
    if (!validated) return null;
    if (!containsJapanese(validated.japanese) || isEnglishHelpPhrase(validated.japanese)) return null;
    return validated;
  });

  if (!strengths || !corrections || !naturalPhrases || !vocabulary || !misunderstoodLanguage) {
    return { success: false, error: "Feedback arrays are malformed." };
  }

  const grammarNote = validateStringObject(value.grammarNote, ["title", "explanation"]);
  const politenessNote = validateStringObject(value.politenessNote, ["title", "explanation"]);
  const keyFocus = validateStringObject(value.keyFocus, ["title", "explanation", "practiceExample"]);
  if (!grammarNote || !politenessNote || !keyFocus) {
    return { success: false, error: "Feedback notes are malformed." };
  }

  const requestedScenarioId = cleanString(value.suggestedNextScenario?.scenarioId);
  const scenarioId = resolveScenarioById(requestedScenarioId) ? requestedScenarioId : getFallbackScenarioId(options.currentScenarioId);
  const suggestedNextScenario = {
    scenarioId,
    reason: cleanString(value.suggestedNextScenario?.reason) || "This gives you a useful adjacent practice challenge."
  };

  const retryChallenge = cleanString(value.retryChallenge);
  if (!retryChallenge) {
    return { success: false, error: "Retry challenge is required." };
  }

  return {
    success: true,
    feedback: {
      overallScore,
      performanceLabel,
      performanceSummary,
      goalCompletion,
      strengths,
      corrections,
      naturalPhrases,
      vocabulary,
      misunderstoodLanguage,
      grammarNote,
      politenessNote,
      keyFocus,
      suggestedNextScenario,
      retryChallenge
    }
  };
}

export function mockFeedbackToStructured(scenarioId, message = "We couldn't generate live feedback, so here's a sample report.") {
  const nextScenarioId = getFallbackScenarioId(scenarioId);
  return {
    overallScore: mockFeedback.score,
    performanceLabel: "Sample report",
    performanceSummary: message,
    goalCompletion: [],
    strengths: mockFeedback.wins.slice(0, 3).map((win) => ({
      title: "Sample strength",
      explanation: win,
      evidence: "Sample report content."
    })),
    corrections: mockFeedback.corrections.map((correction) => ({
      userSaid: correction.said,
      betterJapanese: correction.better,
      romaji: "",
      explanation: correction.why
    })),
    naturalPhrases: mockFeedback.phrases.slice(0, 3).map((phrase) => ({
      japanese: phrase,
      romaji: "",
      english: "Useful phrase for a similar conversation.",
      reason: "Sample report content."
    })),
    vocabulary: mockFeedback.vocabulary.map(([japanese, romaji, english]) => ({
      japanese,
      reading: "",
      romaji,
      english,
      context: "Sample report content."
    })),
    misunderstoodLanguage: [],
    grammarNote: {
      title: "Sample grammar note",
      explanation: "Use this as an example report only; it was not generated from your live transcript."
    },
    politenessNote: {
      title: "Sample politeness note",
      explanation: "Polite forms like お願いします are a safe choice in customer-facing situations."
    },
    keyFocus: {
      title: "Keep building flexible replies",
      explanation: "Practice giving short, clear answers and asking for help when needed.",
      practiceExample: "もう一度ゆっくりお願いします。"
    },
    suggestedNextScenario: {
      scenarioId: nextScenarioId,
      reason: "This sample suggestion follows the scenario sequence."
    },
    retryChallenge: "Try the scenario again and aim to complete one more goal in Japanese."
  };
}
