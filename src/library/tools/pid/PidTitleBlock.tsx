import { cn } from '../../../lib/utils';

import type { PidDrawing } from './pidModel';

export type PidTitleBlockProps = {
  drawing: Pick<PidDrawing, 'number' | 'title' | 'area' | 'revision' | 'status' | 'issuedOn' | 'drawnBy' | 'checkedBy' | 'sheet'>;
  /** `compact` keeps the number, revision and status only, for an overlay on a small viewer. */
  variant?: 'full' | 'compact';
  className?: string;
};

function Cell({ label, value, mono = false, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5 px-2 py-1.5', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('text-xs font-medium text-base-foreground tabular-nums', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

/**
 * The title block of a drawing: what it is, which revision is on screen and who issued it. It
 * keeps the drafting convention of ruled cells because that is where people look for a revision.
 */
export function PidTitleBlock({ drawing, variant = 'full', className }: PidTitleBlockProps) {
  if (variant === 'compact') {
    return (
      <dl data-slot="pid-title-block" aria-label="Title block" className={cn('flex w-fit divide-x divide-default rounded-md border border-default bg-base-background', className)}>
        <Cell label="Drawing" value={drawing.number} mono />
        <Cell label="Rev" value={drawing.revision} />
        <Cell label="Status" value={drawing.status} />
      </dl>
    );
  }
  return (
    <dl data-slot="pid-title-block" aria-label="Title block" className={cn('grid w-72 grid-cols-6 rounded-md border border-default bg-base-background', className)}>
      <Cell label="Title" value={drawing.title} className="col-span-6 border-b border-default" />
      <Cell label="Drawing number" value={drawing.number} mono className="col-span-4 border-b border-r border-default" />
      <Cell label="Rev" value={drawing.revision} className="col-span-2 border-b border-default" />
      <Cell label="Area" value={drawing.area} className="col-span-3 border-b border-r border-default" />
      <Cell label="Status" value={drawing.status} className="col-span-3 border-b border-default" />
      <Cell label="Issued" value={drawing.issuedOn} className="col-span-2 border-r border-default" />
      <Cell label="Drawn / checked" value={`${drawing.drawnBy} / ${drawing.checkedBy}`} className="col-span-2 border-r border-default" />
      <Cell label="Sheet" value={drawing.sheet} className="col-span-2" />
    </dl>
  );
}
