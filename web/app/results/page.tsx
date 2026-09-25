"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const plans = [
  {
    id: "local-easy",
    title: "Local & Easy",
    label: "Best Match",
    totalCost: 760,
    duration: "About 5 hours 30 minutes",
    travelTime: "About 45 minutes of travel",
    stops: [
      "Wits Art Museum",
      "Neighbourgoods Market",
      "44 Stanley",
      "Johannesburg Botanical Garden",
    ],
    reasons: [
      "Within an R800 group budget for four people",
      "Matches a Chill + Foodie day",
      "Includes local businesses and cultural experiences",
    ],
  },
  {
    id: "budget",
    title: "Best on a Budget",
    label: "Lowest-cost option",
    totalCost: 360,
    duration: "About 4 hours 45 minutes",
    travelTime: "About 35 minutes of travel",
    stops: [
      "Wits Art Museum",
      "Constitution Hill",
      "Affordable Braamfontein Lunch",
      "Zoo Lake",
    ],
    reasons: [
      "Prioritises free cultural attractions",
      "Keeps food and transport costs low",
      "Still provides a full Johannesburg day out",
    ],
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    label: "Something Different",
    totalCost: 720,
    duration: "About 5 hours 45 minutes",
    travelTime: "About 65 minutes of travel",
    stops: [
      "Victoria Yards",
      "Maboneng Precinct",
      "Soweto Local Food Experience",
      "Northcliff Ridge Eco Park",
    ],
    reasons: [
      "Prioritises local creative spaces and community experiences",
      "Supports small and independent tourism operators",
      "Designed for people who want to discover something different",
    ],
  },
];

function ResultsContent() {
  const searchParams = useSearchParams();

  const location = searchParams.get("location") ?? "Johannesburg";

  const budget = Math.max(
    0,
    Number(searchParams.get("budget") ?? 800)
  );

  const groupSize = Math.max(
    1,
    Number(searchParams.get("groupSize") ?? 4)
  );

  const time = Number(searchParams.get("time") ?? 360);

  const vibes = (searchParams.get("vibes") ?? "chill,foodie")
    .split(",")
    .map((vibe) => vibe.replaceAll("-", " "))
    .join(" + ");

  const availableTime =
    time === 180
      ? "About 3 hours"
      : time === 240
        ? "About 4 hours"
        : time === 480
          ? "About 8 hours"
          : "About 6 hours";

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
             {groupSize} people
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
             R{budget} total
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            ⏱ {availableTime}
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
             {vibes}
          </span>
        </div>

        <p className="mt-6 max-w-2xl text-slate-600">
          Here are three South African day-out options based on your Rand
          budget, group size, available time and vibe. Prices and availability
          are estimates for the Johannesburg pilot and should be confirmed
          before visiting.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const perPerson = (plan.totalCost / groupSize).toFixed(0);

            const isWithinBudget = plan.totalCost <= budget;

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
                    R{plan.totalCost}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    R{perPerson} per person
                  </p>
                </div>

                <p
                  className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    isWithinBudget
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {isWithinBudget
                    ? "✓ Within your budget"
                    : "Above your selected budget"}
                </p>

                <div className="mt-5 rounded-xl bg-purple-50 p-4 text-sm text-slate-600">
                  <p>⏱ {plan.duration}</p>
                  <p className="mt-2"> {plan.travelTime}</p>
                </div>

                <div className="mt-5">
                  <p className="font-semibold text-slate-900">Your stops</p>

                  <ol className="mt-3 space-y-2 text-sm text-slate-600">
                    {plan.stops.map((stop, index) => (
                      <li key={stop}>
                        <span className="mr-2 font-semibold text-[#4b2aad]">
                          {index + 1}.
                        </span>
                        {stop}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-5">
                  <p className="font-semibold text-slate-900">
                    Why it works
                  </p>

                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {plan.reasons.map((reason) => (
                      <li key={reason}>✓ {reason}</li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/itinerary?id=${plan.id}&groupSize=${groupSize}`}
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