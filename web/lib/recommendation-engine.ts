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

const PLAN_TYPES: PlanType[] = ["local-easy", "budget", "hidden-gems"];

type Candidate = {
  place: Place;
  costCents: number;
  groupCostCents: number;
  vibeMatches: number;
  areaMatch: number;
};

export function normaliseTag(value: string) {
  return value.toLowerCase().trim().replace(/[-_\s]+/g, " ");
}

const LOCATION_AREA_ALIASES: Record<string, string[]> = {
  soweto: [
    "Soweto",
    "Orlando West",
    "Orlando East",
    "Dube",
    "Jabavu",
    "Jabulani",
    "Mofolo North",
    "Dobsonville",
    "White City",
  ],
};

function locationAreas(location: string) {
  const normalised = normaliseTag(location);
  if (!normalised || normalised === "johannesburg") return [];
  return LOCATION_AREA_ALIASES[normalised] ?? [location.trim()];
}

function areaMatchesLocation(area: string, location: string) {
  const normalisedArea = normaliseTag(area);
  return locationAreas(location).some(
    (candidate) => normalisedArea === normaliseTag(candidate)
  );
}

function normalisedVibes(vibes: string[]) {
  return [...new Set(vibes.map(normaliseTag).filter(Boolean))];
}

function vibeMatches(place: Place, selectedVibes: string[]) {
  const placeVibes = new Set(place.vibes.map(normaliseTag));
  return selectedVibes.filter((vibe) => placeVibes.has(vibe)).length;
}

function isJohannesburgWide(location: string) {
  return normaliseTag(location) === "johannesburg";
}

function compareCandidates(a: Candidate, b: Candidate, strategy: PlanType) {
  const vibes = b.vibeMatches - a.vibeMatches;
  const area = b.areaMatch - a.areaMatch;
  const local = Number(b.place.local_business) - Number(a.place.local_business);
  const hidden = Number(b.place.hidden_gem) - Number(a.place.hidden_gem);
  const cost = a.costCents - b.costCents;

  let priority = 0;
  if (strategy === "budget") {
    priority = cost || vibes || area || local || hidden;
  } else if (strategy === "hidden-gems") {
    priority = hidden || local || vibes || area || cost;
  } else {
    priority = vibes || area || local || cost || hidden;
  }

  return (
    priority ||
    a.place.duration_minutes - b.place.duration_minutes ||
    a.place.name.localeCompare(b.place.name) ||
    a.place.id.localeCompare(b.place.id)
  );
}

function formatRand(amount: number) {
  return `R${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export function calculatePlanMetrics(stops: Place[], groupSize: number) {
  const safeGroupSize = Number.isSafeInteger(groupSize) && groupSize > 0 ? groupSize : 1;
  const totalCostCents = stops.reduce(
    (total, place) =>
      total + Math.round(Number(place.estimated_cost_per_person) * 100) * safeGroupSize,
    0
  );
  const venueMinutes = stops.reduce(
    (total, place) => total + Number(place.duration_minutes),
    0
  );
  const travelMinutes = Math.max(0, stops.length - 1) * TRANSFER_MINUTES;
  const totalCost = totalCostCents / 100;

  return {
    totalCost,
    costPerPerson: totalCostCents / safeGroupSize / 100,
    venueMinutes,
    travelMinutes,
    durationMinutes: venueMinutes + travelMinutes,
  };
}

function buildReasons(
  strategy: PlanType,
  stops: Place[],
  preferences: PlannerPreferences,
  selectedVibes: string[],
  totalCost: number,
  durationMinutes: number,
  travelMinutes: number
) {
  const reasons = [
    `${formatRand(totalCost)} in venue costs for ${preferences.groupSize} people fits your ${formatRand(preferences.budget)} group budget; transport costs are excluded.`,
    `${durationMinutes} minutes fits your ${preferences.availableMinutes}-minute limit: ${durationMinutes - travelMinutes} minutes at venues and ${travelMinutes} estimated travel minutes (${TRANSFER_MINUTES} minutes between stops).`,
  ];

  const matchedVibes = selectedVibes.filter((vibe) =>
    stops.some((place) => place.vibes.some((tag) => normaliseTag(tag) === vibe))
  );
  if (matchedVibes.length > 0) {
    reasons.push(`Matches your selected vibes: ${matchedVibes.join(", ")}.`);
  } else if (selectedVibes.length > 0) {
    reasons.push(
      "No selected stop matches your chosen vibes; this option fits your budget and time."
    );
  }

  const location = preferences.location.trim();
  if (location && !isJohannesburgWide(location)) {
    const areaStops = stops.filter((place) => areaMatchesLocation(place.area, location));
    reasons.push(
      areaStops.length > 0
        ? `In or near your preferred area, ${location}: ${areaStops.map((place) => place.name).join(", ")}.`
        : `Selected areas: ${[...new Set(stops.map((place) => place.area))].join(", ")}; no selected stop is in ${location}.`
    );
  }

  const localStops = stops.filter((place) => place.local_business);
  if (localStops.length > 0) {
    reasons.push(
      `Supports local businesses: ${localStops.map((place) => place.name).join(", ")}.`
    );
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

function canAddCandidate(
  candidate: Candidate,
  stops: Place[],
  totalCostCents: number,
  durationMinutes: number,
  preferences: PlannerPreferences
) {
  const nextCostCents = totalCostCents + candidate.groupCostCents;
  const nextDuration =
    durationMinutes +
    candidate.place.duration_minutes +
    (stops.length > 0 ? TRANSFER_MINUTES : 0);

  return (
    Number.isSafeInteger(nextCostCents) &&
    nextCostCents / 100 <= preferences.budget &&
    nextDuration <= preferences.availableMinutes
  );
}

function selectStops(
  ranked: Candidate[],
  stopLimit: number,
  preferences: PlannerPreferences
) {
  const stops: Place[] = [];
  let totalCostCents = 0;
  let durationMinutes = 0;

  const tryAdd = (candidate: Candidate, enforceCategoryDiversity: boolean) => {
    if (stops.length >= stopLimit) return false;

    if (enforceCategoryDiversity) {
      const category = normaliseTag(candidate.place.category);
      const sameCategoryCount = stops.filter(
        (stop) => normaliseTag(stop.category) === category
      ).length;
      if (sameCategoryCount >= 2) return false;
    }

    if (!canAddCandidate(candidate, stops, totalCostCents, durationMinutes, preferences)) {
      return false;
    }

    stops.push(candidate.place);
    totalCostCents += candidate.groupCostCents;
    durationMinutes +=
      candidate.place.duration_minutes + (stops.length > 1 ? TRANSFER_MINUTES : 0);
    return true;
  };

  for (const candidate of ranked) tryAdd(candidate, true);

  // Diversity is a preference, not a hard failure mode. If the catalogue is
  // narrow, fill any remaining slots with the next feasible candidates.
  if (stops.length < stopLimit) {
    const usedIds = new Set(stops.map((stop) => stop.id));
    for (const candidate of ranked) {
      if (usedIds.has(candidate.place.id)) continue;
      if (tryAdd(candidate, false)) usedIds.add(candidate.place.id);
    }
  }

  return stops;
}

function ensureLocalBusinessWhenPractical(
  strategy: PlanType,
  stops: Place[],
  ranked: Candidate[],
  preferences: PlannerPreferences
) {
  if (
    strategy === "budget" ||
    stops.length < 2 ||
    stops.some((place) => place.local_business)
  ) {
    return stops;
  }

  const selectedIds = new Set(stops.map((place) => place.id));
  const localCandidates = ranked.filter(
    (candidate) => candidate.place.local_business && !selectedIds.has(candidate.place.id)
  );

  for (const candidate of localCandidates) {
    for (let index = stops.length - 1; index >= 0; index -= 1) {
      const proposed = [...stops];
      proposed[index] = candidate.place;
      const metrics = calculatePlanMetrics(proposed, preferences.groupSize);
      if (
        metrics.totalCost <= preferences.budget &&
        metrics.durationMinutes <= preferences.availableMinutes
      ) {
        return proposed;
      }
    }
  }

  return stops;
}

function planSignature(stops: Place[]) {
  return JSON.stringify(stops.map((place) => place.id).sort());
}

export function getRecommendedPlans(
  preferences: PlannerPreferences,
  places: Place[]
): RecommendedPlan[] {
  if (
    !Number.isFinite(preferences.budget) ||
    preferences.budget < 0 ||
    !Number.isSafeInteger(preferences.groupSize) ||
    preferences.groupSize < 1 ||
    !Number.isFinite(preferences.availableMinutes) ||
    preferences.availableMinutes <= 0
  ) {
    return [];
  }

  const selectedVibes = normalisedVibes(preferences.vibes);
  const seenPlaceIds = new Set<string>();
  const candidates: Candidate[] = [];

  for (const place of places) {
    if (
      !place?.id ||
      seenPlaceIds.has(place.id) ||
      !Number.isFinite(place.estimated_cost_per_person) ||
      place.estimated_cost_per_person < 0 ||
      !Number.isSafeInteger(place.duration_minutes) ||
      place.duration_minutes <= 0 ||
      !Array.isArray(place.vibes)
    ) {
      continue;
    }

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
    candidates.push({
      place,
      costCents,
      groupCostCents,
      vibeMatches: vibeMatches(place, selectedVibes),
      areaMatch: Number(
        Boolean(preferences.location.trim()) &&
          !isJohannesburgWide(preferences.location) &&
          areaMatchesLocation(place.area, preferences.location)
      ),
    });
  }

  const plans: RecommendedPlan[] = [];
  const seenPlans = new Set<string>();

  for (const strategy of PLAN_TYPES) {
    const ranked = [...candidates].sort((a, b) =>
      compareCandidates(a, b, strategy)
    );
    const stopLimit = strategy === "hidden-gems" ? 3 : MAX_STOPS;
    let stops = selectStops(ranked, stopLimit, preferences);
    stops = ensureLocalBusinessWhenPractical(strategy, stops, ranked, preferences);

    if (stops.length === 0) continue;

    const signature = planSignature(stops);
    if (seenPlans.has(signature)) continue;
    seenPlans.add(signature);

    const metrics = calculatePlanMetrics(stops, preferences.groupSize);
    const meta = PLAN_META[strategy];
    plans.push({
      id: strategy,
      title: meta.title,
      label: meta.label,
      stops,
      totalCost: metrics.totalCost,
      costPerPerson: metrics.costPerPerson,
      durationMinutes: metrics.durationMinutes,
      travelMinutes: metrics.travelMinutes,
      remainingBudget:
        Math.round((preferences.budget - metrics.totalCost) * 100) / 100,
      reasons: buildReasons(
        strategy,
        stops,
        preferences,
        selectedVibes,
        metrics.totalCost,
        metrics.durationMinutes,
        metrics.travelMinutes
      ),
    });
  }

  return plans;
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
  const selectedVibes = normalisedVibes(preferences.vibes);

  const ranked = candidates
    .filter(
      (place) =>
        place?.id &&
        !usedIds.has(place.id) &&
        Number.isFinite(place.estimated_cost_per_person) &&
        place.estimated_cost_per_person >= 0 &&
        Number.isSafeInteger(place.duration_minutes) &&
        place.duration_minutes > 0
    )
    .map((place) => {
      let score = 0;

      if (normaliseTag(place.category) === normaliseTag(current.category)) {
        score += 35;
      }

      score += vibeMatches(place, selectedVibes) * 18;
      if (areaMatchesLocation(place.area, preferences.location)) score += 12;
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
      return (
        a.place.name.localeCompare(b.place.name) ||
        a.place.id.localeCompare(b.place.id)
      );
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
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

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
