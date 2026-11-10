import { IconAlertTriangle, IconCalendar } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type DueLabelProps = {
  /** The due date, already formatted: "13 Mar" or "in 6 h". */
  due: string;
  /** Past due and not finished: warning icon, critical text and the word "Overdue". */
  overdue?: boolean;
  /** Finished work shows its date without judgement. */
  done?: boolean;
  className?: string;
};

/**
 * A due date that says when it has been missed. Overdue is carried by an icon and the word, not
 * by red alone; a finished order never shows as overdue.
 */
export function DueLabel({ due, overdue = false, done = false, className }: DueLabelProps) {
  const late = overdue && !done;
  const Icon = late ? IconAlertTriangle : IconCalendar;

  return (
    <span
      data-slot="due-label"
      data-overdue={late ? 'true' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums',
        late ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground',
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {late ? `Overdue · ${due}` : due}
    </span>
  );
}
