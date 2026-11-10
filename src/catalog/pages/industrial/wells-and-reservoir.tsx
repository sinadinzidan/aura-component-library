import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Card } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { BarrierStatus } from '../../../library/industrial/domains/BarrierStatus';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { declineSeries, monthsToLimit } from '../../../library/industrial/domains2/decline';
import { DeclineCurve } from '../../../library/industrial/domains2/DeclineCurve';
import { WellboreSchematic } from '../../../library/industrial/domains2/WellboreSchematic';
import { WellCard } from '../../../library/industrial/domains2/WellCard';
import { gasOilRatio, voidageReplacement, waterCut, wellStatus } from '../../../library/industrial/domains2/wells';
import type { WellState } from '../../../library/industrial/domains2/wells';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PLANT_KPIS } from '../../data/plant';
import { DAY, REFERENCE_NOW, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './wells-and-reservoir.tsx?raw';

const NOW = REFERENCE_NOW;
const MONTH = 30 * DAY;
const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type Well = {
  id: string;
  /** Well name as written in the field. */
  name: string;
  detail: string;
  state: WellState;
  /** Oil in Sm³/d, gas in kSm³/d, water in m³/d. Zero while the well is not producing. */
  oil: number;
  gas: number;
  water: number;
  /** Water injected in m³/d, for injectors. */
  injection: number;
  choke: number;
  tubingHeadPressure: number;
  /** Share of the last 30 days on stream, in percent. */
  uptime: number;
  seed: number;
};

/** The Nordkapp field wells that feed the plant. Producer gas adds up to the plant's 4.38 MSm³/d export. */
const WELLS: readonly Well[] = [
  { id: 'a-04', name: 'NK A-04 H', detail: 'Producer · natural flow', state: 'producing', oil: 1240, gas: 1180, water: 310, injection: 0, choke: 78, tubingHeadPressure: 92.4, uptime: 98.6, seed: 41 },
  { id: 'a-07', name: 'NK A-07', detail: 'Producer · gas lift', state: 'producing', oil: 860, gas: 760, water: 940, injection: 0, choke: 64, tubingHeadPressure: 71.2, uptime: 96.1, seed: 42 },
  { id: 'a-12', name: 'NK A-12 H', detail: 'Producer · ESP', state: 'producing', oil: 612, gas: 540, water: 388, injection: 0, choke: 100, tubingHeadPressure: 58.9, uptime: 91.4, seed: 43 },
  { id: 'a-15', name: 'NK A-15', detail: 'Producer · natural flow', state: 'shut-in', oil: 0, gas: 0, water: 0, injection: 0, choke: 0, tubingHeadPressure: 118.3, uptime: 61.0, seed: 44 },
  { id: 'b-02', name: 'NK B-02 H', detail: 'Producer · natural flow', state: 'producing', oil: 1480, gas: 1420, water: 120, injection: 0, choke: 82, tubingHeadPressure: 96.8, uptime: 99.2, seed: 45 },
  { id: 'b-05', name: 'NK B-05', detail: 'Producer · ESP', state: 'workover', oil: 0, gas: 0, water: 0, injection: 0, choke: 0, tubingHeadPressure: 0, uptime: 43.3, seed: 46 },
  { id: 'b-08', name: 'NK B-08 H', detail: 'Producer · gas lift', state: 'producing', oil: 505, gas: 480, water: 215, injection: 0, choke: 55, tubingHeadPressure: 66.0, uptime: 94.7, seed: 47 },
  { id: 'c-01', name: 'NK C-01 WI', detail: 'Water injector', state: 'injecting', oil: 0, gas: 0, water: 0, injection: 4200, choke: 70, tubingHeadPressure: 164.5, uptime: 97.8, seed: 48 },
  { id: 'c-03', name: 'NK C-03 WI', detail: 'Water injector', state: 'injecting', oil: 0, gas: 0, water: 0, injection: 3650, choke: 62, tubingHeadPressure: 158.1, uptime: 88.5, seed: 49 },
];

const PRODUCERS = WELLS.filter((well) => well.state === 'producing');
const FIELD_OIL = PRODUCERS.reduce((sum, well) => sum + well.oil, 0);
const FIELD_GAS = PRODUCERS.reduce((sum, well) => sum + well.gas, 0);
const FIELD_WATER = PRODUCERS.reduce((sum, well) => sum + well.water, 0);
const FIELD_INJECTION = WELLS.reduce((sum, well) => sum + well.injection, 0);

function wellsReservoirWell(id: string): Well {
  const well = WELLS.find((candidate) => candidate.id === id);
  if (!well) throw new Error(`Unknown well ${id}`);
  return well;
}

function wellsReservoirOilTrend(well: Well): number[] {
  if (well.oil === 0) return makeValues({ seed: well.seed, points: 30, base: 0, stepMs: DAY });
  return [...makeValues({ seed: well.seed, points: 29, base: well.oil * 1.05, drift: -well.oil * 0.05, noise: well.oil * 0.012, stepMs: DAY, decimals: 0 }), well.oil];
}

const A12 = wellsReservoirWell('a-12');
const A04 = wellsReservoirWell('a-04');

/** Arps fit for NK A-12 H: 13 months of allocated oil, then four years of forecast on the same curve. */
const DECLINE_FIT = { initialRate: 1010, declineRate: 0.048, exponent: 0.45 };
const ECONOMIC_LIMIT = 180;
const HISTORY_MONTHS = 13;
const DECLINE_NOISE = makeValues({ seed: 51, points: HISTORY_MONTHS, base: 0, noise: 14, stepMs: MONTH, decimals: 0 });
const DECLINE_HISTORY = declineSeries({ ...DECLINE_FIT, months: HISTORY_MONTHS, start: NOW - (HISTORY_MONTHS - 1) * MONTH }).map((point, index) => ({
  t: point.t,
  v: index === HISTORY_MONTHS - 1 ? point.v : point.v + DECLINE_NOISE[index],
}));
const DECLINE_FORECAST = declineSeries({ ...DECLINE_FIT, months: 49, start: NOW, offsetMonths: HISTORY_MONTHS - 1 });
const MONTHS_LEFT = (monthsToLimit(DECLINE_FIT, ECONOMIC_LIMIT) ?? 0) - (HISTORY_MONTHS - 1);

/** Datum reservoir pressure in bar, monthly for three years. Injection started in month 14. */
const RESERVOIR_PRESSURE = makeSeries({ seed: 52, points: 36, base: 312, drift: -34, noise: 0.8, stepMs: MONTH, decimals: 1 }).map((point, index) => ({
  t: point.t,
  v: index < 14 ? point.v : Math.round((point.v + (index - 14) * 0.6) * 10) / 10,
}));
const RESERVOIR_PRESSURE_NOW = RESERVOIR_PRESSURE[RESERVOIR_PRESSURE.length - 1].v;
const BUBBLE_POINT = 268;

/** Reservoir volumes per month in thousand m³: what left the reservoir and what was put back. */
const VOIDAGE = [
  { month: 'Oct', produced: 318, injected: 262 },
  { month: 'Nov', produced: 311, injected: 271 },
  { month: 'Dec', produced: 322, injected: 290 },
  { month: 'Jan', produced: 316, injected: 301 },
  { month: 'Feb', produced: 287, injected: 268 },
  { month: 'Mar', produced: 304, injected: 236 },
].map((row) => ({ ...row, ratio: Math.round((voidageReplacement(row.injected, row.produced) ?? 0) * 100) / 100 }));

type WellTest = {
  id: string;
  well: string;
  date: string;
  hours: number;
  oil: number;
  gas: number;
  water: number;
  /** Oil rate against the previous accepted test, in percent. */
  change: number;
  verdict: { tone: Tone; label: string; shape: 'dot' | 'square' | 'diamond' | 'ring' };
};

const WELL_TESTS: readonly WellTest[] = [
  { id: 'wt-2261', well: 'NK A-12 H', date: '11 Mar', hours: 8, oil: 612, gas: 540, water: 388, change: -3.2, verdict: { tone: 'success', label: 'Accepted', shape: 'dot' } },
  { id: 'wt-2258', well: 'NK A-07', date: '9 Mar', hours: 6, oil: 860, gas: 760, water: 940, change: -6.9, verdict: { tone: 'warning', label: 'Review water cut', shape: 'square' } },
  { id: 'wt-2254', well: 'NK B-02 H', date: '6 Mar', hours: 8, oil: 1480, gas: 1420, water: 120, change: 0.8, verdict: { tone: 'success', label: 'Accepted', shape: 'dot' } },
  { id: 'wt-2251', well: 'NK B-08 H', date: '4 Mar', hours: 4, oil: 471, gas: 455, water: 230, change: -11.4, verdict: { tone: 'critical', label: 'Rejected, unstable', shape: 'diamond' } },
  { id: 'wt-2247', well: 'NK A-04 H', date: '1 Mar', hours: 8, oil: 1240, gas: 1180, water: 310, change: -1.1, verdict: { tone: 'success', label: 'Accepted', shape: 'dot' } },
];

/** Gas allocation for 11 March: test-based theoretical rates scaled to the fiscal export meter. */
const EXPORT_METERED = PLANT_KPIS.gasExport.value * 1000;
const THEORETICAL_GAS = [1215, 790, 552, 1468, 496];
const ALLOCATION_FACTOR = EXPORT_METERED / THEORETICAL_GAS.reduce((sum, value) => sum + value, 0);
const ALLOCATION = PRODUCERS.map((well, index) => ({
  well: well.name,
  theoretical: THEORETICAL_GAS[index],
  allocated: Math.round(THEORETICAL_GAS[index] * ALLOCATION_FACTOR),
  share: (THEORETICAL_GAS[index] / THEORETICAL_GAS.reduce((sum, value) => sum + value, 0)) * 100,
}));

/** Flowing gradient survey in NK A-04 H, 2 March. */
const DEPTH_PROFILE = [
  { depth: 0, pressure: 92, temperature: 38 },
  { depth: 400, pressure: 118, temperature: 47 },
  { depth: 800, pressure: 143, temperature: 56 },
  { depth: 1200, pressure: 167, temperature: 66 },
  { depth: 1600, pressure: 191, temperature: 75 },
  { depth: 2000, pressure: 216, temperature: 84 },
  { depth: 2400, pressure: 242, temperature: 93 },
  { depth: 2800, pressure: 266, temperature: 101 },
  { depth: 3100, pressure: 284, temperature: 106 },
];

const PROFILE_CONFIG = {
  pressure: { label: 'Pressure (bar)', color: chartSeriesColor(1) },
  temperature: { label: 'Temperature (°C)', color: chartSeriesColor(2) },
} satisfies ChartConfig;

/** Drilling of NK B-09 H: planned depth per day, and the actual depth up to day 27. */
const DRILL_PLAN_DEPTHS = [0, 180, 420, 420, 420, 760, 1090, 1400, 1400, 1400, 1400, 1650, 1930, 2200, 2470, 2720, 2960, 3200, 3200, 3200, 3200, 3340, 3480, 3610, 3740, 3860, 3970, 4060, 4150, 4150, 4150];
const DRILL_ACTUAL_DEPTHS = [0, 170, 410, 420, 420, 700, 1010, 1330, 1400, 1400, 1400, 1400, 1560, 1840, 2110, 2380, 2380, 2380, 2640, 2900, 3140, 3200, 3200, 3200, 3200, 3310, 3440, 3560];
const DRILLING = DRILL_PLAN_DEPTHS.map((plan, day) => ({ day, plan, actual: day < DRILL_ACTUAL_DEPTHS.length ? DRILL_ACTUAL_DEPTHS[day] : null }));
const DRILL_DAY = DRILL_ACTUAL_DEPTHS.length - 1;
const DRILL_DEPTH = DRILL_ACTUAL_DEPTHS[DRILL_DAY];
const DRILL_TOTAL = DRILL_PLAN_DEPTHS[DRILL_PLAN_DEPTHS.length - 1];

const DRILLING_CONFIG = {
  plan: { label: 'Plan', color: 'var(--color-chart-neutral-400)' },
  actual: { label: 'Actual', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Electric submersible pump in NK A-12 H. */
const ESP_READINGS = [
  { label: 'Drive frequency', value: 52.5, unit: 'Hz', min: 30, max: 65, limits: { low: 35, high: 60 }, decimals: 1 },
  { label: 'Motor current', value: 41.8, unit: 'A', min: 0, max: 60, limits: { low: 22, high: 48 }, decimals: 1 },
  { label: 'Intake pressure', value: 64.2, unit: 'bar', min: 0, max: 150, limits: { low: 55, high: 120 }, decimals: 1 },
  { label: 'Motor temperature', value: 131.0, unit: '°C', min: 60, max: 180, limits: { high: 150, highHigh: 165 }, decimals: 1 },
  { label: 'Vibration', value: 2.9, unit: 'mm/s', min: 0, max: 8, limits: { high: 2.5, highHigh: 5 }, decimals: 1 },
];

/** Annulus pressures of NK A-07 against their maximum allowable (MAASP). */
const ANNULI = [
  { id: 'A', name: 'A annulus', value: 86, maasp: 140 },
  { id: 'B', name: 'B annulus', value: 61, maasp: 68 },
  { id: 'C', name: 'C annulus', value: 4, maasp: 35 },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap tabular-nums text-base-foreground">{children}</dd>
    </div>
  );
}

function WellsReservoirStatusTile() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium text-base-foreground">{A04.name}</span>
        <StatusIndicator size="sm" {...wellStatus(A04.state)} detail="12 d" />
      </div>
      <ValueReadout size="md" value={A04.oil} unit="Sm³/d oil" />
      <Sparkline values={wellsReservoirOilTrend(A04)} label={`${A04.name} oil rate, last 30 days`} variant="area" height={36} unit="Sm³/d" showLast />
      <TrendDelta size="sm" value={A04.oil} reference={1302} format="percent" decimals={1} goodDirection="up" caption="vs 30 days ago" />
    </Card>
  );
}

function WellsReservoirStatusStates() {
  const rows: { state: WellState; meaning: string }[] = [
    { state: 'producing', meaning: 'Flowing to the plant' },
    { state: 'injecting', meaning: 'Water or gas into the reservoir' },
    { state: 'shut-in', meaning: 'Closed at the tree, can be opened' },
    { state: 'workover', meaning: 'Rig or intervention on the well' },
  ];
  return (
    <ul aria-label="Well states" className="flex w-full max-w-72 flex-col gap-3">
      {rows.map((row) => (
        <li key={row.state} className="flex flex-col gap-0.5">
          <StatusIndicator {...wellStatus(row.state)} />
          <span className="pl-4 text-xs text-muted-foreground">{row.meaning}</span>
        </li>
      ))}
    </ul>
  );
}

function WellsReservoirStatusCounts() {
  const count = (state: WellState) => WELLS.filter((well) => well.state === state).length;
  return (
    <Card className="w-full max-w-72 gap-3">
      <span className="text-xs text-muted-foreground">Nordkapp field wells</span>
      <ValueReadout size="md" value={count('producing')} unit={`of ${WELLS.length} producing`} />
      <DistributionBar
        size="sm"
        label="Wells by state"
        segments={[
          { id: 'producing', label: 'Producing', value: count('producing'), tone: 'success' },
          { id: 'injecting', label: 'Injecting', value: count('injecting'), tone: 'info' },
          { id: 'shut-in', label: 'Shut in', value: count('shut-in'), tone: 'neutral' },
          { id: 'workover', label: 'Workover', value: count('workover'), tone: 'warning' },
        ]}
      />
    </Card>
  );
}

function WellsReservoirCard() {
  return (
    <div className="w-full max-w-80">
      <WellCard
        name={A12.name}
        detail={A12.detail}
        state={A12.state}
        rates={{ oil: A12.oil, gas: A12.gas, water: A12.water }}
        choke={A12.choke}
        tubingHeadPressure={A12.tubingHeadPressure}
        trend={wellsReservoirOilTrend(A12)}
        trendLabel={`${A12.name} oil rate, last 30 days`}
      />
    </div>
  );
}

function WellsReservoirChokeReadout() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Production choke</span>
        <span className="font-mono text-xs text-muted-foreground">13-HCV-0412</span>
      </div>
      <ValueReadout size="md" value={76.4} unit="% open" decimals={1} />
      <LinearGauge showHeader={false} showScale label="Choke position against setpoint" value={76.4} target={78} unit="%" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Setpoint">78.0 %</Fact>
        <Fact label="Deviation">−1.6 %</Fact>
        <Fact label="Mode">Remote, manual</Fact>
        <Fact label="Last moved">12 Mar, 09:42</Fact>
      </dl>
    </Card>
  );
}

function WellsReservoirArtificialLift() {
  return (
    <Card className="w-full max-w-80 gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-base-foreground">ESP, {A12.name}</span>
          <span className="text-xs text-muted-foreground">Run life 412 days</span>
        </div>
        <StatusIndicator size="sm" tone="warning" label="Vibration high" shape="square" />
      </div>
      <div className="flex flex-col gap-3">
        {ESP_READINGS.map((reading) => (
          <RangeIndicator key={reading.label} label={reading.label} value={reading.value} unit={reading.unit} min={reading.min} max={reading.max} limits={reading.limits} decimals={reading.decimals} />
        ))}
      </div>
    </Card>
  );
}

function WellsReservoirTestRows() {
  return (
    <Panel title="Well tests" meta="Test separator 20-VA-1002 · March">
      <ul aria-label="Well test results" className="flex w-full flex-col">
        {WELL_TESTS.map((test) => (
          <li key={test.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-default py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex w-28 flex-col gap-0.5">
              <span className="font-mono text-sm text-base-foreground">{test.well}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {test.date} · {test.hours} h
              </span>
            </div>
            <dl className="flex gap-5 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Oil</dt>
                <dd className="tabular-nums text-base-foreground">{formatValue(test.oil)} Sm³/d</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Water cut</dt>
                <dd className="tabular-nums text-base-foreground">{formatValue(waterCut(test.oil, test.water), 1)} %</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">GOR</dt>
                <dd className="tabular-nums text-base-foreground">{formatValue(gasOilRatio(test.gas * 1000, test.oil))}</dd>
              </div>
            </dl>
            <TrendDelta size="sm" value={100 + test.change} reference={100} decimals={1} unit="%" goodDirection="up" caption="oil vs last test" />
            <StatusIndicator size="sm" {...test.verdict} className="ml-auto" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function WellsReservoirUptimeBars() {
  const items = [...WELLS]
    .sort((a, b) => b.uptime - a.uptime)
    .map((well) => ({ id: well.id, label: well.name, value: well.uptime, tone: well.uptime < 70 ? ('warning' as const) : undefined }));
  return (
    <Panel title="Uptime per well" meta="Last 30 days">
      <ShareBarList label="Share of the last 30 days each well was on stream" items={items} unit="%" decimals={1} max={100} />
    </Panel>
  );
}

function WellsReservoirListTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Nordkapp field wells with latest rates" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Well
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Oil, Sm³/d
            </th>
            <th scope="col" className={`${TH} w-32`}>
              30 days
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Gas, kSm³/d
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Water cut
            </th>
            <th scope="col" className={`${TH} text-right`}>
              THP, barg
            </th>
            <th scope="col" className={`${TH} w-36`}>
              Choke
            </th>
          </tr>
        </thead>
        <tbody>
          {WELLS.map((well) => {
            const flowing = well.state === 'producing';
            return (
              <tr key={well.id} className="border-t border-default">
                <td className={TD}>
                  <span className="block font-mono text-base-foreground">{well.name}</span>
                  <span className="block text-xs text-muted-foreground">{well.detail}</span>
                </td>
                <td className={TD}>
                  <StatusIndicator size="sm" {...wellStatus(well.state)} />
                </td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(flowing ? well.oil : null)}</td>
                <td className={TD}>{flowing ? <Sparkline values={wellsReservoirOilTrend(well)} label={`${well.name} oil rate, last 30 days`} height={24} unit="Sm³/d" /> : null}</td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(flowing ? well.gas : null)}</td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{flowing ? `${formatValue(waterCut(well.oil, well.water), 1)} %` : formatValue(null)}</td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(well.state === 'workover' ? null : well.tubingHeadPressure, 1)}</td>
                <td className={TD}>
                  <LinearGauge showHeader={false} size="sm" label={`${well.name} choke opening`} value={well.choke} unit="%" />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-emphasized">
            <th scope="row" colSpan={2} className={`${TD} text-left font-medium text-base-foreground`}>
              Field total, {PRODUCERS.length} producers
            </th>
            <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(FIELD_OIL)}</td>
            <td className={TD} />
            <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(FIELD_GAS)}</td>
            <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(waterCut(FIELD_OIL, FIELD_WATER), 1)} %</td>
            <td className={TD} colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function WellsReservoirAllocationTable() {
  return (
    <Panel title="Gas allocation, well to export" meta={`11 March · factor ${formatValue(ALLOCATION_FACTOR, 3)}`}>
      <table aria-label="Allocated gas per well against the export meter" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Well
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Theoretical
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Allocated
            </th>
            <th scope="col" className={`${TH} w-2/5 pr-0`}>
              Share of export
            </th>
          </tr>
        </thead>
        <tbody>
          {ALLOCATION.map((row) => (
            <tr key={row.well} className="border-t border-default">
              <td className={`${TD} pl-0 font-mono text-base-foreground`}>{row.well}</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.theoretical)}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(row.allocated)}</td>
              <td className={`${TD} pr-0`}>
                <div className="flex items-center gap-3">
                  <LinearGauge showHeader={false} size="sm" label={`${row.well} share of export`} value={row.share} max={40} unit="%" decimals={1} />
                  <span className="w-14 shrink-0 whitespace-nowrap text-right tabular-nums text-base-foreground">{formatValue(row.share, 1)} %</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-emphasized">
            <th scope="row" className={`${TD} pl-0 text-left font-medium text-base-foreground`}>
              Export meter
            </th>
            <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(THEORETICAL_GAS.reduce((sum, value) => sum + value, 0))}</td>
            <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(EXPORT_METERED)}</td>
            <td className={`${TD} pr-0 text-xs text-muted-foreground`}>kSm³/d, fiscal meter 27-FT-20011</td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

function WellsReservoirInjectionBalance() {
  return (
    <Panel title="Injection against production" meta="Reservoir volumes, thousand m³ per month">
      <CategoryChart
        label="Reservoir volume produced and injected per month with the voidage replacement ratio; injection fell to 78 percent of production in March"
        rows={VOIDAGE}
        categoryKey="month"
        series={[
          { key: 'produced', label: 'Produced', color: 'var(--color-chart-neutral-300)' },
          { key: 'injected', label: 'Injected' },
          { key: 'ratio', label: 'Voidage replacement', type: 'line', axis: 'right', color: chartSeriesColor(2) },
        ]}
        references={[{ value: 1, label: 'Target 1.00', axis: 'right', align: 'left' }]}
        rightDomain={[0, 1.2]}
        domain={[0, 480]}
        decimals={2}
        legend
        heightClassName="h-56"
        summary="C-03 WI was down for nine days in March, so the reservoir is not being topped up."
      />
    </Panel>
  );
}

function WellsReservoirVoidageTile() {
  const ratio = VOIDAGE[VOIDAGE.length - 1].ratio;
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Voidage replacement"
        value={ratio}
        decimals={2}
        status={{ tone: 'warning', label: 'Below target', shape: 'square' }}
        delta={{ reference: VOIDAGE[VOIDAGE.length - 2].ratio, goodDirection: 'up', caption: 'vs Feb', decimals: 2 }}
        target={{ value: 1 }}
        trend={{ values: VOIDAGE.map((row) => row.ratio), variant: 'bar', label: 'Voidage replacement ratio, last 6 months' }}
        footnote={`March to date · ${formatValue(FIELD_INJECTION)} m³/d injected today`}
      />
    </div>
  );
}

function WellsReservoirDeclineCurve() {
  return (
    <Panel title={`Oil rate decline, ${A12.name}`} meta="Sm³/d · monthly allocated rate">
      <DeclineCurve
        label={`Oil rate of ${A12.name} over 13 months with a four year hyperbolic forecast that reaches the economic limit of 180 cubic metres per day`}
        history={DECLINE_HISTORY}
        forecast={DECLINE_FORECAST}
        economicLimit={ECONOMIC_LIMIT}
        yDomain={[0, 1200]}
        historyLabel="Allocated oil"
        forecastLabel="Arps forecast"
        summary={`Hyperbolic fit, b = ${DECLINE_FIT.exponent}. The well reaches its economic limit in about ${MONTHS_LEFT} months.`}
      />
    </Panel>
  );
}

function WellsReservoirDeclineSummary() {
  const remaining = DECLINE_FORECAST.reduce((sum, point) => sum + point.v * 30, 0) / 1000;
  return (
    <Card className="w-full max-w-72 gap-3">
      <span className="text-xs text-muted-foreground">Decline fit, {A12.name}</span>
      <ValueReadout size="md" value={DECLINE_FIT.declineRate * 100} unit="% per month" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Model">Hyperbolic (Arps)</Fact>
        <Fact label="Initial rate">{formatValue(DECLINE_FIT.initialRate)} Sm³/d</Fact>
        <Fact label="Exponent b">{formatValue(DECLINE_FIT.exponent, 2)}</Fact>
        <Fact label="Economic limit">{formatValue(ECONOMIC_LIMIT)} Sm³/d</Fact>
        <Fact label="Months to limit">{formatValue(MONTHS_LEFT)}</Fact>
        <Fact label="Remaining, 4 years">{formatValue(remaining)} kSm³</Fact>
      </dl>
    </Card>
  );
}

function WellsReservoirPressureTrend() {
  return (
    <Panel title="Reservoir pressure" meta="At datum, 3,050 m TVD · monthly">
      <TrendChart
        label="Reservoir pressure at datum over three years, falling more slowly after water injection started, still above the bubble point of 268 bar"
        series={[{ key: 'pressure', label: 'Reservoir pressure', points: RESERVOIR_PRESSURE }]}
        limits={[{ value: BUBBLE_POINT, label: `Bubble point ${BUBBLE_POINT}`, tone: 'warning', align: 'left' }]}
        events={[{ t: RESERVOIR_PRESSURE[14].t, label: 'Injection starts' }]}
        yDomain={[250, 320]}
        unit="bar"
        decimals={1}
        maxTicks={6}
        formatTick={(timestamp) => new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(timestamp)}
        heightClassName="h-56"
        summary="Decline slowed from about 1.0 to 0.4 bar per month once C-01 and C-03 came on injection."
      />
    </Panel>
  );
}

function WellsReservoirPressureTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Reservoir pressure"
        value={RESERVOIR_PRESSURE_NOW}
        unit="bar"
        decimals={1}
        delta={{ reference: RESERVOIR_PRESSURE[RESERVOIR_PRESSURE.length - 13].v, goodDirection: 'up', caption: 'vs 12 months ago', decimals: 1 }}
        trend={{ values: RESERVOIR_PRESSURE.map((point) => point.v), label: 'Reservoir pressure, last 36 months', limit: BUBBLE_POINT }}
        footnote={`${formatValue(RESERVOIR_PRESSURE_NOW - BUBBLE_POINT, 1)} bar above bubble point`}
      />
    </div>
  );
}

function WellsReservoirSchematic() {
  return (
    <Panel title={`Wellbore, ${A04.name}`} meta="Completed 2021">
      <WellboreSchematic
        label={A04.name}
        totalDepth={3500}
        casings={[
          { label: '30 in conductor', shoeDepth: 210 },
          { label: '13⅜ in surface casing', shoeDepth: 1380 },
          { label: '9⅝ in production casing', shoeDepth: 2760 },
          { label: '7 in liner', shoeDepth: 3440 },
        ]}
        tubingDepth={2620}
        packerDepth={2540}
        perforations={[
          { top: 3020, bottom: 3110 },
          { top: 3230, bottom: 3320 },
        ]}
      />
    </Panel>
  );
}

function WellsReservoirDepthProfile() {
  return (
    <Panel title="Pressure and temperature against depth" meta={`Flowing survey · ${A04.name} · 2 March`}>
      <div className="h-80 w-full">
        <ChartContainer
          config={PROFILE_CONFIG}
          className={CHART_FRAME}
          aria-label="Flowing pressure and temperature against depth: pressure rises from 92 bar at the wellhead to 284 bar at 3,100 metres, temperature from 38 to 106 degrees"
        >
          <LineChart layout="vertical" data={DEPTH_PROFILE} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal vertical={false} />
            <YAxis dataKey="depth" type="number" domain={[0, 3200]} ticks={[0, 800, 1600, 2400, 3200]} tickFormatter={(value) => formatValue(Number(value))} tickLine={false} axisLine={false} width={44} />
            <XAxis xAxisId="pressure" type="number" domain={[0, 300]} ticks={[0, 100, 200, 300]} tickLine={false} axisLine={false} />
            <XAxis xAxisId="temperature" type="number" orientation="top" domain={[0, 160]} ticks={[0, 40, 80, 120, 160]} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => `${formatValue(Number(payload?.[0]?.payload?.depth ?? 0))} m TVD`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line xAxisId="pressure" dataKey="pressure" stroke="var(--color-pressure)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line xAxisId="temperature" dataKey="temperature" stroke="var(--color-temperature)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">Depth in m TVD on the vertical axis. Temperature on the top scale, pressure on the bottom. Gradient 0.062 bar/m, no liquid loading.</p>
    </Panel>
  );
}

function WellsReservoirBarriers() {
  return (
    <Panel title="Well integrity" meta="NK A-07 · verified 8 March">
      <BarrierStatus
        title="Well barriers, NK A-07"
        barriers={[
          { id: 'dhsv', name: 'Downhole safety valve', kind: 'Primary', state: 'healthy', note: 'Leak rate 0.1 of 0.42 Sm³/min allowed' },
          { id: 'tubing', name: 'Tubing and production packer', kind: 'Primary', state: 'healthy' },
          { id: 'casing', name: 'Production casing and cement', kind: 'Secondary', state: 'degraded', note: 'Sustained B annulus pressure, bled down weekly' },
          { id: 'wellhead', name: 'Wellhead and tubing hanger', kind: 'Secondary', state: 'healthy' },
          { id: 'tree', name: 'Christmas tree valves', kind: 'Secondary', state: 'healthy', note: 'Master valve tested 8 March' },
        ]}
      />
    </Panel>
  );
}

function WellsReservoirAnnulusPressures() {
  return (
    <Panel title="Annulus pressures" meta="NK A-07 · barg against MAASP">
      <div className="flex flex-col gap-4">
        {ANNULI.map((annulus) => (
          <div key={annulus.id} className="flex flex-col gap-1.5">
            <LinearGauge label={annulus.name} value={annulus.value} max={annulus.maasp * 1.1} limits={{ high: annulus.maasp * 0.8, highHigh: annulus.maasp }} unit="barg" />
            <span className="text-xs tabular-nums text-muted-foreground">
              MAASP {annulus.maasp} barg · {formatValue((annulus.value / annulus.maasp) * 100)} % used
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">B annulus is above 80 % of its limit. Bleed-down is scheduled for 13 March.</p>
    </Panel>
  );
}

function WellsReservoirDrillingProgress() {
  return (
    <Panel title="Drilling progress, NK B-09 H" meta="Measured depth against days since spud">
      <div className="h-64 w-full">
        <ChartContainer
          config={DRILLING_CONFIG}
          className={CHART_FRAME}
          aria-label={`Depth against days for NK B-09 H: at day ${DRILL_DAY} the well is at ${formatValue(DRILL_DEPTH)} metres, about two days behind the plan of ${formatValue(DRILL_PLAN_DEPTHS[DRILL_DAY])} metres`}
        >
          <LineChart data={DRILLING} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickLine={false} axisLine={false} />
            <YAxis reversed domain={[0, 4500]} ticks={[0, 1500, 3000, 4500]} tickFormatter={(value) => formatValue(Number(value))} tickLine={false} axisLine={false} width={44} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => `Day ${payload?.[0]?.payload?.day ?? ''}`} valueFormatter={(value) => `${formatValue(Number(value))} m MD`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <ReferenceLine x={DRILL_DAY} stroke="var(--color-chart-neutral-450)" label={{ value: 'Today', position: 'top', className: 'fill-muted-foreground text-xs' }} />
            <Line dataKey="plan" type="stepAfter" stroke="var(--color-plan)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Line dataKey="actual" type="stepAfter" stroke="var(--color-actual)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">Flat stretches are casing and cementing. Two days were lost to a stuck pipe at 2,380 m on days 16 and 17.</p>
    </Panel>
  );
}

function WellsReservoirDrillingTile() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium text-base-foreground">NK B-09 H</span>
        <StatusIndicator size="sm" tone="info" label="Drilling 8½ in" shape="ring" />
      </div>
      <ValueReadout size="md" value={DRILL_DEPTH} unit="m MD" />
      <LinearGauge showHeader={false} size="sm" label="Depth drilled against planned total depth" value={DRILL_DEPTH} max={DRILL_TOTAL} target={DRILL_PLAN_DEPTHS[DRILL_DAY]} unit="m" />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Planned total depth">{formatValue(DRILL_TOTAL)} m</Fact>
        <Fact label="Day">
          {DRILL_DAY} of {DRILL_PLAN_DEPTHS.length - 1}
        </Fact>
        <Fact label="Against plan">{formatValue(DRILL_PLAN_DEPTHS[DRILL_DAY] - DRILL_DEPTH)} m behind</Fact>
        <Fact label="Rate of penetration">14.2 m/h</Fact>
      </dl>
    </Card>
  );
}

function WellsReservoirFieldOverview() {
  const shown = ['a-04', 'a-07', 'a-15', 'b-05'].map(wellsReservoirWell);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">Nordkapp field</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          12 Mar 2026, 14:00 · {PRODUCERS.length} of {WELLS.length} wells producing
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile size="compact" label="Oil" value={FIELD_OIL} unit="Sm³/d" delta={{ reference: 4862, goodDirection: 'up', format: 'percent', decimals: 1, caption: 'vs last week' }} />
        <KpiTile size="compact" label="Gas" value={FIELD_GAS / 1000} unit="MSm³/d" decimals={2} delta={{ reference: PLANT_KPIS.gasExport.previous, goodDirection: 'up', decimals: 2, caption: 'vs last week' }} />
        <KpiTile size="compact" label="Water cut" value={waterCut(FIELD_OIL, FIELD_WATER)} unit="%" decimals={1} delta={{ reference: 28.4, goodDirection: 'down', decimals: 1, caption: 'vs last week' }} />
        <KpiTile size="compact" label="Water injection" value={FIELD_INJECTION} unit="m³/d" status={{ tone: 'warning', label: 'Below target', shape: 'square' }} target={{ value: 9500 }} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((well) => (
          <WellCard
            key={well.id}
            name={well.name}
            detail={well.detail}
            state={well.state}
            rates={well.state === 'producing' ? { oil: well.oil, gas: well.gas, water: well.water } : undefined}
            choke={well.choke}
            tubingHeadPressure={well.state === 'workover' ? undefined : well.tubingHeadPressure}
          />
        ))}
      </div>
    </div>
  );
}

export default definePage({
  id: 'wells-and-reservoir',
  title: 'Wells and reservoir',
  summary:
    'The kit for production and reservoir applications: well state and rates, tests and allocation, decline and pressure trends, the wellbore itself and drilling progress, all on the shared industrial grammar.',
  guidance: {
    use: [
      'A state word on every well: producing, injecting, shut in or workover, never a colour alone.',
      'Derived ratios (water cut, GOR, voidage replacement) next to the rates they come from.',
      'A forecast drawn differently from history, with the point where it starts marked.',
      'Depth on a vertical axis that increases downwards, as in the well.',
    ],
    avoid: [
      'Green for every producing well: a field of normal wells should look calm.',
      'Rates without their unit and reference conditions.',
      'A decline curve without the economic limit it is heading for.',
      'Schematics that imply scale they do not have; say what is to scale.',
    ],
  },
  source,
  sections: [
    {
      id: 'well-state',
      title: 'Well state and controls',
      description: 'One well at a glance: what it is doing, what it makes and how it is set.',
      specimens: [
        {
          id: 'WellsReservoirStatusTile',
          title: 'Well status tile',
          note: 'A well in a grid or map popover, where state and the main rate are enough.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/wells.ts', 'industrial/StatusIndicator.tsx', 'industrial/Sparkline.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          Component: WellsReservoirStatusTile,
        },
        {
          id: 'WellsReservoirStatusStates',
          title: 'Well states',
          note: 'The four states and their shapes, as a legend beside any well list or map.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/wells.ts', 'industrial/StatusIndicator.tsx'],
          Component: WellsReservoirStatusStates,
        },
        {
          id: 'WellsReservoirStatusCounts',
          title: 'Wells by state',
          note: 'The field summary above a well list: how many wells are in each state.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/operations/DistributionBar.tsx', 'industrial/ValueReadout.tsx'],
          Component: WellsReservoirStatusCounts,
        },
        {
          id: 'WellsReservoirCard',
          title: 'Well card',
          note: 'The full picture of one well: phase rates, water cut, GOR, tubing head pressure and choke.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/WellCard.tsx', 'industrial/domains2/wells.ts'],
          Component: WellsReservoirCard,
        },
        {
          id: 'WellsReservoirChokeReadout',
          title: 'Choke position readout',
          note: 'Beside a choke control, to show position against setpoint and who is in control.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          Component: WellsReservoirChokeReadout,
        },
        {
          id: 'WellsReservoirArtificialLift',
          title: 'Artificial lift status',
          note: 'An ESP or gas-lift well, where the lift system has its own operating bands to watch.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/StatusIndicator.tsx'],
          Component: WellsReservoirArtificialLift,
        },
      ],
    },
    {
      id: 'rates-and-allocation',
      title: 'Rates, tests and allocation',
      description: 'From a well test to the share of export each well is credited with.',
      specimens: [
        {
          id: 'WellsReservoirTestRows',
          title: 'Well test result rows',
          note: 'A test log where each result needs a verdict before it is used for allocation.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/wells.ts', 'industrial/TrendDelta.tsx', 'industrial/StatusIndicator.tsx'],
          Component: WellsReservoirTestRows,
        },
        {
          id: 'WellsReservoirUptimeBars',
          title: 'Uptime per well',
          note: 'Ranking wells by time on stream to find where production is being lost.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains/ShareBarList.tsx'],
          Component: WellsReservoirUptimeBars,
        },
        {
          id: 'WellsReservoirListTable',
          title: 'Well list with sparklines',
          note: 'The field overview table: every well, its state, latest rates and a 30-day trend.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/wells.ts', 'industrial/Sparkline.tsx', 'industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx'],
          Component: WellsReservoirListTable,
        },
        {
          id: 'WellsReservoirAllocationTable',
          title: 'Allocation table',
          note: 'Showing how the metered export is split back to wells, with the factor that reconciles them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx'],
          Component: WellsReservoirAllocationTable,
        },
        {
          id: 'WellsReservoirInjectionBalance',
          title: 'Injection against production',
          note: 'Checking that what is injected keeps up with what is taken out of the reservoir.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx', 'industrial/domains2/wells.ts'],
          Component: WellsReservoirInjectionBalance,
        },
      ],
    },
    {
      id: 'reservoir',
      title: 'Decline and reservoir pressure',
      description: 'Where the well and the reservoir are heading.',
      specimens: [
        {
          id: 'WellsReservoirDeclineCurve',
          title: 'Decline curve with forecast',
          note: 'Forecasting a well from its history, with the economic limit the curve is heading for.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/DeclineCurve.tsx', 'industrial/domains2/decline.ts', 'industrial/charts/TrendChart.tsx'],
          Component: WellsReservoirDeclineCurve,
        },
        {
          id: 'WellsReservoirDeclineSummary',
          title: 'Decline fit summary',
          note: 'The parameters behind a forecast, so the curve can be questioned and reproduced.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/decline.ts', 'industrial/ValueReadout.tsx'],
          Component: WellsReservoirDeclineSummary,
        },
        {
          id: 'WellsReservoirPressureTrend',
          title: 'Reservoir pressure trend',
          note: 'Long-term pressure against the bubble point, with the event that changed its slope.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: WellsReservoirPressureTrend,
        },
        {
          id: 'WellsReservoirPressureTile',
          title: 'Reservoir pressure tile',
          note: 'The headline figure on a reservoir dashboard, with its margin to the bubble point.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: WellsReservoirPressureTile,
        },
        {
          id: 'WellsReservoirVoidageTile',
          title: 'Voidage replacement tile',
          note: 'A ratio with a target of one, where below target is the state worth naming.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains2/wells.ts'],
          Component: WellsReservoirVoidageTile,
        },
        {
          id: 'WellsReservoirAnnulusPressures',
          title: 'Annulus pressures',
          note: 'Pressures that must stay under a maximum allowable value, shown as the share of it used.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx'],
          Component: WellsReservoirAnnulusPressures,
        },
        {
          id: 'WellsReservoirDrillingTile',
          title: 'Drilling status tile',
          note: 'A well under construction in a list of wells: depth, day and distance to plan.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WellsReservoirDrillingTile,
        },
      ],
    },
    {
      id: 'wellbore',
      title: 'Wellbore and integrity',
      description: 'The well as a physical thing: what is in the hole, and whether its barriers hold.',
      specimens: [
        {
          id: 'WellsReservoirSchematic',
          title: 'Wellbore schematic',
          note: 'Explaining a completion: casing strings, tubing, packer and perforations on a depth scale.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/WellboreSchematic.tsx'],
          Component: WellsReservoirSchematic,
        },
        {
          id: 'WellsReservoirDepthProfile',
          title: 'Pressure and temperature against depth',
          note: 'A gradient survey, read top to bottom like the well, with two measurements on their own scales.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WellsReservoirDepthProfile,
        },
        {
          id: 'WellsReservoirBarriers',
          title: 'Well barrier status',
          note: 'The primary and secondary barrier elements of a well, with the state of each in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains/BarrierStatus.tsx'],
          Component: WellsReservoirBarriers,
        },
        {
          id: 'WellsReservoirDrillingProgress',
          title: 'Drilling progress',
          note: 'Depth against days for a well being drilled, planned and actual, to see time lost.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WellsReservoirDrillingProgress,
        },
      ],
    },
    {
      id: 'full-blocks',
      title: 'Full blocks',
      description: 'The pieces combined into a field overview.',
      specimens: [
        {
          id: 'WellsReservoirFieldOverview',
          title: 'Field overview',
          note: 'The landing view of a production application: field totals, then the wells behind them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/WellCard.tsx', 'industrial/domains2/wells.ts', 'industrial/KpiTile.tsx'],
          Component: WellsReservoirFieldOverview,
        },
      ],
    },
  ],
});
