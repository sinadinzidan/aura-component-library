import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { IconArrowBackUp } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Breaker } from '../../../library/industrial/diagrams/Breaker';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import { DiagramHotspot } from '../../../library/industrial/diagrams/DiagramHotspot';
import { EquipmentSymbol } from '../../../library/industrial/diagrams/EquipmentSymbol';
import { InstrumentBubble } from '../../../library/industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { ValveSymbol } from '../../../library/industrial/diagrams/ValveSymbol';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DangerTag } from '../../../library/industrial/safety/DangerTag';
import {
  ENERGY_LABEL,
  ISOLATION_STATES,
  applicationOrder,
  countIsolationStates,
  deIsolationOrder,
  isolationStatus,
  releaseGate,
} from '../../../library/industrial/safety/isolationOrder';
import type { EnergyType, IsolationState } from '../../../library/industrial/safety/isolationOrder';
import { IsolationPointRow } from '../../../library/industrial/safety/IsolationPointRow';
import { LockBoard } from '../../../library/industrial/safety/LockBoard';
import type { LockBoardPerson } from '../../../library/industrial/safety/LockBoard';
import { TONE_MARK_FILL } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ConditionList } from '../../../library/industrial/workflows/ConditionList';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { definePage } from '../../types';

import source from './lockout-tagout.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type Point = {
  id: string;
  step: number;
  tag: string;
  description: string;
  device: string;
  requiredPosition: string;
  energy: EnergyType;
  lock: string;
  tagNo: string;
};

const POINTS: readonly Point[] = [
  { id: 'xv9105', step: 1, tag: '23-XV-9105', description: 'Suction shutdown valve', device: 'Valve', requiredPosition: 'Closed', energy: 'pressure', lock: 'L-0430', tagNo: 'DT-1181' },
  { id: 'hv9106', step: 2, tag: '23-HV-9106', description: 'Suction block valve', device: 'Valve', requiredPosition: 'Closed', energy: 'pressure', lock: 'L-0431', tagNo: 'DT-1182' },
  { id: 'hv9112', step: 3, tag: '23-HV-9112', description: 'Discharge block valve', device: 'Valve', requiredPosition: 'Closed', energy: 'pressure', lock: 'L-0432', tagNo: 'DT-1183' },
  { id: 'xv9113', step: 4, tag: '23-XV-9113', description: 'Recycle valve', device: 'Valve', requiredPosition: 'Closed', energy: 'pressure', lock: 'L-0433', tagNo: 'DT-1184' },
  { id: 'sp9115', step: 5, tag: '23-SP-9115', description: 'Spectacle blind, suction', device: 'Spectacle blind', requiredPosition: 'Closed side in line', energy: 'pressure', lock: 'L-0434', tagNo: 'DT-1185' },
  { id: 'hv9120', step: 6, tag: '23-HV-9120', description: 'Vent to flare', device: 'Valve', requiredPosition: 'Open', energy: 'pressure', lock: 'L-0435', tagNo: 'DT-1186' },
  { id: 'hv9131', step: 7, tag: '23-HV-9131', description: 'Seal gas supply', device: 'Valve', requiredPosition: 'Closed', energy: 'stored', lock: 'L-0436', tagNo: 'DT-1187' },
  { id: 'qb9101', step: 8, tag: '23-QB-9101', description: 'Lube oil pump breaker', device: 'Breaker', requiredPosition: 'Racked out', energy: 'electrical', lock: 'L-0437', tagNo: 'DT-1188' },
];

type States = Record<string, IsolationState>;

function allIn(state: IsolationState): States {
  const states: States = {};
  for (const point of POINTS) states[point.id] = state;
  return states;
}

const ALL_PLANNED: States = allIn('planned');
const MIXED: States = { ...ALL_PLANNED, xv9105: 'verified', hv9106: 'verified', hv9112: 'verified', xv9113: 'applied', sp9115: 'planned' };

const REMOVED: IsolationState = 'removed';
const VERIFIED: IsolationState = 'verified';

const stateOf = (states: States, id: string): IsolationState => states[id] ?? 'planned';

const ENERGY_SOURCES: readonly { type: EnergyType; source: string; hazard: string; control: string; check: string }[] = [
  { type: 'electrical', source: 'Lube oil pump and heater supply', hazard: '400 V, motor can start from the control room', control: 'Breaker 23-QB-9101 racked out, locked and tagged', check: 'Voltage tester on the load side' },
  { type: 'pressure', source: 'Process gas in the compressor and piping', hazard: '12 to 49 barg of hydrocarbon gas', control: 'Double block, spectacle blind and vent to flare', check: 'Gauge 23-PI-9107 reads 0 barg, gas test 0 % LEL' },
  { type: 'thermal', source: 'Compressor casing and discharge line', hazard: 'Surface up to 141 °C', control: 'Cool down to below 50 °C before work', check: 'Surface thermometer at the casing' },
  { type: 'stored', source: 'Seal gas accumulator and rotor run-down', hazard: 'Gas at 52 barg, rotor turns for about 8 min', control: 'Seal gas isolated and vented, rotor stopped', check: 'Rotor confirmed stopped, accumulator at 0 barg' },
];

const CREW_PEOPLE: readonly LockBoardPerson[] = [
  { id: 'tb', name: 'Tomás Barros', role: 'Mechanical technician', lock: 'P-114', lockOn: true, at: '07:12' },
  { id: 'ak', name: 'Aisha Khan', role: 'Rotating equipment engineer', lock: 'P-131', lockOn: true, at: '07:15' },
  { id: 'jn', name: 'Jonas Nyberg', role: 'Instrument technician', lock: 'P-122', lockOn: false },
];
const CREW = CREW_PEOPLE;

const LONG_TERM = [
  { id: 'LT-031', point: '23-SP-9150', what: 'Blind on the flare knock-out drum inlet', since: '4 Aug 2025', reason: 'Drum out of service for repair', owner: 'Magnus Solberg', review: 'Review due 4 Apr', overdue: false },
  { id: 'LT-029', point: '40-HV-4012', what: 'Block valve on cooling water line to spare cooler', since: '11 Jun 2025', reason: 'Cooler removed for replacement', owner: 'Liv Wold', review: 'Review overdue 21 d', overdue: true },
  { id: 'LT-024', point: '27-QB-2001B', what: 'Export pump B motor breaker', since: '2 Jan 2026', reason: 'Motor rewinding at the workshop', owner: 'Aisha Khan', review: 'Review due 30 Mar', overdue: false },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-base-foreground">{children}</dd>
    </div>
  );
}

function rowFor(point: Point, state: IsolationState, actions?: ReactNode, step?: number) {
  const applied = state === 'applied' || state === 'verified' || state === 'removed';
  return (
    <IsolationPointRow
      step={step ?? point.step}
      tag={point.tag}
      description={point.description}
      device={point.device}
      requiredPosition={point.requiredPosition}
      energy={point.energy}
      lock={applied ? point.lock : undefined}
      tagNo={applied ? point.tagNo : undefined}
      state={state}
      appliedBy={applied ? 'Ingrid Haugen' : undefined}
      verifiedBy={state === 'verified' || state === 'removed' ? 'Liv Wold' : undefined}
      actions={actions}
    />
  );
}

const MARKER_STATE_CLASS: Record<IsolationState, string> = {
  planned: 'fill-base-background stroke-emphasized',
  applied: 'fill-base-background stroke-chart-warning-450',
  verified: `${TONE_MARK_FILL.success} stroke-chart-success-450`,
  removed: 'fill-muted-background stroke-emphasized',
};

function LotoPatternMarker({ cx, cy, n, state }: { cx: number; cy: number; n: number; state: IsolationState }) {
  const filled = state === 'verified';
  return (
    <g aria-hidden="true" data-state={state}>
      {state === 'applied' ? (
        <rect x={cx - 9} y={cy - 9} width={18} height={18} strokeWidth={2} vectorEffect="non-scaling-stroke" className={MARKER_STATE_CLASS[state]} />
      ) : (
        <circle cx={cx} cy={cy} r={9} strokeWidth={2} strokeDasharray={state === 'planned' ? '3 2' : undefined} vectorEffect="non-scaling-stroke" className={MARKER_STATE_CLASS[state]} />
      )}
      <text x={cx} y={cy + 3.5} fontSize={10} fontWeight={600} textAnchor="middle" className={filled ? 'fill-base-background' : 'fill-base-foreground'}>
        {n}
      </text>
    </g>
  );
}

function LotoPatternBlind({ cx, cy, closed, label }: { cx: number; cy: number; closed: boolean; label: string }) {
  return (
    <g role="img" aria-label={`${label}, ${closed ? 'closed side in line' : 'open side in line'}`}>
      <path d={`M ${cx - 7} ${cy} H ${cx + 7}`} stroke="currentColor" strokeWidth={1.5} />
      <circle cx={cx - 12} cy={cy} r={6} stroke="currentColor" strokeWidth={1.5} fill={closed ? 'currentColor' : 'none'} />
      <circle cx={cx + 12} cy={cy} r={6} stroke="currentColor" strokeWidth={1.5} fill={closed ? 'none' : 'currentColor'} />
    </g>
  );
}

type SchematicProps = { states: States; selectedId?: string; onSelect?: (id: string) => void };

const VALVE_AT: Record<string, { x: number; y: number }> = {
  xv9105: { x: 90, y: 150 },
  hv9106: { x: 170, y: 150 },
  hv9112: { x: 520, y: 150 },
  xv9113: { x: 440, y: 70 },
  hv9120: { x: 450, y: 205 },
  hv9131: { x: 360, y: 225 },
};

function LotoPatternSchematicDrawing({ states, selectedId, onSelect }: SchematicProps) {
  const interactive = onSelect !== undefined;
  const positionOf = (point: Point) => {
    const applied = stateOf(states, point.id) === 'applied' || stateOf(states, point.id) === 'verified';
    const wanted = point.requiredPosition === 'Open' ? 'open' : 'closed';
    if (!applied) return point.requiredPosition === 'Open' ? 'closed' : 'open';
    return wanted;
  };
  const marker = (point: Point, x: number, y: number, labelDy: number) => {
    const state = stateOf(states, point.id);
    const content = (
      <>
        <LotoPatternMarker cx={x} cy={y} n={point.step} state={state} />
        <text x={x} y={y + labelDy} fontSize={9} textAnchor="middle" className="fill-muted-foreground font-mono">
          {point.tag.slice(3)}
        </text>
      </>
    );
    if (!interactive) return <g key={point.id}>{content}</g>;
    return (
      <DiagramHotspot key={point.id} x={x - 30} y={Math.min(y, y + labelDy) - 16} width={60} height={Math.abs(labelDy) + 30} label={`Isolation point ${point.step}, ${point.tag}, ${isolationStatus(state).label}`} selected={selectedId === point.id} onSelect={() => onSelect(point.id)}>
        {content}
      </DiagramHotspot>
    );
  };
  const byId = (id: string): Point => POINTS.find((point) => point.id === id) ?? POINTS[0];
  const breaker = byId('qb9101');
  const blind = byId('sp9115');
  const breakerState = stateOf(states, breaker.id);
  const blindClosed = stateOf(states, blind.id) === 'applied' || stateOf(states, blind.id) === 'verified';
  return (
    <DiagramCanvas
      interactive={interactive}
      label="Piping schematic of the 1st stage compressor 23-KA-9101 with eight numbered isolation points: suction and discharge valves, recycle valve, spectacle blind, vent, seal gas supply and the lube oil pump breaker"
      width={720}
      height={300}
      className="w-full"
    >
      <rect x={135} y={34} width={440} height={250} rx={10} stroke="currentColor" strokeWidth={1} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
      <text x={147} y={52} fontSize={10} className="fill-muted-foreground">
        Isolation boundary
      </text>
      <PipeLine points={[{ x: 20, y: 150 }, { x: 328, y: 150 }]} weight="heavy" flow="forward" arrows={1} />
      <PipeLine points={[{ x: 392, y: 150 }, { x: 700, y: 150 }]} weight="heavy" flow="forward" arrows={1} />
      <PipeLine points={[{ x: 590, y: 150 }, { x: 590, y: 70 }, { x: 290, y: 70 }, { x: 290, y: 150 }]} weight="normal" />
      <PipeLine points={[{ x: 450, y: 150 }, { x: 450, y: 262 }]} weight="normal" />
      <PipeLine points={[{ x: 360, y: 184 }, { x: 360, y: 262 }]} weight="light" />
      <text x={450} y={278} fontSize={9} textAnchor="middle" className="fill-muted-foreground">
        To flare
      </text>
      <text x={360} y={278} fontSize={9} textAnchor="middle" className="fill-muted-foreground">
        Seal gas
      </text>
      <text x={20} y={138} fontSize={9} className="fill-muted-foreground">
        Suction header
      </text>
      <text x={700} y={138} fontSize={9} textAnchor="end" className="fill-muted-foreground">
        Discharge header
      </text>
      <EquipmentSymbol kind="compressor" label="1st stage compressor 23-KA-9101" size={64} cx={360} cy={150} fill="soft" />
      <text x={360} y={122} fontSize={10} textAnchor="middle" className="fill-base-foreground font-medium">
        23-KA-9101
      </text>
      <InstrumentBubble letters="PI" loop="9107" size={26} cx={320} cy={104} />
      <PipeLine points={[{ x: 320, y: 117 }, { x: 320, y: 150 }]} weight="light" dashed />
      {Object.entries(VALVE_AT).map(([id, at]) => {
        const point = byId(id);
        return <ValveSymbol key={id} type={id === 'xv9105' || id === 'xv9113' ? 'shutdown' : 'gate'} position={positionOf(point)} label={point.tag} size={28} cx={at.x} cy={at.y} />;
      })}
      <LotoPatternBlind cx={240} cy={150} closed={blindClosed} label="Spectacle blind 23-SP-9115" />
      <path d="M 40 250 H 230" stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <Breaker state={breakerState === 'applied' || breakerState === 'verified' ? 'open' : 'closed'} label="Lube oil pump breaker 23-QB-9101" orientation="horizontal" size={28} cx={120} cy={250} />
      <text x={40} y={236} fontSize={9} className="fill-muted-foreground">
        Lube oil pump 23-PA-9111
      </text>
      {marker(byId('xv9105'), 90, 112, -14)}
      {marker(byId('hv9106'), 170, 112, -14)}
      {marker(byId('sp9115'), 240, 112, -14)}
      {marker(byId('hv9112'), 520, 112, -14)}
      {marker(byId('xv9113'), 440, 32, -14)}
      {marker(byId('hv9120'), 490, 205, -14)}
      {marker(byId('hv9131'), 400, 225, -14)}
      {marker(byId('qb9101'), 120, 214, -14)}
      <path d="M 90 126 V 134 M 170 126 V 134 M 240 126 V 140 M 520 126 V 134 M 440 44 V 56" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
      <g aria-hidden="true">
        <path d="M 480 205 H 468" stroke="currentColor" strokeWidth={1} opacity={0.5} />
        <path d="M 390 225 H 376" stroke="currentColor" strokeWidth={1} opacity={0.5} />
        <path d="M 120 223 V 236" stroke="currentColor" strokeWidth={1} opacity={0.5} />
      </g>
    </DiagramCanvas>
  );
}

function SchematicKey() {
  return (
    <ul aria-label="Marker key" className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {ISOLATION_STATES.filter((state) => state !== 'removed').map((state) => (
        <li key={state}>
          <StatusIndicator size="sm" {...isolationStatus(state)} />
        </li>
      ))}
      <li className="text-xs text-muted-foreground">Numbers follow the order of application. Valves are drawn in the position they are left in.</li>
    </ul>
  );
}

function LotoPatternPointRow() {
  return (
    <Card role="group" aria-label="Isolation point 2" className="w-full min-w-0">
      {rowFor(POINTS[1], 'verified')}
    </Card>
  );
}

function LotoPatternPointStates() {
  const samples: [Point, IsolationState][] = [
    [POINTS[0], 'planned'],
    [POINTS[1], 'applied'],
    [POINTS[2], 'verified'],
    [POINTS[3], 'removed'],
  ];
  return (
    <Panel title="Isolation point states" meta="One point in each state">
      <ul className="flex flex-col gap-3">
        {samples.map(([point, state]) => (
          <li key={state}>{rowFor(point, state)}</li>
        ))}
      </ul>
    </Panel>
  );
}

function LotoPatternStatesLegend() {
  const meaning: Record<IsolationState, string> = {
    planned: 'On the plan. Nothing has been done at the equipment.',
    applied: 'Position set, lock and tag on. Not counted until a second person checks it.',
    verified: 'A second person checked the position, lock and tag at the equipment.',
    removed: 'Lock and tag taken off in the removal sequence. The point is back in service.',
  };
  return (
    <Panel title="Isolation states">
      <dl className="flex flex-col gap-3">
        {ISOLATION_STATES.map((state) => (
          <div key={state} className="grid grid-cols-[10rem_minmax(0,1fr)] items-start gap-x-4">
            <dt>
              <StatusIndicator size="sm" {...isolationStatus(state)} />
            </dt>
            <dd className="text-sm text-medium-foreground">{meaning[state]}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function LotoPatternDangerTag() {
  return (
    <DangerTag tagNo="DT-1182" point="Suction block valve" pointTag="23-HV-9106" position="Closed" reason="Dry gas seal replacement, IC-2304" lockNo="L-0431" placedBy="Ingrid Haugen" placedAt="12 Mar 2026, 06:40" />
  );
}

function LotoPatternTagPair() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      <DangerTag tagNo="DT-1186" point="Vent to flare" pointTag="23-HV-9120" position="Open" reason="Keeps the casing at 0 barg, IC-2304" lockNo="L-0435" placedBy="Ingrid Haugen" placedAt="12 Mar 2026, 06:52" instruction="Do not close" heading="Danger" className="w-52" />
      <DangerTag tagNo="DT-1188" point="Lube oil pump breaker" pointTag="23-QB-9101" position="Racked out" reason="Prevents start while the seal is open" placedBy="Ingrid Haugen" placedAt="12 Mar 2026, 06:58" className="w-52" />
    </div>
  );
}

function LotoPatternEnergySources() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Energy sources and how each is controlled" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Energy
            </th>
            <th scope="col" className={TH}>
              Source and hazard
            </th>
            <th scope="col" className={TH}>
              Control
            </th>
            <th scope="col" className={TH}>
              How it is proven
            </th>
          </tr>
        </thead>
        <tbody>
          {ENERGY_SOURCES.map((row) => (
            <tr key={row.type} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-medium whitespace-nowrap text-base-foreground`}>
                {ENERGY_LABEL[row.type]}
              </th>
              <td className={`${TD} text-base-foreground`}>
                {row.source}
                <span className="block text-xs text-muted-foreground">{row.hazard}</span>
              </td>
              <td className={`${TD} text-base-foreground`}>{row.control}</td>
              <td className={`${TD} text-medium-foreground`}>{row.check}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LotoPatternIsolationList() {
  const ordered = applicationOrder(POINTS);
  const counts = countIsolationStates(ordered.map((point) => ({ state: stateOf(MIXED, point.id) })));
  return (
    <Panel title="Isolation list" meta={`${counts.verified} of ${ordered.length} verified`}>
      <ol aria-label="Isolation points in the order they are applied" className="flex flex-col gap-3">
        {ordered.map((point) => (
          <li key={point.id}>{rowFor(point, stateOf(MIXED, point.id))}</li>
        ))}
      </ol>
    </Panel>
  );
}

function LotoPatternBoundary() {
  return (
    <Card role="group" aria-label="Boundary drawing summary" className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Boundary summary</h3>
        <span className="text-xs text-muted-foreground">
          P&amp;ID <span className="font-mono">NK-23-PID-0102</span> rev C
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <Fact label="Inside the boundary">1st stage compressor 23-KA-9101, dry gas seal system and the recycle line to the suction side</Fact>
        </div>
        <Fact label="Boundary points">
          <span className="tabular-nums">8 isolation points</span>
        </Fact>
        <Fact label="Isolation type">Double block with a spectacle blind and bleed to flare</Fact>
        <Fact label="Drains and vents">23-HV-9120 to flare, kept open</Fact>
        <Fact label="Neighbouring work">Interstage cooler 23-HA-9114 stays in service</Fact>
      </dl>
    </Card>
  );
}

function LotoPatternSchematic() {
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Isolation points on the schematic</h3>
        <span className="font-mono text-xs text-muted-foreground">IC-2304</span>
      </div>
      <LotoPatternSchematicDrawing states={MIXED} />
      <SchematicKey />
    </Card>
  );
}

function LotoPatternSchematicSelect() {
  const [selectedId, setSelectedId] = useState('hv9112');
  const [states, setStates] = useState<States>(MIXED);
  const point = POINTS.find((candidate) => candidate.id === selectedId) ?? POINTS[0];
  const state = stateOf(states, point.id);
  const next: IsolationState | null = state === 'planned' ? 'applied' : state === 'applied' ? 'verified' : null;
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Select a point on the schematic</h3>
        <span className="text-xs text-muted-foreground">Arrow to a point, Enter to select</span>
      </div>
      <LotoPatternSchematicDrawing states={states} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="border-t border-default pt-3" role="status">
        {rowFor(
          point,
          state,
          next ? (
            <Button size="sm" variant="secondary" onClick={() => setStates((current) => ({ ...current, [point.id]: next }))}>
              {next === 'applied' ? 'Apply point' : 'Verify point'}
            </Button>
          ) : undefined
        )}
      </div>
    </Card>
  );
}

function LotoPatternLockBoard() {
  return (
    <Card className="w-full min-w-0">
      <LockBoard boxId="LB-07" keysInside={8} people={CREW_PEOPLE} />
    </Card>
  );
}

function LotoPatternLockBoardLive() {
  const [people, setPeople] = useState<readonly LockBoardPerson[]>(CREW_PEOPLE.map((person) => ({ ...person, lockOn: true, at: '07:15' })));
  return (
    <Card className="w-full min-w-0">
      <LockBoard boxId="LB-07" keysInside={8} people={people} onToggle={(id) => setPeople((current) => current.map((person) => (person.id === id ? { ...person, lockOn: !person.lockOn, at: person.lockOn ? '16:30' : '07:15' } : person)))} />
    </Card>
  );
}

function LotoPatternGroupLockout() {
  const [onSite, setOnSite] = useState<readonly string[]>(['tb', 'ak']);
  const [offSite, setOffSite] = useState<readonly string[]>([]);
  const allOn = CREW.every((person) => onSite.includes(person.id));
  const allOff = CREW.every((person) => offSite.includes(person.id));
  return (
    <Panel title="Group lock-out" meta={<span className="font-mono">LB-07 · PTW-26-0426</span>}>
      <table aria-label="Crew sign-on and sign-off" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Crew member
            </th>
            <th scope="col" className={TH}>
              Sign-on
            </th>
            <th scope="col" className={`${TH} pr-0`}>
              Sign-off
            </th>
          </tr>
        </thead>
        <tbody>
          {CREW.map((person) => {
            const on = onSite.includes(person.id);
            const off = offSite.includes(person.id);
            return (
              <tr key={person.id} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {person.name}
                  <span className="block text-xs text-muted-foreground">
                    Lock <span className="font-mono">{person.lock}</span>
                  </span>
                </th>
                <td className={TD}>
                  {on ? (
                    <StatusIndicator size="sm" tone="success" label="On site" />
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setOnSite((current) => [...current, person.id])}>
                      Sign on {person.name.split(' ')[0]}
                    </Button>
                  )}
                </td>
                <td className={`${TD} pr-0`}>
                  {off ? (
                    <StatusIndicator size="sm" tone="neutral" shape="square" label="Signed off" />
                  ) : (
                    <Button size="sm" variant="ghost" disabled={!on} onClick={() => setOffSite((current) => [...current, person.id])}>
                      Sign off {person.name.split(' ')[0]}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p role="status" className="text-xs text-muted-foreground">
        {allOff ? 'Everyone has signed off. The lock box can be opened.' : allOn ? 'All crew members are signed on. Work can start.' : `${CREW.length - onSite.length} crew ${CREW.length - onSite.length === 1 ? 'member has' : 'members have'} not signed on. They may not enter the work site.`}
      </p>
    </Panel>
  );
}

const TRY_ITEMS = [
  { id: 'start', label: 'Local start of the lube oil pump', description: 'Attempted at the starter. The pump does not start.' },
  { id: 'gauge', label: 'Pressure gauge 23-PI-9107 reads zero', description: 'Read at the gauge, not on the screen.' },
  { id: 'vent', label: 'Vent 23-HV-9120 open, no flow at the flare line', description: 'Checked by sound and the flow indicator.' },
  { id: 'gas', label: 'Gas test at the seal housing', description: 'Reads 0 % LEL on the portable detector.' },
];

function LotoPatternTryStep() {
  const [done, setDone] = useState<readonly string[]>(['start', 'gauge']);
  const remaining = TRY_ITEMS.length - done.length;
  return (
    <Panel title="Verification: try step" meta={`${done.length} of ${TRY_ITEMS.length} proven`}>
      <CheckboxGroup aria-label="Prove the equipment is dead" className="gap-3">
        {TRY_ITEMS.map((item) => (
          <CheckboxItem key={item.id}>
            <CheckboxItemControl checked={done.includes(item.id)} onCheckedChange={(checked) => setDone((current) => (checked ? [...current, item.id] : current.filter((id) => id !== item.id)))} />
            <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{item.description}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <span role="status" className="border-t border-default pt-3 text-xs text-muted-foreground">
        {remaining === 0 ? 'The equipment is proven dead.' : `${remaining} ${remaining === 1 ? 'test' : 'tests'} still to do before the equipment can be called dead.`}
      </span>
    </Panel>
  );
}

function LotoPatternDeisolation() {
  const verified: IsolationState = 'verified';
  const order = deIsolationOrder(POINTS.map((point) => ({ ...point, state: verified })));
  return (
    <Panel title="De-isolation sequence" meta="Reverse of application">
      <ol aria-label="Isolation points in the order they are removed" className="flex flex-col gap-3">
        {order.map((point) => (
          <li key={point.id}>{rowFor(point, 'verified', undefined, point.removeStep)}</li>
        ))}
      </ol>
    </Panel>
  );
}

function LotoPatternDeisolationLive() {
  const [removed, setRemoved] = useState<readonly string[]>(['qb9101', 'hv9131']);
  const order = deIsolationOrder(POINTS.map((point) => ({ ...point, state: removed.includes(point.id) ? REMOVED : VERIFIED })));
  const next = order[0];
  return (
    <Panel title="Remove the isolations" meta={`${removed.length} of ${POINTS.length} removed`}>
      {next ? (
        <>
          <div className="flex flex-col gap-3">
            {rowFor(
              next,
              'verified',
              <Button size="sm" onClick={() => setRemoved((current) => [...current, next.id])}>
                Remove point
              </Button>,
              next.removeStep
            )}
          </div>
          <p role="status" className="border-t border-default pt-3 text-xs text-muted-foreground">
            {order.length - 1 === 0 ? 'This is the last point.' : `${order.length - 1} more after this one, in reverse order. The next point is only offered when this one is removed.`}
          </p>
        </>
      ) : (
        <p role="status" className="text-sm text-base-foreground">
          All isolations are removed. Close the certificate.
        </p>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" disabled={removed.length === 0} onClick={() => setRemoved((current) => current.slice(0, -1))}>
          <IconArrowBackUp aria-hidden="true" />
          Undo last removal
        </Button>
      </div>
    </Panel>
  );
}

function LotoPatternConflicts() {
  return (
    <Panel title="Conflicts with other permits">
      <div className="w-full">
        <Alert variant="warning">
          <AlertTitle>2 open permits touch this isolation</AlertTitle>
          <AlertDescription>Resolve both before the isolation is released for work.</AlertDescription>
        </Alert>
      </div>
      <ul className="flex flex-col gap-3">
        <li className="flex flex-col gap-0.5">
          <span className="text-sm text-base-foreground">
            <span className="font-mono text-xs">PTW-26-0415</span> Vibration survey, 1st stage compressor
          </span>
          <span className="text-xs text-muted-foreground">Work at height on the same machine, 13 Mar. Survey needs the compressor running, so it cannot overlap with IC-2304.</span>
        </li>
        <li className="flex flex-col gap-0.5">
          <span className="text-sm text-base-foreground">
            <span className="font-mono text-xs">PTW-26-0418</span> Weld repair on interstage cooler drain
          </span>
          <span className="text-xs text-muted-foreground">Hot work 15 m from vent 23-HV-9120. Gas from the vent must not reach the work site.</span>
        </li>
      </ul>
    </Panel>
  );
}

function LotoPatternLongTerm() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Long-term isolations" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Register no.
            </th>
            <th scope="col" className={TH}>
              Isolation
            </th>
            <th scope="col" className={TH}>
              In place since
            </th>
            <th scope="col" className={TH}>
              Reason
            </th>
            <th scope="col" className={TH}>
              Owner
            </th>
            <th scope="col" className={TH}>
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {LONG_TERM.map((row) => (
            <tr key={row.id} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
                {row.id}
              </th>
              <td className={`${TD} text-base-foreground`}>
                {row.what}
                <span className="block font-mono text-xs text-muted-foreground">{row.point}</span>
              </td>
              <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{row.since}</td>
              <td className={`${TD} text-medium-foreground`}>{row.reason}</td>
              <td className={`${TD} text-medium-foreground`}>{row.owner}</td>
              <td className={TD}>{row.overdue ? <StatusIndicator size="sm" tone="warning" shape="square" label={row.review} /> : <span className="text-xs text-medium-foreground tabular-nums">{row.review}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LotoPatternHandover() {
  const [seen, setSeen] = useState<readonly string[]>(['ic2304']);
  const items = [
    { id: 'ic2304', label: 'IC-2304 · 1st stage compressor', detail: '8 points verified. Work paused at 15:30 and the permit suspended.' },
    { id: 'lt029', label: 'LT-029 · cooling water spare cooler', detail: 'Long-term isolation, review overdue 21 days.' },
    { id: 'ic2301', label: 'IC-2301 · cooling water pump 40-PA-4001', detail: '3 points applied, 1 not yet verified.' },
  ];
  const all = seen.length === items.length;
  return (
    <Panel title="Isolation handover" meta="Day shift to night shift">
      <p className="text-xs text-muted-foreground">Liv Wold hands over to Ingrid Haugen. Confirm each isolation was walked through.</p>
      <CheckboxGroup aria-label="Isolations handed over" className="gap-3">
        {items.map((item) => (
          <CheckboxItem key={item.id}>
            <CheckboxItemControl checked={seen.includes(item.id)} onCheckedChange={(checked) => setSeen((current) => (checked ? [...current, item.id] : current.filter((id) => id !== item.id)))} />
            <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{item.detail}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <span role="status" className="text-xs text-muted-foreground">{all ? 'All isolations acknowledged.' : `${items.length - seen.length} not yet acknowledged.`}</span>
        <Button size="sm" disabled={!all}>
          Accept handover
        </Button>
      </div>
    </Panel>
  );
}

function LotoPatternCertificate() {
  const [signed, setSigned] = useState<readonly string[]>(['authority', 'isolator']);
  const signers: SignOffSigner[] = [
    { id: 'authority', role: 'Isolation authority', name: 'Liv Wold', state: signed.includes('authority') ? 'signed' : 'pending', at: '12 Mar, 06:30' },
    { id: 'isolator', role: 'Isolating technician', name: 'Ingrid Haugen', state: signed.includes('isolator') ? 'signed' : 'pending', at: '12 Mar, 07:02' },
    { id: 'verifier', role: 'Verifier, second person', name: 'Magnus Solberg', state: signed.includes('verifier') ? 'signed' : 'pending', at: '12 Mar, 07:20' },
    { id: 'holder', role: 'Permit holder', name: 'Tomás Barros', state: signed.includes('holder') ? 'signed' : 'pending', at: '12 Mar, 07:31' },
  ];
  return (
    <Card role="group" aria-label="Isolation certificate IC-2304" className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Isolation certificate <span className="font-mono text-base-foreground">IC-2304</span>
          </span>
          <h3 className="text-base font-semibold text-base-foreground">Replace dry gas seal, 1st stage compressor</h3>
        </div>
        <StatusIndicator variant="badge" tone={signers.every((signer) => signer.state === 'signed') ? 'success' : 'warning'} label={signers.every((signer) => signer.state === 'signed') ? 'Signed' : 'Not fully signed'} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Fact label="Equipment">
          <span className="font-mono text-xs">23-KA-9101</span> 1st stage compressor
        </Fact>
        <Fact label="Permit">
          <span className="font-mono text-xs">PTW-26-0426</span> Cold work
        </Fact>
        <Fact label="Points">
          <span className="tabular-nums">8 points, 8 locks, 8 tags</span>
        </Fact>
        <Fact label="Valid">
          <span className="tabular-nums">12 Mar, 07:00 to 14 Mar, 19:00</span>
        </Fact>
      </dl>
      <SignOffBlock
        label="Certificate signatures"
        signers={signers}
        currentSignerId={signers.find((signer) => signer.state === 'pending')?.id}
        onSign={(id) => setSigned((current) => [...current, id])}
        signLabel="Sign certificate"
      />
    </Card>
  );
}

function ReleasePanel({ states, tried, onTried }: { states: States; tried: boolean; onTried?: (done: boolean) => void }) {
  const gate = releaseGate(
    POINTS.map((point) => ({ id: point.id, tag: point.tag, state: stateOf(states, point.id) })),
    [{ id: 'try', label: 'Try step', done: tried }]
  );
  return (
    <div className="flex flex-col gap-3">
      {onTried ? (
        <CheckboxGroup aria-label="Release checks">
          <CheckboxItem>
            <CheckboxItemControl checked={tried} onCheckedChange={onTried} />
            <CheckboxItemLabel>Try step done at the equipment</CheckboxItemLabel>
            <CheckboxItemDescription>Start attempted, gauge at zero, no gas.</CheckboxItemDescription>
          </CheckboxItem>
        </CheckboxGroup>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-default pt-3">
        <div role="status" className="flex max-w-prose flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">{gate.ready ? 'Ready to release' : 'Release for work is blocked'}</span>
          <span className="text-xs text-medium-foreground">{gate.summary}</span>
          {gate.blockers.length > 0 ? (
            <ul aria-label="Reasons release is blocked" className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted-foreground">
              {gate.blockers.map((blocker) => (
                <li key={blocker.id}>{blocker.reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button disabled={!gate.ready}>Release for work</Button>
      </div>
    </div>
  );
}

function LotoPatternReleaseGate() {
  const [tried, setTried] = useState(false);
  return (
    <Panel title="Completeness gate" meta={<span className="font-mono">IC-2304</span>}>
      <ReleasePanel states={MIXED} tried={tried} onTried={setTried} />
    </Panel>
  );
}

function LotoPatternPlanner() {
  const [states, setStates] = useState<States>(ALL_PLANNED);
  const [history, setHistory] = useState<readonly States[]>([]);
  const [tried, setTried] = useState(false);
  const [message, setMessage] = useState('');
  const ordered = applicationOrder(POINTS);
  const nextPlanned = ordered.find((point) => stateOf(states, point.id) === 'planned');
  const counts = countIsolationStates(ordered.map((point) => ({ state: stateOf(states, point.id) })));
  const change = (point: Point, state: IsolationState, text: string) => {
    setHistory((current) => [...current, states]);
    setStates((current) => ({ ...current, [point.id]: state }));
    setMessage(text);
  };
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setStates(previous);
    setHistory((current) => current.slice(0, -1));
    setMessage('Undid the last action.');
  };
  return (
    <Card className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">Isolation plan IC-2304</h3>
          <span className="text-xs text-muted-foreground">Replace dry gas seal on 23-KA-9101 · points go on in step order</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={history.length === 0} onClick={undo}>
            <IconArrowBackUp aria-hidden="true" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={history.length === 0}
            onClick={() => {
              setStates(ALL_PLANNED);
              setHistory([]);
              setTried(false);
              setMessage('Plan reset.');
            }}
          >
            Reset plan
          </Button>
        </div>
      </div>
      <LinearGauge label="Isolation points verified" value={counts.verified} max={POINTS.length} size="sm" showHeader={false} />
      <span className="text-xs text-muted-foreground tabular-nums">
        {counts.verified} verified · {counts.applied} applied · {counts.planned} planned
      </span>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ol aria-label="Isolation points in order of application" className="flex flex-col gap-4">
          {ordered.map((point) => {
            const state = stateOf(states, point.id);
            let actions: ReactNode;
            if (state === 'planned' && nextPlanned?.id === point.id) {
              actions = (
                <Button size="sm" variant="secondary" onClick={() => change(point, 'applied', `Applied ${point.tag}, step ${point.step}. Awaiting second person.`)}>
                  Apply point
                </Button>
              );
            } else if (state === 'planned') {
              actions = <span className="text-xs text-muted-foreground">After step {point.step - 1}</span>;
            } else if (state === 'applied') {
              actions = (
                <Button size="sm" onClick={() => change(point, 'verified', `Verified ${point.tag}, step ${point.step}.`)}>
                  Verify point
                </Button>
              );
            }
            return <li key={point.id}>{rowFor(point, state, actions)}</li>;
          })}
        </ol>
        <div className="flex flex-col gap-4">
          <LotoPatternSchematicDrawing states={states} />
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {message || 'Apply the first point to start.'}
          </p>
        </div>
      </div>
      <ReleasePanel states={states} tried={tried} onTried={setTried} />
    </Card>
  );
}

function LotoPatternOverview() {
  const counts = countIsolationStates(POINTS.map((point) => ({ state: stateOf(MIXED, point.id) })));
  const people = CREW_PEOPLE;
  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="min-w-0 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              Isolation certificate <span className="font-mono text-base-foreground">IC-2304</span>
            </span>
            <h3 className="text-base font-semibold text-base-foreground">Replace dry gas seal, 1st stage compressor</h3>
          </div>
          <StatusIndicator variant="badge" tone="warning" label="Not complete" />
        </div>
        <LinearGauge label="Isolation points verified" value={counts.verified} max={POINTS.length} size="sm" showHeader={false} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {counts.verified} of {POINTS.length} points verified · {counts.applied} applied · {counts.planned} planned
        </span>
        <LotoPatternSchematicDrawing states={MIXED} />
        <SchematicKey />
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 gap-4">
          <ol aria-label="Isolation points" className="flex flex-col gap-3">
            {applicationOrder(POINTS).slice(0, 5).map((point) => (
              <li key={point.id}>{rowFor(point, stateOf(MIXED, point.id))}</li>
            ))}
          </ol>
          <span className="text-xs text-muted-foreground">Showing 5 of {POINTS.length} points.</span>
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="min-w-0">
            <LockBoard boxId="LB-07" keysInside={8} people={people} />
          </Card>
          <Card className="min-w-0">
            <ConditionList
              label="Before release for work"
              conditions={[
                { id: 'points', label: 'All points verified', detail: `${POINTS.length - counts.verified} open`, state: counts.verified === POINTS.length ? 'met' : 'unmet' },
                { id: 'try', label: 'Try step done', detail: 'Not recorded', state: 'unmet' },
                { id: 'permit', label: 'Permit PTW-26-0426 approved', detail: 'Approved 11 Mar, 17:05', state: 'met' },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'lockout-tagout',
  title: 'Lock-out and tag-out',
  summary:
    'Isolation planning and control for a job on the 1st stage compressor: isolation points with locks and tags, the schematic they are marked on, a group lock box, the try step that proves the equipment dead, removal in reverse order and a gate that keeps the equipment from being released until every point is verified.',
  guidance: {
    use: [
      'Write the state of every point in words: planned, applied, verified, removed.',
      'Count a point only after a second person has verified it at the equipment.',
      'Block release for work with a stated reason, not a silently disabled button.',
      'Remove isolations in the reverse order of application, and only when every personal lock is off.',
    ],
    avoid: [
      'Green for an applied point; only a verified point is shown as done.',
      'Letting the same person apply and verify a point.',
      'Showing the schematic without the position each valve must be left in.',
      'Hiding long-term isolations: each needs an owner and a review date.',
    ],
  },
  source,
  sections: [
    {
      id: 'points',
      title: 'Points, tags and energy',
      description: 'One isolation point, its states, its tag and the energy it controls.',
      specimens: [
        {
          id: 'LotoPatternPointRow',
          title: 'Isolation point',
          note: 'Pick it for one point: the device, the position it is left in, the lock, the tag and who applied and verified.',
          origin: 'custom',
          uses: ['industrial/safety/IsolationPointRow.tsx', 'industrial/safety/isolationOrder.ts'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternPointRow,
        },
        {
          id: 'LotoPatternStatesLegend',
          title: 'Isolation states',
          note: 'Pick it as the legend of an isolation system: the four states and what each one allows.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternStatesLegend,
        },
        {
          id: 'LotoPatternPointStates',
          title: 'A point in each state',
          note: 'Pick it to see how the row changes from planned to removed, and what is shown at each stage.',
          origin: 'custom',
          uses: ['industrial/safety/IsolationPointRow.tsx', 'industrial/safety/isolationOrder.ts'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternPointStates,
        },
        {
          id: 'LotoPatternDangerTag',
          title: 'Danger tag',
          note: 'Pick it to preview or print the tag hung on a point, with the fields filled in by hand in the field.',
          origin: 'custom',
          uses: ['industrial/safety/DangerTag.tsx'],
          size: 'sm',
          Component: LotoPatternDangerTag,
        },
        {
          id: 'LotoPatternTagPair',
          title: 'Tags for an open and a racked-out point',
          note: 'Pick it when the instruction is not "do not operate" in the closed position: the tag says to leave the point open.',
          origin: 'custom',
          uses: ['industrial/safety/DangerTag.tsx'],
          size: 'md',
          Component: LotoPatternTagPair,
        },
        {
          id: 'LotoPatternBoundary',
          title: 'Boundary summary',
          note: 'Pick it beside the isolation list: what is inside the boundary, how it is isolated and what stays in service.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: LotoPatternBoundary,
        },
        {
          id: 'LotoPatternEnergySources',
          title: 'Energy sources',
          note: 'Pick it to show that every kind of energy has a control and a way to prove it: electrical, pressure, thermal and stored.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternEnergySources,
        },
        {
          id: 'LotoPatternIsolationList',
          title: 'Isolation list in step order',
          note: 'Pick it for the plan as the isolating technician reads it: the points in the order they go on.',
          origin: 'custom',
          uses: ['industrial/safety/IsolationPointRow.tsx', 'industrial/safety/isolationOrder.ts'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternIsolationList,
        },
      ],
    },
    {
      id: 'schematic',
      title: 'On the schematic',
      description: 'Isolation points marked on a piping drawing of the machine.',
      specimens: [
        {
          id: 'LotoPatternSchematic',
          title: 'Points marked on the schematic',
          note: 'Pick it to show where each point is and the position it is left in; the marker shape repeats the state.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramCanvas.tsx', 'industrial/diagrams/ValveSymbol.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/Breaker.tsx'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternSchematic,
        },
        {
          id: 'LotoPatternSchematicSelect',
          title: 'Select a point on the schematic',
          note: 'Pick it when people work from the drawing: choose a marker, see the point, and apply or verify it there.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramHotspot.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/safety/IsolationPointRow.tsx'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternSchematicSelect,
        },
      ],
    },
    {
      id: 'crew',
      title: 'Locks, crew and handover',
      description: 'Who holds which lock, and how isolations pass between people and shifts.',
      specimens: [
        {
          id: 'LotoPatternLockBoard',
          title: 'Lock box board',
          note: 'Pick it to see the group lock box: a personal lock for each crew member, on or off.',
          origin: 'custom',
          uses: ['industrial/safety/LockBoard.tsx', 'industrial/safety/isolationOrder.ts'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternLockBoard,
        },
        {
          id: 'LotoPatternLockBoardLive',
          title: 'Lock box with controls',
          note: 'Pick it for the working version: hang and remove personal locks and watch the removal gate change.',
          origin: 'custom',
          uses: ['industrial/safety/LockBoard.tsx'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternLockBoardLive,
        },
        {
          id: 'LotoPatternGroupLockout',
          title: 'Crew sign-on and sign-off',
          note: 'Pick it for a group lock-out: each member signs on before entering and signs off when they leave.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: LotoPatternGroupLockout,
        },
        {
          id: 'LotoPatternHandover',
          title: 'Isolation handover',
          note: 'Pick it at shift change: the incoming supervisor confirms each isolation before accepting.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: LotoPatternHandover,
        },
      ],
    },
    {
      id: 'verification',
      title: 'Verification and removal',
      description: 'Proving the equipment dead, and taking the isolations off in the right order.',
      specimens: [
        {
          id: 'LotoPatternTryStep',
          title: 'Try step checklist',
          note: 'Pick it for the proof: tests at the equipment that show the energy is gone, each to be confirmed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: LotoPatternTryStep,
        },
        {
          id: 'LotoPatternDeisolation',
          title: 'De-isolation sequence',
          note: 'Pick it for the removal plan: the same points in reverse order, numbered from 1.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts', 'industrial/safety/IsolationPointRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternDeisolation,
        },
        {
          id: 'LotoPatternDeisolationLive',
          title: 'Remove the isolations',
          note: 'Pick it for the removal itself: only the next point in the reverse sequence is offered, with undo.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts', 'industrial/safety/IsolationPointRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternDeisolationLive,
        },
        {
          id: 'LotoPatternReleaseGate',
          title: 'Completeness gate',
          note: 'Pick it before work starts: release is blocked, with each reason listed, until every point and the try step are done.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternReleaseGate,
        },
      ],
    },
    {
      id: 'records',
      title: 'Certificate, conflicts and registers',
      description: 'The paperwork that goes with an isolation.',
      specimens: [
        {
          id: 'LotoPatternCertificate',
          title: 'Isolation certificate',
          note: 'Pick it for the certificate that proves the isolation: equipment, points and four signatures.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: LotoPatternCertificate,
        },
        {
          id: 'LotoPatternConflicts',
          title: 'Conflicts with other permits',
          note: 'Pick it when open permits touch the isolation: each is named with why it conflicts.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: LotoPatternConflicts,
        },
        {
          id: 'LotoPatternLongTerm',
          title: 'Long-term isolation register',
          note: 'Pick it for isolations that outlast a shift: owner, reason and a review date, with overdue reviews marked.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternLongTerm,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A working isolation planner and a certificate overview.',
      specimens: [
        {
          id: 'LotoPatternPlanner',
          title: 'Isolation planner',
          note: 'Pick it to work a whole isolation: apply points in order, verify them, undo, and see release stay blocked until all is proven.',
          origin: 'custom',
          uses: ['industrial/safety/isolationOrder.ts', 'industrial/safety/IsolationPointRow.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/LinearGauge.tsx'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternPlanner,
        },
        {
          id: 'LotoPatternOverview',
          title: 'Certificate overview',
          note: 'Pick it as the top of an isolation page: progress, the schematic, the points, the lock box and what blocks release.',
          origin: 'custom',
          uses: ['industrial/safety/LockBoard.tsx', 'industrial/safety/IsolationPointRow.tsx', 'industrial/workflows/ConditionList.tsx', 'industrial/LinearGauge.tsx'],
          size: 'full',
          align: 'stretch',
          Component: LotoPatternOverview,
        },
      ],
    },
  ],
});
