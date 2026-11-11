import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import { cx, formatNumber } from '../tones';

import { waterfallColumns, type WaterfallLoss } from './oee';

type LossWaterfallProps = {
  /** What the chart shows, in words. */
  label: string;
  /** The starting amount: planned time, theoretical output. */
  total: { label: string; value: number };
  /** Losses in the order they occur. */
  losses: readonly WaterfallLoss[];
  /** Name of what is left: "Effective time". */
  resultLabel: string;
  unit?: string;
  decimals?: number;
  /** Where the value axis starts. Above zero the axis is marked as broken. */
  baseline?: number;
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * A waterfall from a planned total down to what was achieved. Each loss floats at the level the
 * previous one left, so the reader sees both its size and where it sits in the sequence. Bars take
 * their corner radius and fill from the look; values are printed on every column.
 */
export function LossWaterfall({ label, total, losses, resultLabel, unit = '', decimals = 0, baseline = 0, height = 280, headline, notes, className }: LossWaterfallProps) {
  const { chart } = useLookDefinition();
  const columns = waterfallColumns(total, losses, resultLabel);
  const span = total.value - baseline || 1;
  const at = (value: number) => `${Math.max(0, Math.min(100, ((value - baseline) / span) * 100))}%`;
  const suffix = unit ? ` ${unit}` : '';

  return (
    <ChartFrame label={label} headline={headline} notes={notes} height={height} className={className}>
      <div className="flex h-full flex-col text-xs leading-4 text-(--kit-text-2)">
        <div className="relative flex min-h-0 flex-1 items-stretch gap-0 border-b border-(--kit-rule-strong) pt-6">
          {columns.map((column, index) => (
            <div key={column.label} data-kind={column.kind} data-tone={column.tone} className="relative min-w-0 flex-1">
              <span
                data-bar=""
                className={cx('absolute left-1/2 -translate-x-1/2', column.kind === 'loss' ? 'bg-(--t-pop)' : column.kind === 'result' ? 'bg-(--t-solid)' : 'bg-(--kit-text-3)')}
                style={{
                  bottom: at(column.from),
                  height: `calc(${at(column.to)} - ${at(column.from)})`,
                  minHeight: 3,
                  width: `${Math.round(chart.barFill * 100)}%`,
                  borderRadius: column.kind === 'loss' ? chart.barRadius / 2 : `${chart.barRadius}px ${chart.barRadius}px 0 0`,
                }}
              />
              <span className="absolute inset-x-0 -translate-y-full pb-1 text-center text-sm font-semibold whitespace-nowrap tabular-nums text-(--kit-text)" style={{ top: `calc(100% - ${at(column.to)})` }}>
                {column.kind === 'loss' ? '−' : ''}
                {formatNumber(column.value, decimals)}
                {suffix}
              </span>
              {index < columns.length - 1 ? (
                <span aria-hidden="true" className="absolute left-1/2 w-full border-t border-dashed border-(--kit-text-3)" style={{ bottom: at(column.kind === 'loss' ? column.from : column.to) }} />
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex pt-2">
          {columns.map((column) => (
            <span key={column.label} className={cx('min-w-0 flex-1 px-1 text-center', column.kind === 'loss' ? '' : 'font-medium text-(--kit-text)')}>
              {column.label}
            </span>
          ))}
        </div>
        {baseline > 0 ? (
          <p className="pt-1">
            Value axis starts at {formatNumber(baseline, decimals)}
            {suffix}, so the losses are readable.
          </p>
        ) : null}
      </div>
    </ChartFrame>
  );
}
