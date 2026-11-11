import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type NotebookCellKind = 'prompt' | 'code' | 'result' | 'note';

const KIND_LABEL: Record<NotebookCellKind, string> = {
  prompt: 'Prompt',
  code: 'Code',
  result: 'Result',
  note: 'Note',
};

type NotebookCellProps = {
  /** Position in the notebook, shown in the gutter. */
  index: number;
  kind: NotebookCellKind;
  /** A heading for the cell: the question, or what the result shows. */
  title?: string;
  /** End of the header: run time, row count, who edited it. */
  meta?: string;
  /** Actions for the cell: run, edit, pin. */
  actions?: ReactNode;
  className?: string;
  /** The cell body. Code is set in the code font; everything else in the UI font. */
  children: ReactNode;
};

/**
 * One cell of an AI notebook: a numbered gutter, the kind of cell, and its body. Prompt and note
 * cells read as text, code cells sit in a well in the code font, result cells hold charts and
 * tables. Rules and corners follow the look.
 */
export function NotebookCell({ index, kind, title, meta, actions, className, children }: NotebookCellProps) {
  const look = useLook();
  return (
    <section data-look={look} data-kind={kind} aria-label={`Cell ${index}, ${KIND_LABEL[kind]}`} className={cx('flex min-w-0 gap-4', className)}>
      <div className="flex w-12 shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right">
        <span className="text-lg leading-none font-medium text-(color:--kit-text-3) tabular-nums">{String(index).padStart(2, '0')}</span>
        <span className="text-xs text-(color:--kit-text-3)">{KIND_LABEL[kind]}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 border-l-2 border-(--kit-rule) pb-1 pl-4 data-[kind=prompt]:border-(--kit-line-accent)" data-kind={kind}>
        {title || meta || actions ? (
          <header className="flex items-baseline gap-3">
            {title ? <h4 className={cx('font-semibold text-(color:--kit-text)', kind === 'prompt' ? 'text-lg tracking-tight' : 'text-sm')}>{title}</h4> : null}
            {meta ? <span className="ml-auto shrink-0 text-xs whitespace-nowrap text-(color:--kit-text-3) tabular-nums">{meta}</span> : null}
            {actions ? <span className={cx('flex items-center gap-1 self-center', meta ? '' : 'ml-auto')}>{actions}</span> : null}
          </header>
        ) : null}
        {kind === 'code' ? (
          <pre className="overflow-x-auto rounded-(--kit-radius-sm) border border-(--kit-rule) bg-(--kit-well) p-3.5 font-mono text-sm leading-6 text-(color:--kit-text)">
            <code>{children}</code>
          </pre>
        ) : (
          <div className="flex min-w-0 flex-col gap-3 text-sm leading-relaxed text-(color:--kit-text)">{children}</div>
        )}
      </div>
    </section>
  );
}
