import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/types/place";
import { locationAreas } from "@/lib/location";

const PLACE_COLUMNS = `
  id,
  name,
  description,
  category,
  area,
  latitude,
  longitude,
  estimated_cost_per_person,
  duration_minutes,
  vibes,
  opening_hours,
  indoor,
  local_business,
  hidden_gem,
  image_url,
  source_url,
  last_verified
`;

type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_cost_per_person: number | string | null;
  duration_minutes: number | null;
  vibes: string[] | null;
  opening_hours: Record<string, string> | null;
  indoor: boolean | null;
  local_business: boolean | null;
  hidden_gem: boolean | null;
  image_url: string | null;
  source_url: string | null;
  last_verified: string | null;
};

function toPlace(row: PlaceRow): Place {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "Other",
    area: row.area ?? "Johannesburg",
    latitude: row.latitude,
    longitude: row.longitude,
    estimated_cost_per_person: Number(row.estimated_cost_per_person ?? 0),
    duration_minutes: Number(row.duration_minutes ?? 60),
    vibes: (row.vibes ?? []).map((vibe) => vibe.toLowerCase()),
    opening_hours: row.opening_hours,
    indoor: Boolean(row.indoor),
    local_business: Boolean(row.local_business),
    hidden_gem: Boolean(row.hidden_gem),
    image_url: row.image_url,
    source_url: row.source_url,
    last_verified: row.last_verified,
  };
}

type CandidateOptions = {
  location?: string;
  maxCostPerPerson?: number;
  limit?: number;
};

async function runPlacesQuery(options: CandidateOptions = {}): Promise<Place[]> {
  const supabase = await createClient();

  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);

  let query = supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("is_active", true)
    .order("local_business", { ascending: false })
    .order("hidden_gem", { ascending: false })
    .order("name")
    .limit(limit);

  const areas = locationAreas(options.location);
  if (areas.length > 0) {
    // Exact membership avoids treating user-supplied `%`/`_` as SQL pattern
    // wildcards. Unknown/free-typed locations safely fall back to the broader
    // Johannesburg pool below when no exact local row is found.
    query = query.in("area", areas);
  }

  if (
    Number.isFinite(options.maxCostPerPerson) &&
    Number(options.maxCostPerPerson) >= 0
  ) {
    query = query.lte(
      "estimated_cost_per_person",
      Number(options.maxCostPerPerson)
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Could not load active places:", error.message);
    throw new Error("Could not load active DayOut places.");
  }

  return ((data ?? []) as unknown as PlaceRow[]).map(toPlace);
}

/**
 * Returns a bounded candidate pool for recommendation scoring.
 *
 * - Database filtering removes inactive/unaffordable rows before scoring.
 * - Neighbourhood starts are preferred.
 * - A Johannesburg fallback is merged in when a neighbourhood has too few
 *   candidates so the planner can still build a complete itinerary.
 */
export async function loadRecommendationCandidates(
  options: CandidateOptions = {}
): Promise<Place[]> {
  const maxCostPerPerson = options.maxCostPerPerson;
  const location = options.location?.trim();

  const local = await runPlacesQuery({
    location,
    maxCostPerPerson,
    limit: 60,
  });

  if (!location || location.toLowerCase() === "johannesburg") {
    return local;
  }

  // With a rich neighbourhood pool, scoring locally is more geographically
  // coherent. Otherwise merge in broader Johannesburg options as fallback.
  if (local.length >= 12) {
    return local;
  }

  const broader = await runPlacesQuery({
    maxCostPerPerson,
    limit: 100,
  });

  const byId = new Map<string, Place>();
  for (const place of [...local, ...broader]) {
    byId.set(place.id, place);
  }

  return [...byId.values()].slice(0, 100);
}

export async function loadActivePlaces(): Promise<Place[]> {
  return runPlacesQuery({ limit: 200 });
}

export async function loadPlacesByIds(ids: string[]): Promise<Place[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const uniqueIds = [...new Set(ids)].slice(0, 20);

  const { data, error } = await supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("is_active", true)
    .in("id", uniqueIds)
    .limit(20);

  if (error) {
    console.error("Could not load itinerary places:", error.message);
    throw new Error("Could not load the places in this DayOut.");
  }

  const byId = new Map(
    ((data ?? []) as unknown as PlaceRow[])
      .map(toPlace)
      .map((place) => [place.id, place] as const)
  );

  return ids
    .map((id) => byId.get(id))
    .filter((place): place is Place => Boolean(place));
}
