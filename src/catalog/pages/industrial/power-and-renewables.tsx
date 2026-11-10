import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Card } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';
import { CartesianGrid, ComposedChart, Line, Scatter, XAxis, YAxis } from 'recharts';

import { SeriesLegend } from '../../../library/industrial/charts/SeriesLegend';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { COMPASS_8 } from '../../../library/industrial/domains2/polar';
import { capacityFactor, frequencyTone, warrantedPower } from '../../../library/industrial/domains2/power';
import type { TurbineState } from '../../../library/industrial/domains2/power';
import { StateOfCharge } from '../../../library/industrial/domains2/StateOfCharge';
import { TurbineTile } from '../../../library/industrial/domains2/TurbineTile';
import { WindRose } from '../../../library/industrial/domains2/WindRose';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { ScheduleStrip } from '../../../library/industrial/operations/ScheduleStrip';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { HOUR, MINUTE, REFERENCE_NOW, createRandom, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './power-and-renewables.tsx?raw';

const NOW = REFERENCE_NOW;
const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';
const RATED = 4.2;

type Turbine = { name: string; state: TurbineState; power: number | null; windSpeed: number | null; rotorSpeed: number | null; detail?: string };

/** Nordkapp wind farm: twelve 4.2 MW turbines that supply the plant alongside its gas turbine. */
const TURBINES: readonly Turbine[] = [
  { name: 'WTG-01', state: 'generating', power: 3.4, windSpeed: 10.8, rotorSpeed: 12.6 },
  { name: 'WTG-02', state: 'generating', power: 3.6, windSpeed: 11.1, rotorSpeed: 12.9 },
  { name: 'WTG-03', state: 'maintenance', power: null, windSpeed: null, rotorSpeed: null, detail: 'Blade inspection, WO-104502 · back 16:00' },
  { name: 'WTG-04', state: 'generating', power: 3.1, windSpeed: 10.2, rotorSpeed: 12.1 },
  { name: 'WTG-05', state: 'generating', power: 3.8, windSpeed: 11.4, rotorSpeed: 13.1 },
  { name: 'WTG-06', state: 'curtailed', power: 2.0, windSpeed: 11.0, rotorSpeed: 9.4, detail: 'Grid operator limit, 2.0 MW since 13:10' },
  { name: 'WTG-07', state: 'generating', power: 3.5, windSpeed: 10.9, rotorSpeed: 12.7 },
  { name: 'WTG-08', state: 'generating', power: 3.3, windSpeed: 10.6, rotorSpeed: 12.4 },
  { name: 'WTG-09', state: 'idle', power: 0, windSpeed: 2.6, rotorSpeed: 0.4, detail: 'In the wake of WTG-05, below cut-in' },
  { name: 'WTG-10', state: 'generating', power: 3.7, windSpeed: 11.2, rotorSpeed: 13.0 },
  { name: 'WTG-11', state: 'fault', power: 0, windSpeed: 11.2, rotorSpeed: 0, detail: 'Gearbox oil temperature high · stopped 13:46' },
  { name: 'WTG-12', state: 'generating', power: 3.2, windSpeed: 10.4, rotorSpeed: 12.2 },
];

const FARM_RATED = TURBINES.length * RATED;
const FARM_POWER = TURBINES.reduce((sum, turbine) => sum + (turbine.power ?? 0), 0);

function powerRenewTurbine(name: string): Turbine {
  const turbine = TURBINES.find((candidate) => candidate.name === name);
  if (!turbine) throw new Error(`Unknown turbine ${name}`);
  return turbine;
}

/** Warranted power curve of the 4.2 MW turbine at standard air density. */
const POWER_CURVE = [
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
const CURVE_RANDOM = createRandom(61);
const POWER_POINTS = Array.from({ length: 84 }, (_, index) => {
  const windSpeed = Math.round((3.5 + CURVE_RANDOM() * 13) * 10) / 10;
  const derate = index % 7 === 3 ? 0.72 + CURVE_RANDOM() * 0.1 : 0.94 + CURVE_RANDOM() * 0.09;
  return { windSpeed, power: Math.round(warrantedPower(windSpeed, POWER_CURVE) * derate * 100) / 100 };
});

const CURVE_CONFIG = {
  warranted: { label: 'Warranted curve', color: 'var(--color-chart-neutral-450)' },
  power: { label: '10-minute average', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Share of time the wind came from each sector over the last 30 days, in percent. */
const WIND_SHARES = [6, 4, 3, 7, 13, 28, 24, 15];
const WIND_SECTORS = COMPASS_8.map((direction, index) => ({ direction, value: WIND_SHARES[index] }));

/** Farm output: the day-ahead forecast for 48 hours around now, and what was measured up to now. */
const FORECAST_SHAPE = makeSeries({ seed: 62, points: 49, base: 27, amplitude: 9, cycles: 1.4, noise: 0.8, end: NOW + 24 * HOUR, decimals: 1 });
const FORECAST = FORECAST_SHAPE.map((point) => ({ t: point.t, v: Math.round(Math.min(FARM_RATED, Math.max(4, point.v + 28.4 - FORECAST_SHAPE[24].v)) * 10) / 10 }));
const FORECAST_ERROR = makeValues({ seed: 63, points: 25, base: 0, noise: 1.6, decimals: 1 });
const ACTUAL = FORECAST.slice(0, 25).map((point, index) => ({ t: point.t, v: index === 24 ? Math.round(FARM_POWER * 10) / 10 : Math.round((point.v + FORECAST_ERROR[index]) * 10) / 10 }));
const FORECAST_BAND = FORECAST.slice(24).map((point, index) => ({ t: point.t, low: Math.max(0, point.v - 1.5 - index * 0.28), high: Math.min(FARM_RATED, point.v + 1.5 + index * 0.28) }));
const ENERGY_24H = ACTUAL.slice(1).reduce((sum, point) => sum + point.v, 0);
const FORECAST_MAE = ACTUAL.reduce((sum, point, index) => sum + Math.abs(point.v - FORECAST[index].v), 0) / ACTUAL.length;

/** Stord solar array: performance ratio per string over the last 7 days, in percent. */
const SOLAR_STRINGS = [
  { id: 's-03', label: 'String 03', value: 86.4, detail: 'Inverter A' },
  { id: 's-01', label: 'String 01', value: 85.9, detail: 'Inverter A' },
  { id: 's-06', label: 'String 06', value: 85.1, detail: 'Inverter B' },
  { id: 's-02', label: 'String 02', value: 84.7, detail: 'Inverter A' },
  { id: 's-05', label: 'String 05', value: 84.2, detail: 'Inverter B' },
  { id: 's-08', label: 'String 08', value: 83.6, detail: 'Inverter B' },
  { id: 's-04', label: 'String 04', value: 78.9, detail: 'Inverter A' },
  { id: 's-07', label: 'String 07', value: 61.3, detail: 'Inverter B', tone: 'warning' as const },
];

/** 11 March at the solar array, every 30 minutes: irradiance in W/m² and AC output in MW. Cloud around 13:00. */
const DAY_START = NOW - 38 * HOUR;
const SOLAR_DAY = Array.from({ length: 49 }, (_, index) => {
  const hour = index / 2;
  const sun = hour > 6.5 && hour < 18 ? Math.sin(((hour - 6.5) / 11.5) * Math.PI) : 0;
  const cloud = hour >= 12.5 && hour <= 14 ? 0.55 : 1;
  const irradiance = Math.round(640 * sun * cloud);
  return { t: DAY_START + index * 30 * MINUTE, irradiance, output: Math.min(4.6, Math.round(irradiance * 0.0078 * 100) / 100) };
});

/** The plant's electrical load and what wind and solar delivered, 11 March, hourly, in MW. */
const LOAD_DAY = makeSeries({ seed: 64, points: 25, base: 31.2, amplitude: 1.4, noise: 0.4, end: DAY_START + 24 * HOUR, decimals: 1 });
const WIND_DAY = makeSeries({ seed: 65, points: 25, base: 24, amplitude: 9, cycles: 0.8, noise: 0.9, end: DAY_START + 24 * HOUR, min: 6, max: 40, decimals: 1 });
const RENEWABLE_DAY = WIND_DAY.map((point, index) => ({ t: point.t, v: Math.round((point.v + SOLAR_DAY[index * 2].output) * 10) / 10 }));
const RENEWABLE_SHARE = (RENEWABLE_DAY.reduce((sum, point, index) => sum + Math.min(point.v, LOAD_DAY[index].v), 0) / LOAD_DAY.reduce((sum, point) => sum + point.v, 0)) * 100;

/** Grid frequency in Hz, one sample every 10 seconds for the last 10 minutes. */
const FREQUENCY = [...makeValues({ seed: 66, points: 59, base: 50.0, noise: 0.018, decimals: 3 }), 49.97];
const FREQUENCY_NOW = FREQUENCY[FREQUENCY.length - 1];

type CurtailmentEvent = { id: string; start: string; duration: string; limit: string; reason: string; lost: number };

const CURTAILMENTS: readonly CurtailmentEvent[] = [
  { id: 'cur-0312', start: '12 Mar, 13:10', duration: 'Ongoing, 50 min', limit: '2.0 MW on WTG-06', reason: 'Grid operator instruction', lost: 1.6 },
  { id: 'cur-0311', start: '11 Mar, 02:20', duration: '2 h 40 min', limit: '32 MW farm', reason: 'Export cable thermal limit', lost: 18.4 },
  { id: 'cur-0309', start: '9 Mar, 22:05', duration: '1 h 15 min', limit: '25 MW farm', reason: 'Negative price, market', lost: 9.7 },
  { id: 'cur-0308', start: '8 Mar, 05:30', duration: '45 min', limit: 'WTG-01 to 04 stopped', reason: 'Bird migration shutdown', lost: 6.2 },
  { id: 'cur-0305', start: '5 Mar, 16:40', duration: '3 h 10 min', limit: '28 MW farm', reason: 'Grid operator instruction', lost: 22.9 },
];
const CURTAILED_MWH = CURTAILMENTS.reduce((sum, event) => sum + event.lost, 0);

type Feeder = { tag: string; name: string; breaker: { tone: Tone; label: string; shape: 'dot' | 'ring' | 'diamond' | 'square' }; load: number | null; current: number | null; rating: number; powerFactor: number | null };

/** 22 kV switchboard 82-EL-2200 at the plant substation. */
const FEEDERS: readonly Feeder[] = [
  { tag: '82-EL-2201', name: 'Wind farm incomer', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 32.6, current: 872, rating: 1250, powerFactor: 0.98 },
  { tag: '82-EL-2202', name: 'Gas turbine generator', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 4.1, current: 112, rating: 1250, powerFactor: 0.91 },
  { tag: '82-EL-2203', name: 'Compression, 1st and 2nd stage', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 21.4, current: 594, rating: 800, powerFactor: 0.89 },
  { tag: '82-EL-2204', name: 'Recompressor', breaker: { tone: 'critical', label: 'Tripped', shape: 'diamond' }, load: 0, current: 0, rating: 400, powerFactor: null },
  { tag: '82-EL-2205', name: 'Export pumps', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 5.9, current: 371, rating: 400, powerFactor: 0.86 },
  { tag: '82-EL-2206', name: 'Utilities and cooling water', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 3.7, current: 104, rating: 400, powerFactor: 0.93 },
  { tag: '82-EL-2207', name: 'Battery storage', breaker: { tone: 'success', label: 'Closed', shape: 'dot' }, load: 5.2, current: 139, rating: 400, powerFactor: 0.99 },
  { tag: '82-EL-2208', name: 'Spare', breaker: { tone: 'neutral', label: 'Open', shape: 'ring' }, load: null, current: null, rating: 400, powerFactor: null },
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

function PowerRenewTurbineTile() {
  const turbine = powerRenewTurbine('WTG-05');
  return (
    <div className="w-full max-w-72">
      <TurbineTile name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={RATED} windSpeed={turbine.windSpeed} rotorSpeed={turbine.rotorSpeed} />
    </div>
  );
}

function PowerRenewTurbineFault() {
  const turbine = powerRenewTurbine('WTG-11');
  return (
    <div className="w-full max-w-72">
      <TurbineTile name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={RATED} windSpeed={turbine.windSpeed} rotorSpeed={turbine.rotorSpeed} detail={turbine.detail} />
    </div>
  );
}

function PowerRenewTurbineCurtailed() {
  const turbine = powerRenewTurbine('WTG-06');
  return (
    <div className="w-full max-w-72">
      <TurbineTile name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={RATED} windSpeed={turbine.windSpeed} rotorSpeed={turbine.rotorSpeed} detail={turbine.detail} />
    </div>
  );
}

function PowerRenewTurbineGrid() {
  const generating = TURBINES.filter((turbine) => turbine.state === 'generating').length;
  return (
    <Panel title="Nordkapp wind farm" meta={`${generating} of ${TURBINES.length} generating · MW per turbine`}>
      <div className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-4">
        {TURBINES.map((turbine) => (
          <TurbineTile key={turbine.name} variant="cell" name={turbine.name} state={turbine.state} power={turbine.power} ratedPower={RATED} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Generating turbines show their power. Any other state is written out and tinted.</p>
    </Panel>
  );
}

function PowerRenewAvailability() {
  return (
    <Panel title="Availability" meta="Wind farm · March to date">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <LinearGauge label="Time-based" value={96.8} min={80} max={100} target={97} unit="%" decimals={1} />
          <span className="text-xs text-muted-foreground">Share of hours the turbines were ready to run, whatever the wind.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <LinearGauge label="Energy-based" value={93.2} min={80} max={100} target={97} unit="%" decimals={1} tone="warning" />
          <span className="text-xs text-muted-foreground">Share of the energy the wind offered that was captured. Lower, because WTG-11 and WTG-03 were down in strong wind.</span>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 border-t border-default pt-3 text-xs">
        <Fact label="Contract target">97.0 %</Fact>
        <Fact label="Lost energy, month to date">412 MWh</Fact>
      </dl>
    </Panel>
  );
}

function PowerRenewCapacityFactor() {
  const factor = capacityFactor(ENERGY_24H, FARM_RATED, 24);
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Capacity factor, last 24 hours"
        value={factor}
        unit="%"
        decimals={1}
        delta={{ reference: 64.2, goodDirection: 'up', caption: 'vs 30-day mean', decimals: 1 }}
        trend={{ values: ACTUAL.map((point) => point.v), variant: 'area', label: 'Farm output, last 24 hours' }}
        footnote={`${formatValue(ENERGY_24H)} MWh of ${formatValue(FARM_RATED * 24)} MWh at rated power`}
      />
    </div>
  );
}

function PowerRenewPowerCurve() {
  return (
    <Panel title="Power curve, WTG-08" meta="10-minute averages · last 7 days">
      <div className="h-64 w-full">
        <ChartContainer
          config={CURVE_CONFIG}
          className={CHART_FRAME}
          aria-label="Measured power against wind speed for WTG-08 compared with the warranted curve; most points follow the curve, one in seven sits about 25 percent below it"
        >
          <ComposedChart margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="windSpeed" type="number" domain={[0, 20]} ticks={[0, 4, 8, 12, 16, 20]} tickLine={false} axisLine={false} allowDuplicatedCategory={false} />
            <YAxis dataKey="power" type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent hideLabel valueFormatter={(value) => `${formatValue(Number(value), 2)} MW`} />} />
            <Line data={POWER_CURVE} dataKey="power" name="warranted" stroke="var(--color-warranted)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Scatter data={POWER_POINTS} dataKey="power" name="power" fill="var(--color-power)" fillOpacity={0.7} isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
      </div>
      <SeriesLegend
        items={[
          { key: 'power', label: '10-minute average (MW)', color: CURVE_CONFIG.power.color, mark: 'dot' },
          { key: 'warranted', label: 'Warranted curve', color: CURVE_CONFIG.warranted.color, mark: 'dashed' },
        ]}
      />
      <p className="text-xs text-muted-foreground">Wind speed in m/s along the bottom. The points well under the curve are from two nights with blade icing.</p>
    </Panel>
  );
}

function PowerRenewWindRose() {
  return (
    <Panel title="Wind direction" meta="Last 30 days">
      <WindRose label="Share of time by wind direction at Nordkapp wind farm, last 30 days" sectors={WIND_SECTORS} />
    </Panel>
  );
}

function PowerRenewFarmForecast() {
  return (
    <Panel title="Farm output against forecast" meta="MW · last 24 hours and next 24 hours">
      <TrendChart
        label="Wind farm output for the last 24 hours against the day-ahead forecast, and the forecast for the next 24 hours with its uncertainty band"
        series={[
          { key: 'forecast', label: 'Forecast', points: FORECAST, dashed: true, color: 'var(--color-chart-neutral-450)' },
          { key: 'actual', label: 'Measured', points: ACTUAL },
        ]}
        envelopes={[{ key: 'band', label: 'P10 to P90', points: FORECAST_BAND, color: 'var(--color-chart-neutral-200)' }]}
        events={[{ t: NOW, label: 'Now', solid: true }]}
        limits={[{ value: FARM_RATED, label: `Rated ${formatValue(FARM_RATED, 1)}`, tone: 'neutral', align: 'left' }]}
        yDomain={[0, 60]}
        unit="MW"
        decimals={1}
        showLast
        legend
        heightClassName="h-60"
        summary={`Measured output has stayed within ${formatValue(FORECAST_MAE, 1)} MW of the forecast on average. The band widens with the forecast horizon.`}
      />
    </Panel>
  );
}

function PowerRenewForecastTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Farm output"
        value={FARM_POWER}
        unit="MW"
        decimals={1}
        delta={{ reference: FORECAST[24].v, caption: 'vs forecast', decimals: 1 }}
        target={{ value: FARM_RATED, label: 'Rated' }}
        footnote={`Forecast error, 24 h mean: ${formatValue(FORECAST_MAE, 1)} MW`}
      >
        <LinearGauge showHeader={false} size="sm" label="Farm output against rated power" value={FARM_POWER} max={FARM_RATED} unit="MW" decimals={1} />
      </KpiTile>
    </div>
  );
}

function PowerRenewStringBars() {
  return (
    <Panel title="String performance ratio" meta="Stord solar array · last 7 days">
      <ShareBarList label="Performance ratio per solar string, last 7 days" items={SOLAR_STRINGS} unit="%" decimals={1} max={100} />
      <p className="text-xs text-muted-foreground">String 07 is 23 points under the array median. Check for soiling or a failed bypass diode.</p>
    </Panel>
  );
}

function PowerRenewIrradianceOutput() {
  return (
    <Panel title="Irradiance and output" meta="Stord solar array · 11 March">
      <TrendChart
        label="Solar irradiance and array output through 11 March; output follows irradiance and both dip under cloud around 13:00"
        series={[
          { key: 'irradiance', label: 'Irradiance', points: SOLAR_DAY.map((point) => ({ t: point.t, v: point.irradiance })), variant: 'area', color: 'var(--color-chart-neutral-300)', axis: 'right' },
          { key: 'output', label: 'AC output', points: SOLAR_DAY.map((point) => ({ t: point.t, v: point.output })) },
        ]}
        yDomain={[0, 6]}
        rightDomain={[0, 800]}
        unit="MW"
        rightUnit="W/m²"
        decimals={1}
        maxTicks={5}
        legend
        heightClassName="h-52"
        summary="Peak 4.6 MW at 11:30. Cloud between 12:30 and 14:00 cost about 2.9 MWh."
      />
    </Panel>
  );
}

function PowerRenewStateOfCharge() {
  return (
    <Card className="w-full max-w-72">
      <StateOfCharge label="Battery storage 82-EB-0001" charge={64} capacity={40} power={5.2} reserve={15} />
    </Card>
  );
}

function PowerRenewStateOfChargeReserve() {
  return (
    <Card className="w-full max-w-72">
      <StateOfCharge label="Battery storage 82-EB-0002" charge={14} capacity={40} power={-3.4} reserve={15} />
    </Card>
  );
}

function PowerRenewSolarTile() {
  const latest = SOLAR_DAY[28];
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Stord solar array</span>
        <StatusIndicator size="sm" tone="success" label="Generating" />
      </div>
      <ValueReadout size="md" value={latest.output} unit="MW" decimals={1} />
      <Sparkline values={SOLAR_DAY.map((point) => point.output)} label="Solar array output, 11 March" variant="area" height={36} unit="MW" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Irradiance">{formatValue(latest.irradiance)} W/m²</Fact>
        <Fact label="Installed">6.0 MWp</Fact>
        <Fact label="Performance ratio">81.3 %</Fact>
      </dl>
    </Card>
  );
}

function PowerRenewFrequencyReadout() {
  const tone = frequencyTone(FREQUENCY_NOW, 50, 0.1, 0.2);
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Grid frequency</span>
        <StatusIndicator size="sm" tone="success" label="In normal band" />
      </div>
      <ValueReadout size="lg" value={FREQUENCY_NOW} unit="Hz" decimals={2} tone={tone} />
      <RangeIndicator showHeader={false} label="Grid frequency" value={FREQUENCY_NOW} min={49.7} max={50.3} limits={{ lowLow: 49.8, low: 49.9, high: 50.1, highHigh: 50.2 }} unit="Hz" decimals={2} />
      <Sparkline values={FREQUENCY} label="Grid frequency, last 10 minutes" height={32} band={{ low: 49.9, high: 50.1 }} domain={[49.8, 50.2]} unit="Hz" decimals={2} />
      <span className="text-xs text-muted-foreground">Last 10 minutes · normal band 49.90 to 50.10 Hz</span>
    </Card>
  );
}

function PowerRenewLoadGeneration() {
  return (
    <Panel title="Load against renewable generation" meta="Nordkapp plant · 11 March · MW">
      <TrendChart
        label={`Plant electrical load against wind and solar generation through 11 March; renewables covered ${formatValue(RENEWABLE_SHARE)} percent of the load`}
        series={[
          { key: 'renewable', label: 'Wind and solar', points: RENEWABLE_DAY, variant: 'area' },
          { key: 'load', label: 'Plant load', points: LOAD_DAY, color: 'var(--color-chart-neutral-450)', variant: 'step' },
        ]}
        yDomain={[0, 45]}
        unit="MW"
        decimals={1}
        maxTicks={7}
        legend
        heightClassName="h-60"
        summary={`Renewables covered ${formatValue(RENEWABLE_SHARE)} % of the load. Where the area is under the line, the gas turbine made up the difference.`}
      />
    </Panel>
  );
}

function PowerRenewDispatchStrip() {
  return (
    <Panel title="Dispatch schedule" meta="12 March · hours UTC">
      <ScheduleStrip
        label="Dispatch schedule for 12 March by unit"
        columns={['00', '04', '08', '12', '16', '20']}
        now={3.5}
        bars={[
          { id: 'wind', label: 'Wind farm', sublabel: 'Up to 50.4 MW', start: 0, end: 6, text: 'Must take' },
          { id: 'solar', label: 'Solar array', sublabel: 'Up to 6.0 MWp', start: 1.75, end: 4.5, text: 'Must take' },
          { id: 'charge', label: 'Battery', sublabel: 'Charge', start: 2.75, end: 4, text: '5 MW' },
          { id: 'discharge', label: 'Battery', sublabel: 'Discharge', start: 4.5, end: 5.5, text: '8 MW', tentative: true },
          { id: 'gt-am', label: '23-GT-9001', sublabel: 'Gas turbine', start: 0, end: 1.75, text: '9 MW' },
          { id: 'gt-pm', label: '23-GT-9001', sublabel: 'Gas turbine', start: 5.5, end: 6, text: '6 MW', tentative: true },
          { id: 'curtail', label: 'WTG-06', sublabel: 'Curtailed', start: 3.3, end: 4.25, text: '2 MW cap', tone: 'info' },
        ]}
      />
      <p className="text-xs text-muted-foreground">Solid bars are committed, lighter bars are planned. The vertical line is now.</p>
    </Panel>
  );
}

function PowerRenewCurtailmentLog() {
  return (
    <Panel title="Curtailment log" meta="March to date">
      <div className="w-full overflow-x-auto">
        <table aria-label="Curtailment events, March to date" className="w-full min-w-144 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Start
              </th>
              <th scope="col" className={TH}>
                Reason
              </th>
              <th scope="col" className={TH}>
                Limit
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Duration
              </th>
              <th scope="col" className={`${TH} pr-0 text-right`}>
                Lost, MWh
              </th>
            </tr>
          </thead>
          <tbody>
            {CURTAILMENTS.map((event, index) => (
              <tr key={event.id} className="border-t border-default">
                <td className={`${TD} whitespace-nowrap pl-0 tabular-nums text-medium-foreground`}>{event.start}</td>
                <td className={`${TD} text-base-foreground`}>{event.reason}</td>
                <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{event.limit}</td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                  {index === 0 ? <StatusIndicator size="sm" tone="info" label={event.duration} shape="ring" /> : <span className="text-medium-foreground">{event.duration}</span>}
                </td>
                <td className={`${TD} pr-0 text-right tabular-nums text-base-foreground`}>{formatValue(event.lost, 1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-emphasized">
              <th scope="row" colSpan={4} className={`${TD} pl-0 text-left font-medium text-base-foreground`}>
                Total, {CURTAILMENTS.length} events
              </th>
              <td className={`${TD} pr-0 text-right font-medium tabular-nums text-base-foreground`}>{formatValue(CURTAILED_MWH, 1)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

function PowerRenewCurtailmentTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Curtailed, March"
        value={CURTAILED_MWH}
        unit="MWh"
        decimals={1}
        status={{ tone: 'info', label: 'Curtailment active', shape: 'ring' }}
        delta={{ reference: 41.3, goodDirection: 'down', caption: 'vs same days in February', decimals: 1 }}
        footnote="0.9 % of the energy the wind offered"
      />
    </div>
  );
}

function PowerRenewFeederTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Feeders of the 22 kV switchboard 82-EL-2200" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Feeder
            </th>
            <th scope="col" className={TH}>
              Breaker
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Load, MW
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Current, A
            </th>
            <th scope="col" className={`${TH} w-1/4`}>
              Of rating
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Power factor
            </th>
          </tr>
        </thead>
        <tbody>
          {FEEDERS.map((feeder) => {
            const share = feeder.current === null ? null : (feeder.current / feeder.rating) * 100;
            return (
              <tr key={feeder.tag} className="border-t border-default">
                <td className={TD}>
                  <span className="block text-base-foreground">{feeder.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{feeder.tag}</span>
                </td>
                <td className={TD}>
                  <StatusIndicator size="sm" {...feeder.breaker} />
                </td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(feeder.load, 1)}</td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(feeder.current)}</td>
                <td className={TD}>
                  <div className="flex items-center gap-3">
                    <LinearGauge showHeader={false} size="sm" label={`${feeder.name} current against its ${feeder.rating} A rating`} value={share} limits={{ high: 90, highHigh: 100 }} unit="%" />
                    <span className="w-10 shrink-0 text-right tabular-nums text-medium-foreground">{share === null ? formatValue(null) : `${formatValue(share)} %`}</span>
                  </div>
                </td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(feeder.powerFactor, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PowerRenewFarmOverview() {
  const generating = TURBINES.filter((turbine) => turbine.state === 'generating').length;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">Nordkapp wind farm</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          12 Mar 2026, 14:00 · {generating} of {TURBINES.length} turbines generating
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile size="compact" label="Output" value={FARM_POWER} unit="MW" decimals={1} delta={{ reference: FORECAST[24].v, caption: 'vs forecast', decimals: 1 }} />
        <KpiTile size="compact" label="Mean wind speed" value={10.9} unit="m/s" decimals={1} delta={{ reference: 9.6, caption: 'vs 1 h ago', decimals: 1 }} />
        <KpiTile size="compact" label="Capacity factor, 24 h" value={capacityFactor(ENERGY_24H, FARM_RATED, 24)} unit="%" decimals={1} delta={{ reference: 64.2, goodDirection: 'up', caption: 'vs 30-day mean', decimals: 1 }} />
        <KpiTile size="compact" label="Energy availability" value={93.2} unit="%" decimals={1} status={{ tone: 'warning', label: 'Below contract', shape: 'square' }} target={{ value: 97 }} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <TrendChart
            label="Wind farm output over the last 24 hours against forecast, with the forecast for the next 24 hours"
            series={[
              { key: 'forecast', label: 'Forecast', points: FORECAST, dashed: true, color: 'var(--color-chart-neutral-450)' },
              { key: 'actual', label: 'Measured', points: ACTUAL },
            ]}
            events={[{ t: NOW, label: 'Now', solid: true }]}
            yDomain={[0, 60]}
            unit="MW"
            decimals={1}
            legend
            heightClassName="h-52"
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            {TURBINES.map((turbine) => (
              <TurbineTile key={turbine.name} variant="cell" name={turbine.name.replace('WTG-', '')} state={turbine.state} power={turbine.power} ratedPower={RATED} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">MW per turbine. One fault, one in maintenance, one curtailed, one idle.</span>
        </div>
      </div>
    </div>
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
      'Forecasts drawn differently from measurements, with their uncertainty and a marker at now.',
      'Words for why a unit is not generating: idle, curtailed, fault and maintenance are different problems.',
      'Time-based and energy-based availability side by side; they answer different questions.',
    ],
    avoid: [
      'Status colour on generating turbines: a healthy farm should look calm.',
      'A wind rose as the only way to learn the prevailing direction; say it in words too.',
      'State of charge without the reserve and the time left at the current power.',
      'One colour scale for both load and generation; draw them as different marks.',
    ],
  },
  source,
  sections: [
    {
      id: 'turbines',
      title: 'Turbines and farm',
      description: 'One turbine, then all of them, then how well the farm has been available.',
      specimens: [
        {
          id: 'PowerRenewTurbineTile',
          title: 'Wind turbine tile',
          note: 'One turbine with its power against rating and the wind it is working with.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/TurbineTile.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewTurbineTile,
        },
        {
          id: 'PowerRenewTurbineFault',
          title: 'Turbine in fault',
          note: 'A stopped turbine in good wind, where the tile must say why it stands still.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/TurbineTile.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewTurbineFault,
        },
        {
          id: 'PowerRenewTurbineCurtailed',
          title: 'Turbine curtailed',
          note: 'A turbine held below what the wind offers, which is neither a fault nor normal.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/TurbineTile.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewTurbineCurtailed,
        },
        {
          id: 'PowerRenewTurbineGrid',
          title: 'Turbine grid with states',
          note: 'The whole farm at once: quiet cells for generating turbines, tinted cells with a word for the rest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/TurbineTile.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewTurbineGrid,
        },
        {
          id: 'PowerRenewAvailability',
          title: 'Time-based and energy-based availability',
          note: 'Reporting against a service contract, where downtime in strong wind costs more than downtime in calm.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx'],
          Component: PowerRenewAvailability,
        },
      ],
    },
    {
      id: 'wind-resource',
      title: 'Wind resource and output',
      description: 'What the wind offers and what the farm makes of it.',
      specimens: [
        {
          id: 'PowerRenewPowerCurve',
          title: 'Power curve, actual against warranted',
          note: 'Finding underperformance: measured points that fall below the curve the supplier warranted.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/power.ts', 'industrial/charts/SeriesLegend.tsx'],
          Component: PowerRenewPowerCurve,
        },
        {
          id: 'PowerRenewWindRose',
          title: 'Wind rose',
          note: 'Where the wind comes from, for siting, wake analysis and planning crane work.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/WindRose.tsx', 'industrial/domains2/polar.ts'],
          Component: PowerRenewWindRose,
        },
        {
          id: 'PowerRenewFarmForecast',
          title: 'Farm output against forecast',
          note: 'Trading and dispatch: what was forecast, what was delivered and what to expect next.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: PowerRenewFarmForecast,
        },
        {
          id: 'PowerRenewForecastTile',
          title: 'Farm output tile',
          note: 'The headline number of a farm, against both its forecast and its rating.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: PowerRenewForecastTile,
        },
        {
          id: 'PowerRenewCapacityFactor',
          title: 'Capacity factor tile',
          note: 'Comparing farms of different size, or one farm across periods.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewCapacityFactor,
        },
        {
          id: 'PowerRenewSolarTile',
          title: 'Solar array tile',
          note: 'A solar plant beside wind on a portfolio view: output, irradiance and performance ratio.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: PowerRenewSolarTile,
        },
        {
          id: 'PowerRenewCurtailmentTile',
          title: 'Curtailed energy tile',
          note: 'Energy the farm could have made but was told not to, tracked as its own loss.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: PowerRenewCurtailmentTile,
        },
      ],
    },
    {
      id: 'solar-and-storage',
      title: 'Solar and storage',
      description: 'String performance, the day curve and the battery that shifts it.',
      specimens: [
        {
          id: 'PowerRenewStringBars',
          title: 'Solar string performance',
          note: 'Ranking strings to find the one that lags the rest of the array.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains/ShareBarList.tsx'],
          Component: PowerRenewStringBars,
        },
        {
          id: 'PowerRenewIrradianceOutput',
          title: 'Irradiance against output',
          note: 'Telling a cloud from a fault: output should follow irradiance through the day.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: PowerRenewIrradianceOutput,
        },
        {
          id: 'PowerRenewStateOfCharge',
          title: 'Battery state of charge',
          note: 'A battery that is charging, with the power going in and the time until it is full.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/StateOfCharge.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewStateOfCharge,
        },
        {
          id: 'PowerRenewStateOfChargeReserve',
          title: 'Battery at reserve',
          note: 'A discharging battery that has reached the charge held back for black start or frequency support.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/StateOfCharge.tsx', 'industrial/domains2/power.ts'],
          Component: PowerRenewStateOfChargeReserve,
        },
        {
          id: 'PowerRenewFrequencyReadout',
          title: 'Grid frequency readout',
          note: 'A value that matters by its distance from nominal, shown inside its normal and alert bands.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/power.ts', 'industrial/RangeIndicator.tsx', 'industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx'],
          Component: PowerRenewFrequencyReadout,
        },
      ],
    },
    {
      id: 'grid-and-dispatch',
      title: 'Grid and dispatch',
      description: 'Balancing load and generation, and the record of when generation was held back.',
      specimens: [
        {
          id: 'PowerRenewLoadGeneration',
          title: 'Load against generation',
          note: 'Seeing when renewables cover the load and when something else has to.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: PowerRenewLoadGeneration,
        },
        {
          id: 'PowerRenewDispatchStrip',
          title: 'Dispatch schedule strip',
          note: 'Which unit is committed when, across one day, with planned blocks set apart from committed ones.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/operations/ScheduleStrip.tsx'],
          Component: PowerRenewDispatchStrip,
        },
        {
          id: 'PowerRenewCurtailmentLog',
          title: 'Curtailment log',
          note: 'The record behind a compensation claim: when, why, to what limit and how much was lost.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: PowerRenewCurtailmentLog,
        },
        {
          id: 'PowerRenewFeederTable',
          title: 'Substation feeder table',
          note: 'A switchboard at a glance: breaker state, load and how close each feeder runs to its rating.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PowerRenewFeederTable,
        },
      ],
    },
    {
      id: 'full-blocks',
      title: 'Full blocks',
      description: 'The pieces combined into a farm overview.',
      specimens: [
        {
          id: 'PowerRenewFarmOverview',
          title: 'Wind farm overview',
          note: 'The landing view of a renewables application: farm figures, output against forecast and every turbine.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/TurbineTile.tsx', 'industrial/domains2/power.ts', 'industrial/KpiTile.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: PowerRenewFarmOverview,
        },
      ],
    },
  ],
});
