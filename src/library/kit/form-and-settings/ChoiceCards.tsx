import type { CSSProperties, ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './forms.css';

export type ChoiceCardItem = { id: string; label: string; description?: string; icon?: ReactNode };

type ChoiceCardsProps = {
  /** Accessible name of the group: "Round type". */
  label: string;
  options: readonly ChoiceCardItem[];
  /** Id of the chosen option. */
  value: string;
  onChange?: (id: string) => void;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

/**
 * A single choice shown as cards, for two to four options that each need a sentence of
 * explanation. Arrow keys move the choice, as in a radio group.
 */
export function ChoiceCards({ label, options, value, onChange, columns = 3, className }: ChoiceCardsProps) {
  const look = useLook();
  const style: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const move = (index: number, step: number) => {
    const next = options[(index + step + options.length) % options.length];
    onChange?.(next.id);
  };
  return (
    <div role="radiogroup" aria-label={label} data-look={look} style={style} className={cx('form-choices', className)}>
      {options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          tabIndex={option.id === value ? 0 : -1}
          className="form-choice"
          onClick={() => onChange?.(option.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') move(index, 1);
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') move(index, -1);
          }}
        >
          <span className="form-choice-head">
            {option.icon ? (
              <span aria-hidden="true" className="form-choice-icon">
                {option.icon}
              </span>
            ) : null}
            <span className="form-choice-label">{option.label}</span>
            <span aria-hidden="true" className="form-choice-radio" />
          </span>
          {option.description ? <span className="form-choice-description">{option.description}</span> : null}
        </button>
      ))}
    </div>
  );
}
