import type { Place } from "@/types/place";

export type PlanType = "local-easy" | "budget" | "hidden-gems";

export type RecommendedPlan = {
  id: PlanType;
  title: string;
  label: string;
  totalCost: number;
  costPerPerson: number;
  durationMinutes: number;
  travelMinutes: number;
  remainingBudget: number;
  stops: Place[];
  reasons: string[];
};
