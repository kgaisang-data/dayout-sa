"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SavePlanButtonProps = {
  title: string;
  plannerInput: Record<string, unknown>;
  plan: Record<string, unknown>;
};

export function SavePlanButton({ title, plannerInput, plan }: SavePlanButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave() {
    setStatus("saving");
    const supabase = createClient();

    // Guests must log in before saving
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      router.push(`/auth/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const { error } = await supabase.from("saved_plans").insert({
      title,
      planner_input: plannerInput,
      plan,
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
      return;
    }

    setStatus("saved");
  }

  if (status === "saved") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-2xl bg-teal-50 px-5 py-3 font-bold text-teal-700">
          ✓ Plan saved
        </span>
        <button
          onClick={() => router.push("/saved")}
          className="rounded-2xl border-2 border-[#4b2aad] px-5 py-3 font-bold text-[#4b2aad] hover:bg-purple-50"
        >
          View saved plans
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="rounded-2xl bg-[#4b2aad] px-6 py-3 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#3d228d] disabled:opacity-60"
      >
        {status === "saving" ? "Saving..." : "Save this plan"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">Could not save: {errorMessage}</p>
      )}
    </div>
  );
}