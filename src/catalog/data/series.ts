/** Deterministic time-series generation, so every specimen renders the same on every load. */

export type SeriesPoint = { t: number; v: number };

/** Fixed "now" for all mock data: 12 March 2026, 14:00 UTC. Never use `Date.now()` in specimens. */
export const REFERENCE_NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Small seeded PRNG (mulberry32). Returns numbers in [0, 1). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeriesOptions = {
  seed: number;
  points: number;
  /** Value the series moves around. */
  base: number;
  /** Size of the slow daily-style wave. */
  amplitude?: number;
  /** Size of the random walk step. */
  noise?: number;
  /** Total drift from first to last point. */
  drift?: number;
  /** Number of full waves across the series. */
  cycles?: number;
  /** Timestamp of the last point. */
  end?: number;
  stepMs?: number;
  /** Clamp range. */
  min?: number;
  max?: number;
  decimals?: number;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** A smooth, plausible sensor trend: wave + drift + bounded random walk. */
export function makeSeries(options: SeriesOptions): SeriesPoint[] {
  const {
    seed,
    points,
    base,
    amplitude = 0,
    noise = 0,
    drift = 0,
    cycles = 1,
    end = REFERENCE_NOW,
    stepMs = HOUR,
    min = -Infinity,
    max = Infinity,
    decimals = 1,
  } = options;
  const random = createRandom(seed);
  const last = Math.max(points - 1, 1);
  let walk = 0;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / last;
    walk = walk * 0.85 + (random() - 0.5) * 2 * noise;
    const wave = Math.sin(progress * cycles * Math.PI * 2) * amplitude;
    const value = Math.min(max, Math.max(min, base + wave + drift * progress + walk));
    return { t: end - (points - 1 - index) * stepMs, v: round(value, decimals) };
  });
}

/** Just the values, for sparklines. */
export function makeValues(options: SeriesOptions): number[] {
  return makeSeries(options).map((point) => point.v);
}

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export const formatTime = (timestamp: number): string => TIME.format(timestamp);
export const formatDate = (timestamp: number): string => DATE.format(timestamp);
export const formatDateTime = (timestamp: number): string => DATE_TIME.format(timestamp);

/** "12 min ago", "3 h ago", "2 d ago" relative to the fixed reference time. */
export function formatAgo(timestamp: number, now: number = REFERENCE_NOW): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))} min ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)} h ago`;
  return `${Math.round(diff / DAY)} d ago`;
}
