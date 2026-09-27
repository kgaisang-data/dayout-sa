"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { SavePlanButton } from "@/components/save-plan-button";
import { createGoogleMapsRouteUrl } from "@/lib/maps/google-maps";
import {
  buildStopTimes,
  calculatePlanMetrics,
  findSwapAlternative,
  formatMinutes,
  PLAN_META,
  TRANSFER_MINUTES,
} from "@/lib/recommendation-engine";
import type { RecommendedPlan, PlanType } from "@/types/itinerary";
import type { Place } from "@/types/place";
import type { PlannerPreferences } from "@/types/planner";

const PLAN_IDS: PlanType[] = ["local-easy", "budget", "hidden-gems"];

function safeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ItineraryContent() {
  const searchParams = useSearchParams();

  const rawPlanId = searchParams.get("id") ?? "local-easy";
  const planId: PlanType = PLAN_IDS.includes(rawPlanId as PlanType)
    ? (rawPlanId as PlanType)
    : "local-easy";

  const location = searchParams.get("location") ?? "Johannesburg";
  const budget = Math.max(100, safeNumber(searchParams.get("budget"), 800));
  const groupSize = Math.max(
    1,
    Math.round(safeNumber(searchParams.get("groupSize"), 4))
  );
  const availableMinutes = Math.max(
    60,
    safeNumber(searchParams.get("time"), 360)
  );
  const rawVibes = searchParams.get("vibes") ?? "chill,foodie";
  const vibes = useMemo(
    () =>
      rawVibes
        .split(",")
        .map((vibe: string) => vibe.trim())
        .filter(Boolean),
    [rawVibes]
  );
  const placeIdsParam = searchParams.get("places") ?? "";

  const preferences: PlannerPreferences = useMemo(
    () => ({
      location,
      budget,
      groupSize,
      availableMinutes,
      vibes,
    }),
    [location, budget, groupSize, availableMinutes, vibes]
  );

  const [stops, setStops] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
  let cancelled = false;
  async function loadItinerary() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const requestedIds = placeIdsParam
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);

      let selectedStops: Place[] = [];

      // If the results page supplied exact place IDs,
      // load those same places for the itinerary.
      if (requestedIds.length > 0) {
        const response = await fetch(
          `/api/places?ids=${encodeURIComponent(
            requestedIds.join(",")
          )}`
        );

        const data = (await response.json()) as {
          places?: Place[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Could not load this itinerary."
          );
        }

        const returnedPlaces = data.places ?? [];

        // Preserve the exact order from the Results page.
        selectedStops = requestedIds
          .map((id) =>
            returnedPlaces.find(
              (place) => place.id === id
            )
          )
          .filter(
            (place): place is Place =>
              Boolean(place)
          );

        if (
          selectedStops.length > 0 &&
          selectedStops.length <
            requestedIds.length
        ) {
          setMessage(
            "One stop is no longer available, so this plan shows the remaining active places."
          );
        }
      }

      // Support older itinerary links that do not contain
      // the selected place IDs.
      if (selectedStops.length === 0) {
        const response = await fetch(
          "/api/recommendations",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              preferences
            ),
          }
        );

        const data =
          (await response.json()) as {
            plans?: RecommendedPlan[];
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Could not rebuild this itinerary."
          );
        }

        selectedStops =
          data.plans?.find(
            (plan) =>
              plan.id === planId
          )?.stops ?? [];
      }

      if (selectedStops.length === 0) {
        throw new Error(
          "This DayOut no longer has enough active places. Please create a new plan."
        );
      }

      // Load all active places for the Swap feature.
      const allPlacesResponse =
        await fetch("/api/places");

      const allPlacesData =
        (await allPlacesResponse.json()) as {
          places?: Place[];
          error?: string;
        };

      if (!allPlacesResponse.ok) {
        throw new Error(
          allPlacesData.error ??
            "Could not load DayOut places."
        );
      }

      if (cancelled) {
        return;
      }

      setStops(selectedStops);
      setAllPlaces(
        allPlacesData.places ?? []
      );
    } catch (loadError) {
      if (cancelled) {
        return;
      }

      console.error(
        "Could not load itinerary:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load this DayOut."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadItinerary();

  return () => {
    cancelled = true;
  };
}, [placeIdsParam, planId, preferences]);

  const metrics = useMemo(
    () => calculatePlanMetrics(stops, groupSize),
    [stops, groupSize]
  );
  const stopTimes = useMemo(() => buildStopTimes(stops), [stops]);
  const mapsUrl = useMemo(() => createGoogleMapsRouteUrl(stops), [stops]);
  const selectedPlan = PLAN_META[planId];

  const resultsParams = new URLSearchParams({
    location,
    budget: String(budget),
    groupSize: String(groupSize),
    time: String(availableMinutes),
    vibes: rawVibes,
  });

  function updateSharedUrl(nextStops: Place[]) {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("places", nextStops.map((stop) => stop.id).join(","));
    window.history.replaceState(null, "", `/itinerary?${params.toString()}`);
  }

  function swapStop(index: number) {
    const replacement = findSwapAlternative(
      index,
      stops,
      allPlaces,
      preferences
    );

    if (!replacement) {
      setMessage(
        "We could not find another active place that keeps this plan within your budget and time."
      );
      return;
    }

    const currentName = stops[index]?.name ?? "That stop";
    const updatedStops = [...stops];
    updatedStops[index] = replacement;

    setStops(updatedStops);
    updateSharedUrl(updatedStops);
    setMessage(`${currentName} was swapped for ${replacement.name}.`);
  }

  async function sharePlan() {
    const shareText = `Check out my ${selectedPlan.title} DayOut plan!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My DayOut plan",
          text: shareText,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setMessage("Plan link copied. You can now paste it into WhatsApp.");
    } catch {
      setMessage("Sharing was cancelled or could not be completed.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
        <p className="text-lg font-semibold text-[#4b2aad]">
          Building your DayOut plan...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#4b2aad]">
            We could not load this DayOut
          </h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <Link
            href={`/results?${resultsParams.toString()}`}
            className="mt-6 inline-block rounded-xl bg-[#4b2aad] px-5 py-3 font-semibold text-white"
          >
            Back to options
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/results?${resultsParams.toString()}`}
          className="text-sm font-semibold text-[#4b2aad] hover:underline"
        >
          ← Back to all options
        </Link>

        <section className="mt-8 rounded-3xl bg-[#4b2aad] p-7 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            {selectedPlan.label}
          </p>

          <h1 className="mt-2 text-4xl font-bold">{selectedPlan.title}</h1>

          <p className="mt-3 max-w-2xl text-purple-100">
            {selectedPlan.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-4 py-2">
              👥 {groupSize} people
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              💸 R{metrics.totalCost.toFixed(0)} total
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              💰 R{metrics.costPerPerson.toFixed(0)} per person
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              ⏱ About {formatMinutes(metrics.durationMinutes)}
            </span>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <SavePlanButton
            title={selectedPlan.title}
            plannerInput={{
              location,
              budget,
              groupSize,
              availableMinutes,
              vibes,
            }}
            plan={{
              planId,
              title: selectedPlan.title,
              stops,
              totalCost: metrics.totalCost,
              costPerPerson: metrics.costPerPerson,
              durationMinutes: metrics.durationMinutes,
              totalTravelMinutes: metrics.travelMinutes,
            }}
          />

          <button
            onClick={sharePlan}
            className="rounded-xl bg-[#ff7a1a] px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Share this plan
          </button>

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#4b2aad] px-5 py-3 font-semibold text-[#4b2aad] transition hover:bg-purple-100"
            >
              Open route in Google Maps
            </a>
          ) : null}

          <Link
            href="/plan"
            className="rounded-xl border border-[#4b2aad] px-5 py-3 font-semibold text-[#4b2aad] transition hover:bg-purple-100"
          >
            Create another plan
          </Link>
        </div>

        {message ? (
          <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800">
            {message}
          </p>
        ) : null}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                Your timeline
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#4b2aad]">
                Your day, step by step
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              🚗 About {metrics.travelMinutes} minutes estimated transfer time
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {stops.map((stop, index) => (
              <div key={stop.id}>
                {index > 0 ? (
                  <div className="ml-7 flex items-center gap-3 py-3 text-sm text-slate-500">
                    <div className="h-7 border-l-2 border-dashed border-orange-300" />
                    🚗 Estimated transfer: {TRANSFER_MINUTES} minutes
                  </div>
                ) : null}

                <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-[#4b2aad]">
                        {stopTimes[index]}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">
                            {stop.name}
                          </h3>

                          {stop.local_business ? (
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                              Local business
                            </span>
                          ) : null}

                          {stop.hidden_gem ? (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-[#4b2aad]">
                              Hidden gem
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm font-medium text-[#4b2aad]">
                          {stop.category} · {stop.area}
                        </p>

                        <p className="mt-2 text-slate-600">{stop.description}</p>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          Estimated venue cost: R
                          {Number(stop.estimated_cost_per_person).toFixed(0)} per person
                        </p>

                        {stop.source_url ? (
                          <a
                            href={stop.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-[#4b2aad] hover:underline"
                          >
                            Check venue source ↗
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <button
                      onClick={() => swapStop(index)}
                      className="h-fit rounded-xl border border-[#4b2aad] px-4 py-2 text-sm font-semibold text-[#4b2aad] transition hover:bg-purple-100"
                    >
                      Swap this stop
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-purple-50 p-6">
          <h2 className="text-xl font-bold text-[#4b2aad]">
            Why this plan works
          </h2>

          <ul className="mt-4 space-y-2 text-slate-700">
            <li>✓ Built around your group size, total budget and available time.</li>
            <li>✓ Uses active places from the Johannesburg pilot database.</li>
            <li>✓ Gives extra visibility to local businesses where they fit your preferences.</li>
            <li>✓ Swaps stay within your original budget and time limits.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="font-bold text-[#4b2aad]">Before you go</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            DayOut is a local discovery and Street Economy planning prototype.
            Venue prices, opening hours and the {TRANSFER_MINUTES}-minute transfer
            allowance are estimates for the Johannesburg pilot. Transport is not
            included in the venue-cost total, so confirm venue details and your route
            before travelling.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6 text-slate-900">
          <p className="text-lg font-semibold text-[#4b2aad]">
            Building your DayOut plan...
          </p>
        </main>
      }
    >
      <ItineraryContent />
    </Suspense>
  );
}
