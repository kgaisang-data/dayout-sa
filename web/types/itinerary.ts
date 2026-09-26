import type { Place } from "./place";

export type RecommendedPlan = {
  id: string;
  title: string;
  label: string;
  /** Places in the order they will be visited. */
  stops: Place[];
  /** Total estimated cost for the group, in Rand. */
  totalCost: number;
  /** Estimated cost per person, in Rand. */
  costPerPerson: number;
  /** Total duration in minutes, including estimated travel. */
  duration: number;
  /** Estimated travel time between stops, in minutes. */
  travelTime: number;
  reasons: string[];
  /** Group budget remaining after the total cost, in Rand. */
  remainingBudget: number;
  score?: number;
};
