// All AI calls go through server routes. Never expose provider keys in this file.
async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "API request failed.");
  return data;
}

export async function startElevenLabsSession(sessionConfig) {
  const demoAccessToken = typeof window !== "undefined" ? sessionStorage.getItem("kaiwaDemoAccessToken") : null;
  const response = await fetch("/api/elevenlabs/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sessionConfig, demoAccessToken })
  });
  return parseResponse(response);
}

export const startConversationSession = startElevenLabsSession;

export async function sendUserMessage(message) {
  // TODO: Send typed text to the active server-managed agent session.
  return { accepted: true, message };
}
export async function generateTutorReply(message) {
  // TODO: Generate the next agent reply through a secure backend route.
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
  const demoAccessToken = typeof window !== "undefined" ? sessionStorage.getItem("kaiwaDemoAccessToken") : null;
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sessionData, demoAccessToken })
  });
  const data = await parseResponse(response);
  return data.feedback;
}
export async function saveSessionReport(report) {
  // TODO: Persist reports when user accounts and storage are added.
  return { saved: false, report };
}
export async function getScenarioHint(sessionState) {
  // TODO: Ask the backend or select a phrase from local scenario data.
  return sessionState?.scenario?.phrases?.[0] || "すみません";
}
export async function repeatLastMessageSlower(lastMessage) {
  // TODO: Ask the agent/backend to simplify or repeat the Japanese line.
  return lastMessage;
}
export async function explainLastMessage(lastMessage) {
  // TODO: Explain the last Japanese line in simple English.
  return lastMessage?.en || "";
}
