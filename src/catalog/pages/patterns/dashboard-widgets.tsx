import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconArrowRight, IconDownload, IconFileText, IconPlus, IconShare, IconUserPlus } from '@cognite/aura/icons';
import { useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { Sparkline } from '../../../library/industrial/Sparkline';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DistributionStrip } from '../../../library/patterns/collections/DistributionStrip';
import { DonutBreakdown } from '../../../library/patterns/product/DonutBreakdown';
import { WidgetFrame } from '../../../library/patterns/product/WidgetFrame';
import type { WidgetAction } from '../../../library/patterns/product/WidgetFrame';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { Timeline } from '../../../library/primitives/timeline/Timeline';
import { TimelineItem } from '../../../library/primitives/timeline/TimelineItem';
import { PEOPLE, SITES, WORK_ORDERS, findPerson } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-widgets.tsx?raw';

const DASH_NUMBER = new Intl.NumberFormat('en-US');
const dashNoop = () => undefined;

const DASH_ACTIVE_USERS = { value: 148, previous: 139 };
const DASH_USERS_30D = makeValues({ seed: 71, points: 30, base: 128, amplitude: 8, noise: 4, drift: 18, decimals: 0 });
const DASH_REQUESTS_BY_RANGE: Record<string, readonly number[]> = {
  '24h': makeValues({ seed: 72, points: 24, base: 62, amplitude: 18, noise: 6, cycles: 1, decimals: 0, min: 0 }),
  '7d': makeValues({ seed: 73, points: 28, base: 58, amplitude: 14, noise: 8, cycles: 7, decimals: 0, min: 0 }),
  '30d': makeValues({ seed: 74, points: 30, base: 52, amplitude: 6, noise: 5, drift: 14, decimals: 0, min: 0 }),
};
const DASH_RANGES = [
  { value: '24h', label: '24 h', name: 'Last 24 hours' },
  { value: '7d', label: '7 d', name: 'Last 7 days' },
  { value: '30d', label: '30 d', name: 'Last 30 days' },
];

const DASH_MENU: readonly WidgetAction[] = [
  { id: 'refresh', label: 'Refresh data', onSelect: dashNoop },
  { id: 'export', label: 'Export as CSV', onSelect: dashNoop },
  { id: 'edit', label: 'Edit widget', onSelect: dashNoop },
  { id: 'remove', label: 'Remove from dashboard', onSelect: dashNoop, destructive: true },
];

const DASH_TOP_VIEWS = [
  { id: 'overview', label: 'Plant overview', value: 1284 },
  { id: 'alarms', label: 'Alarm list', value: 962 },
  { id: 'compression', label: 'Gas compression', value: 611 },
  { id: 'plan', label: 'Weekly plan', value: 348 },
  { id: 'export', label: 'Export metering', value: 173 },
  { id: 'energy', label: 'Energy balance', value: 96 },
];

const DASH_ACTIVITY = [
  { id: 'a1', personId: 'ak', action: 'shared', object: 'Compressor comparison', at: REFERENCE_NOW - 12 * MINUTE },
  { id: 'a2', personId: 'ms', action: 'updated', object: 'Weekly plan', at: REFERENCE_NOW - 47 * MINUTE },
  { id: 'a3', personId: 'ih', action: 'commented on', object: 'Shift log, 12 March', at: REFERENCE_NOW - 2 * HOUR },
  { id: 'a4', personId: 'jn', action: 'created', object: 'Transmitter calibration view', at: REFERENCE_NOW - 5 * HOUR },
] as const;

const DASH_SERVICES: readonly { id: string; name: string; tone: Tone; label: string; detail: string }[] = [
  { id: 'historian', name: 'Historian extractor', tone: 'success', label: 'Running', detail: 'Last value 8 s ago' },
  { id: 'sap', name: 'SAP PM sync', tone: 'success', label: 'Running', detail: 'Synced 14:00' },
  { id: 'docs', name: 'Document indexer', tone: 'warning', label: 'Delayed', detail: '212 files queued' },
  { id: 'alarms', name: 'Alarm system link', tone: 'critical', label: 'Stopped', detail: 'No data since 13:12' },
];

const DASH_SITE_USERS = [
  { id: 'nordkapp', label: SITES[0].name, detail: SITES[0].region, value: 64 },
  { id: 'hammerfest', label: SITES[2].name, detail: SITES[2].region, value: 41 },
  { id: 'valhall-sor', label: SITES[1].name, detail: SITES[1].region, value: 29 },
  { id: 'stord', label: SITES[3].name, detail: SITES[3].region, value: 14 },
];

const DASH_AGENDA = [
  { id: 'e1', time: '14:30', title: 'Shift handover', place: 'Control room' },
  { id: 'e2', time: '15:00', title: 'Bearing inspection review', place: 'WO-104482' },
  { id: 'e3', time: '16:15', title: 'Weekly plan freeze', place: 'Maintenance office' },
] as const;

const DASH_WORK_TYPES = (['corrective', 'preventive', 'inspection', 'modification'] as const).map((type) => ({
  id: type,
  label: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
  value: WORK_ORDERS.filter((order) => order.type === type).length,
}));

const DASH_WEEKLY = [
  { site: 'Nordkapp', current: 37, previous: 31 },
  { site: 'Hammerfest LNG', current: 22, previous: 26 },
  { site: 'Valhall Sør', current: 18, previous: 15 },
  { site: 'Stord terminal', current: 9, previous: 9 },
];

const DASH_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

function DashStatValue({ value, unit }: { value: string; unit?: string }) {
  return (
    <span className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">
      {value}
      {unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span> : null}
    </span>
  );
}

function DashOrderTable() {
  return (
    <Table surface="card">
      <TableCaption srOnly>Open work orders, soonest due first</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Work order</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead numeric>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DASH_OPEN_ORDERS.map((order) => (
          <TableRow key={order.id}>
            <TableCell rowHeader>
              <span className="flex flex-col font-normal">
                <span>{order.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
              </span>
            </TableCell>
            <TableCell wrap="nowrap">{findPerson(order.assigneeId)?.name ?? 'Unassigned'}</TableCell>
            <TableCell numeric>{formatDate(order.dueAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DashActivityList() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {DASH_ACTIVITY.map((entry) => {
        const person = findPerson(entry.personId) ?? PEOPLE[0];
        return (
          <li key={entry.id} className="flex items-start gap-3">
            <PersonAvatar name={person.name} sizes="xsm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm text-base-foreground">
                <span className="font-medium">{person.name}</span> {entry.action} {entry.object}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{formatAgo(entry.at)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DashServiceList() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {DASH_SERVICES.map((service) => (
        <li key={service.id} className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-base-foreground">{service.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{service.detail}</span>
          </span>
          <StatusIndicator size="sm" tone={service.tone} label={service.label} shape={service.tone === 'critical' ? 'diamond' : service.tone === 'warning' ? 'square' : 'dot'} />
        </li>
      ))}
    </ul>
  );
}

function DashWidgetStat() {
  return (
    <WidgetFrame title="Active users" description="This week, all sites" footer={<span>Updated 14:00</span>}>
      <div className="flex flex-col gap-2">
        <DashStatValue value={String(DASH_ACTIVE_USERS.value)} />
        <TrendDelta value={DASH_ACTIVE_USERS.value} reference={DASH_ACTIVE_USERS.previous} decimals={0} goodDirection="up" caption="vs last week" />
      </div>
    </WidgetFrame>
  );
}

function DashWidgetTrend() {
  return (
    <WidgetFrame title="Active users" description="Last 30 days">
      <div className="flex flex-col gap-3">
        <DashStatValue value={String(DASH_ACTIVE_USERS.value)} />
        <Sparkline values={DASH_USERS_30D} label="Active users per day, last 30 days" decimals={0} height={48} variant="area" showLast />
      </div>
    </WidgetFrame>
  );
}

function DashWidgetGoal() {
  const done = 338;
  const goal = 412;

  return (
    <WidgetFrame title="Assets with documents" description="Goal for the first quarter">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <DashStatValue value={DASH_NUMBER.format(done)} />
          <span className="text-xs tabular-nums text-muted-foreground">of {DASH_NUMBER.format(goal)}</span>
        </div>
        <Progress value={done} max={goal} aria-label={`${done} of ${goal} assets have documents linked`} />
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round((done / goal) * 100)}% · {goal - done} to go · 19 days left
        </span>
      </div>
    </WidgetFrame>
  );
}

function DashWidgetCompare() {
  const rows = [
    { id: 'now', label: 'This week', value: 86 },
    { id: 'before', label: 'Last week', value: 74 },
  ];

  return (
    <WidgetFrame title="Work orders completed" description="All sites">
      <div className="flex flex-col gap-3">
        <TrendDelta value={86} reference={74} format="percent" goodDirection="up" caption="vs last week" size="md" />
        <BreakdownList label="Work orders completed, this week and last week" items={rows} layout="stacked" />
      </div>
    </WidgetFrame>
  );
}

function DashWidgetSplit() {
  return (
    <WidgetFrame title="Open work orders" description="By status">
      <div className="flex flex-col gap-3">
        <DashStatValue value="23" />
        <DistributionStrip
          label="Open work orders by status"
          size="sm"
          segments={[
            { id: 'planned', label: 'Planned', value: 11, series: 1 },
            { id: 'progress', label: 'In progress', value: 7, series: 2 },
            { id: 'waiting', label: 'Waiting', value: 5, series: 3 },
          ]}
        />
      </div>
    </WidgetFrame>
  );
}

function DashWidgetRatio() {
  return (
    <WidgetFrame title="Data sources" description="Reporting in the last hour">
      <div className="flex items-center gap-4">
        <ProgressRing label="Sources reporting" value={5} max={6} size="md" showLabel={false} showValue={false} />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">5 of 6 reporting</span>
          <span className="text-xs text-muted-foreground">Alarm system link has been silent since 13:12.</span>
        </div>
      </div>
    </WidgetFrame>
  );
}

function DashWidgetTopList() {
  return (
    <WidgetFrame
      title="Most opened views"
      description="This week"
      footer={
        <Button variant="ghost" size="sm" className="-ml-2">
          View all <IconArrowRight />
        </Button>
      }
    >
      <BreakdownList label="Most opened views this week" items={DASH_TOP_VIEWS} ranked limit={5} />
    </WidgetFrame>
  );
}

function DashWidgetRecentActivity() {
  return (
    <WidgetFrame
      title="Recent activity"
      description="People you work with"
      footer={
        <Button variant="ghost" size="sm" className="-ml-2">
          View all <IconArrowRight />
        </Button>
      }
    >
      <DashActivityList />
    </WidgetFrame>
  );
}

function DashWidgetStatusList() {
  return (
    <WidgetFrame title="Integrations" description="2 of 4 need attention" footer={<span>Checked 14:00</span>}>
      <DashServiceList />
    </WidgetFrame>
  );
}

function DashWidgetRegionList() {
  return (
    <WidgetFrame title="Users by site" description="Active this week">
      <BreakdownList label="Active users by site" items={DASH_SITE_USERS} showShare scale="total" />
    </WidgetFrame>
  );
}

function DashWidgetAgenda() {
  return (
    <WidgetFrame title="Today" description="Thursday 12 March" footer={<span>3 more tomorrow</span>}>
      <Timeline label="Today's agenda" layout="time-start" density="compact">
        {DASH_AGENDA.map((event, index) => (
          <TimelineItem
            key={event.id}
            time={event.time}
            title={event.title}
            description={event.place}
            state={index === 0 ? 'current' : 'pending'}
            meta={index === 0 ? <span className="text-xs text-muted-foreground">Next</span> : undefined}
          />
        ))}
      </Timeline>
    </WidgetFrame>
  );
}

function DashWidgetQuickActions() {
  return (
    <WidgetFrame title="Quick actions">
      <div className="grid w-full grid-cols-2 gap-2">
        <Button variant="secondary" className="w-full justify-start">
          <IconPlus /> New view
        </Button>
        <Button variant="secondary" className="w-full justify-start">
          <IconUserPlus /> Invite
        </Button>
        <Button variant="secondary" className="w-full justify-start">
          <IconFileText /> Shift log
        </Button>
        <Button variant="secondary" className="w-full justify-start">
          <IconDownload /> Export
        </Button>
      </div>
    </WidgetFrame>
  );
}

function DashWidgetDonut() {
  return (
    <WidgetFrame title="Work orders by type" description="Open and planned, Nordkapp" actions={DASH_MENU.slice(0, 2)}>
      <DonutBreakdown label="Work orders by type" segments={DASH_WORK_TYPES} totalLabel="orders" />
    </WidgetFrame>
  );
}

function DashWidgetComparisonBars() {
  return (
    <WidgetFrame title="Work orders completed by site" description="This week against last week">
      <CategoryChart
        className="w-full"
        label="Work orders completed per site this week and last week; Nordkapp completed the most with 37"
        rows={DASH_WEEKLY}
        categoryKey="site"
        series={[
          { key: 'current', label: 'This week' },
          { key: 'previous', label: 'Last week', color: 'var(--color-chart-neutral-300)' },
        ]}
        legend
        heightClassName="h-44"
      />
    </WidgetFrame>
  );
}

function DashWidgetTable() {
  return (
    <WidgetFrame
      title="Open work orders"
      description="Soonest due first"
      footer={
        <>
          <span className="tabular-nums">Showing 4 of 23</span>
          <Button variant="ghost" size="sm">
            View all <IconArrowRight />
          </Button>
        </>
      }
    >
      <DashOrderTable />
    </WidgetFrame>
  );
}

function DashWidgetNotes() {
  const [saved, setSaved] = useState('Export pump B standby test is overdue. Ask day shift to run it before Friday.');
  const [text, setText] = useState(saved);
  const dirty = text !== saved;

  return (
    <WidgetFrame title="Notes" description="Only you can see these">
      <div className="flex w-full flex-col gap-2">
        <Textarea aria-label="Notes" rows={7} value={text} onChange={(event) => setText(event.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <span role="status" className="text-xs text-muted-foreground">
            {dirty ? 'Unsaved changes' : 'Saved'}
          </span>
          <Button size="sm" variant="secondary" disabled={!dirty} onClick={() => setSaved(text)}>
            Save note
          </Button>
        </div>
      </div>
    </WidgetFrame>
  );
}

function DashWidgetHeaderMenu() {
  const [last, setLast] = useState('Nothing chosen yet');
  const actions = DASH_MENU.map((action) => ({ ...action, onSelect: () => setLast(`Chose "${action.label}"`) }));

  return (
    <WidgetFrame title="Integrations" description="Open the menu to act on the widget" actions={actions} footer={<span role="status">{last}</span>}>
      <DashServiceList />
    </WidgetFrame>
  );
}

function DashWidgetHeaderRange() {
  const [range, setRange] = useState('7d');
  const values = DASH_REQUESTS_BY_RANGE[range] ?? DASH_REQUESTS_BY_RANGE['7d'];
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <WidgetFrame
      title="API requests"
      description="All projects"
      headerEnd={<TimeRangeSwitch options={DASH_RANGES} value={range} onValueChange={setRange} />}
      actions={DASH_MENU.slice(0, 2)}
    >
      <div className="flex flex-col gap-3">
        <DashStatValue value={DASH_NUMBER.format(total)} unit="k requests" />
        <Sparkline values={values} label="API requests in the chosen range" unit="k" decimals={0} height={64} variant="bar" />
      </div>
    </WidgetFrame>
  );
}

function DashWidgetLoading() {
  return <WidgetFrame title="Active users" description="This week, all sites" status="loading" />;
}

function DashWidgetEmpty() {
  return (
    <WidgetFrame
      title="Recent activity"
      description="People you work with"
      status="empty"
      empty={{
        title: 'No activity yet',
        description: 'Changes to views you follow show up here.',
        action: (
          <Button variant="secondary" size="sm">
            <IconShare /> Share a view
          </Button>
        ),
      }}
    />
  );
}

function DashWidgetError() {
  const [status, setStatus] = useState<'error' | 'ready'>('error');

  return (
    <WidgetFrame
      title="Integrations"
      description="Status of connected systems"
      status={status}
      error={{ title: "Couldn't load integrations", description: 'The status service did not answer. Other widgets are not affected.', onRetry: () => setStatus('ready') }}
      footer={
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setStatus('error')}>
          Show the error again
        </Button>
      }
    >
      <DashServiceList />
    </WidgetFrame>
  );
}

function DashWidgetSizes() {
  return (
    <div className="grid w-full auto-rows-[minmax(11rem,auto)] grid-cols-4 gap-4">
      <WidgetFrame title="Active users" description="1 × 1">
        <div className="flex flex-col gap-2">
          <DashStatValue value={String(DASH_ACTIVE_USERS.value)} />
          <TrendDelta value={DASH_ACTIVE_USERS.value} reference={DASH_ACTIVE_USERS.previous} decimals={0} goodDirection="up" caption="vs last week" />
        </div>
      </WidgetFrame>
      <WidgetFrame title="Active users" description="2 × 1" className="col-span-2">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <DashStatValue value={String(DASH_ACTIVE_USERS.value)} />
            <TrendDelta value={DASH_ACTIVE_USERS.value} reference={DASH_ACTIVE_USERS.previous} decimals={0} goodDirection="up" caption="vs last week" />
          </div>
          <Sparkline values={DASH_USERS_30D} label="Active users per day, last 30 days" decimals={0} height={56} variant="area" showLast className="max-w-64" />
        </div>
      </WidgetFrame>
      <WidgetFrame title="Data sources" description="1 × 1">
        <div className="flex items-center gap-3">
          <ProgressRing label="Sources reporting" value={5} max={6} size="md" showLabel={false} showValue={false} />
          <span className="text-sm font-medium text-base-foreground">5 of 6 reporting</span>
        </div>
      </WidgetFrame>
      <WidgetFrame title="Active users" description="2 × 2" className="col-span-2 row-span-2" footer={<span>Updated 14:00</span>}>
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <DashStatValue value={String(DASH_ACTIVE_USERS.value)} />
            <TrendDelta value={DASH_ACTIVE_USERS.value} reference={DASH_ACTIVE_USERS.previous} decimals={0} goodDirection="up" caption="vs last week" size="md" />
          </div>
          <Sparkline values={DASH_USERS_30D} label="Active users per day, last 30 days" decimals={0} height={72} variant="area" showLast />
          <BreakdownList label="Active users by site" items={DASH_SITE_USERS.map(({ id, label, value }) => ({ id, label, value }))} layout="inline" />
        </div>
      </WidgetFrame>
      <WidgetFrame title="Integrations" description="2 × 2" className="col-span-2 row-span-2">
        <DashServiceList />
      </WidgetFrame>
    </div>
  );
}

function DashWidgetBoard() {
  return (
    <div className="grid w-full grid-cols-4 gap-4">
      <DashWidgetStat />
      <DashWidgetGoal />
      <div className="col-span-2">
        <DashWidgetHeaderRange />
      </div>
      <div className="col-span-2">
        <DashWidgetTable />
      </div>
      <DashWidgetStatusList />
      <DashWidgetAgenda />
    </div>
  );
}

function DashWidgetSkeletonBoard() {
  return (
    <div className="grid w-full grid-cols-3 gap-4" aria-label="Dashboard loading">
      <WidgetFrame title="Active users" status="loading" />
      <WidgetFrame
        title="Most opened views"
        status="loading"
        loading={
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        }
      />
      <WidgetFrame
        title="Recent activity"
        status="loading"
        loading={
          <div className="flex w-full flex-col gap-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}

export default definePage({
  id: 'dashboard-widgets',
  title: 'Dashboard widgets',
  summary:
    'General-purpose widgets for any dashboard: one frame with a title, a menu and shared loading, empty and error states, filled with a figure, a list, a chart or a table.',
  guidance: {
    use: [
      'One frame for every widget, so titles, menus, footers and states line up across the board.',
      'One question per widget; the title asks it and the body answers it.',
      'A footer for "View all" or the update time, pinned to the bottom so rows of widgets align.',
      'Sizes from a shared grid: 1 × 1 for a figure, 2 × 1 for a figure with its trend, 2 × 2 for a list or chart.',
    ],
    avoid: [
      'A different header layout or card style per widget.',
      'A whole dashboard that blanks out because one widget failed.',
      'Charts in a 1 × 1 widget; use a figure with a delta or a sparkline.',
      'Colour to make a widget stand out; colour belongs to status and plotted data.',
    ],
  },
  source,
  sections: [
    {
      id: 'figures',
      title: 'Figures',
      description: 'Small widgets that answer with one number.',
      specimens: [
        {
          id: 'DashWidgetStat',
          title: 'Stat widget',
          note: 'One number with its change against the previous period.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/TrendDelta.tsx'],
          Component: DashWidgetStat,
        },
        {
          id: 'DashWidgetTrend',
          title: 'Trend widget',
          note: 'The number with the shape of the last 30 days, when direction matters more than the delta.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/Sparkline.tsx'],
          Component: DashWidgetTrend,
        },
        {
          id: 'DashWidgetGoal',
          title: 'Progress to goal',
          note: 'A count moving towards a target with a deadline.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetGoal,
        },
        {
          id: 'DashWidgetCompare',
          title: 'Period comparison',
          note: 'Two periods as two bars, when the sizes should be seen as well as the change.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'patterns/collections/BreakdownList.tsx', 'industrial/TrendDelta.tsx'],
          Component: DashWidgetCompare,
        },
        {
          id: 'DashWidgetSplit',
          title: 'Stat with split',
          note: 'A total and how it divides into three or four parts, in one small widget.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'patterns/collections/DistributionStrip.tsx'],
          Component: DashWidgetSplit,
        },
        {
          id: 'DashWidgetRatio',
          title: 'Ratio widget',
          note: 'A share of a small whole, such as 5 of 6, with the exception named beside it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/ProgressRing.tsx'],
          Component: DashWidgetRatio,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists',
      description: 'Widgets that answer with a short list. Five rows at most; the rest is behind "View all".',
      specimens: [
        {
          id: 'DashWidgetTopList',
          title: 'Top-N list',
          note: 'A ranking with bars, cut to the first five.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'patterns/collections/BreakdownList.tsx'],
          Component: DashWidgetTopList,
        },
        {
          id: 'DashWidgetRecentActivity',
          title: 'Recent activity',
          note: 'Who did what and when, newest first.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'display/PersonAvatar.tsx'],
          Component: DashWidgetRecentActivity,
        },
        {
          id: 'DashWidgetStatusList',
          title: 'Status list',
          note: 'A handful of systems with their state as shape, colour and word.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashWidgetStatusList,
        },
        {
          id: 'DashWidgetRegionList',
          title: 'Region list',
          note: 'Numbers by place without a map: the list is faster to read and needs no geography.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'patterns/collections/BreakdownList.tsx'],
          Component: DashWidgetRegionList,
        },
        {
          id: 'DashWidgetAgenda',
          title: 'Agenda',
          note: "Today's events in time order, with the next one marked in words.",
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: DashWidgetAgenda,
        },
        {
          id: 'DashWidgetQuickActions',
          title: 'Quick actions',
          note: 'Four frequent starting points; all secondary, because none is the primary action of the page.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetQuickActions,
        },
      ],
    },
    {
      id: 'charts-and-tables',
      title: 'Charts, tables and notes',
      description: 'Wider widgets for a breakdown, a comparison, a few rows of a table or free text.',
      specimens: [
        {
          id: 'DashWidgetDonut',
          title: 'Donut breakdown with legend',
          note: 'How a total splits into up to five parts; the legend carries the numbers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'patterns/product/DonutBreakdown.tsx'],
          Component: DashWidgetDonut,
        },
        {
          id: 'DashWidgetComparisonBars',
          title: 'Comparison bars',
          note: 'Two periods across a few categories; the earlier period is drawn in quiet grey.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: DashWidgetComparisonBars,
        },
        {
          id: 'DashWidgetTable',
          title: 'Table widget with view all',
          note: 'The first rows of a longer list, with the total and a link to the rest.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'primitives/table/Table.tsx'],
          Component: DashWidgetTable,
        },
        {
          id: 'DashWidgetNotes',
          title: 'Notes widget',
          note: 'Free text on a personal dashboard, with an explicit save and its state. Edit to try.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetNotes,
        },
      ],
    },
    {
      id: 'header-and-states',
      title: 'Header and states',
      description: 'What every widget shares: the header controls and the three states that replace the content.',
      specimens: [
        {
          id: 'DashWidgetHeaderMenu',
          title: 'Header with menu',
          note: 'Widget-level actions behind one "more" button, with the destructive one last. Open it to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashWidgetHeaderMenu,
        },
        {
          id: 'DashWidgetHeaderRange',
          title: 'Header with time range and menu',
          note: 'A widget whose period can change by itself, independent of the rest of the board.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/Sparkline.tsx'],
          Component: DashWidgetHeaderRange,
        },
        {
          id: 'DashWidgetLoading',
          title: 'Loading',
          note: 'The frame and title stay; a skeleton holds the place of the content.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetLoading,
        },
        {
          id: 'DashWidgetEmpty',
          title: 'Empty',
          note: 'Nothing to show yet: says what will appear and offers one way to get there.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetEmpty,
        },
        {
          id: 'DashWidgetError',
          title: 'Error with retry',
          note: 'One widget failed; it says so and retries alone while the rest of the board keeps working.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetError,
        },
      ],
    },
    {
      id: 'sizes-and-boards',
      title: 'Sizes and boards',
      description: 'The same widgets on a shared grid, and a board assembled from them.',
      specimens: [
        {
          id: 'DashWidgetSizes',
          title: 'Size variants on a grid',
          note: 'What a widget shows at 1 × 1, 2 × 1 and 2 × 2: more room adds context, not decoration.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/Sparkline.tsx', 'patterns/collections/BreakdownList.tsx', 'industrial/ProgressRing.tsx'],
          Component: DashWidgetSizes,
        },
        {
          id: 'DashWidgetSkeletonBoard',
          title: 'Board while loading',
          note: 'Each widget shows a skeleton in the shape of its own content, so the board does not jump when data arrives.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx'],
          Component: DashWidgetSkeletonBoard,
        },
        {
          id: 'DashWidgetBoard',
          title: 'Assembled board',
          note: 'Figures on top, a table and lists below, all in the same frame on a four-column grid.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/WidgetFrame.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashWidgetBoard,
        },
      ],
    },
  ],
});
