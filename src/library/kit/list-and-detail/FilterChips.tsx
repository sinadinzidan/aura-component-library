import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './records.css';

export type FilterChipOption = { id: string; label: string; count?: number };

type FilterChipsProps = {
  /** Accessible name: "Filter by status". */
  label: string;
  options: readonly FilterChipOption[];
  /** Id of the active option. */
  value: string;
  onChange?: (id: string) => void;
  className?: string;
};

/** One-of-many quick filters above a list, each with the number of records it keeps. */
export function FilterChips({ label, options, value, onChange, className }: FilterChipsProps) {
  const look = useLook();
  return (
    <div role="group" aria-label={label} data-look={look} className={cx('rec-chips', className)}>
      {options.map((option) => (
        <button key={option.id} type="button" className="rec-chip" aria-pressed={option.id === value} onClick={() => onChange?.(option.id)}>
          <span>{option.label}</span>
          {option.count === undefined ? null : <span className="rec-chip-count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
