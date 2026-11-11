import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

type TrendTileProps = {
  label: string;
  /** A second line under the label: the tag or the period. */
  detail?: string;
  /** A number is formatted with `decimals`; a string is shown as given. */
  value: number | string;
  unit?: string;
  decimals?: number;
  /** The trend, usually a `MicroTrend` sized with `h-* w-full`. */
  trend: ReactNode;
  /** End of the head row: a status pill or a delta. */
  aside?: ReactNode;
  /** Under the trend: the range, the limit, the period. */
  footnote?: ReactNode;
  /** `filled` colours the whole tile with its tone, the way wall screens show state. */
  tone?: Tone;
  filled?: boolean;
  /** `row` puts label, trend and value on one line for dense lists. */
  layout?: 'stack' | 'row';
  className?: string;
};

/**
 * A value with its recent trend as one unit: the smallest block that still answers "how much,
 * and which way". Its surface, border and radius follow the look.
 */
export function TrendTile({ label, detail, value, unit, decimals = 0, trend, aside, footnote, tone = 'neutral', filled = false, layout = 'stack', className }: TrendTileProps) {
  const look = useLook();
  const shown = typeof value === 'number' ? formatNumber(value, decimals) : value;
  const surface = filled
    ? { background: 'var(--t-solid)', color: 'var(--t-on-solid)', border: 'var(--kit-panel-border)' }
    : { background: 'var(--kit-panel-bg)', color: 'var(--kit-text)', border: 'var(--kit-panel-border)', boxShadow: look === 'editorial' ? undefined : 'var(--kit-panel-shadow)' };
  const quiet = filled ? 'opacity-80' : 'text-(--kit-text-2)';
  const figure = (
    <span className="tabular-nums" style={{ fontSize: layout === 'row' ? '1.125rem' : 'calc(1.75rem * var(--kit-figure-scale))', lineHeight: 1.1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
      {shown}
      {unit ? <span className={cx('ml-1 text-xs font-medium tracking-normal', quiet)}>{unit}</span> : null}
    </span>
  );

  if (layout === 'row') {
    return (
      <div role="group" aria-label={label} data-look={look} data-tone={tone} data-layout="row" data-filled={filled} className={cx('grid min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8.5rem] items-center gap-4 px-4 py-3', className)} style={{ ...surface, borderRadius: 'var(--kit-radius-sm)' }}>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{label}</span>
          {detail ? <span className={cx('text-xs', quiet)}>{detail}</span> : null}
        </span>
        {trend}
        <span className="flex items-center justify-end gap-3 text-right">
          {figure}
          {aside}
        </span>
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} data-look={look} data-tone={tone} data-layout="stack" data-filled={filled} className={cx('flex h-full min-w-0 flex-col gap-3', className)} style={{ ...surface, borderRadius: 'var(--kit-radius)', padding: 'var(--kit-panel-pad)' }}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{label}</span>
          {detail ? <span className={cx('text-xs', quiet)}>{detail}</span> : null}
        </span>
        {aside}
      </div>
      {figure}
      <div className="mt-auto flex flex-col gap-2">
        {trend}
        {footnote ? <div className={cx('text-xs tabular-nums', quiet)}>{footnote}</div> : null}
      </div>
    </div>
  );
}
