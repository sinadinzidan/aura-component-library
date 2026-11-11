export type YearPoint = {
  id: string;
  /** Short axis label, for example `Mar`. */
  label: string;
  /** Full name for assistive technology, for example `March 2026`. */
  name: string;
  value: number;
  /** A second axis line under the label, for example the year where it changes. */
  group?: string;
  /** Marks the point with a number; the page explains the numbers beside the chart. */
  annotated?: boolean;
};

/** The number each annotated point carries, in reading order. */
export function annotationNumbers(points: readonly YearPoint[]): Map<string, number> {
  return new Map(points.filter((point) => point.annotated).map((point, index) => [point.id, index + 1]));
}
