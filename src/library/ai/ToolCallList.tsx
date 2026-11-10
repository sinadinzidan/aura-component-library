import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { IconChevronDown, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';

import { summarizeToolCalls } from './summarizeToolCalls';
import { ToolCall } from './ToolCall';
import type { ToolCallData } from './ToolCall';

type ToolCallListProps = {
  calls: readonly ToolCallData[];
  /** Collapse the calls behind a one-line summary. Opens by itself while a call needs attention. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
};

/**
 * A run of tool calls in the order they were made. With `collapsible`, the run folds into a
 * summary line so a long chain does not push the answer off screen.
 */
export function ToolCallList({ calls, collapsible = false, defaultOpen = false, onApprove, onDeny }: ToolCallListProps) {
  const needsAttention = calls.some((call) => call.status === 'awaiting-approval' || call.status === 'running');
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? (needsAttention || defaultOpen);

  if (calls.length === 0) return null;

  const list = (
    <ol className="flex w-full flex-col gap-1">
      {calls.map((call) => (
        <li key={call.id}>
          <ToolCall call={call} onApprove={onApprove} onDeny={onDeny} />
        </li>
      ))}
    </ol>
  );

  if (!collapsible) return list;

  return (
    <Collapsible open={open} onOpenChange={setUserOpen}>
      <CollapsibleTrigger className="-ml-3 w-fit gap-2">
        <IconTool aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-base leading-5 font-normal tracking-tighter text-muted-foreground">
          {summarizeToolCalls(calls)}
        </span>
        <IconChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-1">{list}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
