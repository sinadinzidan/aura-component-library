import { Button } from '@cognite/aura/components/button';

import { BoxPlotRows } from '../../../library/industrial/charts/BoxPlotRows';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import { HeatMapGrid } from '../../../library/industrial/charts/HeatMapGrid';
import { HeatScaleLegend } from '../../../library/industrial/charts/HeatScaleLegend';
import { Histogram } from '../../../library/industrial/charts/Histogram';
import { RiskMatrix } from '../../../library/industrial/charts/RiskMatrix';
import type { RiskItem } from '../../../library/industrial/charts/RiskMatrix';
import { ScatterPlot } from '../../../library/industrial/charts/ScatterPlot';
import { boxStats, bucketize, correlation, quantile } from '../../../library/industrial/charts/stats';
import type { BoxStats } from '../../../library/industrial/charts/stats';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { TONE_ZONE_BG, formatValue } from '../../../library/industrial/status';
import { ASSETS } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, createRandom, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './distributions.tsx?raw';

const NOW = REFERENCE_NOW;
const EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const round = (value: number, decimals = 1): number => Math.round(value * 10 ** decimals) / 10 ** decimals;
const share = (values: readonly number[], test: (value: number) => boolean): number => Math.round((values.filter(test).length / values.length) * 100);

/** Hourly averages for the last 30 days. */
const PRESSURE_30D = makeValues({ seed: 11, points: 720, base: 48.2, amplitude: 1.5, noise: 0.6, cycles: 30 });
const TEMPERATURE_30D = makeValues({ seed: 13, points: 720, base: 139.6, amplitude: 3.2, noise: 1.5, cycles: 30 });
const PRESSURE_BINS = bucketize(PRESSURE_30D, { bins: 16, min: 44, max: 52 });
const TEMPERATURE_BINS = bucketize(TEMPERATURE_30D, { bins: 20, min: 130, max: 150 });
const HOURS_ABOVE_145 = TEMPERATURE_30D.filter((value) => value > 145).length;

/** The same pressure split by shift: nights run a little lower and tighter. */
const isNight = (index: number): boolean => index % 24 < 6 || index % 24 >= 22;
const PRESSURE_DAY_BINS = bucketize(PRESSURE_30D.filter((_, index) => !isNight(index)), { bins: 16, min: 44, max: 52 });
const PRESSURE_NIGHT_BINS = bucketize(PRESSURE_30D.filter((_, index) => isNight(index)), { bins: 16, min: 44, max: 52 });

const PRESSURE_CDF = PRESSURE_BINS.reduce<{ category: string; cumulative: number }[]>((rows, bin) => {
  const previous = rows[rows.length - 1]?.cumulative ?? 0;
  return [...rows, { category: formatValue(bin.to, 1), cumulative: round(previous + (bin.count / PRESSURE_30D.length) * 100) }];
}, []);

const RUN_STATE_SHARE = [
  { category: 'Running', hours: 618 },
  { category: 'Standby', hours: 52 },
  { category: 'Maintenance', hours: 28 },
  { category: 'Tripped', hours: 14 },
  { category: 'Stopped', hours: 8 },
];

/** Drive-end vibration per machine over 30 days, mm/s. */
const VIBRATION_ROWS: { label: string; stats: BoxStats; tone?: 'warning' | 'critical' }[] = [
  { name: '1st stage compressor', seed: 14, base: 5.6, noise: 0.5 },
  { name: '2nd stage compressor', seed: 24, base: 3.9, noise: 0.3 },
  { name: 'Recompressor', seed: 41, base: 6.4, noise: 0.9 },
  { name: 'Compressor gas turbine', seed: 34, base: 4.4, noise: 0.35 },
  { name: 'Export pump A', seed: 44, base: 2.6, noise: 0.25 },
  { name: 'Export pump B', seed: 54, base: 2.9, noise: 0.2 },
].flatMap((machine) => {
  const stats = boxStats(makeValues({ seed: machine.seed, points: 720, base: machine.base, amplitude: machine.noise, noise: machine.noise, cycles: 9, min: 0.5 }));
  if (!stats) return [];
  return [{ label: machine.name, stats, tone: stats.max >= 11 ? ('critical' as const) : stats.q3 > 7.1 ? ('warning' as const) : undefined }];
});

/** Time each reading spent in its normal, warning and trip zones over 30 days, in percent. */
const TIME_IN_ZONE = [
  { name: 'Discharge pressure', normal: 98, warning: 2, critical: 0 },
  { name: 'Discharge temperature', normal: 100 - share(TEMPERATURE_30D, (value) => value > 145), warning: share(TEMPERATURE_30D, (value) => value > 145), critical: 0 },
  { name: 'Drive-end vibration', normal: 81, warning: 17, critical: 2 },
  { name: 'Separator level', normal: 96, warning: 4, critical: 0 },
];

/** Discharge pressure against gas flow, one point per hour for 7 days. */
const scatterRandom = createRandom(91);
const FLOW_PRESSURE = Array.from({ length: 168 }, (_, index) => {
  const flow = 150 + scatterRandom() * 55;
  const night = index % 24 < 6 || index % 24 >= 22;
  return { x: round(flow, 0), y: round(37.6 + flow * 0.058 + (scatterRandom() - 0.5) * 2.2 - (night ? 0.6 : 0)), night, name: `${formatDate(NOW - (167 - index) * HOUR)}, ${String(index % 24).padStart(2, '0')}:00` };
});

/** Equipment by running hours since overhaul and health score; bubble area is open maintenance hours. */
const EQUIPMENT_BUBBLES = EQUIPMENT.map((asset, index) => ({
  x: round(4 + ((index * 7) % 11) * 2.6 + (100 - asset.healthScore) * 0.25, 1),
  y: asset.healthScore,
  size: 4 + (100 - asset.healthScore) * 1.4,
  name: asset.name,
  criticality: asset.criticality,
}));

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

/** Alarms per hour of the week, summed over the last 12 weeks. Handovers at 06, 14 and 22 stand out. */
const heatRandom = createRandom(73);
const ALARMS_BY_HOUR: number[][] = WEEKDAYS.map((_, day) =>
  HOURS.map((_hour, hour) => {
    const handover = [6, 14, 22].includes(hour) ? 9 : [7, 15, 23].includes(hour) ? 4 : 0;
    const weekend = day >= 5 ? -2 : 0;
    const dayTime = hour >= 8 && hour <= 17 ? 3 : 0;
    return Math.max(0, Math.round(2 + handover + dayTime + weekend + heatRandom() * 4));
  })
);
const ALARM_PEAK = Math.max(...ALARMS_BY_HOUR.flat());

const DAYS_14 = Array.from({ length: 14 }, (_, index) => formatDate(NOW - (13 - index) * DAY));
const assetRandom = createRandom(37);
/** Alarms per day for each piece of equipment over 14 days. */
const ALARMS_BY_ASSET: number[][] = EQUIPMENT.slice(2, 10).map((asset) =>
  DAYS_14.map((_, day) => {
    const base = (100 - asset.healthScore) / 9;
    const trip = asset.id === '23-ka-9103' && day >= 9 ? 9 : 0;
    return Math.max(0, Math.round(base + trip + (assetRandom() - 0.4) * 3));
  })
);

/** Flaring per day for 12 weeks, kSm³. Columns are weeks, rows weekdays. */
const FLARING = makeValues({ seed: 43, points: 84, base: 13, noise: 3.4, stepMs: DAY, min: 5, decimals: 0 });
const WEEK_STARTS = Array.from({ length: 12 }, (_, week) => formatDate(NOW - 3 * DAY - (11 - week) * 7 * DAY));
const FLARING_CALENDAR: (number | null)[][] = WEEKDAYS.map((_, day) =>
  WEEK_STARTS.map((_week, week) => {
    const index = week * 7 + day;
    return week === 11 && day > 3 ? null : FLARING[index] + (week === 7 && day === 2 ? 14 : 0);
  })
);

const SHIFT_ALARMS = [
  [14, 12, 15, 11, 13, 6, 5],
  [9, 11, 8, 12, 10, 7, 4],
  [21, 18, 24, 19, 22, 12, 9],
];

/** Correlation between six readings of the 1st stage compressor over 30 days. */
const LOAD = makeValues({ seed: 61, points: 720, base: 0, amplitude: 1, noise: 0.6, cycles: 12, decimals: 3 });
const mixed = (seed: number, weight: number): number[] => {
  const noise = makeValues({ seed, points: 720, base: 0, noise: 0.8, decimals: 3 });
  return LOAD.map((value, index) => value * weight + noise[index] * (1 - Math.abs(weight)));
};
const CORRELATED = [
  { name: 'Flow', values: mixed(101, 0.95) },
  { name: 'Speed', values: mixed(102, 0.9) },
  { name: 'Disch. P', values: mixed(103, 0.8) },
  { name: 'Disch. T', values: mixed(104, 0.6) },
  { name: 'Suction P', values: mixed(105, -0.55) },
  { name: 'Vibration', values: mixed(106, 0.2) },
];
const CORRELATION_VALUES = CORRELATED.map((row) => CORRELATED.map((column) => round(correlation(row.values, column.values), 2)));

/** Pressure by hour of day over 30 days: median with the middle half and the 5th to 95th percentile. */
const DAY_START = NOW - 14 * HOUR;
const HOURLY_QUANTILES = HOURS.map((_, hour) => {
  const sample = PRESSURE_30D.filter((_value, index) => index % 24 === hour).map((value) => value + Math.sin((hour / 24) * Math.PI * 2) * 0.9);
  return {
    t: DAY_START + hour * HOUR,
    p5: quantile(sample, 0.05) ?? 0,
    p25: quantile(sample, 0.25) ?? 0,
    p50: quantile(sample, 0.5) ?? 0,
    p75: quantile(sample, 0.75) ?? 0,
    p95: quantile(sample, 0.95) ?? 0,
  };
});

const RISK_ITEMS: RiskItem[] = EQUIPMENT.map((asset) => ({
  id: asset.id,
  label: asset.name,
  likelihood: asset.healthScore >= 93 ? 1 : asset.healthScore >= 88 ? 2 : asset.healthScore >= 70 ? 3 : asset.healthScore >= 50 ? 4 : 5,
  consequence: asset.criticality === 'A' ? (asset.type === 'compressor' || asset.type === 'turbine' ? 5 : 4) : asset.criticality === 'B' ? 3 : 2,
}));

function DistributionHistogram() {
  return (
    <Histogram
      label="Distribution of hourly discharge pressure over 30 days; most hours fall between 47 and 49.5 barg"
      bins={PRESSURE_BINS}
      unit="barg"
      decimals={1}
      countLabel="hours"
      summary="720 hourly averages in 0.5 barg bins. The middle half of the hours sit between 47.2 and 49.2 barg."
    />
  );
}

function DistributionHistogramLimits() {
  return (
    <Histogram
      label={`Distribution of hourly discharge temperature over 30 days against the 145 degree high limit; ${HOURS_ABOVE_145} hours were above it`}
      bins={TEMPERATURE_BINS}
      unit="°C"
      countLabel="hours"
      limits={[{ value: 145, label: 'High 145', tone: 'warning' }]}
      outside={{ high: 145 }}
      summary={`${HOURS_ABOVE_145} of 720 hours above the 145 °C high limit; bins past the limit are marked.`}
    />
  );
}

function DistributionCumulative() {
  return (
    <CategoryChart
      label="Cumulative distribution of discharge pressure over 30 days; 95 percent of hours are below 50.5 barg"
      rows={PRESSURE_CDF}
      series={[{ key: 'cumulative', label: 'Share of hours at or below', type: 'area' }]}
      references={[{ value: 95, label: '95 %', align: 'left' }]}
      domain={[0, 100]}
      ticks={[0, 25, 50, 75, 100]}
      labelEvery={2}
      unit="% of hours at or below"
      decimals={1}
      summary="Read across from a share to the pressure it corresponds to: half the hours are below 48.2 barg."
    />
  );
}

function DistributionByCategory() {
  return (
    <CategoryChart
      layout="rows"
      valueLabels
      hideValueAxis
      label="Hours in each run state for the recompressor over 30 days; it ran 618 of 720 hours"
      rows={RUN_STATE_SHARE}
      series={[{ key: 'hours', label: 'Hours' }]}
      unit="h"
      axisWidth={96}
      barSize={14}
      heightClassName="h-48"
      summary="Running 86 % of the time; 14 hours tripped across three events."
    />
  );
}

function DistributionBoxRows() {
  return (
    <BoxPlotRows
      label="Spread of drive-end vibration per machine over 30 days against the 7.1 millimetre per second high limit; the recompressor has the widest spread and crosses the limit"
      rows={VIBRATION_ROWS}
      domain={[0, 12]}
      unit="mm/s"
      limit={{ value: 7.1, label: 'High 7.1', tone: 'warning' }}
      labelClassName="w-40"
      summary="Line: minimum to maximum. Box: middle half of the hours. Tick: median."
    />
  );
}

function DistributionQuantileBands() {
  return (
    <TrendChart
      legend
      label="Discharge pressure by hour of day over 30 days: the median with the middle half and the 5th to 95th percentile; the afternoon runs about 1.5 barg higher than the night"
      series={[{ key: 'median', label: 'Median', points: HOURLY_QUANTILES.map((row) => ({ t: row.t, v: round(row.p50) })) }]}
      envelopes={[
        { key: 'outer', label: '5th to 95th percentile', points: HOURLY_QUANTILES.map((row) => ({ t: row.t, low: round(row.p5), high: round(row.p95) })), color: 'var(--color-chart-1-100)' },
        { key: 'inner', label: '25th to 75th percentile', points: HOURLY_QUANTILES.map((row) => ({ t: row.t, low: round(row.p25), high: round(row.p75) })), color: 'var(--color-chart-1-200)' },
      ]}
      yDomain={[44, 52]}
      yTicks={[44, 46, 48, 50, 52]}
      unit="barg"
      formatTick={(timestamp) => `${String(new Date(timestamp).getUTCHours()).padStart(2, '0')}:00`}
    />
  );
}

function DistributionCompare() {
  return (
    <div className="flex w-full flex-col gap-4">
      {[
        { name: 'Day and evening shifts', bins: PRESSURE_DAY_BINS },
        { name: 'Night shift', bins: PRESSURE_NIGHT_BINS },
      ].map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">{group.name}</span>
          <Histogram label={`Distribution of hourly discharge pressure, ${group.name.toLowerCase()}, over 30 days`} bins={group.bins} unit="barg" decimals={1} countLabel="hours" heightClassName="h-20" />
        </div>
      ))}
    </div>
  );
}

function DistributionTimeInZone() {
  return (
    <div className="flex w-full flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {TIME_IN_ZONE.map((row) => (
          <li key={row.name} className="grid grid-cols-[9rem_minmax(0,1fr)_3rem] items-center gap-3">
            <span className="truncate text-xs text-muted-foreground">{row.name}</span>
            <span
              role="img"
              aria-label={`${row.name}: ${row.normal} % of the time inside limits, ${row.warning} % outside operating limits, ${row.critical} % beyond the trip limit`}
              className="flex h-3 w-full gap-px overflow-hidden rounded-xs"
            >
              <span className={TONE_ZONE_BG.neutral} style={{ width: `${row.normal}%` }} />
              <span className={TONE_ZONE_BG.warning} style={{ width: `${row.warning}%` }} />
              <span className={TONE_ZONE_BG.critical} style={{ width: `${row.critical}%` }} />
            </span>
            <span className="text-right text-xs font-medium text-base-foreground tabular-nums">{row.normal} %</span>
          </li>
        ))}
      </ul>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-medium-foreground">
        {(['neutral', 'warning', 'critical'] as const).map((tone) => (
          <li key={tone} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-xs ${TONE_ZONE_BG[tone]}`} />
            {tone === 'neutral' ? 'Inside limits' : tone === 'warning' ? 'Outside operating limits' : 'Beyond trip limit'}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Share of the last 30 days. The figure on the right is the time inside limits.</p>
    </div>
  );
}

function DistributionScatter() {
  return (
    <ScatterPlot
      legend
      label="Discharge pressure against gas flow, one point per hour for 7 days, with the operating envelope shaded; pressure rises with flow and all but a few hours are inside the envelope"
      groups={[
        { key: 'history', label: 'Hourly averages, last 7 days', points: FLOW_PRESSURE },
        { key: 'now', label: 'Now', points: [{ x: 182, y: 48.6, name: 'Now' }], emphasis: true, color: 'var(--color-chart-neutral-450)' },
      ]}
      envelope={{ x1: 150, x2: 205, y1: 45.5, y2: 50.5, label: 'Operating envelope' }}
      xLabel="Gas flow (kSm³/h)"
      yLabel="Discharge pressure (barg)"
      xDomain={[140, 210]}
      xTicks={[140, 160, 180, 200]}
      yDomain={[44, 52]}
      yTicks={[44, 46, 48, 50, 52]}
    />
  );
}

function DistributionScatterGroups() {
  return (
    <ScatterPlot
      legend
      label="Discharge pressure against gas flow by shift for 7 days; night-shift hours sit about 0.6 barg lower at the same flow"
      groups={[
        { key: 'day', label: 'Day and evening', points: FLOW_PRESSURE.filter((point) => !point.night) },
        { key: 'night', label: 'Night', points: FLOW_PRESSURE.filter((point) => point.night) },
      ]}
      references={[{ axis: 'y', value: 52, label: 'High 52', tone: 'warning' }]}
      xLabel="Gas flow (kSm³/h)"
      yLabel="Discharge pressure (barg)"
      xDomain={[140, 210]}
      xTicks={[140, 160, 180, 200]}
      yDomain={[44, 54]}
      yTicks={[44, 46, 48, 50, 52, 54]}
    />
  );
}

function DistributionBubble() {
  return (
    <ScatterPlot
      legend
      label="Equipment by running hours since overhaul and health score, sized by open maintenance hours; the recompressor is lowest in health with the most open work"
      groups={[
        { key: 'a', label: 'Criticality A', points: EQUIPMENT_BUBBLES.filter((point) => point.criticality === 'A') },
        { key: 'bc', label: 'Criticality B and C', points: EQUIPMENT_BUBBLES.filter((point) => point.criticality !== 'A') },
      ]}
      sizeLabel="Open maintenance (h)"
      sizeRange={[60, 900]}
      xLabel="Running hours since overhaul (thousand h)"
      yLabel="Health score"
      xDomain={[0, 50]}
      xTicks={[0, 10, 20, 30, 40, 50]}
      yDomain={[30, 100]}
      yTicks={[40, 60, 80, 100]}
      decimals={0}
      summary="Bubble area is open maintenance work. Low and large is where to look first."
    />
  );
}

function DistributionCorrelation() {
  return (
    <HeatMapGrid
      showValues
      label="Correlation between six readings of the 1st stage compressor over 30 days; flow, speed and discharge pressure move together, suction pressure moves against them"
      rows={CORRELATED.map((row) => row.name)}
      columns={CORRELATED.map((row) => row.name)}
      values={CORRELATION_VALUES}
      domain={[0, 1]}
      intensityOf={Math.abs}
      decimals={2}
      cellClassName="h-9"
      rowLabelClassName="w-20"
      legend={{ title: 'Strength of correlation', low: '0', high: '1' }}
      summary="Colour shows strength, the sign shows direction. Vibration is nearly independent of load."
    />
  );
}

function DistributionHourWeekday() {
  return (
    <HeatMapGrid
      label={`Alarms by weekday and hour over the last 12 weeks; shift handovers at 06:00, 14:00 and 22:00 stand out with up to ${ALARM_PEAK} alarms`}
      rows={WEEKDAYS}
      columns={HOURS}
      values={ALARMS_BY_HOUR}
      domain={[0, ALARM_PEAK]}
      unit="alarms"
      columnLabelEvery={2}
      cellClassName="h-7"
      legend={{ title: 'Alarms per hour of the week', low: '0', high: String(ALARM_PEAK) }}
      summary="Three vertical bands at 06:00, 14:00 and 22:00: alarms cluster around shift handover on weekdays."
    />
  );
}

function DistributionLegendScale() {
  return (
    <div className="flex flex-col items-start gap-5">
      <HeatScaleLegend lowLabel="Fewer" highLabel="More" />
      <HeatScaleLegend lowLabel="0" highLabel="18" title="Alarms per hour" />
      <HeatScaleLegend lowLabel="5" highLabel="27 kSm³" title="Flaring per day" emptyLabel="No data" />
    </div>
  );
}

function DistributionAssetDay() {
  return (
    <HeatMapGrid
      label="Alarms per day by equipment for the last 14 days; the recompressor turns dark from 8 March"
      rows={EQUIPMENT.slice(2, 10).map((asset) => asset.name)}
      columns={DAYS_14}
      values={ALARMS_BY_ASSET}
      domain={[0, 12]}
      unit="alarms"
      columnLabelEvery={3}
      rowLabelClassName="w-40"
      legend={{ title: 'Alarms per day', low: '0', high: '12 or more' }}
    />
  );
}

function DistributionCalendar() {
  return (
    <HeatMapGrid
      label="Flaring per day for the last 12 weeks as a calendar; one Wednesday in late February stands out at about twice the usual volume"
      rows={WEEKDAYS}
      columns={WEEK_STARTS}
      values={FLARING_CALENDAR}
      domain={[5, 27]}
      unit="kSm³"
      columnLabelEvery={3}
      cellClassName="h-5"
      legend={{ title: 'Flaring per day', low: '5', high: '27 kSm³', empty: 'Not yet reported' }}
      summary="Each column is a week starting on the date shown."
    />
  );
}

function DistributionHeatValues() {
  return (
    <HeatMapGrid
      showValues
      label="Alarms per shift and weekday last week; the night shift has the most alarms every day, peaking at 24 on Wednesday"
      rows={['Day', 'Evening', 'Night']}
      columns={WEEKDAYS}
      values={SHIFT_ALARMS}
      domain={[0, 24]}
      unit="alarms"
      cellClassName="h-10"
      rowLabelClassName="w-16"
    />
  );
}

function DistributionHourStrip() {
  return (
    <HeatMapGrid
      label="Alarms by hour of day, summed over the last 12 weeks; the three handover hours carry about a third of all alarms"
      rows={['Alarms']}
      columns={HOURS}
      values={[HOURS.map((_, hour) => ALARMS_BY_HOUR.reduce((total, day) => total + day[hour], 0))]}
      unit="alarms"
      columnLabelEvery={3}
      cellClassName="h-8"
      rowLabelClassName="w-14"
      legend={{ low: 'Fewer', high: 'More' }}
      summary="A single row is enough when only the time of day matters."
    />
  );
}

function DistributionRiskMatrix() {
  return (
    <RiskMatrix
      label="Equipment risk matrix by likelihood and consequence of failure; the recompressor is the one high-risk item"
      items={RISK_ITEMS}
      summary="11 pieces of equipment. The recompressor sits at likely × severe after the trip on 8 March."
    />
  );
}

function DistributionRiskLabels() {
  return (
    <RiskMatrix
      showLabels
      label="Risk matrix naming the compressors, turbine and cooler in their cells"
      items={RISK_ITEMS.filter((item) => ['23-ka-9101', '23-ka-9102', '23-ka-9103', '23-ha-9114', '23-gt-9001'].includes(item.id))}
    />
  );
}

function DistributionLoading() {
  return <ChartPlaceholder state="loading" title="Loading alarm distribution" heightClassName="h-48" />;
}

function DistributionEmpty() {
  return (
    <ChartPlaceholder
      state="empty"
      heightClassName="h-48"
      title="Not enough data"
      description="A distribution needs at least 24 hours of samples."
      action={
        <Button variant="secondary" size="sm">
          Show last 30 days
        </Button>
      }
    />
  );
}

function DistributionSparse() {
  return (
    <HeatMapGrid
      label="Alarms per shift for four days with two shifts not yet reported"
      rows={['Day', 'Evening', 'Night']}
      columns={['9 Mar', '10 Mar', '11 Mar', '12 Mar']}
      values={[
        [14, 12, 15, 11],
        [9, 11, 8, null],
        [21, 18, 24, null],
      ]}
      domain={[0, 24]}
      unit="alarms"
      showValues
      cellClassName="h-10"
      rowLabelClassName="w-16"
      legend={{ low: '0', high: '24', empty: 'Not yet reported' }}
    />
  );
}

export default definePage({
  id: 'distributions',
  title: 'Distributions and heat maps',
  summary:
    'How values spread rather than how they move: histograms and box rows for one measurement, scatter and correlation for two, heat maps for patterns across hours, days and assets, and the risk matrix.',
  guidance: {
    use: [
      'Use a histogram to show where a value spends its time, with the limits drawn on the value axis.',
      'Use a heat map when both axes are categories or time buckets and the pattern matters more than exact values.',
      'Give every heat map a colour key with the low and high value, and a key for cells without data.',
      'Keep heat maps on the heat-map tokens; only the risk matrix is status-coloured, because there the colour is the risk level.',
    ],
    avoid: [
      'Red-to-green heat maps for plain counts; density is not a verdict.',
      'A scatter plot without axis titles and units, or without saying what one point is.',
      'Comparing box rows or histograms that do not share a scale.',
      'Printing values in cells too small to read; let the colour key and the cell tooltip carry them.',
    ],
  },
  source,
  sections: [
    {
      id: 'histograms',
      title: 'Histograms and shares',
      description: 'Where one measurement spends its time.',
      specimens: [
        {
          id: 'DistributionHistogram',
          title: 'Histogram',
          note: 'Pick it to see the usual operating range of a measurement and how tightly it is held.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/Histogram.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionHistogram,
        },
        {
          id: 'DistributionHistogramLimits',
          title: 'Histogram with limit',
          note: 'Pick it to show how much of the time a value was beyond a limit; the bins past it are marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/Histogram.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionHistogramLimits,
        },
        {
          id: 'DistributionCumulative',
          title: 'Cumulative distribution',
          note: 'Pick it to read percentiles: what value the measurement stays under 95 % of the time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionCumulative,
        },
        {
          id: 'DistributionByCategory',
          title: 'Distribution by category',
          note: 'Pick sorted bars when the buckets are states or classes instead of value ranges.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: DistributionByCategory,
        },
      ],
    },
    {
      id: 'spread',
      title: 'Spread and comparison',
      description: 'The same distribution compared across assets, shifts or hours of the day.',
      specimens: [
        {
          id: 'DistributionBoxRows',
          title: 'Range bars per asset',
          note: 'Pick it to compare spread between machines on one scale; a row that crosses its limit is marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/BoxPlotRows.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionBoxRows,
        },
        {
          id: 'DistributionQuantileBands',
          title: 'Quantile bands',
          note: 'Pick it to show what is normal for each hour of the day, as a baseline for today’s trend.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionQuantileBands,
        },
        {
          id: 'DistributionCompare',
          title: 'Two histograms, one scale',
          note: 'Pick small multiples to compare the shape of two groups; overlaid histograms hide each other.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/Histogram.tsx'],
          Component: DistributionCompare,
        },
        {
          id: 'DistributionTimeInZone',
          title: 'Time in zone',
          note: 'Pick it to reduce a distribution to the one figure that matters: the share of time inside limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/status.ts'],
          Component: DistributionTimeInZone,
        },
      ],
    },
    {
      id: 'relationships',
      title: 'Relationships',
      description: 'One measurement against another.',
      specimens: [
        {
          id: 'DistributionScatter',
          title: 'Scatter with operating envelope',
          note: 'Pick it to check that two coupled readings stay inside their envelope, and where the process is now.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ScatterPlot.tsx'],
          Component: DistributionScatter,
        },
        {
          id: 'DistributionScatterGroups',
          title: 'Scatter by group',
          note: 'Pick it when the relationship differs between two or three groups, such as shifts or machines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ScatterPlot.tsx'],
          Component: DistributionScatterGroups,
        },
        {
          id: 'DistributionBubble',
          title: 'Bubble chart',
          note: 'Pick it to rank a small fleet on three measures at once; keep it to about a dozen bubbles.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ScatterPlot.tsx'],
          Component: DistributionBubble,
        },
        {
          id: 'DistributionCorrelation',
          title: 'Correlation matrix',
          note: 'Pick it to find which readings move together before building a model or a root-cause story.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx', 'industrial/charts/stats.ts'],
          Component: DistributionCorrelation,
        },
      ],
    },
    {
      id: 'heat-maps',
      title: 'Heat maps',
      description: 'Density across two axes on the four heat-map steps.',
      specimens: [
        {
          id: 'DistributionHourWeekday',
          title: 'Hour by weekday',
          note: 'Pick it to find when in the week something happens: handovers, weekends, night shifts.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionHourWeekday,
        },
        {
          id: 'DistributionLegendScale',
          title: 'Legend scale',
          note: 'Pick the plain key for relative density, and add numbers and a no-data swatch when values matter.',
          origin: 'custom',
          size: 'sm',
          uses: ['industrial/charts/HeatScaleLegend.tsx'],
          Component: DistributionLegendScale,
        },
        {
          id: 'DistributionAssetDay',
          title: 'Asset by day',
          note: 'Pick it to see which equipment is noisy and since when, across a fleet.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionAssetDay,
        },
        {
          id: 'DistributionCalendar',
          title: 'Calendar heat map',
          note: 'Pick it for one value per day over months, to spot single days and weekday rhythm.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionCalendar,
        },
        {
          id: 'DistributionHeatValues',
          title: 'With printed values',
          note: 'Pick it for a small grid where people want the numbers and the colour only guides the eye.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionHeatValues,
        },
        {
          id: 'DistributionHourStrip',
          title: 'Single-row strip',
          note: 'Pick it when one axis is enough, for example the hour of day under a chart.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionHourStrip,
        },
      ],
    },
    {
      id: 'risk',
      title: 'Risk matrix',
      description: 'The one matrix that is status-coloured: the cell colour is the risk level.',
      specimens: [
        {
          id: 'DistributionRiskMatrix',
          title: 'Risk matrix with counts',
          note: 'Pick it for a fleet: each cell says how many items carry that likelihood and consequence.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/RiskMatrix.tsx'],
          Component: DistributionRiskMatrix,
        },
        {
          id: 'DistributionRiskLabels',
          title: 'Risk matrix with names',
          note: 'Pick it for a handful of items, where people need to see which one sits where.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/RiskMatrix.tsx'],
          Component: DistributionRiskLabels,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Loading, too little data and cells that have not been reported.',
      specimens: [
        {
          id: 'DistributionLoading',
          title: 'Loading',
          note: 'Pick it while the aggregation runs; distributions over long periods take a moment.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: DistributionLoading,
        },
        {
          id: 'DistributionEmpty',
          title: 'Not enough data',
          note: 'Pick it when there are too few samples for the shape to mean anything, and say how many are needed.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: DistributionEmpty,
        },
        {
          id: 'DistributionSparse',
          title: 'Cells without data',
          note: 'Pick the neutral cell for missing values; never draw them as the lowest step, which would read as zero.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: DistributionSparse,
        },
      ],
    },
  ],
});
