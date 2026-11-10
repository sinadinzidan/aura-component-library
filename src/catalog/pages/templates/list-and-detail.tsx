import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { ItemGroup } from '@cognite/aura/components/item';
import { Progress } from '@cognite/aura/components/progress';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBuildingFactory2,
  IconCheck,
  IconDownload,
  IconEngine,
  IconFileText,
  IconLayoutGrid,
  IconList,
  IconPencil,
  IconPlayerPause,
  IconPlus,
  IconTool,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { SelectionActionBar } from '../../../library/actions/SelectionActionBar';
import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { WorkOrderRow } from '../../../library/industrial/operations/WorkOrderRow';
import { formatValue, healthStatus, qualityStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { TablePagination } from '../../../library/navigation/TablePagination';
import { Timeline } from '../../../library/patterns/collaboration/Timeline';
import { TimelineItem } from '../../../library/patterns/collaboration/TimelineItem';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { MasterDetailLayout } from '../../../library/patterns/collections/MasterDetailLayout';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { FilterBar } from '../../../library/patterns/data-entry/FilterBar';
import type { FilterBarChip } from '../../../library/patterns/data-entry/FilterBar';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { Stepper } from '../../../library/patterns/data-entry/Stepper';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { AppShell } from '../../../library/templates/AppShell';
import { AppTopbar } from '../../../library/templates/AppTopbar';
import type { AppTopbarCrumb } from '../../../library/templates/AppTopbar';
import { ContentContainer } from '../../../library/templates/ContentContainer';
import { TemplateFrame } from '../../../library/templates/TemplateFrame';
import { TwoColumn } from '../../../library/templates/TwoColumn';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson, sensorsOf } from '../../data/plant';
import type { Alarm, Sensor, WorkOrder } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './list-and-detail.tsx?raw';

const LIST_DETAIL_USER = PEOPLE[0];
const LIST_DETAIL_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const LIST_DETAIL_COMPRESSOR = findAsset('23-ka-9101') ?? ASSETS[0];
const LIST_DETAIL_PUMP = findAsset('27-pa-2001a') ?? ASSETS[0];
const LIST_DETAIL_ORDER = WORK_ORDERS[0];
const LIST_DETAIL_VIBRATION = SENSORS[3];
const LIST_DETAIL_PAGE_SIZE = 5;

const LIST_DETAIL_STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const LIST_DETAIL_PRIORITY_OPTIONS = [
  { value: 'all', label: 'Any priority' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

const LIST_DETAIL_ORDER_COLUMNS: readonly DataTableColumn<WorkOrder>[] = [
  {
    id: 'order',
    header: 'Work order',
    cell: (order) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{order.title}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {order.id} · {findAsset(order.assetId)?.tag}
        </p>
      </div>
    ),
    sortValue: (order) => order.id,
  },
  { id: 'priority', header: 'Priority', cell: (order) => <PriorityBadge priority={order.priority} />, sortValue: (order) => order.priority, width: 'w-24' },
  { id: 'status', header: 'Status', cell: (order) => <StatusBadge status={order.status} />, width: 'w-36' },
  { id: 'assignee', header: 'Assignee', cell: (order) => findPerson(order.assigneeId)?.name ?? 'Unassigned', width: 'w-36' },
  { id: 'due', header: 'Due', align: 'end', cell: (order) => formatDate(order.dueAt), sortValue: (order) => order.dueAt, width: 'w-24' },
];

const LIST_DETAIL_ROUND_COLUMNS: readonly DataTableColumn<{ id: string }>[] = [
  { id: 'round', header: 'Round', cell: () => null },
  { id: 'area', header: 'Area', cell: () => null, width: 'w-40' },
  { id: 'interval', header: 'Interval', cell: () => null, width: 'w-28' },
  { id: 'next', header: 'Next due', cell: () => null, width: 'w-28' },
];

const LIST_DETAIL_SENSOR_COLUMNS: readonly DataTableColumn<Sensor>[] = [
  {
    id: 'sensor',
    header: 'Measurement',
    cell: (sensor) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{sensor.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
      </div>
    ),
  },
  {
    id: 'value',
    header: 'Value',
    align: 'end',
    cell: (sensor) => (
      <ValueReadout
        value={sensor.value}
        unit={sensor.unit}
        decimals={sensor.decimals}
        size="xs"
        tone={toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit })}
      />
    ),
    width: 'w-32',
  },
  {
    id: 'limits',
    header: 'Limits',
    align: 'end',
    cell: (sensor) => (
      <span className="whitespace-nowrap">
        {formatValue(sensor.lowLimit, sensor.decimals)} to {formatValue(sensor.highLimit, sensor.decimals)}
      </span>
    ),
    width: 'w-44',
  },
];

const LIST_DETAIL_ORDER_STEPS = [
  { id: 'open', label: 'Open' },
  { id: 'planned', label: 'Planned' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const LIST_DETAIL_TASKS = [
  { id: 'isolate', label: 'Isolate and depressurise the recompressor', done: true },
  { id: 'permit', label: 'Confirm work permit and gas test', done: true },
  { id: 'cover', label: 'Remove drive-end bearing cover', done: true },
  { id: 'inspect', label: 'Inspect bearing pads and journal for wear', done: false },
  { id: 'clearance', label: 'Measure bearing clearance', done: false },
  { id: 'report', label: 'Record findings and attach photos', done: false },
];

const LIST_DETAIL_PARTS = [
  { id: 'pads', name: 'Tilting pad set, drive end', number: 'NK-BRG-2231', quantity: 1, state: 'Reserved' },
  { id: 'seal', name: 'Labyrinth seal ring', number: 'NK-SEL-0914', quantity: 2, state: 'Reserved' },
  { id: 'probe', name: 'Proximity probe, 8 mm', number: 'NK-INS-4410', quantity: 2, state: 'On order' },
];

const LIST_DETAIL_INCIDENT = [
  { id: 'e1', time: '13:32', title: 'Drive-end vibration passes the 7.1 mm/s high limit', description: '23-VT-92740 · high alarm raised', tone: 'warning' },
  { id: 'e2', time: '13:41', title: 'Ingrid Haugen acknowledges the alarm', description: 'Load reduced by 5 % from the control room', tone: 'neutral' },
  { id: 'e3', time: '13:46', title: 'Recompressor trips on high-high vibration', description: '11.6 mm/s against a trip limit of 11.0 mm/s', tone: 'critical' },
  { id: 'e4', time: '13:48', title: 'Export reduced to 4.1 MSm³/d', description: 'Flaring started on the low-pressure header', tone: 'warning' },
  { id: 'e5', time: '13:55', title: 'Work order WO-104482 created', description: 'Assigned to Tomás Barros, priority P1', tone: 'info' },
] as const;

const LIST_DETAIL_DOCUMENTS = [
  { id: 'd1', name: 'Export pump A, data sheet', detail: 'PDF · rev. 3 · 1.2 MB' },
  { id: 'd2', name: 'P&ID NK-27-001, gas export', detail: 'PDF · rev. 11 · 4.8 MB' },
  { id: 'd3', name: 'Seal replacement procedure', detail: 'PDF · rev. 2 · 640 kB' },
];

const LIST_DETAIL_VIBRATION_SERIES = makeSeries({
  seed: LIST_DETAIL_VIBRATION.seed,
  points: 48,
  base: 5.9,
  amplitude: 0.3,
  noise: 0.15,
  drift: 0.9,
  stepMs: 30 * MINUTE,
});

const listDetailTrail = (...labels: string[]): AppTopbarCrumb[] => labels.map((label, index) => ({ id: String(index), label }));

const listDetailTagTrend = (sensor: Sensor) =>
  makeSeries({
    seed: sensor.seed,
    points: 48,
    base: sensor.value,
    amplitude: (sensor.highLimit - sensor.lowLimit) * 0.06,
    noise: (sensor.highLimit - sensor.lowLimit) * 0.03,
    stepMs: 30 * MINUTE,
    decimals: sensor.decimals,
  });

/** The app chrome every page on this screen sits in: one top bar with the trail, then the page. */
function ListDetailShell({
  title,
  address,
  trail,
  children,
  scroll = true,
}: {
  title: string;
  address: string;
  trail: readonly AppTopbarCrumb[];
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <TemplateFrame title={`${title} · Plant operations`} address={address}>
      <AppShell
        contentLabel={title}
        scroll={scroll}
        topbarSpan="window"
        topbar={<AppTopbar icon={<IconBuildingFactory2 />} trail={trail} userName={LIST_DETAIL_USER.name} />}
      >
        {children}
      </AppShell>
    </TemplateFrame>
  );
}

/** Filters the shared work orders by text, status and priority. */
function listDetailFilterOrders(query: string, status: string, priority: string): WorkOrder[] {
  const text = query.trim().toLowerCase();
  return WORK_ORDERS.filter((order) => {
    const haystack = `${order.title} ${order.id} ${findAsset(order.assetId)?.tag ?? ''}`.toLowerCase();
    return haystack.includes(text) && (status === 'all' || order.status === status) && (priority === 'all' || order.priority === priority);
  });
}

function ListDetailTemplateTable() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const rows = listDetailFilterOrders(query, status, priority);
  const pageCount = Math.max(1, Math.ceil(rows.length / LIST_DETAIL_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const chips: FilterBarChip[] = [
    ...(status === 'all' ? [] : [{ id: 'status', label: 'Status', value: LIST_DETAIL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status }]),
    ...(priority === 'all' ? [] : [{ id: 'priority', label: 'Priority', value: priority }]),
  ];
  const clear = (id: string) => (id === 'status' ? setStatus('all') : setPriority('all'));

  return (
    <ListDetailShell title="Work orders" address="/maintain/work-orders" trail={listDetailTrail('Maintain', 'Work orders')}>
      <ContentContainer>
        <PageHeader
          title="Work orders"
          description="Corrective and preventive jobs across Nordkapp."
          actions={
            <>
              <Button variant="outline">
                <IconDownload /> Export
              </Button>
              <Button>
                <IconPlus /> Create work order
              </Button>
            </>
          }
        />
        <FilterBar
          label="Filter work orders"
          chips={chips}
          onRemoveChip={clear}
          onClearAll={() => {
            setStatus('all');
            setPriority('all');
          }}
          summary={`${rows.length} of ${WORK_ORDERS.length} work orders`}
        >
          <Search
            aria-label="Search work orders"
            placeholder="Search by title, number or tag"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            onClear={() => setQuery('')}
            className="w-72 max-w-full"
          />
          <div className="w-40">
            <OptionSelect aria-label="Status" options={LIST_DETAIL_STATUS_OPTIONS} value={status} onValueChange={setStatus} />
          </div>
          <div className="w-40">
            <OptionSelect aria-label="Priority" options={LIST_DETAIL_PRIORITY_OPTIONS} value={priority} onValueChange={setPriority} />
          </div>
        </FilterBar>
        <DataTable
          label="Work orders"
          columns={LIST_DETAIL_ORDER_COLUMNS}
          rows={rows.slice((current - 1) * LIST_DETAIL_PAGE_SIZE, current * LIST_DETAIL_PAGE_SIZE)}
          getRowId={(order) => order.id}
          rowActions={(order) => (
            <RowActionsMenu
              label={`Actions for ${order.id}`}
              actions={[
                { id: 'open', label: 'Open work order', onSelect: () => undefined },
                { id: 'assign', label: 'Assign', onSelect: () => undefined },
                { id: 'cancel', label: 'Cancel work order', destructive: true, onSelect: () => undefined },
              ]}
            />
          )}
          empty={<p className="text-center text-sm text-muted-foreground">No work orders match these filters.</p>}
        />
        <TablePagination page={current} pageSize={LIST_DETAIL_PAGE_SIZE} total={rows.length} onPageChange={setPage} itemLabel="work orders" />
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateCardGrid() {
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const assets = LIST_DETAIL_EQUIPMENT.filter((asset) => `${asset.name} ${asset.tag}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ListDetailShell title="Equipment" address="/operate/equipment" trail={listDetailTrail('Operate', 'Equipment')}>
      <ContentContainer>
        <PageHeader title="Equipment" description="Every main unit at Nordkapp with its run state and condition." />
        <FilterBar
          label="Filter equipment"
          summary={`${assets.length} of ${LIST_DETAIL_EQUIPMENT.length} units`}
          end={
            <SegmentedControl
              value={view}
              onValueChange={(next) => {
                if (typeof next === 'string') setView(next);
              }}
            >
              <SegmentedControlList size="small" aria-label="View">
                <SegmentedControlButton value="grid">
                  <IconLayoutGrid /> Grid
                </SegmentedControlButton>
                <SegmentedControlButton value="list">
                  <IconList /> List
                </SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <Search
            aria-label="Search equipment"
            placeholder="Search by name or tag"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            className="w-72 max-w-full"
          />
        </FilterBar>
        {assets.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No equipment matches this search.</p> : null}
        {view === 'grid' ? (
          <ul className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {assets.map((asset) => (
              <li key={asset.id} className="min-w-0">
                <EntityCard
                  title={asset.name}
                  description={<span className="font-mono">{asset.tag}</span>}
                  icon={<IconEngine />}
                  status={<StatusBadge status={asset.state} />}
                  footerNote={`Criticality ${asset.criticality}`}
                  footerActions={
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  }
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <StatusIndicator {...healthStatus(asset.health)} size="sm" />
                    <ValueReadout value={asset.healthScore} unit="score" size="xs" />
                  </div>
                </EntityCard>
              </li>
            ))}
          </ul>
        ) : (
          <ItemGroup aria-label="Equipment">
            {assets.map((asset) => (
              <EntityRow
                key={asset.id}
                leading={<IconEngine />}
                title={asset.name}
                description={<span className="font-mono">{asset.tag}</span>}
                meta={
                  <>
                    <StatusIndicator {...healthStatus(asset.health)} size="sm" />
                    <StatusBadge status={asset.state} />
                  </>
                }
                onOpen={() => undefined}
              />
            ))}
          </ItemGroup>
        )}
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateBulkSelect() {
  const [alarms, setAlarms] = useState<readonly Alarm[]>(ALARMS);
  const selection = useSelection(
    alarms.map((alarm) => alarm.id),
    [ALARMS[0].id, ALARMS[1].id]
  );
  const setState = (state: Alarm['state']) => {
    setAlarms(alarms.map((alarm) => (selection.isSelected(alarm.id) ? { ...alarm, state } : alarm)));
    selection.clear();
  };
  const columns: readonly DataTableColumn<Alarm>[] = [
    { id: 'severity', header: 'Severity', cell: (alarm) => <SeverityBadge severity={alarm.severity} />, width: 'w-28' },
    {
      id: 'alarm',
      header: 'Alarm',
      cell: (alarm) => (
        <div className="min-w-0">
          <p className="text-base-foreground">{alarm.message}</p>
          <p className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</p>
        </div>
      ),
    },
    { id: 'state', header: 'State', cell: (alarm) => <span className="capitalize">{alarm.state}</span>, width: 'w-32' },
    { id: 'value', header: 'Value', align: 'end', cell: (alarm) => alarm.value, width: 'w-28' },
    { id: 'raised', header: 'Raised', align: 'end', cell: (alarm) => formatAgo(alarm.raisedAt), sortValue: (alarm) => alarm.raisedAt, width: 'w-28' },
  ];

  return (
    <ListDetailShell title="Alarms" address="/operate/alarms" trail={listDetailTrail('Operate', 'Alarms')}>
      <ContentContainer>
        <PageHeader title="Alarms" description="Select alarms to acknowledge, shelve or assign them together." />
        <DataTable
          label="Alarms"
          columns={columns}
          rows={alarms}
          getRowId={(alarm) => alarm.id}
          selection={selection}
          rowLabel={(alarm) => alarm.message}
        />
        <div className="sticky bottom-4 flex justify-center">
          <SelectionActionBar
            count={selection.count}
            noun={{ one: 'alarm', other: 'alarms' }}
            width="fit"
            actions={[
              { id: 'shelve', label: 'Shelve', icon: <IconPlayerPause />, onSelect: () => setState('shelved') },
              { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => selection.clear() },
            ]}
            primaryAction={{ label: 'Acknowledge', onSelect: () => setState('acknowledged') }}
            onClear={selection.clear}
          />
        </div>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateEmpty() {
  return (
    <ListDetailShell title="Inspection rounds" address="/maintain/rounds" trail={listDetailTrail('Maintain', 'Inspection rounds')}>
      <ContentContainer>
        <PageHeader
          title="Inspection rounds"
          description="Recurring walk-downs with a checklist per area."
          actions={
            <Button>
              <IconPlus /> Create round
            </Button>
          }
        />
        <DataTable
          label="Inspection rounds"
          columns={LIST_DETAIL_ROUND_COLUMNS}
          rows={[]}
          getRowId={(round) => round.id}
          empty={
            <div className="flex justify-center py-8">
              <EmptyState type="new-object">
                <EmptyStateIcon />
                <EmptyStateTitle as="h2">No inspection rounds yet</EmptyStateTitle>
                <EmptyStateDescription>
                  A round is a route through an area with the checks to make at each stop. Create one, or import the rounds you already run on paper.
                </EmptyStateDescription>
                <EmptyStateActions>
                  <Button>Create round</Button>
                  <Button variant="outline">Import from spreadsheet</Button>
                </EmptyStateActions>
              </EmptyState>
            </div>
          }
        />
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateTwoColumn() {
  const cooler = findAsset('23-ha-9114') ?? ASSETS[0];
  const related = WORK_ORDERS.filter((order) => order.assetId === cooler.id);

  return (
    <ListDetailShell
      title="NT-20418"
      address="/maintain/notifications/NT-20418"
      trail={listDetailTrail('Maintain', 'Notifications', 'NT-20418')}
    >
      <ContentContainer width="detail">
        <PageHeader
          title="Fouling suspected in interstage cooler"
          status={<StatusBadge status="open" />}
          meta={
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">NT-20418</span> · reported by Aisha Khan · {formatAgo(REFERENCE_NOW - 5 * HOUR)}
            </p>
          }
          actions={
            <>
              <Button variant="outline">
                <IconPencil /> Edit
              </Button>
              <Button>Create work order</Button>
            </>
          }
          divider
        />
        <TwoColumn
          aside={
            <>
              <section className="flex flex-col gap-3">
                <SectionHeader title="Properties" size="sm" />
                <PropertyList
                  layout="stacked"
                  items={[
                    { label: 'Asset', value: cooler.name },
                    { label: 'Functional location', value: <span className="font-mono">{cooler.tag}</span> },
                    { label: 'Type', value: 'Condition finding' },
                    { label: 'Priority', value: <PriorityBadge priority="P2" showMeaning /> },
                    { label: 'Required by', value: formatDate(REFERENCE_NOW + 96 * HOUR) },
                  ]}
                />
              </section>
              <section className="flex flex-col gap-3">
                <SectionHeader title="People" size="sm" />
                <ul className="flex flex-col gap-3">
                  {[PEOPLE[2], PEOPLE[1]].map((person) => (
                    <li key={person.id} className="flex items-center gap-3">
                      <PersonAvatar name={person.name} sizes="xsm" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-base-foreground">{person.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{person.role}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          }
        >
          <section className="flex flex-col gap-3">
            <SectionHeader title="Description" size="sm" />
            <p className="max-w-prose text-sm text-medium-foreground">
              Cooler outlet temperature has climbed 2.4 °C over ten days at constant duty and now sits just under the 40 °C high limit. Cooling
              water flow and inlet temperature are unchanged, which points to fouling on the tube side. Recommend cleaning the tube bundle at the
              next opportunity and checking the strainer upstream.
            </p>
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader title="Readings at the time of the report" size="sm" />
            <DataTable label="Readings" columns={LIST_DETAIL_SENSOR_COLUMNS} rows={sensorsOf(cooler.id)} getRowId={(sensor) => sensor.id} />
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader title="Related work orders" count={related.length} size="sm" />
            <ItemGroup aria-label="Related work orders">
              {related.map((order) => (
                <WorkOrderRow key={order.id} order={order} due={formatDate(order.dueAt)} assignee={findPerson(order.assigneeId)} density="compact" />
              ))}
            </ItemGroup>
          </section>
        </TwoColumn>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateTabs() {
  const [tab, setTab] = useState('overview');
  const pump = LIST_DETAIL_PUMP;
  const sensors = sensorsOf(pump.id);
  const orders = WORK_ORDERS.filter((order) => order.assetId.startsWith('27-pa-2001'));

  return (
    <ListDetailShell title={pump.name} address={`/assets/${pump.id}`} trail={listDetailTrail('Assets', 'Gas export', pump.name)}>
      <ContentContainer width="detail">
        <Tabs
          value={tab}
          onValueChange={(next) => {
            if (typeof next === 'string') setTab(next);
          }}
          className="flex w-full flex-col gap-6"
        >
          <PageHeader
            title={pump.name}
            status={<StatusBadge status={pump.state} />}
            meta={<p className="font-mono text-sm text-muted-foreground">{pump.tag}</p>}
            actions={<Button variant="outline">Create work order</Button>}
            tabs={
              <TabsList showSeparator className="w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="readings" badge={sensors.length}>
                  Readings
                </TabsTrigger>
                <TabsTrigger value="maintenance" badge={orders.length}>
                  Maintenance
                </TabsTrigger>
                <TabsTrigger value="documents" badge={LIST_DETAIL_DOCUMENTS.length}>
                  Documents
                </TabsTrigger>
              </TabsList>
            }
          />
          <TabsPanel value="overview" className="flex flex-col gap-6">
            <PropertyList
              layout="stacked"
              columns={3}
              items={[
                { label: 'Functional location', value: <span className="font-mono">{pump.tag}</span> },
                { label: 'Area', value: 'Gas export' },
                { label: 'Criticality', value: pump.criticality },
                { label: 'Run state', value: <StatusIndicator {...runStateStatus(pump.state)} size="sm" /> },
                { label: 'Condition', value: <StatusIndicator {...healthStatus(pump.health)} size="sm" detail={`score ${pump.healthScore}`} /> },
                { label: 'Running hours', value: '41,280 h' },
                { label: 'Manufacturer', value: 'Sulzer' },
                { label: 'Rated flow', value: '480 m³/h' },
                { label: 'Commissioned', value: '14 Jun 2011' },
              ]}
            />
            <p className="max-w-prose text-sm text-medium-foreground">
              Duty pump for condensate export. Pump B is the installed standby and is test-started every 30 days; the last test is overdue.
            </p>
            <section className="flex flex-col gap-3">
              <SectionHeader title="Right now" size="sm" />
              <DataTable label="Current readings" columns={LIST_DETAIL_SENSOR_COLUMNS} rows={sensors} getRowId={(sensor) => sensor.id} density="dense" />
            </section>
          </TabsPanel>
          <TabsPanel value="readings">
            <DataTable label="Readings" columns={LIST_DETAIL_SENSOR_COLUMNS} rows={sensors} getRowId={(sensor) => sensor.id} />
          </TabsPanel>
          <TabsPanel value="maintenance">
            <DataTable label="Maintenance" columns={LIST_DETAIL_ORDER_COLUMNS.filter((column) => column.id !== 'assignee')} rows={orders} getRowId={(order) => order.id} />
          </TabsPanel>
          <TabsPanel value="documents">
            <ItemGroup aria-label="Documents">
              {LIST_DETAIL_DOCUMENTS.map((document) => (
                <EntityRow key={document.id} leading={<IconFileText />} title={document.name} description={document.detail} onOpen={() => undefined} />
              ))}
            </ItemGroup>
          </TabsPanel>
        </Tabs>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateActivity() {
  const [notes, setNotes] = useState<readonly string[]>([]);
  const [draft, setDraft] = useState('');
  const alarm = ALARMS[0];

  return (
    <ListDetailShell title="Recompressor trip" address="/operate/incidents/INC-0312" trail={listDetailTrail('Operate', 'Incidents', 'INC-0312')}>
      <ContentContainer width="detail">
        <PageHeader
          leading={
            <Button variant="ghost" size="icon-sm" aria-label="Back to incidents">
              <IconArrowLeft />
            </Button>
          }
          title="Recompressor trip"
          status={<SeverityBadge severity={alarm.severity} />}
          meta={
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">INC-0312</span> · started {formatDateTime(alarm.raisedAt)} UTC · ongoing
            </p>
          }
          actions={<Button variant="outline">Close incident</Button>}
          divider
        />
        <TwoColumn
          stickyAside
          aside={
            <section className="flex flex-col gap-3">
              <SectionHeader title="Summary" size="sm" />
              <PropertyList
                layout="stacked"
                items={[
                  { label: 'Asset', value: findAsset(alarm.assetId)?.name },
                  { label: 'First-out alarm', value: <span className="font-mono">{alarm.sensorTag}</span> },
                  { label: 'Trip value', value: `${alarm.value} (limit ${alarm.limit})` },
                  { label: 'Production impact', value: '−0.28 MSm³/d export' },
                  { label: 'Incident owner', value: PEOPLE[4].name },
                  { label: 'Work order', value: <span className="font-mono">{LIST_DETAIL_ORDER.id}</span> },
                ]}
              />
            </section>
          }
        >
          <section className="flex flex-col gap-4">
            <SectionHeader title="Timeline" count={LIST_DETAIL_INCIDENT.length + notes.length} size="sm" />
            <Timeline label="Incident timeline" layout="time-start">
              {LIST_DETAIL_INCIDENT.map((event) => (
                <TimelineItem key={event.id} time={event.time} title={event.title} description={event.description} tone={event.tone} />
              ))}
              {notes.map((note, index) => (
                <TimelineItem key={`${index}-${note}`} time="14:00" title={note} description={`Note by ${LIST_DETAIL_USER.name}`} />
              ))}
              <TimelineItem title="Bearing inspection and restart" description="Planned once the recompressor is isolated" state="pending" />
            </Timeline>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                setNotes([...notes, draft.trim()]);
                setDraft('');
              }}
            >
              <Input aria-label="Add a note to the timeline" placeholder="Add a note" value={draft} onChange={(event) => setDraft(event.target.value)} />
              <Button type="submit" variant="secondary">
                Add note
              </Button>
            </form>
          </section>
        </TwoColumn>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateAsset() {
  const asset = LIST_DETAIL_COMPRESSOR;
  const sensors = sensorsOf(asset.id).slice(0, 4);
  const alarms = ALARMS.filter((alarm) => alarm.assetId === asset.id);
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id);
  const vibration = LIST_DETAIL_VIBRATION;

  return (
    <ListDetailShell title={asset.name} address={`/assets/${asset.id}`} trail={listDetailTrail('Assets', 'Gas compression', asset.name)}>
      <ContentContainer>
        <PageHeader
          title={asset.name}
          status={
            <>
              <StatusBadge status={asset.state} />
              <StatusIndicator {...healthStatus(asset.health)} variant="badge" detail={`score ${asset.healthScore}`} />
            </>
          }
          meta={
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{asset.tag}</span> · Gas compression · criticality {asset.criticality}
            </p>
          }
          actions={
            <>
              <Button variant="outline">Open trends</Button>
              <Button>Create work order</Button>
            </>
          }
        />
        <div className="grid grid-cols-2 gap-4 @4xl:grid-cols-4">
          {sensors.map((sensor) => (
            <KpiTile
              key={sensor.id}
              label={sensor.name}
              value={sensor.value}
              unit={sensor.unit}
              decimals={sensor.decimals}
              size="compact"
              tone={toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit })}
              footnote={`High limit ${formatValue(sensor.highLimit, sensor.decimals)} ${sensor.unit}`}
            />
          ))}
        </div>
        <section className="flex flex-col gap-3">
          <SectionHeader title="Drive-end vibration" description="Last 24 hours against the high and trip limits" size="sm" />
          <TrendChart
            label="Drive-end vibration over the last 24 hours, rising from 5.9 to 6.8 millimetres per second towards the 7.1 high limit"
            series={[{ key: 'vibration', label: vibration.name, points: LIST_DETAIL_VIBRATION_SERIES }]}
            limits={[
              { value: vibration.highLimit, label: `High ${vibration.highLimit}`, tone: 'warning' },
              { value: vibration.highHighLimit ?? 11, label: `Trip ${vibration.highHighLimit ?? 11}`, tone: 'critical' },
            ]}
            yDomain={[4, 12]}
            unit={vibration.unit}
            decimals={1}
            heightClassName="h-52"
            summary="Vibration has risen 0.9 mm/s in 24 hours while shaft speed stayed flat."
          />
        </section>
        <TwoColumn
          ratio="1:1"
          asideLabel="Work orders"
          aside={
            <section className="flex flex-col gap-3">
              <SectionHeader title="Work orders" count={orders.length} size="sm" />
              <ItemGroup aria-label="Work orders">
                {orders.map((order) => (
                  <WorkOrderRow key={order.id} order={order} due={formatDate(order.dueAt)} assignee={findPerson(order.assigneeId)} density="compact" />
                ))}
              </ItemGroup>
            </section>
          }
        >
          <section className="flex flex-col gap-3">
            <SectionHeader title="Alarms" count={alarms.length} size="sm" />
            <AlarmList alarms={alarms} label={`Alarms on ${asset.name}`} formatAge={formatAgo} density="compact" />
          </section>
        </TwoColumn>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateWorkOrder() {
  const [done, setDone] = useState<readonly string[]>(LIST_DETAIL_TASKS.filter((task) => task.done).map((task) => task.id));
  const order = LIST_DETAIL_ORDER;
  const asset = findAsset(order.assetId);
  const progress = Math.round((done.length / LIST_DETAIL_TASKS.length) * 100);
  const toggle = (id: string, checked: boolean) => setDone(checked ? [...done, id] : done.filter((other) => other !== id));

  return (
    <ListDetailShell title={order.id} address={`/maintain/work-orders/${order.id}`} trail={listDetailTrail('Maintain', 'Work orders', order.id)}>
      <ContentContainer width="detail">
        <PageHeader
          title={order.title}
          meta={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <PriorityBadge priority={order.priority} showMeaning />
              <StatusBadge status={order.status} />
              <span>
                <span className="font-mono">{order.id}</span> · corrective · due {formatDateTime(order.dueAt)} UTC
              </span>
            </div>
          }
          actions={
            <Button disabled={progress < 100} aria-describedby="list-detail-complete-hint">
              <IconCheck /> Complete work order
            </Button>
          }
        >
          <Stepper steps={LIST_DETAIL_ORDER_STEPS} current={2} label="Work order status" />
        </PageHeader>
        <TwoColumn
          aside={
            <>
              <section className="flex flex-col gap-3">
                <SectionHeader title="Details" size="sm" />
                <PropertyList
                  layout="stacked"
                  items={[
                    { label: 'Asset', value: asset?.name },
                    { label: 'Functional location', value: <span className="font-mono">{asset?.tag}</span> },
                    { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
                    { label: 'Planner', value: PEOPLE[1].name },
                    { label: 'Estimate', value: `${order.estimatedHours} h` },
                    { label: 'Permit', value: 'Hot work not required' },
                  ]}
                />
              </section>
            </>
          }
        >
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Tasks"
              size="sm"
              description={
                <span id="list-detail-complete-hint">
                  {progress < 100 ? 'Finish every task to complete the work order.' : 'Every task is done. The work order can be completed.'}
                </span>
              }
              actions={<span className="text-sm tabular-nums text-muted-foreground">{`${done.length} of ${LIST_DETAIL_TASKS.length} done`}</span>}
            />
            <Progress value={progress} size="sm" aria-label="Task progress" />
            <CheckboxGroup aria-label="Tasks">
              {LIST_DETAIL_TASKS.map((task) => (
                <CheckboxItem key={task.id}>
                  <CheckboxItemControl checked={done.includes(task.id)} onCheckedChange={(checked) => toggle(task.id, checked)} />
                  <CheckboxItemLabel>{task.label}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader title="Parts" count={LIST_DETAIL_PARTS.length} size="sm" />
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Part
                  </th>
                  <th scope="col" className="w-16 py-2 pr-3 text-right font-medium">
                    Qty
                  </th>
                  <th scope="col" className="w-28 py-2 font-medium">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {LIST_DETAIL_PARTS.map((part) => (
                  <tr key={part.id} className="border-b border-default last:border-b-0">
                    <td className="py-2 pr-3">
                      <p className="text-base-foreground">{part.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{part.number}</p>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{part.quantity}</td>
                    <td className="py-2 text-medium-foreground">
                      <span className="flex items-center gap-1.5">
                        {part.state === 'On order' ? <IconAlertTriangle aria-hidden="true" className="size-4 text-warning-foreground-strong" /> : null}
                        {part.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </TwoColumn>
      </ContentContainer>
    </ListDetailShell>
  );
}

function ListDetailTemplateMasterDetail() {
  const [selectedId, setSelectedId] = useState(SENSORS[0].id);
  const [query, setQuery] = useState('');
  const sensors = SENSORS.filter((sensor) => `${sensor.name} ${sensor.tag}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sensor = SENSORS.find((candidate) => candidate.id === selectedId) ?? SENSORS[0];
  const tone = toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });

  return (
    <ListDetailShell title="Tags" address={`/data/tags/${sensor.tag}`} trail={listDetailTrail('Data', 'Tags')} scroll={false}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <MasterDetailLayout
          className="min-h-0 flex-1"
          masterLabel="Tags"
          detailLabel="Tag details"
          masterWidth={36}
          master={
            <>
              <div className="sticky top-0 z-10 border-b border-default bg-base-background p-3">
                <Search
                  aria-label="Search tags"
                  placeholder="Search tags"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onClear={() => setQuery('')}
                  className="w-full"
                />
              </div>
              <ItemGroup aria-label="Tags" className="p-2">
                {sensors.map((candidate) => (
                  <EntityRow
                    key={candidate.id}
                    density="dense"
                    title={candidate.name}
                    description={<span className="font-mono">{candidate.tag}</span>}
                    meta={
                      <span className="tabular-nums">
                        {candidate.quality === 'bad' ? '—' : formatValue(candidate.value, candidate.decimals)} {candidate.unit}
                      </span>
                    }
                    selected={candidate.id === selectedId}
                    onOpen={() => setSelectedId(candidate.id)}
                  />
                ))}
              </ItemGroup>
            </>
          }
          detail={
            <div className="flex flex-col gap-6 p-6">
              <PageHeader
                as="h2"
                size="compact"
                title={sensor.name}
                status={<StatusIndicator {...qualityStatus(sensor.quality)} variant="badge" />}
                meta={
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono">{sensor.tag}</span> · {findAsset(sensor.assetId)?.name}
                  </p>
                }
                actions={<Button variant="outline">Open in trends</Button>}
              />
              <ValueReadout value={sensor.quality === 'bad' ? null : sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="lg" tone={tone} />
              <TrendChart
                label={`${sensor.name} over the last 24 hours, within its operating limits`}
                series={[{ key: 'value', label: sensor.name, points: listDetailTagTrend(sensor) }]}
                limits={[{ value: sensor.highLimit, label: `High ${formatValue(sensor.highLimit, sensor.decimals)}`, tone: 'warning' }]}
                unit={sensor.unit}
                decimals={sensor.decimals}
                heightClassName="h-44"
                maxTicks={5}
              />
              <PropertyList
                layout="stacked"
                columns={3}
                dense
                items={[
                  { label: 'Low limit', value: `${formatValue(sensor.lowLimit, sensor.decimals)} ${sensor.unit}` },
                  { label: 'High limit', value: `${formatValue(sensor.highLimit, sensor.decimals)} ${sensor.unit}` },
                  { label: 'Trip limit', value: sensor.highHighLimit === undefined ? undefined : `${formatValue(sensor.highHighLimit, sensor.decimals)} ${sensor.unit}` },
                  { label: 'Range', value: `${sensor.rangeMin} to ${sensor.rangeMax} ${sensor.unit}` },
                  { label: 'Last sample', value: `${formatTime(REFERENCE_NOW)} UTC` },
                  { label: 'Source', value: 'Process historian' },
                ]}
              />
            </div>
          }
        />
      </div>
    </ListDetailShell>
  );
}

function ListDetailTemplateSideSheet() {
  const [openId, setOpenId] = useState<string | null>(WORK_ORDERS[2].id);
  const order = WORK_ORDERS.find((candidate) => candidate.id === openId);
  const columns: readonly DataTableColumn<WorkOrder>[] = [
    {
      id: 'order',
      header: 'Work order',
      cell: (row) => (
        <button
          type="button"
          aria-label={`Open ${row.id}`}
          aria-expanded={row.id === openId}
          onClick={() => setOpenId(row.id)}
          className="flex min-w-0 flex-col rounded-md text-left outline-none hover:underline focus-visible:shadow-focus-ring"
        >
          <span className="text-base-foreground">{row.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
        </button>
      ),
    },
    ...LIST_DETAIL_ORDER_COLUMNS.slice(1),
  ];

  return (
    <ListDetailShell title="Work orders" address={openId ? `/maintain/work-orders?open=${openId}` : '/maintain/work-orders'} trail={listDetailTrail('Maintain', 'Work orders')} scroll={false}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ContentContainer>
            <PageHeader title="Work orders" description="Open a job to read it in a sheet; the list stays where you left it." />
            <DataTable label="Work orders" columns={columns} rows={WORK_ORDERS} getRowId={(row) => row.id} currentRowId={openId ?? undefined} />
          </ContentContainer>
        </div>
        {order ? (
          <>
            <button
              type="button"
              aria-label="Close sheet"
              tabIndex={-1}
              onClick={() => setOpenId(null)}
              className="absolute inset-0 cursor-default bg-muted-background opacity-70"
            />
            <div role="dialog" aria-label={order.id} className="absolute inset-y-0 right-0 flex w-3/5 min-w-80 shadow-default">
              <SidePanel
                frame="edge"
                title={order.title}
                description={<span className="font-mono">{order.id}</span>}
                leading={<IconTool aria-hidden="true" className="size-5 text-muted-foreground" />}
                status={<StatusBadge status={order.status} />}
                onClose={() => setOpenId(null)}
                closeLabel="Close sheet"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setOpenId(null)}>
                      Close
                    </Button>
                    <Button>Open full page</Button>
                  </>
                }
              >
                <div className="flex flex-col gap-6">
                  <PropertyList
                    layout="stacked"
                    columns={2}
                    items={[
                      { label: 'Asset', value: findAsset(order.assetId)?.name },
                      { label: 'Functional location', value: <span className="font-mono">{findAsset(order.assetId)?.tag}</span> },
                      { label: 'Priority', value: <PriorityBadge priority={order.priority} showMeaning /> },
                      { label: 'Type', value: <span className="capitalize">{order.type}</span> },
                      { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
                      { label: 'Due', value: formatDate(order.dueAt) },
                    ]}
                  />
                  <section className="flex flex-col gap-2">
                    <SectionHeader title="Progress" size="sm" actions={<span className="text-sm tabular-nums text-muted-foreground">{order.progress} %</span>} />
                    <Progress value={order.progress} size="sm" aria-label={`Progress of ${order.id}`} />
                    <p className="text-sm text-muted-foreground">
                      Estimated at {order.estimatedHours} hours. {order.status === 'waiting' ? 'Waiting for the tube cleaning lance to arrive from Stord.' : 'No blockers reported.'}
                    </p>
                  </section>
                  <section className="flex flex-col gap-2">
                    <SectionHeader title="Readings on the asset" size="sm" />
                    <DataTable
                      label="Readings on the asset"
                      columns={LIST_DETAIL_SENSOR_COLUMNS.slice(0, 2)}
                      rows={sensorsOf(order.assetId)}
                      getRowId={(sensor) => sensor.id}
                      density="dense"
                      empty={<p className="text-center text-sm text-muted-foreground">No live measurements on this asset.</p>}
                    />
                  </section>
                </div>
              </SidePanel>
            </div>
          </>
        ) : null}
      </div>
    </ListDetailShell>
  );
}

export default definePage({
  id: 'list-and-detail',
  title: 'List and detail pages',
  summary:
    'The two pages most of an application is made of: a collection to browse and one record to read. Eleven whole pages, from a filtered table to an asset record, each ready to be copied as the start of a screen.',
  guidance: {
    use: [
      'A list page for browsing: header, filters, table or cards, pagination, in that order.',
      'A detail page for one record: breadcrumb, record header, then two thirds content and one third properties.',
      'Tabs when a record has several facets that are not read together.',
      'Master-detail or a side sheet when people work through many records in a row.',
    ],
    avoid: [
      'A list page without an empty state: design the first visit as well as the hundredth.',
      'Putting record actions inside tabs; they stay in the header.',
      'A side sheet for a record that needs its own URL and deep navigation.',
      'More than one primary action in a page header.',
    ],
  },
  source,
  sections: [
    {
      id: 'lists',
      title: 'List pages',
      description: 'Browsing a collection: find, filter, select and act.',
      specimens: [
        {
          id: 'ListDetailTemplateTable',
          title: 'Table with filters and pagination',
          note: 'Pick it as the default list page: search and filters above a sortable table, pages underneath.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/data-entry/FilterBar.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/collections/DataTable.tsx',
            'data/RowActionsMenu.tsx',
            'navigation/TablePagination.tsx',
          ],
          Component: ListDetailTemplateTable,
        },
        {
          id: 'ListDetailTemplateCardGrid',
          title: 'Card grid with view switch',
          note: 'Pick it when items are recognised by a few facts at a glance and some people prefer a dense list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/data-entry/FilterBar.tsx',
            'patterns/collections/EntityCard.tsx',
            'patterns/collections/EntityRow.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: ListDetailTemplateCardGrid,
        },
        {
          id: 'ListDetailTemplateBulkSelect',
          title: 'Bulk selection',
          note: 'Pick it when the same action is applied to many rows: the action bar appears with the selection.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collections/useSelection.ts',
            'actions/SelectionActionBar.tsx',
            'industrial/operations/SeverityBadge.tsx',
          ],
          Component: ListDetailTemplateBulkSelect,
        },
        {
          id: 'ListDetailTemplateEmpty',
          title: 'Empty list',
          note: 'Pick it for the first visit: the page keeps its header and columns, and the empty state says how to start.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates/TemplateFrame.tsx', 'templates/AppShell.tsx', 'templates/ContentContainer.tsx', 'patterns/structure/PageHeader.tsx', 'patterns/collections/DataTable.tsx'],
          Component: ListDetailTemplateEmpty,
        },
      ],
    },
    {
      id: 'details',
      title: 'Detail pages',
      description: 'Reading one record, with what belongs to it.',
      specimens: [
        {
          id: 'ListDetailTemplateTwoColumn',
          title: 'Two-column detail',
          note: 'Pick it as the default record page: the story in two thirds, properties and people in one third.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'industrial/operations/WorkOrderRow.tsx',
          ],
          Component: ListDetailTemplateTwoColumn,
        },
        {
          id: 'ListDetailTemplateTabs',
          title: 'Detail with tabs',
          note: 'Pick it when a record has facets people visit separately; title and actions stay above the tabs.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collections/EntityRow.tsx',
          ],
          Component: ListDetailTemplateTabs,
        },
        {
          id: 'ListDetailTemplateActivity',
          title: 'Detail with timeline',
          note: 'Pick it when the record is a sequence of events, such as an incident, a change or an approval.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'patterns/collaboration/Timeline.tsx',
            'patterns/collaboration/TimelineItem.tsx',
            'patterns/structure/PropertyList.tsx',
          ],
          Component: ListDetailTemplateActivity,
        },
      ],
    },
    {
      id: 'records',
      title: 'Plant records',
      description: 'The two records an operations app opens most.',
      specimens: [
        {
          id: 'ListDetailTemplateAsset',
          title: 'Asset detail',
          note: 'Pick it for a piece of equipment: live readings first, then the trend that matters, alarms and work.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'industrial/KpiTile.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/operations/AlarmList.tsx',
            'industrial/operations/WorkOrderRow.tsx',
          ],
          Component: ListDetailTemplateAsset,
        },
        {
          id: 'ListDetailTemplateWorkOrder',
          title: 'Work order detail',
          note: 'Pick it for a job someone executes: status steps in the header, a checklist that drives completion.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'patterns/data-entry/Stepper.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/structure/PropertyList.tsx',
            'industrial/operations/PriorityBadge.tsx',
          ],
          Component: ListDetailTemplateWorkOrder,
        },
      ],
    },
    {
      id: 'together',
      title: 'List and record together',
      description: 'Reading a record without leaving the collection.',
      specimens: [
        {
          id: 'ListDetailTemplateMasterDetail',
          title: 'Master-detail',
          note: 'Pick it for working through a list: the selection drives the pane beside it and both scroll on their own.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'patterns/collections/MasterDetailLayout.tsx',
            'patterns/collections/EntityRow.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: ListDetailTemplateMasterDetail,
        },
        {
          id: 'ListDetailTemplateSideSheet',
          title: 'Detail in a side sheet',
          note: 'Pick it for a quick read or edit that returns to the same row; use a full page when the record needs its own address.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ListDetailTemplateSideSheet,
        },
      ],
    },
  ],
});
