import { cn } from '../../../lib/utils';
import { toFraction } from '../../industrial/geometry';
import { formatReading } from '../../industrial/status';

import { NEON_TEXT, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { METER_EMPTY, textMeter } from './textCharts';

export type TextMeterProps = {
  value: number | null;
  /** What is measured, for assistive technology. */
  label: string;
  min?: number;
  max?: number;
  /** Width in character cells. */
  width?: number;
  unit?: string;
  decimals?: number;
  tone?: NeonTone;
  className?: string;
};

/**
 * A bar meter made of block characters, one per cell: solid for the filled part, a shaded cell
 * for a half step and light shade for the rest. A real `meter` underneath, so the value is
 * announced; the characters are decoration. For text-mode screens and dense monospaced tables.
 */
export function TextMeter({ value, label, min = 0, max = 100, width = 10, unit, decimals = 0, tone = 'accent', className }: TextMeterProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const bar = textMeter(hasValue ? toFraction(value, min, max) : 0, width);
  const emptyFrom = bar.indexOf(METER_EMPTY) === -1 ? bar.length : bar.indexOf(METER_EMPTY);

  return (
    <span
      data-slot="text-meter"
      data-tone={tone}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={hasValue ? value : undefined}
      aria-valuetext={hasValue ? formatReading(value, unit, decimals) : 'No data'}
      className={cn(NEON_TONE[tone], 'inline-block whitespace-pre font-mono leading-none', className)}
    >
      <span aria-hidden="true" data-slot="text-meter-fill" className={NEON_TEXT}>
        {bar.slice(0, emptyFrom)}
      </span>
      <span aria-hidden="true" data-slot="text-meter-rest" className="text-[color:color-mix(in_oklab,var(--neon)_35%,transparent)]">
        {bar.slice(emptyFrom)}
      </span>
    </span>
  );
}
