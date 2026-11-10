import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft, IconArrowRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type StageStepperProps = {
  /** Zero-based current stage. */
  index: number;
  count: number;
  /** Name of the current stage, shown between the buttons. */
  stageLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  /** Noun for one stop: "Stage", "Step", "Stop". */
  noun?: string;
  /** Names of the neighbouring stages, added to the buttons' accessible names. */
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
};

/**
 * Previous and Next around a position readout: "Stage 3 of 6" and the stage name, with one pip per
 * stage. At either end the button that cannot be used is disabled and the readout says why
 * ("start of route", "end of route").
 */
export function StageStepper({
  index,
  count,
  stageLabel,
  onPrevious,
  onNext,
  noun = 'Stage',
  previousLabel,
  nextLabel,
  className,
}: StageStepperProps) {
  const atStart = index <= 0;
  const atEnd = index >= count - 1;
  const edge = atStart ? 'start of route' : atEnd ? 'end of route' : null;

  return (
    <div data-slot="stage-stepper" role="group" aria-label={`${noun} navigation`} className={cn('flex flex-wrap items-center gap-3', className)}>
      <Button variant="outline" size="sm" disabled={atStart} aria-label={previousLabel ? `Previous: ${previousLabel}` : 'Previous'} onClick={onPrevious}>
        <IconArrowLeft /> Previous
      </Button>
      <div className="flex min-w-0 flex-col items-center gap-1.5 px-1">
        <p aria-live="polite" className="text-sm text-base-foreground">
          <span className="tabular-nums text-muted-foreground">
            {noun} {index + 1} of {count}
          </span>
          <span className="font-medium"> · {stageLabel}</span>
          {edge ? <span className="text-muted-foreground"> · {edge}</span> : null}
        </p>
        <div aria-hidden className="flex items-center gap-1">
          {Array.from({ length: count }, (_, pip) => (
            <span
              key={pip}
              data-slot="stepper-pip"
              data-state={pip === index ? 'current' : pip < index ? 'passed' : 'ahead'}
              className={cn(
                'h-1 rounded-full transition-all motion-reduce:transition-none',
                pip === index ? 'w-6 bg-primary-background' : pip < index ? 'w-3 bg-chart-neutral-450' : 'w-3 bg-chart-neutral-200'
              )}
            />
          ))}
        </div>
      </div>
      <Button size="sm" disabled={atEnd} aria-label={nextLabel ? `Next: ${nextLabel}` : 'Next'} onClick={onNext}>
        Next <IconArrowRight />
      </Button>
    </div>
  );
}
