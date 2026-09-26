// DayOut place types will be defined here.
export type Place = {
  id: string;
  name: string;
  category: string;
  estimated_cost: number;
  duration: number;
  vibes: string[];
  latitude: number;
  longitude: number;
  location: string;
  description?: string;
  opening_time?: string;
  closing_time?: string;
  indoor_outdoor?: string;
  image_url?: string;
};