import { IconCheck } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type ChecklistItemProps = {
  title: string;
  /** What the step involves and how long it takes. */
  detail?: string;
  done: boolean;
  /** Called when the mark is clicked, with the new state. */
  onToggle: (done: boolean) => void;
  /** The step's own action, such as "Start" or "Open". Hidden once the step is done. */
  action?: ReactNode;
  className?: string;
};

/**
 * One step of a getting-started list: a large mark to tick, the step and what it involves, and
 * its action. Done steps are struck through and keep their place. Render inside a `ul`.
 */
export function ChecklistItem({ title, detail, done, onToggle, action, className }: ChecklistItemProps) {
  const look = useLook();
  return (
    <li data-look={look} data-done={done ? '' : undefined} className={cx('flex min-w-0 items-center gap-4 border-b border-(--kit-rule) py-3.5 last:border-b-0', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={title}
        onClick={() => onToggle(!done)}
        className={cx(
          'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-(--kit-track-radius) border-2 outline-none focus-visible:shadow-(--shadow-focus-ring)',
          done ? 'border-(--kit-line-success) bg-(--kit-line-success) text-(color:--kit-surface)' : 'border-(--kit-rule-strong) hover:border-(--kit-line-accent)',
        )}
      >
        {done ? <IconCheck aria-hidden="true" className="size-4" stroke={3} /> : null}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cx('text-sm font-semibold', done ? 'text-(color:--kit-text-2) line-through' : 'text-(color:--kit-text)')}>{title}</span>
        {detail ? <span className="text-sm text-(color:--kit-text-2)">{detail}</span> : null}
      </div>
      {done ? <span className="shrink-0 text-sm font-medium text-(color:--kit-line-success)">Done</span> : action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
}
