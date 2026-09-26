import { NextRequest, NextResponse } from "next/server";
import { loadActivePlaces, loadPlacesByIds } from "@/data/places";
import { unstable_rethrow } from "next/navigation";

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

    const idsParam = request.nextUrl.searchParams.get("ids");
    const ids = (idsParam ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 20);

    const places = ids.length > 0 ? await loadPlacesByIds(ids) : await loadActivePlaces();

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
