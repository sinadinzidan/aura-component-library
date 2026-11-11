import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

import { categoryStyle, type LogCategory } from './log';
import { PersonChip } from './PersonChip';

type LogEntryProps = {
  /** Clock time of the entry, `HH:MM`. */
  time: string;
  category: LogCategory;
  author: string;
  /** Role or shift of the author. */
  role?: string;
  /** Colour family of the author's chip. */
  authorTone?: Tone;
  text: string;
  /** Tags, work orders or alarms the entry refers to. */
  links?: ReactNode;
  /** A pinned entry stays on top until it is unpinned, e.g. a standing instruction. */
  pinned?: boolean;
  /** Acknowledgement line or button under the text. */
  acknowledgement?: ReactNode;
  /** Comments or other content nested under the entry. */
  children?: ReactNode;
  /** `dense` puts everything on one or two lines for a console or a long feed. */
  density?: 'default' | 'dense';
  className?: string;
};

/**
 * One logbook entry: when, what kind, who, and what happened, with the things it refers to.
 * The time leads so a feed scans as a timeline. Editorial sets the time in a margin column,
 * console and dense rows drop the avatar and carry the category as an edge bar, and the
 * other looks draw a chip-led row.
 */
export function LogEntry({ time, category, author, role, authorTone = 'neutral', text, links, pinned = false, acknowledgement, children, density = 'default', className }: LogEntryProps) {
  const look = useLook();
  const style = categoryStyle(category);
  const dense = density === 'dense' || look === 'console';
  const margin = look === 'editorial';

  if (dense) {
    return (
      <li data-look={look} data-tone={style.tone} data-category={category} data-pinned={pinned} className={cx('flex min-w-0 items-baseline gap-4 py-2.5 pr-4 pl-4', className)} style={{ borderTop: '1px solid var(--kit-rule)', boxShadow: 'inset 4px 0 0 var(--t-line)' }}>
        <time className="w-12 shrink-0 text-sm font-semibold text-(--kit-text) tabular-nums">{time}</time>
        <span className="w-32 shrink-0 text-sm font-semibold" style={{ color: 'var(--t-ink)' }}>
          {style.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-(--kit-text)">
            {pinned ? <span className="font-semibold">Pinned · </span> : null}
            {text}
          </p>
          {links ? <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--kit-text-3)">{links}</div> : null}
          {acknowledgement ? <div className="mt-1.5">{acknowledgement}</div> : null}
          {children}
        </div>
        <span className="shrink-0 text-sm text-(--kit-text-2)">{author}</span>
      </li>
    );
  }

  return (
    <li data-look={look} data-category={category} data-pinned={pinned} className={cx('flex min-w-0 gap-4 py-4', className)} style={{ borderTop: '1px solid var(--kit-rule)' }}>
      {margin ? (
        <time className="w-16 shrink-0 text-xl leading-7 font-semibold text-(--kit-text) tabular-nums">{time}</time>
      ) : (
        <PersonChip name={author} tone={authorTone} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-(--kit-text)">{author}</span>
          {role ? <span className="text-sm text-(--kit-text-3)">{role}</span> : null}
          <StatusPill tone={style.tone} variant={pinned ? 'filled' : 'soft'}>
            {pinned ? `Pinned · ${style.label}` : style.label}
          </StatusPill>
          {margin ? null : <time className="ml-auto text-sm font-medium text-(--kit-text-2) tabular-nums">{time}</time>}
        </div>
        <p className="text-sm leading-6 text-(--kit-text)">{text}</p>
        {links ? <div className="flex flex-wrap items-center gap-2 text-xs text-(--kit-text-3)">{links}</div> : null}
        {acknowledgement ? <div className="mt-1">{acknowledgement}</div> : null}
        {children}
      </div>
    </li>
  );
}
