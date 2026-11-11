/** Synthetic thermal imaging: a deterministic temperature field and the way it maps to heat-map steps. */

export type HeatSpot = {
  id: string;
  label: string;
  /** Centre in normalised frame coordinates. */
  x: number;
  y: number;
  /** Peak temperature in °C at the centre. */
  peak: number;
  /** Spread as a fraction of the frame width. */
  radius: number;
};

/** Number of colour steps the heat-map tokens provide. */
export const HEAT_STEPS = 4;

/** Temperature of the field at a point: the ambient level plus a Gaussian bump per hot spot. */
export function temperatureAt(point: { x: number; y: number }, spots: readonly HeatSpot[], ambient: number): number {
  let temperature = ambient;
  for (const spot of spots) {
    const distance = Math.hypot(point.x - spot.x, (point.y - spot.y) * (9 / 16));
    temperature = Math.max(temperature, ambient + (spot.peak - ambient) * Math.exp(-((distance / spot.radius) ** 2)));
  }
  return temperature;
}

/** Colour step (0 to `HEAT_STEPS` − 1) of a temperature on a scale. Out-of-range values clamp. */
export function heatStep(temperature: number, min: number, max: number): number {
  if (max <= min) return 0;
  const fraction = (temperature - min) / (max - min);
  return Math.min(HEAT_STEPS - 1, Math.max(0, Math.floor(fraction * HEAT_STEPS)));
}

/** The temperature field as rows of colour steps, row 0 at the top. */
export function thermalGrid(spots: readonly HeatSpot[], options: { columns: number; rows: number; ambient: number; min: number; max: number }): number[][] {
  const { columns, rows, ambient, min, max } = options;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => heatStep(temperatureAt({ x: (column + 0.5) / columns, y: (row + 0.5) / rows }, spots, ambient), min, max))
  );
}

/** The lower edge of each colour step, for printing a scale: [min, …, max]. */
export function scaleEdges(min: number, max: number): number[] {
  return Array.from({ length: HEAT_STEPS + 1 }, (_, index) => Math.round((min + ((max - min) * index) / HEAT_STEPS) * 10) / 10);
}

/** The hottest spot, for the automatic "max" readout; `null` without spots. */
export function hottestSpot(spots: readonly HeatSpot[]): HeatSpot | null {
  return spots.reduce<HeatSpot | null>((best, spot) => (!best || spot.peak > best.peak ? spot : best), null);
}
