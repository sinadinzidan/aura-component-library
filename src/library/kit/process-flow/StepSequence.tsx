import { IconCheck, IconPlayerPause, IconX } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { BLOCK_ANATOMY } from './anatomy';
import type { StepState } from './flow';

export type SequenceStep = {
  id: string;
  label: string;
  /** What the step waits for, or who confirmed it. */
  detail?: string;
  /** When it was completed or started. */
  time?: string;
  state: StepState;
};

type StepSequenceProps = {
  /** What the sequence does: "Recompressor restart". */
  label: string;
  steps: readonly SequenceStep[];
  /** `horizontal` lays the steps out as a progress rail with labels underneath. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

const STATE_TONE: Record<StepState, Tone> = { done: 'success', active: 'accent', held: 'warning', failed: 'critical', pending: 'neutral' };

const STATE_WORD: Record<StepState, string> = { done: 'Done', active: 'In progress', held: 'On hold', failed: 'Failed', pending: 'Not started' };

/**
 * An ordered sequence — a start-up, a batch, a parcel through its stages. Each step has a numbered
 * marker joined by a rail that is solid up to the step in hand. Markers are discs in the card
 * looks, square blocks in console, poster and signal, and drawn numerals in blueprint and editorial.
 */
export function StepSequence({ label, steps, orientation = 'vertical', className }: StepSequenceProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const square = anatomy === 'strip' || anatomy === 'solid' || anatomy === 'outline';
  const drawn = anatomy === 'outline' || anatomy === 'rule';
  const horizontal = orientation === 'horizontal';

  const marker = (step: SequenceStep, index: number) => {
    const open = step.state === 'pending';
    return (
      <span
        data-tone={STATE_TONE[step.state]}
        className="relative z-10 flex size-8 shrink-0 items-center justify-center text-sm font-semibold tabular-nums [&_svg]:size-4"
        style={{
          borderRadius: square ? 'var(--kit-radius-sm)' : 999,
          background: open || drawn ? 'var(--kit-halo)' : step.state === 'active' ? 'var(--t-solid)' : anatomy === 'card' || anatomy === 'tint' ? 'var(--t-soft)' : 'var(--t-solid)',
          color: open ? 'var(--kit-text-3)' : drawn ? 'var(--t-ink)' : step.state === 'active' ? 'var(--t-on-solid)' : anatomy === 'card' || anatomy === 'tint' ? 'var(--t-on-soft)' : 'var(--t-on-solid)',
          boxShadow: open ? 'inset 0 0 0 1.5px var(--kit-rule-strong)' : drawn ? 'inset 0 0 0 1.5px var(--t-line)' : step.state === 'active' ? '0 0 0 4px color-mix(in oklab, var(--t-line) 22%, transparent)' : undefined,
        }}
      >
        {step.state === 'done' ? <IconCheck aria-hidden="true" /> : step.state === 'held' ? <IconPlayerPause aria-hidden="true" /> : step.state === 'failed' ? <IconX aria-hidden="true" /> : index + 1}
      </span>
    );
  };

  const rail = (step: SequenceStep) => (step.state === 'done' ? 'var(--kit-line-success)' : 'var(--kit-rule-strong)');

  if (horizontal) {
    return (
      <ol data-look={look} data-orientation="horizontal" aria-label={label} className={cx('grid w-full min-w-0', className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => (
          <li key={step.id} data-state={step.state} aria-current={step.state === 'active' || step.state === 'held' ? 'step' : undefined} className="relative flex min-w-0 flex-col items-center gap-2 px-1 text-center">
            {index > 0 ? <span aria-hidden="true" className="absolute top-4 right-1/2 left-[-50%] -translate-y-1/2" style={{ height: look === 'poster' ? 4 : 2, background: rail(steps[index - 1]) }} /> : null}
            {marker(step, index)}
            <span className={cx('text-sm text-(--kit-text)', step.state === 'pending' ? 'font-medium text-(--kit-text-2)' : 'font-semibold')}>{step.label}</span>
            <span className="text-xs text-(--kit-text-3) tabular-nums">{step.time ?? step.detail ?? STATE_WORD[step.state]}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol data-look={look} data-orientation="vertical" aria-label={label} className={cx('flex w-full min-w-0 flex-col', className)}>
      {steps.map((step, index) => (
        <li key={step.id} data-state={step.state} aria-current={step.state === 'active' || step.state === 'held' ? 'step' : undefined} className="relative flex min-w-0 gap-3 pb-4 last:pb-0">
          {index < steps.length - 1 ? <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 -translate-x-1/2" style={{ width: look === 'poster' ? 4 : 2, background: rail(step) }} /> : null}
          {marker(step, index)}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <div className="flex min-w-0 items-baseline justify-between gap-3">
              <span className={cx('text-sm', step.state === 'pending' ? 'font-medium text-(--kit-text-2)' : 'font-semibold text-(--kit-text)')}>{step.label}</span>
              <span className="shrink-0 text-xs text-(--kit-text-3) tabular-nums">{step.time ?? (step.state === 'pending' ? '' : STATE_WORD[step.state])}</span>
            </div>
            {step.detail ? (
              <span data-tone={STATE_TONE[step.state]} className="text-xs" style={{ color: step.state === 'held' || step.state === 'failed' ? 'var(--t-ink)' : 'var(--kit-text-3)', fontWeight: step.state === 'held' || step.state === 'failed' ? 600 : undefined }}>
                {step.detail}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
