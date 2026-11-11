import { niceTicks } from '../charts/stats';

export type Domain = readonly [number, number];

/** Maps data values to percent of a plot area. `y` is inverted: the top of the plot is 0. */
export type PlotScale = { x: (value: number) => number; y: (value: number) => number };

/** Position of a value in a domain, as 0–100. A zero-width domain maps everything to 0. */
export function toPercent(value: number, domain: Domain): number {
  const span = domain[1] - domain[0];
  return span === 0 ? 0 : ((value - domain[0]) / span) * 100;
}

export function makePlotScale(xDomain: Domain, yDomain: Domain): PlotScale {
  return { x: (value) => toPercent(value, xDomain), y: (value) => 100 - toPercent(value, yDomain) };
}

const trim = (value: number): number => Math.round(value * 100) / 100;

/** The `points` attribute of a polyline through the given data points. */
export function polylinePoints(xs: readonly number[], ys: readonly number[], scale: PlotScale): string {
  const count = Math.min(xs.length, ys.length);
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) parts.push(`${trim(scale.x(xs[index]))},${trim(scale.y(ys[index]))}`);
  return parts.join(' ');
}

/** A closed area between the line and the bottom of the plot, as a `points` attribute. */
export function areaPoints(xs: readonly number[], ys: readonly number[], scale: PlotScale, baseline: number): string {
  const count = Math.min(xs.length, ys.length);
  if (count === 0) return '';
  return `${trim(scale.x(xs[0]))},${trim(scale.y(baseline))} ${polylinePoints(xs, ys, scale)} ${trim(scale.x(xs[count - 1]))},${trim(scale.y(baseline))}`;
}

/** Round tick values inside a domain. */
export function ticksIn(domain: Domain): number[] {
  return niceTicks(domain[0], domain[1]).filter((tick) => tick >= domain[0] - 1e-9 && tick <= domain[1] + 1e-9);
}

/** A round upper bound a little above the largest value, so peaks do not touch the frame. */
export function niceCeiling(value: number, headroom = 1.15): number {
  if (!(value > 0)) return 1;
  const target = value * headroom;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => candidate * magnitude >= target - 1e-12) ?? 10;
  return step * magnitude;
}
