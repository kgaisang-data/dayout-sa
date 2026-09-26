import type { RecommendedPlan, PlanType } from "@/types/itinerary";
import type { Place } from "@/types/place";
import type { PlannerPreferences } from "@/types/planner";

export const TRANSFER_MINUTES = 15;
export const MAX_STOPS = 4;

export const PLAN_META: Record<
  PlanType,
  { title: string; label: string; description: string }
> = {
  "local-easy": {
    title: "Local & Easy",
    label: "Best Match",
    description:
      "A practical mix of places that best matches your selected vibe, budget and starting area.",
  },
  budget: {
    title: "Best on a Budget",
    label: "Lowest-cost option",
    description:
      "A lower-cost route that prioritises affordable experiences while still giving you a complete day out.",
  },
  "hidden-gems": {
    title: "Hidden Gems",
    label: "Something Different",
    description:
      "A more local-first route that gives extra preference to hidden gems and small or independent businesses.",
  },
};

export function normaliseTag(value: string) {
  return value.toLowerCase().trim().replaceAll("-", " ").replaceAll("_", " ");
}

function vibeMatches(place: Place, selectedVibes: string[]) {
  const selected = new Set(selectedVibes.map(normaliseTag));
  return place.vibes.filter((vibe) => selected.has(normaliseTag(vibe))).length;
}

function locationMatches(place: Place, location: string) {
  const selectedLocation = normaliseTag(location);
  if (!selectedLocation || selectedLocation === "johannesburg") {
    return false;
  }

  return normaliseTag(place.area).includes(selectedLocation);
}

function scorePlace(
  place: Place,
  preferences: PlannerPreferences,
  mode: PlanType
) {
  const matchedVibes = vibeMatches(place, preferences.vibes);
  let score = matchedVibes * 24;

  if (locationMatches(place, preferences.location)) {
    score += 20;
  }

  // Local businesses matter across all plans because DayOut is entered under
  // the Street Economy challenge.
  if (place.local_business) {
    score += 10;
  }

  if (mode === "local-easy") {
    score += matchedVibes * 12;
    if (place.estimated_cost_per_person <= preferences.budget / preferences.groupSize) {
      score += 8;
    }
  }

  if (mode === "budget") {
    if (place.estimated_cost_per_person === 0) {
      score += 45;
    } else if (place.estimated_cost_per_person <= 75) {
      score += 35;
    } else if (place.estimated_cost_per_person <= 150) {
      score += 22;
    } else if (place.estimated_cost_per_person <= 250) {
      score += 10;
    }
  }

  if (mode === "hidden-gems") {
    if (place.hidden_gem) {
      score += 45;
    }
    if (place.local_business) {
      score += 18;
    }
    if (place.vibes.some((vibe) => normaliseTag(vibe) === "hidden gems")) {
      score += 15;
    }
  }

  return score;
}

export function calculatePlanMetrics(
  stops: Place[],
  groupSize: number
) {
  const safeGroupSize = Math.max(1, groupSize);

  const totalCost = stops.reduce(
    (total, place) =>
      total + Number(place.estimated_cost_per_person) * safeGroupSize,
    0
  );

  const venueMinutes = stops.reduce(
    (total, place) => total + Number(place.duration_minutes),
    0
  );

  const travelMinutes = Math.max(0, stops.length - 1) * TRANSFER_MINUTES;

  return {
    totalCost,
    costPerPerson: totalCost / safeGroupSize,
    venueMinutes,
    travelMinutes,
    durationMinutes: venueMinutes + travelMinutes,
  };
}

function buildPlan(
  mode: PlanType,
  places: Place[],
  preferences: PlannerPreferences
): RecommendedPlan | null {
  const ranked = [...places]
    .map((place) => ({
      place,
      score: scorePlace(place, preferences, mode),
    }))
    .sort((a, b) => {
      // The budget plan deliberately starts from price so it does not collapse
      // into the same set of places as Best Match when several places share
      // the same vibes.
      if (mode === "budget") {
        const costDifference =
          a.place.estimated_cost_per_person - b.place.estimated_cost_per_person;
        if (costDifference !== 0) return costDifference;
      }

      if (b.score !== a.score) return b.score - a.score;

      // Stable, predictable tie-breaking is useful for repeatable demos.
      return a.place.name.localeCompare(b.place.name);
    });

  const selected: Place[] = [];
  const stopLimit = mode === "hidden-gems" ? 3 : MAX_STOPS;

  for (const candidate of ranked) {
    if (selected.length >= stopLimit) break;

    // Avoid an itinerary made almost entirely from one type of venue.
    const sameCategoryCount = selected.filter(
      (place) => normaliseTag(place.category) === normaliseTag(candidate.place.category)
    ).length;
    if (sameCategoryCount >= 2) continue;

    const proposedStops = [...selected, candidate.place];
    const metrics = calculatePlanMetrics(proposedStops, preferences.groupSize);

    if (metrics.totalCost > preferences.budget) continue;
    if (metrics.durationMinutes > preferences.availableMinutes) continue;

    selected.push(candidate.place);
  }

  if (selected.length < 2) {
    return null;
  }

  const metrics = calculatePlanMetrics(selected, preferences.groupSize);
  const localCount = selected.filter((place) => place.local_business).length;
  const hiddenCount = selected.filter((place) => place.hidden_gem).length;
  const matchedVibeStops = selected.filter(
    (place) => vibeMatches(place, preferences.vibes) > 0
  ).length;

  const reasons: string[] = [
    `Estimated venue spend is R${metrics.totalCost.toFixed(0)}, within your R${preferences.budget} group budget.`,
  ];

  if (matchedVibeStops > 0) {
    reasons.push(
      `${matchedVibeStops} stop${matchedVibeStops === 1 ? "" : "s"} match your selected vibe${preferences.vibes.length === 1 ? "" : "s"}.`
    );
  }

  if (localCount > 0) {
    reasons.push(
      `Includes ${localCount} local or small-business stop${localCount === 1 ? "" : "s"}.`
    );
  }

  if (mode === "budget") {
    reasons.push("Prioritises free and lower-cost places before more expensive options.");
  }

  if (mode === "hidden-gems") {
    reasons.push(
      hiddenCount > 0
        ? `Includes ${hiddenCount} place${hiddenCount === 1 ? "" : "s"} marked as a hidden gem.`
        : "Prioritises local-first places when dedicated hidden-gem options are limited."
    );
  }

  if (locationMatches(selected[0], preferences.location)) {
    reasons.push(`Starts with a place in or near ${preferences.location}.`);
  }

  const meta = PLAN_META[mode];

  return {
    id: mode,
    title: meta.title,
    label: meta.label,
    stops: selected,
    totalCost: metrics.totalCost,
    costPerPerson: metrics.costPerPerson,
    durationMinutes: metrics.durationMinutes,
    travelMinutes: metrics.travelMinutes,
    remainingBudget: preferences.budget - metrics.totalCost,
    reasons,
  };
}

function signature(plan: RecommendedPlan) {
  return plan.stops
    .map((place) => place.id)
    .sort()
    .join("|");
}

export function getRecommendedPlans(
  preferences: PlannerPreferences,
  places: Place[]
): RecommendedPlan[] {
  const modes: PlanType[] = ["local-easy", "budget", "hidden-gems"];
  const uniquePlans: RecommendedPlan[] = [];
  const seen = new Set<string>();

  for (const mode of modes) {
    const plan = buildPlan(mode, places, preferences);
    if (!plan) continue;

    const key = signature(plan);
    if (seen.has(key)) continue;

    seen.add(key);
    uniquePlans.push(plan);
  }

  return uniquePlans;
}

/**
 * Finds a real Supabase place to replace one itinerary stop. The replacement
 * must keep the itinerary inside the original budget and available time.
 */
export function findSwapAlternative(
  currentIndex: number,
  currentStops: Place[],
  candidates: Place[],
  preferences: PlannerPreferences
): Place | null {
  const current = currentStops[currentIndex];
  if (!current) return null;

  const usedIds = new Set(currentStops.map((place) => place.id));

  const ranked = candidates
    .filter((place) => !usedIds.has(place.id))
    .map((place) => {
      let score = 0;

      if (normaliseTag(place.category) === normaliseTag(current.category)) {
        score += 35;
      }

      score += vibeMatches(place, preferences.vibes) * 18;

      if (locationMatches(place, preferences.location)) score += 12;
      if (place.local_business) score += 10;
      if (place.hidden_gem) score += 6;

      const costDifference = Math.abs(
        place.estimated_cost_per_person - current.estimated_cost_per_person
      );
      score -= costDifference / 15;

      return { place, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.place.name.localeCompare(b.place.name);
    });

  for (const candidate of ranked) {
    const proposed = [...currentStops];
    proposed[currentIndex] = candidate.place;

    const metrics = calculatePlanMetrics(proposed, preferences.groupSize);
    if (
      metrics.totalCost <= preferences.budget &&
      metrics.durationMinutes <= preferences.availableMinutes
    ) {
      return candidate.place;
    }
  }

  return null;
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;

  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
}

export function buildStopTimes(stops: Place[], startHour = 10, startMinute = 30) {
  let elapsed = startHour * 60 + startMinute;

  return stops.map((stop, index) => {
    if (index > 0) elapsed += TRANSFER_MINUTES;

    const hours = Math.floor(elapsed / 60) % 24;
    const minutes = elapsed % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    elapsed += stop.duration_minutes;
    return time;
  });
}
