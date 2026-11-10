import { Loader } from '@cognite/aura/components/loader';
import {
  IconAlertCircle,
  IconChevronDown,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleMinus,
  IconShieldQuestion,
} from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

import { summarizeRun } from './agentRun';
import type { AgentRunStepStatus } from './agentRun';

export type { AgentRunStepStatus } from './agentRun';

export type AgentRunStep = {
  id: string;
  /** What the step does, verb first: "Read vibration trend". */
  label: string;
  status: AgentRunStepStatus;
  /** Result, current activity or reason, in a few words. */
  detail?: string;
  /** How long the step took, already formatted: "4 s". */
  duration?: string;
  /** What the step did: tool calls, a query, a draft. Makes the step expandable. */
  trace?: ReactNode;
};

export type AgentRunListProps = {
  /** What the agent is working on. Also the accessible name of the list. */
  label: string;
  steps: readonly AgentRunStep[];
  /** Steps whose trace starts open. Steps that need a person are always open at first. */
  defaultOpenIds?: readonly string[];
  /** Controls after the summary: stop the run, start it again. */
  actions?: ReactNode;
  /** Hides the title and summary when the page already has them. */
  hideHeader?: boolean;
};

const STATUS_LABEL: Record<AgentRunStepStatus, string> = {
  done: 'Done',
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
  waiting: 'Needs approval',
  skipped: 'Skipped',
};

function statusIcon(status: AgentRunStepStatus): ReactNode {
  switch (status) {
    case 'done':
      return <IconCircleCheck aria-hidden className="size-4 text-success-foreground-strong" />;
    case 'running':
      return <Loader size={16} aria-hidden="true" />;
    case 'queued':
      return <IconCircleDashed aria-hidden className="size-4 text-muted-foreground" />;
    case 'failed':
      return <IconAlertCircle aria-hidden className="size-4 text-critical-foreground-strong" />;
    case 'waiting':
      return <IconShieldQuestion aria-hidden className="size-4 text-warning-foreground-strong" />;
    case 'skipped':
      return <IconCircleMinus aria-hidden className="size-4 text-muted-foreground" />;
  }
}

function initiallyOpen(steps: readonly AgentRunStep[], defaultOpenIds: readonly string[]): string[] {
  return steps
    .filter((step) => step.trace && (defaultOpenIds.includes(step.id) || step.status === 'waiting' || step.status === 'failed'))
    .map((step) => step.id);
}

/**
 * An agent run as a vertical list of steps joined by a rail: each step has a state (icon and
 * word), an optional result line and duration, and a trace that opens under it to show what the
 * agent actually did. Steps that failed or wait for approval start open, because those are the
 * ones a person has to read. The summary line is announced when the run moves on.
 */
export function AgentRunList({ label, steps, defaultOpenIds = [], actions, hideHeader = false }: AgentRunListProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<readonly string[]>(() => initiallyOpen(steps, defaultOpenIds));

  const toggle = (id: string) =>
    setOpenIds((current) => (current.includes(id) ? current.filter((openId) => openId !== id) : [...current, id]));

  return (
    <div data-slot="agent-run" className="flex w-full min-w-0 flex-col gap-3">
      {hideHeader ? (
        <span role="status" className="sr-only">
          {summarizeRun(steps)}
        </span>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-base-foreground">{label}</span>
            <span role="status" className="text-xs tabular-nums text-muted-foreground">
              {summarizeRun(steps)}
            </span>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <ol aria-label={label} className="flex flex-col">
        {steps.map((step, index) => {
          const open = openIds.includes(step.id);
          const last = index === steps.length - 1;
          const traceId = `${baseId}-${step.id}`;
          const text = (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn('text-sm', step.status === 'queued' || step.status === 'skipped' ? 'text-muted-foreground' : 'text-base-foreground')}>
                  {step.label}
                </span>
                {step.detail ? <span className="text-xs text-muted-foreground">{step.detail}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs whitespace-nowrap text-muted-foreground">
                {step.duration ? <span className="tabular-nums">{step.duration}</span> : null}
                <span>{STATUS_LABEL[step.status]}</span>
                {step.trace ? (
                  <IconChevronDown aria-hidden className={cn('size-4 transition-transform', open ? 'rotate-180' : undefined)} />
                ) : (
                  <span aria-hidden className="size-4" />
                )}
              </span>
            </>
          );

          return (
            <li
              key={step.id}
              data-status={step.status}
              aria-current={step.status === 'running' ? 'step' : undefined}
              className="flex gap-3"
            >
              <span aria-hidden={step.status !== 'running'} className="flex w-4 shrink-0 flex-col items-center pt-2">
                <span className="flex size-4 items-center justify-center">{statusIcon(step.status)}</span>
                {last ? null : <span className="mt-1 w-px flex-1 bg-medium-background" />}
              </span>
              <div className={cn('flex min-w-0 flex-1 flex-col', last ? undefined : 'pb-2')}>
                {step.trace ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={traceId}
                    onClick={() => toggle(step.id)}
                    className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
                  >
                    {text}
                  </button>
                ) : (
                  <div className="-mx-2 flex items-start gap-3 px-2 py-1.5">{text}</div>
                )}
                {step.trace && open ? (
                  <div id={traceId} data-slot="agent-run-trace" className="flex min-w-0 flex-col gap-2 pt-1 pb-2">
                    {step.trace}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
