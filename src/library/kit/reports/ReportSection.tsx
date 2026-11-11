import type { ReactNode } from 'react';

import { cx } from '../tones';

type ReportSectionProps = {
  /** Section number as printed: "1", "2.1". */
  number: string;
  title: string;
  /** `side` puts the heading in a left column, the way a typeset report does. */
  layout?: 'stacked' | 'side';
  className?: string;
  children: ReactNode;
};

/** A numbered section of a report, so the text and a meeting can refer to "section 2.1". */
export function ReportSection({ number, title, layout = 'stacked', className, children }: ReportSectionProps) {
  const heading = (
    <h3 className={cx('flex items-baseline gap-3 font-semibold tracking-tight', number.includes('.') ? 'text-base leading-6' : 'text-xl leading-7')}>
      <span className="font-medium text-(--kit-text-2) tabular-nums">{number}</span>
      {title}
    </h3>
  );

  return layout === 'side' ? (
    <section data-layout="side" className={cx('grid grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] gap-8 border-t border-(--kit-rule-strong) pt-4', className)}>
      {heading}
      <div className="min-w-0 space-y-3">{children}</div>
    </section>
  ) : (
    <section data-layout="stacked" className={cx('min-w-0', className)}>
      {heading}
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
