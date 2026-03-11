const METERS_TO_MILES = 0.000621371;

/**
 * Get road distance between two GPS points using OSRM public API.
 * Returns distance in miles, or null if the request fails.
 */
export async function getRoadDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<{ miles: number; durationMinutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      miles: route.distance * METERS_TO_MILES,
      durationMinutes: route.duration / 60,
    };
  } catch {
    return null;
  }
}

/**
 * Haversine straight-line distance as fallback (miles).
 */
export function straightLineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
