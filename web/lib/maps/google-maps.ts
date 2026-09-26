import type { Place } from "@/types/place";

function placeLabel(place: Place) {
  return `${place.name}, ${place.area}, Johannesburg, South Africa`;
}

export function createGoogleMapsRouteUrl(stops: Place[]) {
  if (stops.length < 2) return null;

  const origin = placeLabel(stops[0]);
  const destination = placeLabel(stops[stops.length - 1]);
  const middleStops = stops.slice(1, -1);

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });

  if (middleStops.length > 0) {
    params.set("waypoints", middleStops.map(placeLabel).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
