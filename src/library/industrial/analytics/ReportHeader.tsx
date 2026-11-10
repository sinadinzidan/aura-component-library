import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type ReportHeaderProps = {
  /** Report title: "Daily production report". */
  title: string;
  /** Kind or series above the title: "Operations report". */
  overline?: string;
  /** The period the report covers, already formatted: "11 March 2026, 06:00–06:00". */
  period?: string;
  site?: string;
  /** When the report was produced: "12 Mar 2026, 06:15 UTC". */
  generatedAt?: string;
  /** Who or what produced it. */
  author?: string;
  /** Document number, in monospace. */
  documentId?: string;
  /** Review state badge or other mark beside the title. */
  status?: ReactNode;
  /** `standard` heads a page, `compact` is the running header of following pages, `cover` is a title page. */
  variant?: 'standard' | 'compact' | 'cover';
  className?: string;
};

type Field = { label: string; value: string; mono?: boolean };

/**
 * The header of a report page: what the report is, the period and site it covers, and when it was
 * generated. Every report needs all four to be read out of context — printed, forwarded or filed.
 */
export function ReportHeader({ title, overline, period, site, generatedAt, author, documentId, status, variant = 'standard', className }: ReportHeaderProps) {
  const candidates: (Field | null)[] = [
    period ? { label: 'Period', value: period } : null,
    site ? { label: 'Site', value: site } : null,
    generatedAt ? { label: 'Generated', value: generatedAt } : null,
    author ? { label: 'Prepared by', value: author } : null,
    documentId ? { label: 'Document', value: documentId, mono: true } : null,
  ];
  const fields = candidates.flatMap((field) => (field ? [field] : []));

  if (variant === 'compact') {
    return (
      <header data-slot="report-header" data-variant="compact" className={cn('flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-default pb-3', className)}>
        <p className="text-sm font-medium text-base-foreground">{title}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{[site, period, documentId].filter(Boolean).join(' · ')}</p>
      </header>
    );
  }

  const cover = variant === 'cover';

  return (
    <header data-slot="report-header" data-variant={variant} className={cn('flex flex-col', cover ? 'gap-8' : 'gap-4 border-b border-emphasized pb-4', className)}>
      <div className="flex flex-col gap-1">
        {overline ? <p className="text-xs font-medium text-muted-foreground">{overline}</p> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className={cn('font-semibold tracking-tight text-base-foreground', cover ? 'text-4xl' : 'text-2xl')}>{title}</h3>
          {status}
        </div>
      </div>
      {fields.length > 0 ? (
        <dl className={cn('grid gap-x-8 gap-y-3', cover ? 'grid-cols-1 border-t border-emphasized pt-6' : 'grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]')}>
          {fields.map((field) => (
            <div key={field.label} className={cn('flex min-w-0', cover ? 'gap-4' : 'flex-col gap-0.5')}>
              <dt className={cn('text-xs text-muted-foreground', cover ? 'w-28 shrink-0 pt-0.5' : '')}>{field.label}</dt>
              <dd className={cn('text-sm text-base-foreground tabular-nums', field.mono ? 'font-mono' : '')}>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
