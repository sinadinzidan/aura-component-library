import { IconCheck, IconMinus, IconPlayerPause, IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { stepProgress } from './workflow';
import type { StepState } from './workflow';

export type StepListItem = {
  id: string;
  label: string;
  /** Quiet second line: who, when, or what the step is waiting for. */
  detail?: string;
  state: StepState;
  /** Right-aligned content in the vertical layout, such as a time or a button. */
  meta?: ReactNode;
};

export type StepListProps = {
  steps: readonly StepListItem[];
  /** What the sequence is, e.g. "Start-up sequence, 23-KA-9103". */
  label: string;
  orientation?: 'vertical' | 'horizontal';
  /** Shows the state in words beside each vertical step. The state is always available to assistive technology. */
  showState?: boolean;
  className?: string;
};

const STATE_LABEL: Record<StepState, string> = {
  done: 'Done',
  active: 'In progress',
  pending: 'Not started',
  failed: 'Failed',
  skipped: 'Skipped',
  held: 'On hold',
};

const MARKER: Record<StepState, string> = {
  done: 'bg-success-background text-success-foreground',
  active: 'border-2 border-info-foreground-strong text-info-foreground-strong',
  pending: 'border border-emphasized text-muted-foreground',
  failed: 'bg-critical-background text-critical-foreground',
  skipped: 'border border-dashed border-emphasized text-muted-foreground',
  held: 'bg-warning-background text-warning-foreground',
};

const LABEL: Record<StepState, string> = {
  done: 'text-base-foreground',
  active: 'font-medium text-base-foreground',
  pending: 'text-muted-foreground',
  failed: 'font-medium text-base-foreground',
  skipped: 'text-muted-foreground',
  held: 'font-medium text-base-foreground',
};

function StepMarker({ state, number }: { state: StepState; number: number }) {
  return (
    <span
      data-slot="step-marker"
      data-state={state}
      className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums', MARKER[state])}
    >
      {state === 'done' ? <IconCheck aria-hidden className="size-3.5" /> : null}
      {state === 'failed' ? <IconX aria-hidden className="size-3.5" /> : null}
      {state === 'held' ? <IconPlayerPause aria-hidden className="size-3.5" /> : null}
      {state === 'skipped' ? <IconMinus aria-hidden className="size-3.5" /> : null}
      {state === 'active' ? <span aria-hidden className="size-2 rounded-full bg-info-foreground-strong" /> : null}
      {state === 'pending' ? <span aria-hidden>{number}</span> : null}
    </span>
  );
}

/**
 * A sequence of steps with a state each: start-up sequences, route progress, investigation
 * phases, pipeline stages. Every state has its own marker shape and a spoken label, so the
 * sequence reads without colour. Vertical for detail, horizontal for a compact progress header.
 */
export function StepList({ steps, label, orientation = 'vertical', showState = false, className }: StepListProps) {
  const { currentIndex } = stepProgress(steps);

  if (orientation === 'horizontal') {
    return (
      <ol data-slot="step-list" data-orientation="horizontal" aria-label={label} className={cn('flex w-full', className)}>
        {steps.map((step, index) => (
          <li
            key={step.id}
            data-state={step.state}
            aria-current={index === currentIndex ? 'step' : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex w-full items-center">
              <span aria-hidden className={cn('flex-1 border-t border-emphasized', index === 0 && 'invisible')} />
              <StepMarker state={step.state} number={index + 1} />
              <span aria-hidden className={cn('flex-1 border-t border-emphasized', index === steps.length - 1 && 'invisible')} />
            </div>
            <div className="flex min-w-0 max-w-full flex-col items-center px-1 text-center">
              <span className={cn('max-w-full truncate text-xs', LABEL[step.state])}>{step.label}</span>
              {step.detail ? <span className="max-w-full truncate text-xs text-muted-foreground tabular-nums">{step.detail}</span> : null}
              <span className="sr-only">{STATE_LABEL[step.state]}</span>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol data-slot="step-list" data-orientation="vertical" aria-label={label} className={cn('flex w-full flex-col', className)}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          data-state={step.state}
          aria-current={index === currentIndex ? 'step' : undefined}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {index < steps.length - 1 ? <span aria-hidden className="absolute top-6 bottom-0 left-3 border-l border-emphasized" /> : null}
          <StepMarker state={step.state} number={index + 1} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
            <span className={cn('text-sm', LABEL[step.state])}>{step.label}</span>
            {step.detail ? <span className="text-xs text-muted-foreground">{step.detail}</span> : null}
          </div>
          <div className="flex shrink-0 items-start gap-2 pt-0.5">
            <span className={showState ? 'text-xs text-muted-foreground' : 'sr-only'}>{STATE_LABEL[step.state]}</span>
            {step.meta}
          </div>
        </li>
      ))}
    </ol>
  );
}
