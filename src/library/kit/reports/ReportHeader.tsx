import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

type ReportHeaderProps = {
  /** `standard` opens a report, `cover` fills a title page, `running` repeats on following pages. */
  variant?: 'standard' | 'cover' | 'running';
  /** The kind of report: "Daily production report". */
  kind: string;
  /** The headline: the period, or the finding on a cover. */
  title: string;
  /** Period covered, written out: "Thursday 12 March 2026, 00:00–24:00 UTC". */
  period: string;
  site: string;
  /** Absolute time the report was produced. */
  generated: string;
  /** Document number. */
  documentId?: string;
  /** Review state, shown as a word. */
  state?: { label: string; tone: Tone };
  /** A brand mark in front of the site name. */
  mark?: ReactNode;
  /** One or two sentences under a cover title. */
  lead?: string;
  className?: string;
};

/**
 * The block that tells a reader what they hold: kind of report, period, site, when it was
 * produced and its document number. A report is read out of context, so the running variant
 * repeats the short form on every following page.
 */
export function ReportHeader({ variant = 'standard', kind, title, period, site, generated, documentId, state, mark, lead, className }: ReportHeaderProps) {
  const look = useLook();
  const meta: Array<[string, string]> = [
    ['Period', period],
    ['Site', site],
    ['Generated', generated],
  ];
  if (documentId) meta.push(['Document', documentId]);
  const pill = state ? <StatusPill tone={state.tone}>{state.label}</StatusPill> : null;

  if (variant === 'running') {
    return (
      <header data-look={look} data-variant="running" className={cx('mb-6 flex items-baseline justify-between gap-4 border-b border-(--kit-rule-strong) pb-2 text-xs leading-4 text-(--kit-text-2)', className)}>
        <span className="font-semibold text-(--kit-text)">{kind}</span>
        <span className="tabular-nums">
          {site} · {period}
          {documentId ? ` · ${documentId}` : ''}
        </span>
      </header>
    );
  }

  if (variant === 'cover') {
    return (
      <header data-look={look} data-variant="cover" className={cx('flex h-full flex-col', className)}>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {mark}
            {site}
          </span>
          {pill}
        </div>
        <div className="mt-auto pt-16">
          <p className="text-base font-medium text-(--kit-text-2)">{kind}</p>
          <h2 className="mt-3 text-5xl leading-[1.05] font-semibold tracking-tight text-balance">{title}</h2>
          {lead ? <p className="mt-5 max-w-xl text-lg leading-7 text-(--kit-text-2)">{lead}</p> : null}
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 border-t-2 border-(--kit-text) pt-5">
          {meta.map(([term, value]) => (
            <div key={term}>
              <dt className="text-xs font-medium text-(--kit-text-2)">{term}</dt>
              <dd className="text-sm font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>
    );
  }

  return (
    <header data-look={look} data-variant="standard" className={cx('mb-6 border-b-2 border-(--kit-text) pb-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-(--kit-text-2)">
            {mark}
            {kind}
          </p>
          <h2 className="mt-1 text-3xl leading-9 font-semibold tracking-tight text-balance">{title}</h2>
        </div>
        {pill}
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        {meta.map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs font-medium text-(--kit-text-2)">{term}</dt>
            <dd className="text-sm font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
