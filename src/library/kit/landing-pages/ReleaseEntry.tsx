import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type ReleaseChangeKind = 'new' | 'improved' | 'fixed';

export type ReleaseChange = { kind: ReleaseChangeKind; text: string };

const KIND_LABEL: Record<ReleaseChangeKind, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

const KIND_TONE: Record<ReleaseChangeKind, Tone> = {
  new: 'success',
  improved: 'info',
  fixed: 'neutral',
};

type ReleaseEntryProps = {
  /** The version or release name: "2026.3". */
  version: string;
  /** When it shipped, already formatted. */
  date: string;
  /** The headline of the release. */
  title: string;
  /** One or two sentences on what it means for the reader. */
  summary?: ReactNode;
  changes: readonly ReleaseChange[];
  /** The newest release is marked as such. */
  latest?: boolean;
  className?: string;
};

/**
 * One release in a changelog: the version and date in a margin column, a headline, and every
 * change labelled New, Improved or Fixed in words and colour.
 */
export function ReleaseEntry({ version, date, title, summary, changes, latest = false, className }: ReleaseEntryProps) {
  const look = useLook();
  const filled = look === 'console' || look === 'poster' || look === 'signal';
  return (
    <article data-look={look} className={cx('flex min-w-0 gap-6', className)}>
      <div className="flex w-36 shrink-0 flex-col gap-1">
        <span className="text-2xl leading-none font-(--kit-figure-weight) tracking-tight text-(color:--kit-text) tabular-nums">{version}</span>
        <span className="text-sm whitespace-nowrap text-(color:--kit-text-2) tabular-nums">{date}</span>
        {latest ? <span className="mt-1 w-fit rounded-(--kit-track-radius) bg-(--kit-accent) px-2 py-0.5 text-xs font-semibold text-(color:--kit-on-accent)">Latest</span> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h4 className="text-lg font-semibold tracking-tight text-(color:--kit-text)">{title}</h4>
        {summary ? <p className="max-w-[60ch] text-sm text-(color:--kit-text-2)">{summary}</p> : null}
        <ul className="flex flex-col gap-2">
          {changes.map((change) => (
            <li key={change.text} data-tone={KIND_TONE[change.kind]} className="flex items-start gap-3 text-sm text-(color:--kit-text)">
              <span
                className={cx(
                  'w-20 shrink-0 rounded-(--kit-radius-sm) px-2 py-0.5 text-center text-xs font-semibold',
                  filled ? 'bg-(--t-solid) text-(color:--t-on-solid)' : 'bg-(--t-soft) text-(color:--t-on-soft)',
                )}
              >
                {KIND_LABEL[change.kind]}
              </span>
              <span>{change.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
