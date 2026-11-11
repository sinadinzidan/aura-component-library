import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type ReportPageProps = {
  /** Accessible name of the sheet: "Daily production report, page 1". */
  label: string;
  /** The header block, usually a `ReportHeader`. */
  header?: ReactNode;
  /** The running footer: document id on the left, page count on the right. */
  footer?: { left: string; center?: string; page: number; of: number };
  /** `a4` keeps the proportions of a portrait sheet; `auto` hugs the content. */
  size?: 'a4' | 'landscape' | 'auto';
  /** Space between the page edge and the content. */
  margin?: 'narrow' | 'normal' | 'wide';
  className?: string;
  children: ReactNode;
};

const PAPER_LOOKS = ['studio', 'soft', 'glass'];
const ASPECT = { a4: '210 / 297', landscape: '297 / 210', auto: undefined };
const MARGIN = { narrow: 'p-6', normal: 'p-10', wide: 'px-16 py-12' };

/**
 * One sheet of a report: a paper-proportioned surface with a header, a body and a running footer
 * pinned to the bottom edge. The sheet is a lifted page in studio, soft and glass, a framed
 * drawing with corner ticks on a blueprint, and flush with the canvas in the flat looks.
 */
export function ReportPage({ label, header, footer, size = 'a4', margin = 'normal', className, children }: ReportPageProps) {
  const look = useLook();
  const lifted = PAPER_LOOKS.includes(look);

  return (
    <article
      aria-label={label}
      data-look={look}
      data-size={size}
      className={cx(
        'relative flex min-w-0 flex-col bg-(--kit-surface) text-sm leading-6 text-(--kit-text)',
        MARGIN[margin],
        lifted && 'rounded-(--kit-radius-sm) border border-(--kit-rule)',
        look === 'blueprint' && 'border-2 border-(--kit-rule-strong)',
        look === 'poster' && 'border-2 border-(--kit-text)',
        look === 'console' && 'border border-(--kit-rule)',
        className,
      )}
      style={{ aspectRatio: ASPECT[size], boxShadow: lifted ? 'var(--kit-panel-shadow)' : undefined }}
    >
      {look === 'blueprint' ? (
        <>
          <span aria-hidden="true" className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-(--kit-rule-strong)" />
          <span aria-hidden="true" className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-(--kit-rule-strong)" />
          <span aria-hidden="true" className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-(--kit-rule-strong)" />
          <span aria-hidden="true" className="absolute right-2 bottom-2 h-3 w-3 border-r-2 border-b-2 border-(--kit-rule-strong)" />
        </>
      ) : null}
      {header ? <div className="shrink-0">{header}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? (
        <footer className="mt-6 flex shrink-0 items-baseline justify-between gap-4 border-t border-(--kit-rule-strong) pt-3 text-xs leading-4 text-(--kit-text-2) tabular-nums">
          <span>{footer.left}</span>
          {footer.center ? <span>{footer.center}</span> : null}
          <span className="font-medium text-(--kit-text)">
            Page {footer.page} of {footer.of}
          </span>
        </footer>
      ) : null}
    </article>
  );
}
