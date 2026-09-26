export type PlannerInput = {
  location: string;
  budget: number;
  groupSize: number;
  availableHours: number;
  vibes: string[];
};

export type PlannerPreferences = PlannerInput;