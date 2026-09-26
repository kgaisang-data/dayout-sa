// DayOut itinerary types will be defined here.
import type { Place } from "./place";

export type RecommendedPlan = {
  id: string;
  title: string;
  label?: string;
  totalCost: number;
  costPerPerson: number;
  duration: number;
  travelTime: number;
  stops: Place[];
  remainingBudget: number;
  reasons?: string[];
  score?: number;
};