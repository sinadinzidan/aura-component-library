import { IconArrowRight } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type ChangeItem = {
  id: string;
  /** The setting: "High limit", "Priority", "On-delay". */
  attribute: string;
  /** Current value, formatted. */
  from: string;
  /** Proposed value, formatted. Equal to `from` when it stays. */
  to: string;
  /** Why it changes. */
  reason?: string;
};

type ChangeListProps = {
  /** Accessible name, for example "Proposed changes to 23-TT-92532". */
  label: string;
  items: readonly ChangeItem[];
  /** Column headers for the two values. */
  fromHeader?: string;
  toHeader?: string;
  className?: string;
};

/**
 * Current against proposed, one setting per row. A changed value is set strong on a wash with
 * the old value beside it and the reason under it; an unchanged one says so and stays quiet, so
 * a reviewer sees the size of the change before reading a line.
 */
export function ChangeList({ label, items, fromHeader = 'Current', toHeader = 'Proposed', className }: ChangeListProps) {
  const look = useLook();
  const columns = 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_1.25rem_minmax(0,1fr)] items-center gap-x-3';
  const changed = items.filter((item) => item.from !== item.to).length;

  return (
    <div data-look={look} className={cx('flex flex-col text-sm text-[var(--kit-text)]', className)}>
      <div className={cx(columns, 'pb-2 text-xs font-medium text-[var(--kit-text-2)]')}>
        <span>Setting</span>
        <span>{fromHeader}</span>
        <span />
        <span>{toHeader}</span>
      </div>
      <ul aria-label={label} className="flex flex-1 flex-col">
        {items.map((item) => {
          const differs = item.from !== item.to;
          return (
            <li key={item.id} data-changed={differs} className="flex flex-1 flex-col justify-center border-t border-[var(--kit-rule)] py-2.5">
              <div className={columns}>
                <span className="font-medium">{item.attribute}</span>
                <span className={cx('tabular-nums', differs ? 'text-[var(--kit-text-2)] line-through decoration-[var(--kit-text-3)]' : 'text-[var(--kit-text-2)]')}>{item.from}</span>
                {differs ? <IconArrowRight aria-hidden="true" className="size-4 text-[var(--kit-text-2)]" /> : <span />}
                {differs ? (
                  <span data-tone="accent" className={cx('justify-self-start px-2 py-0.5 font-semibold tabular-nums', look === 'blueprint' || look === 'editorial' ? 'border border-[var(--t-line)] text-[var(--t-ink)]' : 'rounded-[var(--kit-radius-sm)] bg-[var(--t-soft)] text-[var(--t-on-soft)]')}>
                    {item.to}
                  </span>
                ) : (
                  <span className="text-[var(--kit-text-2)]">No change</span>
                )}
              </div>
              {item.reason ? <p className="pt-1 text-[0.8125rem] leading-5 text-[var(--kit-text-2)]">{item.reason}</p> : null}
            </li>
          );
        })}
      </ul>
      <p className="border-t border-[var(--kit-rule-strong)] pt-2 text-xs font-medium text-[var(--kit-text-2)]">
        {changed} of {items.length} settings change
      </p>
    </div>
  );
}
