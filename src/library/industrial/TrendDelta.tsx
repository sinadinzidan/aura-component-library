import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@cognite/aura/icons';

import { cn } from '../../lib/utils';

import { NBSP, TONE_TEXT, computeDelta, deltaTone, formatDelta } from './status';
import type { GoodDirection } from './status';

export type TrendDeltaProps = {
  value: number;
  /** What the value is compared with: the previous period or a target. */
  reference: number;
  /** `absolute` shows the difference in the value's unit; `percent` shows relative change. */
  format?: 'absolute' | 'percent';
  decimals?: number;
  /** Unit after an absolute change. Percent changes always show "%". */
  unit?: string;
  /** Which direction is good news. Leave out for a neutral change with no judgement. */
  goodDirection?: GoodDirection;
  /** What the change is against, e.g. "vs yesterday". */
  caption?: string;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Arrow and signed change against a previous value or target. `goodDirection` decides whether a
 * rise is good (availability) or bad (flaring), so the colour always means "better" or "worse".
 */
export function TrendDelta({
  value,
  reference,
  format = 'absolute',
  decimals = 1,
  unit,
  goodDirection,
  caption,
  size = 'sm',
  className,
}: TrendDeltaProps) {
  const delta = computeDelta(value, reference, format);
  const text = formatDelta(delta, decimals);
  const rounded = delta === null || Number(text.replace(/[^0-9.]/g, '')) === 0 ? 0 : delta;
  const tone = deltaTone(rounded, goodDirection);
  const Icon = rounded > 0 ? IconArrowUpRight : rounded < 0 ? IconArrowDownRight : IconMinus;
  const direction = rounded > 0 ? 'Up' : rounded < 0 ? 'Down' : 'No change';
  const shownUnit = format === 'percent' ? '%' : unit;

  return (
    <span
      data-slot="trend-delta"
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap tabular-nums',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      <span className={cn('inline-flex items-center gap-0.5 font-medium', TONE_TEXT[tone])}>
        <Icon aria-hidden className={size === 'sm' ? 'size-3.5' : 'size-4'} />
        <span className="sr-only">{direction} </span>
        {text}
        {shownUnit && delta !== null ? `${NBSP}${shownUnit}` : null}
      </span>
      {caption ? <span className="text-muted-foreground">{caption}</span> : null}
    </span>
  );
}
