import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertTriangle, IconCheck, IconClock } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { workOrderStatusLabel, workOrderTypeLabel } from '../../../library/industrial/operations/workOrders';
import type { WorkOrderStatus, WorkOrderType, WorkPriority } from '../../../library/industrial/operations/workOrders';
import { TONE_MARK_BG, TONE_MARK_BG_SOFT } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './maintenance-planning.tsx?raw';

const PLAN_DAYS = ['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13', 'Sat 14', 'Sun 15'];

/** Thursday 12 March, 14:00, in day units from Monday 00:00. */
const PLAN_NOW = 3.58;

type PlanJob = {
  id: string;
  title: string;
  assetId: string;
  type: WorkOrderType;
  priority: WorkPriority;
  status: WorkOrderStatus;
  crewId: string;
  /** Start and end in day units: 0 is Monday 00:00, 7 is Sunday 24:00. */
  start: number;
  end: number;
  /** Row inside the crew's band, so overlapping jobs do not collide. */
  lane: 0 | 1;
  hours: number;
  assignee: string;
  overdue?: boolean;
  note: string;
};

const PLAN_JOBS: readonly PlanJob[] = [
  { id: 'WO-104455', title: 'Overhaul cooling water pump', assetId: '40-pa-4001', type: 'corrective', priority: 'P2', status: 'in-progress', crewId: 'mech', start: 0, end: 3, lane: 0, hours: 30, assignee: 'Tomás Barros', note: 'Pump is out; bearings and mechanical seal are being replaced.' },
  { id: 'WO-104482', title: 'Inspect recompressor drive-end bearing', assetId: '23-ka-9103', type: 'corrective', priority: 'P1', status: 'in-progress', crewId: 'mech', start: 3, end: 4, lane: 0, hours: 8, assignee: 'Tomás Barros', note: 'Break-in work after the trip at 13:46. Pushed the cooler cleaning back one day.' },
  { id: 'WO-104471', title: 'Clean interstage cooler tube bundle', assetId: '23-ha-9114', type: 'preventive', priority: 'P2', status: 'waiting', crewId: 'mech', start: 4, end: 6, lane: 0, hours: 16, assignee: 'Magnus Solberg', note: 'Waiting for the gasket set, expected Friday morning. Cannot start without it.' },
  { id: 'WO-104458', title: 'Standby start test, export pump B', assetId: '27-pa-2001b', type: 'preventive', priority: 'P3', status: 'open', crewId: 'mech', start: 4, end: 5, lane: 1, hours: 2, assignee: 'Unassigned', overdue: true, note: 'Due 8 March. Needs an operator to line up the pump before the test.' },
  { id: 'WO-104490', title: 'Loop check, gas detectors in compression', assetId: 'nk-23', type: 'inspection', priority: 'P3', status: 'done', crewId: 'inst', start: 0, end: 2, lane: 0, hours: 12, assignee: 'Jonas Nyberg', note: 'All 14 detectors responded inside their test tolerance.' },
  { id: 'WO-104440', title: 'Calibrate separator level transmitter', assetId: '20-va-1001', type: 'preventive', priority: 'P3', status: 'done', crewId: 'inst', start: 2, end: 3, lane: 0, hours: 2, assignee: 'Jonas Nyberg', note: 'Zero shifted 0.4%; recalibrated and returned to service.' },
  { id: 'WO-104479', title: 'Replace bearing temperature transmitter', assetId: '40-pa-4001', type: 'corrective', priority: 'P2', status: 'planned', crewId: 'inst', start: 4, end: 5, lane: 0, hours: 3, assignee: 'Jonas Nyberg', note: 'Fit before the pump is recommissioned on Friday.' },
  { id: 'WO-104473', title: 'Replace drive-end bearing temperature probe', assetId: '23-ka-9101', type: 'corrective', priority: 'P2', status: 'planned', crewId: 'inst', start: 5, end: 7, lane: 1, hours: 6, assignee: 'Jonas Nyberg', note: 'Weekend work; puts the instrument crew 6 hours over capacity.' },
  { id: 'WO-104431', title: 'Partial stroke test, inlet shutdown valve', assetId: '20-xv-1105', type: 'inspection', priority: 'P2', status: 'done', crewId: 'insp', start: 1, end: 2, lane: 0, hours: 1, assignee: 'Tomás Barros', note: 'Valve travelled 20% in 1.8 s, inside the 3 s requirement.' },
  { id: 'WO-104466', title: 'Vibration survey, 1st stage compressor', assetId: '23-ka-9101', type: 'inspection', priority: 'P2', status: 'planned', crewId: 'insp', start: 3, end: 4, lane: 0, hours: 4, assignee: 'Aisha Khan', note: 'Brought forward from Saturday on the condition monitoring recommendation.' },
  { id: 'WO-104495', title: 'Wall thickness survey, export line', assetId: '27-pa-2001a', type: 'inspection', priority: 'P3', status: 'planned', crewId: 'insp', start: 4, end: 6, lane: 0, hours: 14, assignee: 'Aisha Khan', note: 'Scaffold is up. Twelve measurement locations.' },
  { id: 'WO-104487', title: 'Motor insulation test, export pump A', assetId: '27-pa-2001a', type: 'preventive', priority: 'P3', status: 'done', crewId: 'elec', start: 1, end: 3, lane: 0, hours: 6, assignee: 'Liv Wold', note: 'Insulation resistance unchanged since the last test.' },
  { id: 'WO-104419', title: 'Upgrade turbine control firmware', assetId: '23-gt-9001', type: 'modification', priority: 'P4', status: 'planned', crewId: 'elec', start: 5, end: 7, lane: 0, hours: 24, assignee: 'Aisha Khan', note: 'Needs the turbine stopped; tentative until the production plan is confirmed.' },
];

const PLAN_CREWS = [
  { id: 'mech', name: 'Mechanical', capacity: 80, planned: 56 },
  { id: 'inst', name: 'Instrument', capacity: 40, planned: 46 },
  { id: 'insp', name: 'Inspection', capacity: 40, planned: 19 },
  { id: 'elec', name: 'Electrical', capacity: 40, planned: 30 },
];

const PLAN_TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'modification', label: 'Modification' },
];

const PLAN_LANE_TOP = { 0: 'top-1', 1: 'top-9' } as const;

const PLAN_FIGURES = [
  { id: 'backlog', label: 'Backlog', value: 412, unit: 'h', decimals: 0, reference: 438, goodDirection: 'down', caption: 'vs last week' },
  { id: 'overdue', label: 'Overdue orders', value: 7, unit: '', decimals: 0, reference: 5, goodDirection: 'down', caption: 'vs last week' },
  { id: 'schedule', label: 'Schedule compliance', value: 86, unit: '%', decimals: 0, reference: 90, goodDirection: 'up', caption: 'vs target 90%' },
  { id: 'pm', label: 'PM compliance', value: 93, unit: '%', decimals: 0, reference: 95, goodDirection: 'up', caption: 'vs target 95%' },
] as const;

const PLAN_BACKLOG = [
  { id: 'p3', label: 'P3 · Normal', value: 186 },
  { id: 'p2', label: 'P2 · Urgent', value: 138 },
  { id: 'p4', label: 'P4 · Low', value: 72 },
  { id: 'p1', label: 'P1 · Immediate', value: 16, tone: 'critical' },
] as const;

const PLAN_TYPES = [
  { id: 'preventive', label: 'Preventive', value: 172, colorClass: 'bg-chart-1-450' },
  { id: 'corrective', label: 'Corrective', value: 148, colorClass: 'bg-chart-2-450' },
  { id: 'inspection', label: 'Inspection', value: 54, colorClass: 'bg-chart-3-450' },
  { id: 'modification', label: 'Modification', value: 38, colorClass: 'bg-chart-4-450' },
];

const PLAN_OVERDUE = [
  { id: 'WO-104458', title: 'Standby start test, export pump B', tag: '27-PA-2001B', priority: 'P3', daysLate: 4, crew: 'Mechanical' },
  { id: 'WO-104451', title: 'Lube oil sample and analysis', tag: '23-KA-9101', priority: 'P3', daysLate: 2, crew: 'Mechanical' },
  { id: 'WO-104437', title: 'Function test, fire damper FD-2304', tag: 'NK-23', priority: 'P2', daysLate: 2, crew: 'Instrument' },
  { id: 'WO-104428', title: 'Grease motor bearings, cooling water pump', tag: '40-PA-4001', priority: 'P4', daysLate: 6, crew: 'Electrical' },
  { id: 'WO-104412', title: 'Visual inspection, inlet separator supports', tag: '20-VA-1001', priority: 'P4', daysLate: 9, crew: 'Inspection' },
] as const;

const PLAN_MATERIALS = [
  { id: 'm1', item: 'Gasket set, cooler channel cover', order: 'WO-104471', quantity: 1, expected: 'Fri 13 Mar', tone: 'neutral', state: 'In transit' },
  { id: 'm2', item: 'Mechanical seal cartridge, 80 mm', order: 'WO-104455', quantity: 1, expected: 'Arrived', tone: 'success', state: 'Ready to pick' },
  { id: 'm3', item: 'Temperature probe, Pt100 duplex', order: 'WO-104473', quantity: 2, expected: 'Mon 16 Mar', tone: 'warning', state: 'Delayed 2 days' },
  { id: 'm4', item: 'Seal gas filter elements', order: 'WO-104402', quantity: 4, expected: 'Thu 19 Mar', tone: 'neutral', state: 'On order' },
] as const;

const PLAN_SHUTDOWN = [
  { id: 'scope', label: 'Scope approved', value: 71 },
  { id: 'materials', label: 'Materials ordered', value: 58 },
  { id: 'permits', label: 'Permits prepared', value: 24 },
];

const PLAN_SHUTDOWN_ORDERS = 86;

const planJobTone = (job: PlanJob): Tone => (job.overdue ? 'critical' : job.status === 'waiting' ? 'warning' : 'neutral');

const planDay = (position: number): string => PLAN_DAYS[Math.min(PLAN_DAYS.length - 1, Math.floor(position))] ?? '';

const planWindow = (job: PlanJob): string =>
  job.end - job.start <= 1 ? planDay(job.start) : `${planDay(job.start)} to ${planDay(job.end - 0.01)}`;

const planPercent = (value: number): string => `${Math.round((value / PLAN_DAYS.length) * 10000) / 100}%`;

type PlanBoardProps = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  typeFilter: string;
  onTypeFilter: (value: string) => void;
};

/** The dominant element: crews as rows, days as columns, every job a bar that can be selected. */
function PlanBoardPanel({ selectedId, onSelect, typeFilter, onTypeFilter }: PlanBoardProps) {
  return (
    <DashboardPanel
      title="Week schedule"
      description="Week 11 by crew. Select a job to see its details; planned hours are shown against crew capacity."
      footnote="13 jobs and 151 hours planned against 200 available. The instrument crew is 6 hours over capacity at the weekend."
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <SegmentedControl value={typeFilter} onValueChange={(value) => onTypeFilter(String(value))}>
          <SegmentedControlList size="small" aria-label="Work type">
            {PLAN_TYPE_FILTERS.map((filter) => (
              <SegmentedControlButton key={filter.value} value={filter.value}>
                {filter.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
        <ul aria-label="Bar legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-xs bg-chart-1-450" /> Planned
          </li>
          <li className="flex items-center gap-1.5">
            <IconCheck aria-hidden="true" className="size-3" /> Done
          </li>
          <li className="flex items-center gap-1.5">
            <IconClock aria-hidden="true" className="size-3" /> Waiting
          </li>
          <li className="flex items-center gap-1.5">
            <IconAlertTriangle aria-hidden="true" className="size-3" /> Overdue
          </li>
        </ul>
      </div>

      <div role="group" aria-label="Week 11 schedule by crew" className="grid w-full min-w-0 grid-cols-[8rem_minmax(0,1fr)] gap-x-4">
        <span />
        <div aria-hidden="true" className="grid grid-cols-7 pb-2">
          {PLAN_DAYS.map((day) => (
            <span key={day} className="text-xs tabular-nums text-muted-foreground">
              {day}
            </span>
          ))}
        </div>

        {PLAN_CREWS.map((crew) => {
          const over = crew.planned > crew.capacity;
          return (
            <div key={crew.id} className="col-span-2 grid grid-cols-subgrid items-center border-t border-default py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium text-base-foreground">{crew.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {crew.planned} of {crew.capacity} h
                </span>
                <span
                  role="img"
                  aria-label={`${crew.name} load: ${crew.planned} of ${crew.capacity} hours${over ? ', over capacity' : ''}`}
                  className="block h-1.5 overflow-hidden rounded-full bg-chart-neutral-100"
                >
                  <span
                    className={`block h-full rounded-full ${TONE_MARK_BG[over ? 'warning' : 'neutral']}`}
                    style={{ width: `${Math.min(100, (crew.planned / crew.capacity) * 100)}%` }}
                  />
                </span>
                {over ? (
                  <span className="text-xs font-medium text-warning-foreground-strong">Over by {crew.planned - crew.capacity} h</span>
                ) : null}
              </div>
              <div className="relative h-16">
                <div aria-hidden="true" className="absolute inset-0 grid grid-cols-7">
                  {PLAN_DAYS.map((day, index) => (
                    <span key={day} className={index > 0 ? 'border-l border-default' : undefined} />
                  ))}
                </div>
                {PLAN_JOBS.filter((job) => job.crewId === crew.id).map((job) => {
                  const tone = planJobTone(job);
                  const done = job.status === 'done';
                  const selected = job.id === selectedId;
                  const dimmed = typeFilter !== 'all' && job.type !== typeFilter;
                  const wide = job.end - job.start >= 2;
                  const Icon = job.overdue ? IconAlertTriangle : job.status === 'waiting' ? IconClock : done ? IconCheck : null;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${job.id}, ${job.title}: ${planWindow(job)}, ${job.hours} hours, ${job.overdue ? 'overdue' : workOrderStatusLabel(job.status).toLowerCase()}`}
                      onClick={() => onSelect(selected ? null : job.id)}
                      className={[
                        'absolute flex h-6 cursor-pointer items-center gap-1 overflow-hidden rounded-md px-1.5 text-xs font-medium',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring-default',
                        PLAN_LANE_TOP[job.lane],
                        done ? `${TONE_MARK_BG_SOFT[tone]} text-base-foreground` : `${TONE_MARK_BG[tone]} text-primary-foreground`,
                        selected ? 'outline-2 outline-offset-2 outline-base-foreground' : '',
                        dimmed ? 'opacity-30' : '',
                      ].join(' ')}
                      style={{ left: planPercent(job.start), width: `calc(${planPercent(job.end - job.start)} - 2px)` }}
                    >
                      {Icon ? <Icon aria-hidden="true" className="size-3 shrink-0" /> : null}
                      <span className="whitespace-nowrap tabular-nums">{job.hours} h</span>
                      {wide ? <span className="whitespace-nowrap font-mono font-normal">{findAsset(job.assetId)?.tag}</span> : null}
                    </button>
                  );
                })}
                <span aria-hidden="true" className="absolute -inset-y-3 w-px bg-base-foreground" style={{ left: planPercent(PLAN_NOW) }} />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

/** Inspector column: everything about the selected job, or a prompt when nothing is selected. */
function PlanInspectorPanel({ jobId }: { jobId: string | null }) {
  const job = PLAN_JOBS.find((candidate) => candidate.id === jobId);

  if (!job) {
    return (
      <DashboardPanel title="Selected job" description="Nothing selected">
        <p className="text-sm text-medium-foreground">Select a bar on the week schedule to see the job, its window and what it is waiting for.</p>
      </DashboardPanel>
    );
  }

  const asset = findAsset(job.assetId);
  const crew = PLAN_CREWS.find((candidate) => candidate.id === job.crewId);
  const rows = [
    { label: 'Type', value: workOrderTypeLabel(job.type) },
    { label: 'Crew', value: crew?.name ?? '—' },
    { label: 'Window', value: planWindow(job) },
    { label: 'Estimate', value: `${job.hours} h` },
    { label: 'Assignee', value: job.assignee },
  ];

  return (
    <DashboardPanel title="Selected job" description={job.id}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">{job.title}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{asset?.tag}</span> · {asset?.name}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <PriorityBadge priority={job.priority} showMeaning />
        {job.overdue ? (
          <StatusIndicator tone="critical" shape="diamond" label="Overdue" size="sm" />
        ) : (
          <StatusIndicator
            tone={job.status === 'waiting' ? 'warning' : job.status === 'done' ? 'success' : 'neutral'}
            shape={job.status === 'waiting' ? 'square' : job.status === 'done' ? 'dot' : 'ring'}
            label={workOrderStatusLabel(job.status)}
            size="sm"
          />
        )}
      </div>
      <dl className="flex flex-col border-t border-default">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-default py-1.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums text-base-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-medium-foreground">{job.note}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Reschedule job</Button>
        <Button variant="outline" size="sm">
          Open work order
        </Button>
      </div>
    </DashboardPanel>
  );
}

/** Backlog and compliance as a compact column of figures, not a tile row. */
function PlanFiguresPanel() {
  return (
    <DashboardPanel title="Week figures" description="Backlog and compliance">
      <dl className="flex w-full flex-col">
        {PLAN_FIGURES.map((figure) => (
          <div key={figure.id} className="flex flex-col gap-1 border-t border-default py-2 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-sm text-medium-foreground">{figure.label}</dt>
              <dd>
                <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="sm" />
              </dd>
            </div>
            <TrendDelta
              value={figure.value}
              reference={figure.reference}
              goodDirection={figure.goodDirection}
              caption={figure.caption}
              decimals={0}
              size="sm"
            />
          </div>
        ))}
      </dl>
    </DashboardPanel>
  );
}

function PlanBacklogPanel() {
  return (
    <DashboardPanel
      title="Backlog by priority"
      description="Open hours, largest first"
      footnote="16 hours of immediate work are still open; everything else is inside its response time."
    >
      <ShareBarList label="Backlog hours by priority" items={PLAN_BACKLOG} unit="h" />
    </DashboardPanel>
  );
}

function PlanTypesPanel() {
  return (
    <DashboardPanel
      title="Work by type"
      description="Share of the 412 backlog hours"
      footnote="Corrective work is 36% of the backlog against a goal of under 30%."
    >
      <DistributionBar label="Backlog hours by work type" segments={PLAN_TYPES} unit="h" />
    </DashboardPanel>
  );
}

function PlanOverduePanel() {
  return (
    <DashboardPanel
      title="Overdue work orders"
      description="5 of 7, highest priority first"
      actions={
        <Button variant="ghost" size="sm">
          View all
        </Button>
      }
    >
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Work order
            </th>
            <th scope="col" className="w-16 pb-2 pr-3 font-medium">
              Priority
            </th>
            <th scope="col" className="w-28 pb-2 pr-3 font-medium">
              Crew
            </th>
            <th scope="col" className="w-20 pb-2 text-right font-medium">
              Days late
            </th>
          </tr>
        </thead>
        <tbody>
          {PLAN_OVERDUE.map((order) => (
            <tr key={order.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{order.title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {order.id} · {order.tag}
                </p>
              </td>
              <td className="py-2 pr-3">
                <PriorityBadge priority={order.priority} />
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{order.crew}</td>
              <td className="py-2 text-right tabular-nums text-base-foreground">{order.daysLate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function PlanMaterialsPanel() {
  return (
    <DashboardPanel title="Materials waiting" description="Parts that hold a scheduled job, by expected date">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Item
            </th>
            <th scope="col" className="w-12 pb-2 pr-3 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="w-28 pb-2 pr-3 font-medium">
              Expected
            </th>
            <th scope="col" className="w-36 pb-2 font-medium">
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {PLAN_MATERIALS.map((material) => (
            <tr key={material.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{material.item}</p>
                <p className="font-mono text-xs text-muted-foreground">{material.order}</p>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{material.quantity}</td>
              <td className="py-2 pr-3 tabular-nums text-medium-foreground">{material.expected}</td>
              <td className="py-2">
                <StatusIndicator
                  tone={material.tone}
                  shape={material.tone === 'warning' ? 'square' : material.tone === 'success' ? 'dot' : 'ring'}
                  label={material.state}
                  size="sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function PlanShutdownPanel() {
  return (
    <DashboardPanel
      title="Upcoming shutdown"
      description="Gas compression turnaround, 4 to 11 May"
      footnote="Scope freezes on 3 April, in 22 days. 15 work orders still need approval."
    >
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <dt className="text-xs text-muted-foreground">Work orders</dt>
          <dd>
            <ValueReadout value={PLAN_SHUTDOWN_ORDERS} size="md" />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Planned hours</dt>
          <dd>
            <ValueReadout value={2340} unit="h" size="md" />
          </dd>
        </div>
      </dl>
      <ul className="flex w-full flex-col gap-3 border-t border-default pt-3">
        {PLAN_SHUTDOWN.map((step) => (
          <li key={step.id}>
            <LinearGauge
              label={step.label}
              value={step.value}
              min={0}
              max={PLAN_SHUTDOWN_ORDERS}
              unit={`of ${PLAN_SHUTDOWN_ORDERS}`}
              size="sm"
              showScale={false}
            />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

/**
 * Archetype: schedule-first board with an inspector rail.
 * Dominant element: the week schedule, crews as rows and jobs as bars.
 * Interaction: selecting a bar fills the inspector column; the work type switch dims every other bar.
 */
function PlanDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>('WO-104471');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <DashboardFrame
      title="Maintenance planning"
      subtitle="Nordkapp · week 11, 9 to 15 March 2026 · updated 14:00 UTC"
      status={<StatusIndicator tone="warning" shape="square" label="1 crew over capacity" detail="instrument" />}
      actions={
        <>
          <Button variant="outline" size="sm">
            Freeze week 12
          </Button>
          <Button size="sm">Create work order</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <DashboardGrid>
          <DashboardCell span={9}>
            <PlanBoardPanel selectedId={selectedId} onSelect={setSelectedId} typeFilter={typeFilter} onTypeFilter={setTypeFilter} />
          </DashboardCell>
          <DashboardCell span={3}>
            <PlanInspectorPanel jobId={selectedId} />
          </DashboardCell>
        </DashboardGrid>
        <DashboardGrid>
          <DashboardCell span={3}>
            <PlanFiguresPanel />
          </DashboardCell>
          <DashboardCell span={3}>
            <PlanBacklogPanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <PlanOverduePanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <PlanMaterialsPanel />
          </DashboardCell>
          <DashboardCell span={3}>
            <PlanTypesPanel />
          </DashboardCell>
          <DashboardCell span={3}>
            <PlanShutdownPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function MaintPlanDashSignature() {
  return (
    <ThemeScope preset="fjord" className="w-full">
      <PlanDashboard />
    </ThemeScope>
  );
}

function MaintPlanDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <PlanDashboard />
    </ThemeScope>
  );
}

function MaintPlanDashDenseData() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <PlanDashboard />
    </ThemeScope>
  );
}

function MaintPlanDashFjordDark() {
  return (
    <ThemeScope preset="fjord-dark" className="w-full">
      <PlanDashboard />
    </ThemeScope>
  );
}

function MaintPlanDashBoard() {
  const [selectedId, setSelectedId] = useState<string | null>('WO-104482');
  const [typeFilter, setTypeFilter] = useState('corrective');
  return <PlanBoardPanel selectedId={selectedId} onSelect={setSelectedId} typeFilter={typeFilter} onTypeFilter={setTypeFilter} />;
}

function MaintPlanDashInspector() {
  return <PlanInspectorPanel jobId="WO-104458" />;
}

function MaintPlanDashFigures() {
  return <PlanFiguresPanel />;
}

function MaintPlanDashBacklog() {
  return <PlanBacklogPanel />;
}

function MaintPlanDashTypes() {
  return <PlanTypesPanel />;
}

function MaintPlanDashOverdue() {
  return <PlanOverduePanel />;
}

function MaintPlanDashMaterials() {
  return <PlanMaterialsPanel />;
}

function MaintPlanDashShutdown() {
  return <PlanShutdownPanel />;
}

export default definePage({
  id: 'maintenance-planning',
  title: 'Maintenance planning',
  summary:
    'The planner’s week as a board: crews down the side, days across, every job a bar. Select a job to inspect it, then check the backlog, the overdue work, the parts that are late and the shutdown that is coming.',
  guidance: {
    use: [
      'For the weekly planning meeting and the daily check of what moved.',
      'When the question is who does what on which day, and whether the crews can carry it.',
      'Show planned hours against capacity on the crew itself, where the overload is decided.',
      'Keep backlog and compliance as a quiet column of figures beside the schedule.',
    ],
    avoid: [
      'Editing the plan by dragging here; this board shows the plan and opens the job.',
      'More than two rows of bars per crew; split the crew or shorten the period.',
      'Colour for work type on the bars; colour is reserved for waiting and overdue.',
      'A backlog total without its split by priority and type.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Fjord theme. Schedule-first: the week board takes most of the screen, with an inspector and figures in a narrow rail.',
      specimens: [
        {
          id: 'MaintPlanDashSignature',
          title: 'Maintenance planning',
          note: 'Pick it as the planner’s main screen for one site and one week.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/domains/ShareBarList.tsx',
            'industrial/operations/DistributionBar.tsx',
            'industrial/operations/PriorityBadge.tsx',
            'industrial/LinearGauge.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/TrendDelta.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: MaintPlanDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'MaintPlanDashAura',
          title: 'Aura',
          note: 'Pick it when the planner works inside a product on the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: MaintPlanDashAura,
        },
        {
          id: 'MaintPlanDashDenseData',
          title: 'Dense data',
          note: 'Pick it for planners who keep many crews and long tables on one screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: MaintPlanDashDenseData,
        },
        {
          id: 'MaintPlanDashFjordDark',
          title: 'Fjord dark',
          note: 'Pick it for the planning room screen that stays on through the evening shift.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: MaintPlanDashFjordDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'MaintPlanDashBoard',
          title: 'Week schedule',
          note: 'Pick it when jobs must be read against crews and days, with load beside each crew.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: MaintPlanDashBoard,
        },
        {
          id: 'MaintPlanDashInspector',
          title: 'Job inspector',
          note: 'Pick it as the detail column beside a schedule or a list of work orders.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/PriorityBadge.tsx', 'industrial/StatusIndicator.tsx'],
          Component: MaintPlanDashInspector,
        },
        {
          id: 'MaintPlanDashFigures',
          title: 'Figure column',
          note: 'Pick it when the figures support a larger element and a tile row would compete with it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx'],
          Component: MaintPlanDashFigures,
        },
        {
          id: 'MaintPlanDashBacklog',
          title: 'Backlog by priority',
          note: 'Pick it to show where the backlog hours sit on the priority scale.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/ShareBarList.tsx'],
          Component: MaintPlanDashBacklog,
        },
        {
          id: 'MaintPlanDashOverdue',
          title: 'Overdue work orders',
          note: 'Pick it for the short list a planner must clear or reschedule this week.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/PriorityBadge.tsx'],
          Component: MaintPlanDashOverdue,
        },
        {
          id: 'MaintPlanDashTypes',
          title: 'Work by type',
          note: 'Pick it to track the balance between corrective and preventive work.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/DistributionBar.tsx'],
          Component: MaintPlanDashTypes,
        },
        {
          id: 'MaintPlanDashMaterials',
          title: 'Materials waiting',
          note: 'Pick it when late parts are what moves jobs in the schedule.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: MaintPlanDashMaterials,
        },
        {
          id: 'MaintPlanDashShutdown',
          title: 'Shutdown readiness',
          note: 'Pick it to keep the next turnaround in view while planning the current week.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          Component: MaintPlanDashShutdown,
        },
      ],
    },
  ],
});
