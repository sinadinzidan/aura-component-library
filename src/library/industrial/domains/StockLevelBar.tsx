import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, TONE_MARK_BG_SOFT, formatReading, formatValue } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { availableStock, stockStatus } from './inventory';
import type { StockLevels } from './inventory';

export type StockLevelBarProps = StockLevels & {
  /** The item, e.g. "Mechanical seal, export pump". */
  label: string;
  unit?: string;
  decimals?: number;
  /** Quantity promised to work orders; drawn as the lighter end of the bar. */
  reserved?: number;
  /** Label, state and quantity above the bar. Turn off in table cells that already show them. */
  showHeader?: boolean;
  /** Min, reorder and max values under their ticks. */
  showScale?: boolean;
  className?: string;
};

const percent = (fraction: number): string => `${fraction * 100}%`;

/**
 * Stock on hand against its minimum, reorder point and maximum. The bar stays the neutral data
 * colour while stock is in range and takes a status colour, with the state in words, once it
 * reaches the reorder point or drops below the minimum.
 */
export function StockLevelBar({
  label,
  onHand,
  min,
  reorderPoint,
  max,
  unit,
  decimals = 0,
  reserved = 0,
  showHeader = true,
  showScale = true,
  className,
}: StockLevelBarProps) {
  const status = stockStatus({ onHand, min, reorderPoint, max });
  const scaleMax = Math.max(max, onHand) * 1.12 || 1;
  const available = availableStock(onHand, reserved);
  const ticks = [
    { key: 'min', word: 'Min', value: min },
    { key: 'reorder', word: 'Reorder', value: reorderPoint },
    { key: 'max', word: 'Max', value: max },
  ];
  const name = `${label}: ${formatReading(onHand, unit, decimals)} on hand, ${status.label.toLowerCase()}; minimum ${formatValue(min, decimals)}, reorder point ${formatValue(
    reorderPoint,
    decimals
  )}, maximum ${formatValue(max, decimals)}${reserved > 0 ? `, ${formatValue(reserved, decimals)} reserved` : ''}`;

  return (
    <div data-slot="stock-level-bar" data-tone={status.tone} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {showHeader ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
          <span className="flex shrink-0 items-baseline gap-3">
            {status.tone === 'neutral' ? null : <StatusIndicator size="sm" {...status} />}
            <ValueReadout size="xs" value={onHand} unit={unit} decimals={decimals} tone={status.tone === 'info' ? 'neutral' : status.tone} />
          </span>
        </div>
      ) : null}

      <div role="img" aria-label={name} className="relative">
        <div data-slot="stock-track" className="flex h-2 overflow-hidden rounded-full bg-chart-neutral-100">
          <span data-slot="stock-available" className={cn('h-full', TONE_MARK_BG[status.tone])} style={{ width: percent(toFraction(available, 0, scaleMax)) }} />
          {reserved > 0 ? (
            <span
              data-slot="stock-reserved"
              className={cn('h-full', TONE_MARK_BG_SOFT[status.tone])}
              style={{ width: percent(toFraction(onHand, 0, scaleMax) - toFraction(available, 0, scaleMax)) }}
            />
          ) : null}
        </div>
        {ticks.map((tick) => (
          <span
            key={tick.key}
            data-slot="stock-tick"
            data-tick={tick.key}
            className="absolute -top-1 h-4 w-px bg-base-foreground"
            style={{ left: percent(toFraction(tick.value, 0, scaleMax)) }}
          />
        ))}
      </div>

      {showScale ? (
        <div aria-hidden="true" className={cn(SCALE_TEXT, 'relative h-8 leading-none')}>
          {ticks.map((tick) => (
            <span
              key={tick.key}
              className="absolute top-1 flex -translate-x-1/2 flex-col items-center gap-1"
              style={{ left: percent(toFraction(tick.value, 0, scaleMax)) }}
            >
              <span className="text-base-foreground">{formatValue(tick.value, decimals)}</span>
              <span>{tick.word}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
