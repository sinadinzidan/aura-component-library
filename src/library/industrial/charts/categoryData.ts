/** Row and series shapes of `CategoryChart`, and the arithmetic that sizes its value axis. */

/** One category: its name under `categoryKey` plus a number, a `[from, to]` pair or `null` per series key. */
export type CategoryRow = Record<string, string | number | null | readonly [number, number]>;

export type CategorySeries = {
  key: string;
  label: string;
  /** A chart colour token. Defaults to `chartSeriesColor(position)`. */
  color?: string;
  /** `bar` for amounts per category; `line`, `step` and `area` for targets, plans and running totals. */
  type?: 'bar' | 'line' | 'step' | 'area';
  /** Bars with the same stack id are stacked. */
  stack?: string;
  dashed?: boolean;
  axis?: 'left' | 'right';
  /** Leave the series out of the legend, e.g. a helper series. */
  hideFromLegend?: boolean;
};

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPair(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1]);
}

/** Every number a set of series contributes to an axis, with stacked bars summed per row. */
export function categoryValues(rows: readonly CategoryRow[], series: readonly CategorySeries[]): number[] {
  const result: number[] = [];
  for (const row of rows) {
    const stacks = new Map<string, { positive: number; negative: number }>();
    for (const entry of series) {
      const value = row[entry.key];
      if (isPair(value)) result.push(value[0], value[1]);
      if (!isNumber(value)) continue;
      if ((entry.type ?? 'bar') === 'bar' && entry.stack) {
        const total = stacks.get(entry.stack) ?? { positive: 0, negative: 0 };
        if (value >= 0) total.positive += value;
        else total.negative += value;
        stacks.set(entry.stack, total);
      } else {
        result.push(value);
      }
    }
    for (const total of stacks.values()) result.push(total.positive, total.negative);
  }
  return result;
}
