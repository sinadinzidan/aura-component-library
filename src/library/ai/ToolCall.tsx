import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@cognite/aura/components/tool';
import { IconAlertCircle, IconCircleCheck, IconCircleDashed, IconCircleX, IconShieldQuestion } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type ToolCallStatus = 'pending' | 'running' | 'awaiting-approval' | 'completed' | 'error' | 'denied';

export type ToolCallData = {
  id: string;
  /** Machine name of the tool, e.g. `query_time_series`. */
  toolName: string;
  /** Human-readable title for the header; defaults to the tool name. */
  title?: string;
  status: ToolCallStatus;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  /** Why approval is needed, shown beside the approve and deny buttons. */
  approvalReason?: string;
};

type ToolCallProps = {
  call: ToolCallData;
  defaultOpen?: boolean;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
};

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  pending: 'Queued',
  running: 'Running',
  'awaiting-approval': 'Needs approval',
  completed: 'Completed',
  error: 'Failed',
  denied: 'Denied',
};

function statusIcon(status: ToolCallStatus): ReactNode {
  switch (status) {
    case 'pending':
      return <IconCircleDashed className="size-4 text-muted-foreground" />;
    case 'running':
      return <Loader size={16} aria-label="Running" />;
    case 'awaiting-approval':
      return <IconShieldQuestion className="size-4 text-warning-foreground-strong" />;
    case 'completed':
      return <IconCircleCheck className="size-4 text-success-foreground-strong" />;
    case 'error':
      return <IconAlertCircle className="size-4 text-critical-foreground-strong" />;
    case 'denied':
      return <IconCircleX className="size-4 text-muted-foreground" />;
  }
}

/**
 * One tool call with its lifecycle made visible. Aura's Tool shows parameters and result; this adds
 * the status the header has no slot for — queued, running, needs approval, completed, failed,
 * denied — and the approve / deny step for calls that change something.
 */
export function ToolCall({ call, defaultOpen = false, onApprove, onDeny }: ToolCallProps) {
  const { id, toolName, title, status, input, output, errorText, approvalReason } = call;
  const hasDetails = input !== undefined || output !== undefined || Boolean(errorText);

  return (
    <div data-status={status} className="flex w-full items-start gap-1">
      <span className="flex h-9 w-5 shrink-0 items-center justify-center" title={STATUS_LABEL[status]}>
        {statusIcon(status)}
        <span className="sr-only">{STATUS_LABEL[status]}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Tool defaultOpen={defaultOpen}>
          <ToolHeader type={`tool-${toolName}`} title={title} hasError={status === 'error'} />
          {hasDetails ? (
            <ToolContent>
              {input !== undefined ? <ToolInput input={input} /> : null}
              <ToolOutput output={output} errorText={errorText} />
            </ToolContent>
          ) : null}
        </Tool>
        {status === 'running' ? (
          <div className="px-3 pb-1">
            <Shimmer as="span">Running…</Shimmer>
          </div>
        ) : null}
        {status === 'pending' ? (
          <div className="px-3 pb-1">
            <p className="text-sm text-muted-foreground">Waiting for the previous step</p>
          </div>
        ) : null}
        {status === 'denied' ? (
          <div className="px-3 pb-1">
            <p className="text-sm text-muted-foreground">Denied. Nothing was changed.</p>
          </div>
        ) : null}
        {status === 'awaiting-approval' ? (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-1">
            <p className="text-sm text-muted-foreground">{approvalReason ?? 'This step changes data. Review the parameters first.'}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onDeny?.(id)}>
                Deny
              </Button>
              <Button size="sm" onClick={() => onApprove?.(id)}>
                Approve
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
