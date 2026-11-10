import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { IconArrowLeft, IconArrowRight } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { Stepper } from './Stepper';
import type { StepperStep } from './Stepper';

type WizardFrameProps = {
  /** What the wizard creates or configures: "Create extraction pipeline". */
  title: string;
  steps: readonly StepperStep[];
  /** Index of the step being shown. */
  current: number;
  /** The current step's content. */
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  /** Called from the last step instead of `onNext`. */
  onFinish?: () => void;
  /** Adds a Cancel button at the start of the footer. */
  onCancel?: () => void;
  /** Adds a "Skip" button on steps flagged `optional`. */
  onSkip?: () => void;
  /** How progress is shown in the header. */
  indicator?: 'stepper' | 'count' | 'progress';
  nextLabel?: string;
  /** Label of the last step's primary action: say what happens, such as "Create pipeline". */
  finishLabel?: string;
  /** When set, the primary action is disabled and this sentence is shown beside it. */
  blockedReason?: string;
};

/**
 * The frame around a multi-step flow: title and progress in the header, one step of content, and
 * a footer with Back at the start and Next at the end. Back is hidden on the first step and the
 * last step's primary action names the outcome.
 */
export function WizardFrame({
  title,
  steps,
  current,
  children,
  onBack,
  onNext,
  onFinish,
  onCancel,
  onSkip,
  indicator = 'stepper',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  blockedReason,
}: WizardFrameProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const reasonId = `${id}-reason`;
  const isFirst = current <= 0;
  const isLast = current >= steps.length - 1;
  const step = steps[current];
  const blocked = blockedReason !== undefined;
  const countText = `Step ${current + 1} of ${steps.length}`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background"
    >
      <header className="flex flex-col gap-4 border-b border-default p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 id={titleId} className="truncate text-base font-semibold text-base-foreground">
            {title}
          </h3>
          {indicator === 'stepper' ? null : (
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {countText}
              {step ? <span className="text-base-foreground"> · {step.label}</span> : null}
            </span>
          )}
        </div>
        {indicator === 'stepper' ? <Stepper steps={steps} current={current} label={`${title} steps`} /> : null}
        {indicator === 'progress' ? (
          <Progress
            value={current + 1}
            max={steps.length}
            size="sm"
            aria-label={`${title} progress`}
            aria-valuetext={countText}
          />
        ) : null}
      </header>
      <div className="p-6">{children}</div>
      <footer className="flex items-center justify-between gap-4 border-t border-default p-4">
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          {isFirst ? null : (
            <Button variant="secondary" onClick={onBack}>
              <IconArrowLeft /> Back
            </Button>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {blocked ? (
            <p id={reasonId} className="min-w-0 text-sm text-muted-foreground">
              {blockedReason}
            </p>
          ) : null}
          {onSkip && step?.optional && !isLast ? (
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          ) : null}
          {isLast ? (
            <Button disabled={blocked} aria-describedby={blocked ? reasonId : undefined} onClick={onFinish ?? onNext}>
              {finishLabel}
            </Button>
          ) : (
            <Button disabled={blocked} aria-describedby={blocked ? reasonId : undefined} onClick={onNext}>
              {nextLabel} <IconArrowRight />
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}
