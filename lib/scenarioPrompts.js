export const ramenShopSessionConfig = {
  scenario_name: "Ramen Shop",
  scenario_role: "ramen shop waiter",
  scenario_description: "The learner asks for a seat, recommendation, ramen, water, and the bill.",
  difficulty_level: "N5 Beginner",
  politeness_mode: "Polite",
  romaji_enabled: "true",
  translation_enabled: "true",
  practice_mode: "Voice Mode",
  user_goal: "Order ramen, ask for water, and pay politely."
};

export const jobInterviewSessionConfig = {
  scenario_name: "Job Interview Introduction",
  scenario_role: "Japanese interviewer",
  scenario_description: "The learner introduces themselves, explains experience and strengths, and answers follow-ups.",
  difficulty_level: "N1 Advanced",
  politeness_mode: "Business",
  romaji_enabled: "false",
  translation_enabled: "false",
  practice_mode: "Voice Mode",
  user_goal: "Give a professional self-introduction in Japanese."
};

export const scenarioAgentRoles = {
  ramen: "ramen shop waiter", cafe: "cafe staff", store: "convenience store cashier",
  reservation: "restaurant receptionist", allergies: "restaurant staff", clothes: "clothing store staff",
  hotel: "hotel receptionist", train: "station staff", clinic: "clinic receptionist",
  neighbor: "neighbor", workplace: "coworker", interview: "Japanese interviewer"
};
