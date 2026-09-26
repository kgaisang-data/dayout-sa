"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type TestPlace = {
  name: string;
  area: string;
  estimated_cost_per_person: number;
};

export default function SupabaseTestPage() {
  const [places, setPlaces] = useState<TestPlace[]>([]);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    async function loadPlaces() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        setMessage("Missing Supabase values in .env.local");
        return;
      }

      const supabase = createClient(url, key);

      const { data, error } = await supabase
        .from("places")
        .select("name, area, estimated_cost_per_person")
        .order("name");

      if (error) {
        setMessage("Error: " + error.message);
        return;
      }

      setPlaces(data ?? []);
      setMessage(data && data.length > 0 ? "" : "Connected, but no places found");
    }

    loadPlaces();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Supabase test</h1>

      {message && <p className="mt-4">{message}</p>}

      <ul className="mt-4 space-y-2">
        {places.map((place) => (
          <li key={place.name}>
            {place.name} · {place.area} · R{place.estimated_cost_per_person}
          </li>
        ))}
      </ul>
    </main>
  );
}