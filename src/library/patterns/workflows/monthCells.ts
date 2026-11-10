/** One day in a month grid. */
export type MonthCell = {
  /** ISO date, `2026-03-12`. */
  key: string;
  /** Day of the month. */
  day: number;
  /** False for the leading and trailing days that belong to the neighbouring months. */
  inMonth: boolean;
};

const DAY_MS = 86_400_000;

/**
 * The weeks of a month as rows of seven days, padded with the neighbouring months' days so every
 * row is full. `monthIndex` is zero-based; weeks start on Monday unless `weekStartsOn` says
 * otherwise (0 = Sunday). Uses UTC, so the result does not depend on the viewer's time zone.
 */
export function monthCells(year: number, monthIndex: number, weekStartsOn = 1): MonthCell[][] {
  const first = Date.UTC(year, monthIndex, 1);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const lead = (new Date(first).getUTCDay() - weekStartsOn + 7) % 7;
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;

  const weeks: MonthCell[][] = [];
  for (let index = 0; index < total; index += 1) {
    const date = new Date(first + (index - lead) * DAY_MS);
    if (index % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === ((monthIndex % 12) + 12) % 12,
    });
  }
  return weeks;
}
