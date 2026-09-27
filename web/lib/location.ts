const LOCATION_AREA_ALIASES: Record<string, string[]> = {
  soweto: [
    "Soweto",
    "Orlando West",
    "Orlando East",
    "Dube",
    "Jabavu",
    "Jabulani",
    "Mofolo North",
    "Dobsonville",
    "White City",
  ],
};

export function normaliseLocation(value: string) {
  return value.toLowerCase().trim().replace(/[-_\s]+/g, " ");
}

export function locationAreas(location?: string) {
  const value = location?.trim();
  if (!value || normaliseLocation(value) === "johannesburg") return [];

  return LOCATION_AREA_ALIASES[normaliseLocation(value)] ?? [value];
}

export function areaMatchesLocation(area: string, location: string) {
  const aliases = locationAreas(location);
  if (aliases.length === 0) return false;

  const normalisedArea = normaliseLocation(area);
  return aliases.some((alias) => normalisedArea === normaliseLocation(alias));
}
