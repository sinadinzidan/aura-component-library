import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { LossStack } from '../../../library/industrial/domains/LossStack';
import { attainment, oee, oeeLosses } from '../../../library/industrial/domains/oee';
import { OeeBreakdown } from '../../../library/industrial/domains/OeeBreakdown';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PLANT_KPIS } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './production-and-oee.tsx?raw';

const KPI = PLANT_KPIS;
const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';
const CODE = 'rounded-md bg-muted-background px-1.5 py-0.5 font-mono text-xs text-medium-foreground';

/** The three OEE factors for the last 24 hours; their product is the plant OEE of 82.7 %. */
const FACTORS = { availability: KPI.availability.value, performance: 87.4, quality: 98.2 };
const FACTOR_TARGETS = { availability: KPI.availability.target, performance: 89, quality: 98 };
const LOSSES = oeeLosses(FACTORS);

const OEE_TREND = [...makeValues({ seed: 32, points: 29, base: 80.6, drift: KPI.oee.value - 80.6, noise: 0.5, stepMs: DAY }), KPI.oee.value];

/** The six big losses in OEE points, grouped by the factor they reduce. */
const SIX_BIG_LOSSES = [
  {
    factor: 'Availability',
    points: LOSSES.availabilityLoss,
    items: [
      { id: 'failure', label: 'Equipment failure', value: 2.4 },
      { id: 'setup', label: 'Start-up and changeover', value: 1.2 },
    ],
  },
  {
    factor: 'Performance',
    points: LOSSES.performanceLoss,
    items: [
      { id: 'speed', label: 'Reduced rate', value: 8.9 },
      { id: 'stops', label: 'Idling and minor stops', value: 3.3 },
    ],
  },
  {
    factor: 'Quality',
    points: LOSSES.qualityLoss,
    items: [
      { id: 'defects', label: 'Off-spec gas', value: 1.1 },
      { id: 'yield', label: 'Start-up losses', value: 0.4 },
    ],
  },
];

const DAILY_PLAN = KPI.gasExport.target;

/** Gas export per day in MSm³ for 1–12 March; the last seven days match the plant's chart data. */
const MONTH_ACTUALS = [4.46, 4.51, 4.39, 4.48, 4.44, 4.31, 4.42, 4.18, 4.47, 4.52, 4.21, KPI.gasExport.value];
const MONTH_TO_DATE = MONTH_ACTUALS.reduce((sum, value) => sum + value, 0);
const PLAN_TO_DATE = DAILY_PLAN * MONTH_ACTUALS.length;

const SHIFT_SPLIT = [
  { day: 2.18, night: 2.13 },
  { day: 2.22, night: 2.2 },
  { day: 2.05, night: 2.13 },
  { day: 2.25, night: 2.22 },
  { day: 2.27, night: 2.25 },
  { day: 2.09, night: 2.12 },
  { day: 2.21, night: 2.17 },
].map((row, index) => ({ ...row, date: formatDate(REFERENCE_NOW - (6 - index) * DAY) }));

const SHIFT_CONFIG = {
  day: { label: 'Day shift', color: chartSeriesColor(1) },
  night: { label: 'Night shift', color: 'var(--color-chart-1-300)' },
} satisfies ChartConfig;

const CUMULATIVE = Array.from({ length: 31 }, (_, index) => ({
  day: index + 1,
  plan: Math.round(DAILY_PLAN * (index + 1) * 100) / 100,
  actual: index < MONTH_ACTUALS.length ? Math.round(MONTH_ACTUALS.slice(0, index + 1).reduce((sum, value) => sum + value, 0) * 100) / 100 : null,
}));

const CUMULATIVE_CONFIG = {
  plan: { label: 'Plan', color: 'var(--color-chart-neutral-400)' },
  actual: { label: 'Actual', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Lost production against plan, month to date, in kSm³. Adds up to plan minus actual. */
const DEFERMENT = [
  { id: 'trips', label: 'Compressor trips', value: 520 },
  { id: 'planned', label: 'Planned maintenance', value: 310 },
  { id: 'fouling', label: 'Reduced rate, cooler fouling', value: 240 },
  { id: 'export', label: 'Export constraint', value: 110 },
  { id: 'other', label: 'Other', value: 50 },
];

type DowntimeEvent = {
  id: string;
  code: string;
  cause: string;
  equipment: string;
  tag: string;
  when: string;
  duration: string;
  planned: boolean;
  deferred: number;
};

const DOWNTIME_LOG: readonly DowntimeEvent[] = [
  { id: 'dt-0318', code: 'M-VIB', cause: 'Mechanical · high vibration', equipment: 'Recompressor', tag: '23-KA-9103', when: '12 Mar, 13:46', duration: 'Ongoing, 14 min', planned: false, deferred: 9 },
  { id: 'dt-0317', code: 'P-PM', cause: 'Planned · preventive maintenance', equipment: 'Cooling water pump', tag: '40-PA-4001', when: '11 Mar, 08:10', duration: '6 h 20 min', planned: true, deferred: 0 },
  { id: 'dt-0316', code: 'O-FOUL', cause: 'Process · fouling', equipment: 'Interstage cooler', tag: '23-HA-9114', when: '10 Mar, 21:05', duration: '1 h 35 min', planned: false, deferred: 62 },
  { id: 'dt-0315', code: 'I-TRX', cause: 'Instrument · transmitter fault', equipment: 'Test separator', tag: '20-VA-1002', when: '9 Mar, 15:22', duration: '48 min', planned: false, deferred: 0 },
  { id: 'dt-0314', code: 'E-PWR', cause: 'Electrical · power dip', equipment: '1st stage compressor', tag: '23-KA-9101', when: '8 Mar, 03:12', duration: '1 h 50 min', planned: false, deferred: 214 },
  { id: 'dt-0313', code: 'O-CHG', cause: 'Operations · pump changeover', equipment: 'Export pump A', tag: '27-PA-2001A', when: '7 Mar, 10:30', duration: '25 min', planned: true, deferred: 0 },
];

/** Downtime hours by cause group over the last 30 days, worst first, with the running share. */
const PARETO = [
  { cause: 'Mechanical', hours: 41 },
  { cause: 'Planned', hours: 26 },
  { cause: 'Process', hours: 14 },
  { cause: 'Instrument', hours: 9 },
  { cause: 'Electrical', hours: 6 },
  { cause: 'Operations', hours: 4 },
].map((row, index, rows) => ({
  ...row,
  cumulative: Math.round((rows.slice(0, index + 1).reduce((sum, entry) => sum + entry.hours, 0) / rows.reduce((sum, entry) => sum + entry.hours, 0)) * 100),
}));

const PARETO_CONFIG = {
  hours: { label: 'Downtime', color: chartSeriesColor(1) },
  cumulative: { label: 'Cumulative share', color: 'var(--color-chart-neutral-450)' },
} satisfies ChartConfig;

type ShiftScore = {
  id: string;
  name: string;
  window: string;
  supervisor: string;
  state: { tone: Tone; label: string };
  produced: number;
  plan: number;
  oee: number;
  downtime: string;
  alarms: number;
};

const SHIFTS: readonly ShiftScore[] = [
  { id: 'd11', name: 'Day shift', window: '11 Mar, 07:00–19:00', supervisor: 'Liv Wold', state: { tone: 'neutral', label: 'Closed' }, produced: 2.09, plan: 2.25, oee: 79.8, downtime: '6 h 20 min', alarms: 9 },
  { id: 'n11', name: 'Night shift', window: '11 Mar, 19:00–07:00', supervisor: 'Magnus Solberg', state: { tone: 'neutral', label: 'Closed' }, produced: 2.24, plan: 2.25, oee: 85.6, downtime: '0 min', alarms: 3 },
  { id: 'd12', name: 'Day shift', window: '12 Mar, 07:00–19:00', supervisor: 'Liv Wold', state: { tone: 'success', label: 'In progress' }, produced: 1.26, plan: 1.31, oee: 82.7, downtime: '14 min', alarms: 4 },
];

type SiteRow = { site: string; oee: number; availability: number; performance: number; quality: number; output: number; plan: number; downtime: number };

const SITE_COMPARISON: readonly SiteRow[] = [
  { site: 'Hammerfest LNG', oee: 88.1, availability: 97.9, performance: 91.2, quality: 98.7, output: 6.12, plan: 6.2, downtime: 3.1 },
  { site: 'Stord terminal', oee: 85.4, availability: 98.2, performance: 88.3, quality: 98.5, output: 1.94, plan: 2.0, downtime: 2.4 },
  { site: 'Nordkapp', oee: KPI.oee.value, availability: FACTORS.availability, performance: FACTORS.performance, quality: FACTORS.quality, output: KPI.gasExport.value, plan: DAILY_PLAN, downtime: 8.6 },
  { site: 'Valhall Sør', oee: 76.9, availability: 92.1, performance: 85.6, quality: 97.5, output: 2.71, plan: 3.1, downtime: 19.0 },
];

/** Attainment per day of March: actuals so far, then plan, with a turnaround on 24–26 March. */
const CALENDAR = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  const weekday = 'SMTWTFS'[index % 7];
  if (day >= 24 && day <= 26) return { day, weekday, kind: 'shutdown' as const, value: null };
  if (index >= MONTH_ACTUALS.length) return { day, weekday, kind: 'planned' as const, value: null };
  const value = attainment(MONTH_ACTUALS[index], DAILY_PLAN);
  const kind = index === MONTH_ACTUALS.length - 1 ? ('today' as const) : value >= 98 ? ('on-plan' as const) : value >= 95 ? ('below' as const) : ('well-below' as const);
  return { day, weekday, kind, value };
});

const CALENDAR_CELL = {
  'on-plan': 'bg-chart-neutral-100 text-base-foreground',
  below: 'bg-warning-background text-warning-foreground',
  'well-below': 'bg-critical-background text-critical-foreground',
  today: 'bg-chart-neutral-100 text-base-foreground outline-2 -outline-offset-2 outline-base-foreground',
  planned: 'border border-dashed border-default text-muted-foreground',
  shutdown: 'bg-neutral-background text-neutral-foreground',
};

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function ProdOeeTile() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="OEE"
        value={KPI.oee.value}
        unit="%"
        decimals={1}
        status={{ tone: 'warning', label: 'Below target', shape: 'square' }}
        delta={{ reference: KPI.oee.previous, goodDirection: 'up', caption: 'vs last week' }}
        target={{ value: KPI.oee.target }}
        trend={{ values: OEE_TREND, label: 'OEE, last 30 days' }}
      />
    </div>
  );
}

function ProdOeeEquationTile() {
  return (
    <Panel title="OEE" meta="Last 24 hours · Nordkapp">
      <OeeBreakdown {...FACTORS} target={KPI.oee.target} />
      <p className="text-sm text-muted-foreground">
        Performance is the largest loss: the plant ran at 87.4 % of its sustainable rate while the recompressor was down.
      </p>
    </Panel>
  );
}

function ProdOeeFactorRings() {
  return (
    <Panel title="OEE factors" meta="Last 24 hours">
      <OeeBreakdown layout="rings" {...FACTORS} />
    </Panel>
  );
}

function ProdOeeFactorBars() {
  const rows = [
    { key: 'availability', label: 'Availability' },
    { key: 'performance', label: 'Performance' },
    { key: 'quality', label: 'Quality' },
  ] as const;
  return (
    <Panel title="Factors against target" meta="Tick marks the target">
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-1.5">
            <LinearGauge label={row.label} value={FACTORS[row.key]} min={70} max={100} target={FACTOR_TARGETS[row.key]} unit="%" decimals={1} />
            <TrendDelta size="sm" value={FACTORS[row.key]} reference={FACTOR_TARGETS[row.key]} goodDirection="up" decimals={1} unit="pts" caption="to target" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ProdOeeLossWaterfall() {
  return (
    <Panel title="Loss waterfall" meta="OEE points, last 24 hours">
      <LossStack
        label="OEE losses, last 24 hours"
        start={{ label: 'Planned time', value: 100 }}
        losses={[
          { label: 'Availability loss', value: LOSSES.availabilityLoss },
          { label: 'Performance loss', value: LOSSES.performanceLoss },
          { label: 'Quality loss', value: LOSSES.qualityLoss },
        ]}
        resultLabel="OEE"
        unit="%"
      />
    </Panel>
  );
}

function ProdOeeLossStack() {
  return (
    <Panel title="Where the time went" meta="Share of planned time">
      <LossStack
        variant="stack"
        label="OEE and losses as a share of planned time"
        start={{ label: 'Planned time', value: 100 }}
        losses={[
          { label: 'Availability loss', value: LOSSES.availabilityLoss },
          { label: 'Performance loss', value: LOSSES.performanceLoss },
          { label: 'Quality loss', value: LOSSES.qualityLoss },
        ]}
        resultLabel="OEE"
        unit="%"
      />
    </Panel>
  );
}

function ProdOeeSixBigLosses() {
  return (
    <Panel title="Six big losses" meta="OEE points lost">
      <div className="flex flex-col gap-5">
        {SIX_BIG_LOSSES.map((group) => (
          <section key={group.factor} aria-label={`${group.factor} losses`} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <h4 className="font-medium text-medium-foreground">{group.factor}</h4>
              <span className="tabular-nums text-muted-foreground">{formatValue(group.points, 1)} pts</span>
            </div>
            <ShareBarList label={`${group.factor} losses in OEE points`} items={group.items} unit="pts" decimals={1} max={9} />
          </section>
        ))}
      </div>
    </Panel>
  );
}

function ProdOeeDefermentByCause() {
  const total = DEFERMENT.reduce((sum, item) => sum + item.value, 0);
  return (
    <Panel title="Deferment by cause" meta="1–12 March">
      <div className="flex items-baseline gap-3">
        <ValueReadout size="md" value={total} unit="kSm³" />
        <span className="text-xs text-muted-foreground tabular-nums">{formatValue((total / (PLAN_TO_DATE * 1000)) * 100, 1)} % of planned export</span>
      </div>
      <ShareBarList label="Deferred production by cause, 1 to 12 March" items={DEFERMENT} unit="kSm³" showShare />
    </Panel>
  );
}

function ProdOeeTargetAttainment() {
  const share = attainment(KPI.gasExport.value, DAILY_PLAN);
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <span className="text-xs text-muted-foreground">Plan attainment, today</span>
      <ValueReadout size="md" value={share} unit="%" decimals={1} />
      <LinearGauge showHeader={false} size="sm" label="Gas export against plan" value={share} min={80} max={110} target={100} unit="%" decimals={1} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TrendDelta value={KPI.gasExport.value} reference={DAILY_PLAN} goodDirection="up" decimals={2} caption="vs plan" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatValue(KPI.gasExport.value, 2)} of {formatValue(DAILY_PLAN, 2)} MSm³/d
        </span>
      </div>
    </Card>
  );
}

function ProdOeeTaktRate() {
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <span className="text-xs text-muted-foreground">Production rate</span>
      <ValueReadout size="md" value={182.4} unit="kSm³/h" decimals={1} />
      <LinearGauge showHeader={false} size="sm" label="Production rate against plan rate" value={182.4} min={150} max={210} target={187.5} unit="kSm³/h" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Plan rate</dt>
          <dd className="whitespace-nowrap tabular-nums text-base-foreground">187.5 kSm³/h</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Catch-up rate to 06:00</dt>
          <dd className="whitespace-nowrap tabular-nums text-base-foreground">191.3 kSm³/h</dd>
        </div>
      </dl>
    </Card>
  );
}

function ProdOeeShiftProgress() {
  const shift = SHIFTS[2];
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Day shift, 07:00–19:00</span>
        <StatusIndicator size="sm" tone="success" label="In progress" />
      </div>
      <ValueReadout size="md" value={shift.produced} unit="MSm³" decimals={2} />
      <LinearGauge showHeader={false} size="sm" label="Shift production against shift plan" value={shift.produced} max={2.25} target={shift.plan} unit="MSm³" decimals={2} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TrendDelta value={shift.produced} reference={shift.plan} goodDirection="up" decimals={2} caption="vs plan so far" />
        <span className="text-xs text-muted-foreground tabular-nums">7 of 12 h · shift plan 2.25</span>
      </div>
    </Card>
  );
}

function ProdOeeVsPlanDaily() {
  return (
    <Panel title="Gas export against plan" meta="MSm³ per day · dashed line is the plan, 4.50">
      <div className="h-56 w-full">
        <ChartContainer
          config={SHIFT_CONFIG}
          className={CHART_FRAME}
          aria-label="Gas export per day for 7 days, split by day and night shift, against a plan of 4.5 million cubic metres; 5 of 7 days are below plan"
        >
          <BarChart data={SHIFT_SPLIT} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} MSm³`} />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <Bar dataKey="day" stackId="shift" fill="var(--color-day)" isAnimationActive={false} />
            <Bar dataKey="night" stackId="shift" fill="var(--color-night)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <ReferenceLine y={DAILY_PLAN} stroke="var(--color-chart-neutral-450)" strokeDasharray="4 4" />
          </BarChart>
        </ChartContainer>
      </div>
    </Panel>
  );
}

function ProdOeeCumulativeVsPlan() {
  return (
    <Panel title="Cumulative export against plan" meta="March, MSm³">
      <div className="h-48 w-full">
        <ChartContainer
          config={CUMULATIVE_CONFIG}
          className={CHART_FRAME}
          aria-label="Cumulative gas export for March against plan; after 12 days actual is 52.77 against 54.00 million cubic metres planned"
        >
          <LineChart data={CUMULATIVE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} ticks={[1, 5, 10, 15, 20, 25, 31]} />
            <YAxis domain={[0, 150]} ticks={[0, 50, 100, 150]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} MSm³`} labelFormatter={(value) => `${String(value)} March`} />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <Line dataKey="plan" type="linear" stroke="var(--color-plan)" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="actual" type="linear" stroke="var(--color-actual)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TrendDelta value={MONTH_TO_DATE} reference={PLAN_TO_DATE} goodDirection="up" decimals={2} unit="MSm³" caption="vs plan to date" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatValue(MONTH_TO_DATE, 2)} of {formatValue(PLAN_TO_DATE, 2)} MSm³
        </span>
      </div>
    </Panel>
  );
}

function ProdOeeCalendarStrip() {
  return (
    <Panel title="Production calendar" meta="March 2026 · attainment of daily plan, %">
      <div className="overflow-x-auto">
        <ol aria-label="Plan attainment per day, March 2026" className="grid min-w-176 grid-cols-[repeat(31,minmax(0,1fr))] gap-1">
          {CALENDAR.map((cell) => (
            <li
              key={cell.day}
              aria-label={`${cell.day} March: ${cell.kind === 'shutdown' ? 'planned shutdown' : cell.value === null ? 'planned' : `${formatValue(cell.value, 0)} % of plan`}`}
              className="flex flex-col items-center gap-1"
            >
              <span aria-hidden="true" className="text-xs leading-none text-muted-foreground">
                {cell.weekday}
              </span>
              <span className={`flex h-9 w-full items-center justify-center rounded-md text-xs tabular-nums ${CALENDAR_CELL[cell.kind]}`}>
                {cell.kind === 'shutdown' ? 'SD' : cell.value === null ? '' : formatValue(cell.value, 0)}
              </span>
              <span aria-hidden="true" className="text-xs leading-none tabular-nums text-medium-foreground">
                {cell.day}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-medium-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-xs bg-chart-neutral-100" />
          On plan, 98 or above
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-xs bg-warning-background" />
          Below plan, 95 to 97
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-xs bg-critical-background" />
          Well below plan, under 95
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-xs outline-2 -outline-offset-2 outline-base-foreground" />
          Today, so far
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-xs bg-neutral-background" />
          SD · planned shutdown
        </li>
      </ul>
    </Panel>
  );
}

function DowntimeSummary({ event }: { event: DowntimeEvent }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-base-foreground">{event.equipment}</span>
        <span className="font-mono text-xs text-muted-foreground">{event.tag}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className={CODE}>{event.code}</span>
        <span>{event.cause}</span>
      </div>
    </div>
  );
}

function ProdOeeDowntimeRow() {
  const event = DOWNTIME_LOG[2];
  return (
    <Card className="w-full min-w-0 flex-row items-center gap-4">
      <DowntimeSummary event={event} />
      <dl className="flex shrink-0 gap-6 text-right">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Duration</dt>
          <dd className="text-sm tabular-nums text-base-foreground">{event.duration}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Deferred</dt>
          <dd className="text-sm tabular-nums text-base-foreground">{event.deferred} kSm³</dd>
        </div>
      </dl>
    </Card>
  );
}

function ProdOeeDowntimeOpen() {
  const event = DOWNTIME_LOG[0];
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <StatusIndicator tone="critical" shape="diamond" label="Stopped" detail="since 13:46" pulse />
        <ValueReadout size="sm" value={14} unit="min" tone="critical" />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-base-foreground">{event.equipment}</span>
        <span className="font-mono text-xs text-muted-foreground">{event.tag}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">No cause code yet. Suggested from the trip alarm: {event.code}.</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Pick another cause
          </Button>
          <Button variant="secondary" size="sm">
            Confirm {event.code}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProdOeeDowntimeLog() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Downtime log, last 7 days" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Start
            </th>
            <th scope="col" className={TH}>
              Equipment
            </th>
            <th scope="col" className={TH}>
              Cause
            </th>
            <th scope="col" className={TH}>
              Type
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Duration
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Deferred
            </th>
          </tr>
        </thead>
        <tbody>
          {DOWNTIME_LOG.map((event, index) => (
            <tr key={event.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{event.when}</td>
              <td className={TD}>
                <span className="text-base-foreground">{event.equipment}</span>
                <span className="pl-2 font-mono text-xs text-muted-foreground">{event.tag}</span>
              </td>
              <td className={TD}>
                <span className="flex items-center gap-2 text-medium-foreground">
                  <span className={CODE}>{event.code}</span>
                  {event.cause}
                </span>
              </td>
              <td className={`${TD} text-medium-foreground`}>{event.planned ? 'Planned' : 'Unplanned'}</td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                {index === 0 ? <StatusIndicator size="sm" tone="critical" shape="diamond" label={event.duration} /> : <span className="text-base-foreground">{event.duration}</span>}
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-base-foreground`}>
                {event.deferred === 0 ? <span className="text-muted-foreground">None</span> : `${event.deferred} kSm³`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProdOeeDowntimePareto() {
  return (
    <Panel title="Top downtime causes" meta="Hours, last 30 days · 100 h in total">
      <div className="h-60 w-full">
        <ChartContainer
          config={PARETO_CONFIG}
          className={CHART_FRAME}
          aria-label="Pareto of downtime by cause group over 30 days; mechanical, planned and process causes account for 81 percent of 100 hours"
        >
          <ComposedChart data={PARETO} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="cause" tickLine={false} axisLine={false} />
            <YAxis yAxisId="hours" domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} tickLine={false} axisLine={false} width={24} />
            <YAxis yAxisId="share" orientation="right" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickLine={false} axisLine={false} width={44} unit="%" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <ReferenceLine yAxisId="share" y={80} stroke="var(--color-chart-neutral-300)" strokeDasharray="4 4" />
            <Bar yAxisId="hours" dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Line
              yAxisId="share"
              dataKey="cumulative"
              type="linear"
              stroke="var(--color-cumulative)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-cumulative)' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </Panel>
  );
}

function ProdOeeDowntimeSplit() {
  return (
    <Panel title="Planned and unplanned" meta="Last 30 days">
      <ValueReadout size="md" value={100} unit="h down" />
      <ShareBarList
        label="Downtime hours, planned against unplanned"
        items={[
          { id: 'unplanned', label: 'Unplanned', value: 74 },
          { id: 'planned', label: 'Planned', value: 26 },
        ]}
        unit="h"
        showShare
        max={100}
      />
      <p className="text-xs text-muted-foreground">Target is under 60 % unplanned.</p>
    </Panel>
  );
}

function ProdOeeShiftScoreboard() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
      {SHIFTS.map((shift) => (
        <Card key={shift.id} role="group" aria-label={`${shift.name}, ${shift.window}`} className="min-w-0 gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-medium text-base-foreground">{shift.name}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{shift.window}</span>
            </div>
            <StatusIndicator size="sm" tone={shift.state.tone} label={shift.state.label} shape={shift.state.tone === 'neutral' ? 'square' : 'dot'} />
          </div>
          <div className="flex items-end justify-between gap-3">
            <ValueReadout size="lg" value={shift.produced} unit="MSm³" decimals={2} />
            <TrendDelta value={shift.produced} reference={shift.plan} goodDirection="up" decimals={2} caption="vs plan" />
          </div>
          <LinearGauge showHeader={false} size="sm" label={`${shift.name} production against plan`} value={shift.produced} max={2.4} target={shift.plan} unit="MSm³" decimals={2} />
          <dl className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">OEE</dt>
              <dd>
                <ValueReadout size="xs" value={shift.oee} unit="%" decimals={1} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Downtime</dt>
              <dd className="text-sm font-medium tabular-nums text-base-foreground">{shift.downtime}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Alarms</dt>
              <dd className="text-sm font-medium tabular-nums text-base-foreground">{shift.alarms}</dd>
            </div>
          </dl>
          <span className="text-xs text-muted-foreground">Supervisor {shift.supervisor}</span>
        </Card>
      ))}
    </div>
  );
}

function ProdOeeLineComparison() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="OEE by site, last 24 hours" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Site
            </th>
            <th scope="col" className={`${TH} w-1/4`}>
              OEE
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Availability
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Performance
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Quality
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Output vs plan
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Downtime, 30 d
            </th>
          </tr>
        </thead>
        <tbody>
          {SITE_COMPARISON.map((row) => (
            <tr key={row.site} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-medium text-base-foreground`}>
                {row.site}
              </th>
              <td className={TD}>
                <div className="flex items-center gap-3">
                  <LinearGauge className="flex-1" showHeader={false} size="sm" label={`${row.site} OEE`} value={row.oee} min={60} max={100} target={KPI.oee.target} unit="%" decimals={1} />
                  <ValueReadout size="xs" value={row.oee} unit="%" decimals={1} />
                </div>
              </td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.availability, 1)} %</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.performance, 1)} %</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.quality, 1)} %</td>
              <td className={`${TD} text-right`}>
                <TrendDelta size="sm" value={row.output} reference={row.plan} format="percent" goodDirection="up" decimals={1} />
              </td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.downtime, 1)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProdOeeDailyReport() {
  const products = [
    { name: 'Gas export', unit: 'MSm³', actual: 4.21, plan: 4.5, monthToDate: 48.39, decimals: 2 },
    { name: 'Condensate', unit: 'Sm³', actual: 1184, plan: 1250, monthToDate: 13420, decimals: 0 },
    { name: 'NGL', unit: 't', actual: 312, plan: 320, monthToDate: 3498, decimals: 0 },
  ];
  return (
    <Card className="w-full min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Daily production report</h3>
          <span className="text-xs text-muted-foreground tabular-nums">Nordkapp · production day 11 March 2026, 06:00–06:00</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator variant="badge" tone="info" label="Awaiting approval" />
          <Button variant="secondary" size="sm">
            Approve report
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Gas export</dt>
          <dd>
            <ValueReadout size="md" value={4.21} unit="MSm³" decimals={2} />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Plan attainment</dt>
          <dd>
            <ValueReadout size="md" value={attainment(4.21, DAILY_PLAN)} unit="%" decimals={1} tone="warning" />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">OEE</dt>
          <dd>
            <ValueReadout size="md" value={79.8} unit="%" decimals={1} />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Deferment</dt>
          <dd>
            <ValueReadout size="md" value={290} unit="kSm³" />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Flaring</dt>
          <dd>
            <ValueReadout size="md" value={14.1} unit="kSm³" decimals={1} />
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="overflow-x-auto lg:col-span-3">
          <table aria-label="Production by product" className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Product
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Actual
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Plan
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Variance
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Month to date
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.name} className="border-t border-default">
                  <th scope="row" className={`${TD} text-left font-medium text-base-foreground`}>
                    {product.name}
                    <span className="pl-2 text-xs font-normal text-muted-foreground">{product.unit}</span>
                  </th>
                  <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(product.actual, product.decimals)}</td>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(product.plan, product.decimals)}</td>
                  <td className={`${TD} text-right tabular-nums text-critical-foreground-strong`}>{formatDelta(product.actual - product.plan, product.decimals)}</td>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(product.monthToDate, product.decimals)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <h4 className="text-xs font-medium text-muted-foreground">Main events</h4>
          <ul className="flex flex-col gap-2 text-sm text-medium-foreground">
            <li>
              <span className="pr-2 tabular-nums text-muted-foreground">08:10</span>Cooling water pump <span className="font-mono text-xs">40-PA-4001</span> out for planned maintenance, 6 h 20 min.
            </li>
            <li>
              <span className="pr-2 tabular-nums text-muted-foreground">09:05</span>Export rate reduced to 172 kSm³/h while one cooling water pump was unavailable.
            </li>
            <li>
              <span className="pr-2 tabular-nums text-muted-foreground">14:30</span>Pump back in service, full rate restored at 15:10.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-default pt-4 text-xs text-muted-foreground">
        <span>Prepared by Liv Wold, shift supervisor · 12 Mar, 06:40</span>
        <span>Approver Magnus Solberg · not yet approved</span>
      </div>
    </Card>
  );
}

function ProdOeeOverviewPanel() {
  return (
    <Card className="w-full min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Production overview</h3>
          <span className="text-xs text-muted-foreground">Nordkapp · last 24 hours</span>
        </div>
        <StatusIndicator variant="badge" tone="warning" label="OEE below target" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section aria-label="OEE" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">OEE</span>
              <ValueReadout size="xl" value={oee(FACTORS)} unit="%" decimals={1} />
            </div>
            <TrendDelta value={KPI.oee.value} reference={KPI.oee.target} goodDirection="up" decimals={1} unit="pts" caption="to target" />
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs text-muted-foreground">Availability</dt>
              <dd>
                <ValueReadout size="sm" value={FACTORS.availability} unit="%" decimals={1} />
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs text-muted-foreground">Performance</dt>
              <dd>
                <ValueReadout size="sm" value={FACTORS.performance} unit="%" decimals={1} />
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs text-muted-foreground">Quality</dt>
              <dd>
                <ValueReadout size="sm" value={FACTORS.quality} unit="%" decimals={1} />
              </dd>
            </div>
          </dl>
        </section>
        <section aria-label="Losses" className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Losses, OEE points</h4>
          <LossStack
            label="OEE losses, last 24 hours"
            start={{ label: 'Planned time', value: 100 }}
            losses={[
              { label: 'Availability', value: LOSSES.availabilityLoss },
              { label: 'Performance', value: LOSSES.performanceLoss },
              { label: 'Quality', value: LOSSES.qualityLoss },
            ]}
            resultLabel="OEE"
          />
        </section>
        <section aria-label="Top deferment causes" className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Deferment, month to date</h4>
          <ShareBarList label="Deferred production by cause" items={DEFERMENT.slice(0, 4)} unit="kSm³" />
        </section>
      </div>
    </Card>
  );
}

export default definePage({
  id: 'production-and-oee',
  title: 'Production and OEE',
  summary:
    'The kit for a production performance app: OEE and its three factors, where the losses went, output against plan by day and shift, and downtime with cause codes. Every figure is derived from the same factors, so the tile, the equation and the waterfall always agree.',
  guidance: {
    use: [
      'Show OEE with its factors: a bare percentage hides whether stops, rate or quality is the problem.',
      'Order losses the way they occur: availability, then performance, then quality.',
      'Compare output with the plan for the same period, and say which period it is.',
      'Give every downtime event a cause code, and make an uncoded event easy to code.',
    ],
    avoid: [
      'Colouring OEE green above an arbitrary number; judge it against its target only.',
      'A Pareto with more than seven bars; group the tail as "Other".',
      'Mixing planned and unplanned downtime in one total without the split.',
      'Rounding factors separately from the OEE they multiply to.',
    ],
  },
  source,
  sections: [
    {
      id: 'oee',
      title: 'OEE and factors',
      description: 'The headline number, then the availability × performance × quality that produces it.',
      specimens: [
        {
          id: 'ProdOeeTile',
          title: 'OEE tile',
          note: 'Pick it for the headline on a dashboard, with target, change and a 30-day trend.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          Component: ProdOeeTile,
        },
        {
          id: 'ProdOeeEquationTile',
          title: 'A × P × Q breakdown',
          note: 'Pick it when people ask why OEE moved: the equation shows which factor carries the loss.',
          origin: 'custom',
          uses: ['industrial/domains/OeeBreakdown.tsx', 'industrial/domains/oee.ts'],
          size: 'lg',
          align: 'stretch',
          Component: ProdOeeEquationTile,
        },
        {
          id: 'ProdOeeFactorRings',
          title: 'Factor rings',
          note: 'Pick it for a wall display, where the three shares must read from a distance.',
          origin: 'custom',
          uses: ['industrial/domains/OeeBreakdown.tsx', 'industrial/ProgressRing.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeFactorRings,
        },
        {
          id: 'ProdOeeFactorBars',
          title: 'Factors against target',
          note: 'Pick it when each factor has its own target and the gap to it is what gets discussed.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeFactorBars,
        },
      ],
    },
    {
      id: 'losses',
      title: 'Losses',
      description: 'Where the distance between planned time and OEE went, from three factors down to six big losses and lost volume.',
      specimens: [
        {
          id: 'ProdOeeLossWaterfall',
          title: 'Loss waterfall',
          note: 'Pick it to walk from planned time down to OEE, one loss at a time.',
          origin: 'custom',
          uses: ['industrial/domains/LossStack.tsx', 'industrial/domains/oee.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeLossWaterfall,
        },
        {
          id: 'ProdOeeLossStack',
          title: 'Loss stack',
          note: 'Pick it when space is tight: one bar for the split, a legend for the numbers.',
          origin: 'custom',
          uses: ['industrial/domains/LossStack.tsx', 'industrial/domains/oee.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeLossStack,
        },
        {
          id: 'ProdOeeSixBigLosses',
          title: 'Six big losses',
          note: 'Pick it for improvement work: two loss types per factor, on one scale so they compare.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx', 'industrial/domains/oee.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeSixBigLosses,
        },
        {
          id: 'ProdOeeDefermentByCause',
          title: 'Deferment by cause',
          note: 'Pick it when the loss should be read in volume rather than OEE points.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeDefermentByCause,
        },
      ],
    },
    {
      id: 'plan',
      title: 'Production against plan',
      description: 'Attainment now, by day and shift, cumulatively for the month and across the calendar.',
      specimens: [
        {
          id: 'ProdOeeTargetAttainment',
          title: 'Target attainment bar',
          note: 'Pick it for one output figure against its plan; the tick is 100 % of plan.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx', 'industrial/domains/oee.ts'],
          Component: ProdOeeTargetAttainment,
        },
        {
          id: 'ProdOeeTaktRate',
          title: 'Rate indicator',
          note: 'Pick it in the control room: current rate, plan rate and the rate needed to catch up.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProdOeeTaktRate,
        },
        {
          id: 'ProdOeeShiftProgress',
          title: 'Shift so far',
          note: 'Pick it for a running shift: produced so far against where the plan says it should be by now.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx', 'industrial/TrendDelta.tsx'],
          Component: ProdOeeShiftProgress,
        },
        {
          id: 'ProdOeeVsPlanDaily',
          title: 'Production against plan by shift',
          note: 'Pick it for the weekly review: each day split by shift with the plan as a line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ProdOeeVsPlanDaily,
        },
        {
          id: 'ProdOeeCumulativeVsPlan',
          title: 'Cumulative against plan',
          note: 'Pick it to see whether the month is recoverable: the gap between the lines is the volume to catch up.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeCumulativeVsPlan,
        },
        {
          id: 'ProdOeeCalendarStrip',
          title: 'Production calendar strip',
          note: 'Pick it to spot bad days and upcoming shutdowns in a month at a glance.',
          origin: 'custom',
          uses: ['industrial/domains/oee.ts'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeCalendarStrip,
        },
      ],
    },
    {
      id: 'downtime',
      title: 'Downtime',
      description: 'Stops with their cause codes, as single rows, a log and a ranking.',
      specimens: [
        {
          id: 'ProdOeeDowntimeRow',
          title: 'Downtime row',
          note: 'Pick it for one coded stop: what stopped, why, for how long and what it cost.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ProdOeeDowntimeRow,
        },
        {
          id: 'ProdOeeDowntimeOpen',
          title: 'Ongoing stop without a cause',
          note: 'Pick it while equipment is still down: the clock runs and the cause code is one click away.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProdOeeDowntimeOpen,
        },
        {
          id: 'ProdOeeDowntimeLog',
          title: 'Downtime log',
          note: 'Pick it for the shift handover: every stop of the week with cause code, type and deferred volume.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeDowntimeLog,
        },
        {
          id: 'ProdOeeDowntimePareto',
          title: 'Top downtime causes',
          note: 'Pick it to decide where to spend improvement effort: bars rank the causes, the line shows how few of them make up 80 %.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: ProdOeeDowntimePareto,
        },
        {
          id: 'ProdOeeDowntimeSplit',
          title: 'Planned against unplanned',
          note: 'Pick it next to a downtime total, so planned work is not read as failure.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx'],
          align: 'stretch',
          Component: ProdOeeDowntimeSplit,
        },
      ],
    },
    {
      id: 'shifts-and-sites',
      title: 'Shifts and units',
      description: 'The same figures side by side for shifts, lines, units or sites.',
      specimens: [
        {
          id: 'ProdOeeShiftScoreboard',
          title: 'Shift scoreboard',
          note: 'Pick it for the morning meeting: the last shifts with output, OEE, downtime and alarms.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeShiftScoreboard,
        },
        {
          id: 'ProdOeeLineComparison',
          title: 'Unit comparison table',
          note: 'Pick it to compare lines, units or sites on OEE and its factors against one target.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeLineComparison,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'Complete sections for a production dashboard and the daily report.',
      specimens: [
        {
          id: 'ProdOeeOverviewPanel',
          title: 'Production overview',
          note: 'Pick it as the top block of a production dashboard: OEE, its losses and the lost volume in one card.',
          origin: 'custom',
          uses: ['industrial/domains/LossStack.tsx', 'industrial/domains/ShareBarList.tsx', 'industrial/domains/oee.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeOverviewPanel,
        },
        {
          id: 'ProdOeeDailyReport',
          title: 'Daily production report',
          note: 'Pick it for the report a shift supervisor signs: figures, product table, main events and approval.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/domains/oee.ts'],
          size: 'full',
          align: 'stretch',
          Component: ProdOeeDailyReport,
        },
      ],
    },
  ],
});
