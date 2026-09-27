import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  loadActivePlaces,
  loadPlacesByIds,
  loadRecommendationCandidates,
} from "@/data/places";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
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

    const ids = (request.nextUrl.searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (ids.length > 0) {
      if (ids.some((id) => !UUID_PATTERN.test(id))) {
        return NextResponse.json(
          { error: "Invalid place identifier." },
          { status: 400 }
        );
      }

      return NextResponse.json({ places: await loadPlacesByIds(ids) });
    }

    const location = request.nextUrl.searchParams.get("location")?.trim();
    const rawMaxCost = request.nextUrl.searchParams.get("maxCostPerPerson");
    const maxCostPerPerson = rawMaxCost === null ? undefined : Number(rawMaxCost);

    if (
      rawMaxCost !== null &&
      (!Number.isFinite(maxCostPerPerson) || Number(maxCostPerPerson) < 0)
    ) {
      return NextResponse.json({ error: "Invalid cost filter." }, { status: 400 });
    }

    if (location && location.length > 100) {
      return NextResponse.json(
        { error: "Invalid location filter." },
        { status: 400 }
      );
    }

    const places =
      location || maxCostPerPerson !== undefined
        ? await loadRecommendationCandidates({ location, maxCostPerPerson })
        : await loadActivePlaces();

    return NextResponse.json({ places });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Places route failed:", error);
    return NextResponse.json(
      { error: "We could not load DayOut places right now." },
      { status: 500 }
    );
  }
}
