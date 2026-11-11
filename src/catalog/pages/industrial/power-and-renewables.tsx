import {
  IconBatteryCharging,
  IconBolt,
  IconPlug,
  IconSolarPanel,
  IconSun,
  IconTrendingDown,
  IconWind,
  IconWindmill,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut, type DonutSegment } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { BatteryGauge } from '../../../library/kit/power-and-renewables/BatteryGauge';
import { DispatchStrip, type DispatchRow } from '../../../library/kit/power-and-renewables/DispatchStrip';
import { FrequencyBand } from '../../../library/kit/power-and-renewables/FrequencyBand';
import { TURBINE_WORD, capacityFactor, warrantedPower, type TurbineState } from '../../../library/kit/power-and-renewables/power';
import { PowerCurve } from '../../../library/kit/power-and-renewables/PowerCurve';
import { TurbineMatrix } from '../../../library/kit/power-and-renewables/TurbineMatrix';
import { TurbineTile } from '../../../library/kit/power-and-renewables/TurbineTile';
import { WindRose, type WindSector } from '../../../library/kit/power-and-renewables/WindRose';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { createRandom, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './power-and-renewables.tsx?raw';

const POWER_RENEW_RATED = 4.2;

type PowerRenewTurbineRow = { name: string; state: TurbineState; power: number | null; windSpeed: number | null; rotorSpeed: number | null; detail?: string };

/** Nordkapp wind farm: twelve 4.2 MW turbines that supply the plant alongside its gas turbine. */
const POWER_RENEW_TURBINES: PowerRenewTurbineRow[] = [
  { name: 'WTG-01', state: 'generating', power: 3.4, windSpeed: 10.8, rotorSpeed: 12.6 },
  { name: 'WTG-02', state: 'generating', power: 3.6, windSpeed: 11.1, rotorSpeed: 12.9 },
  { name: 'WTG-03', state: 'maintenance', power: null, windSpeed: null, rotorSpeed: null, detail: 'Blade inspection, WO-104502. Back at 16:00.' },
  { name: 'WTG-04', state: 'generating', power: 3.1, windSpeed: 10.2, rotorSpeed: 12.1 },
  { name: 'WTG-05', state: 'generating', power: 3.8, windSpeed: 11.4, rotorSpeed: 13.1 },
  { name: 'WTG-06', state: 'curtailed', power: 2.0, windSpeed: 11.0, rotorSpeed: 9.4, detail: 'Grid operator limit, 2.0 MW since 13:10.' },
  { name: 'WTG-07', state: 'generating', power: 3.5, windSpeed: 10.9, rotorSpeed: 12.7 },
  { name: 'WTG-08', state: 'generating', power: 3.3, windSpeed: 10.6, rotorSpeed: 12.4 },
  { name: 'WTG-09', state: 'idle', power: 0, windSpeed: 2.6, rotorSpeed: 0.4, detail: 'In the wake of WTG-05, below cut-in.' },
  { name: 'WTG-10', state: 'generating', power: 3.7, windSpeed: 11.2, rotorSpeed: 13.0 },
  { name: 'WTG-11', state: 'fault', power: 0, windSpeed: 11.2, rotorSpeed: 0, detail: 'Gearbox oil temperature high. Stopped 13:46.' },
  { name: 'WTG-12', state: 'generating', power: 3.2, windSpeed: 10.4, rotorSpeed: 12.2 },
];

const POWER_RENEW_FARM_RATED = POWER_RENEW_TURBINES.length * POWER_RENEW_RATED;

const POWER_RENEW_FARM_POWER = Math.round(POWER_RENEW_TURBINES.reduce((sum, turbine) => sum + (turbine.power ?? 0), 0) * 10) / 10;

const POWER_RENEW_GENERATING = POWER_RENEW_TURBINES.filter((turbine) => turbine.state === 'generating').length;

function powerRenewTurbine(name: string): PowerRenewTurbineRow {
  return POWER_RENEW_TURBINES.find((candidate) => candidate.name === name) ?? POWER_RENEW_TURBINES[0];
}

/** Warranted power curve of the 4.2 MW turbine at standard air density. */
const POWER_RENEW_CURVE = [
  { windSpeed: 3, power: 0 },
  { windSpeed: 4, power: 0.15 },
  { windSpeed: 5, power: 0.42 },
  { windSpeed: 6, power: 0.8 },
  { windSpeed: 7, power: 1.3 },
  { windSpeed: 8, power: 1.95 },
  { windSpeed: 9, power: 2.7 },
  { windSpeed: 10, power: 3.4 },
  { windSpeed: 11, power: 3.95 },
  { windSpeed: 12, power: 4.2 },
  { windSpeed: 20, power: 4.2 },
];

/** 10-minute averages for WTG-08 over a week. Every seventh point sits well under the curve: blade icing. */
const POWER_RENEW_RANDOM = createRandom(61);

const POWER_RENEW_POINTS = Array.from({ length: 84 }, (_, index) => {
  const windSpeed = Math.round((3.5 + POWER_RENEW_RANDOM() * 13) * 10) / 10;
  const derate = index % 7 === 3 ? 0.68 + POWER_RENEW_RANDOM() * 0.1 : 0.94 + POWER_RENEW_RANDOM() * 0.09;
  return { windSpeed, power: Math.round(warrantedPower(windSpeed, POWER_RENEW_CURVE) * derate * 100) / 100 };
});

/** Share of time the wind came from each sector over the last 30 days, in per cent. */
const POWER_RENEW_WIND: WindSector[] = [
  { direction: 'N', value: 6 },
  { direction: 'NE', value: 4 },
  { direction: 'E', value: 3 },
  { direction: 'SE', value: 7 },
  { direction: 'S', value: 13 },
  { direction: 'SW', value: 28 },
  { direction: 'W', value: 24 },
  { direction: 'NW', value: 15 },
];

/** Farm output over the last 24 hours against the day-ahead forecast, hourly, in MW. */
const POWER_RENEW_FORECAST_SHAPE = makeSeries({ seed: 62, points: 25, base: 27, amplitude: 8, cycles: 0.8, noise: 0.8, decimals: 1 });

const POWER_RENEW_FORECAST = POWER_RENEW_FORECAST_SHAPE.map((point) => Math.round(Math.min(POWER_RENEW_FARM_RATED, Math.max(4, point.v + 31.2 - POWER_RENEW_FORECAST_SHAPE[24].v)) * 10) / 10);

const POWER_RENEW_FORECAST_ERROR = makeValues({ seed: 63, points: 25, base: 0, noise: 1.6, decimals: 1 });

const POWER_RENEW_ACTUAL = POWER_RENEW_FORECAST.map((value, index) => (index === 24 ? POWER_RENEW_FARM_POWER : Math.round(Math.max(0, value + POWER_RENEW_FORECAST_ERROR[index] - (index > 21 ? 2.2 : 0)) * 10) / 10));

const POWER_RENEW_HOURS = POWER_RENEW_FORECAST_SHAPE.map((point) => formatTime(point.t));

const POWER_RENEW_ENERGY_24H = Math.round(POWER_RENEW_ACTUAL.slice(1).reduce((sum, value) => sum + value, 0));

const POWER_RENEW_CAPACITY_FACTOR = capacityFactor(POWER_RENEW_ENERGY_24H, POWER_RENEW_FARM_RATED, 24) ?? 0;

/** Stord solar array: performance ratio per string over the last 7 days, in per cent. */
const POWER_RENEW_STRINGS = [
  { label: 'String 03', value: 86.4 },
  { label: 'String 01', value: 85.9 },
  { label: 'String 06', value: 85.1 },
  { label: 'String 02', value: 84.7 },
  { label: 'String 05', value: 84.2 },
  { label: 'String 08', value: 83.6 },
  { label: 'String 04', value: 78.9 },
  { label: 'String 07', value: 61.3 },
];

/** 11 March at the solar array, hourly from 05:00 to 20:00: AC output in MW against the clear-sky expectation. */
const POWER_RENEW_SOLAR_HOURS = Array.from({ length: 16 }, (_, index) => index + 5);

const POWER_RENEW_SOLAR_CLEAR = POWER_RENEW_SOLAR_HOURS.map((hour) => (hour > 6.5 && hour < 18 ? Math.round(4.9 * Math.sin(((hour - 6.5) / 11.5) * Math.PI) * 100) / 100 : 0));

const POWER_RENEW_SOLAR_OUTPUT = POWER_RENEW_SOLAR_CLEAR.map((value, index) => {
  const hour = POWER_RENEW_SOLAR_HOURS[index];
  return Math.round(value * (hour >= 12 && hour <= 14 ? 0.52 : 0.93) * 100) / 100;
});

const POWER_RENEW_SOLAR_LABELS = POWER_RENEW_SOLAR_HOURS.map((hour) => `${String(hour).padStart(2, '0')}:00`);

/** The plant's electrical load and what wind and solar delivered over the last 24 hours, hourly, in MW. */
const POWER_RENEW_LOAD = makeValues({ seed: 64, points: 25, base: 36.4, amplitude: 1.6, noise: 0.5, decimals: 1 });

const POWER_RENEW_RENEWABLE = POWER_RENEW_ACTUAL.map((value, index) => Math.round((value + (index >= 16 && index <= 24 ? 2.1 : 0.2)) * 10) / 10);

const POWER_RENEW_SHARE = Math.round((POWER_RENEW_RENEWABLE.reduce((sum, value, index) => sum + Math.min(value, POWER_RENEW_LOAD[index]), 0) / POWER_RENEW_LOAD.reduce((sum, value) => sum + value, 0)) * 1000) / 10;

/** Grid frequency in Hz, one sample every 10 seconds for the last 10 minutes. */
const POWER_RENEW_FREQUENCY = [...makeValues({ seed: 66, points: 59, base: 50.0, noise: 0.018, decimals: 3 }), 49.97];

const POWER_RENEW_MIX: DonutSegment[] = [
  { label: 'Wind', value: POWER_RENEW_FARM_POWER, tone: 'teal' },
  { label: 'Solar', value: 2.4, tone: 'amber' },
  { label: 'Battery', value: 5.2, tone: 'purple' },
  { label: 'Gas turbine', value: 4.1, tone: 'neutral' },
];

const POWER_RENEW_DISPATCH: DispatchRow[] = [
  {
    id: 'wind',
    label: 'Wind farm',
    detail: '50.4 MW rated',
    segments: [
      { id: 'w1', from: 0, to: 2.3, label: 'Free', tone: 'teal' },
      { id: 'w2', from: 2.3, to: 5, label: 'Limit 32 MW', tone: 'warning' },
      { id: 'w3', from: 5, to: 13.2, label: 'Free running', tone: 'teal' },
      { id: 'w4', from: 13.2, to: 16, label: 'WTG-06 at 2 MW', tone: 'warning' },
      { id: 'w5', from: 16, to: 24, label: 'Free running', tone: 'teal' },
    ],
  },
  {
    id: 'battery',
    label: 'Battery',
    detail: '20 MWh',
    segments: [
      { id: 'b1', from: 1, to: 5, label: 'Charge 4 MW', tone: 'info' },
      { id: 'b2', from: 7, to: 10, label: 'Discharge 3 MW', tone: 'purple' },
      { id: 'b3', from: 13, to: 17, label: 'Discharge 5.2 MW', tone: 'purple' },
      { id: 'b4', from: 21, to: 24, label: 'Charge 3 MW', tone: 'info' },
    ],
  },
  {
    id: 'gt',
    label: 'Gas turbine',
    detail: '23-GT-9001',
    segments: [
      { id: 'g1', from: 0, to: 6, label: 'Minimum load 4 MW', tone: 'neutral' },
      { id: 'g2', from: 6, to: 9, label: 'Ramp to 9 MW', tone: 'amber' },
      { id: 'g3', from: 9, to: 24, label: 'Minimum load 4 MW', tone: 'neutral' },
    ],
  },
];

type PowerRenewCurtailment = { id: string; start: string; duration: string; limit: string; reason: string; lost: number; open?: boolean };

const POWER_RENEW_CURTAILMENTS: PowerRenewCurtailment[] = [
  { id: 'cur-0312', start: '12 Mar, 13:10', duration: 'Ongoing, 50 min', limit: '2.0 MW on WTG-06', reason: 'Grid operator instruction', lost: 1.6, open: true },
  { id: 'cur-0311', start: '11 Mar, 02:20', duration: '2 h 40 min', limit: '32 MW farm', reason: 'Export cable thermal limit', lost: 18.4 },
  { id: 'cur-0309', start: '9 Mar, 22:05', duration: '1 h 15 min', limit: '25 MW farm', reason: 'Negative price, market', lost: 9.7 },
  { id: 'cur-0308', start: '8 Mar, 05:30', duration: '45 min', limit: 'WTG-01 to 04 stopped', reason: 'Bird migration shutdown', lost: 6.2 },
  { id: 'cur-0305', start: '5 Mar, 16:40', duration: '3 h 10 min', limit: '28 MW farm', reason: 'Grid operator instruction', lost: 22.9 },
];

const POWER_RENEW_CURTAILED = Math.round(POWER_RENEW_CURTAILMENTS.reduce((sum, event) => sum + event.lost, 0) * 10) / 10;

const POWER_RENEW_CURTAILMENT_COLUMNS: DataTableColumn<PowerRenewCurtailment>[] = [
  { id: 'start', header: 'Started', cell: (event) => event.start, nowrap: true },
  { id: 'duration', header: 'Duration', cell: (event) => (event.open ? <StatusPill tone="warning">{event.duration}</StatusPill> : event.duration), nowrap: true },
  { id: 'limit', header: 'Limit', cell: (event) => <span className="font-medium">{event.limit}</span> },
  { id: 'reason', header: 'Reason', cell: (event) => event.reason, muted: true },
  { id: 'lost', header: 'Lost, MWh', cell: (event) => event.lost.toFixed(1), numeric: true },
];

type PowerRenewFeeder = { tag: string; name: string; breaker: 'Closed' | 'Open' | 'Tripped'; load: number | null; current: number | null; rating: number; powerFactor: number | null };

/** 22 kV switchboard 82-EL-2200 at the plant substation. */
const POWER_RENEW_FEEDERS: PowerRenewFeeder[] = [
  { tag: '82-EL-2201', name: 'Wind farm incomer', breaker: 'Closed', load: 32.6, current: 872, rating: 1250, powerFactor: 0.98 },
  { tag: '82-EL-2202', name: 'Gas turbine generator', breaker: 'Closed', load: 4.1, current: 112, rating: 1250, powerFactor: 0.91 },
  { tag: '82-EL-2203', name: 'Compression, 1st and 2nd stage', breaker: 'Closed', load: 21.4, current: 594, rating: 800, powerFactor: 0.89 },
  { tag: '82-EL-2204', name: 'Recompressor', breaker: 'Tripped', load: 0, current: 0, rating: 400, powerFactor: null },
  { tag: '82-EL-2205', name: 'Export pumps', breaker: 'Closed', load: 5.9, current: 371, rating: 400, powerFactor: 0.86 },
  { tag: '82-EL-2206', name: 'Utilities and cooling water', breaker: 'Closed', load: 3.7, current: 104, rating: 400, powerFactor: 0.93 },
  { tag: '82-EL-2207', name: 'Battery storage', breaker: 'Closed', load: 5.2, current: 139, rating: 400, powerFactor: 0.99 },
  { tag: '82-EL-2208', name: 'Spare', breaker: 'Open', load: null, current: null, rating: 400, powerFactor: null },
];

const POWER_RENEW_BREAKER_TONE: Record<PowerRenewFeeder['breaker'], Tone> = { Closed: 'success', Open: 'neutral', Tripped: 'critical' };

function powerRenewLoading(feeder: PowerRenewFeeder): number | null {
  return feeder.current === null ? null : Math.round((feeder.current / feeder.rating) * 100);
}

function PowerRenewLoadingBar({ feeder }: { feeder: PowerRenewFeeder }) {
  const loading = powerRenewLoading(feeder);
  if (loading === null) return <span className="text-(--kit-text-3)">—</span>;
  return (
    <div data-tone={loading >= 90 ? 'warning' : 'accent'} className="flex min-w-32 items-center gap-2">
      <div role="img" aria-label={`${loading} % of rating`} className="h-2 flex-1 overflow-hidden" style={{ background: 'var(--kit-track)', borderRadius: 'var(--kit-track-radius)' }}>
        <div className="h-full" style={{ width: `${Math.min(100, loading)}%`, background: 'var(--t-line)' }} />
      </div>
      <span className="w-10 text-right tabular-nums">{loading} %</span>
    </div>
  );
}

const POWER_RENEW_FEEDER_COLUMNS: DataTableColumn<PowerRenewFeeder>[] = [
  { id: 'tag', header: 'Feeder', cell: (feeder) => <TagId>{feeder.tag}</TagId>, nowrap: true },
  { id: 'name', header: 'Serves', cell: (feeder) => <span className="font-medium">{feeder.name}</span> },
  { id: 'breaker', header: 'Breaker', cell: (feeder) => <StatusPill tone={POWER_RENEW_BREAKER_TONE[feeder.breaker]}>{feeder.breaker}</StatusPill> },
  { id: 'load', header: 'Load, MW', cell: (feeder) => (feeder.load === null ? '—' : feeder.load.toFixed(1)), numeric: true },
  { id: 'current', header: 'Current, A', cell: (feeder) => (feeder.current === null ? '—' : String(feeder.current)), numeric: true },
  { id: 'loading', header: 'Of rating', cell: (feeder) => <PowerRenewLoadingBar feeder={feeder} /> },
  { id: 'pf', header: 'Power factor', cell: (feeder) => (feeder.powerFactor === null ? '—' : feeder.powerFactor.toFixed(2)), numeric: true },
];

const POWER_RENEW_FEEDER_COLUMNS_SHORT = POWER_RENEW_FEEDER_COLUMNS.filter((column) => ['tag', 'name', 'breaker', 'load', 'loading'].includes(column.id));

function PowerRenewSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function PowerRenewTile({ name }: { name: string }) {
  const turbine = powerRenewTurbine(name);
  return <TurbineTile name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={POWER_RENEW_RATED} windSpeed={turbine.windSpeed} rotorSpeed={turbine.rotorSpeed} detail={turbine.detail} />;
}

function PowerRenewTurbineTiles() {
  return (
    <PowerRenewSheet>
      <div className="grid grid-cols-4 gap-(--kit-gap)">
        <PowerRenewTile name="WTG-05" />
        <PowerRenewTile name="WTG-06" />
        <PowerRenewTile name="WTG-11" />
        <PowerRenewTile name="WTG-03" />
      </div>
    </PowerRenewSheet>
  );
}

function PowerRenewTurbineGrid() {
  const [selected, setSelected] = useState('WTG-11');
  const turbine = powerRenewTurbine(selected);
  return (
    <PowerRenewSheet>
      <Panel
        title="Nordkapp wind farm"
        subtitle={`${POWER_RENEW_GENERATING} of ${POWER_RENEW_TURBINES.length} generating · ${POWER_RENEW_FARM_POWER.toFixed(1)} of ${POWER_RENEW_FARM_RATED.toFixed(1)} MW`}
        icon={
          <IconChip tone="teal">
            <IconWindmill />
          </IconChip>
        }
        footer={
          <span>
            <strong className="font-semibold text-(--kit-text)">
              {turbine.name}, {TURBINE_WORD[turbine.state].toLowerCase()}.
            </strong>{' '}
            {turbine.detail ?? `Delivering ${turbine.power?.toFixed(1)} MW in ${turbine.windSpeed?.toFixed(1)} m/s of wind.`}
          </span>
        }
      >
        <TurbineMatrix label="Nordkapp wind farm, 12 turbines" turbines={POWER_RENEW_TURBINES} ratedPower={POWER_RENEW_RATED} columns={4} selected={selected} onSelect={setSelected} />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewAvailability() {
  return (
    <PowerRenewSheet>
      <Panel title="Availability" subtitle="Last 30 days" footer="Energy-based is lower: the stops fell in windy hours.">
        <div className="flex flex-col gap-6">
          <Meter label="Time-based" value={96.8} max={100} unit="%" decimals={1} target={{ value: 97, label: 'Contract 97.0' }} tone="teal" size="lg" />
          <Meter label="Energy-based" value={94.1} max={100} unit="%" decimals={1} target={{ value: 97, label: 'Contract 97.0' }} tone="warning" size="lg" />
          <Stat variant="plain" label="Lost production" value={412} unit="MWh" tone="warning" delta={{ value: 38, decimals: 0, unit: ' MWh', good: 'down', caption: 'vs February' }} />
        </div>
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewPowerCurve() {
  return (
    <PowerRenewSheet>
      <Panel title="Power curve, WTG-08" subtitle="10-minute averages over the last 7 days against the warranted curve" footer="The low points all fall between 02:00 and 07:00 at air temperatures under −4 °C: blade icing.">
        <PowerCurve label="Power curve of WTG-08" curve={POWER_RENEW_CURVE} points={POWER_RENEW_POINTS} ratedPower={POWER_RENEW_RATED} height={300} />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewWindRose() {
  return (
    <PowerRenewSheet>
      <Panel title="Wind direction" subtitle="Share of time, last 30 days">
        <WindRose label="Wind direction at Nordkapp, last 30 days" sectors={POWER_RENEW_WIND} size={252} tone="teal" className="mx-auto" />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewFarmForecast() {
  return (
    <PowerRenewSheet>
      <Grid>
        <Panel className="col-span-9" title="Farm output against forecast" subtitle="Last 24 hours, hourly, MW">
          <TrendArea
            label="Wind farm output against the day-ahead forecast"
            unit="MW"
            labels={POWER_RENEW_HOURS}
            series={[
              { id: 'actual', label: 'Measured', values: POWER_RENEW_ACTUAL, tone: 'teal' },
              { id: 'forecast', label: 'Day-ahead forecast', values: POWER_RENEW_FORECAST, tone: 'neutral', dashed: true },
            ]}
            limits={[{ value: POWER_RENEW_FARM_RATED, label: 'Rated', tone: 'neutral' }]}
            yDomain={[0, 56]}
            height={280}
          />
        </Panel>
        <div className="col-span-3 flex flex-col gap-(--kit-gap)">
          <Stat className="flex-1" label="Farm output" value={POWER_RENEW_FARM_POWER} decimals={1} unit="MW" icon={<IconWind />} tone="teal" delta={{ value: -2.4, unit: ' MW', caption: 'vs forecast' }} sparkline={POWER_RENEW_ACTUAL} />
          <Stat className="flex-1" label="Capacity factor, 24 h" value={POWER_RENEW_CAPACITY_FACTOR} decimals={1} unit="%" icon={<IconBolt />} tone="blue" target={`${POWER_RENEW_ENERGY_24H} MWh produced`} />
        </div>
      </Grid>
    </PowerRenewSheet>
  );
}

function PowerRenewStringBars() {
  return (
    <PowerRenewSheet>
      <Panel
        title="Solar string performance"
        subtitle="Performance ratio, last 7 days"
        icon={
          <IconChip tone="amber">
            <IconSolarPanel />
          </IconChip>
        }
        actions={<StatusPill tone="warning">String 07 low</StatusPill>}
      >
        <Bars
          label="Performance ratio per solar string"
          orientation="horizontal"
          unit="%"
          decimals={1}
          categories={POWER_RENEW_STRINGS.map((item) => item.label)}
          series={[{ id: 'pr', label: 'Performance ratio', values: POWER_RENEW_STRINGS.map((item) => item.value) }]}
          tones={POWER_RENEW_STRINGS.map((item) => (item.value < 70 ? 'warning' : 'amber'))}
          limit={{ value: 80, label: 'Expected', tone: 'neutral' }}
          showValues
          height={300}
        />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewSolarDay() {
  return (
    <PowerRenewSheet>
      <Panel title="Solar output against clear sky" subtitle="Stord array, 11 March, MW" footer="Cloud between 12:00 and 14:00 cost 5.6 MWh against a clear day.">
        <TrendArea
          label="Solar output against the clear-sky expectation"
          unit="MW"
          labels={POWER_RENEW_SOLAR_LABELS}
          series={[
            { id: 'output', label: 'AC output', values: POWER_RENEW_SOLAR_OUTPUT, tone: 'amber' },
            { id: 'clear', label: 'Clear-sky expectation', values: POWER_RENEW_SOLAR_CLEAR, tone: 'neutral', dashed: true },
          ]}
          highlightLast={false}
          yDomain={[0, 6]}
          height={270}
        />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewBattery() {
  return (
    <PowerRenewSheet>
      <Panel
        title="Battery storage"
        subtitle="82-BT-0001 · 20 MWh"
        icon={
          <IconChip tone="purple">
            <IconBatteryCharging />
          </IconChip>
        }
      >
        <div className="flex flex-col gap-7">
          <BatteryGauge label="Battery storage, discharging" charge={68} capacityMwh={20} powerMw={-5.2} reservePercent={20} />
          <div className="border-t border-(--kit-rule) pt-5">
            <p className="mb-3 text-sm font-medium text-(--kit-text-2)">The same battery at 04:30, at its reserve</p>
            <BatteryGauge label="Battery storage, at reserve" charge={20} capacityMwh={20} powerMw={4} reservePercent={20} />
          </div>
        </div>
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewFrequency() {
  return (
    <PowerRenewSheet>
      <Panel title="Grid frequency" subtitle="82-EL-2200 · 22 kV bus" icon={<IconChip tone="blue">{<IconPlug />}</IconChip>} footer="Normal inside ±100 mHz, alert beyond ±200 mHz.">
        <div className="flex flex-col gap-6">
          <FrequencyBand label="Grid frequency at the 22 kV bus" value={49.97} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(--kit-text-2)">Last 10 minutes</span>
            <SparkLine label="Grid frequency, last 10 minutes" values={POWER_RENEW_FREQUENCY} tone="blue" variant="line" className="h-16" />
          </div>
          <div className="border-t border-(--kit-rule) pt-5">
            <p className="mb-3 text-sm font-medium text-(--kit-text-2)">At 13:46, when the recompressor tripped</p>
            <FrequencyBand label="Grid frequency at the trip" value={50.14} />
          </div>
        </div>
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewLoadGeneration() {
  return (
    <PowerRenewSheet>
      <Panel title="Load against renewable generation" subtitle="Last 24 hours, hourly, MW" actions={<StatusPill tone="teal">{`${POWER_RENEW_SHARE.toFixed(1)} % renewable`}</StatusPill>}>
        <TrendLine
          label="Plant load against wind and solar generation"
          unit="MW"
          labels={POWER_RENEW_HOURS}
          series={[
            { id: 'load', label: 'Plant load', values: POWER_RENEW_LOAD, tone: 'accent' },
            { id: 'renewable', label: 'Wind and solar', values: POWER_RENEW_RENEWABLE, tone: 'teal' },
          ]}
          yDomain={[0, 56]}
          height={280}
        />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewMix() {
  const total = POWER_RENEW_MIX.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <PowerRenewSheet>
      <Panel title="Supply mix now" subtitle="MW by source" footer="The gas turbine holds its minimum load.">
        <Donut label="Supply by source" segments={POWER_RENEW_MIX} centerValue={total.toFixed(1)} centerCaption="MW" decimals={1} unit=" MW" legend="bottom" size={168} className="mx-auto" />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewDispatch() {
  return (
    <PowerRenewSheet>
      <Panel title="Dispatch schedule" subtitle="Thursday 12 March, instructions per unit" footer="Blocks too short to print their instruction still read it out; the full list is in the curtailment log.">
        <DispatchStrip label="Dispatch schedule, 12 March" rows={POWER_RENEW_DISPATCH} now={14} />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewFeederTable() {
  return (
    <PowerRenewSheet>
      <Panel title="Switchboard 82-EL-2200" subtitle="22 kV, eight feeders" padding="none" footer="Export pumps run at 93 % of the feeder rating; the next step up needs pump B on its own feeder.">
        <DataTable
          label="Substation feeders"
          flush
          columns={POWER_RENEW_FEEDER_COLUMNS}
          rows={POWER_RENEW_FEEDERS}
          rowKey={(feeder) => feeder.tag}
          rowTone={(feeder) => (feeder.breaker === 'Tripped' ? 'critical' : (powerRenewLoading(feeder) ?? 0) >= 90 ? 'warning' : undefined)}
        />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewCurtailmentLog() {
  return (
    <PowerRenewSheet>
      <Panel
        title="Curtailment log"
        subtitle="Last 7 days"
        icon={
          <IconChip tone="warning">
            <IconTrendingDown />
          </IconChip>
        }
        actions={<StatusPill tone="warning">{`${POWER_RENEW_CURTAILED.toFixed(1)} MWh lost`}</StatusPill>}
        padding="none"
      >
        <DataTable label="Curtailment events" flush columns={POWER_RENEW_CURTAILMENT_COLUMNS} rows={POWER_RENEW_CURTAILMENTS} rowKey={(event) => event.id} rowTone={(event) => (event.open ? 'warning' : undefined)} />
      </Panel>
    </PowerRenewSheet>
  );
}

function PowerRenewConsole() {
  return (
    <PowerRenewSheet look="console">
      <Grid>
        <Panel className="col-span-8" title="Switchboard 82-EL-2200" subtitle="22 kV · 8 feeders" padding="none">
          <DataTable label="Substation feeders, console" flush columns={POWER_RENEW_FEEDER_COLUMNS_SHORT} rows={POWER_RENEW_FEEDERS} rowKey={(feeder) => feeder.tag} rowTone={(feeder) => (feeder.breaker === 'Tripped' ? 'critical' : undefined)} />
        </Panel>
        <div className="col-span-4 grid gap-(--kit-gap)">
          <Panel title="Frequency" subtitle="22 kV bus">
            <FrequencyBand label="Grid frequency, console" value={49.97} />
          </Panel>
          <Panel title="Battery 82-BT-0001" subtitle="20 MWh" tone="purple">
            <BatteryGauge label="Battery storage, console" charge={68} capacityMwh={20} powerMw={-5.2} />
          </Panel>
        </div>
        <Panel className="col-span-12" title="Wind farm" subtitle={`${POWER_RENEW_FARM_POWER.toFixed(1)} MW · ${POWER_RENEW_GENERATING} of 12 generating`} tone="teal">
          <TurbineMatrix label="Wind farm, console" turbines={POWER_RENEW_TURBINES} ratedPower={POWER_RENEW_RATED} columns={6} />
        </Panel>
      </Grid>
    </PowerRenewSheet>
  );
}

function PowerRenewSignal() {
  return (
    <PowerRenewSheet look="signal">
      <div className="flex flex-col gap-2">
        <Grid>
          <Panel className="col-span-5" title="Wind farm" subtitle="Nordkapp, 12 turbines" tone="warning">
            <div className="flex flex-col gap-1">
              <span className="text-5xl font-extrabold tracking-tight">8 of 12</span>
              <span className="text-xl font-bold">generating</span>
              <span className="text-sm">1 fault · 1 curtailed · 1 idle · 1 in maintenance</span>
            </div>
          </Panel>
          <Stat className="col-span-4" size="hero" label="Farm output" value={POWER_RENEW_FARM_POWER} decimals={1} unit="MW" tone="success" state="On forecast" target={`Rated ${POWER_RENEW_FARM_RATED.toFixed(1)} MW`} />
          <Stat className="col-span-3" size="lg" label="Frequency" value={49.97} decimals={2} unit="Hz" tone="success" state="Normal" />
        </Grid>
        <TurbineMatrix label="Wind farm, wall screen" turbines={POWER_RENEW_TURBINES} ratedPower={POWER_RENEW_RATED} columns={6} />
      </div>
    </PowerRenewSheet>
  );
}

function PowerRenewBlueprint() {
  return (
    <PowerRenewSheet look="blueprint">
      <Grid>
        <Panel className="col-span-8" title="Power curve WTG-08" subtitle="NK-WF-PC-008 · 7 days">
          <PowerCurve label="Power curve of WTG-08, drawing style" curve={POWER_RENEW_CURVE} points={POWER_RENEW_POINTS} ratedPower={POWER_RENEW_RATED} height={320} />
        </Panel>
        <Panel className="col-span-4" title="Wind rose" subtitle="30 days · 8 sectors">
          <WindRose label="Wind direction, drawing style" sectors={POWER_RENEW_WIND} size={260} className="mx-auto" />
        </Panel>
        <Panel className="col-span-12" title="Dispatch schedule" subtitle="12 Mar · 00:00 to 24:00">
          <DispatchStrip label="Dispatch schedule, drawing style" rows={POWER_RENEW_DISPATCH} now={14} />
        </Panel>
      </Grid>
    </PowerRenewSheet>
  );
}

function PowerRenewPoster() {
  return (
    <PowerRenewSheet look="poster">
      <div className="flex flex-col gap-5">
        <SectionHeader size="lg" title="Wind carries most of the plant." description="Supply by source at 14:00, MW." />
        <div className="grid grid-cols-2 gap-(--kit-gap)">
          <Stat size="lg" label="Wind" value={POWER_RENEW_FARM_POWER} decimals={1} unit="MW" tone="teal" target={`Rated ${POWER_RENEW_FARM_RATED.toFixed(1)} MW`} />
          <div className="grid gap-(--kit-gap)">
            <Stat label="Battery" value={5.2} decimals={1} unit="MW" tone="purple" />
            <Stat label="Gas turbine" value={4.1} decimals={1} unit="MW" tone="amber" />
          </div>
        </div>
        <TurbineMatrix label="Wind farm, poster" turbines={POWER_RENEW_TURBINES} ratedPower={POWER_RENEW_RATED} columns={3} />
      </div>
    </PowerRenewSheet>
  );
}

function PowerRenewGlass() {
  return (
    <PowerRenewSheet look="glass">
      <div className="flex flex-col gap-(--kit-gap)">
        <Panel title="Storage and grid" subtitle="Nordkapp microgrid, live">
          <div className="grid grid-cols-3 gap-4">
            <RingGauge label="State of charge" value={68} tone="purple" size={124} />
            <RingGauge label="Renewable share" value={POWER_RENEW_SHARE} decimals={1} tone="teal" size={124} />
            <RingGauge label="Farm loading" value={(POWER_RENEW_FARM_POWER / POWER_RENEW_FARM_RATED) * 100} tone="sky" size={124} />
          </div>
        </Panel>
        <Panel title="Battery 82-BT-0001" subtitle="Discharging into the afternoon peak">
          <BatteryGauge label="Battery storage, glass" charge={68} capacityMwh={20} powerMw={-5.2} size="lg" />
        </Panel>
        <PowerRenewTile name="WTG-06" />
      </div>
    </PowerRenewSheet>
  );
}

function PowerRenewFarmOverview() {
  const [selected, setSelected] = useState('WTG-06');
  const turbine = powerRenewTurbine(selected);
  return (
    <PowerRenewSheet look="studio">
      <div className="flex flex-col gap-(--kit-gap)">
        <SectionHeader title="Nordkapp wind farm" description="Thursday 12 March · updated 14:00 UTC" actions={<StatusPill tone="warning">1 fault · 1 curtailed</StatusPill>} />
        <StatGroup columns={4}>
          <Stat emphasis="strong" label="Farm output" value={POWER_RENEW_FARM_POWER} decimals={1} unit="MW" icon={<IconWind />} tone="accent" delta={{ value: -2.4, unit: ' MW', caption: 'vs forecast' }} sparkline={POWER_RENEW_ACTUAL} />
          <Stat label="Capacity factor, 24 h" value={POWER_RENEW_CAPACITY_FACTOR} decimals={1} unit="%" icon={<IconBolt />} tone="teal" target={`${POWER_RENEW_ENERGY_24H} MWh produced`} />
          <Stat label="Availability, 30 d" value={96.8} decimals={1} unit="%" icon={<IconWindmill />} tone="blue" delta={{ value: -0.2, unit: ' pts', caption: 'vs contract' }} />
          <Stat label="Curtailed, 7 d" value={POWER_RENEW_CURTAILED} decimals={1} unit="MWh" icon={<IconTrendingDown />} tone="warning" delta={{ value: 12.3, unit: ' MWh', good: 'down', caption: 'vs last week' }} />
        </StatGroup>
        <Grid>
          <Panel className="col-span-8" title="Output against forecast" subtitle="Last 24 hours, MW">
            <TrendArea
              label="Farm output against forecast, overview"
              unit="MW"
              labels={POWER_RENEW_HOURS}
              series={[
                { id: 'actual', label: 'Measured', values: POWER_RENEW_ACTUAL, tone: 'accent' },
                { id: 'forecast', label: 'Forecast', values: POWER_RENEW_FORECAST, tone: 'neutral', dashed: true },
              ]}
              yDomain={[0, 56]}
              height={260}
            />
          </Panel>
          <Panel className="col-span-4" title="Wind" subtitle="Last 30 days">
            <WindRose label="Wind direction, overview" sectors={POWER_RENEW_WIND} size={236} tone="teal" className="mx-auto" />
          </Panel>
          <Panel className="col-span-8" title="Turbines" subtitle="Select one for its detail">
            <TurbineMatrix label="Wind farm overview" turbines={POWER_RENEW_TURBINES} ratedPower={POWER_RENEW_RATED} columns={4} selected={selected} onSelect={setSelected} />
          </Panel>
          <div className="col-span-4">
            <TurbineTile name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={POWER_RENEW_RATED} windSpeed={turbine.windSpeed} rotorSpeed={turbine.rotorSpeed} detail={turbine.detail ?? `${TURBINE_WORD[turbine.state]} normally. No open alarms or work orders.`} />
          </div>
        </Grid>
      </div>
    </PowerRenewSheet>
  );
}

function PowerRenewMicrogrid() {
  return (
    <PowerRenewSheet look="soft">
      <div className="flex flex-col gap-(--kit-gap)">
        <SectionHeader title="Plant power today" description="Where the electricity comes from and where it goes." actions={<StatusPill tone="teal" icon={<IconSun />}>{`${POWER_RENEW_SHARE.toFixed(1)} % renewable`}</StatusPill>} />
        <Grid>
          <Panel className="col-span-4" title="Supply now" subtitle="By source" tone="teal">
            <Donut label="Supply by source, microgrid" segments={POWER_RENEW_MIX} centerValue={POWER_RENEW_MIX.reduce((sum, segment) => sum + segment.value, 0).toFixed(1)} centerCaption="MW" decimals={1} unit=" MW" legend="bottom" size={160} className="mx-auto" />
          </Panel>
          <Panel className="col-span-8" title="Load and renewables" subtitle="Last 24 hours, MW" tone="blue">
            <TrendArea
              label="Plant load against renewables, microgrid"
              unit="MW"
              labels={POWER_RENEW_HOURS}
              series={[
                { id: 'renewable', label: 'Wind and solar', values: POWER_RENEW_RENEWABLE, tone: 'teal' },
                { id: 'load', label: 'Plant load', values: POWER_RENEW_LOAD, tone: 'purple', dashed: true },
              ]}
              yDomain={[0, 56]}
              height={250}
            />
          </Panel>
          <Panel className="col-span-5" title="Battery" subtitle="82-BT-0001 · 20 MWh" tone="purple">
            <BatteryGauge label="Battery storage, microgrid" charge={68} capacityMwh={20} powerMw={-5.2} size="lg" />
          </Panel>
          <Panel className="col-span-7" title="Grid frequency" subtitle="22 kV bus" tone="green">
            <FrequencyBand label="Grid frequency, microgrid" value={49.97} size="lg" />
          </Panel>
          <Panel className="col-span-12" title="Today's plan" subtitle="Dispatch per unit" tone="amber">
            <DispatchStrip label="Dispatch schedule, microgrid" rows={POWER_RENEW_DISPATCH} now={14} />
          </Panel>
        </Grid>
      </div>
    </PowerRenewSheet>
  );
}

export default definePage({
  id: 'power-and-renewables',
  title: 'Power and renewables',
  summary:
    'The kit for wind, solar, storage and grid applications: turbine and farm state, the wind resource, output against forecast, battery charge, frequency, dispatch and the feeders that carry it all.',
  guidance: {
    use: [
      'Power against rating on every generating unit, so a number is never read without its ceiling.',
      'Forecasts drawn differently from measurements: a dashed line against a filled one.',
      'Words for why a unit is not generating: idle, curtailed, fault and maintenance are different problems.',
      'State of charge with the reserve marked and the time left at the current power.',
    ],
    avoid: [
      'Status colour on every generating turbine in a desk view: a healthy farm should look calm.',
      'A wind rose as the only way to learn the prevailing direction; say it in words too.',
      'A frequency figure without the bands that make it normal or not.',
      'One mark for both load and generation; draw them differently.',
    ],
  },
  source,
  sections: [
    {
      id: 'turbines',
      title: 'Turbines and farm',
      description: 'One turbine, then all of them, then how available they have been.',
      specimens: [
        {
          id: 'PowerRenewTurbineTiles',
          title: 'Turbine tiles by state',
          note: 'Pick it for a unit list: generating, curtailed, fault and maintenance read differently at a glance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineTile.tsx', 'kit/power-and-renewables/RotorGlyph.tsx', 'kit/power-and-renewables/power.ts'],
          Component: PowerRenewTurbineTiles,
        },
        {
          id: 'PowerRenewTurbineGrid',
          title: 'Farm grid',
          note: 'Pick it to see a whole farm at once and find the turbines that are not generating.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineMatrix.tsx', 'kit/Panel.tsx'],
          Component: PowerRenewTurbineGrid,
        },
        {
          id: 'PowerRenewAvailability',
          title: 'Two availabilities',
          note: 'Pick it for a contract view: time-based and energy-based availability answer different questions.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Stat.tsx'],
          Component: PowerRenewAvailability,
        },
      ],
    },
    {
      id: 'wind-resource',
      title: 'Wind resource and output',
      description: 'What the wind offered and what the farm made of it.',
      specimens: [
        {
          id: 'PowerRenewPowerCurve',
          title: 'Power curve',
          note: 'Pick it to judge a turbine against its warranty; points under the curve are counted and coloured.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/PowerCurve.tsx', 'kit/power-and-renewables/power.ts'],
          Component: PowerRenewPowerCurve,
        },
        {
          id: 'PowerRenewWindRose',
          title: 'Wind rose',
          note: 'Pick it for siting and wake questions; the prevailing direction is also written out.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/WindRose.tsx'],
          Component: PowerRenewWindRose,
        },
        {
          id: 'PowerRenewFarmForecast',
          title: 'Output against forecast',
          note: 'Pick it for the trading and operations desk: measured output filled, the forecast dashed, the rating as a ceiling.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/Stat.tsx', 'kit/Grid.tsx'],
          Component: PowerRenewFarmForecast,
        },
      ],
    },
    {
      id: 'solar-and-storage',
      title: 'Solar and storage',
      description: 'Strings, a solar day, the battery and the frequency it supports.',
      specimens: [
        {
          id: 'PowerRenewStringBars',
          title: 'Solar string performance',
          note: 'Pick it to find the weak string: bars are ranked and the one under expectation changes tone.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: PowerRenewStringBars,
        },
        {
          id: 'PowerRenewSolarDay',
          title: 'Solar day against clear sky',
          note: 'Pick it to separate weather from faults: the gap to the clear-sky line is the loss.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendArea.tsx'],
          Component: PowerRenewSolarDay,
        },
        {
          id: 'PowerRenewBattery',
          title: 'Battery state of charge',
          note: 'Pick it wherever a battery is dispatched: charge, reserve, direction and time left in one block.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/BatteryGauge.tsx', 'kit/power-and-renewables/power.ts'],
          Component: PowerRenewBattery,
        },
        {
          id: 'PowerRenewFrequency',
          title: 'Grid frequency',
          note: 'Pick it on any screen that watches the grid: the figure, its deviation and the bands that judge it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/FrequencyBand.tsx', 'kit/SparkLine.tsx'],
          Component: PowerRenewFrequency,
        },
      ],
    },
    {
      id: 'grid-and-dispatch',
      title: 'Grid and dispatch',
      description: 'Load against supply, the day plan, the feeders and what was curtailed.',
      specimens: [
        {
          id: 'PowerRenewLoadGeneration',
          title: 'Load against generation',
          note: 'Pick it to show how much of the load renewables covered, hour by hour.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/StatusPill.tsx'],
          Component: PowerRenewLoadGeneration,
        },
        {
          id: 'PowerRenewMix',
          title: 'Supply mix',
          note: 'Pick it for the split by source right now; the total sits in the middle.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Donut.tsx'],
          Component: PowerRenewMix,
        },
        {
          id: 'PowerRenewDispatch',
          title: 'Dispatch schedule',
          note: 'Pick it for the day plan: one row per unit, one block per instruction, a line at now.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/DispatchStrip.tsx'],
          Component: PowerRenewDispatch,
        },
        {
          id: 'PowerRenewFeederTable',
          title: 'Substation feeder table',
          note: 'Pick it for a switchboard: breaker state as a word and loading against rating as a bar.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: PowerRenewFeederTable,
        },
        {
          id: 'PowerRenewCurtailmentLog',
          title: 'Curtailment log',
          note: 'Pick it to account for lost energy: when, how long, what limit, why and how much.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx'],
          Component: PowerRenewCurtailmentLog,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same parts as block gauges on a console, state-filled cells on a wall, drawn plots on a blueprint.',
      specimens: [
        {
          id: 'PowerRenewConsole',
          title: 'Console',
          note: 'Pick it for the control room: a dense switchboard, a block battery and state-edged turbine cells.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineMatrix.tsx', 'kit/power-and-renewables/FrequencyBand.tsx', 'kit/power-and-renewables/BatteryGauge.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewConsole,
        },
        {
          id: 'PowerRenewSignal',
          title: 'Signal',
          note: 'Pick it for a wall screen: every turbine cell is filled with its state.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineMatrix.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewSignal,
        },
        {
          id: 'PowerRenewBlueprint',
          title: 'Blueprint',
          note: 'Pick it in engineering tools: open-circle plots, an outlined rose and an outlined schedule.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/PowerCurve.tsx', 'kit/power-and-renewables/WindRose.tsx', 'kit/power-and-renewables/DispatchStrip.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewBlueprint,
        },
        {
          id: 'PowerRenewPoster',
          title: 'Poster',
          note: 'Pick it for a team screen: the mix as solid tiles and the farm as blocks of colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineMatrix.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewPoster,
        },
        {
          id: 'PowerRenewGlass',
          title: 'Glass',
          note: 'Pick it for a showpiece: shares as rings, the battery as a glowing cell.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/BatteryGauge.tsx', 'kit/power-and-renewables/TurbineTile.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewGlass,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'PowerRenewFarmOverview',
          title: 'Wind farm overview',
          note: 'Pick it as the landing view of a farm: headline figures, output against forecast, the wind and every turbine.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/TurbineMatrix.tsx', 'kit/power-and-renewables/TurbineTile.tsx', 'kit/power-and-renewables/WindRose.tsx', 'kit/TrendArea.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewFarmOverview,
        },
        {
          id: 'PowerRenewMicrogrid',
          title: 'Microgrid day',
          note: 'Pick it for a site that balances its own supply: mix, load, battery, frequency and the plan.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/power-and-renewables/BatteryGauge.tsx', 'kit/power-and-renewables/FrequencyBand.tsx', 'kit/power-and-renewables/DispatchStrip.tsx', 'kit/Donut.tsx', 'kit/TrendArea.tsx', 'looks/LookScope.tsx'],
          Component: PowerRenewMicrogrid,
        },
      ],
    },
  ],
});
