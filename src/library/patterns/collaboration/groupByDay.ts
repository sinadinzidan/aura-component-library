const DAY_MS = 24 * 60 * 60 * 1000;

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const LONG = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export type DayGroup<Item> = {
  /** UTC date of the group, `YYYY-MM-DD`. Stable enough to use as a React key. */
  key: string;
  /** "Today", "Yesterday" or a date such as "10 Mar". */
  label: string;
  items: Item[];
};

function dayStart(timestamp: number): number {
  return Math.floor(timestamp / DAY_MS) * DAY_MS;
}

/** "Today", "Yesterday", "10 Mar", or "28 Dec 2025" when the year differs from `now`. Days are UTC. */
export function dayLabel(timestamp: number, now: number): string {
  const days = Math.round((dayStart(now) - dayStart(timestamp)) / DAY_MS);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const sameYear = new Date(timestamp).getUTCFullYear() === new Date(now).getUTCFullYear();
  return (sameYear ? SHORT : LONG).format(timestamp);
}

/**
 * Splits a feed into consecutive runs of the same UTC day, keeping the order it was given in.
 * `now` is passed in so the labels never depend on the clock.
 */
export function groupByDay<Item>(
  items: readonly Item[],
  getTime: (item: Item) => number,
  now: number
): DayGroup<Item>[] {
  const groups: DayGroup<Item>[] = [];
  for (const item of items) {
    const timestamp = getTime(item);
    const key = new Date(dayStart(timestamp)).toISOString().slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(timestamp, now), items: [item] });
  }
  return groups;
}
