import { IconCircleCheck, IconCircleMinus, IconCircleX } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import type { ConditionState } from './workflow';

export type Condition = {
  id: string;
  label: string;
  /** The evidence: a tag and reading, or who bypassed it. */
  detail?: string;
  state: ConditionState;
};

export type ConditionListProps = {
  conditions: readonly Condition[];
  /** What the conditions guard, e.g. "Start permissives, 23-KA-9103". */
  label: string;
  /** State words, so the same list serves permissives ("Met") and interlocks ("Healthy"). */
  stateLabels?: Partial<Record<ConditionState, string>>;
  className?: string;
};

const DEFAULT_LABELS: Record<ConditionState, string> = { met: 'Met', unmet: 'Not met', bypassed: 'Bypassed' };

const ICON = { met: IconCircleCheck, unmet: IconCircleX, bypassed: IconCircleMinus } as const;

const ICON_TONE: Record<ConditionState, string> = {
  met: 'text-success-foreground-strong',
  unmet: 'text-critical-foreground-strong',
  bypassed: 'text-warning-foreground-strong',
};

/**
 * Conditions that must all hold before something may happen: start permissives, interlocks,
 * isolation points. Each row says its state in an icon and a word, with the evidence beside it.
 */
export function ConditionList({ conditions, label, stateLabels, className }: ConditionListProps) {
  const labels = { ...DEFAULT_LABELS, ...stateLabels };
  return (
    <ul data-slot="condition-list" aria-label={label} className={cn('flex w-full flex-col gap-3', className)}>
      {conditions.map((condition) => {
        const Icon = ICON[condition.state];
        return (
          <li key={condition.id} data-state={condition.state} className="flex items-start gap-2">
            <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', ICON_TONE[condition.state])} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm text-base-foreground">{condition.label}</span>
              {condition.detail ? <span className="text-xs text-muted-foreground tabular-nums">{condition.detail}</span> : null}
            </div>
            <span
              className={cn(
                'shrink-0 text-xs',
                condition.state === 'met' ? 'text-muted-foreground' : cn('font-medium', ICON_TONE[condition.state])
              )}
            >
              {labels[condition.state]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
