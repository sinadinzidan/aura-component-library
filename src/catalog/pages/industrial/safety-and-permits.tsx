import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { IconLock } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { BarrierStatus } from '../../../library/industrial/domains/BarrierStatus';
import type { Barrier } from '../../../library/industrial/domains/BarrierStatus';
import { PermitCard } from '../../../library/industrial/domains/PermitCard';
import { RiskMatrix } from '../../../library/industrial/domains/RiskMatrix';
import type { RiskCell } from '../../../library/industrial/domains/RiskMatrix';
import { PERMIT_STATES, gasReadingTone, permitStatus } from '../../../library/industrial/domains/safety';
import type { PermitState } from '../../../library/industrial/domains/safety';
import { StageFlow } from '../../../library/industrial/domains/StageFlow';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Severity, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './safety-and-permits.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type Permit = {
  permitId: string;
  type: string;
  title: string;
  state: PermitState;
  area: string;
  location: string;
  assetTag: string;
  validFrom: string;
  validTo: string;
  holder: string;
  issuer: string;
};

const PERMITS: readonly Permit[] = [
  { permitId: 'PTW-26-0418', type: 'Hot work', title: 'Weld repair on drain line, interstage cooler', state: 'active', area: 'Gas compression', location: 'Gas compression, level 2', assetTag: '23-HA-9114', validFrom: '12 Mar, 07:00', validTo: '12 Mar, 19:00', holder: 'Tomás Barros', issuer: 'Liv Wold' },
  { permitId: 'PTW-26-0415', type: 'Work at height', title: 'Vibration survey, 1st stage compressor', state: 'approved', area: 'Gas compression', location: 'Gas compression, level 1', assetTag: '23-KA-9101', validFrom: '13 Mar, 07:00', validTo: '13 Mar, 15:00', holder: 'Aisha Khan', issuer: 'Liv Wold' },
  { permitId: 'PTW-26-0421', type: 'Confined space entry', title: 'Internal inspection, test separator', state: 'suspended', area: 'Inlet and separation', location: 'Inlet and separation, ground level', assetTag: '20-VA-1002', validFrom: '12 Mar, 08:00', validTo: '12 Mar, 18:00', holder: 'Jonas Nyberg', issuer: 'Liv Wold' },
  { permitId: 'PTW-26-0409', type: 'Cold work', title: 'Calibrate separator level transmitter', state: 'closed', area: 'Inlet and separation', location: 'Inlet and separation, ground level', assetTag: '20-VA-1001', validFrom: '11 Mar, 09:00', validTo: '11 Mar, 13:00', holder: 'Jonas Nyberg', issuer: 'Magnus Solberg' },
  { permitId: 'PTW-26-0423', type: 'Cold work', title: 'Replace bearing temperature transmitter', state: 'requested', area: 'Cooling water', location: 'Cooling water pump house', assetTag: '40-PA-4001', validFrom: '13 Mar, 08:00', validTo: '13 Mar, 12:00', holder: 'Jonas Nyberg', issuer: 'Not yet issued' },
  { permitId: 'PTW-26-0422', type: 'Electrical work', title: 'Motor inspection, export pump B', state: 'approved', area: 'Gas export', location: 'Export pump hall', assetTag: '27-PA-2001B', validFrom: '14 Mar, 07:00', validTo: '14 Mar, 16:00', holder: 'Tomás Barros', issuer: 'Magnus Solberg' },
];

const HOT_WORK = PERMITS[0];
const CONFINED_SPACE = PERMITS[2];

const PERMIT_STATE_MEANING: Record<PermitState, string> = {
  requested: 'Submitted by the performing technician. No work may start.',
  approved: 'Signed by the area authority. Work starts when the permit is issued at the work site.',
  active: 'Issued and accepted at the work site. Work is in progress under the stated conditions.',
  suspended: 'Work is stopped and the site made safe. The permit must be revalidated before work resumes.',
  closed: 'Work is complete, the site is handed back and isolations are removed.',
};

type IsolationPoint = {
  point: number;
  tag: string;
  description: string;
  method: string;
  lock: string;
  state: { tone: Tone; label: string; shape: DotShape };
  by: string;
};

const VERIFIED = { tone: 'success', label: 'Locked and verified', shape: 'dot' } as const;

const ISOLATION_POINTS: readonly IsolationPoint[] = [
  { point: 1, tag: '23-HV-9141', description: 'Cooler inlet block valve', method: 'Closed, locked and tagged', lock: 'L-0417', state: VERIFIED, by: 'Applied IH · verified LW' },
  { point: 2, tag: '23-HV-9142', description: 'Cooler outlet block valve', method: 'Closed, locked and tagged', lock: 'L-0418', state: VERIFIED, by: 'Applied IH · verified LW' },
  { point: 3, tag: '23-HV-9145', description: 'Drain to closed drain system', method: 'Open, locked and tagged', lock: 'L-0419', state: VERIFIED, by: 'Applied IH · verified LW' },
  { point: 4, tag: '23-SP-9143', description: 'Spectacle blind, drain line', method: 'Turned to closed', lock: 'L-0420', state: { tone: 'warning', label: 'Applied, not verified', shape: 'square' }, by: 'Applied IH · awaiting second person' },
];

type GasReading = { gas: string; value: number; unit: string; decimals: number; limits: { min?: number; max?: number }; limitText: string };

const GAS_TEST: readonly GasReading[] = [
  { gas: 'Oxygen', value: 20.9, unit: '%', decimals: 1, limits: { min: 19.5, max: 23.5 }, limitText: '19.5 to 23.5' },
  { gas: 'Flammable gas', value: 0, unit: '% LEL', decimals: 0, limits: { max: 1 }, limitText: 'Below 1' },
  { gas: 'Hydrogen sulphide', value: 0, unit: 'ppm', decimals: 0, limits: { max: 5 }, limitText: 'Below 5' },
  { gas: 'Carbon monoxide', value: 2, unit: 'ppm', decimals: 0, limits: { max: 25 }, limitText: 'Below 25' },
];

const BARRIERS: readonly Barrier[] = [
  { id: 'containment', name: 'Process containment', kind: 'Prevention', state: 'healthy' },
  { id: 'psv', name: 'Pressure relief', kind: 'Prevention', state: 'healthy' },
  { id: 'esd', name: 'Emergency shutdown', kind: 'Control', state: 'healthy' },
  { id: 'gas-detection', name: 'Gas detection', kind: 'Detection', state: 'degraded', note: '2 of 14 detectors inhibited for hot work. Continuous gas monitoring at the work site.' },
  { id: 'ignition', name: 'Ignition source control', kind: 'Prevention', state: 'degraded', note: 'Hot work permit PTW-26-0418 active in the area.' },
  { id: 'deluge', name: 'Active fire protection', kind: 'Mitigation', state: 'impaired', note: 'Fire pump B failed its start test. Pump A carries the duty alone until repair.' },
];

type SafetyElement = { tag: string; name: string; test: string; lastTest: string; nextDue: string; state: { tone: Tone; label: string; shape: DotShape } };

const SAFETY_ELEMENTS: readonly SafetyElement[] = [
  { tag: '71-PA-7001B', name: 'Fire pump B', test: 'Weekly start test', lastTest: '11 Mar', nextDue: 'after repair', state: { tone: 'critical', label: 'Failed', shape: 'diamond' } },
  { tag: '27-PA-2001B', name: 'Export pump B', test: 'Standby start test', lastTest: '6 Feb', nextDue: '8 Mar', state: { tone: 'critical', label: 'Overdue 4 d', shape: 'diamond' } },
  { tag: '23-PSV-9120', name: 'Compressor discharge relief valve', test: 'Recertification', lastTest: '30 Mar 2024', nextDue: '30 Mar', state: { tone: 'warning', label: 'Due in 18 d', shape: 'square' } },
  { tag: '20-XV-1105', name: 'Inlet shutdown valve', test: 'Partial stroke test', lastTest: '10 Mar', nextDue: '10 Jun', state: { tone: 'success', label: 'Passed', shape: 'dot' } },
  { tag: '23-GD-9150', name: 'Gas detectors, compression', test: 'Function test', lastTest: '2 Mar', nextDue: '2 Apr', state: { tone: 'success', label: 'Passed', shape: 'dot' } },
];

type Incident = { id: string; title: string; severity: Severity; classification: string; when: string; location: string; status: string };

const INCIDENTS: readonly Incident[] = [
  { id: 'INC-2026-011', title: 'Recompressor tripped on high vibration', severity: 'medium', classification: 'Process safety event, tier 3', when: '12 Mar, 13:46', location: 'Gas compression', status: 'Under investigation' },
  { id: 'INC-2026-009', title: 'Dropped spanner from scaffold, no one below', severity: 'low', classification: 'Near miss', when: '4 Mar, 10:12', location: 'Gas export', status: 'Actions in progress' },
  { id: 'INC-2025-031', title: 'Hand laceration during valve maintenance', severity: 'high', classification: 'Recordable injury, medical treatment', when: '6 Aug 2025, 14:30', location: 'Inlet and separation', status: 'Closed' },
];

const TOOLBOX_ITEMS = [
  { id: 'scope', label: 'Scope and work steps reviewed', description: 'Everyone can say what is being done and in what order.' },
  { id: 'isolation', label: 'Isolations walked and verified', description: 'IC-2291: four points checked at the equipment.' },
  { id: 'gas', label: 'Gas test valid', description: 'Last test 13:00. Retest every 2 hours.' },
  { id: 'fire-watch', label: 'Fire watch named and equipped', description: 'Stays for 60 minutes after the last hot work.' },
  { id: 'ppe', label: 'Protective equipment checked', description: 'Welding screen, flame-retardant coveralls, hearing protection.' },
  { id: 'emergency', label: 'Escape route and muster station agreed', description: 'Muster station B, east stair.' },
];

const APPROVAL_STAGES = [
  { id: 'requested', label: 'Requested by Tomás Barros', detail: 'Performing technician · signed 11 Mar, 15:20' },
  { id: 'approved', label: 'Approved by Liv Wold', detail: 'Area authority · signed 11 Mar, 17:05' },
  { id: 'issued', label: 'Issued at the work site by Ingrid Haugen', detail: 'Control room operator · signed 12 Mar, 06:55' },
  { id: 'accepted', label: 'Accepted by Tomás Barros', detail: 'Permit holder · signed 12 Mar, 07:00' },
  { id: 'closed', label: 'Hand-back and closure', detail: 'Permit holder and area authority' },
];

const MUSTER_STATIONS = [
  { station: 'Muster station A · control building', expected: 22, accounted: 22 },
  { station: 'Muster station B · east stair', expected: 18, accounted: 16 },
  { station: 'Muster station C · jetty', expected: 6, accounted: 6 },
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

function SafetyPermitCardActive() {
  return (
    <PermitCard
      {...HOT_WORK}
      conditions={['Isolation certificate IC-2291', 'Gas test every 2 h', 'Fire watch for 60 min after work', 'Detectors 23-GD-9153/54 inhibited']}
      actions={
        <>
          <Button variant="ghost" size="sm">
            Suspend permit
          </Button>
          <Button variant="secondary" size="sm">
            Close permit
          </Button>
        </>
      }
    />
  );
}

function SafetyPermitCardSuspended() {
  return (
    <PermitCard
      {...CONFINED_SPACE}
      stateNote="Suspended at 13:46 on general alarm. The vessel was vacated and the entry point barred. A new gas test is required before the permit can be revalidated."
      conditions={['Standby person at entry', 'Continuous gas monitoring', 'Rescue plan RP-014']}
      actions={
        <Button variant="secondary" size="sm">
          Revalidate permit
        </Button>
      }
    />
  );
}

function SafetyPermitStates() {
  return (
    <Panel title="Permit states">
      <dl className="flex flex-col gap-3">
        {PERMIT_STATES.map((state) => (
          <div key={state} className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-x-4">
            <dt>
              <StatusIndicator variant="badge" {...permitStatus(state)} />
            </dt>
            <dd className="text-sm text-medium-foreground">{PERMIT_STATE_MEANING[state]}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function SafetyPermitStateFlow() {
  return (
    <Panel title="Permit life cycle" meta={<span className="font-mono">PTW-26-0421</span>}>
      <StageFlow
        label="Permit PTW-26-0421 life cycle"
        stages={[
          { id: 'requested', label: 'Requested', detail: '11 Mar, 14:10' },
          { id: 'approved', label: 'Approved', detail: '11 Mar, 16:40' },
          { id: 'active', label: 'Active', detail: '12 Mar, 08:00' },
          { id: 'closed', label: 'Closed' },
        ]}
        current="active"
        currentTone="warning"
        currentNote="Suspended 12 Mar, 13:46"
      />
      <p className="text-xs text-muted-foreground">A suspension is not a stage of its own: the permit stays where it was and returns to active only after revalidation.</p>
    </Panel>
  );
}

function SafetyPermitListByArea() {
  const areas = [...new Set(PERMITS.map((permit) => permit.area))];
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Permits to work by area" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Permit
            </th>
            <th scope="col" className={TH}>
              Job
            </th>
            <th scope="col" className={TH}>
              Equipment
            </th>
            <th scope="col" className={TH}>
              Holder
            </th>
            <th scope="col" className={TH}>
              Valid
            </th>
            <th scope="col" className={TH}>
              State
            </th>
          </tr>
        </thead>
        {areas.map((area) => {
          const rows = PERMITS.filter((permit) => permit.area === area);
          const live = rows.filter((permit) => permit.state === 'active' || permit.state === 'suspended').length;
          return (
            <tbody key={area}>
              <tr className="border-t border-default bg-muted-background">
                <th scope="colgroup" colSpan={6} className="px-3 py-1.5 text-left text-xs font-medium text-medium-foreground">
                  {area}
                  <span className="pl-2 font-normal text-muted-foreground tabular-nums">
                    {rows.length} {rows.length === 1 ? 'permit' : 'permits'} · {live} live
                  </span>
                </th>
              </tr>
              {rows.map((permit) => (
                <tr key={permit.permitId} className="border-t border-default">
                  <td className={`${TD} whitespace-nowrap`}>
                    <span className="font-mono text-xs text-base-foreground">{permit.permitId}</span>
                    <span className="block text-xs text-muted-foreground">{permit.type}</span>
                  </td>
                  <td className={`${TD} text-base-foreground`}>{permit.title}</td>
                  <td className={`${TD} whitespace-nowrap font-mono text-xs text-medium-foreground`}>{permit.assetTag}</td>
                  <td className={`${TD} whitespace-nowrap text-medium-foreground`}>{permit.holder}</td>
                  <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>
                    {permit.validFrom}
                    <span className="block text-xs text-muted-foreground">to {permit.validTo}</span>
                  </td>
                  <td className={TD}>
                    <StatusIndicator size="sm" {...permitStatus(permit.state)} />
                  </td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function IsolationPointRow({ point }: { point: IsolationPoint }) {
  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3">
      <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">{point.point}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-x-2 text-sm text-base-foreground">
          {point.description}
          <span className="font-mono text-xs text-muted-foreground">{point.tag}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconLock aria-hidden="true" className="size-3.5" />
            <span className="font-mono">{point.lock}</span>
          </span>
          {point.method} · {point.by}
        </span>
      </div>
      <StatusIndicator size="sm" className="pt-0.5" {...point.state} />
    </div>
  );
}

function SafetyPermitIsolationRow() {
  return (
    <Card role="group" aria-label="Isolation point 1 of certificate IC-2291" className="w-full min-w-0">
      <IsolationPointRow point={ISOLATION_POINTS[0]} />
    </Card>
  );
}

function SafetyPermitIsolationCertificate() {
  const verified = ISOLATION_POINTS.filter((point) => point.state.tone === 'success').length;
  return (
    <Card role="group" aria-label="Isolation certificate IC-2291" className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Isolation certificate <span className="font-mono text-base-foreground">IC-2291</span>
        </span>
        <StatusIndicator variant="badge" tone="warning" label="Not complete" />
      </div>
      <div className="flex flex-col gap-1.5">
        <LinearGauge label="Lock-out points verified" value={verified} max={ISOLATION_POINTS.length} size="sm" showHeader={false} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {verified} of {ISOLATION_POINTS.length} lock-out points verified · protects PTW-26-0418
        </span>
      </div>
      <ol aria-label="Isolation points" className="flex flex-col gap-3">
        {ISOLATION_POINTS.map((point) => (
          <li key={point.point}>
            <IsolationPointRow point={point} />
          </li>
        ))}
      </ol>
    </Card>
  );
}

function SafetyPermitSimopsNotice() {
  return (
    <div className="w-full">
      <Alert variant="warning">
        <AlertTitle>Simultaneous operations conflict</AlertTitle>
        <AlertDescription>
          Hot work under PTW-26-0418 is planned within 15 m of crane lift LP-0087 over the interstage cooler, 12 Mar 14:00 to 15:30. Both cannot proceed at the same time. The area
          authority must decide which goes first.
        </AlertDescription>
        <AlertActions>
          <AlertButton>Review both jobs</AlertButton>
          <AlertButton variant="ghost">Show on plot plan</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function SafetyPermitGasTest() {
  return (
    <Panel title="Gas test" meta="12 Mar, 13:00 · at the work site">
      <table aria-label="Gas test readings against limits" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Gas
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Reading
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Acceptable
            </th>
            <th scope="col" className={`${TH} pr-0`}>
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {GAS_TEST.map((reading) => {
            const tone = gasReadingTone(reading.value, reading.limits);
            return (
              <tr key={reading.gas} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {reading.gas}
                </th>
                <td className={`${TD} text-right`}>
                  <ValueReadout size="xs" value={reading.value} unit={reading.unit} decimals={reading.decimals} tone={tone} />
                </td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums text-medium-foreground`}>{reading.limitText}</td>
                <td className={`${TD} pr-0`}>
                  {tone === 'critical' ? (
                    <StatusIndicator size="sm" tone="critical" shape="diamond" label="Not acceptable" />
                  ) : (
                    <StatusIndicator size="sm" tone="success" label="Acceptable" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-default pt-3 text-xs text-muted-foreground">
        <span>
          Tested by Jonas Nyberg · detector <span className="font-mono">GD-PORT-07</span>, calibrated 3 Mar
        </span>
        <span className="tabular-nums text-base-foreground">Next test due 15:00</span>
      </div>
    </Panel>
  );
}

function SafetyPermitBarrierPanel() {
  return (
    <Card className="w-full min-w-0">
      <BarrierStatus title="Loss of containment, gas compression" barriers={BARRIERS} />
    </Card>
  );
}

function SafetyPermitSceList() {
  return (
    <Panel title="Safety-critical elements" meta="Worst first">
      <ul className="flex flex-col gap-3">
        {SAFETY_ELEMENTS.map((element) => (
          <li key={element.tag} className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-x-2 text-sm text-base-foreground">
                {element.name}
                <span className="font-mono text-xs text-muted-foreground">{element.tag}</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {element.test} · last {element.lastTest} · next {element.nextDue}
              </span>
            </div>
            <StatusIndicator size="sm" className="pt-0.5" {...element.state} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SafetyPermitDaysSinceIncident() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile label="Days since recordable incident" value={PLANT_KPIS.daysSinceIncident.value} unit="d" footnote="Last: 6 Aug 2025, hand laceration during valve maintenance. Longest run 412 d." />
    </div>
  );
}

function SafetyPermitPob() {
  return (
    <Card role="group" aria-label="Personnel on site" className="w-full max-w-72 self-center gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Personnel on site</span>
        <span className="text-xs text-muted-foreground tabular-nums">Updated 13:58</span>
      </div>
      <div className="flex items-baseline gap-2">
        <ValueReadout size="md" value={46} />
        <span className="text-xs text-muted-foreground tabular-nums">of 60 lifeboat places</span>
      </div>
      <LinearGauge showHeader={false} size="sm" label="Personnel on site against lifeboat capacity" value={46} max={60} />
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-medium-foreground">Day shift</dt>
          <dd className="tabular-nums text-base-foreground">28</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-medium-foreground">Night shift, resting</dt>
          <dd className="tabular-nums text-base-foreground">12</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-medium-foreground">Contractors and visitors</dt>
          <dd className="tabular-nums text-base-foreground">6</dd>
        </div>
      </dl>
    </Card>
  );
}

function SafetyPermitObservationCard() {
  return (
    <Card role="group" aria-label="Safety observation OBS-2026-0214" className="w-full max-w-80 self-center gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Observation <span className="font-mono text-base-foreground">OBS-2026-0214</span>
        </span>
        <StatusIndicator size="sm" tone="info" shape="ring" label="Action assigned" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-medium-foreground">Unsafe condition</span>
        <p className="text-sm text-base-foreground">Grating panel loose on the walkway above the interstage cooler. Barrier tape put up, panel not yet secured.</p>
      </div>
      <div className="flex items-center gap-2">
        <PersonAvatar name="Ingrid Haugen" sizes="xsm" />
        <span className="text-xs text-muted-foreground tabular-nums">Ingrid Haugen · 12 Mar, 11:20 · Gas compression, level 2</span>
      </div>
      <span className="border-t border-default pt-3 text-xs text-muted-foreground">Assigned to Tomás Barros, due 13 Mar.</span>
    </Card>
  );
}

function SafetyPermitIncidentRows() {
  return (
    <Panel title="Incident reports" meta="Latest first">
      <ul className="flex flex-col">
        {INCIDENTS.map((incident, index) => (
          <li
            key={incident.id}
            className={`flex items-start justify-between gap-4 py-3 ${index === 0 ? 'pt-0' : 'border-t border-default'} ${index === INCIDENTS.length - 1 ? 'pb-0' : ''}`}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-base-foreground">{incident.title}</span>
              <span className="text-xs text-muted-foreground">{incident.classification}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                <span className="font-mono">{incident.id}</span>
                {incident.when} · {incident.location}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <SeverityBadge severity={incident.severity} />
              <span className="text-xs text-muted-foreground">{incident.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SafetyPermitMusterStatus() {
  const expected = MUSTER_STATIONS.reduce((sum, row) => sum + row.expected, 0);
  const accounted = MUSTER_STATIONS.reduce((sum, row) => sum + row.accounted, 0);
  return (
    <Card role="group" aria-label="Muster status" className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">Muster in progress</h3>
          <span className="text-xs text-muted-foreground tabular-nums">General alarm 13:46 · 12 min elapsed</span>
        </div>
        <StatusIndicator variant="badge" tone="critical" label={`${expected - accounted} not accounted for`} />
      </div>
      <div className="flex items-baseline gap-2">
        <ValueReadout size="lg" value={accounted} />
        <span className="text-sm text-muted-foreground tabular-nums">of {expected} accounted for</span>
      </div>
      <ul aria-label="Muster stations" className="flex flex-col gap-2 text-sm">
        {MUSTER_STATIONS.map((row) => (
          <li key={row.station} className="flex items-center justify-between gap-3">
            <span className="text-medium-foreground">{row.station}</span>
            <span className={`tabular-nums ${row.accounted < row.expected ? 'font-medium text-critical-foreground-strong' : 'text-base-foreground'}`}>
              {row.accounted} of {row.expected}
              {row.accounted < row.expected ? ` · ${row.expected - row.accounted} missing` : ''}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 border-t border-default pt-3">
        <span className="text-xs font-medium text-medium-foreground">Not accounted for</span>
        <ul className="flex flex-col gap-1 text-sm">
          <li className="flex flex-wrap justify-between gap-x-3">
            <span className="text-base-foreground">Tomás Barros</span>
            <span className="text-xs text-muted-foreground tabular-nums">Last badge read 13:41 · Gas compression, level 2</span>
          </li>
          <li className="flex flex-wrap justify-between gap-x-3">
            <span className="text-base-foreground">Jonas Nyberg</span>
            <span className="text-xs text-muted-foreground tabular-nums">Last badge read 13:44 · Inlet and separation</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}

function SafetyPermitRiskMatrix() {
  const [risk, setRisk] = useState<RiskCell | null>(null);
  return (
    <Panel title="Risk assessment" meta="Weld repair on drain line">
      <RiskMatrix label="Assessed risk" value={risk} onChange={setRisk} />
    </Panel>
  );
}

function SafetyPermitRiskResidual() {
  return (
    <Panel title="Risk after controls" meta="Weld repair on drain line">
      <RiskMatrix label="Residual risk" value={{ likelihood: 2, consequence: 3 }} reference={{ likelihood: 4, consequence: 4, label: 'Initial risk, before controls' }} readOnly />
    </Panel>
  );
}

function SafetyPermitToolboxTalk() {
  const [confirmed, setConfirmed] = useState<readonly string[]>(['scope', 'isolation', 'gas', 'ppe']);
  const remaining = TOOLBOX_ITEMS.length - confirmed.length;
  const toggle = (id: string, checked: boolean) => setConfirmed((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));
  return (
    <Panel title="Toolbox talk" meta={`${confirmed.length} of ${TOOLBOX_ITEMS.length} confirmed`}>
      <CheckboxGroup aria-label="Toolbox talk checklist" className="gap-3">
        {TOOLBOX_ITEMS.map((item) => (
          <CheckboxItem key={item.id}>
            <CheckboxItemControl checked={confirmed.includes(item.id)} onCheckedChange={(checked) => toggle(item.id, checked)} />
            <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{item.description}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground">{remaining === 0 ? 'All points confirmed by the work party.' : `Confirm ${remaining} more ${remaining === 1 ? 'point' : 'points'} before work can start.`}</span>
        <Button size="sm" disabled={remaining > 0}>
          Record toolbox talk
        </Button>
      </div>
    </Panel>
  );
}

function SafetyPermitApprovalChain() {
  return (
    <Panel title="Approval chain" meta={<span className="font-mono">PTW-26-0418</span>}>
      <StageFlow orientation="vertical" label="Approval chain for permit PTW-26-0418" stages={APPROVAL_STAGES} current="closed" />
      <p className="text-xs text-muted-foreground">Each signature is the signer’s own sign-in, time-stamped. A permit cannot be approved by the person who requested it.</p>
    </Panel>
  );
}

function SafetyPermitDetail() {
  return (
    <Card className="w-full min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {HOT_WORK.type} permit <span className="font-mono text-base-foreground">{HOT_WORK.permitId}</span>
          </span>
          <h3 className="text-base font-semibold text-base-foreground">{HOT_WORK.title}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {HOT_WORK.location} · <span className="font-mono">{HOT_WORK.assetTag}</span> · valid {HOT_WORK.validFrom} to {HOT_WORK.validTo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator variant="badge" {...permitStatus(HOT_WORK.state)} />
          <Button variant="secondary" size="sm">
            Suspend permit
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section aria-label="Gas test" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-xs font-medium text-muted-foreground">Gas test, 13:00</h4>
            <span className="text-xs tabular-nums text-base-foreground">Next due 15:00</span>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {GAS_TEST.map((reading) => (
              <div key={reading.gas} className="grid grid-cols-[minmax(0,1fr)_auto_4.5rem] items-baseline gap-x-3">
                <dt className="text-medium-foreground">{reading.gas}</dt>
                <dd className="text-right text-xs text-muted-foreground tabular-nums">{reading.limitText.toLowerCase()}</dd>
                <dd className="text-right">
                  <ValueReadout size="xs" value={reading.value} unit={reading.unit} decimals={reading.decimals} tone={gasReadingTone(reading.value, reading.limits)} />
                </dd>
              </div>
            ))}
          </dl>
          <StatusIndicator size="sm" tone="success" label="All readings acceptable" />
        </section>
        <section aria-label="Isolations" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-xs font-medium text-muted-foreground">
              Isolation certificate <span className="font-mono">IC-2291</span>
            </h4>
            <span className="text-xs tabular-nums text-base-foreground">3 of 4 verified</span>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {ISOLATION_POINTS.map((point) => (
              <li key={point.point} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-xs text-medium-foreground">{point.tag}</span>
                  <span className="truncate text-xs text-muted-foreground">{point.lock}</span>
                </span>
                <StatusIndicator size="sm" {...point.state} />
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Signatures" className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Signatures</h4>
          <StageFlow orientation="vertical" label="Approval chain" stages={APPROVAL_STAGES.map((stage) => ({ ...stage, detail: stage.detail.split(' · ')[1] ?? stage.detail }))} current="closed" />
        </section>
      </div>
    </Card>
  );
}

function SafetyPermitOverview() {
  const counts = PERMIT_STATES.map((state) => ({ state, count: PERMITS.filter((permit) => permit.state === state).length }));
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Days since recordable incident" value={PLANT_KPIS.daysSinceIncident.value} unit="d" footnote="Last: 6 Aug 2025" />
        <KpiTile label="Personnel on site" value={46} footnote="Capacity 60 · updated 13:58" />
        <KpiTile label="Live permits" value={2} status={{ tone: 'warning', label: '1 suspended', shape: 'square' }} footnote="1 hot work · 1 confined space entry" />
        <KpiTile label="Impaired barriers" value={1} tone="critical" status={{ tone: 'critical', label: 'Fire protection', shape: 'diamond' }} footnote="2 more degraded" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Permits by state" meta={`${PERMITS.length} permits this week`}>
          <ul className="flex flex-col gap-2.5">
            {counts.map((entry) => (
              <li key={entry.state} className="flex items-center justify-between gap-3">
                <StatusIndicator {...permitStatus(entry.state)} />
                <span className="text-sm font-medium tabular-nums text-base-foreground">{formatValue(entry.count, 0)}</span>
              </li>
            ))}
          </ul>
          <div className="w-full">
            <Alert variant="warning">
              <AlertTitle>PTW-26-0421 is suspended</AlertTitle>
              <AlertDescription>Confined space entry in the test separator stopped at 13:46 on general alarm. A new gas test is required before revalidation.</AlertDescription>
            </Alert>
          </div>
        </Panel>
        <Card className="min-w-0">
          <BarrierStatus title="Loss of containment, gas compression" barriers={BARRIERS} />
        </Card>
      </div>
    </div>
  );
}

export default definePage({
  id: 'safety-and-permits',
  title: 'Safety and permits',
  summary:
    'The kit for a control-of-work and process safety app: permits to work and their states, isolations, gas tests, barrier health, incidents and the people on site. Wording is exact and states are always written out, because these screens are read before someone opens a vessel or strikes an arc.',
  guidance: {
    use: [
      'Write every state as a word next to its mark: active, suspended, impaired, not verified.',
      'Show the reason with any exception: why a permit is suspended, what compensates for a weakened barrier.',
      'Print limits next to gas readings and say when the next test is due.',
      'Name people and times on every signature, isolation and verification.',
    ],
    avoid: [
      'Green as a summary of safety; only a specific, verified state is shown as healthy.',
      'Celebrating figures such as days without incident; show the number and the last event.',
      'Icons or colour without text for anything that decides whether work may proceed.',
      'Letting a primary button start work while a checklist, gas test or isolation is incomplete.',
    ],
  },
  source,
  sections: [
    {
      id: 'permits',
      title: 'Permits to work',
      description: 'One permit, its states, and all permits across the plant.',
      specimens: [
        {
          id: 'SafetyPermitCardActive',
          title: 'Permit-to-work card',
          note: 'Pick it for one permit: type, job, location, validity, holder and the conditions it runs under.',
          origin: 'custom',
          uses: ['industrial/domains/PermitCard.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitCardActive,
        },
        {
          id: 'SafetyPermitCardSuspended',
          title: 'Suspended permit',
          note: 'Pick it to see an exception: the card states why work stopped and what is needed to resume.',
          origin: 'custom',
          uses: ['industrial/domains/PermitCard.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitCardSuspended,
        },
        {
          id: 'SafetyPermitStates',
          title: 'Permit states',
          note: 'Pick it as the legend for a permit system: the five states, each with what it allows.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitStates,
        },
        {
          id: 'SafetyPermitStateFlow',
          title: 'Permit life cycle',
          note: 'Pick it on a permit page to show how far the permit has come and where it is held.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitStateFlow,
        },
        {
          id: 'SafetyPermitListByArea',
          title: 'Permit list by area',
          note: 'Pick it for the area authority: every permit grouped by area, with the count of live ones per area.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SafetyPermitListByArea,
        },
      ],
    },
    {
      id: 'isolations',
      title: 'Isolations, conflicts and gas tests',
      description: 'What makes the work site safe before the permit is issued.',
      specimens: [
        {
          id: 'SafetyPermitIsolationRow',
          title: 'Isolation point',
          note: 'Pick it for one lock-out point: what is isolated, how, which lock, and who applied and verified it.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitIsolationRow,
        },
        {
          id: 'SafetyPermitIsolationCertificate',
          title: 'Isolation certificate',
          note: 'Pick it for the full lock-out, tag-out list of a job, with how many points a second person has verified.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/LinearGauge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitIsolationCertificate,
        },
        {
          id: 'SafetyPermitSimopsNotice',
          title: 'Simultaneous-operations conflict',
          note: 'Pick it when two jobs overlap in place and time: it names both, the overlap and who decides.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitSimopsNotice,
        },
        {
          id: 'SafetyPermitGasTest',
          title: 'Gas test readings',
          note: 'Pick it for a gas test record: each reading beside its acceptable range, with tester, instrument and next test.',
          origin: 'custom',
          uses: ['industrial/domains/safety.ts', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitGasTest,
        },
      ],
    },
    {
      id: 'barriers',
      title: 'Barriers and safety-critical elements',
      description: 'Whether the things that stand between a hazard and an accident are working.',
      specimens: [
        {
          id: 'SafetyPermitBarrierPanel',
          title: 'Barrier status panel',
          note: 'Pick it per major hazard: every barrier as healthy, degraded or impaired, with the reason for anything weakened.',
          origin: 'custom',
          uses: ['industrial/domains/BarrierStatus.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitBarrierPanel,
        },
        {
          id: 'SafetyPermitSceList',
          title: 'Safety-critical element tests',
          note: 'Pick it to follow assurance testing: failed and overdue tests first, then what is due soon.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitSceList,
        },
      ],
    },
    {
      id: 'incidents',
      title: 'Incidents and people',
      description: 'What has happened, what was observed, and who is on site.',
      specimens: [
        {
          id: 'SafetyPermitDaysSinceIncident',
          title: 'Days since incident',
          note: 'Pick it as a plain record: the count, and the event it counts from.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          Component: SafetyPermitDaysSinceIncident,
        },
        {
          id: 'SafetyPermitPob',
          title: 'Personnel on site',
          note: 'Pick it for the headcount against evacuation capacity, split the way a muster would be.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/LinearGauge.tsx'],
          Component: SafetyPermitPob,
        },
        {
          id: 'SafetyPermitObservationCard',
          title: 'Observation card',
          note: 'Pick it for a reported unsafe act or condition: what was seen, where, by whom and what happens next.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'industrial/StatusIndicator.tsx'],
          Component: SafetyPermitObservationCard,
        },
        {
          id: 'SafetyPermitIncidentRows',
          title: 'Incident report rows',
          note: 'Pick it for an incident log: classification in words, severity as a badge, and where the follow-up stands.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitIncidentRows,
        },
        {
          id: 'SafetyPermitMusterStatus',
          title: 'Muster count',
          note: 'Pick it during a muster: accounted against expected per station, and the names still missing with their last known position.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitMusterStatus,
        },
      ],
    },
    {
      id: 'risk-and-approval',
      title: 'Risk and approval',
      description: 'Assessing the job, briefing the work party and signing the permit.',
      specimens: [
        {
          id: 'SafetyPermitRiskMatrix',
          title: 'Risk matrix picker',
          note: 'Pick it in a risk assessment form: click or use the arrow keys to choose likelihood and consequence.',
          origin: 'custom',
          uses: ['industrial/domains/RiskMatrix.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitRiskMatrix,
        },
        {
          id: 'SafetyPermitRiskResidual',
          title: 'Initial and residual risk',
          note: 'Pick it read-only on an approved assessment, to show how far the controls move the risk.',
          origin: 'custom',
          uses: ['industrial/domains/RiskMatrix.tsx', 'industrial/domains/safety.ts'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitRiskResidual,
        },
        {
          id: 'SafetyPermitToolboxTalk',
          title: 'Toolbox-talk checklist',
          note: 'Pick it before work starts: every point is confirmed, and the record button stays off until all are.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitToolboxTalk,
        },
        {
          id: 'SafetyPermitApprovalChain',
          title: 'Approval chain with signatures',
          note: 'Pick it to show who signed what and when, and which signature is still outstanding.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SafetyPermitApprovalChain,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A complete permit page section and a safety overview.',
      specimens: [
        {
          id: 'SafetyPermitDetail',
          title: 'Permit detail',
          note: 'Pick it as the body of a permit page: the permit, its gas test, its isolations and its signatures side by side.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx', 'industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SafetyPermitDetail,
        },
        {
          id: 'SafetyPermitOverview',
          title: 'Safety overview',
          note: 'Pick it as the top of a safety dashboard: headline counts, permits by state and the barrier panel.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains/BarrierStatus.tsx', 'industrial/domains/safety.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SafetyPermitOverview,
        },
      ],
    },
  ],
});
