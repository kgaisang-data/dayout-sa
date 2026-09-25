"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const vibeOptions = [
  "Chill",
  "Foodie",
  "Artsy",
  "Outdoors",
  "Adventurous",
  "Romantic",
  "Family",
  "Nightlife",
  "Hidden Gems",
];

export default function PlanPage() {
  const router = useRouter();

  const [location, setLocation] = useState("Johannesburg");
  const [budget, setBudget] = useState("800");
  const [groupSize, setGroupSize] = useState("4");
  const [time, setTime] = useState("360");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([
    "Chill",
    "Foodie",
  ]);

  function toggleVibe(vibe: string) {
    setSelectedVibes((currentVibes) =>
      currentVibes.includes(vibe)
        ? currentVibes.filter((selectedVibe) => selectedVibe !== vibe)
        : [...currentVibes, vibe]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedVibes.length === 0) {
      alert("Please choose at least one vibe.");
      return;
    }

    const params = new URLSearchParams({
      location,
      budget,
      groupSize,
      time,
      vibes: selectedVibes.join(",").toLowerCase().replaceAll(" ", "-"),
    });

    router.push(`/results?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#4b2aad] hover:underline"
        >
          ← Back to DayOut
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
          DayOut planner
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#4b2aad]">
          Build your day
        </h1>

        <p className="mt-3 text-slate-600">
          Tell us your budget, people, time and vibe. We will create a plan
          you can actually follow today.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
        >
          <label className="block">
            <span className="font-semibold">Where are you starting?</span>

            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
            >
              <option>Johannesburg</option>
              <option>Braamfontein</option>
              <option>Maboneng</option>
              <option>Newtown</option>
              <option>Rosebank</option>
              <option>Melville</option>
              <option>Soweto</option>
            </select>
          </label>

          <label className="block">
            <span className="font-semibold">Total group budget (R)</span>

            <input
              type="number"
              min="100"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              required
            />
          </label>

          <label className="block">
            <span className="font-semibold">How many people are going?</span>

            <input
              type="number"
              min="1"
              max="20"
              value={groupSize}
              onChange={(event) => setGroupSize(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              required
            />
          </label>

          <label className="block">
            <span className="font-semibold">How much time do you have?</span>

            <select
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
            >
              <option value="180">About 3 hours</option>
              <option value="240">About 4 hours</option>
              <option value="360">About 6 hours</option>
              <option value="480">Full day — about 8 hours</option>
            </select>
          </label>

          <div>
            <p className="font-semibold">What is the vibe?</p>

            <p className="mt-1 text-sm text-slate-500">
              Choose one or two options.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {vibeOptions.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);

                return (
                  <button
                    type="button"
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "bg-[#4b2aad] text-white"
                        : "bg-purple-50 text-[#4b2aad] hover:bg-purple-100"
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#ff7a1a] px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Build my DayOut
          </button>
        </form>
      </div>
    </main>
  );
}