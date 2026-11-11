import { Button } from '@cognite/aura/components/button';
import { Label } from '@cognite/aura/components/label';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconBellRinging,
  IconCheck,
  IconCircleCheck,
  IconClipboardList,
  IconFlame,
  IconHistory,
  IconInfoCircle,
  IconLayoutDashboard,
  IconRepeat,
  IconSettings,
  IconTool,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AlarmLanes, type AlarmLane } from '../../../library/kit/alarms-and-events/AlarmLanes';
import { AlarmRow } from '../../../library/kit/alarms-and-events/AlarmRow';
import { AnnunciatorGrid, type AnnunciatorWindow } from '../../../library/kit/alarms-and-events/AnnunciatorGrid';
import { EventTimeline, type TimelineEvent } from '../../../library/kit/alarms-and-events/EventTimeline';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip, type HeatRow } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, findAsset, type Alarm, type Severity } from '../../data/plant';
import { formatAgo, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './alarms-and-events.tsx?raw';

const AE_SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const AE_TONE: Record<Severity, Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const AE_WORD: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const AE_STATE: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  shelved: 'Shelved',
  cleared: 'Cleared',
};

const AE_OPEN = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const AE_COUNT: Record<Severity, number> = {
  critical: AE_OPEN.filter((alarm) => alarm.severity === 'critical').length,
  high: AE_OPEN.filter((alarm) => alarm.severity === 'high').length,
  medium: AE_OPEN.filter((alarm) => alarm.severity === 'medium').length,
  low: AE_OPEN.filter((alarm) => alarm.severity === 'low').length,
};

const AE_HISTORY: Record<Severity, number[]> = {
  critical: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  high: [1, 2, 2, 1, 1, 3, 2, 2, 1, 2, 2, 2],
  medium: [3, 2, 2, 3, 4, 2, 2, 1, 2, 1, 1, 1],
  low: [4, 4, 3, 3, 2, 2, 3, 2, 2, 1, 1, 1],
};

const AE_RATE_SLOTS = ['12:20', '12:30', '12:40', '12:50', '13:00', '13:10', '13:20', '13:30', '13:40', '13:50'];

const AE_RATE = [2, 1, 3, 2, 4, 3, 6, 9, 17, 12];

const AE_RATE_TONES: Tone[] = AE_RATE.map((count) => (count > 10 ? 'critical' : count > 5 ? 'warning' : 'accent'));

const AE_VIBRATION = makeSeries({ seed: 71, points: 25, base: 7.4, amplitude: 0.5, noise: 0.25, drift: 4.4, decimals: 1, stepMs: 5 * 60_000 });

const AE_VIBRATION_VALUES = [...AE_VIBRATION.slice(0, -1).map((point) => point.v), 11.6];

const AE_VIBRATION_LABELS = AE_VIBRATION.map((point) => formatTime(point.t));

const AE_AREAS = ASSETS.filter((asset) => asset.parentId === 'nk');

const AE_HEAT: HeatRow[] = AE_AREAS.map((area, index) => ({
  label: area.name,
  values: makeValues({ seed: 80 + index, points: 24, base: area.health === 'watch' ? 4.5 : 1.1, amplitude: 1.3, noise: 1.5, cycles: 2, min: 0, decimals: 0 }),
  tone: area.health === 'watch' ? 'warning' : 'accent',
}));

const AE_UNITS = ['23-ka-9103', '23-ka-9101', '23-ha-9114', '40-pa-4001', '27-pa-2001b', '20-va-1001'];

const AE_WINDOWS: AnnunciatorWindow[] = [
  { id: 'w1', tag: '23-VT-92740', label: 'Vibration high-high', tone: 'critical', state: 'new', stateLabel: 'Unacknowledged', firstOut: true },
  { id: 'w2', tag: '23-KA-9103', label: 'Recompressor trip', tone: 'critical', state: 'new', stateLabel: 'Unacknowledged' },
  { id: 'w3', tag: '23-TT-92532', label: 'Discharge temp high', tone: 'warning', state: 'new', stateLabel: 'Unacknowledged' },
  { id: 'w4', tag: '23-VT-92540', label: 'Vibration high', tone: 'warning', state: 'held', stateLabel: 'Acknowledged' },
  { id: 'w5', tag: '23-PT-92531', label: 'Discharge pressure', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
  { id: 'w6', tag: '23-PT-92530', label: 'Suction pressure', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
  { id: 'w7', tag: '23-TT-91141', label: 'Cooler outlet temp', tone: 'info', state: 'held', stateLabel: 'Acknowledged' },
  { id: 'w8', tag: '23-FT-92510', label: 'Gas flow low', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
  { id: 'w9', tag: '23-LT-92520', label: 'Scrubber level', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
  { id: 'w10', tag: '23-XV-92505', label: 'Anti-surge valve', tone: 'info', state: 'held', stateLabel: 'Open, acknowledged' },
  { id: 'w11', tag: '23-PDT-9255', label: 'Seal gas pressure', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
  { id: 'w12', tag: '23-ST-92501', label: 'Overspeed', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
];

const AE_EVENTS: TimelineEvent[] = [
  { id: 'e1', time: '13:31', kind: 'Alarm', tone: 'warning', icon: <IconAlertTriangle />, title: 'Drive-end vibration high', detail: '23-VT-92740 · 9.4 mm/s against 7.1' },
  { id: 'e2', time: '13:38', kind: 'Operator', tone: 'info', icon: <IconUser />, title: 'Acknowledged, load reduced to 80 %', detail: 'Ingrid Haugen' },
  { id: 'e3', time: '13:44', kind: 'Alarm', tone: 'critical', icon: <IconAlertOctagon />, title: 'Vibration high-high, first out', detail: '23-VT-92740 · 11.6 mm/s against 11.0' },
  { id: 'e4', time: '13:46', kind: 'Trip', tone: 'critical', icon: <IconBellRinging />, title: 'Recompressor tripped', detail: '23-KA-9103 · protection system' },
  { id: 'e5', time: '13:47', kind: 'System', tone: 'neutral', icon: <IconSettings />, title: 'Anti-surge valve opened', detail: '23-XV-92505 · automatic' },
  { id: 'e6', time: '13:52', kind: 'Work', tone: 'success', icon: <IconTool />, title: 'Bearing inspection raised', detail: 'WO-104482 · Tomás Barros' },
];

const AE_LANES: AlarmLane[] = [
  {
    id: 'l1',
    label: 'Recompressor vibration high-high',
    tag: '23-VT-92740',
    total: '16 min',
    spans: [{ from: 0.989, to: 1, tone: 'critical', label: 'Active from 13:44' }],
  },
  {
    id: 'l2',
    label: 'Discharge temperature high',
    tag: '23-TT-92532',
    total: '9 times',
    spans: [
      { from: 0.31, to: 0.325, tone: 'warning', label: '21:26' },
      { from: 0.34, to: 0.35, tone: 'warning', label: '22:10' },
      { from: 0.362, to: 0.38, tone: 'warning', label: '22:41' },
      { from: 0.4, to: 0.408, tone: 'warning', label: '23:36' },
      { from: 0.71, to: 0.73, tone: 'warning', label: '07:02' },
      { from: 0.745, to: 0.752, tone: 'warning', label: '07:53' },
      { from: 0.77, to: 0.79, tone: 'warning', label: '08:29' },
      { from: 0.82, to: 0.83, tone: 'warning', label: '09:41' },
      { from: 0.974, to: 1, tone: 'warning', label: 'Active from 13:22' },
    ],
  },
  {
    id: 'l3',
    label: 'Drive-end vibration approaching limit',
    tag: '23-VT-92540',
    total: '2 h 0 min',
    spans: [
      { from: 0.917, to: 0.93, tone: 'warning', label: 'Active 12:00 to 12:19' },
      { from: 0.93, to: 1, tone: 'warning', kind: 'acknowledged', label: 'Acknowledged from 12:19' },
    ],
  },
  {
    id: 'l4',
    label: 'Cooler outlet temperature high',
    tag: '23-TT-91141',
    total: '5 h 0 min',
    spans: [
      { from: 0.792, to: 0.81, tone: 'info', label: 'Active 09:00 to 09:26' },
      { from: 0.81, to: 1, tone: 'info', kind: 'acknowledged', label: 'Acknowledged from 09:26' },
    ],
  },
  {
    id: 'l5',
    label: 'Bearing temperature signal lost',
    tag: '40-TT-40015',
    total: '9 h 0 min',
    spans: [
      { from: 0.625, to: 0.66, tone: 'info', label: 'Active 05:00 to 05:50' },
      { from: 0.66, to: 1, tone: 'info', kind: 'shelved', label: 'Shelved from 05:50 until the transmitter is replaced' },
    ],
  },
  {
    id: 'l6',
    label: 'Separator level deviation',
    tag: '20-LT-10012',
    total: '48 min',
    spans: [{ from: 0.125, to: 0.158, tone: 'neutral', label: 'Active 17:00 to 17:48, cleared' }],
  },
];

const AE_LANE_TICKS = ['14:00', '18:00', '22:00', '02:00', '06:00', '10:00', '14:00'];

type AeLogEntry = { id: string; time: string; kind: string; tone: Tone; text: string; tag: string; value: string; by: string };

const AE_LOG: AeLogEntry[] = [
  { id: 'g1', time: '13:52:10', kind: 'Work order', tone: 'success', text: 'Bearing inspection raised', tag: '23-KA-9103', value: 'WO-104482', by: 'Tomás Barros' },
  { id: 'g2', time: '13:47:02', kind: 'System', tone: 'neutral', text: 'Anti-surge valve opened', tag: '23-XV-92505', value: '100 %', by: 'Automatic' },
  { id: 'g3', time: '13:46:41', kind: 'Trip', tone: 'critical', text: 'Recompressor tripped on high vibration', tag: '23-KA-9103', value: '11.6 mm/s', by: 'Protection system' },
  { id: 'g4', time: '13:44:18', kind: 'Alarm', tone: 'critical', text: 'Vibration high-high, first out', tag: '23-VT-92740', value: '11.6 mm/s', by: 'Raised' },
  { id: 'g5', time: '13:38:55', kind: 'Operator', tone: 'info', text: 'Acknowledged, load reduced to 80 %', tag: '23-VT-92740', value: '9.8 mm/s', by: 'Ingrid Haugen' },
  { id: 'g6', time: '13:31:07', kind: 'Alarm', tone: 'warning', text: 'Drive-end vibration high', tag: '23-VT-92740', value: '9.4 mm/s', by: 'Raised' },
  { id: 'g7', time: '13:22:30', kind: 'Alarm', tone: 'warning', text: 'Discharge temperature high', tag: '23-TT-92532', value: '146.3 °C', by: 'Raised' },
];

const AE_LOG_COLUMNS: DataTableColumn<AeLogEntry>[] = [
  { id: 'time', header: 'Time (UTC)', nowrap: true, cell: (entry) => <span className="font-medium tabular-nums">{entry.time}</span> },
  { id: 'kind', header: 'Type', nowrap: true, cell: (entry) => <StatusPill tone={entry.tone}>{entry.kind}</StatusPill> },
  { id: 'text', header: 'Event', cell: (entry) => entry.text },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (entry) => <TagId>{entry.tag}</TagId> },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (entry) => entry.value },
  { id: 'by', header: 'By', nowrap: true, muted: true, cell: (entry) => entry.by },
];

const AE_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '5' },
  { id: 'events', label: 'Event log', icon: <IconHistory /> },
  { id: 'shelved', label: 'Shelved', icon: <IconBellOff />, badge: '1' },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
];

function AeIcon({ severity }: { severity: Severity }) {
  if (severity === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (severity === 'high') return <IconAlertTriangle aria-hidden="true" />;
  if (severity === 'medium') return <IconInfoCircle aria-hidden="true" />;
  return <IconBell aria-hidden="true" />;
}

type AeRowProps = {
  alarm: Alarm;
  /** Overrides the recorded state, for lists that acknowledge locally. */
  state?: Alarm['state'];
  density?: 'default' | 'compact';
  markers?: ReactNode;
  actions?: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
};

function AeRow({ alarm, state = alarm.state, density, markers, actions, selected, onSelect }: AeRowProps) {
  return (
    <AlarmRow
      severity={AE_WORD[alarm.severity]}
      tone={AE_TONE[alarm.severity]}
      icon={<AeIcon severity={alarm.severity} />}
      message={alarm.message}
      tag={alarm.sensorTag}
      value={alarm.value}
      limit={alarm.limit}
      state={AE_STATE[state]}
      age={formatAgo(alarm.raisedAt)}
      quiet={state !== 'active'}
      density={density}
      markers={markers}
      actions={actions}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

function AeRows({ alarms = AE_OPEN, density }: { alarms?: readonly Alarm[]; density?: 'default' | 'compact' }) {
  return (
    <ul>
      {alarms.map((alarm) => (
        <AeRow key={alarm.id} alarm={alarm} density={density} />
      ))}
    </ul>
  );
}

function AeCounts({ size = 'md', plain = false }: { size?: 'md' | 'lg' | 'hero'; plain?: boolean }) {
  return (
    <>
      {AE_SEVERITIES.map((severity) => (
        <Stat
          key={severity}
          variant={plain ? 'plain' : 'tile'}
          size={size}
          tone={AE_TONE[severity]}
          label={`${AE_WORD[severity]} alarms`}
          value={AE_COUNT[severity]}
          icon={plain ? undefined : <AeIcon severity={severity} />}
          state={AE_COUNT[severity] === 0 ? 'None open' : severity === 'critical' ? 'Act now' : severity === 'high' ? 'Respond' : 'Monitor'}
          target={`${AE_HISTORY[severity].reduce((sum, count) => sum + count, 0)} raised in 12 h`}
          sparkline={plain ? undefined : AE_HISTORY[severity]}
        />
      ))}
    </>
  );
}

function AeRateBars({ height = 220 }: { height?: number }) {
  return (
    <Bars
      label="Alarms raised per ten minutes over the last 100 minutes against the flood limit"
      categories={AE_RATE_SLOTS}
      series={[{ id: 'rate', label: 'Alarms per 10 min', values: AE_RATE }]}
      tones={AE_RATE_TONES}
      limit={{ value: 10, label: 'Flood limit 10', tone: 'critical' }}
      showValues
      height={height}
    />
  );
}

function AeVibrationTrend({ height = 240 }: { height?: number }) {
  return (
    <TrendLine
      label="Recompressor drive-end vibration over the last two hours with its high and trip limits"
      labels={AE_VIBRATION_LABELS}
      unit="mm/s"
      height={height}
      yDomain={[4, 14]}
      series={[{ id: 'vibration', label: '23-VT-92740', values: AE_VIBRATION_VALUES, tone: 'critical' }]}
      limits={[
        { value: 7.1, label: 'High 7.1', tone: 'warning' },
        { value: 11, label: 'Trip 11.0', tone: 'critical' },
      ]}
    />
  );
}

function AeFacts({ items }: { items: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2.5 text-sm">
      {items.map(([term, detail]) => (
        <div key={term} className="col-span-2 grid grid-cols-subgrid items-baseline">
          <dt className="text-medium-foreground">{term}</dt>
          <dd className="font-medium">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function AeUnitRows() {
  return (
    <ul>
      {AE_UNITS.map((unitId) => {
        const unit = findAsset(unitId);
        const alarms = ALARMS.filter((alarm) => alarm.assetId === unitId && alarm.state !== 'cleared');
        const worst = AE_SEVERITIES.find((severity) => alarms.some((alarm) => alarm.severity === severity));
        return (
          <ListRow
            key={unitId}
            tone={worst ? AE_TONE[worst] : 'neutral'}
            leading={
              <IconChip tone={worst ? AE_TONE[worst] : 'success'} size="sm">
                {worst ? <AeIcon severity={worst} /> : <IconCircleCheck />}
              </IconChip>
            }
            title={unit?.name ?? unitId}
            meta={<TagId>{unit?.tag ?? ''}</TagId>}
            trailing={
              worst ? (
                <StatusPill tone={AE_TONE[worst]}>
                  {alarms.length} {AE_WORD[worst].toLowerCase()}
                </StatusPill>
              ) : (
                <StatusPill tone="success" variant="outline">
                  No alarms
                </StatusPill>
              )
            }
          />
        );
      })}
    </ul>
  );
}

function AlarmsAndEventsRows() {
  return (
    <Canvas>
      <Panel title="Open alarms" subtitle="Most severe first, then newest" footer="Priority · message and tag · value against limit · state and age — the same order in every list">
        <AeRows />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsStates() {
  const samples: readonly Alarm[] = [ALARMS[1], ALARMS[2], ALARMS[4], ALARMS[5]];
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-8" title="Lifecycle" subtitle="Only a new, unseen alarm asks for attention">
          <AeRows alarms={samples} />
        </Panel>
        <Panel className="col-span-4" title="State words" subtitle="Said in text, never by colour alone">
          <ul className="flex flex-1 flex-col justify-between gap-4 text-sm">
            <li className="flex flex-col gap-1.5">
              <StatusPill tone="critical" variant="filled" icon={<IconBellRinging />} className="self-start">
                Active
              </StatusPill>
              <span className="text-medium-foreground">Raised and not yet seen. Full colour.</span>
            </li>
            <li className="flex flex-col gap-1.5">
              <StatusPill tone="warning" variant="soft" icon={<IconCheck />} className="self-start">
                Acknowledged
              </StatusPill>
              <span className="text-medium-foreground">Seen and still standing. Colour steps back.</span>
            </li>
            <li className="flex flex-col gap-1.5">
              <StatusPill tone="info" variant="outline" icon={<IconBellOff />} className="self-start">
                Shelved until 18:00
              </StatusPill>
              <span className="text-medium-foreground">Silenced on purpose, with a return time.</span>
            </li>
            <li className="flex flex-col gap-1.5">
              <StatusPill tone="neutral" variant="outline" icon={<IconCircleCheck />} className="self-start">
                Cleared
              </StatusPill>
              <span className="text-medium-foreground">Back inside its limit. Kept for the record.</span>
            </li>
          </ul>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmsAndEventsCompact() {
  return (
    <Canvas>
      <Panel title="All alarms, last three days" subtitle="One line each for long lists and side panels" actions={<StatusPill tone="neutral">{ALARMS.length} alarms</StatusPill>}>
        <AeRows alarms={ALARMS} density="compact" />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsMarkers() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-4" title="Chattering" subtitle="Came back 9 times in 24 hours" icon={<IconChip tone="warning"><IconRepeat /></IconChip>}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-end justify-between gap-4">
              <Stat variant="plain" size="lg" label="Discharge temperature high" value={9} unit="activations" tone="warning" />
              <SparkLine className="h-12 w-28" variant="bars" tone="warning" label="Activations per hour, last 12 hours" values={[0, 1, 0, 2, 1, 0, 0, 1, 2, 1, 0, 1]} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="warning" icon={<IconRepeat />}>
                Chattering ×9
              </StatusPill>
              <TagId variant="chip">23-TT-92532</TagId>
            </div>
            <p className="text-sm text-medium-foreground">Count the returns on the row itself; nine rows for one alarm bury the list.</p>
          </div>
        </Panel>
        <Panel className="col-span-4" title="Standing" subtitle="Active for more than 24 hours" icon={<IconChip tone="info"><IconHistory /></IconChip>}>
          <div className="flex flex-1 flex-col justify-between gap-5">
            <Meter label="Export pump B standby test overdue" value={48} max={72} unit="h" tone="info" target={{ value: 24, label: 'Standing after' }} />
            <Meter label="Bearing temperature signal lost" value={9} max={72} unit="h" tone="neutral" target={{ value: 24, label: 'Standing after' }} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info" icon={<IconHistory />}>
                Standing 2 d
              </StatusPill>
              <span className="text-sm text-medium-foreground">Reviewed weekly, not left to age.</span>
            </div>
          </div>
        </Panel>
        <Panel className="col-span-4" title="First out" subtitle="What tripped first, before the cascade" icon={<IconChip tone="critical"><IconAlertOctagon /></IconChip>}>
          <ol className="flex flex-1 flex-col justify-between gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="w-18 font-semibold tabular-nums">13:44:18</span>
              <span className="min-w-0 flex-1 font-semibold">Vibration high-high</span>
              <StatusPill tone="critical" variant="filled">
                First out
              </StatusPill>
            </li>
            <li className="flex items-center gap-3 text-medium-foreground">
              <span className="w-18 tabular-nums">13:46:41</span>
              <span className="min-w-0 flex-1">Recompressor trip</span>
              <span className="tabular-nums">+2 min 23 s</span>
            </li>
            <li className="flex items-center gap-3 text-medium-foreground">
              <span className="w-18 tabular-nums">13:47:02</span>
              <span className="min-w-0 flex-1">Anti-surge valve open</span>
              <span className="tabular-nums">+2 min 44 s</span>
            </li>
            <li className="flex items-center gap-3 text-medium-foreground">
              <span className="w-18 tabular-nums">13:47:30</span>
              <span className="min-w-0 flex-1">Gas flow low</span>
              <span className="tabular-nums">+3 min 12 s</span>
            </li>
            <li className="text-medium-foreground">Mark the cause; the rest are consequences.</li>
          </ol>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmsAndEventsCounts() {
  return (
    <Canvas>
      <StatGroup columns={4} label="Open alarms by priority">
        <AeCounts />
      </StatGroup>
    </Canvas>
  );
}

function AlarmsAndEventsFlood() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-12" tone="critical" padding="tight">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <IconChip tone="critical" size="lg">
              <IconBellRinging />
            </IconChip>
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-6 font-semibold">Alarm flood on gas compression</p>
              <p className="text-sm text-medium-foreground">29 alarms in the last 20 minutes · started 13:40 · the list is grouped by first-out cause</p>
            </div>
            <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
              17 per 10 min
            </StatusPill>
            <Button variant="outline" size="sm">
              Show first-out only
            </Button>
          </div>
        </Panel>
        <Panel className="col-span-8" title="Alarm rate" subtitle="Raised per ten minutes, against the flood limit">
          <AeRateBars />
        </Panel>
        <Panel className="col-span-4" title="This hour" subtitle="Against the targets an operator can handle">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <Meter size="lg" label="Average rate" value={5.9} decimals={1} max={20} unit="per 10 min" tone="warning" target={{ value: 1, label: 'Target' }} high={10} />
            <Meter size="lg" label="Time in flood" value={20} max={60} unit="min" tone="critical" target={{ value: 0, label: 'Target' }} />
            <Meter size="lg" label="Acknowledged within 10 min" value={86} max={100} unit="%" tone="success" target={{ value: 90, label: 'Target' }} />
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmsAndEventsAnnunciator() {
  const [selected, setSelected] = useState('w1');
  const window = AE_WINDOWS.find((item) => item.id === selected) ?? AE_WINDOWS[0];
  return (
    <Canvas>
      <Panel
        title="Compression train annunciator"
        subtitle="Fixed positions: the pattern is readable before the text"
        actions={<StatusPill tone="critical">3 unacknowledged</StatusPill>}
        footer={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <TagId>{window.tag}</TagId>
            <span className="font-medium text-base-foreground">{window.label}</span>
            <span>{window.stateLabel}</span>
          </span>
        }
      >
        <AnnunciatorGrid label="Compression train annunciator" windows={AE_WINDOWS} columns={4} selected={selected} onSelect={setSelected} />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsByUnit() {
  return (
    <Canvas>
      <Panel title="Alarms by unit" subtitle="Worst priority and count on every unit" footer="Zero is shown too — the absence is information">
        <AeUnitRows />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsFiltered() {
  const [filter, setFilter] = useState('all');
  const [acknowledged, setAcknowledged] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState(AE_OPEN[0].id);
  const shown = AE_OPEN.filter((alarm) => filter === 'all' || alarm.severity === filter);
  const stateOf = (alarm: Alarm): Alarm['state'] => (acknowledged.includes(alarm.id) ? 'acknowledged' : alarm.state);
  const unseen = AE_OPEN.filter((alarm) => stateOf(alarm) === 'active').length;

  return (
    <Canvas>
      <Panel
        title="Open alarms"
        subtitle={`${unseen} unacknowledged of ${AE_OPEN.length} open`}
        actions={
          <SegmentedControl value={filter} onValueChange={(next) => setFilter(String(next))}>
            <SegmentedControlList size="small" aria-label="Filter by priority">
              <SegmentedControlButton value="all">All {AE_OPEN.length}</SegmentedControlButton>
              {AE_SEVERITIES.map((severity) => (
                <SegmentedControlButton key={severity} value={severity}>
                  {AE_WORD[severity]} {AE_COUNT[severity]}
                </SegmentedControlButton>
              ))}
            </SegmentedControlList>
          </SegmentedControl>
        }
        footer="Select a row with a click or Enter. Acknowledging keeps the alarm in the list and quietens it."
      >
        {shown.length === 0 ? (
          <EmptyPanel icon={<IconCircleCheck />} title="No alarms at this priority" description="Nothing open matches the filter. Other priorities still have open alarms." />
        ) : (
          <ul role="listbox" aria-label="Open alarms">
            {shown.map((alarm) => (
              <AeRow
                key={alarm.id}
                alarm={alarm}
                state={stateOf(alarm)}
                selected={alarm.id === selected}
                onSelect={() => setSelected(alarm.id)}
                actions={
                  stateOf(alarm) === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setAcknowledged((current) => [...current, alarm.id]);
                      }}
                    >
                      <IconCheck /> Acknowledge
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </ul>
        )}
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsEmpty() {
  return (
    <Canvas>
      <Panel title="Open alarms" subtitle="Gas export · NK-27" actions={<StatusPill tone="success">All clear</StatusPill>}>
        <EmptyPanel
          icon={<IconCircleCheck />}
          title="No active alarms"
          description="The last alarm on gas export cleared 3 days ago. One alarm is shelved and returns at 18:00."
          action={
            <Button variant="outline" size="sm">
              Show shelved
            </Button>
          }
        />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsAcknowledge() {
  const [comment, setComment] = useState('Load reduced to 80 %. Vibration analyst called out.');
  const [done, setDone] = useState(false);
  const alarm = ALARMS[1];
  return (
    <Canvas>
      <Panel
        title="Acknowledge alarm"
        subtitle="A comment turns an acknowledgement into a handover note"
        icon={
          <IconChip tone="warning">
            <IconAlertTriangle />
          </IconChip>
        }
        footer={done ? 'Acknowledged 14:00 by Ingrid Haugen. The alarm stays in the list until it clears.' : 'Acknowledging silences the horn; it does not clear the alarm.'}
      >
        <div className="flex flex-col gap-4">
          <ul>
            <AeRow alarm={alarm} state={done ? 'acknowledged' : 'active'} />
          </ul>
          <div className="flex flex-col">
            <Label htmlFor="alarms-and-events-ack-comment">What you checked or did</Label>
            <Textarea id="alarms-and-events-ack-comment" rows={2} value={comment} disabled={done} onChange={(event) => setComment(event.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDone(false)} disabled={!done}>
              Undo
            </Button>
            <Button size="sm" onClick={() => setDone(true)} disabled={done}>
              <IconCheck /> Acknowledge
            </Button>
          </div>
        </div>
      </Panel>
    </Canvas>
  );
}

const AE_SHELVE: Record<string, string> = { '1': '15:00', '4': '18:00', '8': '22:00', shift: '19:00, end of shift' };

function AlarmsAndEventsShelve() {
  const [hours, setHours] = useState('4');
  return (
    <Canvas>
      <Panel
        title="Shelve alarm"
        subtitle="A shelved alarm always has a reason and a return time"
        icon={
          <IconChip tone="info">
            <IconBellOff />
          </IconChip>
        }
        footer="Shelving is logged with your name. One alarm is shelved now; the limit for this console is five."
      >
        <div className="flex flex-col gap-4">
          <ul>
            <AeRow alarm={ALARMS[4]} />
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">Shelve for</span>
            <SegmentedControl value={hours} onValueChange={(next) => setHours(String(next))}>
              <SegmentedControlList size="small" aria-label="Shelve duration">
                <SegmentedControlButton value="1">1 h</SegmentedControlButton>
                <SegmentedControlButton value="4">4 h</SegmentedControlButton>
                <SegmentedControlButton value="8">8 h</SegmentedControlButton>
                <SegmentedControlButton value="shift">End of shift</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          </div>
          <AeFacts
            items={[
              ['Returns at', <span key="returns" className="tabular-nums">{AE_SHELVE[hours]}</span>],
              ['Reason', 'Transmitter fault, WO-104479 planned'],
              ['Compensating check', 'Local gauge read every hour'],
            ]}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
            <Button size="sm">
              <IconBellOff /> Shelve until {AE_SHELVE[hours].split(',')[0]}
            </Button>
          </div>
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsDetail() {
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-8"
          tone="critical"
          title="Recompressor tripped on high vibration"
          subtitle="23-VT-92740 · Recompressor 23-KA-9103 · raised 13:44"
          icon={
            <IconChip tone="critical">
              <IconAlertOctagon />
            </IconChip>
          }
          actions={
            <>
              <StatusPill tone="critical" variant="filled">
                Critical · Active
              </StatusPill>
              <Button size="sm">
                <IconCheck /> Acknowledge
              </Button>
            </>
          }
        >
          <AeVibrationTrend height={260} />
        </Panel>
        <Panel className="col-span-4" title="What to do" subtitle="From the alarm response sheet">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <AeFacts
              items={[
                ['Value', <span key="v" className="tabular-nums">11.6 mm/s</span>],
                ['Trip limit', <span key="l" className="tabular-nums">11.0 mm/s</span>],
                ['Likely cause', 'Drive-end bearing wear'],
                ['Consequence', 'Loss of recompression, flaring'],
                ['Time to respond', '10 minutes'],
              ]}
            />
            <ol className="flex flex-col gap-2 text-sm">
              <li className="flex gap-2.5">
                <span className="font-semibold tabular-nums">1</span>
                <span>Confirm the machine has stopped and the anti-surge valve is open.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-semibold tabular-nums">2</span>
                <span>Do not restart before the bearing has been inspected.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-semibold tabular-nums">3</span>
                <span>Rebalance load on the first and second stage.</span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <IconTool /> Open WO-104482
              </Button>
              <Button variant="outline" size="sm">
                <IconBellOff /> Shelve
              </Button>
            </div>
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmsAndEventsTimeline() {
  return (
    <Canvas>
      <Panel title="Recompressor trip" subtitle="Alarms, operator actions and system events in one sequence" footer="21 minutes from first warning to work order">
        <EventTimeline label="Events around the recompressor trip, 13:31 to 13:52" events={AE_EVENTS} />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsHeat() {
  return (
    <Canvas>
      <Panel title="Alarm load by hour" subtitle="Where and when alarms pile up, last 24 hours">
        <div className="flex flex-1 flex-col justify-between gap-5">
          <div className="grid grid-cols-3 gap-4">
            <Stat variant="plain" size="md" label="Raised" value={71} />
            <Stat variant="plain" size="md" label="Busiest hour" value="9" unit="at 13:00" tone="warning" />
            <Stat variant="plain" size="md" label="From compression" value={62} unit="%" />
          </div>
          <HeatStrip
            size="lg"
            label="Alarms per hour by area over the last 24 hours"
            rows={AE_HEAT}
            ticks={['14:00', '20:00', '02:00', '08:00', '14:00']}
            scale={{ label: 'Alarms per hour', low: '0', high: '9' }}
          />
        </div>
      </Panel>
    </Canvas>
  );
}

function AeLaneLegend() {
  return (
    <Legend
      items={[
        { label: 'Active, unacknowledged', tone: 'critical' },
        { label: 'Acknowledged, still standing', tone: 'neutral' },
        { label: 'Shelved', tone: 'info', mark: 'dashed' },
      ]}
    />
  );
}

function AlarmsAndEventsLanes() {
  return (
    <Canvas>
      <Panel title="Standing time per alarm" subtitle="Last 24 hours on one clock: a comb is chattering, a long bar is standing" footer={<AeLaneLegend />}>
        <AlarmLanes label="Standing time per alarm over the last 24 hours" lanes={AE_LANES} ticks={AE_LANE_TICKS} />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsLog() {
  return (
    <Canvas>
      <Panel title="Event log" subtitle="Gas compression · newest first" padding="none" actions={<Button variant="outline" size="sm">Export</Button>}>
        <DataTable
          label="Event log for gas compression"
          flush
          columns={AE_LOG_COLUMNS}
          rows={AE_LOG}
          rowKey={(entry) => entry.id}
          rowTone={(entry) => (entry.tone === 'critical' || entry.tone === 'warning' ? entry.tone : undefined)}
        />
      </Panel>
    </Canvas>
  );
}

function AlarmsAndEventsConsole() {
  const [selected, setSelected] = useState('w1');
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Grid>
          <StatGroup columns={4} label="Open alarms by priority" className="col-span-12">
            <AeCounts size="lg" plain />
          </StatGroup>
          <Panel className="col-span-7" title="Alarm summary" subtitle="5 open · sorted by priority, then age" padding="none" tone="critical">
            <ul>
              {ALARMS.map((alarm) => (
                <AeRow key={alarm.id} alarm={alarm} density="compact" />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="23 Gas compression" subtitle="Annunciator" padding="none">
            <AnnunciatorGrid label="Gas compression annunciator" windows={AE_WINDOWS} columns={3} selected={selected} onSelect={setSelected} />
          </Panel>
          <Panel className="col-span-7" title="Alarm rate" subtitle="Per 10 min · flood limit 10">
            <AeRateBars height={200} />
          </Panel>
          <Panel className="col-span-5" title="Sequence of events" subtitle="23-KA-9103 · 13:31 to 13:52">
            <EventTimeline label="Sequence of events for the recompressor trip" events={AE_EVENTS} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmsAndEventsSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" tone="critical">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <p className="text-lg font-semibold">Top alarm · 14 min ago</p>
              <div className="flex items-center gap-5">
                <IconAlertOctagon className="size-20 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-6xl leading-none font-extrabold tracking-tighter">Recompressor tripped</p>
              </div>
              <p className="text-xl font-medium">High vibration on 23-VT-92740: 11.6 mm/s against a trip limit of 11.0. Not acknowledged.</p>
            </div>
          </Panel>
          <div className="col-span-5 grid grid-cols-2 gap-2">
            {AE_SEVERITIES.map((severity) => (
              <Stat
                key={severity}
                size="lg"
                tone={AE_COUNT[severity] === 0 ? 'success' : AE_TONE[severity]}
                label={AE_WORD[severity]}
                value={AE_COUNT[severity]}
                unit="open"
                state={AE_COUNT[severity] === 0 ? 'Clear' : severity === 'critical' ? 'Act now' : severity === 'high' ? 'Respond' : 'Monitor'}
                stateIcon={AE_COUNT[severity] === 0 ? <IconCircleCheck /> : <AeIcon severity={severity} />}
              />
            ))}
          </div>
          <Panel className="col-span-7" title="Open alarms" subtitle="Unacknowledged alarms fill their row">
            <ul>
              {AE_OPEN.map((alarm) => (
                <AeRow key={alarm.id} alarm={alarm} />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Gas compression" subtitle="Annunciator, 12 points">
            <AnnunciatorGrid label="Gas compression annunciator" windows={AE_WINDOWS} columns={3} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmsAndEventsPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <StatGroup columns={4} label="Open alarms by priority" className="col-span-12">
            {AE_SEVERITIES.map((severity) => (
              <Stat key={severity} size="hero" tone={AE_TONE[severity]} label={AE_WORD[severity]} value={AE_COUNT[severity]} unit="open" target={`${AE_HISTORY[severity].reduce((sum, count) => sum + count, 0)} raised in 12 h`} />
            ))}
          </StatGroup>
          <Panel className="col-span-7" title="Open alarms" subtitle="Worst first" padding="none">
            <ul>
              {AE_OPEN.map((alarm) => (
                <AeRow key={alarm.id} alarm={alarm} />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Alarm rate" subtitle="Per ten minutes, flood limit 10">
            <AeRateBars height={280} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmsAndEventsEditorial() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <Grid>
          <div className="col-span-12 flex flex-col gap-2">
            <p className="text-sm font-medium text-medium-foreground">Nordkapp alarm report · Thursday 12 March 2026 · day shift</p>
            <h3 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight">One trip, one flood, and a temperature alarm that came back nine times.</h3>
          </div>
          <StatGroup columns={4} label="Shift figures" className="col-span-12">
            <Stat variant="plain" size="lg" label="Alarms raised" value={71} delta={{ value: 23, decimals: 0, good: 'down', caption: 'on yesterday' }} />
            <Stat variant="plain" size="lg" label="Peak rate" value={17} unit="per 10 min" target="Flood limit 10" />
            <Stat variant="plain" size="lg" label="Acknowledged in 10 min" value={86} unit="%" target="Target 90 %" />
            <Stat variant="plain" size="lg" label="Standing over 24 h" value={1} target="Target 0" />
          </StatGroup>
          <Panel className="col-span-7" title="Open at handover" subtitle="Five alarms carry over to the night shift">
            <ul>
              {AE_OPEN.map((alarm) => (
                <AeRow key={alarm.id} alarm={alarm} />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="The trip, minute by minute" subtitle="Recompressor 23-KA-9103">
            <EventTimeline label="Sequence of events for the recompressor trip" events={AE_EVENTS} />
          </Panel>
          <Panel className="col-span-12" title="Standing time" subtitle="Every open alarm on the same 24-hour clock" footer={<AeLaneLegend />}>
            <AlarmLanes label="Standing time per alarm over the last 24 hours" lanes={AE_LANES.slice(0, 5)} ticks={AE_LANE_TICKS} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmsAndEventsWorkbench() {
  const [selected, setSelected] = useState(AE_OPEN[0].id);
  const alarm = AE_OPEN.find((item) => item.id === selected) ?? AE_OPEN[0];
  const unit = findAsset(alarm.assetId);
  return (
    <LookScope look="studio">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={AE_NAV}
        current="alarms"
        title="Alarms"
        subtitle="5 open · 1 shelved · updated 14:00 UTC"
        status={
          <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
            1 critical
          </StatusPill>
        }
        actions={
          <Button variant="outline" size="sm">
            <IconCheck /> Acknowledge all seen
          </Button>
        }
      >
        <Grid>
          <StatGroup columns={4} label="Open alarms by priority" className="col-span-12">
            <AeCounts />
          </StatGroup>
          <Panel className="col-span-7" title="Open alarms" subtitle="Select an alarm to see its trend and response">
            <ul role="listbox" aria-label="Open alarms">
              {AE_OPEN.map((item) => (
                <AeRow key={item.id} alarm={item} selected={item.id === selected} onSelect={() => setSelected(item.id)} />
              ))}
            </ul>
          </Panel>
          <Panel
            className="col-span-5"
            tone={AE_TONE[alarm.severity]}
            title={alarm.message}
            subtitle={`${unit?.name ?? ''} · ${unit?.tag ?? ''}`}
            icon={
              <IconChip tone={AE_TONE[alarm.severity]}>
                <AeIcon severity={alarm.severity} />
              </IconChip>
            }
            footer={
              <span className="flex flex-wrap gap-2">
                <Button size="sm">
                  <IconCheck /> Acknowledge
                </Button>
                <Button variant="outline" size="sm">
                  <IconBellOff /> Shelve
                </Button>
                <Button variant="outline" size="sm">
                  <IconTool /> Create work order
                </Button>
              </span>
            }
          >
            <div className="flex flex-1 flex-col justify-between gap-5">
              <div className="grid grid-cols-3 gap-4">
                <Stat variant="plain" size="md" label="Value" value={alarm.value} tone={AE_TONE[alarm.severity]} />
                <Stat variant="plain" size="md" label="Limit" value={alarm.limit} />
                <Stat variant="plain" size="md" label="Raised" value={formatTime(alarm.raisedAt)} unit="UTC" />
              </div>
              <AeFacts
                items={[
                  ['Priority', <StatusPill key="p" tone={AE_TONE[alarm.severity]}>{AE_WORD[alarm.severity]}</StatusPill>],
                  ['State', AE_STATE[alarm.state]],
                  ['Tag', <TagId key="t">{alarm.sensorTag}</TagId>],
                  ['Age', formatAgo(alarm.raisedAt)],
                ]}
              />
            </div>
          </Panel>
          <Panel className="col-span-12" title="Standing time per alarm" subtitle="Last 24 hours" footer={<AeLaneLegend />}>
            <AlarmLanes label="Standing time per alarm over the last 24 hours" lanes={AE_LANES} ticks={AE_LANE_TICKS} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function AlarmsAndEventsGlass() {
  return (
    <LookScope look="glass">
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={AE_NAV}
        current="alarms"
        title="Alarm system health"
        subtitle="Day shift · Thursday 12 March"
        status={<StatusPill tone="warning">Flood at 13:40</StatusPill>}
      >
        <Grid>
          <Panel className="col-span-4" title="Operator load" subtitle="This shift against targets">
            <div className="grid flex-1 grid-cols-2 place-items-center gap-5">
              <RingGauge label="Acknowledged in 10 min" value={86} tone="success" size={116} />
              <RingGauge label="Time out of flood" value={94} tone="warning" size={116} />
              <RingGauge label="Alarms with a response" value={78} tone="accent" size={116} />
              <RingGauge label="Shelving slots used" value={20} tone="info" size={116} />
            </div>
          </Panel>
          <Panel className="col-span-8" title="Vibration, recompressor drive end" subtitle="23-VT-92740 · the two hours before the trip">
            <AeVibrationTrend height={280} />
          </Panel>
          <Panel className="col-span-5" title="What happened" subtitle="13:31 to 13:52">
            <EventTimeline label="Sequence of events for the recompressor trip" events={AE_EVENTS.slice(0, 5)} />
          </Panel>
          <Panel className="col-span-7" title="Open alarms" subtitle="5 open, most severe first">
            <AeRows />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

export default definePage({
  id: 'alarms-and-events',
  title: 'Alarms and events',
  summary:
    'Alarms as an operator works them: one row grammar for priority, message, tag, value against limit, state and age, then the summaries, annunciators, timelines and actions built from it — shown in six looks, from a studio list to a console lightbox and a wall screen.',
  guidance: {
    use: [
      'Sort by priority first and age second, so the top of the list is always the next thing to handle.',
      'Say priority three ways: colour, shape and the word. Say state in words.',
      'Show the value next to the limit it crossed; an alarm without its number sends people to another screen.',
      'Let acknowledged, shelved and cleared alarms recede; only what is new and unseen asks for attention.',
    ],
    avoid: [
      'Stacking one banner per alarm — a list of alarms is a list, summarised once above it.',
      'Priority as a small dot or as colour alone.',
      'Hiding shelved alarms without saying how many there are and when they return.',
      'Monospace for tags and values; tabular figures in the UI typeface align just as well.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Rows and states',
      description: 'The alarm row and what it carries. These follow the look chosen in the theme menu.',
      specimens: [
        {
          id: 'AlarmsAndEventsRows',
          title: 'Alarm rows',
          note: 'Pick it for any list an operator works from; the column order never changes.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsRows,
        },
        {
          id: 'AlarmsAndEventsStates',
          title: 'Lifecycle states',
          note: 'Pick these four treatments so an alarm that has been dealt with never competes with a new one.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmsAndEventsStates,
        },
        {
          id: 'AlarmsAndEventsCompact',
          title: 'Compact rows',
          note: 'Pick one-line rows for history, side panels and anywhere more than ten alarms must fit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx'],
          Component: AlarmsAndEventsCompact,
        },
        {
          id: 'AlarmsAndEventsMarkers',
          title: 'Chattering, standing and first-out',
          note: 'Pick a marker when the pattern matters more than the single alarm: it repeats, it never clears, or it caused the rest.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/SparkLine.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmsAndEventsMarkers,
        },
      ],
    },
    {
      id: 'summaries',
      title: 'Summaries',
      description: 'One summary per view: counts, a flood banner, an annunciator, a roll-up per unit.',
      specimens: [
        {
          id: 'AlarmsAndEventsCounts',
          title: 'Counts by priority',
          note: 'Pick it above a list or at the top of a dashboard; a zero stays in place and says so.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx'],
          Component: AlarmsAndEventsCounts,
        },
        {
          id: 'AlarmsAndEventsFlood',
          title: 'Alarm flood',
          note: 'Pick it when the rate passes what one operator can handle: say so once, show the rate, offer first-out only.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx'],
          Component: AlarmsAndEventsFlood,
        },
        {
          id: 'AlarmsAndEventsAnnunciator',
          title: 'Annunciator',
          note: 'Pick it for a fixed set of alarm points on one system, where position is how people find them.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarms-and-events/AnnunciatorGrid.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsAnnunciator,
        },
        {
          id: 'AlarmsAndEventsByUnit',
          title: 'Alarms by unit',
          note: 'Pick it on overview pages to show where the alarms are before which they are.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmsAndEventsByUnit,
        },
      ],
    },
    {
      id: 'acting',
      title: 'Lists and actions',
      description: 'Filtering, selecting, acknowledging and shelving, with the empty state.',
      specimens: [
        {
          id: 'AlarmsAndEventsFiltered',
          title: 'Filter, select and acknowledge',
          note: 'Pick it as the working list: priority filter with counts, selectable rows and acknowledge on the row.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/EmptyPanel.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsFiltered,
        },
        {
          id: 'AlarmsAndEventsAcknowledge',
          title: 'Acknowledge with comment',
          note: 'Pick it when the acknowledgement should carry what the operator checked or did.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsAcknowledge,
        },
        {
          id: 'AlarmsAndEventsShelve',
          title: 'Shelve with duration',
          note: 'Pick it for silencing a known nuisance: a duration, a reason and a compensating check.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsShelve,
        },
        {
          id: 'AlarmsAndEventsDetail',
          title: 'Alarm detail',
          note: 'Pick it as the destination of a row: the trend against its limits beside the response sheet.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmsAndEventsDetail,
        },
        {
          id: 'AlarmsAndEventsEmpty',
          title: 'No active alarms',
          note: 'Pick it when the list is empty: say when the last one cleared and what is shelved.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/EmptyPanel.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsEmpty,
        },
      ],
    },
    {
      id: 'time',
      title: 'Over time',
      description: 'When alarms stood, where they piled up, and the log behind them.',
      specimens: [
        {
          id: 'AlarmsAndEventsTimeline',
          title: 'Event timeline',
          note: 'Pick it to tell one incident in order, mixing alarms, operator actions and system events.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarms-and-events/EventTimeline.tsx', 'kit/Panel.tsx'],
          Component: AlarmsAndEventsTimeline,
        },
        {
          id: 'AlarmsAndEventsLanes',
          title: 'Standing-time lanes',
          note: 'Pick it to see chattering and standing alarms at a glance on one clock.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmLanes.tsx', 'kit/Legend.tsx'],
          Component: AlarmsAndEventsLanes,
        },
        {
          id: 'AlarmsAndEventsHeat',
          title: 'Alarm load by hour',
          note: 'Pick it to show which area and which hours produce the load.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/HeatStrip.tsx', 'kit/Stat.tsx'],
          Component: AlarmsAndEventsHeat,
        },
        {
          id: 'AlarmsAndEventsLog',
          title: 'Event log',
          note: 'Pick a table when the record must be exact, exportable and searchable by time.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: AlarmsAndEventsLog,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same alarms in four looks',
      description: 'Not a recolour: the row, the counts and the timeline are built differently in each.',
      specimens: [
        {
          id: 'AlarmsAndEventsConsole',
          title: 'Console',
          note: 'Pick it for the control room: filled priority blocks on hairlines, a lightbox annunciator and a ledger of events.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/alarms-and-events/AnnunciatorGrid.tsx', 'kit/alarms-and-events/EventTimeline.tsx', 'looks/LookScope.tsx'],
          Component: AlarmsAndEventsConsole,
        },
        {
          id: 'AlarmsAndEventsSignal',
          title: 'Signal',
          note: 'Pick it for a wall screen: the top alarm in words, state-filled tiles and rows that fill until acknowledged.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/alarms-and-events/AnnunciatorGrid.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: AlarmsAndEventsSignal,
        },
        {
          id: 'AlarmsAndEventsPoster',
          title: 'Poster',
          note: 'Pick it for a team board where the four counts must land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/Stat.tsx', 'kit/Bars.tsx', 'looks/LookScope.tsx'],
          Component: AlarmsAndEventsPoster,
        },
        {
          id: 'AlarmsAndEventsEditorial',
          title: 'Editorial',
          note: 'Pick it for the shift or weekly alarm report: ruled rows, large figures and the incident told as a ledger.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarms-and-events/AlarmRow.tsx', 'kit/alarms-and-events/EventTimeline.tsx', 'kit/alarms-and-events/AlarmLanes.tsx', 'looks/LookScope.tsx'],
          Component: AlarmsAndEventsEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Two screens ready to drop into a product.',
      specimens: [
        {
          id: 'AlarmsAndEventsWorkbench',
          title: 'Alarm workbench',
          note: 'Pick it as the alarm page of a desk product: counts, a selectable list, the selected alarm and the day on lanes.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/alarms-and-events/AlarmRow.tsx', 'kit/alarms-and-events/AlarmLanes.tsx', 'kit/Stat.tsx'],
          Component: AlarmsAndEventsWorkbench,
        },
        {
          id: 'AlarmsAndEventsGlass',
          title: 'Alarm system health',
          note: 'Pick it for a review screen on a dark display: operator-load rings, the trend behind the trip and the sequence.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/RingGauge.tsx', 'kit/TrendLine.tsx', 'kit/alarms-and-events/EventTimeline.tsx'],
          Component: AlarmsAndEventsGlass,
        },
      ],
    },
  ],
});
