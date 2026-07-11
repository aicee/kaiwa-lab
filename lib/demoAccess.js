import crypto from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000;
export const DEMO_ACCESS_COOKIE_NAME = "kaiwa_demo_access";
export const DEMO_ACCESS_MAX_AGE_SECONDS = TOKEN_TTL_MS / 1000;

const feedbackRequestStore = globalThis.__kaiwaFeedbackRequestStore || new Map();
globalThis.__kaiwaFeedbackRequestStore = feedbackRequestStore;

function getSecret() {
  return process.env.DEMO_ACCESS_CODE;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payload) {
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function createDemoAccessToken() {
  const now = Date.now();
  const payload = encodePayload({
    sid: crypto.randomUUID(),
    iat: now,
    exp: now + TOKEN_TTL_MS
  });

  return `${payload}.${sign(payload)}`;
}

export function validateDemoCode(code) {
  if (!getSecret()) {
    return { success: false, message: "Live demo access is not configured yet" };
  }

  const submitted = typeof code === "string" ? code.trim() : "";
  const expected = getSecret().trim();

  if (!submitted || submitted !== expected) {
    return { success: false, message: "Invalid demo code" };
  }

  return { success: true };
}

export function validateDemoAccessToken(token) {
  if (!getSecret()) {
    return { success: false, message: "Live demo access is not configured yet" };
  }

  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { success: false, message: "Voice Mode requires demo access." };
  }

  const [payload, signature] = token.split(".");
  const expected = sign(payload);

  if (
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return { success: false, message: "Voice Mode requires demo access." };
  }

  try {
    const decoded = decodePayload(payload);
    if (!decoded.sid || decoded.exp < Date.now()) {
      return { success: false, message: "Voice Mode requires demo access." };
    }
    return { success: true, sessionId: decoded.sid };
  } catch {
    return { success: false, message: "Voice Mode requires demo access." };
  }
}

export function reserveCompletedVoiceFeedback(sessionId, sessionKey) {
  const key = typeof sessionKey === "string" ? sessionKey.trim() : "";

  if (!key) {
    return { success: false, code: "invalid_session", message: "A completed Voice session key is required." };
  }

  const globalKey = `${sessionId}:${key}`;
  if (feedbackRequestStore.has(globalKey)) {
    return { success: false, code: "feedback_already_requested", message: "Feedback was already requested for this completed session." };
  }

  feedbackRequestStore.set(globalKey, { requestedAt: Date.now() });
  return { success: true };
}
