"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";

type SavedPlan = {
  id: string;
  title: string;
  created_at: string;
  planner_input: Record<string, unknown> | null;
  plan: Record<string, unknown> | null;
};

function buildSavedPlanHref(saved: SavedPlan) {
  const planner = saved.planner_input ?? {};
  const plan = saved.plan ?? {};
  const stops = Array.isArray(plan.stops) ? plan.stops : [];

  const placeIds = stops
    .map((stop) => {
      if (!stop || typeof stop !== "object") return null;
      const value = (stop as Record<string, unknown>).id;
      return typeof value === "string" ? value : null;
    })
    .filter((id): id is string => Boolean(id));

  if (placeIds.length === 0) return null;

  const vibes = Array.isArray(planner.vibes)
    ? planner.vibes.filter((value): value is string => typeof value === "string")
    : [];

  const planId = typeof plan.planId === "string" ? plan.planId : "local-easy";
  const location = typeof planner.location === "string" ? planner.location : "Johannesburg";
  const budget = Number(planner.budget ?? 800);
  const groupSize = Number(planner.groupSize ?? 1);
  const availableMinutes = Number(planner.availableMinutes ?? 360);

  const params = new URLSearchParams({
    id: planId,
    location,
    budget: String(Number.isFinite(budget) ? budget : 800),
    groupSize: String(Number.isFinite(groupSize) ? groupSize : 1),
    time: String(Number.isFinite(availableMinutes) ? availableMinutes : 360),
    vibes: vibes.join(","),
    places: placeIds.join(","),
  });

  return `/itinerary?${params.toString()}`;
}

export default function SavedPlansPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [message, setMessage] = useState("Loading your saved DayOuts...");

  useEffect(() => {
    async function loadPlans() {
      const supabase = createClient();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData.user;

      if (userError || !user) {
        setMessage("Please sign in to view your saved DayOuts.");
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("saved_plans")
        .select("id, title, created_at, planner_input, plan")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load saved plans:", error.message);
        setMessage("We could not load your saved DayOuts right now.");
        return;
      }

      setPlans((data ?? []) as SavedPlan[]);
      setMessage(data && data.length > 0 ? "" : "No saved DayOuts yet.");
    }

    loadPlans();
  }, []);

  async function deletePlan(id: string) {
    const confirmed = window.confirm("Delete this saved DayOut?");
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("saved_plans").delete().eq("id", id);

    if (error) {
      alert("Could not delete this DayOut.");
      return;
    }

    const remaining = plans.filter((plan) => plan.id !== id);
    setPlans(remaining);
    if (remaining.length === 0) setMessage("No saved DayOuts yet.");
  }

  const legacyCount = useMemo(
    () => plans.filter((plan) => !buildSavedPlanHref(plan)).length,
    [plans]
  );

  return (
    <main className="min-h-screen bg-[#fff8f1] px-6 py-10 text-[#141e46]">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-[#4b2aad]">
            ← Back to DayOut
          </Link>
          <LogoutButton />
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
          Your account
        </p>
        <h1 className="mt-2 text-4xl font-black text-[#4b2aad]">Saved DayOuts</h1>
        {email && <p className="mt-2 text-slate-600">Signed in as {email}</p>}

        {legacyCount > 0 ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            {legacyCount} older saved plan{legacyCount === 1 ? "" : "s"} came from the early prototype and cannot be reopened, but can still be deleted.
          </p>
        ) : null}

        {message && (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-lg text-slate-600">{message}</p>
            <Link
              href="/plan"
              className="mt-5 inline-block rounded-2xl bg-[#ff7a1a] px-6 py-3 font-bold text-white"
            >
              Plan a DayOut →
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {plans.map((plan) => {
            const href = buildSavedPlanHref(plan);

            return (
              <article
                key={plan.id}
                className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center"
              >
                <div>
                  <h2 className="text-xl font-black">{plan.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Saved {new Date(plan.created_at).toLocaleDateString("en-ZA")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className="rounded-xl bg-[#4b2aad] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d228d]"
                    >
                      Open plan
                    </Link>
                  ) : null}

                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
