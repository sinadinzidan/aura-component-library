import type { KeyboardEvent, ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

/** How a look builds the row: a card with a chip, a state block on a hairline, or a ruled line of type. */
type Anatomy = 'card' | 'block' | 'rule';

const LOOK_ANATOMY: Record<LookId, Anatomy> = {
  studio: 'card',
  console: 'block',
  poster: 'block',
  glass: 'card',
  editorial: 'rule',
  soft: 'card',
  blueprint: 'rule',
  signal: 'block',
};

export type AlarmRowProps = {
  /** The priority as a word: "Critical", "High". */
  severity: string;
  /** Colour of the priority. */
  tone: Tone;
  /** Shape for the priority, so it never rests on colour alone. */
  icon: ReactNode;
  /** Alarm text as the operator reads it. */
  message: string;
  /** Instrument tag. */
  tag: string;
  /** The reading that raised it, with its unit. */
  value: string;
  /** The limit it crossed, with its unit. */
  limit: string;
  /** Lifecycle state as a word: "Active", "Acknowledged", "Shelved", "Cleared". */
  state: string;
  /** How long ago it was raised. */
  age: string;
  /** Dealt with (acknowledged, shelved, cleared): the row recedes and stops asking for attention. */
  quiet?: boolean;
  /** Small flags after the message: chattering count, first-out, standing time. */
  markers?: ReactNode;
  /** Buttons at the end of the row. */
  actions?: ReactNode;
  /** `compact` puts everything on one line, for long lists and side panels. */
  density?: 'default' | 'compact';
  selected?: boolean;
  /** Makes the row selectable by click, Enter or Space. */
  onSelect?: () => void;
  className?: string;
};

/**
 * One alarm in one grammar: priority, message, tag, value against limit, state and age, always in
 * that order. The look decides the build — a card with an icon chip in studio, a filled priority
 * block on a hairline in console, a ruled line of type in editorial — and an alarm that has been
 * dealt with recedes in all of them. Render inside a `ul`.
 */
export function AlarmRow({
  severity,
  tone,
  icon,
  message,
  tag,
  value,
  limit,
  state,
  age,
  quiet = false,
  markers,
  actions,
  density = 'default',
  selected = false,
  onSelect,
  className,
}: AlarmRowProps) {
  const look = useLook();
  const anatomy = LOOK_ANATOMY[look];
  const compact = density === 'compact';
  const filled = look === 'signal' && !quiet;
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onSelect();
    }
  };

  const badge =
    anatomy === 'block' ? (
      <span
        className={cx(
          'flex shrink-0 items-center gap-2 self-stretch px-3 text-sm font-semibold [&>svg]:size-4 [&>svg]:shrink-0',
          compact ? 'w-28' : 'w-32',
          quiet
            ? 'text-[var(--t-ink)] [box-shadow:inset_4px_0_0_var(--t-line)]'
            : look === 'poster'
              ? 'border-r-2 border-[var(--kit-text)] bg-[var(--t-pop)] text-[var(--t-on-pop)]'
              : filled
                ? 'bg-[color-mix(in_oklab,var(--t-on-solid)_14%,transparent)]'
                : 'bg-[var(--t-solid)] text-[var(--t-on-solid)]'
        )}
      >
        {icon}
        {severity}
      </span>
    ) : anatomy === 'card' ? (
      <span
        className={cx(
          'flex shrink-0 items-center justify-center rounded-[var(--kit-radius-sm)] [&>svg]:shrink-0',
          compact ? 'size-7 [&>svg]:size-4' : 'size-10 [&>svg]:size-5',
          quiet ? 'bg-[var(--kit-track)] text-[var(--kit-text-3)]' : 'bg-[var(--t-soft)] text-[var(--t-on-soft)]'
        )}
      >
        {icon}
      </span>
    ) : (
      <span className={cx('flex w-24 shrink-0 items-center gap-1.5 text-sm font-semibold [&>svg]:size-4 [&>svg]:shrink-0', quiet ? 'text-[var(--kit-text-3)]' : 'text-[var(--t-ink)]')}>
        {icon}
        {severity}
      </span>
    );

  return (
    <li
      data-look={look}
      data-tone={tone}
      data-anatomy={anatomy}
      data-quiet={quiet || undefined}
      aria-selected={onSelect ? selected : undefined}
      role={onSelect ? 'option' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cx(
        'relative flex min-w-0 items-center text-sm text-[var(--kit-text)] outline-none',
        onSelect ? 'cursor-pointer focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-accent)]' : '',
        anatomy === 'card' &&
          cx(
            'gap-3 rounded-[var(--kit-radius-sm)] border px-3 not-first:mt-2',
            compact ? 'py-1.5' : 'py-3',
            selected ? 'border-[var(--t-line)] bg-[var(--t-soft)]' : 'border-[var(--kit-rule)] bg-[var(--kit-surface)]',
            quiet ? '' : '[box-shadow:inset_3px_0_0_var(--t-line)]'
          ),
        anatomy === 'block' &&
          cx(
            'gap-3 border-b border-[var(--kit-rule)] pr-3',
            compact ? 'min-h-9' : 'min-h-14',
            look === 'poster' ? 'border-b-2 border-[var(--kit-text)]' : '',
            filled ? 'bg-[var(--t-solid)] font-medium text-[var(--t-on-solid)]' : '',
            selected ? '[box-shadow:inset_0_0_0_2px_var(--kit-text)]' : ''
          ),
        anatomy === 'rule' &&
          cx('gap-4 border-b border-[var(--kit-rule)]', compact ? 'py-2' : 'py-3.5', selected ? 'bg-[var(--t-soft)]' : ''),
        className
      )}
    >
      {badge}
      <div className={cx('min-w-0 flex-1', compact ? 'flex items-baseline gap-3' : 'flex flex-col gap-0.5 py-1')}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cx('leading-5', quiet ? 'font-medium' : 'font-semibold', quiet && !filled ? 'text-[var(--kit-text-2)]' : '')}>{message}</span>
          {markers}
        </div>
        <div className={cx('flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] leading-5', filled ? 'opacity-90' : 'text-[var(--kit-text-2)]')}>
          <span className="font-medium whitespace-nowrap tabular-nums">{tag}</span>
          {compact ? null : anatomy === 'card' ? <span className="whitespace-nowrap">{severity}</span> : null}
        </div>
      </div>
      <div className={cx('shrink-0 text-right leading-5 tabular-nums', compact ? 'flex items-baseline gap-2' : 'flex flex-col')}>
        <span className="font-semibold whitespace-nowrap">{value}</span>
        <span className={cx('text-[0.8125rem] whitespace-nowrap', filled ? 'opacity-90' : 'text-[var(--kit-text-2)]')}>limit {limit}</span>
      </div>
      <div className={cx('shrink-0 text-right leading-5', compact ? 'flex w-40 items-baseline justify-end gap-2' : 'flex w-28 flex-col')}>
        <span className={cx('font-medium whitespace-nowrap', quiet && !filled ? 'text-[var(--kit-text-2)]' : '')}>{state}</span>
        <span className={cx('text-[0.8125rem] whitespace-nowrap tabular-nums', filled ? 'opacity-90' : 'text-[var(--kit-text-2)]')}>{age}</span>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </li>
  );
}
