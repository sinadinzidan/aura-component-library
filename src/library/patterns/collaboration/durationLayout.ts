const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type DurationPhase = {
  id: string;
  label: string;
  /** Start of the phase, epoch milliseconds. */
  start: number;
  /** End of the phase. Leave out for a phase that is still running; it is drawn up to `now`. */
  end?: number;
};

export type DurationBar = {
  id: string;
  label: string;
  /** Left edge as a percentage of the scale, 0–100. */
  offset: number;
  /** Width as a percentage of the scale. At least `minWidth`, so a short phase stays visible. */
  width: number;
  durationMs: number;
  ongoing: boolean;
};

/** "45 min", "2 h 15 min", "3 d 4 h". Seconds are dropped; anything under a minute is "< 1 min". */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  if (safe < MINUTE) return '< 1 min';
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/**
 * Places phases on one shared scale that runs from the earliest start to the latest end.
 * A phase without an end runs to `now`. An end before its start counts as zero length.
 */
export function layoutDurations(phases: readonly DurationPhase[], now: number, minWidth = 1): DurationBar[] {
  if (phases.length === 0) return [];
  const ends = phases.map((phase) => Math.max(phase.start, phase.end ?? now));
  const scaleStart = Math.min(...phases.map((phase) => phase.start));
  const scaleEnd = Math.max(...ends);
  const span = scaleEnd - scaleStart;

  return phases.map((phase, index) => {
    const durationMs = ends[index] - phase.start;
    const offset = span > 0 ? ((phase.start - scaleStart) / span) * 100 : 0;
    const rawWidth = span > 0 ? (durationMs / span) * 100 : 100;
    const width = Math.min(100 - Math.min(offset, 100 - minWidth), Math.max(minWidth, rawWidth));
    return {
      id: phase.id,
      label: phase.label,
      offset: Math.min(offset, 100 - minWidth),
      width,
      durationMs,
      ongoing: phase.end === undefined,
    };
  });
}
