import crypto from "crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;
const MAX_LIVE_MESSAGES = 10;
const MAX_LIVE_SESSION_MS = 5 * 60 * 1000;

const usageStore = globalThis.__kaiwaDemoUsageStore || new Map();
globalThis.__kaiwaDemoUsageStore = usageStore;

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

function getUsage(sessionId) {
  const current = usageStore.get(sessionId);
  if (current) return current;

  const next = {
    voiceSessions: 0,
    liveMessages: 0,
    startedAt: null
  };
  usageStore.set(sessionId, next);
  return next;
}

// Basic in-memory demo protection only. Replace with database or Redis-backed
// per-user limits before monetizing or allowing higher-volume public access.
export function reserveLiveVoiceSession(sessionId) {
  const usage = getUsage(sessionId);

  if (usage.voiceSessions >= 1) {
    return { success: false, message: "Demo limit reached. You can continue with Demo Mode." };
  }

  usage.voiceSessions += 1;
  usage.startedAt = Date.now();
  return { success: true };
}

// Basic in-memory demo protection only. Replace with database or Redis-backed
// per-user limits before monetizing or allowing higher-volume public access.
export function checkLiveFeedbackLimits(sessionId, sessionData) {
  const usage = getUsage(sessionId);
  const transcript = Array.isArray(sessionData?.transcript) ? sessionData.transcript : [];
  const liveMessages = transcript.filter((message) => message.speaker === "user").length;
  const durationSeconds = Number(sessionData?.durationSeconds || 0);

  if (liveMessages > MAX_LIVE_MESSAGES || usage.liveMessages + liveMessages > MAX_LIVE_MESSAGES) {
    return { success: false, message: "Demo limit reached. You can continue with Demo Mode." };
  }

  if (durationSeconds * 1000 > MAX_LIVE_SESSION_MS) {
    return { success: false, message: "Demo limit reached. You can continue with Demo Mode." };
  }

  if (usage.startedAt && Date.now() - usage.startedAt > MAX_LIVE_SESSION_MS) {
    return { success: false, message: "Demo limit reached. You can continue with Demo Mode." };
  }

  usage.liveMessages += liveMessages;
  return { success: true };
}
