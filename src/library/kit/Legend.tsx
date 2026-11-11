import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

export type LegendItem = {
  label: string;
  tone: Tone;
  /** A figure shown at the end of the item, already formatted. */
  value?: string;
  /** `line` for trend series, `dashed` for limits and plans, `swatch` for areas and bars. */
  mark?: 'swatch' | 'line' | 'dashed';
};

type LegendProps = {
  items: readonly LegendItem[];
  direction?: 'row' | 'column';
  className?: string;
};

/** Names the colours of a chart. With values it doubles as the chart's small table. */
export function Legend({ items, direction = 'row', className }: LegendProps) {
  const look = useLook();
  return (
    <ul data-look={look} data-direction={direction} className={cx('kit-legend', className)}>
      {items.map((item) => (
        <li key={item.label} data-tone={item.tone} data-mark={item.mark ?? 'swatch'} className="kit-legend-item">
          <span aria-hidden="true" className="kit-legend-mark" />
          <span className="kit-legend-label">{item.label}</span>
          {item.value ? <span className="kit-legend-value">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
