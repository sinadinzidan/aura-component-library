import { IconCheck } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './boards.css';

export type FilterGroupOption = {
  id: string;
  label: string;
  /** Records the option keeps. */
  count?: number;
  /** Colour of the tick when the option is also a series or a state on the page. */
  tone?: Tone;
};

type FilterGroupProps = {
  /** Heading of the group: "Area". */
  title: string;
  options: readonly FilterGroupOption[];
  /** Ids of the checked options. */
  value: readonly string[];
  onChange?: (value: string[]) => void;
  className?: string;
};

/**
 * One facet of a dashboard's filter rail: a heading and checkable options with counts. When an
 * option has a tone, its tick doubles as the legend swatch of that series.
 */
export function FilterGroup({ title, options, value, onChange, className }: FilterGroupProps) {
  const look = useLook();
  return (
    <fieldset data-look={look} className={cx('dash-filter', className)}>
      <legend className="dash-filter-title">{title}</legend>
      {options.map((option) => {
        const checked = value.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            data-tone={option.tone ?? 'neutral'}
            className="dash-filter-option"
            onClick={() => onChange?.(checked ? value.filter((id) => id !== option.id) : [...value, option.id])}
          >
            <span aria-hidden="true" className="dash-filter-box">
              <IconCheck />
            </span>
            <span className="dash-filter-label">{option.label}</span>
            {option.count === undefined ? null : <span className="dash-filter-count">{option.count}</span>}
          </button>
        );
      })}
    </fieldset>
  );
}
