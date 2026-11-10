import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendEvent } from '../../../library/industrial/charts/TrendChart';
import { formatValue, runStateStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, RunState, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ConditionList } from '../../../library/industrial/workflows/ConditionList';
import type { Condition } from '../../../library/industrial/workflows/ConditionList';
import { LogEntry } from '../../../library/industrial/workflows/LogEntry';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, childrenOf, findAsset } from '../../data/plant';
import type { Asset } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './control-room-console.tsx?raw';

type ConsoleReading = { label: string; value: number | null; unit: string; decimals: number; limits: Limits };

type ConsoleScale = { domain: readonly [number, number]; ticks: readonly number[]; high: number };

type ConsoleUnit = {
  assetId: string;
  /** One line on what the machine is doing. */
  duty: string;
  readings: readonly ConsoleReading[];
  pressure: readonly SeriesPoint[];
  temperature: readonly SeriesPoint[];
  pressureScale: ConsoleScale;
  temperatureScale: ConsoleScale;
  /** Time of the trip, when the unit is down. */
  trippedAt?: number;
  conditions: readonly Condition[];
};

type ConsoleRange = '2h' | '8h';

const CONSOLE_STEP = 10 * MINUTE;

const CONSOLE_POINTS = 49;

const CONSOLE_TRIP_AT = REFERENCE_NOW - 14 * MINUTE;

/** A unit that tripped: readings fall away after the trip instead of following the generated trend. */
function consoleAfterTrip(points: readonly SeriesPoint[], trippedAt: number, settled: number): SeriesPoint[] {
  return points.map((point) => {
    if (point.t <= trippedAt) return point;
    const steps = Math.round((point.t - trippedAt) / CONSOLE_STEP) + 1;
    return { t: point.t, v: Math.round((settled + (point.v - settled) / (steps * 3)) * 10) / 10 };
  });
}

const CONSOLE_UNITS: readonly ConsoleUnit[] = [
  {
    assetId: '23-ka-9101',
    duty: 'On load, 82% speed',
    readings: [
      { label: 'Suction pressure', value: 12.4, unit: 'barg', decimals: 1, limits: { low: 10, high: 15 } },
      { label: 'Discharge pressure', value: 48.6, unit: 'barg', decimals: 1, limits: { low: 40, high: 52, highHigh: 55 } },
      { label: 'Discharge temperature', value: 141.2, unit: '°C', decimals: 1, limits: { high: 145, highHigh: 155 } },
      { label: 'Drive-end vibration', value: 6.8, unit: 'mm/s', decimals: 1, limits: { high: 7.1, highHigh: 11 } },
      { label: 'Shaft speed', value: 9840, unit: 'rpm', decimals: 0, limits: { low: 7000, high: 10500 } },
    ],
    pressure: makeSeries({ seed: 11, points: CONSOLE_POINTS, base: 48.4, amplitude: 1.1, noise: 0.35, cycles: 1.5, stepMs: CONSOLE_STEP }),
    temperature: makeSeries({ seed: 13, points: CONSOLE_POINTS, base: 137.5, amplitude: 2.2, noise: 0.9, drift: 5, cycles: 1.2, stepMs: CONSOLE_STEP }),
    pressureScale: { domain: [40, 56], ticks: [40, 44, 48, 52, 56], high: 52 },
    temperatureScale: { domain: [120, 152], ticks: [120, 128, 136, 144, 152], high: 145 },
    conditions: [
      { id: 'lube', label: 'Lube oil pressure established', detail: '23-PT-92510 · 2.6 barg, minimum 1.8', state: 'met' },
      { id: 'seal', label: 'Seal gas differential pressure', detail: '23-PDT-92522 · 3.4 bar, minimum 2.0', state: 'met' },
      { id: 'suction', label: 'Suction valve open', detail: '23-XV-92501 · open', state: 'met' },
      { id: 'vibration', label: 'Vibration trip healthy', detail: '23-VT-92540 · 6.8 mm/s, trip 11.0', state: 'met' },
      { id: 'temperature', label: 'Discharge temperature interlock', detail: '23-TT-92532 · 141.2 °C, trip 155.0', state: 'met' },
    ],
  },
  {
    assetId: '23-ka-9102',
    duty: 'On load, 82% speed',
    readings: [
      { label: 'Suction pressure', value: 47.9, unit: 'barg', decimals: 1, limits: { low: 40, high: 52 } },
      { label: 'Discharge pressure', value: 118.4, unit: 'barg', decimals: 1, limits: { low: 100, high: 125, highHigh: 130 } },
      { label: 'Discharge temperature', value: 132.6, unit: '°C', decimals: 1, limits: { high: 145, highHigh: 155 } },
      { label: 'Drive-end vibration', value: 3.9, unit: 'mm/s', decimals: 1, limits: { high: 7.1, highHigh: 11 } },
      { label: 'Shaft speed', value: 9840, unit: 'rpm', decimals: 0, limits: { low: 7000, high: 10500 } },
    ],
    pressure: makeSeries({ seed: 31, points: CONSOLE_POINTS, base: 118.2, amplitude: 1.8, noise: 0.6, cycles: 1.5, stepMs: CONSOLE_STEP }),
    temperature: makeSeries({ seed: 33, points: CONSOLE_POINTS, base: 132, amplitude: 1.6, noise: 0.7, cycles: 1.2, stepMs: CONSOLE_STEP }),
    pressureScale: { domain: [100, 132], ticks: [100, 108, 116, 124, 132], high: 125 },
    temperatureScale: { domain: [120, 152], ticks: [120, 128, 136, 144, 152], high: 145 },
    conditions: [
      { id: 'lube', label: 'Lube oil pressure established', detail: '23-PT-92610 · 2.5 barg, minimum 1.8', state: 'met' },
      { id: 'seal', label: 'Seal gas differential pressure', detail: '23-PDT-92622 · 3.2 bar, minimum 2.0', state: 'met' },
      { id: 'suction', label: 'Suction valve open', detail: '23-XV-92601 · open', state: 'met' },
      { id: 'vibration', label: 'Vibration trip healthy', detail: '23-VT-92640 · 3.9 mm/s, trip 11.0', state: 'met' },
      { id: 'temperature', label: 'Discharge temperature interlock', detail: '23-TT-92632 · 132.6 °C, trip 155.0', state: 'met' },
    ],
  },
  {
    assetId: '23-ka-9103',
    duty: 'Tripped 13:46, isolated',
    readings: [
      { label: 'Suction pressure', value: 2.1, unit: 'barg', decimals: 1, limits: {} },
      { label: 'Discharge pressure', value: 2.3, unit: 'barg', decimals: 1, limits: { high: 18, highHigh: 20 } },
      { label: 'Discharge temperature', value: 34, unit: '°C', decimals: 1, limits: { high: 120, highHigh: 130 } },
      { label: 'Drive-end vibration', value: null, unit: 'mm/s', decimals: 1, limits: { high: 7.1, highHigh: 11 } },
      { label: 'Shaft speed', value: 0, unit: 'rpm', decimals: 0, limits: {} },
    ],
    pressure: consoleAfterTrip(
      makeSeries({ seed: 51, points: CONSOLE_POINTS, base: 15.6, amplitude: 0.8, noise: 0.3, cycles: 1.5, stepMs: CONSOLE_STEP }),
      CONSOLE_TRIP_AT,
      2.3
    ),
    temperature: consoleAfterTrip(
      makeSeries({ seed: 53, points: CONSOLE_POINTS, base: 96, amplitude: 3, noise: 1.2, drift: 6, cycles: 1.2, stepMs: CONSOLE_STEP }),
      CONSOLE_TRIP_AT,
      34
    ),
    pressureScale: { domain: [0, 24], ticks: [0, 6, 12, 18, 24], high: 18 },
    temperatureScale: { domain: [20, 140], ticks: [20, 50, 80, 110, 140], high: 120 },
    trippedAt: CONSOLE_TRIP_AT,
    conditions: [
      { id: 'lube', label: 'Lube oil pressure established', detail: '23-PT-92710 · 2.4 barg, minimum 1.8', state: 'met' },
      { id: 'seal', label: 'Seal gas differential pressure', detail: '23-PDT-92722 · 3.1 bar, minimum 2.0', state: 'met' },
      { id: 'suction', label: 'Suction valve open', detail: '23-XV-92701 · closed by trip logic', state: 'unmet' },
      { id: 'vibration', label: 'Vibration trip reset', detail: '23-VT-92740 · latched at 11.6 mm/s', state: 'unmet' },
      { id: 'temperature', label: 'Bearing temperature interlock', detail: 'Bypassed by Liv Wold until 18:00', state: 'bypassed' },
    ],
  },
];

/** Area flow is the same whichever machine is selected; it closes the readings strip. */
const CONSOLE_FLOW: ConsoleReading = { label: 'Gas flow, area', value: 182.4, unit: 'kSm³/h', decimals: 1, limits: { low: 120, high: 210 } };

const CONSOLE_ALARMS = ALARMS.filter(
  (alarm) => (alarm.state === 'active' || alarm.state === 'acknowledged') && findAsset(alarm.assetId)?.parentId === 'nk-23'
);

type ConsoleAuxiliary = { tag: string; name: string; state: RunState };

/** Everything in the area that is not a compressor: plant-model units first, then auxiliaries. */
const CONSOLE_AUXILIARIES: readonly ConsoleAuxiliary[] = [
  ...childrenOf('nk-23')
    .filter((asset) => asset.type !== 'compressor')
    .map((asset) => ({ tag: asset.tag, name: asset.name, state: asset.state })),
  { tag: '23-PA-9120A', name: 'Lube oil pump A', state: 'running' },
  { tag: '23-PA-9120B', name: 'Lube oil pump B', state: 'standby' },
  { tag: '23-KA-9130', name: 'Seal gas booster', state: 'running' },
];

const CONSOLE_FOCUS = 'focus-visible:shadow-focus-ring focus-visible:outline-none';

function consoleUnit(assetId: string): ConsoleUnit {
  return CONSOLE_UNITS.find((unit) => unit.assetId === assetId) ?? CONSOLE_UNITS[0];
}

function consoleAsset(assetId: string): Pick<Asset, 'tag' | 'name' | 'state'> {
  return findAsset(assetId) ?? { tag: assetId, name: assetId, state: 'stopped' };
}

function consoleLimitState(reading: ConsoleReading): { tone: Tone; label: string } {
  if (reading.value === null) return { tone: 'neutral', label: 'No signal' };
  const tone = toneFromLimits(reading.value, reading.limits);
  if (tone === 'critical') return { tone, label: 'At trip limit' };
  if (tone === 'warning') return { tone, label: 'Outside limits' };
  return { tone: 'neutral', label: reading.limits.high === undefined ? 'No limit set' : 'In limits' };
}

function consoleLimitText(reading: ConsoleReading): string {
  const { low, high } = reading.limits;
  if (low !== undefined && high !== undefined) return `${formatValue(low, 0)} to ${formatValue(high, Number.isInteger(high) ? 0 : 1)}`;
  if (high !== undefined) return `High ${formatValue(high, Number.isInteger(high) ? 0 : 1)}`;
  return '';
}

function consoleExtent(points: readonly SeriesPoint[]): readonly [number, number] {
  const values = points.map((point) => point.v);
  return [Math.min(...values), Math.max(...values)];
}

function ConsoleReadingsStrip({ unitId }: { unitId: string }) {
  const unit = consoleUnit(unitId);
  const asset = consoleAsset(unit.assetId);
  return (
    <DashboardPanel title="Live readings" description={`${asset.tag} · ${asset.name} · sampled 14:00:00 UTC`}>
      <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 xl:grid-cols-6">
        {[...unit.readings, CONSOLE_FLOW].map((reading) => {
          const state = consoleLimitState(reading);
          return (
            <div key={reading.label} className="flex min-w-0 flex-col gap-2 border-l border-default pl-3">
              <dt className="text-xs text-muted-foreground">{reading.label}</dt>
              <dd className="flex flex-col gap-2">
                <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} size="md" tone={state.tone} />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusIndicator tone={state.tone} label={state.label} shape={state.tone === 'neutral' ? 'ring' : 'diamond'} size="sm" />
                  {consoleLimitText(reading) ? (
                    <span className="text-xs tabular-nums text-muted-foreground">{consoleLimitText(reading)}</span>
                  ) : null}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </DashboardPanel>
  );
}

function ConsoleCompressorRail({ unitId, onSelect }: { unitId: string; onSelect: (unitId: string) => void }) {
  return (
    <DashboardPanel title="Compressor train" description="Select a machine to load it">
      <ul className="flex w-full flex-col gap-2">
        {CONSOLE_UNITS.map((unit) => {
          const asset = consoleAsset(unit.assetId);
          const selected = unit.assetId === unitId;
          const discharge = unit.readings[1];
          const vibration = unit.readings[3];
          return (
            <li key={unit.assetId}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(unit.assetId)}
                className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left ${CONSOLE_FOCUS} ${
                  selected ? 'border-emphasized bg-base-background' : 'border-transparent hover:bg-muted-background'
                }`}
              >
                <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-muted-foreground">{asset.tag}</span>
                  <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
                </span>
                <span className="text-sm font-medium text-base-foreground">{asset.name}</span>
                <span className="text-xs text-muted-foreground">{unit.duty}</span>
                <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <ValueReadout value={discharge.value} unit={discharge.unit} decimals={discharge.decimals} size="xs" />
                  <ValueReadout value={vibration.value} unit={vibration.unit} decimals={vibration.decimals} size="xs" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleAuxiliariesPanel() {
  return (
    <DashboardPanel title="Equipment run states" description="Driver, cooler and auxiliaries">
      <ul className="flex w-full flex-col gap-3">
        {CONSOLE_AUXILIARIES.map((unit) => (
          <li key={unit.tag} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="text-sm text-base-foreground">{unit.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{unit.tag}</p>
            </div>
            <StatusIndicator {...runStateStatus(unit.state)} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleTrendCanvas({ unitId }: { unitId: string }) {
  const [range, setRange] = useState<ConsoleRange>('8h');
  const unit = consoleUnit(unitId);
  const asset = consoleAsset(unit.assetId);
  const count = range === '8h' ? CONSOLE_POINTS : 13;
  const pressure = unit.pressure.slice(-count);
  const temperature = unit.temperature.slice(-count);
  const [pressureLow, pressureHigh] = consoleExtent(pressure);
  const temperaturePeak = consoleExtent(temperature)[1];
  const hours = range === '8h' ? 8 : 2;
  const events: TrendEvent[] = unit.trippedAt === undefined ? [] : [{ t: unit.trippedAt, label: 'Trip', tone: 'critical' }];

  return (
    <DashboardPanel
      title="Discharge trend"
      description={`${asset.tag} · pressure and temperature against their high limits`}
      actions={
        <SegmentedControl value={range} onValueChange={(value) => setRange(value === '2h' ? '2h' : '8h')}>
          <SegmentedControlList size="small" aria-label="Trend range">
            <SegmentedControlButton value="2h">2 h</SegmentedControlButton>
            <SegmentedControlButton value="8h">8 h</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
      footnote={`Last ${hours} hours: pressure between ${formatValue(pressureLow, 1)} and ${formatValue(pressureHigh, 1)} barg against a high limit of ${unit.pressureScale.high}; temperature peaked at ${formatValue(temperaturePeak, 1)} °C against ${unit.temperatureScale.high}.${unit.trippedAt === undefined ? '' : ' The unit tripped at 13:46 and both readings fell away.'}`}
    >
      <TrendChart
        legend
        label={`Discharge pressure in barg on the left axis and discharge temperature in degrees Celsius on the right axis for ${asset.name} over the last ${hours} hours, each with its high limit`}
        series={[
          { key: 'pressure', label: 'Discharge pressure (barg, left)', points: pressure },
          { key: 'temperature', label: 'Discharge temperature (°C, right)', points: temperature, axis: 'right' },
        ]}
        limits={[
          { value: unit.pressureScale.high, label: `High ${unit.pressureScale.high} barg`, tone: 'warning', align: 'left' },
          { value: unit.temperatureScale.high, label: `High ${unit.temperatureScale.high} °C`, tone: 'warning', axis: 'right', align: 'right' },
        ]}
        events={events}
        yDomain={unit.pressureScale.domain}
        yTicks={unit.pressureScale.ticks}
        rightDomain={unit.temperatureScale.domain}
        unit="barg"
        rightUnit="°C"
        maxTicks={5}
        heightClassName="h-72"
      />
    </DashboardPanel>
  );
}

function ConsoleShiftNotePanel() {
  return (
    <DashboardPanel title="Shift note" description="Day shift, latest entry first">
      <LogEntry
        time="13:52"
        author="Ingrid Haugen"
        category="operations"
        links={[
          { kind: 'asset', label: '23-KA-9103' },
          { kind: 'work-order', label: 'WO-104482' },
        ]}
      >
        Recompressor tripped on drive-end vibration at 13:46. Unit isolated and depressurised. Do not restart before the
        bearing inspection is closed.
      </LogEntry>
      <LogEntry time="06:10" author="Liv Wold" category="safety" pinned>
        Keep 1st stage discharge temperature under 145 °C. Reduce load before the high alarm stands for 30 minutes.
      </LogEntry>
    </DashboardPanel>
  );
}

function ConsoleAlarmsPanel({ unitId }: { unitId: string }) {
  const onUnit = CONSOLE_ALARMS.filter((alarm) => alarm.assetId === unitId).length;
  return (
    <DashboardPanel title="Standing alarms" description={`${CONSOLE_ALARMS.length} in the area · ${onUnit} on the selected machine`}>
      <ul className="flex w-full flex-col gap-4">
        {CONSOLE_ALARMS.map((alarm) => (
          <li
            key={alarm.id}
            data-selected={alarm.assetId === unitId ? 'true' : undefined}
            className={`flex min-w-0 flex-col gap-1 border-l-2 pl-3 ${alarm.assetId === unitId ? 'border-emphasized' : 'border-transparent'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" detail={alarm.state === 'active' ? 'unacknowledged' : 'acknowledged'} />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
            </div>
            <p className="text-sm text-base-foreground">{alarm.message}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{alarm.sensorTag}</span> · <span className="tabular-nums">{alarm.value}</span> · limit{' '}
              <span className="tabular-nums">{alarm.limit}</span>
            </p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleConditionsPanel({ unitId }: { unitId: string }) {
  const unit = consoleUnit(unitId);
  const asset = consoleAsset(unit.assetId);
  const healthy = unit.conditions.filter((condition) => condition.state === 'met').length;
  return (
    <DashboardPanel
      title="Permissives and interlocks"
      description={`${asset.tag} · ${healthy} of ${unit.conditions.length} healthy`}
    >
      <ConditionList
        label={`Start permissives and interlocks, ${asset.tag}`}
        conditions={unit.conditions}
        stateLabels={{ met: 'Healthy', unmet: 'Not healthy' }}
      />
    </DashboardPanel>
  );
}

/**
 * Archetype: ticker/strip console — a readings strip across the top, then a left rail, a centre
 * canvas and a right rail.
 * Dominant element: the centre trend canvas of the selected compressor.
 * Interaction: selecting a compressor in the left rail reloads the strip, the trend, the alarm
 * marks and the permissives; the trend switches between 2 h and 8 h.
 */
function ConsoleDashboard() {
  const [unitId, setUnitId] = useState('23-ka-9103');
  const rail = 'flex min-w-0 flex-col gap-4 [&>*:last-child]:flex-1';

  return (
    <DashboardFrame
      title="Control room console"
      subtitle="Gas compression · NK-23 · updated 14:00 UTC"
      status={<StatusIndicator tone="critical" shape="diamond" label="1 unit tripped" detail="recompressor" />}
    >
      <div className="flex flex-col gap-4">
        <ConsoleReadingsStrip unitId={unitId} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,10fr)_minmax(0,7fr)]">
          <div className={rail}>
            <ConsoleCompressorRail unitId={unitId} onSelect={setUnitId} />
            <ConsoleAuxiliariesPanel />
          </div>
          <div className={`${rail} md:order-last md:col-span-2 xl:order-none xl:col-span-1`}>
            <ConsoleTrendCanvas unitId={unitId} />
            <ConsoleShiftNotePanel />
          </div>
          <div className={rail}>
            <ConsoleAlarmsPanel unitId={unitId} />
            <ConsoleConditionsPanel unitId={unitId} />
          </div>
        </div>
      </div>
    </DashboardFrame>
  );
}

function ControlConsoleSignature() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleTerminal() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleReadings() {
  return <ConsoleReadingsStrip unitId="23-ka-9101" />;
}

function ControlConsoleTrain() {
  const [unitId, setUnitId] = useState('23-ka-9101');
  return <ConsoleCompressorRail unitId={unitId} onSelect={setUnitId} />;
}

function ControlConsoleTrend() {
  return <ConsoleTrendCanvas unitId="23-ka-9101" />;
}

function ControlConsoleAlarms() {
  return <ConsoleAlarmsPanel unitId="23-ka-9101" />;
}

function ControlConsolePermissives() {
  return <ConsoleConditionsPanel unitId="23-ka-9103" />;
}

function ControlConsoleRunStates() {
  return <ConsoleAuxiliariesPanel />;
}

function ControlConsoleShiftNote() {
  return <ConsoleShiftNotePanel />;
}

export default definePage({
  id: 'control-room-console',
  title: 'Control room console',
  summary:
    'The dense operator view of one process area: a strip of live readings, a rail of machines to pick from, the selected machine on a trend canvas, and what is alarming or blocking a restart beside it.',
  guidance: {
    use: [
      'For one process area an operator is responsible for, on a console that stays open all shift.',
      'When the operator works one machine at a time: selecting it loads its readings, trend and permissives.',
      'Print every reading with its limit state in words, so "in limits" never depends on colour.',
      'Lead with the abnormal: the tripped unit is named beside the title and selected on load.',
    ],
    avoid: [
      'Plant-wide KPIs and production totals — those belong on the plant overview.',
      'Colour on readings that are inside their limits; the console stays neutral until something is wrong.',
      'More than two tags on the trend canvas; switch machine or range instead.',
      'Controls that change the process. The console shows state; commands go through the control system.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Control room theme: dark, compact, sharp and high contrast. A readings strip over three columns; select a compressor on the left to load it.',
      specimens: [
        {
          id: 'ControlConsoleSignature',
          title: 'Control room console',
          note: 'Pick it for the operator seat of one process area, where density matters more than white space.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/workflows/ConditionList.tsx',
            'industrial/workflows/LogEntry.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ControlConsoleSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same console, unchanged, in three more presets.',
      specimens: [
        {
          id: 'ControlConsoleAura',
          title: 'Aura',
          note: 'Pick it for an engineering office in daylight, where the console sits beside other Aura apps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleAura,
        },
        {
          id: 'ControlConsoleTerminal',
          title: 'Terminal',
          note: 'Pick it when tags and readings dominate and a monospaced face keeps every digit aligned.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleTerminal,
        },
        {
          id: 'ControlConsoleNordicNight',
          title: 'Nordic night',
          note: 'Pick it for a softer dark console with default spacing, for rooms that are dim but not dark.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleNordicNight,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'ControlConsoleReadings',
          title: 'Live readings strip',
          note: 'Pick it across the top when six or so measurements must be read in one sweep, each with its limit state.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: ControlConsoleReadings,
        },
        {
          id: 'ControlConsoleTrain',
          title: 'Machine rail',
          note: 'Pick it as the left rail when two to five machines share one detail view.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: ControlConsoleTrain,
        },
        {
          id: 'ControlConsoleTrend',
          title: 'Trend canvas',
          note: 'Pick it for the two tags that explain each other, each drawn against its own limit, with a range switch.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: ControlConsoleTrend,
        },
        {
          id: 'ControlConsoleAlarms',
          title: 'Standing alarms',
          note: 'Pick it for a narrow rail: each alarm wraps instead of cutting its message short.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ControlConsoleAlarms,
        },
        {
          id: 'ControlConsolePermissives',
          title: 'Permissives and interlocks',
          note: 'Pick it when the operator needs to see what blocks a start, and what has been bypassed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/ConditionList.tsx'],
          Component: ControlConsolePermissives,
        },
        {
          id: 'ControlConsoleRunStates',
          title: 'Equipment run states',
          note: 'Pick it to list the auxiliaries of an area with their run state, one per line.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ControlConsoleRunStates,
        },
        {
          id: 'ControlConsoleShiftNote',
          title: 'Shift note',
          note: 'Pick it to keep the latest log entry and the standing instruction in the operator’s view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/LogEntry.tsx'],
          Component: ControlConsoleShiftNote,
        },
      ],
    },
  ],
});
