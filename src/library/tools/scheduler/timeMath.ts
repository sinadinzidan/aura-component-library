/** Time maths for a calendar scheduler. Times are minutes from midnight; days are ISO dates. */

/** Events snap to this many minutes. */
export const SLOT = 15;
export const DAY_MINUTES = 24 * 60;

export type TimeWindow = { start: number; end: number };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to the nearest slot (or down / up). */
export function snapMinutes(minutes: number, mode: 'round' | 'floor' | 'ceil' = 'round', slot: number = SLOT): number {
  const steps = minutes / slot;
  const snapped = mode === 'floor' ? Math.floor(steps) : mode === 'ceil' ? Math.ceil(steps) : Math.round(steps);
  return snapped * slot;
}

/** The time under a pointer: `y` within a body of `height` that shows `window`, snapped and kept inside it. */
export function pointerToMinutes(y: number, body: { top: number; height: number }, window: TimeWindow, mode: 'round' | 'floor' | 'ceil' = 'round'): number {
  if (body.height <= 0) return window.start;
  const fraction = clamp((y - body.top) / body.height, 0, 1);
  return clamp(snapMinutes(window.start + fraction * (window.end - window.start), mode), window.start, window.end);
}

/** The same without snapping, for the offset between a grab point and the start of an event. */
export function pointerToRawMinutes(y: number, body: { top: number; height: number }, window: TimeWindow): number {
  if (body.height <= 0) return window.start;
  return window.start + clamp((y - body.top) / body.height, 0, 1) * (window.end - window.start);
}

/** "08:30" for 510. */
export function formatClock(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}

/** "08:30–10:00". */
export function formatSpan(start: number, end: number): string {
  return `${formatClock(start)}–${formatClock(end)}`;
}

/** "45 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Minutes for "08:30" (or "8:30"); `null` when it is not a time of day. */
export function parseClock(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseDay(dayId: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayId);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Day of the week, 0 for Sunday, for an ISO date; `null` when it is not one. */
export function weekdayOf(dayId: string): number | null {
  return parseDay(dayId)?.getUTCDay() ?? null;
}

/** "Thursday" for 2026-03-12. */
export function weekdayName(dayId: string): string {
  const day = weekdayOf(dayId);
  return day === null ? dayId : WEEKDAYS[day];
}

/** "Thu 12" for 2026-03-12. */
export function shortDayLabel(dayId: string): string {
  const date = parseDay(dayId);
  return date ? `${WEEKDAYS[date.getUTCDay()].slice(0, 3)} ${date.getUTCDate()}` : dayId;
}

/** "Thursday 12 March" for 2026-03-12. */
export function longDayLabel(dayId: string): string {
  const date = parseDay(dayId);
  return date ? `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}` : dayId;
}

/** The ISO date `count` days after `dayId`. */
export function addDays(dayId: string, count: number): string {
  const date = parseDay(dayId);
  if (!date) return dayId;
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** Seven consecutive days starting at `firstDayId`. */
export function weekFrom(firstDayId: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(firstDayId, index));
}
