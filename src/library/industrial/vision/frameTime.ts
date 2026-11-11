/** Time on the scrubber under a recorded frame, and the events marked on it. */

export type TimelineMark = { id: string; at: number; label: string };

/** Position of a time within a range, as a fraction (0–1). */
export function fractionOf(time: number, from: number, to: number): number {
  return to <= from ? 0 : Math.min(1, Math.max(0, (time - from) / (to - from)));
}

export function timeAtFraction(fraction: number, from: number, to: number): number {
  return Math.round(from + Math.min(1, Math.max(0, fraction)) * (to - from));
}

/** The mark nearest a time, within `tolerance` ms; `null` when none is that close. */
export function nearestMark(marks: readonly TimelineMark[], time: number, tolerance: number): TimelineMark | null {
  let best: TimelineMark | null = null;
  for (const mark of marks) {
    const distance = Math.abs(mark.at - time);
    if (distance <= tolerance && (!best || distance < Math.abs(best.at - time))) best = mark;
  }
  return best;
}

/** The next or previous mark after a time, for "next event" buttons. */
export function adjacentMark(marks: readonly TimelineMark[], time: number, direction: 1 | -1): TimelineMark | null {
  const sorted = [...marks].sort((a, b) => a.at - b.at);
  return (direction === 1 ? sorted.find((mark) => mark.at > time) : [...sorted].reverse().find((mark) => mark.at < time)) ?? null;
}

/** "14:02:30" from a UTC timestamp, for the frame overlay. */
export function clockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/** "12 Mar 2026 14:02:30" from a UTC timestamp. */
export function stamp(timestamp: number): string {
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${clockTime(timestamp)}`;
}
