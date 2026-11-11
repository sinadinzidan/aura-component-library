export type ParetoItem = { label: string; value: number };

export type ParetoRow = ParetoItem & {
  /** Share of the total, percent. */
  share: number;
  /** Running share including this row, percent. */
  cumulative: number;
  /** Part of the "vital few": the rows needed to reach the threshold. */
  vital: boolean;
};

/** Sorts largest first and adds each row's share, running share and whether it is one of the vital few. */
export function paretoRows(items: readonly ParetoItem[], threshold = 80): ParetoRow[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0) || 1;
  let running = 0;
  return sorted.map((item) => {
    const before = (running / total) * 100;
    running += item.value;
    return { ...item, share: (item.value / total) * 100, cumulative: (running / total) * 100, vital: before < threshold };
  });
}

/** Largest absolute value, rounded up to a round step, so a diverging axis is symmetric and tidy. */
export function symmetricExtent(values: readonly number[], step: number): number {
  const largest = Math.max(...values.map((value) => Math.abs(value)), step);
  return Math.ceil(largest / step - 1e-9) * step;
}

export type CalendarDay = {
  day: number;
  /** Missing for a day without data yet. */
  value?: number;
};

/** Leading blanks plus days, cut into weeks of seven cells. `firstWeekday` is 0 for Monday. */
export function calendarWeeks(days: readonly CalendarDay[], firstWeekday: number): Array<Array<CalendarDay | null>> {
  const cells: Array<CalendarDay | null> = [...Array.from({ length: firstWeekday }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}
