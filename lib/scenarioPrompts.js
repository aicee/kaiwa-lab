export function buildElevenLabsDynamicVariables({
  scenario,
  level,
  politenessMode,
  supportLevel,
  showRomaji,
  showTranslation,
  practiceMode
}) {
  return {
    scenario_name: scenario.name,
    scenario_role: scenario.role,
    scenario_description: scenario.description,
    scenario_opening: scenario.opening,
    difficulty_level: level,
    politeness_mode: politenessMode,
    support_level: supportLevel,
    romaji_enabled: String(showRomaji),
    translation_enabled: String(showTranslation),
    practice_mode: practiceMode,
    user_goal: scenario.shortGoal,
    scenario_goals: scenario.goals.join("; "),
    useful_phrases: scenario.usefulPhrases.join("; ")
  };
}

export function buildScenarioSessionSummary({ scenario, transcript }) {
  return {
    scenario_name: scenario.name,
    scenario_role: scenario.role,
    scenario_description: scenario.description,
    scenario_goals: scenario.goals.join("; "),
    transcript
  };
}
