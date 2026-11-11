import { IconLock, IconLockOpen } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type LockBoardPerson = {
  id: string;
  name: string;
  /** Trade or role: "Mechanical technician". */
  role: string;
  /** Number of the personal lock. */
  lock: string;
  /** Colour family of the lock, so it is found on the box. */
  tone: Tone;
  on: boolean;
};

type LockBoardProps = {
  /** Accessible name: "Lock box LB-07". */
  label: string;
  people: readonly LockBoardPerson[];
  /** Reports a toggle. Leave out for a read-only board. */
  onToggle?: (id: string, on: boolean) => void;
  columns?: number;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * The hasp of a lock box as a board of hooks: one per worker, with their personal lock hanging on
 * it or off. A lock that is on is filled in the worker's colour; an empty hook is an outline. The
 * count at the bottom says how many locks hold the box shut.
 */
export function LockBoard({ label, people, onToggle, columns = 3, className }: LockBoardProps) {
  const look = useLook();
  const square = SQUARE_LOOKS.includes(look);
  const on = people.filter((person) => person.on).length;

  return (
    <div data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      <ul aria-label={label} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {people.map((person) => {
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-12 shrink-0 items-center justify-center [&_svg]:size-6',
                  square ? '' : 'rounded-(--kit-radius-sm)',
                  person.on ? 'bg-(--t-solid) text-(--t-on-solid)' : 'border-2 border-dashed border-(--kit-rule-strong) text-(--kit-text-2)',
                )}
              >
                {person.on ? <IconLock /> : <IconLockOpen />}
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="text-sm leading-5 font-medium">{person.name}</span>
                <span className="text-xs leading-4 text-(--kit-text-2)">{person.role}</span>
                <span className={cx('text-xs leading-5 font-semibold tabular-nums', person.on ? 'text-(--t-ink)' : 'text-(--kit-text-2)')}>{person.on ? `Lock ${person.lock} on` : 'Lock off'}</span>
              </span>
            </>
          );
          const frame = cx('flex w-full items-center gap-3 border border-(--kit-rule) bg-(--kit-surface) p-3', square ? '' : 'rounded-(--kit-radius-sm)');
          return (
            <li key={person.id} data-tone={person.tone} data-on={person.on}>
              {onToggle ? (
                <button type="button" aria-pressed={person.on} onClick={() => onToggle(person.id, !person.on)} className={cx(frame, 'outline-none hover:border-(--kit-rule-strong) focus-visible:ring-2 focus-visible:ring-(--kit-accent)')}>
                  {content}
                </button>
              ) : (
                <div className={frame}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p role="status" data-tone={on === people.length ? 'success' : 'warning'} className="mt-3 text-sm font-semibold text-(--t-ink) tabular-nums">
        {on} of {people.length} personal locks on the box
      </p>
    </div>
  );
}
