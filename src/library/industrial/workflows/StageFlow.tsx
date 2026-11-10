import { IconAlertTriangle, IconArrowNarrowRight } from '@cognite/aura/icons';
import { Fragment } from 'react';

import { cn } from '../../../lib/utils';
import { SeverityBadge } from '../operations/SeverityBadge';
import type { Severity, StatusDescriptor, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

export type FlowStage = {
  id: string;
  name: string;
  /** Functional location or unit tag. */
  tag?: string;
  /** Spread from `status.ts`, e.g. `runStateStatus('running')`. */
  status: StatusDescriptor;
  /** The one reading that tells how the stage is doing. */
  reading?: { label: string; value: number | null; unit?: string; decimals?: number; tone?: Tone };
  /** Open alarms on the stage, shown as a count of the worst severity. */
  alarms?: { count: number; severity: Severity };
  /** Marks the stage that limits throughput. */
  bottleneck?: boolean;
};

export type StageFlowProps = {
  stages: readonly FlowStage[];
  /** What the flow shows, e.g. "Gas train, inlet to export". */
  label: string;
  /** Text under the bottleneck stage's name. */
  bottleneckLabel?: string;
  className?: string;
};

/**
 * Production units as connected stages, left to right in flow direction: name, state and one key
 * reading each, with arrows between them. Scrolls sideways when the stages do not fit.
 */
export function StageFlow({ stages, label, bottleneckLabel = 'Bottleneck', className }: StageFlowProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <ol data-slot="stage-flow" aria-label={label} className="flex min-w-max items-stretch md:min-w-0">
        {stages.map((stage, index) => (
          <Fragment key={stage.id}>
            <li
              data-slot="stage"
              data-bottleneck={stage.bottleneck ? 'true' : undefined}
              className={cn(
                'flex w-44 min-w-0 flex-col gap-3 rounded-xl border-2 bg-card-background p-3 md:w-auto md:flex-1',
                stage.bottleneck ? 'border-warning-foreground-strong' : 'border-transparent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-foreground">{stage.name}</p>
                  {stage.tag ? <p className="truncate font-mono text-xs text-muted-foreground">{stage.tag}</p> : null}
                </div>
                {stage.alarms && stage.alarms.count > 0 ? <SeverityBadge severity={stage.alarms.severity} count={stage.alarms.count} /> : null}
              </div>
              <StatusIndicator size="sm" {...stage.status} />
              {stage.reading ? (
                <div className="mt-auto flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{stage.reading.label}</span>
                  <ValueReadout
                    size="sm"
                    value={stage.reading.value}
                    unit={stage.reading.unit}
                    decimals={stage.reading.decimals}
                    tone={stage.reading.tone}
                  />
                </div>
              ) : null}
              {stage.bottleneck ? (
                <p className="flex items-center gap-1 text-xs font-medium text-warning-foreground-strong">
                  <IconAlertTriangle aria-hidden className="size-3.5" />
                  {bottleneckLabel}
                </p>
              ) : null}
            </li>
            {index < stages.length - 1 ? (
              <li aria-hidden role="presentation" data-slot="stage-connector" className="flex shrink-0 items-center px-1 text-muted-foreground">
                <IconArrowNarrowRight className="size-5" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
