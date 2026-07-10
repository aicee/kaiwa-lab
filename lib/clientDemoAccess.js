const DEMO_ACCESS_HINT_KEY = "kaiwaVoiceUnlockedHint";

export function clearStoredDemoAccessHint() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEMO_ACCESS_HINT_KEY);
  sessionStorage.removeItem("kaiwaDemoAccessToken");
}

export function storeDemoAccessHint() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_ACCESS_HINT_KEY, "true");
}

export function hasStoredDemoAccessHint() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DEMO_ACCESS_HINT_KEY) === "true";
}

export async function getDemoAccessStatus() {
  const response = await fetch("/api/demo-code/status", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  return Boolean(response.ok && data?.success && data?.unlocked);
}

export async function refreshDemoAccessHint() {
  const unlocked = await getDemoAccessStatus();
  if (unlocked) {
    storeDemoAccessHint();
  } else {
    clearStoredDemoAccessHint();
  }
  return unlocked;
}
