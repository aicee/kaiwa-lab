const DEMO_ACCESS_TOKEN_KEY = "kaiwaDemoAccessToken";

function decodeTokenPayload(token) {
  try {
    const payload = token?.split(".")?.[0];
    if (!payload || typeof window === "undefined") return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

export function clearStoredDemoAccessToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEMO_ACCESS_TOKEN_KEY);
}

export function storeDemoAccessToken(token) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_ACCESS_TOKEN_KEY, token);
}

export function getStoredDemoAccessToken() {
  if (typeof window === "undefined") return null;

  const token = sessionStorage.getItem(DEMO_ACCESS_TOKEN_KEY);
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  if (!payload?.exp || payload.exp < Date.now()) {
    clearStoredDemoAccessToken();
    return null;
  }

  return token;
}

export function hasStoredDemoAccessToken() {
  return Boolean(getStoredDemoAccessToken());
}
