import { cn } from '../../../lib/utils';

import { STEP_STATE_LABEL, isStepPassed, stepProgress } from './stepState';
import type { StepState } from './stepState';

export type StepperSummaryStep = { label: string; state: StepState };

export type StepperSummaryProps = {
  /** What the steps are for: "Create data set". */
  label: string;
  steps: readonly StepperSummaryStep[];
  /** Adds a segmented bar with one segment per step. */
  bar?: boolean;
  className?: string;
};

const SEGMENT: Record<StepState, string> = {
  complete: 'bg-primary-background',
  skipped: 'bg-primary-background opacity-40',
  current: 'bg-primary-background',
  error: 'bg-critical-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  upcoming: 'bg-medium-background',
  disabled: 'bg-medium-background',
};

/**
 * A stepper in one line: "Step 2 of 4", the current step's name and what comes next, with an
 * optional segmented bar. For narrow panels, dialogs and phones where the full row does not fit.
 * `Stepper` renders it for its `compact` and `progress` variants.
 */
export function StepperSummary({ label, steps, bar = false, className }: StepperSummaryProps) {
  const { total, currentIndex } = stepProgress(steps.map((step) => step.state));
  const done = currentIndex < 0;
  const position = done ? total : currentIndex + 1;
  const current = done ? undefined : steps[currentIndex];
  const next = done ? undefined : steps.slice(currentIndex + 1).find((step) => !isStepPassed(step.state) && step.state !== 'disabled');
  const positionText = done ? `All ${total} steps completed` : `Step ${position} of ${total}`;
  const attention = current !== undefined && (current.state === 'error' || current.state === 'warning');

  return (
    <div data-slot="stepper-summary" role="group" aria-label={label} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm text-base-foreground">
          <span className="text-muted-foreground tabular-nums">{positionText}</span>
          {current ? (
            <>
              <span aria-hidden="true" className="px-1.5 text-muted-foreground">
                ·
              </span>
              <span aria-current="step" className={cn('font-medium', current.state === 'error' && 'text-critical-foreground-strong')}>
                {current.label}
              </span>
              {attention ? <span className="pl-1.5 text-xs text-muted-foreground">({STEP_STATE_LABEL[current.state].toLowerCase()})</span> : null}
            </>
          ) : null}
        </p>
        {next ? <p className="shrink-0 text-xs text-muted-foreground">Next: {next.label}</p> : null}
      </div>
      {bar ? (
        <div
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
          aria-valuetext={current ? `${positionText}: ${current.label}` : positionText}
          className="flex w-full gap-1"
        >
          {steps.map((step, index) => (
            <span
              key={index}
              data-slot="stepper-segment"
              data-state={step.state}
              className={cn('h-1 flex-1 rounded-full', SEGMENT[step.state], index === currentIndex && step.state === 'current' && 'opacity-60')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
