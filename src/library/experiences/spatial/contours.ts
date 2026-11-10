/** Pure path maths for the flowing contour backdrop. Units are SVG user units. */

export type ContourOptions = {
  width: number;
  height: number;
  /** Number of lines stacked top to bottom. */
  count: number;
  /** Peak displacement of a line, as a fraction of the gap between lines. */
  amplitude?: number;
  /** Full waves across the width. */
  cycles?: number;
  /** Horizontal distance between sampled points. */
  step?: number;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Height of line `index` at `x`: its resting row plus two sine waves whose phase drifts per line. */
export function contourY(index: number, x: number, { width, height, count, amplitude = 1.4, cycles = 1.5 }: ContourOptions): number {
  const gap = height / count;
  const rest = (index + 0.5) * gap;
  const t = width > 0 ? x / width : 0;
  const swell = Math.sin(2 * Math.PI * (t * cycles + index * 0.11));
  const ripple = Math.sin(2 * Math.PI * (t * cycles * 2.3 + index * 0.37)) * 0.35;
  return round1(rest + (swell + ripple) * gap * amplitude);
}

/** One contour line as an SVG path running the full width. */
export function contourPath(index: number, options: ContourOptions): string {
  const step = options.step && options.step > 0 ? options.step : 40;
  const commands: string[] = [];
  for (let x = 0; x < options.width; x += step) {
    commands.push(`${commands.length === 0 ? 'M' : 'L'} ${round1(x)} ${contourY(index, x, options)}`);
  }
  commands.push(`${commands.length === 0 ? 'M' : 'L'} ${round1(options.width)} ${contourY(index, options.width, options)}`);
  return commands.join(' ');
}

/** Every line of the field, top to bottom. */
export function contourPaths(options: ContourOptions): string[] {
  return Array.from({ length: Math.max(0, Math.floor(options.count)) }, (_, index) => contourPath(index, options));
}
