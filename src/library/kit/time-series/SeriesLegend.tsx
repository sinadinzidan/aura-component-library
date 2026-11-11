import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type SeriesLegendItem = {
  id: string;
  label: string;
  tone: Tone;
  /** Current value, already formatted with its unit. */
  value?: string;
  /** A second line: the tag or the axis the series is on. */
  detail?: string;
};

type SeriesLegendProps = {
  items: readonly SeriesLegendItem[];
  /** Ids of the series that are switched off. */
  hidden?: readonly string[];
  /** Makes every item a toggle. Leave out for a read-only legend. */
  onToggle?: (id: string) => void;
  direction?: 'row' | 'column';
  className?: string;
};

/**
 * A legend that carries the current value of every series and, when given `onToggle`, switches
 * series on and off. A hidden series keeps its place and its name so it can be brought back.
 */
export function SeriesLegend({ items, hidden = [], onToggle, direction = 'row', className }: SeriesLegendProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <ul data-look={look} className={cx('m-0 flex min-w-0 list-none p-0', direction === 'row' ? 'flex-wrap gap-2' : 'flex-col gap-1.5', className)}>
      {items.map((item) => {
        const off = hidden.includes(item.id);
        const body = (
          <>
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0"
              style={{ background: off ? 'transparent' : 'var(--t-line)', boxShadow: 'inset 0 0 0 2px var(--t-line)', borderRadius: square ? 0 : 4 }}
            />
            <span className="flex min-w-0 flex-col text-left">
              <span className={cx('text-sm font-medium', off ? 'text-(--kit-text-3) line-through' : 'text-(--kit-text)')}>{item.label}</span>
              {item.detail ? <span className="text-xs text-(--kit-text-3)">{item.detail}</span> : null}
            </span>
            {item.value ? <span className={cx('ml-auto pl-3 text-sm font-semibold tabular-nums', off ? 'text-(--kit-text-3)' : 'text-(--kit-text)')}>{off ? 'Hidden' : item.value}</span> : null}
          </>
        );
        const shell = cx('flex w-full min-w-0 items-center gap-2 px-2.5 py-1.5', direction === 'row' ? '' : 'justify-start');
        const style = { border: '1px solid var(--kit-rule)', borderRadius: 'var(--kit-radius-sm)', background: off ? 'transparent' : 'var(--kit-surface)' };
        return (
          <li key={item.id} data-tone={item.tone} className={direction === 'row' ? 'min-w-0' : 'w-full min-w-0'}>
            {onToggle ? (
              <button type="button" aria-pressed={!off} onClick={() => onToggle(item.id)} className={cx(shell, 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-(--kit-rule-strong)')} style={style}>
                {body}
              </button>
            ) : (
              <div className={shell} style={style}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
