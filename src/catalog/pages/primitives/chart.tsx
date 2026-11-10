import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  chartSeriesColor,
} from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartCard } from '../../../library/data/ChartCard';
import { ASSETS, PLANT_KPIS, WORK_ORDERS } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatDate, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './chart.tsx?raw';

const CHART_FRAME = 'aspect-auto h-full w-full';

const CHART_DAYS = Array.from({ length: 7 }, (_, index) => formatDate(REFERENCE_NOW - (6 - index) * DAY));

/** Discharge pressure of the 1st stage compressor, hourly for 24 hours. */
const CHART_PRESSURE = makeSeries({ seed: 11, points: 24, base: 48.2, amplitude: 1.8, noise: 0.5, cycles: 1.5 }).map(
  (point) => ({ time: formatTime(point.t), pressure: point.v })
);

const CHART_TEMPERATURE_SOURCES = [
  makeSeries({ seed: 13, points: 24, base: 139, amplitude: 4, noise: 1.2, drift: 5 }),
  makeSeries({ seed: 31, points: 24, base: 128, amplitude: 3, noise: 1 }),
  makeSeries({ seed: 47, points: 24, base: 118, amplitude: 5, noise: 1.4, drift: -6 }),
];

/** Discharge temperature of the three compressors, hourly for 24 hours. */
const CHART_TEMPERATURES = CHART_TEMPERATURE_SOURCES[0].map((point, index) => ({
  time: formatTime(point.t),
  first: point.v,
  second: CHART_TEMPERATURE_SOURCES[1][index].v,
  recompressor: CHART_TEMPERATURE_SOURCES[2][index].v,
}));

/** Gas flow through the compressor, hourly for 24 hours, in kSm³/h. */
const CHART_FLOW = makeSeries({ seed: 16, points: 24, base: 182, amplitude: 14, noise: 4, cycles: 1 }).map((point) => ({
  time: formatTime(point.t),
  flow: point.v,
}));

/** Anti-surge valve position: a step signal that only changes when the controller moves it. */
const CHART_VALVE = [0, 0, 0, 0, 15, 15, 15, 40, 40, 40, 40, 25, 25, 10, 10, 0, 0, 0, 0, 20, 20, 20, 5, 0].map(
  (position, index) => ({ time: CHART_PRESSURE[index].time, position })
);

/** Bearing temperature with six hours of bad-quality data removed. */
const CHART_GAPPED = makeSeries({ seed: 22, points: 24, base: 61, amplitude: 4, noise: 1 }).map((point, index) => ({
  time: formatTime(point.t),
  temperature: index >= 9 && index <= 14 ? null : point.v,
}));

const CHART_DAILY = [
  { alarms: 5, min: 44.1, average: 47.6, max: 50.2, exported: 4.31, planned: 42, actual: 38 },
  { alarms: 3, min: 45.0, average: 48.0, max: 50.9, exported: 4.42, planned: 40, actual: 44 },
  { alarms: 8, min: 43.2, average: 47.1, max: 51.8, exported: 4.18, planned: 36, actual: 41 },
  { alarms: 4, min: 45.4, average: 48.3, max: 50.6, exported: 4.47, planned: 44, actual: 40 },
  { alarms: 2, min: 46.0, average: 48.4, max: 50.1, exported: 4.52, planned: 38, actual: 35 },
  { alarms: 6, min: 44.8, average: 48.1, max: 52.4, exported: 4.21, planned: 30, actual: 34 },
  { alarms: 4, min: 45.2, average: 48.6, max: 51.3, exported: 4.38, planned: 42, actual: 29 },
].map((row, index) => ({ ...row, day: CHART_DAYS[index], range: [row.min, row.max] }));

/** Gas export by receiving terminal, MSm³ per day. */
const CHART_EXPORT_STREAMS = [
  { pipeline: 2.4, lng: 1.3, local: 0.5 },
  { pipeline: 2.5, lng: 1.4, local: 0.5 },
  { pipeline: 2.2, lng: 1.5, local: 0.5 },
  { pipeline: 2.6, lng: 1.4, local: 0.4 },
  { pipeline: 2.7, lng: 1.3, local: 0.5 },
  { pipeline: 2.3, lng: 1.4, local: 0.5 },
  { pipeline: 2.5, lng: 1.4, local: 0.5 },
].map((row, index) => ({ ...row, day: CHART_DAYS[index] }));

/** Work orders closed per week, by type. */
const CHART_WORK_BY_TYPE = [
  { week: 'Week 7', corrective: 6, preventive: 11, inspection: 4 },
  { week: 'Week 8', corrective: 9, preventive: 10, inspection: 5 },
  { week: 'Week 9', corrective: 4, preventive: 12, inspection: 6 },
  { week: 'Week 10', corrective: 7, preventive: 9, inspection: 3 },
  { week: 'Week 11', corrective: 5, preventive: 13, inspection: 5 },
];

/** Downtime in hours over the last 30 days, worst first. */
const CHART_DOWNTIME = [
  { equipment: 'Recompressor', hours: 41 },
  { equipment: 'Cooling water pump', hours: 26 },
  { equipment: 'Interstage cooler', hours: 14 },
  { equipment: '1st stage compressor', hours: 9 },
  { equipment: 'Export pump B', hours: 4 },
];

const CHART_STATUS_LABELS = { open: 'Open', planned: 'Planned', 'in-progress': 'In progress', waiting: 'Waiting', done: 'Done' };

const CHART_STATUS_KEYS = ['open', 'planned', 'in-progress', 'waiting', 'done'] as const;

const CHART_WORK_BY_STATUS = CHART_STATUS_KEYS.map((status) => ({
  status,
  count: WORK_ORDERS.filter((order) => order.status === status).length,
  fill: `var(--color-${status})`,
}));

const CHART_STATUS_CONFIG = {
  count: { label: 'Work orders' },
  open: { label: 'Open', color: chartSeriesColor(1) },
  planned: { label: 'Planned', color: chartSeriesColor(2) },
  'in-progress': { label: 'In progress', color: chartSeriesColor(3) },
  waiting: { label: 'Waiting', color: chartSeriesColor(4) },
  done: { label: 'Done', color: chartSeriesColor(5) },
} satisfies ChartConfig;

const CHART_HEALTH = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type))
  .slice(0, 8)
  .map((asset) => ({ name: asset.name, score: asset.healthScore, fill: `var(--color-${asset.health})` }));

const CHART_HEALTH_CONFIG = {
  score: { label: 'Health score' },
  good: { label: 'Good, 85 or above', color: 'var(--color-chart-success-450)' },
  watch: { label: 'Watch, 60 to 84', color: 'var(--color-chart-warning-450)' },
  poor: { label: 'Poor, below 60', color: 'var(--color-chart-critical-450)' },
} satisfies ChartConfig;

const CHART_PRESSURE_CONFIG = {
  pressure: { label: 'Discharge pressure', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const CHART_TEMPERATURE_CONFIG = {
  first: { label: '1st stage', color: chartSeriesColor(1) },
  second: { label: '2nd stage', color: chartSeriesColor(2) },
  recompressor: { label: 'Recompressor', color: chartSeriesColor(3) },
} satisfies ChartConfig;

const CHART_STREAM_CONFIG = {
  pipeline: { label: 'Pipeline', color: chartSeriesColor(1) },
  lng: { label: 'LNG', color: chartSeriesColor(2) },
  local: { label: 'Local grid', color: chartSeriesColor(3) },
} satisfies ChartConfig;

const CHART_HOURS_CONFIG = {
  planned: { label: 'Planned hours', color: 'var(--color-chart-neutral-300)' },
  actual: { label: 'Actual hours', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const CHART_TYPE_CONFIG = {
  corrective: { label: 'Corrective', color: chartSeriesColor(1) },
  preventive: { label: 'Preventive', color: chartSeriesColor(2) },
  inspection: { label: 'Inspection', color: chartSeriesColor(3) },
} satisfies ChartConfig;

const barg = (value: string | number) => `${value} barg`;
const celsius = (value: string | number) => `${value} °C`;

function ChartLine() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_PRESSURE_CONFIG}
        className={CHART_FRAME}
        aria-label="Discharge pressure over the last 24 hours, between 46 and 51 barg"
      >
        <LineChart data={CHART_PRESSURE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[44, 52]} ticks={[44, 46, 48, 50, 52]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={barg} />} />
          <Line
            dataKey="pressure"
            type="monotone"
            stroke="var(--color-pressure)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartMultiLine() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_TEMPERATURE_CONFIG}
        className={CHART_FRAME}
        aria-label="Discharge temperature of three compressors over 24 hours; 1st stage is highest and rising"
      >
        <LineChart data={CHART_TEMPERATURES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[100, 160]} ticks={[100, 120, 140, 160]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={celsius} />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Line dataKey="first" type="monotone" stroke="var(--color-first)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="second" type="monotone" stroke="var(--color-second)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            dataKey="recompressor"
            type="monotone"
            stroke="var(--color-recompressor)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartLineWithDots() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ average: { label: 'Daily average', color: chartSeriesColor(1) } }}
        className={CHART_FRAME}
        aria-label="Daily average discharge pressure for the last 7 days, between 47 and 49 barg"
      >
        <LineChart data={CHART_DAILY} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[46, 50]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={barg} />} />
          <Line
            dataKey="average"
            type="linear"
            stroke="var(--color-average)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-average)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartStepLine() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ position: { label: 'Valve position', color: chartSeriesColor(4) } }}
        className={CHART_FRAME}
        aria-label="Anti-surge valve position over 24 hours, opening to 40 percent around 22:00"
      >
        <LineChart data={CHART_VALVE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[0, 50]} tickLine={false} axisLine={false} width={32} unit="%" />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} %`} />} />
          <Line
            dataKey="position"
            type="stepAfter"
            stroke="var(--color-position)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartLineWithGap() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="h-52 w-full">
        <ChartContainer
          config={{ temperature: { label: 'Bearing temperature', color: chartSeriesColor(1) } }}
          className={CHART_FRAME}
          aria-label="Bearing temperature over 24 hours with no data between 00:00 and 05:00"
        >
          <LineChart data={CHART_GAPPED} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
            <YAxis domain={[50, 70]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={celsius} />} />
            <Line
              dataKey="temperature"
              type="monotone"
              stroke="var(--color-temperature)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">No signal from 40-TT-40015 between 00:00 and 05:00.</p>
    </div>
  );
}

function ChartArea() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ flow: { label: 'Gas flow', color: chartSeriesColor(2) } }}
        className={CHART_FRAME}
        aria-label="Gas flow over the last 24 hours, peaking near 196 thousand standard cubic metres per hour"
      >
        <AreaChart data={CHART_FLOW} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[0, 240]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} kSm³/h`} />} />
          <Area
            dataKey="flow"
            type="monotone"
            stroke="var(--color-flow)"
            strokeWidth={2}
            fill="var(--color-chart-2-100)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function ChartStackedArea() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_STREAM_CONFIG}
        className={CHART_FRAME}
        aria-label="Daily gas export by destination for 7 days; pipeline is the largest share at about 2.5 million cubic metres"
      >
        <AreaChart data={CHART_EXPORT_STREAMS} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={24} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} MSm³`} />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Area dataKey="pipeline" stackId="export" type="monotone" stroke="var(--color-pipeline)" fill="var(--color-chart-1-200)" isAnimationActive={false} />
          <Area dataKey="lng" stackId="export" type="monotone" stroke="var(--color-lng)" fill="var(--color-chart-2-200)" isAnimationActive={false} />
          <Area dataKey="local" stackId="export" type="monotone" stroke="var(--color-local)" fill="var(--color-chart-3-200)" isAnimationActive={false} />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function ChartRangeBand() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{
          range: { label: 'Daily min to max', color: 'var(--color-chart-1-200)' },
          average: { label: 'Daily average', color: chartSeriesColor(1) },
        }}
        className={CHART_FRAME}
        aria-label="Daily minimum, average and maximum discharge pressure for 7 days; widest spread on 8 March"
      >
        <ComposedChart data={CHART_DAILY} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[40, 56]} ticks={[40, 44, 48, 52, 56]} tickLine={false} axisLine={false} width={32} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Area dataKey="range" type="monotone" stroke="none" fill="var(--color-range)" isAnimationActive={false} />
          <Line dataKey="average" type="monotone" stroke="var(--color-average)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function ChartBar() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ alarms: { label: 'Alarms', color: chartSeriesColor(1) } }}
        className={CHART_FRAME}
        aria-label="Alarms raised per day for the last 7 days, highest on 8 March with 8"
      >
        <BarChart data={CHART_DAILY} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="alarms" fill="var(--color-alarms)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartGroupedBar() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_HOURS_CONFIG}
        className={CHART_FRAME}
        aria-label="Planned and actual maintenance hours per day for 7 days; actual fell to 29 of 42 planned on 12 March"
      >
        <BarChart data={CHART_DAILY} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={24} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} h`} />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartStackedBar() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_TYPE_CONFIG}
        className={CHART_FRAME}
        aria-label="Work orders closed per week by type for 5 weeks; preventive work is the largest group every week"
      >
        <BarChart data={CHART_WORK_BY_TYPE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Bar dataKey="corrective" stackId="type" fill="var(--color-corrective)" isAnimationActive={false} />
          <Bar dataKey="preventive" stackId="type" fill="var(--color-preventive)" isAnimationActive={false} />
          <Bar dataKey="inspection" stackId="type" fill="var(--color-inspection)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartHorizontalBar() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ hours: { label: 'Downtime', color: chartSeriesColor(1) } }}
        className={CHART_FRAME}
        aria-label="Downtime by equipment for the last 30 days; the recompressor leads with 41 hours"
      >
        <BarChart data={CHART_DOWNTIME} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, 'dataMax']} hide />
          <YAxis type="category" dataKey="equipment" tickLine={false} axisLine={false} width={140} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} h`} />} />
          <Bar dataKey="hours" fill="var(--color-hours)" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
            <LabelList dataKey="hours" position="right" className="fill-base-foreground" formatter={(value) => `${String(value)} h`} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartBarWithLabels() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ exported: { label: 'Gas export', color: chartSeriesColor(2) } }}
        className={CHART_FRAME}
        aria-label="Gas export per day for 7 days in million standard cubic metres, between 4.18 and 4.52"
      >
        <BarChart data={CHART_DAILY} margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 5]} hide />
          <Bar dataKey="exported" fill="var(--color-exported)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="exported" position="top" className="fill-base-foreground" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartDonut() {
  return (
    <div className="flex w-full items-center justify-center gap-6">
      <div className="relative size-44 shrink-0">
        <ChartContainer
          config={CHART_STATUS_CONFIG}
          className={CHART_FRAME}
          aria-label="8 work orders by status: 2 open, 2 planned, 1 in progress, 1 waiting, 2 done"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
            <Pie
              data={CHART_WORK_BY_STATUS}
              dataKey="count"
              nameKey="status"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              isAnimationActive={false}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-base-foreground">{WORK_ORDERS.length}</span>
          <span className="text-xs text-muted-foreground">work orders</span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {CHART_WORK_BY_STATUS.map((entry) => (
          <li key={entry.status} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-xs"
              style={{ backgroundColor: CHART_STATUS_CONFIG[entry.status].color }}
            />
            <span className="text-medium-foreground">{CHART_STATUS_LABELS[entry.status]}</span>
            <span className="ml-auto pl-4 tabular-nums text-base-foreground">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartPie() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_STREAM_CONFIG}
        className={CHART_FRAME}
        aria-label="Gas export on 12 March by destination: pipeline 2.5, LNG 1.4 and local grid 0.5 million cubic metres"
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="stream" hideLabel />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent nameKey="stream" />} />
          <Pie
            data={[
              { stream: 'pipeline', volume: 2.5, fill: 'var(--color-pipeline)' },
              { stream: 'lng', volume: 1.4, fill: 'var(--color-lng)' },
              { stream: 'local', volume: 0.5, fill: 'var(--color-local)' },
            ]}
            dataKey="volume"
            nameKey="stream"
            outerRadius={80}
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

function ChartReferenceLine() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_PRESSURE_CONFIG}
        className={CHART_FRAME}
        aria-label="Discharge pressure over 24 hours against the 52 barg high limit; the limit is not reached"
      >
        <LineChart data={CHART_PRESSURE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[44, 54]} ticks={[44, 46, 48, 50, 52, 54]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={barg} />} />
          <ReferenceLine
            y={52}
            stroke="var(--color-chart-critical-450)"
            strokeDasharray="4 4"
            label={{ value: 'High limit 52 barg', position: 'insideTopRight', className: 'fill-muted-foreground' }}
          />
          <Line dataKey="pressure" type="monotone" stroke="var(--color-pressure)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartOperatingBand() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ first: { label: '1st stage discharge temperature', color: chartSeriesColor(1) } }}
        className={CHART_FRAME}
        aria-label="1st stage discharge temperature over 24 hours, inside the operating range and approaching its 145 degree upper edge"
      >
        <LineChart data={CHART_TEMPERATURES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[120, 160]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={celsius} />} />
          <ReferenceArea
            y1={120}
            y2={145}
            fill="var(--color-chart-neutral-100)"
            stroke="none"
            label={{ value: 'Operating range', position: 'insideBottomLeft', className: 'fill-muted-foreground' }}
          />
          <Line dataKey="first" type="monotone" stroke="var(--color-first)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartTooltipPinned() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_TEMPERATURE_CONFIG}
        className={CHART_FRAME}
        aria-label="Discharge temperature of three compressors over 24 hours with a tooltip comparing them at one time"
      >
        <LineChart data={CHART_TEMPERATURES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis domain={[100, 160]} ticks={[100, 120, 140, 160]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip defaultIndex={8} content={<ChartTooltipContent indicator="line" valueFormatter={celsius} />} />
          <Line dataKey="first" type="monotone" stroke="var(--color-first)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="second" type="monotone" stroke="var(--color-second)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="recompressor" type="monotone" stroke="var(--color-recompressor)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartLegendOnTop() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={CHART_HOURS_CONFIG}
        className={CHART_FRAME}
        aria-label="Planned and actual maintenance hours per day for 7 days"
      >
        <LineChart data={CHART_DAILY} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[20, 50]} ticks={[20, 30, 40, 50]} tickLine={false} axisLine={false} width={24} />
          <ChartLegend itemSorter={null} verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
          <Line dataKey="planned" type="monotone" stroke="var(--color-planned)" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ChartStatusColoured() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="h-64 w-full">
        <ChartContainer
          config={CHART_HEALTH_CONFIG}
          className={CHART_FRAME}
          aria-label="Health score by equipment; the recompressor is poor at 41, the interstage cooler and 1st stage compressor are on watch"
        >
          <BarChart data={CHART_HEALTH} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={150} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
              <LabelList dataKey="score" position="right" className="fill-base-foreground" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-medium-foreground">
        {(['good', 'watch', 'poor'] as const).map((health) => (
          <li key={health} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-xs" style={{ backgroundColor: CHART_HEALTH_CONFIG[health].color }} />
            {CHART_HEALTH_CONFIG[health].label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartComposed() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{
          exported: { label: 'Gas export', color: 'var(--color-chart-1-300)' },
          alarms: { label: 'Alarms', color: chartSeriesColor(5) },
        }}
        className={CHART_FRAME}
        aria-label="Daily gas export as bars with alarms per day as a line; export dips on the days with the most alarms"
      >
        <ComposedChart data={CHART_DAILY} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis yAxisId="export" domain={[3.5, 5]} ticks={[3.5, 4, 4.5, 5]} tickLine={false} axisLine={false} width={32} />
          <YAxis yAxisId="alarms" orientation="right" allowDecimals={false} domain={[0, 9]} ticks={[0, 3, 6, 9]} tickLine={false} axisLine={false} width={24} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Bar yAxisId="export" dataKey="exported" fill="var(--color-exported)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="alarms" dataKey="alarms" type="monotone" stroke="var(--color-alarms)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-alarms)' }} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function ChartTargetLine() {
  return (
    <div className="h-56 w-full">
      <ChartContainer
        config={{ exported: { label: 'Gas export', color: chartSeriesColor(1) } }}
        className={CHART_FRAME}
        aria-label="Daily gas export for 7 days against the 4.5 million cubic metre target; only 10 March meets it"
      >
        <BarChart data={CHART_DAILY} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[3.5, 5]} ticks={[3.5, 4, 4.5, 5]} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} MSm³`} />} />
          <Bar dataKey="exported" fill="var(--color-exported)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <ReferenceLine
            y={PLANT_KPIS.gasExport.target}
            stroke="var(--color-chart-neutral-450)"
            strokeDasharray="4 4"
            label={{ value: 'Target 4.5', position: 'insideTopRight', className: 'fill-muted-foreground' }}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ChartSparkline() {
  return (
    <div className="flex w-full max-w-xs items-end justify-between gap-4 rounded-xl bg-muted-background p-4">
      <div>
        <p className="text-xs text-muted-foreground">Discharge pressure</p>
        <p className="text-2xl font-semibold tabular-nums text-base-foreground">
          48.6 <span className="text-sm font-medium text-muted-foreground">barg</span>
        </p>
      </div>
      <div className="h-10 w-28">
        <ChartContainer
          config={CHART_PRESSURE_CONFIG}
          className={CHART_FRAME}
          aria-label="Discharge pressure trend for the last 24 hours, stable"
        >
          <LineChart data={CHART_PRESSURE} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line dataKey="pressure" type="monotone" stroke="var(--color-pressure)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-56 w-full flex-col gap-3" role="status" aria-label="Loading chart">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="min-h-0 w-full flex-1" />
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-56 w-full items-center justify-center rounded-xl bg-muted-background">
      <EmptyState type="no-results">
        <EmptyStateIcon />
        <EmptyStateTitle as="p">No data in this period</EmptyStateTitle>
        <EmptyStateDescription>23-PT-92531 has no datapoints between 1 and 3 March.</EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="secondary" size="sm">
            Show last 24 hours
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}

function ChartInCard() {
  return (
    <ChartCard
      title="Discharge pressure"
      description="23-PT-92531 · last 24 hours"
      summary="Stable between 46 and 51 barg, well below the 52 barg high limit."
    >
      <div className="h-48 w-full">
        <ChartContainer config={CHART_PRESSURE_CONFIG} className={CHART_FRAME} aria-label="Discharge pressure over the last 24 hours">
          <AreaChart data={CHART_PRESSURE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
            <YAxis domain={[44, 54]} ticks={[44, 46, 48, 50, 52, 54]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={barg} />} />
            <Area dataKey="pressure" type="monotone" stroke="var(--color-pressure)" strokeWidth={2} fill="var(--color-chart-1-100)" isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </div>
    </ChartCard>
  );
}

function ChartCardToggleLegend() {
  return (
    <ChartCard
      title="Discharge temperature"
      description="Gas compression · last 24 hours"
      summary="1st stage has risen 5 °C over the day and is close to its 145 °C limit. Select a legend entry to hide that series."
      toggleable
      series={[
        { key: 'first', label: '1st stage', color: chartSeriesColor(1) },
        { key: 'second', label: '2nd stage', color: chartSeriesColor(2) },
        { key: 'recompressor', label: 'Recompressor', color: chartSeriesColor(3) },
      ]}
    >
      {(isVisible) => (
        <div className="h-56 w-full">
          <ChartContainer
            config={CHART_TEMPERATURE_CONFIG}
            className={CHART_FRAME}
            aria-label="Discharge temperature of three compressors over 24 hours"
          >
            <LineChart data={CHART_TEMPERATURES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
              <YAxis domain={[100, 160]} ticks={[100, 120, 140, 160]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent valueFormatter={celsius} />} />
              <ReferenceLine y={145} stroke="var(--color-chart-critical-450)" strokeDasharray="4 4" />
              {isVisible('first') ? (
                <Line dataKey="first" type="monotone" stroke="var(--color-first)" strokeWidth={2} dot={false} isAnimationActive={false} />
              ) : null}
              {isVisible('second') ? (
                <Line dataKey="second" type="monotone" stroke="var(--color-second)" strokeWidth={2} dot={false} isAnimationActive={false} />
              ) : null}
              {isVisible('recompressor') ? (
                <Line dataKey="recompressor" type="monotone" stroke="var(--color-recompressor)" strokeWidth={2} dot={false} isAnimationActive={false} />
              ) : null}
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}

function ChartSmallMultiples() {
  const panels = [
    { key: 'first', title: '1st stage compressor', latest: CHART_TEMPERATURES[23].first },
    { key: 'second', title: '2nd stage compressor', latest: CHART_TEMPERATURES[23].second },
    { key: 'recompressor', title: 'Recompressor', latest: CHART_TEMPERATURES[23].recompressor },
  ] as const;

  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {panels.map((panel) => (
        <section key={panel.key} className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="truncate text-sm font-medium text-base-foreground">{panel.title}</h4>
            <span className="shrink-0 text-sm tabular-nums text-medium-foreground">{panel.latest} °C</span>
          </div>
          <div className="h-32 w-full">
            <ChartContainer
              config={{ [panel.key]: { label: 'Discharge temperature', color: chartSeriesColor(1) } }}
              className={CHART_FRAME}
              aria-label={`${panel.title} discharge temperature over 24 hours, now ${panel.latest} degrees`}
            >
              <LineChart data={CHART_TEMPERATURES} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={48} />
                <YAxis domain={[100, 160]} ticks={[100, 130, 160]} tickLine={false} axisLine={false} width={28} />
                <Line dataKey={panel.key} type="monotone" stroke={chartSeriesColor(1)} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </section>
      ))}
    </div>
  );
}

export default definePage({
  id: 'chart',
  title: 'Chart',
  summary:
    'Charts plot data with Recharts inside an Aura container that supplies themed axes, grid lines, tooltip and legend. Series colours come from the chart tokens, so they work in both themes.',
  docsSlug: 'chart',
  guidance: {
    use: [
      'Lines for change over time, bars for comparing amounts, a donut for a few parts of one whole.',
      'Series colours in token order: chart-1, then 2, 3, 4, 5. Status chart tokens only when the colour is the status.',
      'An aria-label that states what the chart shows and the main finding.',
      'Units on the axis or in the tooltip, and a visible text summary on dashboards.',
    ],
    avoid: [
      'More than five series in one plot; split into small multiples.',
      'Decorative or semantic UI tokens for plotted data, and chart tokens for anything else.',
      'Pie charts with many slices or slices of similar size; use a horizontal bar chart.',
      'Colour as the only way to tell series or states apart; add labels or a legend.',
    ],
  },
  source,
  sections: [
    {
      id: 'line-and-area',
      title: 'Line and area',
      description: 'Change over time. Lines for values, areas for volumes and ranges.',
      specimens: [
        {
          id: 'ChartLine',
          title: 'Line',
          note: 'One measurement over time, such as a sensor trend.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartLine,
        },
        {
          id: 'ChartMultiLine',
          title: 'Multiple lines',
          note: 'Up to five comparable series on one scale, with a legend.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartMultiLine,
        },
        {
          id: 'ChartLineWithDots',
          title: 'Line with points',
          note: 'Few, evenly spaced values, such as daily aggregates, where each point is a reading.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartLineWithDots,
        },
        {
          id: 'ChartStepLine',
          title: 'Step line',
          note: 'Setpoints, valve positions and states that hold a value until they change.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartStepLine,
        },
        {
          id: 'ChartLineWithGap',
          title: 'Line with missing data',
          note: 'Bad-quality periods are left open instead of being bridged, and explained in text.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartLineWithGap,
        },
        {
          id: 'ChartArea',
          title: 'Area',
          note: 'A volume or rate where the amount under the line matters; start the axis at zero.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartArea,
        },
        {
          id: 'ChartStackedArea',
          title: 'Stacked area',
          note: 'Parts that add up to a total over time.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartStackedArea,
        },
        {
          id: 'ChartRangeBand',
          title: 'Range band',
          note: 'Aggregated data: the band shows minimum to maximum, the line the average.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartRangeBand,
        },
      ],
    },
    {
      id: 'bar',
      title: 'Bar',
      description: 'Comparing amounts across categories or periods.',
      specimens: [
        {
          id: 'ChartBar',
          title: 'Bar',
          note: 'Counts per period, such as alarms per day.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartBar,
        },
        {
          id: 'ChartGroupedBar',
          title: 'Grouped bars',
          note: 'Two measures side by side per period; the baseline takes the neutral chart colour.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartGroupedBar,
        },
        {
          id: 'ChartStackedBar',
          title: 'Stacked bars',
          note: 'A total per period and what it is made of.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartStackedBar,
        },
        {
          id: 'ChartHorizontalBar',
          title: 'Horizontal bars',
          note: 'Ranking categories with long names; values are labelled so no axis is needed.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartHorizontalBar,
        },
        {
          id: 'ChartBarWithLabels',
          title: 'Bars with value labels',
          note: 'A handful of bars where the exact numbers matter more than the scale.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartBarWithLabels,
        },
        {
          id: 'ChartTargetLine',
          title: 'Bars against a target',
          note: 'Shows which periods met a fixed target.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartTargetLine,
        },
      ],
    },
    {
      id: 'part-to-whole',
      title: 'Part to whole',
      description: 'A few parts of one total. Keep it to five slices or fewer.',
      specimens: [
        {
          id: 'ChartDonut',
          title: 'Donut with total',
          note: 'The total in the centre and each part named in a list beside it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ChartDonut,
        },
        {
          id: 'ChartPie',
          title: 'Pie',
          note: 'Two or three parts with clearly different sizes.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartPie,
        },
      ],
    },
    {
      id: 'reading-aids',
      title: 'Limits, legends and tooltips',
      description: 'What helps people read a value against its context.',
      specimens: [
        {
          id: 'ChartReferenceLine',
          title: 'With limit line',
          note: 'An alarm or trip limit drawn as a dashed line and named on the plot.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartReferenceLine,
        },
        {
          id: 'ChartOperatingBand',
          title: 'With operating range',
          note: 'A shaded band for the normal range, so excursions stand out.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartOperatingBand,
        },
        {
          id: 'ChartTooltipPinned',
          title: 'Tooltip with line indicators',
          note: 'Compares every series at one point in time, with units in the values.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartTooltipPinned,
        },
        {
          id: 'ChartLegendOnTop',
          title: 'Legend on top',
          note: 'Puts the key before the plot; the dashed line separates plan from actual without colour.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartLegendOnTop,
        },
        {
          id: 'ChartStatusColoured',
          title: 'Status-coloured bars',
          note: 'The status chart tokens, used only because the colour is the health class; values and a key back it up.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartStatusColoured,
        },
        {
          id: 'ChartComposed',
          title: 'Bars and line, two axes',
          note: 'Two measures with different units that people need to relate.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartComposed,
        },
      ],
    },
    {
      id: 'states',
      title: 'Minimal and states',
      description: 'The smallest useful chart, and what the slot shows without data.',
      specimens: [
        {
          id: 'ChartSparkline',
          title: 'Sparkline',
          note: 'A trend beside a number in a tile or table row: no axes, no grid, no tooltip.',
          origin: 'aura',
          Component: ChartSparkline,
        },
        {
          id: 'ChartLoading',
          title: 'Loading',
          note: 'A skeleton the size of the chart, so the layout does not shift when data arrives.',
          origin: 'aura',
          align: 'stretch',
          Component: ChartLoading,
        },
        {
          id: 'ChartEmpty',
          title: 'Empty',
          note: 'No data for the selected period: say so and offer a period that has data.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ChartEmpty,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Charts in the frame they use on a dashboard.',
      specimens: [
        {
          id: 'ChartInCard',
          title: 'Chart card',
          note: 'The dashboard frame: title, context, plot and a one-line summary of the finding.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['data/ChartCard.tsx'],
          Component: ChartInCard,
        },
        {
          id: 'ChartCardToggleLegend',
          title: 'Chart card with toggle legend',
          note: 'Several series where people want to isolate one; legend entries hide and show series.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['data/ChartCard.tsx'],
          Component: ChartCardToggleLegend,
        },
        {
          id: 'ChartSmallMultiples',
          title: 'Small multiples',
          note: 'The same chart per equipment on a shared scale, instead of many lines in one plot.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ChartSmallMultiples,
        },
      ],
    },
  ],
});
