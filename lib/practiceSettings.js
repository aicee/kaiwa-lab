export const BEGINNER_DIFFICULTY_LEVEL = "N5 Beginner";
export const VOICE_PRACTICE_MODE = "Voice Mode";
export const DEMO_PRACTICE_MODE = "Demo Mode";

export const supportLevels = [
  {
    value: "guided",
    label: "Guided",
    description: "Slower Japanese with reading and meaning support.",
    romaji: true,
    translation: true
  },
  {
    value: "natural",
    label: "Natural",
    description: "Beginner-friendly Japanese at a more natural pace.",
    romaji: true,
    translation: false
  },
  {
    value: "challenge",
    label: "Challenge",
    description: "Less automatic help. Ask when you get stuck.",
    romaji: false,
    translation: false
  }
];

export function getSupportLevel(value) {
  return supportLevels.find((level) => level.value === value) || supportLevels[0];
}

export function getSupportLevelLabel(value) {
  return getSupportLevel(value).label;
}

export function createDefaultPracticeSettings() {
  const support = supportLevels[0];
  return {
    level: BEGINNER_DIFFICULTY_LEVEL,
    supportLevel: support.value,
    supportLevelLabel: support.label,
    mode: VOICE_PRACTICE_MODE,
    politeness: "Polite",
    romaji: support.romaji,
    translation: support.translation
  };
}
