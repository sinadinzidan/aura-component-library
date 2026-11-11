import { IconAlertOctagon, IconAlertTriangle, IconBolt, IconCircleCheck, IconFlame, IconGauge, IconPlugConnectedX, IconSnowflake } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Delta } from '../../../library/kit/Delta';
import { Grid } from '../../../library/kit/Grid';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { MicroTrend, type MicroTrendVariant } from '../../../library/kit/sparklines-and-trends/MicroTrend';
import { changeOf, extremes, isFrozen, shareAbove } from '../../../library/kit/sparklines-and-trends/sparkMath';
import { StateTicks, type StateTick } from '../../../library/kit/sparklines-and-trends/StateTicks';
import { TrendTile } from '../../../library/kit/sparklines-and-trends/TrendTile';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { SeriesPlot } from '../../../library/kit/time-series/SeriesPlot';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS, SENSORS, type Sensor } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatDate, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './sparklines-and-trends.tsx?raw';

const SPARK_POINTS = 25;

/** A day of hourly readings for a tag, ending on its current value. */
function sparkDay(sensor: Sensor, points: number = SPARK_POINTS, wave = 0.14): number[] {
  const span = sensor.highLimit - sensor.lowLimit;
  const raw = makeValues({ seed: sensor.seed * 3 + points, points, base: sensor.value, amplitude: span * wave, noise: span * 0.04, cycles: 2, decimals: sensor.decimals + 1 });
  const offset = sensor.value - raw[raw.length - 1];
  return raw.map((value) => Number((value + offset).toFixed(sensor.decimals + 1)));
}

function sparkSensor(id: string): Sensor {
  return SENSORS.find((sensor) => sensor.id === id) ?? SENSORS[0];
}

const SPARK_PRESSURE = sparkSensor('pt-92531');

const SPARK_TEMPERATURE = sparkSensor('tt-92532');

const SPARK_VIBRATION = sparkSensor('vt-92540');

const SPARK_SPEED = sparkSensor('st-92501');

const SPARK_LEVEL = sparkSensor('lt-10012');

const SPARK_COOLER = sparkSensor('tt-91141');

const SPARK_LIVE = SENSORS.filter((sensor) => sensor.quality !== 'bad');

const SPARK_DAYS = new Map(SENSORS.map((sensor) => [sensor.id, sensor.id === 'tt-92532' ? sparkDay(sensor, SPARK_POINTS, 0.07) : sensor.id === 'vt-92540' ? sparkDay(sensor, SPARK_POINTS, 0.05) : sparkDay(sensor)]));

function sparkValues(sensor: Sensor): number[] {
  return SPARK_DAYS.get(sensor.id) ?? [];
}

const SPARK_PRESSURE_DAY = sparkValues(SPARK_PRESSURE);

/** Recompressor vibration running into its trip limit. */
const SPARK_TRIP = Array.from({ length: SPARK_POINTS }, (_, index) => Number((6.2 + Math.sin(index / 2) * 0.3 + Math.max(0, index - 14) ** 1.75 * 0.095).toFixed(1)));

const SPARK_FROZEN = Array.from({ length: SPARK_POINTS }, () => 38.9);

const SPARK_GAPPED = sparkValues(SPARK_COOLER).map((value, index) => (index >= 9 && index <= 13 ? null : value));

const SPARK_NONE: Array<number | null> = Array.from({ length: SPARK_POINTS }, () => null);

/** Daily flaring for 14 days against the 15 kSm³/d permit. */
const SPARK_FLARING = [11.8, 12.6, 13.1, 16.4, 14.2, 12.9, 11.4, 10.8, 15.6, 17.9, 14.8, 13.2, 12.9, 12.4];

const SPARK_FLARING_DAYS = SPARK_FLARING.map((_, index) => formatDate(REFERENCE_NOW - (SPARK_FLARING.length - 1 - index) * DAY));

const SPARK_FLARING_TICKS: StateTick[] = SPARK_FLARING.map((value, index) => ({
  label: SPARK_FLARING_DAYS[index],
  tone: value >= 15 ? 'critical' : value >= 14 ? 'warning' : 'success',
  word: value >= 15 ? 'Over permit' : value >= 14 ? 'Near permit' : 'Within permit',
}));

const SPARK_KPI_WEEKS = {
  availability: makeValues({ seed: 201, points: 14, base: 96.8, amplitude: 0.6, noise: 0.25, drift: -0.5, decimals: 1 }),
  export: makeValues({ seed: 202, points: 14, base: 4.3, amplitude: 0.1, noise: 0.04, drift: 0.12, decimals: 2 }),
  energy: makeValues({ seed: 203, points: 14, base: 32, amplitude: 0.6, noise: 0.3, drift: -1.2, decimals: 1 }),
  flaring: SPARK_FLARING,
};

function sparkState(sensor: Sensor, value: number = sensor.value): { tone: Tone; word: string } {
  if (sensor.quality === 'bad') return { tone: 'neutral', word: 'No signal' };
  if (sensor.highHighLimit !== undefined && value >= sensor.highHighLimit) return { tone: 'critical', word: 'Trip' };
  if (value > sensor.highLimit) return { tone: 'critical', word: 'High' };
  if (value >= sensor.highLimit - (sensor.highLimit - sensor.lowLimit) * 0.12) return { tone: 'warning', word: 'Near limit' };
  return { tone: 'success', word: 'Normal' };
}

function SparkStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" />;
  if (tone === 'neutral') return <IconPlugConnectedX aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function SparkPill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <StatusPill tone={tone} icon={<SparkStateIcon tone={tone} />}>
      {children}
    </StatusPill>
  );
}

function sparkTrendTone(sensor: Sensor): Tone {
  const state = sparkState(sensor);
  return state.tone === 'success' ? 'accent' : state.tone;
}

function SparkSheet({ title, subtitle, actions, footer, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer}>
        {children}
      </Panel>
    </Canvas>
  );
}

/** One labelled sample inside a sheet: a caption over the trend, a reading under it. */
function SparkSample({ caption, reading, children }: { caption: string; reading?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium text-(--kit-text)">{caption}</span>
      {children}
      {reading ? <span className="text-xs text-(--kit-text-2) tabular-nums">{reading}</span> : null}
    </div>
  );
}

const SPARK_FORMS: Array<{ variant: MicroTrendVariant; caption: string; reading: string }> = [
  { variant: 'line', caption: 'Line', reading: 'The default: shape only' },
  { variant: 'area', caption: 'Area', reading: 'More weight in a card' },
  { variant: 'bars', caption: 'Bars', reading: 'Counts and totals per period' },
  { variant: 'step', caption: 'Step', reading: 'Signals that hold a value' },
  { variant: 'dots', caption: 'Dots', reading: 'Separate samples, not a flow' },
];

function SparklineForms() {
  return (
    <SparkSheet title="Discharge pressure, last 24 hours" subtitle="23-PT-92531 · the same 25 readings in five forms">
      <div className="grid grid-cols-5 gap-8">
        {SPARK_FORMS.map((form) => (
          <SparkSample key={form.variant} caption={form.caption} reading={form.reading}>
            <MicroTrend className="h-16 w-full" variant={form.variant} values={SPARK_PRESSURE_DAY} label={`Discharge pressure as ${form.caption.toLowerCase()}, last 24 hours`} />
          </SparkSample>
        ))}
      </div>
    </SparkSheet>
  );
}

function SparklineMarkers() {
  const ends = extremes(SPARK_PRESSURE_DAY);
  return (
    <SparkSheet title="Markers" subtitle="Which point the eye should land on">
      <div className="grid grid-cols-3 gap-6">
        <SparkSample caption="Latest value" reading="48.6 barg now">
          <MicroTrend className="h-14 w-full" variant="line" values={SPARK_PRESSURE_DAY} label="Discharge pressure with the latest value marked" />
        </SparkSample>
        <SparkSample caption="Lowest and highest" reading={ends ? `${formatNumber(SPARK_PRESSURE_DAY[ends.min], 1)} to ${formatNumber(SPARK_PRESSURE_DAY[ends.max], 1)} barg` : undefined}>
          <MicroTrend className="h-14 w-full" variant="line" marker="extremes" values={SPARK_PRESSURE_DAY} label="Discharge pressure with its lowest and highest value marked" />
        </SparkSample>
        <SparkSample caption="No marker" reading="When a figure sits beside it">
          <MicroTrend className="h-14 w-full" variant="line" marker="none" values={SPARK_PRESSURE_DAY} label="Discharge pressure without markers" />
        </SparkSample>
      </div>
    </SparkSheet>
  );
}

function SparklineLimitAndBand() {
  return (
    <SparkSheet title="Limit and band" subtitle="What the trend is measured against">
      <div className="grid grid-cols-3 gap-6">
        <SparkSample caption="High limit line" reading="High 7.1 mm/s">
          <MicroTrend className="h-14 w-full" variant="line" tone="warning" overTone="warning" limit={SPARK_VIBRATION.highLimit} values={sparkValues(SPARK_VIBRATION)} label="Drive-end vibration against its high limit" />
        </SparkSample>
        <SparkSample caption="Normal band" reading="Band 30–70 %">
          <MicroTrend className="h-14 w-full" variant="line" tone="blue" band={[30, 70]} domain={[24, 76]} values={sparkValues(SPARK_LEVEL)} label="Separator level inside its normal band" />
        </SparkSample>
        <SparkSample caption="Bars over a limit" reading="Permit 15 kSm³/d">
          <MicroTrend className="h-14 w-full" variant="bars" tone="neutral" limit={15} domain={[0, 18]} values={SPARK_FLARING} label="Daily flaring against the permit, two days over" />
        </SparkSample>
      </div>
    </SparkSheet>
  );
}

function SparklineSizes() {
  const dense = makeValues({ seed: 77, points: 200, base: 48.6, amplitude: 1.6, noise: 0.5, cycles: 3, decimals: 1 });
  return (
    <SparkSheet title="Size and density" subtitle="From a table cell to the hero of a card, from 12 points to 200">
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-end gap-x-10 gap-y-6">
        <SparkSample caption="In a table cell" reading="20 px high">
          <MicroTrend className="h-5 w-24" variant="line" values={SPARK_PRESSURE_DAY} label="Discharge pressure, table size" />
        </SparkSample>
        <SparkSample caption="Beside a figure" reading="32 px high">
          <MicroTrend className="h-8 w-36" variant="line" values={SPARK_PRESSURE_DAY} label="Discharge pressure, row size" />
        </SparkSample>
        <SparkSample caption="Fills a card" reading="72 px high, full width">
          <MicroTrend className="h-[72px] w-full" variant="area" values={SPARK_PRESSURE_DAY} label="Discharge pressure, card size" />
        </SparkSample>
        <SparkSample caption="12 points" reading="2-hour averages">
          <MicroTrend className="h-8 w-24" variant="line" values={SPARK_PRESSURE_DAY.filter((_, index) => index % 2 === 0).slice(0, 12)} label="Discharge pressure, 12 points" />
        </SparkSample>
        <SparkSample caption="25 points" reading="Hourly">
          <MicroTrend className="h-8 w-36" variant="line" values={SPARK_PRESSURE_DAY} label="Discharge pressure, 25 points" />
        </SparkSample>
        <SparkSample caption="200 points" reading="Raw samples keep the spikes; give them width">
          <MicroTrend className="h-8 w-full" variant="line" values={dense} label="Discharge pressure, 200 points" />
        </SparkSample>
      </div>
    </SparkSheet>
  );
}

function SparklineSharedScale() {
  const tags = [sparkSensor('pt-92530'), sparkSensor('pt-10010'), SPARK_PRESSURE];
  return (
    <SparkSheet title="Own scale or shared scale" subtitle="Three pressures: the same data reads differently">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-6 gap-y-4">
        <span className="text-xs font-medium text-(--kit-text-2)">Tag</span>
        <span className="text-xs font-medium text-(--kit-text-2)">Own scale: shape</span>
        <span className="text-xs font-medium text-(--kit-text-2)">Shared 0–60 barg: size</span>
        {tags.map((sensor) => (
          <div key={sensor.id} className="contents">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-(--kit-text)">{sensor.name}</span>
              <span className="text-xs text-(--kit-text-2) tabular-nums">
                {formatNumber(sensor.value, 1)} {sensor.unit}
              </span>
            </span>
            <MicroTrend className="h-9 w-full" variant="line" tone="blue" values={sparkValues(sensor)} label={`${sensor.name} on its own scale`} />
            <MicroTrend className="h-9 w-full" variant="line" tone="teal" domain={[0, 60]} values={sparkValues(sensor)} label={`${sensor.name} on a shared 0 to 60 barg scale`} />
          </div>
        ))}
      </div>
    </SparkSheet>
  );
}

function SparklineStates() {
  return (
    <Canvas>
      <Grid>
        <TrendTile className="col-span-4" label="Normal" detail="Discharge pressure" value={48.6} decimals={1} unit="barg" aside={<SparkPill tone="success">Normal</SparkPill>} trend={<MicroTrend className="h-12 w-full" tone="success" values={SPARK_PRESSURE_DAY} limit={52} overTone="warning" label="Discharge pressure, normal" />} footnote="3.4 barg under the high limit" />
        <TrendTile className="col-span-4" label="Near limit" detail="Drive-end vibration" value={6.8} decimals={1} unit="mm/s" aside={<SparkPill tone="warning">Near limit</SparkPill>} trend={<MicroTrend className="h-12 w-full" tone="warning" values={sparkValues(SPARK_VIBRATION)} limit={7.1} overTone="warning" label="Drive-end vibration, near its limit" />} footnote={`0.3 mm/s under the limit · ${formatNumber(shareAbove(sparkValues(SPARK_VIBRATION), 7.1) * 100, 0)} % of the day above it`} />
        <TrendTile className="col-span-4" label="Trip" detail="Recompressor vibration" value={11.6} decimals={1} unit="mm/s" aside={<SparkPill tone="critical">Trip</SparkPill>} trend={<MicroTrend className="h-12 w-full" tone="critical" values={SPARK_TRIP} limit={11} label="Recompressor vibration reaching the trip limit" />} footnote="Trip limit 11.0 mm/s reached at 13:46" />
        <TrendTile className="col-span-4" label="Frozen signal" detail="Cooler outlet temperature" value={38.9} decimals={1} unit="°C" aside={<SparkPill tone="warning">Frozen</SparkPill>} trend={<MicroTrend className="h-12 w-full" tone="neutral" variant="line" values={SPARK_FROZEN} label="Cooler outlet temperature, unchanged for 24 hours" />} footnote={isFrozen(SPARK_FROZEN) ? 'No change in 24 h: check the transmitter' : 'Moving'} />
        <TrendTile className="col-span-4" label="Gap" detail="Cooler outlet temperature" value={38.9} decimals={1} unit="°C" aside={<SparkPill tone="warning">Uncertain</SparkPill>} trend={<MicroTrend className="h-12 w-full" tone="pink" variant="line" values={SPARK_GAPPED} label="Cooler outlet temperature with a five-hour gap" />} footnote="No samples 23:00–03:00" />
        <TrendTile className="col-span-4" label="No data" detail="Bearing temperature" value="—" aside={<SparkPill tone="neutral">No signal</SparkPill>} trend={<MicroTrend className="h-12 w-full" values={SPARK_NONE} label="Bearing temperature" />} footnote="Bad quality since 05:00" />
      </Grid>
    </Canvas>
  );
}

function SparklineInText() {
  return (
    <SparkSheet title="In a sentence" subtitle="A trend the size of a word, in the colour of the text">
      <div className="flex flex-col gap-4 text-base leading-8 text-(--kit-text)">
        <p className="m-0">
          Discharge pressure held steady <MicroTrend ink className="mx-1 h-5 w-16" variant="line" marker="none" values={SPARK_PRESSURE_DAY} label="Discharge pressure trend" /> at <strong className="font-semibold tabular-nums">48.6 barg</strong>, while recompressor vibration climbed{' '}
          <MicroTrend ink className="mx-1 h-5 w-16" variant="line" marker="none" values={SPARK_TRIP} label="Recompressor vibration trend" /> to its <strong className="font-semibold tabular-nums">11.0 mm/s</strong> trip limit.
        </p>
        <p className="m-0 text-sm leading-7 text-(--kit-text-2)">
          Flaring was over the permit on two of the last 14 days <StateTicks className="mx-1 w-36" size="sm" label="Daily flaring against the permit, last 14 days" ticks={SPARK_FLARING_TICKS} />.
        </p>
      </div>
    </SparkSheet>
  );
}

function SparklineStateTicks() {
  return (
    <SparkSheet title="Outcome per day" subtitle="When the question is how often, not how much">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-4">
          <span className="text-sm font-medium text-(--kit-text)">Flaring vs permit</span>
          <StateTicks className="w-full" size="lg" label="Daily flaring against the permit, last 14 days" ticks={SPARK_FLARING_TICKS} axis={[SPARK_FLARING_DAYS[0], SPARK_FLARING_DAYS[13]]} />
          <span className="self-start text-sm font-semibold text-(--kit-text) tabular-nums">2 over</span>
        </div>
        <div className="grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-4">
          <span className="text-sm font-medium text-(--kit-text)">Standby test</span>
          <StateTicks
            className="w-full"
            size="lg"
            label="Weekly standby start test of export pump B, last 14 weeks"
            ticks={Array.from({ length: 14 }, (_, index) => ({ label: `Week ${index + 1}`, tone: index === 9 || index > 11 ? 'neutral' : 'success', word: index === 9 || index > 11 ? 'Not run' : 'Passed' }))}
            axis={['14 weeks ago', 'This week']}
          />
          <span className="self-start text-sm font-semibold text-(--kit-text) tabular-nums">3 missed</span>
        </div>
      </div>
    </SparkSheet>
  );
}

function SparklineDeltas() {
  return (
    <SparkSheet title="Change with a judgement" subtitle="Arrow, sign and colour agree; the caption says against what">
      <div className="flex flex-col">
        <ListRow title="Gas export" meta="Up is good" trailing={<Delta value={0.17} decimals={2} unit=" MSm³/d" />} />
        <ListRow title="Energy intensity" meta="Down is good" trailing={<Delta value={-1.4} unit=" kWh/boe" good="down" />} />
        <ListRow title="Active alarms" meta="Up is bad" trailing={<Delta value={3} decimals={0} good="down" />} />
        <ListRow title="Availability" meta="Down is bad" trailing={<Delta value={-0.7} unit=" pts" />} />
        <ListRow title="Shaft speed" meta="No judgement" trailing={<Delta value={120} decimals={0} unit=" rpm" good="none" />} />
        <ListRow title="Separator level" meta="No change" trailing={<Delta value={0} unit=" %" />} />
      </div>
    </SparkSheet>
  );
}

function SparklineValueTrend() {
  const tiles = [SPARK_PRESSURE, SPARK_TEMPERATURE, SPARK_SPEED];
  return (
    <Canvas>
      <Grid>
        {tiles.map((sensor) => {
          const values = sparkValues(sensor);
          const change = changeOf(values);
          return (
            <TrendTile
              key={sensor.id}
              className="col-span-4"
              label={sensor.name}
              detail={sensor.tag}
              value={sensor.value}
              decimals={sensor.decimals}
              unit={sensor.unit}
              aside={<Delta value={change.absolute} decimals={sensor.decimals} good="none" />}
              trend={<MicroTrend className="h-14 w-full" tone={sparkTrendTone(sensor)} values={values} limit={sensor.highLimit} overTone="warning" label={`${sensor.name}, last 24 hours`} />}
              footnote={`Last 24 h · high limit ${formatNumber(sensor.highLimit, sensor.decimals)} ${sensor.unit}`}
            />
          );
        })}
      </Grid>
    </Canvas>
  );
}

function SparklineDailyBars() {
  return (
    <SparkSheet
      title="Flaring"
      subtitle="Daily total against the 15 kSm³/d permit, last 14 days"
      actions={<SparkPill tone="success">Within permit today</SparkPill>}
      footer={<span>Two days over the permit, on 2 and 8 March. Today is 2.6 kSm³/d under.</span>}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-8">
        <Stat variant="plain" size="lg" label="Today" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" delta={{ value: PLANT_KPIS.flaring.value - PLANT_KPIS.flaring.previous, good: 'down', caption: 'vs last week' }} />
        <div className="flex flex-col gap-1">
          <MicroTrend className="h-24 w-full" variant="bars" tone="neutral" limit={15} domain={[0, 19]} values={SPARK_FLARING} label="Daily flaring against the permit, last 14 days" />
          <div className="flex justify-between text-xs text-(--kit-text-3) tabular-nums">
            <span>{SPARK_FLARING_DAYS[0]}</span>
            <span>Permit 15.0</span>
            <span>{SPARK_FLARING_DAYS[13]}</span>
          </div>
        </div>
      </div>
    </SparkSheet>
  );
}

function SparklineReadingList() {
  return (
    <SparkSheet title="1st stage compressor" subtitle="23-KA-9101 · readings with their last 24 hours">
      <div className="flex flex-col">
        {SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').map((sensor) => {
          const state = sparkState(sensor);
          return (
            <ListRow
              key={sensor.id}
              tone={state.tone === 'success' ? 'neutral' : state.tone}
              title={sensor.name}
              meta={<TagId>{sensor.tag}</TagId>}
              trailing={
                <span className="grid grid-cols-[7rem_7.5rem] items-center gap-4">
                  <MicroTrend className="h-7 w-full" tone={sparkTrendTone(sensor)} values={sparkValues(sensor)} label={`${sensor.name}, last 24 hours`} />
                  <span className="text-right text-sm font-semibold text-(--kit-text) tabular-nums">
                    {formatNumber(sensor.value, sensor.decimals)} <span className="text-xs font-medium text-(--kit-text-3)">{sensor.unit}</span>
                  </span>
                </span>
              }
            />
          );
        })}
      </div>
    </SparkSheet>
  );
}

const SPARK_TABLE_COLUMNS: DataTableColumn<Sensor>[] = [
  { id: 'tag', header: 'Tag', nowrap: true, cell: (sensor) => <TagId>{sensor.tag}</TagId> },
  { id: 'name', header: 'Measurement', cell: (sensor) => sensor.name },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (sensor) => (sensor.quality === 'bad' ? '—' : `${formatNumber(sensor.value, sensor.decimals)} ${sensor.unit}`) },
  {
    id: 'trend',
    header: 'Last 24 h',
    width: 'w-40',
    cell: (sensor) => <MicroTrend className="h-6 w-32" tone={sparkTrendTone(sensor)} variant="line" values={sensor.quality === 'bad' ? SPARK_NONE : sparkValues(sensor)} limit={sensor.highLimit} overTone="warning" label={`${sensor.name}, last 24 hours`} />,
  },
  {
    id: 'change',
    header: 'Change',
    align: 'end',
    nowrap: true,
    cell: (sensor) => (sensor.quality === 'bad' ? '—' : <Delta value={changeOf(sparkValues(sensor)).absolute} decimals={sensor.decimals} good="none" />),
  },
  { id: 'state', header: 'State', cell: (sensor) => <SparkPill tone={sparkState(sensor).tone}>{sparkState(sensor).word}</SparkPill> },
];

function SparklineTagTable() {
  return (
    <Canvas>
      <Panel title="Tag watchlist" subtitle="12 tags · value, last 24 hours, change and state" padding="none">
        <DataTable flush label="Tag watchlist" columns={SPARK_TABLE_COLUMNS} rows={SENSORS} rowKey={(sensor) => sensor.id} rowTone={(sensor) => (sparkState(sensor).tone === 'success' ? undefined : sparkState(sensor).tone)} />
      </Panel>
    </Canvas>
  );
}

function SparklineSmallMultiples() {
  return (
    <Canvas>
      <div className="flex flex-col gap-4">
        <SectionHeader title="Readings at a glance" description="Eight tags, the same tile, each on its own scale with its high limit." size="sm" />
        <Grid>
          {SPARK_LIVE.slice(0, 8).map((sensor) => (
            <TrendTile
              key={sensor.id}
              className="col-span-3"
              label={sensor.name}
              detail={sensor.tag}
              value={sensor.value}
              decimals={sensor.decimals}
              unit={sensor.unit}
              trend={<MicroTrend className="h-10 w-full" tone={sparkTrendTone(sensor)} values={sparkValues(sensor)} limit={sensor.highLimit} overTone="warning" label={`${sensor.name}, last 24 hours`} />}
            />
          ))}
        </Grid>
      </div>
    </Canvas>
  );
}

function SparklineLookConsole() {
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Tag strip" subtitle="23-KA-9101 · 24 h · line, square, limit marked" padding="none">
            <DataTable flush label="Compressor tags with trends" columns={SPARK_TABLE_COLUMNS} rows={SENSORS.slice(0, 7)} rowKey={(sensor) => sensor.id} rowTone={(sensor) => (sparkState(sensor).tone === 'success' ? undefined : sparkState(sensor).tone)} />
          </Panel>
          <Panel className="col-span-4" title="Recompressor" subtitle="23-KA-9103" tone="critical">
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <Stat variant="plain" size="lg" label="Drive-end vibration" value={11.6} decimals={1} unit="mm/s" />
                <SparkPill tone="critical">Trip</SparkPill>
              </div>
              <MicroTrend className="h-20 w-full" tone="critical" values={SPARK_TRIP} limit={11} label="Recompressor vibration reaching the trip limit" />
              <span className="text-xs text-(--kit-text-2) tabular-nums">Trip limit 11.0 mm/s · reached 13:46</span>
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SparklineLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <TrendTile className="col-span-4" filled tone="green" label="Gas export" detail="MSm³ per day, 14 days" value={PLANT_KPIS.gasExport.value} decimals={2} trend={<MicroTrend ink className="h-20 w-full" values={SPARK_KPI_WEEKS.export} label="Gas export per day, last 14 days" />} footnote="Plan 4.50" />
          <TrendTile className="col-span-4" filled tone="amber" label="Flaring" detail="kSm³ per day, 14 days" value={PLANT_KPIS.flaring.value} decimals={1} trend={<MicroTrend ink className="h-20 w-full" values={SPARK_FLARING} limit={15} label="Daily flaring against the permit, last 14 days" />} footnote="Permit 15.0 · two days over" />
          <TrendTile className="col-span-4" filled tone="sky" label="Energy intensity" detail="kWh per boe, 14 days" value={PLANT_KPIS.energyIntensity.value} decimals={1} trend={<MicroTrend ink className="h-20 w-full" values={SPARK_KPI_WEEKS.energy} label="Energy intensity per day, last 14 days" />} footnote="Target 30.0" />
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SparklineLookGlass() {
  const tiles: Array<{ sensor: Sensor; tone: Tone }> = [
    { sensor: SPARK_PRESSURE, tone: 'sky' },
    { sensor: SPARK_TEMPERATURE, tone: 'amber' },
    { sensor: SPARK_VIBRATION, tone: 'pink' },
    { sensor: SPARK_SPEED, tone: 'teal' },
  ];
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          {tiles.map(({ sensor, tone }) => (
            <Panel key={sensor.id} className="col-span-3" title={sensor.name} subtitle={sensor.tag}>
              <div className="flex flex-1 flex-col justify-between gap-4">
                <Stat variant="plain" size="lg" label="Now" value={sensor.value} decimals={sensor.decimals} unit={sensor.unit} />
                <MicroTrend className="h-16 w-full" tone={tone} values={sparkValues(sensor)} label={`${sensor.name}, last 24 hours`} />
              </div>
            </Panel>
          ))}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SparklineLookBlueprint() {
  const rows = [SPARK_PRESSURE, SPARK_TEMPERATURE, SPARK_VIBRATION, SPARK_LEVEL];
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Panel title="Trend schedule" subtitle="Hourly samples · range dimensioned per tag">
          <div className="grid grid-cols-[13rem_minmax(0,1fr)_7rem_7rem_7rem] items-center gap-x-6 gap-y-4">
            {['Tag', 'Last 24 h, every sample marked', 'Minimum', 'Maximum', 'Now'].map((heading, index) => (
              <span key={heading} className={`text-xs font-medium text-(--kit-text-2) ${index > 1 ? 'text-right' : ''}`}>
                {heading}
              </span>
            ))}
            {rows.map((sensor) => {
              const values = sparkValues(sensor);
              const ends = extremes(values);
              return (
                <div key={sensor.id} className="contents">
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-(--kit-text)">{sensor.name}</span>
                    <TagId>{sensor.tag}</TagId>
                  </span>
                  <MicroTrend className="h-10 w-full" values={values} limit={sensor.highLimit} overTone="warning" label={`${sensor.name}, hourly samples`} />
                  <span className="text-right text-sm text-(--kit-text) tabular-nums">{ends ? formatNumber(values[ends.min], sensor.decimals) : '—'}</span>
                  <span className="text-right text-sm text-(--kit-text) tabular-nums">{ends ? formatNumber(values[ends.max], sensor.decimals) : '—'}</span>
                  <span className="text-right text-sm font-semibold text-(--kit-text) tabular-nums">
                    {formatNumber(sensor.value, sensor.decimals)} {sensor.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function SparklineLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          <TrendTile className="col-span-3" filled tone="success" label="Discharge pressure" value={48.6} decimals={1} unit="barg" aside={<IconCircleCheck aria-hidden="true" />} trend={<MicroTrend ink className="h-14 w-full" values={SPARK_PRESSURE_DAY} label="Discharge pressure, last 24 hours" />} footnote="Normal · high limit 52" />
          <TrendTile className="col-span-3" filled tone="warning" label="Discharge temperature" value={141.2} decimals={1} unit="°C" aside={<IconAlertTriangle aria-hidden="true" />} trend={<MicroTrend ink className="h-14 w-full" values={sparkValues(SPARK_TEMPERATURE)} label="Discharge temperature, last 24 hours" />} footnote="Near limit · high limit 145" />
          <TrendTile className="col-span-3" filled tone="warning" label="Drive-end vibration" value={6.8} decimals={1} unit="mm/s" aside={<IconAlertTriangle aria-hidden="true" />} trend={<MicroTrend ink className="h-14 w-full" values={sparkValues(SPARK_VIBRATION)} label="Drive-end vibration, last 24 hours" />} footnote="Near limit · high limit 7.1" />
          <TrendTile className="col-span-3" filled tone="critical" label="Recompressor vibration" value={11.6} decimals={1} unit="mm/s" aside={<IconAlertOctagon aria-hidden="true" />} trend={<MicroTrend ink className="h-14 w-full" values={SPARK_TRIP} label="Recompressor vibration, last 24 hours" />} footnote="Trip · limit 11.0" />
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SparklineLookEditorial() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <div className="flex flex-col gap-6">
          <SectionHeader eyebrow="Nordkapp · two weeks in four lines" title="Export is up, energy and flaring are down" size="lg" />
          <StatGroup columns={4} label="Plant KPIs, last 14 days">
            <Stat variant="plain" size="lg" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs last week' }} sparkline={SPARK_KPI_WEEKS.export} />
            <Stat variant="plain" size="lg" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" delta={{ value: -0.7, unit: ' pts', caption: 'vs last week' }} sparkline={SPARK_KPI_WEEKS.availability} />
            <Stat variant="plain" size="lg" label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" delta={{ value: -1.4, good: 'down', caption: 'vs last week' }} sparkline={SPARK_KPI_WEEKS.energy} />
            <Stat variant="plain" size="lg" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} sparkline={SPARK_FLARING} />
          </StatGroup>
        </div>
      </Canvas>
    </LookScope>
  );
}

function SparklineKpiStrip() {
  return (
    <Canvas>
      <Grid>
        <Stat className="col-span-3" emphasis="strong" tone="accent" icon={<IconFlame />} label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} target="Plan 4.50 · 97 % of plan" sparkline={SPARK_KPI_WEEKS.export} />
        <Stat className="col-span-3" tone="green" icon={<IconGauge />} label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" delta={{ value: -0.7, unit: ' pts', caption: 'vs last week' }} target="Target 97.5 %" sparkline={SPARK_KPI_WEEKS.availability} />
        <Stat className="col-span-3" tone="purple" icon={<IconBolt />} label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" delta={{ value: -1.4, good: 'down', caption: 'vs last week' }} target="Target 30.0" sparkline={SPARK_KPI_WEEKS.energy} />
        <Stat className="col-span-3" tone="amber" icon={<IconSnowflake />} label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} target="Permit 15.0" sparkline={SPARK_FLARING} />
      </Grid>
    </Canvas>
  );
}

function SparklineWatchlist() {
  const tags = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101');
  const [selected, setSelected] = useState('vt-92540');
  const sensor = sparkSensor(selected);
  const values = sparkValues(sensor);
  const labels = values.map((_, index) => formatTime(REFERENCE_NOW - (values.length - 1 - index) * HOUR));
  return (
    <Canvas>
      <Grid>
        <div className="col-span-5 flex flex-col gap-2">
          {tags.map((entry) => (
            <button key={entry.id} type="button" aria-pressed={entry.id === selected} onClick={() => setSelected(entry.id)} className="cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-rule-strong)" style={{ borderRadius: 'var(--kit-radius-sm)', boxShadow: entry.id === selected ? '0 0 0 2px var(--kit-line-accent)' : undefined }}>
              <TrendTile
                layout="row"
                label={entry.name}
                detail={entry.tag}
                value={entry.value}
                decimals={entry.decimals}
                unit={entry.unit}
                trend={<MicroTrend className="h-7 w-full" tone={sparkTrendTone(entry)} values={sparkValues(entry)} label={`${entry.name}, last 24 hours`} />}
              />
            </button>
          ))}
        </div>
        <Panel className="col-span-7" title={sensor.name} subtitle={`${sensor.tag} · the selected sparkline, opened as a chart`} actions={<SparkPill tone={sparkState(sensor).tone}>{sparkState(sensor).word}</SparkPill>} footer={<span>A sparkline shows the shape. Open the chart when the reader needs values, times and limits.</span>}>
          <SeriesPlot
            label={`${sensor.name} against its high limit, last 24 hours`}
            series={[{ id: sensor.id, label: sensor.name, values, tone: 'accent', fill: true }]}
            labels={labels}
            unit={sensor.unit}
            decimals={sensor.decimals}
            limits={[{ value: sensor.highLimit, label: `High ${formatNumber(sensor.highLimit, sensor.decimals)}`, tone: 'warning' }]}
            xTicks={5}
            height={300}
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

export default definePage({
  id: 'sparklines-and-trends',
  title: 'Sparklines and trends',
  summary:
    'Word-sized trends that sit beside a value: lines, areas, bars, steps and dots, with a limit or a normal band when the reading has one, plus the change figure and the tiles, rows and tables they live in. They show the shape of the recent past, never exact values.',
  guidance: {
    use: [
      'Put a sparkline next to the figure it explains, and say the period once for the whole list or card.',
      'Add the limit line when the reading has one; a shape without a reference cannot say good or bad.',
      'Use one scale per tag for shape and a shared scale only when the sizes should be compared.',
      'Pair the trend with a signed change and the words that say against what.',
    ],
    avoid: [
      'Reading exact values off a sparkline; open a chart with axes for that.',
      'A flat line for a dead signal without saying so: mark it frozen or no data.',
      'Different periods in one table column.',
      'Colour without a state word when the trend is in a warning or critical tone.',
    ],
  },
  source,
  sections: [
    {
      id: 'forms',
      title: 'Forms and marks',
      description: 'The five forms, the markers, and the limit or band the trend is read against.',
      specimens: [
        {
          id: 'SparklineForms',
          title: 'Line, area, bars, step and dots',
          note: 'Pick the form by what the data is: a flowing signal, a total per period, a held value or separate samples.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/Panel.tsx'],
          Component: SparklineForms,
        },
        {
          id: 'SparklineMarkers',
          title: 'Markers',
          note: 'Pick the latest-value dot by default, the extremes when range is the story, and none beside a figure.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/sparklines-and-trends/sparkMath.ts'],
          Component: SparklineMarkers,
        },
        {
          id: 'SparklineLimitAndBand',
          title: 'Limit line and normal band',
          note: 'Pick a limit line for one-sided alarms, a band for a range to stay inside, and coloured bars for days over a permit.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx'],
          Component: SparklineLimitAndBand,
        },
        {
          id: 'SparklineSizes',
          title: 'Size and density',
          note: 'Pick the height by where it sits and keep at least two pixels per point, or aggregate first.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx'],
          Component: SparklineSizes,
        },
      ],
    },
    {
      id: 'scale-and-states',
      title: 'Scale and states',
      description: 'How the scale changes the reading, and what a trend shows when the signal is in trouble.',
      specimens: [
        {
          id: 'SparklineStates',
          title: 'States',
          note: 'Pick the tone from the limits and always add the word: normal, near limit, trip, frozen, gap and no data.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx', 'kit/sparklines-and-trends/sparkMath.ts', 'kit/StatusPill.tsx'],
          Component: SparklineStates,
        },
        {
          id: 'SparklineSharedScale',
          title: 'Own scale and shared scale',
          note: 'Pick own scales to compare shapes and a shared scale to compare sizes; say which one in the column heading.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx'],
          Component: SparklineSharedScale,
        },
        {
          id: 'SparklineStateTicks',
          title: 'Outcome per period',
          note: 'Pick it when each day either passed or failed: one block per period reads faster than a line across a limit.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/StateTicks.tsx'],
          Component: SparklineStateTicks,
        },
        {
          id: 'SparklineInText',
          title: 'In a sentence',
          note: 'Pick it in a report or a summary, where the trend should read as part of the sentence in the text colour.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/sparklines-and-trends/StateTicks.tsx'],
          Component: SparklineInText,
        },
      ],
    },
    {
      id: 'with-a-value',
      title: 'With a value and a change',
      description: 'The trend as part of a reading: figure, unit, change and the reference.',
      specimens: [
        {
          id: 'SparklineValueTrend',
          title: 'Value with trend',
          note: 'Pick it as the standard reading tile: figure, change over the period, the day and the nearest limit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx', 'kit/Delta.tsx'],
          Component: SparklineValueTrend,
        },
        {
          id: 'SparklineDeltas',
          title: 'Change with a judgement',
          note: 'Pick which direction is good per measure; use no judgement for values that are neither good nor bad.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Delta.tsx', 'kit/ListRow.tsx'],
          Component: SparklineDeltas,
        },
        {
          id: 'SparklineDailyBars',
          title: 'Daily bars against a permit',
          note: 'Pick it for a daily total with a hard limit: the days over stand out in colour and the footer counts them.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/Stat.tsx', 'kit/StatusPill.tsx'],
          Component: SparklineDailyBars,
        },
      ],
    },
    {
      id: 'rows-and-tables',
      title: 'Rows, tables and small multiples',
      description: 'Many trends at once, aligned so the eye can run down a column.',
      specimens: [
        {
          id: 'SparklineReadingList',
          title: 'Readings list',
          note: 'Pick it for the readings of one asset: name and tag, the day, the value; rows off normal get an edge.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/ListRow.tsx', 'kit/TagId.tsx'],
          Component: SparklineReadingList,
        },
        {
          id: 'SparklineSmallMultiples',
          title: 'Small multiples',
          note: 'Pick it to scan many tags at once: identical tiles in a grid, each on its own scale.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx'],
          Component: SparklineSmallMultiples,
        },
        {
          id: 'SparklineTagTable',
          title: 'Tag table with trends',
          note: 'Pick it for a watchlist: the trend is a column like any other, with change and state beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/DataTable.tsx', 'kit/Delta.tsx', 'kit/StatusPill.tsx'],
          Component: SparklineTagTable,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same trends in six looks',
      description: 'Form, weight and the tile around the trend all change with the look.',
      specimens: [
        {
          id: 'SparklineLookConsole',
          title: 'Console: thin lines in a dense table',
          note: 'Pick it for operators: square rows, hairline trends, and the one tripped machine as a toned panel.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/DataTable.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookConsole,
        },
        {
          id: 'SparklineLookPoster',
          title: 'Poster: bars on solid colour',
          note: 'Pick it for a team screen: each measure is a colour block with a huge figure and bars in ink.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookPoster,
        },
        {
          id: 'SparklineLookGlass',
          title: 'Glass: glowing areas',
          note: 'Pick it for a dark showcase screen where each reading glows in its own family colour.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookGlass,
        },
        {
          id: 'SparklineLookBlueprint',
          title: 'Blueprint: marked samples in a schedule',
          note: 'Pick it for engineering documents: every sample is a point and the range is written out per tag.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/MicroTrend.tsx', 'kit/sparklines-and-trends/sparkMath.ts', 'kit/TagId.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookBlueprint,
        },
        {
          id: 'SparklineLookSignal',
          title: 'Signal: state-filled tiles',
          note: 'Pick it for a wall screen: the tile colour is the state and the trend is drawn in the tile ink.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookSignal,
        },
        {
          id: 'SparklineLookEditorial',
          title: 'Editorial: figures between rules',
          note: 'Pick it for a report: the headline says the conclusion and four large figures carry their fortnight.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: SparklineLookEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'SparklineKpiStrip',
          title: 'KPI strip',
          note: 'Pick it as the top row of a dashboard: four figures with change, target and their last two weeks.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Grid.tsx'],
          Component: SparklineKpiStrip,
        },
        {
          id: 'SparklineWatchlist',
          title: 'Watchlist that opens a chart',
          note: 'Pick it when a sparkline is not enough: the selected row opens as a chart with axes, limit and cursor.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sparklines-and-trends/TrendTile.tsx', 'kit/sparklines-and-trends/MicroTrend.tsx', 'kit/time-series/SeriesPlot.tsx', 'kit/Panel.tsx'],
          Component: SparklineWatchlist,
        },
      ],
    },
  ],
});
