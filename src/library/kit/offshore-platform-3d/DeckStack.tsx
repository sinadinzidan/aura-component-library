import { IconUsers } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx } from '../tones';

import { deckAlarmCount, deckTone } from './deckLevels';
import type { DeckStackLevel } from './deckLevels';

type DeckStackProps = {
  /** Accessible name, for example "Decks of Valhall Sør". */
  label: string;
  /** Top level first: the stack is drawn the way the structure stands. */
  levels: readonly DeckStackLevel[];
  selectedId?: string | null;
  /** Called with a level id. Selecting the selected level again is the caller's toggle. */
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * A structure as a stack of selectable levels, drawn top to bottom the way it stands: an offshore
 * platform's decks, the floors of a building, the trays of a column. Each block carries the
 * level's elevation, the people on it and its open alarms as filled status blocks; a level with
 * alarms gets an edge bar in the tone of the worst one.
 */
export function DeckStack({ label, levels, selectedId = null, onSelect, className }: DeckStackProps) {
  const look = useLook();
  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-h-0 flex-col gap-px bg-[var(--kit-rule)]', className)}>
      {levels.map((level) => {
        const tone = deckTone(level);
        const count = deckAlarmCount(level);
        const selected = level.id === selectedId;
        return (
          <li key={level.id} data-tone={tone} className="flex min-h-0 bg-[var(--kit-surface)]" style={{ flexGrow: level.weight ?? 1, flexBasis: 0 }}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${level.name}, ${level.elevation}, ${level.people} on board, ${count === 0 ? 'no open alarms' : level.alarms.map((alarm) => `${alarm.count} ${alarm.label}`).join(', ')}`}
              onClick={() => onSelect?.(level.id)}
              className={cx(
                'relative flex min-h-[4.75rem] w-full flex-col justify-between gap-2 py-2.5 pl-4 pr-3 text-left',
                'hover:bg-[color-mix(in_oklab,var(--kit-text)_6%,transparent)]',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring-default)]',
                selected && 'bg-[color-mix(in_oklab,var(--kit-line-accent)_16%,transparent)] shadow-[inset_0_0_0_2px_var(--kit-line-accent)]'
              )}
            >
              {tone === 'neutral' ? null : <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[var(--t-solid)]" />}
              <span className="flex flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-semibold leading-tight text-[var(--kit-text)]">{level.name}</span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--kit-text-3)]">{level.elevation}</span>
                </span>
                {level.detail ? <span className="text-[0.8125rem] leading-snug text-[var(--kit-text-2)]">{level.detail}</span> : null}
              </span>
              <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="flex items-center gap-1 text-[0.8125rem] tabular-nums text-[var(--kit-text-2)]">
                  <IconUsers aria-hidden="true" className="size-3.5" />
                  {level.people}
                </span>
                <span className="flex flex-wrap justify-end gap-1">
                  {count === 0 ? (
                    <span className="text-[0.8125rem] text-[var(--kit-text-3)]">Normal</span>
                  ) : (
                    level.alarms
                      .filter((alarm) => alarm.count > 0)
                      .map((alarm) => (
                        <StatusPill key={alarm.label} tone={alarm.tone}>
                          {alarm.count} {alarm.label}
                        </StatusPill>
                      ))
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
