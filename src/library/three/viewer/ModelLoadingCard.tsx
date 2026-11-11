import { IconAlertTriangle, IconCheck } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { LabelledProgress } from '../../feedback/LabelledProgress';

import { describeLoading, overallProgress } from './loadingStages';
import type { LoadingStage } from './loadingStages';

export type ModelLoadingCardProps = {
  /** Name of the model being loaded. */
  model: string;
  stages: readonly LoadingStage[];
  /** How far the active stage is, 0–1. */
  activeFraction?: number;
  className?: string;
};

/**
 * Loading progress for a large model: one overall bar, then each stage with its own state in words
 * and shape. A failed stage keeps its place and says why, so the user knows where it stopped.
 */
export function ModelLoadingCard({ model, stages, activeFraction = 0, className }: ModelLoadingCardProps) {
  const failed = stages.some((stage) => stage.state === 'error');
  return (
    <div data-slot="model-loading-card" className={cn('flex w-full flex-col gap-4', className)}>
      <LabelledProgress label={`Loading ${model}`} value={overallProgress(stages, activeFraction)} hint={describeLoading(stages, activeFraction)} />
      <ol aria-label="Loading stages" className="flex flex-col gap-2">
        {stages.map((stage) => (
          <li key={stage.id} className="flex items-start gap-2 text-sm" aria-current={stage.state === 'active' ? 'step' : undefined}>
            <span aria-hidden="true" className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
              {stage.state === 'done' ? (
                <IconCheck className="size-4 text-success-foreground-strong" />
              ) : stage.state === 'error' ? (
                <IconAlertTriangle className="size-4 text-critical-foreground-strong" />
              ) : (
                <span className={cn('size-2.5 rounded-full border-2', stage.state === 'active' ? 'border-[var(--primary-background)]' : 'border-emphasized')} />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className={cn(stage.state === 'pending' ? 'text-muted-foreground' : 'text-base-foreground', stage.state === 'active' && 'font-medium')}>
                {stage.label}
                <span className="sr-only">, {stage.state === 'done' ? 'done' : stage.state === 'active' ? 'in progress' : stage.state === 'error' ? 'failed' : 'waiting'}</span>
              </span>
              {stage.detail ? <span className={cn('text-xs tabular-nums', stage.state === 'error' ? 'text-critical-foreground-strong' : 'text-muted-foreground')}>{stage.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {failed ? <p className="text-xs text-muted-foreground">Nothing was lost. Retry the load, or open the model from the data catalog.</p> : null}
    </div>
  );
}
