/**
 * Clock arithmetic for a mission ring: a window of the day drawn as one full turn, with the
 * elapsed part filled and milestones placed by their time. Times are minutes since midnight.
 */

export type MissionWindow = { start: number; end: number; now: number };

export type ArcSpan = { start: number; end: number; mid: number };

/** Share of the window that has passed, clamped to 0–1. */
export function elapsedShare(window: MissionWindow): number {
  const length = window.end - window.start || 1;
  return Math.min(1, Math.max(0, (window.now - window.start) / length));
}

/** Angle of a time on the ring: the window start sits at twelve o'clock. */
export function clockAngle(minute: number, window: MissionWindow): number {
  const length = window.end - window.start || 1;
  return Math.min(1, Math.max(0, (minute - window.start) / length)) * 360;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** `14:00` from minutes since midnight. */
export function formatClock(minute: number): string {
  return `${pad(Math.floor(minute / 60) % 24)}:${pad(minute % 60)}`;
}

/** Mission elapsed time, `T+ 08:00`, or `T− 01:30` before the start. */
export function formatElapsed(window: MissionWindow): string {
  const minutes = window.now - window.start;
  const size = Math.abs(minutes);
  return `T${minutes < 0 ? '−' : '+'} ${pad(Math.floor(size / 60))}:${pad(size % 60)}`;
}

/** A duration in words: `2 h 00 min`, `45 min`. */
export function formatDuration(minutes: number): string {
  const size = Math.max(0, Math.round(minutes));
  return size < 60 ? `${size} min` : `${Math.floor(size / 60)} h ${pad(size % 60)} min`;
}

/** Splits a full turn into `count` equal arcs separated by `gap` degrees. */
export function arcSpans(count: number, gap: number): ArcSpan[] {
  const step = 360 / Math.max(count, 1);
  return Array.from({ length: count }, (_, index) => ({
    start: index * step + gap / 2,
    end: (index + 1) * step - gap / 2,
    mid: (index + 0.5) * step,
  }));
}
