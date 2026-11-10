import { formatClock, formatSpan } from './timeAxis';

export type LiveStatus = {
  live: boolean;
  /** Timestamp of the newest datapoint on screen. */
  lastUpdated: number;
  now: number;
  interval?: string;
  timeZone?: string;
};

/** "Updated 14:00, every 5 s" while live; "Paused at 13:42, 18 min behind" while paused. */
export function liveStatusText({ live, lastUpdated, now, interval, timeZone = 'UTC' }: LiveStatus): string {
  const time = formatClock(lastUpdated, timeZone);
  if (live) return `Updated ${time}${interval ? `, ${interval}` : ''}`;
  const behind = now - lastUpdated;
  return `Paused at ${time}${behind >= 60_000 ? `, ${formatSpan(behind)} behind` : ''}`;
}
