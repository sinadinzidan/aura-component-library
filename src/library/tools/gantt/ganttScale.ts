/**
 * Dates and geometry of a Gantt time grid. A day is a whole number: days since 1 January 1970 in
 * UTC, so a plan is plain integers and never depends on the viewer's time zone.
 */

export const MS_PER_DAY = 86_400_000;

export type GanttZoom = 'day' | 'week' | 'month';

/** Pixels per day at each zoom level. */
export const PX_PER_DAY: Record<GanttZoom, number> = { day: 40, week: 16, month: 5 };

export const ZOOM_ORDER: readonly GanttZoom[] = ['day', 'week', 'month'];

export const dayFromTimestamp = (timestamp: number): number => Math.floor(timestamp / MS_PER_DAY);

export const dayFromDate = (year: number, month: number, date: number): number => Math.round(Date.UTC(year, month - 1, date) / MS_PER_DAY);

const toDate = (day: number): Date => new Date(day * MS_PER_DAY);

/** 0 is Monday, 6 is Sunday. */
export const weekdayOf = (day: number): number => (toDate(day).getUTCDay() + 6) % 7;

export const isWeekend = (day: number): boolean => weekdayOf(day) >= 5;

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const MONTH_SHORT = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

export const formatDay = (day: number): string => SHORT.format(toDate(day));
export const formatWeekday = (day: number): string => WEEKDAY.format(toDate(day));
export const dayOfMonth = (day: number): number => toDate(day).getUTCDate();
export const monthStart = (day: number): number => day - dayOfMonth(day) + 1;
export const daysInMonth = (day: number): number => new Date(Date.UTC(toDate(day).getUTCFullYear(), toDate(day).getUTCMonth() + 1, 0)).getUTCDate();

/** Start day of the week (Monday) containing a day. */
export const weekStart = (day: number): number => day - weekdayOf(day);

/** "5 Mar to 9 Mar": an inclusive range as shown to people. The end is the last day worked. */
export function formatRange(start: number, duration: number): string {
  if (duration <= 1) return formatDay(start);
  return `${formatDay(start)} to ${formatDay(start + duration - 1)}`;
}

export const formatDuration = (duration: number): string => (duration === 0 ? 'Milestone' : `${duration} ${duration === 1 ? 'day' : 'days'}`);

export type GanttScale = { origin: number; pxPerDay: number };

export const createScale = (origin: number, zoom: GanttZoom): GanttScale => ({ origin, pxPerDay: PX_PER_DAY[zoom] });

export const dayToX = (scale: GanttScale, day: number): number => (day - scale.origin) * scale.pxPerDay;

/** The day a pixel offset falls on, rounded to the nearest day boundary. */
export const xToDay = (scale: GanttScale, x: number): number => scale.origin + Math.round(x / scale.pxPerDay);

/** Whole days a pixel distance covers, rounded: what a drag snaps to. */
export const pxToDays = (scale: GanttScale, px: number): number => Math.round(px / scale.pxPerDay);

export const spanWidth = (scale: GanttScale, days: number): number => days * scale.pxPerDay;

export type HeaderCell = { key: string; label: string; from: number; to: number };

/**
 * The two header rows of the time grid for a range of days (the end is exclusive). Day zoom shows
 * months over days; week zoom months over week starts; month zoom years over months.
 */
export function headerCells(zoom: GanttZoom, from: number, to: number): { top: HeaderCell[]; bottom: HeaderCell[] } {
  const top: HeaderCell[] = [];
  const bottom: HeaderCell[] = [];
  if (zoom === 'month') {
    for (let start = monthStart(from); start < to; start += daysInMonth(start)) {
      const end = start + daysInMonth(start);
      bottom.push({ key: `m${start}`, label: MONTH_SHORT.format(toDate(start)), from: start, to: end });
      const year = String(toDate(start).getUTCFullYear());
      const last = top[top.length - 1];
      if (last && last.label === year) last.to = end;
      else top.push({ key: `y${start}`, label: year, from: start, to: end });
    }
    return { top, bottom };
  }
  for (let start = monthStart(from); start < to; start += daysInMonth(start)) {
    top.push({ key: `m${start}`, label: MONTH.format(toDate(start)), from: start, to: start + daysInMonth(start) });
  }
  if (zoom === 'day') {
    for (let day = from; day < to; day += 1) bottom.push({ key: `d${day}`, label: String(dayOfMonth(day)), from: day, to: day + 1 });
  } else {
    for (let start = weekStart(from); start < to; start += 7) bottom.push({ key: `w${start}`, label: String(dayOfMonth(start)), from: start, to: start + 7 });
  }
  return { top, bottom };
}

/** Weekend days in a range, as runs of one or two days, for the shaded columns. */
export function weekendRuns(from: number, to: number): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = [];
  for (let day = from; day < to; day += 1) {
    if (weekdayOf(day) !== 5) continue;
    runs.push({ from: day, to: Math.min(to, day + 2) });
  }
  if (from < to && weekdayOf(from) === 6) runs.unshift({ from, to: from + 1 });
  return runs;
}

export type Point = { x: number; y: number };

/**
 * A finish-to-start connector as an elbow: out of the end of the predecessor, down or up to the
 * row of the successor and into its start. When the successor starts before the predecessor
 * ends the connector loops under the predecessor so the conflict stays visible.
 */
export function elbowPath(from: Point, to: Point, rowHeight: number, gap = 8): string {
  if (to.x >= from.x + gap * 2) return `M ${from.x} ${from.y} H ${from.x + gap} V ${to.y} H ${to.x}`;
  const midY = from.y + (to.y >= from.y ? rowHeight / 2 : -rowHeight / 2);
  return `M ${from.x} ${from.y} H ${from.x + gap} V ${midY} H ${to.x - gap} V ${to.y} H ${to.x}`;
}
