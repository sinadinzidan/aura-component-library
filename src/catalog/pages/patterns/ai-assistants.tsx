import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@cognite/aura/components/input-group';
import { Kbd } from '@cognite/aura/components/kbd';
import { MessageResponse } from '@cognite/aura/components/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@cognite/aura/components/prompt-input';
import {
  IconArrowUp,
  IconBinaryTree,
  IconChartLine,
  IconInfoCircle,
  IconMessageCircle,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTool,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ChatThread } from '../../../library/ai/ChatThread';
import type { ChatMessage } from '../../../library/ai/ChatThread';
import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import { ResponseActions } from '../../../library/ai/ResponseActions';
import type { ResponseFeedback } from '../../../library/ai/ResponseActions';
import { SourceList } from '../../../library/ai/SourceList';
import type { SourceItem } from '../../../library/ai/SourceList';
import type { ToolCallData } from '../../../library/ai/ToolCall';
import { ToolCallList } from '../../../library/ai/ToolCallList';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { FilterChip } from '../../../library/patterns/data-entry/FilterChip';
import { AssistantPanel } from '../../../library/patterns/product/AssistantPanel';
import { DraftReview } from '../../../library/patterns/product/DraftReview';
import { InsightCard } from '../../../library/patterns/product/InsightCard';
import { parseFilterQuery } from '../../../library/patterns/product/parseFilterQuery';
import type { FilterTerm, ParsedFilter } from '../../../library/patterns/product/parseFilterQuery';
import type { AgentTask } from '../../../library/patterns/product/summarizeTasks';
import { TaskProgressList } from '../../../library/patterns/product/TaskProgressList';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { formatAgo, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './ai-assistants.tsx?raw';

const AI_COMPRESSOR = ASSETS[8];
const AI_VIBRATION = SENSORS[3];
const AI_VIBRATION_SERIES = makeSeries({ seed: AI_VIBRATION.seed, points: 48, base: 5.9, amplitude: 0.3, noise: 0.15, drift: 0.9 });
const AI_VIBRATION_VALUES = AI_VIBRATION_SERIES.map((point) => point.v);
const AI_ALARMS = ALARMS.slice(0, 4);

const AI_SOURCES: readonly SourceItem[] = [
  { id: 'ts', title: '23-VT-92540 Drive-end vibration', href: 'https://fusion.cognite.test/timeseries/23-VT-92540', kind: 'timeseries' },
  { id: 'asset', title: '23-KA-9101 1st stage compressor', href: 'https://fusion.cognite.test/assets/23-KA-9101', kind: 'asset' },
  { id: 'event', title: 'Alarm alm-4809, acknowledged 12:02', href: 'https://fusion.cognite.test/events/alm-4809', kind: 'event' },
  { id: 'file', title: 'Vibration limits, rotating equipment (rev. 4)', href: 'https://fusion.cognite.test/files/vibration-limits', kind: 'file' },
];

const AI_ANSWER =
  'Drive-end vibration on **23-KA-9101** is **6.8 mm/s**, 0.3 below the high limit of 7.1. It has risen 0.9 mm/s over the last 48 hours while shaft speed stayed flat, which points to the bearing and not to load.';

const AI_ANSWER_SHORT = 'Vibration is 6.8 mm/s and rising about 0.45 mm/s per day. At that rate it reaches the 7.1 limit in roughly 16 hours.';

const AI_STARTERS = [
  { id: 'why', label: 'Why is vibration rising?', prompt: 'Why is drive-end vibration on 23-KA-9101 rising?' },
  { id: 'limit', label: 'When will it reach the limit?', prompt: 'When will 23-VT-92540 reach its high limit at the current rate?' },
  { id: 'orders', label: 'Is work already planned?', prompt: 'Is there planned work on 23-KA-9101?' },
];

const AI_PROMPT_CARDS = [
  { id: 'trip', icon: IconChartLine, title: 'Explain a trip', prompt: 'Why did the recompressor trip at 13:46?' },
  { id: 'compare', icon: IconBinaryTree, title: 'Compare equipment', prompt: 'Compare vibration on the three compressors this week' },
  { id: 'orders', icon: IconTool, title: 'Check planned work', prompt: 'Which work orders in gas compression are overdue?' },
  { id: 'handover', icon: IconMessageCircle, title: 'Draft a handover', prompt: 'Summarise this shift for the handover log' },
] as const;

const AI_TOOLS_DONE: readonly ToolCallData[] = [
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
  {
    id: 'alarms',
    toolName: 'list_alarms',
    title: 'List alarms on the asset',
    status: 'completed',
    input: { asset: '23-KA-9101', state: ['active', 'acknowledged'] },
    output: { count: 2 },
  },
];

const AI_TOOL_APPROVAL: ToolCallData = {
  id: 'create',
  toolName: 'create_work_order',
  title: 'Create work order in SAP PM',
  status: 'awaiting-approval',
  input: { asset: '23-KA-9101', type: 'inspection', priority: 'P2', title: 'Inspect drive-end bearing', estimatedHours: 4 },
  approvalReason: 'This writes to the maintenance system.',
};

const AI_TASKS: readonly AgentTask[] = [
  { id: 'history', label: 'Read alarm history for 23-KA-9103', status: 'done', detail: '3 trips since January' },
  { id: 'trends', label: 'Compare vibration in the hour before each trip', status: 'done', detail: 'Same pattern in 2 of 3' },
  { id: 'orders', label: 'Check work orders that followed', status: 'running', detail: 'Reading SAP PM' },
  { id: 'report', label: 'Write the comparison', status: 'queued' },
  { id: 'draft', label: 'Draft an inspection work order', status: 'queued' },
];

const AI_SUMMARIES = [
  'Day shift, 12 March. The recompressor 23-KA-9103 tripped on high vibration at 13:46 and remains down; WO-104482 is in progress. Discharge temperature on 23-KA-9101 is above its high limit. Export continues at 4.38 MSm³/d on two compressors.',
  'One trip this shift: recompressor 23-KA-9103 at 13:46, high vibration, bearing inspection under way (WO-104482, 35% done). Watch 23-KA-9101: discharge temperature 146.3 °C against a limit of 145. No change to export.',
] as const;

const AI_DRAFT =
  'Inspect the drive-end bearing on 23-KA-9101.\n\nVibration (23-VT-92540) has risen from 5.9 to 6.8 mm/s in 48 hours at constant speed. High limit is 7.1 mm/s. Check bearing clearance and lubrication; compare with the findings on 23-KA-9103 (WO-104482).';

const AI_VOCABULARY: readonly FilterTerm[] = [
  { property: 'Severity', value: 'Critical', phrases: ['critical'] },
  { property: 'Severity', value: 'High', phrases: ['high'] },
  { property: 'State', value: 'Active', phrases: ['active', 'unacknowledged'] },
  { property: 'State', value: 'Acknowledged', phrases: ['acknowledged'] },
  { property: 'Area', value: 'Gas compression', phrases: ['gas compression', 'compression', 'compressors'] },
  { property: 'Area', value: 'Gas export', phrases: ['gas export', 'export'] },
  { property: 'Period', value: 'Last 24 hours', phrases: ['last 24 hours', 'today', 'since yesterday'] },
  { property: 'Period', value: 'Last 7 days', phrases: ['last 7 days', 'this week'] },
];

const AI_THREAD: readonly ChatMessage[] = [
  { id: 'u1', role: 'user', text: 'Why is drive-end vibration on 23-KA-9101 rising?' },
  { id: 'a1', role: 'assistant', text: AI_ANSWER, tools: AI_TOOLS_DONE, sources: AI_SOURCES },
];

const aiNoop = () => undefined;

function aiReply(prompt: string, index: number): ChatMessage[] {
  return [
    { id: `u-${index}`, role: 'user', text: prompt },
    { id: `a-${index}`, role: 'assistant', text: AI_ANSWER_SHORT, sources: AI_SOURCES.slice(0, 2) },
  ];
}

function AiPrompt({ onSend, placeholder = 'Ask about this compressor' }: { onSend: (text: string) => void; placeholder?: string }) {
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

function AiTrendCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{AI_VIBRATION.name}</CardTitle>
          <CardDescription>
            <span className="font-mono">{AI_VIBRATION.tag}</span> · {AI_COMPRESSOR.name}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator tone="warning" label="Approaching limit" size="sm" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <TrendChart
          className="w-full"
          label="Drive-end vibration over 48 hours, rising towards its high limit of 7.1 mm/s"
          series={[{ key: 'vibration', label: AI_VIBRATION.name, points: AI_VIBRATION_SERIES }]}
          limits={[{ value: AI_VIBRATION.highLimit, label: `High ${AI_VIBRATION.highLimit}`, tone: 'warning' }]}
          unit={AI_VIBRATION.unit}
          yDomain={[4, 8]}
          maxTicks={4}
          showLast
          heightClassName="h-44"
        />
      </CardContent>
    </Card>
  );
}

function AiAssistantEmptyState() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiReply(prompt, current.length)]);

  return (
    <div className="h-112 w-full">
      <AssistantPanel
        variant="floating"
        title="Plant assistant"
        context="Reads Nordkapp data. It cannot change anything."
        icon={<IconSparkles />}
        footer={<AiPrompt onSend={send} />}
      >
        <ChatThread
          messages={messages}
          emptyState={
            <div className="flex max-w-xs flex-col items-center gap-4 text-center">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-base-foreground">Ask about 23-KA-9101</p>
                <p className="text-sm text-muted-foreground">Answers cite the tags, alarms and documents they are based on.</p>
              </div>
              <PromptSuggestions layout="stack" suggestions={AI_STARTERS} onSelect={send} />
            </div>
          }
        />
      </AssistantPanel>
    </div>
  );
}

function AiAssistantSuggestedPrompts() {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label="Suggested prompts" className="grid grid-cols-2 gap-3">
        {AI_PROMPT_CARDS.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              aria-pressed={picked === card.prompt}
              onClick={() => setPicked(card.prompt)}
              className="flex h-full w-full flex-col gap-2 rounded-xl bg-card-background p-4 text-left outline-none hover:bg-muted-background focus-visible:shadow-focus-ring"
            >
              <card.icon aria-hidden className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium text-base-foreground">{card.title}</span>
              <span className="text-xs text-muted-foreground">{card.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {picked ? `Prompt filled: "${picked}"` : 'Pick one to fill the prompt; nothing is sent until you press send.'}
      </p>
    </div>
  );
}

function AiAssistantAskBar() {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) setAsked(query.trim());
        }}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <IconSparkles aria-hidden />
          </InputGroupAddon>
          <InputGroupInput aria-label="Ask the assistant" placeholder="Ask anything about Nordkapp" value={query} onChange={(event) => setQuery(event.target.value)} />
          <InputGroupAddon align="inline-end">
            {query ? (
              <InputGroupButton type="submit" size="icon-xs" aria-label="Send question">
                <IconArrowUp />
              </InputGroupButton>
            ) : (
              <Kbd>⌘K</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
      {asked ? (
        <div className="flex flex-col gap-2 rounded-xl bg-card-background p-4">
          <span className="text-xs text-muted-foreground">{asked}</span>
          <p className="text-sm text-base-foreground">{AI_ANSWER_SHORT}</p>
          <Button variant="ghost" size="sm" className="-ml-2 w-fit">
            Continue in the assistant
          </Button>
        </div>
      ) : (
        <PromptSuggestions label="Example questions" suggestions={AI_STARTERS} onSelect={setQuery} />
      )}
    </div>
  );
}

function AiAssistantInlineAsk() {
  const [question, setQuestion] = useState('');
  const [answered, setAnswered] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{AI_VIBRATION.name}</CardTitle>
          <CardDescription>
            <span className="font-mono">{AI_VIBRATION.tag}</span> · last 48 hours
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-4">
          <Sparkline values={AI_VIBRATION_VALUES} label="Drive-end vibration, last 48 hours" unit={AI_VIBRATION.unit} height={56} variant="area" limit={AI_VIBRATION.highLimit} showLast />
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (question.trim()) setAnswered(true);
            }}
          >
            <Input
              aria-label="Ask about this chart"
              placeholder="Ask about this chart"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setAnswered(false);
              }}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={question.trim() === ''}>
              <IconSparkles /> Ask
            </Button>
          </form>
          {answered ? (
            <p role="status" className="text-sm text-base-foreground">
              {AI_ANSWER_SHORT}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">The question is answered from this tag and its asset only.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AiAssistantScopedPrompt() {
  const [scope, setScope] = useState(['23-KA-9101', '23-VT-92540', 'Last 48 hours']);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <PromptInput
        helperText={false}
        onSubmit={(message) => {
          if (message.text?.trim()) setSent(message.text.trim());
        }}
      >
        <PromptInputHeader>
          <ul aria-label="Context sent with the question" className="flex flex-wrap gap-1.5">
            {scope.map((item) => (
              <li key={item} className="flex h-7 items-center gap-1 rounded-md bg-muted-background pr-0.5 pl-2 text-sm text-base-foreground">
                <span className={item.startsWith('2') ? 'font-mono text-xs' : undefined}>{item}</span>
                <IconAction label={`Remove ${item} from context`} onClick={() => setScope((current) => current.filter((entry) => entry !== item))}>
                  <IconX />
                </IconAction>
              </li>
            ))}
          </ul>
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" placeholder="Ask about the selected context" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {sent ? `Sent with ${scope.length} context ${scope.length === 1 ? 'item' : 'items'}: "${sent}"` : 'Remove a chip to narrow what the assistant reads.'}
      </p>
    </div>
  );
}

function AiAssistantFilterBar() {
  const [query, setQuery] = useState('active high alarms in gas compression today');
  const [filters, setFilters] = useState<readonly ParsedFilter[]>(() => parseFilterQuery('active high alarms in gas compression today', AI_VOCABULARY).filters);
  const [rest, setRest] = useState('alarms in');

  const interpret = () => {
    const parsed = parseFilterQuery(query, AI_VOCABULARY);
    setFilters(parsed.filters);
    setRest(parsed.rest);
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          interpret();
        }}
      >
        <Input aria-label="Describe what to show" placeholder="Describe what to show" value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1" />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        {filters.length === 0 ? <span className="text-sm text-muted-foreground">No filters recognised. Try "critical alarms this week".</span> : null}
        {filters.map((filter) => (
          <FilterChip
            key={filter.property}
            label={filter.property}
            value={filter.value}
            onRemove={() => setFilters((current) => current.filter((entry) => entry.property !== filter.property))}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Understood as {filters.length} {filters.length === 1 ? 'filter' : 'filters'}
        {rest ? `; not used: "${rest}"` : ''}. Edit a chip if the reading is wrong.
      </p>
    </div>
  );
}

function AiAssistantAnswerCard() {
  const [feedback, setFeedback] = useState<ResponseFeedback | null>(null);

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-card-background p-4">
      <span className="text-xs text-muted-foreground">Why is drive-end vibration on 23-KA-9101 rising?</span>
      <MessageResponse>{AI_ANSWER}</MessageResponse>
      <SourceList sources={AI_SOURCES} />
      <div className="flex items-center justify-between gap-3">
        <ResponseActions text={AI_ANSWER} onRegenerate={aiNoop} onFeedback={setFeedback} writeText={() => Promise.resolve()} />
        <span role="status" className="text-xs text-muted-foreground">
          {feedback === 'up' ? 'Marked as helpful' : feedback === 'down' ? 'Marked as not helpful' : ''}
        </span>
      </div>
    </div>
  );
}

function AiAssistantSummaryBlock() {
  const [version, setVersion] = useState(0);

  return (
    <section aria-label="Generated shift summary" className="flex w-full flex-col gap-3 rounded-xl bg-card-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <IconSparkles aria-hidden className="size-4" /> Generated summary
        </span>
        <Button variant="ghost" size="sm" onClick={() => setVersion((current) => (current + 1) % AI_SUMMARIES.length)}>
          <IconRefresh /> Regenerate
        </Button>
      </div>
      <p className="text-sm text-pretty text-base-foreground">{AI_SUMMARIES[version]}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        Version {version + 1} of {AI_SUMMARIES.length} · from 4 alarms, 2 work orders and the shift log · 12 Mar, 14:00
      </p>
    </section>
  );
}

function AiAssistantConfidenceNotice() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-card-background p-4">
      <p className="text-sm text-base-foreground">{AI_ANSWER_SHORT}</p>
      <div className="flex flex-col gap-2 rounded-lg bg-muted-background p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-base-foreground">
            <IconInfoCircle aria-hidden className="size-4 text-muted-foreground" /> Medium confidence
          </span>
          <span role="img" aria-label="Confidence 2 of 3" className="flex gap-1">
            <span className="h-1.5 w-5 rounded-full bg-primary-background" />
            <span className="h-1.5 w-5 rounded-full bg-primary-background" />
            <span className="h-1.5 w-5 rounded-full border border-emphasized" />
          </span>
        </div>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-medium-foreground">
          <li>The estimate assumes the rise stays linear; 48 hours is a short basis.</li>
          <li>Bearing temperature was not used: the signal has bad quality.</li>
          <li>This is not an alarm prediction. The alarm system remains the authority.</li>
        </ul>
      </div>
    </div>
  );
}

function AiAssistantErrorTurn() {
  const failed: readonly ChatMessage[] = [
    { id: 'u1', role: 'user', text: 'Compare the last three recompressor trips' },
    { id: 'a1', role: 'assistant', text: '', status: 'error', errorText: 'The historian did not answer within 30 seconds. Nothing was changed.' },
  ];
  const [messages, setMessages] = useState(failed);

  return (
    <div className="flex h-80 w-full flex-col gap-2">
      <div className="min-h-0 flex-1">
        <ChatThread
          messages={messages}
          onRetry={() =>
            setMessages([
              failed[0],
              { id: 'a2', role: 'assistant', text: 'All three trips were on high vibration. In two of them vibration rose for more than 24 hours first.', sources: AI_SOURCES.slice(0, 2) },
            ])
          }
        />
      </div>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => setMessages(failed)}>
        Reset example
      </Button>
    </div>
  );
}

function AiAssistantThinking() {
  const messages: readonly ChatMessage[] = [
    { id: 'u1', role: 'user', text: 'Is there planned work on 23-KA-9101?' },
    {
      id: 'a1',
      role: 'assistant',
      text: '',
      status: 'pending',
      tools: [AI_TOOLS_DONE[0], { id: 'orders', toolName: 'list_work_orders', title: 'Read work orders from SAP PM', status: 'running' }],
    },
  ];

  return (
    <div className="h-80 w-full">
      <ChatThread messages={messages} pendingLabel="Reading work orders…" />
    </div>
  );
}

function AiAssistantInsightCard() {
  return (
    <InsightCard
      kind="Anomaly detected"
      tone="warning"
      title="Vibration on 23-KA-9101 is rising at constant speed"
      summary="Drive-end vibration has risen for 48 hours while shaft speed and load stayed flat. The recompressor showed the same pattern before it tripped today."
      meta="Found 13:58"
      evidence={[
        { id: 'vt', label: '23-VT-92540', value: '6.8 mm/s, limit 7.1', mono: true },
        { id: 'rise', label: 'Change over 48 hours', value: '+0.9 mm/s' },
        { id: 'st', label: '23-ST-92501', value: '9,840 rpm, steady', mono: true },
      ]}
      footnote="Based on hourly averages. Not a replacement for the alarm system."
      actions={
        <>
          <Button size="sm">Open trend</Button>
          <Button variant="secondary" size="sm">
            Create work order
          </Button>
          <Button variant="ghost" size="sm">
            Dismiss
          </Button>
        </>
      }
    />
  );
}

function AiAssistantInsightSuggestion() {
  return (
    <InsightCard
      kind="Suggestion"
      title="Two alarms on the same compressor could be handled together"
      summary="Discharge temperature and drive-end vibration on 23-KA-9101 were raised within 90 minutes. One inspection could cover both."
      meta="Found 13:40"
      evidence={AI_ALARMS.slice(1, 3).map((alarm) => ({ id: alarm.id, label: alarm.sensorTag, value: `${alarm.value}, ${formatAgo(alarm.raisedAt)}`, mono: true }))}
      actions={
        <>
          <Button variant="secondary" size="sm">
            Group alarms
          </Button>
          <Button variant="ghost" size="sm">
            Not useful
          </Button>
        </>
      }
    />
  );
}

function AiAssistantToolTraceCollapsed() {
  return (
    <div className="flex w-full flex-col gap-2">
      <ToolCallList calls={AI_TOOLS_DONE} collapsible />
      <p className="text-sm text-base-foreground">{AI_ANSWER_SHORT}</p>
    </div>
  );
}

function AiAssistantToolTraceExpanded() {
  return (
    <div className="w-full">
      <ToolCallList calls={AI_TOOLS_DONE} collapsible defaultOpen />
    </div>
  );
}

function AiAssistantTaskProgress() {
  return (
    <div className="w-full rounded-xl bg-card-background p-4">
      <TaskProgressList
        label="Investigate recompressor trips"
        tasks={AI_TASKS}
        actions={
          <Button variant="secondary" size="sm">
            Stop run
          </Button>
        }
      />
    </div>
  );
}

function AiAssistantApprovalStep() {
  const [call, setCall] = useState<ToolCallData>(AI_TOOL_APPROVAL);

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-base-foreground">I can create an inspection work order for the bearing. Check the details first.</p>
      <ToolCallList
        calls={[AI_TOOLS_DONE[1], call]}
        onApprove={() => setCall({ ...AI_TOOL_APPROVAL, status: 'completed', output: { id: 'WO-104490', status: 'open' } })}
        onDeny={() => setCall({ ...AI_TOOL_APPROVAL, status: 'denied' })}
      />
      <div className="flex items-center justify-between gap-3">
        <span role="status" className="text-xs text-muted-foreground">
          {call.status === 'completed' ? 'Created WO-104490.' : call.status === 'denied' ? 'Nothing was created.' : 'Waiting for your decision. Nothing is written until you approve.'}
        </span>
        {call.status === 'awaiting-approval' ? null : (
          <Button variant="ghost" size="sm" onClick={() => setCall(AI_TOOL_APPROVAL)}>
            Reset example
          </Button>
        )}
      </div>
    </div>
  );
}

function AiAssistantDraft() {
  const [outcome, setOutcome] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-card-background p-4">
      {outcome ? (
        <div className="flex flex-col items-start gap-3">
          <p role="status" className="text-sm text-base-foreground">
            {outcome}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setOutcome(null)}>
            Reset example
          </Button>
        </div>
      ) : (
        <DraftReview
          label="Work order description"
          draft={AI_DRAFT}
          acceptLabel="Use this text"
          footnote="Drafted from 23-VT-92540 and WO-104482. Check the figures before you use it."
          onAccept={(text) => setOutcome(`Description added to the work order (${text.length} characters).`)}
          onDiscard={() => setOutcome('Draft discarded. The work order is unchanged.')}
          onRegenerate={aiNoop}
        />
      )}
    </div>
  );
}

function AiAssistantFloatingPanel() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>(AI_THREAD);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiReply(prompt, current.length)]);

  return (
    <div className="h-144 w-full">
      <AssistantPanel
        variant="floating"
        title="Plant assistant"
        context="Reading 23-KA-9101 and its alarms"
        icon={<IconSparkles />}
        actions={
          <IconAction label="Start a new conversation" onClick={() => setMessages([])}>
            <IconPlus />
          </IconAction>
        }
        footer={<AiPrompt onSend={send} />}
      >
        <ChatThread messages={messages} onRegenerate={aiNoop} onFeedback={aiNoop} emptyState={<p className="text-sm text-muted-foreground">New conversation. Ask about 23-KA-9101.</p>} />
      </AssistantPanel>
    </div>
  );
}

function AiAssistantTranscript() {
  return (
    <div className="h-144 w-full">
      <AssistantPanel variant="floating" title="Conversation from 12 March, 13:58" context="Attached to WO-104482 by Aisha Khan · read-only">
        <ChatThread messages={AI_THREAD} hideActions label="Saved conversation" />
      </AssistantPanel>
    </div>
  );
}

function AiAssistantDockedPanel() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>(AI_THREAD);
  const send = (prompt: string) => setMessages((current) => [...current, ...aiReply(prompt, current.length)]);

  return (
    <div className="flex h-160 w-full overflow-hidden rounded-xl border border-default">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <AiTrendCard />
        <Card className="w-full">
          <CardHeader>
            <CardHeaderCenter>
              <CardTitle>Alarms on this compressor</CardTitle>
            </CardHeaderCenter>
          </CardHeader>
          <CardContent>
            <ul className="flex w-full flex-col gap-3">
              {AI_ALARMS.slice(1, 3).map((alarm) => (
                <li key={alarm.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base-foreground">{alarm.message}</span>
                    <span className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</span>
                  </span>
                  <StatusIndicator size="sm" {...severityStatus(alarm.severity)} detail={formatAgo(alarm.raisedAt)} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="w-96 shrink-0">
        <AssistantPanel
          title="Plant assistant"
          context="Reading 23-KA-9101 and its alarms"
          icon={<IconSparkles />}
          actions={
            <>
              <IconAction label="Start a new conversation" onClick={() => setMessages([])}>
                <IconPlus />
              </IconAction>
              <IconAction label="Close assistant">
                <IconX />
              </IconAction>
            </>
          }
          footer={<AiPrompt onSend={send} />}
        >
          <ChatThread
            messages={messages}
            onRegenerate={aiNoop}
            onFeedback={aiNoop}
            emptyState={<PromptSuggestions layout="stack" suggestions={AI_STARTERS} onSelect={send} />}
          />
        </AssistantPanel>
      </div>
    </div>
  );
}

function AiAssistantInvestigation() {
  const [call, setCall] = useState<ToolCallData>(AI_TOOL_APPROVAL);
  const tasks: readonly AgentTask[] = [
    { id: 'read', label: 'Read vibration and speed, last 48 hours', status: 'done', detail: 'Rise of 0.9 mm/s at constant speed' },
    { id: 'compare', label: 'Compare with the recompressor before its trip', status: 'done', detail: 'Same pattern' },
    {
      id: 'order',
      label: 'Create inspection work order',
      status: call.status === 'completed' ? 'done' : call.status === 'denied' ? 'failed' : 'waiting',
      detail: call.status === 'completed' ? 'WO-104490 created' : call.status === 'denied' ? 'Declined by you' : 'Writes to SAP PM',
    },
  ];

  return (
    <div className="grid w-full grid-cols-5 gap-4">
      <div className="col-span-3 flex min-w-0 flex-col gap-4">
        <AiTrendCard />
        <InsightCard
          kind="Anomaly detected"
          tone="warning"
          title="Vibration is rising at constant speed"
          summary="The same pattern preceded the recompressor trip at 13:46. At the current rate the high limit is reached in about 16 hours."
          meta={<Badge variant="secondary">Medium confidence</Badge>}
          evidence={[
            { id: 'vt', label: '23-VT-92540', value: '6.8 mm/s, limit 7.1', mono: true },
            { id: 'st', label: '23-ST-92501', value: '9,840 rpm, steady', mono: true },
          ]}
        />
      </div>
      <div className="col-span-2 flex min-w-0 flex-col gap-4 rounded-xl bg-card-background p-4">
        <TaskProgressList label="Follow up the anomaly" tasks={tasks} />
        <ToolCallList
          calls={[call]}
          onApprove={() => setCall({ ...AI_TOOL_APPROVAL, status: 'completed', output: { id: 'WO-104490', status: 'open' } })}
          onDeny={() => setCall({ ...AI_TOOL_APPROVAL, status: 'denied' })}
        />
        {call.status === 'awaiting-approval' ? (
          <p className="text-xs text-muted-foreground">The assistant stops here until a person approves the write.</p>
        ) : (
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setCall(AI_TOOL_APPROVAL)}>
            Reset example
          </Button>
        )}
      </div>
    </div>
  );
}

export default definePage({
  id: 'ai-assistants',
  title: 'AI assistants',
  summary:
    'Patterns for putting an assistant into a data product: where people ask, how answers show their sources and limits, how long-running work reports progress, and where a person must approve.',
  guidance: {
    use: [
      'Say what the assistant can read, and that it cannot change anything unless it asks.',
      'Sources on every answer that states a fact about the plant.',
      'A visible, written approval step before anything is written to another system.',
      'Generated text marked as generated, with a way to regenerate, edit or discard it.',
    ],
    avoid: [
      'Answers without evidence, or confidence shown as a bare percentage.',
      'Sparkle icons and gradients on things that are not generated.',
      'Auto-applying a draft or a filter the person has not seen.',
      'Hiding tool calls that read or write operational systems.',
    ],
  },
  source,
  sections: [
    {
      id: 'asking',
      title: 'Places to ask',
      description: 'Entry points, from an empty panel to a prompt on a single chart.',
      specimens: [
        {
          id: 'AiAssistantEmptyState',
          title: 'Empty assistant',
          note: 'First open: says what the assistant reads and offers three starting questions. Try one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/AssistantPanel.tsx', 'ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx'],
          Component: AiAssistantEmptyState,
        },
        {
          id: 'AiAssistantSuggestedPrompts',
          title: 'Suggested prompts grid',
          note: 'A home page with room for four task-shaped starting points; picking one fills the prompt.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AiAssistantSuggestedPrompts,
        },
        {
          id: 'AiAssistantAskBar',
          title: 'Command-style ask bar',
          note: 'One line at the top of a page for a quick question, with the shortcut shown while empty.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/PromptSuggestions.tsx'],
          Component: AiAssistantAskBar,
        },
        {
          id: 'AiAssistantInlineAsk',
          title: 'Ask about this chart',
          note: 'A prompt scoped to one card, when the question is about what is right in front of the reader.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: AiAssistantInlineAsk,
        },
        {
          id: 'AiAssistantScopedPrompt',
          title: 'Prompt with context chips',
          note: 'Shows exactly which assets, tags and period are sent along, and lets the person remove any.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/IconAction.tsx'],
          Component: AiAssistantScopedPrompt,
        },
        {
          id: 'AiAssistantFilterBar',
          title: 'Natural-language filter bar',
          note: 'A typed sentence becomes filter chips the person can check and remove before trusting the list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/parseFilterQuery.ts', 'patterns/data-entry/FilterChip.tsx'],
          Component: AiAssistantFilterBar,
        },
      ],
    },
    {
      id: 'answers',
      title: 'Answers and findings',
      description: 'How a result shows what it rests on, how sure it is, and what to do with it.',
      specimens: [
        {
          id: 'AiAssistantAnswerCard',
          title: 'Answer with sources and feedback',
          note: 'A single answer outside a thread: the question, the answer, its sources and a rating.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/SourceList.tsx', 'ai/ResponseActions.tsx'],
          Component: AiAssistantAnswerCard,
        },
        {
          id: 'AiAssistantSummaryBlock',
          title: 'Generated summary with regenerate',
          note: 'A summary placed in a page; marked as generated, versioned, and tied to its inputs.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AiAssistantSummaryBlock,
        },
        {
          id: 'AiAssistantInsightCard',
          title: 'Insight card, anomaly',
          note: 'A finding the model raises by itself: the claim, the evidence and the next actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/InsightCard.tsx'],
          Component: AiAssistantInsightCard,
        },
        {
          id: 'AiAssistantInsightSuggestion',
          title: 'Insight card, suggestion',
          note: 'A neutral suggestion with no status colour, easy to dismiss as not useful.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/InsightCard.tsx'],
          Component: AiAssistantInsightSuggestion,
        },
        {
          id: 'AiAssistantConfidenceNotice',
          title: 'Confidence and limitations',
          note: 'An estimate: confidence in words and steps, with what it assumes and what it left out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AiAssistantConfidenceNotice,
        },
        {
          id: 'AiAssistantErrorTurn',
          title: 'Error and retry turn',
          note: 'A failed turn says what failed and that nothing changed, with retry in place. Try it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: AiAssistantErrorTurn,
        },
      ],
    },
    {
      id: 'working',
      title: 'Work in progress',
      description: 'What the assistant is doing, what it did, and where it waits for a person.',
      specimens: [
        {
          id: 'AiAssistantThinking',
          title: 'Working turn',
          note: 'Before the answer arrives: the step that is running, named in plain words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ChatThread.tsx'],
          Component: AiAssistantThinking,
        },
        {
          id: 'AiAssistantTaskProgress',
          title: 'Agent task progress',
          note: 'A multi-step run that takes minutes: every step with its state, and a way to stop.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/TaskProgressList.tsx'],
          Component: AiAssistantTaskProgress,
        },
        {
          id: 'AiAssistantToolTraceCollapsed',
          title: 'Tool trace, collapsed',
          note: 'The default after a run: one line that says tools were used, above the answer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx'],
          Component: AiAssistantToolTraceCollapsed,
        },
        {
          id: 'AiAssistantToolTraceExpanded',
          title: 'Tool trace, expanded',
          note: 'For people who need to check what was read; each call opens to its parameters and result.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx'],
          Component: AiAssistantToolTraceExpanded,
        },
        {
          id: 'AiAssistantApprovalStep',
          title: 'Approval step',
          note: 'A write to another system stops and shows exactly what will be sent. Approve or deny to see both outcomes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/ToolCallList.tsx'],
          Component: AiAssistantApprovalStep,
        },
        {
          id: 'AiAssistantDraft',
          title: 'Draft with accept, edit and discard',
          note: 'Generated text that goes into a record only after a person accepts it, edited or not.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/DraftReview.tsx'],
          Component: AiAssistantDraft,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels and full blocks',
      description: 'The assistant as a floating card, a saved transcript, docked beside data, and inside an investigation.',
      specimens: [
        {
          id: 'AiAssistantFloatingPanel',
          title: 'Floating assistant panel',
          note: 'An assistant that opens over any page; the header says what it is reading.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/AssistantPanel.tsx', 'ai/ChatThread.tsx', 'patterns/collections/IconAction.tsx'],
          Component: AiAssistantFloatingPanel,
        },
        {
          id: 'AiAssistantTranscript',
          title: 'Read-only transcript',
          note: 'A saved conversation attached to a record: no prompt, no actions, sources still open.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/AssistantPanel.tsx', 'ai/ChatThread.tsx'],
          Component: AiAssistantTranscript,
        },
        {
          id: 'AiAssistantDockedPanel',
          title: 'Docked beside a data view',
          note: 'The assistant shares the screen with the trend it is talking about, so answers can be checked at a glance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/AssistantPanel.tsx', 'ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AiAssistantDockedPanel,
        },
        {
          id: 'AiAssistantInvestigation',
          title: 'Investigation with approval',
          note: 'Finding, evidence, agent progress and the approval gate on one screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/InsightCard.tsx', 'patterns/product/TaskProgressList.tsx', 'ai/ToolCallList.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AiAssistantInvestigation,
        },
      ],
    },
  ],
});
