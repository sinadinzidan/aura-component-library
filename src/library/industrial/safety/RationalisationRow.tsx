import { IconArrowNarrowRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { RESPONSE_LABEL, SEVERITY_LABEL, alarmPriorityStatus, rationalise } from './priorityMatrix';
import type { AlarmPriority, ConsequenceSeverity } from './priorityMatrix';

/** Column headings of the worksheet, in the order `RationalisationRow` renders its cells. */
export const RATIONALISATION_COLUMNS = ['Alarm', 'Cause', 'Consequence of no action', 'Operator action', 'Time to respond', 'Priority'] as const;

export type RationalisationRowProps = {
  /** Instrument tag of the alarm. */
  tag: string;
  /** Alarm type: "High", "Low low", "Deviation". */
  alarmType: string;
  cause: string;
  consequence: string;
  severity: ConsequenceSeverity;
  /** What the operator does about it. An alarm without an action is not an alarm. */
  action: string;
  /** Time from the alarm to the consequence, in minutes. */
  minutesToRespond: number;
  /** Priority configured today, to show what the review changes. */
  currentPriority?: AlarmPriority;
  className?: string;
};

const CELL = 'px-3 py-2.5 align-top text-sm';

/**
 * One row of an alarm rationalisation worksheet: cause, consequence, operator action and time to
 * respond, with the priority worked out from the matrix in `priorityMatrix.ts` rather than typed
 * in. When the result differs from today's setting the row shows both, and a finding explains
 * anything that should not be an alarm at all. Render it inside a `<tbody>`.
 */
export function RationalisationRow({ tag, alarmType, cause, consequence, severity, action, minutesToRespond, currentPriority, className }: RationalisationRowProps) {
  const result = rationalise(severity, minutesToRespond);
  const changed = currentPriority !== undefined && currentPriority !== result.priority;
  return (
    <tr data-slot="rationalisation-row" data-priority={result.priority} data-changed={changed} className={cn('border-t border-default', className)}>
      <th scope="row" className={cn(CELL, 'whitespace-nowrap text-left font-normal')}>
        <span className="font-mono text-xs text-base-foreground">{tag}</span>
        <span className="block text-xs text-muted-foreground">{alarmType}</span>
      </th>
      <td className={cn(CELL, 'text-base-foreground')}>{cause}</td>
      <td className={cn(CELL, 'text-base-foreground')}>
        {consequence}
        <span className="block text-xs text-muted-foreground">Severity: {SEVERITY_LABEL[severity].toLowerCase()}</span>
      </td>
      <td className={cn(CELL, 'text-base-foreground')}>{action}</td>
      <td className={cn(CELL, 'whitespace-nowrap')}>
        <span className="tabular-nums text-base-foreground">{formatValue(minutesToRespond, Number.isInteger(minutesToRespond) ? 0 : 1)} min</span>
        <span className="block text-xs text-muted-foreground">{RESPONSE_LABEL[result.response]}</span>
      </td>
      <td className={CELL}>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {changed && currentPriority !== undefined ? (
            <>
              <span data-slot="current-priority" className="text-xs text-muted-foreground line-through">
                {alarmPriorityStatus(currentPriority).label}
              </span>
              <span className="sr-only">changes to</span>
              <IconArrowNarrowRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </>
          ) : null}
          <StatusIndicator size="sm" {...alarmPriorityStatus(result.priority)} />
        </span>
        {result.finding ? (
          <span data-slot="rationalisation-finding" className="mt-1 block max-w-56 text-xs text-medium-foreground">
            {result.finding}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
