import type { PlannerPreferences } from "@/types/planner";

export type PlanType = "local-easy" | "budget" | "hidden-gems";

export type RecommendedPlan = {
  id: PlanType;
  title: string;
  label: string;
  totalCost: number;
  durationMinutes: number;
  travelMinutes: number;
  stops: string[];
  reasons: string[];
  score: number;
};

const allPlans: Omit<RecommendedPlan, "score">[] = [
  {
    id: "local-easy",
    title: "Local & Easy",
    label: "Best Match",
    totalCost: 760,
    durationMinutes: 330,
    travelMinutes: 45,
    stops: [
      "Wits Art Museum",
      "Neighbourgoods Market",
      "44 Stanley",
      "Johannesburg Botanical Garden",
    ],
    reasons: [
      "A relaxed Johannesburg route with food, culture and an outdoor stop.",
      "Includes local businesses and tourism experiences.",
      "Works especially well for Chill, Foodie and Artsy vibes.",
    ],
  },
  {
    id: "budget",
    title: "Best on a Budget",
    label: "Lowest-cost option",
    totalCost: 360,
    durationMinutes: 285,
    travelMinutes: 35,
    stops: [
      "Wits Art Museum",
      "Constitution Hill",
      "Affordable Braamfontein Lunch",
      "Zoo Lake",
    ],
    reasons: [
      "Uses free cultural attractions and public spaces.",
      "Keeps activity, food and travel costs low.",
      "Works well for groups with a smaller budget.",
    ],
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    label: "Something Different",
    totalCost: 720,
    durationMinutes: 345,
    travelMinutes: 65,
    stops: [
      "Victoria Yards",
      "Maboneng Precinct",
      "Soweto Local Food Experience",
      "Northcliff Ridge Eco Park",
    ],
    reasons: [
      "Prioritises local creative spaces and community experiences.",
      "Supports small and independent tourism operators.",
      "Works especially well for Hidden Gems, Artsy and Foodie vibes.",
    ],
  },
];

function planMatchesVibe(planId: PlanType, vibes: string[]) {
  const selectedVibes = vibes.map((vibe) => vibe.toLowerCase());

  if (planId === "local-easy") {
    return selectedVibes.some((vibe) =>
      ["chill", "foodie", "artsy", "romantic"].includes(vibe)
    );
  }

  if (planId === "budget") {
    return selectedVibes.some((vibe) =>
      ["chill", "family", "outdoors", "artsy"].includes(vibe)
    );
  }

  return selectedVibes.some((vibe) =>
    ["hidden-gems", "foodie", "artsy", "adventurous", "culture"].includes(
      vibe
    )
  );
}

function calculatePlanScore(
  plan: Omit<RecommendedPlan, "score">,
  preferences: PlannerPreferences
) {
  let score = 0;

  const withinBudget = plan.totalCost <= preferences.budget;
  const fitsTime = plan.durationMinutes <= preferences.availableMinutes;
  const vibeMatch = planMatchesVibe(plan.id, preferences.vibes);

  if (withinBudget) {
    score += 40;
  } else {
    const amountOverBudget = plan.totalCost - preferences.budget;
    score -= Math.min(40, amountOverBudget / 10);
  }

  if (fitsTime) {
    score += 25;
  } else {
    score -= 25;
  }

  if (vibeMatch) {
    score += 25;
  }

  if (plan.id === "budget" && preferences.budget <= 500) {
    score += 20;
  }

  if (
    plan.id === "hidden-gems" &&
    preferences.vibes.some((vibe) =>
      ["hidden-gems", "artsy", "foodie"].includes(vibe.toLowerCase())
    )
  ) {
    score += 20;
  }

  if (
    plan.id === "local-easy" &&
    preferences.vibes.some((vibe) =>
      ["chill", "foodie", "romantic"].includes(vibe.toLowerCase())
    )
  ) {
    score += 15;
  }

  if (preferences.groupSize >= 5 && plan.id === "budget") {
    score += 10;
  }

  return score;
}

export function getRecommendedPlans(
  preferences: PlannerPreferences
): RecommendedPlan[] {
  const scoredPlans = allPlans.map((plan) => ({
    ...plan,
    score: calculatePlanScore(plan, preferences),
  }));

  return scoredPlans.sort((firstPlan, secondPlan) => {
    return secondPlan.score - firstPlan.score;
  });
}