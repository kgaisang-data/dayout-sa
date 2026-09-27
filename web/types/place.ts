export type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  estimated_cost_per_person: number;
  duration_minutes: number;
  vibes: string[];
  opening_hours: Record<string, string> | null;
  indoor: boolean;
  local_business: boolean;
  hidden_gem: boolean;
  image_url: string | null;
  source_url: string | null;
  last_verified: string | null;
};
