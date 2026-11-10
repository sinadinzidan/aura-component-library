export type MaskOptions = {
  /** Leading characters left readable, usually a non-secret prefix that says what kind of key it is. */
  visibleStart?: number;
  /** Trailing characters left readable, so people can tell two keys apart. */
  visibleEnd?: number;
  /** Number of mask characters. Fixed, so the mask does not leak the length of the secret. */
  maskLength?: number;
};

export const MASK_CHARACTER = '•';

/**
 * Masks a secret for display: an optional readable start and end around a fixed run of bullets.
 * A value too short to hide anything behind the readable parts is masked completely.
 */
export function maskSecret(value: string, { visibleStart = 0, visibleEnd = 4, maskLength = 8 }: MaskOptions = {}): string {
  const mask = MASK_CHARACTER.repeat(Math.max(0, maskLength));
  const start = Math.max(0, visibleStart);
  const end = Math.max(0, visibleEnd);

  if (value.length === 0) return '';
  if (value.length <= start + end) return mask;

  return `${value.slice(0, start)}${mask}${end > 0 ? value.slice(-end) : ''}`;
}
