import { IconCheck } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './forms.css';

export type StepItem = { id: string; label: string; description?: string };

type StepsProps = {
  /** Accessible name: "Create inspection round". */
  label: string;
  items: readonly StepItem[];
  /** Index of the current step, starting at 0. Earlier steps are done. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

function stepState(index: number, current: number): 'done' | 'current' | 'upcoming' {
  if (index < current) return 'done';
  return index === current ? 'current' : 'upcoming';
}

/**
 * Progress through a wizard. Numbered circles joined by a line in most looks, a segmented strip
 * in console, large blocks in poster and signal, a contents line in editorial.
 */
export function Steps({ label, items, current, orientation = 'horizontal', className }: StepsProps) {
  const look = useLook();
  return (
    <ol aria-label={label} data-look={look} data-orientation={orientation} className={cx('form-steps', className)}>
      {items.map((item, index) => {
        const state = stepState(index, current);
        return (
          <li key={item.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined} className="form-step">
            <span aria-hidden="true" className="form-step-mark">
              {state === 'done' ? <IconCheck /> : index + 1}
            </span>
            <span className="form-step-text">
              <span className="form-step-label">
                {item.label}
                {state === 'done' ? <span className="sr-only"> (done)</span> : null}
              </span>
              {item.description ? <span className="form-step-description">{item.description}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
