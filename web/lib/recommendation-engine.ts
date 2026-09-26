import type { PlannerInput } from "@/types/planner";
import type { Place } from "@/types/place";
import type { RecommendedPlan } from "@/types/itinerary";

export type PlanType = "local-easy" | "budget" | "hidden-gems";

type PlanBase = {
  id: PlanType;
  title: string;
  label: string;
  totalCost: number;
  duration: number;
  travelTime: number;
  reasons: string[];
};

const allPlans: PlanBase[] = [
  {
    id: "local-easy",
    title: "Local & Easy",
    label: "Best Match",
    totalCost: 760,
    duration: 330,
    travelTime: 45,
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
    duration: 285,
    travelTime: 35,
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
    duration: 345,
    travelTime: 65,
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
  plan: PlanBase,
  preferences: PlannerInput
) {
  let score = 0;

  const withinBudget = plan.totalCost <= preferences.budget;
  const fitsTime = plan.duration <= preferences.availableHours * 60;
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
  preferences: PlannerInput,
  places: Place[]
): RecommendedPlan[] {
  const scoredPlans = allPlans.map((plan) => {
    const score = calculatePlanScore(plan, preferences);
    const costPerPerson = Math.round(plan.totalCost / preferences.groupSize);
    const remainingBudget = preferences.budget - plan.totalCost;

    return {
      id: plan.id,
      title: plan.title,
      label: plan.label,
      totalCost: plan.totalCost,
      duration: plan.duration,
      travelTime: plan.travelTime,
      stops: [],
      reasons: plan.reasons,
      score,
      costPerPerson,
      remainingBudget,
    };
  });

  return scoredPlans
    .filter((plan) => plan.score >= 50)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}