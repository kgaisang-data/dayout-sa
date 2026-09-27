import { NextRequest, NextResponse } from "next/server";
import { loadRecommendationCandidates } from "@/data/places";
import { getRecommendedPlans, normaliseTag } from "@/lib/recommendation-engine";
import type { PlannerPreferences } from "@/types/planner";

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return NextResponse.json(
        { error: "DayOut is not connected to the places database yet." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Partial<PlannerPreferences>;

    const location = String(body.location ?? "Johannesburg").trim();
    const budget = Number(body.budget);
    const groupSize = Number(body.groupSize);
    const availableMinutes = Number(body.availableMinutes);
    const vibes = Array.isArray(body.vibes)
      ? body.vibes.map((vibe) => normaliseTag(String(vibe))).filter(Boolean)
      : [];

    if (!location || location.length > 100) {
      return invalid("Please choose a valid starting location.");
    }

    if (!Number.isFinite(budget) || budget < 100 || budget > 100000) {
      return invalid("Please enter a valid total group budget.");
    }

    if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
      return invalid("Group size must be between 1 and 20 people.");
    }

    if (
      !Number.isFinite(availableMinutes) ||
      availableMinutes < 60 ||
      availableMinutes > 720
    ) {
      return invalid("Please choose a valid amount of available time.");
    }

    if (vibes.length === 0 || vibes.length > 9) {
      return invalid("Please choose at least one vibe.");
    }

    const preferences: PlannerPreferences = {
      location,
      budget,
      groupSize,
      availableMinutes,
      vibes,
    };

    const maxCostPerPerson = budget / groupSize;
    const places = await loadRecommendationCandidates({
      location,
      maxCostPerPerson,
    });
    const plans = getRecommendedPlans(preferences, places);

    return NextResponse.json({
      plans,
      candidateCount: places.length,
    });
  } catch (error) {
    console.error("Recommendation route failed:", error);
    return NextResponse.json(
      { error: "We could not build your DayOut options right now." },
      { status: 500 }
    );
  }
}
