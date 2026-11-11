import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconBolt,
  IconCircleCheck,
  IconCircleX,
  IconClipboardCheck,
  IconDoorEnter,
  IconEye,
  IconFlame,
  IconLadder,
  IconLock,
  IconLockOpen,
  IconShieldCheck,
  IconTool,
  IconUsers,
  IconWind,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { BarrierStack } from '../../../library/kit/safety-and-permits/BarrierStack';
import { GasReading } from '../../../library/kit/safety-and-permits/GasReading';
import { PermitCard } from '../../../library/kit/safety-and-permits/PermitCard';
import { PERMIT_STATES, barrierState, permitStatus, riskRating, type Barrier, type PermitState } from '../../../library/kit/safety-and-permits/permits';
import { RiskMatrix, type RiskPoint } from '../../../library/kit/safety-and-permits/RiskMatrix';
import { StepTrack, type TrackStep } from '../../../library/kit/safety-and-permits/StepTrack';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './safety-and-permits.tsx?raw';

type SafetyPermit = {
  number: string;
  title: string;
  kind: string;
  state: PermitState;
  area: string;
  location: string;
  tag: string;
  holder: string;
  from: string;
  to: string;
  elapsed: number;
  remaining: string;
  controls: string[];
  reason?: string;
};

const SAFETY_PERMITS: SafetyPermit[] = [
  { number: 'PTW-2291', title: 'Weld repair on recompressor drain line', kind: 'Hot work', state: 'active', area: 'Gas compression', location: 'Module M23, deck 2', tag: '23-KA-9103', holder: 'Tomás Barros', from: '08:00', to: '18:00', elapsed: 0.6, remaining: '4 h left', controls: ['Gas test every 2 h', 'Fire watch', 'Isolation IC-0418'] },
  { number: 'PTW-2288', title: 'Internal inspection of test separator', kind: 'Confined space entry', state: 'suspended', area: 'Inlet and separation', location: 'Module M20, deck 1', tag: '20-VA-1002', holder: 'Jonas Nyberg', from: '07:00', to: '19:00', elapsed: 0.58, remaining: 'Suspended 13:12', controls: ['Continuous gas monitor', 'Standby person', 'Rescue plan'], reason: 'Gas retest overdue by 22 min. Entry stopped until a new reading is recorded.' },
  { number: 'PTW-2294', title: 'Replace bearing temperature transmitter', kind: 'Electrical work', state: 'awaiting', area: 'Cooling water', location: 'Pump house P40', tag: '40-PA-4001', holder: 'Jonas Nyberg', from: '15:00', to: '19:00', elapsed: 0, remaining: 'Starts in 1 h', controls: ['Isolation IC-0421', 'Prove dead'] },
  { number: 'PTW-2290', title: 'Scaffold erection at interstage cooler', kind: 'Working at height', state: 'active', area: 'Gas compression', location: 'Module M23, deck 3', tag: '23-HA-9114', holder: 'Liv Wold', from: '09:00', to: '17:00', elapsed: 0.63, remaining: '3 h left', controls: ['Harness check', 'Drop zone'] },
  { number: 'PTW-2285', title: 'Partial stroke test, inlet shutdown valve', kind: 'Cold work', state: 'closed', area: 'Inlet and separation', location: 'Module M20, deck 2', tag: '20-XV-1105', holder: 'Tomás Barros', from: '06:00', to: '10:00', elapsed: 1, remaining: 'Closed 09:41', controls: ['Override register'] },
  { number: 'PTW-2279', title: 'Vibration survey, 1st stage compressor', kind: 'Cold work', state: 'expired', area: 'Gas compression', location: 'Module M23, deck 2', tag: '23-KA-9101', holder: 'Aisha Khan', from: 'Wed 08:00', to: 'Wed 16:00', elapsed: 1, remaining: 'Expired, not closed', controls: ['Hearing protection'] },
  { number: 'PTW-2296', title: 'Standby start test, export pump B', kind: 'Cold work', state: 'issued', area: 'Gas export', location: 'Module M27', tag: '27-PA-2001B', holder: 'Ingrid Haugen', from: '14:30', to: '16:30', elapsed: 0, remaining: 'Not started', controls: ['Control room notified'] },
  { number: 'PTW-2298', title: 'Clean interstage cooler tube bundle', kind: 'Confined space entry', state: 'draft', area: 'Gas compression', location: 'Module M23, deck 3', tag: '23-HA-9114', holder: 'Magnus Solberg', from: 'Mon 07:00', to: 'Mon 19:00', elapsed: 0, remaining: 'Planned for Monday', controls: ['Isolation to be planned'] },
];

const SAFETY_STATE_MEANING: Record<PermitState, { meaning: string; next: string }> = {
  draft: { meaning: 'Being written by the requester', next: 'Requester' },
  awaiting: { meaning: 'Risk assessed, waiting for the area authority', next: 'Area authority' },
  issued: { meaning: 'Approved, work party has not signed on', next: 'Permit holder' },
  active: { meaning: 'Work is going on under the stated controls', next: 'Permit holder' },
  suspended: { meaning: 'Work stopped, controls no longer met', next: 'Area authority' },
  closed: { meaning: 'Site handed back and isolations removed', next: 'Nobody' },
  expired: { meaning: 'Validity ran out before close-out', next: 'Shift supervisor' },
};

function SafetyKindIcon({ kind }: { kind: string }) {
  if (kind === 'Hot work') return <IconFlame />;
  if (kind === 'Confined space entry') return <IconDoorEnter />;
  if (kind === 'Electrical work') return <IconBolt />;
  if (kind === 'Working at height') return <IconLadder />;
  return <IconTool />;
}

function safetyPermitCard(permit: SafetyPermit, actions?: ReactNode) {
  return (
    <PermitCard
      number={permit.number}
      title={permit.title}
      kind={permit.kind}
      icon={<SafetyKindIcon kind={permit.kind} />}
      state={permit.state}
      location={permit.location}
      tag={permit.tag}
      holder={permit.holder}
      validity={{ from: permit.from, to: permit.to, elapsed: permit.elapsed, remaining: permit.remaining }}
      controls={permit.controls}
      reason={permit.reason}
      actions={actions}
    />
  );
}

const SAFETY_PERMIT_COLUMNS: DataTableColumn<SafetyPermit>[] = [
  { id: 'number', header: 'Permit', nowrap: true, cell: (permit) => <TagId>{permit.number}</TagId> },
  {
    id: 'job',
    header: 'Job',
    cell: (permit) => (
      <span className="flex flex-col">
        <span className="font-medium">{permit.title}</span>
        <span className="text-xs text-(--kit-text-3)">{permit.kind}</span>
      </span>
    ),
  },
  { id: 'area', header: 'Area', cell: (permit) => permit.area },
  { id: 'tag', header: 'Equipment', nowrap: true, cell: (permit) => <TagId>{permit.tag}</TagId> },
  { id: 'holder', header: 'Holder', cell: (permit) => permit.holder },
  { id: 'valid', header: 'Valid', nowrap: true, numeric: true, cell: (permit) => `${permit.from} – ${permit.to}` },
  { id: 'state', header: 'State', nowrap: true, cell: (permit) => <StatusPill tone={permitStatus(permit.state).tone}>{permitStatus(permit.state).label}</StatusPill> },
];

const SAFETY_PERMIT_COLUMNS_SHORT: DataTableColumn<SafetyPermit>[] = SAFETY_PERMIT_COLUMNS.filter((column) => ['number', 'job', 'holder', 'state'].includes(column.id));

function safetyRowTone(permit: SafetyPermit): Tone | undefined {
  const tone = permitStatus(permit.state).tone;
  return tone === 'warning' || tone === 'critical' ? tone : undefined;
}

const SAFETY_LIFE_CYCLE: TrackStep[] = [
  { id: 'request', label: 'Requested', detail: 'Tomás Barros · 06:40', state: 'done' },
  { id: 'assess', label: 'Risk assessed', detail: 'Aisha Khan · 07:05', state: 'done' },
  { id: 'isolate', label: 'Isolated', detail: 'IC-0418 · 07:32', state: 'done' },
  { id: 'approve', label: 'Approved', detail: 'Liv Wold · 07:48', state: 'done' },
  { id: 'work', label: 'Work in progress', detail: 'Since 08:00', state: 'current' },
  { id: 'close', label: 'Handed back', detail: 'Due by 18:00', state: 'pending' },
];

function SafetySignature({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-dashed pb-1" style={{ borderColor: 'var(--kit-rule-strong)' }}>
      <span className="text-lg leading-none text-(--kit-text) italic">{name}</span>
      <span className="text-xs text-(--kit-text-3)">{role}</span>
    </div>
  );
}

const SAFETY_APPROVALS: TrackStep[] = [
  { id: 'holder', label: 'Permit holder', detail: 'Signed 06:40', state: 'done', extra: <SafetySignature name="Tomás Barros" role="Mechanical technician" /> },
  { id: 'gas', label: 'Authorised gas tester', detail: 'Signed 07:20 · LEL 0 %', state: 'done', extra: <SafetySignature name="Jonas Nyberg" role="Instrument technician" /> },
  { id: 'area', label: 'Area authority', detail: 'Signed 07:48', state: 'done', extra: <SafetySignature name="Liv Wold" role="Shift supervisor" /> },
  { id: 'control', label: 'Control room', detail: 'Waiting for acknowledgement', state: 'current' },
  { id: 'close', label: 'Close-out', detail: 'After the site is handed back', state: 'pending' },
];

type SafetyIsolation = { id: string; tag: string; what: string; method: string; state: 'locked' | 'pending' | 'removed'; lock: string };

const SAFETY_ISOLATIONS: SafetyIsolation[] = [
  { id: 'i1', tag: '23-XV-9131', what: 'Suction shutdown valve', method: 'Closed, locked and tagged', state: 'locked', lock: 'Lock 114' },
  { id: 'i2', tag: '23-XV-9135', what: 'Discharge shutdown valve', method: 'Closed, locked and tagged', state: 'locked', lock: 'Lock 115' },
  { id: 'i3', tag: '23-HV-9140', what: 'Drain line block valve', method: 'Spade fitted', state: 'locked', lock: 'Spade S-22' },
  { id: 'i4', tag: '23-EM-9103', what: 'Motor feeder, 6.6 kV board', method: 'Racked out and earthed', state: 'locked', lock: 'Lock 116' },
  { id: 'i5', tag: '23-BV-9142', what: 'Vent to flare', method: 'Open, locked open', state: 'pending', lock: 'Not fitted' },
];

const SAFETY_ISOLATION_STATE: Record<SafetyIsolation['state'], { label: string; tone: Tone }> = {
  locked: { label: 'Locked', tone: 'success' },
  pending: { label: 'To be fitted', tone: 'warning' },
  removed: { label: 'Removed', tone: 'neutral' },
};

function SafetyIsolationRows({ limit = 5 }: { limit?: number }) {
  return (
    <ul>
      {SAFETY_ISOLATIONS.slice(0, limit).map((point) => (
        <ListRow
          key={point.id}
          tone={SAFETY_ISOLATION_STATE[point.state].tone}
          leading={
            <IconChip size="sm" tone={SAFETY_ISOLATION_STATE[point.state].tone}>
              {point.state === 'locked' ? <IconLock /> : <IconLockOpen />}
            </IconChip>
          }
          title={point.what}
          meta={
            <>
              <TagId>{point.tag}</TagId>
              <span>
                {point.method} · {point.lock}
              </span>
            </>
          }
          trailing={<StatusPill tone={SAFETY_ISOLATION_STATE[point.state].tone}>{SAFETY_ISOLATION_STATE[point.state].label}</StatusPill>}
        />
      ))}
    </ul>
  );
}

const SAFETY_GAS = [
  { gas: 'Oxygen', symbol: 'O₂', value: 20.8, unit: '%', decimals: 1, limits: { low: 19.5, high: 23.5 }, scaleMax: 25 },
  { gas: 'Flammable gas', symbol: 'LEL', value: 4, unit: '% LEL', decimals: 0, limits: { high: 10 }, scaleMax: 20 },
  { gas: 'Hydrogen sulphide', symbol: 'H₂S', value: 8.6, unit: 'ppm', decimals: 1, limits: { high: 10 }, scaleMax: 20 },
  { gas: 'Carbon monoxide', symbol: 'CO', value: 31, unit: 'ppm', decimals: 0, limits: { high: 25 }, scaleMax: 50 },
];

function SafetyGasRow({ taken = 'Jonas Nyberg, 13:40' }: { taken?: string }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {SAFETY_GAS.map((reading) => (
        <GasReading key={reading.symbol} {...reading} taken={taken} />
      ))}
    </div>
  );
}

const SAFETY_RETEST_TIMES = ['07:20', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '13:40'];

const SAFETY_RETEST_LEL = [0, 1, 1, 2, 2, 3, 3, 4];

const SAFETY_RETEST_H2S = [1.2, 1.8, 2.4, 3.9, 5.1, 6.4, 7.7, 8.6];

const SAFETY_BARRIERS: Barrier[] = [
  { id: 'containment', role: 'Prevent', name: 'Process containment', passed: 14, degraded: 1, failed: 0 },
  { id: 'detection', role: 'Detect', name: 'Fire and gas detection', passed: 22, degraded: 2, failed: 0 },
  { id: 'esd', role: 'Control', name: 'Emergency shutdown', passed: 18, degraded: 0, failed: 0 },
  { id: 'blowdown', role: 'Control', name: 'Blowdown and flare', passed: 9, degraded: 0, failed: 1 },
  { id: 'firewater', role: 'Mitigate', name: 'Deluge and firewater', passed: 11, degraded: 1, failed: 0 },
  { id: 'escape', role: 'Escape', name: 'Escape and evacuation', passed: 12, degraded: 0, failed: 0 },
];

const SAFETY_ELEMENT_TOTALS = SAFETY_BARRIERS.reduce((sum, barrier) => ({ passed: sum.passed + barrier.passed, degraded: sum.degraded + barrier.degraded, failed: sum.failed + barrier.failed }), { passed: 0, degraded: 0, failed: 0 });

const SAFETY_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const SAFETY_OBSERVATIONS = { safe: [34, 41, 29, 38, 44, 27], unsafe: [9, 7, 11, 6, 5, 4] };

type SafetyIncident = { id: string; title: string; kind: string; tone: Tone; where: string; when: string };

const SAFETY_INCIDENTS: SafetyIncident[] = [
  { id: 'INC-0412', title: 'Dropped spanner from scaffold, no injury', kind: 'Near miss', tone: 'warning', where: 'M23, deck 3', when: '2 d ago' },
  { id: 'INC-0409', title: 'Minor hydraulic oil leak at valve actuator', kind: 'Environmental', tone: 'info', where: 'M20, deck 2', when: '6 d ago' },
  { id: 'INC-0401', title: 'Hand laceration during gasket change', kind: 'First aid', tone: 'warning', where: 'Workshop', when: '19 d ago' },
  { id: 'INC-0377', title: 'Lost-time injury, slipped on stair', kind: 'Lost time', tone: 'critical', where: 'M27 stair tower', when: '218 d ago' },
];

function SafetyIncidentRows({ limit = 4 }: { limit?: number }) {
  return (
    <ul>
      {SAFETY_INCIDENTS.slice(0, limit).map((incident) => (
        <ListRow
          key={incident.id}
          tone={incident.tone}
          title={incident.title}
          meta={
            <>
              <StatusPill tone={incident.tone}>{incident.kind}</StatusPill>
              <TagId>{incident.id}</TagId>
              <span>{incident.where}</span>
            </>
          }
          trailing={incident.when}
        />
      ))}
    </ul>
  );
}

const SAFETY_STATIONS = [
  { id: 'a', name: 'Muster A, living quarters', counted: 42, expected: 42 },
  { id: 'b', name: 'Muster B, helideck', counted: 31, expected: 33 },
  { id: 'c', name: 'Control room', counted: 6, expected: 6 },
  { id: 'd', name: 'Emergency response team', counted: 8, expected: 8 },
];

const SAFETY_MISSING = [
  { id: 'm1', name: 'Tomás Barros', last: 'Badge read M23 deck 2, 13:58', permit: 'PTW-2291' },
  { id: 'm2', name: 'Magnus Solberg', last: 'Badge read workshop, 13:51', permit: 'No permit' },
];

const SAFETY_CONTROLS = [
  { id: 'c1', control: 'Line drained, purged and gas-freed', effect: 'Likelihood 4 → 3' },
  { id: 'c2', control: 'Positive isolation with spade S-22', effect: 'Likelihood 3 → 2' },
  { id: 'c3', control: 'Fire watch with charged hose, 30 min after work', effect: 'Consequence 4 → 3' },
  { id: 'c4', control: 'Habitat with continuous gas monitor', effect: 'Holds the residual' },
];

const SAFETY_TOOLBOX = [
  { id: 't1', label: 'Scope and work steps explained', description: 'Everyone can say what is being done and in what order.' },
  { id: 't2', label: 'Isolations walked and locks checked', description: 'IC-0418, five points, personal locks fitted.' },
  { id: 't3', label: 'Gas test within the last 2 hours', description: 'Last reading 13:40, next due 15:40.' },
  { id: 't4', label: 'Escape routes and muster point agreed', description: 'Primary east stair, muster A.' },
  { id: 't5', label: 'Stop-work authority understood', description: 'Anyone can stop the job without giving a reason first.' },
];

const SAFETY_AREAS: Array<{ area: string; tag: string; tone: Tone; state: string; detail: string; active: number }> = [
  { area: 'Inlet and separation', tag: 'NK-20', tone: 'warning', state: 'On hold', detail: 'PTW-2288 gas retest overdue', active: 1 },
  { area: 'Gas compression', tag: 'NK-23', tone: 'success', state: 'Work on', detail: '2 permits active, hot work', active: 2 },
  { area: 'Gas export', tag: 'NK-27', tone: 'success', state: 'Clear', detail: '1 permit issued, not started', active: 0 },
  { area: 'Cooling water', tag: 'NK-40', tone: 'info', state: 'Waiting', detail: 'PTW-2294 needs approval', active: 0 },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function SafetySheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function SafetyAndPermitsPermitCards() {
  return (
    <SafetySheet>
      <Grid>
        <div className="col-span-4">
          {safetyPermitCard(
            SAFETY_PERMITS[0],
            <Button variant="outline" size="sm">
              Open permit
            </Button>
          )}
        </div>
        <div className="col-span-4">
          {safetyPermitCard(
            SAFETY_PERMITS[1],
            <Button variant="outline" size="sm">
              Record gas test
            </Button>
          )}
        </div>
        <div className="col-span-4">
          {safetyPermitCard(
            SAFETY_PERMITS[2],
            <Button variant="outline" size="sm">
              Review and approve
            </Button>
          )}
        </div>
      </Grid>
    </SafetySheet>
  );
}

const SAFETY_STATE_ROWS = PERMIT_STATES.map((state) => ({ state, ...SAFETY_STATE_MEANING[state], count: SAFETY_PERMITS.filter((permit) => permit.state === state).length }));

const SAFETY_STATE_COLUMNS: DataTableColumn<(typeof SAFETY_STATE_ROWS)[number]>[] = [
  { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={permitStatus(row.state).tone}>{permitStatus(row.state).label}</StatusPill> },
  { id: 'meaning', header: 'What it means', cell: (row) => row.meaning },
  { id: 'next', header: 'Who acts next', nowrap: true, cell: (row) => row.next },
  { id: 'count', header: 'Today', numeric: true, cell: (row) => row.count },
];

function SafetyAndPermitsPermitStates() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-8" title="Permit states" subtitle="One word and one colour per state, used everywhere a permit appears" padding="none">
          <DataTable label="Permit states" flush columns={SAFETY_STATE_COLUMNS} rows={SAFETY_STATE_ROWS} rowKey={(row) => row.state} />
        </Panel>
        <Panel className="col-span-4" title="Today by state" subtitle="8 permits on the plant">
          <Donut
            label="Permits by state"
            centerValue="8"
            centerCaption="permits"
            legend="bottom"
            segments={[
              { label: 'Active', value: 2, tone: 'success' },
              { label: 'Issued or awaiting', value: 2, tone: 'info' },
              { label: 'Suspended', value: 1, tone: 'warning' },
              { label: 'Expired', value: 1, tone: 'critical' },
              { label: 'Draft or closed', value: 2, tone: 'neutral' },
            ]}
          />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsLifeCycle() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-12" title="Life cycle of PTW-2291" subtitle="Hot work on the recompressor drain line" actions={<StatusPill tone="success">Active</StatusPill>}>
          <StepTrack label="Permit life cycle" steps={SAFETY_LIFE_CYCLE} />
        </Panel>
        <Panel className="col-span-7" title="Approval chain" subtitle="Each signature unlocks the next step">
          <StepTrack label="Approval chain" orientation="vertical" steps={SAFETY_APPROVALS} />
        </Panel>
        <Panel className="col-span-5" title="Waiting on" subtitle="Step 4 of 5" tone="accent" footer={<Button size="sm">Acknowledge in control room</Button>}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <Stat variant="plain" size="lg" label="Time since area authority signed" value="12" unit="min" target="Target under 15 min" />
            <ul>
              <ListRow leading={<IconChip size="sm" tone="success"><IconCircleCheck /></IconChip>} title="Isolation IC-0418 confirmed" meta="Four of five points locked, vent to follow" />
              <ListRow leading={<IconChip size="sm" tone="success"><IconCircleCheck /></IconChip>} title="Gas test inside the window" meta="LEL 0 %, oxygen 20.8 %" />
              <ListRow leading={<IconChip size="sm" tone="warning"><IconAlertTriangle /></IconChip>} title="Fire pump B on standby test" meta="Check firewater cover before hot work" />
            </ul>
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

const SAFETY_FILTERS = { all: 'All', live: 'Live work', action: 'Needs action' } as const;

type SafetyFilter = keyof typeof SAFETY_FILTERS;

function isSafetyFilter(value: string): value is SafetyFilter {
  return value in SAFETY_FILTERS;
}

function safetyMatches(permit: SafetyPermit, filter: SafetyFilter): boolean {
  if (filter === 'live') return permit.state === 'active' || permit.state === 'issued';
  if (filter === 'action') return permit.state === 'suspended' || permit.state === 'expired' || permit.state === 'awaiting';
  return true;
}

function SafetyAndPermitsRegister() {
  const [filter, setFilter] = useState<SafetyFilter>('all');
  const rows = SAFETY_PERMITS.filter((permit) => safetyMatches(permit, filter));
  return (
    <SafetySheet>
      <Panel
        title="Permit register"
        subtitle={`${rows.length} of ${SAFETY_PERMITS.length} permits, Thursday 12 March`}
        padding="none"
        actions={
          <SegmentedControl value={filter} onValueChange={(next) => {
            const value = String(next);
            if (isSafetyFilter(value)) setFilter(value);
          }}>
            <SegmentedControlList size="small" aria-label="Filter permits">
              <SegmentedControlButton value="all">All</SegmentedControlButton>
              <SegmentedControlButton value="live">Live work</SegmentedControlButton>
              <SegmentedControlButton value="action">Needs action</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      >
        <DataTable label="Permit register" flush columns={SAFETY_PERMIT_COLUMNS} rows={rows} rowKey={(permit) => permit.number} rowTone={safetyRowTone} />
      </Panel>
    </SafetySheet>
  );
}

function SafetyAndPermitsIsolationCertificate() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-8" title="Isolation certificate IC-0418" subtitle="Recompressor 23-KA-9103, mechanical and electrical" padding="tight" actions={<StatusPill tone="warning">4 of 5 fitted</StatusPill>}>
          <SafetyIsolationRows />
        </Panel>
        <Panel className="col-span-4" title="Before work can start" subtitle="Linked to PTW-2291">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <Meter size="lg" label="Points fitted" value={4} max={5} tone="warning" target={{ value: 5, label: 'All' }} />
            <Stat variant="plain" label="Personal locks on the lockbox" value={6} unit="locks" target="Work party of 6 signed on" />
            <div className="flex items-center gap-3 rounded-(--kit-radius-sm) bg-(--kit-well) p-3">
              <IconChip size="sm" tone="warning">
                <IconLockOpen />
              </IconChip>
              <p className="text-sm text-(--kit-text-2)">Vent to flare 23-BV-9142 must be locked open before the certificate can be issued.</p>
            </div>
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsGasTest() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-12" title="Gas test, test separator 20-VA-1002" subtitle="Reading 8 of the entry · next test due 15:40" actions={<StatusPill tone="critical" icon={<IconCircleX />}>Entry not allowed</StatusPill>}>
          <SafetyGasRow />
        </Panel>
        <Panel className="col-span-8" title="Retests since entry" subtitle="Hydrogen sulphide is climbing towards its limit">
          <TrendLine
            label="Gas retests since 07:20"
            labels={SAFETY_RETEST_TIMES}
            unit="ppm"
            decimals={1}
            height={220}
            yDomain={[0, 12]}
            limits={[{ value: 10, label: 'Limit', tone: 'critical' }]}
            series={[
              { id: 'h2s', label: 'Hydrogen sulphide, ppm', values: SAFETY_RETEST_H2S, tone: 'warning' },
              { id: 'lel', label: 'Flammable gas, % LEL', values: SAFETY_RETEST_LEL, tone: 'blue', dashed: true },
            ]}
          />
        </Panel>
        <Panel className="col-span-4" title="What to do" subtitle="Carbon monoxide is above 25 ppm" tone="critical" footer={<Button size="sm">Suspend PTW-2288</Button>}>
          <ul>
            <ListRow title="Withdraw the entry party" meta="Three people inside, standby person at the manway" />
            <ListRow title="Ventilate and retest after 30 min" meta="Forced-air fan F-07 is on site" />
            <ListRow title="Find the source" meta="Diesel compressor exhaust upwind of the manway" />
          </ul>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyConflictSide({ permit, clash }: { permit: SafetyPermit; clash: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-(--kit-radius-sm) bg-(--kit-well) p-4">
      <div className="flex items-center gap-2">
        <IconChip size="sm" tone={permitStatus(permit.state).tone}>
          <SafetyKindIcon kind={permit.kind} />
        </IconChip>
        <span className="text-sm font-medium text-(--kit-text-2)">
          {permit.kind} · {permit.number}
        </span>
      </div>
      <p className="text-base font-semibold text-(--kit-text)">{permit.title}</p>
      <p className="text-sm text-(--kit-text-2)">
        {permit.location} · {permit.from} – {permit.to}
      </p>
      <p className="text-sm font-medium text-(--kit-text)">{clash}</p>
    </div>
  );
}

function SafetyAndPermitsConflict() {
  const [decision, setDecision] = useState<'none' | 'resequence' | 'accept'>('none');
  return (
    <SafetySheet>
      <Panel
        title="Simultaneous operations conflict"
        subtitle="Two permits overlap in space and time on module M23"
        tone="warning"
        icon={
          <IconChip tone="warning">
            <IconAlertTriangle />
          </IconChip>
        }
        actions={<StatusPill tone={decision === 'none' ? 'warning' : 'success'}>{decision === 'none' ? 'Unresolved' : decision === 'resequence' ? 'Scaffold moved to 18:00' : 'Accepted with fire blanket'}</StatusPill>}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setDecision('resequence')}>
              Move scaffold work to 18:00
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDecision('accept')}>
              Accept with extra control
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDecision('none')}>
              Reset
            </Button>
          </div>
        }
      >
        <div className="flex items-stretch gap-3">
          <SafetyConflictSide permit={SAFETY_PERMITS[0]} clash="Sparks and slag can fall to deck 2 grating" />
          <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 text-center">
            <span className="text-2xl font-semibold text-(--kit-text) tabular-nums">8 h</span>
            <span className="text-xs text-(--kit-text-2)">overlap, 09:00 to 17:00, one deck apart</span>
          </div>
          <SafetyConflictSide permit={SAFETY_PERMITS[3]} clash="Scaffolders work directly above the weld" />
        </div>
      </Panel>
    </SafetySheet>
  );
}

const SAFETY_APPROVER: Record<string, string> = { Low: 'Permit holder', Medium: 'Area authority', High: 'Operations manager', Extreme: 'Work must not start' };

function SafetyAndPermitsRiskPicker() {
  const [picked, setPicked] = useState<RiskPoint>({ likelihood: 3, consequence: 4 });
  const rating = riskRating(picked.likelihood, picked.consequence);
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-8" title="Assess the risk" subtitle="Pick how likely the event is and how bad it could be">
          <RiskMatrix label="Risk matrix picker" size="lg" selected={picked} onSelect={setPicked} />
        </Panel>
        <Panel className="col-span-4" title="Rating" subtitle="Updates as you pick" tone={rating.tone}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Stat variant="plain" size="hero" label="Risk score" value={rating.score} target={`Likelihood ${picked.likelihood} × consequence ${picked.consequence}`} />
              <StatusPill tone={rating.tone} size="lg" variant="filled" className="self-start">
                {rating.label} risk
              </StatusPill>
            </div>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4 border-t pt-3" style={{ borderColor: 'var(--kit-rule)' }}>
                <dt className="text-(--kit-text-2)">Approval needed from</dt>
                <dd className="font-semibold text-(--kit-text)">{SAFETY_APPROVER[rating.label]}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3" style={{ borderColor: 'var(--kit-rule)' }}>
                <dt className="text-(--kit-text-2)">Review interval</dt>
                <dd className="font-semibold text-(--kit-text)">{rating.score >= 10 ? 'Every shift' : 'Weekly'}</dd>
              </div>
            </dl>
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsResidualRisk() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-7" title="Initial and residual risk" subtitle="Hot work on a hydrocarbon drain line">
          <RiskMatrix label="Initial and residual risk" initial={{ likelihood: 4, consequence: 4 }} residual={{ likelihood: 2, consequence: 3 }} />
        </Panel>
        <Panel className="col-span-5" title="Controls that bring it down" subtitle="From extreme 16 to medium 6" padding="tight">
          <ul>
            {SAFETY_CONTROLS.map((control, index) => (
              <ListRow key={control.id} leading={<span className="flex size-7 items-center justify-center text-sm font-semibold text-(--kit-text-2) tabular-nums">{index + 1}</span>} title={control.control} meta={control.effect} />
            ))}
          </ul>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsToolboxTalk() {
  const [confirmed, setConfirmed] = useState<string[]>(['t1', 't2', 't3']);
  const toggle = (id: string, checked: boolean) => setConfirmed((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  const remaining = SAFETY_TOOLBOX.length - confirmed.length;
  return (
    <SafetySheet>
      <Grid>
        <Panel
          className="col-span-8"
          title="Toolbox talk"
          subtitle="PTW-2291, before the work party signs on"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-(--kit-text-2)">{remaining === 0 ? 'All points confirmed by the work party.' : `Confirm ${remaining} more ${remaining === 1 ? 'point' : 'points'} before work can start.`}</span>
              <Button size="sm" disabled={remaining > 0}>
                Record toolbox talk
              </Button>
            </div>
          }
        >
          <CheckboxGroup aria-label="Toolbox talk checklist" className="gap-3">
            {SAFETY_TOOLBOX.map((item) => (
              <CheckboxItem key={item.id}>
                <CheckboxItemControl checked={confirmed.includes(item.id)} onCheckedChange={(checked) => toggle(item.id, checked === true)} />
                <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
                <CheckboxItemDescription>{item.description}</CheckboxItemDescription>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </Panel>
        <Panel className="col-span-4" title="Work party" subtitle="6 people signed on">
          <div className="flex flex-1 flex-col items-center justify-between gap-4">
            <RingGauge label="Points confirmed" value={confirmed.length} max={SAFETY_TOOLBOX.length} unit={`of ${SAFETY_TOOLBOX.length}`} tone={remaining === 0 ? 'success' : 'accent'} size={148} />
            <ul className="w-full">
              <ListRow leading={<IconChip size="sm" tone="blue"><IconUsers /></IconChip>} title="Tomás Barros, permit holder" meta="Signed on 07:52" />
              <ListRow leading={<IconChip size="sm" tone="pink"><IconFlame /></IconChip>} title="Two welders" meta="Coded for carbon steel, certificates valid" />
              <ListRow leading={<IconChip size="sm" tone="amber"><IconEye /></IconChip>} title="Fire watch and two helpers" meta="Hose charged, extinguisher at the habitat" />
            </ul>
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsBarriers() {
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-8" title="Barrier status" subtitle="Major accident hazard: hydrocarbon release in gas compression" padding="tight">
          <BarrierStack label="Barriers for hydrocarbon release" barriers={SAFETY_BARRIERS} />
        </Panel>
        <Panel className="col-span-4" title="Safety-critical elements" subtitle="Last test result, 91 elements">
          <Donut
            label="Safety-critical element tests"
            centerValue={`${Math.round((SAFETY_ELEMENT_TOTALS.passed / 91) * 100)} %`}
            centerCaption="passed"
            legend="bottom"
            segments={[
              { label: 'Passed', value: SAFETY_ELEMENT_TOTALS.passed, tone: 'success' },
              { label: 'Degraded', value: SAFETY_ELEMENT_TOTALS.degraded, tone: 'warning' },
              { label: 'Failed', value: SAFETY_ELEMENT_TOTALS.failed, tone: 'critical' },
            ]}
          />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsIncidents() {
  return (
    <SafetySheet>
      <Grid>
        <Stat
          className="col-span-4"
          size="hero"
          emphasis="strong"
          icon={<IconShieldCheck />}
          label="Days since lost-time incident"
          value={PLANT_KPIS.daysSinceIncident.value}
          unit="days"
          target={`Record ${PLANT_KPIS.daysSinceIncident.target} days`}
          delta={{ value: 1, decimals: 0, caption: 'since yesterday' }}
        />
        <Panel className="col-span-8" title="Observation cards" subtitle="Safe and unsafe observations handed in per month">
          <Bars
            label="Observation cards per month"
            categories={SAFETY_MONTHS}
            stacked
            height={200}
            series={[
              { id: 'safe', label: 'Safe behaviour', values: SAFETY_OBSERVATIONS.safe, tone: 'success' },
              { id: 'unsafe', label: 'Unsafe condition', values: SAFETY_OBSERVATIONS.unsafe, tone: 'warning' },
            ]}
          />
        </Panel>
        <Panel className="col-span-12" title="Incident log" subtitle="Most recent first" padding="tight">
          <SafetyIncidentRows />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsMuster() {
  const counted = SAFETY_STATIONS.reduce((sum, station) => sum + station.counted, 0);
  const expected = SAFETY_STATIONS.reduce((sum, station) => sum + station.expected, 0);
  return (
    <SafetySheet>
      <Grid>
        <Panel className="col-span-4" title="Muster count" subtitle="Drill started 14:00, 6 min ago" tone="warning">
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <RingGauge label="People accounted for" value={counted} max={expected} unit={`of ${expected}`} tone="warning" size={176} />
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              2 not accounted for
            </StatusPill>
          </div>
        </Panel>
        <Panel className="col-span-4" title="By station" subtitle="Counted against personnel on board">
          <div className="flex flex-1 flex-col justify-between gap-4">
            {SAFETY_STATIONS.map((station) => (
              <Meter key={station.id} label={station.name} value={station.counted} max={station.expected} tone={station.counted === station.expected ? 'success' : 'warning'} hideScale />
            ))}
          </div>
        </Panel>
        <Panel className="col-span-4" title="Not accounted for" subtitle="Last known position" padding="tight" footer={<Button size="sm">Send search team</Button>}>
          <ul>
            {SAFETY_MISSING.map((person) => (
              <ListRow key={person.id} tone="warning" leading={<IconChip size="sm" tone="warning"><IconEye /></IconChip>} title={person.name} meta={`${person.last} · ${person.permit}`} />
            ))}
          </ul>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsConsole() {
  return (
    <SafetySheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={5} label="Permit control">
          <Stat variant="plain" size="lg" label="Active permits" value={2} tone="success" state="Work on" target="1 hot work" />
          <Stat variant="plain" size="lg" label="Suspended" value={1} tone="warning" state="Gas retest" target="PTW-2288" />
          <Stat variant="plain" size="lg" label="Awaiting approval" value={1} tone="info" state="Area authority" target="12 min waiting" />
          <Stat variant="plain" size="lg" label="Expired, open" value={1} tone="critical" state="Close out" target="PTW-2279" />
          <Stat variant="plain" size="lg" label="Isolations fitted" value="14" unit="of 15" tone="warning" state="1 to fit" target="IC-0418" />
        </StatGroup>
        <Panel className="col-span-8" title="Permit board" subtitle="All areas, this shift" padding="none">
          <DataTable label="Permit board" flush density="compact" columns={SAFETY_PERMIT_COLUMNS_SHORT} rows={SAFETY_PERMITS.slice(0, 7)} rowKey={(permit) => permit.number} rowTone={(permit) => permitStatus(permit.state).tone} />
        </Panel>
        <Panel className="col-span-4" title="Gas test 20-VA-1002" subtitle="13:40, entry stopped" tone="critical">
          <div className="grid grid-cols-2 gap-px">
            {SAFETY_GAS.map((reading) => (
              <GasReading key={reading.symbol} {...reading} />
            ))}
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsPoster() {
  return (
    <SafetySheet look="poster">
      <Grid>
        <Stat className="col-span-6 row-span-2" size="hero" tone="green" icon={<IconShieldCheck />} label="Days since lost-time incident" value={218} unit="days" target="Record 365 days" delta={{ value: 1, decimals: 0, caption: 'and counting' }} />
        <Stat className="col-span-3" size="lg" tone="blue" label="Active permits" value={2} target="1 hot work" />
        <Stat className="col-span-3" size="lg" tone="amber" label="Suspended" value={1} target="PTW-2288" />
        <Stat className="col-span-3" size="lg" tone="purple" label="Observation cards" value={31} target="This month" />
        <Stat className="col-span-3" size="lg" tone="pink" label="Barriers impaired" value={1} target="Blowdown and flare" />
        <Panel className="col-span-12" title="Risk register" subtitle="Open risks by rating, 27 in total">
          <RiskMatrix label="Risk register counts" counts={{ '1-1': 3, '1-2': 2, '2-1': 4, '2-2': 3, '2-3': 4, '3-2': 2, '3-3': 3, '2-4': 2, '3-4': 2, '4-3': 1, '4-4': 1 }} />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsBlueprint() {
  return (
    <SafetySheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Isolation certificate IC-0418" subtitle="Sheet 1 of 2 · recompressor 23-KA-9103 · drawn for PTW-2291">
          <StepTrack label="Certificate stages" steps={[{ id: 'plan', label: 'Planned', detail: 'M. Solberg', state: 'done' }, { id: 'fit', label: 'Fitted', detail: '4 of 5 points', state: 'current' }, { id: 'prove', label: 'Proved', detail: 'Bleed and try', state: 'pending' }, { id: 'issue', label: 'Issued', detail: 'Area authority', state: 'pending' }, { id: 'remove', label: 'Removed', detail: 'After close-out', state: 'pending' }]} />
        </Panel>
        <Panel className="col-span-7" title="Isolation points" subtitle="In the order they are fitted" padding="tight">
          <SafetyIsolationRows />
        </Panel>
        <Panel className="col-span-5" title="Risk with isolation in place" subtitle="Initial 16, residual 6">
          <RiskMatrix label="Risk with isolation" initial={{ likelihood: 4, consequence: 4 }} residual={{ likelihood: 2, consequence: 3 }} />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsSignal() {
  return (
    <SafetySheet look="signal">
      <Grid>
        {SAFETY_AREAS.map((area) => (
          <Stat
            key={area.tag}
            className="col-span-3"
            tone={area.tone}
            state={area.state}
            stateIcon={area.tone === 'success' ? <IconCircleCheck /> : <IconAlertTriangle />}
            label={area.area}
            value={area.active}
            unit={area.active === 1 ? 'permit live' : 'permits live'}
            target={area.detail}
          />
        ))}
        <div className="col-span-12 grid grid-cols-4 gap-(--kit-gap)">
          {SAFETY_GAS.map((reading) => (
            <GasReading key={reading.symbol} {...reading} taken="20-VA-1002, 13:40" />
          ))}
        </div>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsEditorial() {
  return (
    <SafetySheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" size="lg" eyebrow="Weekly safety brief, week 11" title="218 days without a lost-time incident, one barrier impaired" description="Observation cards are down a third on February. The blowdown valve that failed its test on Tuesday is the one item the plant manager needs to act on." />
        <StatGroup className="col-span-12" columns={4} label="Week 11 in figures">
          <Stat variant="plain" size="lg" label="Permits issued" value={46} delta={{ value: 4, decimals: 0, caption: 'vs week 10', good: 'none' }} />
          <Stat variant="plain" size="lg" label="Suspended" value={3} delta={{ value: 2, decimals: 0, caption: 'vs week 10', good: 'down' }} />
          <Stat variant="plain" size="lg" label="Observation cards" value={31} delta={{ value: -18, decimals: 0, caption: 'vs February', good: 'up' }} />
          <Stat variant="plain" size="lg" label="Elements passed" value={94.5} decimals={1} unit="%" target="Target 98 %" />
        </StatGroup>
        <Panel className="col-span-7" title="Observation cards" subtitle="Handed in per month">
          <Bars label="Observation cards, six months" categories={SAFETY_MONTHS} stacked height={220} series={[{ id: 'safe', label: 'Safe behaviour', values: SAFETY_OBSERVATIONS.safe, tone: 'accent' }, { id: 'unsafe', label: 'Unsafe condition', values: SAFETY_OBSERVATIONS.unsafe, tone: 'warning' }]} />
        </Panel>
        <Panel className="col-span-5" title="Barriers" subtitle="Hydrocarbon release, gas compression">
          <BarrierStack label="Barrier summary" barriers={SAFETY_BARRIERS.slice(0, 5)} />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsPermitDetail() {
  const permit = SAFETY_PERMITS[0];
  return (
    <SafetySheet look="studio">
      <Grid>
        <div className="col-span-12 flex flex-wrap items-center gap-4">
          <IconChip tone="success" size="lg">
            <IconFlame />
          </IconChip>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-(--kit-text-2)">
              Hot work · {permit.number} · {permit.location}
            </p>
            <h3 className="text-2xl font-semibold text-(--kit-text)">{permit.title}</h3>
          </div>
          <StatusPill tone="success" size="lg" icon={<IconCircleCheck />}>
            Active until 18:00
          </StatusPill>
          <Button variant="outline" size="sm">
            Suspend
          </Button>
          <Button size="sm">Hand back site</Button>
        </div>
        <Panel className="col-span-12" title="Life cycle">
          <StepTrack label="Life cycle of the permit" steps={SAFETY_LIFE_CYCLE} />
        </Panel>
        <Panel className="col-span-8" title="Gas test" subtitle="Last reading 13:40 by Jonas Nyberg · every 2 h">
          <div className="grid grid-cols-4 gap-3">
            {SAFETY_GAS.map((reading) => (
              <GasReading key={reading.symbol} {...reading} value={reading.symbol === 'CO' ? 6 : reading.symbol === 'H₂S' ? 1.2 : reading.value} />
            ))}
          </div>
        </Panel>
        <Panel className="col-span-4 row-span-2" title="Approvals" subtitle="4 of 5 signed">
          <StepTrack label="Approvals" orientation="vertical" steps={SAFETY_APPROVALS} />
        </Panel>
        <Panel className="col-span-8" title="Residual risk" subtitle="Medium 6 with the controls in place, down from extreme 16">
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-6">
            <RiskMatrix label="Residual risk of the permit" initial={{ likelihood: 4, consequence: 4 }} residual={{ likelihood: 2, consequence: 3 }} />
            <ul>
              {SAFETY_CONTROLS.map((control) => (
                <ListRow key={control.id} title={control.control} meta={control.effect} />
              ))}
            </ul>
          </div>
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

function SafetyAndPermitsOverview() {
  const impaired = SAFETY_BARRIERS.filter((barrier) => barrierState(barrier).tone !== 'success').length;
  return (
    <SafetySheet look="studio">
      <Grid>
        <Stat className="col-span-3" emphasis="strong" icon={<IconShieldCheck />} label="Days since incident" value={218} unit="days" target="Record 365" sparkline={[211, 212, 213, 214, 215, 216, 217, 218]} />
        <Stat className="col-span-3" tone="teal" icon={<IconClipboardCheck />} label="Permits live" value={3} target="2 active, 1 issued" delta={{ value: -1, decimals: 0, caption: 'vs yesterday', good: 'none' }} />
        <Stat className="col-span-3" tone="amber" icon={<IconLock />} label="Isolations in place" value={15} target="1 point still to fit" />
        <Stat className="col-span-3" tone="pink" icon={<IconWind />} label="Barriers not healthy" value={impaired} target="1 impaired, 3 degraded" />
        <Panel className="col-span-8" title="Permits needing attention" subtitle="Suspended, expired or waiting" padding="none" actions={<Button variant="ghost" size="sm">Open register</Button>}>
          <DataTable label="Permits needing attention" flush columns={SAFETY_PERMIT_COLUMNS_SHORT} rows={SAFETY_PERMITS.filter((item) => safetyMatches(item, 'action'))} rowKey={(item) => item.number} rowTone={safetyRowTone} />
        </Panel>
        <Panel className="col-span-4" title="Work by kind" subtitle="Live and planned today">
          <Donut
            label="Permits by kind of work"
            centerValue="8"
            centerCaption="permits"
            legend="bottom"
            segments={[
              { label: 'Cold work', value: 3, tone: 'blue' },
              { label: 'Confined space', value: 2, tone: 'purple' },
              { label: 'Hot work', value: 1, tone: 'pink' },
              { label: 'Height or electrical', value: 2, tone: 'amber' },
            ]}
          />
        </Panel>
        <Panel className="col-span-7" title="Barrier status" subtitle="Hydrocarbon release, gas compression" padding="tight">
          <BarrierStack label="Barrier status overview" barriers={SAFETY_BARRIERS} />
        </Panel>
        <Panel className="col-span-5" title="Recent incidents" subtitle="Last 30 days and the last lost-time injury" padding="tight">
          <SafetyIncidentRows />
        </Panel>
      </Grid>
    </SafetySheet>
  );
}

export default definePage({
  id: 'safety-and-permits',
  title: 'Safety and permits',
  summary:
    'Permits to work, isolations, gas tests, risk, barriers and incidents. Every part says its state in a word as well as a colour, and each is shown as a filled sheet in several looks so the same permit reads at a desk, on a control-room console and on a wall.',
  guidance: {
    use: [
      'Name the permit state in words and keep one word per state across the product.',
      'Show what a permit rests on: isolation, gas test, approvals and how long it is still valid.',
      'Put the reason next to a suspended or expired permit, with the action that clears it.',
      'Mark initial and residual risk on the same matrix so the effect of the controls is visible.',
    ],
    avoid: [
      'Red and green alone for permit or barrier state.',
      'Letting work start from a screen that hides an unfitted isolation or a late gas test.',
      'A risk matrix without the score and the band word in each cell.',
      'Counting days since an incident without saying which kind of incident.',
    ],
  },
  source,
  sections: [
    {
      id: 'permits',
      title: 'Permits to work',
      description: 'The permit as a card, its states, its life cycle and the register.',
      specimens: [
        {
          id: 'SafetyAndPermitsPermitCards',
          title: 'Permit cards',
          note: 'Use a card per permit when people need the job, the holder, the validity and the controls at a glance.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/PermitCard.tsx', 'kit/safety-and-permits/permits.ts', 'kit/Grid.tsx'],
          Component: SafetyAndPermitsPermitCards,
        },
        {
          id: 'SafetyAndPermitsPermitStates',
          title: 'Permit states',
          note: 'Publish the state vocabulary once, with who acts next, so every screen uses the same words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/permits.ts', 'kit/DataTable.tsx', 'kit/Donut.tsx', 'kit/StatusPill.tsx'],
          Component: SafetyAndPermitsPermitStates,
        },
        {
          id: 'SafetyAndPermitsLifeCycle',
          title: 'Life cycle and approval chain',
          note: 'Show the stages across the top and the signatures as a chain when someone asks what the permit is waiting for.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/StepTrack.tsx', 'kit/Panel.tsx', 'kit/ListRow.tsx'],
          Component: SafetyAndPermitsLifeCycle,
        },
        {
          id: 'SafetyAndPermitsRegister',
          title: 'Permit register',
          note: 'Use the register for the area authority who scans every permit on the plant and filters to what needs action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/safety-and-permits/permits.ts', 'kit/TagId.tsx'],
          Component: SafetyAndPermitsRegister,
        },
      ],
    },
    {
      id: 'isolations',
      title: 'Isolations, gas tests and conflicts',
      description: 'What has to be true before work can start, and what stops it.',
      specimens: [
        {
          id: 'SafetyAndPermitsIsolationCertificate',
          title: 'Isolation certificate',
          note: 'List every isolation point with its method and lock so the missing one cannot be overlooked.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/Meter.tsx', 'kit/IconChip.tsx', 'kit/TagId.tsx'],
          Component: SafetyAndPermitsIsolationCertificate,
        },
        {
          id: 'SafetyAndPermitsGasTest',
          title: 'Gas test readings',
          note: 'Show each gas against its safe window and the retest trend when entry depends on the atmosphere.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/GasReading.tsx', 'kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: SafetyAndPermitsGasTest,
        },
        {
          id: 'SafetyAndPermitsConflict',
          title: 'Simultaneous operations conflict',
          note: 'Put the two clashing permits side by side with the overlap and the ways to resolve it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/IconChip.tsx', 'kit/StatusPill.tsx'],
          Component: SafetyAndPermitsConflict,
        },
      ],
    },
    {
      id: 'risk',
      title: 'Risk and readiness',
      description: 'Rating a job, showing what the controls buy, and confirming the work party is ready.',
      specimens: [
        {
          id: 'SafetyAndPermitsRiskPicker',
          title: 'Risk matrix picker',
          note: 'Let the assessor pick a cell and read the score, the band and who must approve.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/RiskMatrix.tsx', 'kit/safety-and-permits/permits.ts', 'kit/Stat.tsx'],
          Component: SafetyAndPermitsRiskPicker,
        },
        {
          id: 'SafetyAndPermitsResidualRisk',
          title: 'Initial and residual risk',
          note: 'Mark both ratings on one matrix beside the controls that move the risk from one to the other.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/RiskMatrix.tsx', 'kit/ListRow.tsx'],
          Component: SafetyAndPermitsResidualRisk,
        },
        {
          id: 'SafetyAndPermitsToolboxTalk',
          title: 'Toolbox-talk checklist',
          note: 'Hold the sign-on until every point is confirmed, and say how many are left.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/ListRow.tsx'],
          Component: SafetyAndPermitsToolboxTalk,
        },
      ],
    },
    {
      id: 'barriers',
      title: 'Barriers, incidents and people',
      description: 'The standing state of the plant’s defences and of the people on it.',
      specimens: [
        {
          id: 'SafetyAndPermitsBarriers',
          title: 'Barrier status',
          note: 'Show one row per barrier with a block per safety-critical element so a single failed test stands out.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/BarrierStack.tsx', 'kit/Donut.tsx'],
          Component: SafetyAndPermitsBarriers,
        },
        {
          id: 'SafetyAndPermitsIncidents',
          title: 'Days since incident and log',
          note: 'Lead with the count of days, then the observation trend and the log that explains it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Bars.tsx', 'kit/ListRow.tsx'],
          Component: SafetyAndPermitsIncidents,
        },
        {
          id: 'SafetyAndPermitsMuster',
          title: 'Muster count',
          note: 'During a muster show who is accounted for, by station, and name the people who are not.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/ListRow.tsx'],
          Component: SafetyAndPermitsMuster,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same parts in other looks',
      description: 'The anatomy changes with the look: strips and dense rows on a console, solid blocks on a poster, outlined sheets on a drawing, state-filled tiles on a wall.',
      specimens: [
        {
          id: 'SafetyAndPermitsConsole',
          title: 'Console: permit control board',
          note: 'Pick the console look for the permit office and control room, where every permit is watched all shift.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'kit/safety-and-permits/GasReading.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsConsole,
        },
        {
          id: 'SafetyAndPermitsPoster',
          title: 'Poster: safety board',
          note: 'Pick the poster look for the board at the gate: one huge figure and a few solid counts.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/safety-and-permits/RiskMatrix.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsPoster,
        },
        {
          id: 'SafetyAndPermitsBlueprint',
          title: 'Blueprint: isolation sheet',
          note: 'Pick the blueprint look for certificates that are printed and walked in the field.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/StepTrack.tsx', 'kit/safety-and-permits/RiskMatrix.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsBlueprint,
        },
        {
          id: 'SafetyAndPermitsSignal',
          title: 'Signal: area wall tiles',
          note: 'Pick the signal look for a wall screen where each area and each gas fills with its state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/safety-and-permits/GasReading.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsSignal,
        },
        {
          id: 'SafetyAndPermitsEditorial',
          title: 'Editorial: weekly safety brief',
          note: 'Pick the editorial look for the brief that managers read once a week rather than watch.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/SectionHeader.tsx', 'kit/StatGroup.tsx', 'kit/Bars.tsx', 'kit/safety-and-permits/BarrierStack.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that could be dropped into a product.',
      specimens: [
        {
          id: 'SafetyAndPermitsPermitDetail',
          title: 'Permit detail',
          note: 'Use as the page behind a permit card: life cycle, gas test, isolation, approvals and risk on one screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/safety-and-permits/StepTrack.tsx', 'kit/safety-and-permits/GasReading.tsx', 'kit/safety-and-permits/RiskMatrix.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsPermitDetail,
        },
        {
          id: 'SafetyAndPermitsOverview',
          title: 'Safety overview',
          note: 'Use as the landing page for a safety lead: the four counts, the permits to act on, barriers and incidents.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/DataTable.tsx', 'kit/Donut.tsx', 'kit/safety-and-permits/BarrierStack.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndPermitsOverview,
        },
      ],
    },
  ],
});
