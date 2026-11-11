import type { ReactNode } from 'react';

import { cx } from '../tones';

type ReportFigureProps = {
  /** "Figure" for a chart or picture, "Table" for a table. */
  kind?: 'Figure' | 'Table';
  number: number;
  /** The finding, not only what is shown: "Export recovered within 40 minutes of the trip." */
  caption: string;
  /** Where the data comes from. */
  source?: string;
  /** Tables carry the caption above, figures below. */
  className?: string;
  children: ReactNode;
};

/** A numbered figure or table with a caption that states the finding and a source line. */
export function ReportFigure({ kind = 'Figure', number, caption, source, className, children }: ReportFigureProps) {
  const text = (
    <figcaption className={cx('text-sm leading-5', kind === 'Table' ? 'mb-2' : 'mt-3 border-t border-(--kit-rule) pt-2')}>
      <span className="font-semibold">
        {kind} {number}.
      </span>{' '}
      {caption}
      {source ? <span className="block text-xs leading-4 text-(--kit-text-2)">Source: {source}</span> : null}
    </figcaption>
  );

  return (
    <figure data-kind={kind} className={cx('min-w-0', className)}>
      {kind === 'Table' ? text : null}
      {children}
      {kind === 'Figure' ? text : null}
    </figure>
  );
}
