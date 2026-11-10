import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';

import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PLANT_KPIS } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './energy-and-emissions.tsx?raw';

const KPI = PLANT_KPIS;
const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const INTENSITY_TREND = [...makeValues({ seed: 34, points: 29, base: 33.4, drift: KPI.energyIntensity.value - 33.4, noise: 0.4, stepMs: DAY }), KPI.energyIntensity.value];
const SPECIFIC_ENERGY_TREND = [...makeValues({ seed: 51, points: 29, base: 139, drift: 3, noise: 1.2, stepMs: DAY }), 142];
const CO2_TREND = [...makeValues({ seed: 52, points: 29, base: 428, drift: -16, noise: 6, stepMs: DAY, decimals: 0 }), 412];
const NOX_TREND = [...makeValues({ seed: 53, points: 29, base: 1.62, drift: 0.24, noise: 0.04, stepMs: DAY, decimals: 2 }), 1.86];

/** Energy use over the last 24 hours in MWh, largest first. Adds up to 560 MWh. */
const CONSUMERS = [
  { id: 'ka-9101', label: '1st stage compressor', detail: '23-KA-9101', value: 212 },
  { id: 'ka-9102', label: '2nd stage compressor', detail: '23-KA-9102', value: 168 },
  { id: 'ka-9103', label: 'Recompressor', detail: '23-KA-9103', value: 64 },
  { id: 'pa-2001', label: 'Export pumps', detail: '27-PA-2001A/B', value: 58 },
  { id: 'pa-4001', label: 'Cooling water', detail: 'NK-40', value: 31 },
  { id: 'utilities', label: 'Utilities and buildings', value: 27 },
];

const ON_SITE_GENERATION = 12.6;

/** Electrical demand in MW, hourly for 24 hours. */
const POWER_DEMAND = makeSeries({ seed: 54, points: 24, base: 15.9, amplitude: 1.9, noise: 0.4, cycles: 1, min: 12 }).map((point) => ({
  time: formatTime(point.t),
  demand: point.v,
}));

/** Compressor operating points for 24 hours: flow against polytropic efficiency, with the design curve. */
const designEfficiency = (flow: number): number => Math.round((82.5 - 0.004 * (flow - 178) ** 2) * 10) / 10;

const EFFICIENCY_NOISE = makeValues({ seed: 61, points: 24, base: 0, noise: 0.5, decimals: 2 });

const OPERATING_POINTS = makeSeries({ seed: 16, points: 24, base: 176, amplitude: 18, noise: 5, cycles: 1 }).map((point, index) => ({
  flow: point.v,
  efficiency: Math.round((designEfficiency(point.v) - 1.6 + EFFICIENCY_NOISE[index]) * 10) / 10,
}));

const CURRENT_POINT = [{ flow: 182.4, efficiency: 80.6 }];

const DESIGN_CURVE = Array.from({ length: 15 }, (_, index) => 140 + index * 5).map((flow) => ({ flow, efficiency: designEfficiency(flow) }));

const MAP_CONFIG = {
  points: { label: 'Last 24 hours', color: 'var(--color-chart-1-300)' },
  current: { label: 'Now', color: chartSeriesColor(1) },
  design: { label: 'Design curve', color: 'var(--color-chart-neutral-400)' },
} satisfies ChartConfig;

const BENCHMARK = [
  { site: 'Hammerfest LNG', value: 27.8 },
  { site: 'Stord terminal', value: 29.1 },
  { site: 'Nordkapp', value: KPI.energyIntensity.value },
  { site: 'Valhall Sør', value: 36.4 },
];

/** CO₂ equivalents per day by source, in tonnes. The last day adds up to 412 t. */
const EMISSIONS_BY_SOURCE = [
  { turbines: 331, heaters: 44, flaring: 51, fugitive: 19 },
  { turbines: 327, heaters: 43, flaring: 47, fugitive: 19 },
  { turbines: 334, heaters: 44, flaring: 44, fugitive: 18 },
  { turbines: 322, heaters: 42, flaring: 39, fugitive: 18 },
  { turbines: 325, heaters: 43, flaring: 36, fugitive: 18 },
  { turbines: 316, heaters: 42, flaring: 38, fugitive: 18 },
  { turbines: 318, heaters: 42, flaring: 34, fugitive: 18 },
].map((row, index) => ({ ...row, date: formatDate(REFERENCE_NOW - (6 - index) * DAY) }));

const SOURCE_CONFIG = {
  turbines: { label: 'Gas turbines', color: chartSeriesColor(1) },
  heaters: { label: 'Heaters and boilers', color: chartSeriesColor(2) },
  flaring: { label: 'Flaring', color: chartSeriesColor(3) },
  fugitive: { label: 'Venting and fugitive', color: chartSeriesColor(4) },
} satisfies ChartConfig;

const FLARING_PERMIT = KPI.flaring.target;

const FLARING_TREND = [...makeSeries({ seed: 35, points: 29, base: 19.5, drift: KPI.flaring.value - 19.5, noise: 1.6, stepMs: DAY, end: REFERENCE_NOW - DAY }), { t: REFERENCE_NOW, v: KPI.flaring.value }].map(
  (point) => ({ date: formatDate(point.t), flaring: point.v })
);

const FLARING_DAYS_ABOVE = FLARING_TREND.filter((point) => point.flaring > FLARING_PERMIT).length;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ANNUAL_BUDGET = 150;
const ACTUAL_CUMULATIVE = [12.9, 24.4, 29.4];

/** Cumulative CO₂e in kilotonnes: a straight-line budget for the year and actuals to 12 March. */
const YEAR_TO_DATE = MONTHS.map((month, index) => ({
  month,
  budget: Math.round((ANNUAL_BUDGET / 12) * (index + 1) * 10) / 10,
  actual: index < ACTUAL_CUMULATIVE.length ? ACTUAL_CUMULATIVE[index] : null,
}));

const YTD_CONFIG = {
  budget: { label: 'Budget', color: 'var(--color-chart-neutral-400)' },
  actual: { label: 'Actual', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const PERMITS = [
  { id: 'co2', label: 'CO₂', used: 412, limit: 480, unit: 't/d', decimals: 0 },
  { id: 'nox', label: 'NOx', used: 1.86, limit: 2.0, unit: 't/d', decimals: 2 },
  { id: 'flaring', label: 'Flaring', used: KPI.flaring.value, limit: FLARING_PERMIT, unit: 'kSm³/d', decimals: 1 },
  { id: 'ch4', label: 'Methane', used: 0.61, limit: 1.0, unit: 't/d', decimals: 2 },
];

type Leak = {
  id: string;
  component: string;
  tag: string;
  area: string;
  /** Measured rate in grams of methane per hour. */
  rate: number;
  method: string;
  found: string;
  status: { tone: Tone; label: string; shape: DotShape };
  action: string;
};

const LEAKS: readonly Leak[] = [
  { id: 'LK-2231', component: 'Seal gas panel, flange', tag: '23-KA-9101', area: 'Gas compression', rate: 1240, method: 'Fixed sensor', found: '12 Mar, 09:20', status: { tone: 'critical', label: 'Open', shape: 'diamond' }, action: 'Repair within 24 h' },
  { id: 'LK-2228', component: 'Anti-surge valve, stem packing', tag: '23-FV-9105', area: 'Gas compression', rate: 310, method: 'OGI camera', found: '10 Mar, 13:05', status: { tone: 'warning', label: 'Repair planned', shape: 'square' }, action: 'WO-104466, 14 Mar' },
  { id: 'LK-2224', component: 'Level transmitter, impulse line', tag: '20-LT-10012', area: 'Inlet and separation', rate: 85, method: 'OGI camera', found: '8 Mar, 10:40', status: { tone: 'warning', label: 'Repair planned', shape: 'square' }, action: 'Next opportunity' },
  { id: 'LK-2219', component: 'Pump seal', tag: '27-PA-2001B', area: 'Gas export', rate: 40, method: 'Sniffer', found: '5 Mar, 15:10', status: { tone: 'neutral', label: 'Monitoring', shape: 'ring' }, action: 'Recheck 19 Mar' },
  { id: 'LK-2207', component: 'Shutdown valve, body flange', tag: '20-XV-1105', area: 'Inlet and separation', rate: 0, method: 'OGI camera', found: '27 Feb, 11:30', status: { tone: 'success', label: 'Repaired, verified', shape: 'dot' }, action: 'Closed 3 Mar' },
];

const leakSize = (rate: number): string => (rate >= 1000 ? 'Large' : rate >= 100 ? 'Medium' : rate > 0 ? 'Small' : 'None');

const formatLeakRate = (rate: number): string => (rate >= 1000 ? `${formatValue(rate / 1000, 2)} kg/h` : `${formatValue(rate, 0)} g/h`);

type Opportunity = { id: string; title: string; saving: number; cost: number; payback: string; stage: string };

/** Abatement opportunities, largest saving first. Saving in kt CO₂e per year, cost in NOK per tonne. */
const OPPORTUNITIES: readonly Opportunity[] = [
  { id: 'ab-1', title: 'Replace turbine drive with electric motor, recompressor', saving: 21.4, cost: 640, payback: '6.1 y', stage: 'Study' },
  { id: 'ab-2', title: 'Recover flash gas from test separator', saving: 3.4, cost: 180, payback: '1.8 y', stage: 'Proposed' },
  { id: 'ab-3', title: 'Clean interstage cooler tube bundle', saving: 1.9, cost: 35, payback: '4 months', stage: 'Planned' },
  { id: 'ab-4', title: 'Close flare pilot purge optimisation', saving: 0.8, cost: 90, payback: '1.1 y', stage: 'Proposed' },
];

const FACTORS = [
  { source: 'Fuel gas combustion', factor: '2.34', unit: 'kg CO₂/Sm³', basis: 'Site gas analysis', valid: '1 Feb 2026' },
  { source: 'Flare gas combustion', factor: '2.61', unit: 'kg CO₂/Sm³', basis: 'Site gas analysis', valid: '1 Feb 2026' },
  { source: 'Diesel', factor: '3.17', unit: 'kg CO₂/kg', basis: 'National standard factor', valid: '1 Jan 2026' },
  { source: 'Imported electricity', factor: '0.011', unit: 'kg CO₂e/kWh', basis: 'Grid average, location-based', valid: '1 Jan 2026' },
  { source: 'Methane', factor: '29.8', unit: 'kg CO₂e/kg', basis: 'GWP 100, IPCC AR6', valid: '1 Jan 2024' },
];

type ScoreRow = { metric: string; actual: string; target: string; status: { tone: Tone; label: string; shape: DotShape } };

const ON_TRACK = { tone: 'success', label: 'On track', shape: 'dot' } as const;
const BEHIND = { tone: 'warning', label: 'Behind', shape: 'square' } as const;
const OFF_TRACK = { tone: 'critical', label: 'Off track', shape: 'diamond' } as const;

const SCORECARD: readonly ScoreRow[] = [
  { metric: 'CO₂ intensity', actual: '8.4 kg CO₂e/boe', target: '9.0', status: ON_TRACK },
  { metric: 'Flaring', actual: '12.4 kSm³/d', target: '15.0', status: ON_TRACK },
  { metric: 'Energy intensity', actual: '31.2 kWh/boe', target: '30.0', status: BEHIND },
  { metric: 'Methane intensity', actual: '0.026 %', target: '0.020', status: OFF_TRACK },
  { metric: 'Power from grid', actual: '25 %', target: '40 by 2028', status: BEHIND },
];

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

function EnergyEmisIntensityTile() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="Energy intensity"
        value={KPI.energyIntensity.value}
        unit={KPI.energyIntensity.unit}
        decimals={1}
        status={{ tone: 'warning', label: 'Above target', shape: 'square' }}
        delta={{ reference: KPI.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
        target={{ value: KPI.energyIntensity.target }}
        trend={{ values: INTENSITY_TREND, label: 'Energy intensity, last 30 days' }}
      />
    </div>
  );
}

function EnergyEmisSpecificEnergy() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="Specific compression energy"
        value={142}
        unit="kWh/kSm³"
        delta={{ reference: 139, goodDirection: 'down', caption: 'vs 30 d ago', decimals: 0 }}
        trend={{ values: SPECIFIC_ENERGY_TREND, label: 'Specific compression energy, last 30 days' }}
        footnote="Design 135 kWh/kSm³ at current suction pressure"
      >
        <LinearGauge showHeader={false} size="sm" label="Specific compression energy against design" value={142} min={120} max={160} target={135} unit="kWh/kSm³" />
      </KpiTile>
    </div>
  );
}

function EnergyEmisBalanceSummary() {
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <span className="text-xs text-muted-foreground">Energy balance, now</span>
      <div role="img" aria-label="Electrical supply: 12.6 megawatts generated on site and 4.2 megawatts imported, 16.8 in total" className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <span className="h-full w-3/4 bg-chart-1-450" />
        <span className="h-full w-1/4 bg-chart-2-400" />
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="flex items-center gap-2 text-medium-foreground">
            <span aria-hidden="true" className="size-2 rounded-xs bg-chart-1-450" />
            Generated on site
          </dt>
          <dd>
            <ValueReadout size="xs" value={ON_SITE_GENERATION} unit="MW" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="flex items-center gap-2 text-medium-foreground">
            <span aria-hidden="true" className="size-2 rounded-xs bg-chart-2-400" />
            Power import
          </dt>
          <dd>
            <ValueReadout size="xs" value={4.2} unit="MW" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-default pt-2">
          <dt className="font-medium text-base-foreground">Electrical demand</dt>
          <dd>
            <ValueReadout size="xs" value={16.8} unit="MW" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-medium-foreground">Fuel gas</dt>
          <dd>
            <ValueReadout size="xs" value={86.4} unit="kSm³/d" decimals={1} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function EnergyEmisConsumptionByConsumer() {
  return (
    <Panel title="Energy use by consumer" meta="Last 24 hours · 560 MWh">
      <ShareBarList label="Energy use by consumer, last 24 hours" items={CONSUMERS} unit="MWh" showShare />
    </Panel>
  );
}

function EnergyEmisPowerDemandProfile() {
  return (
    <Panel title="Power demand" meta="MW, last 24 hours">
      <div className="h-56 w-full">
        <ChartContainer
          config={{ demand: { label: 'Electrical demand', color: chartSeriesColor(1) } }}
          className={CHART_FRAME}
          aria-label="Electrical demand over 24 hours, between 14 and 18 megawatts, above the 12.6 megawatts generated on site throughout"
        >
          <AreaChart data={POWER_DEMAND} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
            <YAxis domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} MW`} />} />
            <Area dataKey="demand" type="monotone" stroke="var(--color-demand)" strokeWidth={2} fill="var(--color-chart-1-100)" isAnimationActive={false} />
            <ReferenceLine y={ON_SITE_GENERATION} stroke="var(--color-chart-neutral-450)" strokeDasharray="4 4" />
          </AreaChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">Dashed line is on-site generation, 12.6 MW. Demand above it is imported from the grid.</p>
    </Panel>
  );
}

function EnergyEmisCompressorMap() {
  return (
    <Panel title="Compressor efficiency map" meta="23-KA-9101 · last 24 hours">
      <div className="h-56 w-full">
        <ChartContainer
          config={MAP_CONFIG}
          className={CHART_FRAME}
          aria-label="Polytropic efficiency against gas flow for the 1st stage compressor; operating points sit about 1.6 points under the design curve, now at 80.6 percent and 182 thousand cubic metres per hour"
        >
          <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="flow"
              domain={[140, 210]}
              ticks={[140, 160, 180, 200]}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Gas flow, kSm³/h', position: 'insideBottom', offset: -8, className: 'fill-muted-foreground' }}
            />
            <YAxis type="number" dataKey="efficiency" domain={[72, 84]} ticks={[72, 76, 80, 84]} tickLine={false} axisLine={false} width={44} unit="%" />
            <ChartLegend itemSorter={null} verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
            <Scatter
              name="design"
              data={DESIGN_CURVE}
              fill="var(--color-design)"
              line={{ stroke: 'var(--color-design)', strokeWidth: 2, strokeDasharray: '4 4' }}
              shape={() => <g />}
              isAnimationActive={false}
            />
            <Scatter name="points" data={OPERATING_POINTS} fill="var(--color-points)" isAnimationActive={false} />
            <Scatter name="current" data={CURRENT_POINT} fill="var(--color-current)" shape="diamond" isAnimationActive={false} />
          </ScatterChart>
        </ChartContainer>
      </div>
    </Panel>
  );
}

function EnergyEmisIntensityBenchmark() {
  const target = KPI.energyIntensity.target;
  return (
    <Panel title="Energy intensity benchmark" meta={`kWh/boe · tick marks the target, ${formatValue(target, 1)}`}>
      <ul aria-label="Energy intensity by site against target" className="flex flex-col gap-4">
        {BENCHMARK.map((row) => (
          <li key={row.site} className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
            <span className={row.site === 'Nordkapp' ? 'text-sm font-medium text-base-foreground' : 'text-sm text-medium-foreground'}>{row.site}</span>
            <LinearGauge showHeader={false} size="sm" label={`${row.site} energy intensity`} value={row.value} min={20} max={40} target={target} unit="kWh/boe" decimals={1} />
            <span className="flex w-36 items-baseline justify-end gap-3">
              <TrendDelta size="sm" value={row.value} reference={target} goodDirection="down" decimals={1} />
              <ValueReadout size="xs" value={row.value} decimals={1} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function EnergyEmisCo2Tile() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="CO₂ emissions"
        value={412}
        unit="t/d"
        status={{ tone: 'success', label: 'Within permit' }}
        delta={{ reference: 428, goodDirection: 'down', caption: 'vs last week', decimals: 0 }}
        target={{ value: 480, label: 'Permit' }}
        trend={{ values: CO2_TREND, label: 'CO₂ emissions, last 30 days' }}
      >
        <LinearGauge showHeader={false} size="sm" label="CO₂ emissions against permit limit" value={412} max={560} limits={{ high: 480 }} unit="t/d" />
      </KpiTile>
    </div>
  );
}

function EnergyEmisNearPermitTile() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="NOx emissions"
        value={1.86}
        unit="t/d"
        decimals={2}
        tone="warning"
        status={{ tone: 'warning', label: '93 % of permit', shape: 'square' }}
        delta={{ reference: 1.71, goodDirection: 'down', caption: 'vs last week', decimals: 2 }}
        target={{ value: 2, label: 'Permit' }}
        trend={{ values: NOX_TREND, limit: 2, label: 'NOx emissions, last 30 days' }}
      >
        <LinearGauge showHeader={false} size="sm" label="NOx emissions against permit limit" value={1.86} max={2.4} limits={{ high: 2 }} tone="warning" unit="t/d" decimals={2} />
      </KpiTile>
    </div>
  );
}

function EnergyEmisPermitHeadroom() {
  return (
    <Card className="w-full max-w-72 self-center gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">Permit use, today</span>
        <span className="text-xs text-muted-foreground">Warns from 90 %</span>
      </div>
      {PERMITS.map((permit) => (
        <div key={permit.id} className="flex flex-col gap-1">
          <LinearGauge size="sm" label={permit.label} value={(permit.used / permit.limit) * 100} max={110} limits={{ high: 90, highHigh: 100 }} unit="%" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatValue(permit.used, permit.decimals)} of {formatValue(permit.limit, permit.decimals)} {permit.unit}
          </span>
        </div>
      ))}
    </Card>
  );
}

function EnergyEmisBySource() {
  return (
    <Panel title="Emissions by source" meta="t CO₂e per day">
      <div className="h-60 w-full">
        <ChartContainer
          config={SOURCE_CONFIG}
          className={CHART_FRAME}
          aria-label="CO₂ equivalents per day by source for 7 days; gas turbines are about three quarters of the total, and flaring falls from 51 to 34 tonnes"
        >
          <BarChart data={EMISSIONS_BY_SOURCE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 500]} ticks={[0, 100, 200, 300, 400, 500]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} t`} />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <Bar dataKey="turbines" stackId="source" fill="var(--color-turbines)" isAnimationActive={false} />
            <Bar dataKey="heaters" stackId="source" fill="var(--color-heaters)" isAnimationActive={false} />
            <Bar dataKey="flaring" stackId="source" fill="var(--color-flaring)" isAnimationActive={false} />
            <Bar dataKey="fugitive" stackId="source" fill="var(--color-fugitive)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </div>
    </Panel>
  );
}

function EnergyEmisFlaringTrend() {
  return (
    <Panel title="Flaring against permit" meta="kSm³ per day, last 30 days">
      <div className="h-52 w-full">
        <ChartContainer
          config={{ flaring: { label: 'Flaring', color: chartSeriesColor(1) } }}
          className={CHART_FRAME}
          aria-label={`Daily flaring for 30 days against the permit of 15 thousand cubic metres; it falls from about 19 to 12.4 and was above the permit on ${FLARING_DAYS_ABOVE} days`}
        >
          <LineChart data={FLARING_TREND} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis domain={[0, 25]} ticks={[0, 5, 10, 15, 20, 25]} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} kSm³`} />} />
            <ReferenceLine y={FLARING_PERMIT} stroke="var(--color-chart-critical-450)" strokeDasharray="4 4" />
            <Line dataKey="flaring" type="monotone" stroke="var(--color-flaring)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <StatusIndicator size="sm" tone="success" label="Within permit today" detail={`${formatValue(KPI.flaring.value, 1)} of ${formatValue(FLARING_PERMIT, 1)} kSm³`} />
        <span className="text-xs text-muted-foreground tabular-nums">Dashed line is the permit · above it on {FLARING_DAYS_ABOVE} of 30 days</span>
      </div>
    </Panel>
  );
}

function EnergyEmisYtdVsBudget() {
  return (
    <Panel title="Emissions year to date" meta="kt CO₂e, cumulative">
      <div className="h-52 w-full">
        <ChartContainer
          config={YTD_CONFIG}
          className={CHART_FRAME}
          aria-label="Cumulative CO₂ equivalents for 2026 against a straight-line budget of 150 kilotonnes; 29.4 emitted by 12 March against 29.8 budgeted"
        >
          <LineChart data={YEAR_TO_DATE} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 160]} ticks={[0, 40, 80, 120, 160]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} kt`} />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <Line dataKey="budget" type="linear" stroke="var(--color-budget)" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="actual" type="linear" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-actual)' }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TrendDelta value={29.4} reference={29.8} goodDirection="down" decimals={1} unit="kt" caption="vs budget to date" />
        <span className="text-xs text-muted-foreground tabular-nums">29.4 of 150 kt annual budget used</span>
      </div>
    </Panel>
  );
}

function EnergyEmisSourceShare() {
  const today = EMISSIONS_BY_SOURCE[EMISSIONS_BY_SOURCE.length - 1];
  return (
    <Panel title="Emission sources" meta="Today · 412 t CO₂e">
      <ShareBarList
        label="CO₂ equivalents by source, today"
        items={[
          { id: 'turbines', label: 'Gas turbines', detail: '23-GT-9001', value: today.turbines },
          { id: 'heaters', label: 'Heaters and boilers', value: today.heaters },
          { id: 'flaring', label: 'Flaring', value: today.flaring },
          { id: 'fugitive', label: 'Venting and fugitive', value: today.fugitive },
        ]}
        unit="t"
        showShare
      />
    </Panel>
  );
}

function EnergyEmisLeakRow() {
  const leak = LEAKS[0];
  return (
    <Card role="group" aria-label={`Methane leak ${leak.id}`} className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{leak.id}</span>
          <StatusIndicator variant="badge" {...leak.status} />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Found {leak.found} · {leak.method}
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">{leak.component}</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{leak.tag}</span> · {leak.area}
          </span>
        </div>
        <div className="flex items-end gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Methane rate · {leakSize(leak.rate).toLowerCase()}</span>
            <ValueReadout size="md" value={leak.rate / 1000} unit="kg/h" decimals={2} tone="critical" />
          </div>
          <Button variant="secondary" size="sm">
            Create work order
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EnergyEmisLeakSummary() {
  const open = LEAKS.filter((leak) => leak.rate > 0);
  const total = open.reduce((sum, leak) => sum + leak.rate, 0);
  const sizes = ['Large', 'Medium', 'Small'];
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <span className="text-xs text-muted-foreground">Open methane leaks</span>
      <div className="flex items-end justify-between gap-3">
        <ValueReadout size="md" value={open.length} />
        <ValueReadout size="sm" value={total / 1000} unit="kg/h" decimals={2} />
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        {sizes.map((size) => (
          <div key={size} className="flex justify-between gap-3">
            <dt className="text-medium-foreground">
              {size}
              <span className="pl-2 text-xs text-muted-foreground">{size === 'Large' ? '1 kg/h or more' : size === 'Medium' ? '0.1 to 1 kg/h' : 'under 0.1 kg/h'}</span>
            </dt>
            <dd className="tabular-nums text-base-foreground">{open.filter((leak) => leakSize(leak.rate) === size).length}</dd>
          </div>
        ))}
      </dl>
      <span className="text-xs text-muted-foreground">Last full survey 8 Mar · next 8 Apr</span>
    </Card>
  );
}

function EnergyEmisLeakList() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Methane leak detection and repair list" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Leak
            </th>
            <th scope="col" className={TH}>
              Component
            </th>
            <th scope="col" className={TH}>
              Detected
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Methane rate
            </th>
            <th scope="col" className={TH}>
              Size
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={TH}>
              Next step
            </th>
          </tr>
        </thead>
        <tbody>
          {LEAKS.map((leak) => (
            <tr key={leak.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap font-mono text-xs text-medium-foreground`}>{leak.id}</td>
              <td className={TD}>
                <span className="text-base-foreground">{leak.component}</span>
                <span className="block font-mono text-xs text-muted-foreground">{leak.tag}</span>
              </td>
              <td className={`${TD} whitespace-nowrap text-medium-foreground`}>
                <span className="tabular-nums">{leak.found}</span>
                <span className="block text-xs text-muted-foreground">{leak.method}</span>
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-base-foreground`}>{leak.rate === 0 ? <span className="text-muted-foreground">Not detectable</span> : formatLeakRate(leak.rate)}</td>
              <td className={`${TD} text-medium-foreground`}>{leakSize(leak.rate)}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...leak.status} />
              </td>
              <td className={`${TD} whitespace-nowrap text-medium-foreground tabular-nums`}>{leak.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnergyEmisAbatementCard() {
  const opportunity = OPPORTUNITIES[1];
  return (
    <Card role="group" aria-label={opportunity.title} className="w-full max-w-80 self-center gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Abatement opportunity</span>
        <StatusIndicator size="sm" tone="neutral" shape="ring" label={opportunity.stage} />
      </div>
      <h3 className="text-sm font-medium text-base-foreground">{opportunity.title}</h3>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Estimated saving</span>
        <ValueReadout size="md" value={opportunity.saving} unit="kt CO₂e/y" decimals={1} />
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Abatement cost</dt>
          <dd className="text-sm tabular-nums text-base-foreground">{opportunity.cost} NOK/t</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Payback</dt>
          <dd className="text-sm tabular-nums text-base-foreground">{opportunity.payback}</dd>
        </div>
      </dl>
      <Button variant="secondary" size="sm" className="self-start">
        Review business case
      </Button>
    </Card>
  );
}

function EnergyEmisAbatementRanked() {
  const largest = OPPORTUNITIES[0].saving;
  return (
    <Panel title="Abatement opportunities" meta="Ranked by estimated saving · 27.5 kt CO₂e/y in total">
      <div className="overflow-x-auto">
        <table aria-label="Abatement opportunities ranked by estimated saving" className="w-full min-w-128 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Opportunity
              </th>
              <th scope="col" className={`${TH} w-1/4`}>
                Saving, kt CO₂e/y
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Cost, NOK/t
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Payback
              </th>
              <th scope="col" className={`${TH} pr-0`}>
                Stage
              </th>
            </tr>
          </thead>
          <tbody>
            {OPPORTUNITIES.map((opportunity) => (
              <tr key={opportunity.id} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {opportunity.title}
                </th>
                <td className={TD}>
                  <div className="flex items-center gap-3">
                    <LinearGauge className="flex-1" showHeader={false} size="sm" label={`${opportunity.title} saving`} value={opportunity.saving} max={largest} unit="kt CO₂e per year" decimals={1} />
                    <span className="w-8 text-right tabular-nums text-base-foreground">{formatValue(opportunity.saving, 1)}</span>
                  </div>
                </td>
                <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{opportunity.cost}</td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums text-medium-foreground`}>{opportunity.payback}</td>
                <td className={`${TD} pr-0 text-medium-foreground`}>{opportunity.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function EnergyEmisFactorTable() {
  return (
    <Panel title="Emission factors" meta="Used for all calculated figures">
      <div className="overflow-x-auto">
        <table aria-label="Emission factors in use" className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Source
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Factor
              </th>
              <th scope="col" className={TH}>
                Basis
              </th>
              <th scope="col" className={`${TH} pr-0 text-right`}>
                Valid from
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTORS.map((row) => (
              <tr key={row.source} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {row.source}
                </th>
                <td className={`${TD} whitespace-nowrap text-right`}>
                  <span className="font-medium tabular-nums text-base-foreground">{row.factor}</span>
                  <span className="pl-1 text-xs text-muted-foreground">{row.unit}</span>
                </td>
                <td className={`${TD} text-medium-foreground`}>{row.basis}</td>
                <td className={`${TD} whitespace-nowrap pr-0 text-right tabular-nums text-medium-foreground`}>{row.valid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function EnergyEmisScorecard() {
  return (
    <Panel title="Sustainability scorecard" meta="2026 targets">
      <table aria-label="Sustainability scorecard against 2026 targets" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Measure
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Actual
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Target
            </th>
            <th scope="col" className={`${TH} pr-0`}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {SCORECARD.map((row) => (
            <tr key={row.metric} className="border-t border-default">
              <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                {row.metric}
              </th>
              <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums text-base-foreground`}>{row.actual}</td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-medium-foreground`}>{row.target}</td>
              <td className={`${TD} pr-0`}>
                <StatusIndicator size="sm" {...row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function EnergyEmisOverviewPanel() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="CO₂ emissions"
          value={412}
          unit="t/d"
          delta={{ reference: 428, goodDirection: 'down', caption: 'vs last week', decimals: 0 }}
          trend={{ values: CO2_TREND, label: 'CO₂ emissions, last 30 days' }}
        />
        <KpiTile
          label="Energy intensity"
          value={KPI.energyIntensity.value}
          unit={KPI.energyIntensity.unit}
          decimals={1}
          delta={{ reference: KPI.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
          trend={{ values: INTENSITY_TREND, label: 'Energy intensity, last 30 days' }}
        />
        <KpiTile
          label="Flaring"
          value={KPI.flaring.value}
          unit={KPI.flaring.unit}
          decimals={1}
          delta={{ reference: KPI.flaring.previous, goodDirection: 'down', caption: 'vs last week' }}
          trend={{ values: FLARING_TREND.map((point) => point.flaring), limit: FLARING_PERMIT, label: 'Flaring, last 30 days' }}
        />
        <KpiTile
          label="Methane leaks, open"
          value={4}
          tone="critical"
          status={{ tone: 'critical', label: '1 large', shape: 'diamond' }}
          delta={{ reference: 3, goodDirection: 'down', caption: 'vs last week', decimals: 0 }}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Emissions by source" meta="t CO₂e per day">
            <div className="h-56 w-full">
              <ChartContainer config={SOURCE_CONFIG} className={CHART_FRAME} aria-label="CO₂ equivalents per day by source for 7 days, falling from 445 to 412 tonnes">
                <BarChart data={EMISSIONS_BY_SOURCE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 500]} ticks={[0, 100, 200, 300, 400, 500]} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} t`} />} />
                  <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
                  <Bar dataKey="turbines" stackId="source" fill="var(--color-turbines)" isAnimationActive={false} />
                  <Bar dataKey="heaters" stackId="source" fill="var(--color-heaters)" isAnimationActive={false} />
                  <Bar dataKey="flaring" stackId="source" fill="var(--color-flaring)" isAnimationActive={false} />
                  <Bar dataKey="fugitive" stackId="source" fill="var(--color-fugitive)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
            </div>
          </Panel>
        </div>
        <Panel title="Permit use" meta="Today · warns from 90 %">
          <div className="flex flex-col gap-4">
            {PERMITS.map((permit) => (
              <div key={permit.id} className="flex flex-col gap-1">
                <LinearGauge size="sm" label={permit.label} value={(permit.used / permit.limit) * 100} max={110} limits={{ high: 90, highHigh: 100 }} unit="%" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatValue(permit.used, permit.decimals)} of {formatValue(permit.limit, permit.decimals)} {permit.unit}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EnergyEmisMonthlyReport() {
  const rows = [
    { scope: 'Scope 1', source: 'Fuel gas combustion', actual: 9.42, budget: 9.8, lastYear: 10.05 },
    { scope: 'Scope 1', source: 'Flaring', actual: 1.48, budget: 1.2, lastYear: 1.36 },
    { scope: 'Scope 1', source: 'Venting and fugitive methane', actual: 0.52, budget: 0.5, lastYear: 0.61 },
    { scope: 'Scope 1', source: 'Diesel', actual: 0.06, budget: 0.1, lastYear: 0.08 },
    { scope: 'Scope 2', source: 'Imported electricity', actual: 0.03, budget: 0.05, lastYear: 0.02 },
  ];
  const total = (key: 'actual' | 'budget' | 'lastYear') => rows.reduce((sum, row) => sum + row[key], 0);
  return (
    <Card className="w-full min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Emissions report</h3>
          <span className="text-xs text-muted-foreground">Nordkapp · February 2026 · kt CO₂e</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator variant="badge" tone="success" label="Verified" />
          <Button variant="outline" size="sm">
            Export report
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table aria-label="Emissions by scope and source, February 2026" className="w-full min-w-144 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Scope
              </th>
              <th scope="col" className={TH}>
                Source
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Actual
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Budget
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Against budget
              </th>
              <th scope="col" className={`${TH} pr-0 text-right`}>
                Against February 2025
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.source} className="border-t border-default">
                <td className={`${TD} pl-0 text-medium-foreground`}>{row.scope}</td>
                <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                  {row.source}
                </th>
                <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(row.actual, 2)}</td>
                <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.budget, 2)}</td>
                <td className={`${TD} text-right`}>
                  <TrendDelta size="sm" value={row.actual} reference={row.budget} goodDirection="down" decimals={2} />
                </td>
                <td className={`${TD} pr-0 text-right`}>
                  <TrendDelta size="sm" value={row.actual} reference={row.lastYear} format="percent" goodDirection="down" decimals={0} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-emphasized">
              <td className={`${TD} pl-0`} />
              <th scope="row" className={`${TD} text-left font-medium text-base-foreground`}>
                Total
              </th>
              <td className={`${TD} text-right font-semibold tabular-nums text-base-foreground`}>{formatValue(total('actual'), 2)}</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(total('budget'), 2)}</td>
              <td className={`${TD} text-right`}>
                <TrendDelta size="sm" value={total('actual')} reference={total('budget')} goodDirection="down" decimals={2} />
              </td>
              <td className={`${TD} pr-0 text-right`}>
                <TrendDelta size="sm" value={total('actual')} reference={total('lastYear')} format="percent" goodDirection="down" decimals={0} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap justify-between gap-3 border-t border-default pt-4 text-xs text-muted-foreground">
        <span>Calculated from metered fuel and flare gas with the factors valid from 1 Feb 2026.</span>
        <span>Verified by Aisha Khan · 6 Mar 2026</span>
      </div>
    </Card>
  );
}

export default definePage({
  id: 'energy-and-emissions',
  title: 'Energy and emissions',
  summary:
    'The kit for an energy and emissions app: intensity and specific energy, who consumes what, emissions by source against permit and budget, methane leaks, and the abatement options that would move the numbers.',
  guidance: {
    use: [
      'State the basis of every figure: per day, per unit produced, year to date, and CO₂ or CO₂ equivalents.',
      'Show a permit or budget next to the emission it limits, and warn before the limit rather than at it.',
      'Rank consumers and sources so the largest is first; the long tail goes in "Other".',
      'Keep emission factors visible and dated, since every calculated figure depends on them.',
    ],
    avoid: [
      'Green for "low emissions"; colour is for permit and target status, not for virtue.',
      'Mixing measured and calculated values without saying which is which.',
      'A pie chart for sources that change over time; stacked bars per day show the trend too.',
      'Leak lists without a measured rate, since size decides the repair deadline.',
    ],
  },
  source,
  sections: [
    {
      id: 'energy',
      title: 'Energy',
      description: 'How much energy the plant uses per unit, where it goes and where it comes from.',
      specimens: [
        {
          id: 'EnergyEmisIntensityTile',
          title: 'Energy intensity tile',
          note: 'Pick it for the headline efficiency figure, where lower is better and the target is a ceiling.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          Component: EnergyEmisIntensityTile,
        },
        {
          id: 'EnergyEmisSpecificEnergy',
          title: 'Specific energy per unit',
          note: 'Pick it for one machine or process step: energy per unit handled, against its design value.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: EnergyEmisSpecificEnergy,
        },
        {
          id: 'EnergyEmisBalanceSummary',
          title: 'Energy balance summary',
          note: 'Pick it to show where power comes from right now: generated on site, imported, and the fuel behind it.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          Component: EnergyEmisBalanceSummary,
        },
        {
          id: 'EnergyEmisConsumptionByConsumer',
          title: 'Consumption by consumer',
          note: 'Pick it to find the big consumers: ranked bars with tag, energy and share of the total.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisConsumptionByConsumer,
        },
        {
          id: 'EnergyEmisPowerDemandProfile',
          title: 'Power demand profile',
          note: 'Pick it for load planning: 24 hours of demand against what the site can generate itself.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisPowerDemandProfile,
        },
        {
          id: 'EnergyEmisCompressorMap',
          title: 'Compressor efficiency map',
          note: 'Pick it to see whether a machine runs where it was designed to: operating points against the design curve.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisCompressorMap,
        },
        {
          id: 'EnergyEmisIntensityBenchmark',
          title: 'Intensity benchmark',
          note: 'Pick it to compare sites or units on the same intensity measure against one target.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisIntensityBenchmark,
        },
      ],
    },
    {
      id: 'emissions',
      title: 'Emissions',
      description: 'What is emitted, from which source, and how close it is to the permit and the annual budget.',
      specimens: [
        {
          id: 'EnergyEmisCo2Tile',
          title: 'CO₂ tile with permit limit',
          note: 'Pick it for an emission with a daily permit: the bar shows the room left before the limit.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: EnergyEmisCo2Tile,
        },
        {
          id: 'EnergyEmisNearPermitTile',
          title: 'Near the permit limit',
          note: 'Pick it to see the warning state: the tile turns before the limit is crossed, and says how close it is.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: EnergyEmisNearPermitTile,
        },
        {
          id: 'EnergyEmisPermitHeadroom',
          title: 'Permit use',
          note: 'Pick it when several permits apply: each as a share of its limit, on one scale.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          Component: EnergyEmisPermitHeadroom,
        },
        {
          id: 'EnergyEmisBySource',
          title: 'Emissions by source',
          note: 'Pick it to show both the total per day and which source moves it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisBySource,
        },
        {
          id: 'EnergyEmisFlaringTrend',
          title: 'Flaring against permit',
          note: 'Pick it for one regulated stream over time, with the permit as a line and the days above it counted.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisFlaringTrend,
        },
        {
          id: 'EnergyEmisYtdVsBudget',
          title: 'Year to date against budget',
          note: 'Pick it for the annual view: cumulative emissions against a budget line that runs to December.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisYtdVsBudget,
        },
        {
          id: 'EnergyEmisSourceShare',
          title: 'Source ranking',
          note: 'Pick it for a single day or period, when the exact tonnes per source matter more than the trend.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisSourceShare,
        },
      ],
    },
    {
      id: 'methane',
      title: 'Methane leak detection',
      description: 'Leaks found by sensors, cameras and surveys, sized by measured rate and followed to repair.',
      specimens: [
        {
          id: 'EnergyEmisLeakSummary',
          title: 'Open leaks summary',
          note: 'Pick it for a dashboard: how many leaks are open, their combined rate and the split by size.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          Component: EnergyEmisLeakSummary,
        },
        {
          id: 'EnergyEmisLeakRow',
          title: 'Leak card',
          note: 'Pick it for a newly detected leak that needs a decision: where, how large, and the action to take.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: EnergyEmisLeakRow,
        },
        {
          id: 'EnergyEmisLeakList',
          title: 'Leak detection list',
          note: 'Pick it for the leak register: every leak with component, method, measured rate, status and next step.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: EnergyEmisLeakList,
        },
      ],
    },
    {
      id: 'abatement',
      title: 'Abatement and reporting',
      description: 'What could be done about it, the factors behind the figures, and progress against targets.',
      specimens: [
        {
          id: 'EnergyEmisAbatementCard',
          title: 'Abatement opportunity card',
          note: 'Pick it for one proposal: the estimated saving first, then what it costs and how fast it pays back.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: EnergyEmisAbatementCard,
        },
        {
          id: 'EnergyEmisAbatementRanked',
          title: 'Ranked abatement options',
          note: 'Pick it to prioritise: options side by side with saving, cost per tonne, payback and stage.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: EnergyEmisAbatementRanked,
        },
        {
          id: 'EnergyEmisFactorTable',
          title: 'Emission factor table',
          note: 'Pick it wherever figures are calculated: factor, unit, where it comes from and since when it applies.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisFactorTable,
        },
        {
          id: 'EnergyEmisScorecard',
          title: 'Sustainability scorecard',
          note: 'Pick it for a management view: each measure with actual, target and a status in words.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EnergyEmisScorecard,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A dashboard top section and the monthly report.',
      specimens: [
        {
          id: 'EnergyEmisOverviewPanel',
          title: 'Emissions overview',
          note: 'Pick it as the top of an emissions dashboard: four headline tiles, sources per day and permit use.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          size: 'full',
          align: 'stretch',
          Component: EnergyEmisOverviewPanel,
        },
        {
          id: 'EnergyEmisMonthlyReport',
          title: 'Monthly emissions report',
          note: 'Pick it for the reported figures: scope and source against budget and last year, with who verified them.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: EnergyEmisMonthlyReport,
        },
      ],
    },
  ],
});
