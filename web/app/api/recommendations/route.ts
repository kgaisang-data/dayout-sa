import { NextRequest, NextResponse } from "next/server";
import { getRecommendedPlans } from "@/lib/recommendation-engine";
import { samplePlaces } from "@/data/places";
import type { PlannerInput } from "@/types/planner";

export async function POST(request: NextRequest) {
  try {
    const body: PlannerInput = await request.json();
    
    const plans = getRecommendedPlans(body, samplePlaces);
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}