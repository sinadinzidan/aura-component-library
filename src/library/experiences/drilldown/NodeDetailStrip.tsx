import { cn } from '../../../lib/utils';
import { Sparkline } from '../../industrial/Sparkline';
import { LABEL_TEXT, TONE_TEXT } from '../../industrial/status';
import { StatusIndicator } from '../../industrial/StatusIndicator';
import { ValueReadout } from '../../industrial/ValueReadout';

import { LEVEL_LABEL, isAbnormal } from './hierarchy';
import type { DrillMetric, DrillNode } from './hierarchy';

export type NodeDetailStripProps = {
  node: DrillNode;
  /** The roll-up figures to print, in order. */
  metrics: readonly DrillMetric[];
  /** Key of the metric the view is sized or sorted by; it is picked out. */
  activeMetric?: string;
  /** What the sparkline covers: "24 h". */
  period?: string;
  className?: string;
};

/**
 * One node on one line: what it is, its state, its roll-up figures and the trend behind its
 * headline figure. Sits under a treemap or a chart and follows the hovered or focused node.
 */
export function NodeDetailStrip({ node, metrics, activeMetric, period = '24 h', className }: NodeDetailStripProps) {
  const values = node.series.map((point) => point.v);

  return (
    <div data-slot="node-detail-strip" className={cn('flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3', className)}>
      <div className="flex min-w-48 flex-1 flex-col gap-0.5">
        <span className={LABEL_TEXT}>
          {LEVEL_LABEL[node.level]} · <span className="font-mono">{node.tag}</span>
        </span>
        <span className="text-sm font-medium text-base-foreground">{node.name}</span>
        <StatusIndicator size="sm" {...node.status} className={isAbnormal(node.status.tone) ? TONE_TEXT[node.status.tone] : undefined} />
      </div>

      <dl className="flex flex-wrap items-end gap-x-6 gap-y-2">
        {metrics.map((metric) => {
          const active = metric.key === activeMetric;
          return (
            <div key={metric.key} data-active={active ? 'true' : undefined} className="flex flex-col gap-0.5">
              <dt className={cn('text-xs', active ? 'font-medium text-base-foreground' : 'text-muted-foreground')}>{metric.label}</dt>
              <dd className={cn('border-b-2 pb-0.5', active ? 'border-primary-background' : 'border-transparent')}>
                <ValueReadout value={node.metrics[metric.key] ?? null} unit={metric.unit} decimals={metric.decimals ?? 0} size="sm" />
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="flex w-52 shrink-0 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn(LABEL_TEXT, 'truncate')}>
            {node.figure.label}, {period}
          </span>
          <ValueReadout value={node.figure.value} unit={node.figure.unit} decimals={node.figure.decimals} size="xs" tone={node.figure.tone} />
        </div>
        {values.length > 1 ? (
          <Sparkline
            values={values}
            label={`${node.figure.label} of ${node.name}, ${period}`}
            unit={node.figure.unit}
            decimals={node.figure.decimals}
            height={28}
            tone={isAbnormal(node.figure.tone) ? node.figure.tone : 'neutral'}
            variant="area"
            showLast
          />
        ) : (
          <span className="flex h-7 items-center text-xs text-muted-foreground">No trend data</span>
        )}
      </div>
    </div>
  );
}
