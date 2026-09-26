"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";

type SavedPlan = {
  id: string;
  title: string;
  created_at: string;
};

export default function SavedPlansPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [message, setMessage] = useState("Loading your plans...");

  useEffect(() => {
    async function loadPlans() {
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? null);

      const { data, error } = await supabase
        .from("saved_plans")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Error: " + error.message);
        return;
      }

      setPlans(data ?? []);
      setMessage(data && data.length > 0 ? "" : "No saved plans yet.");
    }

    loadPlans();
  }, []);

  async function deletePlan(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("saved_plans").delete().eq("id", id);

    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }

    const remaining = plans.filter((plan) => plan.id !== id);
    setPlans(remaining);
    if (remaining.length === 0) setMessage("No saved plans yet.");
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-6 py-10 text-[#141e46]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-[#4b2aad]">
            ← Back to DayOut
          </Link>
          <LogoutButton />
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
          Your account
        </p>
        <h1 className="mt-2 text-4xl font-black text-[#4b2aad]">Saved plans</h1>
        {email && <p className="mt-2 text-slate-600">Signed in as {email}</p>}

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
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="flex items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-xl font-black">{plan.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saved {new Date(plan.created_at).toLocaleDateString("en-ZA")}
                </p>
              </div>
              <button
                onClick={() => deletePlan(plan.id)}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}