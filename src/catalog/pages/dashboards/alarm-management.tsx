import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconBellRinging,
  IconCheck,
  IconCircleCheck,
  IconInfoCircle,
  IconPlayerPause,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AlarmTable, type AlarmRowEmphasis, type AlarmTableColumn } from '../../../library/kit/alarm-management/AlarmTable';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { Panel } from '../../../library/kit/Panel';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { TagId } from '../../../library/kit/TagId';
import { cx, type Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import type { Severity } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './alarm-management.tsx?raw';

type AmState = 'unacknowledged' | 'acknowledged' | 'shelved';

type AmArea = 'Compression' | 'Inlet' | 'Export' | 'Utilities';

type AmAlarm = {
  id: string;
  severity: Severity;
  tag: string;
  message: string;
  area: AmArea;
  state: AmState;
  raisedAt: number;
  /** The reading now and the setting it crossed, in `unit`. */
  value: number;
  limit: number;
  unit: string;
  decimals: number;
  /** `high` alarms trip above the limit, `low` below. */
  direction: 'high' | 'low';
  /** Where the reading sat an hour ago. */
  from: number;
  /** Annunciations in the last 24 hours. */
  count: number;
  response: string;
  consequence: string;
  setting: string;
  seed: number;
};

const AM_ALARMS: readonly AmAlarm[] = [
  { id: 'a4812', severity: 'critical', tag: '23-VT-92740', message: 'Recompressor vibration high-high', area: 'Compression', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 14 * MINUTE, value: 11.6, limit: 11, unit: 'mm/s', decimals: 1, direction: 'high', from: 6.2, count: 3, response: 'Confirm the trip, keep the unit isolated and call the rotating equipment engineer before any restart.', consequence: 'Bearing damage within minutes if the machine is restarted against the trip.', setting: 'High-high 11.0 mm/s · deadband 0.2 · no delay', seed: 301 },
  { id: 'a4813', severity: 'high', tag: '23-XS-92700', message: 'Recompressor tripped on vibration', area: 'Compression', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 14 * MINUTE + 2000, value: 0, limit: 7000, unit: 'rpm', decimals: 0, direction: 'low', from: 9820, count: 1, response: 'Route flash gas to flare and reduce inlet rate to the two-stage capacity.', consequence: 'Flaring above the daily limit until the recompressor is back.', setting: 'Trip status · first-out latch', seed: 302 },
  { id: 'a4815', severity: 'high', tag: '43-FT-4310', message: 'Flare flow high', area: 'Utilities', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 13 * MINUTE, value: 18.2, limit: 15, unit: 'kSm³/d', decimals: 1, direction: 'high', from: 11.8, count: 2, response: 'Check the flash gas route and trim the inlet choke until flare flow is under 15 kSm³/d.', consequence: 'A reportable exceedance if the daily average stays above the permit.', setting: 'High 15.0 kSm³/d · deadband 0.5 · delay 30 s', seed: 303 },
  { id: 'a4811', severity: 'high', tag: '23-TT-92532', message: 'Discharge temperature high', area: 'Compression', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 38 * MINUTE, value: 146.3, limit: 145, unit: '°C', decimals: 1, direction: 'high', from: 139.4, count: 9, response: 'Open the interstage cooler bypass fully and check cooling water flow.', consequence: 'Trip at 155 °C takes the 1st stage compressor and export down.', setting: 'High 145.0 °C · deadband 0.5 · no delay', seed: 304 },
  { id: 'a4816', severity: 'medium', tag: '23-PT-92530', message: 'Suction pressure low', area: 'Compression', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 12 * MINUTE, value: 9.8, limit: 10, unit: 'barg', decimals: 1, direction: 'low', from: 12.4, count: 4, response: 'Expected after the trip. Watch the anti-surge valve and let the pressure recover.', consequence: 'Surge on the 1st stage if it falls below 8 barg.', setting: 'Low 10.0 barg · deadband 0.2 · delay 5 s', seed: 305 },
  { id: 'a4817', severity: 'medium', tag: '27-FT-20011', message: 'Export flow low', area: 'Export', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 11 * MINUTE, value: 296, limit: 300, unit: 'm³/h', decimals: 0, direction: 'low', from: 412, count: 2, response: 'A consequence of the reduced rate. No action unless it falls below 250 m³/h.', consequence: 'Minimum flow protection opens and the pump recycles.', setting: 'Low 300 m³/h · deadband 5 · delay 10 s', seed: 306 },
  { id: 'a4818', severity: 'low', tag: '23-PDT-92512', message: 'Suction strainer pressure drop high', area: 'Compression', state: 'unacknowledged', raisedAt: REFERENCE_NOW - 9 * MINUTE, value: 0.42, limit: 0.4, unit: 'bar', decimals: 2, direction: 'high', from: 0.31, count: 1, response: 'Raise a work order to inspect the strainer at the next opportunity.', consequence: 'Reduced suction pressure margin over the coming days.', setting: 'High 0.40 bar · deadband 0.02 · delay 60 s', seed: 307 },
  { id: 'a4809', severity: 'high', tag: '23-VT-92540', message: 'Drive-end vibration approaching limit', area: 'Compression', state: 'acknowledged', raisedAt: REFERENCE_NOW - 2 * HOUR, value: 6.8, limit: 7.1, unit: 'mm/s', decimals: 1, direction: 'high', from: 6.1, count: 6, response: 'Hold the load steady and trend the reading every 15 minutes.', consequence: 'High alarm at 7.1 mm/s, trip at 11.0 mm/s.', setting: 'Pre-alarm 6.5 mm/s · deadband 0.1 · delay 5 s', seed: 308 },
  { id: 'a4806', severity: 'medium', tag: '23-TT-91141', message: 'Cooler outlet temperature high', area: 'Compression', state: 'acknowledged', raisedAt: REFERENCE_NOW - 5 * HOUR, value: 40.8, limit: 40, unit: '°C', decimals: 1, direction: 'high', from: 39.6, count: 14, response: 'Tube bundle is fouled. Cleaning is planned on WO-104471; keep the bypass closed.', consequence: 'Higher discharge temperature on the 2nd stage.', setting: 'High 40.0 °C · deadband 0.5 · delay 10 s', seed: 309 },
  { id: 'a4808', severity: 'medium', tag: '20-LT-10012', message: 'Separator level deviation', area: 'Inlet', state: 'acknowledged', raisedAt: REFERENCE_NOW - 166 * MINUTE, value: 71.2, limit: 70, unit: '%', decimals: 1, direction: 'high', from: 58.4, count: 22, response: 'Slugging from the inlet. Put the level controller in slug mode until the flow settles.', consequence: 'Liquid carry-over to compression above 85 %.', setting: 'Deviation ±15 % · deadband 1 · no delay', seed: 310 },
  { id: 'a4807', severity: 'medium', tag: '27-IT-20013', message: 'Motor current high', area: 'Export', state: 'acknowledged', raisedAt: REFERENCE_NOW - 209 * MINUTE, value: 96.4, limit: 95, unit: 'A', decimals: 1, direction: 'high', from: 86.2, count: 5, response: 'Follows export flow during upsets. Check again when the rate is steady.', consequence: 'Overload trip at 105 A.', setting: 'High 95.0 A · deadband 1.0 · delay 5 s', seed: 311 },
  { id: 'a4805', severity: 'low', tag: '20-PT-10010', message: 'Separator pressure low', area: 'Inlet', state: 'acknowledged', raisedAt: REFERENCE_NOW - 320 * MINUTE, value: 10.9, limit: 11, unit: 'barg', decimals: 1, direction: 'low', from: 13.1, count: 9, response: 'Consequential to the level upset. No action.', consequence: 'None on its own.', setting: 'Low 11.0 barg · deadband 0.2 · delay 5 s', seed: 312 },
  { id: 'a4804', severity: 'low', tag: '41-TT-4105', message: 'Hot oil return temperature low', area: 'Utilities', state: 'acknowledged', raisedAt: REFERENCE_NOW - 405 * MINUTE, value: 148, limit: 150, unit: '°C', decimals: 0, direction: 'low', from: 163, count: 2, response: 'Raise the heater outlet setpoint by 5 °C.', consequence: 'Poorer condensate stabilisation.', setting: 'Low 150 °C · deadband 2 · delay 60 s', seed: 313 },
  { id: 'a4790', severity: 'low', tag: '27-PA-2001B', message: 'Export pump B standby test overdue', area: 'Export', state: 'acknowledged', raisedAt: REFERENCE_NOW - 22 * HOUR, value: 34, limit: 30, unit: 'd', decimals: 0, direction: 'high', from: 34, count: 1, response: 'Run the standby start test on WO-104458.', consequence: 'Unproven standby pump.', setting: 'Interval 30 d', seed: 314 },
  { id: 'a4803', severity: 'medium', tag: '40-TT-40015', message: 'Bearing temperature signal lost', area: 'Utilities', state: 'shelved', raisedAt: REFERENCE_NOW - 9 * HOUR, value: 0, limit: 20, unit: '°C', decimals: 1, direction: 'low', from: 61.5, count: 31, response: 'Transmitter fails intermittently. Replacement is planned on WO-104479; shelved until 18:00.', consequence: 'No bearing protection on the cooling water pump while shelved.', setting: 'Bad quality · no deadband · no delay', seed: 315 },
  { id: 'a4801', severity: 'low', tag: '45-LT-4502', message: 'Instrument air receiver drain level high', area: 'Utilities', state: 'shelved', raisedAt: REFERENCE_NOW - 436 * MINUTE, value: 62, limit: 60, unit: '%', decimals: 0, direction: 'high', from: 55, count: 12, response: 'Drain trap is blocked. Drain manually once per shift; shelved until the trap is replaced.', consequence: 'Water in the instrument air header.', setting: 'High 60 % · deadband 2 · delay 30 s', seed: 316 },
];

const AM_SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const AM_STATE_ORDER: Record<AmState, number> = { unacknowledged: 0, acknowledged: 1, shelved: 2 };

const AM_SEVERITY_TONE: Record<Severity, Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const AM_SEVERITY_LABEL: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const AM_SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const AM_STATE_LABEL: Record<AmState, string> = { unacknowledged: 'Unacknowledged', acknowledged: 'Acknowledged', shelved: 'Shelved' };

const AM_STATE_SHORT: Record<AmState, string> = { unacknowledged: 'Waiting', acknowledged: 'Acked', shelved: 'Shelved' };

const AM_EMPHASIS: Record<AmState, AlarmRowEmphasis> = { unacknowledged: 'band', acknowledged: 'edge', shelved: 'quiet' };

/** Annunciations per ten minutes over the last two hours. More than ten is a flood. */
const AM_RATE = [3, 2, 4, 3, 5, 4, 3, 6, 5, 4, 9, 14];

const AM_FLOOD_LIMIT = 10;

function AmSeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (severity === 'high') return <IconAlertTriangle aria-hidden="true" />;
  if (severity === 'medium') return <IconInfoCircle aria-hidden="true" />;
  return <IconBell aria-hidden="true" />;
}

function AmStateIcon({ state }: { state: AmState }) {
  if (state === 'unacknowledged') return <IconBellRinging />;
  if (state === 'acknowledged') return <IconCheck />;
  return <IconBellOff />;
}

const amStanding = (alarm: AmAlarm): string => {
  const minutes = Math.round((REFERENCE_NOW - alarm.raisedAt) / MINUTE);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
};

const amFigure = (alarm: AmAlarm, value: number): string => value.toLocaleString('en-GB', { minimumFractionDigits: alarm.decimals, maximumFractionDigits: alarm.decimals });

function amSort(alarms: readonly AmAlarm[]): AmAlarm[] {
  return [...alarms].sort(
    (a, b) => AM_STATE_ORDER[a.state] - AM_STATE_ORDER[b.state] || AM_SEVERITY_ORDER[a.severity] - AM_SEVERITY_ORDER[b.severity] || b.raisedAt - a.raisedAt
  );
}

const AM_COLUMNS: AlarmTableColumn<AmAlarm>[] = [
  { id: 'time', header: 'Raised', numeric: true, cell: (alarm) => formatTime(alarm.raisedAt) },
  { id: 'tag', header: 'Tag', cell: (alarm) => <TagId>{alarm.tag}</TagId> },
  { id: 'message', header: 'Alarm', fill: true, cell: (alarm) => alarm.message },
  { id: 'value', header: 'Value / limit', numeric: true, cell: (alarm) => `${amFigure(alarm, alarm.value)} / ${amFigure(alarm, alarm.limit)} ${alarm.unit}` },
  {
    id: 'state',
    header: 'State',
    optional: true,
    cell: (alarm) => (
      <span className="inline-flex items-center gap-1.5 [&>svg]:size-4">
        <AmStateIcon state={alarm.state} />
        {AM_STATE_SHORT[alarm.state]}
      </span>
    ),
  },
];

const AM_COLUMNS_SHORT = AM_COLUMNS.filter((column) => column.id !== 'value');

function AmList({
  alarms,
  selected,
  onSelect,
  columns = AM_COLUMNS,
  className,
}: {
  alarms: readonly AmAlarm[];
  selected?: string;
  onSelect?: (id: string) => void;
  columns?: readonly AlarmTableColumn<AmAlarm>[];
  className?: string;
}) {
  return (
    <AlarmTable
      label="Standing alarms"
      className={className}
      columns={columns}
      rows={alarms}
      rowKey={(alarm) => alarm.id}
      rowTone={(alarm) => AM_SEVERITY_TONE[alarm.severity]}
      rowEmphasis={(alarm) => AM_EMPHASIS[alarm.state]}
      rowBadge={(alarm) => (
        <>
          <AmSeverityIcon severity={alarm.severity} />
          {AM_SEVERITY_LABEL[alarm.severity]}
        </>
      )}
      selected={selected}
      onSelect={onSelect}
      empty="No alarms match this filter."
    />
  );
}

function AmCell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex min-w-0 flex-col justify-center bg-base-background px-4 py-3', className)}>{children}</div>;
}

function AmSummary({ alarms, severity, onSeverity }: { alarms: readonly AmAlarm[]; severity: Severity | null; onSeverity: (severity: Severity | null) => void }) {
  const waiting = alarms.filter((alarm) => alarm.state === 'unacknowledged');
  const worst = AM_SEVERITIES.find((level) => waiting.some((alarm) => alarm.severity === level));
  const shelved = alarms.filter((alarm) => alarm.state === 'shelved').length;
  const rate = AM_RATE[AM_RATE.length - 1] ?? 0;
  return (
    <div className="@container flex items-stretch gap-px">
      <div
        data-tone={worst ? AM_SEVERITY_TONE[worst] : 'success'}
        className="flex w-64 shrink-0 items-center gap-4 bg-[var(--t-solid)] px-4 py-3 text-[var(--t-on-solid)] @max-[1050px]:w-52"
      >
        <span className="text-6xl font-semibold leading-none tabular-nums">{waiting.length}</span>
        <span className="text-sm font-semibold leading-tight">
          {waiting.length === 0 ? 'All alarms acknowledged' : 'unacknowledged'}
          <span className="block font-medium opacity-80">{worst ? `worst is ${AM_SEVERITY_LABEL[worst].toLowerCase()}` : 'nothing waiting'}</span>
        </span>
      </div>
      <div role="group" aria-label="Filter by priority" className="flex flex-1 gap-px">
        {AM_SEVERITIES.map((level) => {
          const standing = alarms.filter((alarm) => alarm.severity === level && alarm.state !== 'shelved');
          const pending = standing.filter((alarm) => alarm.state === 'unacknowledged').length;
          const active = severity === level;
          return (
            <button
              key={level}
              type="button"
              data-tone={AM_SEVERITY_TONE[level]}
              aria-pressed={active}
              onClick={() => onSeverity(active ? null : level)}
              className={cx(
                'flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors [box-shadow:inset_0_4px_0_var(--t-line)] focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-accent)]',
                active ? 'bg-[color-mix(in_oklab,var(--t-line)_26%,var(--base-background))]' : 'bg-base-background hover:bg-medium-background'
              )}
            >
              <span className="text-4xl font-medium leading-none tabular-nums text-base-foreground">{standing.length}</span>
              <span className="min-w-0 text-sm leading-tight">
                <span className="flex items-center gap-1.5 font-semibold text-[var(--t-ink)] [&>svg]:size-4">
                  <AmSeverityIcon severity={level} />
                  {AM_SEVERITY_LABEL[level]}
                </span>
                <span className="block text-xs text-medium-foreground">{pending === 0 ? 'none waiting' : `${pending} waiting`}</span>
              </span>
            </button>
          );
        })}
      </div>
      <AmCell className="w-60 shrink-0 @max-[1050px]:w-36">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="whitespace-nowrap text-xs text-medium-foreground">Alarms in 10 min</p>
            <p className="text-3xl font-medium leading-tight tabular-nums text-base-foreground">
              {rate} <span className={cx('text-sm font-semibold', rate > AM_FLOOD_LIMIT ? 'text-warning-foreground-strong' : 'text-success-foreground-strong')}>{rate > AM_FLOOD_LIMIT ? 'Flood' : 'Normal'}</span>
            </p>
          </div>
          <span className="@max-[1050px]:hidden">
            <SparkLine values={AM_RATE} label="Alarms per ten minutes over the last two hours" tone="warning" variant="bars" className="h-10 w-24" />
          </span>
        </div>
      </AmCell>
      <AmCell className="w-28 shrink-0 @max-[1050px]:w-24">
        <p className="text-xs text-medium-foreground">Shelved</p>
        <p className="text-3xl font-medium leading-tight tabular-nums text-base-foreground">{shelved}</p>
      </AmCell>
    </div>
  );
}

function amTrend(alarm: AmAlarm): number[] {
  const values = makeValues({ seed: alarm.seed, points: 13, base: alarm.from, drift: alarm.value - alarm.from, noise: Math.abs(alarm.value - alarm.from) * 0.06, decimals: Math.max(alarm.decimals, 1) });
  return [...values.slice(0, -1), alarm.value];
}

const AM_TREND_LABELS = Array.from({ length: 13 }, (_, index) => formatTime(REFERENCE_NOW - (12 - index) * 5 * MINUTE));

function AmTrend({ alarm, height = 190 }: { alarm: AmAlarm; height?: number }) {
  return (
    <TrendLine
      label={`${alarm.message}: ${alarm.tag} over the last hour against its alarm limit`}
      labels={AM_TREND_LABELS}
      unit={alarm.unit}
      decimals={alarm.decimals}
      height={height}
      showLegend={false}
      series={[{ id: 'value', label: alarm.tag, values: amTrend(alarm), tone: AM_SEVERITY_TONE[alarm.severity] === 'neutral' ? 'accent' : AM_SEVERITY_TONE[alarm.severity] }]}
      limits={[{ value: alarm.limit, label: alarm.direction === 'high' ? 'High limit' : 'Low limit', tone: 'neutral' }]}
    />
  );
}

function AmBanner({ alarm, className }: { alarm: AmAlarm; className?: string }) {
  return (
    <div data-tone={AM_SEVERITY_TONE[alarm.severity]} className={cx('flex flex-col gap-3 p-4', className, alarm.state === 'unacknowledged' ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)]' : 'bg-medium-background [box-shadow:inset_4px_0_0_var(--t-line)]')}>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold [&_svg]:size-5">
        <span className="flex items-center gap-2">
          <AmSeverityIcon severity={alarm.severity} />
          {AM_SEVERITY_LABEL[alarm.severity]} · {alarm.area}
        </span>
        <span className="flex items-center gap-1.5 [&_svg]:size-4">
          <AmStateIcon state={alarm.state} />
          {AM_STATE_LABEL[alarm.state]}
        </span>
      </div>
      <p className="text-xl font-semibold leading-snug">{alarm.message}</p>
      <div className="flex items-end justify-between gap-4">
        <p className="text-5xl font-medium leading-none tabular-nums">
          {amFigure(alarm, alarm.value)} <span className="text-base font-semibold">{alarm.unit}</span>
        </p>
        <p className="text-right text-sm font-medium leading-tight">
          {alarm.direction === 'high' ? 'High' : 'Low'} limit {amFigure(alarm, alarm.limit)} {alarm.unit}
          <span className="block opacity-80">
            raised {formatTime(alarm.raisedAt)} · {alarm.count} in 24 h
          </span>
        </p>
      </div>
    </div>
  );
}

function AmGuidance({ alarm }: { alarm: AmAlarm }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div>
        <dt className="text-xs font-medium text-medium-foreground">Operator response</dt>
        <dd className="mt-0.5 text-base-foreground">{alarm.response}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-medium-foreground">If nothing is done</dt>
        <dd className="mt-0.5 text-base-foreground">{alarm.consequence}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-medium-foreground">Setting</dt>
        <dd className="mt-0.5 text-base-foreground tabular-nums">{alarm.setting}</dd>
      </div>
    </dl>
  );
}

function AmActions({ alarm, onState }: { alarm: AmAlarm; onState: (state: AmState) => void }) {
  return (
    <div className="flex items-center gap-2">
      {alarm.state === 'shelved' ? (
        <Button size="sm" className="flex-1" onClick={() => onState('acknowledged')}>
          <IconBell /> Unshelve
        </Button>
      ) : (
        <>
          <Button size="sm" className="flex-1" disabled={alarm.state === 'acknowledged'} onClick={() => onState('acknowledged')}>
            <IconCheck /> {alarm.state === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onState('shelved')}>
            <IconPlayerPause /> Shelve for 1 h
          </Button>
        </>
      )}
    </div>
  );
}

function AmActivity({ alarm }: { alarm: AmAlarm }) {
  const events = [
    { id: 'raised', time: formatTime(alarm.raisedAt), text: `Raised at ${amFigure(alarm, alarm.value)} ${alarm.unit}, standing ${amStanding(alarm)}` },
    { id: 'count', time: '24 h', text: alarm.count === 1 ? 'First annunciation in the last 24 hours' : `Annunciated ${alarm.count} times in the last 24 hours` },
    ...(alarm.state === 'acknowledged' ? [{ id: 'ack', time: '14:00', text: 'Acknowledged by Ingrid Haugen' }] : []),
    ...(alarm.state === 'shelved' ? [{ id: 'shelved', time: '14:00', text: 'Shelved by Ingrid Haugen, returns at 15:00' }] : []),
  ];
  return (
    <div>
      <p className="text-xs font-medium text-medium-foreground">Activity</p>
      <ul className="mt-1 flex flex-col gap-1 text-sm">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3">
            <span className="w-10 shrink-0 font-medium tabular-nums text-medium-foreground">{event.time}</span>
            <span className="text-base-foreground">{event.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AmInspector({ alarm, onState }: { alarm: AmAlarm; onState: (state: AmState) => void }) {
  return (
    <Panel
      className="w-[360px] shrink-0"
      padding="none"
      title="Inspector"
      subtitle={alarm.tag}
      footer={
        <div className="w-full">
          <AmActions alarm={alarm} onState={onState} />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <AmBanner alarm={alarm} />
        <div className="border-b border-[var(--kit-rule)] px-3.5 pb-3 pt-1">
          <AmTrend alarm={alarm} />
        </div>
        <div className="flex flex-col gap-3 p-3.5">
          <AmGuidance alarm={alarm} />
          <AmActivity alarm={alarm} />
        </div>
      </div>
    </Panel>
  );
}

const AM_TABS = ['Standing', 'Journal', 'Shelved', 'Suppression'];

function AmTopBar({ tab = 'Standing' }: { tab?: string }) {
  return (
    <div className="flex h-10 shrink-0 items-stretch bg-[var(--mountain-black)] text-sm">
      <div className="flex items-center gap-2 border-r border-[var(--kit-rule)] px-3.5">
        <span className="flex size-6 items-center justify-center bg-[var(--kit-accent)] text-[var(--kit-on-accent)] [&>svg]:size-4">
          <IconBellRinging aria-hidden="true" />
        </span>
        <span className="font-semibold text-base-foreground">Nordkapp</span>
        <span className="text-medium-foreground">Alarm console</span>
      </div>
      <nav aria-label="Alarm views" className="flex items-stretch">
        {AM_TABS.map((name) => (
          <span
            key={name}
            aria-current={name === tab ? 'page' : undefined}
            className={cx('flex items-center border-r border-[var(--kit-rule)] px-4 font-medium', name === tab ? 'bg-[var(--kit-accent)] text-[var(--kit-on-accent)]' : 'text-medium-foreground')}
          >
            {name}
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-stretch text-medium-foreground">
        <span className="flex items-center border-l border-[var(--kit-rule)] px-3.5">Day shift · I. Haugen</span>
        <span className="flex items-center border-l border-[var(--kit-rule)] px-3.5 font-medium tabular-nums text-base-foreground">14:00:00 UTC</span>
      </div>
    </div>
  );
}

function AmConsole() {
  const [states, setStates] = useState<Readonly<Record<string, AmState>>>({});
  const [selected, setSelected] = useState('a4812');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [view, setView] = useState('all');

  const alarms = amSort(AM_ALARMS.map((alarm) => ({ ...alarm, state: states[alarm.id] ?? alarm.state })));
  const shown = alarms.filter((alarm) => (severity === null || alarm.severity === severity) && (view === 'all' || alarm.state === view));
  const current = alarms.find((alarm) => alarm.id === selected) ?? alarms[0];

  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex h-[860px] flex-col gap-px">
        <AmTopBar />
        <AmSummary alarms={alarms} severity={severity} onSeverity={setSeverity} />
        <div className="flex min-h-0 flex-1 gap-px">
          <Panel
            className="min-w-0 flex-1"
            padding="none"
            title="Standing alarms"
            subtitle={`${shown.length} of ${alarms.length} · waiting first`}
            actions={
              <SegmentedControl value={view} onValueChange={(next) => setView(String(next))}>
                <SegmentedControlList size="small" aria-label="State filter">
                  <SegmentedControlButton value="all">All</SegmentedControlButton>
                  <SegmentedControlButton value="unacknowledged">To acknowledge</SegmentedControlButton>
                  <SegmentedControlButton value="shelved">Shelved</SegmentedControlButton>
                </SegmentedControlList>
              </SegmentedControl>
            }
          >
            <AmList alarms={shown} selected={current.id} onSelect={setSelected} className="flex-1" />
          </Panel>
          <AmInspector alarm={current} onState={(state) => setStates((existing) => ({ ...existing, [current.id]: state }))} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function AlarmManagementSignature() {
  return <AmConsole />;
}

type AmFlood = { id: string; label: string; window: string; cause: string; hours: readonly number[] };

/** Annunciations per hour for the last 24 hours; the last bar is the hour that has just started. */
const AM_HOURLY = [3, 5, 4, 3, 21, 6, 4, 3, 5, 4, 6, 17, 19, 7, 5, 4, 3, 5, 4, 6, 5, 7, 26, 3];

const AM_HOUR_LABELS = AM_HOURLY.map((_, index) => formatTime(REFERENCE_NOW - (23 - index) * HOUR).slice(0, 2));

const AM_FLOODS: readonly AmFlood[] = [
  { id: 'all', label: 'Last 24 hours', window: 'all hours', cause: 'Every hour, floods included', hours: AM_HOURLY.map((_, index) => index) },
  { id: 'changeover', label: 'Flood 1', window: '19:00 to 20:00', cause: 'Cooling water pump changeover', hours: [4] },
  { id: 'separator', label: 'Flood 2', window: '02:00 to 04:00', cause: 'Inlet separator level upset', hours: [11, 12] },
  { id: 'trip', label: 'Flood 3', window: '13:00 to 14:00', cause: 'Recompressor trip', hours: [22] },
];

type AmActor = { tag: string; message: string; counts: Record<string, number> };

const AM_ACTORS: readonly AmActor[] = [
  { tag: '40-TT-40015', message: 'Bearing temperature signal lost', counts: { all: 31, changeover: 12, separator: 0, trip: 1 } },
  { tag: '20-LT-10012', message: 'Separator level deviation', counts: { all: 22, changeover: 0, separator: 16, trip: 0 } },
  { tag: '23-TT-91141', message: 'Cooler outlet temperature high', counts: { all: 14, changeover: 6, separator: 0, trip: 3 } },
  { tag: '20-PT-10010', message: 'Separator pressure low', counts: { all: 9, changeover: 0, separator: 8, trip: 0 } },
  { tag: '23-TT-92532', message: 'Discharge temperature high', counts: { all: 9, changeover: 0, separator: 0, trip: 6 } },
  { tag: '23-VT-92540', message: 'Drive-end vibration approaching limit', counts: { all: 6, changeover: 0, separator: 0, trip: 4 } },
];

function AlarmManagementFloodReview() {
  const [floodId, setFloodId] = useState('all');
  const flood = AM_FLOODS.find((entry) => entry.id === floodId) ?? AM_FLOODS[0];
  const total = flood.hours.reduce((sum, hour) => sum + (AM_HOURLY[hour] ?? 0), 0);
  const actors = [...AM_ACTORS].filter((actor) => (actor.counts[flood.id] ?? 0) > 0).sort((a, b) => (b.counts[flood.id] ?? 0) - (a.counts[flood.id] ?? 0));
  const columns: DataTableColumn<AmActor>[] = [
    { id: 'tag', header: 'Tag', nowrap: true, cell: (actor) => <TagId>{actor.tag}</TagId> },
    { id: 'message', header: 'Alarm', cell: (actor) => actor.message },
    { id: 'count', header: 'Annunciations', numeric: true, cell: (actor) => actor.counts[flood.id] ?? 0 },
    { id: 'share', header: 'Share of load', numeric: true, cell: (actor) => `${Math.round(((actor.counts[flood.id] ?? 0) / total) * 100)} %` },
  ];
  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex flex-col gap-px">
        <AmTopBar tab="Journal" />
        <div className="flex gap-px">
          <div role="group" aria-label="Period" className="flex w-72 shrink-0 flex-col gap-px">
            {AM_FLOODS.map((entry) => {
              const count = entry.hours.reduce((sum, hour) => sum + (AM_HOURLY[hour] ?? 0), 0);
              const active = entry.id === flood.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={active}
                  data-tone={entry.id === 'all' ? 'accent' : 'critical'}
                  onClick={() => setFloodId(entry.id)}
                  className={cx(
                    'flex flex-1 cursor-pointer items-center gap-4 px-4 py-3 text-left outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-text)]',
                    active ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)]' : 'bg-base-background text-base-foreground [box-shadow:inset_4px_0_0_var(--t-line)] hover:bg-medium-background'
                  )}
                >
                  <span className="w-16 text-4xl font-medium leading-none tabular-nums">{count}</span>
                  <span className="min-w-0 text-sm leading-tight">
                    <span className="block font-semibold">
                      {entry.label} · {entry.window}
                    </span>
                    <span className={cx('block', active ? 'opacity-85' : 'text-medium-foreground')}>{entry.cause}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <Panel title="Alarm rate" subtitle="Annunciations per hour for one operator · EEMUA 191 calls 12 an hour manageable">
              <Bars
                label="Alarm annunciations per hour over the last 24 hours against the manageable limit of twelve"
                categories={AM_HOUR_LABELS}
                series={[{ id: 'rate', label: 'Alarms per hour', values: AM_HOURLY }]}
                tones={AM_HOURLY.map((count, hour) => (!flood.hours.includes(hour) ? 'neutral' : count > 12 ? 'critical' : count > 6 ? 'warning' : 'success'))}
                height={230}
                limit={{ value: 12, label: 'Limit', tone: 'warning' }}
              />
            </Panel>
            <Panel title="Bad actors" subtitle={`${flood.cause} · ${total} annunciations`} padding="none">
              <DataTable label="Tags that annunciated most in the selected period" flush columns={columns} rows={actors} rowKey={(actor) => actor.tag} rowTone={(actor) => ((actor.counts[flood.id] ?? 0) / total > 0.25 ? 'critical' : undefined)} />
            </Panel>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

const AM_AREAS: readonly AmArea[] = ['Compression', 'Utilities', 'Export', 'Inlet'];

const AM_AREA_WORD: Record<Severity, string> = { critical: 'Act now', high: 'Attention', medium: 'Watch', low: 'Normal' };

function AlarmManagementWall() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          {AM_AREAS.map((area, index) => {
            const standing = AM_ALARMS.filter((alarm) => alarm.area === area && alarm.state !== 'shelved');
            const waiting = standing.filter((alarm) => alarm.state === 'unacknowledged');
            const worst = AM_SEVERITIES.find((level) => waiting.some((alarm) => alarm.severity === level)) ?? 'low';
            const first = amSort(standing)[0];
            return (
              <Stat
                key={area}
                className={index === 0 ? 'col-span-12 min-h-56' : 'col-span-4 min-h-48'}
                size={index === 0 ? 'hero' : 'lg'}
                tone={worst === 'low' ? 'success' : AM_SEVERITY_TONE[worst]}
                label={area}
                state={AM_AREA_WORD[worst]}
                stateIcon={worst === 'low' ? <IconCircleCheck /> : <AmSeverityIcon severity={worst} />}
                value={waiting.length}
                unit={waiting.length === 1 ? 'alarm to acknowledge' : 'alarms to acknowledge'}
                target={first ? `${first.message}, ${amStanding(first)}` : 'No standing alarms'}
              />
            );
          })}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

const AM_FIRST = AM_ALARMS[0];

const AM_SECOND = AM_ALARMS[3];

function AmPart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="console" className={cx('flex flex-col', className)}>
      <Canvas padding="none" className="flex min-h-0 flex-1 flex-col gap-px">
        {children}
      </Canvas>
    </LookScope>
  );
}

function AlarmManagementSummaryStrip() {
  const [severity, setSeverity] = useState<Severity | null>('high');
  return (
    <AmPart>
      <AmTopBar />
      <AmSummary alarms={AM_ALARMS} severity={severity} onSeverity={setSeverity} />
    </AmPart>
  );
}

function AlarmManagementList() {
  const [selected, setSelected] = useState('a4811');
  return (
    <AmPart className="h-[440px]">
      <Panel title="Standing alarms" subtitle="Banded while unacknowledged" padding="none">
        <AmList alarms={amSort(AM_ALARMS).slice(1, 11)} selected={selected} onSelect={setSelected} columns={AM_COLUMNS_SHORT} className="flex-1" />
      </Panel>
    </AmPart>
  );
}

function AlarmManagementBanner() {
  return (
    <AmPart className="h-[440px]">
      <AmBanner alarm={AM_FIRST} className="flex-1 justify-center" />
      <AmBanner alarm={{ ...AM_SECOND, state: 'acknowledged' }} className="flex-1 justify-center" />
      <AmBanner alarm={AM_ALARMS[14]} className="flex-1 justify-center" />
    </AmPart>
  );
}

function AlarmManagementTrend() {
  return (
    <AmPart className="h-[330px]">
      <Panel title="Last hour" subtitle={`${AM_SECOND.tag} · ${AM_SECOND.message}`}>
        <AmTrend alarm={AM_SECOND} height={230} />
      </Panel>
    </AmPart>
  );
}

function AlarmManagementResponse() {
  const [state, setState] = useState<AmState>('unacknowledged');
  const alarm = { ...AM_SECOND, state };
  return (
    <AmPart className="h-[330px]">
      <Panel
        title="Response"
        subtitle={AM_STATE_LABEL[state]}
        footer={
          <div className="w-full">
            <AmActions alarm={alarm} onState={setState} />
          </div>
        }
      >
        <AmGuidance alarm={alarm} />
      </Panel>
    </AmPart>
  );
}

function AlarmManagementStates() {
  return (
    <AmPart>
      <Panel title="Row states" subtitle="One alarm in each state" padding="none">
        <AmList
          columns={AM_COLUMNS.filter((column) => column.id !== 'tag')}
          alarms={[
            { ...AM_SECOND, id: 's1', state: 'unacknowledged' },
            { ...AM_SECOND, id: 's2', state: 'acknowledged' },
            { ...AM_SECOND, id: 's3', state: 'shelved' },
          ]}
        />
      </Panel>
    </AmPart>
  );
}

export default definePage({
  id: 'alarm-management',
  title: 'Alarm management',
  summary:
    'The operator’s alarm console: a summary strip that counts what is waiting, the standing alarms as one dense list banded by state, and an inspector that explains the selected alarm and lets the operator acknowledge or shelve it.',
  guidance: {
    use: [
      'For control rooms, where the list of standing alarms is the work and must stay on screen.',
      'Band the rows that need action edge to edge and let acknowledged and shelved rows recede.',
      'Give every alarm its response and consequence in the inspector, next to the trend that explains it.',
    ],
    avoid: [
      'Cards and gaps: a console wastes no pixels between panes.',
      'A priority shown only as a coloured dot; use a filled block with the icon and the word.',
      'Hiding shelved alarms. They stay in the list, quiet, with a count in the strip.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Console look: summary strip, alarm list and inspector with no gaps.',
      specimens: [
        {
          id: 'AlarmManagementSignature',
          title: 'Alarm console',
          note: 'Pick it for the operator position that owns the alarm list during a shift.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/alarm-management/AlarmTable.tsx', 'kit/Panel.tsx', 'kit/TrendLine.tsx', 'kit/SparkLine.tsx', 'looks/LookScope.tsx'],
          Component: AlarmManagementSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product.',
      specimens: [
        {
          id: 'AlarmManagementFloodReview',
          title: 'Flood review',
          note: 'Pick it for the weekly alarm review: choose a flood and see which tags caused it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/DataTable.tsx', 'kit/Panel.tsx'],
          Component: AlarmManagementFloodReview,
        },
        {
          id: 'AlarmManagementWall',
          title: 'Area wall',
          note: 'Pick it for the screen above the desks: one tile per area, filled with its worst unacknowledged priority.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Grid.tsx', 'looks/LookScope.tsx'],
          Component: AlarmManagementWall,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panes of the console on their own.',
      specimens: [
        {
          id: 'AlarmManagementSummaryStrip',
          title: 'Summary strip',
          note: 'Use it above any list that must be triaged: the count that needs action first, then the breakdown as filters.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/SparkLine.tsx'],
          Component: AlarmManagementSummaryStrip,
        },
        {
          id: 'AlarmManagementList',
          title: 'Banded alarm list',
          note: 'Use it when rows have a state that must be read from across the desk.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/alarm-management/AlarmTable.tsx', 'kit/TagId.tsx'],
          Component: AlarmManagementList,
        },
        {
          id: 'AlarmManagementBanner',
          title: 'Alarm banner',
          note: 'Use it as the head of an inspector: filled while the alarm waits, an edge once it is acknowledged.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: AlarmManagementBanner,
        },
        {
          id: 'AlarmManagementTrend',
          title: 'Trend against the limit',
          note: 'Use it to show how the reading reached its alarm limit over the last hour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx'],
          Component: AlarmManagementTrend,
        },
        {
          id: 'AlarmManagementResponse',
          title: 'Response and actions',
          note: 'Use it so the operator reads what to do before pressing acknowledge.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: AlarmManagementResponse,
        },
        {
          id: 'AlarmManagementStates',
          title: 'Row states',
          note: 'Use it as the reference for how unacknowledged, acknowledged and shelved rows differ.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/alarm-management/AlarmTable.tsx'],
          Component: AlarmManagementStates,
        },
      ],
    },
  ],
});
