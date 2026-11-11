import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type FilterPill = { id: string; label: string; count?: number; tone?: Tone };

type FilterPillsProps = {
  /** Names the group, for example "Filter by area". */
  label: string;
  items: readonly FilterPill[];
  /** Ids that are switched on. */
  selected: readonly string[];
  onToggle: (id: string) => void;
  className?: string;
};

/**
 * Toggle filters for a dashboard header: each pill is a pressed or unpressed button with its
 * count. A pressed pill is filled with its tone; an unpressed one is an outline.
 */
export function FilterPills({ label, items, selected, onToggle, className }: FilterPillsProps) {
  const look = useLook();
  return (
    <div role="group" aria-label={label} data-look={look} className={cx('flex flex-wrap items-center gap-2', className)}>
      {items.map((item) => {
        const on = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            data-tone={item.tone ?? 'accent'}
            onClick={() => onToggle(item.id)}
            className={cx(
              'inline-flex h-8 cursor-pointer items-center gap-2 rounded-(--kit-track-radius) border px-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kit-text)',
              on ? 'border-transparent bg-(--t-vivid) text-(--t-on-vivid)' : 'border-(--kit-rule-strong) bg-transparent text-(--kit-text) hover:bg-(--kit-track)'
            )}
          >
            {item.label}
            {item.count !== undefined ? <span className="tabular-nums opacity-80">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
