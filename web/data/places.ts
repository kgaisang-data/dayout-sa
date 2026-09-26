import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/types/place";

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

async function runPlacesQuery(location?: string): Promise<Place[]> {
  const supabase = await createClient();

  let query = supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("is_active", true)
    .order("name")
    .limit(200);

  const cleanedLocation = location?.trim();
  if (
    cleanedLocation &&
    cleanedLocation.toLowerCase() !== "johannesburg"
  ) {
    query = query.ilike("area", `%${cleanedLocation}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Could not load active places:", error.message);
    throw new Error("Could not load active DayOut places.");
  }

  return ((data ?? []) as unknown as PlaceRow[]).map(toPlace);
}

/**
 * Loads a bounded recommendation candidate set. For a neighbourhood start we
 * prefer that area, but fall back to the Johannesburg pilot set when there are
 * too few local records to make a useful itinerary.
 */
export async function loadRecommendationCandidates(
  location?: string
): Promise<Place[]> {
  const local = await runPlacesQuery(location);

  if (
    !location ||
    location.trim().toLowerCase() === "johannesburg" ||
    local.length >= 2
  ) {
    return local;
  }

  return runPlacesQuery();
}

export async function loadActivePlaces(): Promise<Place[]> {
  return runPlacesQuery();
}

export async function loadPlacesByIds(ids: string[]): Promise<Place[]> {
  if (ids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const uniqueIds = [...new Set(ids)];

  const { data, error } = await supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("is_active", true)
    .in("id", uniqueIds)
    .limit(100);

  if (error) {
    console.error("Could not load itinerary places:", error.message);
    throw new Error("Could not load the places in this DayOut.");
  }

  const byId = new Map(
    ((data ?? []) as unknown as PlaceRow[])
      .map(toPlace)
      .map((place) => [place.id, place] as const)
  );

  // Preserve the plan order from the URL rather than database sort order.
  return ids
    .map((id) => byId.get(id))
    .filter((place): place is Place => Boolean(place));
}
