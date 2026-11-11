import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type TrackStep = {
  id: string;
  label: string;
  /** Who did it and when, or what it waits for. */
  detail?: string;
  state: 'done' | 'current' | 'pending' | 'blocked';
  /** Extra content under the step, e.g. a signature line. */
  extra?: ReactNode;
};

type StepTrackProps = {
  label: string;
  steps: readonly TrackStep[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

const STEP_TONE: Record<TrackStep['state'], Tone> = { done: 'success', current: 'accent', pending: 'neutral', blocked: 'warning' };

const STEP_WORD: Record<TrackStep['state'], string> = { done: 'Done', current: 'Now', pending: 'Pending', blocked: 'On hold' };

/**
 * Stages of a life cycle or an approval chain: numbered markers joined by a line that is solid
 * up to the current step. Horizontal for a life cycle across a panel, vertical for a chain of
 * signatures with a line of detail each. Square markers in the square looks.
 */
export function StepTrack({ label, steps, orientation = 'horizontal', className }: StepTrackProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const vertical = orientation === 'vertical';

  return (
    <ol aria-label={label} data-look={look} data-orientation={orientation} className={cx('flex min-w-0', vertical ? 'flex-col' : 'flex-row', className)}>
      {steps.map((step, index) => {
        const reached = step.state === 'done' || step.state === 'current';
        const last = index === steps.length - 1;
        const marker = (
          <span
            className="flex size-8 shrink-0 items-center justify-center text-sm font-semibold tabular-nums"
            style={{
              borderRadius: square ? 0 : 999,
              background: step.state === 'pending' ? 'transparent' : step.state === 'done' ? 'var(--t-soft)' : 'var(--t-solid)',
              color: step.state === 'pending' ? 'var(--kit-text-3)' : step.state === 'done' ? 'var(--t-on-soft)' : 'var(--t-on-solid)',
              boxShadow: step.state === 'pending' ? 'inset 0 0 0 1.5px var(--kit-rule-strong)' : undefined,
            }}
          >
            {step.state === 'done' ? '✓' : index + 1}
          </span>
        );
        const line = last ? null : (
          <span
            aria-hidden
            className={vertical ? 'my-1 w-0.5 flex-1' : 'mx-2 h-0.5 flex-1'}
            style={{ background: step.state === 'done' ? 'var(--t-line)' : 'var(--kit-rule-strong)', minHeight: vertical ? 16 : undefined }}
          />
        );
        const text = (
          <div className="min-w-0">
            <p className={cx('text-sm font-semibold', reached || step.state === 'blocked' ? 'text-(--kit-text)' : 'text-(--kit-text-2)')}>
              {step.label}
              <span className="sr-only"> ({STEP_WORD[step.state]})</span>
            </p>
            {step.detail ? <p className="text-xs text-(--kit-text-3)">{step.detail}</p> : null}
            {step.extra ? <div className="mt-2">{step.extra}</div> : null}
          </div>
        );
        return vertical ? (
          <li key={step.id} data-tone={STEP_TONE[step.state]} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined} className="flex gap-3">
            <div className="flex flex-col items-center">
              {marker}
              {line}
            </div>
            <div className={cx('min-w-0 flex-1 pt-1', last ? '' : 'pb-4')}>{text}</div>
          </li>
        ) : (
          <li key={step.id} data-tone={STEP_TONE[step.state]} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined} className={cx('flex min-w-0 flex-col gap-2', last ? '' : 'flex-1')}>
            <div className="flex items-center">
              {marker}
              {line}
            </div>
            <div className="pr-3">{text}</div>
          </li>
        );
      })}
    </ol>
  );
}
