import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconCloudOff, IconDatabaseOff, IconDownload, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { Legend } from '../../../library/kit/Legend';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { aggregate, summarise } from '../../../library/kit/time-series/plotMath';
import { PlotState } from '../../../library/kit/time-series/PlotState';
import { SeriesLegend } from '../../../library/kit/time-series/SeriesLegend';
import { SeriesPlot, type PlotLimit, type PlotSeries } from '../../../library/kit/time-series/SeriesPlot';
import { StateBand, type StateSegment } from '../../../library/kit/time-series/StateBand';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS, SENSORS, type Sensor } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatDate, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './time-series.tsx?raw';

const TS_POINTS = 49;

const TS_BY_ID = new Map(SENSORS.map((sensor) => [sensor.id, sensor]));

function tsSensor(id: string): Sensor {
  return TS_BY_ID.get(id) ?? SENSORS[0];
}

const TS_PRESSURE = tsSensor('pt-92531');

const TS_SUCTION = tsSensor('pt-92530');

const TS_TEMPERATURE = tsSensor('tt-92532');

const TS_VIBRATION = tsSensor('vt-92540');

const TS_SPEED = tsSensor('st-92501');

const TS_FLOW = tsSensor('ft-92510');

const TS_LEVEL = tsSensor('lt-10012');

const TS_COOLER = tsSensor('tt-91141');

const TS_TRAIN = [TS_PRESSURE, TS_TEMPERATURE, TS_VIBRATION, TS_SPEED, TS_SUCTION, TS_COOLER];

function tsLabels(points: number = TS_POINTS, stepMs: number = 30 * MINUTE): string[] {
  return Array.from({ length: points }, (_, index) => {
    const at = REFERENCE_NOW - (points - 1 - index) * stepMs;
    return stepMs >= 3 * HOUR ? formatDate(at) : formatTime(at);
  });
}

const TS_LABELS = tsLabels();

/** A day of readings for a tag that ends on the tag's current value. */
function tsTrend(sensor: Sensor, points: number = TS_POINTS, wave = 0.14, seedOffset = 0): number[] {
  const span = sensor.highLimit - sensor.lowLimit;
  const raw = makeValues({ seed: sensor.seed + seedOffset, points, base: sensor.value, amplitude: span * wave, noise: span * 0.035, cycles: 2, decimals: sensor.decimals + 1 });
  const offset = sensor.value - raw[raw.length - 1];
  return raw.map((value) => Number((value + offset).toFixed(sensor.decimals + 1)));
}

const TS_PRESSURE_DAY = tsTrend(TS_PRESSURE, TS_POINTS, 0.2);

const TS_TEMPERATURE_DAY = tsTrend(TS_TEMPERATURE, TS_POINTS, 0.07);

const TS_VIBRATION_DAY = tsTrend(TS_VIBRATION, TS_POINTS, 0.05);

const TS_SPEED_DAY = tsTrend(TS_SPEED, TS_POINTS, 0.05);

const TS_SUCTION_DAY = tsTrend(TS_SUCTION);

const TS_COOLER_DAY = tsTrend(TS_COOLER, TS_POINTS, 0.08);

const TS_INTERSTAGE_DAY = makeValues({ seed: 58, points: TS_POINTS, base: 27.4, amplitude: 2.2, noise: 0.5, cycles: 2, decimals: 1 });

const TS_FLOW_DAY = tsTrend(TS_FLOW, TS_POINTS, 0.2).map((value) => Math.round(value / 100) / 10);

const TS_LEVEL_DAY = tsTrend(TS_LEVEL, TS_POINTS, 0.16);

const TS_TRAIN_DAY: Record<string, number[]> = {
  [TS_PRESSURE.id]: TS_PRESSURE_DAY,
  [TS_TEMPERATURE.id]: TS_TEMPERATURE_DAY,
  [TS_VIBRATION.id]: TS_VIBRATION_DAY,
  [TS_SPEED.id]: TS_SPEED_DAY,
  [TS_SUCTION.id]: TS_SUCTION_DAY,
  [TS_COOLER.id]: TS_COOLER_DAY,
};

const TS_TRAIN_TONE: Record<string, Tone> = {
  [TS_PRESSURE.id]: 'blue',
  [TS_TEMPERATURE.id]: 'amber',
  [TS_VIBRATION.id]: 'purple',
  [TS_SPEED.id]: 'teal',
  [TS_SUCTION.id]: 'sky',
  [TS_COOLER.id]: 'pink',
};

/** Recompressor vibration through its trip at 13:46: a climb, the trip, the rundown. */
const TS_TRIP_DAY = makeValues({ seed: 44, points: TS_POINTS, base: 6.1, amplitude: 0.5, noise: 0.25, cycles: 3, decimals: 2 }).map((value, index) => {
  if (index < 37) return value;
  if (index <= 47) return Number((value + ((index - 37) / 10) ** 2 * 5.6).toFixed(2));
  return 3.9;
});

const TS_TRIP_STATES: StateSegment[] = [
  { from: 0, to: 41, label: 'Running', tone: 'success' },
  { from: 41, to: 47, label: 'Running, alarm', tone: 'warning' },
  { from: 47, to: 48, label: 'Tripped', tone: 'critical' },
];

/** Level controller setpoint: operator steps during the day. */
const TS_SETPOINT_DAY = Array.from({ length: TS_POINTS }, (_, index) => (index < 12 ? 50 : index < 30 ? 58 : 54));

const TS_LEVEL_ACTUAL = makeValues({ seed: 71, points: TS_POINTS, base: 0, noise: 0.9, decimals: 1 }).map((wobble, index) => {
  const target = TS_SETPOINT_DAY[index];
  const since = index < 12 ? index + 8 : index < 30 ? index - 12 : index - 30;
  const from = index < 12 ? 50 : index < 30 ? 50 : 58;
  return Number((target + (from - target) * Math.exp(-since / 2.4) + wobble).toFixed(1));
});

/** Anti-surge valve position: a stepped signal. */
const TS_VALVE_DAY = Array.from({ length: TS_POINTS }, (_, index) => (index < 9 ? 12 : index < 17 ? 28 : index < 26 ? 20 : index < 35 ? 46 : index < 41 ? 34 : 18));

const TS_RAW_MINUTES = makeValues({ seed: 91, points: 240, base: 141.2, amplitude: 2.6, noise: 1.5, cycles: 3, decimals: 1 });

const TS_BUCKETS = aggregate(TS_RAW_MINUTES, 10);

const TS_BUCKET_LABELS = tsLabels(TS_BUCKETS.length, 10 * MINUTE);

const TS_WEEK_LABELS = tsLabels(57, 3 * HOUR);

function tsState(sensor: Sensor, value: number = sensor.value): { tone: Tone; word: string } {
  if (sensor.quality === 'bad') return { tone: 'neutral', word: 'No signal' };
  if (sensor.highHighLimit !== undefined && value >= sensor.highHighLimit) return { tone: 'critical', word: 'Trip' };
  if (value > sensor.highLimit) return { tone: 'critical', word: 'High' };
  if (value < sensor.lowLimit) return { tone: 'info', word: 'Low' };
  if (value >= sensor.highLimit - (sensor.highLimit - sensor.lowLimit) * 0.12) return { tone: 'warning', word: 'Near limit' };
  return { tone: 'success', word: 'Normal' };
}

function TsStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function TsStatePill({ sensor, value }: { sensor: Sensor; value?: number }) {
  const state = tsState(sensor, value);
  return (
    <StatusPill tone={state.tone} icon={<TsStateIcon tone={state.tone} />}>
      {state.word}
    </StatusPill>
  );
}

function tsLimits(sensor: Sensor, low = false): PlotLimit[] {
  const limits: PlotLimit[] = [{ value: sensor.highLimit, label: `High ${formatNumber(sensor.highLimit, sensor.decimals)}`, tone: 'warning' }];
  if (sensor.highHighLimit !== undefined) limits.push({ value: sensor.highHighLimit, label: `Trip ${formatNumber(sensor.highHighLimit, sensor.decimals)}`, tone: 'critical' });
  if (low) limits.push({ value: sensor.lowLimit, label: `Low ${formatNumber(sensor.lowLimit, sensor.decimals)}`, tone: 'info' });
  return limits;
}

function TsSummary({ values, unit, decimals }: { values: ReadonlyArray<number | null>; unit: string; decimals: number }) {
  const summary = summarise(values);
  const cells: Array<[string, number]> = [
    ['Minimum', summary.min],
    ['Average', summary.mean],
    ['Maximum', summary.max],
    ['Change', summary.change],
  ];
  return (
    <dl className="m-0 grid w-full grid-cols-4 gap-4">
      {cells.map(([name, value]) => (
        <div key={name}>
          <dt className="text-xs text-(--kit-text-3)">{name}</dt>
          <dd className="m-0 text-sm font-semibold text-(--kit-text) tabular-nums">
            {name === 'Change' && value > 0 ? '+' : ''}
            {formatNumber(value, decimals)} <span className="text-xs font-medium text-(--kit-text-3)">{unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TsSheet({ title, subtitle, actions, footer, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer}>
        {children}
      </Panel>
    </Canvas>
  );
}

function TimeSeriesSingle() {
  const [range, setRange] = useState('24h');
  const week = tsTrend(TS_PRESSURE, 57, 0.2, 5);
  const values = range === '8h' ? TS_PRESSURE_DAY.slice(-17) : range === '7d' ? week : TS_PRESSURE_DAY;
  const labels = range === '8h' ? TS_LABELS.slice(-17) : range === '7d' ? TS_WEEK_LABELS : TS_LABELS;
  return (
    <TsSheet
      title="Discharge pressure"
      subtitle="23-PT-92531 · 1st stage compressor"
      actions={
        <SegmentedControl value={range} onValueChange={(next) => setRange(String(next))}>
          <SegmentedControlList size="small" aria-label="Time range">
            <SegmentedControlButton value="8h">8 h</SegmentedControlButton>
            <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
            <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
      footer={<TsSummary values={values} unit="barg" decimals={1} />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Stat variant="plain" size="lg" label="Now" value={TS_PRESSURE.value} decimals={1} unit="barg" delta={{ value: values[values.length - 1] - values[0], unit: ' barg', good: 'none', caption: 'over the range' }} />
          <TsStatePill sensor={TS_PRESSURE} />
        </div>
        <SeriesPlot
          label={`Discharge pressure, ${range === '8h' ? 'last 8 hours' : range === '7d' ? 'last 7 days' : 'last 24 hours'}, against its high and trip limits`}
          series={[{ id: 'pressure', label: 'Discharge pressure', values, tone: 'accent', fill: true }]}
          labels={labels}
          unit="barg"
          limits={tsLimits(TS_PRESSURE)}
          xTicks={range === '7d' ? 8 : 7}
          height={280}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesArea() {
  return (
    <TsSheet title="Gas flow" subtitle="23-FT-92510 · area from zero, last 24 hours" footer={<TsSummary values={TS_FLOW_DAY} unit="kSm³/h" decimals={1} />}>
      <SeriesPlot
        label="Gas flow in thousand standard cubic metres per hour, last 24 hours"
        series={[{ id: 'flow', label: 'Gas flow', values: TS_FLOW_DAY, tone: 'teal', fill: true }]}
        labels={TS_LABELS}
        unit="kSm³/h"
        yDomain={[0, 250]}
        xTicks={5}
        height={220}
      />
    </TsSheet>
  );
}

function TimeSeriesStep() {
  return (
    <TsSheet title="Anti-surge valve position" subtitle="23-FV-92520 · a stepped signal holds its value" footer={<TsSummary values={TS_VALVE_DAY} unit="%" decimals={0} />}>
      <SeriesPlot
        label="Anti-surge valve position in percent open, last 24 hours"
        series={[{ id: 'valve', label: 'Valve position', values: TS_VALVE_DAY, tone: 'purple', curve: 'step', fill: true }]}
        labels={TS_LABELS}
        unit="% open"
        decimals={0}
        yDomain={[0, 60]}
        xTicks={5}
        height={220}
      />
    </TsSheet>
  );
}

function TimeSeriesCompact() {
  return (
    <Canvas>
      <Grid>
        {[TS_PRESSURE, TS_TEMPERATURE, TS_VIBRATION].map((sensor) => (
          <Panel key={sensor.id} className="col-span-4" title={sensor.name} subtitle={sensor.tag} actions={<TsStatePill sensor={sensor} />}>
            <div className="flex flex-col gap-3">
              <Stat variant="plain" size="md" label="Now" value={sensor.value} decimals={sensor.decimals} unit={sensor.unit} target={`High limit ${formatNumber(sensor.highLimit, sensor.decimals)} ${sensor.unit}`} />
              <SeriesPlot
                bare
                label={`${sensor.name}, last 24 hours`}
                series={[{ id: sensor.id, label: sensor.name, values: TS_TRAIN_DAY[sensor.id], tone: tsState(sensor).tone, fill: true }]}
                labels={TS_LABELS}
                unit={sensor.unit}
                decimals={sensor.decimals}
                limits={[{ value: sensor.highLimit, label: 'High', tone: 'warning' }]}
                height={84}
              />
              <div className="flex justify-between text-xs text-(--kit-text-3) tabular-nums">
                <span>{TS_LABELS[0]} yesterday</span>
                <span>Now</span>
              </div>
            </div>
          </Panel>
        ))}
      </Grid>
    </Canvas>
  );
}

function TimeSeriesLimits() {
  return (
    <TsSheet title="Suction pressure" subtitle="23-PT-92530 · high and low limit lines" actions={<TsStatePill sensor={TS_SUCTION} />}>
      <SeriesPlot
        label="Suction pressure against its low and high limits, last 24 hours"
        series={[{ id: 'suction', label: 'Suction pressure', values: TS_SUCTION_DAY, tone: 'blue' }]}
        labels={TS_LABELS}
        unit="barg"
        limits={tsLimits(TS_SUCTION, true)}
        yDomain={[8, 16]}
        xTicks={5}
        height={240}
      />
    </TsSheet>
  );
}

function TimeSeriesBand() {
  return (
    <TsSheet
      title="Separator level"
      subtitle="20-LT-10012 · operating band shaded"
      actions={<TsStatePill sensor={TS_LEVEL} />}
    >
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Separator level inside its 30 to 70 percent operating band, last 24 hours"
          series={[{ id: 'level', label: 'Separator level', values: TS_LEVEL_DAY, tone: 'blue' }]}
          labels={TS_LABELS}
          unit="%"
          bands={[{ from: TS_LEVEL.lowLimit, to: TS_LEVEL.highLimit, tone: 'success' }]}
          yDomain={[20, 80]}
          xTicks={5}
          height={216}
        />
        <Legend
          items={[
            { label: 'Level', tone: 'blue', mark: 'line' },
            { label: 'Operating band 30–70 %', tone: 'success' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesTrip() {
  return (
    <TsSheet
      title="Recompressor drive-end vibration"
      subtitle="23-VT-92740 · excursion and trip at 13:46"
      actions={
        <StatusPill tone="critical" icon={<IconAlertOctagon aria-hidden="true" />}>
          Tripped
        </StatusPill>
      }
      footer={<span>Vibration passed the 7.1 mm/s high limit at 10:30 and reached the 11.0 mm/s trip limit 3 h 16 min later. The machine is running down.</span>}
    >
      <div className="flex flex-col gap-2">
        <SeriesPlot
          label="Recompressor vibration climbing through the high limit to the trip limit, last 24 hours"
          series={[{ id: 'vibration', label: 'Drive-end vibration', values: TS_TRIP_DAY, tone: 'accent' }]}
          labels={TS_LABELS}
          unit="mm/s"
          limits={[
            { value: 7.1, label: 'High 7.1', tone: 'warning' },
            { value: 11, label: 'Trip 11.0', tone: 'critical' },
          ]}
          regions={[{ from: 41, to: 47, label: 'Above high limit', tone: 'warning' }]}
          events={[
            { index: 41, label: 'Alarm 10:30', tone: 'warning' },
            { index: 47, label: 'Trip 13:46', tone: 'critical' },
          ]}
          yDomain={[0, 14]}
          xTicks={7}
          height={280}
          highlightLast={false}
          gutters={{ left: 48, right: 80 }}
        />
        <StateBand label="Run state of the recompressor" caption="State" count={TS_POINTS} segments={TS_TRIP_STATES} inset={{ left: 48, right: 80 }} size="lg" />
      </div>
    </TsSheet>
  );
}

function TimeSeriesSetpoint() {
  return (
    <TsSheet title="Level controller" subtitle="20-LIC-10012 · setpoint and actual">
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Separator level following three setpoint changes, last 24 hours"
          series={[
            { id: 'actual', label: 'Level', values: TS_LEVEL_ACTUAL, tone: 'blue' },
            { id: 'setpoint', label: 'Setpoint', values: TS_SETPOINT_DAY, tone: 'neutral', curve: 'step', dashed: true },
          ]}
          labels={TS_LABELS}
          unit="%"
          yDomain={[44, 62]}
          xTicks={5}
          height={216}
        />
        <Legend
          items={[
            { label: 'Level', tone: 'blue', mark: 'line', value: `${formatNumber(TS_LEVEL_ACTUAL[TS_POINTS - 1], 1)} %` },
            { label: 'Setpoint', tone: 'neutral', mark: 'dashed', value: '54.0 %' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesOverlay() {
  const [hidden, setHidden] = useState<string[]>([]);
  const all: PlotSeries[] = [
    { id: 'discharge', label: 'Discharge pressure', values: TS_PRESSURE_DAY, tone: 'blue' },
    { id: 'suction', label: 'Suction pressure', values: TS_SUCTION_DAY, tone: 'teal' },
    { id: 'interstage', label: 'Interstage pressure', values: TS_INTERSTAGE_DAY, tone: 'purple' },
  ];
  const toggle = (id: string) => setHidden((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : current.length < all.length - 1 ? [...current, id] : current));
  return (
    <TsSheet title="Pressures across the train" subtitle="Three tags in one unit on a shared axis · select a series to hide it">
      <div className="grid grid-cols-[minmax(0,1fr)_17rem] items-start gap-6">
        <SeriesPlot
          label="Discharge, interstage and suction pressure on a shared axis, last 24 hours"
          series={all.filter((entry) => !hidden.includes(entry.id))}
          labels={TS_LABELS}
          unit="barg"
          yDomain={[0, 60]}
          xTicks={7}
          height={280}
          highlightLast={false}
        />
        <SeriesLegend
          direction="column"
          hidden={hidden}
          onToggle={toggle}
          items={[
            { id: 'discharge', label: 'Discharge', detail: '23-PT-92531', tone: 'blue', value: '48.6 barg' },
            { id: 'interstage', label: 'Interstage', detail: '23-PT-92535', tone: 'purple', value: `${formatNumber(TS_INTERSTAGE_DAY[TS_POINTS - 1], 1)} barg` },
            { id: 'suction', label: 'Suction', detail: '23-PT-92530', tone: 'teal', value: '12.4 barg' },
            
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesDualAxis() {
  return (
    <TsSheet title="Speed and vibration" subtitle="Two units, one axis each">
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Drive-end vibration on the left axis and shaft speed on the right axis, last 24 hours"
          series={[
            { id: 'vibration', label: 'Vibration', values: TS_VIBRATION_DAY, tone: 'purple' },
            { id: 'speed', label: 'Shaft speed', values: TS_SPEED_DAY, tone: 'teal', axis: 'right' },
          ]}
          labels={TS_LABELS}
          unit="mm/s"
          rightUnit="rpm"
          rightDecimals={0}
          yDomain={[4, 8]}
          rightDomain={[9000, 10200]}
          xTicks={5}
          height={216}
          highlightLast={false}
        />
        <Legend
          items={[
            { label: 'Vibration, left axis', tone: 'purple', mark: 'line', value: '6.8 mm/s' },
            { label: 'Shaft speed, right axis', tone: 'teal', mark: 'line', value: '9,840 rpm' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesSmallMultiples() {
  const [cursor, setCursor] = useState<number | null>(null);
  const rows = [TS_PRESSURE, TS_TEMPERATURE, TS_VIBRATION];
  return (
    <TsSheet title="Compressor readings" subtitle="One row per unit on a shared time axis · the cursor reads all three">
      <div className="flex flex-col gap-7">
        {rows.map((sensor, index) => (
          <div key={sensor.id} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-(--kit-text)">{sensor.name}</span>
              <span className="text-xl font-semibold text-(--kit-text) tabular-nums">
                {formatNumber(cursor === null ? sensor.value : TS_TRAIN_DAY[sensor.id][cursor], sensor.decimals)} <span className="text-xs font-medium text-(--kit-text-3)">{sensor.unit}</span>
              </span>
            </div>
            <SeriesPlot
              label={`${sensor.name}, last 24 hours`}
              series={[{ id: sensor.id, label: sensor.name, values: TS_TRAIN_DAY[sensor.id], tone: TS_TRAIN_TONE[sensor.id] }]}
              labels={TS_LABELS}
              decimals={sensor.decimals}
              limits={[{ value: sensor.highLimit, label: `High ${formatNumber(sensor.highLimit, sensor.decimals)}`, tone: 'warning' }]}
              xTicks={7}
              height={96}
              gutters={{ left: 48, right: 84 }}
              cursor={cursor}
              onCursorChange={setCursor}
              hideTime={index < rows.length - 1}
              highlightLast={false}
            />
          </div>
        ))}
      </div>
    </TsSheet>
  );
}

function TimeSeriesPreviousPeriod() {
  const yesterday = tsTrend(TS_TEMPERATURE, TS_POINTS, 0.07, 9).map((value) => Number((value - 2.4).toFixed(1)));
  return (
    <TsSheet title="Discharge temperature" subtitle="Today against the same hours yesterday">
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Discharge temperature today with yesterday as a ghost line"
          series={[
            { id: 'today', label: 'Today', values: TS_TEMPERATURE_DAY, tone: 'amber' },
            { id: 'yesterday', label: 'Yesterday', values: yesterday, tone: 'neutral', ghost: true },
          ]}
          labels={TS_LABELS}
          unit="°C"
          limits={[{ value: 145, label: 'High 145', tone: 'warning' }]}
          xTicks={5}
          height={216}
        />
        <Legend
          items={[
            { label: 'Today', tone: 'amber', mark: 'line', value: '141.2 °C' },
            { label: 'Yesterday', tone: 'neutral', mark: 'dashed', value: `${formatNumber(yesterday[TS_POINTS - 1], 1)} °C` },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesEnvelope() {
  return (
    <TsSheet title="Discharge temperature" subtitle="10-minute average with the min–max envelope of 240 raw samples">
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Ten-minute average of discharge temperature with its minimum and maximum, last 4 hours"
          series={[
            {
              id: 'average',
              label: 'Average',
              values: TS_BUCKETS.map((bucket) => Number(bucket.mean.toFixed(1))),
              tone: 'amber',
              envelope: { min: TS_BUCKETS.map((bucket) => bucket.min), max: TS_BUCKETS.map((bucket) => bucket.max) },
            },
          ]}
          labels={TS_BUCKET_LABELS}
          unit="°C"
          xTicks={5}
          height={216}
        />
        <Legend
          items={[
            { label: '10 min average', tone: 'amber', mark: 'line' },
            { label: 'Min to max in each bucket', tone: 'amber' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesGap() {
  const values = TS_COOLER_DAY.map((value, index) => (index >= 20 && index <= 27 ? null : value));
  return (
    <TsSheet
      title="Cooler outlet temperature"
      subtitle="23-TT-91141 · the line stops where the data stops"
      actions={
        <StatusPill tone="warning" icon={<IconAlertTriangle aria-hidden="true" />}>
          Uncertain
        </StatusPill>
      }
    >
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Cooler outlet temperature with a four-hour gap in the data"
          series={[{ id: 'cooler', label: 'Cooler outlet', values, tone: 'pink' }]}
          labels={TS_LABELS}
          unit="°C"
          regions={[{ from: 19, to: 28, label: 'No data, 4 h', pattern: 'hatch' }]}
          limits={[{ value: 40, label: 'High 40', tone: 'warning' }]}
          xTicks={5}
          height={216}
        />
        <Legend
          items={[
            { label: 'Cooler outlet', tone: 'pink', mark: 'line' },
            { label: 'Transmitter offline 23:30–03:30', tone: 'neutral' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesUncertain() {
  const good = TS_COOLER_DAY.map((value, index) => (index > 36 ? null : value));
  const doubtful = TS_COOLER_DAY.map((value, index) => (index < 36 ? null : value));
  return (
    <TsSheet title="Cooler outlet temperature" subtitle="Readings flagged uncertain are kept, but drawn as doubtful">
      <div className="flex flex-col gap-3">
        <SeriesPlot
          label="Cooler outlet temperature, the last six hours flagged as uncertain quality"
          series={[
            { id: 'good', label: 'Good quality', values: good, tone: 'pink' },
            { id: 'uncertain', label: 'Uncertain quality', values: doubtful, tone: 'pink', dashed: true },
          ]}
          labels={TS_LABELS}
          unit="°C"
          regions={[{ from: 36, to: 48, label: 'Uncertain', tone: 'warning' }]}
          xTicks={5}
          height={216}
          highlightLast={false}
        />
        <Legend
          items={[
            { label: 'Good quality', tone: 'pink', mark: 'line' },
            { label: 'Uncertain since 08:00', tone: 'pink', mark: 'dashed' },
          ]}
        />
      </div>
    </TsSheet>
  );
}

function TimeSeriesStates() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-4" title="Loading" subtitle="23-PT-92531 · last 7 days">
          <PlotState state="loading" title="Loading 7 days of data" description="10,080 points from the historian." height={200} />
        </Panel>
        <Panel className="col-span-4" title="No data" subtitle="40-TT-40015 · last 24 hours">
          <PlotState
            state="empty"
            icon={<IconDatabaseOff />}
            title="No data in this range"
            description="The transmitter has reported bad quality since 05:00."
            action={
              <Button variant="outline" size="sm">
                Show last good day
              </Button>
            }
            height={200}
          />
        </Panel>
        <Panel className="col-span-4" title="Failed to load" subtitle="23-TT-92532 · last 24 hours">
          <PlotState
            state="error"
            icon={<IconCloudOff />}
            title="Could not load the trend"
            description="The time series service did not answer."
            action={
              <Button variant="outline" size="sm">
                <IconRefresh aria-hidden="true" />
                Try again
              </Button>
            }
            height={200}
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

type TsReadingRow = { sensor: Sensor };

const TS_READING_COLUMNS: DataTableColumn<TsReadingRow>[] = [
  { id: 'tag', header: 'Tag', cell: (row) => <TagId>{row.sensor.tag}</TagId>, nowrap: true },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (row) => `${formatNumber(row.sensor.value, row.sensor.decimals)} ${row.sensor.unit}` },
  { id: 'limit', header: 'High', numeric: true, muted: true, cell: (row) => formatNumber(row.sensor.highLimit, row.sensor.decimals) },
  { id: 'state', header: 'State', cell: (row) => <TsStatePill sensor={row.sensor} /> },
];

function TimeSeriesLookConsole() {
  const [cursor, setCursor] = useState<number | null>(null);
  const rows = [TS_PRESSURE, TS_TEMPERATURE, TS_VIBRATION];
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" title="Compression train" subtitle="23-KA-9101 · last 24 h · shared cursor">
            <div className="flex flex-col gap-3">
              {rows.map((sensor, index) => (
                <SeriesPlot
                  key={sensor.id}
                  label={`${sensor.name}, last 24 hours`}
                  series={[{ id: sensor.id, label: sensor.name, values: TS_TRAIN_DAY[sensor.id], tone: TS_TRAIN_TONE[sensor.id] }]}
                  labels={TS_LABELS}
                  caption={sensor.name}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  gutters={{ left: 44, right: 64 }}
                  limits={[{ value: sensor.highLimit, label: `H ${formatNumber(sensor.highLimit, sensor.decimals)}`, tone: 'warning' }]}
                  xTicks={7}
                  height={104}
                  cursor={cursor}
                  onCursorChange={setCursor}
                  hideTime={index < rows.length - 1}
                />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-5" title="Readings" subtitle="Live" padding="none">
            <DataTable flush label="Compressor readings" columns={TS_READING_COLUMNS} rows={TS_TRAIN.map((sensor) => ({ sensor }))} rowKey={(row) => row.sensor.id} rowTone={(row) => (tsState(row.sensor).tone === 'success' ? undefined : tsState(row.sensor).tone)} />
            <div className="flex flex-col gap-4 p-3.5">
              <span className="text-xs font-medium text-(--kit-text-2)">Share of the range used</span>
              {rows.map((sensor) => (
                <Meter key={sensor.id} label={sensor.name} value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} decimals={sensor.decimals} high={sensor.highLimit} tone={tsState(sensor).tone} hideScale />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function TimeSeriesLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Gas flow and discharge pressure" subtitle="1st stage compressor · last 24 hours">
            <div className="flex flex-col gap-3">
              <SeriesPlot
                label="Gas flow on the left axis and discharge pressure on the right axis, last 24 hours"
                series={[
                  { id: 'flow', label: 'Gas flow', values: TS_FLOW_DAY, tone: 'sky', fill: true },
                  { id: 'pressure', label: 'Discharge pressure', values: TS_PRESSURE_DAY, tone: 'pink', axis: 'right' },
                ]}
                labels={TS_LABELS}
                unit="kSm³/h"
                rightUnit="barg"
                yDomain={[120, 220]}
                rightDomain={[40, 56]}
                xTicks={7}
                height={260}
              />
              <Legend
                items={[
                  { label: 'Gas flow', tone: 'sky', mark: 'line', value: '182.4 kSm³/h' },
                  { label: 'Discharge pressure', tone: 'pink', mark: 'line', value: '48.6 barg' },
                ]}
              />
            </div>
          </Panel>
          <Panel className="col-span-4" title="Time in band" subtitle="Share of the day inside limits">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-4">
              <RingGauge label="Pressure" value={97} tone="pink" size={104} />
              <RingGauge label="Flow" value={100} tone="sky" size={104} />
              <RingGauge label="Temperature" value={88} tone="amber" size={104} />
              <RingGauge label="Vibration" value={92} tone="purple" size={104} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function TimeSeriesLookBlueprint() {
  const hourly = TS_PRESSURE_DAY.filter((_, index) => index % 2 === 0);
  const labels = TS_LABELS.filter((_, index) => index % 2 === 0);
  const summary = summarise(hourly);
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Discharge pressure" subtitle="23-PT-92531 · hourly samples, each one marked">
            <SeriesPlot
              label="Hourly discharge pressure samples against the operating band and trip limit"
              series={[{ id: 'pressure', label: 'Discharge pressure', values: hourly, tone: 'accent' }]}
              labels={labels}
              unit="barg"
              limits={tsLimits(TS_PRESSURE, true)}
              bands={[{ from: 40, to: 52, tone: 'accent' }]}
              yDomain={[36, 58]}
              xTicks={7}
              height={280}
            />
          </Panel>
          <Panel className="col-span-4" title="Record" subtitle="Sheet 1 of 1" padding="none">
            <DataTable
              flush
              label="Statistics of the plotted samples"
              columns={[
                { id: 'name', header: 'Quantity', cell: (row: { name: string; value: string }) => row.name },
                { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (row: { name: string; value: string }) => row.value },
              ]}
              rows={[
                { name: 'Samples', value: String(summary.count) },
                { name: 'Minimum', value: `${formatNumber(summary.min, 1)} barg` },
                { name: 'Average', value: `${formatNumber(summary.mean, 1)} barg` },
                { name: 'Maximum', value: `${formatNumber(summary.max, 1)} barg` },
                { name: 'Range', value: `${formatNumber(summary.max - summary.min, 1)} barg` },
                { name: 'First sample', value: `${formatNumber(summary.first, 1)} barg` },
                { name: 'Last sample', value: `${formatNumber(summary.last, 1)} barg` },
                { name: 'Margin to high', value: `${formatNumber(52 - summary.max, 1)} barg` },
                { name: 'Margin to trip', value: `${formatNumber(55 - summary.max, 1)} barg` },
              ]}
              rowKey={(row) => row.name}
            />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function TimeSeriesLookEditorial() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <div className="flex flex-col gap-6">
          <SectionHeader eyebrow="Nordkapp · daily report" title="Export held at 97 % of plan through the recompressor trip" description="Gas export over the last 24 hours against the daily plan." size="lg" />
          <div className="grid grid-cols-[13rem_minmax(0,1fr)_14rem] items-start gap-8">
            <div className="flex flex-col gap-5">
              <Stat variant="plain" size="hero" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" />
              <Stat variant="plain" size="md" label="Against plan" value={-0.12} decimals={2} unit="MSm³/d" />
            </div>
            <SeriesPlot
              label="Gas export over the last 24 hours against the 4.50 plan"
              series={[
                { id: 'today', label: 'Today', values: makeValues({ seed: 31, points: TS_POINTS, base: 4.36, amplitude: 0.12, noise: 0.03, cycles: 1.5, decimals: 2 }), tone: 'accent' },
                { id: 'yesterday', label: 'Yesterday', values: makeValues({ seed: 32, points: TS_POINTS, base: 4.24, amplitude: 0.09, noise: 0.03, cycles: 1.5, decimals: 2 }), tone: 'neutral', ghost: true },
              ]}
              labels={TS_LABELS}
              unit="MSm³/d"
              decimals={2}
              limits={[{ value: 4.5, label: 'Plan 4.50', tone: 'amber' }]}
              events={[{ index: 47, label: 'Trip 13:46', tone: 'critical' }]}
              xTicks={7}
              height={280}
              highlightLast={false}
            />
            <ol className="m-0 flex list-none flex-col gap-4 p-0 text-sm text-(--kit-text-2)">
              <li>
                <strong className="block text-(--kit-text)">1 · Night peak</strong>
                Export ran above plan between 02:00 and 05:00 on cooler ambient air.
              </li>
              <li>
                <strong className="block text-(--kit-text)">2 · Morning dip</strong>
                Suction pressure fell with the test separator in service.
              </li>
              <li>
                <strong className="block text-(--kit-text)">3 · Trip</strong>
                The recompressor tripped at 13:46; the two main stages carried the load.
              </li>
            </ol>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function TimeSeriesLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <Stat className="col-span-4" size="hero" tone="amber" label="Discharge temperature" value={TS_TEMPERATURE.value} decimals={1} unit="°C" target="3.8 °C under the 145 limit" />
          <Panel className="col-span-8" title="24 hours, one line, one limit" subtitle="23-TT-92532">
            <SeriesPlot
              label="Discharge temperature as a solid area against its high limit, last 24 hours"
              series={[{ id: 'temperature', label: 'Discharge temperature', values: TS_TEMPERATURE_DAY, tone: 'amber', fill: true }]}
              labels={TS_LABELS}
              unit="°C"
              limits={[{ value: 145, label: 'High 145', tone: 'critical' }]}
              yDomain={[130, 150]}
              xTicks={5}
              height={240}
            />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function TimeSeriesInvestigation() {
  const [selected, setSelected] = useState(TS_VIBRATION.id);
  const sensor = tsSensor(selected);
  const values = TS_TRAIN_DAY[sensor.id];
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-5" title="Tags" subtitle="1st stage compressor · select one to trend" padding="tight">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {TS_TRAIN.map((entry) => {
              const state = tsState(entry);
              const active = entry.id === selected;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(entry.id)}
                    className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_4.5rem_auto] items-center gap-3 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-rule-strong)"
                    style={{
                      borderRadius: 'var(--kit-radius-sm)',
                      background: active ? 'color-mix(in oklab, var(--kit-accent) 9%, transparent)' : 'transparent',
                      boxShadow: active ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined,
                    }}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-(--kit-text)">{entry.name}</span>
                      <TagId>{entry.tag}</TagId>
                    </span>
                    <SeriesPlot bare interactive={false} label={`${entry.name} trend`} series={[{ id: entry.id, label: entry.name, values: TS_TRAIN_DAY[entry.id], tone: state.tone === 'success' ? 'accent' : state.tone }]} labels={TS_LABELS} height={28} />
                    <span className="w-20 text-right text-sm font-semibold text-(--kit-text) tabular-nums">
                      {formatNumber(entry.value, entry.decimals)} <span className="text-xs font-medium text-(--kit-text-3)">{entry.unit}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel
          className="col-span-7"
          title={sensor.name}
          subtitle={`${sensor.tag} · last 24 hours`}
          actions={
            <>
              <TsStatePill sensor={sensor} />
              <Button variant="outline" size="sm">
                <IconDownload aria-hidden="true" />
                Export
              </Button>
            </>
          }
          footer={<TsSummary values={values} unit={sensor.unit} decimals={sensor.decimals} />}
        >
          <div className="flex flex-col gap-2">
            <SeriesPlot
              label={`${sensor.name} against its limits with the day's events, last 24 hours`}
              series={[{ id: sensor.id, label: sensor.name, values, tone: 'accent', fill: true }]}
              labels={TS_LABELS}
              unit={sensor.unit}
              decimals={sensor.decimals}
              limits={tsLimits(sensor)}
              events={[
                { index: 16, label: 'Night shift', tone: 'neutral' },
                { index: 32, label: 'Day shift', tone: 'neutral' },
              ]}
              xTicks={5}
              height={260}
              gutters={{ left: 48, right: 76 }}
            />
            <StateBand
              label="Run state of the 1st stage compressor"
              caption="State"
              count={TS_POINTS}
              inset={{ left: 48, right: 76 }}
              segments={[
                { from: 0, to: 20, label: 'Running', tone: 'success' },
                { from: 20, to: 23, label: 'Recycle', tone: 'info' },
                { from: 23, to: 48, label: 'Running', tone: 'success' },
              ]}
            />
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function TimeSeriesTrainBoard() {
  return (
    <LookScope look="soft">
      <Canvas>
        <div className="flex flex-col gap-5">
          <SectionHeader title="Compression train today" description="Six readings, each with its day and its nearest limit." actions={<StatusPill tone="warning">2 near a limit</StatusPill>} />
          <Grid>
            {TS_TRAIN.map((sensor) => {
              const state = tsState(sensor);
              return (
                <Panel key={sensor.id} className="col-span-4" tone={TS_TRAIN_TONE[sensor.id]} title={sensor.name} subtitle={sensor.tag}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <Stat variant="plain" size="md" label="Now" value={sensor.value} decimals={sensor.decimals} unit={sensor.unit} target={`${formatNumber(((sensor.highLimit - sensor.value) / sensor.highLimit) * 100, 0)} % below the high limit`} />
                      <TsStatePill sensor={sensor} />
                    </div>
                    <SeriesPlot
                      bare
                      label={`${sensor.name}, last 24 hours`}
                      series={[{ id: sensor.id, label: sensor.name, values: TS_TRAIN_DAY[sensor.id], tone: state.tone === 'success' ? TS_TRAIN_TONE[sensor.id] : state.tone, fill: true }]}
                      labels={TS_LABELS}
                      unit={sensor.unit}
                      decimals={sensor.decimals}
                      height={72}
                    />
                  </div>
                </Panel>
              );
            })}
          </Grid>
        </div>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'time-series',
  title: 'Time series',
  summary:
    'Sensor trends drawn for reading, not decoration: one tag against its limits, several tags on shared or separate axes, aggregated envelopes, gaps and doubtful data, and the loading, empty and failed states around them. Every plot takes its line weight, fill, grid and markers from the look it sits in.',
  guidance: {
    use: [
      'Draw the limits the alarm system uses, named at the end of the line, so the chart and the alarm list agree.',
      'Break the line at a gap and say why; a straight line across missing hours is a false reading.',
      'Give each unit its own axis or its own row; share an axis only between tags in the same unit.',
      'Write the latest value on the plot or beside it, with its unit and its state in a word.',
    ],
    avoid: [
      'More than four lines in one plot; split into rows on a shared time axis instead.',
      'A y axis that starts at zero when the story is a few percent of movement near a limit.',
      'Colour as the only difference between series; add the legend with values and vary the line style.',
      'Smoothing that hides spikes; show the min–max envelope when you aggregate.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'One series',
      description: 'A single tag over time: as a line with limits, as an area from zero, as a stepped signal and as a compact card.',
      specimens: [
        {
          id: 'TimeSeriesSingle',
          title: 'Single sensor trend',
          note: 'Pick it as the default view of one tag: current value, state, range switch, limits and the statistics of the range.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/plotMath.ts', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/StatusPill.tsx'],
          Component: TimeSeriesSingle,
        },
        {
          id: 'TimeSeriesArea',
          title: 'Area from zero',
          note: 'Pick it for a quantity where the amount matters, such as flow or power, and keep the axis at zero.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Panel.tsx'],
          Component: TimeSeriesArea,
        },
        {
          id: 'TimeSeriesStep',
          title: 'Step series',
          note: 'Pick it for signals that hold a value until they change: valve positions, setpoints, modes and counters.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Panel.tsx'],
          Component: TimeSeriesStep,
        },
        {
          id: 'TimeSeriesCompact',
          title: 'Compact trend cards',
          note: 'Pick it for a row of tags on an overview, where the shape of the day and the nearest limit are enough.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/StatusPill.tsx'],
          Component: TimeSeriesCompact,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Limits, bands and setpoints',
      description: 'What the reading is measured against, drawn on the plot and named.',
      specimens: [
        {
          id: 'TimeSeriesLimits',
          title: 'High and low limit lines',
          note: 'Pick it when the tag has alarm limits on both sides and the distance to each is what the reader checks.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/StatusPill.tsx'],
          Component: TimeSeriesLimits,
        },
        {
          id: 'TimeSeriesBand',
          title: 'Operating band shaded',
          note: 'Pick it when being inside a range is the goal, so the eye checks the band and not two separate lines.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesBand,
        },
        {
          id: 'TimeSeriesTrip',
          title: 'Trip limit and excursion',
          note: 'Pick it to explain an event: the excursion is shaded, the alarm and the trip are flagged, and the run state sits underneath.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/StateBand.tsx', 'kit/StatusPill.tsx'],
          Component: TimeSeriesTrip,
        },
        {
          id: 'TimeSeriesSetpoint',
          title: 'Setpoint and actual',
          note: 'Pick it for a controlled value, where how fast and how closely the reading follows the setpoint is the story.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesSetpoint,
        },
        {
          id: 'TimeSeriesPreviousPeriod',
          title: 'Previous period as ghost',
          note: 'Pick it to answer "is today different?" without a second chart: yesterday is a quiet dotted line behind today.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesPreviousPeriod,
        },
      ],
    },
    {
      id: 'several-series',
      title: 'Several series',
      description: 'More than one tag: overlaid, on two axes, or stacked on a shared time axis with a linked cursor.',
      specimens: [
        {
          id: 'TimeSeriesOverlay',
          title: 'Overlay with legend toggles',
          note: 'Pick it for up to four tags in the same unit; the legend carries the values and switches series off.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/SeriesLegend.tsx'],
          Component: TimeSeriesOverlay,
        },
        {
          id: 'TimeSeriesDualAxis',
          title: 'Dual axis',
          note: 'Pick it for exactly two tags in different units whose relationship is the point, such as speed and vibration.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesDualAxis,
        },
        {
          id: 'TimeSeriesEnvelope',
          title: 'Min, max and average',
          note: 'Pick it whenever you aggregate: the band keeps the spikes that an average alone would hide.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/plotMath.ts', 'kit/Legend.tsx'],
          Component: TimeSeriesEnvelope,
        },
        {
          id: 'TimeSeriesSmallMultiples',
          title: 'Stacked rows, linked cursor',
          note: 'Pick it for tags in different units: one row each on a shared time axis, read together by one cursor.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx'],
          Component: TimeSeriesSmallMultiples,
        },
      ],
    },
    {
      id: 'quality-and-states',
      title: 'Data quality and states',
      description: 'What the chart shows when the data is missing, doubtful, still loading or failed to arrive.',
      specimens: [
        {
          id: 'TimeSeriesGap',
          title: 'Gap in the data',
          note: 'Pick it whenever samples are missing: the line breaks, the stretch is hatched and the reason is written.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/StatusPill.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesGap,
        },
        {
          id: 'TimeSeriesUncertain',
          title: 'Uncertain quality segment',
          note: 'Pick it when readings exist but are flagged: keep them, draw them dashed and shade the stretch.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Legend.tsx'],
          Component: TimeSeriesUncertain,
        },
        {
          id: 'TimeSeriesStates',
          title: 'Loading, no data and failed',
          note: 'Pick the placeholder that matches: a skeleton at the plot size, a reason with a way forward, or the failure with a retry.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/PlotState.tsx', 'kit/Panel.tsx'],
          Component: TimeSeriesStates,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same trends in five looks',
      description: 'Line weight, fill, grid, markers and the layout around the plot all belong to the look.',
      specimens: [
        {
          id: 'TimeSeriesLookConsole',
          title: 'Console: stacked strips and a readings table',
          note: 'Pick it for an operator who watches the same train all shift: hairline grids, square panels, one cursor for all rows.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/DataTable.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesLookConsole,
        },
        {
          id: 'TimeSeriesLookGlass',
          title: 'Glass: glowing lines and rings',
          note: 'Pick it for a showcase or a dark overview, where two glowing series and a few rings carry the screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/RingGauge.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesLookGlass,
        },
        {
          id: 'TimeSeriesLookBlueprint',
          title: 'Blueprint: marked samples and a record table',
          note: 'Pick it for engineering documents: every sample is a point, limits are dimensioned and the statistics sit in a title block.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/plotMath.ts', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesLookBlueprint,
        },
        {
          id: 'TimeSeriesLookEditorial',
          title: 'Editorial: headline figure and annotations',
          note: 'Pick it for a report: the conclusion is the headline, the figure is huge and the notes beside the chart explain its shape.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/SectionHeader.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesLookEditorial,
        },
        {
          id: 'TimeSeriesLookPoster',
          title: 'Poster: one solid area, one limit',
          note: 'Pick it for a team screen where one tag and its limit must land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesLookPoster,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'TimeSeriesInvestigation',
          title: 'Tag explorer',
          note: 'Pick it as the trend view of an asset page: a list of tags with their day, and the selected tag in full with limits, events and run state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/time-series/StateBand.tsx', 'kit/time-series/plotMath.ts', 'kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: TimeSeriesInvestigation,
        },
        {
          id: 'TimeSeriesTrainBoard',
          title: 'Train board in soft cards',
          note: 'Pick it for a friendly overview for people outside the control room: one tinted card per reading with its day.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/time-series/SeriesPlot.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: TimeSeriesTrainBoard,
        },
      ],
    },
  ],
});
