/**
 * Display formatters for industrial data beyond single readings: compact numbers, percentages,
 * ranges, engineering notation, durations, dates with a zone, counts and money. They follow the
 * same conventions as `industrial/status.ts`: a real minus sign, a non-breaking space before the
 * unit and an em dash when there is no value. All of them are pure; "now" is always passed in.
 */

const NBSP = String.fromCharCode(0x00a0);
const MINUS = String.fromCharCode(0x2212);
const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function fixed(value: number, decimals: number): string {
  const text = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));
  const isZero = Number(text.replace(/,/g, '')) === 0;
  return value < 0 && !isZero ? `${MINUS}${text}` : text;
}

/**
 * Decimals that give a measurement about three significant digits: 182,400 and 412 show none,
 * 48.6 one, 6.82 two, 0.042 three. Use it when a sensor does not declare its own precision.
 */
export function decimalsForMagnitude(value: number): number {
  const size = Math.abs(value);
  if (!Number.isFinite(size) || size >= 100) return 0;
  if (size >= 10) return 1;
  if (size >= 1) return 2;
  return 3;
}

/** A measurement at about three significant digits: "182,400", "48.6", "6.82", "0.042". */
export function formatMeasurement(value: number | null | undefined): string {
  if (!isNumber(value)) return EM_DASH;
  return fixed(value, decimalsForMagnitude(value));
}

const COMPACT_STEPS = [
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
  { limit: 1e3, suffix: 'k' },
] as const;

/**
 * Abbreviates large counts for tiles and chart axes: "182k", "4.4M". Values under 1,000 are left
 * whole. Trailing ".0" is dropped. Not for tables, exports or anything a person will copy.
 */
export function formatCompact(value: number | null | undefined, decimals = 1): string {
  if (!isNumber(value)) return EM_DASH;
  const size = Math.abs(value);
  const step = COMPACT_STEPS.find((candidate) => size >= candidate.limit);
  if (!step) return fixed(value, 0);
  const scaled = fixed(value / step.limit, decimals).replace(/\.0+$/, '');
  return `${scaled}${step.suffix}`;
}

/** A percentage with a non-breaking space before the sign: "96.4 %". */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (!isNumber(value)) return EM_DASH;
  return `${fixed(value, decimals)}${NBSP}%`;
}

/** A share of a total as a percentage; an em dash when the total is zero. */
export function formatShare(part: number, total: number, decimals = 0): string {
  if (total === 0) return EM_DASH;
  return formatPercent((part / total) * 100, decimals);
}

/** A closed range with an en dash and the unit written once: "40–52 barg". */
export function formatRange(low: number, high: number, unit?: string, decimals = 0): string {
  const joiner = low < 0 || high < 0 ? ' to ' : EN_DASH;
  const text = `${fixed(low, decimals)}${joiner}${fixed(high, decimals)}`;
  return unit ? `${text}${NBSP}${unit}` : text;
}

const SI_PREFIXES = [
  { exponent: 9, prefix: 'G' },
  { exponent: 6, prefix: 'M' },
  { exponent: 3, prefix: 'k' },
  { exponent: 0, prefix: '' },
  { exponent: -3, prefix: 'm' },
  { exponent: -6, prefix: 'µ' },
] as const;

/**
 * Engineering notation: scales to the SI prefix that keeps 1–999 in front of the unit.
 * `formatEngineering(1250000, 'W')` is "1.25 MW"; `formatEngineering(0.0047, 'A')` is "4.70 mA".
 */
export function formatEngineering(value: number | null | undefined, unit: string, decimals = 2): string {
  if (!isNumber(value)) return EM_DASH;
  if (value === 0) return `0${NBSP}${unit}`;
  const size = Math.abs(value);
  const step =
    SI_PREFIXES.find((candidate) => size >= 10 ** candidate.exponent) ?? SI_PREFIXES[SI_PREFIXES.length - 1];
  return `${fixed(value / 10 ** step.exponent, decimals)}${NBSP}${step.prefix}${unit}`;
}

/**
 * A duration in its two largest units, abbreviated without periods: "45 s", "38 min",
 * "3 h 20 min", "2 d 4 h". Zero-valued second units are dropped: "2 h".
 */
export function formatDuration(ms: number | null | undefined): string {
  if (!isNumber(ms) || ms < 0) return EM_DASH;
  const part = (amount: number, unit: string) => `${amount}${NBSP}${unit}`;
  const join = (first: string, amount: number, unit: string) => (amount > 0 ? `${first} ${part(amount, unit)}` : first);

  if (ms < MINUTE) return part(Math.round(ms / SECOND), 's');
  if (ms < HOUR) return part(Math.round(ms / MINUTE), 'min');
  if (ms < DAY) {
    const minutes = Math.round(ms / MINUTE);
    return join(part(Math.floor(minutes / 60), 'h'), minutes % 60, 'min');
  }
  const hours = Math.round(ms / HOUR);
  return join(part(Math.floor(hours / 24), 'd'), hours % 24, 'h');
}

const DATE_WITH_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const TIME_24 = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const TIME_SECONDS = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
});

/** A written date with its year, in UTC: "12 Mar 2026". Never "12/03/2026" or "12th March". */
export function formatDateWithYear(timestamp: number): string {
  return DATE_WITH_YEAR.format(timestamp);
}

/** Date and time with the zone spelled out: "12 Mar 2026 at 14:00 UTC". */
export function formatDateTimeUtc(timestamp: number): string {
  return `${DATE_WITH_YEAR.format(timestamp)} at ${TIME_24.format(timestamp)}${NBSP}UTC`;
}

/** A sortable table timestamp, zone in the column header: "2026-03-12 13:46:00". */
export function formatTableTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (part: number) => String(part).padStart(2, '0');
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  return `${day} ${TIME_SECONDS.format(timestamp)}`;
}

/**
 * Relative up to 24 hours from `now` ("14 min ago", "5 h ago", "in 6 h"), absolute with the year
 * beyond that ("10 Mar 2026"). Recent events are judged by age; older ones are looked up by date.
 */
export function formatSmartTime(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const age = Math.abs(diff);
  if (age > DAY) return formatDateWithYear(timestamp);
  if (age < MINUTE) return 'Just now';
  const amount = age < HOUR ? `${Math.round(age / MINUTE)}${NBSP}min` : `${Math.round(age / HOUR)}${NBSP}h`;
  return diff >= 0 ? `${amount} ago` : `in ${amount}`;
}

/** A time span on one day, formatted the same at both ends: "06:00–14:00 UTC". */
export function formatTimeRange(start: number, end: number): string {
  return `${TIME_24.format(start)}${EN_DASH}${TIME_24.format(end)}${NBSP}UTC`;
}

/**
 * A count with the right noun: "1 alarm", "3 alarms", "0 alarms". Always a numeral, never
 * "alarm(s)". Pass `plural` for irregular nouns.
 */
export function formatCount(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${fixed(count, 0)} ${count === 1 ? singular : plural}`;
}

/**
 * Money as an ISO code and an amount: "USD 12,400". A code is unambiguous where "$" is not, and
 * it keeps the figure aligned in a column. Amounts are placeholders until a product sets a locale.
 */
export function formatAmount(value: number | null | undefined, currency = 'USD', decimals = 0): string {
  if (!isNumber(value)) return EM_DASH;
  return `${currency}${NBSP}${fixed(value, decimals)}`;
}
