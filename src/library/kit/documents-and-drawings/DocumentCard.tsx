import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx } from '../tones';

import { APPROVAL_LABEL, APPROVAL_TONE, DOCUMENT_KIND_LABEL, DOCUMENT_KIND_TONE, type DocumentRecord } from './documents';
import { PageThumb } from './PageThumb';

type DocumentCardProps = {
  document: DocumentRecord;
  /** `stacked` puts the preview on top for a gallery; `row` puts it at the side for a list. */
  layout?: 'stacked' | 'row';
  /** Controls at the end: open, download. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One document as a card: a preview of its first page, what kind it is, its number and
 * revision, and whether it is approved for use. The surface follows the look's panel anatomy.
 */
export function DocumentCard({ document, layout = 'stacked', actions, className }: DocumentCardProps) {
  const look = useLook();
  const row = layout === 'row';

  return (
    <article
      aria-label={`${document.id}, ${document.title}`}
      data-look={look}
      data-layout={layout}
      className={cx('flex min-w-0 overflow-hidden text-[var(--kit-text)]', row ? 'items-stretch' : 'h-full flex-col', className)}
      style={{ background: 'var(--kit-panel-bg)', border: 'var(--kit-panel-border)', borderRadius: 'var(--kit-radius)', boxShadow: 'var(--kit-panel-shadow)' }}
    >
      <div
        data-tone={DOCUMENT_KIND_TONE[document.kind]}
        className={cx('flex shrink-0 items-center justify-center bg-[var(--t-soft)]', row ? 'w-32 p-3' : 'h-40 p-4')}
        style={look === 'poster' ? { borderBottom: row ? undefined : '2px solid var(--kit-text)', borderRight: row ? '2px solid var(--kit-text)' : undefined } : undefined}
      >
        <PageThumb label={`First page of ${document.id}`} kind={document.kind} revision={document.revision} className={document.kind === 'pid' || document.kind === 'drawing' ? 'w-full max-w-40' : 'h-full'} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <span data-tone={DOCUMENT_KIND_TONE[document.kind]} className="text-xs font-semibold leading-4 text-[var(--t-ink)]">
          {DOCUMENT_KIND_LABEL[document.kind]}
        </span>
        <h4 className="text-sm font-semibold leading-5">{document.title}</h4>
        <TagId>{document.id}</TagId>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-xs leading-4 text-[var(--kit-text-2)]">
          <StatusPill tone={APPROVAL_TONE[document.approval]}>{APPROVAL_LABEL[document.approval]}</StatusPill>
          <span className="tabular-nums">
            {document.pages === 1 ? '1 page' : `${document.pages} pages`} · {document.date}
          </span>
          {actions ? <span className="ml-auto flex items-center gap-1">{actions}</span> : null}
        </div>
      </div>
    </article>
  );
}
