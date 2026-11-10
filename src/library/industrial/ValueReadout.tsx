import { cn } from '../../lib/utils';

import { TONE_VALUE_TEXT, UNIT_TEXT, formatValue } from './status';
import type { Tone } from './status';

export type ValueReadoutSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ValueReadoutProps = {
  /** `null` renders an em dash. */
  value: number | null;
  unit?: string;
  decimals?: number;
  size?: ValueReadoutSize;
  /** Colours the number. Leave neutral unless the value itself is in an abnormal state. */
  tone?: Tone;
  /** Unit under the number instead of beside it, for gauge centres. */
  stacked?: boolean;
  className?: string;
};

const VALUE_SIZE: Record<ValueReadoutSize, string> = {
  xs: 'text-sm font-medium',
  sm: 'text-base font-semibold',
  md: 'text-2xl font-semibold tracking-tight',
  lg: 'text-3xl font-semibold tracking-tight',
  xl: 'text-5xl font-semibold tracking-tight',
};

const UNIT_SIZE: Record<ValueReadoutSize, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
};

/**
 * The number-and-unit pair every industrial component shows: tabular figures, fixed decimals,
 * a quieter unit. Use it wherever a measurement is printed so readouts line up across a screen.
 */
export function ValueReadout({
  value,
  unit,
  decimals = 0,
  size = 'md',
  tone = 'neutral',
  stacked = false,
  className,
}: ValueReadoutProps) {
  const hasValue = value !== null && Number.isFinite(value);

  return (
    <span
      data-slot="value-readout"
      className={cn(
        'inline-flex whitespace-nowrap leading-none',
        stacked ? 'flex-col items-center gap-1' : 'items-baseline gap-1',
        className
      )}
    >
      <span
        data-slot="value"
        className={cn('tabular-nums leading-none', VALUE_SIZE[size], hasValue ? TONE_VALUE_TEXT[tone] : 'text-muted-foreground')}
      >
        {formatValue(value, decimals)}
      </span>
      {unit ? (
        <span data-slot="unit" className={cn('leading-none', UNIT_TEXT, UNIT_SIZE[size])}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
