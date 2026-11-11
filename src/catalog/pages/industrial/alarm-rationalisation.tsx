import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAdjustments,
  IconAlertTriangle,
  IconBellOff,
  IconChecklist,
  IconClipboardList,
  IconFileText,
  IconFlame,
  IconHistory,
  IconLayoutDashboard,
  IconRepeat,
  IconScale,
  IconTarget,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ChangeList, type ChangeItem } from '../../../library/kit/alarm-rationalisation/ChangeList';
import { LimitScale, type ScaleBand } from '../../../library/kit/alarm-rationalisation/LimitScale';
import {
  CONSEQUENCES,
  CONSEQUENCE_LABEL,
  PRIORITY_LABEL,
  URGENCIES,
  URGENCY_LABEL,
  derivePriority,
  isConsequence,
  isUrgency,
  urgencyOf,
  type AlarmPriority,
  type Consequence,
  type Urgency,
} from '../../../library/kit/alarm-rationalisation/priority';
import { PriorityMatrix, type MatrixCell } from '../../../library/kit/alarm-rationalisation/PriorityMatrix';
import { replayAlarm } from '../../../library/kit/alarm-rationalisation/replay';
import { StageTrack, type Stage } from '../../../library/kit/alarm-rationalisation/StageTrack';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut, type DonutSegment } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './alarm-rationalisation.tsx?raw';

const AR_TONE: Record<AlarmPriority, Tone> = { high: 'critical', medium: 'warning', low: 'info', none: 'neutral' };

type ArEntry = {
  tag: string;
  text: string;
  cause: string;
  effect: string;
  action: string;
  consequence: Consequence;
  /** Minutes the operator has before the consequence. */
  minutes: number;
  current: AlarmPriority;
  /** Activations in the last 30 days. */
  activations: number;
  review: 'Approved' | 'Reviewed' | 'Draft';
};

const AR_ENTRIES: ArEntry[] = [
  { tag: '23-TT-92532', text: 'Discharge temperature high', cause: 'Fouled interstage cooler', effect: 'Seal damage, trip at 155 °C', action: 'Reduce load, check cooler outlet', consequence: 'major', minutes: 15, current: 'high', activations: 214, review: 'Reviewed' },
  { tag: '23-VT-92740', text: 'Recompressor vibration high-high', cause: 'Bearing wear, surge', effect: 'Machine damage, loss of recompression', action: 'Confirm trip, do not restart', consequence: 'severe', minutes: 2, current: 'high', activations: 3, review: 'Approved' },
  { tag: '20-LT-10012', text: 'Separator level deviation', cause: 'Slugging from the inlet', effect: 'Carry-over to compression', action: 'Trim the level controller', consequence: 'moderate', minutes: 8, current: 'low', activations: 96, review: 'Reviewed' },
  { tag: '23-TT-91141', text: 'Cooler outlet temperature high', cause: 'Low cooling water flow', effect: 'Higher discharge temperature', action: 'Start the standby cooling pump', consequence: 'moderate', minutes: 25, current: 'medium', activations: 131, review: 'Draft' },
  { tag: '27-IT-20013', text: 'Export pump motor current high', cause: 'High export rate, worn impeller', effect: 'Motor trip, export loss', action: 'Reduce flow, start pump B', consequence: 'major', minutes: 5, current: 'low', activations: 41, review: 'Reviewed' },
  { tag: '27-PA-2001B', text: 'Standby test overdue', cause: 'Test not scheduled', effect: 'Unknown standby readiness', action: 'None in the control room', consequence: 'minor', minutes: 2880, current: 'low', activations: 12, review: 'Draft' },
  { tag: '40-TT-40015', text: 'Bearing temperature signal lost', cause: 'Transmitter fault', effect: 'No protection reading', action: 'Read the local gauge hourly', consequence: 'moderate', minutes: 45, current: 'medium', activations: 58, review: 'Reviewed' },
  { tag: '23-PT-92530', text: 'Suction pressure low', cause: 'Upstream restriction', effect: 'Surge, trip on low suction', action: 'Open the recycle valve', consequence: 'severe', minutes: 6, current: 'medium', activations: 9, review: 'Approved' },
];

const arProposed = (entry: ArEntry): AlarmPriority => derivePriority(entry.consequence, urgencyOf(entry.minutes));

const arRespond = (minutes: number): string => (minutes >= 1440 ? `${Math.round(minutes / 1440)} d` : `${minutes} min`);

const AR_REVIEW_TONE: Record<ArEntry['review'], Tone> = { Approved: 'success', Reviewed: 'info', Draft: 'neutral' };

function ArPriority({ priority, variant }: { priority: AlarmPriority; variant?: 'filled' | 'soft' | 'outline' }) {
  return (
    <StatusPill tone={AR_TONE[priority]} variant={variant}>
      {PRIORITY_LABEL[priority]}
    </StatusPill>
  );
}

const AR_WORKSHEET: DataTableColumn<ArEntry>[] = [
  { id: 'alarm', header: 'Alarm', cell: (entry) => entry.text },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (entry) => <TagId>{entry.tag}</TagId> },
  { id: 'consequence', header: 'Consequence', nowrap: true, cell: (entry) => CONSEQUENCE_LABEL[entry.consequence] },
  { id: 'respond', header: 'Time to respond', numeric: true, nowrap: true, cell: (entry) => arRespond(entry.minutes) },
  { id: 'current', header: 'Current', nowrap: true, cell: (entry) => <ArPriority priority={entry.current} variant="outline" /> },
  { id: 'proposed', header: 'Derived', nowrap: true, cell: (entry) => <ArPriority priority={arProposed(entry)} /> },
  { id: 'review', header: 'Review', nowrap: true, cell: (entry) => <StatusPill tone={AR_REVIEW_TONE[entry.review]}>{entry.review}</StatusPill> },
];

const AR_CELL_COUNT: Record<Consequence, Record<Urgency, number>> = {
  minor: { 'over-30': 212, '10-30': 164, '3-10': 71, 'under-3': 12 },
  moderate: { 'over-30': 96, '10-30': 148, '3-10': 83, 'under-3': 19 },
  major: { 'over-30': 34, '10-30': 61, '3-10': 44, 'under-3': 14 },
  severe: { 'over-30': 6, '10-30': 12, '3-10': 17, 'under-3': 9 },
};

const AR_ROWS = CONSEQUENCES.map((id) => ({ id, label: CONSEQUENCE_LABEL[id] }));

const AR_COLUMNS = URGENCIES.map((id) => ({ id, label: URGENCY_LABEL[id] }));

function arCell(row: string, column: string, counts = false): MatrixCell {
  if (!isConsequence(row) || !isUrgency(column)) return { label: '—', tone: 'neutral' };
  const priority = derivePriority(row, column);
  return { label: priority === 'none' ? 'Event' : PRIORITY_LABEL[priority], tone: AR_TONE[priority], count: counts ? AR_CELL_COUNT[row][column] : undefined };
}

const AR_DISTRIBUTION: DonutSegment[] = [
  { label: 'High', value: 22, tone: 'critical' },
  { label: 'Medium', value: 31, tone: 'warning' },
  { label: 'Low', value: 47, tone: 'info' },
];

type ArActor = { tag: string; text: string; count: number; share: number; category: string; fix: string; tone: Tone };

const AR_ACTORS: ArActor[] = [
  { tag: '23-TT-92532', text: 'Discharge temp high', count: 214, share: 18, category: 'Chattering', fix: 'Deadband 1.5 °C', tone: 'warning' },
  { tag: '23-TT-91141', text: 'Cooler outlet temp high', count: 131, share: 11, category: 'Chattering', fix: 'On-delay 60 s', tone: 'warning' },
  { tag: '20-LT-10012', text: 'Separator level dev.', count: 96, share: 8, category: 'Wrong limit', fix: 'Limit 70 → 74 %', tone: 'info' },
  { tag: '40-TT-40015', text: 'Bearing temp signal lost', count: 58, share: 5, category: 'Stale', fix: 'Replace transmitter', tone: 'neutral' },
  { tag: '27-IT-20013', text: 'Motor current high', count: 41, share: 3, category: 'Wrong priority', fix: 'Low → High', tone: 'critical' },
  { tag: '27-PA-2001B', text: 'Standby test overdue', count: 12, share: 1, category: 'No action', fix: 'Make it a work order', tone: 'neutral' },
];

const AR_NUISANCE: DonutSegment[] = [
  { label: 'Chattering', value: 345, tone: 'amber' },
  { label: 'Wrong limit', value: 96, tone: 'blue' },
  { label: 'Stale', value: 58, tone: 'purple' },
  { label: 'Wrong priority', value: 41, tone: 'pink' },
  { label: 'No operator action', value: 12, tone: 'teal' },
];

const AR_TEMPERATURE = makeSeries({ seed: 204, points: 145, base: 144.1, amplitude: 1.0, noise: 1.1, cycles: 3, decimals: 1, stepMs: 10 * 60_000 });

const AR_TEMPERATURE_VALUES = AR_TEMPERATURE.map((point) => point.v);

const AR_TEMPERATURE_LABELS = AR_TEMPERATURE.map((point) => formatTime(point.t));

const AR_CHANGES: ChangeItem[] = [
  { id: 'limit', attribute: 'High limit', from: '145.0 °C', to: '147.0 °C', reason: 'Normal operation reaches 145.8 °C at full load; seal limit is 155 °C.' },
  { id: 'deadband', attribute: 'Deadband', from: '0.0 °C', to: '1.5 °C', reason: '1 % of span for temperature signals.' },
  { id: 'delay', attribute: 'On-delay', from: '0 s', to: '60 s', reason: 'Temperature moves slowly; a minute costs nothing.' },
  { id: 'priority', attribute: 'Priority', from: 'High', to: 'Medium', reason: 'Major consequence with 15 minutes to respond.' },
  { id: 'trip', attribute: 'Trip limit', from: '155.0 °C', to: '155.0 °C' },
];

const AR_STAGES: Stage[] = [
  { id: 'draft', label: 'Drafted', detail: 'Aisha Khan · 4 Mar', state: 'done' },
  { id: 'replay', label: 'Replayed on data', detail: '30 days · 6 Mar', state: 'done' },
  { id: 'review', label: 'Reviewed', detail: 'Alarm board · 10 Mar', state: 'done' },
  { id: 'approve', label: 'Approved', detail: 'Liv Wold · due 14 Mar', state: 'current' },
  { id: 'implement', label: 'Implemented', state: 'todo' },
  { id: 'verify', label: 'Verified', detail: 'After 30 days', state: 'todo' },
];

type ArShelved = { tag: string; text: string; kind: string; reason: string; owner: string; approver: string; until: string; state: 'Active' | 'Review due' | 'Expired'; tone: Tone };

const AR_REGISTER: ArShelved[] = [
  { tag: '40-TT-40015', text: 'Bearing temperature signal lost', kind: 'Shelved', reason: 'Transmitter fault, WO-104479', owner: 'Ingrid Haugen', approver: 'Liv Wold', until: '12 Mar 18:00', state: 'Active', tone: 'info' },
  { tag: '20-LT-10013', text: 'Test separator level low', kind: 'Out of service', reason: 'Separator isolated for inspection', owner: 'Magnus Solberg', approver: 'Liv Wold', until: '20 Mar', state: 'Active', tone: 'info' },
  { tag: '23-PDT-9255', text: 'Seal gas differential low', kind: 'Suppressed by design', reason: 'Suppressed while the machine is stopped', owner: 'Aisha Khan', approver: 'Alarm board', until: 'Permanent', state: 'Review due', tone: 'warning' },
  { tag: '27-FT-20011', text: 'Export flow low', kind: 'Shelved', reason: 'Pump changeover', owner: 'Ingrid Haugen', approver: 'Liv Wold', until: '11 Mar 06:00', state: 'Expired', tone: 'critical' },
];

const AR_REGISTER_COLUMNS: DataTableColumn<ArShelved>[] = [
  { id: 'alarm', header: 'Alarm', cell: (item) => item.text },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (item) => <TagId>{item.tag}</TagId> },
  { id: 'kind', header: 'Type', nowrap: true, cell: (item) => item.kind },
  { id: 'reason', header: 'Reason', muted: true, cell: (item) => item.reason },
  {
    id: 'owner',
    header: 'Owner and approver',
    nowrap: true,
    cell: (item) => (
      <span className="flex flex-col">
        <span>{item.owner}</span>
        <span className="text-medium-foreground">Approved by {item.approver}</span>
      </span>
    ),
  },
  { id: 'until', header: 'Until', nowrap: true, numeric: true, cell: (item) => item.until },
  { id: 'state', header: 'State', nowrap: true, cell: (item) => <StatusPill tone={item.tone}>{item.state}</StatusPill> },
];

const AR_AUDIT: ReadonlyArray<{ id: string; when: string; who: string; what: string; detail: string; tone: Tone }> = [
  { id: 'a1', when: '10 Mar 14:20', who: 'Alarm board', what: 'Reviewed 23-TT-92532', detail: 'Priority High → Medium accepted, limit change sent for approval', tone: 'info' },
  { id: 'a2', when: '6 Mar 09:05', who: 'Aisha Khan', what: 'Replayed proposed settings', detail: '214 → 9 activations on 30 days of data', tone: 'accent' },
  { id: 'a3', when: '4 Mar 16:40', who: 'Aisha Khan', what: 'Drafted change MOC-2231', detail: 'Limit, deadband, on-delay and priority', tone: 'neutral' },
  { id: 'a4', when: '1 Mar 08:00', who: 'System', what: 'Flagged as bad actor', detail: '18 % of all activations in February', tone: 'warning' },
];

const AR_AGENDA: ReadonlyArray<{ id: string; title: string; meta: string; state: string; tone: Tone }> = [
  { id: 'g1', title: 'Top ten bad actors, February', meta: '6 alarms · 30 min', state: 'Done', tone: 'success' },
  { id: 'g2', title: 'Gas compression temperature alarms', meta: '14 alarms · 45 min', state: 'In review', tone: 'info' },
  { id: 'g3', title: 'Alarms without an operator action', meta: '9 alarms · 20 min', state: 'Next', tone: 'neutral' },
  { id: 'g4', title: 'Shelving register and overdue reviews', meta: '4 entries · 15 min', state: 'Next', tone: 'neutral' },
];

const AR_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'worksheet', label: 'Worksheet', icon: <IconClipboardList />, badge: '8' },
  { id: 'actors', label: 'Bad actors', icon: <IconRepeat /> },
  { id: 'changes', label: 'Changes', icon: <IconAdjustments />, badge: '3' },
  { id: 'register', label: 'Shelving register', icon: <IconBellOff /> },
  { id: 'philosophy', label: 'Philosophy', icon: <IconFileText /> },
];

function ArFacts({ items }: { items: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
      {items.map(([term, detail]) => (
        <div key={term} className="col-span-2 grid grid-cols-subgrid items-baseline">
          <dt className="text-medium-foreground">{term}</dt>
          <dd className="font-medium">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function ArRecordFacts({ entry }: { entry: ArEntry }) {
  return (
    <ArFacts
      items={[
        ['Cause', entry.cause],
        ['Consequence of no action', `${entry.effect} · ${CONSEQUENCE_LABEL[entry.consequence]}`],
        ['Operator action', entry.action],
        ['Time to respond', arRespond(entry.minutes)],
        ['Response sheet', 'In the operating procedure, reviewed yearly'],
        ['Activations, 30 days', <span key="n" className="tabular-nums">{entry.activations}</span>],
      ]}
    />
  );
}

function ArEntryMatrix({ entry, size }: { entry: ArEntry; size?: 'sm' | 'md' }) {
  return (
    <PriorityMatrix
      size={size}
      label={`Priority of ${entry.tag} by consequence and time to respond`}
      rows={AR_ROWS}
      columns={AR_COLUMNS}
      rowHeader="Consequence"
      columnHeader="Time to respond"
      cell={(row, column) => arCell(row, column)}
      selected={{ row: entry.consequence, column: urgencyOf(entry.minutes) }}
    />
  );
}

function ArDerived({ entry }: { entry: ArEntry }) {
  const proposed = arProposed(entry);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <span className="text-medium-foreground">Current</span>
      <ArPriority priority={entry.current} variant="outline" />
      <span className="text-medium-foreground">Derived</span>
      <ArPriority priority={proposed} variant="filled" />
      <span className="font-medium">{proposed === entry.current ? 'No change' : proposed === 'none' ? 'Make it an event or a work order' : 'Change proposed'}</span>
    </div>
  );
}

function ArLimitScale({ proposed = 147, deadband = 1.5 }: { proposed?: number; deadband?: number }) {
  const bands: ScaleBand[] = [{ id: 'normal', from: 138, to: 145.8, tone: 'success', label: 'Normal operation 138 to 145.8 °C' }];
  if (deadband > 0) bands.push({ id: 'deadband', from: proposed - deadband, to: proposed, tone: 'accent', label: `Deadband ${deadband} °C` });
  return (
    <LimitScale
      label="Discharge temperature limits"
      min={130}
      max={160}
      unit="°C"
      decimals={1}
      reading={144.1}
      bands={bands}
      markers={[
        { id: 'current', value: 145, label: 'Current limit', tone: 'warning', side: 'below' },
        { id: 'proposed', value: proposed, label: 'Proposed', tone: 'accent', dashed: true },
        { id: 'trip', value: 155, label: 'Trip', tone: 'critical' },
      ]}
    />
  );
}

function ArReplayTrend({ proposed = 147, height = 250 }: { proposed?: number; height?: number }) {
  return (
    <TrendLine
      label="Discharge temperature over the last 24 hours against the current and the proposed high limit"
      labels={AR_TEMPERATURE_LABELS}
      unit="°C"
      height={height}
      yDomain={[140, 149]}
      highlightLast={false}
      series={[{ id: 'temperature', label: '23-TT-92532', values: AR_TEMPERATURE_VALUES, tone: 'accent' }]}
      limits={[
        { value: 145, label: 'Current', tone: 'warning' },
        { value: proposed, label: 'Proposed', tone: 'success' },
      ]}
    />
  );
}

const AR_OPTIONS = [
  { id: 'now', label: 'As it is', settings: { limit: 145 } },
  { id: 'deadband', label: 'Deadband 1.5', settings: { limit: 145, deadband: 1.5 } },
  { id: 'delay', label: 'Delay 60 s', settings: { limit: 145, deadband: 1.5, delaySamples: 1 } },
  { id: 'limit', label: 'Limit 147', settings: { limit: 147, deadband: 1.5, delaySamples: 1 } },
];

const AR_OPTION_COUNTS = AR_OPTIONS.map((option) => replayAlarm(AR_TEMPERATURE_VALUES, option.settings).activations);

function ArReplayBars({ height = 240 }: { height?: number }) {
  return (
    <Bars
      label="Activations in 24 hours of recorded data for four settings, each adding to the one before"
      categories={AR_OPTIONS.map((option) => option.label)}
      series={[{ id: 'count', label: 'Activations in 24 h', values: AR_OPTION_COUNTS }]}
      tones={['warning', 'accent', 'accent', 'success']}
      limit={{ value: 2, label: 'Target', tone: 'success' }}
      showValues
      height={height}
    />
  );
}

function ArActorBars({ height = 260 }: { height?: number }) {
  return (
    <Bars
      label="Activations in 30 days for the six most frequent alarms"
      orientation="horizontal"
      categories={AR_ACTORS.map((actor) => actor.text)}
      series={[{ id: 'count', label: 'Activations', values: AR_ACTORS.map((actor) => actor.count) }]}
      tones={AR_ACTORS.map((actor) => actor.tone)}
      showValues
      height={height}
    />
  );
}

function ArDistributionBars({ height = 240 }: { height?: number }) {
  return (
    <Bars
      label="Share of configured alarms per priority in per cent, against the recommended distribution"
      categories={['High', 'Medium', 'Low']}
      series={[
        { id: 'now', label: 'Configured now', values: [22, 31, 47], tone: 'warning' },
        { id: 'after', label: 'After rationalisation', values: [6, 17, 77], tone: 'accent' },
        { id: 'target', label: 'Recommended', values: [5, 15, 80], tone: 'neutral' },
      ]}
      showValues
      height={height}
    />
  );
}

function ArKpis({ plain = false, size = 'md' }: { plain?: boolean; size?: 'md' | 'lg' | 'hero' }) {
  const variant = plain ? 'plain' : 'tile';
  return (
    <>
      <Stat variant={variant} size={size} tone="success" icon={plain ? undefined : <IconUsers />} label="Alarms per operator" value={0.9} decimals={1} unit="per 10 min" delta={{ value: -2.5, good: 'down', caption: 'was 3.4' }} target="Target 1.0" />
      <Stat variant={variant} size={size} tone="warning" icon={plain ? undefined : <IconAlertTriangle />} label="Peak rate" value={14} unit="per 10 min" delta={{ value: -28, decimals: 0, good: 'down', caption: 'was 42' }} target="Target 10" />
      <Stat variant={variant} size={size} tone="success" icon={plain ? undefined : <IconHistory />} label="Standing alarms" value={4} delta={{ value: -14, decimals: 0, good: 'down', caption: 'was 18' }} target="Target 5" />
      <Stat variant={variant} size={size} tone="success" icon={plain ? undefined : <IconRepeat />} label="Chattering alarms" value={2} delta={{ value: -9, decimals: 0, good: 'down', caption: 'was 11' }} target="Target 0" />
    </>
  );
}

function AlarmRationalisationRecord() {
  const entry = AR_ENTRIES[0];
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-7"
          title={entry.text}
          subtitle={`Alarm master record · ${entry.tag} · 1st stage compressor`}
          icon={
            <IconChip tone="warning">
              <IconFileText />
            </IconChip>
          }
          actions={<StatusPill tone={AR_REVIEW_TONE[entry.review]}>{entry.review}</StatusPill>}
          footer={<ArDerived entry={entry} />}
        >
          <ArRecordFacts entry={entry} />
        </Panel>
        <Panel className="col-span-5" title="Derived priority" subtitle="Major consequence, 15 minutes to respond">
          <ArEntryMatrix entry={entry} size="sm" />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmRationalisationMatrix() {
  const [cell, setCell] = useState<{ row: string; column: string }>({ row: 'major', column: '3-10' });
  const picked = arCell(cell.row, cell.column, true);
  return (
    <Canvas>
      <Panel
        title="Priority matrix"
        subtitle="Where the 1,002 configured alarms sit"
        footer={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill tone={picked.tone}>{picked.label}</StatusPill>
            <span className="font-medium text-base-foreground tabular-nums">{picked.count} alarms in this cell</span>
            <span>Select a cell to list them.</span>
          </span>
        }
      >
        <PriorityMatrix
          label="Configured alarms by consequence and time to respond"
          rows={AR_ROWS}
          columns={AR_COLUMNS}
          rowHeader="Consequence"
          columnHeader="Time to respond"
          cell={(row, column) => arCell(row, column, true)}
          selected={cell}
          onSelect={(row, column) => setCell({ row, column })}
        />
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationCalculator() {
  const [consequence, setConsequence] = useState<Consequence>('major');
  const [urgency, setUrgency] = useState<Urgency>('10-30');
  const priority = derivePriority(consequence, urgency);
  return (
    <Canvas>
      <Panel
        title="Priority calculator"
        subtitle="Two answers in, one priority out"
        icon={
          <IconChip tone="accent">
            <IconScale />
          </IconChip>
        }
        footer={priority === 'none' ? 'No alarm is justified: log it as an event or raise a work order.' : 'The priority follows from the answers, never from how important the alarm feels.'}
      >
        <div className="flex flex-1 flex-col justify-between gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Consequence if nobody acts</span>
            <SegmentedControl value={consequence} onValueChange={(next) => (isConsequence(next) ? setConsequence(next) : undefined)}>
              <SegmentedControlList aria-label="Consequence if nobody acts">
                {CONSEQUENCES.map((item) => (
                  <SegmentedControlButton key={item} value={item}>
                    {CONSEQUENCE_LABEL[item]}
                  </SegmentedControlButton>
                ))}
              </SegmentedControlList>
            </SegmentedControl>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Time the operator has</span>
            <SegmentedControl value={urgency} onValueChange={(next) => (isUrgency(next) ? setUrgency(next) : undefined)}>
              <SegmentedControlList aria-label="Time the operator has">
                {URGENCIES.map((item) => (
                  <SegmentedControlButton key={item} value={item}>
                    {URGENCY_LABEL[item]}
                  </SegmentedControlButton>
                ))}
              </SegmentedControlList>
            </SegmentedControl>
          </div>
          <Stat
            size="lg"
            tone={AR_TONE[priority]}
            emphasis="strong"
            label="Derived priority"
            value={priority === 'none' ? 'Not an alarm' : PRIORITY_LABEL[priority]}
            target={`${CONSEQUENCE_LABEL[consequence]} consequence · ${URGENCY_LABEL[urgency].toLowerCase()}`}
          />
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationWorksheet() {
  return (
    <Canvas>
      <Panel title="Rationalisation worksheet" subtitle="Gas processing · 8 of 1,002 alarms shown · derived priority beside the configured one" padding="none" actions={<Button variant="outline" size="sm">Export</Button>}>
        <DataTable
          label="Rationalisation worksheet"
          flush
          columns={AR_WORKSHEET}
          rows={AR_ENTRIES}
          rowKey={(entry) => entry.tag}
          rowTone={(entry) => (arProposed(entry) === entry.current ? undefined : 'warning')}
        />
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationDistribution() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-5" title="Priority distribution" subtitle="Configured alarms today" footer="Too many high-priority alarms: when everything is urgent, nothing is.">
          <div className="flex flex-1 items-center justify-center">
            <Donut label="Configured alarms by priority" segments={AR_DISTRIBUTION} unit=" %" centerValue="1,002" centerCaption="alarms" size={164} />
          </div>
        </Panel>
        <Panel className="col-span-7" title="Against the recommended split" subtitle="Per cent of configured alarms · about 5 high, 15 medium and 80 low">
          <ArDistributionBars />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmRationalisationBadActors() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-6" title="Bad actors" subtitle="Six alarms raise 46 % of all activations · last 30 days">
          <ArActorBars />
        </Panel>
        <Panel className="col-span-6" title="Review list" subtitle="Each with its nuisance category and the proposed fix">
          <ul>
            {AR_ACTORS.slice(0, 5).map((actor) => (
              <ListRow
                key={actor.tag}
                tone={actor.tone}
                title={actor.text}
                meta={
                  <>
                    <TagId>{actor.tag}</TagId>
                    <span>{actor.fix}</span>
                  </>
                }
                trailing={<StatusPill tone={actor.tone}>{actor.category}</StatusPill>}
              />
            ))}
          </ul>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmRationalisationKpis() {
  return (
    <Canvas>
      <StatGroup columns={4} label="Alarm system performance before and after rationalisation">
        <ArKpis />
      </StatGroup>
    </Canvas>
  );
}

function AlarmRationalisationCompleteness() {
  return (
    <Canvas>
      <Panel title="Documentation completeness" subtitle="Alarms with cause, consequence, action and time to respond" footer="An alarm without an operator action is not an alarm.">
        <div className="flex flex-1 flex-col justify-between gap-5">
          <Meter label="Inlet and separation" value={96} max={100} unit="%" tone="success" target={{ value: 95, label: 'Target' }} />
          <Meter label="Gas compression" value={71} max={100} unit="%" tone="warning" target={{ value: 95, label: 'Target' }} />
          <Meter label="Gas export" value={88} max={100} unit="%" tone="warning" target={{ value: 95, label: 'Target' }} />
          <Meter label="Cooling water" value={52} max={100} unit="%" tone="critical" target={{ value: 95, label: 'Target' }} />
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationNuisance() {
  return (
    <Canvas>
      <Panel title="Nuisance categories" subtitle="Why the bad actors raise · activations in 30 days" footer="Chattering is fixed with deadband and delay before the limit is touched.">
        <div className="flex flex-1 items-center justify-center">
          <Donut label="Nuisance activations by category" segments={AR_NUISANCE} centerCaption="activations" size={172} />
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationLimit() {
  const [limit, setLimit] = useState('147');
  const [deadband, setDeadband] = useState('1.5');
  const proposed = Number(limit);
  const band = Number(deadband);
  const now = replayAlarm(AR_TEMPERATURE_VALUES, { limit: 145 });
  const after = replayAlarm(AR_TEMPERATURE_VALUES, { limit: proposed, deadband: band });
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-7"
          title="Replay a proposed limit"
          subtitle="23-TT-92532 · 24 hours of recorded data"
          actions={
            <SegmentedControl value={limit} onValueChange={(next) => setLimit(String(next))}>
              <SegmentedControlList size="small" aria-label="Proposed high limit">
                <SegmentedControlButton value="145">145 °C</SegmentedControlButton>
                <SegmentedControlButton value="146">146 °C</SegmentedControlButton>
                <SegmentedControlButton value="147">147 °C</SegmentedControlButton>
                <SegmentedControlButton value="148">148 °C</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <ArReplayTrend proposed={proposed} />
        </Panel>
        <Panel
          className="col-span-5"
          title="Replay result"
          subtitle="Same data, proposed settings"
          actions={
            <SegmentedControl value={deadband} onValueChange={(next) => setDeadband(String(next))}>
              <SegmentedControlList size="small" aria-label="Deadband">
                <SegmentedControlButton value="0">No deadband</SegmentedControlButton>
                <SegmentedControlButton value="1.5">1.5 °C</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Stat variant="plain" size="lg" tone="warning" label="Activations now" value={now.activations} target="Limit 145 °C, no deadband" />
              <Stat
                variant="plain"
                size="lg"
                tone="success"
                label="With proposal"
                value={after.activations}
                delta={{ value: after.activations - now.activations, decimals: 0, good: 'down' }}
                target={`Standing ${Math.round((after.standingSamples * 10) / 6) / 10} h of 24`}
              />
            </div>
            <ArLimitScale proposed={proposed} deadband={band} />
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmRationalisationReplay() {
  return (
    <Canvas>
      <Panel title="Replay of options" subtitle="Each step adds to the one before" footer="Deadband and delay remove most of the chatter before the limit moves.">
        <ArReplayBars />
      </Panel>
    </Canvas>
  );
}

const AR_TUNING: ReadonlyArray<{ id: string; signal: string; deadband: string; delay: string; why: string }> = [
  { id: 'flow', signal: 'Flow', deadband: '5 %', delay: '15 s', why: 'Noisy, fast' },
  { id: 'level', signal: 'Level', deadband: '5 %', delay: '60 s', why: 'Slow, sloshing' },
  { id: 'pressure', signal: 'Pressure', deadband: '2 %', delay: '15 s', why: 'Fast, clean' },
  { id: 'temperature', signal: 'Temperature', deadband: '1 %', delay: '60 s', why: 'Slow, clean' },
];

function AlarmRationalisationTuning() {
  const [signal, setSignal] = useState('temperature');
  const picked = AR_TUNING.find((item) => item.id === signal) ?? AR_TUNING[3];
  return (
    <Canvas>
      <Panel
        title="Deadband and delay"
        subtitle="Starting points by signal type"
        icon={
          <IconChip tone="accent">
            <IconAdjustments />
          </IconChip>
        }
        footer={`${picked.signal} signals are ${picked.why.toLowerCase()}. Tune from these values with a replay.`}
      >
        <div className="flex flex-1 flex-col justify-between gap-5">
          <SegmentedControl value={signal} onValueChange={(next) => setSignal(String(next))}>
            <SegmentedControlList aria-label="Signal type">
              {AR_TUNING.map((item) => (
                <SegmentedControlButton key={item.id} value={item.id}>
                  {item.signal}
                </SegmentedControlButton>
              ))}
            </SegmentedControlList>
          </SegmentedControl>
          <div className="grid grid-cols-3 gap-3">
            <Stat size="md" tone="accent" label="Deadband" value={picked.deadband} target="Of span" />
            <Stat size="md" tone="teal" label="On-delay" value={picked.delay} target="Before it raises" />
            <Stat size="md" tone="purple" label="Off-delay" value={picked.delay} target="Before it clears" />
          </div>
          <Meter label="Chatter removed in replay with these values" value={signal === 'temperature' ? 81 : signal === 'level' ? 74 : signal === 'flow' ? 68 : 59} max={100} unit="%" tone="success" hideScale />
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationChange() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-12" title="Management of change MOC-2231" subtitle="23-TT-92532 Discharge temperature high" actions={<StatusPill tone="info">Waiting for approval</StatusPill>}>
          <StageTrack label="Management of change status" stages={AR_STAGES} />
        </Panel>
        <Panel className="col-span-7" title="Proposed changes" subtitle="Current against proposed, with the reason for each">
          <ChangeList label="Proposed changes to 23-TT-92532" items={AR_CHANGES} className="flex-1" />
        </Panel>
        <Panel className="col-span-5" title="On the range" subtitle="Drawn to scale, 130 to 160 °C" footer="8 °C of margin is left between the proposed alarm and the trip.">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <ArLimitScale />
            <div className="grid grid-cols-2 gap-4">
              <Stat variant="plain" size="md" tone="success" label="Margin to trip" value={8} unit="°C" target="Was 10 °C" />
              <Stat variant="plain" size="md" label="Above normal operation" value={1.2} decimals={1} unit="°C" target="Was −0.8 °C" />
            </div>
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function AlarmRationalisationRegister() {
  return (
    <Canvas>
      <Panel title="Shelving and suppression register" subtitle="Every silenced alarm has an owner, an approver and an end" padding="none" actions={<StatusPill tone="critical">1 expired</StatusPill>}>
        <DataTable label="Shelving and suppression register" flush columns={AR_REGISTER_COLUMNS} rows={AR_REGISTER} rowKey={(item) => item.tag} rowTone={(item) => (item.state === 'Active' ? undefined : item.tone)} />
      </Panel>
    </Canvas>
  );
}

function ArAuditRows() {
  return (
    <ul>
      {AR_AUDIT.map((entry) => (
        <ListRow key={entry.id} tone={entry.tone} title={entry.what} meta={<span>{entry.detail}</span>} trailing={<span className="flex flex-col items-end"><span className="font-medium">{entry.who}</span><span className="tabular-nums">{entry.when}</span></span>} />
      ))}
    </ul>
  );
}

function AlarmRationalisationAudit() {
  return (
    <Canvas>
      <Panel title="Audit trail" subtitle="23-TT-92532 · who changed what, and why" footer="Nothing is edited in bulk without an entry here.">
        <ArAuditRows />
      </Panel>
    </Canvas>
  );
}

function ArAgendaRows() {
  return (
    <ul>
      {AR_AGENDA.map((item, index) => (
        <ListRow
          key={item.id}
          leading={<span className="w-5 text-base font-semibold tabular-nums">{index + 1}</span>}
          title={item.title}
          meta={<span>{item.meta}</span>}
          trailing={<StatusPill tone={item.tone}>{item.state}</StatusPill>}
        />
      ))}
    </ul>
  );
}

function AlarmRationalisationAgenda() {
  return (
    <Canvas>
      <Panel title="Alarm review board" subtitle="Thursday 12 March · 10:00 · meeting 14" footer="33 alarms on the agenda · 6 decided so far">
        <div className="flex flex-1 flex-col gap-4">
          <Meter label="Alarms rationalised" value={342} max={1002} tone="accent" target={{ value: 500, label: 'Q1 target' }} />
          <ArAgendaRows />
        </div>
      </Panel>
    </Canvas>
  );
}

function AlarmRationalisationBlueprint() {
  const entry = AR_ENTRIES[0];
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" title="Limit sheet 23-TT-92532" subtitle="Discharge temperature · range 130 to 160 °C · drawn to scale" footer="Sheet 1 of 3 · MOC-2231 · rev B · checked A. Khan">
            <div className="flex flex-1 flex-col justify-center gap-6">
              <ArLimitScale />
              <ChangeList label="Proposed changes to 23-TT-92532" items={AR_CHANGES.map((item) => ({ ...item, reason: undefined }))} />
            </div>
          </Panel>
          <Panel className="col-span-5" title="Priority derivation" subtitle="Major consequence · 15 min to respond">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <ArEntryMatrix entry={entry} size="sm" />
              <ArDerived entry={entry} />
            </div>
          </Panel>
          <Panel className="col-span-12" title="Replay" subtitle="24 h of recorded data · current and proposed limit">
            <ArReplayTrend height={220} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmRationalisationEditorial() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <Grid>
          <div className="col-span-12 flex flex-col gap-2">
            <p className="text-sm font-medium text-medium-foreground">Nordkapp alarm rationalisation · progress report 14 · March 2026</p>
            <h3 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight">Six alarms made half the noise. Fixing them brought the operator load under target.</h3>
          </div>
          <StatGroup columns={4} label="Alarm system performance" className="col-span-12">
            <ArKpis plain size="lg" />
          </StatGroup>
          <Panel className="col-span-7" title="Priorities against the recommended split" subtitle="Share of configured alarms, per cent">
            <ArDistributionBars height={260} />
          </Panel>
          <Panel className="col-span-5" title="The bad actors" subtitle="Category and fix">
            <ul>
              {AR_ACTORS.slice(0, 5).map((actor) => (
                <ListRow key={actor.tag} title={actor.text} meta={<span>{actor.category} · {actor.fix}</span>} trailing={<span className="text-lg font-semibold tabular-nums">{actor.count}</span>} />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-12" title="One change in detail" subtitle="MOC-2231 · 23-TT-92532 Discharge temperature high">
            <div className="grid grid-cols-2 gap-10">
              <ChangeList label="Proposed changes to 23-TT-92532" items={AR_CHANGES} />
              <div className="flex flex-col justify-between gap-6">
                <ArLimitScale />
                <StageTrack label="Management of change status" stages={AR_STAGES.slice(1, 5)} />
              </div>
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmRationalisationPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <StatGroup columns={4} label="Alarm system performance" className="col-span-12">
            <ArKpis size="lg" />
          </StatGroup>
          <Panel className="col-span-6" title="Replay of options" subtitle="Activations in 24 h">
            <ArReplayBars height={260} />
          </Panel>
          <Panel className="col-span-6" title="Priority matrix" subtitle="Consequence against time to respond">
            <PriorityMatrix label="Priority by consequence and time to respond" rows={AR_ROWS} columns={AR_COLUMNS} rowHeader="Consequence" columnHeader="Time to respond" cell={(row, column) => arCell(row, column)} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmRationalisationConsole() {
  const [selected, setSelected] = useState({ row: 'major', column: '10-30' });
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Grid>
          <StatGroup columns={4} label="Alarm system performance" className="col-span-12">
            <ArKpis plain size="lg" />
          </StatGroup>
          <Panel className="col-span-8" title="Worksheet" subtitle="8 of 1,002 · changed rows carry an edge" padding="none">
            <DataTable label="Rationalisation worksheet" flush columns={AR_WORKSHEET} rows={AR_ENTRIES} rowKey={(entry) => entry.tag} rowTone={(entry) => (arProposed(entry) === entry.current ? undefined : 'warning')} />
          </Panel>
          <Panel className="col-span-4" title="Priority matrix" subtitle="Alarms per cell">
            <PriorityMatrix
              size="sm"
              label="Configured alarms by consequence and time to respond"
              rows={AR_ROWS}
              columns={AR_COLUMNS}
              rowHeader="Consequence"
              columnHeader="Time to respond"
              cell={(row, column) => arCell(row, column, true)}
              selected={selected}
              onSelect={(row, column) => setSelected({ row, column })}
              className="flex-1 justify-center"
            />
          </Panel>
          <Panel className="col-span-6" title="Bad actors" subtitle="Activations · 30 d">
            <ArActorBars height={230} />
          </Panel>
          <Panel className="col-span-6" title="Replay 23-TT-92532" subtitle="Activations · 24 h · per option">
            <ArReplayBars height={230} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function AlarmRationalisationWorkbench() {
  const [tag, setTag] = useState(AR_ENTRIES[0].tag);
  const entry = AR_ENTRIES.find((item) => item.tag === tag) ?? AR_ENTRIES[0];
  return (
    <LookScope look="studio">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Alarm management', mark: <IconFlame /> }}
        nav={AR_NAV}
        current="worksheet"
        title="Rationalisation workbench"
        subtitle="342 of 1,002 alarms rationalised · review board meets Thursday"
        status={<StatusPill tone="warning">3 changes waiting</StatusPill>}
        actions={
          <Button size="sm">
            <IconChecklist /> Send for review
          </Button>
        }
      >
        <Grid>
          <Panel className="col-span-5" title="Worksheet" subtitle="Select an alarm" padding="none">
            <ul role="listbox" aria-label="Alarms in the worksheet" className="flex flex-1 flex-col">
              {AR_ENTRIES.map((item) => {
                const active = item.tag === tag;
                const changed = arProposed(item) !== item.current;
                return (
                  <li
                    key={item.tag}
                    role="option"
                    aria-selected={active}
                    tabIndex={0}
                    onClick={() => setTag(item.tag)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setTag(item.tag);
                      }
                    }}
                    className={`flex flex-1 cursor-pointer items-center gap-3 border-b border-default px-5 py-2.5 text-sm outline-none last:border-b-0 focus-visible:bg-muted-background ${active ? 'bg-info-background' : 'hover:bg-muted-background'}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{item.text}</span>
                      <span className="flex flex-wrap gap-x-2 text-medium-foreground">
                        <TagId>{item.tag}</TagId>
                        <span>{changed ? `was ${PRIORITY_LABEL[item.current].toLowerCase()}` : 'no change'}</span>
                      </span>
                    </span>
                    <ArPriority priority={arProposed(item)} />
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel
            className="col-span-7"
            title={entry.text}
            subtitle={`Alarm master record · ${entry.tag}`}
            icon={
              <IconChip tone={AR_TONE[arProposed(entry)]}>
                <IconFileText />
              </IconChip>
            }
            actions={<StatusPill tone={AR_REVIEW_TONE[entry.review]}>{entry.review}</StatusPill>}
            footer={<ArDerived entry={entry} />}
          >
            <div className="flex flex-1 flex-col justify-between gap-6">
              <ArRecordFacts entry={entry} />
              <ArEntryMatrix entry={entry} size="sm" />
            </div>
          </Panel>
          <Panel className="col-span-8" title="Replay on recorded data" subtitle="23-TT-92532 · 24 hours · current and proposed limit">
            <ArReplayTrend height={250} />
          </Panel>
          <Panel className="col-span-4" title="Result" subtitle="With deadband 1.5 °C and delay 60 s" footer="Tested on 24 hours; the board asks for 30 days.">
            <div className="flex flex-1 flex-col justify-between gap-4">
              <Stat variant="plain" size="lg" tone="warning" label="Activations as it is" value={AR_OPTION_COUNTS[0]} target="Limit 145 °C" />
              <Stat variant="plain" size="lg" tone="success" label="With the proposal" value={AR_OPTION_COUNTS[3]} delta={{ value: AR_OPTION_COUNTS[3] - AR_OPTION_COUNTS[0], decimals: 0, good: 'down' }} target="Limit 147 °C" />
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function AlarmRationalisationProgramme() {
  return (
    <LookScope look="soft">
      <AppFrame
        brand={{ name: 'Alarm programme', mark: <IconTarget /> }}
        nav={AR_NAV.slice(0, 4)}
        current="overview"
        title="Rationalisation programme"
        subtitle="Quarter 1 · Nordkapp gas processing"
        status={<StatusPill tone="success">On track</StatusPill>}
      >
        <Grid>
          <Panel className="col-span-4" title="Progress" subtitle="Alarms rationalised per area">
            <div className="grid flex-1 grid-cols-2 place-items-center gap-5">
              <RingGauge label="Separation" value={96} tone="green" size={112} />
              <RingGauge label="Compression" value={71} tone="amber" size={112} />
              <RingGauge label="Export" value={88} tone="blue" size={112} />
              <RingGauge label="Cooling water" value={52} tone="pink" size={112} />
            </div>
          </Panel>
          <Panel className="col-span-4" title="Priority split" subtitle="Configured alarms today">
            <div className="flex flex-1 items-center justify-center">
              <Donut label="Configured alarms by priority" segments={AR_DISTRIBUTION} unit=" %" centerValue="1,002" centerCaption="alarms" legend="bottom" size={168} />
            </div>
          </Panel>
          <div className="col-span-4 grid grid-rows-2 gap-[var(--kit-gap)]">
            <Stat size="lg" tone="green" icon={<IconUsers />} label="Alarms per operator" value={0.9} decimals={1} unit="per 10 min" delta={{ value: -2.5, good: 'down', caption: 'was 3.4' }} />
            <Stat size="lg" tone="purple" icon={<IconRepeat />} label="Chattering alarms" value={2} delta={{ value: -9, decimals: 0, good: 'down', caption: 'was 11' }} />
          </div>
          <Panel className="col-span-7" title="Next review board" subtitle="Thursday 12 March · 10:00">
            <ArAgendaRows />
          </Panel>
          <Panel className="col-span-5" title="Recent decisions" subtitle="23-TT-92532">
            <ArAuditRows />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

export default definePage({
  id: 'alarm-rationalisation',
  title: 'Alarm rationalisation',
  summary:
    'The engineering side of alarms, in the manner of ISA-18.2 and EEMUA 191: a master record per alarm, a priority derived from consequence and time to respond, bad actors, limits replayed on recorded data, and the change and shelving records that keep it honest — shown in six looks.',
  guidance: {
    use: [
      'Record cause, consequence, operator action and time to respond for every alarm, then derive the priority.',
      'Replay recorded data against a proposed limit before it goes into a change request.',
      'Show current and proposed side by side, with the reason for each change.',
      'Give every shelved or suppressed alarm an owner, an approver and an end date.',
    ],
    avoid: [
      'Setting a priority because the alarm feels important.',
      'Keeping an alarm that has no operator action: make it an event or a work order.',
      'Fixing chattering by raising the limit alone; look at deadband and delay first.',
      'Hiding a change in a bulk edit with no audit entry.',
    ],
  },
  source,
  sections: [
    {
      id: 'record',
      title: 'Master record and priority',
      description: 'What is written down about one alarm, and how its priority follows from it.',
      specimens: [
        {
          id: 'AlarmRationalisationRecord',
          title: 'Alarm master record',
          note: 'Pick it as the page for one alarm: the four answers on the left, the priority they justify on the right.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarm-rationalisation/PriorityMatrix.tsx', 'kit/alarm-rationalisation/priority.ts', 'kit/Panel.tsx'],
          Component: AlarmRationalisationRecord,
        },
        {
          id: 'AlarmRationalisationMatrix',
          title: 'Priority matrix with counts',
          note: 'Pick it to see where the configured alarms sit and to open the ones in a cell.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarm-rationalisation/PriorityMatrix.tsx'],
          Component: AlarmRationalisationMatrix,
        },
        {
          id: 'AlarmRationalisationCalculator',
          title: 'Priority calculator',
          note: 'Pick it in a review meeting: answer two questions and read the priority.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/alarm-rationalisation/priority.ts', 'kit/Stat.tsx'],
          Component: AlarmRationalisationCalculator,
        },
        {
          id: 'AlarmRationalisationWorksheet',
          title: 'Worksheet',
          note: 'Pick a table when many alarms are reviewed in one sitting; rows whose priority changes carry an edge.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/alarm-rationalisation/priority.ts'],
          Component: AlarmRationalisationWorksheet,
        },
      ],
    },
    {
      id: 'performance',
      title: 'Distribution and performance',
      description: 'How the alarm system behaves as a whole, and which alarms spoil it.',
      specimens: [
        {
          id: 'AlarmRationalisationKpis',
          title: 'Before and after',
          note: 'Pick it to report what rationalisation achieved against the targets an operator can handle.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'kit/Delta.tsx'],
          Component: AlarmRationalisationKpis,
        },
        {
          id: 'AlarmRationalisationDistribution',
          title: 'Priority distribution',
          note: 'Pick it to compare the configured split with the recommended one.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/Bars.tsx'],
          Component: AlarmRationalisationDistribution,
        },
        {
          id: 'AlarmRationalisationBadActors',
          title: 'Bad actors',
          note: 'Pick it to start a review: the few alarms behind most activations, each with a category and a fix.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmRationalisationBadActors,
        },
        {
          id: 'AlarmRationalisationCompleteness',
          title: 'Documentation completeness',
          note: 'Pick it to track how much of each area has a complete master record.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Panel.tsx'],
          Component: AlarmRationalisationCompleteness,
        },
        {
          id: 'AlarmRationalisationNuisance',
          title: 'Nuisance categories',
          note: 'Pick it to show why alarms raise needlessly, which decides the kind of fix.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/Panel.tsx'],
          Component: AlarmRationalisationNuisance,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Limits, deadband and delay',
      description: 'Testing settings on recorded data before anything changes in the control system.',
      specimens: [
        {
          id: 'AlarmRationalisationLimit',
          title: 'Replay a proposed limit',
          note: 'Pick it to test a limit and a deadband: the trend, the count and the range drawn to scale change together.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarm-rationalisation/LimitScale.tsx', 'kit/alarm-rationalisation/replay.ts', 'kit/TrendLine.tsx'],
          Component: AlarmRationalisationLimit,
        },
        {
          id: 'AlarmRationalisationReplay',
          title: 'Replay of options',
          note: 'Pick it to compare settings step by step and show which one does the work.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/alarm-rationalisation/replay.ts'],
          Component: AlarmRationalisationReplay,
        },
        {
          id: 'AlarmRationalisationTuning',
          title: 'Deadband and delay suggestion',
          note: 'Pick it to give engineers a starting point by signal type instead of a blank field.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: AlarmRationalisationTuning,
        },
      ],
    },
    {
      id: 'change',
      title: 'Change, shelving and records',
      description: 'The paper trail: what changes, who approved it, what is silenced and until when.',
      specimens: [
        {
          id: 'AlarmRationalisationChange',
          title: 'Management of change',
          note: 'Pick it for a change request: the approval route, each setting current against proposed, and the result on the range.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarm-rationalisation/StageTrack.tsx', 'kit/alarm-rationalisation/ChangeList.tsx', 'kit/alarm-rationalisation/LimitScale.tsx'],
          Component: AlarmRationalisationChange,
        },
        {
          id: 'AlarmRationalisationRegister',
          title: 'Shelving and suppression register',
          note: 'Pick it to audit what is silenced: expired and overdue entries carry their state on the row edge.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: AlarmRationalisationRegister,
        },
        {
          id: 'AlarmRationalisationAudit',
          title: 'Audit trail',
          note: 'Pick it on the record of one alarm to show every decision with who and when.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: AlarmRationalisationAudit,
        },
        {
          id: 'AlarmRationalisationAgenda',
          title: 'Review board agenda',
          note: 'Pick it to run the review meeting: progress against the target and the batches to decide.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: AlarmRationalisationAgenda,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In four looks',
      description: 'The matrix, the limit scale and the change list built four different ways.',
      specimens: [
        {
          id: 'AlarmRationalisationBlueprint',
          title: 'Blueprint',
          note: 'Pick it for the engineering sheet: outlined matrix cells, a limit scale read like a dimensioned drawing, a title block.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/alarm-rationalisation/LimitScale.tsx', 'kit/alarm-rationalisation/ChangeList.tsx', 'kit/alarm-rationalisation/PriorityMatrix.tsx', 'looks/LookScope.tsx'],
          Component: AlarmRationalisationBlueprint,
        },
        {
          id: 'AlarmRationalisationConsole',
          title: 'Console',
          note: 'Pick it for the alarm engineer who lives in the worksheet: dense table, solid matrix blocks, hairline panels.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/alarm-rationalisation/PriorityMatrix.tsx', 'kit/Bars.tsx', 'looks/LookScope.tsx'],
          Component: AlarmRationalisationConsole,
        },
        {
          id: 'AlarmRationalisationPoster',
          title: 'Poster',
          note: 'Pick it for the control-room notice board: the four results as blocks and the matrix as a chart to learn by heart.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Bars.tsx', 'kit/alarm-rationalisation/PriorityMatrix.tsx', 'looks/LookScope.tsx'],
          Component: AlarmRationalisationPoster,
        },
        {
          id: 'AlarmRationalisationEditorial',
          title: 'Editorial',
          note: 'Pick it for the progress report to management: a headline, four figures and one change told in full.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/alarm-rationalisation/ChangeList.tsx', 'kit/alarm-rationalisation/StageTrack.tsx', 'looks/LookScope.tsx'],
          Component: AlarmRationalisationEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Two screens ready to drop into a product.',
      specimens: [
        {
          id: 'AlarmRationalisationWorkbench',
          title: 'Rationalisation workbench',
          note: 'Pick it as the working screen: choose an alarm, read its record and derived priority, replay the proposal.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/alarm-rationalisation/PriorityMatrix.tsx', 'kit/TrendLine.tsx', 'kit/Stat.tsx'],
          Component: AlarmRationalisationWorkbench,
        },
        {
          id: 'AlarmRationalisationProgramme',
          title: 'Programme overview',
          note: 'Pick it for the people who sponsor the work: progress per area, the split, two results and what is decided next.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/RingGauge.tsx', 'kit/Donut.tsx', 'kit/ListRow.tsx'],
          Component: AlarmRationalisationProgramme,
        },
      ],
    },
  ],
});
