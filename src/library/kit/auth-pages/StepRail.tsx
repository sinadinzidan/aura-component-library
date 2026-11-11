import { IconCheck } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type StepRailStep = {
  id: string;
  label: string;
  /** A short line under the label: what the step asks for, or when it happens. */
  detail?: string;
};

type StepRailProps = {
  /** Names the sequence: "Create your account". */
  label: string;
  steps: readonly StepRailStep[];
  /** Index of the step in progress. Earlier steps are done; pass `steps.length` when all are. */
  current: number;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

/**
 * The steps of a flow with where the person is: done steps are ticked, the current one is
 * filled, later ones are outlined. Markers follow the look — round in studio and soft, square
 * on a console, poster or blueprint.
 */
export function StepRail({ label, steps, current, orientation = 'vertical', className }: StepRailProps) {
  const look = useLook();
  const vertical = orientation === 'vertical';
  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0', vertical ? 'flex-col' : 'items-start', className)}>
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        const last = index === steps.length - 1;
        return (
          <li
            key={step.id}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cx('group flex min-w-0', vertical ? 'gap-3.5' : 'flex-1 flex-col gap-3')}
          >
            <span className={cx('flex items-center', vertical ? 'flex-col' : 'w-full')}>
              <span
                className={cx(
                  'flex size-8 shrink-0 items-center justify-center rounded-(--kit-track-radius) border-2 text-sm font-semibold tabular-nums',
                  'border-(--kit-rule-strong) text-(color:--kit-text-2)',
                  'group-data-[state=current]:border-(--kit-accent) group-data-[state=current]:bg-(--kit-accent) group-data-[state=current]:text-(color:--kit-on-accent)',
                  'group-data-[state=done]:border-(--kit-line-success) group-data-[state=done]:text-(color:--kit-line-success)',
                )}
              >
                {state === 'done' ? <IconCheck aria-hidden="true" className="size-4" /> : index + 1}
              </span>
              {last ? null : (
                <span
                  aria-hidden="true"
                  className={cx('bg-(--kit-rule-strong) group-data-[state=done]:bg-(--kit-line-success)', vertical ? 'my-1 min-h-5 w-0.5 flex-1' : 'mx-2 h-0.5 flex-1')}
                />
              )}
            </span>
            <span className={cx('flex min-w-0 flex-col', vertical ? 'pt-1 pb-5' : 'pr-4')}>
              <span className="text-sm font-semibold text-(color:--kit-text) group-data-[state=todo]:font-medium group-data-[state=todo]:text-(color:--kit-text-2)">
                {step.label}
                {state === 'done' ? <span className="sr-only"> (done)</span> : null}
              </span>
              {step.detail ? <span className="text-sm text-(color:--kit-text-3)">{step.detail}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
