import { createClient } from "@/lib/supabase/client";
import type { Place } from "@/types/place";

export async function loadPlaces(): Promise<Place[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("places")
      .select(
        "id, name, description, category, area, estimated_cost_per_person, duration_minutes, vibes, local_business, hidden_gem"
      )
      .eq("is_active", true)
      .order("name")
      .returns<Place[]>();

    if (error) throw error;

    return data ?? [];
  } catch {
    // Keep database details and connection information out of caller-facing errors.
    throw new Error("Unable to load places. Please try again.");
  }
}

// Retained for the existing recommendation API until it uses loadPlaces.
export const samplePlaces: Place[] = [
  {
    id: "1",
    name: "Wits Art Museum",
    category: "museum",
    estimated_cost_per_person: 80,
    duration_minutes: 90,
    vibes: ["artsy", "chill", "culture"],
    area: "Braamfontein",
    description: "Contemporary African art museum",
    local_business: false,
    hidden_gem: false,
  },
  {
    id: "2",
    name: "Neighbourgoods Market",
    category: "restaurant",
    estimated_cost_per_person: 150,
    duration_minutes: 60,
    vibes: ["foodie", "chill", "culture"],
    area: "Braamfontein",
    description: "Food and craft market",
    local_business: true,
    hidden_gem: false,
  },
  {
    id: "3",
    name: "44 Stanley",
    category: "shopping",
    estimated_cost_per_person: 200,
    duration_minutes: 90,
    vibes: ["chill", "artsy", "foodie"],
    area: "Braamfontein",
    description: "Precinct with shops and restaurants",
    local_business: true,
    hidden_gem: false,
  },
  {
    id: "4",
    name: "Johannesburg Botanical Garden",
    category: "park",
    estimated_cost_per_person: 50,
    duration_minutes: 90,
    vibes: ["chill", "outdoors", "romantic"],
    area: "Emmarentia",
    description: "Large botanical garden with walking trails",
    local_business: false,
    hidden_gem: false,
  },
];
