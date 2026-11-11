export type ScaleBar = { km: number; /** Length of the bar in pixels. */ pixels: number; label: string };

/** The "nice" lengths a scale bar may have: 1, 2 or 5 times a power of ten. */
export function niceLengths(maxKm: number): number[] {
  const lengths: number[] = [];
  for (let power = -3; power <= 5; power += 1) {
    for (const base of [1, 2, 5]) {
      const km = base * 10 ** power;
      if (km <= maxKm) lengths.push(km);
    }
  }
  return lengths;
}

/** `500 m`, `2 km`, `1,000 km`. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('en-US')} km`;
}

/**
 * The longest round-numbered distance whose bar fits in `maxPixels`, given how many kilometres
 * one pixel covers at the latitude shown. Returns `null` when nothing sensible fits.
 */
export function scaleBar(kmPerPixel: number, maxPixels: number): ScaleBar | null {
  if (!(kmPerPixel > 0) || !Number.isFinite(kmPerPixel) || maxPixels <= 0) return null;
  const fitting = niceLengths(kmPerPixel * maxPixels);
  const km = fitting[fitting.length - 1];
  if (km === undefined) return null;
  return { km, pixels: km / kmPerPixel, label: formatDistance(km) };
}
