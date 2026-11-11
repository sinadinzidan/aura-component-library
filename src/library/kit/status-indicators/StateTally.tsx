import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { StateGlyph } from './StateGlyph';
import type { TallyEntry } from './status';

type StateTallyProps = {
  /** What is counted, for example "Equipment by run state". */
  label: string;
  entries: readonly TallyEntry[];
  /** `bar` is a proportional strip with a legend, `chips` one count per state, `list` a row per state. */
  layout?: 'bar' | 'chips' | 'list';
  /** Noun after the total: "assets", "alarms". */
  noun?: string;
  className?: string;
};

/**
 * How many things are in each state. The strip shows the proportions, the legend carries the
 * counts, and every state keeps its shape so the tally reads without colour.
 */
export function StateTally({ label, entries, layout = 'bar', noun, className }: StateTallyProps) {
  const look = useLook();
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const summary = `${label}: ${entries.map((entry) => `${entry.count} ${entry.label.toLowerCase()}`).join(', ')}`;

  if (layout === 'chips') {
    return (
      <ul aria-label={label} data-look={look} data-layout="chips" className={cx('m-0 flex list-none flex-wrap gap-2 p-0', className)}>
        {entries.map((entry) => (
          <li key={entry.label} data-tone={entry.tone} className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderRadius: 'var(--kit-radius-sm)' }}>
            <StateGlyph shape={entry.shape} tone={entry.tone} size={12} ink />
            <span className="text-base leading-none font-semibold tabular-nums">{entry.count}</span>
            <span className="text-sm font-medium">{entry.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (layout === 'list') {
    return (
      <ul aria-label={label} data-look={look} data-layout="list" className={cx('m-0 flex list-none flex-col gap-2.5 p-0', className)}>
        {entries.map((entry) => (
          <li key={entry.label} data-tone={entry.tone} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-(--kit-text)">
              <StateGlyph shape={entry.shape} tone={entry.tone} size={12} />
              {entry.label}
            </span>
            <span className="h-2.5" style={{ background: 'var(--kit-track)', borderRadius: 'var(--kit-track-radius)' }}>
              <span className="block h-full" style={{ width: `${total === 0 ? 0 : (entry.count / total) * 100}%`, background: 'var(--t-line)', borderRadius: 'var(--kit-track-radius)' }} />
            </span>
            <span className="text-right text-sm font-semibold text-(--kit-text) tabular-nums">{entry.count}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div data-look={look} data-layout="bar" className={cx('flex min-w-0 flex-col gap-3', className)}>
      <div role="img" aria-label={summary} className="flex h-3.5 gap-0.5 overflow-hidden" style={{ borderRadius: 'var(--kit-track-radius)' }}>
        {entries.map((entry) => (
          <span key={entry.label} data-tone={entry.tone} data-part="share" style={{ flexGrow: entry.count, flexBasis: 0, background: 'var(--t-line)' }} />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0">
        {entries.map((entry) => (
          <li key={entry.label} className="flex items-center gap-1.5 text-sm text-(--kit-text-2)">
            <StateGlyph shape={entry.shape} tone={entry.tone} size={11} />
            <span className="font-semibold text-(--kit-text) tabular-nums">{entry.count}</span>
            {entry.label}
          </li>
        ))}
        {noun ? (
          <li className="ml-auto text-sm text-(--kit-text-3) tabular-nums">
            {total} {noun}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
