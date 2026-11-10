import { Button } from '@cognite/aura/components/button';
import { Message, MessageContent, MessageResponse } from '@cognite/aura/components/message';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@cognite/aura/components/tool';
import { IconPlayerPlay, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';

import { ToolCall } from '../../../library/ai/ToolCall';
import type { ToolCallStatus } from '../../../library/ai/ToolCall';
import { ToolCallList } from '../../../library/ai/ToolCallList';
import { definePage } from '../../types';

import source from './tool.tsx?raw';

const TREND_INPUT = {
  externalId: '23-PT-92531',
  start: '24h-ago',
  end: 'now',
  aggregates: ['average', 'max'],
  granularity: '1h',
};

const TREND_OUTPUT = {
  externalId: '23-PT-92531',
  unit: 'barg',
  points: 24,
  average: 48.2,
  max: 51.7,
  highLimit: 52,
};

const ALARM_OUTPUT = [
  { id: 'alm-4812', severity: 'critical', message: 'Recompressor tripped on high vibration', value: '11.6 mm/s' },
  { id: 'alm-4811', severity: 'high', message: 'Discharge temperature high', value: '146.3 °C' },
  { id: 'alm-4809', severity: 'high', message: 'Drive-end vibration approaching limit', value: '6.8 mm/s' },
  { id: 'alm-4806', severity: 'medium', message: 'Cooler outlet temperature high', value: '40.8 °C' },
];

const WORK_ORDER_INPUT = {
  title: 'Vibration survey, recompressor',
  assetExternalId: '23-KA-9103',
  type: 'inspection',
  priority: 'P2',
};

function ToolCollapsed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool>
        <ToolHeader type="tool-query_time_series" title="Query time series" />
        <ToolContent>
          <ToolInput input={TREND_INPUT} />
          <ToolOutput output={TREND_OUTPUT} errorText={undefined} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolOpen() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-query_time_series" title="Query time series" />
        <ToolContent>
          <ToolInput input={TREND_INPUT} />
          <ToolOutput output={TREND_OUTPUT} errorText={undefined} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolNameFromType() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool>
        <ToolHeader type="tool-query_time_series" />
        <ToolContent>
          <ToolInput input={TREND_INPUT} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolInputOnly() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-find_asset" title="Find asset" />
        <ToolContent>
          <ToolInput input={{ query: 'recompressor', site: 'nordkapp', limit: 5 }} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolTextResult() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-summarize_shift_log" title="Summarize shift log" />
        <ToolContent>
          <ToolOutput
            output={'13:46 Recompressor 23-KA-9103 tripped.\n13:52 Bearing inspection requested.\n14:00 Export flow steady at 412 m³/h.'}
            errorText={undefined}
          />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolNumberResult() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-count_open_work_orders" title="Count open work orders" />
        <ToolContent>
          <ToolInput input={{ assetSubtree: 'NK-23', status: ['open', 'planned'] }} />
          <ToolOutput output={23} errorText={undefined} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolError() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-query_time_series" title="Query time series" hasError />
        <ToolContent>
          <ToolInput input={{ externalId: '40-TT-40015', start: '24h-ago', end: 'now' }} />
          <ToolOutput
            output={undefined}
            errorText="No data points in the last 24 hours. The signal from 40-TT-40015 has bad quality."
          />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolErrorCollapsed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool>
        <ToolHeader type="tool-create_work_order" title="Create work order" hasError />
        <ToolContent>
          <ToolOutput output={undefined} errorText="You do not have write access to work orders in Nordkapp." />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolLargeResult() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-list_alarms" title="List active alarms" />
        <ToolContent>
          <ToolOutput output={ALARM_OUTPUT} errorText={undefined} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolCustomResult() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Tool defaultOpen>
        <ToolHeader type="tool-query_time_series" title="Query time series" />
        <ToolContent>
          <dl className="grid grid-cols-3 gap-4 px-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Average</dt>
              <dd className="font-medium text-base-foreground tabular-nums">48.2 barg</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Maximum</dt>
              <dd className="font-medium text-base-foreground tabular-nums">51.7 barg</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">High limit</dt>
              <dd className="font-medium text-base-foreground tabular-nums">52.0 barg</dd>
            </div>
          </dl>
          <p className="px-3 text-xs text-muted-foreground">23-PT-92531, hourly aggregates, last 24 hours</p>
        </ToolContent>
      </Tool>
    </div>
  );
}

function ToolPending() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCall
        call={{ id: 'wo', toolName: 'list_work_orders', title: 'List work orders', status: 'pending', input: { assetExternalId: '23-KA-9103' } }}
      />
    </div>
  );
}

function ToolRunning() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCall
        call={{ id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'running', input: TREND_INPUT }}
      />
    </div>
  );
}

function ToolCompleted() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCall
        call={{
          id: 'trend',
          toolName: 'query_time_series',
          title: 'Query time series',
          status: 'completed',
          input: TREND_INPUT,
          output: TREND_OUTPUT,
        }}
      />
    </div>
  );
}

function ToolFailed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCall
        defaultOpen
        call={{
          id: 'trend',
          toolName: 'query_time_series',
          title: 'Query time series',
          status: 'error',
          errorText: 'The time series service did not respond within 30 seconds.',
        }}
      />
    </div>
  );
}

function ToolApprovalRequired() {
  const [status, setStatus] = useState<ToolCallStatus>('awaiting-approval');
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <ToolCall
        defaultOpen
        call={{
          id: 'wo',
          toolName: 'create_work_order',
          title: 'Create work order',
          status,
          input: WORK_ORDER_INPUT,
          output: status === 'completed' ? { id: 'WO-104490', status: 'open' } : undefined,
          approvalReason: 'Creates a P2 work order on 23-KA-9103.',
        }}
        onApprove={() => setStatus('completed')}
        onDeny={() => setStatus('denied')}
      />
      {status === 'awaiting-approval' ? null : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStatus('awaiting-approval')}>
            <IconRefresh /> Reset
          </Button>
        </div>
      )}
    </div>
  );
}

function ToolDenied() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCall
        call={{ id: 'wo', toolName: 'create_work_order', title: 'Create work order', status: 'denied', input: WORK_ORDER_INPUT }}
      />
    </div>
  );
}

function ToolSequence() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCallList
        calls={[
          { id: 'asset', toolName: 'find_asset', title: 'Find asset', status: 'completed', input: { query: 'recompressor' }, output: { externalId: '23-KA-9103' } },
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed', input: { assetExternalId: '23-KA-9103' }, output: ALARM_OUTPUT.slice(0, 1) },
          { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed', input: { externalId: '23-VT-92740', start: '2h-ago' }, output: { max: 11.6, unit: 'mm/s' } },
        ]}
      />
    </div>
  );
}

function ToolSequenceRunning() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCallList
        calls={[
          { id: 'asset', toolName: 'find_asset', title: 'Find asset', status: 'completed', output: { externalId: '23-KA-9103' } },
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'running', input: { assetExternalId: '23-KA-9103' } },
          { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'pending' },
          { id: 'orders', toolName: 'list_work_orders', title: 'List work orders', status: 'pending' },
        ]}
      />
    </div>
  );
}

function ToolSequenceCollapsed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCallList
        collapsible
        calls={[
          { id: 'asset', toolName: 'find_asset', title: 'Find asset', status: 'completed', output: { externalId: '23-KA-9103' } },
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed', output: ALARM_OUTPUT.slice(0, 1) },
          { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed', output: { max: 11.6, unit: 'mm/s' } },
          { id: 'orders', toolName: 'list_work_orders', title: 'List work orders', status: 'completed', output: [{ id: 'WO-104482', status: 'in-progress' }] },
        ]}
      />
    </div>
  );
}

function ToolSequenceWithFailure() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCallList
        collapsible
        defaultOpen
        calls={[
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed', output: ALARM_OUTPUT.slice(0, 2) },
          { id: 'bearing', toolName: 'query_time_series', title: 'Query bearing temperature', status: 'error', errorText: 'The signal from 40-TT-40015 has bad quality.' },
          { id: 'orders', toolName: 'list_work_orders', title: 'List work orders', status: 'completed', output: [{ id: 'WO-104479', status: 'planned' }] },
        ]}
      />
    </div>
  );
}

function ToolSequenceApproval() {
  const [decision, setDecision] = useState<ToolCallStatus>('awaiting-approval');
  return (
    <div className="mx-auto w-full max-w-md">
      <ToolCallList
        collapsible
        calls={[
          { id: 'asset', toolName: 'find_asset', title: 'Find asset', status: 'completed', output: { externalId: '23-KA-9103' } },
          { id: 'orders', toolName: 'list_work_orders', title: 'List work orders', status: 'completed', output: [{ id: 'WO-104482', status: 'in-progress' }] },
          { id: 'create', toolName: 'create_work_order', title: 'Create work order', status: decision, input: WORK_ORDER_INPUT, approvalReason: 'Creates a P2 work order on 23-KA-9103.' },
        ]}
        onApprove={() => setDecision('completed')}
        onDeny={() => setDecision('denied')}
      />
    </div>
  );
}

function ToolInMessage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      <Message>
        <MessageContent>Show discharge pressure for 23-KA-9101 over the last 24 hours</MessageContent>
      </Message>
      <Message isResponse>
        <MessageContent>
          <ToolCallList
            collapsible
            calls={[{ id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'completed', input: TREND_INPUT, output: TREND_OUTPUT }]}
          />
          <MessageResponse>
            {'Discharge pressure on `23-PT-92531` averaged **48.2 barg** and peaked at **51.7 barg**, just under the 52.0 barg high limit.'}
          </MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

function ToolRetry() {
  const [status, setStatus] = useState<ToolCallStatus>('error');
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <ToolCall
        defaultOpen
        call={{
          id: 'trend',
          toolName: 'query_time_series',
          title: 'Query time series',
          status,
          input: TREND_INPUT,
          output: status === 'completed' ? TREND_OUTPUT : undefined,
          errorText: status === 'error' ? 'The time series service did not respond within 30 seconds.' : undefined,
        }}
      />
      <div className="pl-6">
        {status === 'error' ? (
          <Button variant="outline" size="sm" onClick={() => setStatus('completed')}>
            <IconRefresh /> Run again
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setStatus('error')}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function ToolStepThrough() {
  const [done, setDone] = useState(1);
  const statusAt = (index: number): ToolCallStatus => (index < done ? 'completed' : index === done ? 'running' : 'pending');
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <ToolCallList
        calls={[
          { id: 'asset', toolName: 'find_asset', title: 'Find asset', status: statusAt(0) },
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: statusAt(1) },
          { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: statusAt(2) },
        ]}
      />
      <div className="pl-6">
        {done < 3 ? (
          <Button variant="outline" size="sm" onClick={() => setDone(done + 1)}>
            <IconPlayerPlay /> Finish current step
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setDone(0)}>
            <IconRefresh /> Start over
          </Button>
        )}
      </div>
    </div>
  );
}

function ToolSidePanel() {
  return (
    <div className="mx-auto w-full max-w-xs rounded-xl bg-base-background p-3">
      <ToolCallList
        calls={[
          { id: 'alarms', toolName: 'list_alarms', title: 'List active alarms', status: 'completed', output: ALARM_OUTPUT.slice(0, 1) },
          { id: 'trend', toolName: 'query_time_series', title: 'Query time series', status: 'running' },
        ]}
      />
    </div>
  );
}

export default definePage({
  id: 'tool',
  title: 'Tool',
  summary:
    'Tool shows a call the assistant made — which tool, with what parameters, and what came back. It is the audit trail of an answer: collapsed by default, complete when opened.',
  docsSlug: 'tool',
  guidance: {
    use: [
      'A readable title for the header: verb + object, such as "Query time series".',
      'Collapsed by default; the answer is the content, the call is the evidence.',
      'The error badge and a plain error text when a call fails, with what to do next.',
      'An approval step before any call that creates, changes or deletes data.',
    ],
    avoid: [
      'Raw function names in the header when a readable title is available.',
      'Opening every tool by default in a long chain; fold the chain behind a summary.',
      'Hiding failed calls — a failed step explains a partial answer.',
      'Running a write action without showing its parameters first.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'A collapsible header with parameters and a result inside.',
      specimens: [
        {
          id: 'ToolCollapsed',
          title: 'Collapsed',
          note: 'The default in a thread: one quiet row the reader can open.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolCollapsed,
        },
        {
          id: 'ToolOpen',
          title: 'Open',
          note: 'Parameters and result visible, for debugging views or the step under review.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolOpen,
        },
        {
          id: 'ToolNameFromType',
          title: 'Name from type',
          note: 'Without a title the header falls back to the tool name; fine for developer-facing surfaces.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolNameFromType,
        },
        {
          id: 'ToolInputOnly',
          title: 'Parameters only',
          note: 'A call that has been sent but has no result yet, or one whose result is shown elsewhere.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolInputOnly,
        },
        {
          id: 'ToolError',
          title: 'Error',
          note: 'A failed call: the badge shows in the header even when collapsed, the reason inside.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolError,
        },
        {
          id: 'ToolErrorCollapsed',
          title: 'Error, collapsed',
          note: 'In a chain, a failed step stays one row high but cannot be missed.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolErrorCollapsed,
        },
      ],
    },
    {
      id: 'results',
      title: 'Results',
      description: 'What the result area does with different kinds of output.',
      specimens: [
        {
          id: 'ToolTextResult',
          title: 'Text result',
          note: 'Tools that return prose, such as a summary; shown as plain text.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolTextResult,
        },
        {
          id: 'ToolNumberResult',
          title: 'Scalar result',
          note: 'Counts and single values render as they are, with the parameters that produced them.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolNumberResult,
        },
        {
          id: 'ToolLargeResult',
          title: 'Large result',
          note: 'Long JSON starts as a preview with copy, download and expand controls.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ToolLargeResult,
        },
        {
          id: 'ToolCustomResult',
          title: 'Formatted result',
          note: 'When operators read the result, replace the JSON with the few values that matter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ToolCustomResult,
        },
      ],
    },
    {
      id: 'states',
      title: 'Lifecycle states',
      description: 'Aura’s header only knows "error". ToolCall adds the rest of the lifecycle beside it.',
      specimens: [
        {
          id: 'ToolPending',
          title: 'Queued',
          note: 'Planned but waiting for an earlier step.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolPending,
        },
        {
          id: 'ToolRunning',
          title: 'Running',
          note: 'In flight: a loader in the status column and a shimmering line under the header.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolRunning,
        },
        {
          id: 'ToolCompleted',
          title: 'Completed',
          note: 'Finished with a result; open it to see parameters and output.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolCompleted,
        },
        {
          id: 'ToolFailed',
          title: 'Failed',
          note: 'Critical colour on the status icon and the header badge; the error text says what happened.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolFailed,
        },
        {
          id: 'ToolApprovalRequired',
          title: 'Approval required',
          note: 'A write action pauses with its parameters open until someone approves or denies it. Try both.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolApprovalRequired,
        },
        {
          id: 'ToolDenied',
          title: 'Denied',
          note: 'The record of a declined action: neutral, and explicit that nothing changed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolDenied,
        },
      ],
    },
    {
      id: 'sequences',
      title: 'Sequences',
      description: 'Several calls in the order they ran.',
      specimens: [
        {
          id: 'ToolSequence',
          title: 'Completed chain',
          note: 'A short chain shown in full, each step openable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx', 'ai/ToolCall.tsx'],
          Component: ToolSequence,
        },
        {
          id: 'ToolSequenceRunning',
          title: 'Chain in progress',
          note: 'Done, running and queued steps together, so the user can see how far along it is.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx', 'ai/ToolCall.tsx'],
          Component: ToolSequenceRunning,
        },
        {
          id: 'ToolSequenceCollapsed',
          title: 'Collapsed chain',
          note: 'Four or more calls fold into one summary line above the answer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx', 'ai/ToolCall.tsx'],
          Component: ToolSequenceCollapsed,
        },
        {
          id: 'ToolSequenceWithFailure',
          title: 'Chain with a failed step',
          note: 'The summary counts the failure and the chain carries on with what it has.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx', 'ai/ToolCall.tsx'],
          Component: ToolSequenceWithFailure,
        },
        {
          id: 'ToolSequenceApproval',
          title: 'Chain waiting for approval',
          note: 'A folded chain opens itself when a step needs a decision, and the summary says which.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx', 'ai/ToolCall.tsx'],
          Component: ToolSequenceApproval,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Tool calls where they live: inside an assistant turn.',
      specimens: [
        {
          id: 'ToolInMessage',
          title: 'Above the answer',
          note: 'The call that produced the numbers sits folded directly above them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx'],
          Component: ToolInMessage,
        },
        {
          id: 'ToolRetry',
          title: 'Failed with retry',
          note: 'When a failure is likely transient, offer the retry next to the error.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCall.tsx'],
          Component: ToolRetry,
        },
        {
          id: 'ToolStepThrough',
          title: 'Live progress',
          note: 'How a chain reads as it advances. Finish the current step to move it on.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx'],
          Component: ToolStepThrough,
        },
        {
          id: 'ToolSidePanel',
          title: 'In a side panel',
          note: 'At 320px the status column and header still fit; keep titles to two or three words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['ai/ToolCallList.tsx'],
          Component: ToolSidePanel,
        },
      ],
    },
  ],
});
