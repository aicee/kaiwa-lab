export function buildElevenLabsDynamicVariables({
  scenario,
  level,
  politenessMode,
  supportLevel,
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
    // Keep these dynamic variables for published ElevenLabs agent compatibility.
    // The app no longer renders separate romaji or translation display layers.
    romaji_enabled: "false",
    translation_enabled: "false",
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
