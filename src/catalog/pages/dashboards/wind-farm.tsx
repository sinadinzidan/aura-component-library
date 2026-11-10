import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { IconArrowUp } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { COMPASS_8 } from '../../../library/industrial/domains2/polar';
import { turbineStatus, warrantedPower } from '../../../library/industrial/domains2/power';
import type { PowerCurvePoint, TurbineState } from '../../../library/industrial/domains2/power';
import { WindRose } from '../../../library/industrial/domains2/WindRose';
import { TONE_TEXT, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { definePage } from '../../types';

import source from './wind-farm.tsx?raw';

/** The schematic is drawn in a 1000 × 600 field; north is up. */
const WIND_FARM_FIELD = { width: 1000, height: 600 } as const;

const WIND_FARM_RATED = 8;

const WIND_FARM_CURVE: readonly PowerCurvePoint[] = [
  { windSpeed: 3, power: 0 },
  { windSpeed: 4, power: 0.3 },
  { windSpeed: 5, power: 0.7 },
  { windSpeed: 6, power: 1.3 },
  { windSpeed: 7, power: 2.1 },
  { windSpeed: 8, power: 3.2 },
  { windSpeed: 9, power: 4.4 },
  { windSpeed: 10, power: 5.7 },
  { windSpeed: 11, power: 6.8 },
  { windSpeed: 12, power: 7.6 },
  { windSpeed: 13, power: 8 },
  { windSpeed: 25, power: 8 },
];

type WindFarmTurbine = { id: string; name: string; x: number; y: number };

/** Sixteen turbines in four staggered rows, positions in field units. */
const WIND_FARM_TURBINES: readonly WindFarmTurbine[] = [
  [340, 84],
  [460, 84],
  [580, 84],
  [700, 84],
  [310, 222],
  [430, 222],
  [550, 222],
  [670, 222],
  [300, 360],
  [420, 360],
  [540, 360],
  [660, 360],
  [320, 498],
  [440, 498],
  [560, 498],
  [680, 498],
].map(([x, y], index) => {
  const number = String(index + 1).padStart(2, '0');
  return { id: `wtg-${number}`, name: `WTG-${number}`, x, y };
});

type WindFarmTurbineReading = WindFarmTurbine & {
  state: TurbineState;
  /** Wind at the rotor in m/s, after the wakes of the turbines upwind. */
  windSpeed: number;
  /** Share of the free wind lost to wakes, 0–1. */
  wakeLoss: number;
  /** Active power in MW. */
  power: number;
  /** What the power curve gives at this wind speed, in MW. */
  warranted: number;
  detail?: string;
};

type WindFarmAlarm = { id: string; turbineId: string; turbine: string; tone: Tone; shape: 'diamond' | 'square' | 'ring'; text: string; since: string };

type WindFarmSnapshot = {
  hour: number;
  /** Bearing the wind comes from, degrees clockwise from north. */
  direction: number;
  /** Free wind speed at the met mast in m/s. */
  speed: number;
  turbines: WindFarmTurbineReading[];
  output: number;
  forecast: number;
  alarms: WindFarmAlarm[];
};

const windFarmRound = (value: number, decimals = 1): number => Math.round(value * 10 ** decimals) / 10 ** decimals;

const windFarmClock = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

const windFarmCompass = (direction: number): string => COMPASS_8[Math.round(direction / 45) % 8];

/** Unit vector the wind travels along, in screen coordinates (y grows downwards). */
function windFarmTravel(direction: number): { x: number; y: number } {
  const radians = (direction * Math.PI) / 180;
  return { x: -Math.sin(radians), y: Math.cos(radians) };
}

function windFarmState(turbineId: string, hour: number): { state: TurbineState; detail?: string } {
  if (turbineId === 'wtg-11' && hour >= 4) return { state: 'fault', detail: 'Gearbox oil temperature high since 04:10' };
  if (turbineId === 'wtg-04' && hour >= 8 && hour < 16) return { state: 'maintenance', detail: 'Blade inspection, planned 08:00 to 16:00' };
  if (turbineId === 'wtg-15' && hour >= 12 && hour < 15) return { state: 'curtailed', detail: 'Held at 4.0 MW by the grid operator' };
  return { state: 'generating' };
}

/**
 * The whole farm at one hour of the day. Wind direction and speed follow fixed daily curves; each
 * turbine loses wind to every producing turbine close to straight upwind of it.
 */
function windFarmSnapshot(hour: number): WindFarmSnapshot {
  const direction = Math.round(205 + 40 * Math.sin(((hour - 5) / 24) * 2 * Math.PI));
  const speed = windFarmRound(9.2 + 3.1 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + 0.9 * Math.sin(hour * 1.7));
  const travel = windFarmTravel(direction);
  const states = WIND_FARM_TURBINES.map((turbine) => windFarmState(turbine.id, hour));
  const producing = states.map(({ state }) => state === 'generating' || state === 'curtailed');

  const turbines = WIND_FARM_TURBINES.map((turbine, index) => {
    const deficit = WIND_FARM_TURBINES.reduce((sum, other, otherIndex) => {
      if (otherIndex === index || !producing[otherIndex]) return sum;
      const dx = turbine.x - other.x;
      const dy = turbine.y - other.y;
      const along = dx * travel.x + dy * travel.y;
      const lateral = Math.abs(dx * travel.y - dy * travel.x);
      if (along <= 0 || along > 320 || lateral > 26 + along * 0.08) return sum;
      return sum + 0.24 * (1 - along / 320);
    }, 0);
    const wakeLoss = Math.min(0.4, deficit);
    const windSpeed = windFarmRound(speed * (1 - wakeLoss));
    const warranted = warrantedPower(windSpeed, WIND_FARM_CURVE);
    const { state, detail } = states[index];
    const efficiency = 0.94 + ((index * 7) % 6) / 100;
    const power = state === 'fault' || state === 'maintenance' ? 0 : state === 'curtailed' ? Math.min(4, warranted) : warranted * efficiency;
    return { ...turbine, state, detail, windSpeed, wakeLoss, warranted: windFarmRound(warranted), power: windFarmRound(power) };
  });

  const forecastSpeed = speed + 0.5 * Math.cos(hour * 0.9);
  const alarms: WindFarmAlarm[] = [];
  if (hour >= 4) alarms.push({ id: 'gearbox', turbineId: 'wtg-11', turbine: 'WTG-11', tone: 'critical', shape: 'diamond', text: 'Gearbox oil temperature high', since: '04:10' });
  if (hour >= 8 && hour < 16) alarms.push({ id: 'service', turbineId: 'wtg-04', turbine: 'WTG-04', tone: 'warning', shape: 'square', text: 'Stopped for blade inspection', since: '08:00' });
  if (hour >= 12 && hour < 15) alarms.push({ id: 'curtail', turbineId: 'wtg-15', turbine: 'WTG-15', tone: 'info', shape: 'ring', text: 'Curtailed to 4.0 MW by the grid', since: '12:00' });

  return {
    hour,
    direction,
    speed,
    turbines,
    output: windFarmRound(turbines.reduce((sum, turbine) => sum + turbine.power, 0)),
    forecast: windFarmRound(warrantedPower(forecastSpeed, WIND_FARM_CURVE) * WIND_FARM_TURBINES.length * 0.86),
    alarms,
  };
}

const WIND_FARM_DAY: readonly WindFarmSnapshot[] = Array.from({ length: 24 }, (_, hour) => windFarmSnapshot(hour));

const WIND_FARM_ROSE = COMPASS_8.map((direction) => ({
  direction,
  value: (WIND_FARM_DAY.filter((snapshot) => windFarmCompass(snapshot.direction) === direction).length / 24) * 100,
}));

const WIND_FARM_CAPACITY = WIND_FARM_RATED * WIND_FARM_TURBINES.length;

type WindFarmFloatCardProps = {
  title: string;
  /** One line under the title. */
  description?: string;
  /** Steps back while a turbine card is open. */
  dimmed?: boolean;
  children: ReactNode;
};

/** A translucent card that floats over the map: the field stays visible behind it. */
function WindFarmFloatCard({ title, description, dimmed = false, children }: WindFarmFloatCardProps) {
  return (
    <section
      aria-label={title}
      className={`flex w-full min-w-0 flex-col gap-3 rounded-xl border border-default bg-card-background/85 p-3 backdrop-blur-sm transition-opacity ${dimmed ? 'opacity-30' : ''}`}
    >
      <header className="flex flex-col gap-0.5">
        <h4 className="text-sm font-semibold text-base-foreground">{title}</h4>
        {description ? <p className="text-xs tabular-nums text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function WindFarmOutputCard({ hour, dimmed }: { hour: number; dimmed?: boolean }) {
  const snapshot = WIND_FARM_DAY[hour];
  const x = (index: number): number => (index / 23) * 100;
  const y = (value: number): number => 38 - (value / WIND_FARM_CAPACITY) * 36;
  const line = (pick: (entry: WindFarmSnapshot) => number): string => WIND_FARM_DAY.map((entry, index) => `${windFarmRound(x(index))},${windFarmRound(y(pick(entry)))}`).join(' ');

  return (
    <WindFarmFloatCard title="Farm output" description={`${windFarmClock(hour)} · forecast ${formatValue(snapshot.forecast, 1)} MW`} dimmed={dimmed}>
      <div className="flex flex-col gap-1.5">
        <ValueReadout size="lg" value={snapshot.output} unit="MW" decimals={1} />
        <TrendDelta value={snapshot.output} reference={snapshot.forecast} format="percent" decimals={0} goodDirection="up" caption="vs forecast" />
      </div>
      <div
        role="img"
        aria-label={`Output and forecast over the day; at ${windFarmClock(hour)} the farm makes ${formatValue(snapshot.output, 1)} MW against a forecast of ${formatValue(snapshot.forecast, 1)} MW`}
        className="relative h-12 w-full"
      >
        <svg aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full overflow-visible">
          <polyline points={line((entry) => entry.forecast)} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" className="stroke-muted-foreground" />
          <polyline points={line((entry) => entry.output)} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
          <line x1={x(hour)} x2={x(hour)} y1={0} y2={40} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-base-foreground" />
        </svg>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p className="flex justify-between tabular-nums">
          <span>00:00</span>
          <span>23:00</span>
        </p>
        <p>Solid line output, dashed forecast.</p>
      </div>
    </WindFarmFloatCard>
  );
}

function WindFarmWindCard({ hour, dimmed }: { hour: number; dimmed?: boolean }) {
  const snapshot = WIND_FARM_DAY[hour];

  return (
    <WindFarmFloatCard title="Wind" description={`Now from ${windFarmCompass(snapshot.direction)}, ${snapshot.direction}° at ${formatValue(snapshot.speed, 1)} m/s`} dimmed={dimmed}>
      <div className="mx-auto w-full max-w-48">
        <WindRose label="Wind direction over the day, share of hours" sectors={WIND_FARM_ROSE} rings={2} max={60} />
      </div>
    </WindFarmFloatCard>
  );
}

const WIND_FARM_STATE_ORDER: readonly TurbineState[] = ['generating', 'curtailed', 'maintenance', 'fault', 'idle', 'stopped'];

function WindFarmAvailabilityCard({ hour, dimmed }: { hour: number; dimmed?: boolean }) {
  const { turbines } = WIND_FARM_DAY[hour];
  const available = turbines.filter((turbine) => turbine.state !== 'fault' && turbine.state !== 'maintenance').length;
  const counts = WIND_FARM_STATE_ORDER.map((state) => ({ state, count: turbines.filter((turbine) => turbine.state === state).length })).filter((entry) => entry.count > 0);

  return (
    <WindFarmFloatCard title="Availability" description={`${available} of ${turbines.length} turbines available`} dimmed={dimmed}>
      <ValueReadout size="lg" value={(available / turbines.length) * 100} unit="%" decimals={1} />
      <ul className="flex flex-col gap-1.5">
        {counts.map(({ state, count }) => (
          <li key={state} className="flex items-center justify-between gap-3">
            <StatusIndicator {...turbineStatus(state)} size="sm" />
            <span className="text-xs tabular-nums text-base-foreground">{count}</span>
          </li>
        ))}
      </ul>
    </WindFarmFloatCard>
  );
}

function WindFarmAlarmsCard({ hour, dimmed, onSelect }: { hour: number; dimmed?: boolean; onSelect: (turbineId: string) => void }) {
  const { alarms } = WIND_FARM_DAY[hour];

  return (
    <WindFarmFloatCard title="Alarms" description={alarms.length === 0 ? `None active at ${windFarmClock(hour)}` : `${alarms.length} active, most severe first`} dimmed={dimmed}>
      {alarms.length === 0 ? (
        <p className="text-xs text-muted-foreground">Every turbine is running without an active alarm.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {alarms.map((alarm) => (
            <li key={alarm.id}>
              <button
                type="button"
                onClick={() => onSelect(alarm.turbineId)}
                aria-label={`${alarm.turbine}: ${alarm.text}, since ${alarm.since}. Show turbine`}
                className="flex w-full cursor-pointer items-start gap-2 rounded-md p-1 text-left outline-none hover:bg-muted-background focus-visible:shadow-focus-ring"
              >
                <span className="pt-1">
                  <StatusDot tone={alarm.tone} shape={alarm.shape} size="sm" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs text-base-foreground">{alarm.text}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    <span className="font-mono">{alarm.turbine}</span> · since {alarm.since}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WindFarmFloatCard>
  );
}

/** The card a turbine opens: what it makes, the wind it gets and where that puts it on its power curve. */
function WindFarmTurbineCard({ turbine, onClose }: { turbine: WindFarmTurbineReading; onClose: () => void }) {
  const status = turbineStatus(turbine.state);
  const curveX = (windSpeed: number): number => (Math.min(windSpeed, 16) / 16) * 100;
  const curveY = (power: number): number => 96 - (power / WIND_FARM_RATED) * 90;
  const curve = WIND_FARM_CURVE.map((point) => `${windFarmRound(curveX(point.windSpeed))},${windFarmRound(curveY(point.power))}`).join(' ');
  const share = turbine.warranted > 0 ? (turbine.power / turbine.warranted) * 100 : null;

  return (
    <section aria-label={`Turbine ${turbine.name}`} className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-emphasized bg-card-background p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="font-mono text-sm font-semibold text-base-foreground">{turbine.name}</h4>
          <StatusIndicator {...status} size="sm" />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </header>
      <ValueReadout size="lg" value={turbine.power} unit="MW" decimals={1} tone={turbine.state === 'fault' ? 'critical' : 'neutral'} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Wind at rotor</dt>
          <dd className="tabular-nums text-base-foreground">{formatValue(turbine.windSpeed, 1)} m/s</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Lost to wakes</dt>
          <dd className="tabular-nums text-base-foreground">{formatValue(turbine.wakeLoss * 100, 0)}%</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Power curve</dt>
          <dd className="tabular-nums text-base-foreground">{formatValue(turbine.warranted, 1)} MW</dd>
        </div>
      </dl>
      <div
        role="img"
        aria-label={`Power curve: at ${formatValue(turbine.windSpeed, 1)} m/s the curve gives ${formatValue(turbine.warranted, 1)} MW and the turbine makes ${formatValue(turbine.power, 1)} MW`}
        className="relative h-20 w-full border-b border-l border-default"
      >
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full">
          <polyline points={curve} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-muted-foreground" />
        </svg>
        <span
          className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${turbine.state === 'generating' ? 'bg-chart-1-450' : 'rotate-45 rounded-none bg-base-foreground'}`}
          style={{ left: `${curveX(turbine.windSpeed)}%`, top: `${curveY(turbine.power)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {turbine.detail ?? (share === null ? 'Below cut-in wind speed.' : `Running at ${formatValue(share, 0)}% of its power curve; the axis runs from 0 to 16 m/s.`)}
      </p>
    </section>
  );
}

const windFarmPercent = (value: number, total: number): string => `${windFarmRound((value / total) * 100, 2)}%`;

type WindFarmFieldProps = {
  hour: number;
  selectedId: string | null;
  onSelect: (turbineId: string) => void;
};

/** The dominant element: the farm from above, streamlines along the wind and a wake behind every producing turbine. */
function WindFarmField({ hour, selectedId, onSelect }: WindFarmFieldProps) {
  const snapshot = WIND_FARM_DAY[hour];
  const travel = windFarmTravel(snapshot.direction);
  const normal = { x: travel.y, y: -travel.x };
  const centre = { x: WIND_FARM_FIELD.width / 2, y: WIND_FARM_FIELD.height / 2 };

  return (
    <>
      <svg
        role="img"
        aria-label={`Farm layout at ${windFarmClock(hour)}: wind from ${windFarmCompass(snapshot.direction)} at ${formatValue(snapshot.speed, 1)} metres per second, with a wake drawn downwind of every producing turbine`}
        viewBox={`0 0 ${WIND_FARM_FIELD.width} ${WIND_FARM_FIELD.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {Array.from({ length: 19 }, (_, index) => index - 9).map((step) => {
          const px = centre.x + normal.x * step * 64;
          const py = centre.y + normal.y * step * 64;
          return (
            <line
              key={step}
              x1={windFarmRound(px - travel.x * 1200)}
              y1={windFarmRound(py - travel.y * 1200)}
              x2={windFarmRound(px + travel.x * 1200)}
              y2={windFarmRound(py + travel.y * 1200)}
              strokeWidth={1}
              strokeDasharray="2 8"
              vectorEffect="non-scaling-stroke"
              className="stroke-muted-foreground"
              strokeOpacity={0.45}
            />
          );
        })}
        {snapshot.turbines
          .filter((turbine) => turbine.power > 0)
          .map((turbine) => {
            const length = 60 + turbine.power * 16;
            const spread = 5 + length * 0.07;
            const end = { x: turbine.x + travel.x * length, y: turbine.y + travel.y * length };
            const points = [
              [turbine.x + normal.x * 4, turbine.y + normal.y * 4],
              [end.x + normal.x * spread, end.y + normal.y * spread],
              [end.x - normal.x * spread, end.y - normal.y * spread],
              [turbine.x - normal.x * 4, turbine.y - normal.y * 4],
            ];
            return (
              <polygon
                key={turbine.id}
                points={points.map(([px, py]) => `${windFarmRound(px)},${windFarmRound(py)}`).join(' ')}
                className="fill-chart-1-300"
                fillOpacity={selectedId === null || selectedId === turbine.id ? 0.35 : 0.12}
              />
            );
          })}
      </svg>
      {snapshot.turbines.map((turbine, index) => {
        const status = turbineStatus(turbine.state);
        const quiet = turbine.state === 'generating';
        const selected = turbine.id === selectedId;
        const spin = turbine.power > 0 ? (index * 37 + hour * 23) % 120 : 0;
        return (
          <button
            key={turbine.id}
            type="button"
            aria-pressed={selected}
            aria-label={`${turbine.name}: ${status.label.toLowerCase()}, ${formatValue(turbine.power, 1)} MW at ${formatValue(turbine.windSpeed, 1)} m/s`}
            onClick={() => onSelect(turbine.id)}
            className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-0.5 rounded-lg outline-none transition-opacity focus-visible:shadow-focus-ring ${
              selectedId !== null && !selected ? 'opacity-40' : ''
            }`}
            style={{ left: windFarmPercent(turbine.x, WIND_FARM_FIELD.width), top: windFarmPercent(turbine.y, WIND_FARM_FIELD.height) }}
          >
            <span
              className={`relative flex size-10 items-center justify-center rounded-full bg-muted-background ${quiet ? 'text-base-foreground' : TONE_TEXT[status.tone]} ${
                selected ? 'ring-2 ring-base-foreground' : 'group-hover:ring-1 group-hover:ring-muted-foreground'
              }`}
            >
              <svg aria-hidden="true" viewBox="-12 -12 24 24" className="size-9">
                {[0, 120, 240].map((blade) => (
                  <line key={blade} x1={0} y1={0} x2={0} y2={-10} strokeWidth={2} strokeLinecap="round" stroke="currentColor" transform={`rotate(${blade + spin})`} />
                ))}
                <circle r={2.4} fill="currentColor" />
              </svg>
              {quiet ? null : (
                <span className="absolute -right-1 -top-1 flex rounded-full bg-muted-background p-0.5">
                  <StatusDot tone={status.tone} shape={status.shape} size="sm" />
                </span>
              )}
            </span>
            <span className="flex flex-col items-center rounded-md bg-muted-background/80 px-1 leading-tight">
              <span className={`font-mono text-xs text-base-foreground ${selected ? 'font-semibold' : ''}`}>{turbine.name}</span>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{quiet ? `${formatValue(turbine.power, 1)} MW` : status.label.split(',')[0]}</span>
            </span>
          </button>
        );
      })}
    </>
  );
}

/** Wind marker at the met mast: an arrow that points where the wind is going. */
function WindFarmMastMarker({ hour }: { hour: number }) {
  const snapshot = WIND_FARM_DAY[hour];
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-emphasized text-base-foreground">
        <IconArrowUp aria-hidden className="size-6" style={{ transform: `rotate(${(snapshot.direction + 180) % 360}deg)` }} />
      </span>
      <span className="flex flex-col text-xs leading-tight">
        <span className="font-medium text-base-foreground">Met mast</span>
        <span className="tabular-nums text-muted-foreground">
          From {windFarmCompass(snapshot.direction)} · {formatValue(snapshot.speed, 1)} m/s
        </span>
      </span>
    </div>
  );
}

type WindFarmMapProps = WindFarmFieldProps & { onClose: () => void };

/** The map with its four floating corner cards and, when a turbine is selected, that turbine's card. */
function WindFarmMap({ hour, selectedId, onSelect, onClose }: WindFarmMapProps) {
  const selected = WIND_FARM_DAY[hour].turbines.find((turbine) => turbine.id === selectedId);
  const dimmed = selected !== undefined;
  const cardStyle = selected
    ? {
        ...(selected.x < 500 ? { left: `calc(${windFarmPercent(selected.x, 1000)} + 2.5rem)` } : { right: `calc(${windFarmPercent(1000 - selected.x, 1000)} + 2.5rem)` }),
        top: `${Math.min(34, Math.max(3, (selected.y / 600) * 100 - 24))}%`,
      }
    : undefined;

  return (
    <div
      role="group"
      aria-label="Wind farm map"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      className="relative aspect-[5/3] min-h-[40rem] w-full overflow-hidden rounded-xl border border-default bg-muted-background"
    >
      <WindFarmField hour={hour} selectedId={selectedId} onSelect={onSelect} />
      <div className={`absolute left-[3%] top-[55%] z-10 w-[20%] -translate-y-1/2 transition-opacity ${dimmed ? 'opacity-40' : ''}`}>
        <WindFarmMastMarker hour={hour} />
      </div>
      <div className="absolute left-[1.5%] top-[2.5%] z-20 w-[23%]">
        <WindFarmOutputCard hour={hour} dimmed={dimmed} />
      </div>
      <div className="absolute right-[1.5%] top-[2.5%] z-20 w-[23%]">
        <WindFarmWindCard hour={hour} dimmed={dimmed} />
      </div>
      <div className="absolute bottom-[2.5%] left-[1.5%] z-20 w-[23%]">
        <WindFarmAvailabilityCard hour={hour} dimmed={dimmed} />
      </div>
      <div className="absolute bottom-[2.5%] right-[1.5%] z-20 w-[23%]">
        <WindFarmAlarmsCard hour={hour} dimmed={dimmed} onSelect={onSelect} />
      </div>
      {selected ? (
        <div className="absolute z-30 w-64" style={cardStyle}>
          <WindFarmTurbineCard turbine={selected} onClose={onClose} />
        </div>
      ) : null}
    </div>
  );
}

/** The scrubber: one hour per step. Everything on the map follows it. */
function WindFarmScrubber({ hour, onHourChange }: { hour: number; onHourChange: (hour: number) => void }) {
  const snapshot = WIND_FARM_DAY[hour];
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex shrink-0 items-baseline gap-2">
        <span className="text-xs text-muted-foreground">Time of day</span>
        <span className="w-12 text-sm font-semibold tabular-nums text-base-foreground">{windFarmClock(hour)}</span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">00:00</span>
      <Slider
        aria-label="Time of day"
        className="min-w-40 flex-1"
        min={0}
        max={23}
        step={1}
        value={[hour]}
        onValueChange={(next) => {
          const value = next[0];
          if (value !== undefined) onHourChange(value);
        }}
      />
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">23:00</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        Wind from {windFarmCompass(snapshot.direction)} at {formatValue(snapshot.speed, 1)} m/s · {formatValue(snapshot.output, 1)} MW
      </span>
    </div>
  );
}

/*
 * Archetype: map-first with floating cards — one canvas, no grid of panels.
 * Dominant element: the schematic farm layout, aligned to the wind, with a wake behind each turbine.
 * Interaction: the time-of-day scrubber turns the wind and changes every turbine's output; clicking
 * a turbine (or an alarm) opens its card beside it and dims everything else until it is closed.
 */
function WindFarmDashboard() {
  const [hour, setHour] = useState(14);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const faults = WIND_FARM_DAY[hour].turbines.filter((turbine) => turbine.state === 'fault').length;

  return (
    <DashboardFrame
      title="Wind farm"
      subtitle="Havsul offshore wind farm · 16 turbines · 12 March 2026"
      status={
        faults > 0 ? (
          <StatusIndicator tone="critical" shape="diamond" label={`${faults} turbine in fault`} detail="WTG-11" />
        ) : (
          <StatusIndicator tone="success" label="No turbine in fault" />
        )
      }
      toolbar={<WindFarmScrubber hour={hour} onHourChange={setHour} />}
    >
      <WindFarmMap
        hour={hour}
        selectedId={selectedId}
        onSelect={(turbineId) => setSelectedId((current) => (current === turbineId ? null : turbineId))}
        onClose={() => setSelectedId(null)}
      />
    </DashboardFrame>
  );
}

function WindFarmDashSignature() {
  return (
    <ThemeScope preset="fjord-dark" className="w-full">
      <WindFarmDashboard />
    </ThemeScope>
  );
}

function WindFarmDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <WindFarmDashboard />
    </ThemeScope>
  );
}

function WindFarmDashHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <WindFarmDashboard />
    </ThemeScope>
  );
}

function WindFarmDashField() {
  return (
    <ThemeScope preset="field" className="w-full">
      <WindFarmDashboard />
    </ThemeScope>
  );
}

function WindFarmDashOutputCard() {
  return (
    <div className="mx-auto w-full max-w-60">
      <WindFarmOutputCard hour={14} />
    </div>
  );
}

function WindFarmDashWindCard() {
  return (
    <div className="mx-auto w-full max-w-60">
      <WindFarmWindCard hour={14} />
    </div>
  );
}

function WindFarmDashAvailabilityCard() {
  return (
    <div className="mx-auto w-full max-w-60">
      <WindFarmAvailabilityCard hour={14} />
    </div>
  );
}

function WindFarmDashAlarmsCard() {
  return (
    <div className="mx-auto w-full max-w-60">
      <WindFarmAlarmsCard hour={14} onSelect={() => undefined} />
    </div>
  );
}

function WindFarmDashTurbineCard() {
  const [open, setOpen] = useState(true);
  const turbine = WIND_FARM_DAY[14].turbines[6];
  return (
    <div className="mx-auto flex w-full max-w-64 flex-col items-center">
      {open ? (
        <WindFarmTurbineCard turbine={turbine} onClose={() => setOpen(false)} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Open turbine card
        </Button>
      )}
    </div>
  );
}

function WindFarmDashScrubber() {
  const [hour, setHour] = useState(6);
  return <WindFarmScrubber hour={hour} onHourChange={setHour} />;
}

function WindFarmDashFieldOnly() {
  const [hour, setHour] = useState(2);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col gap-3">
      <WindFarmScrubber hour={hour} onHourChange={setHour} />
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-xl border border-default bg-muted-background">
        <WindFarmField hour={hour} selectedId={selectedId} onSelect={(turbineId) => setSelectedId((current) => (current === turbineId ? null : turbineId))} />
      </div>
    </div>
  );
}

export default definePage({
  id: 'wind-farm',
  title: 'Wind farm',
  summary:
    'A wind farm seen from above: where the wind comes from, which turbines stand in whose wake, and what the farm delivers against forecast. One map carries the screen; the figures float over its corners.',
  guidance: {
    use: [
      'When position explains performance: wakes, shading, distance or terrain.',
      'When a handful of farm-level figures is enough and each can sit in a corner.',
      'Open one asset at a time over the map and dim the rest, so context is never lost.',
      'Give time its own control when the picture changes through the day.',
    ],
    avoid: [
      'Floating cards that cover assets; keep the corners clear in the layout itself.',
      'State by colour alone on the map — every abnormal turbine carries a shape and a word.',
      'Animating the scrubber on its own; the user drives time.',
      'More than four floating cards; a fifth figure belongs in an existing card.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Fjord dark theme. A map-first layout: the farm fills the frame, cards float over its corners and a scrubber moves the day.',
      specimens: [
        {
          id: 'WindFarmDashSignature',
          title: 'Wind farm',
          note: 'Pick it when the layout of the assets is itself the explanation and figures only support it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'industrial/domains2/WindRose.tsx',
            'industrial/domains2/power.ts',
            'industrial/domains2/polar.ts',
            'industrial/StatusIndicator.tsx',
            'industrial/StatusDot.tsx',
            'industrial/TrendDelta.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: WindFarmDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'WindFarmDashAura',
          title: 'Aura',
          note: 'Pick it for daytime office use, where the map should read like a light chart.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WindFarmDashAura,
        },
        {
          id: 'WindFarmDashHologram',
          title: 'Hologram',
          note: 'Pick it for a digital-twin or showpiece screen: teal on black with soft shapes.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WindFarmDashHologram,
        },
        {
          id: 'WindFarmDashField',
          title: 'Field',
          note: 'Pick it for a tablet on the service vessel: larger targets and stronger contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WindFarmDashField,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Parts',
      description: 'The map without its cards, the scrubber, and each floating card on its own.',
      specimens: [
        {
          id: 'WindFarmDashFieldOnly',
          title: 'Farm layout',
          note: 'Pick it as the canvas: turbines, streamlines and wakes, driven by one hour of the day.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/domains2/power.ts', 'industrial/StatusDot.tsx'],
          Component: WindFarmDashFieldOnly,
        },
        {
          id: 'WindFarmDashOutputCard',
          title: 'Output against forecast',
          note: 'Pick it for the one farm-level figure, with the day behind it as a small curve.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx'],
          Component: WindFarmDashOutputCard,
        },
        {
          id: 'WindFarmDashWindCard',
          title: 'Wind rose',
          note: 'Pick it to show where the wind has come from, with the current direction in words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/domains2/WindRose.tsx'],
          Component: WindFarmDashWindCard,
        },
        {
          id: 'WindFarmDashTurbineCard',
          title: 'Turbine card',
          note: 'Pick it as the card a map marker opens: state, power, wind and place on the power curve.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/domains2/power.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WindFarmDashTurbineCard,
        },
        {
          id: 'WindFarmDashAvailabilityCard',
          title: 'Availability',
          note: 'Pick it to count turbines by state; only states that occur are listed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/domains2/power.ts'],
          Component: WindFarmDashAvailabilityCard,
        },
        {
          id: 'WindFarmDashAlarmsCard',
          title: 'Alarms',
          note: 'Pick it for a short alarm list whose rows lead back to the asset on the map.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/StatusDot.tsx'],
          Component: WindFarmDashAlarmsCard,
        },
        {
          id: 'WindFarmDashScrubber',
          title: 'Time-of-day scrubber',
          note: 'Pick it when the user should move through a day by hand, one hour per step.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: WindFarmDashScrubber,
        },
      ],
    },
  ],
});
