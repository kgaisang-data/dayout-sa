"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Stop = {
  time: string;
  name: string;
  category: string;
  description: string;
  estimatedCostPerPerson: number;
  travelMinutes: number;
  localBusiness: boolean;
};

const planDetails: Record<
  string,
  {
    title: string;
    label: string;
    duration: string;
    description: string;
    stops: Stop[];
  }
> = {
  "local-easy": {
    title: "Local & Easy",
    label: "Best Match",
    duration: "About 5 hours 30 minutes",
    description:
      "A relaxed Johannesburg Chill + Foodie route with culture, local food and an outdoor stop.",
    stops: [
      {
        time: "10:30",
        name: "Wits Art Museum",
        category: "Culture",
        description:
          "Start the day with an accessible art and culture experience in Braamfontein.",
        estimatedCostPerPerson: 0,
        travelMinutes: 0,
        localBusiness: false,
      },
      {
        time: "12:00",
        name: "Neighbourgoods Market",
        category: "Food",
        description:
          "Explore local food vendors, creative stalls and a relaxed market atmosphere.",
        estimatedCostPerPerson: 90,
        travelMinutes: 10,
        localBusiness: true,
      },
      {
        time: "14:00",
        name: "44 Stanley",
        category: "Food",
        description:
          "Choose an independent café or restaurant in a walkable design and food precinct.",
        estimatedCostPerPerson: 100,
        travelMinutes: 15,
        localBusiness: true,
      },
      {
        time: "15:30",
        name: "Johannesburg Botanical Garden",
        category: "Outdoors",
        description:
          "Finish with a low-cost outdoor walk, picnic or relaxed scenic stop.",
        estimatedCostPerPerson: 0,
        travelMinutes: 20,
        localBusiness: false,
      },
    ],
  },

  budget: {
    title: "Best on a Budget",
    label: "Lowest-cost option",
    duration: "About 4 hours 45 minutes",
    description:
      "A low-cost Johannesburg route using free cultural attractions, public spaces and affordable local food.",
    stops: [
      {
        time: "11:00",
        name: "Wits Art Museum",
        category: "Culture",
        description:
          "Start with a free public art and culture experience in Braamfontein.",
        estimatedCostPerPerson: 0,
        travelMinutes: 0,
        localBusiness: false,
      },
      {
        time: "12:00",
        name: "Constitution Hill",
        category: "Culture",
        description:
          "Visit a meaningful Johannesburg heritage site and explore the public spaces.",
        estimatedCostPerPerson: 0,
        travelMinutes: 10,
        localBusiness: false,
      },
      {
        time: "13:30",
        name: "Affordable Braamfontein Lunch",
        category: "Food",
        description:
          "Choose a budget-friendly local meal or takeaway option near the city centre.",
        estimatedCostPerPerson: 90,
        travelMinutes: 10,
        localBusiness: true,
      },
      {
        time: "15:00",
        name: "Zoo Lake",
        category: "Outdoors",
        description:
          "Finish with a relaxed walk, picnic or outdoor group stop at Zoo Lake.",
        estimatedCostPerPerson: 0,
        travelMinutes: 15,
        localBusiness: false,
      },
    ],
  },

  "hidden-gems": {
    title: "Hidden Gems",
    label: "Something Different",
    duration: "About 5 hours 45 minutes",
    description:
      "A Johannesburg discovery route designed to surface independent creative spaces, local food and lesser-known views.",
    stops: [
      {
        time: "10:30",
        name: "Victoria Yards",
        category: "Culture",
        description:
          "Begin at a community-focused creative space with studios, makers and local art.",
        estimatedCostPerPerson: 0,
        travelMinutes: 0,
        localBusiness: true,
      },
      {
        time: "12:00",
        name: "Maboneng Precinct",
        category: "Culture",
        description:
          "Explore street art, creative spaces, independent shops and local Johannesburg energy.",
        estimatedCostPerPerson: 50,
        travelMinutes: 20,
        localBusiness: true,
      },
      {
        time: "14:00",
        name: "Soweto Local Food Experience",
        category: "Food",
        description:
          "Try a community-based food stop chosen to highlight township flavours and local hospitality.",
        estimatedCostPerPerson: 130,
        travelMinutes: 20,
        localBusiness: true,
      },
      {
        time: "15:45",
        name: "Northcliff Ridge Eco Park",
        category: "Outdoors",
        description:
          "End the day with a scenic outdoor viewpoint and wide views of Johannesburg.",
        estimatedCostPerPerson: 0,
        travelMinutes: 25,
        localBusiness: false,
      },
    ],
  },
};

const replacementStops: Record<string, Stop> = {
  Coffee: {
    time: "10:30",
    name: "Alternative local coffee stop",
    category: "Coffee",
    description: "A nearby replacement that keeps the same relaxed start.",
    estimatedCostPerPerson: 65,
    travelMinutes: 0,
    localBusiness: true,
  },

  Culture: {
    time: "12:00",
    name: "Alternative creative space",
    category: "Culture",
    description: "A nearby cultural experience with a similar vibe.",
    estimatedCostPerPerson: 60,
    travelMinutes: 15,
    localBusiness: true,
  },

  Food: {
    time: "14:00",
    name: "Alternative local lunch",
    category: "Food",
    description:
      "A budget-friendly food option that keeps the plan practical.",
    estimatedCostPerPerson: 120,
    travelMinutes: 10,
    localBusiness: true,
  },

  Outdoors: {
    time: "15:30",
    name: "Alternative scenic spot",
    category: "Outdoors",
    description: "A nearby relaxed outdoor alternative.",
    estimatedCostPerPerson: 0,
    travelMinutes: 10,
    localBusiness: false,
  },
};

function ItineraryContent() {
  const searchParams = useSearchParams();

  const planId = searchParams.get("id") ?? "local-easy";

  const groupSize = Math.max(
    1,
    Number(searchParams.get("groupSize") ?? 4)
  );

  const selectedPlan = planDetails[planId] ?? planDetails["local-easy"];

  const [stops, setStops] = useState<Stop[]>(selectedPlan.stops);

  const [message, setMessage] = useState("");

  const totalCost = stops.reduce(
    (total, stop) => total + stop.estimatedCostPerPerson * groupSize,
    0
  );

  const totalTravelMinutes = stops.reduce(
    (total, stop) => total + stop.travelMinutes,
    0
  );

  function swapStop(index: number) {
    const currentStop = stops[index];

    const replacement = replacementStops[currentStop.category];

    if (!replacement) {
      setMessage("No alternative stop is available yet.");
      return;
    }

    const updatedStops = [...stops];

    updatedStops[index] = {
      ...replacement,
      time: currentStop.time,
    };

    setStops(updatedStops);

    setMessage(`${currentStop.name} was swapped successfully.`);
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

  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/results"
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
              💸 R{totalCost.toFixed(0)} total
            </span>

            <span className="rounded-full bg-white/15 px-4 py-2">
              💰 R{(totalCost / groupSize).toFixed(0)} per person
            </span>

            <span className="rounded-full bg-white/15 px-4 py-2">
              ⏱ {selectedPlan.duration}
            </span>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={sharePlan}
            className="rounded-xl bg-[#ff7a1a] px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Share this plan
          </button>

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
              🚗 About {totalTravelMinutes} minutes of travel
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {stops.map((stop, index) => (
              <div key={`${stop.name}-${index}`}>
                {index > 0 ? (
                  <div className="ml-7 flex items-center gap-3 py-3 text-sm text-slate-500">
                    <div className="h-7 border-l-2 border-dashed border-orange-300" />
                    🚗 Travel time: {stop.travelMinutes} minutes
                  </div>
                ) : null}

                <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-[#4b2aad]">
                        {stop.time}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">
                            {stop.name}
                          </h3>

                          {stop.localBusiness ? (
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                              Local business
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm font-medium text-[#4b2aad]">
                          {stop.category}
                        </p>

                        <p className="mt-2 text-slate-600">
                          {stop.description}
                        </p>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          Estimated cost: R{stop.estimatedCostPerPerson} per
                          person
                        </p>
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
            <li>✓ Built around your group size and total budget.</li>
            <li>✓ Stops are arranged in a practical day-out sequence.</li>
            <li>✓ Includes local businesses and tourism experiences.</li>
            <li>
              ✓ Costs and travel times are estimates for this hackathon demo.
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="font-bold text-[#4b2aad]">Before you go</h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            DayOut is a South African tourism discovery tool. Costs, opening
            hours, travel times and availability are estimates for the
            Johannesburg pilot. Confirm venue details before travelling and
            plan transport in advance.
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