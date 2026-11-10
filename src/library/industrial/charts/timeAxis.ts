/** Time-axis helpers shared by every industrial chart: tick positions, tick labels and span names. */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Tick spacings a time axis may use, smallest first. */
export const TIME_STEPS: readonly number[] = [
  MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
];

/** The smallest "round" spacing that puts at most `maxTicks` ticks between `from` and `to`. */
export function timeStep(from: number, to: number, maxTicks = 6): number {
  const span = Math.max(to - from, 0);
  const limit = Math.max(maxTicks, 1);
  return TIME_STEPS.find((step) => span / step <= limit) ?? TIME_STEPS[TIME_STEPS.length - 1];
}

/** Tick timestamps on whole multiples of the step (UTC), inside `from`–`to`. */
export function timeTicks(from: number, to: number, maxTicks = 6): number[] {
  if (!(to > from)) return [];
  const step = timeStep(from, to, maxTicks);
  const ticks: number[] = [];
  for (let tick = Math.ceil(from / step) * step; tick <= to; tick += step) ticks.push(tick);
  return ticks;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(kind: 'clock' | 'day' | 'dayTime', timeZone: string): Intl.DateTimeFormat {
  const key = `${kind}:${timeZone}`;
  const cached = formatters.get(key);
  if (cached) return cached;
  const options: Intl.DateTimeFormatOptions =
    kind === 'clock'
      ? { hour: '2-digit', minute: '2-digit' }
      : kind === 'day'
        ? { day: 'numeric', month: 'short' }
        : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  const created = new Intl.DateTimeFormat('en-GB', { ...options, timeZone });
  formatters.set(key, created);
  return created;
}

/** "14:00" */
export const formatClock = (timestamp: number, timeZone = 'UTC'): string => formatter('clock', timeZone).format(timestamp);
/** "12 Mar" */
export const formatDay = (timestamp: number, timeZone = 'UTC'): string => formatter('day', timeZone).format(timestamp);
/** "12 Mar, 14:00" */
export const formatDayTime = (timestamp: number, timeZone = 'UTC'): string =>
  formatter('dayTime', timeZone).format(timestamp);

/**
 * Label for an axis tick. Sub-day steps print the clock time and switch to the date on the tick
 * that falls on midnight, so a 24-hour axis says where the day changed; day steps print the date.
 */
export function tickFormatter(step: number, timeZone = 'UTC'): (timestamp: number) => string {
  return (timestamp) => {
    if (step >= DAY) return formatDay(timestamp, timeZone);
    const clock = formatClock(timestamp, timeZone);
    return clock === '00:00' ? formatDay(timestamp, timeZone) : clock;
  };
}

/** A span in its largest whole unit: "30 min", "8 h", "7 d". */
export function formatSpan(milliseconds: number): string {
  const span = Math.abs(milliseconds);
  if (span >= DAY && span % DAY === 0) return `${span / DAY} d`;
  if (span >= HOUR && span % HOUR === 0) return `${span / HOUR} h`;
  if (span >= HOUR) return `${Math.round((span / HOUR) * 10) / 10} h`;
  return `${Math.max(1, Math.round(span / MINUTE))} min`;
}

/** Offset from `now` as an axis label: "now", "−30 min", "−8 h", "+2 d". */
export function formatRelative(timestamp: number, now: number): string {
  const diff = timestamp - now;
  if (Math.abs(diff) < MINUTE / 2) return 'now';
  return `${diff < 0 ? '−' : '+'}${formatSpan(diff)}`;
}

/** "12 Mar, 06:00 – 14:00" within one day, "5 Mar, 14:00 – 12 Mar, 14:00" across days. */
export function formatRange(from: number, to: number, timeZone = 'UTC'): string {
  const sameDay = formatDay(from, timeZone) === formatDay(to, timeZone);
  const end = sameDay ? formatClock(to, timeZone) : formatDayTime(to, timeZone);
  return `${formatDayTime(from, timeZone)} – ${end}`;
}
