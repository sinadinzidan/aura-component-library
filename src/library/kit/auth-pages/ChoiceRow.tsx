import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type ChoiceRowProps = {
  title: string;
  /** Secondary line: the organisation, the role, when it was last opened. */
  meta?: ReactNode;
  /** Leading icon chip or avatar. */
  leading?: ReactNode;
  /** Trailing status or figure, before the radio mark. */
  trailing?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
};

/**
 * One option in a single-choice list, as a whole clickable row: a project to open, an account
 * to continue with, a plan. Render inside an element with `role="radiogroup"`. The selected
 * row takes the accent as border and wash, and the mark follows the look's corner style.
 */
export function ChoiceRow({ title, meta, leading, trailing, selected, onSelect, className }: ChoiceRowProps) {
  const look = useLook();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-look={look}
      onClick={onSelect}
      className={cx(
        'flex w-full min-w-0 cursor-pointer items-center gap-3.5 rounded-(--kit-radius-sm) border border-(--kit-rule) bg-(--kit-surface) px-4 py-3 text-left outline-none',
        'hover:border-(--kit-rule-strong) focus-visible:shadow-(--shadow-focus-ring)',
        'aria-checked:border-(--kit-line-accent) aria-checked:bg-[color-mix(in_oklab,var(--kit-line-accent)_10%,var(--kit-surface))]',
        className,
      )}
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-(color:--kit-text)">{title}</span>
        {meta ? <span className="flex flex-wrap items-center gap-x-2 text-sm text-(color:--kit-text-2)">{meta}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2 text-sm text-(color:--kit-text-2)">{trailing}</span> : null}
      <span
        aria-hidden="true"
        className={cx(
          'flex size-5 shrink-0 items-center justify-center rounded-(--kit-track-radius) border-2',
          selected ? 'border-(--kit-line-accent)' : 'border-(--kit-rule-strong)',
        )}
      >
        {selected ? <span className="size-2.5 rounded-(--kit-track-radius) bg-(--kit-line-accent)" /> : null}
      </span>
    </button>
  );
}
