import { DISTRICT_COORDINATES } from "./districts";

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

/** Find the nearest Singapore district name for a given lat/lng. */
export function nearestDistrict(lat: number, lng: number): string {
  let best = "";
  let bestDist = Infinity;
  for (const [name, c] of Object.entries(DISTRICT_COORDINATES)) {
    const dLat = lat - c.lat;
    const dLng = lng - c.lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

/**
 * Geocode a Singapore postal code using OneMap API (free, no key required).
 */
export async function geocodeSingaporePostalCode(
  postalCode: string
): Promise<GeocodeResult | null> {
  const cleaned = postalCode.trim();
  if (!/^\d{6}$/.test(cleaned)) return null;

  try {
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${cleaned}&returnGeom=Y&getAddrDetails=Y`
    );
    const data = await res.json();
    if (data.found > 0) {
      const result = data.results[0];
      return {
        lat: parseFloat(result.LATITUDE),
        lng: parseFloat(result.LONGITUDE),
        address: result.ADDRESS || cleaned,
      };
    }
    return null;
  } catch {
    return null;
  }
}
