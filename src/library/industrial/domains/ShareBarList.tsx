import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { TONE_MARK_BG, formatReading, formatValue } from '../status';
import type { Tone } from '../status';

export type ShareBarItem = {
  id: string;
  label: string;
  value: number;
  /** Quiet text after the label, e.g. a tag or a cause code. */
  detail?: string;
  /** Only for an item that is itself in an abnormal state, such as a source over its limit. */
  tone?: Tone;
};

export type ShareBarListProps = {
  /** What the list ranks, e.g. "Energy use by consumer, last 24 hours". */
  label: string;
  /** Largest first; the list does not sort. */
  items: readonly ShareBarItem[];
  unit?: string;
  decimals?: number;
  /** Each item's share of the total after its value. */
  showShare?: boolean;
  /** Value of a full-width bar. Defaults to the largest item. */
  max?: number;
  className?: string;
};

/**
 * A ranked breakdown: label, value and a bar per item, on one shared scale. Use it for "what makes
 * up this total" — consumers of energy, sources of emissions, causes of lost production — where
 * the exact numbers matter as much as the ranking.
 */
export function ShareBarList({ label, items, unit, decimals = 0, showShare = false, max, className }: ShareBarListProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const scaleMax = max ?? Math.max(0, ...items.map((item) => item.value));

  return (
    <ul data-slot="share-bar-list" aria-label={label} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-base-foreground">
              {item.label}
              {item.detail ? <span className="pl-2 font-mono text-xs text-muted-foreground">{item.detail}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-base-foreground">
              {formatReading(item.value, unit, decimals)}
              {showShare && total > 0 ? (
                <span data-slot="share" className="inline-block w-12 text-right text-xs text-muted-foreground">
                  {formatValue((item.value / total) * 100, 0)}%
                </span>
              ) : null}
            </span>
          </div>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-chart-neutral-100">
            <div data-slot="share-bar" className={cn('h-full rounded-full', TONE_MARK_BG[item.tone ?? 'neutral'])} style={{ width: `${toFraction(item.value, 0, scaleMax) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
