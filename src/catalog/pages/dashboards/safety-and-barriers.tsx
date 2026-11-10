import { chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconChevronDown, IconChevronUp } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { barrierStatus, countBarrierStates, permitStatus, worstBarrierState } from '../../../library/industrial/domains/safety';
import type { BarrierState, PermitState } from '../../../library/industrial/domains/safety';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { DueLabel } from '../../../library/industrial/operations/DueLabel';
import { TONE_SURFACE, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './safety-and-barriers.tsx?raw';

type SafetyTest = { id: string; tag: string; test: string; due: string; result: 'passed' | 'overdue' | 'inhibited' };

type SafetyBarrier = {
  id: string;
  lane: 'prevent' | 'detect' | 'respond';
  name: string;
  state: BarrierState;
  /** Tests in date out of tests required. */
  inDate: number;
  required: number;
  /** Why the barrier is weakened and what compensates. Healthy barriers have none. */
  impairment?: string;
  compensation?: string;
  tests: readonly SafetyTest[];
};

const SAFETY_LANES = [
  { id: 'prevent', name: 'Prevent', purpose: 'Keep the hazard contained' },
  { id: 'detect', name: 'Detect', purpose: 'Notice a release or a fire early' },
  { id: 'respond', name: 'Respond', purpose: 'Limit the consequence and protect people' },
] as const;

const SAFETY_BARRIERS: readonly SafetyBarrier[] = [
  {
    id: 'containment',
    lane: 'prevent',
    name: 'Process containment',
    state: 'healthy',
    inDate: 14,
    required: 14,
    tests: [
      { id: 't1', tag: '27-PA-2001A', test: 'Wall thickness survey, export line', due: '14 Mar', result: 'passed' },
      { id: 't2', tag: '20-VA-1001', test: 'Internal inspection', due: '2 Sep', result: 'passed' },
    ],
  },
  {
    id: 'relief',
    lane: 'prevent',
    name: 'Pressure relief',
    state: 'degraded',
    inDate: 20,
    required: 22,
    impairment: 'Two relief valves on the interstage cooler are past their recertification date.',
    compensation: 'Spare valve 23-PSV-9117 is lined up in parallel until both are recertified.',
    tests: [
      { id: 't1', tag: '23-PSV-9115', test: 'Recertification', due: '28 Feb', result: 'overdue' },
      { id: 't2', tag: '23-PSV-9116', test: 'Recertification', due: '28 Feb', result: 'overdue' },
      { id: 't3', tag: '20-PSV-1011', test: 'Recertification', due: '11 Jun', result: 'passed' },
    ],
  },
  {
    id: 'isolation',
    lane: 'prevent',
    name: 'Inlet isolation',
    state: 'healthy',
    inDate: 6,
    required: 6,
    tests: [
      { id: 't1', tag: '20-XV-1105', test: 'Partial stroke test', due: '10 Jun', result: 'passed' },
      { id: 't2', tag: '20-XV-1106', test: 'Leak test', due: '4 May', result: 'passed' },
    ],
  },
  {
    id: 'gas',
    lane: 'detect',
    name: 'Gas detection',
    state: 'impaired',
    inDate: 14,
    required: 14,
    impairment: 'Two of 14 detectors in gas compression are inhibited for the recompressor bearing work.',
    compensation: 'Fire watch posted and two portable detectors at the work site. Review at 16:00.',
    tests: [
      { id: 't1', tag: '23-GD-9131', test: 'Inhibited until 19:00', due: '12 Mar', result: 'inhibited' },
      { id: 't2', tag: '23-GD-9132', test: 'Inhibited until 19:00', due: '12 Mar', result: 'inhibited' },
      { id: 't3', tag: 'NK-23', test: 'Loop check, 14 detectors', due: '10 Jun', result: 'passed' },
    ],
  },
  {
    id: 'fire',
    lane: 'detect',
    name: 'Fire detection',
    state: 'healthy',
    inDate: 18,
    required: 18,
    tests: [
      { id: 't1', tag: 'NK-23', test: 'Flame detector function test', due: '22 Apr', result: 'passed' },
      { id: 't2', tag: 'NK-27', test: 'Heat detector function test', due: '6 May', result: 'passed' },
    ],
  },
  {
    id: 'alarms',
    lane: 'detect',
    name: 'Critical process alarms',
    state: 'healthy',
    inDate: 31,
    required: 31,
    tests: [
      { id: 't1', tag: '23-TT-92532', test: 'Trip set point verification', due: '18 Jul', result: 'passed' },
      { id: 't2', tag: '20-LT-10012', test: 'Transmitter calibration', due: '11 Sep', result: 'passed' },
    ],
  },
  {
    id: 'esd',
    lane: 'respond',
    name: 'Emergency shutdown',
    state: 'healthy',
    inDate: 9,
    required: 9,
    tests: [
      { id: 't1', tag: 'ESD-1', test: 'Full function test', due: '4 May', result: 'passed' },
      { id: 't2', tag: '23-XV-9120', test: 'Closing time test', due: '19 Aug', result: 'passed' },
    ],
  },
  {
    id: 'blowdown',
    lane: 'respond',
    name: 'Blowdown and flare',
    state: 'healthy',
    inDate: 5,
    required: 5,
    tests: [
      { id: 't1', tag: '23-BDV-9125', test: 'Opening time test', due: '4 May', result: 'passed' },
      { id: 't2', tag: 'NK-27', test: 'Flare pilot check', due: '26 Mar', result: 'passed' },
    ],
  },
  {
    id: 'firewater',
    lane: 'respond',
    name: 'Firewater and deluge',
    state: 'degraded',
    inDate: 7,
    required: 8,
    impairment: 'The weekly start test of firewater pump B is five days overdue.',
    compensation: 'Pump A is available and was tested on 9 March. Pump B test is planned for Friday.',
    tests: [
      { id: 't1', tag: '71-PA-7001B', test: 'Weekly start test', due: '7 Mar', result: 'overdue' },
      { id: 't2', tag: '71-PA-7001A', test: 'Weekly start test', due: '16 Mar', result: 'passed' },
      { id: 't3', tag: 'NK-23', test: 'Deluge valve trip test', due: '2 Jun', result: 'passed' },
    ],
  },
];

const SAFETY_TEST_RESULT: Record<SafetyTest['result'], { tone: Tone; label: string; shape: 'dot' | 'square' | 'diamond' }> = {
  passed: { tone: 'success', label: 'In date', shape: 'dot' },
  overdue: { tone: 'warning', label: 'Overdue', shape: 'square' },
  inhibited: { tone: 'critical', label: 'Inhibited', shape: 'diamond' },
};

const SAFETY_STATE_TONE: Record<BarrierState, Tone> = { healthy: 'neutral', degraded: 'warning', impaired: 'critical' };

const SAFETY_COUNTS = countBarrierStates(SAFETY_BARRIERS.map((barrier) => barrier.state));

const SAFETY_PERMITS: readonly { id: string; job: string; type: string; area: string; until: string; state: PermitState }[] = [
  { id: 'PTW-2291', job: 'Inspect recompressor drive-end bearing', type: 'Hot work', area: 'Gas compression', until: '19:00', state: 'active' },
  { id: 'PTW-2293', job: 'Internal inspection, test separator', type: 'Confined space', area: 'Inlet and separation', until: '16:00', state: 'active' },
  { id: 'PTW-2288', job: 'Overhaul cooling water pump', type: 'Cold work', area: 'Cooling water', until: '18:00', state: 'active' },
  { id: 'PTW-2295', job: 'Wall thickness survey, export line', type: 'Work at height', area: 'Gas export', until: '15:00', state: 'active' },
  { id: 'PTW-2297', job: 'Lift scaffold material to separator deck', type: 'Lifting', area: 'Inlet and separation', until: '17:00', state: 'suspended' },
];

const SAFETY_CONFLICTS = [
  {
    id: 'c1',
    title: 'Hot work with gas detectors inhibited',
    area: 'Gas compression',
    permits: 'PTW-2291 · Gas detection',
    control: 'Fire watch and portable detectors in place. Area authority reviews at 16:00.',
    tone: 'critical',
    shape: 'diamond',
    state: 'Needs review',
  },
  {
    id: 'c2',
    title: 'Lifting over a confined space entry',
    area: 'Inlet and separation',
    permits: 'PTW-2297 · PTW-2293',
    control: 'Lift is suspended until the entry closes at 16:00.',
    tone: 'warning',
    shape: 'square',
    state: 'Controlled',
  },
] as const;

const SAFETY_COMPLIANCE = [
  { id: 'psv', group: 'Pressure relief valves', due: 22, done: 20, overdue: 2 },
  { id: 'fw', group: 'Firewater pumps', due: 8, done: 7, overdue: 1 },
  { id: 'gd', group: 'Gas detectors', due: 14, done: 14, overdue: 0 },
  { id: 'esd', group: 'Shutdown and blowdown valves', due: 14, done: 14, overdue: 0 },
  { id: 'fd', group: 'Fire and heat detectors', due: 18, done: 18, overdue: 0 },
];

const SAFETY_MONTHS = [
  { month: 'Oct', observations: 31, incidents: 1 },
  { month: 'Nov', observations: 27, incidents: 0 },
  { month: 'Dec', observations: 22, incidents: 0 },
  { month: 'Jan', observations: 34, incidents: 2 },
  { month: 'Feb', observations: 38, incidents: 1 },
  { month: 'Mar', observations: 16, incidents: 0 },
];

const SAFETY_MONTH_SERIES = [
  { key: 'observations', label: 'Observations', type: 'bar', stack: 'reports', color: chartSeriesColor(1) },
  { key: 'incidents', label: 'Incidents', type: 'bar', stack: 'reports', color: chartSeriesColor(2) },
] as const;

const SAFETY_POB = [
  { id: 'nk-23', label: 'Gas compression', value: 14, detail: 'NK-23' },
  { id: 'office', label: 'Control room and offices', value: 11 },
  { id: 'nk-20', label: 'Inlet and separation', value: 9, detail: 'NK-20' },
  { id: 'nk-27', label: 'Gas export', value: 6, detail: 'NK-27' },
  { id: 'nk-40', label: 'Cooling water', value: 4, detail: 'NK-40' },
];

const SAFETY_ACTIONS = [
  { id: 'a1', action: 'Add recertification dates for relief valves to the weekly plan', from: 'INV-0412', owner: 'Magnus Solberg', due: '6 Mar', overdue: true },
  { id: 'a2', action: 'Fit guard on cooler drain valve handle', from: 'INV-0409', owner: 'Tomás Barros', due: '13 Mar', overdue: false },
  { id: 'a3', action: 'Update inhibit procedure with a maximum duration', from: 'INV-0415', owner: 'Liv Wold', due: '20 Mar', overdue: false },
  { id: 'a4', action: 'Brief all shifts on dropped-object zones during lifts', from: 'INV-0415', owner: 'Ingrid Haugen', due: '27 Mar', overdue: false },
];

/** The few safety figures in large, calm type: one long count and three short ones. */
function SafetyFigureBand() {
  return (
    <Card className="min-w-0">
      <dl className="grid w-full grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <dd>
            <ValueReadout value={PLANT_KPIS.daysSinceIncident.value} unit="days" size="xl" />
          </dd>
          <dt className="text-sm text-medium-foreground">Since the last recordable incident. The site record is 365 days.</dt>
        </div>
        <div className="flex flex-col gap-2">
          <dd>
            <ValueReadout value={6} size="lg" />
          </dd>
          <dt className="text-sm text-medium-foreground">Active permits to work</dt>
          <StatusIndicator tone="neutral" shape="ring" label="1 suspended" size="sm" />
        </div>
        <div className="flex flex-col gap-2">
          <dd>
            <ValueReadout value={SAFETY_COUNTS.impaired} size="lg" tone="critical" />
          </dd>
          <dt className="text-sm text-medium-foreground">Impaired barriers</dt>
          <StatusIndicator {...barrierStatus('impaired')} label="Gas detection" size="sm" />
        </div>
        <div className="flex flex-col gap-2">
          <dd>
            <ValueReadout value={3} size="lg" tone="warning" />
          </dd>
          <dt className="text-sm text-medium-foreground">Overdue safety-critical tests</dt>
          <StatusIndicator tone="warning" shape="square" label="Oldest 12 days" size="sm" />
        </div>
      </dl>
    </Card>
  );
}

type SafetyLanesProps = {
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  scope: string;
  onScope: (scope: string) => void;
};

/** The dominant element: barriers in three lanes by function. A barrier opens to show its tests and impairments. */
function SafetyLaneBoard({ expandedId, onExpand, scope, onScope }: SafetyLanesProps) {
  return (
    <section aria-label="Barriers by function" className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h4 className="text-lg font-medium text-base-foreground">Barriers by function</h4>
          <p className="text-sm text-muted-foreground">
            {SAFETY_COUNTS.healthy} healthy · {SAFETY_COUNTS.degraded} degraded · {SAFETY_COUNTS.impaired} impaired. Select a barrier to see its
            tests.
          </p>
        </div>
        <SegmentedControl value={scope} onValueChange={(value) => onScope(String(value))}>
          <SegmentedControlList size="small" aria-label="Barriers shown">
            <SegmentedControlButton value="all">All barriers</SegmentedControlButton>
            <SegmentedControlButton value="weakened">Weakened only</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
        {SAFETY_LANES.map((lane, index) => {
          const all = SAFETY_BARRIERS.filter((barrier) => barrier.lane === lane.id);
          const shown = scope === 'weakened' ? all.filter((barrier) => barrier.state !== 'healthy') : all;
          const worst = worstBarrierState(all.map((barrier) => barrier.state));
          return (
            <section key={lane.id} aria-label={`${lane.name} barriers`} className="flex min-w-0 flex-col gap-3">
              <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-t-2 border-emphasized pt-3">
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-base-foreground">
                    <span className="pr-2 tabular-nums text-muted-foreground">{index + 1}</span>
                    {lane.name}
                  </h5>
                  <p className="text-xs text-muted-foreground">{lane.purpose}</p>
                </div>
                <StatusIndicator {...barrierStatus(worst)} size="sm" />
              </header>
              {shown.length === 0 ? <p className="text-sm text-medium-foreground">All {all.length} barriers in this lane are healthy.</p> : null}
              {shown.map((barrier) => {
                const expanded = barrier.id === expandedId;
                const Chevron = expanded ? IconChevronUp : IconChevronDown;
                return (
                  <Card key={barrier.id} className="min-w-0 gap-3">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => onExpand(expanded ? null : barrier.id)}
                      className="flex w-full cursor-pointer flex-col gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring-default"
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="text-sm font-medium text-base-foreground">{barrier.name}</span>
                        <Chevron aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </span>
                      <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <StatusIndicator {...barrierStatus(barrier.state)} tone={SAFETY_STATE_TONE[barrier.state]} size="sm" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {barrier.inDate} of {barrier.required} tests in date
                        </span>
                      </span>
                    </button>
                    {expanded ? (
                      <div className="flex flex-col gap-3">
                        {barrier.impairment ? (
                          <div className={`flex flex-col gap-1 rounded-md p-3 text-sm ${TONE_SURFACE[SAFETY_STATE_TONE[barrier.state]]}`}>
                            <p className="font-medium">{barrier.impairment}</p>
                            <p>{barrier.compensation}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-medium-foreground">No impairments. All tests are in date.</p>
                        )}
                        <ul aria-label={`${barrier.name} tests`} className="flex flex-col">
                          {barrier.tests.map((test) => (
                            <li key={test.id} className="flex flex-col gap-1 border-t border-default py-2">
                              <span className="text-sm text-base-foreground">{test.test}</span>
                              <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                <span className="font-mono text-xs text-muted-foreground">{test.tag}</span>
                                <span className="flex items-center gap-3">
                                  <span className="text-xs tabular-nums text-muted-foreground">Due {test.due}</span>
                                  <StatusIndicator {...SAFETY_TEST_RESULT[test.result]} size="sm" />
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function SafetyPermitsPanel() {
  return (
    <DashboardPanel
      title="Permits to work"
      description="5 of 7 open today, by area"
      actions={
        <Button variant="ghost" size="sm">
          Open permit board
        </Button>
      }
    >
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Permit
            </th>
            <th scope="col" className="w-32 pb-2 pr-3 font-medium">
              Type
            </th>
            <th scope="col" className="w-20 pb-2 pr-3 text-right font-medium">
              Valid to
            </th>
            <th scope="col" className="w-28 pb-2 font-medium">
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {SAFETY_PERMITS.map((permit) => (
            <tr key={permit.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{permit.job}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{permit.id}</span> · {permit.area}
                </p>
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{permit.type}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{permit.until}</td>
              <td className="py-2">
                <StatusIndicator {...permitStatus(permit.state)} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function SafetyConflictsPanel() {
  return (
    <DashboardPanel title="Simultaneous operations" description="Conflicts between open permits and barrier states">
      <ul className="flex w-full flex-col">
        {SAFETY_CONFLICTS.map((conflict) => (
          <li key={conflict.id} className="flex flex-col gap-1.5 border-t border-default py-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-base-foreground">{conflict.title}</p>
              <StatusIndicator tone={conflict.tone} shape={conflict.shape} label={conflict.state} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              {conflict.area} · <span className="font-mono">{conflict.permits}</span>
            </p>
            <p className="text-sm text-medium-foreground">{conflict.control}</p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function SafetyCompliancePanel() {
  return (
    <DashboardPanel title="Safety-critical element tests" description="Tests due in the last 12 months, lowest compliance first">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Element group
            </th>
            <th scope="col" className="w-14 pb-2 pr-3 text-right font-medium">
              Due
            </th>
            <th scope="col" className="w-14 pb-2 pr-3 text-right font-medium">
              Done
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 text-right font-medium">
              Compliance
            </th>
            <th scope="col" className="w-28 pb-2 font-medium">
              Overdue
            </th>
          </tr>
        </thead>
        <tbody>
          {SAFETY_COMPLIANCE.map((row) => (
            <tr key={row.id} className="border-t border-default align-top">
              <td className="py-2 pr-3 text-base-foreground">{row.group}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{row.due}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{row.done}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{formatValue((row.done / row.due) * 100, 0)}%</td>
              <td className="py-2">
                {row.overdue > 0 ? (
                  <StatusIndicator tone="warning" shape="square" label={`${row.overdue} overdue`} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function SafetyIncidentsPanel() {
  return (
    <DashboardPanel
      title="Incidents and observations"
      description="Reports per month, last 6 months"
      footnote="168 observations and 4 incidents in six months; none recordable. March covers 12 days."
    >
      <CategoryChart
        label="Safety observations and incidents per month from October to March: 16 to 38 observations and 0 to 2 incidents a month"
        rows={SAFETY_MONTHS}
        categoryKey="month"
        series={SAFETY_MONTH_SERIES}
        domain={[0, 40]}
        ticks={[0, 10, 20, 30, 40]}
        legend
        heightClassName="h-56"
        className="w-full"
      />
    </DashboardPanel>
  );
}

function SafetyPobPanel() {
  return (
    <DashboardPanel title="Personnel on board" description="By area, 14:00" footnote="44 people on site against a limit of 60. All accounted for at the 12:00 muster check.">
      <ShareBarList label="Personnel on board by area" items={SAFETY_POB} />
    </DashboardPanel>
  );
}

function SafetyActionsPanel() {
  return (
    <DashboardPanel title="Open actions" description="From investigations, by due date">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Action
            </th>
            <th scope="col" className="w-36 pb-2 pr-3 font-medium">
              Owner
            </th>
            <th scope="col" className="w-36 pb-2 font-medium">
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {SAFETY_ACTIONS.map((action) => (
            <tr key={action.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{action.action}</p>
                <p className="font-mono text-xs text-muted-foreground">{action.from}</p>
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{action.owner}</td>
              <td className="py-2">
                <DueLabel due={action.due} overdue={action.overdue} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

/**
 * Archetype: three vertical lanes under a figure band, with a bottom strip.
 * Dominant element: the swim-lane board of barriers by function (prevent, detect, respond).
 * Interaction: a barrier card expands to its tests and impairments; a switch narrows the lanes to weakened barriers.
 */
function SafetyDashboard() {
  const [expandedId, setExpandedId] = useState<string | null>('gas');
  const [scope, setScope] = useState('all');

  return (
    <DashboardFrame
      title="Safety and barriers"
      subtitle="Nordkapp · day shift, 12 March 2026 · updated 14:00 UTC"
      status={<StatusIndicator {...barrierStatus('impaired')} label="1 barrier impaired" detail="gas detection" />}
      actions={
        <Button variant="outline" size="sm">
          Report observation
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <SafetyFigureBand />
        <SafetyLaneBoard expandedId={expandedId} onExpand={setExpandedId} scope={scope} onScope={setScope} />
        <DashboardGrid>
          <DashboardCell span={7}>
            <SafetyPermitsPanel />
          </DashboardCell>
          <DashboardCell span={5}>
            <SafetyIncidentsPanel />
          </DashboardCell>
          <DashboardCell span={7}>
            <SafetyCompliancePanel />
          </DashboardCell>
          <DashboardCell span={5}>
            <SafetyConflictsPanel />
          </DashboardCell>
          <DashboardCell span={8}>
            <SafetyActionsPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <SafetyPobPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function SafetyDashSignature() {
  return (
    <ThemeScope preset="accessible" className="w-full">
      <SafetyDashboard />
    </ThemeScope>
  );
}

function SafetyDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <SafetyDashboard />
    </ThemeScope>
  );
}

function SafetyDashField() {
  return (
    <ThemeScope preset="field" className="w-full">
      <SafetyDashboard />
    </ThemeScope>
  );
}

function SafetyDashAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <SafetyDashboard />
    </ThemeScope>
  );
}

function SafetyDashFigureBand() {
  return <SafetyFigureBand />;
}

function SafetyDashLanes() {
  const [expandedId, setExpandedId] = useState<string | null>('relief');
  const [scope, setScope] = useState('weakened');
  return <SafetyLaneBoard expandedId={expandedId} onExpand={setExpandedId} scope={scope} onScope={setScope} />;
}

function SafetyDashPermits() {
  return <SafetyPermitsPanel />;
}

function SafetyDashConflicts() {
  return <SafetyConflictsPanel />;
}

function SafetyDashCompliance() {
  return <SafetyCompliancePanel />;
}

function SafetyDashIncidents() {
  return <SafetyIncidentsPanel />;
}

function SafetyDashPob() {
  return <SafetyPobPanel />;
}

function SafetyDashActions() {
  return <SafetyActionsPanel />;
}

export default definePage({
  id: 'safety-and-barriers',
  title: 'Safety and barriers',
  summary:
    'The state of the plant’s safety barriers, read left to right as prevent, detect and respond. A few figures in large type on top; permits, conflicts, tests, reports, people and actions underneath.',
  guidance: {
    use: [
      'For the shift safety review and the area authority’s view before approving permits.',
      'When barriers must be read by function, so a gap in one lane is seen against the lanes beside it.',
      'Write every state as a word with its shape; this screen must work in greyscale.',
      'Show what compensates for an impairment in the same place as the impairment.',
    ],
    avoid: [
      'Green everywhere; a healthy barrier is neutral so the weakened ones are the only colour.',
      'Trend arrows or celebration on the incident count; state it plainly.',
      'Hiding the tests behind a link; the barrier opens in place.',
      'Listing permits without the conflicts between them.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Accessible theme: high contrast and extra space. Three lanes of barriers under a band of figures, with permits and actions as a bottom strip.',
      specimens: [
        {
          id: 'SafetyDashSignature',
          title: 'Safety and barriers',
          note: 'Pick it as the safety overview of a site, read by barrier function.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/charts/CategoryChart.tsx',
            'industrial/domains/safety.ts',
            'industrial/domains/ShareBarList.tsx',
            'industrial/operations/DueLabel.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: SafetyDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'SafetyDashAura',
          title: 'Aura',
          note: 'Pick it when the safety view sits inside a product on the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: SafetyDashAura,
        },
        {
          id: 'SafetyDashField',
          title: 'Field',
          note: 'Pick it for the area authority’s tablet on site: larger targets and stronger contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: SafetyDashField,
        },
        {
          id: 'SafetyDashAuraDark',
          title: 'Aura dark',
          note: 'Pick it for the control room at night, where the screen must not glare.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: SafetyDashAuraDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'SafetyDashFigureBand',
          title: 'Figure band',
          note: 'Pick it when a few figures should be read from across the room, without tiles or trends.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/domains/safety.ts'],
          Component: SafetyDashFigureBand,
        },
        {
          id: 'SafetyDashLanes',
          title: 'Barrier lanes',
          note: 'Pick it to show barriers in the order they act, each opening to its tests and impairments.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/domains/safety.ts'],
          Component: SafetyDashLanes,
        },
        {
          id: 'SafetyDashPermits',
          title: 'Permits to work',
          note: 'Pick it to list the open permits with type, area, validity and state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/domains/safety.ts'],
          Component: SafetyDashPermits,
        },
        {
          id: 'SafetyDashPob',
          title: 'Personnel on board',
          note: 'Pick it to show where people are, area by area, against the site limit.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/ShareBarList.tsx'],
          Component: SafetyDashPob,
        },
        {
          id: 'SafetyDashCompliance',
          title: 'Test compliance',
          note: 'Pick it to compare safety-critical element groups on tests done against tests due.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: SafetyDashCompliance,
        },
        {
          id: 'SafetyDashIncidents',
          title: 'Reports by month',
          note: 'Pick it to show reporting volume and incidents together, month by month.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: SafetyDashIncidents,
        },
        {
          id: 'SafetyDashActions',
          title: 'Open actions',
          note: 'Pick it to keep investigation actions and their owners in front of the shift.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/DueLabel.tsx'],
          Component: SafetyDashActions,
        },
        {
          id: 'SafetyDashConflicts',
          title: 'Simultaneous operations',
          note: 'Pick it when two jobs, or a job and a weakened barrier, must not be read apart.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: SafetyDashConflicts,
        },
      ],
    },
  ],
});
