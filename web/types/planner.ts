export type PlannerPreferences = {
  location: string;
  budget: number;
  groupSize: number;
  availableMinutes: number;
  vibes: string[];
};

// Backwards-compatible alias used by a few existing files.
export type PlannerInput = PlannerPreferences;
