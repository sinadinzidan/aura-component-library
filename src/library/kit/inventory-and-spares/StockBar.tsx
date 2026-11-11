import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { availableStock, stockVerdict, type StockLevels } from './stock';

type StockBarProps = StockLevels & {
  /** What is counted: "Bearing, drive end". */
  label: string;
  unit?: string;
  /** Hide the verdict line when a pill next to the bar already says it. */
  hideVerdict?: boolean;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

function at(value: number, end: number): number {
  return end <= 0 ? 0 : Math.max(0, Math.min(100, (value / end) * 100));
}

/**
 * Stock of one part on a scale from zero to just past its maximum: free stock solid, reserved
 * stock hatched, stock on order as an open outline, with the minimum, reorder point and maximum
 * marked and named under the bar.
 */
export function StockBar({ label, unit = 'pcs', hideVerdict = false, className, ...levels }: StockBarProps) {
  const look = useLook();
  const end = Math.max(levels.max, levels.onHand + levels.onOrder) * 1.1;
  const available = availableStock(levels);
  const verdict = stockVerdict(levels);
  const square = SQUARE_LOOKS.includes(look);
  const marks =
    levels.min === levels.reorderPoint
      ? [
          { name: 'Min and reorder', value: levels.min },
          { name: 'Max', value: levels.max },
        ]
      : [
          { name: 'Min', value: levels.min },
          { name: 'Reorder', value: levels.reorderPoint },
          { name: 'Max', value: levels.max },
        ];

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={levels.max}
      aria-valuenow={levels.onHand}
      aria-valuetext={`${formatNumber(levels.onHand)} ${unit} on hand, ${formatNumber(available)} free, ${verdict.word.toLowerCase()}`}
      data-look={look}
      data-tone={verdict.tone}
      className={cx('min-w-0 text-(--kit-text)', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-(--kit-text-2) tabular-nums">
          <span className="text-lg leading-6 font-semibold text-(--kit-text)">{formatNumber(available)}</span> free of {formatNumber(levels.onHand)} {unit}
        </span>
      </div>
      <div aria-hidden="true" className={cx('relative mt-2 flex h-[max(1rem,var(--kit-track-h,1rem))] overflow-hidden bg-(--kit-track) ring-1 ring-(--kit-rule) ring-inset', square ? '' : 'rounded-full')}>
        <span className="h-full bg-(--t-solid)" style={{ width: `${at(available, end)}%` }} />
        <span data-part="reserved" className="h-full bg-(--t-solid) opacity-45" style={{ width: `${at(levels.onHand - available, end)}%` }} />
        <span data-part="on-order" className="box-border h-full border-2 border-dashed border-(--t-solid)" style={{ width: `${at(levels.onOrder, end)}%`, display: levels.onOrder > 0 ? undefined : 'none' }} />
      </div>
      <div aria-hidden="true" className="relative h-9 text-xs text-(--kit-text-2) tabular-nums">
        {marks.map((mark) => (
          <span key={mark.name} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${at(mark.value, end)}%` }}>
            <span className="h-2 w-px bg-(--kit-text)" />
            <span className="mt-0.5 whitespace-nowrap">
              {mark.name} {formatNumber(mark.value)}
            </span>
          </span>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-3 text-xs text-(--kit-text-2)">
        {hideVerdict ? null : <span className="font-semibold text-(--t-ink)">{verdict.word}</span>}
        {levels.reserved > 0 ? <span>{formatNumber(levels.reserved)} reserved</span> : null}
        {levels.onOrder > 0 ? <span>{formatNumber(levels.onOrder)} on order</span> : null}
      </p>
    </div>
  );
}
