"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { loadPlaces } from "@/data/places";
import { getRecommendedPlans } from "@/lib/recommendation-engine";
import type { PlannerPreferences } from "@/types/planner";
import type { RecommendedPlan } from "@/types/itinerary";

type ParsedPreferences =
  | { preferences: PlannerPreferences; error: null }
  | { preferences: null; error: string };

type ResultsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; plans: RecommendedPlan[] };

function parsePreferences(query: string): ParsedPreferences {
  const params = new URLSearchParams(query);
  const numberParam = (name: string, fallback: number) => {
    const value = params.get(name);
    if (value === null) return fallback;
    return value.trim() === "" ? NaN : Number(value);
  };

  const budget = numberParam("budget", 800);
  const groupSize = numberParam("groupSize", 4);
  const availableMinutes = numberParam("time", 360);

  if (!Number.isFinite(budget) || budget < 0 || budget > Number.MAX_SAFE_INTEGER / 100) {
    return { preferences: null, error: "Enter a valid total group budget of R0 or more." };
  }
  if (!Number.isSafeInteger(groupSize) || groupSize < 1 || groupSize > 20) {
    return { preferences: null, error: "Choose a whole group size between 1 and 20 people." };
  }
  if (!Number.isSafeInteger(availableMinutes) || availableMinutes <= 0) {
    return { preferences: null, error: "Choose a positive whole number of minutes for your day out." };
  }

  return {
    preferences: {
      location: params.get("location")?.trim() || "Johannesburg",
      budget,
      groupSize,
      availableMinutes,
      vibes: [...new Set(
        (params.get("vibes") ?? "chill,foodie")
          .split(",")
          .map((vibe) => vibe.trim().toLowerCase().replace(/[-\s]+/g, " "))
          .filter(Boolean)
      )],
    },
    error: null,
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`);
  }
  return parts.join(" ") || "0 minutes";
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-ZA", { maximumFractionDigits: 2 });
}

function ResultsForQuery({ query }: { query: string }) {
  const { preferences, error: validationError } = useMemo(
    () => parsePreferences(query),
    [query]
  );
  const [result, setResult] = useState<ResultsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!preferences) return;

    let cancelled = false;
    setResult({ status: "loading" });

    async function buildPlans(validPreferences: PlannerPreferences) {
      try {
        const places = await loadPlaces();
        const plans = getRecommendedPlans(validPreferences, places);
        if (!cancelled) setResult({ status: "ready", plans });
      } catch {
        if (!cancelled) setResult({ status: "error" });
      }
    }

    void buildPlans(preferences);
    return () => { cancelled = true; };
  }, [preferences, attempt]);

  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/plan"
          className="text-sm font-semibold text-[#4b2aad] hover:underline"
        >
          ← Change my preferences
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
          Your DayOut options
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#4b2aad]">
          {preferences ? `Plans for ${preferences.location}` : "Your DayOut plans"}
        </h1>

        {preferences && (
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {preferences.groupSize} people
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              R{formatAmount(preferences.budget)} total
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              ⏱ About {formatDuration(preferences.availableMinutes)}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {preferences.vibes.join(" + ") || "Any vibe"}
            </span>
          </div>
        )}

        <p className="mt-6 max-w-2xl text-slate-600">
          Explore South African day-out options based on your Rand budget,
          group size, available time and vibe. Venue costs exclude transport.
          Prices, travel times and availability are estimates for the
          Johannesburg pilot and should be confirmed before visiting.
        </p>

        {validationError !== null ? (
          <div role="alert" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-xl font-bold text-[#4b2aad]">Check your preferences</h2>
            <p className="mt-2 text-slate-600">{validationError}</p>
            <Link href="/plan" className="mt-4 inline-block font-semibold text-[#4b2aad] hover:underline">
              Update my preferences
            </Link>
          </div>
        ) : result.status === "loading" ? (
          <div role="status" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <p className="font-semibold text-[#4b2aad]">Finding your DayOut options...</p>
          </div>
        ) : result.status === "error" ? (
          <div role="alert" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-xl font-bold text-[#4b2aad]">We could not load your options</h2>
            <p className="mt-2 text-slate-600">Please try again in a moment.</p>
            <button
              type="button"
              onClick={() => setAttempt((current) => current + 1)}
              className="mt-5 rounded-xl bg-[#4b2aad] px-5 py-3 font-semibold text-white transition hover:bg-[#3d228d]"
            >
              Try again
            </button>
          </div>
        ) : result.plans.length === 0 ? (
          <div role="status" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-xl font-bold text-[#4b2aad]">No matching plans yet</h2>
            <p className="mt-2 text-slate-600">
              Try a larger budget, more time, or different preferences.
            </p>
            <Link
              href="/plan"
              className="mt-5 inline-block rounded-xl bg-[#ff7a1a] px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Change my preferences
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {result.plans.map((plan) => {
              const isWithinBudget = plan.totalCost <= preferences.budget;

              return (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                >
                  <p className="text-sm font-semibold text-orange-500">
                    {plan.label}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#4b2aad]">
                    {plan.title}
                  </h2>

                  <div className="mt-5">
                    <p className="text-3xl font-bold text-slate-900">
                      R{formatAmount(plan.totalCost)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      R{formatAmount(plan.costPerPerson)} per person
                    </p>
                  </div>

                  <p
                    className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      isWithinBudget
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {isWithinBudget ? "✓ Within your budget" : "Above your selected budget"}
                  </p>

                  <div className="mt-5 rounded-xl bg-purple-50 p-4 text-sm text-slate-600">
                    <p>⏱ About {formatDuration(plan.duration)} total</p>
                    <p className="mt-2">Estimated travel: {formatDuration(plan.travelTime)}</p>
                  </div>

                  <div className="mt-5">
                    <p className="font-semibold text-slate-900">Your stops</p>
                    <ol className="mt-3 space-y-2 text-sm text-slate-600">
                      {plan.stops.map((stop, index) => (
                        <li key={stop.id}>
                          <span className="mr-2 font-semibold text-[#4b2aad]">
                            {index + 1}.
                          </span>
                          {stop.name}
                          {stop.local_business && (
                            <span className="ml-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                              Local business
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-5">
                    <p className="font-semibold text-slate-900">Why it works</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {plan.reasons.map((reason) => (
                        <li key={reason}>✓ {reason}</li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={{
                      pathname: "/itinerary",
                      query: {
                        id: plan.id,
                        location: preferences.location,
                        budget: preferences.budget,
                        groupSize: preferences.groupSize,
                        time: preferences.availableMinutes,
                        vibes: preferences.vibes.join(","),
                      },
                    }}
                    className="mt-8 block rounded-xl bg-[#4b2aad] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#3d228d]"
                  >
                    View full plan
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  // Reset pending requests and displayed plans whenever planner inputs change.
  return <ResultsForQuery key={query} query={query} />;
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
          <p className="text-lg font-semibold text-[#4b2aad]">
            Finding your DayOut options...
          </p>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
