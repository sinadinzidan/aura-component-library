import { Card } from '@cognite/aura/components/card';
import { Skeleton } from '@cognite/aura/components/skeleton';

import { cn } from '../../lib/utils';

import { Sparkline } from './Sparkline';
import type { SparklineVariant } from './Sparkline';
import { LABEL_TEXT, SCALE_TEXT, formatReading } from './status';
import type { DotShape, GoodDirection, Tone } from './status';
import { StatusIndicator } from './StatusIndicator';
import { TrendDelta } from './TrendDelta';
import { ValueReadout } from './ValueReadout';
import type { ValueReadoutSize } from './ValueReadout';

export type KpiTileSize = 'compact' | 'default' | 'large';

export type KpiTileDelta = {
  /** Previous-period value (or target) the current value is compared with. */
  reference: number;
  goodDirection?: GoodDirection;
  caption?: string;
  format?: 'absolute' | 'percent';
  decimals?: number;
};

export type KpiTileTrend = {
  values: readonly number[];
  variant?: SparklineVariant;
  /** Accessible description of the trend. Defaults to "<label> trend". */
  label?: string;
  limit?: number;
  tone?: Tone;
};

export type KpiTileProps = {
  label: string;
  /** `null` shows the no-data state. */
  value: number | null;
  unit?: string;
  decimals?: number;
  size?: KpiTileSize;
  /** Colours the number. Only for a KPI that is itself in an abnormal state. */
  tone?: Tone;
  /** State shown in the tile header, e.g. "On target". */
  status?: { tone: Tone; label: string; shape?: DotShape };
  delta?: KpiTileDelta;
  target?: { value: number; label?: string };
  trend?: KpiTileTrend;
  footnote?: string;
  /** Skeleton in the tile's own layout while the figure loads. */
  loading?: boolean;
  /** Shown instead of delta and target when `value` is `null`. */
  emptyText?: string;
  className?: string;
};

const READOUT_SIZE: Record<KpiTileSize, ValueReadoutSize> = { compact: 'md', default: 'lg', large: 'xl' };
const VALUE_ROW_HEIGHT: Record<KpiTileSize, string> = { compact: 'h-6', default: 'h-8', large: 'h-12' };
const INLINE_TREND: Record<KpiTileSize, { width: string; height: number }> = {
  compact: { width: 'w-16', height: 24 },
  default: { width: 'w-24', height: 32 },
  large: { width: 'w-full', height: 56 },
};

/**
 * One KPI: label, number, unit, and optionally its change, target, trend and state. The base
 * building block of industrial dashboards; rows of tiles should share one size.
 */
export function KpiTile({
  label,
  value,
  unit,
  decimals = 0,
  size = 'default',
  tone = 'neutral',
  status,
  delta,
  target,
  trend,
  footnote,
  loading = false,
  emptyText = 'No data',
  className,
}: KpiTileProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const gap = size === 'compact' ? 'gap-2' : 'gap-3';

  if (loading) {
    return (
      <Card data-slot="kpi-tile" aria-busy="true" aria-label={`${label}, loading`} className={cn('min-w-0', gap, className)}>
        <div className="flex h-5 items-center">
          <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
        </div>
        <div className={cn('flex items-center', VALUE_ROW_HEIGHT[size])}>
          <Skeleton className={cn('w-28', VALUE_ROW_HEIGHT[size])} />
        </div>
        {size === 'large' ? <Skeleton className="h-14 w-full" /> : null}
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-32" />
        </div>
      </Card>
    );
  }

  const sparkline =
    trend && hasValue ? (
      <Sparkline
        values={trend.values}
        label={trend.label ?? `${label} trend`}
        variant={trend.variant ?? (size === 'large' ? 'area' : 'line')}
        height={INLINE_TREND[size].height}
        limit={trend.limit}
        tone={trend.tone ?? tone}
        unit={unit}
        decimals={decimals}
        showLast={(trend.variant ?? 'line') !== 'bar'}
        className={cn(INLINE_TREND[size].width, size === 'large' ? undefined : 'shrink-0')}
      />
    ) : null;

  const hasMeta = hasValue ? delta !== undefined || target !== undefined : true;

  return (
    <Card data-slot="kpi-tile" data-size={size} role="group" aria-label={label} className={cn('min-w-0', gap, className)}>
      <div className="flex h-5 items-center justify-between gap-3">
        <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
        {status ? <StatusIndicator size="sm" tone={status.tone} label={status.label} shape={status.shape} /> : null}
      </div>

      <div className={cn('flex items-end justify-between gap-4', VALUE_ROW_HEIGHT[size])}>
        <ValueReadout value={hasValue ? value : null} unit={hasValue ? unit : undefined} decimals={decimals} size={READOUT_SIZE[size]} tone={tone} />
        {size === 'large' ? null : sparkline}
      </div>

      {size === 'large' ? sparkline : null}

      {hasMeta ? (
        <div className="flex min-h-4 flex-wrap items-center gap-x-3 gap-y-1">
          {hasValue && delta ? (
            <TrendDelta
              value={value}
              reference={delta.reference}
              format={delta.format}
              decimals={delta.decimals ?? Math.max(decimals, 1)}
              unit={delta.format === 'percent' ? undefined : unit}
              goodDirection={delta.goodDirection}
              caption={delta.caption}
            />
          ) : null}
          {hasValue && target ? (
            <span data-slot="kpi-target" className={SCALE_TEXT}>
              {target.label ?? 'Target'} {formatReading(target.value, unit, decimals)}
            </span>
          ) : null}
          {hasValue ? null : <span className={LABEL_TEXT}>{emptyText}</span>}
        </div>
      ) : null}

      {footnote ? <p className={LABEL_TEXT}>{footnote}</p> : null}
    </Card>
  );
}
