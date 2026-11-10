import { IconAlertTriangle, IconCheck } from '@cognite/aura/icons';

import { stepStatus } from './stepStatus';
import type { StepStatus, StepperStep } from './stepStatus';

export type { StepStatus, StepperStep };

type StepperProps = {
  steps: readonly StepperStep[];
  /** Index of the step the user is on. Steps before it count as done. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** When set, completed steps become buttons that jump back to that step. */
  onStepSelect?: (index: number) => void;
  /** Accessible name of the list. */
  label?: string;
};

const STATUS_TEXT: Record<StepStatus, string> = {
  done: 'Completed',
  current: 'Current',
  upcoming: 'Not started',
  error: 'Needs attention',
  disabled: 'Not available',
};

const MARKER: Record<StepStatus, string> = {
  done: 'bg-medium-background text-base-foreground',
  current: 'bg-primary-background text-primary-foreground',
  upcoming: 'border border-emphasized text-muted-foreground',
  error: 'bg-critical-background text-critical-foreground',
  disabled: 'border border-default text-base-foreground-disabled',
};

const LABEL: Record<StepStatus, string> = {
  done: 'text-base-foreground',
  current: 'font-medium text-base-foreground',
  upcoming: 'text-muted-foreground',
  error: 'font-medium text-critical-foreground-strong',
  disabled: 'text-base-foreground-disabled',
};

/**
 * Numbered steps of a multi-step flow, horizontal for a wizard header and vertical for a side
 * panel. Each step reads as done, current, upcoming, needing attention or unavailable, in shape
 * and in words as well as colour.
 */
export function Stepper({ steps, current, orientation = 'horizontal', onStepSelect, label = 'Progress' }: StepperProps) {
  const vertical = orientation === 'vertical';

  return (
    <ol
      aria-label={label}
      data-orientation={orientation}
      className={vertical ? 'flex w-full list-none flex-col' : 'flex w-full list-none items-center gap-3'}
    >
      {steps.map((step, index) => {
        const status = stepStatus(step, index, current);
        const last = index === steps.length - 1;
        const canSelect = onStepSelect !== undefined && status === 'done';

        const marker = (
          <span
            aria-hidden="true"
            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${MARKER[status]}`}
          >
            {status === 'done' ? (
              <IconCheck className="size-4" />
            ) : status === 'error' ? (
              <IconAlertTriangle className="size-4" />
            ) : (
              index + 1
            )}
          </span>
        );

        const text = (
          <span className="flex min-w-0 flex-col text-left">
            <span className={`truncate text-sm ${LABEL[status]}`}>
              <span className="sr-only">{STATUS_TEXT[status]}: </span>
              {step.label}
              {step.optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
            </span>
            {vertical && step.description ? (
              <span className="text-xs text-muted-foreground">{step.description}</span>
            ) : null}
          </span>
        );

        const body = canSelect ? (
          <button
            type="button"
            className={`flex min-w-0 cursor-pointer gap-2 rounded-md outline-none hover:underline focus-visible:shadow-focus-ring ${
              vertical ? 'items-start' : 'items-center'
            }`}
            onClick={() => onStepSelect(index)}
          >
            {marker}
            {text}
          </button>
        ) : (
          <span className={`flex min-w-0 gap-2 ${vertical ? 'items-start' : 'items-center'}`}>
            {marker}
            {text}
          </span>
        );

        if (vertical) {
          return (
            <li
              key={step.id}
              aria-current={status === 'current' ? 'step' : undefined}
              data-status={status}
              className="relative flex pb-6 last:pb-0"
            >
              {last ? null : (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-3 top-7 border-l ${index < current ? 'border-emphasized' : 'border-default'}`}
                />
              )}
              {body}
            </li>
          );
        }

        return (
          <li
            key={step.id}
            aria-current={status === 'current' ? 'step' : undefined}
            data-status={status}
            className={last ? 'flex min-w-0 items-center gap-3' : 'flex min-w-0 flex-auto items-center gap-3'}
          >
            {body}
            {last ? null : (
              <span
                aria-hidden="true"
                className={`min-w-4 flex-1 border-t ${index < current ? 'border-emphasized' : 'border-default'}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
