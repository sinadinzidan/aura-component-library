import { IconCheck } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type Stage = {
  id: string;
  label: string;
  /** Who and when: "Aisha Khan · 10 Mar". */
  detail?: string;
  state: 'done' | 'current' | 'todo';
};

type StageTrackProps = {
  /** Accessible name, for example "Management of change status". */
  label: string;
  stages: readonly Stage[];
  className?: string;
};

const STATE_WORD: Record<Stage['state'], string> = { done: 'Done', current: 'In progress', todo: 'Not started' };

/**
 * Where a change stands in its approval route. Each stage is numbered and named, finished ones
 * are ticked, the current one is filled, and the connecting line is solid only as far as the
 * work has got — so the route reads without colour.
 */
export function StageTrack({ label, stages, className }: StageTrackProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'editorial';

  return (
    <ol aria-label={label} data-look={look} className={cx('grid text-sm text-[var(--kit-text)]', className)} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
      {stages.map((stage, index) => (
        <li key={stage.id} data-state={stage.state} aria-current={stage.state === 'current' ? 'step' : undefined} className="relative flex flex-col gap-2 pr-3">
          {index < stages.length - 1 ? (
            <span
              aria-hidden="true"
              className={cx('absolute top-4 right-0 left-9 border-t-2', stage.state === 'done' ? 'border-[var(--kit-accent)]' : 'border-dashed border-[var(--kit-rule-strong)]')}
            />
          ) : null}
          <span
            data-tone="accent"
            className={cx(
              'relative flex size-8 items-center justify-center text-sm font-semibold tabular-nums [&>svg]:size-4.5',
              square ? '' : 'rounded-full',
              stage.state === 'done' ? 'bg-[var(--kit-accent)] text-[var(--kit-on-accent)]' : '',
              stage.state === 'current' ? 'bg-[var(--kit-surface)] text-[var(--kit-text)] [box-shadow:inset_0_0_0_2px_var(--kit-accent),0_0_0_4px_var(--t-soft)]' : '',
              stage.state === 'todo' ? 'bg-[var(--kit-surface)] text-[var(--kit-text-2)] [box-shadow:inset_0_0_0_1px_var(--kit-rule-strong)]' : ''
            )}
          >
            {stage.state === 'done' ? <IconCheck aria-hidden="true" /> : index + 1}
          </span>
          <span className="flex flex-col">
            <span className={cx('leading-5', stage.state === 'todo' ? 'font-medium text-[var(--kit-text-2)]' : 'font-semibold')}>{stage.label}</span>
            <span className="text-[0.8125rem] leading-5 text-[var(--kit-text-2)]">{stage.detail ?? STATE_WORD[stage.state]}</span>
            <span className="sr-only">{STATE_WORD[stage.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
