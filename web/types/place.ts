export type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  area: string;
  estimated_cost_per_person: number;
  duration_minutes: number;
  vibes: string[];
  local_business: boolean;
  hidden_gem: boolean;
};
