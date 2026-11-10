import { chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { useState } from 'react';

import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import { SeriesLegend } from '../../../library/industrial/charts/SeriesLegend';
import { summarize } from '../../../library/industrial/charts/stats';
import { DEFAULT_TIME_RANGES, TimeRangeSwitch, findTimeRange } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TrendCard } from '../../../library/industrial/charts/TrendCard';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendLimit, TrendSeries, TrendState } from '../../../library/industrial/charts/TrendChart';
import { aggregatePoints } from '../../../library/industrial/charts/trendData';
import type { TrendPoint } from '../../../library/industrial/charts/trendData';
import { formatReading, toneFromLimits } from '../../../library/industrial/status';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './time-series.tsx?raw';

const NOW = REFERENCE_NOW;

function timeSeriesSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

type TimeSeriesWindow = { hours?: number; stepMs?: number; drift?: number; cycles?: number; end?: number };

/** A trend for a sensor that ends on its current value. `drift` is the total move across the window. */
function timeSeriesTrend(sensor: Sensor, { hours = 24, stepMs = 10 * MINUTE, drift = 0, cycles = 2, end = NOW }: TimeSeriesWindow = {}): TrendPoint[] {
  const span = sensor.highLimit - sensor.lowLimit;
  const history = makeSeries({
    seed: sensor.seed,
    points: Math.round((hours * HOUR) / stepMs),
    base: sensor.value - drift,
    drift,
    amplitude: span * 0.06,
    noise: span * 0.02,
    cycles,
    stepMs,
    end: end - stepMs,
    decimals: sensor.decimals,
  });
  return [...history.map((point) => ({ t: point.t, v: point.v })), { t: end, v: sensor.value }];
}

const values = (points: readonly TrendPoint[]): number[] => points.flatMap((point) => (point.v === null ? [] : [point.v]));

const PRESSURE = timeSeriesSensor('pt-92531');
const SUCTION = timeSeriesSensor('pt-92530');
const TEMPERATURE = timeSeriesSensor('tt-92532');
const VIBRATION = timeSeriesSensor('vt-92540');
const LEVEL = timeSeriesSensor('lt-10012');
const EXPORT_FLOW = timeSeriesSensor('ft-20011');
const COOLER = timeSeriesSensor('tt-91141');

const PRESSURE_24H = timeSeriesTrend(PRESSURE);
const SUCTION_24H = timeSeriesTrend(SUCTION);
const TEMPERATURE_24H = timeSeriesTrend(TEMPERATURE, { drift: 5 });
const VIBRATION_24H = timeSeriesTrend(VIBRATION, { drift: 0.9 });
const LEVEL_24H = timeSeriesTrend(LEVEL);
const FLOW_24H = timeSeriesTrend(EXPORT_FLOW);

const PRESSURE_SERIES: TrendSeries = { key: 'pressure', label: 'Discharge pressure', points: PRESSURE_24H };

const PRESSURE_LIMITS: readonly TrendLimit[] = [
  { value: PRESSURE.highLimit, label: 'High 52', tone: 'warning' },
  { value: PRESSURE.lowLimit, label: 'Low 40', tone: 'warning' },
];

/** Recompressor vibration over 8 hours, climbing through its high limit into the trip limit. */
const TRIP_VIBRATION: TrendPoint[] = [
  ...makeSeries({ seed: 41, points: 43, base: 5.0, drift: 2.6, noise: 0.22, stepMs: 10 * MINUTE, end: NOW - 60 * MINUTE }).map((point) => ({ t: point.t, v: point.v })),
  ...[8.4, 9.1, 9.9, 10.4, 11.2, 11.6].map((v, index) => ({ t: NOW - (50 - index * 10) * MINUTE, v })),
];

/** Anti-surge valve command: only changes when the controller moves it. */
const VALVE_POSITION: TrendPoint[] = [0, 0, 0, 0, 15, 15, 15, 40, 40, 40, 40, 25, 25, 10, 10, 0, 0, 0, 0, 20, 20, 20, 5, 0, 0].map((v, index) => ({
  t: NOW - (24 - index) * HOUR,
  v,
}));

/** Level setpoint moved twice during the shift; the level follows with a lag. */
const LEVEL_SETPOINT: TrendPoint[] = Array.from({ length: 49 }, (_, index) => ({
  t: NOW - (48 - index) * 10 * MINUTE,
  v: index < 14 ? 50 : index < 32 ? 58 : 54,
}));

const LEVEL_NOISE = makeSeries({ seed: 17, points: 49, base: 0, noise: 0.5, stepMs: 10 * MINUTE });

const LEVEL_ACTUAL: TrendPoint[] = LEVEL_SETPOINT.reduce<TrendPoint[]>((points, setpoint, index) => {
  const previous = points[index - 1]?.v ?? 50;
  const next = previous + ((setpoint.v ?? previous) - previous) * 0.28;
  return [...points, { t: setpoint.t, v: Math.round((next + LEVEL_NOISE[index].v * 0.4) * 10) / 10 }];
}, []);

/** Discharge temperature of the three compressors. */
const STAGE_TEMPERATURES: readonly TrendSeries[] = [
  { key: 'first', label: '1st stage', points: TEMPERATURE_24H },
  { key: 'second', label: '2nd stage', points: makeSeries({ seed: 31, points: 145, base: 128, amplitude: 3, noise: 0.8, stepMs: 10 * MINUTE }).map((point) => ({ t: point.t, v: point.v })) },
  { key: 'recompressor', label: 'Recompressor', points: makeSeries({ seed: 47, points: 145, base: 119, amplitude: 4, noise: 0.9, drift: -5, stepMs: 10 * MINUTE }).map((point) => ({ t: point.t, v: point.v })) },
];

/** Export pump run state over 24 hours and the flow that goes with it. */
const RUN_STATES: readonly TrendState[] = [
  { from: NOW - 24 * HOUR, to: NOW - 15 * HOUR, label: 'Running', tone: 'neutral' },
  { from: NOW - 15 * HOUR, to: NOW - 12.5 * HOUR, label: 'Standby', tone: 'info' },
  { from: NOW - 12.5 * HOUR, to: NOW - 3 * HOUR, label: 'Running', tone: 'neutral' },
  { from: NOW - 3 * HOUR, to: NOW - 2 * HOUR, label: 'Tripped', tone: 'critical' },
  { from: NOW - 2 * HOUR, to: NOW, label: 'Running', tone: 'neutral' },
];

const RUN_STATE_FLOW: TrendPoint[] = FLOW_24H.map((point) => {
  const state = RUN_STATES.find((candidate) => point.t >= candidate.from && point.t < candidate.to);
  return { t: point.t, v: state && state.label !== 'Running' ? 0 : point.v };
});

/** Yesterday's pressure moved forward 24 hours so it lines up with today's. */
const PRESSURE_PREVIOUS: TrendPoint[] = makeSeries({ seed: 71, points: 145, base: 47.4, amplitude: 1.1, noise: 0.3, cycles: 2, stepMs: 10 * MINUTE }).map((point) => ({
  t: point.t,
  v: point.v,
}));

/** Five-minute raw values for 48 hours and their hourly minimum, maximum and average. */
const PRESSURE_RAW_48H = timeSeriesTrend(PRESSURE, { hours: 48, stepMs: 5 * MINUTE, cycles: 3 });
const PRESSURE_HOURLY = aggregatePoints(PRESSURE_RAW_48H, HOUR);

/** One-minute raw values for 3 hours and their 10-minute average. */
const TEMPERATURE_RAW_3H = makeSeries({ seed: 13, points: 181, base: 140.4, amplitude: 1.2, noise: 1.1, drift: 0.8, stepMs: MINUTE }).map((point) => ({ t: point.t, v: point.v }));
const TEMPERATURE_10MIN = aggregatePoints(TEMPERATURE_RAW_3H, 10 * MINUTE).map((point) => ({ t: point.t, v: Math.round(point.avg * 10) / 10 }));

/** Bearing temperature with five hours missing while the transmitter was disconnected. */
const GAP_FROM = NOW - 14 * HOUR;
const GAP_TO = NOW - 9 * HOUR;
const BEARING_GAPPED: TrendPoint[] = makeSeries({ seed: 22, points: 145, base: 61, amplitude: 4, noise: 0.6, stepMs: 10 * MINUTE }).map((point) => ({
  t: point.t,
  v: point.t > GAP_FROM && point.t < GAP_TO ? null : point.v,
}));

/** Cooler outlet temperature: the last four hours are flagged uncertain by the transmitter. */
const UNCERTAIN_FROM = NOW - 4 * HOUR;
const COOLER_24H = timeSeriesTrend(COOLER, { drift: 2.5 });
const COOLER_GOOD = COOLER_24H.map((point) => ({ t: point.t, v: point.t <= UNCERTAIN_FROM ? point.v : null }));
const COOLER_UNCERTAIN = COOLER_24H.map((point) => ({ t: point.t, v: point.t >= UNCERTAIN_FROM ? point.v : null }));

const RANGE_DATA: Record<string, TrendPoint[]> = {
  '1h': timeSeriesTrend(PRESSURE, { hours: 1, stepMs: MINUTE, cycles: 0.5 }),
  '8h': timeSeriesTrend(PRESSURE, { hours: 8, stepMs: 5 * MINUTE, cycles: 1 }),
  '24h': PRESSURE_24H,
  '7d': timeSeriesTrend(PRESSURE, { hours: 168, stepMs: HOUR, cycles: 7 }),
};

function TimeSeriesSingle() {
  return (
    <TrendChart
      label="Discharge pressure of the 1st stage compressor over the last 24 hours, between 46 and 51 barg, latest 48.6 barg"
      series={[PRESSURE_SERIES]}
      unit="barg"
      summary="23-PT-92531 · last 24 hours · steady between 46 and 51 barg."
    />
  );
}

function TimeSeriesCompact() {
  return (
    <Card className="w-full max-w-xs self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Separator level</CardTitle>
          <CardDescription>20-LT-10012 · last 24 hours</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ValueReadout value={LEVEL.value} unit={LEVEL.unit} decimals={1} />
        <TrendChart
          compact
          showLast
          heightClassName="h-16"
          label="Separator level over the last 24 hours inside its normal band of 45 to 62 percent, latest 54.3 percent"
          series={[{ key: 'level', label: 'Separator level', points: LEVEL_24H }]}
          band={{ low: 45, high: 62 }}
        />
      </CardContent>
    </Card>
  );
}

function TimeSeriesArea() {
  return (
    <TrendChart
      label="Export flow over the last 24 hours, between 390 and 440 cubic metres per hour"
      series={[{ key: 'flow', label: 'Export flow', points: FLOW_24H, variant: 'area', color: chartSeriesColor(2) }]}
      yDomain={[0, 600]}
      unit="m³/h"
      decimals={0}
    />
  );
}

function TimeSeriesStep() {
  return (
    <TrendChart
      label="Anti-surge valve position over the last 24 hours; it opened to 40 percent around 21:00 and is closed now"
      series={[{ key: 'position', label: 'Valve position', points: VALVE_POSITION, variant: 'step', color: chartSeriesColor(4) }]}
      yDomain={[0, 50]}
      yTicks={[0, 10, 20, 30, 40, 50]}
      unit="%"
      decimals={0}
    />
  );
}

function TimeSeriesHighLowLimits() {
  return (
    <TrendChart
      label="Discharge pressure over the last 24 hours against its low limit of 40 and high limit of 52 barg; it stays inside both"
      series={[PRESSURE_SERIES]}
      limits={PRESSURE_LIMITS}
      yDomain={[36, 56]}
      yTicks={[36, 40, 44, 48, 52, 56]}
      unit="barg"
      summary="Inside the 40 to 52 barg operating limits for the whole period; closest approach to the high limit is 1.2 barg."
    />
  );
}

function TimeSeriesOperatingBand() {
  return (
    <TrendChart
      label="Separator level over the last 24 hours with its normal operating band of 45 to 62 percent shaded; the level stays inside it"
      series={[{ key: 'level', label: 'Separator level', points: LEVEL_24H }]}
      band={{ low: 45, high: 62, label: 'Normal band' }}
      yDomain={[30, 80]}
      yTicks={[30, 40, 50, 60, 70, 80]}
      unit="%"
    />
  );
}

function TimeSeriesTripLimit() {
  return (
    <TrendChart
      label="Recompressor drive-end vibration over the last 8 hours, rising through the high limit of 7.1 at 11:30 and reaching the trip limit of 11 millimetres per second at 13:40"
      series={[{ key: 'vibration', label: 'Drive-end vibration', points: TRIP_VIBRATION }]}
      highlight={{ seriesKey: 'vibration', above: 7.1, tone: 'warning' }}
      limits={[
        { value: 11, label: 'Trip 11', tone: 'critical', align: 'left' },
        { value: 7.1, label: 'High 7.1', tone: 'warning', align: 'left' },
      ]}
      events={[{ t: NOW - 14 * MINUTE, label: 'Tripped', tone: 'critical' }]}
      yDomain={[2, 14]}
      yTicks={[2, 5, 8, 11, 14]}
      unit="mm/s"
      summary="Above the high limit since 11:30; the machine tripped at 13:46 when vibration passed 11 mm/s."
    />
  );
}

function TimeSeriesSetpoint() {
  return (
    <TrendChart
      legend
      label="Separator level against its setpoint over the last 8 hours; the level settles within about an hour of each setpoint change"
      series={[
        { key: 'setpoint', label: 'Setpoint', points: LEVEL_SETPOINT, variant: 'step', dashed: true, color: 'var(--color-chart-neutral-450)' },
        { key: 'actual', label: 'Level', points: LEVEL_ACTUAL, color: chartSeriesColor(1) },
      ]}
      yDomain={[46, 62]}
      yTicks={[46, 50, 54, 58, 62]}
      unit="%"
    />
  );
}

function TimeSeriesOverlay() {
  return (
    <TrendChart
      legend
      label="Discharge temperature of the three compressors over the last 24 hours; the 1st stage is hottest and has risen 5 degrees"
      series={STAGE_TEMPERATURES}
      limits={[{ value: 145, label: 'High 145', tone: 'warning' }]}
      yDomain={[100, 160]}
      yTicks={[100, 115, 130, 145, 160]}
      unit="°C"
    />
  );
}

function TimeSeriesDualAxis() {
  return (
    <TrendChart
      legend
      label="Discharge pressure in barg on the left axis and discharge temperature in degrees Celsius on the right axis over the last 24 hours; temperature rises while pressure holds"
      series={[
        { key: 'pressure', label: 'Discharge pressure (barg, left)', points: PRESSURE_24H },
        { key: 'temperature', label: 'Discharge temperature (°C, right)', points: TEMPERATURE_24H, axis: 'right' },
      ]}
      yDomain={[40, 56]}
      yTicks={[40, 44, 48, 52, 56]}
      rightDomain={[120, 152]}
      unit="barg"
      rightUnit="°C"
    />
  );
}

function TimeSeriesSmallMultiples() {
  const rows = [
    { sensor: SUCTION, points: SUCTION_24H },
    { sensor: PRESSURE, points: PRESSURE_24H },
    { sensor: TEMPERATURE, points: TEMPERATURE_24H },
    { sensor: VIBRATION, points: VIBRATION_24H },
  ];
  return (
    <div className="flex w-full flex-col gap-3">
      {rows.map(({ sensor, points }, index) => (
        <div key={sensor.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">{sensor.name}</span>
            <ValueReadout size="xs" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} />
          </div>
          <TrendChart
            heightClassName={index === rows.length - 1 ? 'h-24' : 'h-16'}
            hideXAxis={index < rows.length - 1}
            label={`${sensor.name} over the last 24 hours, latest ${formatReading(sensor.value, sensor.unit, sensor.decimals)}`}
            series={[{ key: 'value', label: sensor.name, points }]}
            limits={[{ value: sensor.highLimit, label: `High ${sensor.highLimit}`, tone: 'warning', align: 'left' }]}
          />
        </div>
      ))}
    </div>
  );
}

function TimeSeriesRunState() {
  return (
    <TrendChart
      label="Export flow over the last 24 hours with the pump run state underneath; flow is zero during standby from 23:00 to 01:30 and during the trip from 11:00 to 12:00"
      series={[{ key: 'flow', label: 'Export flow', points: RUN_STATE_FLOW, variant: 'area', color: chartSeriesColor(2) }]}
      states={RUN_STATES}
      statesLabel="Export pump A run state"
      yDomain={[0, 600]}
      unit="m³/h"
      decimals={0}
    />
  );
}

function TimeSeriesLegendToggles() {
  const [hidden, setHidden] = useState<readonly string[]>(['recompressor']);
  const toggle = (key: string) =>
    setHidden((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : current.length < STAGE_TEMPERATURES.length - 1 ? [...current, key] : current));

  return (
    <div className="flex w-full flex-col gap-3">
      <TrendChart
        label="Discharge temperature of the compressors over the last 24 hours; series can be switched off in the legend"
        series={STAGE_TEMPERATURES.map((series) => ({ ...series, hidden: hidden.includes(series.key) }))}
        yDomain={[100, 160]}
        yTicks={[100, 115, 130, 145, 160]}
        unit="°C"
      />
      <SeriesLegend
        label="Compressors"
        hiddenKeys={hidden}
        onToggle={toggle}
        items={STAGE_TEMPERATURES.map((series, index) => ({ key: series.key, label: series.label, color: chartSeriesColor(index + 1) }))}
      />
    </div>
  );
}

function TimeSeriesPreviousPeriod() {
  return (
    <TrendChart
      legend
      label="Discharge pressure over the last 24 hours compared with the 24 hours before; today runs about 1 barg higher"
      series={[
        { key: 'previous', label: 'Previous 24 hours', points: PRESSURE_PREVIOUS, ghost: true },
        { key: 'pressure', label: 'Last 24 hours', points: PRESSURE_24H, color: chartSeriesColor(1) },
      ]}
      yDomain={[42, 54]}
      yTicks={[42, 45, 48, 51, 54]}
      unit="barg"
      summary="Today averages 48.4 barg against 47.4 barg in the previous period."
    />
  );
}

function TimeSeriesEnvelope() {
  return (
    <TrendChart
      legend
      label="Hourly average discharge pressure over the last 48 hours inside its hourly minimum to maximum envelope; the spread stays under 2 barg"
      series={[{ key: 'average', label: 'Hourly average', points: PRESSURE_HOURLY.map((point) => ({ t: point.t, v: Math.round(point.avg * 10) / 10 })) }]}
      envelopes={[{ key: 'range', label: 'Hourly min to max', points: PRESSURE_HOURLY.map((point) => ({ t: point.t, low: point.min, high: point.max })), color: 'var(--color-chart-1-200)' }]}
      yDomain={[42, 54]}
      yTicks={[42, 45, 48, 51, 54]}
      unit="barg"
    />
  );
}

function TimeSeriesRawVsAggregated() {
  return (
    <TrendChart
      legend
      label="Discharge temperature over the last 3 hours as one-minute raw values and as a 10-minute average; the average removes the measurement noise"
      series={[
        { key: 'raw', label: 'Raw, 1 min', points: TEMPERATURE_RAW_3H, color: 'var(--color-chart-1-200)' },
        { key: 'average', label: '10 min average', points: TEMPERATURE_10MIN, connectNulls: true, color: chartSeriesColor(1) },
      ]}
      yDomain={[136, 146]}
      yTicks={[136, 138, 140, 142, 144, 146]}
      unit="°C"
    />
  );
}

function TimeSeriesGaps() {
  return (
    <TrendChart
      label="Bearing temperature over the last 24 hours with no data between 00:00 and 05:00"
      series={[{ key: 'temperature', label: 'Bearing temperature', points: BEARING_GAPPED }]}
      regions={[{ from: GAP_FROM, to: GAP_TO, label: 'No data', tone: 'neutral' }]}
      yDomain={[50, 70]}
      yTicks={[50, 55, 60, 65, 70]}
      unit="°C"
      summary="No signal from 40-TT-40015 between 00:00 and 05:00; the line is not bridged across the gap."
    />
  );
}

function TimeSeriesBadQuality() {
  return (
    <TrendChart
      legend
      label="Cooler outlet temperature over the last 24 hours; values since 10:00 are flagged uncertain and drawn dashed"
      series={[
        { key: 'good', label: 'Good quality', points: COOLER_GOOD, color: chartSeriesColor(1) },
        { key: 'uncertain', label: 'Uncertain quality', points: COOLER_UNCERTAIN, dashed: true, color: chartSeriesColor(1) },
      ]}
      regions={[{ from: UNCERTAIN_FROM, to: NOW, label: 'Uncertain', tone: 'warning' }]}
      limits={[{ value: 40, label: 'High 40', tone: 'warning', align: 'left' }]}
      yDomain={[30, 45]}
      yTicks={[30, 35, 40, 45]}
      unit="°C"
    />
  );
}

function TimeSeriesRanges() {
  const [range, setRange] = useState('8h');
  const option = findTimeRange(DEFAULT_TIME_RANGES, range);
  const points = RANGE_DATA[range] ?? PRESSURE_24H;
  const stats = summarize(values(points));

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Discharge pressure</span>
        <TimeRangeSwitch value={range} onValueChange={setRange} />
      </div>
      <TrendChart
        label={`Discharge pressure, ${option?.name?.toLowerCase() ?? range}`}
        series={[{ key: 'pressure', label: 'Discharge pressure', points }]}
        limits={[{ value: PRESSURE.highLimit, label: 'High 52', tone: 'warning', align: 'left' }]}
        yDomain={[42, 54]}
        yTicks={[42, 45, 48, 51, 54]}
        unit="barg"
        summary={stats ? `${option?.name ?? range}: ${formatReading(stats.min, 'barg', 1)} to ${formatReading(stats.max, 'barg', 1)}, average ${formatReading(stats.mean, 'barg', 1)}.` : undefined}
      />
    </div>
  );
}

function TimeSeriesCurrentValue() {
  const reference = PRESSURE_24H[0].v ?? PRESSURE.value;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Discharge pressure · 23-PT-92531</span>
          <ValueReadout value={PRESSURE.value} unit={PRESSURE.unit} decimals={1} size="lg" />
        </div>
        <TrendDelta value={PRESSURE.value} reference={reference} unit="barg" caption="in 24 h" />
      </div>
      <TrendChart
        showLast
        label="Discharge pressure over the last 24 hours, latest 48.6 barg"
        series={[PRESSURE_SERIES]}
        yDomain={[42, 54]}
        yTicks={[42, 45, 48, 51, 54]}
      />
    </div>
  );
}

function TimeSeriesLoading() {
  return <ChartPlaceholder state="loading" title="Loading discharge pressure trend" />;
}

function TimeSeriesNoData() {
  return (
    <ChartPlaceholder
      state="empty"
      title="No data in this period"
      description="40-TT-40015 has no datapoints in the last 8 hours."
      action={
        <Button variant="secondary" size="sm">
          Show last 7 days
        </Button>
      }
    />
  );
}

function TimeSeriesError() {
  return (
    <ChartPlaceholder
      state="error"
      title="Could not load the trend"
      description="The time series service did not answer."
      action={
        <Button variant="secondary" size="sm">
          Try again
        </Button>
      }
    />
  );
}

function TimeSeriesTagTrendCard() {
  const [range, setRange] = useState('24h');
  const option = findTimeRange(DEFAULT_TIME_RANGES, range);
  const span = option?.spanMs ?? DAY;
  const points = (range === '24h' ? TEMPERATURE_24H : timeSeriesTrend(TEMPERATURE, { hours: span / HOUR, stepMs: span / 144, drift: range === '7d' ? 8 : range === '8h' ? 3 : 1, cycles: span / (12 * HOUR) })).map(
    (point, index, all) => (index === all.length - 1 ? { t: point.t, v: 146.3 } : point)
  );
  const stats = summarize(values(points));
  const limits = { high: TEMPERATURE.highLimit, highHigh: TEMPERATURE.highHighLimit };
  const tone = toneFromLimits(146.3, limits);
  const alarmAt = NOW - 38 * MINUTE;

  return (
    <TrendCard
      title="Discharge temperature"
      description="23-TT-92532 · 1st stage compressor"
      reading={{ value: 146.3, unit: '°C', decimals: 1, tone }}
      delta={{ reference: points[0].v ?? 146.3, caption: `in ${option?.label ?? '24 h'}`, goodDirection: 'down' }}
      status={{ tone: 'warning', label: 'Above high limit', shape: 'square' }}
      actions={<TimeRangeSwitch value={range} onValueChange={setRange} />}
      summary={
        stats
          ? `${option?.name ?? 'Last 24 hours'}: ${formatReading(stats.min, '°C', 1)} to ${formatReading(stats.max, '°C', 1)}, average ${formatReading(stats.mean, '°C', 1)}. Above the 145 °C high limit since 13:22; the trip limit is 155 °C.`
          : undefined
      }
    >
      <TrendChart
        heightClassName="h-72"
        label={`Discharge temperature of the 1st stage compressor, ${option?.name?.toLowerCase() ?? 'last 24 hours'}, rising through the high limit of 145 to 146.3 degrees Celsius`}
        series={[{ key: 'temperature', label: 'Discharge temperature', points }]}
        highlight={{ seriesKey: 'temperature', above: 145, tone: 'warning' }}
        band={{ low: 120, high: 145 }}
        limits={[
          { value: 155, label: 'Trip 155', tone: 'critical', align: 'left' },
          { value: 145, label: 'High 145', tone: 'warning', align: 'left' },
        ]}
        events={alarmAt > NOW - span ? [{ t: alarmAt, label: 'Alarm', tone: 'warning' }] : []}
        yDomain={[115, 160]}
        yTicks={[115, 130, 145, 160]}
        maxTicks={8}
        unit="°C"
        showLast
      />
    </TrendCard>
  );
}

export default definePage({
  id: 'time-series',
  title: 'Time series',
  summary:
    'Sensor trends on a time axis, read against what matters in operations: limits, the normal band, setpoints, run state and data quality. One chart component covers them all, so every trend on a screen behaves the same.',
  guidance: {
    use: [
      'Draw limits as dashed, labelled lines in warning or critical colour; keep the series itself in a chart colour.',
      'Fix the y range to the operating window so a small wobble does not look like an excursion.',
      'Leave gaps as gaps and mark uncertain data; never bridge missing values with a straight line.',
      'Put a one-line summary under key charts so the finding does not depend on reading the plot.',
    ],
    avoid: [
      'More than four series on one axis; use small multiples on a shared time axis.',
      'Two y axes unless the two measurements are read together, and say which axis each one uses.',
      'Colouring a normal series green; colour is for the part that is outside its limits.',
      'Smoothing or averaging without saying so in the legend.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'One series',
      description: 'The mark follows the signal: a line for a measurement, an area for a quantity, steps for a command.',
      specimens: [
        {
          id: 'TimeSeriesSingle',
          title: 'Single sensor trend',
          note: 'Pick it as the default view of one measurement: a line, a time axis, a value axis and a summary.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesSingle,
        },
        {
          id: 'TimeSeriesCompact',
          title: 'Compact trend in a card',
          note: 'Pick it on an overview card where the shape supports the value and nobody reads values off the plot.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/ValueReadout.tsx'],
          Component: TimeSeriesCompact,
        },
        {
          id: 'TimeSeriesArea',
          title: 'Area from zero',
          note: 'Pick it for flows and rates, where the filled amount means something and the axis starts at zero.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesArea,
        },
        {
          id: 'TimeSeriesStep',
          title: 'Step series',
          note: 'Pick it for values that jump and hold, such as valve commands, setpoints and modes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesStep,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Limits, bands and setpoints',
      description: 'What the value is judged against, drawn on the same axis.',
      specimens: [
        {
          id: 'TimeSeriesHighLowLimits',
          title: 'High and low limit lines',
          note: 'Pick it when the question is how much margin the value has to its operating limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesHighLowLimits,
        },
        {
          id: 'TimeSeriesOperatingBand',
          title: 'Operating band shaded',
          note: 'Pick it for controlled values that should stay inside a band, where a band reads faster than two lines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesOperatingBand,
        },
        {
          id: 'TimeSeriesTripLimit',
          title: 'Trip limit and excursion',
          note: 'Pick it to explain a trip: the part above the high limit is coloured and the trip is marked in time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesTripLimit,
        },
        {
          id: 'TimeSeriesSetpoint',
          title: 'Setpoint and actual',
          note: 'Pick it to judge a control loop: the setpoint is a dashed step line, the measurement a solid one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesSetpoint,
        },
      ],
    },
    {
      id: 'several-series',
      title: 'Several series',
      description: 'Overlay what shares a unit, split what does not, and always share the time axis.',
      specimens: [
        {
          id: 'TimeSeriesOverlay',
          title: 'Overlay on a shared axis',
          note: 'Pick it for two to four sensors with the same unit that are compared directly.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesOverlay,
        },
        {
          id: 'TimeSeriesDualAxis',
          title: 'Dual axis',
          note: 'Pick it only for two measurements that are read together, such as pressure and temperature of one machine.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesDualAxis,
        },
        {
          id: 'TimeSeriesSmallMultiples',
          title: 'Stacked small multiples',
          note: 'Pick it for a machine with readings in different units; one time axis lets the eye line up events.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/ValueReadout.tsx'],
          Component: TimeSeriesSmallMultiples,
        },
        {
          id: 'TimeSeriesRunState',
          title: 'With run state band',
          note: 'Pick it when a discrete state explains the trend: the strip shares the time axis with the plot.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesRunState,
        },
        {
          id: 'TimeSeriesLegendToggles',
          title: 'Legend toggles',
          note: 'Pick it when people need to isolate one series; the last visible series cannot be switched off.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/SeriesLegend.tsx'],
          Component: TimeSeriesLegendToggles,
        },
        {
          id: 'TimeSeriesPreviousPeriod',
          title: 'Previous period as ghost',
          note: 'Pick it to answer "is this normal for this time of day" without a second chart.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesPreviousPeriod,
        },
      ],
    },
    {
      id: 'aggregation-and-quality',
      title: 'Aggregation and data quality',
      description: 'Say what was averaged, and show where the data is missing or not to be trusted.',
      specimens: [
        {
          id: 'TimeSeriesEnvelope',
          title: 'Min, max and average',
          note: 'Pick it for long ranges, where each pixel covers many samples and the spread must not be lost.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/trendData.ts'],
          Component: TimeSeriesEnvelope,
        },
        {
          id: 'TimeSeriesRawVsAggregated',
          title: 'Raw and aggregated',
          note: 'Pick it when people need to trust the average: the raw samples stay visible behind it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/trendData.ts'],
          Component: TimeSeriesRawVsAggregated,
        },
        {
          id: 'TimeSeriesGaps',
          title: 'Gap in the data',
          note: 'Pick it whenever samples are missing: the line breaks and the period is shaded and named.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesGaps,
        },
        {
          id: 'TimeSeriesBadQuality',
          title: 'Uncertain quality segment',
          note: 'Pick it when the transmitter flags its own values: the doubtful part is dashed and its period marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeSeriesBadQuality,
        },
      ],
    },
    {
      id: 'range-and-states',
      title: 'Range, value and states',
      description: 'The controls and conditions around the plot.',
      specimens: [
        {
          id: 'TimeSeriesRanges',
          title: 'Range switch',
          note: 'Pick it when people move between this hour, this shift, this day and this week; the y range stays put.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/stats.ts'],
          Component: TimeSeriesRanges,
        },
        {
          id: 'TimeSeriesCurrentValue',
          title: 'Current value header',
          note: 'Pick it when the latest reading is the headline and the trend is the evidence.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx'],
          Component: TimeSeriesCurrentValue,
        },
        {
          id: 'TimeSeriesLoading',
          title: 'Loading',
          note: 'Pick it while the query runs; the skeleton keeps the height of the chart it stands in for.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeSeriesLoading,
        },
        {
          id: 'TimeSeriesNoData',
          title: 'No data',
          note: 'Pick it when the range has no points; name the tag and the period and offer a wider range.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeSeriesNoData,
        },
        {
          id: 'TimeSeriesError',
          title: 'Failed to load',
          note: 'Pick it when the query failed, which is different from an empty result, and offer a retry.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeSeriesError,
        },
      ],
    },
    {
      id: 'cards',
      title: 'Tag trend card',
      description: 'Everything above in the frame a dashboard uses.',
      specimens: [
        {
          id: 'TimeSeriesTagTrendCard',
          title: 'Tag trend card',
          note: 'Pick it as the standard trend on a dashboard: tag, current value and state, range switch, limits and a summary.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'industrial/charts/TrendCard.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/charts/TimeRangeSwitch.tsx',
            'industrial/status.ts',
          ],
          Component: TimeSeriesTagTrendCard,
        },
      ],
    },
  ],
});
