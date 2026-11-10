import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { MessageResponse } from '@cognite/aura/components/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@cognite/aura/components/prompt-input';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconArrowLeft,
  IconBinaryTree,
  IconCalendarEvent,
  IconChartLine,
  IconFileText,
  IconLayoutDashboard,
  IconListCheck,
  IconMessageCircle,
  IconPlus,
  IconSparkles,
  IconTool,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ChatThread } from '../../../library/ai/ChatThread';
import type { ChatMessage } from '../../../library/ai/ChatThread';
import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import type { SourceItem, SourceKind } from '../../../library/ai/SourceList';
import { ToolCall } from '../../../library/ai/ToolCall';
import type { ToolCallData } from '../../../library/ai/ToolCall';
import { ToolCallList } from '../../../library/ai/ToolCallList';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { Prose } from '../../../library/patterns/content/Prose';
import { AssistantPanel } from '../../../library/patterns/product/AssistantPanel';
import { InsightCard } from '../../../library/patterns/product/InsightCard';
import { SetupChecklist } from '../../../library/patterns/states/SetupChecklist';
import type { SetupStep } from '../../../library/patterns/states/SetupChecklist';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { DecisionForm } from '../../../library/patterns/workflows/DecisionForm';
import type { Decision } from '../../../library/patterns/workflows/DecisionForm';
import { AgentRunList } from '../../../library/templates-b/AgentRunList';
import type { AgentRunStep, AgentRunStepStatus } from '../../../library/templates-b/AgentRunList';
import { PageFrame } from '../../../library/templates-b/PageFrame';
import { ShellPage } from '../../../library/templates-b/ShellPage';
import { WorkspaceLayout } from '../../../library/templates-b/WorkspaceLayout';
import { ASSETS, SENSORS, sensorsOf } from '../../data/plant';
import { makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './ai-workspaces.tsx?raw';

const AIW_COMPRESSOR = ASSETS[8];
const AIW_COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const AIW_VIBRATION = SENSORS[3];
const AIW_VIBRATION_SERIES = makeSeries({ seed: AIW_VIBRATION.seed, points: 48, base: 5.9, amplitude: 0.3, noise: 0.15, drift: 0.9 });
const AIW_COMPRESSOR_SENSORS = sensorsOf(AIW_COMPRESSOR.id).slice(0, 5);

/** Drive-end vibration per compressor: latest value and a week of history, for the comparison blocks. */
const AIW_COMPARISON = [
  { asset: AIW_COMPRESSORS[0], latest: 6.8, limit: 7.1, values: makeValues({ seed: 41, points: 28, base: 5.9, noise: 0.12, drift: 0.9 }) },
  { asset: AIW_COMPRESSORS[1], latest: 3.1, limit: 7.1, values: makeValues({ seed: 42, points: 28, base: 3.1, noise: 0.1 }) },
  { asset: AIW_COMPRESSORS[2], latest: 11.6, limit: 11, values: makeValues({ seed: 43, points: 28, base: 7.4, noise: 0.3, drift: 4.2 }) },
];

const AIW_SOURCES: readonly SourceItem[] = [
  { id: 'ts', title: '23-VT-92540 Drive-end vibration', href: 'https://fusion.cognite.test/timeseries/23-VT-92540', kind: 'timeseries' },
  { id: 'asset', title: '23-KA-9101 1st stage compressor', href: 'https://fusion.cognite.test/assets/23-KA-9101', kind: 'asset' },
  { id: 'event', title: 'Alarm alm-4809, acknowledged 12:02', href: 'https://fusion.cognite.test/events/alm-4809', kind: 'event' },
  { id: 'file', title: 'Vibration limits, rotating equipment (rev. 4)', href: 'https://fusion.cognite.test/files/vibration-limits', kind: 'file' },
];

const AIW_SOURCE_EXCERPTS: Record<string, string> = {
  ts: 'Hourly average, last 48 hours: 5.9 mm/s rising to 6.8 mm/s. No gaps, quality good.',
  asset: 'Criticality A. Running. Health score 72, down from 81 a week ago.',
  event: 'Drive-end vibration approaching limit. Raised 12:00, acknowledged by Ingrid Haugen at 12:02.',
  file: 'Section 3.2: high alarm at 7.1 mm/s, trip at 11.0 mm/s for compressors in service class II.',
};

const AIW_SOURCE_ICON: Record<SourceKind, typeof IconFileText> = {
  web: IconFileText,
  file: IconFileText,
  timeseries: IconChartLine,
  asset: IconBinaryTree,
  event: IconCalendarEvent,
};

const AIW_SOURCE_KIND: Record<SourceKind, string> = {
  web: 'Web page',
  file: 'Document',
  timeseries: 'Time series',
  asset: 'Asset',
  event: 'Event',
};

const AIW_ANSWER =
  'Drive-end vibration on **23-KA-9101** is **6.8 mm/s**, 0.3 below the high limit of 7.1. It has risen 0.9 mm/s over the last 48 hours while shaft speed stayed flat, which points to the bearing and not to load.';

const AIW_ANSWER_SHORT = 'Vibration is 6.8 mm/s and rising about 0.45 mm/s per day. At that rate it reaches the 7.1 limit in roughly 16 hours.';

const AIW_ANSWER_ORDERS =
  'One work order covers it: **WO-104466**, a vibration survey on 23-KA-9101, is open and unassigned, due in 2 days. Nothing is planned for the bearing itself.';

const AIW_TOOLS: readonly ToolCallData[] = [
  {
    id: 'find',
    toolName: 'find_asset',
    title: 'Find asset 23-KA-9101',
    status: 'completed',
    input: { tag: '23-KA-9101' },
    output: { name: '1st stage compressor', sensors: 6 },
  },
  {
    id: 'query',
    toolName: 'query_time_series',
    title: 'Read 23-VT-92540, last 48 hours',
    status: 'completed',
    input: { tag: '23-VT-92540', start: '48h-ago', aggregate: 'average', granularity: '1h' },
    output: { points: 48, min: 5.7, max: 6.9, latest: 6.8 },
  },
];

const AIW_THREAD: readonly ChatMessage[] = [
  { id: 'u1', role: 'user', text: 'Why is drive-end vibration on 23-KA-9101 rising?' },
  { id: 'a1', role: 'assistant', text: AIW_ANSWER, tools: AIW_TOOLS, sources: AIW_SOURCES },
  { id: 'u2', role: 'user', text: 'Is work already planned?' },
  { id: 'a2', role: 'assistant', text: AIW_ANSWER_ORDERS },
];

const AIW_SHORT_THREAD: readonly ChatMessage[] = AIW_THREAD.slice(0, 2);

const AIW_STARTERS = [
  { id: 'why', label: 'Why is vibration rising?', prompt: 'Why is drive-end vibration on 23-KA-9101 rising?' },
  { id: 'limit', label: 'When will it reach the limit?', prompt: 'When will 23-VT-92540 reach its high limit at the current rate?' },
  { id: 'orders', label: 'Is work already planned?', prompt: 'Is there planned work on 23-KA-9101?' },
  { id: 'handover', label: 'Draft the shift handover', prompt: 'Summarise this shift for the handover log' },
];

type AiwConversation = { id: string; title: string; group: 'Today' | 'Yesterday' | 'Earlier'; when: string; messages: readonly ChatMessage[] };

const AIW_CONVERSATIONS: readonly AiwConversation[] = [
  { id: 'c1', title: 'Vibration on 23-KA-9101', group: 'Today', when: '13:52', messages: AIW_THREAD },
  {
    id: 'c2',
    title: 'Recompressor trip at 13:46',
    group: 'Today',
    when: '13:48',
    messages: [
      { id: 'u1', role: 'user', text: 'Why did the recompressor trip at 13:46?' },
      {
        id: 'a1',
        role: 'assistant',
        text: '**23-KA-9103** tripped on high drive-end vibration: 11.6 mm/s against a trip limit of 11.0. Vibration climbed for six hours before the trip. WO-104482 to inspect the bearing is in progress.',
        sources: AIW_SOURCES.slice(1, 3),
      },
    ],
  },
  {
    id: 'c3',
    title: 'Overdue work in gas export',
    group: 'Yesterday',
    when: '16:20',
    messages: [
      { id: 'u1', role: 'user', text: 'Which work orders in gas export are overdue?' },
      {
        id: 'a1',
        role: 'assistant',
        text: 'One: **WO-104458**, the standby start test on export pump B, was due 4 days ago and is unassigned.',
      },
    ],
  },
  {
    id: 'c4',
    title: 'Cooler outlet temperature',
    group: 'Earlier',
    when: '9 Mar',
    messages: [
      { id: 'u1', role: 'user', text: 'Is the interstage cooler fouling?' },
      {
        id: 'a1',
        role: 'assistant',
        text: 'Likely. Outlet temperature on **23-TT-91141** has drifted from 36 to 38.9 °C in two weeks at the same load. Cleaning is planned in WO-104471.',
      },
    ],
  },
];

const AIW_RUN_PLAN: readonly { id: string; label: string; result: string; activity: string; duration: string; tools?: readonly ToolCallData[] }[] = [
  {
    id: 'history',
    label: 'Read alarm history for 23-KA-9103',
    result: '3 trips since January',
    activity: 'Reading alarms',
    duration: '4 s',
    tools: [
      {
        id: 'alarms',
        toolName: 'list_alarms',
        title: 'List trips on 23-KA-9103',
        status: 'completed',
        input: { asset: '23-KA-9103', severity: 'critical', since: '2026-01-01' },
        output: { count: 3 },
      },
    ],
  },
  {
    id: 'trends',
    label: 'Read vibration in the hour before each trip',
    result: 'Same rising pattern in 2 of 3',
    activity: 'Reading 23-VT-92740',
    duration: '11 s',
    tools: [
      {
        id: 'series',
        toolName: 'query_time_series',
        title: 'Read 23-VT-92740 around each trip',
        status: 'completed',
        input: { tag: '23-VT-92740', windows: 3, before: '1h' },
        output: { points: 180 },
      },
    ],
  },
  { id: 'compare', label: 'Compare with 23-KA-9101', result: 'Rising at a third of the rate', activity: 'Comparing trends', duration: '6 s' },
  { id: 'orders', label: 'Check work orders that followed', result: '2 bearing inspections, 1 open', activity: 'Reading SAP PM', duration: '5 s' },
  { id: 'report', label: 'Write the comparison', result: 'Report ready', activity: 'Writing', duration: '9 s' },
  { id: 'draft', label: 'Draft an inspection work order', result: 'WO draft created', activity: 'Waiting for you', duration: '2 s' },
];

const AIW_DRAFT_TOOL: ToolCallData = {
  id: 'create',
  toolName: 'create_work_order',
  title: 'Create work order in SAP PM',
  status: 'awaiting-approval',
  input: { asset: '23-KA-9101', type: 'inspection', priority: 'P2', title: 'Inspect drive-end bearing', estimatedHours: 4 },
  approvalReason: 'This writes to the maintenance system.',
};

const AIW_SHELL_NAV: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
      { id: 'assets', label: 'Assets', icon: <IconBinaryTree /> },
      { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
      { id: 'orders', label: 'Work orders', icon: <IconTool /> },
    ],
  },
];

const AIW_SETUP: readonly SetupStep[] = [
  { id: 'source', title: 'Connect a data source', done: true },
  {
    id: 'scope',
    title: 'Choose what the assistant can read',
    description: 'Pick the areas of the plant it may query. It never writes without asking.',
    done: false,
    actionLabel: 'Choose scope',
    hint: 'About 2 min',
  },
  {
    id: 'ask',
    title: 'Ask a first question',
    description: 'Try one of the examples below, or type your own.',
    done: false,
    actionLabel: 'Use an example',
  },
];

const AIW_PROPOSAL = [
  { label: 'Title', value: 'Inspect drive-end bearing' },
  { label: 'Equipment', value: <span className="font-mono text-xs">23-KA-9101</span> },
  { label: 'Type', value: 'Inspection' },
  { label: 'Priority', value: 'P2' },
  { label: 'Estimated', value: '4 h' },
  { label: 'Due', value: '14 Mar 2026' },
];

function aiwReply(prompt: string, index: number): ChatMessage[] {
  return [
    { id: `u-${index}`, role: 'user', text: prompt },
    { id: `a-${index}`, role: 'assistant', text: AIW_ANSWER_SHORT, sources: AIW_SOURCES.slice(0, 2) },
  ];
}

function isAiwView(value: unknown): value is 'chart' | 'table' {
  return value === 'chart' || value === 'table';
}

function AiwPrompt({ onSend, placeholder = 'Ask about Nordkapp' }: { onSend: (text: string) => void; placeholder?: string }) {
  return (
    <PromptInput
      helperText={false}
      onSubmit={(message) => {
        const text = message.text?.trim();
        if (text) onSend(text);
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea aria-label="Message" placeholder={placeholder} />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit />
      </PromptInputFooter>
    </PromptInput>
  );
}

/** Title line of a workspace header: a mark, the name and what the assistant can see. */
function AiwTitle({ title, context, children }: { title: string; context?: string; children?: ReactNode }) {
  return (
    <>
      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted-background text-base-foreground">
        <IconSparkles className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="truncate text-sm font-semibold text-base-foreground">{title}</h2>
        {context ? <p className="truncate text-xs text-muted-foreground">{context}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </>
  );
}

function AiwVibrationChart({ heightClassName = 'h-56' }: { heightClassName?: string }) {
  return (
    <TrendChart
      className="w-full"
      label="Drive-end vibration over 48 hours, rising towards its high limit of 7.1 mm/s"
      series={[{ key: 'vibration', label: AIW_VIBRATION.name, points: AIW_VIBRATION_SERIES }]}
      limits={[{ value: AIW_VIBRATION.highLimit, label: `High ${AIW_VIBRATION.highLimit}`, tone: 'warning' }]}
      unit={AIW_VIBRATION.unit}
      yDomain={[4, 8]}
      maxTicks={5}
      showLast
      heightClassName={heightClassName}
    />
  );
}

function AiWorkspaceTemplatePromptLanding() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiwReply(prompt, current.length)]);

  if (messages.length > 0) {
    return (
      <PageFrame title="Prompt-first landing" address="nordkapp.example/assistant">
        <WorkspaceLayout
          label="Plant assistant"
          header={
            <AiwTitle title="New conversation">
              <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                <IconArrowLeft /> Back to start
              </Button>
            </AiwTitle>
          }
          thread={<ChatThread messages={messages} />}
          composer={<AiwPrompt onSend={send} />}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Prompt-first landing" address="nordkapp.example/assistant">
      <div className="flex min-h-full flex-col items-center justify-center bg-base-background px-6 py-8">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">What do you want to know about Nordkapp?</h1>
            <p className="text-sm text-muted-foreground">Answers cite the tags, alarms and documents they are based on.</p>
          </div>
          <AiwPrompt onSend={send} placeholder="Ask about an asset, a tag, an alarm or a work order" />
          <PromptSuggestions suggestions={AIW_STARTERS} onSelect={send} />
          <section aria-labelledby="aiw-landing-recent" className="flex flex-col gap-1">
            <h2 id="aiw-landing-recent" className="text-xs font-medium text-muted-foreground">
              Recent conversations
            </h2>
            <ul className="flex flex-col">
              {AIW_CONVERSATIONS.slice(0, 3).map((conversation) => (
                <li key={conversation.id} className="border-b border-default last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setMessages(conversation.messages)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
                  >
                    <IconMessageCircle aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-base-foreground">{conversation.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {conversation.group === 'Earlier' ? conversation.when : `${conversation.group}, ${conversation.when}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageFrame>
  );
}

function AiWorkspaceTemplateFirstRun() {
  const [steps, setSteps] = useState<readonly SetupStep[]>(AIW_SETUP);
  const complete = (id: string) => setSteps((current) => current.map((step) => (step.id === id ? { ...step, done: true } : step)));

  return (
    <PageFrame title="Empty workspace, first run" address="nordkapp.example/assistant">
      <WorkspaceLayout
        label="Plant assistant"
        sidebar={
          <div className="flex flex-1 flex-col gap-3 p-3">
            <Button variant="secondary" size="sm" className="w-full" disabled>
              <IconPlus /> New conversation
            </Button>
            <p className="text-xs text-muted-foreground">Finish setup to start a conversation. Your conversations will be listed here.</p>
          </div>
        }
        threadWidth="reading"
        thread={
          <div className="flex h-full flex-col justify-center gap-6 overflow-y-auto py-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight text-base-foreground">Set up the plant assistant</h1>
              <p className="text-sm text-muted-foreground">Two steps left. After that you can ask about anything in the areas you chose.</p>
            </div>
            <SetupChecklist
              title="Getting started"
              steps={steps}
              onStepAction={complete}
              complete={
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-medium-foreground">Setup is done. Ask your first question below.</p>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => setSteps(AIW_SETUP)}>
                      Reset example
                    </Button>
                  </div>
                </div>
              }
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Examples of what you can ask</p>
              <PromptSuggestions suggestions={AIW_STARTERS.slice(0, 3)} onSelect={() => complete('ask')} disabled={!steps[1].done} />
            </div>
          </div>
        }
      />
    </PageFrame>
  );
}

function AiWorkspaceTemplateChatOnly() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>(AIW_THREAD);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiwReply(prompt, current.length)]);

  return (
    <PageFrame title="Chat only" address="nordkapp.example/assistant/c1" height="lg">
      <WorkspaceLayout
        label="Plant assistant"
        header={
          <AiwTitle title="Vibration on 23-KA-9101" context="Reads Nordkapp data. It cannot change anything.">
            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
              <IconPlus /> New conversation
            </Button>
          </AiwTitle>
        }
        thread={
          <ChatThread
            messages={messages}
            emptyState={
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <p className="text-sm text-muted-foreground">Ask about an asset, a tag, an alarm or a work order.</p>
                <PromptSuggestions layout="stack" suggestions={AIW_STARTERS.slice(0, 3)} onSelect={send} />
              </div>
            }
          />
        }
        composer={<AiwPrompt onSend={send} />}
      />
    </PageFrame>
  );
}

function AiWorkspaceTemplateHistorySidebar() {
  const [activeId, setActiveId] = useState<string | null>('c2');
  const [extra, setExtra] = useState<Readonly<Record<string, readonly ChatMessage[]>>>({});
  const active = AIW_CONVERSATIONS.find((conversation) => conversation.id === activeId);
  const key = activeId ?? 'new';
  const messages = [...(active?.messages ?? []), ...(extra[key] ?? [])];
  const send = (prompt: string) =>
    setExtra((current) => ({ ...current, [key]: [...(current[key] ?? []), ...aiwReply(prompt, (current[key] ?? []).length + 10)] }));
  const groups = ['Today', 'Yesterday', 'Earlier'] as const;

  return (
    <PageFrame title="History sidebar and thread" address="nordkapp.example/assistant" height="lg">
      <WorkspaceLayout
        label="Plant assistant"
        sidebar={
          <div className="flex flex-col gap-4 p-3">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => setActiveId(null)}>
              <IconPlus /> New conversation
            </Button>
            {groups.map((group) => (
              <div key={group} className="flex flex-col gap-1">
                <p className="px-2 text-xs font-medium text-muted-foreground">{group}</p>
                <ul className="flex flex-col">
                  {AIW_CONVERSATIONS.filter((conversation) => conversation.group === group).map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        aria-current={conversation.id === activeId ? 'page' : undefined}
                        onClick={() => setActiveId(conversation.id)}
                        className={`flex w-full flex-col rounded-lg px-2 py-1.5 text-left outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring ${conversation.id === activeId ? 'bg-secondary-background text-secondary-foreground' : ''}`}
                      >
                        <span className={`truncate text-sm ${conversation.id === activeId ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}>
                          {conversation.title}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">{conversation.when}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        }
        thread={
          <ChatThread
            key={key}
            messages={messages}
            emptyState={
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-base-foreground">New conversation</p>
                  <p className="text-sm text-muted-foreground">Earlier conversations stay in the list on the left.</p>
                </div>
                <PromptSuggestions layout="stack" suggestions={AIW_STARTERS.slice(0, 3)} onSelect={send} />
              </div>
            }
          />
        }
        composer={<AiwPrompt onSend={send} />}
      />
    </PageFrame>
  );
}

function AiWorkspaceTemplateSourcesRail() {
  const [selected, setSelected] = useState(AIW_SOURCES[0].id);

  return (
    <PageFrame title="Chat with sources rail" address="nordkapp.example/assistant/c1" height="lg">
      <WorkspaceLayout
        label="Plant assistant"
        header={<AiwTitle title="Vibration on 23-KA-9101" context={`${AIW_SOURCES.length} sources behind the last answer`} />}
        threadWidth="fill"
        thread={<ChatThread messages={AIW_SHORT_THREAD.map((message) => (message.role === 'assistant' ? { ...message, sources: undefined } : message))} />}
        composer={<AiwPrompt onSend={() => undefined} placeholder="Ask a follow-up" />}
        railLabel="Sources"
        rail={
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <h3 className="text-sm font-medium text-base-foreground">Sources</h3>
              <span className="text-xs tabular-nums text-muted-foreground">{AIW_SOURCES.length} used</span>
            </div>
            <ul className="flex flex-col gap-1">
              {AIW_SOURCES.map((item, index) => {
                const kind = item.kind ?? 'web';
                const Icon = AIW_SOURCE_ICON[kind];
                const open = item.id === selected;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setSelected(item.id)}
                      className={`flex w-full flex-col gap-1 rounded-lg p-2 text-left outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring ${open ? 'bg-muted-background' : ''}`}
                    >
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{index + 1}</span>
                        <Icon aria-hidden className="size-4 shrink-0" />
                        {AIW_SOURCE_KIND[kind]}
                      </span>
                      <span className="text-sm text-base-foreground">{item.title}</span>
                      {open ? <span className="text-xs text-medium-foreground">{AIW_SOURCE_EXCERPTS[item.id]}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="px-1 text-xs text-muted-foreground">Select a source to see the part the answer used.</p>
          </div>
        }
      />
    </PageFrame>
  );
}

function AiWorkspaceTemplateChatCanvas() {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [messages, setMessages] = useState<readonly ChatMessage[]>(AIW_SHORT_THREAD);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiwReply(prompt, current.length)]);

  return (
    <PageFrame title="Chat and canvas" address="nordkapp.example/assistant/c1" height="lg">
      <WorkspaceLayout
        label="Plant assistant"
        thread={<ChatThread messages={messages} hideActions />}
        composer={<AiwPrompt onSend={send} placeholder="Ask to change the chart" />}
        canvasLabel="Artifact: drive-end vibration"
        canvas={
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <h2 className="truncate text-sm font-semibold text-base-foreground">{AIW_VIBRATION.name}, last 48 hours</h2>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{AIW_VIBRATION.tag}</span> · made by the assistant, version 1
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SegmentedControl
                  value={view}
                  onValueChange={(value) => {
                    if (isAiwView(value)) setView(value);
                  }}
                >
                  <SegmentedControlList aria-label="Artifact view" size="small">
                    <SegmentedControlButton value="chart" tabContent="label-only" size="small">
                      Chart
                    </SegmentedControlButton>
                    <SegmentedControlButton value="table" tabContent="label-only" size="small">
                      Data
                    </SegmentedControlButton>
                  </SegmentedControlList>
                </SegmentedControl>
                <Button variant="secondary" size="sm">
                  Add to dashboard
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-col rounded-xl bg-base-background p-4">
              {view === 'chart' ? (
                <AiwVibrationChart heightClassName="h-96" />
              ) : (
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Drive-end vibration, every eighth hourly value</caption>
                  <thead>
                    <tr className="border-b border-default text-xs text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Hours ago</th>
                      <th className="py-2 pr-4 text-right font-medium">Value, {AIW_VIBRATION.unit}</th>
                      <th className="py-2 text-right font-medium">Margin to limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AIW_VIBRATION_SERIES.filter((_, index) => index % 8 === 7).map((point, index) => (
                      <tr key={point.t} className="border-b border-default last:border-b-0">
                        <td className="py-2 pr-4 tabular-nums text-muted-foreground">{40 - index * 8}</td>
                        <td className="py-2 pr-4 text-right tabular-nums text-base-foreground">{point.v.toFixed(1)}</td>
                        <td className="py-2 text-right tabular-nums text-medium-foreground">{(AIW_VIBRATION.highLimit - point.v).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The canvas keeps the latest artifact. Ask in the thread to change the range, add a tag or compare with another compressor.
            </p>
          </div>
        }
      />
    </PageFrame>
  );
}

function AiWorkspaceTemplateDockedAssistant() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<readonly ChatMessage[]>(AIW_SHORT_THREAD);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiwReply(prompt, current.length)]);

  return (
    <PageFrame title="Assistant docked in a data page" address="nordkapp.example/assets/23-KA-9101" height="lg">
      <ShellPage product="Nordkapp" nav={AIW_SHELL_NAV} activeId="assets" collapsed trail={['Assets', 'Gas compression', AIW_COMPRESSOR.tag]} flush>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
            <PageHeader
              as="h1"
              title={AIW_COMPRESSOR.name}
              meta={<span className="font-mono text-xs">{AIW_COMPRESSOR.tag}</span>}
              status={<StatusIndicator tone="warning" label="Watch" variant="badge" />}
              actions={
                <Button variant={open ? 'secondary' : 'default'} size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
                  <IconSparkles /> {open ? 'Hide assistant' : 'Ask assistant'}
                </Button>
              }
            />
            <AiwVibrationChart heightClassName="h-44" />
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Sensors on {AIW_COMPRESSOR.name}</caption>
              <thead>
                <tr className="border-b border-default text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Measurement</th>
                  <th className="py-2 pr-4 font-medium">Tag</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {AIW_COMPRESSOR_SENSORS.map((sensor) => (
                  <tr key={sensor.id} className="border-b border-default last:border-b-0">
                    <td className="py-2 pr-4 text-base-foreground">{sensor.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground">{sensor.tag}</td>
                    <td className="py-2 text-right whitespace-nowrap tabular-nums text-base-foreground">
                      {sensor.value.toFixed(sensor.decimals)} <span className="text-muted-foreground">{sensor.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {open ? (
            <div className="flex w-80 shrink-0">
              <AssistantPanel
                title="Plant assistant"
                context={`Reading ${AIW_COMPRESSOR.tag} and its alarms`}
                icon={<IconSparkles />}
                actions={
                  <Button variant="ghost" size="icon-sm" aria-label="Close assistant" onClick={() => setOpen(false)}>
                    <IconX />
                  </Button>
                }
                footer={<AiwPrompt onSend={send} placeholder="Ask about this compressor" />}
              >
                <ChatThread messages={messages} hideActions />
              </AssistantPanel>
            </div>
          ) : null}
        </div>
      </ShellPage>
    </PageFrame>
  );
}

function AiWorkspaceTemplateNotebook() {
  const [extra, setExtra] = useState<readonly string[]>([]);

  return (
    <PageFrame title="Notebook" address="nordkapp.example/notebooks/compressor-vibration" height="lg">
      <div className="flex min-h-full flex-col bg-base-background">
        <header className="flex items-center gap-3 border-b border-default px-6 py-3">
          <AiwTitle title="Compressor vibration, week 11" context="Notebook · 3 questions · saved 13:58">
            <Button variant="secondary" size="sm">
              Share notebook
            </Button>
          </AiwTitle>
        </header>
        <ol className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-6">
          <li className="flex flex-col gap-3">
            <AiwNotebookQuestion index={1} text="Show drive-end vibration on 23-KA-9101 for the last 48 hours." />
            <div className="ml-10 flex flex-col gap-3">
              <AiwVibrationChart heightClassName="h-48" />
              <MessageResponse>{AIW_ANSWER}</MessageResponse>
            </div>
          </li>
          <li className="flex flex-col gap-3">
            <AiwNotebookQuestion index={2} text="Compare with the other two compressors this week." />
            <div className="ml-10 flex flex-col gap-3">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Drive-end vibration per compressor, last 7 days</caption>
                <thead>
                  <tr className="border-b border-default text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Compressor</th>
                    <th className="w-40 py-2 pr-4 font-medium">Last 7 days</th>
                    <th className="py-2 pr-4 text-right font-medium">Latest, mm/s</th>
                    <th className="py-2 text-right font-medium">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {AIW_COMPARISON.map((row) => (
                    <tr key={row.asset.id} className="border-b border-default last:border-b-0">
                      <td className="py-2 pr-4">
                        <span className="flex flex-col">
                          <span className="text-base-foreground">{row.asset.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{row.asset.tag}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <Sparkline
                          values={row.values}
                          label={`Drive-end vibration on ${row.asset.tag}, last 7 days`}
                          unit="mm/s"
                          height={28}
                          tone={row.latest > row.limit ? 'critical' : 'neutral'}
                          showLast
                        />
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-base-foreground">{row.latest.toFixed(1)}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">{row.limit.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <MessageResponse>
                The recompressor **23-KA-9103** went past its trip limit and is down. **23-KA-9101** shows the same rising shape at about a third of the rate. **23-KA-9102** is flat.
              </MessageResponse>
            </div>
          </li>
          <li className="flex flex-col gap-3">
            <AiwNotebookQuestion index={3} text="Is work already planned on 23-KA-9101?" />
            <div className="ml-10">
              <MessageResponse>{AIW_ANSWER_ORDERS}</MessageResponse>
            </div>
          </li>
          {extra.map((question, index) => (
            <li key={`${index}-${question}`} className="flex flex-col gap-3">
              <AiwNotebookQuestion index={index + 4} text={question} />
              <div className="ml-10">
                <MessageResponse>{AIW_ANSWER_SHORT}</MessageResponse>
              </div>
            </li>
          ))}
          <li className="ml-10 flex flex-col gap-2">
            <AiwPrompt onSend={(text) => setExtra((current) => [...current, text])} placeholder="Add a question to the notebook" />
            {extra.length > 0 ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setExtra([])}>
                  Remove added questions
                </Button>
              </div>
            ) : null}
          </li>
        </ol>
      </div>
    </PageFrame>
  );
}

function AiwNotebookQuestion({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted-background font-mono text-xs tabular-nums text-muted-foreground">
        {index}
      </span>
      <p className="min-w-0 flex-1 pt-1 text-sm font-medium text-base-foreground">{text}</p>
    </div>
  );
}

function aiwStepStatus(index: number, done: number): AgentRunStepStatus {
  if (index < done) return 'done';
  if (index > done) return 'queued';
  return index === AIW_RUN_PLAN.length - 1 ? 'waiting' : 'running';
}

function AiWorkspaceTemplateAgentRun() {
  const [done, setDone] = useState(3);
  const total = AIW_RUN_PLAN.length;
  const finished = done >= total;
  const waiting = done === total - 1;

  const steps: AgentRunStep[] = AIW_RUN_PLAN.map((plan, index) => {
    const status = aiwStepStatus(index, done);
    const isDraft = plan.id === 'draft';
    return {
      id: plan.id,
      label: plan.label,
      status,
      detail: status === 'done' ? plan.result : status === 'queued' ? undefined : plan.activity,
      duration: status === 'done' ? plan.duration : undefined,
      trace: isDraft ? (
        status === 'queued' ? undefined : (
          <ToolCall
            call={status === 'done' ? { ...AIW_DRAFT_TOOL, status: 'completed', output: { id: 'WO-104490' } } : AIW_DRAFT_TOOL}
            defaultOpen
            onApprove={() => setDone(total)}
            onDeny={() => setDone(3)}
          />
        )
      ) : plan.tools && status === 'done' ? (
        <ToolCallList calls={plan.tools} />
      ) : undefined,
    };
  });

  return (
    <PageFrame title="Agent run" address="nordkapp.example/agents/runs/run-2291" height="lg">
      <div className="flex h-full flex-col bg-base-background">
        <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-default px-4 py-2">
          <AiwTitle title="Compare recompressor trips and propose an inspection" context="Run run-2291 · started 13:52 by Aisha Khan">
            <StatusIndicator
              size="sm"
              tone={finished ? 'success' : waiting ? 'warning' : 'info'}
              label={finished ? 'Finished' : waiting ? 'Needs approval' : 'Running'}
            />
            {finished || waiting ? null : (
              <Button variant="secondary" size="sm" onClick={() => setDone(done + 1)}>
                Advance one step
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDone(3)}>
              Restart example
            </Button>
          </AiwTitle>
        </header>
        <div className="flex min-h-0 flex-1">
          <section aria-label="Steps" className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4">
            <AgentRunList key={done} label="Steps" steps={steps} />
          </section>
          <section aria-label="Report" className="flex w-96 shrink-0 flex-col gap-3 overflow-y-auto border-l border-default bg-muted-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <IconListCheck aria-hidden className="size-4" /> Final report
            </div>
            {done >= 5 ? (
              <Prose>
                <h3>Two of three trips followed the same pattern</h3>
                <p>
                  Before the trips on 14 January and 12 March, drive-end vibration on <code>23-VT-92740</code> rose steadily for about six
                  hours. The February trip was a process upset and is unrelated.
                </p>
                <ul>
                  <li>
                    <code>23-KA-9101</code> shows the same shape now, at a third of the rate.
                  </li>
                  <li>Both earlier inspections found a worn drive-end bearing.</li>
                </ul>
                <p>
                  <strong>Proposed:</strong> inspect the drive-end bearing on 23-KA-9101 within 2 days.
                  {finished ? ' Work order WO-104490 has been created.' : ' The work order waits for your approval.'}
                </p>
              </Prose>
            ) : (
              <p className="text-sm text-muted-foreground">The report appears here when the agent has written it. Findings so far are on each step.</p>
            )}
          </section>
        </div>
      </div>
    </PageFrame>
  );
}

function AiWorkspaceTemplateReviewAction() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const decide = (kind: Decision, comment: string) => {
    const verb = kind === 'approve' ? 'Approved' : kind === 'reject' ? 'Rejected' : 'Sent back';
    setOutcome(comment ? `${verb}: ${comment}` : `${verb}. The agent has been told.`);
    setDecision(null);
  };

  return (
    <PageFrame title="Review and approve agent action" address="nordkapp.example/agents/reviews/rev-118">
      <div className="flex min-h-full flex-col bg-base-background">
        <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-default px-4 py-2">
          <AiwTitle title="Review agent action" context="rev-118 · proposed 13:58 by the maintenance agent">
            <Badge variant={outcome ? 'secondary' : 'warning'}>{outcome ? 'Decided' : 'Waiting for you'}</Badge>
          </AiwTitle>
        </header>
        <div className="grid flex-1 grid-cols-1 gap-6 p-6 @3xl:grid-cols-5">
          <section aria-labelledby="aiw-review-proposal" className="flex flex-col gap-4 @3xl:col-span-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">The agent wants to</p>
              <h1 id="aiw-review-proposal" className="text-xl font-semibold tracking-tight text-base-foreground">
                Create a work order in SAP PM
              </h1>
              <p className="text-sm text-muted-foreground">Nothing is written until you approve. You can edit the work order afterwards.</p>
            </div>
            <div className="rounded-xl border border-default p-4">
              <PropertyList items={AIW_PROPOSAL} columns={2} layout="stacked" />
            </div>
            <ToolCallList calls={[AIW_TOOLS[1], { ...AIW_DRAFT_TOOL, status: 'pending', approvalReason: undefined }]} collapsible />
            {outcome ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted-background p-4" role="status">
                <p className="text-sm text-base-foreground">{outcome}</p>
                <Button variant="ghost" size="sm" onClick={() => setOutcome(null)}>
                  Reset example
                </Button>
              </div>
            ) : decision ? (
              <DecisionForm
                key={decision}
                decision={decision}
                submitLabel={decision === 'approve' ? 'Approve and create' : undefined}
                onSubmit={(comment) => decide(decision, comment)}
                onCancel={() => setDecision(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setDecision('approve')}>Approve</Button>
                <Button variant="secondary" onClick={() => setDecision('request-changes')}>
                  Request changes
                </Button>
                <Button variant="ghost" onClick={() => setDecision('reject')}>
                  Reject
                </Button>
              </div>
            )}
          </section>
          <aside aria-label="Why the agent proposes this" className="flex flex-col gap-4 @3xl:col-span-2">
            <InsightCard
              kind="Reason"
              tone="warning"
              title="Vibration is following the pattern that preceded two trips"
              summary="Drive-end vibration on 23-KA-9101 has risen 0.9 mm/s in 48 hours at constant speed, the same shape seen on the recompressor before it tripped."
              evidence={[
                { id: 'now', label: '23-VT-92540', value: '6.8 mm/s, limit 7.1', mono: true },
                { id: 'rate', label: 'Rate of rise', value: '0.45 mm/s per day' },
                { id: 'trips', label: 'Earlier trips with this pattern', value: '2 of 3' },
              ]}
              footnote="Based on hourly averages. The agent did not read the lube oil analysis."
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Trend the agent read</p>
              <Sparkline
                values={AIW_VIBRATION_SERIES.map((point) => point.v)}
                label="Drive-end vibration, last 48 hours"
                unit={AIW_VIBRATION.unit}
                height={56}
                variant="area"
                limit={AIW_VIBRATION.highLimit}
                showLast
              />
            </div>
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}

export default definePage({
  id: 'ai-workspaces',
  title: 'AI workspaces',
  summary:
    'Whole pages built around an assistant: from a single thread to chat beside a canvas, a docked assistant in a data page and agent runs that need review. Every one is assembled from the AI components and runs on prepared plant-operations content.',
  guidance: {
    use: [
      'Keep the prompt pinned to the bottom of the thread, in view at every scroll position.',
      'Give the flexible width to the work (canvas, table, chart) and make the thread the fixed column.',
      'Show what the assistant can read, and stop for approval before anything is written.',
      'Let every answer lead to its sources, either under the answer or in a rail.',
    ],
    avoid: [
      'A chat-only page for work that produces something to look at; give it a canvas.',
      'Agent runs that only show a spinner: list the steps and what each one found.',
      'Hiding the data page behind the assistant; dock it beside the content.',
    ],
  },
  source,
  sections: [
    {
      id: 'starting',
      title: 'Starting points',
      description: 'What the workspace shows before there is a conversation.',
      specimens: [
        {
          id: 'AiWorkspaceTemplatePromptLanding',
          title: 'Prompt-first landing',
          note: 'Pick it as the home of an assistant product: the prompt is the page, with suggestions and recent conversations under it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'ai/PromptSuggestions.tsx', 'ai/ChatThread.tsx'],
          Component: AiWorkspaceTemplatePromptLanding,
        },
        {
          id: 'AiWorkspaceTemplateFirstRun',
          title: 'Empty workspace, first run',
          note: 'Use the first time someone opens the workspace, when setup has to happen before the first question.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'patterns/states/SetupChecklist.tsx', 'ai/PromptSuggestions.tsx'],
          Component: AiWorkspaceTemplateFirstRun,
        },
      ],
    },
    {
      id: 'conversation',
      title: 'Conversation pages',
      description: 'The thread is the page.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateChatOnly',
          title: 'Chat only',
          note: 'Pick it when answers are text: a centred thread at reading width with the prompt at the bottom.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx'],
          Component: AiWorkspaceTemplateChatOnly,
        },
        {
          id: 'AiWorkspaceTemplateHistorySidebar',
          title: 'History sidebar and thread',
          note: 'Use when people return to earlier conversations; the list is grouped by day and switching keeps each thread.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx'],
          Component: AiWorkspaceTemplateHistorySidebar,
        },
        {
          id: 'AiWorkspaceTemplateSourcesRail',
          title: 'Chat with sources rail',
          note: 'Pick it when checking the evidence is part of the job: sources stay open beside the answer instead of under it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'ai/ChatThread.tsx'],
          Component: AiWorkspaceTemplateSourcesRail,
        },
      ],
    },
    {
      id: 'beside-work',
      title: 'Chat beside work',
      description: 'The assistant shares the page with what it produces or reads.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateChatCanvas',
          title: 'Chat and canvas',
          note: 'Use when the assistant makes something to look at: thread on the left, the chart or table it made on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/WorkspaceLayout.tsx', 'ai/ChatThread.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AiWorkspaceTemplateChatCanvas,
        },
        {
          id: 'AiWorkspaceTemplateDockedAssistant',
          title: 'Assistant docked in a data page',
          note: 'Pick it when the assistant helps with a page people already use; it opens beside the trend and table and can be closed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/ShellPage.tsx',
            'patterns/product/AssistantPanel.tsx',
            'patterns/structure/PageHeader.tsx',
            'ai/ChatThread.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: AiWorkspaceTemplateDockedAssistant,
        },
        {
          id: 'AiWorkspaceTemplateNotebook',
          title: 'Notebook',
          note: 'Use for an analysis people keep and share: numbered questions, each followed by the chart or table and the answer.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/Sparkline.tsx'],
          Component: AiWorkspaceTemplateNotebook,
        },
      ],
    },
    {
      id: 'agents',
      title: 'Agent pages',
      description: 'Long-running work with steps, traces and a decision for a person.',
      specimens: [
        {
          id: 'AiWorkspaceTemplateAgentRun',
          title: 'Agent run',
          note: 'Pick it for a task that takes minutes: steps with their state and tool traces on the left, the report on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/AgentRunList.tsx',
            'templates-b/agentRun.ts',
            'ai/ToolCall.tsx',
            'ai/ToolCallList.tsx',
            'patterns/content/Prose.tsx',
          ],
          Component: AiWorkspaceTemplateAgentRun,
        },
        {
          id: 'AiWorkspaceTemplateReviewAction',
          title: 'Review and approve',
          note: 'Use when an agent wants to write to another system: the proposal, the reason and the decision on one page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'patterns/product/InsightCard.tsx',
            'patterns/workflows/DecisionForm.tsx',
            'patterns/structure/PropertyList.tsx',
            'ai/ToolCallList.tsx',
            'industrial/Sparkline.tsx',
          ],
          Component: AiWorkspaceTemplateReviewAction,
        },
      ],
    },
  ],
});
