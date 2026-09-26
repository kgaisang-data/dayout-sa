import type { PlannerPreferences } from "@/types/planner";
import type { Place } from "@/types/place";
import type { RecommendedPlan } from "@/types/itinerary";

export type PlanType = "local-easy" | "budget" | "hidden-gems";

// Temporary estimate until routing supplies travel times between venues.
export const TRANSFER_MINUTES = 15;
const MAX_STOPS = 4;

const strategies: { id: PlanType; title: string; label: string }[] = [
  { id: "local-easy", title: "Local & Easy", label: "Best Match" },
  { id: "budget", title: "Best on a Budget", label: "Lowest-cost option" },
  { id: "hidden-gems", title: "Hidden Gems", label: "Something Different" },
];

type Candidate = {
  place: Place;
  costCents: number;
  groupCostCents: number;
  vibeMatches: number;
  areaMatch: number;
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]+/g, " ");
}

function compareCandidates(a: Candidate, b: Candidate, strategy: PlanType) {
  const vibes = b.vibeMatches - a.vibeMatches;
  const area = b.areaMatch - a.areaMatch;
  const local = Number(b.place.local_business) - Number(a.place.local_business);
  const cost = a.costCents - b.costCents;

  let priority: number;
  if (strategy === "budget") {
    // Zero-cost venues sort first, then cheaper venues, then relevance.
    priority = cost || vibes || area || local;
  } else if (strategy === "hidden-gems") {
    const hidden = Number(b.place.hidden_gem) - Number(a.place.hidden_gem);
    priority = hidden || local || vibes || area || cost;
  } else {
    priority = vibes || area || local || cost;
  }

  return (
    priority ||
    a.place.duration_minutes - b.place.duration_minutes ||
    a.place.name.localeCompare(b.place.name) ||
    a.place.id.localeCompare(b.place.id)
  );
}

function formatRand(amount: number): string {
  return `R${amount.toFixed(2).replace(/\.00$/, "")}`;
}

function buildReasons(
  strategy: PlanType,
  stops: Place[],
  preferences: PlannerPreferences,
  selectedVibes: string[],
  preferredArea: string,
  totalCost: number,
  duration: number,
  travelTime: number
): string[] {
  const reasons = [
    `${formatRand(totalCost)} in venue costs for ${preferences.groupSize} people fits your ${formatRand(preferences.budget)} group budget; transport costs are excluded.`,
    `${duration} minutes fits your ${preferences.availableMinutes}-minute limit: ${duration - travelTime} minutes at venues and ${travelTime} estimated travel minutes (${TRANSFER_MINUTES} minutes between stops).`,
  ];

  const matchedVibes = selectedVibes.filter((vibe) =>
    stops.some((place) => place.vibes.some((tag) => normalize(tag) === vibe))
  );
  if (matchedVibes.length > 0) {
    reasons.push(`Matches your selected vibes: ${matchedVibes.join(", ")}.`);
  } else if (selectedVibes.length > 0) {
    reasons.push("No selected stop matches your chosen vibes; this option fits your budget and time.");
  }

  if (preferredArea) {
    const areaStops = stops.filter((place) => normalize(place.area) === preferredArea);
    reasons.push(
      areaStops.length > 0
        ? `In your preferred area, ${preferences.location.trim()}: ${areaStops.map((place) => place.name).join(", ")}.`
        : `Selected areas: ${[...new Set(stops.map((place) => place.area))].join(", ")}; no selected stop is in ${preferences.location.trim()}.`
    );
  }

  const localStops = stops.filter((place) => place.local_business);
  if (localStops.length > 0) {
    reasons.push(`Supports local businesses: ${localStops.map((place) => place.name).join(", ")}.`);
  }

  if (strategy === "budget") {
    const freeStops = stops.filter((place) => place.estimated_cost_per_person === 0);
    reasons.push(
      freeStops.length > 0
        ? `Includes free venues: ${freeStops.map((place) => place.name).join(", ")}.`
        : `Prioritises lower-cost venues, starting at ${formatRand(Math.min(...stops.map((place) => place.estimated_cost_per_person)))} per person.`
    );
  }

  if (strategy === "hidden-gems") {
    const hiddenStops = stops.filter((place) => place.hidden_gem);
    reasons.push(
      hiddenStops.length > 0
        ? `Discovers hidden gems: ${hiddenStops.map((place) => place.name).join(", ")}.`
        : "No selected venue is tagged as a hidden gem; this option uses local-business and vibe preferences."
    );
  }

  return reasons;
}

export function getRecommendedPlans(
  preferences: PlannerPreferences,
  places: Place[]
): RecommendedPlan[] {
  if (
    !Number.isFinite(preferences.budget) || preferences.budget < 0 ||
    !Number.isSafeInteger(preferences.groupSize) || preferences.groupSize < 1 ||
    !Number.isFinite(preferences.availableMinutes) || preferences.availableMinutes <= 0
  ) {
    return [];
  }

  const selectedVibes = [...new Set(preferences.vibes.map(normalize).filter(Boolean))];
  const location = normalize(preferences.location);
  // Johannesburg means the entire pilot, rather than a specific neighbourhood.
  const preferredArea = location === "johannesburg" ? "" : location;
  const seenPlaceIds = new Set<string>();
  const candidates: Candidate[] = [];

  for (const place of places) {
    if (
      !place.id || seenPlaceIds.has(place.id) ||
      !Number.isFinite(place.estimated_cost_per_person) || place.estimated_cost_per_person < 0 ||
      !Number.isSafeInteger(place.duration_minutes) || place.duration_minutes <= 0
    ) {
      continue;
    }

    // The database stores two decimal places. Sum integer cents to avoid drift.
    const costCents = Math.round(place.estimated_cost_per_person * 100);
    const groupCostCents = costCents * preferences.groupSize;
    if (
      !Number.isSafeInteger(groupCostCents) ||
      groupCostCents / 100 > preferences.budget ||
      place.duration_minutes > preferences.availableMinutes
    ) {
      continue;
    }

    seenPlaceIds.add(place.id);
    const placeVibes = new Set(place.vibes.map(normalize));
    candidates.push({
      place,
      costCents,
      groupCostCents,
      vibeMatches: selectedVibes.filter((vibe) => placeVibes.has(vibe)).length,
      areaMatch: Number(Boolean(preferredArea) && normalize(place.area) === preferredArea),
    });
  }

  const plans: RecommendedPlan[] = [];
  const seenPlans = new Set<string>();

  for (const strategy of strategies) {
    const ranked = [...candidates].sort((a, b) => compareCandidates(a, b, strategy.id));
    const stops: Place[] = [];
    let totalCostCents = 0;
    let duration = 0;

    for (const candidate of ranked) {
      if (stops.length === MAX_STOPS) break;

      const nextCostCents = totalCostCents + candidate.groupCostCents;
      const nextDuration = duration + candidate.place.duration_minutes +
        (stops.length > 0 ? TRANSFER_MINUTES : 0);
      if (
        !Number.isSafeInteger(nextCostCents) ||
        nextCostCents / 100 > preferences.budget ||
        nextDuration > preferences.availableMinutes
      ) {
        continue;
      }

      stops.push(candidate.place);
      totalCostCents = nextCostCents;
      duration = nextDuration;
    }

    if (stops.length === 0) continue;

    // Different stop orders do not make the same set of venues a new option.
    const planKey = JSON.stringify(stops.map((place) => place.id).sort());
    if (seenPlans.has(planKey)) continue;
    seenPlans.add(planKey);

    const totalCost = totalCostCents / 100;
    const travelTime = (stops.length - 1) * TRANSFER_MINUTES;
    plans.push({
      ...strategy,
      stops,
      totalCost,
      costPerPerson: totalCostCents / preferences.groupSize / 100,
      duration,
      travelTime,
      remainingBudget: Math.round((preferences.budget - totalCost) * 100) / 100,
      reasons: buildReasons(
        strategy.id, stops, preferences, selectedVibes, preferredArea,
        totalCost, duration, travelTime
      ),
    });
  }

  return plans;
}
