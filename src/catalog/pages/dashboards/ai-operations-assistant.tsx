import { chartSeriesColor } from '@cognite/aura/chart';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconBox, IconChartLine, IconClock, IconPlayerStop, IconSend } from '@cognite/aura/icons';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ChatThread } from '../../../library/ai/ChatThread';
import type { ChatMessage } from '../../../library/ai/ChatThread';
import { PromptSuggestions } from '../../../library/ai/PromptSuggestions';
import type { SourceItem } from '../../../library/ai/SourceList';
import type { ToolCallData } from '../../../library/ai/ToolCall';
import { useStreamedText } from '../../../library/ai/useStreamedText';
import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { MINUTE, REFERENCE_NOW, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './ai-operations-assistant.tsx?raw';

type AiOpsTopicId = 'trip' | 'compare' | 'watch';

type AiOpsTopic = {
  id: AiOpsTopicId;
  /** The suggested prompt, also the user's message. */
  question: string;
  /** Short name on the canvas switch. */
  tab: string;
  canvasTitle: string;
  canvasDescription: string;
  canvasSummary: string;
  context: readonly { id: string; icon: 'asset' | 'time' | 'signal'; text: string }[];
  answer: string;
  reasoning: readonly string[];
  seconds: number;
  tools: readonly ToolCallData[];
  sources: readonly SourceItem[];
};

type AiOpsTurn = { id: string; topicId: AiOpsTopicId | null; prompt: string };

const AI_OPS_TRIP_AT = REFERENCE_NOW - 15 * MINUTE;

const AI_OPS_ALARM_AT = REFERENCE_NOW - 50 * MINUTE;

const AI_OPS_FALLBACK =
  'This workspace answers from three prepared investigations. Pick one of the suggested questions and the canvas shows the evidence behind the answer.';

const AI_OPS_TOPICS: readonly AiOpsTopic[] = [
  {
    id: 'trip',
    question: 'Why did the recompressor trip?',
    tab: 'Trip',
    canvasTitle: 'Recompressor trip',
    canvasDescription: 'Drive-end vibration, 23-VT-92740, last 3 hours',
    canvasSummary:
      'Vibration left its normal 6.2 mm/s at about 13:00, passed the 7.1 high limit at 13:10 and reached the 11.0 trip limit at 13:45.',
    context: [
      { id: 'asset', icon: 'asset', text: '23-KA-9103 Recompressor' },
      { id: 'time', icon: 'time', text: '12 Mar, 11:00 to 14:00' },
      { id: 'signal', icon: 'signal', text: '1 time series, 2 events' },
    ],
    answer:
      'The recompressor **tripped on high drive-end vibration at 13:45**. Vibration on `23-VT-92740` rose steadily for 45 minutes, from 6.2 to **11.6 mm/s**, and crossed the 11.0 mm/s trip limit. The high alarm at 13:10 was acknowledged but load was not reduced. Bearing temperature rose in step with it, which points at the drive-end bearing rather than the sensor. `WO-104482` is open to inspect that bearing.',
    reasoning: [
      'The trip event names 23-VT-92740, so start with that signal around 13:45.',
      'The rise is gradual, not a step, so a failed sensor is unlikely.',
      'Check whether anything else moved with it: bearing temperature did, suction pressure did not.',
      'Look for an open work order on the same equipment.',
    ],
    seconds: 9,
    tools: [
      {
        id: 'trip-1',
        toolName: 'query_time_series',
        title: 'Read 23-VT-92740, last 3 hours',
        status: 'completed',
        input: { externalId: '23-VT-92740', start: '3h-ago', granularity: '5m' },
        output: { points: 37, max: 11.6, unit: 'mm/s' },
      },
      {
        id: 'trip-2',
        toolName: 'list_events',
        title: 'List alarms on 23-KA-9103',
        status: 'completed',
        input: { asset: '23-KA-9103', type: 'alarm', start: '3h-ago' },
        output: { events: ['alm-4810 high vibration 13:10', 'alm-4812 trip 13:45'] },
      },
    ],
    sources: [
      { id: 'trip-s1', title: '23-VT-92740 drive-end vibration', href: 'https://fusion.nordkapp.test/timeseries/23-VT-92740', kind: 'timeseries' },
      { id: 'trip-s2', title: 'alm-4812 recompressor tripped', href: 'https://fusion.nordkapp.test/events/alm-4812', kind: 'event' },
      { id: 'trip-s3', title: 'WO-104482 inspect drive-end bearing', href: 'https://fusion.nordkapp.test/workorders/WO-104482', kind: 'file' },
    ],
  },
  {
    id: 'compare',
    question: 'Compare discharge temperature across compressors',
    tab: 'Compare',
    canvasTitle: 'Discharge temperature',
    canvasDescription: 'Three compressors, last 24 hours, against the 145 °C high limit',
    canvasSummary:
      'The 1st stage runs 3 to 5 °C under its limit and touched it at 13:20; the 2nd stage has 13 °C of margin; the recompressor has been cooling since the trip.',
    context: [
      { id: 'asset', icon: 'asset', text: '3 compressors in NK-23' },
      { id: 'time', icon: 'time', text: 'Last 24 hours' },
      { id: 'signal', icon: 'signal', text: '3 time series' },
    ],
    answer:
      'The **1st stage compressor runs hottest**: 141.2 °C now, 3.8 °C under its 145 °C high limit, and it peaked at 146.3 °C at 13:22. The **2nd stage** is steady near 132 °C with 13 °C of margin. The **recompressor** tracked the 2nd stage until it tripped at 13:45 and is now cooling. Since the trip the 1st stage carries more load, so its margin is the one to protect.',
    reasoning: [
      'Find the discharge temperature tag of each compressor in gas compression.',
      'Read all three over the same 24 hours at the same granularity.',
      'Compare each with its own high limit rather than with each other only.',
      'Explain the recompressor drop with the trip, not as an improvement.',
    ],
    seconds: 7,
    tools: [
      {
        id: 'compare-1',
        toolName: 'search_assets',
        title: 'Find compressors in NK-23',
        status: 'completed',
        input: { parent: 'NK-23', type: 'compressor' },
        output: { assets: ['23-KA-9101', '23-KA-9102', '23-KA-9103'] },
      },
      {
        id: 'compare-2',
        toolName: 'query_time_series',
        title: 'Read 3 discharge temperatures, 24 hours',
        status: 'completed',
        input: { externalIds: ['23-TT-92532', '23-TT-92632', '23-TT-92732'], start: '24h-ago', granularity: '1h' },
        output: { series: 3, points: 72 },
      },
    ],
    sources: [
      { id: 'compare-s1', title: '23-TT-92532 discharge temperature', href: 'https://fusion.nordkapp.test/timeseries/23-TT-92532', kind: 'timeseries' },
      { id: 'compare-s2', title: '23-TT-92632 discharge temperature', href: 'https://fusion.nordkapp.test/timeseries/23-TT-92632', kind: 'timeseries' },
      { id: 'compare-s3', title: '23-TT-92732 discharge temperature', href: 'https://fusion.nordkapp.test/timeseries/23-TT-92732', kind: 'timeseries' },
      { id: 'compare-s4', title: 'NK-23 gas compression', href: 'https://fusion.nordkapp.test/assets/NK-23', kind: 'asset' },
    ],
  },
  {
    id: 'watch',
    question: 'What should the next shift watch?',
    tab: 'Watch list',
    canvasTitle: 'Watch list for the next shift',
    canvasDescription: 'Gas compression, 14:00 to 22:00, most urgent first',
    canvasSummary:
      'Five items. Two are close to a limit, one signal is uncertain, and the recompressor must stay isolated until its work order closes.',
    context: [
      { id: 'asset', icon: 'asset', text: 'NK-23 Gas compression' },
      { id: 'time', icon: 'time', text: 'Next shift, 14:00 to 22:00' },
      { id: 'signal', icon: 'signal', text: '4 alarms, 2 work orders' },
    ],
    answer:
      'Five things for the next shift, most urgent first. **Keep the recompressor isolated** until `WO-104482` closes. **Watch 1st stage discharge temperature**: it is 3.8 °C under its limit and carries extra load. **Drive-end vibration on the 1st stage** is 0.3 mm/s under its limit. The **cooler outlet temperature** signal is uncertain, so confirm it locally. **Export is planned down** to 4.38 MSm³/d while the recompressor is out. Tick each item on the canvas as the incoming shift confirms it.',
    reasoning: [
      'Start from what is abnormal now: open alarms and tripped equipment in the area.',
      'Rank by distance to a limit and by what the trip changed.',
      'Add signals that cannot be trusted, since they hide the next problem.',
      'Keep the list to what one shift can act on.',
    ],
    seconds: 11,
    tools: [
      {
        id: 'watch-1',
        toolName: 'list_events',
        title: 'List open alarms in NK-23',
        status: 'completed',
        input: { asset: 'NK-23', state: ['active', 'acknowledged'] },
        output: { alarms: 4 },
      },
      {
        id: 'watch-2',
        toolName: 'list_work_orders',
        title: 'List open work orders in NK-23',
        status: 'completed',
        input: { asset: 'NK-23', status: ['in-progress', 'waiting'] },
        output: { workOrders: ['WO-104482', 'WO-104471'] },
      },
    ],
    sources: [
      { id: 'watch-s1', title: 'Open alarms, gas compression', href: 'https://fusion.nordkapp.test/alarms?area=NK-23', kind: 'event' },
      { id: 'watch-s2', title: 'WO-104482 inspect drive-end bearing', href: 'https://fusion.nordkapp.test/workorders/WO-104482', kind: 'file' },
      { id: 'watch-s3', title: '23-TT-91141 cooler outlet temperature', href: 'https://fusion.nordkapp.test/timeseries/23-TT-91141', kind: 'timeseries' },
    ],
  },
];

/** Vibration that climbs for 45 minutes, trips, then falls away as the machine runs down. */
const AI_OPS_VIBRATION = makeSeries({ seed: 74, points: 37, base: 6.2, noise: 0.12, stepMs: 5 * MINUTE, decimals: 1 }).map(
  (point, index) => {
    if (index <= 24) return point;
    if (index <= 33) return { t: point.t, v: Math.round((point.v + ((index - 24) / 9) * 5.4) * 10) / 10 };
    return { t: point.t, v: [3.1, 0.8, 0.4][index - 34] ?? 0.4 };
  }
);

const AI_OPS_TEMP_FIRST = makeSeries({ seed: 13, points: 25, base: 141, amplitude: 2.2, noise: 0.8, cycles: 1.5, max: 146.3 });

const AI_OPS_TEMP_SECOND = makeSeries({ seed: 33, points: 25, base: 132, amplitude: 1.4, noise: 0.6, cycles: 1.2 });

const AI_OPS_TEMP_RECOMPRESSOR = makeSeries({ seed: 53, points: 25, base: 130, amplitude: 1.6, noise: 0.7, cycles: 1 }).map((point, index) =>
  index === 24 ? { t: point.t, v: 96.4 } : point
);

const AI_OPS_SEQUENCE = [
  { time: '13:00', text: 'Vibration leaves its normal band of 6.0 to 6.4 mm/s' },
  { time: '13:10', text: 'High alarm at 7.1 mm/s, acknowledged, load unchanged' },
  { time: '13:32', text: 'Bearing temperature up 9 °C in 30 minutes' },
  { time: '13:45', text: 'Trip at 11.6 mm/s against the 11.0 mm/s limit' },
] as const;

const AI_OPS_COMPARISON = [
  { tag: '23-KA-9101', name: '1st stage compressor', now: '141.2', peak: '146.3', margin: '3.8', note: 'Closest to its limit' },
  { tag: '23-KA-9102', name: '2nd stage compressor', now: '132.0', peak: '134.1', margin: '13.0', note: 'Steady' },
  { tag: '23-KA-9103', name: 'Recompressor', now: '96.4', peak: '132.4', margin: '48.6', note: 'Cooling after the trip' },
] as const;

const AI_OPS_WATCH = [
  { id: 'isolate', label: 'Keep the recompressor isolated', detail: '23-KA-9103 · until WO-104482 closes' },
  { id: 'temp', label: 'Watch 1st stage discharge temperature', detail: '23-TT-92532 · call the engineer above 145 °C' },
  { id: 'vibration', label: 'Watch 1st stage drive-end vibration', detail: '23-VT-92540 · 0.3 mm/s under the high limit' },
  { id: 'cooler', label: 'Confirm cooler outlet temperature locally', detail: '23-TT-91141 · signal quality uncertain' },
  { id: 'export', label: 'Hold export at the reduced plan', detail: '4.38 MSm³/d while the recompressor is out' },
] as const;

const AI_OPS_CONTEXT_ICON = { asset: IconBox, time: IconClock, signal: IconChartLine } as const;

function aiOpsTopic(id: AiOpsTopicId): AiOpsTopic {
  return AI_OPS_TOPICS.find((topic) => topic.id === id) ?? AI_OPS_TOPICS[0];
}

function isAiOpsTopicId(value: unknown): value is AiOpsTopicId {
  return value === 'trip' || value === 'compare' || value === 'watch';
}

function aiOpsAnswer(turn: AiOpsTurn): string {
  return turn.topicId ? aiOpsTopic(turn.topicId).answer : AI_OPS_FALLBACK;
}

/** The thread as ChatThread wants it. Only the newest turn can still be streaming. */
function aiOpsMessages(turns: readonly AiOpsTurn[], streamedText: string, streaming: boolean): ChatMessage[] {
  return turns.flatMap((turn, index): ChatMessage[] => {
    const live = streaming && index === turns.length - 1;
    const topic = turn.topicId ? aiOpsTopic(turn.topicId) : undefined;
    return [
      { id: `${turn.id}-user`, role: 'user', text: turn.prompt },
      {
        id: `${turn.id}-assistant`,
        role: 'assistant',
        text: live ? streamedText : aiOpsAnswer(turn),
        status: live ? 'streaming' : 'done',
        reasoning: topic ? { steps: topic.reasoning, durationSeconds: topic.seconds } : undefined,
        tools: topic?.tools,
        sources: topic?.sources,
      },
    ];
  });
}

function AiOpsContextChips({ topicId }: { topicId: AiOpsTopicId }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Looking at</span>
      <ul aria-label="What the assistant is looking at" className="flex flex-wrap items-center gap-2">
        {aiOpsTopic(topicId).context.map((chip) => {
          const Icon = AI_OPS_CONTEXT_ICON[chip.icon];
          return (
            <li key={chip.id} className="flex">
              <Badge variant="secondary">
                <Icon aria-hidden="true" /> {chip.text}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type AiOpsComposerProps = {
  streaming: boolean;
  onAsk: (topicId: AiOpsTopicId) => void;
  onSend: (text: string) => void;
  onStop: () => void;
};

function AiOpsComposer({ streaming, onAsk, onSend, onStop }: AiOpsComposerProps) {
  const [draft, setDraft] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (text === '' || streaming) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <PromptSuggestions
        label="Suggested questions"
        layout="wrap"
        disabled={streaming}
        suggestions={AI_OPS_TOPICS.map((topic) => ({ id: topic.id, label: topic.question }))}
        onSelect={(_prompt, suggestion) => {
          if (isAiOpsTopicId(suggestion.id)) onAsk(suggestion.id);
        }}
      />
      <form className="flex w-full items-center gap-2" onSubmit={submit}>
        <Input
          className="min-w-0 flex-1"
          aria-label="Ask about the plant"
          placeholder="Ask about the plant"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        {streaming ? (
          <Button type="button" variant="outline" onClick={onStop}>
            <IconPlayerStop /> Stop
          </Button>
        ) : (
          <Button type="submit">
            <IconSend /> Send
          </Button>
        )}
      </form>
    </div>
  );
}

function AiOpsTripEvidence() {
  return (
    <div className="flex w-full flex-col gap-4">
      <TrendChart
        label="Drive-end vibration of the recompressor over the last 3 hours: steady near 6.2 millimetres per second, then rising from 13:00 to 11.6 at the trip at 13:45"
        series={[{ key: 'vibration', label: 'Drive-end vibration', points: AI_OPS_VIBRATION, color: chartSeriesColor(1) }]}
        limits={[
          { value: 7.1, label: 'High 7.1', tone: 'warning', align: 'left' },
          { value: 11, label: 'Trip 11.0', tone: 'critical', align: 'left' },
        ]}
        events={[
          { t: AI_OPS_ALARM_AT, label: 'High alarm', tone: 'warning' },
          { t: AI_OPS_TRIP_AT, label: 'Trip', tone: 'critical' },
        ]}
        yDomain={[0, 14]}
        yTicks={[0, 2, 4, 6, 8, 10, 12, 14]}
        unit="mm/s"
        decimals={1}
        maxTicks={6}
        heightClassName="h-80"
      />
      <ol aria-label="Sequence of events" className="grid w-full grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
        {AI_OPS_SEQUENCE.map((step) => (
          <li key={step.time} className="flex items-baseline gap-3 text-sm">
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{step.time}</span>
            <span className="min-w-0 text-base-foreground">{step.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AiOpsCompareEvidence() {
  return (
    <div className="flex w-full flex-col gap-4">
      <TrendChart
        label="Discharge temperature of three compressors over 24 hours: the 1st stage runs near 141 degrees and touches its 145 degree limit, the 2nd stage is steady near 132, the recompressor drops after its trip"
        series={[
          { key: 'first', label: '1st stage, 23-KA-9101', points: AI_OPS_TEMP_FIRST, color: chartSeriesColor(1) },
          { key: 'second', label: '2nd stage, 23-KA-9102', points: AI_OPS_TEMP_SECOND, color: chartSeriesColor(2) },
          { key: 'recompressor', label: 'Recompressor, 23-KA-9103', points: AI_OPS_TEMP_RECOMPRESSOR, color: chartSeriesColor(3) },
        ]}
        limits={[{ value: 145, label: 'High 145', tone: 'warning', align: 'left' }]}
        events={[{ t: AI_OPS_TRIP_AT, label: 'Trip', tone: 'critical' }]}
        yDomain={[90, 150]}
        yTicks={[90, 100, 110, 120, 130, 140, 150]}
        unit="°C"
        decimals={1}
        maxTicks={6}
        legend
        heightClassName="h-72"
      />
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Compressor
            </th>
            <th scope="col" className="w-[14%] pb-2 pr-3 text-right font-medium">
              Now
            </th>
            <th scope="col" className="w-[14%] pb-2 pr-3 text-right font-medium">
              Peak
            </th>
            <th scope="col" className="w-[16%] pb-2 pr-3 text-right font-medium">
              Margin
            </th>
            <th scope="col" className="w-[26%] pb-2 font-medium">
              Reading
            </th>
          </tr>
        </thead>
        <tbody>
          {AI_OPS_COMPARISON.map((row) => (
            <tr key={row.tag} className="border-t border-default align-top">
              <th scope="row" className="py-2 pr-3 font-normal">
                <p className="text-base-foreground">{row.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.tag}</p>
              </th>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{row.now}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{row.peak}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{row.margin}</td>
              <td className="py-2 text-medium-foreground">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type AiOpsWatchProps = { confirmed: readonly string[]; onToggle: (id: string, checked: boolean) => void };

function AiOpsWatchEvidence({ confirmed, onToggle }: AiOpsWatchProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <ul aria-label="Watch list" className="flex w-full flex-col gap-1">
        {AI_OPS_WATCH.map((item) => (
          <li key={item.id}>
            <CheckboxItem>
              <CheckboxItemControl
                checked={confirmed.includes(item.id)}
                onCheckedChange={(checked) => onToggle(item.id, checked)}
              />
              <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
              <CheckboxItemDescription>{item.detail}</CheckboxItemDescription>
            </CheckboxItem>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-sm tabular-nums text-medium-foreground">
        {confirmed.length} of {AI_OPS_WATCH.length} confirmed by the incoming shift
      </p>
      <div className="grid w-full grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
        <RangeIndicator label="Discharge temperature" value={141.2} min={80} max={160} limits={{ low: 90, high: 145 }} unit="°C" decimals={1} />
        <RangeIndicator label="Drive-end vibration" value={6.8} min={0} max={12} limits={{ low: 0, high: 7.1 }} unit="mm/s" decimals={1} />
        <RangeIndicator label="Cooler outlet" value={38.9} min={10} max={50} limits={{ low: 20, high: 40 }} unit="°C" decimals={1} />
      </div>
    </div>
  );
}

type AiOpsCanvasProps = AiOpsWatchProps & { view: AiOpsTopicId; onViewChange: (view: AiOpsTopicId) => void };

/** The dominant element: the evidence behind the latest answer, one view per investigation. */
function AiOpsCanvasPanel({ view, onViewChange, confirmed, onToggle }: AiOpsCanvasProps) {
  const topic = aiOpsTopic(view);
  return (
    <DashboardPanel
      title={topic.canvasTitle}
      description={topic.canvasDescription}
      footnote={topic.canvasSummary}
      actions={
        <SegmentedControl
          value={view}
          onValueChange={(value) => {
            if (isAiOpsTopicId(value)) onViewChange(value);
          }}
        >
          <SegmentedControlList size="small" aria-label="Evidence view">
            {AI_OPS_TOPICS.map((entry) => (
              <SegmentedControlButton key={entry.id} value={entry.id}>
                {entry.tab}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
      }
    >
      {view === 'trip' ? <AiOpsTripEvidence /> : null}
      {view === 'compare' ? <AiOpsCompareEvidence /> : null}
      {view === 'watch' ? <AiOpsWatchEvidence confirmed={confirmed} onToggle={onToggle} /> : null}
    </DashboardPanel>
  );
}

type AiOpsThreadPanelProps = AiOpsComposerProps & { view: AiOpsTopicId; messages: readonly ChatMessage[] };

function AiOpsThreadPanel({ view, messages, streaming, onAsk, onSend, onStop }: AiOpsThreadPanelProps) {
  return (
    <DashboardPanel title="Assistant" description="Answers from Nordkapp time series, alarms and work orders">
      <AiOpsContextChips topicId={view} />
      <div className="h-80 w-full">
        <ChatThread messages={messages} label="Conversation with the operations assistant" pendingLabel="Reading plant data" />
      </div>
      <AiOpsComposer streaming={streaming} onAsk={onAsk} onSend={onSend} onStop={onStop} />
    </DashboardPanel>
  );
}

function useAiOpsWorkspace(initialTopic: AiOpsTopicId) {
  const [turns, setTurns] = useState<readonly AiOpsTurn[]>([
    { id: 'turn-1', topicId: initialTopic, prompt: aiOpsTopic(initialTopic).question },
  ]);
  const [view, setView] = useState<AiOpsTopicId>(initialTopic);
  const [confirmed, setConfirmed] = useState<readonly string[]>(['isolate']);
  const latest = aiOpsAnswer(turns[turns.length - 1]);
  // The answer is revealed chunk by chunk; the timer stops at the last character.
  const stream = useStreamedText(latest, { chunkSize: 10, intervalMs: 30, initialLength: latest.length });
  const streaming = stream.status === 'streaming';

  const append = (topicId: AiOpsTopicId | null, prompt: string) => {
    setTurns((current) => [...current, { id: `turn-${current.length + 1}`, topicId, prompt }]);
    stream.start();
  };

  return {
    view,
    setView,
    streaming,
    confirmed,
    messages: aiOpsMessages(turns, stream.text, streaming),
    ask: (topicId: AiOpsTopicId) => {
      append(topicId, aiOpsTopic(topicId).question);
      setView(topicId);
    },
    send: (text: string) => append(null, text),
    stop: stream.finish,
    toggle: (id: string, checked: boolean) =>
      setConfirmed((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id))),
  };
}

/**
 * Archetype: conversation-first — a chat column beside a canvas that the conversation drives.
 * Dominant element: the evidence canvas on the right, about 60% of the width.
 * Interaction: choosing a suggested question streams a prepared answer with its reasoning, tool
 * steps and sources, and swaps the canvas and the context chips to the matching evidence; the
 * canvas switch browses the three views without asking, and the watch list can be ticked off.
 */
function AiOpsDashboard() {
  const workspace = useAiOpsWorkspace('trip');

  return (
    <DashboardFrame
      title="AI operations assistant"
      subtitle="Nordkapp gas processing plant · data as of 14:00 UTC"
      status={<StatusIndicator tone="info" shape="ring" label="Prepared demo answers" />}
      actions={
        <Button variant="outline" size="sm">
          Start new conversation
        </Button>
      }
    >
      <DashboardGrid>
        <DashboardCell span={5}>
          <AiOpsThreadPanel
            view={workspace.view}
            messages={workspace.messages}
            streaming={workspace.streaming}
            onAsk={workspace.ask}
            onSend={workspace.send}
            onStop={workspace.stop}
          />
        </DashboardCell>
        <DashboardCell span={7}>
          <AiOpsCanvasPanel
            view={workspace.view}
            onViewChange={workspace.setView}
            confirmed={workspace.confirmed}
            onToggle={workspace.toggle}
          />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function AiOpsDashSignature() {
  return (
    <ThemeScope preset="dusk-night" className="w-full">
      <AiOpsDashboard />
    </ThemeScope>
  );
}

function AiOpsDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <AiOpsDashboard />
    </ThemeScope>
  );
}

function AiOpsDashNeonDusk() {
  return (
    <ThemeScope preset="neon-dusk" className="w-full">
      <AiOpsDashboard />
    </ThemeScope>
  );
}

function AiOpsDashHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <AiOpsDashboard />
    </ThemeScope>
  );
}

function AiOpsDashThread() {
  const workspace = useAiOpsWorkspace('compare');
  return (
    <AiOpsThreadPanel
      view={workspace.view}
      messages={workspace.messages}
      streaming={workspace.streaming}
      onAsk={workspace.ask}
      onSend={workspace.send}
      onStop={workspace.stop}
    />
  );
}

function AiOpsDashTripCanvas() {
  return (
    <DashboardPanel title="Recompressor trip" description="Trend with limits and event markers, then the sequence in words">
      <AiOpsTripEvidence />
    </DashboardPanel>
  );
}

function AiOpsDashCompareCanvas() {
  return (
    <DashboardPanel title="Discharge temperature" description="One chart for the shape, one table for the figures">
      <AiOpsCompareEvidence />
    </DashboardPanel>
  );
}

function AiOpsDashWatchCanvas() {
  const [confirmed, setConfirmed] = useState<readonly string[]>(['isolate', 'export']);
  return (
    <DashboardPanel title="Watch list for the next shift" description="A list people tick off, with the three readings it refers to">
      <AiOpsWatchEvidence
        confirmed={confirmed}
        onToggle={(id, checked) =>
          setConfirmed((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)))
        }
      />
    </DashboardPanel>
  );
}

function AiOpsDashContext() {
  return (
    <div className="flex w-full flex-col gap-4">
      <AiOpsContextChips topicId="trip" />
      <AiOpsContextChips topicId="watch" />
    </div>
  );
}

function AiOpsDashComposer() {
  const [last, setLast] = useState('Nothing asked yet');
  return (
    <div className="flex w-full flex-col gap-3">
      <AiOpsComposer
        streaming={false}
        onAsk={(topicId) => setLast(aiOpsTopic(topicId).question)}
        onSend={setLast}
        onStop={() => setLast('Stopped')}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Last question: {last}
      </p>
    </div>
  );
}

export default definePage({
  id: 'ai-operations-assistant',
  title: 'AI operations assistant',
  summary:
    'An assistant that shows its work: the conversation sits beside a canvas, and every answer puts its evidence there as a trend with events, a comparison or a list the shift can tick off.',
  guidance: {
    use: [
      'When answers about the plant must be checked against the data behind them.',
      'Give the evidence more room than the chat; the chart is what people trust.',
      'Show what the assistant is looking at: asset, time range and signals.',
      'Offer the questions people really ask as one-tap suggestions.',
    ],
    avoid: [
      'An answer with no reasoning, tool steps or sources to open.',
      'A canvas that keeps showing the evidence of the previous question.',
      'Letting the assistant act on equipment; it explains and lists, people decide.',
      'Streaming that cannot be stopped.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Dusk night theme. Choose a suggested question and watch the canvas follow the answer.',
      specimens: [
        {
          id: 'AiOpsDashSignature',
          title: 'AI operations assistant',
          note: 'Pick it for an assistant workspace where every answer has to be backed by plant data.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'ai/ChatThread.tsx',
            'ai/PromptSuggestions.tsx',
            'ai/useStreamedText.ts',
            'industrial/charts/TrendChart.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: AiOpsDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same workspace, unchanged, in three more presets.',
      specimens: [
        {
          id: 'AiOpsDashAura',
          title: 'Aura',
          note: 'Pick it when the assistant is one page of a product in the default light theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AiOpsDashAura,
        },
        {
          id: 'AiOpsDashNeonDusk',
          title: 'Neon dusk',
          note: 'Pick it for a showpiece AI screen: purple on black with grotesk type.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AiOpsDashNeonDusk,
        },
        {
          id: 'AiOpsDashHologram',
          title: 'Hologram',
          note: 'Pick it when the assistant sits beside 3D and digital-twin views.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AiOpsDashHologram,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another workspace.',
      specimens: [
        {
          id: 'AiOpsDashThread',
          title: 'Assistant column',
          note: 'Pick it as the conversation side: context chips, the thread, suggestions and the input.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'ai/ChatThread.tsx', 'ai/PromptSuggestions.tsx', 'ai/useStreamedText.ts'],
          Component: AiOpsDashThread,
        },
        {
          id: 'AiOpsDashTripCanvas',
          title: 'Trend with event markers',
          note: 'Pick it as evidence for a why question: one signal, its limits and the events on it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AiOpsDashTripCanvas,
        },
        {
          id: 'AiOpsDashCompareCanvas',
          title: 'Comparison',
          note: 'Pick it as evidence for a compare question: the same signal on several machines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AiOpsDashCompareCanvas,
        },
        {
          id: 'AiOpsDashWatchCanvas',
          title: 'Watch list',
          note: 'Pick it when the answer is a list of things to do or confirm.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/RangeIndicator.tsx'],
          Component: AiOpsDashWatchCanvas,
        },
        {
          id: 'AiOpsDashContext',
          title: 'Context chips',
          note: 'Pick it above a thread to say which asset, period and signals the assistant reads.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AiOpsDashContext,
        },
        {
          id: 'AiOpsDashComposer',
          title: 'Suggestions and input',
          note: 'Pick it under a thread: the usual questions as buttons, free text below.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['ai/PromptSuggestions.tsx'],
          Component: AiOpsDashComposer,
        },
      ],
    },
  ],
});
