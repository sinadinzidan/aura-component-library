import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  IconAlertTriangle,
  IconBolt,
  IconCircleCheck,
  IconCircleX,
  IconDroplet,
  IconFileCertificate,
  IconFlame,
  IconGauge,
  IconLock,
  IconLockOpen,
  IconSettings,
  IconShieldCheck,
  IconUsers,
  IconWind,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { DangerTag } from '../../../library/kit/lockout-tagout/DangerTag';
import {
  ENERGY_WORD,
  ISOLATION_STATES,
  STATE_TONE,
  STATE_WORD,
  advanceState,
  boundaryProgress,
  removalOrder,
  workGate,
  type EnergyType,
  type IsolationPoint,
  type IsolationState,
} from '../../../library/kit/lockout-tagout/isolation';
import { IsolationPointRow } from '../../../library/kit/lockout-tagout/IsolationPointRow';
import { IsolationSchematic, type SchematicLink, type SchematicNode } from '../../../library/kit/lockout-tagout/IsolationSchematic';
import { LockBoard, type LockBoardPerson } from '../../../library/kit/lockout-tagout/LockBoard';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './lockout-tagout.tsx?raw';

/** Isolation of the recompressor for the drive-end bearing inspection, WO-104482. */
const LOCKOUT_TAGOUT_POINTS: IsolationPoint[] = [
  { id: 'p1', step: 1, tag: '82-EN-9103', name: 'Motor breaker, recompressor', energy: 'electrical', method: 'Open, rack out and lock', state: 'verified', lock: 'R-113' },
  { id: 'p2', step: 2, tag: '23-XV-9130', name: 'Suction valve', energy: 'process', method: 'Close and lock', state: 'verified', lock: 'R-114' },
  { id: 'p3', step: 3, tag: '23-XV-9135', name: 'Discharge valve', energy: 'process', method: 'Close and lock', state: 'locked', lock: 'R-115' },
  { id: 'p4', step: 4, tag: '23-HV-9138', name: 'Casing vent to flare', energy: 'process', method: 'Open and lock, bleed to zero', state: 'isolated' },
  { id: 'p5', step: 5, tag: '41-HV-9171', name: 'Lube oil supply', energy: 'hydraulic', method: 'Close and lock', state: 'planned' },
  { id: 'p6', step: 6, tag: '23-HV-9139', name: 'Seal gas supply', energy: 'pneumatic', method: 'Close and lock', state: 'planned' },
];

const LOCKOUT_TAGOUT_VERIFIED: IsolationPoint[] = LOCKOUT_TAGOUT_POINTS.map((point) => ({ ...point, state: 'verified', lock: point.lock ?? `R-11${point.step + 2}` }));

const LOCKOUT_TAGOUT_ENERGY_ICON: Record<EnergyType, ReactNode> = {
  electrical: <IconBolt />,
  process: <IconGauge />,
  hydraulic: <IconDroplet />,
  pneumatic: <IconWind />,
  mechanical: <IconSettings />,
  thermal: <IconFlame />,
};

const LOCKOUT_TAGOUT_STATE_TEXT: Record<IsolationState, string> = {
  planned: 'On the certificate, not yet touched.',
  isolated: 'In the safe position, but anyone could still move it.',
  locked: 'Held by a lock, with a danger tag on it.',
  verified: 'A second person has checked position, lock and tag.',
  removed: 'Lock and tag taken off after the job.',
};

const LOCKOUT_TAGOUT_NODES: SchematicNode[] = [
  { id: 'board', x: 22, y: 12, kind: 'equipment', label: 'Switchboard' },
  { id: 'suction', x: 8, y: 50, kind: 'equipment', label: 'Suction' },
  { id: 'comp', x: 50, y: 50, kind: 'equipment', label: 'Recompressor 23-KA-9103' },
  { id: 'discharge', x: 92, y: 50, kind: 'equipment', label: 'Discharge' },
  { id: 'flare', x: 92, y: 12, kind: 'equipment', label: 'Flare' },
  { id: 'lube', x: 8, y: 82, kind: 'equipment', label: 'Lube oil' },
  { id: 'seal', x: 92, y: 82, kind: 'equipment', label: 'Seal gas' },
];

const LOCKOUT_TAGOUT_POINT_PLACES: Record<string, { x: number; y: number }> = {
  p1: { x: 50, y: 12 },
  p2: { x: 26, y: 50 },
  p3: { x: 76, y: 50 },
  p4: { x: 70, y: 12 },
  p5: { x: 28, y: 82 },
  p6: { x: 72, y: 82 },
};

const LOCKOUT_TAGOUT_LINKS: SchematicLink[] = [
  { from: 'board', to: 'p1', kind: 'electrical' },
  { from: 'p1', to: 'comp', kind: 'electrical' },
  { from: 'suction', to: 'p2' },
  { from: 'p2', to: 'comp' },
  { from: 'comp', to: 'p3' },
  { from: 'p3', to: 'discharge' },
  { from: 'comp', to: 'p4' },
  { from: 'p4', to: 'flare' },
  { from: 'lube', to: 'p5', kind: 'utility' },
  { from: 'p5', to: 'comp', kind: 'utility' },
  { from: 'seal', to: 'p6', kind: 'utility' },
  { from: 'p6', to: 'comp', kind: 'utility' },
];

function lockoutTagoutNodes(points: readonly IsolationPoint[]): SchematicNode[] {
  return [
    ...LOCKOUT_TAGOUT_NODES,
    ...points.map((point): SchematicNode => ({ id: point.id, kind: 'point', label: point.tag, step: point.step, state: point.state, ...LOCKOUT_TAGOUT_POINT_PLACES[point.id] })),
  ];
}

const LOCKOUT_TAGOUT_CREW: LockBoardPerson[] = [
  { id: 'tb', name: 'Tomás Barros', role: 'Mechanical technician', lock: 'P-21', tone: 'blue', on: true },
  { id: 'jn', name: 'Jonas Nyberg', role: 'Instrument technician', lock: 'P-34', tone: 'purple', on: true },
  { id: 'ak', name: 'Aisha Khan', role: 'Rotating equipment engineer', lock: 'P-08', tone: 'teal', on: false },
  { id: 'ms', name: 'Magnus Solberg', role: 'Maintenance planner', lock: 'P-15', tone: 'amber', on: false },
];

const LOCKOUT_TAGOUT_TRY_STEPS = [
  'Area clear, everyone told the try step is starting',
  'Local start button pressed: motor does not start',
  'Control room start command given: no response',
  'Casing pressure reads zero on the local gauge',
  'Start button returned to off',
];

type LockoutTagoutLongTerm = { id: string; equipment: string; tag: string; reason: string; days: number; owner: string; review: string; overdue: boolean };

const LOCKOUT_TAGOUT_REGISTER: LockoutTagoutLongTerm[] = [
  { id: 'IC-2104', equipment: 'Test separator', tag: '20-VA-1002', reason: 'Awaiting vessel inspection', days: 142, owner: 'Liv Wold', review: '1 Mar', overdue: true },
  { id: 'IC-2188', equipment: 'Cooling water pump', tag: '40-PA-4001', reason: 'Bearing replacement, parts on order', days: 61, owner: 'Magnus Solberg', review: '20 Mar', overdue: false },
  { id: 'IC-2240', equipment: 'Export pump B', tag: '27-PA-2001B', reason: 'Seal leak, awaiting shutdown', days: 23, owner: 'Aisha Khan', review: '2 Apr', overdue: false },
  { id: 'IC-2291', equipment: 'Recompressor', tag: '23-KA-9103', reason: 'Drive-end bearing inspection', days: 0, owner: 'Tomás Barros', review: '19 Mar', overdue: false },
];

const LOCKOUT_TAGOUT_REGISTER_COLUMNS: DataTableColumn<LockoutTagoutLongTerm>[] = [
  {
    id: 'equipment',
    header: 'Equipment',
    cell: (row) => (
      <span className="flex flex-col">
        <span className="font-medium">{row.equipment}</span>
        <TagId>{row.tag}</TagId>
      </span>
    ),
  },
  { id: 'certificate', header: 'Certificate', nowrap: true, cell: (row) => row.id },
  { id: 'reason', header: 'Reason', muted: true, cell: (row) => row.reason },
  { id: 'days', header: 'In place', numeric: true, nowrap: true, cell: (row) => (row.days === 0 ? 'Today' : `${row.days} days`) },
  { id: 'owner', header: 'Owner', muted: true, nowrap: true, cell: (row) => row.owner },
  { id: 'review', header: 'Review', nowrap: true, cell: (row) => <StatusPill tone={row.overdue ? 'critical' : 'neutral'}>{row.overdue ? `Overdue since ${row.review}` : `Due ${row.review}`}</StatusPill> },
];

const LOCKOUT_TAGOUT_POINT_COLUMNS: DataTableColumn<IsolationPoint>[] = [
  { id: 'step', header: 'Step', numeric: true, width: 'w-14', cell: (point) => point.step },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (point) => <TagId>{point.tag}</TagId> },
  { id: 'name', header: 'Point', cell: (point) => point.name },
  { id: 'energy', header: 'Energy', muted: true, nowrap: true, cell: (point) => ENERGY_WORD[point.energy] },
  { id: 'method', header: 'Method', muted: true, cell: (point) => point.method },
  { id: 'lock', header: 'Lock', nowrap: true, cell: (point) => point.lock ?? '—' },
  { id: 'state', header: 'State', nowrap: true, cell: (point) => <StatusPill tone={STATE_TONE[point.state]}>{STATE_WORD[point.state]}</StatusPill> },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function LockoutTagoutSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function LockoutTagoutPointList() {
  const [points, setPoints] = useState(LOCKOUT_TAGOUT_POINTS);
  const progress = boundaryProgress(points);
  const advance = (id: string) =>
    setPoints(points.map((point) => (point.id === id ? { ...point, state: advanceState(point.state), lock: point.lock ?? `R-11${point.step + 2}` } : point)));
  const current = points.find((point) => point.state !== 'verified');
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Isolation list"
        subtitle="Recompressor 23-KA-9103 · certificate IC-2291 · in step order"
        icon={<IconLock />}
        padding="tight"
        actions={<StatusPill tone={progress.complete ? 'success' : 'warning'}>{progress.verified} of {progress.total} verified</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">{progress.complete ? 'Boundary complete. The try step can start.' : 'Work the points in order. A point counts only once a second person has verified it.'}</span>}
      >
        <ol aria-label="Isolation points in step order" className="flex flex-col">
          {points.map((point) => (
            <IsolationPointRow key={point.id} point={point} icon={LOCKOUT_TAGOUT_ENERGY_ICON[point.energy]} current={point.id === current?.id} onAdvance={advance} />
          ))}
        </ol>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutStates() {
  return (
    <LockoutTagoutSheet>
      <Grid columns={5}>
        {ISOLATION_STATES.map((state, index) => (
          <Panel key={state} title={STATE_WORD[state]} subtitle={`Stage ${index + 1} of 5`} tone={STATE_TONE[state]}>
            <div className="flex flex-col gap-3">
              <IconChip tone={STATE_TONE[state]} size="lg">
                {state === 'planned' ? <IconFileCertificate /> : state === 'isolated' ? <IconCircleX /> : state === 'locked' ? <IconLock /> : state === 'verified' ? <IconShieldCheck /> : <IconLockOpen />}
              </IconChip>
              <p className="text-sm text-(--kit-text-2)">{LOCKOUT_TAGOUT_STATE_TEXT[state]}</p>
            </div>
          </Panel>
        ))}
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutTags() {
  return (
    <LockoutTagoutSheet>
      <Panel title="Danger tags" subtitle="One on every locked point, readable from arm's length">
        <div className="flex items-start justify-center gap-4">
          <DangerTag className="max-w-56" warning="Do not operate" tag="23-XV-9130" point="Suction valve" position="Closed" lock="R-114" by="Tomás Barros" date="12 Mar, 09:40" certificate="IC-2291" />
          <DangerTag className="max-w-56" warning="Do not close" tag="82-EN-9103" point="Motor breaker" position="Open, racked out" lock="R-113" by="Jonas Nyberg" date="12 Mar, 09:32" certificate="IC-2291" />
        </div>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutEnergy() {
  return (
    <LockoutTagoutSheet>
      <Panel title="Energy sources" subtitle="What has to be held back or let out before anyone opens the casing" icon={<IconAlertTriangle />}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col">
            <ListRow
              leading={
                <IconChip tone="amber" size="sm">
                  <IconBolt />
                </IconChip>
              }
              title="Electrical, 6.6 kV motor"
              meta="Breaker open, racked out and locked"
              trailing={<StatusPill tone="success">Zero energy</StatusPill>}
            />
            <ListRow
              leading={
                <IconChip tone="blue" size="sm">
                  <IconGauge />
                </IconChip>
              }
              title="Process gas in the casing"
              meta="Vent open to flare, bleeding down"
              trailing={<StatusPill tone="warning">Bleeding</StatusPill>}
            />
            <ListRow
              leading={
                <IconChip tone="teal" size="sm">
                  <IconDroplet />
                </IconChip>
              }
              title="Lube oil header"
              meta="Supply valve still open"
              trailing={<StatusPill tone="critical">Live</StatusPill>}
            />
            <ListRow
              leading={
                <IconChip tone="purple" size="sm">
                  <IconSettings />
                </IconChip>
              }
              title="Rotor run-down"
              meta="Shaft at standstill since 13:52"
              trailing={<StatusPill tone="success">Zero energy</StatusPill>}
            />
          </div>
          <Meter label="Casing pressure" value={2.4} max={20} unit="barg" decimals={1} tone="warning" target={{ value: 0.2, label: 'Safe below' }} />
        </div>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutSchematic() {
  const [selected, setSelected] = useState('p4');
  const point = LOCKOUT_TAGOUT_POINTS.find((item) => item.id === selected) ?? LOCKOUT_TAGOUT_POINTS[0];
  return (
    <LockoutTagoutSheet>
      <Grid>
        <Panel className="col-span-8" title="Isolation boundary" subtitle="Solid: process · dashed: electrical · dotted: utilities · select a point">
          <IsolationSchematic label="Isolation boundary of the recompressor" nodes={lockoutTagoutNodes(LOCKOUT_TAGOUT_POINTS)} links={LOCKOUT_TAGOUT_LINKS} selected={selected} onSelect={setSelected} height={360} />
        </Panel>
        <Panel
          className="col-span-4"
          title={point.name}
          subtitle={`Point ${point.step} of ${LOCKOUT_TAGOUT_POINTS.length}`}
          tone={STATE_TONE[point.state]}
          actions={<StatusPill tone={STATE_TONE[point.state]}>{STATE_WORD[point.state]}</StatusPill>}
          footer={<span className="text-sm text-(--kit-text-2)">{LOCKOUT_TAGOUT_STATE_TEXT[point.state]}</span>}
        >
          <dl className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-(--kit-rule) py-2.5">
              <dt className="text-sm text-(--kit-text-2)">Tag</dt>
              <dd className="text-sm font-medium">
                <TagId>{point.tag}</TagId>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-(--kit-rule) py-2.5">
              <dt className="text-sm text-(--kit-text-2)">Energy</dt>
              <dd className="text-sm font-medium">{ENERGY_WORD[point.energy]}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-(--kit-rule) py-2.5">
              <dt className="text-sm text-(--kit-text-2)">Method</dt>
              <dd className="text-right text-sm font-medium">{point.method}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-sm text-(--kit-text-2)">Lock</dt>
              <dd className="text-sm font-medium tabular-nums">{point.lock ?? 'Not applied'}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-start gap-3 rounded-(--kit-radius-sm) bg-(--kit-well) p-3">
            <IconChip tone={point.lock ? 'critical' : 'neutral'} size="sm">
              {point.lock ? <IconLock /> : <IconLockOpen />}
            </IconChip>
            <div className="min-w-0">
              <p className="text-sm font-medium">{point.lock ? 'Danger tag attached' : 'No tag yet'}</p>
              <p className="text-sm text-(--kit-text-2)">{point.lock ? `Printed for lock ${point.lock}. Reads "Do not operate".` : 'The tag is printed when the lock is applied.'}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="secondary" disabled={!point.lock} title={point.lock ? undefined : 'There is no lock on this point yet'}>
              Print tag again
            </Button>
          </div>
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutLockBox() {
  const [crew, setCrew] = useState(LOCKOUT_TAGOUT_CREW);
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Lock box LB-07"
        subtitle="Keys to the six isolation locks are inside · select a hook to sign on or off"
        icon={<IconUsers />}
        footer={<span className="text-sm text-(--kit-text-2)">The box opens only when every personal lock is off.</span>}
      >
        <LockBoard label="Lock box LB-07" people={crew} columns={2} onToggle={(id, on) => setCrew(crew.map((person) => (person.id === id ? { ...person, on } : person)))} />
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutHandover() {
  const [accepted, setAccepted] = useState(false);
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Isolation handover"
        subtitle="Day shift to night shift · 19:00"
        actions={<StatusPill tone={accepted ? 'success' : 'warning'}>{accepted ? 'Accepted' : 'Awaiting night shift'}</StatusPill>}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-sm text-(--kit-text-2)">{accepted ? 'Liv Wold now holds certificate IC-2291.' : 'The certificate stays with the day shift until it is accepted.'}</span>
            <Button size="sm" disabled={accepted} onClick={() => setAccepted(true)}>
              Accept isolation
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div data-tone="success" className="rounded-(--kit-radius-sm) border border-(--kit-rule) p-3">
              <p className="text-xs text-(--kit-text-2)">Handing over</p>
              <p className="text-base font-semibold">Ingrid Haugen</p>
              <p className="text-sm font-medium text-(--t-ink)">Signed 18:52</p>
            </div>
            <div data-tone={accepted ? 'success' : 'warning'} className="rounded-(--kit-radius-sm) border border-(--kit-rule) p-3">
              <p className="text-xs text-(--kit-text-2)">Taking over</p>
              <p className="text-base font-semibold">Liv Wold</p>
              <p className="text-sm font-medium text-(--t-ink)">{accepted ? 'Signed 19:04' : 'Not signed'}</p>
            </div>
          </div>
          <StatGroup joined columns={3} label="State of the isolation at handover">
            <Stat variant="plain" size="sm" label="Points verified" value="6 of 6" tone="success" />
            <Stat variant="plain" size="sm" label="Personal locks on" value={2} />
            <Stat variant="plain" size="sm" label="Work status" value="Paused" />
          </StatGroup>
        </div>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutTryStep() {
  const [done, setDone] = useState<number[]>([0, 1]);
  const passed = done.length === LOCKOUT_TAGOUT_TRY_STEPS.length;
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Try step"
        subtitle="Prove the machine cannot start before anyone touches it"
        icon={<IconShieldCheck />}
        actions={<StatusPill tone={passed ? 'success' : 'info'}>{passed ? 'Passed' : `${done.length} of ${LOCKOUT_TAGOUT_TRY_STEPS.length}`}</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">{passed ? 'Try step passed at 10:12, witnessed by Liv Wold.' : 'If the machine responds at any step, stop and re-check the boundary.'}</span>}
      >
        <div className="flex flex-col gap-3">
          {LOCKOUT_TAGOUT_TRY_STEPS.map((step, index) => (
            <CheckboxItem key={step}>
              <CheckboxItemControl checked={done.includes(index)} onCheckedChange={(checked) => setDone(checked === true ? [...done, index] : done.filter((item) => item !== index))} />
              <CheckboxItemLabel>{step}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </div>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutGate() {
  const [crewLocks, setCrewLocks] = useState(2);
  const conditions = workGate(LOCKOUT_TAGOUT_VERIFIED, true, 3, crewLocks);
  const open = conditions.every((condition) => condition.met);
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Ready to start work"
        subtitle="All three must hold"
        tone={open ? 'success' : 'warning'}
        actions={<StatusPill tone={open ? 'success' : 'warning'} icon={open ? <IconCircleCheck /> : <IconAlertTriangle />}>{open ? 'Safe to start' : 'Not yet'}</StatusPill>}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button size="sm" variant="secondary" onClick={() => setCrewLocks(crewLocks === 3 ? 2 : 3)}>
              {crewLocks === 3 ? 'Take one lock off' : 'Put the last lock on'}
            </Button>
            <Button size="sm" disabled={!open} title={open ? undefined : 'One worker has no lock on the box'}>
              Start work
            </Button>
          </div>
        }
      >
        <div className="flex flex-col">
          {conditions.map((condition) => (
            <ListRow
              key={condition.id}
              tone={condition.met ? 'success' : 'critical'}
              leading={
                <IconChip tone={condition.met ? 'success' : 'critical'} size="sm">
                  {condition.met ? <IconCircleCheck /> : <IconCircleX />}
                </IconChip>
              }
              title={condition.text}
              trailing={<StatusPill tone={condition.met ? 'success' : 'critical'}>{condition.met ? 'Met' : 'Missing'}</StatusPill>}
            />
          ))}
        </div>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutRemoval() {
  const [points, setPoints] = useState<IsolationPoint[]>(LOCKOUT_TAGOUT_VERIFIED.map((point) => (point.step === 6 ? { ...point, state: 'removed' } : point)));
  const ordered = removalOrder(points);
  const next = ordered.find((point) => point.state !== 'removed');
  const removed = points.filter((point) => point.state === 'removed').length;
  return (
    <LockoutTagoutSheet>
      <Panel
        title="Remove the isolations"
        subtitle="Reverse order: the last point locked comes off first"
        icon={<IconLockOpen />}
        padding="tight"
        actions={<StatusPill tone={removed === points.length ? 'success' : 'info'}>{removed} of {points.length} removed</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">{next ? `Next: ${next.name}, lock ${next.lock ?? ''}. Only the next point can be released.` : 'All locks are back in the box. The certificate can be closed.'}</span>}
      >
        <ol aria-label="Isolation points in removal order" className="flex flex-col">
          {ordered.map((point) => (
            <IsolationPointRow
              key={point.id}
              point={point}
              icon={LOCKOUT_TAGOUT_ENERGY_ICON[point.energy]}
              current={point.id === next?.id}
              action={
                point.state === 'removed' ? undefined : (
                  <Button size="sm" variant="secondary" disabled={point.id !== next?.id} onClick={() => setPoints(points.map((item) => (item.id === point.id ? { ...item, state: 'removed' } : item)))}>
                    Remove lock
                  </Button>
                )
              }
            />
          ))}
        </ol>
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutRegister() {
  return (
    <LockoutTagoutSheet>
      <Panel title="Long-term isolations" subtitle="In place for more than one shift · reviewed every 30 days" icon={<IconFileCertificate />} padding="none" actions={<StatusPill tone="critical">1 review overdue</StatusPill>}>
        <DataTable label="Long-term isolations" flush columns={LOCKOUT_TAGOUT_REGISTER_COLUMNS} rows={LOCKOUT_TAGOUT_REGISTER} rowKey={(row) => row.id} rowTone={(row) => (row.overdue ? 'critical' : undefined)} />
      </Panel>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutConsole() {
  const progress = boundaryProgress(LOCKOUT_TAGOUT_POINTS);
  return (
    <LockoutTagoutSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={4} label="Isolation IC-2291">
          <Stat variant="plain" label="Certificate" value="IC-2291" target="Recompressor 23-KA-9103" />
          <Stat variant="plain" label="Locked" value={progress.locked} unit={`of ${progress.total}`} tone="info" target="3 points still open" />
          <Stat variant="plain" label="Verified" value={progress.verified} unit={`of ${progress.total}`} tone="warning" target="Boundary not complete" />
          <Stat variant="plain" label="Casing pressure" value={2.4} decimals={1} unit="barg" tone="critical" target="Not at zero energy" />
        </StatGroup>
        <Panel className="col-span-12" title="Isolation points" subtitle="In step order" padding="none">
          <DataTable
            label="Isolation points in step order"
            flush
            columns={LOCKOUT_TAGOUT_POINT_COLUMNS}
            rows={LOCKOUT_TAGOUT_POINTS}
            rowKey={(point) => point.id}
            rowTone={(point) => (point.state === 'planned' ? undefined : STATE_TONE[point.state])}
          />
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutPoster() {
  return (
    <LockoutTagoutSheet look="poster">
      <Grid>
        <Stat className="col-span-6" size="hero" tone="pink" label="Recompressor · do not start" value="Locked" />
        <Stat className="col-span-3" size="hero" tone="blue" label="Points locked" value={3} unit="of 6" />
        <Stat className="col-span-3" size="hero" tone="amber" label="People on the job" value={2} />
        <Panel className="col-span-12" title="Who has a lock on">
          <LockBoard label="Lock box LB-07, crew" people={LOCKOUT_TAGOUT_CREW} columns={4} />
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutBlueprint() {
  return (
    <LockoutTagoutSheet look="blueprint">
      <Grid>
        <Panel className="col-span-8" title="Isolation boundary" subtitle="Drawing IC-2291-01 · rev B · not to scale">
          <IsolationSchematic label="Isolation boundary drawing" nodes={lockoutTagoutNodes(LOCKOUT_TAGOUT_POINTS)} links={LOCKOUT_TAGOUT_LINKS} height={360} />
        </Panel>
        <Panel className="col-span-4" title="Tag as issued" subtitle="Point 2 of 6">
          <div className="flex justify-center">
            <DangerTag warning="Do not operate" tag="23-XV-9130" point="Suction valve" position="Closed" lock="R-114" by="Tomás Barros" date="12 Mar, 09:40" certificate="IC-2291" />
          </div>
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutSignal() {
  return (
    <LockoutTagoutSheet look="signal">
      <Grid>
        <Stat className="col-span-6" size="hero" tone="critical" state="Not safe" stateIcon={<IconCircleX />} label="Recompressor 23-KA-9103" value="2 of 6 verified" target="Do not open the casing" />
        <Stat className="col-span-3" size="lg" tone="warning" state="Bleeding" stateIcon={<IconGauge />} label="Casing pressure" value={2.4} decimals={1} unit="barg" target="Safe below 0.2 barg" />
        <Stat className="col-span-3" size="lg" tone="success" state="Zero" stateIcon={<IconBolt />} label="Electrical" value="Racked out" target="Lock R-113, verified" />
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutEditorial() {
  return (
    <LockoutTagoutSheet look="editorial">
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="Isolation certificate IC-2291"
          title="Recompressor 23-KA-9103, isolated for bearing inspection"
          description="Issued 12 March 09:20 by Liv Wold for work order WO-104482. Six points across four energy sources. Valid until the work order is closed."
        />
        <StatGroup className="col-span-12" columns={4} label="Certificate figures">
          <Stat variant="plain" size="lg" label="Isolation points" value={6} />
          <Stat variant="plain" size="lg" label="Verified" value={2} unit="of 6" />
          <Stat variant="plain" size="lg" label="Energy sources" value={4} />
          <Stat variant="plain" size="lg" label="People on the job" value={2} />
        </StatGroup>
        <Panel className="col-span-12" title="Schedule of isolations" padding="none">
          <DataTable label="Schedule of isolations" flush columns={LOCKOUT_TAGOUT_POINT_COLUMNS.filter((column) => column.id !== 'energy')} rows={LOCKOUT_TAGOUT_POINTS} rowKey={(point) => point.id} />
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutPlanner() {
  const [points, setPoints] = useState(LOCKOUT_TAGOUT_POINTS);
  const [selected, setSelected] = useState('p3');
  const [crew, setCrew] = useState(LOCKOUT_TAGOUT_CREW.slice(0, 3));
  const progress = boundaryProgress(points);
  const locksOn = crew.filter((person) => person.on).length;
  const conditions = workGate(points, progress.complete, crew.length, locksOn);
  const open = conditions.every((condition) => condition.met);
  const advance = (id: string) => {
    setSelected(id);
    setPoints(points.map((point) => (point.id === id ? { ...point, state: advanceState(point.state), lock: point.lock ?? `R-11${point.step + 2}` } : point)));
  };
  return (
    <LockoutTagoutSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Isolate recompressor 23-KA-9103"
          description="Certificate IC-2291 · WO-104482 · drive-end bearing inspection"
          actions={
            <StatusPill tone={open ? 'success' : 'warning'} icon={open ? <IconCircleCheck /> : <IconAlertTriangle />}>
              {open ? 'Safe to start work' : `${progress.verified} of ${progress.total} verified`}
            </StatusPill>
          }
        />
        <Panel className="col-span-7" title="Boundary" subtitle="Select a point on the drawing or work it from the list">
          <IsolationSchematic label="Isolation boundary of the recompressor" nodes={lockoutTagoutNodes(points)} links={LOCKOUT_TAGOUT_LINKS} selected={selected} onSelect={setSelected} height={340} />
        </Panel>
        <Panel className="col-span-5" title="Crew locks" subtitle="Lock box LB-07" icon={<IconUsers />}>
          <LockBoard label="Lock box LB-07, crew" people={crew} columns={1} onToggle={(id, on) => setCrew(crew.map((person) => (person.id === id ? { ...person, on } : person)))} />
        </Panel>
        <Panel className="col-span-12" title="Isolation points" subtitle="In step order" padding="tight">
          <ol aria-label="Isolation points" className="flex flex-col">
            {points.map((point) => (
              <IsolationPointRow key={point.id} point={point} icon={LOCKOUT_TAGOUT_ENERGY_ICON[point.energy]} current={point.id === selected} onAdvance={advance} />
            ))}
          </ol>
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

function LockoutTagoutCertificate() {
  const progress = boundaryProgress(LOCKOUT_TAGOUT_VERIFIED);
  return (
    <LockoutTagoutSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Isolation certificate IC-2291"
          description="Recompressor 23-KA-9103 · issued 12 March 09:20 by Liv Wold"
          actions={
            <StatusPill tone="success" icon={<IconShieldCheck />}>
              Live, work in progress
            </StatusPill>
          }
        />
        <Stat className="col-span-3" label="Points verified" value={progress.verified} unit={`of ${progress.total}`} icon={<IconShieldCheck />} tone="green" target="Boundary complete 10:05" />
        <Stat className="col-span-3" label="Try step" value="Passed" icon={<IconCircleCheck />} tone="teal" target="10:12, witnessed by Liv Wold" />
        <Stat className="col-span-3" label="Personal locks on" value={2} icon={<IconLock />} tone="blue" target="Tomás Barros, Jonas Nyberg" />
        <Stat className="col-span-3" label="In place for" value={4} unit="h 40 min" icon={<IconFileCertificate />} tone="purple" target="Review due 19 March" />
        <Panel className="col-span-8" title="Schedule of isolations" subtitle="All points locked, tagged and verified" padding="none">
          <DataTable label="Schedule of isolations" flush columns={LOCKOUT_TAGOUT_POINT_COLUMNS.filter((column) => column.id !== 'energy')} rows={LOCKOUT_TAGOUT_VERIFIED} rowKey={(point) => point.id} />
        </Panel>
        <Panel className="col-span-4" title="Conflicts with other permits" subtitle="Work that touches the same boundary" tone="warning">
          <div className="flex flex-col">
            <ListRow tone="warning" title="Hot work, cooler deck" meta="Permit PTW-5521 · shares the flare vent 23-HV-9138" trailing={<StatusPill tone="warning">Shared point</StatusPill>} />
            <ListRow tone="neutral" title="Scaffolding, compressor hall" meta="Permit PTW-5507 · access only" trailing={<StatusPill>No conflict</StatusPill>} />
            <ListRow tone="critical" title="Lube oil flushing" meta="Permit PTW-5530 · needs 41-HV-9171 open" trailing={<StatusPill tone="critical">Blocked</StatusPill>} />
          </div>
        </Panel>
      </Grid>
    </LockoutTagoutSheet>
  );
}

export default definePage({
  id: 'lockout-tagout',
  title: 'Lock-out and tag-out',
  summary:
    'Isolating equipment so it cannot hurt the people working on it: the points in step order, tags, the boundary on a drawing, the lock box, the try step, the gate before work starts and taking it all off again.',
  guidance: {
    use: [
      'Keep the points in sequence order; removal runs in reverse.',
      'Say each state in words: isolated is not locked, locked is not verified.',
      'Block the start of work until boundary, try step and crew locks all hold.',
      'Show who has a personal lock on, by name.',
    ],
    avoid: [
      'Green for a point that is only isolated.',
      'A progress percentage in place of the count of verified points.',
      'Letting a point be released out of order.',
      'Closing a certificate while a personal lock is still on.',
    ],
  },
  source,
  sections: [
    {
      id: 'points-and-tags',
      title: 'Points, tags and energy',
      description: 'The isolation point, its states and what hangs on it.',
      specimens: [
        {
          id: 'LockoutTagoutPointList',
          title: 'Isolation list in step order',
          note: 'Pick it as the working list: each point with its energy, method, state, lock and next action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/lockout-tagout/IsolationPointRow.tsx', 'kit/lockout-tagout/isolation.ts', 'kit/Panel.tsx'],
          Component: LockoutTagoutPointList,
        },
        {
          id: 'LockoutTagoutStates',
          title: 'The five states',
          note: 'Pick it as the legend: what each state means, so isolated is never read as safe.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/IconChip.tsx', 'kit/lockout-tagout/isolation.ts'],
          Component: LockoutTagoutStates,
        },
        {
          id: 'LockoutTagoutTags',
          title: 'Danger tags',
          note: 'Pick the tag to preview or print what hangs on a point: the warning, the position and who locked it.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/lockout-tagout/DangerTag.tsx', 'kit/Panel.tsx'],
          Component: LockoutTagoutTags,
        },
        {
          id: 'LockoutTagoutEnergy',
          title: 'Energy sources',
          note: 'Pick it before the boundary is drawn: every energy that has to be held back, and what is still live.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx', 'kit/Meter.tsx'],
          Component: LockoutTagoutEnergy,
        },
      ],
    },
    {
      id: 'on-the-schematic',
      title: 'On the schematic',
      description: 'The boundary where it physically is.',
      specimens: [
        {
          id: 'LockoutTagoutSchematic',
          title: 'Boundary with a selected point',
          note: 'Pick it when people need to see that the boundary closes: every point on the lines, with detail beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/lockout-tagout/IsolationSchematic.tsx', 'kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: LockoutTagoutSchematic,
        },
      ],
    },
    {
      id: 'locks-and-crew',
      title: 'Locks, crew and handover',
      description: 'Who is protected by the isolation.',
      specimens: [
        {
          id: 'LockoutTagoutLockBox',
          title: 'Lock box board',
          note: 'Pick it for crew sign-on: one hook per worker, lock on or off, and the count that holds the box shut.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/lockout-tagout/LockBoard.tsx', 'kit/Panel.tsx'],
          Component: LockoutTagoutLockBox,
        },
        {
          id: 'LockoutTagoutHandover',
          title: 'Isolation handover',
          note: 'Pick it at shift change: the isolation passes only when the incoming shift accepts it.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: LockoutTagoutHandover,
        },
      ],
    },
    {
      id: 'verification-and-removal',
      title: 'Verification and removal',
      description: 'Proving it holds, and taking it off.',
      specimens: [
        {
          id: 'LockoutTagoutTryStep',
          title: 'Try step checklist',
          note: 'Pick it between locking and working: a short list ticked off while someone tries to start the machine.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: LockoutTagoutTryStep,
        },
        {
          id: 'LockoutTagoutGate',
          title: 'Completeness gate',
          note: 'Pick it in front of the start button: the conditions, which one is missing and why the button is off.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/lockout-tagout/isolation.ts', 'kit/Panel.tsx'],
          Component: LockoutTagoutGate,
        },
        {
          id: 'LockoutTagoutRemoval',
          title: 'De-isolation sequence',
          note: 'Pick it after the job: points in reverse order, and only the next one can be released.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/lockout-tagout/IsolationPointRow.tsx', 'kit/lockout-tagout/isolation.ts'],
          Component: LockoutTagoutRemoval,
        },
        {
          id: 'LockoutTagoutRegister',
          title: 'Long-term isolation register',
          note: 'Pick it for the weekly review: isolations left in place, how long, who owns them and which review is overdue.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: LockoutTagoutRegister,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same isolation as a console table, a poster by the machine, a drawing, wall tiles and a certificate.',
      specimens: [
        {
          id: 'LockoutTagoutConsole',
          title: 'Console isolation table',
          note: 'Pick it in the control room: the certificate in a strip and every point in a dense table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: LockoutTagoutConsole,
        },
        {
          id: 'LockoutTagoutPoster',
          title: 'Poster at the machine',
          note: 'Pick it for a screen or print-out at the equipment: locked out, by how many locks, and whose.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/lockout-tagout/LockBoard.tsx', 'looks/LookScope.tsx'],
          Component: LockoutTagoutPoster,
        },
        {
          id: 'LockoutTagoutBlueprint',
          title: 'Blueprint boundary drawing',
          note: 'Pick it for the drawing attached to the certificate: outlined equipment, square markers and the tag as issued.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/lockout-tagout/IsolationSchematic.tsx', 'kit/lockout-tagout/DangerTag.tsx', 'looks/LookScope.tsx'],
          Component: LockoutTagoutBlueprint,
        },
        {
          id: 'LockoutTagoutSignal',
          title: 'Signal safe-to-work tiles',
          note: 'Pick it for a wall screen in the workshop: one answer, safe or not, with the energies beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: LockoutTagoutSignal,
        },
        {
          id: 'LockoutTagoutEditorial',
          title: 'Editorial certificate',
          note: 'Pick it for the certificate as a document: a title that says what is isolated and why, then the schedule.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/SectionHeader.tsx', 'kit/StatGroup.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: LockoutTagoutEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'LockoutTagoutPlanner',
          title: 'Isolation planner',
          note: 'Pick it as the working screen: the drawing, the crew locks and the list move together as points are worked.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/lockout-tagout/IsolationSchematic.tsx', 'kit/lockout-tagout/LockBoard.tsx', 'kit/lockout-tagout/IsolationPointRow.tsx', 'kit/lockout-tagout/isolation.ts'],
          Component: LockoutTagoutPlanner,
        },
        {
          id: 'LockoutTagoutCertificate',
          title: 'Certificate overview',
          note: 'Pick it for the permit office: the live certificate, its schedule and the permits it collides with.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/DataTable.tsx', 'kit/ListRow.tsx', 'kit/SectionHeader.tsx'],
          Component: LockoutTagoutCertificate,
        },
      ],
    },
  ],
});
