import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconExternalLink } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import { DiagramHotspot } from '../../../library/industrial/diagrams/DiagramHotspot';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { ValueTag } from '../../../library/industrial/diagrams/ValueTag';
import { DueLabel } from '../../../library/industrial/operations/DueLabel';
import { HealthBreakdown } from '../../../library/industrial/operations/HealthBreakdown';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { workOrderStatusLabel } from '../../../library/industrial/operations/workOrders';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { formatLimit, formatReading, healthStatus, runStateStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { DAY, MINUTE, REFERENCE_NOW, formatDate, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './compressor-health.tsx?raw';

const COMP_ASSET = {
  tag: '23-KA-9101',
  name: '1st stage compressor',
  state: 'running',
  health: 'watch',
  healthScore: 72,
  criticality: 'A',
} as const;

type CompPoint = {
  id: string;
  /** Where on the machine the measurement is taken. */
  location: string;
  name: string;
  tag: string;
  unit: string;
  value: number;
  decimals: number;
  low?: number;
  high: number;
  trip?: number;
  rangeMax: number;
  /** Y axis of the 24-hour trend. */
  domain: readonly [number, number];
  ticks: readonly number[];
  /** Value 24 hours ago; the trend runs from here to `value`. */
  dayAgo: number;
  seed: number;
  /** Top-left corner of the callout on the diagram, and the point it measures. */
  x: number;
  y: number;
  target: { x: number; y: number };
  finding: string;
};

/** Measurement points on the machine. Limits follow the plant's sensor records for 23-KA-9101. */
const COMP_POINTS: readonly CompPoint[] = [
  {
    id: 'suction',
    location: 'Suction nozzle',
    name: 'Suction pressure',
    tag: '23-PT-92530',
    unit: 'barg',
    value: 12.4,
    decimals: 1,
    low: 10,
    high: 15,
    rangeMax: 20,
    domain: [8, 16],
    ticks: [8, 10, 12, 14, 16],
    dayAgo: 12.6,
    seed: 12,
    x: 196,
    y: 84,
    target: { x: 330, y: 110 },
    finding: 'Steady in the middle of its band; the inlet separator is holding pressure.',
  },
  {
    id: 'discharge',
    location: 'Discharge nozzle',
    name: 'Discharge pressure',
    tag: '23-PT-92531',
    unit: 'barg',
    value: 48.6,
    decimals: 1,
    low: 40,
    high: 52,
    trip: 55,
    rangeMax: 60,
    domain: [36, 56],
    ticks: [36, 40, 44, 48, 52, 56],
    dayAgo: 47.9,
    seed: 11,
    x: 502,
    y: 84,
    target: { x: 480, y: 110 },
    finding: 'Inside the band with 3.4 barg left to the high limit.',
  },
  {
    id: 'temperature',
    location: 'Discharge nozzle',
    name: 'Discharge temperature',
    tag: '23-TT-92532',
    unit: '°C',
    value: 141.2,
    decimals: 1,
    low: 90,
    high: 145,
    trip: 155,
    rangeMax: 180,
    domain: [120, 160],
    ticks: [120, 130, 140, 150, 160],
    dayAgo: 138.4,
    seed: 13,
    x: 560,
    y: 12,
    target: { x: 610, y: 60 },
    finding: 'Up 2.8 °C in 24 hours and 3.8 °C under the high limit; the interstage cooler is fouling.',
  },
  {
    id: 'de-bearing',
    location: 'Drive-end bearing',
    name: 'Drive-end vibration',
    tag: '23-VT-92540',
    unit: 'mm/s',
    value: 6.8,
    decimals: 1,
    high: 7.1,
    trip: 11,
    rangeMax: 15,
    domain: [4, 12],
    ticks: [4, 6, 8, 10, 12],
    dayAgo: 5.6,
    seed: 14,
    x: 150,
    y: 296,
    target: { x: 225, y: 238 },
    finding: 'Rising 1.2 mm/s in 24 hours at running speed and 0.3 mm/s under the high limit.',
  },
  {
    id: 'seal',
    location: 'Drive-end dry gas seal',
    name: 'Seal leakage flow',
    tag: '23-FT-92560',
    unit: 'Nm³/h',
    value: 1.8,
    decimals: 1,
    high: 3,
    trip: 5,
    rangeMax: 6,
    domain: [0, 6],
    ticks: [0, 2, 4, 6],
    dayAgo: 1.7,
    seed: 23,
    x: 280,
    y: 296,
    target: { x: 265, y: 232 },
    finding: 'Primary seal leakage is flat and well under its limit.',
  },
  {
    id: 'nde-bearing',
    location: 'Non-drive-end bearing',
    name: 'Non-drive-end vibration',
    tag: '23-VT-92541',
    unit: 'mm/s',
    value: 4.2,
    decimals: 1,
    high: 7.1,
    trip: 11,
    rangeMax: 15,
    domain: [0, 12],
    ticks: [0, 3, 6, 9, 12],
    dayAgo: 4.1,
    seed: 24,
    x: 540,
    y: 296,
    target: { x: 585, y: 238 },
    finding: 'Unchanged, which places the fault at the drive end, not across the rotor.',
  },
  {
    id: 'speed',
    location: 'Coupling',
    name: 'Shaft speed',
    tag: '23-ST-92501',
    unit: 'rpm',
    value: 9840,
    decimals: 0,
    low: 7000,
    high: 10500,
    rangeMax: 12000,
    domain: [6000, 11000],
    ticks: [6000, 7000, 8000, 9000, 10000, 11000],
    dayAgo: 9790,
    seed: 15,
    x: 20,
    y: 296,
    target: { x: 175, y: 228 },
    finding: 'Constant speed, so the vibration rise is not a load or speed effect.',
  },
];

/** Near a limit when less than a tenth of the band is left. */
function compPointTone(point: CompPoint): Tone {
  if (point.trip !== undefined && point.value >= point.trip) return 'critical';
  if (point.value > point.high) return 'warning';
  return (point.high - point.value) / (point.high - (point.low ?? 0)) < 0.1 ? 'warning' : 'neutral';
}

const compPointState = (point: CompPoint): string => (compPointTone(point) === 'neutral' ? 'Within limits' : 'Near high limit');

/** 24 hours at 30-minute resolution, from the value a day ago to the live value. */
function compPointTrend(point: CompPoint) {
  const span = point.domain[1] - point.domain[0];
  const points = makeSeries({
    seed: point.seed,
    points: 49,
    base: point.dayAgo,
    drift: point.value - point.dayAgo,
    noise: span * 0.012,
    stepMs: 30 * MINUTE,
    decimals: point.decimals,
  });
  return points.map((sample, index) => ({ t: sample.t, v: index === points.length - 1 ? point.value : sample.v }));
}

function compPointLimits(point: CompPoint) {
  const inDomain = (value: number) => value > point.domain[0] && value <= point.domain[1];
  return [
    ...(point.low !== undefined && inDomain(point.low)
      ? [{ value: point.low, label: `Low ${formatLimit(point.low, point.decimals)}`, tone: 'neutral', align: 'left' } as const]
      : []),
    ...(inDomain(point.high)
      ? [{ value: point.high, label: `High ${formatLimit(point.high, point.decimals)}`, tone: 'warning', align: 'left' } as const]
      : []),
    ...(point.trip !== undefined && inDomain(point.trip)
      ? [{ value: point.trip, label: `Trip ${formatLimit(point.trip, point.decimals)}`, tone: 'critical', align: 'left' } as const]
      : []),
  ];
}

const COMP_FIGURES = [
  { id: 'vibration', label: 'Drive-end vibration', value: 6.8, unit: 'mm/s', decimals: 1, caption: '+1.2 in 24 h · high 7.1' },
  { id: 'temperature', label: 'Discharge temperature', value: 141.2, unit: '°C', decimals: 1, caption: '+2.8 in 24 h · high 145' },
  { id: 'hours', label: 'Run hours since overhaul', value: 14620, unit: 'h', decimals: 0, caption: 'Overhaul due at 24,000 h' },
];

const COMP_INDICATORS = [
  { id: 'vibration', label: 'Vibration', score: 61 },
  { id: 'temperature', label: 'Temperature', score: 68 },
  { id: 'performance', label: 'Performance', score: 84 },
  { id: 'lubrication', label: 'Lubrication', score: 90 },
];

/** The operating point against the three edges of the compressor envelope. */
const COMP_ENVELOPE = [
  { id: 'flow', label: 'Inlet flow, surge to choke', value: 182, unit: 'kSm³/h', decimals: 0, min: 100, max: 240, low: 138, high: 221 },
  { id: 'ratio', label: 'Pressure ratio', value: 3.7, unit: '', decimals: 1, min: 2, max: 5.5, low: 2.8, high: 4.6 },
  { id: 'speed', label: 'Shaft speed', value: 9840, unit: 'rpm', decimals: 0, min: 6000, max: 12000, low: 7000, high: 10500 },
];

const COMP_ORDERS = [
  { id: 'WO-104466', title: 'Vibration survey, 1st stage compressor', priority: 'P2', status: 'open', dueAt: REFERENCE_NOW + 2 * DAY },
  { id: 'WO-104473', title: 'Replace drive-end bearing temperature probe', priority: 'P2', status: 'planned', dueAt: REFERENCE_NOW + 5 * DAY },
  { id: 'WO-104451', title: 'Lube oil sample and analysis', priority: 'P3', status: 'open', dueAt: REFERENCE_NOW - 2 * DAY },
  { id: 'WO-104402', title: 'Change dry gas seal filter elements', priority: 'P3', status: 'waiting', dueAt: REFERENCE_NOW + 9 * DAY },
] as const;

const COMP_EVIDENCE = [
  { id: 'margin', label: 'Margin to high limit', value: '0.3 mm/s' },
  { id: 'limit', label: 'Projected to reach limit', value: 'In about 6 h' },
  { id: 'spectrum', label: 'Dominant frequency', value: '1× running speed' },
];

const COMP_IMPELLERS = [318, 362, 406, 450, 494];

/** The headline figures as one calm strip in the frame toolbar, instead of a row of tiles. */
function CompFigureStrip() {
  return (
    <dl className="flex w-full flex-wrap items-start gap-x-10 gap-y-4 border-y border-default py-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Health score</dt>
        <dd className="flex flex-wrap items-baseline gap-x-3">
          <ValueReadout value={COMP_ASSET.healthScore} size="md" tone="warning" />
          <StatusIndicator {...healthStatus(COMP_ASSET.health)} size="sm" detail="−7 in a week" />
        </dd>
      </div>
      {COMP_FIGURES.map((figure) => (
        <div key={figure.id} className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-3">
            <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="md" />
            <span className="text-xs tabular-nums text-muted-foreground">{figure.caption}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

type CompSelection = { selectedId: string; onSelect: (id: string) => void };

/** The dominant element: a cutaway of the train with a selectable callout at every measurement point. */
function CompDiagramPanel({ selectedId, onSelect }: CompSelection) {
  return (
    <DashboardPanel
      title="Machine"
      description="Gas turbine, coupling and barrel compressor. Select a measurement point to inspect it."
      footnote="Seven live measurement points; a callout is tinted and flagged only near or beyond a limit. The operating point is 24% right of the surge limit."
    >
      <DiagramCanvas
        interactive
        label="Cutaway of the 1st stage compressor train with seven selectable measurement points"
        width={720}
        height={344}
        className="w-full"
      >
        <PipeLine
          points={[
            { x: 30, y: 60 },
            { x: 330, y: 60 },
            { x: 330, y: 140 },
          ]}
          weight="heavy"
          flow="forward"
          arrows={2}
        />
        <PipeLine
          points={[
            { x: 480, y: 140 },
            { x: 480, y: 60 },
            { x: 700, y: 60 },
          ]}
          weight="heavy"
          flow="forward"
          arrows={2}
        />
        <text x={30} y={48} fontSize={10} className="fill-muted-foreground">
          Suction
        </text>
        <text x={700} y={78} fontSize={10} textAnchor="end" className="fill-muted-foreground">
          Discharge
        </text>

        <path d="M 150 210 H 640" stroke="currentColor" strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <rect x={30} y={160} width={120} height={100} rx={6} stroke="currentColor" strokeWidth={1.5} className="fill-muted-background" />
        <text x={90} y={206} fontSize={11} textAnchor="middle" className="fill-base-foreground font-medium">
          Gas turbine
        </text>
        <text x={90} y={222} fontSize={9} textAnchor="middle" className="fill-muted-foreground font-mono">
          23-GT-9001
        </text>
        <rect x={162} y={194} width={26} height={32} rx={3} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <rect x={205} y={184} width={40} height={52} rx={4} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <rect x={256} y={192} width={18} height={36} rx={2} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <rect x={285} y={140} width={240} height={140} rx={20} stroke="currentColor" strokeWidth={1.5} className="fill-muted-background" />
        {COMP_IMPELLERS.map((x) => (
          <path
            key={x}
            d={`M ${x - 5} 162 H ${x + 5} L ${x + 13} 258 H ${x - 13} Z`}
            stroke="currentColor"
            strokeWidth={1}
            fill="currentColor"
            fillOpacity={0.12}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <rect x={536} y={192} width={18} height={36} rx={2} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <rect x={565} y={184} width={40} height={52} rx={4} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <text x={405} y={272} fontSize={9} textAnchor="middle" className="fill-muted-foreground font-mono">
          {COMP_ASSET.tag}
        </text>

        {COMP_POINTS.map((point) => {
          const tone = compPointTone(point);
          return (
            <DiagramHotspot
              key={point.id}
              x={point.x - 4}
              y={point.y - 4}
              width={116}
              height={40}
              selected={point.id === selectedId}
              onSelect={() => onSelect(point.id)}
              label={`${point.name} at the ${point.location.toLowerCase()}: ${formatReading(point.value, point.unit, point.decimals)}, ${compPointState(point).toLowerCase()}`}
            >
              <ValueTag
                x={point.x}
                y={point.y}
                width={108}
                label={point.tag}
                mono
                value={point.value}
                unit={point.unit}
                decimals={point.decimals}
                tone={tone}
                flag={tone === 'neutral' ? undefined : 'near H'}
                leaderTo={point.target}
              />
            </DiagramHotspot>
          );
        })}
      </DiagramCanvas>
      <div className="flex flex-col gap-3 border-t border-default pt-4">
        <p className="text-xs font-medium text-medium-foreground">Operating envelope</p>
        <CompEnvelopeStrip />
      </div>
    </DashboardPanel>
  );
}

/** Side inspector: the selected point's dial, limits and 24-hour trend. */
function CompInspectorPanel({ pointId }: { pointId: string }) {
  const point = COMP_POINTS.find((candidate) => candidate.id === pointId) ?? COMP_POINTS[0];
  if (!point) return null;
  const tone = compPointTone(point);
  const limits = [
    { label: 'Low limit', value: point.low },
    { label: 'High limit', value: point.high },
    { label: 'Trip limit', value: point.trip },
    { label: 'Margin to high', value: point.high - point.value },
  ];

  return (
    <DashboardPanel title={point.name} description={point.location} footnote={point.finding}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{point.tag}</span>
        <StatusIndicator
          tone={tone === 'neutral' ? 'success' : tone}
          shape={tone === 'neutral' ? 'dot' : 'square'}
          label={compPointState(point)}
          size="sm"
        />
      </div>
      <div className="flex justify-center">
        <RadialGauge
          label={point.name}
          value={point.value}
          min={0}
          max={point.rangeMax}
          unit={point.unit}
          decimals={point.decimals}
          limits={{ low: point.low, high: point.high, highHigh: point.trip }}
          tone={tone}
          size="md"
          showLabel={false}
        />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 border-t border-default pt-3">
        {limits.map((limit) => (
          <div key={limit.label} className="flex flex-wrap items-baseline justify-between gap-x-2 py-1 text-xs">
            <dt className="text-muted-foreground">{limit.label}</dt>
            <dd className="tabular-nums text-base-foreground">
              {limit.value === undefined ? '—' : formatLimit(limit.value, point.decimals)}
            </dd>
          </div>
        ))}
      </dl>
      <TrendChart
        label={`${point.name} over the last 24 hours, from ${formatReading(point.dayAgo, point.unit, point.decimals)} to ${formatReading(point.value, point.unit, point.decimals)}`}
        series={[{ key: point.id, label: point.name, points: compPointTrend(point) }]}
        limits={compPointLimits(point)}
        yDomain={point.domain}
        yTicks={point.ticks}
        unit={point.unit}
        decimals={point.decimals}
        maxTicks={3}
        showLast
        heightClassName="h-40"
        className="w-full"
      />
    </DashboardPanel>
  );
}

/** The operating point against the edges of the compressor map, one range per axis. */
function CompEnvelopeStrip() {
  return (
    <ul aria-label="Operating envelope" className="grid w-full grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-3">
      {COMP_ENVELOPE.map((axis) => (
        <li key={axis.id} className="min-w-0">
          <RangeIndicator
            label={axis.label}
            value={axis.value}
            unit={axis.unit}
            decimals={axis.decimals}
            min={axis.min}
            max={axis.max}
            limits={{ low: axis.low, high: axis.high }}
          />
        </li>
      ))}
    </ul>
  );
}

function CompEnvelopePanel() {
  return (
    <DashboardPanel
      title="Operating envelope"
      description="Where the machine runs between the edges of its map"
      footnote="The operating point is 24% right of the surge limit and inside the band on all three axes."
    >
      <CompEnvelopeStrip />
    </DashboardPanel>
  );
}

function CompHealthPanel() {
  return (
    <DashboardPanel
      title="Health breakdown"
      description="Score per indicator, 0 to 100"
      footnote="Watch below 80, poor below 60. Vibration and temperature pull the score down."
    >
      <HealthBreakdown indicators={COMP_INDICATORS} label="Compressor health by indicator" />
    </DashboardPanel>
  );
}

function CompWorkOrdersPanel() {
  return (
    <DashboardPanel title="Open work orders" description={`${COMP_ORDERS.length} on ${COMP_ASSET.tag}, by priority`}>
      <ul className="flex w-full flex-col">
        {COMP_ORDERS.map((order) => (
          <li key={order.id} className="flex items-start gap-3 border-t border-default py-2 first:border-t-0 first:pt-0">
            <div className="shrink-0 pt-0.5">
              <PriorityBadge priority={order.priority} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-base-foreground">{order.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                <span className="text-xs text-muted-foreground">{workOrderStatusLabel(order.status)}</span>
                <DueLabel due={formatDate(order.dueAt)} overdue={order.dueAt < REFERENCE_NOW} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function CompRecommendationPanel() {
  return (
    <DashboardPanel title="Recommendation" description="From condition monitoring, 13:20 UTC">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-base-foreground">Bring the vibration survey forward to this shift</p>
        <p className="text-sm text-medium-foreground">
          Drive-end vibration is climbing at running speed while speed and the far bearing are steady, which points to
          a developing drive-end bearing fault. A survey now decides between a planned stop and running on.
        </p>
      </div>
      <dl className="flex flex-col border-t border-default">
        {COMP_EVIDENCE.map((item) => (
          <div key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-default py-2 text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="tabular-nums text-base-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Reschedule survey</Button>
        <Button variant="outline" size="sm">
          Review evidence
        </Button>
      </div>
    </DashboardPanel>
  );
}

/**
 * Archetype: diagram-first with a side inspector and a footer band.
 * Dominant element: the cutaway of the compressor train with its measurement callouts.
 * Interaction: selecting a measurement point on the diagram swaps the inspector's dial, limits and trend.
 */
function CompDashboard() {
  const [selectedId, setSelectedId] = useState('de-bearing');

  return (
    <DashboardFrame
      title="Compressor health"
      subtitle={`${COMP_ASSET.name} · Gas compression, Nordkapp · updated 14:00 UTC`}
      status={
        <>
          <span className="font-mono text-sm text-medium-foreground">{COMP_ASSET.tag}</span>
          <StatusIndicator {...runStateStatus(COMP_ASSET.state)} />
          <Badge variant="secondary">Criticality {COMP_ASSET.criticality}</Badge>
        </>
      }
      actions={
        <Button variant="outline" size="sm">
          <IconExternalLink /> Open asset
        </Button>
      }
      toolbar={<CompFigureStrip />}
    >
      <div className="flex flex-col gap-4">
        <DashboardGrid>
          <DashboardCell span={8}>
            <CompDiagramPanel selectedId={selectedId} onSelect={setSelectedId} />
          </DashboardCell>
          <DashboardCell span={4}>
            <CompInspectorPanel pointId={selectedId} />
          </DashboardCell>
        </DashboardGrid>
        <DashboardGrid>
          <DashboardCell span={4}>
            <CompHealthPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <CompWorkOrdersPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <CompRecommendationPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function CompHealthDashSignature() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashSchematic() {
  return (
    <ThemeScope preset="schematic" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashFigures() {
  return <CompFigureStrip />;
}

function CompHealthDashMachine() {
  const [selectedId, setSelectedId] = useState('discharge');
  return <CompDiagramPanel selectedId={selectedId} onSelect={setSelectedId} />;
}

function CompHealthDashInspector() {
  return <CompInspectorPanel pointId="temperature" />;
}

function CompHealthDashEnvelope() {
  return <CompEnvelopePanel />;
}

function CompHealthDashBreakdown() {
  return <CompHealthPanel />;
}

function CompHealthDashWorkOrders() {
  return <CompWorkOrdersPanel />;
}

function CompHealthDashRecommendation() {
  return <CompRecommendationPanel />;
}

export default definePage({
  id: 'compressor-health',
  title: 'Compressor health',
  summary:
    'One machine in depth, built around a cutaway of the compressor train: select a measurement point to inspect its dial, limits and trend, then act on the open work and the recommendation underneath.',
  guidance: {
    use: [
      'As the detail screen behind an asset card, an alarm or a bad-actor list.',
      'When where a reading is taken matters as much as its value: bearings, seals, nozzles.',
      'Put the tag, run state and criticality beside the title so the machine is never in doubt.',
      'End with the open work and one recommendation, so the screen leads to an action.',
    ],
    avoid: [
      'A dial for every point at once; one inspector that follows the selection scales better.',
      'Colouring the drawing itself by health; tint only the callout that is near a limit.',
      'A trend without its limits, or limits without their values printed on the line.',
      'Recommendations without the evidence and the reason behind them.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Blueprint theme. Diagram-first: the machine is the navigation, a side inspector follows the selected point, and work sits in a footer band.',
      specimens: [
        {
          id: 'CompHealthDashSignature',
          title: 'Compressor health',
          note: 'Pick it as the detail screen for one critical rotating machine.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/diagrams/DiagramCanvas.tsx',
            'industrial/diagrams/DiagramHotspot.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
            'industrial/RadialGauge.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/operations/HealthBreakdown.tsx',
            'industrial/operations/PriorityBadge.tsx',
            'industrial/operations/DueLabel.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: CompHealthDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'CompHealthDashAura',
          title: 'Aura',
          note: 'Pick it when the screen sits inside a product that uses the design system as shipped.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashAura,
        },
        {
          id: 'CompHealthDashControlRoom',
          title: 'Control room',
          note: 'Pick it for the operator console: dark, compact, sharp and high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashControlRoom,
        },
        {
          id: 'CompHealthDashSchematic',
          title: 'Schematic',
          note: 'Pick it for tag-heavy engineering tools where monospaced figures line up.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashSchematic,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'CompHealthDashFigures',
          title: 'Figure strip',
          note: 'Pick it instead of a tile row when the figures support a larger element below.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: CompHealthDashFigures,
        },
        {
          id: 'CompHealthDashMachine',
          title: 'Machine diagram',
          note: 'Pick it when the location of each measurement is how people find it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'dashboards/DashboardPanel.tsx',
            'industrial/diagrams/DiagramCanvas.tsx',
            'industrial/diagrams/DiagramHotspot.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
          ],
          Component: CompHealthDashMachine,
        },
        {
          id: 'CompHealthDashInspector',
          title: 'Point inspector',
          note: 'Pick it as the detail beside a diagram or table: one dial, its limits and its trend.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: [
            'dashboards/DashboardPanel.tsx',
            'industrial/RadialGauge.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: CompHealthDashInspector,
        },
        {
          id: 'CompHealthDashEnvelope',
          title: 'Operating envelope',
          note: 'Pick it to show how far a machine runs from the edges of its map without drawing the map.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/RangeIndicator.tsx'],
          Component: CompHealthDashEnvelope,
        },
        {
          id: 'CompHealthDashBreakdown',
          title: 'Health breakdown',
          note: 'Pick it to show which condition indicator is pulling a health score down.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/HealthBreakdown.tsx'],
          Component: CompHealthDashBreakdown,
        },
        {
          id: 'CompHealthDashWorkOrders',
          title: 'Open work orders',
          note: 'Pick it to list the open jobs on one asset in a narrow column.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/PriorityBadge.tsx', 'industrial/operations/DueLabel.tsx'],
          Component: CompHealthDashWorkOrders,
        },
        {
          id: 'CompHealthDashRecommendation',
          title: 'Recommendation',
          note: 'Pick it when the screen should end in one next step, with the reason and the evidence.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: CompHealthDashRecommendation,
        },
      ],
    },
  ],
});
