import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { Progress } from '@cognite/aura/components/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { IconCheck, IconCircleCheck, IconClock, IconPlayerPause, IconPlus, IconShieldLock } from '@cognite/aura/icons';
import { useState } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { FormField } from '../../../library/forms/FormField';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { AlarmRow } from '../../../library/industrial/operations/AlarmRow';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { DueLabel } from '../../../library/industrial/operations/DueLabel';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { ScheduleStrip } from '../../../library/industrial/operations/ScheduleStrip';
import { WorkOrderCard } from '../../../library/industrial/operations/WorkOrderCard';
import { WorkOrderRow } from '../../../library/industrial/operations/WorkOrderRow';
import {
  WORK_ORDER_STATUSES,
  countByStatus,
  earnedHours,
  isOverdue,
  priorityMeaning,
  sortByPriority,
  workOrderStatusLabel,
  workOrderTypeLabel,
} from '../../../library/industrial/operations/workOrders';
import { runStateStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ALARMS, ASSETS, PEOPLE, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { WorkOrder } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatAgo, formatDate, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './work-orders.tsx?raw';

function orderById(id: string): WorkOrder {
  const order = WORK_ORDERS.find((candidate) => candidate.id === id);
  if (!order) throw new Error(`Unknown work order ${id}`);
  return order;
}

/** Relative inside the next 24 hours, otherwise the date. */
function formatDue(dueAt: number): string {
  const ahead = dueAt - REFERENCE_NOW;
  if (ahead > 0 && ahead < DAY) return `in ${Math.round(ahead / HOUR)} h`;
  return formatDate(dueAt);
}

/** Everything a row or card needs about one order, looked up from the plant data. */
function orderProps(order: WorkOrder) {
  const asset = findAsset(order.assetId);
  return {
    order,
    assetTag: asset?.tag,
    assetName: asset?.name,
    due: formatDue(order.dueAt),
    overdue: isOverdue(order, REFERENCE_NOW),
    assignee: findPerson(order.assigneeId),
  };
}

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;

/** Orders that need a permit to work before the job can start. */
const PERMIT_ORDERS: readonly string[] = ['WO-104482', 'WO-104471'];

const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const WEEK = ['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13', 'Sat 14', 'Sun 15'] as const;

/** Thursday 12 March, 14:00, in day columns from Monday. */
const WEEK_NOW = 3 + 14 / 24;

const FORM_ASSETS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type)).map((asset) => ({
  value: asset.id,
  label: `${asset.tag} ${asset.name}`,
}));

const FORM_TYPES = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'modification', label: 'Modification' },
];

function WorkOrderRowDefault() {
  return (
    <ul className="w-full">
      <WorkOrderRow {...orderProps(orderById('WO-104482'))} />
    </ul>
  );
}

function WorkOrderPriorityBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {PRIORITIES.map((priority) => (
        <PriorityBadge key={priority} priority={priority} showMeaning />
      ))}
    </div>
  );
}

function WorkOrderStates() {
  const examples = ['WO-104466', 'WO-104479', 'WO-104482', 'WO-104471', 'WO-104431'].map(orderById);
  return (
    <ul aria-label="Work order states" className="flex w-full flex-col divide-y divide-default">
      {examples.map((order) => (
        <WorkOrderRow key={order.id} {...orderProps(order)} />
      ))}
    </ul>
  );
}

function WorkOrderStatusBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {WORK_ORDER_STATUSES.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}

function WorkOrderOverdue() {
  const order = orderById('WO-104458');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul>
        <WorkOrderRow {...orderProps(order)} density="compact" className="py-0" />
      </ul>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <DueLabel due="in 6 h" />
        <DueLabel due={formatDate(order.dueAt)} overdue />
        <DueLabel due={formatDate(order.dueAt)} overdue done />
      </div>
    </div>
  );
}

function WorkOrderPermit() {
  const order = orderById('WO-104482');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul>
        <WorkOrderRow {...orderProps(order)} permitRequired density="compact" className="py-0" />
      </ul>
      <div className="flex items-start gap-3 rounded-lg bg-warning-background px-3 py-2 text-warning-foreground">
        <IconShieldLock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">Permit to work required</span>
          <span className="text-xs">
            Hot work and isolation of <span className="font-mono">23-KA-9103</span>. Permit <span className="font-mono">PTW-2291</span> is approved until 13 Mar, 06:00.
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkOrderCardDefault() {
  return (
    <div className="w-full max-w-xs">
      <WorkOrderCard {...orderProps(orderById('WO-104482'))} permitRequired />
    </div>
  );
}

function WorkOrderCardWaiting() {
  return (
    <div className="w-full max-w-xs">
      <WorkOrderCard {...orderProps(orderById('WO-104471'))} blockedBy="Waiting for gasket set, expected 14 Mar" />
    </div>
  );
}

function WorkOrderCrew() {
  const lead = findPerson('tb');
  const crew = ['tb', 'jn', 'ak', 'ms', 'lw'].flatMap((id) => {
    const person = findPerson(id);
    return person ? [person] : [];
  });
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      {lead ? (
        <div className="flex items-center gap-3">
          <PersonAvatar name={lead.name} initials={lead.initials} colorKey={lead.id} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{lead.name}</p>
            <p className="truncate text-xs text-muted-foreground">Assignee · {lead.role}</p>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">Crew · {crew.length} people</span>
        <AvatarGroup people={crew} max={3} sizes="xsm" label="Crew" />
      </div>
    </div>
  );
}

function WorkOrderProgressHours() {
  const order = orderById('WO-104482');
  const logged = 4.5;
  const earned = earnedHours(order);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <LinearGauge label="Work completed" value={order.progress} unit="%" />
      <LinearGauge label="Hours logged of estimate" value={logged} max={order.estimatedHours} unit="h" decimals={1} tone="warning" target={earned} showScale />
      <p className="text-xs text-warning-foreground-strong tabular-nums">
        {(logged - earned).toFixed(1)} h over plan: {logged.toFixed(1)} h logged for work planned at {earned.toFixed(1)} h.
      </p>
    </div>
  );
}

function WorkOrderLinked() {
  const order = orderById('WO-104482');
  const asset = findAsset(order.assetId);
  const alarm = ALARMS.find((candidate) => candidate.assetId === order.assetId);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Linked asset</span>
        {asset ? (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-base-foreground">{asset.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
            </div>
            <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Raised from alarm</span>
        {alarm ? (
          <ul>
            <AlarmRow alarm={alarm} age={formatAgo(alarm.raisedAt)} density="compact" className="py-0" />
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function WorkOrderChecklist() {
  const tasks = [
    'Isolate and lock out the recompressor',
    'Remove drive-end bearing cover',
    'Inspect bearing pads and measure clearance',
    'Replace bearing if clearance exceeds 0.25 mm',
    'Refit cover, remove isolation and test run',
  ];
  const [done, setDone] = useState<readonly number[]>([0, 1]);
  const toggle = (index: number, checked: boolean) => setDone((current) => (checked ? [...current, index] : current.filter((entry) => entry !== index)));
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Tasks</span>
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {done.length} of {tasks.length} done
        </span>
      </div>
      <Progress value={done.length} max={tasks.length} size="sm" aria-label="Tasks completed" />
      <CheckboxGroup aria-label="Tasks">
        {tasks.map((task, index) => (
          <CheckboxItem key={task}>
            <CheckboxItemControl checked={done.includes(index)} onCheckedChange={(checked) => toggle(index, checked)} />
            <CheckboxItemLabel>{task}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </div>
  );
}

function WorkOrderSignOff() {
  const [verified, setVerified] = useState(false);
  const technician = findPerson('tb');
  const supervisor = findPerson('lw');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <span className="text-sm font-medium text-base-foreground">Completion sign-off</span>
      <ul className="flex flex-col gap-3">
        {technician ? (
          <li className="flex items-center gap-3">
            <PersonAvatar name={technician.name} initials={technician.initials} colorKey={technician.id} sizes="xsm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-base-foreground">Performed by {technician.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">Signed 12 Mar, 13:40 · 7.5 h logged</p>
            </div>
            <IconCircleCheck aria-label="Signed" className="size-4 shrink-0 text-success-foreground-strong" />
          </li>
        ) : null}
        {supervisor ? (
          <li className="flex items-center gap-3">
            <PersonAvatar name={supervisor.name} initials={supervisor.initials} colorKey={supervisor.id} sizes="xsm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-base-foreground">
                {verified ? 'Verified by' : 'To be verified by'} {supervisor.name}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">{verified ? 'Signed 12 Mar, 14:00' : 'Waiting for sign-off'}</p>
            </div>
            {verified ? (
              <IconCircleCheck aria-label="Signed" className="size-4 shrink-0 text-success-foreground-strong" />
            ) : (
              <IconClock aria-label="Pending" className="size-4 shrink-0 text-muted-foreground" />
            )}
          </li>
        ) : null}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{verified ? 'Work order closed' : 'Signing off closes the work order'}</span>
        <Button size="sm" variant={verified ? 'ghost' : 'default'} onClick={() => setVerified((current) => !current)}>
          {verified ? null : <IconCheck aria-hidden="true" />}
          {verified ? 'Undo sign-off' : 'Sign off and close'}
        </Button>
      </div>
    </div>
  );
}

function WorkOrderMyWork() {
  const me = PEOPLE.find((person) => person.id === 'jn');
  const mine = sortByPriority(WORK_ORDERS.filter((order) => order.assigneeId === 'jn' || order.assigneeId === null));
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">My work</span>
        <span className="text-xs text-muted-foreground">{me?.name} · assigned and unassigned</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {mine.map((order) => (
          <WorkOrderRow key={order.id} {...orderProps(order)} density="compact" />
        ))}
      </ul>
    </div>
  );
}

function WorkOrderQuickForm() {
  const [priority, setPriority] = useState<string[]>(['P2']);
  return (
    <form className="flex w-full max-w-md flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <FormField label="What needs doing" required>
        {(control) => <Input {...control} defaultValue="Inspect drive-end bearing" />}
      </FormField>
      <FormField label="Equipment" required>
        {(control) => (
          <Select items={FORM_ASSETS} defaultValue="23-ka-9101">
            <SelectTrigger {...control} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_ASSETS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type">
          {(control) => (
            <Select items={FORM_TYPES} defaultValue="inspection">
              <SelectTrigger {...control} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-base-foreground">
            Priority
          </span>
          <ToggleGroup
            label="Priority"
            selection="single"
            required
            variant="outline"
            size="sm"
            value={priority}
            onValueChange={setPriority}
            options={PRIORITIES.map((value) => ({ value, label: value }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {priority[0]} · {priorityMeaning(PRIORITIES.find((value) => value === priority[0]) ?? 'P3').toLowerCase()}
        </span>
        <Button type="submit" size="sm">
          <IconPlus aria-hidden="true" />
          Create work order
        </Button>
      </div>
    </form>
  );
}

function WorkOrderEmpty() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No open work orders</EmptyStateTitle>
      <EmptyStateDescription>Nothing is planned for Gas export this week. The last order closed on 10 Mar.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus aria-hidden="true" />
          Create work order
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function WorkOrderLoading() {
  return (
    <div className="w-full max-w-md">
      <SkeletonList rows={4} media={false} trailing label="Loading work orders" />
    </div>
  );
}

function WorkOrderBacklogTiles() {
  const overdue = OPEN_ORDERS.filter((order) => isOverdue(order, REFERENCE_NOW)).length;
  const dueThisWeek = OPEN_ORDERS.filter((order) => order.dueAt > REFERENCE_NOW && order.dueAt < REFERENCE_NOW + 4 * DAY).length;
  const backlogHours = OPEN_ORDERS.reduce((sum, order) => sum + order.estimatedHours - earnedHours(order), 0);
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiTile label="Open work orders" value={OPEN_ORDERS.length} delta={{ reference: 8, goodDirection: 'down', caption: 'vs last week', decimals: 0 }} />
      <KpiTile label="Overdue" value={overdue} tone={overdue > 0 ? 'critical' : 'neutral'} target={{ value: 0 }} />
      <KpiTile label="Due this week" value={dueThisWeek} footnote="Through Sun 15 Mar" />
      <KpiTile label="Backlog" value={backlogHours} unit="h" decimals={1} delta={{ reference: 61, goodDirection: 'down', caption: 'vs last week' }} />
    </div>
  );
}

function WorkOrderTypeBreakdown() {
  const hours = (type: WorkOrder['type']) => WORK_ORDERS.filter((order) => order.type === type).reduce((sum, order) => sum + order.estimatedHours, 0);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Work by type</span>
        <span className="text-xs text-muted-foreground">Estimated hours, this month</span>
      </div>
      <DistributionBar
        label="Estimated hours by work type"
        unit="h"
        segments={[
          { id: 'corrective', label: workOrderTypeLabel('corrective'), value: hours('corrective'), colorClass: 'bg-chart-1-450' },
          { id: 'preventive', label: workOrderTypeLabel('preventive'), value: hours('preventive'), colorClass: 'bg-chart-2-450' },
          { id: 'inspection', label: workOrderTypeLabel('inspection'), value: hours('inspection'), colorClass: 'bg-chart-3-450' },
          { id: 'modification', label: workOrderTypeLabel('modification'), value: hours('modification'), colorClass: 'bg-chart-4-450' },
        ]}
      />
    </div>
  );
}

function WorkOrderPriorityBreakdown() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Open by priority</span>
        <span className="text-xs text-muted-foreground tabular-nums">{OPEN_ORDERS.length} open</span>
      </div>
      <ul className="flex flex-col gap-3">
        {PRIORITIES.map((priority) => {
          const count = OPEN_ORDERS.filter((order) => order.priority === priority).length;
          return (
            <li key={priority} className="grid grid-cols-[2rem_5rem_minmax(0,1fr)_1.5rem] items-center gap-3">
              <PriorityBadge priority={priority} />
              <span className="text-xs text-muted-foreground">{priorityMeaning(priority)}</span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-chart-neutral-100">
                <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${(count / OPEN_ORDERS.length) * 100}%` }} />
              </span>
              <span className="text-right text-sm font-medium text-base-foreground tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WorkOrderPlannerTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Priority
            </th>
            <th scope="col" className={TH}>
              Work order
            </th>
            <th scope="col" className={TH}>
              Equipment
            </th>
            <th scope="col" className={TH}>
              Type
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={TH}>
              Assignee
            </th>
            <th scope="col" className={TH}>
              Due
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Est. hours
            </th>
            <th scope="col" className={TH}>
              Progress
            </th>
          </tr>
        </thead>
        <tbody>
          {sortByPriority(WORK_ORDERS).map((order) => {
            const props = orderProps(order);
            return (
              <tr key={order.id} className="border-t border-default">
                <td className={TD}>
                  <PriorityBadge priority={order.priority} />
                </td>
                <td className={TD}>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-base-foreground">{order.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap font-mono text-xs text-muted-foreground`}>{props.assetTag}</td>
                <td className={`${TD} text-muted-foreground`}>{workOrderTypeLabel(order.type)}</td>
                <td className={TD}>
                  <StatusBadge status={order.status} />
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {props.assignee ? (
                    <span className="flex items-center gap-2">
                      <PersonAvatar name={props.assignee.name} initials={props.assignee.initials} colorKey={props.assignee.id} sizes="xxsm" />
                      <span className="text-base-foreground">{props.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className={TD}>
                  <DueLabel due={props.due} overdue={props.overdue} done={order.status === 'done'} />
                </td>
                <td className={`${TD} text-right text-base-foreground tabular-nums`}>{order.estimatedHours}</td>
                <td className={`${TD} w-32`}>
                  <span className="flex items-center gap-2">
                    <Progress value={order.progress} size="sm" aria-label={`${order.id} progress`} className="flex-1" />
                    <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{order.progress}%</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WorkOrderKanban() {
  const counts = countByStatus(WORK_ORDERS);
  return (
    <div className="w-full overflow-x-auto">
      <div className="grid min-w-5xl grid-cols-5 gap-4">
        {WORK_ORDER_STATUSES.map((status) => (
          <section key={status} aria-label={workOrderStatusLabel(status)} className="flex min-w-0 flex-col gap-3">
            <h4 className="flex items-baseline justify-between px-1 text-sm font-medium text-base-foreground">
              {workOrderStatusLabel(status)}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{counts[status]}</span>
            </h4>
            {sortByPriority(WORK_ORDERS.filter((order) => order.status === status)).map((order) => (
              <WorkOrderCard
                key={order.id}
                {...orderProps(order)}
                showStatus={false}
                permitRequired={PERMIT_ORDERS.includes(order.id)}
                blockedBy={order.status === 'waiting' ? 'Waiting for gasket set' : undefined}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function WorkOrderSchedule() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Week 11 · 9–15 Mar 2026</span>
        <span className="text-xs text-muted-foreground">Line marks now, Thu 12 Mar 14:00 UTC</span>
      </div>
      <ScheduleStrip
        label="Work order schedule, week 11"
        columns={WEEK}
        now={WEEK_NOW}
        bars={[
          { id: 'WO-104458', label: 'WO-104458', sublabel: 'Standby start test, export pump B', start: 0, end: WEEK_NOW, text: 'Overdue since 8 Mar', tone: 'critical', tentative: true },
          { id: 'WO-104440', label: 'WO-104440', sublabel: 'Calibrate separator level transmitter', start: 2.3, end: 2.7, text: 'Done' },
          { id: 'WO-104482', label: 'WO-104482', sublabel: 'Inspect recompressor drive-end bearing', start: 3.3, end: 3.85, text: 'Tomás Barros' },
          { id: 'WO-104479', label: 'WO-104479', sublabel: 'Replace bearing temperature transmitter', start: 4.3, end: 4.75, text: 'Jonas Nyberg', tentative: true },
          { id: 'WO-104466', label: 'WO-104466', sublabel: 'Vibration survey, 1st stage compressor', start: 5.3, end: 5.8, text: 'Unassigned', tentative: true },
          { id: 'WO-104471', label: 'WO-104471', sublabel: 'Clean interstage cooler tube bundle', start: 5, end: 7, text: 'Magnus Solberg · continues', tone: 'warning', tentative: true },
        ]}
      />
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 rounded-xs bg-chart-1-450" />
          Started or done
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 rounded-xs bg-chart-1-200" />
          Planned
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 rounded-xs bg-chart-warning-200" />
          Waiting
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 rounded-xs bg-chart-critical-200" />
          Overdue
        </li>
      </ul>
    </div>
  );
}

function WorkOrderDetailHeader() {
  const order = orderById('WO-104482');
  const props = orderProps(order);
  const planner = findPerson('ms');
  return (
    <Card className="w-full gap-6">
      <CardHeader>
        <CardHeaderCenter>
          <CardDescription>
            <span className="font-mono">{order.id}</span> · {workOrderTypeLabel(order.type)}
          </CardDescription>
          <CardTitle as="h3">{order.title}</CardTitle>
        </CardHeaderCenter>
        <CardHeaderEnd className="gap-2">
          <Button variant="secondary" size="sm">
            <IconPlayerPause aria-hidden="true" />
            Put on hold
          </Button>
          <Button size="sm">
            <IconCheck aria-hidden="true" />
            Complete
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PriorityBadge priority={order.priority} showMeaning />
        <StatusBadge status={order.status} />
        <DueLabel due={`Due ${props.due} · ${formatDateTime(order.dueAt)}`} />
        <span className="inline-flex items-center gap-1 text-xs text-warning-foreground-strong">
          <IconShieldLock aria-hidden="true" className="size-3.5" />
          Permit <span className="font-mono">PTW-2291</span>
        </span>
      </div>
      <CardContent>
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MetadataList
            items={[
              {
                label: 'Equipment',
                value: (
                  <>
                    <span className="font-mono">{props.assetTag}</span> {props.assetName}
                  </>
                ),
              },
              { label: 'Assignee', value: props.assignee?.name },
              { label: 'Planner', value: planner?.name },
              { label: 'Raised from', value: 'Alarm alm-4812, 12 Mar 13:46' },
            ]}
          />
          <div className="flex min-w-0 flex-col gap-4">
            <LinearGauge label="Work completed" value={order.progress} unit="%" size="sm" />
            <LinearGauge label="Hours logged of estimate" value={4.5} max={order.estimatedHours} unit="h" decimals={1} size="sm" tone="warning" target={earnedHours(order)} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">2 of 5 tasks done · last update 13:54 by {props.assignee?.name}</span>
        </CardFooterStart>
      </CardFooter>
    </Card>
  );
}

export default definePage({
  id: 'work-orders',
  title: 'Work orders',
  summary:
    'Maintenance work from one row to a planning board: priority, the job, the equipment, status, due date and who has it. The same parts make the row, the card, the table and the schedule, so an order looks like itself wherever it appears.',
  guidance: {
    use: [
      'Lead with priority and keep its colour for P1 and P2; most work is normal and should look it.',
      'Say "Overdue" in words with an icon; a red date alone is easy to miss and impossible to hear.',
      'Show the equipment tag on every order — it is how the job is found in the field.',
      'Give "unassigned" its own text, so a missing avatar is never read as a loading glitch.',
    ],
    avoid: [
      'Status and priority in the same colour family side by side without labels.',
      'A progress bar on work that has not started or is already done.',
      'Drag-and-drop as the only way to move an order; a board is a view, the status control is the action.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Rows and badges',
      description: 'The work order row and the vocabulary it is built from.',
      specimens: [
        {
          id: 'WorkOrderRowDefault',
          title: 'Work order row',
          note: 'Pick it as the line item of any work list: priority, job, equipment, status, due date and assignee.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderRow.tsx', 'industrial/operations/workOrders.ts'],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderRowDefault,
        },
        {
          id: 'WorkOrderPriorityBadges',
          title: 'Priority badges',
          note: 'Pick the badge with its meaning where readers may not know the scale; the code alone inside rows.',
          origin: 'custom',
          uses: ['industrial/operations/PriorityBadge.tsx'],
          size: 'md',
          Component: WorkOrderPriorityBadges,
        },
        {
          id: 'WorkOrderStatusBadges',
          title: 'Status badges',
          note: 'Pick the badge alone in headers and tables; each status has its own icon, so it reads without colour.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx'],
          size: 'md',
          Component: WorkOrderStatusBadges,
        },
        {
          id: 'WorkOrderStates',
          title: 'Work order states',
          note: 'Pick these five states for the life of an order: open, planned, in progress, waiting and done.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderRow.tsx', 'display/StatusBadge.tsx'],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderStates,
        },
        {
          id: 'WorkOrderOverdue',
          title: 'Overdue indication',
          note: 'Pick it wherever a due date shows: late work says "Overdue" with an icon, finished work never does.',
          origin: 'custom',
          uses: ['industrial/operations/DueLabel.tsx', 'industrial/operations/WorkOrderRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderOverdue,
        },
        {
          id: 'WorkOrderPermit',
          title: 'Permit required',
          note: 'Pick it for jobs that cannot start without a permit to work: a marker on the row, the permit itself on the detail.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderPermit,
        },
      ],
    },
    {
      id: 'cards',
      title: 'Cards and detail parts',
      description: 'The order as a card, and the blocks a detail page is made of.',
      specimens: [
        {
          id: 'WorkOrderCardDefault',
          title: 'Work order card',
          note: 'Pick it for boards and "my work" grids: the same parts as the row, stacked, with progress once work has started.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderCard.tsx'],
          align: 'stretch',
          Component: WorkOrderCardDefault,
        },
        {
          id: 'WorkOrderCardWaiting',
          title: 'Waiting card',
          note: 'Pick it when work is held: one line says what it is waiting for and until when.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderCard.tsx'],
          align: 'stretch',
          Component: WorkOrderCardWaiting,
        },
        {
          id: 'WorkOrderCrew',
          title: 'Assignee and crew',
          note: 'Pick it on a detail page: the accountable person in full, the rest of the crew as a group.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'display/AvatarGroup.tsx'],
          align: 'stretch',
          Component: WorkOrderCrew,
        },
        {
          id: 'WorkOrderProgressHours',
          title: 'Estimated against actual hours',
          note: 'Pick it to show whether a job is on plan: work completed, hours logged, and a tick where the hours should be.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/operations/workOrders.ts'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderProgressHours,
        },
        {
          id: 'WorkOrderLinked',
          title: 'Linked asset and alarm',
          note: 'Pick it so the order carries its context: the equipment with its current state and the alarm that raised it.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderLinked,
        },
        {
          id: 'WorkOrderChecklist',
          title: 'Task checklist',
          note: 'Pick it for the steps of a job: ticking a task moves the count and the bar.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: WorkOrderChecklist,
        },
        {
          id: 'WorkOrderSignOff',
          title: 'Completion sign-off',
          note: 'Pick it to close a job: who performed it, who verifies it, and the one button that closes the order.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderSignOff,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists and forms',
      description: 'A personal work list, the form that adds to it, and its empty and loading states.',
      specimens: [
        {
          id: 'WorkOrderMyWork',
          title: 'My work list',
          note: 'Pick it for a technician: their orders and the unassigned ones, highest priority first, in compact rows.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderRow.tsx', 'industrial/operations/workOrders.ts'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderMyWork,
        },
        {
          id: 'WorkOrderQuickForm',
          title: 'Quick create form',
          note: 'Pick it to raise an order from an alarm or an asset page: four fields, the rest is filled in by the planner.',
          origin: 'custom',
          uses: ['forms/FormField.tsx', 'actions/ToggleGroup.tsx', 'industrial/operations/workOrders.ts'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderQuickForm,
        },
        {
          id: 'WorkOrderEmpty',
          title: 'Empty',
          note: 'Pick it when a list has no open orders: say what the scope is and offer to create one.',
          origin: 'custom',
          size: 'md',
          Component: WorkOrderEmpty,
        },
        {
          id: 'WorkOrderLoading',
          title: 'Loading',
          note: 'Pick it while orders load, so the list keeps its rhythm.',
          origin: 'custom',
          uses: ['feedback/SkeletonList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderLoading,
        },
      ],
    },
    {
      id: 'summaries',
      title: 'Summaries',
      description: 'The backlog in figures.',
      specimens: [
        {
          id: 'WorkOrderBacklogTiles',
          title: 'Backlog summary tiles',
          note: 'Pick it at the top of a planning view: how much is open, overdue, due soon and how many hours it adds up to.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/operations/workOrders.ts'],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderBacklogTiles,
        },
        {
          id: 'WorkOrderTypeBreakdown',
          title: 'Work type breakdown',
          note: 'Pick it to see the balance of corrective against planned work; types are categories, so they take chart colours.',
          origin: 'custom',
          uses: ['industrial/operations/DistributionBar.tsx', 'industrial/operations/workOrders.ts'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderTypeBreakdown,
        },
        {
          id: 'WorkOrderPriorityBreakdown',
          title: 'Open by priority',
          note: 'Pick it beside the type breakdown: how the open orders spread over P1 to P4.',
          origin: 'custom',
          uses: ['industrial/operations/PriorityBadge.tsx', 'industrial/operations/workOrders.ts'],
          size: 'md',
          align: 'stretch',
          Component: WorkOrderPriorityBreakdown,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Tables, boards and schedules',
      description: 'The planner’s views of all the work at once.',
      specimens: [
        {
          id: 'WorkOrderPlannerTable',
          title: 'Planner table',
          note: 'Pick a table when the planner compares and sorts: every column of the order side by side.',
          origin: 'custom',
          uses: [
            'industrial/operations/PriorityBadge.tsx',
            'industrial/operations/DueLabel.tsx',
            'display/StatusBadge.tsx',
            'display/PersonAvatar.tsx',
            'industrial/operations/workOrders.ts',
          ],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderPlannerTable,
        },
        {
          id: 'WorkOrderKanban',
          title: 'Board by status',
          note: 'Pick a board to see flow: one column per status, cards ordered by priority, counts in the headings.',
          origin: 'custom',
          uses: ['industrial/operations/WorkOrderCard.tsx', 'industrial/operations/workOrders.ts'],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderKanban,
        },
        {
          id: 'WorkOrderSchedule',
          title: 'Week schedule',
          note: 'Pick the strip to see when work happens: one bar per order across the week, with now marked.',
          origin: 'custom',
          uses: ['industrial/operations/ScheduleStrip.tsx'],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderSchedule,
        },
        {
          id: 'WorkOrderDetailHeader',
          title: 'Work order detail header',
          note: 'Pick it at the top of a work order page: what, how urgent, where it stands, who has it, and the two actions.',
          origin: 'custom',
          uses: [
            'industrial/operations/PriorityBadge.tsx',
            'industrial/operations/DueLabel.tsx',
            'display/StatusBadge.tsx',
            'display/MetadataList.tsx',
            'industrial/LinearGauge.tsx',
          ],
          size: 'full',
          align: 'stretch',
          Component: WorkOrderDetailHeader,
        },
      ],
    },
  ],
});
