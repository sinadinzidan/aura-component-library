import { ChartContainer, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { IconAlertTriangle, IconCircleCheck, IconPlugConnectedX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { BigStat } from '../../../library/industrial/analytics/BigStat';
import { stationStatus } from '../../../library/industrial/domains2/lines';
import type { StationState } from '../../../library/industrial/domains2/lines';
import { countBySeverity, isOpenAlarm, sortAlarmsBySeverity } from '../../../library/industrial/operations/alarms';
import { TONE_BORDER, TONE_DOT, TONE_SURFACE, TONE_TEXT, formatValue, healthStatus, runStateStatus, severityStatus } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, PLANT_KPIS, childrenOf, findAsset } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './wall-displays.tsx?raw';

const NOW = REFERENCE_NOW;

const WALL_ALARMS = sortAlarmsBySeverity(ALARMS.filter(isOpenAlarm));
const WALL_TOP_ALARMS = WALL_ALARMS.slice(0, 3);
const WALL_COUNTS = countBySeverity(WALL_ALARMS);
const WALL_AREAS = childrenOf('nk');

const WALL_PRESSURE = makeSeries({ seed: 11, points: 49, base: 48.4, amplitude: 1.1, noise: 0.3, cycles: 2, stepMs: 30 * 60_000 }).map((point) => ({ time: formatTime(point.t), value: point.v }));

const WALL_TREND_CONFIG = {
  value: { label: 'Discharge pressure', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Line 3 at the Stord workshop: valve actuator assembly, takt 45 seconds. */
const WALL_STATIONS: readonly { code: string; operation: string; state: StationState; detail?: string }[] = [
  { code: 'OP 10', operation: 'Housing load', state: 'running' },
  { code: 'OP 20', operation: 'Bearing press', state: 'running' },
  { code: 'OP 30', operation: 'Gear fit', state: 'blocked', detail: '6 min' },
  { code: 'OP 40', operation: 'Seal and torque', state: 'down', detail: 'since 13:22' },
  { code: 'OP 50', operation: 'Leak test', state: 'starved', detail: '5 min' },
  { code: 'OP 60', operation: 'Function test', state: 'running' },
  { code: 'OP 70', operation: 'Label and scan', state: 'running' },
  { code: 'OP 80', operation: 'Pack out', state: 'idle' },
];

const WALL_HOURS = [
  { hour: '06–07', plan: 80, actual: 81 },
  { hour: '07–08', plan: 80, actual: 79 },
  { hour: '08–09', plan: 80, actual: 80 },
  { hour: '09–10', plan: 80, actual: 74 },
  { hour: '10–11', plan: 80, actual: 78 },
  { hour: '11–12', plan: 40, actual: 41 },
  { hour: '12–13', plan: 80, actual: 61 },
  { hour: '13–14', plan: 80, actual: 44 },
];
const WALL_BUILT = WALL_HOURS.reduce((sum, row) => sum + row.actual, 0);
const WALL_PLANNED = WALL_HOURS.reduce((sum, row) => sum + row.plan, 0);
const WALL_SHIFT_TARGET = 640;

const WALL_TEXT_SIZES = [
  { name: 'text-9xl', sample: '4.38', className: 'text-9xl font-semibold', distance: '10 m', use: 'The one figure of the screen' },
  { name: 'text-8xl', sample: '96.4', className: 'text-8xl font-semibold', distance: '8 m', use: 'Headline figures' },
  { name: 'text-6xl', sample: '14:00', className: 'text-6xl font-semibold', distance: '6 m', use: 'Clock, counts, status words' },
  { name: 'text-3xl', sample: 'Recompressor tripped', className: 'text-3xl font-medium', distance: '4 m', use: 'Alarm text, panel titles' },
  { name: 'text-xl', sample: '23-VT-92740 · 14 min ago', className: 'text-xl', distance: '3 m', use: 'Smallest text allowed: tags, units, captions' },
] as const;

type WallDisplayScreenProps = { preset?: 'wall-display' | 'control-room'; label: string; children: ReactNode };

/** One wall screen: the themed scope with its own base surface, so it reads as a display inside the page. */
function WallDisplayScreen({ preset = 'wall-display', label, children }: WallDisplayScreenProps) {
  return (
    <ThemeScope preset={preset} className="w-full">
      <section aria-label={label} className="flex w-full flex-col gap-6 rounded-xl bg-base-background p-8 text-base-foreground">
        {children}
      </section>
    </ThemeScope>
  );
}

/** A status shape large enough to read across a room. Shape repeats what colour says. */
function WallDisplayShape({ tone, shape, className = 'size-10' }: { tone: Tone; shape: DotShape; className?: string }) {
  const form =
    shape === 'ring' ? `rounded-full border-8 ${TONE_BORDER[tone]}` : shape === 'square' ? `rounded-sm ${TONE_DOT[tone]}` : shape === 'diamond' ? `rotate-45 rounded-sm ${TONE_DOT[tone]}` : `rounded-full ${TONE_DOT[tone]}`;
  return <span aria-hidden="true" className={`inline-block shrink-0 ${className} ${form}`} />;
}

function WallDisplayPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex min-w-0 flex-col gap-4 rounded-xl bg-card-background p-6">
      <p className="text-2xl font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function WallDisplayTargetBar({ value, target, label }: { value: number; target: number; label: string }) {
  const share = Math.min(100, (value / target) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label={`${label}: ${formatValue(value)} of ${formatValue(target)}, ${formatValue(share)} percent`} className="h-5 w-full overflow-hidden rounded-full bg-chart-neutral-100">
        <div className="h-full rounded-full bg-chart-1-450" style={{ width: `${share}%` }} />
      </div>
      <p className="flex justify-between text-xl tabular-nums text-muted-foreground">
        <span>{formatValue(share)} % of target</span>
        <span>Target {formatValue(target)}</span>
      </p>
    </div>
  );
}

function WallDisplayAlarmList({ alarms }: { alarms: typeof WALL_TOP_ALARMS }) {
  return (
    <ul aria-label="Top alarms" className="flex flex-col divide-y divide-default">
      {alarms.map((alarm) => {
        const severity = severityStatus(alarm.severity);
        return (
          <li key={alarm.id} className="flex flex-col gap-2 py-4">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-4 text-2xl font-medium text-base-foreground">
                <WallDisplayShape tone={severity.tone} shape={severity.shape} className="size-6" />
                {severity.label}
              </span>
              <span className="shrink-0 text-2xl tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
            </div>
            <p className="text-3xl font-medium text-base-foreground">{alarm.message}</p>
            <p className="text-xl text-muted-foreground">
              <span className="font-mono">{alarm.sensorTag}</span> · {alarm.value} against {alarm.limit}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function WallDisplayAreas() {
  return (
    <ul aria-label="Area status" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {WALL_AREAS.map((area) => {
        const health = healthStatus(area.health);
        const abnormal = health.tone !== 'success';
        return (
          <li key={area.id} className={`flex min-w-0 flex-col gap-3 rounded-xl p-6 ${abnormal ? TONE_SURFACE[health.tone] : 'bg-card-background text-base-foreground'}`}>
            <p className="text-2xl font-medium">{area.name}</p>
            <p className="flex items-center gap-4 text-4xl font-semibold">
              {abnormal ? <IconAlertTriangle aria-hidden="true" className="size-9 shrink-0" /> : <IconCircleCheck aria-hidden="true" className={`size-9 shrink-0 ${TONE_TEXT.success}`} />}
              {health.label}
            </p>
            <p className="font-mono text-xl opacity-80">{area.tag}</p>
          </li>
        );
      })}
    </ul>
  );
}

function WallDisplayTrendChart({ heightClassName = 'h-80' }: { heightClassName?: string }) {
  return (
    <div className={`w-full ${heightClassName}`}>
      <ChartContainer config={WALL_TREND_CONFIG} className="aspect-auto h-full w-full" aria-label="Discharge pressure over the last 24 hours, steady around 48 barg under the high limit of 52">
        <LineChart data={WALL_PRESSURE} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} interval={11} tick={{ fontSize: '1.25rem' }} tickMargin={12} height={44} />
          <YAxis domain={[40, 56]} ticks={[40, 48, 56]} tickLine={false} axisLine={false} width={56} tick={{ fontSize: '1.25rem' }} />
          <ReferenceLine y={52} stroke="var(--color-chart-warning-450)" strokeDasharray="8 8" strokeWidth={3} />
          <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function WallDisplayClockRow() {
  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <p className="flex items-baseline gap-4 leading-none">
        <span className="text-8xl font-semibold tabular-nums tracking-tight">{formatTime(NOW)}</span>
        <span className="text-3xl text-muted-foreground">UTC · Thu 12 Mar</span>
      </p>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-medium">Day shift · 06:00–18:00</p>
        <p className="text-2xl text-muted-foreground">Liv Wold, shift supervisor · 4 h left</p>
      </div>
      <p className="flex items-center gap-3 text-2xl text-muted-foreground">
        <WallDisplayShape tone="success" shape="dot" className="size-5" />
        Live · updated 14:00:00
      </p>
    </div>
  );
}

function WallDisplayGiantKpi() {
  return (
    <WallDisplayScreen label="Gas export on a wall display">
      <BigStat size="2xl" label="Gas export" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} caption="Plan 4.50 · yesterday 4.21" />
    </WallDisplayScreen>
  );
}

function WallDisplayKpiWithStatus() {
  return (
    <WallDisplayScreen label="Availability on a wall display">
      <BigStat size="xl" label="Availability" value={PLANT_KPIS.availability.value} unit="%" decimals={1} tone="warning" status={{ tone: 'warning', label: 'Under target' }} caption="Target 97.5 · last week 97.1" />
    </WallDisplayScreen>
  );
}

function WallDisplayCounter() {
  return (
    <WallDisplayScreen label="Production counter on a wall display">
      <BigStat size="xl" label="Actuators built this shift" value={WALL_BUILT} decimals={0} caption={`Planned by now ${WALL_PLANNED} · ${WALL_PLANNED - WALL_BUILT} behind`}>
        <WallDisplayTargetBar value={WALL_BUILT} target={WALL_SHIFT_TARGET} label="Shift target" />
      </BigStat>
    </WallDisplayScreen>
  );
}

function WallDisplayTakt() {
  return (
    <WallDisplayScreen label="Takt on a wall display">
      <BigStat size="xl" label="Cycle time, OP 40" value={46.8} unit="s" decimals={1} tone="critical" status={{ tone: 'critical', label: '1.8 s over takt' }} caption="Takt 45.0 s · line average 40.1 s" />
    </WallDisplayScreen>
  );
}

function WallDisplayKpiRow() {
  return (
    <WallDisplayScreen label="Headline figures on a wall display">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <BigStat size="lg" label="Gas export" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} caption="Plan 4.50" />
        <BigStat size="lg" label="Availability" value={PLANT_KPIS.availability.value} unit="%" decimals={1} caption="Target 97.5" />
        <BigStat size="lg" label="Open alarms" value={WALL_ALARMS.length} tone="critical" status={{ tone: 'critical', label: '1 critical' }} />
      </div>
    </WallDisplayScreen>
  );
}

function WallDisplayStatusWord() {
  const state = runStateStatus('running');
  return (
    <WallDisplayScreen label="Plant status on a wall display">
      <p className="text-2xl text-muted-foreground">1st stage compressor · 23-KA-9101</p>
      <p className="flex items-center gap-6 text-8xl font-semibold tracking-tight">
        <WallDisplayShape tone={state.tone} shape={state.shape} className="size-16" />
        {state.label}
      </p>
      <p className="text-2xl tabular-nums text-muted-foreground">Since 9 Mar, 08:12 · 77 h on load</p>
    </WallDisplayScreen>
  );
}

function WallDisplayStatusAbnormal() {
  const state = runStateStatus('tripped');
  return (
    <WallDisplayScreen label="Tripped status on a wall display">
      <p className="text-2xl text-muted-foreground">Recompressor · 23-KA-9103</p>
      <p className={`flex items-center gap-6 text-8xl font-semibold tracking-tight ${TONE_TEXT[state.tone]}`}>
        <WallDisplayShape tone={state.tone} shape={state.shape} className="size-14" />
        {state.label}
      </p>
      <p className="text-2xl tabular-nums">High vibration · since 13:46 · 14 min</p>
    </WallDisplayScreen>
  );
}

function WallDisplayAllNormal() {
  return (
    <WallDisplayScreen label="All normal on a wall display">
      <div className="flex flex-col items-start gap-4">
        <IconCircleCheck aria-hidden="true" className={`size-20 ${TONE_TEXT.success}`} />
        <p className="text-6xl font-semibold tracking-tight">All normal</p>
        <p className="text-2xl text-muted-foreground">No open alarms. Every unit is running or on standby as planned.</p>
        <p className="text-xl tabular-nums text-muted-foreground">Last alarm cleared 3 d ago · updated 14:00</p>
      </div>
    </WallDisplayScreen>
  );
}

function WallDisplayStale() {
  return (
    <WallDisplayScreen label="Stale data on a wall display">
      <div className={`flex items-center gap-5 rounded-xl p-5 ${TONE_SURFACE.warning}`}>
        <IconPlugConnectedX aria-hidden="true" className="size-10 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-semibold">Data is 12 min old</p>
          <p className="text-xl">Connection to the plant lost at 13:48. Figures below are the last known values.</p>
        </div>
      </div>
      <div className="opacity-60">
        <BigStat size="lg" label="Gas export, last known" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} caption="As of 13:48" />
      </div>
    </WallDisplayScreen>
  );
}

function WallDisplayAreaBlocks() {
  return (
    <WallDisplayScreen label="Area status on a wall display">
      <WallDisplayAreas />
    </WallDisplayScreen>
  );
}

function WallDisplayAlarmRows() {
  return (
    <WallDisplayScreen label="Top three alarms on a wall display">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-3xl font-semibold">Top alarms</p>
        <p className="text-2xl tabular-nums text-muted-foreground">3 of {WALL_ALARMS.length} open</p>
      </div>
      <WallDisplayAlarmList alarms={WALL_TOP_ALARMS} />
    </WallDisplayScreen>
  );
}

function WallDisplayAlarmCount() {
  const rows = [
    { severity: 'critical', count: WALL_COUNTS.critical },
    { severity: 'high', count: WALL_COUNTS.high },
    { severity: 'medium', count: WALL_COUNTS.medium },
    { severity: 'low', count: WALL_COUNTS.low },
  ] as const;
  return (
    <WallDisplayScreen label="Alarm counts on a wall display">
      <ul aria-label="Open alarms by severity" className="flex flex-col gap-4">
        {rows.map((row) => {
          const severity = severityStatus(row.severity);
          return (
            <li key={row.severity} className={`flex items-center gap-4 ${row.count === 0 ? 'opacity-50' : ''}`}>
              <WallDisplayShape tone={severity.tone} shape={severity.shape} className="size-6" />
              <span className="flex-1 text-2xl">{severity.label}</span>
              <span className="text-5xl font-semibold tabular-nums">{row.count}</span>
            </li>
          );
        })}
      </ul>
    </WallDisplayScreen>
  );
}

function WallDisplayTrend() {
  return (
    <WallDisplayScreen label="Large trend on a wall display">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <p className="text-3xl font-semibold">Discharge pressure</p>
        <p className="flex items-baseline gap-3">
          <span className="text-6xl font-semibold tabular-nums tracking-tight">48.6</span>
          <span className="text-2xl text-muted-foreground">barg</span>
        </p>
      </div>
      <WallDisplayTrendChart />
      <p className="text-xl text-muted-foreground">Last 24 hours. The dashed line is the high limit of 52 barg.</p>
    </WallDisplayScreen>
  );
}

function WallDisplayShapeKey() {
  const rows = [
    { tone: 'success', shape: 'dot', label: 'Normal' },
    { tone: 'info', shape: 'ring', label: 'Standby' },
    { tone: 'warning', shape: 'square', label: 'Warning' },
    { tone: 'critical', shape: 'diamond', label: 'Critical' },
  ] as const;
  return (
    <WallDisplayScreen label="Status key on a wall display">
      <ul aria-label="Status key" className="flex flex-col gap-5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-5 text-3xl font-medium">
            <WallDisplayShape tone={row.tone} shape={row.shape} className="size-9" />
            {row.label}
          </li>
        ))}
      </ul>
    </WallDisplayScreen>
  );
}

function WallDisplayAlarmsControlRoom() {
  return (
    <WallDisplayScreen preset="control-room" label="Top alarms on a control room wall">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-3xl font-semibold">Top alarms</p>
        <p className="text-2xl tabular-nums text-muted-foreground">Gas compression · NK-23</p>
      </div>
      <WallDisplayAlarmList alarms={WALL_TOP_ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === 'nk-23')} />
    </WallDisplayScreen>
  );
}

function WallDisplayNoSignal() {
  return (
    <WallDisplayScreen label="No signal on a wall display">
      <BigStat size="lg" label="Bearing temperature" value={null} unit="°C" status={{ tone: 'critical', label: 'No signal' }} caption="40-TT-40015 · since 05:00" />
    </WallDisplayScreen>
  );
}

function WallDisplayClockStrip() {
  return (
    <WallDisplayScreen label="Clock and shift strip on a wall display">
      <WallDisplayClockRow />
    </WallDisplayScreen>
  );
}

function WallDisplayAndon() {
  return (
    <WallDisplayScreen label="Andon board for Line 3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <p className="text-3xl font-semibold">Line 3 · Stord workshop</p>
        <p className="text-2xl tabular-nums text-muted-foreground">Takt 45 s · {WALL_BUILT} of {WALL_PLANNED} built</p>
      </div>
      <ol aria-label="Stations in flow order" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {WALL_STATIONS.map((station) => {
          const status = stationStatus(station.state);
          const quiet = station.state === 'running';
          return (
            <li key={station.code} className={`flex min-w-0 flex-col gap-2 rounded-lg p-4 ${quiet ? 'bg-card-background' : TONE_SURFACE[status.tone]}`}>
              <p className="text-3xl font-semibold tabular-nums">{station.code}</p>
              <p className="flex items-center gap-2 text-xl font-medium">
                <WallDisplayShape tone={status.tone} shape={status.shape} className="size-4" />
                {status.label}
              </p>
              <p className="text-xl tabular-nums opacity-80">{station.detail ?? station.operation}</p>
            </li>
          );
        })}
      </ol>
    </WallDisplayScreen>
  );
}

function WallDisplayHourByHour() {
  return (
    <WallDisplayScreen label="Hour by hour board on a wall display">
      <p className="text-3xl font-semibold">Hour by hour</p>
      <table className="w-full text-left text-2xl tabular-nums">
        <thead>
          <tr className="text-xl text-muted-foreground">
            <th scope="col" className="pb-3 font-medium">
              Hour
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              Plan
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              Built
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {WALL_HOURS.slice(-5).map((row) => {
            const gap = row.actual - row.plan;
            const behind = gap <= -5;
            return (
              <tr key={row.hour} className="border-t border-default">
                <th scope="row" className="py-3 font-medium">
                  {row.hour}
                </th>
                <td className="py-3 text-right text-muted-foreground">{row.plan}</td>
                <td className="py-3 text-right font-semibold">{row.actual}</td>
                <td className={`py-3 text-right font-semibold ${behind ? TONE_TEXT.critical : 'text-muted-foreground'}`}>
                  {behind ? <span className="sr-only">Behind: </span> : null}
                  {gap > 0 ? `+${gap}` : formatValue(gap)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </WallDisplayScreen>
  );
}

function WallDisplayKpiControlRoom() {
  return (
    <WallDisplayScreen preset="control-room" label="Gas export on a control room wall">
      <BigStat size="xl" label="Gas export" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} status={{ tone: 'warning', label: '0.12 under plan' }} caption="Plan 4.50 · updated 14:00" />
    </WallDisplayScreen>
  );
}

function WallDisplayLayoutGrid() {
  return (
    <WallDisplayScreen label="Two by two wall layout">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WallDisplayPanel title="Gas export">
          <BigStat size="lg" label="Today" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} caption="Plan 4.50" />
        </WallDisplayPanel>
        <WallDisplayPanel title="Availability">
          <BigStat size="lg" label="This week" value={PLANT_KPIS.availability.value} unit="%" decimals={1} caption="Target 97.5" />
        </WallDisplayPanel>
        <WallDisplayPanel title="Top alarm">
          <WallDisplayAlarmList alarms={WALL_TOP_ALARMS.slice(0, 1)} />
        </WallDisplayPanel>
        <WallDisplayPanel title="Open alarms">
          <BigStat size="lg" label="All severities" value={WALL_ALARMS.length} tone="critical" status={{ tone: 'critical', label: '1 critical' }} />
        </WallDisplayPanel>
      </div>
    </WallDisplayScreen>
  );
}

function WallDisplayLayoutOnePlusThree() {
  return (
    <WallDisplayScreen label="One plus three wall layout">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WallDisplayPanel title="Discharge pressure · 23-PT-92531">
            <p className="flex items-baseline gap-3">
              <span className="text-8xl font-semibold tabular-nums tracking-tight">48.6</span>
              <span className="text-3xl text-muted-foreground">barg</span>
            </p>
            <WallDisplayTrendChart heightClassName="h-72" />
          </WallDisplayPanel>
        </div>
        <div className="flex flex-col gap-4 [&>*]:flex-1">
          <WallDisplayPanel title="Gas export">
            <BigStat size="lg" label="Today" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} />
          </WallDisplayPanel>
          <WallDisplayPanel title="Open alarms">
            <BigStat size="lg" label="All severities" value={WALL_ALARMS.length} tone="critical" />
          </WallDisplayPanel>
          <WallDisplayPanel title="Recompressor">
            <p className={`flex items-center gap-4 text-5xl font-semibold ${TONE_TEXT.critical}`}>
              <WallDisplayShape tone="critical" shape="diamond" className="size-8" />
              Tripped
            </p>
          </WallDisplayPanel>
        </div>
      </div>
    </WallDisplayScreen>
  );
}

function WallDisplayTextSizes() {
  return (
    <WallDisplayScreen label="Minimum text sizes for wall displays">
      <table className="w-full text-left">
        <caption className="pb-4 text-left text-2xl text-muted-foreground">Reading distance on a 55-inch display at 1080p. Nothing on a wall display is smaller than the last row.</caption>
        <thead>
          <tr className="text-xl text-muted-foreground">
            <th scope="col" className="pb-3 pr-6 font-medium">
              Sample
            </th>
            <th scope="col" className="w-36 pb-3 pr-6 font-medium">
              Class
            </th>
            <th scope="col" className="w-28 pb-3 pr-6 text-right font-medium">
              Reads from
            </th>
            <th scope="col" className="hidden w-80 pb-3 font-medium lg:table-cell">
              Use for
            </th>
          </tr>
        </thead>
        <tbody>
          {WALL_TEXT_SIZES.map((row) => (
            <tr key={row.name} className="border-t border-default align-baseline">
              <td className={`py-4 pr-6 tabular-nums tracking-tight ${row.className}`}>{row.sample}</td>
              <td className="py-4 pr-6 font-mono text-xl text-muted-foreground">{row.name}</td>
              <td className="py-4 pr-6 text-right text-2xl font-medium tabular-nums">{row.distance}</td>
              <td className="hidden py-4 text-xl text-muted-foreground lg:table-cell">{row.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </WallDisplayScreen>
  );
}

export default definePage({
  id: 'wall-displays',
  title: 'Wall displays',
  summary:
    'Components sized to be read from across a room: a few very large figures, status as a word and a shape, alarm rows in big type and layouts with no interaction. Shown in the wall-display theme, which is dark, spacious and high contrast.',
  guidance: {
    use: [
      'Decide the reading distance first; it sets the smallest text, and nothing goes below text-xl.',
      'Give a screen one job and three to six items. If people must walk up to read it, it is a dashboard.',
      'Say every state in a word with a shape; a wall display is often seen at an angle or in glare.',
      'Show the clock and the age of the data, and make stale data unmistakable.',
    ],
    avoid: [
      'Buttons, tooltips, hover and scrolling; nobody holds the mouse.',
      'Thin lines, dense axes and legends; a trend on a wall has one thick line and three ticks.',
      'Rotating screens for anything safety-related; what matters must always be on.',
      'Filling the whole screen with colour for a normal state.',
    ],
  },
  source,
  sections: [
    {
      id: 'figures',
      title: 'Giant figures',
      description: 'One number, its unit and at most one line of context.',
      specimens: [
        {
          id: 'WallDisplayGiantKpi',
          title: 'Giant KPI',
          note: 'Pick it for the one figure a room is steered by; it reads from about ten metres.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayGiantKpi,
        },
        {
          id: 'WallDisplayKpiWithStatus',
          title: 'KPI with status',
          note: 'Pick it when the figure is off target: the number takes the tone and the state is written under it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayKpiWithStatus,
        },
        {
          id: 'WallDisplayCounter',
          title: 'Production counter with target bar',
          note: 'Pick it on a shop floor: the count so far, where it should be by now and the share of the shift target.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayCounter,
        },
        {
          id: 'WallDisplayTakt',
          title: 'Cycle time against takt',
          note: 'Pick it above a station: the cycle time, and in words how far it is over or under takt.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayTakt,
        },
        {
          id: 'WallDisplayKpiRow',
          title: 'Row of three figures',
          note: 'Pick it as the top band of a wall screen; three is the most that stay legible side by side.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayKpiRow,
        },
      ],
    },
    {
      id: 'status',
      title: 'Status',
      description: 'The state of a unit, an area or the whole plant as a word and a shape.',
      specimens: [
        {
          id: 'WallDisplayStatusWord',
          title: 'Giant status word',
          note: 'Pick it for a single machine: the state as one word with its shape, neutral text while it is normal.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayStatusWord,
        },
        {
          id: 'WallDisplayStatusAbnormal',
          title: 'Abnormal status word',
          note: 'Pick it when the state itself is the alarm: the word takes the colour, with the cause and the time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayStatusAbnormal,
        },
        {
          id: 'WallDisplayAllNormal',
          title: 'All normal',
          note: 'Pick it for the quiet state of an alarm screen: calm, one check mark, and proof the screen is alive.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/ThemeScope.tsx'],
          Component: WallDisplayAllNormal,
        },
        {
          id: 'WallDisplayStale',
          title: 'Stale data warning',
          note: 'Pick it the moment the feed stops: a banner with the age, and the last values dimmed underneath.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayStale,
        },
        {
          id: 'WallDisplayAreaBlocks',
          title: 'Area status blocks',
          note: 'Pick it for a plant-wide wall: one block per area, tinted only where the area is not good.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayAreaBlocks,
        },
      ],
    },
    {
      id: 'alarms-and-trends',
      title: 'Alarms and trends',
      description: 'The top of the alarm list and one trend, at wall size.',
      specimens: [
        {
          id: 'WallDisplayAlarmRows',
          title: 'Big-type alarm rows',
          note: 'Pick it for the top three alarms: severity as shape and word, the message, the tag and the age.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/operations/alarms.ts', 'industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayAlarmRows,
        },
        {
          id: 'WallDisplayAlarmCount',
          title: 'Alarm counts',
          note: 'Pick it beside the alarm rows: four fixed positions, with empty severities dimmed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/operations/alarms.ts', 'industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayAlarmCount,
        },
        {
          id: 'WallDisplayTrend',
          title: 'Large trend',
          note: 'Pick it for the one measurement a room watches: a thick line, three value ticks and one limit.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['themes/ThemeScope.tsx'],
          Component: WallDisplayTrend,
        },
        {
          id: 'WallDisplayShapeKey',
          title: 'Status key',
          note: 'Pick it once per wall, so the four shapes are learned and never need a legend again.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/status.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayShapeKey,
        },
        {
          id: 'WallDisplayAlarmsControlRoom',
          title: 'Alarm rows, control room theme',
          note: 'Pick the control-room theme for a wall inside the control room, so it matches the consoles under it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/operations/alarms.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayAlarmsControlRoom,
        },
        {
          id: 'WallDisplayNoSignal',
          title: 'No signal',
          note: 'Pick it when a figure has no value: a dash, the reason in words and since when.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayNoSignal,
        },
      ],
    },
    {
      id: 'time-and-boards',
      title: 'Clock, shift and production boards',
      description: 'What a shop floor or control room wall shows all shift.',
      specimens: [
        {
          id: 'WallDisplayClockStrip',
          title: 'Clock and shift strip',
          note: 'Pick it along the top or bottom of every wall screen: time, shift, who leads it and that data is live.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/ThemeScope.tsx'],
          Component: WallDisplayClockStrip,
        },
        {
          id: 'WallDisplayAndon',
          title: 'Andon board',
          note: 'Pick it over a production line: every station in flow order, tinted only where the flow is broken.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/lines.ts', 'themes/ThemeScope.tsx'],
          Component: WallDisplayAndon,
        },
        {
          id: 'WallDisplayHourByHour',
          title: 'Hour-by-hour board',
          note: 'Pick it for a team that works to an hourly plan: plan, built and gap for the last hours.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/ThemeScope.tsx'],
          Component: WallDisplayHourByHour,
        },
        {
          id: 'WallDisplayKpiControlRoom',
          title: 'KPI, control room theme',
          note: 'Pick the control-room theme for figures on a control room wall: sharper, denser, same sizes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayKpiControlRoom,
        },
      ],
    },
    {
      id: 'layouts',
      title: 'Multi-panel layouts',
      description: 'Fixed layouts that show everything at once, with no rotation.',
      specimens: [
        {
          id: 'WallDisplayLayoutGrid',
          title: 'Two by two',
          note: 'Pick it for four items of equal weight; each quadrant holds one figure or one alarm.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayLayoutGrid,
        },
        {
          id: 'WallDisplayLayoutOnePlusThree',
          title: 'One plus three',
          note: 'Pick it when one trend leads: it takes two thirds, with three supporting panels stacked beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/analytics/BigStat.tsx', 'themes/ThemeScope.tsx'],
          Component: WallDisplayLayoutOnePlusThree,
        },
      ],
    },
    {
      id: 'guidance',
      title: 'Text size guidance',
      description: 'The type scale of a wall display against reading distance.',
      specimens: [
        {
          id: 'WallDisplayTextSizes',
          title: 'Minimum text sizes',
          note: 'Pick a row by how far away people stand; the last row is the floor for anything on a wall.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/ThemeScope.tsx'],
          Component: WallDisplayTextSizes,
        },
      ],
    },
  ],
});
