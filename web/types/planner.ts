export type PlannerPreferences = {
  location: string;
  budget: number;
  groupSize: number;
  availableMinutes: number;
  vibes: string[];
};

// The existing recommendation API still accepts hours at its boundary.
export type PlannerInput = Omit<PlannerPreferences, "availableMinutes"> & {
  availableHours: number;
};
