const UNITS = ['B', 'kB', 'MB', 'GB', 'TB'] as const;

/**
 * A file size people can compare at a glance: decimal units (1 MB = 1,000 kB, as file systems
 * and CDF report them), one decimal below 100 and none from 100 up, so "2.4 MB" and "318 kB"
 * take the same width in a column. Sizes that are not a number show the placeholder.
 */
export function formatBytes(bytes: number, placeholder: string = '—'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return placeholder;
  if (bytes < 1000) return `${Math.round(bytes)} B`;

  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  // 999.95 kB would round up to "1000 kB"; move it to the next unit instead.
  if (value >= 999.5 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const text = value >= 100 ? String(Math.round(value)) : value.toFixed(1);
  return `${text} ${UNITS[unit]}`;
}
