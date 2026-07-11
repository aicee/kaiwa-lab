// All AI calls go through server routes. Never expose provider keys in this file.
import { clearStoredDemoAccessHint } from "@/lib/clientDemoAccess";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || "API request failed.");
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function startElevenLabsSession(sessionConfig) {
  const response = await fetch("/api/elevenlabs/session", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionConfig)
  });
  if (response.status === 403) {
    clearStoredDemoAccessHint();
  }
  return parseResponse(response);
}

export const startConversationSession = startElevenLabsSession;

export async function sendUserMessage(message) {
  // TODO: Send typed text to the active server-managed agent session.
  return { accepted: true, message };
}
export async function generateTutorReply(message) {
  // TODO: Generate the next flexible agent reply through a secure backend route.
  // The route should use conversation meaning, not exact-answer matching.
  return { text: "Mock tutor reply", inReplyTo: message };
}
export async function transcribeUserAudio(audioBlob) {
  // TODO: POST audioBlob to /api/transcribe when transcription is enabled.
  return { text: "", audioBlob, pending: true };
}
export async function generateElevenLabsAudio(text) {
  // TODO: Generate or stream audio through a secure backend route.
  return { audioUrl: null, text };
}
export async function generateSessionFeedback(sessionData) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData)
  });
  const data = await parseResponse(response);
  return {
    ...data.feedback,
    source: data.source,
    message: data.message,
    fallbackCode: data.code
  };
}
export async function saveSessionReport(report) {
  // TODO: Persist reports when user accounts and storage are added.
  return { saved: false, report };
}
export async function getScenarioHint(sessionState) {
  // TODO: Ask the backend or select a phrase from local scenario data.
  return sessionState?.scenario?.usefulPhrases?.[0] || "すみません";
}
export async function repeatLastMessageSlower(lastMessage) {
  // TODO: Ask the agent/backend to simplify or repeat the Japanese line.
  return lastMessage;
}
export async function explainLastMessage(lastMessage) {
  // TODO: Explain the last Japanese line in simple English.
  return lastMessage?.en || "";
}
