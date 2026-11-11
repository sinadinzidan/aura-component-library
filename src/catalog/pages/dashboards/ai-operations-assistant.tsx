import { Button } from '@cognite/aura/components/button';
import {
  IconArrowUp,
  IconBolt,
  IconChartLine,
  IconCheck,
  IconClipboardList,
  IconDatabase,
  IconFileText,
  IconFlame,
  IconGauge,
  IconPlus,
  IconSparkles,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS, WORK_ORDERS, findPerson, type WorkOrder } from '../../data/plant';
import { formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './ai-operations-assistant.tsx?raw';

type AoaTopicId = 'trip' | 'export' | 'orders' | 'energy';

type AoaSource = { title: string; detail: string; kind: 'series' | 'document' | 'order' };

type AoaTopic = {
  id: AoaTopicId;
  question: string;
  /** The answer in one line, for the collapsed exchange. */
  summary: string;
  /** What the assistant did before answering. */
  steps: string;
  confidence: number;
  sources: readonly AoaSource[];
};

const AOA_TOPICS: Record<AoaTopicId, AoaTopic> = {
  trip: {
    id: 'trip',
    question: 'Why did the recompressor trip?',
    summary: 'Drive-end vibration passed the 11.0 mm/s trip limit at 13:44; the bearing is the likely cause.',
    steps: 'Read 3 time series, the alarm journal and 2 work orders in 4 s',
    confidence: 86,
    sources: [
      { title: '23-VT-92740 drive-end vibration', detail: 'Time series, 13:30 to 14:00, 1 s resolution', kind: 'series' },
      { title: '23-TT-92532 discharge temperature', detail: 'Time series, same window', kind: 'series' },
      { title: 'Alarm journal, compression area', detail: '8 entries between 13:32 and 13:59', kind: 'document' },
      { title: 'WO-104482 Inspect drive-end bearing', detail: 'Raised 13:54, in progress', kind: 'order' },
    ],
  },
  export: {
    id: 'export',
    question: 'What is limiting export right now?',
    summary: 'Two-stage operation: the first stage is 3.4 barg under its discharge pressure limit.',
    steps: 'Read 5 time series and the operating envelope in 3 s',
    confidence: 78,
    sources: [
      { title: 'Gas export flow', detail: 'Time series, last 24 hours', kind: 'series' },
      { title: '23-PT-92531 discharge pressure', detail: 'Time series against the 52.0 barg limit', kind: 'series' },
      { title: 'Operating envelope, compression train', detail: 'Document, revision 7', kind: 'document' },
    ],
  },
  orders: {
    id: 'orders',
    question: 'Which work orders are at risk this week?',
    summary: 'Two of six: the standby start test is 4 days overdue and the vibration survey has no owner.',
    steps: 'Read 6 work orders and the crew rota in 2 s',
    confidence: 92,
    sources: [
      { title: 'Open work orders, Nordkapp', detail: '6 orders, synced 13:58', kind: 'order' },
      { title: 'Crew rota, week 11', detail: 'Document, maintenance day shift', kind: 'document' },
    ],
  },
  energy: {
    id: 'energy',
    question: 'How does energy use compare with last week?',
    summary: 'Energy intensity is 31.2 kWh/boe, 1.4 lower than last week but still above the 30.0 target.',
    steps: 'Read 2 time series for 14 days in 3 s',
    confidence: 81,
    sources: [
      { title: 'Energy intensity', detail: 'Time series, daily mean, 14 days', kind: 'series' },
      { title: 'Fuel gas to turbine 23-GT-9001', detail: 'Time series, hourly', kind: 'series' },
    ],
  },
};

const AOA_ORDER: readonly AoaTopicId[] = ['trip', 'export', 'orders', 'energy'];

const AOA_MINUTES = Array.from({ length: 31 }, (_, index) => `13:${String(30 + index).padStart(2, '0')}`).map((label) => (label === '13:60' ? '14:00' : label));

const AOA_VIBRATION = [5.8, 6.5, 7.3, 7.6, 7.9, 8.1, 8.4, 7.9, 7.7, 7.9, 8.4, 8.9, 9.4, 10.3, 11.2, 12.0, 12.4, 4.6, 1.2, 0.8, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];

const AOA_TEMPERATURE = [138.2, 138.9, 139.6, 140.4, 141.1, 141.8, 142.5, 143.8, 145.1, 146.3, 146.7, 147.1, 147.5, 147.9, 148.3, 148.7, 149.1, 144.2, 138.0, 131.5, 125.4, 119.8, 114.9, 110.6, 106.8, 103.4, 100.3, 97.6, 95.1, 92.9, 90.8];

const AOA_SEQUENCE: readonly { time: string; title: string; tone: Tone }[] = [
  { time: '13:32', title: 'Drive-end vibration high', tone: 'warning' },
  { time: '13:36', title: 'Operator lowered speed to 96 %', tone: 'info' },
  { time: '13:39', title: 'Discharge temperature high', tone: 'warning' },
  { time: '13:44', title: 'Drive-end vibration high-high', tone: 'critical' },
  { time: '13:46', title: 'Recompressor tripped by machine protection', tone: 'critical' },
];

const AOA_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const AOA_EXPORT_VALUES = [...AOA_EXPORT.slice(0, -1).map((point) => point.v), PLANT_KPIS.gasExport.value];

const AOA_HOURS = AOA_EXPORT.map((point) => formatTime(point.t));

const AOA_ENERGY_WEEK = [32.6, 32.4, 32.1, 31.9, 31.6, 31.5, 31.2];

const AOA_ENERGY = [...makeValues({ seed: 43, points: 7, base: 33, amplitude: 0.3, noise: 0.2, min: 32.6 }), ...AOA_ENERGY_WEEK];

const AOA_ENERGY_DAYS = Array.from({ length: 14 }, (_, index) => `${index + 27 > 28 ? index - 1 : index + 27} ${index + 27 > 28 ? 'Mar' : 'Feb'}`);

const AOA_WEEK_DAYS = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const AOA_HEADROOM = ['1st stage pressure', 'Cooler outlet temperature', '2nd stage power', 'Export pressure'];

const AOA_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');

function aoaRisk(order: WorkOrder): { word: string; tone: Tone } {
  if (order.id === 'WO-104458') return { word: 'Overdue', tone: 'critical' };
  if (order.assigneeId === null) return { word: 'No owner', tone: 'warning' };
  if (order.status === 'waiting') return { word: 'Waiting on parts', tone: 'info' };
  return { word: 'On track', tone: 'success' };
}

const AOA_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  {
    id: 'title',
    header: 'Work order',
    cell: (order) => (
      <>
        {order.title}
        <span className="block text-xs text-[var(--kit-text-2)]">{findPerson(order.assigneeId)?.name ?? 'Unassigned'}</span>
      </>
    ),
  },
  { id: 'due', header: 'Due', numeric: true, nowrap: true, cell: (order) => formatDate(order.dueAt) },
  { id: 'risk', header: 'Risk', nowrap: true, cell: (order) => <StatusPill tone={aoaRisk(order).tone}>{aoaRisk(order).word}</StatusPill> },
];

/** A numbered reference to a source listed on the evidence canvas. */
function AoaCite({ n }: { n: number }) {
  return (
    <span className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--kit-rule-strong)] px-1 align-text-top text-xs font-semibold text-[var(--kit-text-2)] tabular-nums">
      {n}
    </span>
  );
}

function AoaFigure({ label, value, unit, tone = 'neutral' }: { label: string; value: string; unit: string; tone?: Tone }) {
  return (
    <div data-tone={tone}>
      <p className="text-xs text-[var(--kit-text-2)]">{label}</p>
      <p className="mt-0.5">
        <span className={`text-2xl leading-tight font-semibold tabular-nums ${tone === 'neutral' ? 'text-[var(--kit-text)]' : 'text-[var(--t-line)]'}`}>{value}</span>
        <span className="ml-1 text-sm text-[var(--kit-text-2)]">{unit}</span>
      </p>
    </div>
  );
}

function AoaInlineCard({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-2xl border border-[var(--kit-rule)] bg-[var(--kit-well)] p-4">{children}</div>;
}

function AoaVibrationChart({ height }: { height: number }) {
  return (
    <TrendLine
      label="Drive-end vibration of the recompressor from 13:30 to 14:00 against the high and trip limits"
      labels={AOA_MINUTES}
      unit="mm/s"
      decimals={1}
      height={height}
      highlightLast={false}
      yDomain={[0, 14]}
      series={[{ id: 'vibration', label: 'Vibration', values: AOA_VIBRATION, tone: 'pink' }]}
      limits={[
        { value: 11, label: 'Trip', tone: 'critical' },
        { value: 7.1, label: 'High', tone: 'warning' },
      ]}
    />
  );
}

/** The body of an answer: prose with numbered citations, then the chart or card that backs it. */
function AoaAnswer({ topic }: { topic: AoaTopicId }) {
  if (topic === 'trip') {
    return (
      <>
        <p>
          The recompressor <TagId>23-KA-9103</TagId> tripped at 13:46 on drive-end vibration. The reading crossed the high limit at 13:32 and kept climbing after the speed was lowered to
          96 %, passing the trip limit at 13:44
          <AoaCite n={1} />. Discharge temperature rose with it
          <AoaCite n={2} />, which points at the drive-end bearing rather than a process upset.
        </p>
        <AoaInlineCard>
          <AoaVibrationChart height={170} />
          <div className="grid grid-cols-3 gap-4 border-t border-[var(--kit-rule)] pt-3">
            <AoaFigure label="Peak" value="12.4" unit="mm/s" tone="critical" />
            <AoaFigure label="Above high limit" value="14" unit="min" tone="warning" />
            <AoaFigure label="Trip delay" value="90" unit="s" />
          </div>
        </AoaInlineCard>
        <p>
          Tomás Barros found the bearing housing hot and the oil discoloured at 13:56
          <AoaCite n={4} />. I would keep the machine down until the bearing has been opened.
        </p>
      </>
    );
  }
  if (topic === 'export') {
    return (
      <>
        <p>
          Export is held at 4.38 MSm³/d, 0.12 under plan
          <AoaCite n={1} />, because the train runs on two stages. The tightest constraint is the first stage: discharge pressure is 48.6 barg against a limit of 52.0
          <AoaCite n={2} />.
        </p>
        <AoaInlineCard>
          <Bars
            label="Headroom to the nearest limit for four constraints, in percent"
            orientation="horizontal"
            categories={AOA_HEADROOM}
            series={[{ id: 'headroom', label: 'Headroom', values: [6.5, 9.2, 14, 21] }]}
            tones={['warning', 'sky', 'sky', 'sky']}
            unit="%"
            decimals={1}
            showValues
            height={170}
          />
        </AoaInlineCard>
        <p>
          Roughly 0.05 MSm³/d more is available before the first stage reaches its limit
          <AoaCite n={3} />. The rest of the gap closes only when the recompressor is back.
        </p>
      </>
    );
  }
  if (topic === 'orders') {
    return (
      <>
        <p>
          Two of the six open work orders are at risk
          <AoaCite n={1} />. The standby start test on export pump B is four days overdue, and the vibration survey on the first stage is due Saturday with nobody assigned
          <AoaCite n={2} />.
        </p>
        <AoaInlineCard>
          <ul>
            {AOA_OPEN_ORDERS.filter((order) => aoaRisk(order).tone !== 'success')
              .slice(0, 3)
              .map((order) => (
                <ListRow
                  key={order.id}
                  tone={aoaRisk(order).tone}
                  title={order.title}
                  meta={
                    <>
                      <TagId>{order.id}</TagId>
                      <span>due {formatDate(order.dueAt)}</span>
                    </>
                  }
                  trailing={<StatusPill tone={aoaRisk(order).tone}>{aoaRisk(order).word}</StatusPill>}
                />
              ))}
          </ul>
        </AoaInlineCard>
        <p>The survey matters most today: it covers the machine now carrying the recompressor load.</p>
      </>
    );
  }
  return (
    <>
      <p>
        Energy intensity is 31.2 kWh/boe today, 1.4 lower than a week ago
        <AoaCite n={1} /> but still above the 30.0 target. Most of the gain came from the turbine running closer to its best point
        <AoaCite n={2} />.
      </p>
      <AoaInlineCard>
        <Bars
          label="Energy intensity per day for the last seven days against the target"
          categories={AOA_WEEK_DAYS}
          series={[{ id: 'intensity', label: 'Energy intensity, kWh/boe', values: AOA_ENERGY_WEEK, tone: 'purple' }]}
          decimals={1}
          showValues
          height={170}
          limit={{ value: 30, label: 'Target', tone: 'success' }}
        />
      </AoaInlineCard>
      <p>Expect a step up tonight: two-stage operation recycles more gas per unit exported.</p>
    </>
  );
}

function AoaAssistantMark() {
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--kit-accent)] text-[var(--kit-on-accent)] [&>svg]:size-4">
      <IconSparkles />
    </span>
  );
}

function AoaQuestion({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[85%] self-end rounded-3xl rounded-br-md border border-[color-mix(in_oklab,var(--kit-line-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--kit-line-accent)_24%,transparent)] px-4 py-2.5 text-base font-medium text-[var(--kit-text)]">
      {children}
    </p>
  );
}

/** One question and its answer. Earlier exchanges fold to a line that reopens their evidence. */
function AoaExchange({ topic, open, onOpen }: { topic: AoaTopic; open: boolean; onOpen: (id: AoaTopicId) => void }) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpen(topic.id)}
        aria-label={`Show the answer to: ${topic.question}`}
        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--kit-rule)] px-4 py-3 text-left outline-none hover:bg-[var(--kit-surface)] focus-visible:ring-2 focus-visible:ring-[var(--kit-text)]"
      >
        <AoaAssistantMark />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--kit-text)]">{topic.question}</span>
          <span className="block text-sm text-[var(--kit-text-2)]">{topic.summary}</span>
        </span>
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <AoaQuestion>{topic.question}</AoaQuestion>
      <div className="flex gap-3">
        <AoaAssistantMark />
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 text-base leading-relaxed text-[var(--kit-text)]">
          <p className="flex items-center gap-1.5 text-sm text-[var(--kit-text-2)] [&>svg]:size-4">
            <IconCheck aria-hidden="true" /> {topic.steps}
          </p>
          <AoaAnswer topic={topic.id} />
        </div>
      </div>
    </div>
  );
}

function AoaSuggestions({ topics, onAsk }: { topics: readonly AoaTopic[]; onAsk: (id: AoaTopicId) => void }) {
  if (topics.length === 0) {
    return <p className="text-sm text-[var(--kit-text-2)]">You have asked everything on today&apos;s briefing. Type a question to go further.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
      {topics.map((topic) => (
        <li key={topic.id}>
          <button
            type="button"
            onClick={() => onAsk(topic.id)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] px-3.5 py-2 text-sm font-medium text-[var(--kit-text)] outline-none hover:bg-[color-mix(in_oklab,var(--kit-line-accent)_24%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] [&>svg]:size-4 [&>svg]:text-[var(--kit-line-accent)]"
          >
            <IconSparkles aria-hidden="true" />
            {topic.question}
          </button>
        </li>
      ))}
    </ul>
  );
}

function AoaComposer({ placeholder = 'Ask about Nordkapp' }: { placeholder?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--kit-rule-strong)] bg-[var(--kit-well)] py-1.5 pr-1.5 pl-5">
      <span className="flex-1 text-base text-[var(--kit-text-3)]">{placeholder}</span>
      <Button size="icon" aria-label="Send question">
        <IconArrowUp />
      </Button>
    </div>
  );
}

function AoaSourceIcon({ kind }: { kind: AoaSource['kind'] }) {
  if (kind === 'series') return <IconChartLine />;
  if (kind === 'order') return <IconClipboardList />;
  return <IconFileText />;
}

function AoaSources({ topic }: { topic: AoaTopic }) {
  return (
    <ol>
      {topic.sources.map((entry, index) => (
        <ListRow
          key={entry.title}
          leading={
            <span className="flex items-center gap-2">
              <AoaCite n={index + 1} />
              <IconChip tone={entry.kind === 'series' ? 'sky' : entry.kind === 'order' ? 'amber' : 'purple'} size="sm">
                <AoaSourceIcon kind={entry.kind} />
              </IconChip>
            </span>
          }
          title={entry.title}
          meta={entry.detail}
        />
      ))}
    </ol>
  );
}

/** The side canvas: the full-size evidence behind the answer that is open in the thread. */
function AoaEvidence({ topic }: { topic: AoaTopicId }) {
  if (topic === 'trip') {
    return (
      <>
        <Panel className="h-auto" title="Discharge temperature" subtitle="23-TT-92532, 13:30 to 14:00" tone="pink">
          <TrendLine
            label="Discharge temperature of the recompressor from 13:30 to 14:00 against the high limit"
            labels={AOA_MINUTES}
            unit="°C"
            decimals={0}
            height={170}
            highlightLast={false}
            series={[{ id: 'temperature', label: 'Discharge temperature', values: AOA_TEMPERATURE, tone: 'amber' }]}
            limits={[{ value: 145, label: 'High', tone: 'warning' }]}
          />
        </Panel>
        <Panel className="h-auto" title="Alarm journal" subtitle="The five entries the answer rests on" padding="none">
          <ul>
            {AOA_SEQUENCE.map((entry) => (
              <ListRow key={entry.time} tone={entry.tone} title={entry.title} trailing={entry.time} />
            ))}
          </ul>
        </Panel>
      </>
    );
  }
  if (topic === 'export') {
    return (
      <>
        <Panel className="h-auto" title="Gas export, last 24 hours" subtitle="Against the 4.50 MSm³/d plan" tone="sky">
          <TrendArea
            label="Gas export over the last 24 hours against the daily plan"
            labels={AOA_HOURS}
            unit="MSm³/d"
            decimals={2}
            height={190}
            series={[{ id: 'export', label: 'Export', values: AOA_EXPORT_VALUES, tone: 'sky' }]}
            limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
          />
        </Panel>
        <Panel className="h-auto" title="Nearest limits" subtitle="First stage, live">
          <div className="flex flex-col gap-4">
            <Meter label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} high={52} target={{ value: 52, label: 'Limit' }} tone="warning" />
            <Meter label="Cooler outlet temperature" value={36.3} max={50} unit="°C" decimals={1} high={40} target={{ value: 40, label: 'Limit' }} tone="sky" />
          </div>
        </Panel>
      </>
    );
  }
  if (topic === 'orders') {
    return (
      <Panel className="h-auto" title="Open work orders" subtitle="Six open, two at risk" padding="none" tone="amber">
        <DataTable label="Open work orders with their risk" flush columns={AOA_ORDER_COLUMNS} rows={AOA_OPEN_ORDERS} rowKey={(order) => order.id} rowTone={(order) => (aoaRisk(order).tone === 'success' ? undefined : aoaRisk(order).tone)} />
      </Panel>
    );
  }
  return (
    <Panel className="h-auto" title="Energy intensity, 14 days" subtitle="Daily mean against the 30.0 kWh/boe target" tone="purple">
      <TrendArea
        label="Energy intensity per day for the last 14 days against the target"
        labels={AOA_ENERGY_DAYS}
        unit="kWh/boe"
        decimals={1}
        height={230}
        series={[{ id: 'intensity', label: 'Energy intensity', values: AOA_ENERGY, tone: 'purple' }]}
        limits={[{ value: 30, label: 'Target', tone: 'success' }]}
      />
    </Panel>
  );
}

function AoaConfidence({ topic }: { topic: AoaTopic }) {
  return (
    <div className="flex items-center gap-5">
      <RingGauge label="Confidence in this answer" value={topic.confidence} size={92} tone={topic.confidence >= 85 ? 'success' : 'sky'} hideLabel />
      <p className="text-sm leading-relaxed text-[var(--kit-text-2)]">
        <strong className="block text-base font-semibold text-[var(--kit-text)]">{topic.confidence >= 85 ? 'Well supported' : 'Supported, with gaps'}</strong>
        Based on {topic.sources.length} sources, all read live at 14:00. Nothing was inferred from documents older than 30 days.
      </p>
    </div>
  );
}

function AoaTopBar() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--kit-rule)] bg-[var(--kit-surface)] py-2 pr-2 pl-3">
      <AoaAssistantMark />
      <div className="mr-2">
        <p className="text-sm leading-tight font-semibold text-[var(--kit-text)]">Atlas</p>
        <p className="text-xs text-[var(--kit-text-2)]">Operations assistant</p>
      </div>
      <StatusPill tone="sky" icon={<IconFlame />}>
        Nordkapp
      </StatusPill>
      <StatusPill tone="success" icon={<IconDatabase />}>
        Live data to 14:00 UTC
      </StatusPill>
      <span className="ml-auto text-sm text-[var(--kit-text-2)]">Day shift · Ingrid Haugen</span>
      <Button variant="outline" size="sm">
        <IconPlus /> New briefing
      </Button>
    </div>
  );
}

function AiOperationsAssistantSignature() {
  const [asked, setAsked] = useState<readonly AoaTopicId[]>(['trip']);
  const [active, setActive] = useState<AoaTopicId>('trip');
  const ask = (id: AoaTopicId) => {
    setAsked((current) => (current.includes(id) ? current : [...current, id]));
    setActive(id);
  };
  const topic = AOA_TOPICS[active];
  const remaining = AOA_ORDER.filter((id) => !asked.includes(id)).map((id) => AOA_TOPICS[id]);
  return (
    <LookScope look="glass">
      <Canvas className="flex min-h-[860px] flex-col gap-4">
        <AoaTopBar />
        <div className="grid flex-1 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4">
          <Panel>
            <div className="flex flex-1 flex-col gap-5">
              <div className="flex flex-1 flex-col gap-4">
                {asked.map((id) => (
                  <AoaExchange key={id} topic={AOA_TOPICS[id]} open={id === active} onOpen={setActive} />
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--kit-rule)] pt-4">
                <AoaSuggestions topics={remaining} onAsk={ask} />
                <AoaComposer />
              </div>
            </div>
          </Panel>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="px-1">
              <p className="text-sm text-[var(--kit-text-2)]">Evidence for</p>
              <h2 className="text-xl leading-snug font-semibold text-[var(--kit-text)]">{topic.question}</h2>
            </div>
            <AoaEvidence topic={active} />
            <Panel className="h-auto" title="Sources" subtitle="Numbered as cited in the answer">
              <AoaSources topic={topic} />
            </Panel>
            <Panel className="h-auto flex-1">
              <div className="flex flex-1 items-center">
                <AoaConfidence topic={topic} />
              </div>
            </Panel>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

const AOA_STARTERS: readonly { id: AoaTopicId; icon: ReactNode; tone: Tone; hint: string }[] = [
  { id: 'trip', icon: <IconGauge />, tone: 'pink', hint: 'Tripped 14 minutes ago' },
  { id: 'export', icon: <IconFlame />, tone: 'sky', hint: '0.12 MSm³/d under plan' },
  { id: 'orders', icon: <IconClipboardList />, tone: 'amber', hint: '6 open, 1 overdue' },
  { id: 'energy', icon: <IconBolt />, tone: 'purple', hint: '31.2 kWh/boe today' },
];

const AOA_CHANGES: readonly { title: string; detail: string; tone: Tone; when: string }[] = [
  { title: 'Recompressor tripped on high vibration', detail: 'Export moved to two stages at 13:49', tone: 'critical', when: '14 min ago' },
  { title: 'Discharge temperature alarm raised', detail: '146.3 °C against a limit of 145.0 °C', tone: 'warning', when: '21 min ago' },
  { title: 'Flaring down 6.5 kSm³/d on last week', detail: 'Lowest weekly mean this quarter', tone: 'success', when: 'Since Monday' },
];

function AiOperationsAssistantStart() {
  const [picked, setPicked] = useState<AoaTopicId>('trip');
  return (
    <LookScope look="glass">
      <Canvas className="flex flex-col gap-5">
        <AoaTopBar />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6">
          <div className="text-center">
            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-[var(--kit-text)]">Good afternoon, Ingrid</h2>
            <p className="mt-2 text-lg text-[var(--kit-text-2)]">Three things changed at Nordkapp since you last looked. Where do you want to start?</p>
          </div>
          <AoaComposer placeholder={AOA_TOPICS[picked].question} />
          <ul className="grid grid-cols-2 gap-4">
            {AOA_STARTERS.map((starter) => (
              <li key={starter.id}>
                <button
                  type="button"
                  aria-pressed={picked === starter.id}
                  onClick={() => setPicked(starter.id)}
                  data-tone={starter.tone}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-3xl border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] ${
                    picked === starter.id
                      ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_22%,transparent)]'
                      : 'border-[var(--kit-rule)] bg-[var(--kit-surface)] hover:border-[var(--kit-rule-strong)]'
                  }`}
                >
                  <IconChip tone={starter.tone} size="lg">
                    {starter.icon}
                  </IconChip>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-[var(--kit-text)]">{AOA_TOPICS[starter.id].question}</span>
                    <span className="block text-sm text-[var(--kit-text-2)]">{starter.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Panel className="h-auto" title="Since you last looked" subtitle="12:10 UTC, before the shift meeting">
            <ul>
              {AOA_CHANGES.map((change) => (
                <ListRow key={change.title} tone={change.tone} title={change.title} meta={change.detail} trailing={change.when} />
              ))}
            </ul>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function AoaPhone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex min-h-[640px] w-[360px] shrink-0 flex-col gap-4 rounded-[40px] border border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] p-4 pt-6">
      <span aria-hidden="true" className="mx-auto h-1.5 w-20 rounded-full bg-[var(--kit-rule-strong)]" />
      {children}
    </section>
  );
}

function AiOperationsAssistantPhone() {
  const topic = AOA_TOPICS.export;
  return (
    <LookScope look="glass">
      <Canvas className="flex flex-wrap items-stretch justify-center gap-8 py-10">
        <AoaPhone label="Answer on a phone">
          <div className="flex items-center gap-2.5">
            <AoaAssistantMark />
            <p className="text-sm font-semibold text-[var(--kit-text)]">Atlas · Nordkapp</p>
          </div>
          <AoaQuestion>{topic.question}</AoaQuestion>
          <div className="flex flex-1 flex-col gap-3 text-base leading-relaxed text-[var(--kit-text)]">
            <p>
              Export is held at 4.38 MSm³/d, 0.12 under plan
              <AoaCite n={1} />. The first stage is 3.4 barg under its discharge pressure limit
              <AoaCite n={2} />.
            </p>
            <AoaInlineCard>
              <Meter label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} high={52} target={{ value: 52, label: 'Limit' }} tone="warning" />
            </AoaInlineCard>
            <p className="text-sm text-[var(--kit-text-2)]">About 0.05 MSm³/d more is available before the limit.</p>
          </div>
          <AoaComposer placeholder="Ask a follow-up" />
        </AoaPhone>
        <AoaPhone label="Evidence sheet on a phone">
          <div>
            <p className="text-sm text-[var(--kit-text-2)]">Evidence for</p>
            <p className="text-base font-semibold text-[var(--kit-text)]">{topic.question}</p>
          </div>
          <TrendArea
            label="Gas export over the last 24 hours against the daily plan"
            labels={AOA_HOURS}
            unit="MSm³/d"
            decimals={2}
            height={170}
            series={[{ id: 'export', label: 'Export', values: AOA_EXPORT_VALUES, tone: 'sky' }]}
            limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
          />
          <AoaSources topic={topic} />
        </AoaPhone>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartExchange() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel>
          <AoaExchange topic={AOA_TOPICS.orders} open onOpen={() => undefined} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartFolded() {
  const [open, setOpen] = useState<AoaTopicId>('energy');
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel>
          <div className="flex flex-col gap-4">
            <AoaExchange topic={AOA_TOPICS.trip} open={open === 'trip'} onOpen={setOpen} />
            <AoaExchange topic={AOA_TOPICS.energy} open={open === 'energy'} onOpen={setOpen} />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartAsk() {
  const [asked, setAsked] = useState<readonly AoaTopicId[]>(['trip']);
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Ask" subtitle="Suggestions leave the row once asked">
          <div className="flex flex-col gap-3">
            <AoaSuggestions topics={AOA_ORDER.filter((id) => !asked.includes(id)).map((id) => AOA_TOPICS[id])} onAsk={(id) => setAsked((current) => [...current, id])} />
            <AoaComposer />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartSources() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Sources" subtitle="Numbered as cited in the answer">
          <AoaSources topic={AOA_TOPICS.trip} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartConfidence() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Confidence" subtitle="How well the answer is supported">
          <AoaConfidence topic={AOA_TOPICS.orders} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AiOperationsAssistantPartEvidence() {
  return (
    <LookScope look="glass">
      <Canvas className="flex flex-col gap-4">
        <AoaEvidence topic="export" />
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'ai-operations-assistant',
  title: 'AI operations assistant',
  summary:
    'A conversation-first screen for an operations assistant: answers carry their charts and cards inline, and a side canvas shows the full evidence, the numbered sources and how well the answer is supported.',
  guidance: {
    use: [
      'When people ask questions in words and need to check the answer against live data.',
      'Number the citations in the prose and list the same numbers on the evidence canvas.',
      'Fold earlier exchanges to a line, so the open answer and its evidence stay on one screen.',
    ],
    avoid: [
      'Answers without sources, or a confidence figure with no explanation of what it rests on.',
      'Letting the assistant act on the plant from the chat; it reads and explains.',
      'A wall of text: put the number, the chart or the list inline where it supports a claim.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The full screen in the glass look. Pick a suggested question: it joins the thread and the evidence canvas changes with it.',
      specimens: [
        {
          id: 'AiOperationsAssistantSignature',
          title: 'Conversation with evidence',
          note: 'Pick it when an assistant sits beside live plant data and every answer has to be checkable at a glance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/TrendLine.tsx', 'kit/Bars.tsx', 'kit/ListRow.tsx', 'kit/RingGauge.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: AiOperationsAssistantSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: the start of a session, and the phone companion.',
      specimens: [
        {
          id: 'AiOperationsAssistantStart',
          title: 'Start of a session',
          note: 'Pick it for the empty state: a greeting, what changed since the last visit and four questions worth asking.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/IconChip.tsx', 'kit/ListRow.tsx'],
          Component: AiOperationsAssistantStart,
        },
        {
          id: 'AiOperationsAssistantPhone',
          title: 'Phone companion',
          note: 'Pick it for a supervisor away from the desk: the answer on one screen and the evidence as a sheet behind it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx', 'kit/ListRow.tsx'],
          Component: AiOperationsAssistantPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the conversation and of the evidence canvas on their own.',
      specimens: [
        {
          id: 'AiOperationsAssistantPartExchange',
          title: 'Exchange with inline card',
          note: 'Pick it for one question and answer where a short list backs the claim inside the reply.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: AiOperationsAssistantPartExchange,
        },
        {
          id: 'AiOperationsAssistantPartFolded',
          title: 'Folded and open exchanges',
          note: 'Pick it to keep a long thread on one screen: earlier answers fold to their one-line summary.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Bars.tsx'],
          Component: AiOperationsAssistantPartFolded,
        },
        {
          id: 'AiOperationsAssistantPartEvidence',
          title: 'Evidence panels',
          note: 'Pick them for the side canvas: the full-size trend behind an answer and the limits it was judged against.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TrendArea.tsx', 'kit/Meter.tsx'],
          Component: AiOperationsAssistantPartEvidence,
        },
        {
          id: 'AiOperationsAssistantPartSources',
          title: 'Numbered sources',
          note: 'Pick it wherever an answer cites data: the same numbers as in the prose, with what each source is.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/IconChip.tsx'],
          Component: AiOperationsAssistantPartSources,
        },
        {
          id: 'AiOperationsAssistantPartAsk',
          title: 'Suggestions and composer',
          note: 'Pick it as the foot of a thread: questions worth asking next, above the place to type one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: AiOperationsAssistantPartAsk,
        },
        {
          id: 'AiOperationsAssistantPartConfidence',
          title: 'Confidence note',
          note: 'Pick it to say how well an answer is supported, in a ring and a sentence that explains it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx'],
          Component: AiOperationsAssistantPartConfidence,
        },
      ],
    },
  ],
});
