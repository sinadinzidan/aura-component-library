import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowsHorizontal,
  IconBell,
  IconChartHistogram,
  IconCircleCheck,
  IconClock,
  IconGauge,
  IconShieldExclamation,
  IconTemperature,
  IconWaveSine,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { BoxRows, type BoxRow } from '../../../library/kit/distributions/BoxRows';
import { HeatGrid, type HeatGridRow } from '../../../library/kit/distributions/HeatGrid';
import { Histogram } from '../../../library/kit/distributions/Histogram';
import { RISK_LABEL, RISK_LEVELS, RISK_TONE, countByRiskLevel, riskLevel, type RiskItem } from '../../../library/kit/distributions/risk';
import { RiskMatrix, type RiskCell } from '../../../library/kit/distributions/RiskMatrix';
import { ScatterPlot, type ScatterPoint } from '../../../library/kit/distributions/ScatterPlot';
import { boxStats, bucketize, correlation, cumulativeShare, linearTicks, quantile } from '../../../library/kit/distributions/stats';
import { Donut, type DonutSegment } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { ASSETS, type Asset } from '../../data/plant';
import { DAY, REFERENCE_NOW, createRandom, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './distributions.tsx?raw';

const DIST_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const distRound = (value: number, decimals = 1): number => Math.round(value * 10 ** decimals) / 10 ** decimals;

const distShare = (values: readonly number[], test: (value: number) => boolean): number => (values.filter(test).length / values.length) * 100;

/** Hourly averages for the last 30 days. */
const DIST_PRESSURE = makeValues({ seed: 11, points: 720, base: 48.2, amplitude: 1.5, noise: 0.6, cycles: 30 });

const DIST_TEMPERATURE = makeValues({ seed: 13, points: 720, base: 139.6, amplitude: 3.2, noise: 1.5, cycles: 30 });

const DIST_PRESSURE_RANGE = { bins: 16, min: 44, max: 52 };

const DIST_TEMPERATURE_RANGE = { bins: 20, min: 130, max: 150 };

const DIST_PRESSURE_BINS = bucketize(DIST_PRESSURE, DIST_PRESSURE_RANGE);

const DIST_TEMPERATURE_BINS = bucketize(DIST_TEMPERATURE, DIST_TEMPERATURE_RANGE);

const DIST_HOURS_ABOVE = DIST_TEMPERATURE.filter((value) => value > 145).length;

const distIsNight = (index: number): boolean => index % 24 < 6 || index % 24 >= 22;

const DIST_DAY_BINS = bucketize(
  DIST_PRESSURE.filter((_, index) => !distIsNight(index)),
  DIST_PRESSURE_RANGE
);

const DIST_NIGHT_BINS = bucketize(
  DIST_PRESSURE.filter((_, index) => distIsNight(index)).map((value) => value - 0.7),
  DIST_PRESSURE_RANGE
);

const DIST_PRESSURE_CDF = cumulativeShare(DIST_PRESSURE_BINS).map((value) => distRound(value));

const DIST_CDF_LABELS = DIST_PRESSURE_BINS.map((_, index) => formatNumber(44 + (index + 1) * 0.5, 1));

const DIST_RUN_STATES: DonutSegment[] = [
  { label: 'Running', value: 618, tone: 'success' },
  { label: 'Standby', value: 52, tone: 'info' },
  { label: 'Maintenance', value: 28, tone: 'warning' },
  { label: 'Tripped', value: 14, tone: 'critical' },
  { label: 'Stopped', value: 8, tone: 'neutral' },
];

const DIST_TRIP_CAUSES = [
  { cause: 'High vibration', trips: 9 },
  { cause: 'Lube oil pressure', trips: 6 },
  { cause: 'Surge protection', trips: 4 },
  { cause: 'Instrument fault', trips: 3 },
  { cause: 'Operator stop', trips: 2 },
];

/** Drive-end vibration per machine over 30 days, mm/s. */
const DIST_VIBRATION: BoxRow[] = [
  { id: '23-ka-9101', name: '1st stage compressor', tag: '23-KA-9101', seed: 14, base: 5.6, noise: 0.5 },
  { id: '23-ka-9102', name: '2nd stage compressor', tag: '23-KA-9102', seed: 24, base: 3.9, noise: 0.3 },
  { id: '23-ka-9103', name: 'Recompressor', tag: '23-KA-9103', seed: 41, base: 6.4, noise: 0.9 },
  { id: '23-gt-9001', name: 'Compressor gas turbine', tag: '23-GT-9001', seed: 34, base: 4.4, noise: 0.35 },
  { id: '27-pa-2001a', name: 'Export pump A', tag: '27-PA-2001A', seed: 44, base: 2.6, noise: 0.25 },
  { id: '27-pa-2001b', name: 'Export pump B', tag: '27-PA-2001B', seed: 54, base: 2.9, noise: 0.2 },
].map((machine) => {
  const stats = boxStats(makeValues({ seed: machine.seed, points: 720, base: machine.base, amplitude: machine.noise, noise: machine.noise, cycles: 9, min: 0.5 }));
  const tone: Tone = stats.max >= 9 ? 'critical' : stats.q3 > 6 ? 'warning' : 'accent';
  return { id: machine.id, label: machine.name, sublabel: machine.tag, stats, tone };
});

/** Share of the last 30 days each reading spent in its normal, warning and trip zones. */
const DIST_TIME_IN_ZONE = [
  { name: 'Discharge pressure', normal: 98, warning: 2, critical: 0 },
  { name: 'Discharge temperature', normal: 93, warning: 7, critical: 0 },
  { name: 'Drive-end vibration', normal: 81, warning: 17, critical: 2 },
  { name: 'Separator level', normal: 96, warning: 4, critical: 0 },
];

/** Discharge pressure against gas flow, one point per hour for 7 days. */
const distScatterRandom = createRandom(91);

const DIST_FLOW_PRESSURE: ScatterPoint[] = Array.from({ length: 168 }, (_, index) => {
  const flow = 150 + distScatterRandom() * 55;
  const night = distIsNight(index);
  return { x: distRound(flow, 0), y: distRound(37.6 + flow * 0.058 + (distScatterRandom() - 0.5) * 2.2 - (night ? 0.9 : 0)), group: night ? 'night' : 'day' };
});

const DIST_FLOW_AXIS = { min: 140, max: 220, ticks: linearTicks(140, 220, 4), title: 'Gas flow, kSm³/h' };

const DIST_PRESSURE_AXIS = { min: 44, max: 52, ticks: linearTicks(44, 52, 4), title: 'Discharge pressure, barg' };

const DIST_ENVELOPE: { x: [number, number]; y: [number, number]; label: string } = { x: [160, 205], y: [46.5, 50.5], label: 'Normal envelope' };

const DIST_INSIDE = distShare(
  DIST_FLOW_PRESSURE.map((_, index) => index),
  (index) => {
    const point = DIST_FLOW_PRESSURE[index];
    return point.x >= 160 && point.x <= 205 && point.y >= 46.5 && point.y <= 50.5;
  }
);

const DIST_FLOW_CORRELATION = correlation(
  DIST_FLOW_PRESSURE.map((point) => point.x),
  DIST_FLOW_PRESSURE.map((point) => point.y)
);

/** Equipment by years since overhaul and health score; the bubble grows with open maintenance hours. */
const DIST_YEARS_SINCE_OVERHAUL: Record<string, number> = {
  '20-va-1001': 1.2,
  '20-va-1002': 2.6,
  '20-xv-1105': 0.8,
  '23-ka-9101': 7.0,
  '23-ka-9102': 3.1,
  '23-ka-9103': 5.4,
  '23-ha-9114': 4.3,
  '23-gt-9001': 3.8,
  '27-pa-2001a': 1.9,
  '27-pa-2001b': 2.2,
  '40-pa-4001': 1.4,
};

const DIST_BUBBLES: ScatterPoint[] = DIST_EQUIPMENT.map((asset) => ({
  x: DIST_YEARS_SINCE_OVERHAUL[asset.id] ?? 2,
  y: asset.healthScore,
  size: 12 + (100 - asset.healthScore) * 0.7,
  group: asset.criticality,
  label: asset.healthScore < 70 ? asset.name : undefined,
}));

const DIST_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DIST_HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

/** Alarms per hour of the week, summed over the last 12 weeks. Handovers at 06, 14 and 22 stand out. */
const distHeatRandom = createRandom(73);

const DIST_ALARMS_BY_HOUR: HeatGridRow[] = DIST_WEEKDAYS.map((day, dayIndex) => ({
  id: day,
  label: day,
  values: DIST_HOURS.map((_, hour) => {
    const handover = [6, 14, 22].includes(hour) ? 9 : [7, 15, 23].includes(hour) ? 4 : 0;
    const weekend = dayIndex >= 5 ? -2 : 0;
    const dayTime = hour >= 8 && hour <= 17 ? 3 : 0;
    return Math.max(0, Math.round(2 + handover + dayTime + weekend + distHeatRandom() * 4));
  }),
}));

const DIST_ALARM_PEAK = Math.max(...DIST_ALARMS_BY_HOUR.flatMap((row) => row.values.map((value) => value ?? 0)));

const DIST_ALARM_TOTAL = DIST_ALARMS_BY_HOUR.reduce((sum, row) => sum + row.values.reduce<number>((inner, value) => inner + (value ?? 0), 0), 0);

const DIST_DAYS_14 = Array.from({ length: 14 }, (_, index) => formatDate(REFERENCE_NOW - (13 - index) * DAY).replace(' Mar', '').replace(' Feb', ''));

const distAssetRandom = createRandom(37);

/** Alarms per day for each piece of equipment over 14 days; the cooling water pump lost its historian link for three days. */
const DIST_ALARMS_BY_ASSET: HeatGridRow[] = DIST_EQUIPMENT.slice(2, 10).map((asset) => ({
  id: asset.id,
  label: asset.name,
  values: DIST_DAYS_14.map((_, day) => {
    if (asset.id === '40-pa-4001' && day >= 4 && day <= 6) return null;
    const base = (100 - asset.healthScore) / 9;
    const trip = asset.id === '23-ka-9103' && day >= 9 ? 9 : 0;
    return Math.max(0, Math.round(base + trip + (distAssetRandom() - 0.4) * 3));
  }),
}));

/** Flaring per day for 12 weeks, kSm³. Columns are weeks, rows weekdays. */
const DIST_FLARING = makeValues({ seed: 43, points: 84, base: 13, noise: 3.4, stepMs: DAY, min: 5, decimals: 0 });

const DIST_WEEK_STARTS = Array.from({ length: 12 }, (_, week) => formatDate(REFERENCE_NOW - 3 * DAY - (11 - week) * 7 * DAY));

const DIST_FLARING_CALENDAR: HeatGridRow[] = DIST_WEEKDAYS.map((day, dayIndex) => ({
  id: day,
  label: day,
  values: DIST_WEEK_STARTS.map((_, week) => (week === 11 && dayIndex > 3 ? null : DIST_FLARING[week * 7 + dayIndex] + (week === 7 && dayIndex === 2 ? 14 : 0))),
}));

const DIST_SHIFT_ALARMS: HeatGridRow[] = [
  { id: 'night', label: 'Night', values: [14, 12, 15, 11, 13, 6, 5] },
  { id: 'day', label: 'Day', values: [21, 18, 24, 19, 22, 12, 9] },
  { id: 'evening', label: 'Evening', values: [9, 11, 8, 12, 10, 7, 4] },
];

/** Correlation between six readings of the 1st stage compressor over 30 days. */
const DIST_LOAD = makeValues({ seed: 61, points: 720, base: 0, amplitude: 1, noise: 0.6, cycles: 12, decimals: 3 });

const distMixed = (seed: number, weight: number): number[] => {
  const noise = makeValues({ seed, points: 720, base: 0, noise: 0.8, decimals: 3 });
  return DIST_LOAD.map((value, index) => value * weight + noise[index] * (1 - Math.abs(weight)));
};

const DIST_CORRELATED = [
  { name: 'Flow', values: distMixed(101, 0.95) },
  { name: 'Speed', values: distMixed(102, 0.9) },
  { name: 'Discharge P', values: distMixed(103, 0.8) },
  { name: 'Discharge T', values: distMixed(104, 0.6) },
  { name: 'Suction P', values: distMixed(105, -0.55) },
  { name: 'Vibration', values: distMixed(106, 0.2) },
];

const DIST_CORRELATION: HeatGridRow[] = DIST_CORRELATED.map((row) => ({
  id: row.name,
  label: row.name,
  values: DIST_CORRELATED.map((column) => distRound(correlation(row.values, column.values), 2)),
}));

/** Pressure by hour of day over 30 days: the median with the 5th and 95th percentile around it. */
const DIST_HOURLY = DIST_HOURS.map((_, hour) => {
  const sample = DIST_PRESSURE.filter((_value, index) => index % 24 === hour).map((value) => value + Math.sin((hour / 24) * Math.PI * 2) * 0.9);
  return { p5: distRound(quantile(sample, 0.05), 2), p50: distRound(quantile(sample, 0.5), 2), p95: distRound(quantile(sample, 0.95), 2) };
});

const distLikelihood = (asset: Asset): number => (asset.healthScore >= 93 ? 1 : asset.healthScore >= 85 ? 2 : asset.healthScore >= 60 ? 3 : asset.healthScore >= 50 ? 4 : 5);

const distConsequence = (asset: Asset): number =>
  asset.criticality === 'A' ? (asset.type === 'compressor' || asset.type === 'turbine' ? 5 : 4) : asset.criticality === 'B' ? 3 : 2;

const DIST_RISKS: RiskItem[] = DIST_EQUIPMENT.map((asset) => ({ id: asset.id, label: asset.tag, likelihood: distLikelihood(asset), consequence: distConsequence(asset) }));

const DIST_RISK_COUNTS = countByRiskLevel(DIST_RISKS);

const DIST_RANKED = [...DIST_EQUIPMENT].sort((a, b) => distLikelihood(b) * distConsequence(b) - distLikelihood(a) * distConsequence(a));

const DIST_RISK_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', cell: (asset) => asset.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (asset) => <TagId>{asset.tag}</TagId> },
  { id: 'score', header: 'Score', numeric: true, cell: (asset) => distLikelihood(asset) * distConsequence(asset) },
  {
    id: 'level',
    header: 'Level',
    nowrap: true,
    cell: (asset) => {
      const level = riskLevel(distLikelihood(asset), distConsequence(asset));
      return <StatusPill tone={RISK_TONE[level]}>{RISK_LABEL[level]}</StatusPill>;
    },
  },
];

function DistSheet({ look, children }: { look: LookId; children: ReactNode }) {
  return (
    <LookScope look={look} className="flex h-full flex-col">
      <Canvas className="flex-1">{children}</Canvas>
    </LookScope>
  );
}

function DistPressureHistogram({ height = 300 }: { height?: number }) {
  return (
    <Histogram
      label="Distribution of hourly discharge pressure over 30 days; most hours fall between 47 and 49.5 barg"
      counts={DIST_PRESSURE_BINS}
      min={44}
      max={52}
      decimals={1}
      xTitle="Discharge pressure, barg"
      yTitle="Hours"
      height={height}
      limits={[{ value: quantile(DIST_PRESSURE, 0.5), label: 'Median', tone: 'neutral' }]}
    />
  );
}

function DistTemperatureHistogram({ height = 300 }: { height?: number }) {
  return (
    <Histogram
      label={`Distribution of hourly discharge temperature over 30 days; ${DIST_HOURS_ABOVE} hours were above the 145 °C high limit`}
      counts={DIST_TEMPERATURE_BINS}
      min={130}
      max={150}
      xTitle="Discharge temperature, °C"
      yTitle="Hours"
      height={height}
      limits={[{ value: 145, label: 'High limit', tone: 'critical', side: 'above' }]}
    />
  );
}

function DistFlowScatter({ height = 320, grouped = false }: { height?: number; grouped?: boolean }) {
  return (
    <ScatterPlot
      label="Discharge pressure against gas flow, one point per hour for seven days, with the normal operating envelope"
      points={grouped ? DIST_FLOW_PRESSURE : DIST_FLOW_PRESSURE.map((point) => ({ x: point.x, y: point.y }))}
      groups={
        grouped
          ? [
              { id: 'day', label: 'Day, 06–22', tone: 'accent' },
              { id: 'night', label: 'Night, 22–06', tone: 'amber' },
            ]
          : undefined
      }
      x={DIST_FLOW_AXIS}
      y={DIST_PRESSURE_AXIS}
      envelope={DIST_ENVELOPE}
      highlight={grouped ? undefined : { x: 182, y: 48.6, label: 'Now 48.6 barg' }}
      height={height}
    />
  );
}

function DistVibrationBoxes() {
  return (
    <BoxRows
      label="Drive-end vibration per machine over 30 days as box plots against the 7.1 mm/s high limit"
      rows={DIST_VIBRATION}
      min={0}
      max={12}
      unit="mm/s"
      steps={6}
      limit={{ value: 7.1, label: 'High limit', tone: 'warning' }}
    />
  );
}

function DistributionsHistogram() {
  return (
    <DistSheet look="studio">
      <Grid>
        <Panel
          className="col-span-8"
          title="Discharge pressure"
          subtitle="Hourly averages, last 30 days · 23-PT-92531"
          icon={
            <IconChip tone="blue">
              <IconChartHistogram />
            </IconChip>
          }
        >
          <DistPressureHistogram />
        </Panel>
        <Grid stack className="col-span-4">
          <Stat label="Median" value={quantile(DIST_PRESSURE, 0.5)} decimals={1} unit="barg" icon={<IconGauge />} tone="blue" target="Setpoint 48.0" />
          <Stat label="95th percentile" value={quantile(DIST_PRESSURE, 0.95)} decimals={1} unit="barg" icon={<IconAlertTriangle />} tone="amber" target="High limit 52.0" />
          <Stat
            label="Middle 90 % spread"
            value={quantile(DIST_PRESSURE, 0.95) - quantile(DIST_PRESSURE, 0.05)}
            decimals={1}
            unit="bar"
            icon={<IconArrowsHorizontal />}
            tone="teal"
            delta={{ value: -0.3, good: 'down', caption: 'vs previous 30 days' }}
          />
        </Grid>
      </Grid>
    </DistSheet>
  );
}

function DistributionsHistogramLimits() {
  return (
    <DistSheet look="console">
      <Grid>
        <Panel className="col-span-8" title="Discharge temperature" subtitle="23-TT-92532 · 30 d · 1 °C bins">
          <DistTemperatureHistogram />
        </Panel>
        <Grid stack className="col-span-4">
          <Stat label="Hours above high limit" value={DIST_HOURS_ABOVE} unit="h" tone="critical" state="Out of range" stateIcon={<IconAlertOctagon />} target="Allowed 24 h per 30 d" />
          <Stat label="Share above limit" value={distShare(DIST_TEMPERATURE, (value) => value > 145)} decimals={1} unit="%" tone="warning" />
          <Stat label="Highest hourly average" value={Math.max(...DIST_TEMPERATURE)} decimals={1} unit="°C" target="Trip 155.0" />
        </Grid>
      </Grid>
    </DistSheet>
  );
}

function DistributionsCompare() {
  return (
    <DistSheet look="poster">
      <Panel title="Day against night" subtitle="Discharge pressure, hours per 0.5 bar bin">
        <Histogram
          label="Discharge pressure by day and by night on the same scale; nights run about 0.7 bar lower"
          counts={DIST_DAY_BINS}
          min={44}
          max={52}
          decimals={1}
          seriesLabel="Day, 06–22"
          compare={{ label: 'Night, 22–06', counts: DIST_NIGHT_BINS, tone: 'pink' }}
          xTitle="Discharge pressure, barg"
          yTitle="Hours"
          tone="blue"
          height={300}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsCumulative() {
  return (
    <DistSheet look="blueprint">
      <Panel title="Cumulative distribution" subtitle="Share of hours at or below a pressure">
        <TrendLine
          label="Cumulative share of hours at or below each discharge pressure; half of all hours are below 48.2 barg and nine in ten below 49.6"
          labels={DIST_CDF_LABELS}
          series={[{ id: 'cdf', label: 'Share of hours', values: DIST_PRESSURE_CDF, tone: 'accent' }]}
          unit="%"
          decimals={0}
          height={300}
          yDomain={[0, 100]}
          highlightLast={false}
          limits={[
            { value: 50, label: 'Median', tone: 'neutral' },
            { value: 90, label: 'P90', tone: 'warning' },
          ]}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsByCategory() {
  return (
    <DistSheet look="soft">
      <Grid>
        <Panel className="col-span-5" tone="green" title="Run state share" subtitle="1st stage compressor, last 30 days">
          <div className="flex items-center gap-8">
            <RingGauge label="Share of hours running" value={85.8} decimals={1} tone="success" size={176} hideLabel />
            <Legend direction="column" className="flex-1" items={DIST_RUN_STATES.map((state) => ({ label: state.label, tone: state.tone, value: `${state.value} h` }))} />
          </div>
        </Panel>
        <Panel className="col-span-7" tone="purple" title="Trips by cause" subtitle="Gas compression, last 12 months">
          <Bars
            label="Number of trips per cause over the last 12 months; high vibration leads with nine"
            orientation="horizontal"
            categories={DIST_TRIP_CAUSES.map((row) => row.cause)}
            series={[{ id: 'trips', label: 'Trips', values: DIST_TRIP_CAUSES.map((row) => row.trips), tone: 'purple' }]}
            showValues
            height={250}
          />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsBoxRows() {
  return (
    <DistSheet look="studio">
      <Panel
        title="Drive-end vibration by machine"
        subtitle="Minimum, middle half, median and maximum over 30 days"
        icon={
          <IconChip tone="purple">
            <IconWaveSine />
          </IconChip>
        }
        actions={
          <StatusPill tone="critical" icon={<IconAlertOctagon />}>
            1 above trip level
          </StatusPill>
        }
      >
        <DistVibrationBoxes />
      </Panel>
    </DistSheet>
  );
}

function DistributionsBoxEditorial() {
  return (
    <DistSheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" eyebrow="Rotating equipment review · March 2026" title="The recompressor is the only machine whose normal running touches the limit" size="lg" />
        <div className="col-span-8">
          <DistVibrationBoxes />
        </div>
        <div className="col-span-4 flex flex-col gap-6">
          <Stat variant="plain" size="lg" label="Recompressor, upper quartile" value={DIST_VIBRATION[2].stats.q3} decimals={1} unit="mm/s" target="High limit 7.1" />
          <p className="text-sm leading-6 text-[var(--kit-text-2)]">
            A quarter of its running hours sit above {formatNumber(DIST_VIBRATION[2].stats.q3, 1)} mm/s and the whisker reaches the trip level. The two stage compressors keep their whole
            middle half below the limit; the export pumps are an order quieter.
          </p>
          <p className="text-sm leading-6 text-[var(--kit-text-2)]">Read the box, not the whisker: a single excursion stretches the line, but a box across the limit means the machine lives there.</p>
        </div>
      </Grid>
    </DistSheet>
  );
}

function DistributionsQuantileBands() {
  return (
    <DistSheet look="glass">
      <Panel title="Pressure by hour of day" subtitle="Median with the 5th and 95th percentile, 30 days">
        <TrendLine
          label="Discharge pressure by hour of day: the median with the 5th and 95th percentile; the spread widens in the afternoon"
          labels={DIST_HOURS.map((hour) => `${hour}:00`)}
          series={[
            { id: 'p50', label: 'Median', values: DIST_HOURLY.map((row) => row.p50), tone: 'accent' },
            { id: 'p95', label: '95th percentile', values: DIST_HOURLY.map((row) => row.p95), tone: 'pink', dashed: true },
            { id: 'p5', label: '5th percentile', values: DIST_HOURLY.map((row) => row.p5), tone: 'teal', dashed: true },
          ]}
          unit="barg"
          decimals={1}
          height={300}
          fill
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsTimeInZone() {
  return (
    <DistSheet look="console">
      <Panel title="Time in zone" subtitle="Share of the last 30 days per reading">
        <Bars
          label="Share of time each reading spent in its normal, warning and trip zone; drive-end vibration spent 19 % outside normal"
          orientation="horizontal"
          stacked
          categories={DIST_TIME_IN_ZONE.map((row) => row.name)}
          series={[
            { id: 'normal', label: 'Normal', values: DIST_TIME_IN_ZONE.map((row) => row.normal), tone: 'success' },
            { id: 'warning', label: 'Warning', values: DIST_TIME_IN_ZONE.map((row) => row.warning), tone: 'warning' },
            { id: 'critical', label: 'Trip zone', values: DIST_TIME_IN_ZONE.map((row) => row.critical), tone: 'critical' },
          ]}
          unit="%"
          height={300}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsScatter() {
  return (
    <DistSheet look="studio">
      <Grid>
        <Panel className="col-span-8" title="Pressure against flow" subtitle="One point per hour, last 7 days · 1st stage compressor">
          <DistFlowScatter />
        </Panel>
        <Grid stack className="col-span-4">
          <Stat label="Hours inside the envelope" value={DIST_INSIDE} decimals={0} unit="%" icon={<IconCircleCheck />} tone="success" target="Target 90 %" />
          <Stat label="Correlation with flow" value={DIST_FLOW_CORRELATION} decimals={2} icon={<IconWaveSine />} tone="blue" target="Design 0.90" />
          <Stat label="Operating point now" value={48.6} decimals={1} unit="barg" icon={<IconGauge />} tone="teal" target="At 182 kSm³/h" />
        </Grid>
      </Grid>
    </DistSheet>
  );
}

function DistributionsScatterGroups() {
  return (
    <DistSheet look="console">
      <Panel title="Pressure against flow by shift" subtitle="168 h · 23-PT-92531 vs 23-FT-92510">
        <DistFlowScatter grouped height={340} />
      </Panel>
    </DistSheet>
  );
}

function DistributionsBubble() {
  return (
    <DistSheet look="soft">
      <Panel tone="blue" title="Health against time since overhaul" subtitle="Bubble size is open maintenance hours">
        <ScatterPlot
          label="Equipment by years since overhaul and health score; bubble size is open maintenance hours and colour is criticality"
          points={DIST_BUBBLES}
          groups={[
            { id: 'A', label: 'Criticality A', tone: 'pink' },
            { id: 'B', label: 'Criticality B', tone: 'blue' },
            { id: 'C', label: 'Criticality C', tone: 'teal' },
          ]}
          x={{ min: 0, max: 8, ticks: linearTicks(0, 8, 4), title: 'Years since overhaul' }}
          y={{ min: 30, max: 100, ticks: [30, 40, 50, 60, 70, 80, 90, 100], title: 'Health score' }}
          height={340}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsCorrelation() {
  return (
    <DistSheet look="blueprint">
      <Grid>
        <Panel className="col-span-8" title="Correlation matrix" subtitle="1st stage compressor · 30 d hourly">
          <HeatGrid
            label="Correlation between six readings of the 1st stage compressor; flow, speed and discharge pressure move together, suction pressure moves against them"
            rows={DIST_CORRELATION}
            columns={DIST_CORRELATED.map((row) => row.name)}
            max={1}
            tone="blue"
            negativeTone="amber"
            showValues
            decimals={2}
            cellHeight={44}
            scale={{ label: 'Strength of correlation, blue with and amber against', low: '0', high: '±1' }}
          />
        </Panel>
        <Panel className="col-span-4" title="Strongest pairs" subtitle="Excluding the diagonal">
          <ul>
            <ListRow title="Flow and speed" meta="Move together: load follows speed" trailing="+0.93" />
            <ListRow title="Flow and discharge pressure" meta="Compressor curve" trailing="+0.86" />
            <ListRow tone="warning" title="Suction pressure and flow" meta="Opposite: suction drops as load rises" trailing="−0.61" />
            <ListRow title="Vibration and flow" meta="Weak: vibration is not load driven" trailing="+0.21" />
          </ul>
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsHourWeekday() {
  const [cell, setCell] = useState({ row: 'Wed', column: 14 });
  const row = DIST_ALARMS_BY_HOUR.find((entry) => entry.id === cell.row);
  const value = row?.values[cell.column] ?? 0;
  const hourMean = DIST_ALARMS_BY_HOUR.reduce((sum, entry) => sum + (entry.values[cell.column] ?? 0), 0) / DIST_ALARMS_BY_HOUR.length;

  return (
    <DistSheet look="studio">
      <Grid>
        <Panel
          className="col-span-9"
          title="Alarms by hour and weekday"
          subtitle="Summed over the last 12 weeks · select a cell"
          icon={
            <IconChip tone="amber">
              <IconBell />
            </IconChip>
          }
        >
          <HeatGrid
            label="Alarms per hour of the week over the last 12 weeks; shift handovers at 06, 14 and 22 stand out"
            rows={DIST_ALARMS_BY_HOUR}
            columns={DIST_HOURS}
            columnEvery={2}
            max={DIST_ALARM_PEAK}
            tone="amber"
            cellHeight={34}
            selected={cell}
            onSelect={setCell}
            scale={{ label: 'Alarms in that hour', low: '0', high: String(DIST_ALARM_PEAK) }}
          />
        </Panel>
        <Grid stack className="col-span-3">
          <Stat
            label={`${cell.row} ${DIST_HOURS[cell.column]}:00–${DIST_HOURS[cell.column]}:59`}
            value={value}
            unit="alarms"
            icon={<IconClock />}
            tone="amber"
            size="lg"
            delta={{ value: value - hourMean, decimals: 1, good: 'down', caption: 'vs that hour on other days' }}
          />
          <Stat label="Share of the weekly load" value={(value / DIST_ALARM_TOTAL) * 100} decimals={1} unit="%" target="Even spread 0.6 %" />
        </Grid>
      </Grid>
    </DistSheet>
  );
}

function DistributionsAssetDay() {
  return (
    <DistSheet look="console">
      <Panel title="Alarms per unit per day" subtitle="Last 14 days · hatched cells have no data">
        <HeatGrid
          label="Alarms per day for eight units over 14 days; the recompressor floods from day ten and the cooling water pump has three days without data"
          rows={DIST_ALARMS_BY_ASSET}
          columns={DIST_DAYS_14}
          tone="critical"
          showValues
          cellHeight={32}
          scale={{ label: 'Alarms per day', low: '0', high: '12' }}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsCalendar() {
  return (
    <DistSheet look="soft">
      <Panel tone="amber" title="Flaring calendar" subtitle="kSm³ per day, last 12 weeks">
        <HeatGrid
          label="Flaring per day for the last 12 weeks as a calendar; one Wednesday in late February stands out at 27 kSm³"
          rows={DIST_FLARING_CALENDAR}
          columns={DIST_WEEK_STARTS}
          columnEvery={3}
          tone="amber"
          cellHeight={30}
          scale={{ label: 'Flared volume', low: '5', high: '27 kSm³' }}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsShiftPoster() {
  return (
    <DistSheet look="poster">
      <Panel title="Alarms by shift" subtitle="Average per shift, last 12 weeks">
        <HeatGrid
          label="Average alarms per shift and weekday; the day shift carries about twice the load of the evening shift"
          rows={DIST_SHIFT_ALARMS}
          columns={DIST_WEEKDAYS}
          tone="pink"
          showValues
          cellHeight={64}
          scale={{ label: 'Alarms per shift', low: '4', high: '24' }}
        />
      </Panel>
    </DistSheet>
  );
}

function DistributionsHourStrip() {
  return (
    <DistSheet look="signal">
      <Grid>
        <Stat className="col-span-3" label="Alarm load today" value={71} unit="alarms" tone="warning" state="Busy" stateIcon={<IconAlertTriangle />} target="Manageable below 144 per day" />
        <Panel className="col-span-9" title="Alarms per hour by area" subtitle="Last 24 hours">
          <HeatStrip
            label="Alarms per hour by area over the last 24 hours; gas compression carries almost all of the load"
            size="lg"
            rows={[
              { label: 'Inlet and separation', values: makeValues({ seed: 81, points: 24, base: 1.2, noise: 1.1, min: 0, decimals: 0 }), tone: 'neutral' },
              { label: 'Gas compression', values: makeValues({ seed: 82, points: 24, base: 4, noise: 2.4, drift: 5, min: 0, decimals: 0 }), tone: 'warning' },
              { label: 'Gas export', values: makeValues({ seed: 83, points: 24, base: 0.8, noise: 0.9, min: 0, decimals: 0 }), tone: 'neutral' },
              { label: 'Cooling water', values: makeValues({ seed: 84, points: 24, base: 1, noise: 1, min: 0, decimals: 0 }), tone: 'neutral' },
            ]}
            ticks={['14:00', '20:00', '02:00', '08:00', 'Now']}
            scale={{ label: 'Alarms per hour', low: '0', high: '9' }}
          />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistRiskList({ cell }: { cell: RiskCell }) {
  const inside = DIST_EQUIPMENT.filter((asset) => distLikelihood(asset) === cell.likelihood && distConsequence(asset) === cell.consequence);
  const level = riskLevel(cell.likelihood, cell.consequence);
  return (
    <Panel
      className="col-span-5"
      title={`${RISK_LABEL[level]} risk`}
      subtitle={`Likelihood ${cell.likelihood} × consequence ${cell.consequence} = ${cell.likelihood * cell.consequence}`}
      actions={<StatusPill tone={RISK_TONE[level]}>{inside.length === 1 ? '1 unit' : `${inside.length} units`}</StatusPill>}
      footer="Select a cell to list its units"
    >
      {inside.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--kit-text-2)]">No units sit in this cell. Filled cells print how many do.</p>
      ) : (
        <ul>
          {inside.map((asset) => (
            <ListRow
              key={asset.id}
              tone={RISK_TONE[level]}
              title={asset.name}
              meta={
                <>
                  <TagId>{asset.tag}</TagId> · criticality {asset.criticality}
                </>
              }
              trailing={`Health ${asset.healthScore}`}
            />
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-6">
        <p className="text-sm font-semibold">Units per level</p>
        {RISK_LEVELS.map((entry) => (
          <Meter key={entry} label={RISK_LABEL[entry]} value={DIST_RISK_COUNTS[entry]} max={DIST_RISKS.length} unit="units" tone={RISK_TONE[entry]} hideScale />
        ))}
      </div>
    </Panel>
  );
}

function DistributionsRiskMatrix() {
  const [cell, setCell] = useState<RiskCell>({ likelihood: 3, consequence: 5 });
  return (
    <DistSheet look="studio">
      <Grid>
        <Panel
          className="col-span-7"
          title="Equipment risk"
          subtitle="Likelihood from health score, consequence from criticality"
          icon={
            <IconChip tone="pink">
              <IconShieldExclamation />
            </IconChip>
          }
        >
          <RiskMatrix label="Equipment risk matrix, likelihood against consequence" items={DIST_RISKS} selected={cell} onSelect={setCell} />
        </Panel>
        <DistRiskList cell={cell} />
      </Grid>
    </DistSheet>
  );
}

function DistributionsRiskNames() {
  return (
    <DistSheet look="blueprint">
      <Grid>
        <Panel className="col-span-8" title="Risk register" subtitle="Units by tag · rev C">
          <RiskMatrix label="Equipment risk matrix with every unit written in its cell by tag" items={DIST_RISKS} mode="names" cellHeight={68} />
        </Panel>
        <Panel className="col-span-4" title="Levels" subtitle="Score = L × C" footer="Reviewed 12 Mar 2026 · next review in June">
          <ul>
            <ListRow leading={<StatusPill tone="critical">Extreme</StatusPill>} title="15 to 25" meta="Stop and mitigate before restart" trailing={DIST_RISK_COUNTS.extreme} />
            <ListRow leading={<StatusPill tone="warning">High</StatusPill>} title="8 to 14" meta="Action plan within 30 days" trailing={DIST_RISK_COUNTS.high} />
            <ListRow leading={<StatusPill tone="amber">Medium</StatusPill>} title="4 to 7" meta="Monitor, review each quarter" trailing={DIST_RISK_COUNTS.medium} />
            <ListRow leading={<StatusPill tone="success">Low</StatusPill>} title="1 to 3" meta="Accept" trailing={DIST_RISK_COUNTS.low} />
          </ul>
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsRiskSignal() {
  return (
    <DistSheet look="signal">
      <Grid>
        <div className="col-span-5">
          <StatGroup columns={2} label="Units per risk level" className="h-full">
            {[...RISK_LEVELS].reverse().map((level) => (
              <Stat key={level} size="lg" label={`${RISK_LABEL[level]} risk`} value={DIST_RISK_COUNTS[level]} unit="units" tone={RISK_TONE[level]} />
            ))}
          </StatGroup>
        </div>
        <Panel className="col-span-7" title="Where the risk sits" subtitle="Likelihood against consequence">
          <RiskMatrix label="Equipment risk matrix with counts, for a wall screen" items={DIST_RISKS} cellHeight={60} />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsOperatingWindow() {
  const [reading, setReading] = useState('pressure');
  const pressure = reading === 'pressure';
  const values = pressure ? DIST_PRESSURE : DIST_TEMPERATURE;
  const unit = pressure ? 'barg' : '°C';

  return (
    <DistSheet look="studio">
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="1st stage compressor · 23-KA-9101"
          title="Operating window review"
          description="Where the machine actually ran over the last 30 days, against where it should."
          actions={
            <SegmentedControl value={reading} onValueChange={setReading}>
              <SegmentedControlList aria-label="Reading">
                <SegmentedControlButton value="pressure">Pressure</SegmentedControlButton>
                <SegmentedControlButton value="temperature">Temperature</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        />
        <div className="col-span-12">
          <StatGroup columns={4} label="Summary of the selected reading">
            <Stat label="Median" value={quantile(values, 0.5)} decimals={1} unit={unit} icon={pressure ? <IconGauge /> : <IconTemperature />} tone="blue" target={pressure ? 'Setpoint 48.0' : 'Design 138.0'} />
            <Stat label="5th percentile" value={quantile(values, 0.05)} decimals={1} unit={unit} icon={<IconArrowsHorizontal />} tone="teal" target={pressure ? 'Low limit 40.0' : 'Low limit 90.0'} />
            <Stat label="95th percentile" value={quantile(values, 0.95)} decimals={1} unit={unit} icon={<IconArrowsHorizontal />} tone="purple" target={pressure ? 'High limit 52.0' : 'High limit 145.0'} />
            <Stat
              label="Hours above high limit"
              value={pressure ? 0 : DIST_HOURS_ABOVE}
              unit="h"
              icon={<IconAlertTriangle />}
              tone={pressure ? 'success' : 'critical'}
              state={pressure ? 'In range' : 'Out of range'}
              target="Allowed 24 h per 30 d"
            />
          </StatGroup>
        </div>
        <Panel className="col-span-7" title={pressure ? 'Discharge pressure' : 'Discharge temperature'} subtitle="Hours per bin, last 30 days">
          {pressure ? <DistPressureHistogram height={320} /> : <DistTemperatureHistogram height={320} />}
        </Panel>
        <Panel className="col-span-5" title="Pressure against flow" subtitle="Hourly, last 7 days">
          <DistFlowScatter height={320} />
        </Panel>
        <Panel className="col-span-12" title="Vibration across the train" subtitle="Drive-end, 30 days">
          <DistVibrationBoxes />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsAlarmPatterns() {
  return (
    <DistSheet look="console">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          title="Alarm load patterns"
          description="Nordkapp · last 12 weeks"
          actions={
            <StatusPill tone="warning" icon={<IconAlertTriangle />}>
              Handover peaks
            </StatusPill>
          }
        />
        <Panel className="col-span-8" title="Hour by weekday" subtitle={`${formatNumber(DIST_ALARM_TOTAL)} alarms`}>
          <HeatGrid
            label="Alarms per hour of the week over the last 12 weeks"
            rows={DIST_ALARMS_BY_HOUR}
            columns={DIST_HOURS}
            columnEvery={2}
            max={DIST_ALARM_PEAK}
            tone="warning"
            cellHeight={30}
            scale={{ label: 'Alarms in that hour', low: '0', high: String(DIST_ALARM_PEAK) }}
          />
        </Panel>
        <Panel className="col-span-4" title="By shift" subtitle="Average per shift">
          <Bars
            label="Average alarms per shift: day 18, night 11, evening 9"
            categories={['Night', 'Day', 'Evening']}
            series={[{ id: 'alarms', label: 'Alarms', values: [10.9, 17.9, 8.7] }]}
            tones={['neutral', 'warning', 'neutral']}
            decimals={1}
            showValues
            height={250}
            limit={{ value: 12, label: 'Manageable', tone: 'critical' }}
          />
        </Panel>
        <Panel className="col-span-8" title="Unit by day" subtitle="Last 14 days">
          <HeatGrid label="Alarms per unit per day over the last 14 days" rows={DIST_ALARMS_BY_ASSET} columns={DIST_DAYS_14} tone="critical" showValues cellHeight={30} />
        </Panel>
        <Panel className="col-span-4" title="Run state" subtitle="Recompressor, 30 days">
          <Donut label="Recompressor hours per run state over the last 30 days" segments={DIST_RUN_STATES} centerValue="720" centerCaption="hours" unit=" h" legend="bottom" size={150} />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

function DistributionsRiskReport() {
  return (
    <DistSheet look="editorial">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="lg"
          eyebrow="Nordkapp · quarterly risk review"
          title="Two compressors carry the plant's extreme risk"
          description="Likelihood is derived from the health score, consequence from criticality and equipment class."
        />
        <div className="col-span-12">
          <StatGroup columns={4} label="Units per risk level">
            {RISK_LEVELS.map((level) => (
              <Stat key={level} variant="plain" label={`${RISK_LABEL[level]} risk`} value={DIST_RISK_COUNTS[level]} unit="units" tone={RISK_TONE[level]} />
            ))}
          </StatGroup>
        </div>
        <Panel className="col-span-6" title="Risk matrix">
          <RiskMatrix label="Equipment risk matrix with counts" items={DIST_RISKS} cellHeight={56} />
        </Panel>
        <Panel className="col-span-6" title="Highest scores">
          <DataTable label="Units with the highest risk score" columns={DIST_RISK_COLUMNS} rows={DIST_RANKED.slice(0, 6)} rowKey={(asset) => asset.id} />
        </Panel>
      </Grid>
    </DistSheet>
  );
}

export default definePage({
  id: 'distributions',
  title: 'Distributions and heat maps',
  summary:
    'How values spread and where they pile up: histograms, box plots, scatter plots, heat maps and risk matrices, each shown as a finished sheet in the look it suits.',
  guidance: {
    use: [
      'A histogram when the question is how often, a box plot when it is which unit is worst, a scatter when it is whether two readings move together.',
      'Draw limits at their true position and colour what lies beyond them.',
      'Give every heat map a scale with both ends named, and hatch cells without data.',
      'Put the reading of the chart next to it: a median, a share outside limits, a count.',
    ],
    avoid: [
      'A trend line for a question about spread — time hides the shape.',
      'Heat maps without a legend, or with a rainbow scale.',
      'Risk matrices where empty and occupied cells weigh the same.',
    ],
  },
  source,
  sections: [
    {
      id: 'histograms',
      title: 'Histograms and shares',
      description: 'How often each value occurs, with the limits in place and the numbers that summarise the shape beside it.',
      specimens: [
        {
          id: 'DistributionsHistogram',
          title: 'Histogram with summary',
          note: 'Pick it to show where a reading normally sits, with the median marked and the percentiles as figures.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/Histogram.tsx', 'kit/distributions/PlotFrame.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: DistributionsHistogram,
        },
        {
          id: 'DistributionsHistogramLimits',
          title: 'Histogram against a limit',
          note: 'Pick it when the tail matters: bins beyond the limit change colour and the hours out of range lead the side column.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/Histogram.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsHistogramLimits,
        },
        {
          id: 'DistributionsCompare',
          title: 'Two distributions, one scale',
          note: 'Pick it to compare two conditions of the same reading, such as day against night or before against after.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/Histogram.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsCompare,
        },
        {
          id: 'DistributionsCumulative',
          title: 'Cumulative distribution',
          note: 'Pick it to read percentiles straight off the curve: what share of hours stayed below a value.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/distributions/stats.ts', 'looks/LookScope.tsx'],
          Component: DistributionsCumulative,
        },
        {
          id: 'DistributionsByCategory',
          title: 'Shares by category',
          note: 'Pick a ring with a legend for one dominant share and ranked bars for counts per cause.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Legend.tsx', 'kit/Bars.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsByCategory,
        },
      ],
    },
    {
      id: 'spread',
      title: 'Spread and comparison',
      description: 'Several units or hours on one scale, so the outlier shows itself.',
      specimens: [
        {
          id: 'DistributionsBoxRows',
          title: 'Box plots per machine',
          note: 'Pick it to compare the spread of one reading across machines against a shared limit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/BoxRows.tsx', 'kit/distributions/stats.ts', 'kit/Panel.tsx'],
          Component: DistributionsBoxRows,
        },
        {
          id: 'DistributionsBoxEditorial',
          title: 'Box plots in a report',
          note: 'Pick it for a written review: the finding is the headline and the reading advice sits beside the chart.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/BoxRows.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsBoxEditorial,
        },
        {
          id: 'DistributionsQuantileBands',
          title: 'Percentiles by hour',
          note: 'Pick it to show a daily pattern and how wide the spread is at each hour.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsQuantileBands,
        },
        {
          id: 'DistributionsTimeInZone',
          title: 'Time in zone',
          note: 'Pick it to rank readings by how long they spent outside normal, without drawing each distribution.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsTimeInZone,
        },
      ],
    },
    {
      id: 'relationships',
      title: 'Relationships',
      description: 'One reading against another: envelopes, groups, bubbles and correlation.',
      specimens: [
        {
          id: 'DistributionsScatter',
          title: 'Scatter with operating envelope',
          note: 'Pick it to check that a machine runs inside its window, with the current point called out.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/ScatterPlot.tsx', 'kit/distributions/PlotFrame.tsx', 'kit/Stat.tsx'],
          Component: DistributionsScatter,
        },
        {
          id: 'DistributionsScatterGroups',
          title: 'Scatter by group',
          note: 'Pick it when a second condition, such as shift or product, may explain the shape of the cloud.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/ScatterPlot.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsScatterGroups,
        },
        {
          id: 'DistributionsBubble',
          title: 'Bubble chart',
          note: 'Pick it for a third quantity as size, and label only the points that need attention.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/ScatterPlot.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsBubble,
        },
        {
          id: 'DistributionsCorrelation',
          title: 'Correlation matrix',
          note: 'Pick it to see which readings move together before building a model or an alarm rule.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsCorrelation,
        },
      ],
    },
    {
      id: 'heat-maps',
      title: 'Heat maps',
      description: 'When and where something piles up. One tone, a named scale, hatching for missing data.',
      specimens: [
        {
          id: 'DistributionsHourWeekday',
          title: 'Hour by weekday',
          note: 'Pick it to find weekly rhythm, such as alarm peaks at shift handover; select a cell to read it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: DistributionsHourWeekday,
        },
        {
          id: 'DistributionsAssetDay',
          title: 'Unit by day with values',
          note: 'Pick it for a dense operator view where the number matters as much as the colour.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsAssetDay,
        },
        {
          id: 'DistributionsCalendar',
          title: 'Calendar heat map',
          note: 'Pick it for one value per day over months, where single bad days should stand out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsCalendar,
        },
        {
          id: 'DistributionsShiftPoster',
          title: 'Large cells with values',
          note: 'Pick it for a small matrix on a team screen, where each cell is a number to read from a distance.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsShiftPoster,
        },
        {
          id: 'DistributionsHourStrip',
          title: 'Strips per area',
          note: 'Pick it on a wall screen for the last 24 hours per area, next to the one state that sums it up.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/HeatStrip.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsHourStrip,
        },
      ],
    },
    {
      id: 'risk',
      title: 'Risk matrix',
      description: 'Likelihood against consequence. Occupied cells are filled, empty ones only tinted.',
      specimens: [
        {
          id: 'DistributionsRiskMatrix',
          title: 'Risk matrix with detail',
          note: 'Pick it as the entry to a risk register: select a cell to list the units in it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/RiskMatrix.tsx', 'kit/distributions/risk.ts', 'kit/ListRow.tsx'],
          Component: DistributionsRiskMatrix,
        },
        {
          id: 'DistributionsRiskNames',
          title: 'Risk matrix with tags',
          note: 'Pick it for an engineering document where every unit must be readable in its cell.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/RiskMatrix.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsRiskNames,
        },
        {
          id: 'DistributionsRiskSignal',
          title: 'Risk levels on a wall screen',
          note: 'Pick it when the count per level is the message and the matrix is supporting evidence.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/RiskMatrix.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsRiskSignal,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Whole blocks ready to drop into a product.',
      specimens: [
        {
          id: 'DistributionsOperatingWindow',
          title: 'Operating window review',
          note: 'Pick it as the analysis tab of an equipment page; the switch changes the reading under review.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/Histogram.tsx', 'kit/distributions/ScatterPlot.tsx', 'kit/distributions/BoxRows.tsx', 'kit/StatGroup.tsx'],
          Component: DistributionsOperatingWindow,
        },
        {
          id: 'DistributionsAlarmPatterns',
          title: 'Alarm load patterns',
          note: 'Pick it for an alarm management review in the control room: when, on which shift and from which unit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/HeatGrid.tsx', 'kit/Bars.tsx', 'kit/Donut.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsAlarmPatterns,
        },
        {
          id: 'DistributionsRiskReport',
          title: 'Risk review report',
          note: 'Pick it for a quarterly review that is read top to bottom and printed.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/distributions/RiskMatrix.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DistributionsRiskReport,
        },
      ],
    },
  ],
});
