import { IconCheck, IconPlayerPause } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type StepFlowState = 'done' | 'current' | 'held' | 'pending';

export type StepFlowStep = {
  label: string;
  /** Who and when, or what is waited for. */
  meta?: string;
  state: StepFlowState;
};

type StepFlowProps = {
  /** What moves through the steps: "Sample S-26-0412". */
  label: string;
  steps: readonly StepFlowStep[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'signal', 'blueprint'];
const STATE_TONE = { done: 'success', current: 'accent', held: 'warning', pending: 'neutral' } as const;
const STATE_WORD = { done: 'done', current: 'in progress', held: 'on hold', pending: 'not started' } as const;

/**
 * Where something is in a fixed sequence: a sample from the sample point to the approved result,
 * an investigation from report to close-out. Done steps carry a tick, the current one its number
 * on the accent colour, a held one a pause mark; the connector fills as far as the work has come.
 */
export function StepFlow({ label, steps, orientation = 'horizontal', className }: StepFlowProps) {
  const look = useLook();
  const square = SQUARE_LOOKS.includes(look);
  const vertical = orientation === 'vertical';

  return (
    <ol aria-label={label} data-look={look} data-orientation={orientation} className={cx('flex min-w-0 text-(--kit-text)', vertical ? 'flex-col' : 'items-start', className)}>
      {steps.map((step, index) => {
        const reached = step.state !== 'pending';
        const last = index === steps.length - 1;
        return (
          <li
            key={step.label}
            data-tone={STATE_TONE[step.state]}
            data-state={step.state}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className={cx('relative flex min-w-0', vertical ? 'gap-3 pb-5 last:pb-0' : 'flex-1 flex-col gap-2 pr-3 last:pr-0')}
          >
            {last ? null : (
              <span
                aria-hidden="true"
                className={cx('absolute', vertical ? 'top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2' : 'top-3.5 right-0 left-7 h-0.5 -translate-y-1/2', steps[index + 1].state === 'pending' ? 'bg-(--kit-track)' : 'bg-(--kit-text)')}
              />
            )}
            <span
              className={cx(
                'relative flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold tabular-nums [&_svg]:h-4 [&_svg]:w-4',
                square ? '' : 'rounded-full',
                step.state === 'done' && 'bg-(--kit-text) text-(--kit-surface)',
                step.state === 'current' && 'bg-(--t-solid) text-(--t-on-solid)',
                step.state === 'held' && 'bg-(--t-solid) text-(--t-on-solid)',
                step.state === 'pending' && 'border border-(--kit-rule-strong) bg-(--kit-halo) text-(--kit-text-2)',
              )}
            >
              {step.state === 'done' ? <IconCheck aria-hidden="true" /> : step.state === 'held' ? <IconPlayerPause aria-hidden="true" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className={cx('block text-sm leading-5', reached ? 'font-semibold' : 'font-medium text-(--kit-text-2)')}>
                {step.label}
                <span className="sr-only">, {STATE_WORD[step.state]}</span>
              </span>
              {step.meta ? <span className={cx('block text-xs leading-4', step.state === 'held' ? 'font-medium text-(--t-ink)' : 'text-(--kit-text-2)')}>{step.meta}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
