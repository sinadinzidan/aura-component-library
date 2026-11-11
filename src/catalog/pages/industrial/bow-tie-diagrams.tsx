import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { Switch } from '@cognite/aura/components/switch';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { barrierStatus, countBarrierStates, worstBarrierState } from '../../../library/industrial/domains/safety';
import type { BarrierState } from '../../../library/industrial/domains/safety';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { BarrierCard } from '../../../library/industrial/safety/BarrierCard';
import { BarrierTypeMark } from '../../../library/industrial/safety/BarrierTypeMark';
import { BowTieDiagram } from '../../../library/industrial/safety/BowTieDiagram';
import { BARRIER_TYPES, BARRIER_TYPE_LABEL, barrierCoverage, barriersOf, bowTieSummary, pathState, pathStrengths, weakenedPaths } from '../../../library/industrial/safety/bowTieLayout';
import type { BowTieBarrier, BowTieModel } from '../../../library/industrial/safety/bowTieLayout';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { definePage } from '../../types';

import source from './bow-tie-diagrams.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const BARRIERS: readonly BowTieBarrier[] = [
  { id: 'pshh', name: 'High pressure trip', type: 'engineered', state: 'healthy' },
  { id: 'psv', name: 'Relief valve', type: 'engineered', state: 'degraded', escalation: 'Recertification due in 18 days' },
  { id: 'corr', name: 'Corrosion monitoring', type: 'procedural', state: 'healthy' },
  { id: 'inspect', name: 'Inspection programme', type: 'procedural', state: 'degraded', escalation: 'Line inspection 3 weeks overdue' },
  { id: 'ptw', name: 'Permit to work', type: 'procedural', state: 'healthy' },
  { id: 'lift', name: 'Lifting plan', type: 'human', state: 'healthy' },
  { id: 'esd', name: 'Emergency shutdown', type: 'engineered', state: 'healthy' },
  { id: 'deluge', name: 'Active fire protection', type: 'engineered', state: 'impaired', escalation: 'Fire pump B failed its start test' },
  { id: 'ignition', name: 'Ignition source control', type: 'procedural', state: 'degraded' },
  { id: 'gas', name: 'Gas detection', type: 'engineered', state: 'degraded', escalation: '2 of 14 detectors inhibited' },
  { id: 'muster', name: 'Muster and evacuation', type: 'human', state: 'healthy' },
];

const MODEL: BowTieModel = {
  hazard: 'Pressurised hydrocarbon gas',
  topEvent: 'Loss of containment',
  barriers: BARRIERS,
  threats: [
    { id: 't-over', name: 'Overpressure from a blocked outlet', barrierIds: ['pshh', 'psv'] },
    { id: 't-corr', name: 'Internal corrosion of piping', barrierIds: ['corr', 'inspect'] },
    { id: 't-maint', name: 'Error during maintenance on a live line', barrierIds: ['ptw'] },
    { id: 't-drop', name: 'Dropped object', barrierIds: ['lift'] },
  ],
  consequences: [
    { id: 'c-fire', name: 'Jet fire', severity: 'severe', barrierIds: ['esd', 'deluge'] },
    { id: 'c-expl', name: 'Explosion in the module', severity: 'severe', barrierIds: ['ignition', 'gas'] },
    { id: 'c-inj', name: 'Injury to personnel', severity: 'major', barrierIds: ['esd', 'muster'] },
  ],
};

const SIMPLE: BowTieModel = {
  hazard: 'Pressurised hydrocarbon gas',
  topEvent: 'Loss of containment',
  barriers: BARRIERS,
  threats: [{ id: 't-over', name: 'Overpressure from a blocked outlet', barrierIds: ['pshh', 'psv'] }],
  consequences: [{ id: 'c-fire', name: 'Jet fire', severity: 'severe', barrierIds: ['esd', 'deluge'] }],
};

const ALL_HEALTHY: BowTieModel = { ...MODEL, barriers: BARRIERS.map((barrier) => ({ ...barrier, state: 'healthy' })) };

type BarrierRecord = {
  role: string;
  owner: string;
  lastTest: string;
  nextTest: string;
  standard: string;
  impairments: readonly string[];
  workOrders: readonly { id: string; title: string }[];
};

const RECORDS: Record<string, BarrierRecord> = {
  pshh: { role: 'Prevention', owner: 'Aisha Khan', lastTest: '10 Mar 2026', nextTest: '10 Jun 2026', standard: 'Trips the compressor within 2 s at 52 barg', impairments: [], workOrders: [] },
  psv: { role: 'Prevention', owner: 'Aisha Khan', lastTest: '30 Mar 2024', nextTest: '30 Mar 2026', standard: 'Lifts at 55 barg, plus or minus 3 %', impairments: ['Recertification is due in 18 days', 'Set pressure last verified 23 months ago'], workOrders: [{ id: 'WO-104490', title: 'Recertify relief valve 23-PSV-9120' }] },
  corr: { role: 'Prevention', owner: 'Magnus Solberg', lastTest: '2 Mar 2026', nextTest: '2 Jun 2026', standard: 'Corrosion rate below 0.1 mm per year at every probe', impairments: [], workOrders: [] },
  inspect: { role: 'Prevention', owner: 'Magnus Solberg', lastTest: '14 Sep 2025', nextTest: '14 Feb 2026', standard: 'Wall thickness measured every 6 months on line 23-PL-9110', impairments: ['Inspection overdue by 3 weeks'], workOrders: [{ id: 'WO-104476', title: 'Thickness survey, line 23-PL-9110' }] },
  ptw: { role: 'Prevention', owner: 'Liv Wold', lastTest: '1 Mar 2026', nextTest: '1 Apr 2026', standard: 'No live-line work without an isolation certificate', impairments: [], workOrders: [] },
  lift: { role: 'Prevention', owner: 'Liv Wold', lastTest: '20 Feb 2026', nextTest: '20 May 2026', standard: 'Lifts over live equipment need a signed lifting plan', impairments: [], workOrders: [] },
  esd: { role: 'Mitigation', owner: 'Aisha Khan', lastTest: '10 Mar 2026', nextTest: '10 Jun 2026', standard: 'Inlet valve closes within 20 s of a trip signal', impairments: [], workOrders: [] },
  deluge: { role: 'Mitigation', owner: 'Magnus Solberg', lastTest: '11 Mar 2026', nextTest: 'After repair', standard: 'Two fire pumps start on demand and reach 10 barg in 60 s', impairments: ['Fire pump B failed its weekly start test', 'Pump A carries the duty alone until repair'], workOrders: [{ id: 'WO-104491', title: 'Repair fire pump B starter' }] },
  ignition: { role: 'Mitigation', owner: 'Liv Wold', lastTest: '1 Mar 2026', nextTest: '1 Apr 2026', standard: 'Hot work only with gas test and fire watch', impairments: ['Hot work PTW-26-0418 active in the area'], workOrders: [] },
  gas: { role: 'Mitigation', owner: 'Jonas Nyberg', lastTest: '2 Mar 2026', nextTest: '2 Apr 2026', standard: 'Detects 20 % LEL within 30 s and alarms in the control room', impairments: ['2 of 14 detectors inhibited for hot work'], workOrders: [] },
  muster: { role: 'Mitigation', owner: 'Liv Wold', lastTest: '24 Feb 2026', nextTest: '24 May 2026', standard: 'Everyone accounted for within 10 min of the general alarm', impairments: [], workOrders: [] },
};

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

function barrierById(id: string): BowTieBarrier {
  return BARRIERS.find((barrier) => barrier.id === id) ?? BARRIERS[0];
}

function DetailFor({ id, model = MODEL }: { id: string; model?: BowTieModel }) {
  const barrier = model.barriers.find((entry) => entry.id === id) ?? BARRIERS[0];
  const record = RECORDS[barrier.id];
  return (
    <BarrierCard
      name={barrier.name}
      type={barrier.type}
      state={barrier.state}
      role={record?.role}
      owner={record?.owner}
      lastTest={record?.lastTest}
      nextTest={record?.nextTest}
      performanceStandard={record?.standard}
      impairments={record?.impairments}
      escalation={barrier.escalation}
      workOrders={record?.workOrders}
    />
  );
}

function PathRow({ model, id }: { model: BowTieModel; id: string }) {
  const row = pathStrengths(model).find((entry) => entry.id === id);
  if (!row) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-base-foreground">{row.name}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.healthy} of {row.total} healthy
      </span>
    </div>
  );
}

function BowTieFull() {
  const [selected, setSelected] = useState<string | null>('psv');
  const [onlyWeak, setOnlyWeak] = useState(false);
  const model = onlyWeak ? weakenedPaths(MODEL) : MODEL;
  const strengths = pathStrengths(model);
  return (
    <Card className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">Loss of containment, gas compression</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {model.threats.length} {model.threats.length === 1 ? 'threat' : 'threats'} · {model.consequences.length} {model.consequences.length === 1 ? 'consequence' : 'consequences'} shown · select a barrier for detail
          </span>
        </div>
        <Switch label="Show only weakened paths" textRight checked={onlyWeak} onCheckedChange={setOnlyWeak} />
      </div>
      <BowTieDiagram
        label="Bow-tie for loss of containment in gas compression: four threats with prevention barriers on the left, three consequences with mitigation barriers on the right"
        model={model}
        selectedBarrierId={selected}
        onSelectBarrier={setSelected}
        emptyText="No path has a weakened barrier."
      />
      <div className="grid grid-cols-1 gap-6 border-t border-default pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div aria-live="polite">
          {selected ? (
            <DetailFor id={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a barrier in the diagram to see its owner, tests, performance standard and impairments.</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Paths shown</span>
          {strengths.map((row) => (
            <PathRow key={row.id} model={model} id={row.id} />
          ))}
          {strengths.length === 0 ? <span className="text-sm text-muted-foreground">None.</span> : null}
        </div>
      </div>
    </Card>
  );
}

function BowTieSimple() {
  return (
    <Card className="w-full min-w-0">
      <BowTieDiagram label="Simplified bow-tie: overpressure to jet fire with two prevention and two mitigation barriers" model={SIMPLE} />
    </Card>
  );
}

function BowTieCompact() {
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Loss of containment</h3>
        <StatusIndicator size="sm" {...barrierStatus(worstBarrierState(BARRIERS.map((barrier) => barrier.state)))} />
      </div>
      <BowTieDiagram label="Compact bow-tie for loss of containment: four threats and three consequences, barriers as state marks" model={MODEL} compact />
    </Card>
  );
}

function BowTieDark() {
  return (
    <div className="dark w-full rounded-lg bg-base-background p-4">
      <BowTieDiagram label="Bow-tie for loss of containment on a dark surface" model={MODEL} onSelectBarrier={() => undefined} />
    </div>
  );
}

function BowTieThreatCard() {
  const threat = MODEL.threats[0];
  const barriers = barriersOf(MODEL, threat);
  return (
    <Card role="group" aria-label={`Threat: ${threat.name}`} className="w-full max-w-sm gap-3 self-center">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Threat</span>
          <h3 className="text-sm font-medium text-base-foreground">{threat.name}</h3>
        </div>
        <StatusIndicator size="sm" {...barrierStatus(pathState(MODEL, threat))} />
      </div>
      <ul className="flex flex-col gap-1.5">
        {barriers.map((barrier) => (
          <li key={barrier.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-base-foreground">{barrier.name}</span>
            <StatusIndicator size="sm" {...barrierStatus(barrier.state)} />
          </li>
        ))}
      </ul>
      <span className="border-t border-default pt-3 text-xs text-muted-foreground">{barriers.length} prevention barriers</span>
    </Card>
  );
}

const SEVERITY_BADGE = { minor: 'low', major: 'high', severe: 'critical' } as const;

function BowTieConsequenceCard() {
  const consequence = MODEL.consequences[0];
  const barriers = barriersOf(MODEL, consequence);
  return (
    <Card role="group" aria-label={`Consequence: ${consequence.name}`} className="w-full max-w-sm gap-3 self-center">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Consequence</span>
          <h3 className="text-sm font-medium text-base-foreground">{consequence.name}</h3>
        </div>
        <SeverityBadge severity={SEVERITY_BADGE[consequence.severity ?? 'minor']} label="Severe" />
      </div>
      <p className="text-sm text-medium-foreground">Fatalities possible, loss of the module and 3 months of lost export.</p>
      <span className="border-t border-default pt-3 text-xs text-muted-foreground">
        {barriers.length} mitigation barriers · {barriers.filter((barrier) => barrier.state === 'healthy').length} healthy
      </span>
    </Card>
  );
}

function BowTieEscalationFactor() {
  const barrier = barrierById('deluge');
  return (
    <Card role="group" aria-label="Escalation factor" className="w-full max-w-sm gap-3 self-center">
      <span className="text-xs text-muted-foreground">Escalation factor</span>
      <p className="rounded-lg border border-dashed border-emphasized px-3 py-2 text-sm text-base-foreground">{barrier.escalation}</p>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-medium-foreground">Can defeat: {barrier.name}</span>
        <StatusIndicator size="sm" {...barrierStatus(barrier.state)} />
      </div>
      <span className="text-xs text-muted-foreground">Control: weekly start test, pump A carries the duty alone until repair.</span>
    </Card>
  );
}

function BowTieBarrierTypes() {
  return (
    <Panel title="Barrier types">
      <dl className="flex flex-col gap-3">
        {BARRIER_TYPES.map((type) => (
          <div key={type} className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-x-4">
            <dt>
              <BarrierTypeMark type={type} />
            </dt>
            <dd className="text-sm text-medium-foreground">
              {type === 'engineered' ? 'Hardware or automation that acts without anyone deciding: trips, relief valves, detectors.' : type === 'procedural' ? 'A rule or a document that people follow: permits, inspections, lifting plans.' : 'Someone has to notice and act: an operator response, evacuation.'}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function BowTieLegend() {
  return (
    <Panel title="Barrier health">
      <ul aria-label="Barrier health states" className="flex flex-col gap-3">
        {(['healthy', 'degraded', 'impaired'] as const).map((state) => (
          <li key={state} className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-3">
            <StatusIndicator size="sm" {...barrierStatus(state)} />
            <span className="text-xs text-medium-foreground">
              {state === 'healthy' ? 'Meets its performance standard.' : state === 'degraded' ? 'Works, but is overdue, inhibited or partly out of service.' : 'Cannot be relied on. A compensating measure is needed.'}
            </span>
          </li>
        ))}
      </ul>
      <span className="text-xs text-muted-foreground">A dashed outline also marks an impaired barrier in the diagram.</span>
    </Panel>
  );
}

function BowTieBarrierStates() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
      {(['pshh', 'psv', 'deluge'] as const).map((id) => (
        <Card key={id} className="min-w-0">
          <DetailFor id={id} />
        </Card>
      ))}
    </div>
  );
}

function BowTieBarrierCardDetail() {
  return (
    <Card className="w-full min-w-0">
      <DetailFor id="deluge" />
    </Card>
  );
}

function BowTiePathStrength() {
  const rows = pathStrengths(MODEL);
  const LEVEL: Record<(typeof rows)[number]['level'], string> = { intact: 'All barriers healthy', weakened: 'Weakened', single: 'One healthy barrier left', unprotected: 'No healthy barrier' };
  return (
    <Panel title="Protection left per path">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-base-foreground">{row.name}</span>
              <span className="text-xs text-muted-foreground">{LEVEL[row.level]}</span>
            </div>
            <LinearGauge label={`Healthy barriers on ${row.name}`} value={row.healthy} max={Math.max(row.total, 1)} size="sm" showHeader={false} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function BowTieSummaryTable() {
  const rows = bowTieSummary(MODEL);
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Bow-tie summary: loss of containment" className="w-full min-w-208 border-collapse text-sm">
        <caption className="px-3 pb-2 text-left text-xs text-muted-foreground">Hazard: {MODEL.hazard}. Top event: {MODEL.topEvent}. Read for screen readers and print.</caption>
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Side
            </th>
            <th scope="col" className={TH}>
              Path
            </th>
            <th scope="col" className={TH}>
              Barriers in order
            </th>
            <th scope="col" className={TH}>
              Weakest barrier
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pathId} className="border-t border-default">
              <td className={`${TD} text-medium-foreground`}>{row.side === 'threat' ? 'Threat' : 'Consequence'}</td>
              <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                {row.path}
                {row.severity ? <span className="block text-xs text-muted-foreground">Severity: {row.severity}</span> : null}
              </th>
              <td className={`${TD} text-base-foreground`}>{row.barriers.length > 0 ? row.barriers.map((barrier) => barrier.name).join(', then ') : 'None'}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...barrierStatus(row.state)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BowTieCoverage() {
  const [side, setSide] = useState<'threat' | 'consequence'>('threat');
  const matrix = barrierCoverage(MODEL, side);
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Barrier coverage</h3>
        <div className="flex gap-2">
          <Button size="sm" variant={side === 'threat' ? 'secondary' : 'ghost'} aria-pressed={side === 'threat'} onClick={() => setSide('threat')}>
            Threats
          </Button>
          <Button size="sm" variant={side === 'consequence' ? 'secondary' : 'ghost'} aria-pressed={side === 'consequence'} onClick={() => setSide('consequence')}>
            Consequences
          </Button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table aria-label={`Barrier coverage of ${side === 'threat' ? 'threats' : 'consequences'}`} className="w-full min-w-176 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={TH}>
                {side === 'threat' ? 'Threat' : 'Consequence'}
              </th>
              {matrix.barriers.map((barrier) => (
                <th key={barrier.id} scope="col" className={`${TH} text-center`}>
                  {barrier.name}
                </th>
              ))}
              <th scope="col" className={`${TH} text-right`}>
                Healthy
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.path.id} className="border-t border-default">
                <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                  {row.path.name}
                </th>
                {row.cells.map((cell, index) => (
                  <td key={matrix.barriers[index].id} className={`${TD} text-center`}>
                    {cell ? <StatusIndicator size="sm" {...barrierStatus(cell)} /> : <span aria-label="No barrier" className="text-muted-foreground">–</span>}
                  </td>
                ))}
                <td className={`${TD} text-right tabular-nums text-medium-foreground`}>
                  {row.healthy} of {row.cells.filter((cell) => cell !== null).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BowTieCumulative() {
  const all = MODEL.barriers;
  const counts = countBarrierStates(all.map((barrier) => barrier.state));
  const strengths = pathStrengths(MODEL);
  const worst = strengths.filter((row) => row.level === 'single' || row.level === 'unprotected');
  return (
    <Panel title="Cumulative barrier health" meta={`${all.length} barriers`}>
      <div className="flex items-baseline gap-2">
        <ValueReadout size="lg" value={counts.healthy} />
        <span className="text-sm text-muted-foreground tabular-nums">of {all.length} barriers healthy</span>
      </div>
      <LinearGauge label="Healthy barriers" value={counts.healthy} max={all.length} size="sm" showHeader={false} />
      <dl className="flex flex-col gap-1.5 text-sm">
        {(['healthy', 'degraded', 'impaired'] as const).map((state) => (
          <div key={state} className="flex items-center justify-between gap-3">
            <dt>
              <StatusIndicator size="sm" {...barrierStatus(state)} />
            </dt>
            <dd className="tabular-nums text-base-foreground">{counts[state]}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-default pt-3 text-xs text-muted-foreground">
        {worst.length === 0 ? 'Every path keeps more than one healthy barrier.' : `${worst.length} ${worst.length === 1 ? 'path has' : 'paths have'} one healthy barrier or none: ${worst.map((row) => row.name.toLowerCase()).join(', ')}.`}
      </p>
    </Panel>
  );
}

function BowTieFilterToggle() {
  const [onlyWeak, setOnlyWeak] = useState(true);
  const total = MODEL.threats.length + MODEL.consequences.length;
  const shown = onlyWeak ? weakenedPaths(MODEL) : MODEL;
  const count = shown.threats.length + shown.consequences.length;
  return (
    <Panel title="Filter">
      <Switch label="Show only weakened paths" textRight checked={onlyWeak} onCheckedChange={setOnlyWeak} />
      <span role="status" className="text-xs text-muted-foreground tabular-nums">
        Showing {count} of {total} paths
      </span>
    </Panel>
  );
}

function BowTieEmptyFilter() {
  return (
    <Card className="w-full min-w-0">
      <BowTieDiagram label="Bow-tie showing only weakened paths" model={weakenedPaths(ALL_HEALTHY)} emptyText="No path has a weakened barrier. Every barrier meets its performance standard." />
    </Card>
  );
}

function BowTieBarrierList() {
  const [type, setType] = useState<'engineered' | 'procedural' | 'human'>('engineered');
  const list = BARRIERS.filter((barrier) => barrier.type === type);
  return (
    <Panel title="Barriers by type" meta={`${list.length} ${BARRIER_TYPE_LABEL[type].toLowerCase()}`}>
      <div className="flex flex-wrap gap-2">
        {BARRIER_TYPES.map((entry) => (
          <Button key={entry} size="sm" variant={type === entry ? 'secondary' : 'ghost'} aria-pressed={type === entry} onClick={() => setType(entry)}>
            {BARRIER_TYPE_LABEL[entry]}
          </Button>
        ))}
      </div>
      <ul className="flex flex-col gap-2.5">
        {list.map((barrier) => (
          <li key={barrier.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-base-foreground">{barrier.name}</span>
            <StatusIndicator size="sm" {...barrierStatus(barrier.state)} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function BowTiePathDetail() {
  const path = MODEL.consequences[0];
  const barriers = barriersOf(MODEL, path);
  return (
    <Card role="group" aria-label={`Path to ${path.name}`} className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Path from loss of containment to {path.name.toLowerCase()}</h3>
        <StatusIndicator size="sm" {...barrierStatus(pathState(MODEL, path))} />
      </div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
        {barriers.map((barrier, index) => (
          <li key={barrier.id} className="flex flex-col gap-1.5 rounded-lg bg-muted-background p-3">
            <span className="text-xs tabular-nums text-muted-foreground">Barrier {index + 1}</span>
            <span className="text-sm font-medium text-base-foreground">{barrier.name}</span>
            <BarrierTypeMark type={barrier.type} />
            <StatusIndicator size="sm" {...barrierStatus(barrier.state)} />
            {barrier.escalation ? <span className="text-xs text-medium-foreground">Escalation: {barrier.escalation}</span> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function BowTieImpairments() {
  const weak = BARRIERS.filter((barrier) => barrier.state !== 'healthy');
  return (
    <Panel title="Impairment log" meta={`${weak.length} barriers weakened`}>
      <ul className="flex flex-col">
        {weak.map((barrier, index) => (
          <li key={barrier.id} className={`flex items-start justify-between gap-4 py-3 ${index === 0 ? 'pt-0' : 'border-t border-default'}`}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">{barrier.name}</span>
              <span className="text-xs text-muted-foreground">{RECORDS[barrier.id]?.impairments[0]}</span>
            </div>
            <StatusIndicator size="sm" {...barrierStatus(barrier.state)} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function BowTieTestSchedule() {
  return (
    <Panel title="Barrier tests" meta="By next test due">
      <ul className="flex flex-col">
        {BARRIERS.filter((barrier) => RECORDS[barrier.id]?.nextTest !== undefined)
          .slice(0, 6)
          .map((barrier, index) => (
            <li key={barrier.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 py-2.5 ${index === 0 ? 'pt-0' : 'border-t border-default'}`}>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm text-base-foreground">{barrier.name}</span>
                <span className="text-xs text-muted-foreground">Last {RECORDS[barrier.id]?.lastTest}</span>
              </span>
              <span className="text-xs tabular-nums text-medium-foreground">Next {RECORDS[barrier.id]?.nextTest}</span>
            </li>
          ))}
      </ul>
    </Panel>
  );
}

function BowTieOverview() {
  const counts = countBarrierStates(BARRIERS.map((barrier) => barrier.state));
  const states: BarrierState[] = ['healthy', 'degraded', 'impaired'];
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {states.map((state) => (
          <Card key={state} className="min-w-0">
            <StatusIndicator size="sm" {...barrierStatus(state)} />
            <ValueReadout size="lg" value={counts[state]} unit="barriers" />
          </Card>
        ))}
      </div>
      <Card className="min-w-0 gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Loss of containment, gas compression</h3>
        <BowTieDiagram label="Bow-tie for loss of containment with barrier health" model={MODEL} compact />
      </Card>
      <BowTieSummaryTable />
    </div>
  );
}

export default definePage({
  id: 'bow-tie-diagrams',
  title: 'Bow-tie diagrams',
  summary:
    'A bow-tie drawn from data: one hazard and top event in the centre, threats with their prevention barriers on the left, consequences with their mitigation barriers on the right, and escalation factors under the barriers they can defeat. Barrier health is a shape and a word, and the layout is a pure function of the model.',
  guidance: {
    use: [
      'Draw barriers in the order the event meets them, nearest the threat or consequence first.',
      'Write the health of every barrier as a word next to its shape: healthy, degraded, impaired.',
      'Offer a table of the same content for screen readers and print.',
      'Show the escalation factor under the barrier it can defeat, with its control.',
    ],
    avoid: [
      'Showing a path as safe because it has many barriers when most of them are degraded.',
      'Colour as the only sign of barrier health.',
      'Hiding the weakened paths in a large diagram: give people a filter.',
      'Putting barrier detail in a tooltip; open it in a panel people can read and keep.',
    ],
  },
  source,
  sections: [
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces a bow-tie is built from.',
      specimens: [
        {
          id: 'BowTieThreatCard',
          title: 'Threat card',
          note: 'Pick it for one threat: its prevention barriers in order and the weakest state on the path.',
          origin: 'custom',
          uses: ['industrial/safety/bowTieLayout.ts', 'industrial/domains/safety.ts'],
          size: 'sm',
          align: 'stretch',
          Component: BowTieThreatCard,
        },
        {
          id: 'BowTieConsequenceCard',
          title: 'Consequence card',
          note: 'Pick it for one consequence: what it means, its severity and how many mitigation barriers stand against it.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'sm',
          align: 'stretch',
          Component: BowTieConsequenceCard,
        },
        {
          id: 'BowTieEscalationFactor',
          title: 'Escalation factor',
          note: 'Pick it for the condition that can defeat a barrier, with the barrier it threatens and its control.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: BowTieEscalationFactor,
        },
        {
          id: 'BowTieBarrierTypes',
          title: 'Barrier type icons',
          note: 'Pick it as the key to barrier types: engineered, procedural and human, each with one icon and one word.',
          origin: 'custom',
          uses: ['industrial/safety/BarrierTypeMark.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BowTieBarrierTypes,
        },
        {
          id: 'BowTieLegend',
          title: 'Barrier health legend',
          note: 'Pick it beside a diagram: the three states, their shapes and what each one means.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BowTieLegend,
        },
        {
          id: 'BowTieBarrierStates',
          title: 'Barrier card states',
          note: 'Pick it to compare a healthy, a degraded and an impaired barrier: only the weakened ones list what is wrong.',
          origin: 'custom',
          uses: ['industrial/safety/BarrierCard.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BowTieBarrierStates,
        },
        {
          id: 'BowTieBarrierCardDetail',
          title: 'Barrier detail',
          note: 'Pick it for the panel that opens from a diagram: owner, last test, standard, impairments and work orders.',
          origin: 'custom',
          uses: ['industrial/safety/BarrierCard.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BowTieBarrierCardDetail,
        },
        {
          id: 'BowTiePathDetail',
          title: 'One path in sequence',
          note: 'Pick it to read a single path without the diagram: barriers in the order the event meets them.',
          origin: 'custom',
          uses: ['industrial/safety/BarrierTypeMark.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'md',
          align: 'stretch',
          Component: BowTiePathDetail,
        },
      ],
    },
    {
      id: 'variants',
      title: 'Diagram variants',
      description: 'The same model drawn for different places.',
      specimens: [
        {
          id: 'BowTieSimple',
          title: 'Single-threat bow-tie',
          note: 'Pick it to explain the method or to work through one scenario: one threat and one consequence.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'full',
          align: 'stretch',
          Component: BowTieSimple,
        },
        {
          id: 'BowTieCompact',
          title: 'Compact bow-tie in a card',
          note: 'Pick it on a dashboard: barriers shrink to state marks and the names live in the summary table.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: BowTieCompact,
        },
        {
          id: 'BowTieDark',
          title: 'Dark scope',
          note: 'Pick it for a control-room wall display: the same drawing on a dark surface.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BowTieDark,
        },
        {
          id: 'BowTieEmptyFilter',
          title: 'Nothing weakened',
          note: 'Pick it for the empty state of the weakened-paths filter: say that nothing is weak, not that nothing is there.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'md',
          align: 'stretch',
          Component: BowTieEmptyFilter,
        },
        {
          id: 'BowTieFilterToggle',
          title: 'Weakened-paths filter',
          note: 'Pick it as the control above a large diagram: it says how many paths are shown.',
          origin: 'custom',
          uses: ['industrial/safety/bowTieLayout.ts'],
          size: 'sm',
          align: 'stretch',
          Component: BowTieFilterToggle,
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Reading the barriers',
      description: 'Tables and indicators that complement the drawing.',
      specimens: [
        {
          id: 'BowTieSummaryTable',
          title: 'Summary table',
          note: 'Pick it for screen readers and print: every path with its barriers in order and its weakest state.',
          origin: 'custom',
          uses: ['industrial/safety/bowTieLayout.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BowTieSummaryTable,
        },
        {
          id: 'BowTieCoverage',
          title: 'Barrier coverage matrix',
          note: 'Pick it to find barriers that carry many paths: threats or consequences against barriers.',
          origin: 'custom',
          uses: ['industrial/safety/bowTieLayout.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BowTieCoverage,
        },
        {
          id: 'BowTiePathStrength',
          title: 'Protection left per path',
          note: 'Pick it to see which paths depend on a single healthy barrier.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'md',
          align: 'stretch',
          Component: BowTiePathStrength,
        },
        {
          id: 'BowTieCumulative',
          title: 'Cumulative risk indicator',
          note: 'Pick it for the overall picture: healthy barriers of all, by state, and the paths that rely on one.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: BowTieCumulative,
        },
        {
          id: 'BowTieBarrierList',
          title: 'Barriers by type',
          note: 'Pick it to review one kind of barrier at a time: engineered, procedural or human.',
          origin: 'custom',
          uses: ['industrial/safety/bowTieLayout.ts'],
          size: 'md',
          align: 'stretch',
          Component: BowTieBarrierList,
        },
        {
          id: 'BowTieTestSchedule',
          title: 'Barrier test schedule',
          note: 'Pick it to see when each barrier was last proven and when it is next due.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BowTieTestSchedule,
        },
        {
          id: 'BowTieImpairments',
          title: 'Impairment log',
          note: 'Pick it for the weakened barriers only, each with what is wrong.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BowTieImpairments,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A working bow-tie and an overview.',
      specimens: [
        {
          id: 'BowTieFull',
          title: 'Interactive bow-tie',
          note: 'Pick it for the working diagram: hover a barrier to pick out its path, select it for detail, filter to weakened paths.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx', 'industrial/safety/BarrierCard.tsx', 'industrial/safety/bowTieLayout.ts'],
          size: 'full',
          align: 'stretch',
          Component: BowTieFull,
        },
        {
          id: 'BowTieOverview',
          title: 'Bow-tie overview',
          note: 'Pick it as the top of a barrier management page: counts by state, the compact diagram and the summary table.',
          origin: 'custom',
          uses: ['industrial/safety/BowTieDiagram.tsx', 'industrial/safety/bowTieLayout.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BowTieOverview,
        },
      ],
    },
  ],
});
