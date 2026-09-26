"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { formatMinutes } from "@/lib/recommendation-engine";
import type { RecommendedPlan } from "@/types/itinerary";

function ResultsContent() {
  const searchParams = useSearchParams();

  const location = searchParams.get("location") ?? "Johannesburg";
  const parsedBudget = Number(searchParams.get("budget") ?? 800);
  const parsedGroupSize = Number(searchParams.get("groupSize") ?? 4);
  const parsedTime = Number(searchParams.get("time") ?? 360);
  const rawVibes = searchParams.get("vibes") ?? "chill,foodie";

  const budget = Number.isFinite(parsedBudget) ? Math.max(0, parsedBudget) : 800;
  const groupSize = Number.isFinite(parsedGroupSize)
    ? Math.max(1, Math.round(parsedGroupSize))
    : 4;
  const time = Number.isFinite(parsedTime) ? Math.max(60, parsedTime) : 360;
  const vibeArray = useMemo(
    () =>
      rawVibes
        .split(",")
        .map((vibe: string) => vibe.trim())
        .filter(Boolean),
    [rawVibes]
  );

  const vibeLabel = vibeArray
    .map((vibe: string) => vibe.replaceAll("-", " "))
    .join(" + ");

  const [plans, setPlans] = useState<RecommendedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            budget,
            groupSize,
            availableMinutes: time,
            vibes: vibeArray,
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as {
          plans?: RecommendedPlan[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "We could not load your DayOut options.");
        }

        setPlans(data.plans ?? []);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        console.error("Could not load recommendations:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We could not load your DayOut options."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRecommendations();
    return () => controller.abort();
  }, [location, budget, groupSize, time, vibeArray]);

  const planAgainHref = `/plan`;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#4b2aad]">
            Building your DayOut options...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Matching real Johannesburg pilot places to your budget, time and vibe.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-bold text-[#4b2aad]">
            We could not load your options
          </h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <p className="mt-3 text-sm text-slate-500">
            If you are testing locally, also check that your Supabase values are in
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5">web/.env.local</code>
            and restart the development server.
          </p>
          <Link
            href={planAgainHref}
            className="mt-6 inline-block rounded-xl bg-[#4b2aad] px-5 py-3 font-semibold text-white"
          >
            Back to planner
          </Link>
        </div>
      </main>
    );
  }

  if (plans.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-bold text-[#4b2aad]">
            No DayOut fits those limits yet
          </h1>
          <p className="mt-3 text-slate-600">
            Try increasing the total budget or available time, or choose another vibe.
          </p>
          <Link
            href={planAgainHref}
            className="mt-6 inline-block rounded-xl bg-[#ff7a1a] px-5 py-3 font-semibold text-white"
          >
            Change preferences
          </Link>
        </div>
      </main>
    );
  }

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
          Plans for {location}
        </h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            👥 {groupSize} people
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            💸 R{budget.toFixed(0)} total
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            ⏱ {formatMinutes(time)} available
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            ✨ {vibeLabel || "Any vibe"}
          </span>
        </div>

        <p className="mt-6 max-w-2xl text-slate-600">
          These options are generated from the Johannesburg pilot places in DayOut's
          database. Venue prices and travel allowances are estimates and should be
          confirmed before visiting.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const placeIds = plan.stops.map((place) => place.id).join(",");
            const itineraryParams = new URLSearchParams({
              id: plan.id,
              location,
              budget: String(budget),
              groupSize: String(groupSize),
              time: String(time),
              vibes: rawVibes,
              places: placeIds,
            });

            return (
              <article
                key={plan.id}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
              >
                <p className="text-sm font-semibold text-orange-500">{plan.label}</p>

                <h2 className="mt-2 text-2xl font-bold text-[#4b2aad]">
                  {plan.title}
                </h2>

                <div className="mt-5">
                  <p className="text-3xl font-bold text-slate-900">
                    R{plan.totalCost.toFixed(0)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    R{plan.costPerPerson.toFixed(0)} per person · venue estimates
                  </p>
                </div>

                <p className="mt-3 inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  ✓ Within your budget
                </p>

                <div className="mt-5 rounded-xl bg-purple-50 p-4 text-sm text-slate-600">
                  <p>⏱ About {formatMinutes(plan.durationMinutes)}</p>
                  <p className="mt-2">
                    🚗 About {plan.travelMinutes} minutes estimated transfer time
                  </p>
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
                        {stop.local_business ? (
                          <span className="ml-2 rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                            Local
                          </span>
                        ) : null}
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
                  href={`/itinerary?${itineraryParams.toString()}`}
                  className="mt-8 block rounded-xl bg-[#4b2aad] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#3d228d]"
                >
                  View full plan
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
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
