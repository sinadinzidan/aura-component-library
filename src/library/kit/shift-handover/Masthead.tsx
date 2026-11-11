import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type MastheadSection = { id: string; label: string; count?: number };

type MastheadProps = {
  /** The nameplate: "The Nordkapp Handover". */
  name: string;
  /** Left of the dateline: the date. */
  date: string;
  /** Centre of the dateline: what this edition covers. */
  edition: string;
  /** Right of the dateline: issue number, time. */
  issue: string;
  /** Sections under the dateline; they act as a filter. */
  sections?: readonly MastheadSection[];
  current?: string;
  onSection?: (id: string) => void;
  /** End of the section line. */
  tools?: ReactNode;
  /** Smaller nameplate, for narrow screens. */
  size?: 'default' | 'compact';
  className?: string;
};

/**
 * A newspaper masthead as page chrome: a centred nameplate between heavy rules, a dateline, and
 * a line of sections that filter the page. For reports that are read, not operated.
 */
export function Masthead({ name, date, edition, issue, sections = [], current, onSection, tools, size = 'default', className }: MastheadProps) {
  const look = useLook();
  const compact = size === 'compact';
  return (
    <header data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      <div className="border-t-4 border-(--kit-rule-strong)" />
      <p className={cx('text-center leading-none font-medium tracking-tighter text-balance', compact ? 'py-4 text-3xl' : 'py-6 text-7xl')}>{name}</p>
      <div className={cx('grid items-baseline gap-2 border-y border-(--kit-rule-strong) py-2 text-sm', compact ? 'grid-cols-1 text-center' : 'grid-cols-3')}>
        <span className="font-medium">{date}</span>
        <span className={cx('text-(--kit-text-2)', compact ? '' : 'text-center')}>{edition}</span>
        <span className={cx('text-(--kit-text-2) tabular-nums', compact ? '' : 'text-right')}>{issue}</span>
      </div>
      {sections.length > 0 || tools ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-(--kit-rule) py-1">
          <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-6">
            {sections.map((section) => {
              const active = section.id === current;
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSection?.(section.id)}
                  className={cx(
                    '-mb-[5px] flex h-10 cursor-pointer items-baseline gap-1.5 border-b-2 pt-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--kit-text)',
                    active ? 'border-(--kit-rule-strong) font-semibold text-(--kit-text)' : 'border-transparent font-medium text-(--kit-text-2) hover:text-(--kit-text)'
                  )}
                >
                  {section.label}
                  {section.count !== undefined ? <span className="text-xs tabular-nums">{section.count}</span> : null}
                </button>
              );
            })}
          </nav>
          {tools ? <div className="ml-auto flex items-center gap-3 text-sm">{tools}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
