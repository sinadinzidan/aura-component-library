import { cn } from '../../../lib/utils';

import type { LevelStep } from './drillReducer';
import { LEVEL_LABEL } from './hierarchy';

export type ZoomRailProps = {
  /** The four levels, from `levelSteps`. */
  steps: readonly LevelStep[];
  /** Called with the depth of a level when it is picked. */
  onSelect: (depth: number) => void;
  /** Shown under a level nothing has been picked at yet. */
  emptyText?: string;
  /** Accessible name of the rail. */
  label?: string;
  className?: string;
};

/**
 * The levels of a journey as a vertical rail: a stop per level with what is selected there. The
 * current stop is filled, stops above it are the way back up, and stops below stay reachable
 * while the journey remembers where it has been.
 */
export function ZoomRail({ steps, onSelect, emptyText = 'Pick one to go deeper', label = 'Zoom level', className }: ZoomRailProps) {
  const currentDepth = steps.find((step) => step.current)?.depth ?? 0;

  return (
    <ol data-slot="zoom-rail" aria-label={label} className={cn('flex flex-col', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const passed = step.depth < currentDepth;
        return (
          <li key={step.level} className="flex min-h-0 flex-1 gap-3">
            <span aria-hidden="true" className="flex w-4 shrink-0 flex-col items-center">
              <span
                data-slot="zoom-rail-stop"
                className={cn(
                  'mt-1 size-3 shrink-0 rounded-full border-2 motion-safe:transition-transform',
                  step.current
                    ? 'scale-125 border-primary-background bg-primary-background'
                    : passed
                      ? 'border-primary-background bg-base-background'
                      : 'border-emphasized bg-base-background'
                )}
              />
              {isLast ? null : <span className={cn('w-0.5 flex-1', passed ? 'bg-primary-background' : 'bg-medium-background')} />}
            </span>
            <button
              type="button"
              disabled={!step.reachable}
              aria-current={step.current ? 'step' : undefined}
              onClick={() => onSelect(step.depth)}
              className={cn(
                'mb-2 flex min-w-0 flex-1 flex-col items-start self-start rounded-md px-2 py-1 text-left outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring-default enabled:hover:bg-base-background-hover',
                step.current ? 'bg-muted-background' : ''
              )}
            >
              <span className="text-xs text-muted-foreground">{LEVEL_LABEL[step.level]}</span>
              {step.node ? (
                <>
                  <span className={cn('text-sm leading-5', step.current ? 'font-medium text-base-foreground' : 'text-medium-foreground')}>
                    {step.node.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{step.node.tag}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{emptyText}</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
