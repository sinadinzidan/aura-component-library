import { IconCertificate, IconFileSpreadsheet, IconFileText, IconListCheck, IconRuler2, IconSchema } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type DocumentKind = 'pid' | 'drawing' | 'datasheet' | 'procedure' | 'report' | 'certificate';

export type DocumentRowProps = {
  kind: DocumentKind;
  title: string;
  /** Document number, e.g. "NK-23-PR-0012". */
  number?: string;
  /** Revision as issued, e.g. "C" or "04". */
  revision: string;
  /** Issue date as shown, e.g. "4 Feb 2026". */
  date: string;
  /** Between the title and the revision: an approval state, a match count. */
  status?: ReactNode;
  /** At the end: a download button, a menu. */
  trailing?: ReactNode;
  className?: string;
};

const KIND_ICON = {
  pid: IconSchema,
  drawing: IconRuler2,
  datasheet: IconFileSpreadsheet,
  procedure: IconListCheck,
  report: IconFileText,
  certificate: IconCertificate,
} as const;

const KIND_LABEL: Record<DocumentKind, string> = {
  pid: 'P&ID',
  drawing: 'Drawing',
  datasheet: 'Data sheet',
  procedure: 'Procedure',
  report: 'Report',
  certificate: 'Certificate',
};

/** The word for a document kind, for filters and legends. */
export const documentKindLabel = (kind: DocumentKind): string => KIND_LABEL[kind];

/**
 * A document or drawing on one line: kind icon, title and number, revision, issue date. Revision
 * and date sit in fixed columns so a list of rows scans like a register.
 */
export function DocumentRow({ kind, title, number, revision, date, status, trailing, className }: DocumentRowProps) {
  const Icon = KIND_ICON[kind];
  return (
    <div data-slot="document-row" data-kind={kind} className={cn('flex w-full items-center gap-3 py-2', className)}>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-base-foreground">{title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {KIND_LABEL[kind]}
          {number ? (
            <>
              {' · '}
              <span className="font-mono">{number}</span>
            </>
          ) : null}
        </span>
      </div>
      {status}
      <span className="w-12 shrink-0 text-xs text-base-foreground tabular-nums">Rev {revision}</span>
      <span className="w-20 shrink-0 text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">{date}</span>
      {trailing}
    </div>
  );
}
