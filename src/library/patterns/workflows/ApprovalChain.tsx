import { IconCheck, IconMinus, IconX } from '@cognite/aura/icons';

export type ApprovalStepState = 'approved' | 'rejected' | 'current' | 'waiting' | 'skipped';

export type ApprovalStep = {
  id: string;
  /** What they approve as: "Shift supervisor". */
  role: string;
  /** Left out while nobody is assigned to the role. */
  name?: string;
  state: ApprovalStepState;
  /** When they decided, already formatted. */
  at?: string;
  /** Their comment, or why the step was skipped. */
  note?: string;
};

export type ApprovalChainProps = {
  /** What is being approved, for the accessible name: "Approval chain for MOC-2231". */
  label: string;
  /** In the order they must decide. */
  steps: readonly ApprovalStep[];
};

const WORD: Record<ApprovalStepState, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  current: 'Deciding now',
  waiting: 'Not started',
  skipped: 'Skipped',
};

const MARKER: Record<ApprovalStepState, string> = {
  approved: 'bg-success-background text-success-foreground',
  rejected: 'bg-critical-background text-critical-foreground',
  current: 'bg-primary-background text-primary-foreground',
  waiting: 'border border-emphasized text-muted-foreground',
  skipped: 'border border-default text-muted-foreground',
};

const STATE_TEXT: Record<ApprovalStepState, string> = {
  approved: 'text-muted-foreground',
  rejected: 'font-medium text-critical-foreground-strong',
  current: 'font-medium text-base-foreground',
  waiting: 'text-muted-foreground',
  skipped: 'text-muted-foreground',
};

/**
 * The approvers of a request in the order they decide, each with their state: who has signed,
 * whose turn it is and who is still to come. A numbered rail, so the order reads without colour.
 */
export function ApprovalChain({ label, steps }: ApprovalChainProps) {
  return (
    <ol data-slot="approval-chain" aria-label={label} className="flex w-full min-w-0 flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.id} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${MARKER[step.state]}`}>
                {step.state === 'approved' ? (
                  <IconCheck aria-hidden="true" className="size-3.5" />
                ) : step.state === 'rejected' ? (
                  <IconX aria-hidden="true" className="size-3.5" />
                ) : step.state === 'skipped' ? (
                  <IconMinus aria-hidden="true" className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              {last ? null : <span aria-hidden="true" className="flex-1 border-l border-default" />}
            </span>
            <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${last ? '' : 'pb-4'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={`text-sm font-medium ${step.name ? 'text-base-foreground' : 'text-muted-foreground'}`}>{step.name ?? 'Not assigned'}</span>
                <span className={`text-xs tabular-nums ${STATE_TEXT[step.state]}`}>
                  {WORD[step.state]}
                  {step.at ? ` · ${step.at}` : ''}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{step.role}</span>
              {step.note ? <p className="pt-1 text-sm text-medium-foreground">{step.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
