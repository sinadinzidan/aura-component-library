import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import {
  IconBellOff,
  IconCheck,
  IconColumns,
  IconDownload,
  IconPlus,
  IconTool,
  IconTrash,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { SelectionActionBar } from '../../../library/actions/SelectionActionBar';
import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonTable } from '../../../library/feedback/SkeletonTable';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue, qualityStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TablePagination } from '../../../library/navigation/TablePagination';
import { FilterPopover } from '../../../library/overlays/FilterPopover';
import type { FilterGroup } from '../../../library/overlays/FilterPopover';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { TableToolbar } from '../../../library/patterns/collections/TableToolbar';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { Alarm, Sensor, WorkOrder } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatDate, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './table-toolbars.tsx?raw';

const TABLE_TOOLBAR_TYPE_LABEL: Record<WorkOrder['type'], string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

const TABLE_TOOLBAR_STATE_LABEL: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

const TABLE_TOOLBAR_ORDER_ID: DataTableColumn<WorkOrder> = {
  id: 'id',
  header: 'Work order',
  width: 'w-28',
  cell: (order) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{order.id}</span>,
  sortValue: (order) => order.id,
};

const TABLE_TOOLBAR_ORDER_TITLE: DataTableColumn<WorkOrder> = {
  id: 'title',
  header: 'Title',
  cell: (order) => <span className="text-base-foreground">{order.title}</span>,
  sortValue: (order) => order.title,
};

const TABLE_TOOLBAR_ORDER_ASSET: DataTableColumn<WorkOrder> = {
  id: 'asset',
  header: 'Asset',
  cell: (order) => <span className="whitespace-nowrap">{findAsset(order.assetId)?.tag}</span>,
  sortValue: (order) => findAsset(order.assetId)?.tag ?? '',
};

const TABLE_TOOLBAR_ORDER_PRIORITY: DataTableColumn<WorkOrder> = {
  id: 'priority',
  header: 'Priority',
  cell: (order) => order.priority,
  sortValue: (order) => order.priority,
};

const TABLE_TOOLBAR_ORDER_STATUS: DataTableColumn<WorkOrder> = {
  id: 'status',
  header: 'Status',
  cell: (order) => <StatusBadge status={order.status} />,
  sortValue: (order) => order.status,
};

const TABLE_TOOLBAR_ORDER_ASSIGNEE: DataTableColumn<WorkOrder> = {
  id: 'assignee',
  header: 'Assignee',
  cell: (order) => {
    const person = findPerson(order.assigneeId);
    return person ? (
      <span className="flex items-center gap-2 whitespace-nowrap">
        <PersonAvatar name={person.name} initials={person.initials} sizes="xxsm" />
        {person.name}
      </span>
    ) : (
      <span className="text-muted-foreground">Unassigned</span>
    );
  },
  sortValue: (order) => findPerson(order.assigneeId)?.name ?? '',
};

const TABLE_TOOLBAR_ORDER_DUE: DataTableColumn<WorkOrder> = {
  id: 'due',
  header: 'Due',
  cell: (order) => {
    const overdue = order.dueAt < REFERENCE_NOW && order.status !== 'done';
    return (
      <span className={`whitespace-nowrap tabular-nums ${overdue ? 'font-medium text-critical-foreground-strong' : ''}`}>
        {formatDate(order.dueAt)}
        {overdue ? <span className="sr-only"> (overdue)</span> : null}
      </span>
    );
  },
  sortValue: (order) => order.dueAt,
};

const TABLE_TOOLBAR_ORDER_HOURS: DataTableColumn<WorkOrder> = {
  id: 'hours',
  header: 'Estimate',
  align: 'end',
  cell: (order) => `${order.estimatedHours} h`,
  sortValue: (order) => order.estimatedHours,
};

const TABLE_TOOLBAR_ORDER_COLUMNS: readonly DataTableColumn<WorkOrder>[] = [
  TABLE_TOOLBAR_ORDER_ID,
  TABLE_TOOLBAR_ORDER_TITLE,
  TABLE_TOOLBAR_ORDER_STATUS,
  TABLE_TOOLBAR_ORDER_ASSIGNEE,
  TABLE_TOOLBAR_ORDER_DUE,
  TABLE_TOOLBAR_ORDER_HOURS,
];

const TABLE_TOOLBAR_TAG_COLUMNS: readonly DataTableColumn<Sensor>[] = [
  {
    id: 'tag',
    header: 'Tag',
    width: 'w-32',
    cell: (sensor) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{sensor.tag}</span>,
    sortValue: (sensor) => sensor.tag,
  },
  { id: 'name', header: 'Name', cell: (sensor) => <span className="text-base-foreground">{sensor.name}</span>, sortValue: (sensor) => sensor.name },
  { id: 'asset', header: 'Asset', cell: (sensor) => findAsset(sensor.assetId)?.name, sortValue: (sensor) => findAsset(sensor.assetId)?.name ?? '' },
  {
    id: 'value',
    header: 'Value',
    align: 'end',
    cell: (sensor) => (sensor.quality === 'bad' ? '—' : formatValue(sensor.value, sensor.decimals)),
    sortValue: (sensor) => sensor.value,
  },
  { id: 'unit', header: 'Unit', width: 'w-20', cell: (sensor) => <span className="text-muted-foreground">{sensor.unit}</span> },
];

const TABLE_TOOLBAR_ALARM_COLUMNS: readonly DataTableColumn<Alarm>[] = [
  {
    id: 'severity',
    header: 'Severity',
    width: 'w-28',
    cell: (alarm) => <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />,
    sortValue: (alarm) => ['critical', 'high', 'medium', 'low'].indexOf(alarm.severity),
  },
  { id: 'message', header: 'Alarm', cell: (alarm) => <span className="text-base-foreground">{alarm.message}</span> },
  { id: 'tag', header: 'Tag', cell: (alarm) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{alarm.sensorTag}</span> },
  { id: 'value', header: 'Value', align: 'end', cell: (alarm) => <span className="whitespace-nowrap">{alarm.value}</span> },
  { id: 'limit', header: 'Limit', align: 'end', cell: (alarm) => <span className="whitespace-nowrap text-muted-foreground">{alarm.limit}</span> },
  { id: 'state', header: 'State', cell: (alarm) => TABLE_TOOLBAR_STATE_LABEL[alarm.state], sortValue: (alarm) => alarm.state },
  {
    id: 'raised',
    header: 'Raised',
    align: 'end',
    cell: (alarm) => <span className="whitespace-nowrap">{formatAgo(alarm.raisedAt)}</span>,
    sortValue: (alarm) => -alarm.raisedAt,
  },
];

const TABLE_TOOLBAR_FILTERS: readonly FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { id: 'open', label: 'Open' },
      { id: 'planned', label: 'Planned' },
      { id: 'in-progress', label: 'In progress' },
      { id: 'waiting', label: 'Waiting' },
      { id: 'done', label: 'Done' },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    options: [
      { id: 'P1', label: 'P1' },
      { id: 'P2', label: 'P2' },
      { id: 'P3', label: 'P3' },
      { id: 'P4', label: 'P4' },
    ],
  },
];

const TABLE_TOOLBAR_STATUS_ITEMS = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const TABLE_TOOLBAR_ALARM_VIEWS = [
  { value: 'open', label: 'Open alarms' },
  { value: 'all', label: 'All alarms' },
];

const tableToolbarOrderId = (order: WorkOrder) => order.id;
const tableToolbarSensorId = (sensor: Sensor) => sensor.id;
const tableToolbarAlarmId = (alarm: Alarm) => alarm.id;

function tableToolbarMatches(order: WorkOrder, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  return [order.id, order.title, findAsset(order.assetId)?.tag ?? ''].some((text) => text.toLowerCase().includes(needle));
}

function tableToolbarOrderActions(order: WorkOrder) {
  return (
    <RowActionsMenu
      label={`Actions for ${order.id}`}
      actions={[
        { id: 'open', label: 'Open work order', onSelect: () => undefined },
        { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
        { id: 'cancel', label: 'Cancel work order', icon: <IconTrash />, destructive: true, onSelect: () => undefined },
      ]}
    />
  );
}

function TableToolbarPlain() {
  return (
    <DataTable
      label="Time series"
      columns={TABLE_TOOLBAR_TAG_COLUMNS.map((column) => ({ ...column, sortValue: undefined }))}
      rows={SENSORS.slice(0, 5)}
      getRowId={tableToolbarSensorId}
    />
  );
}

function TableToolbarCellTypes() {
  return (
    <DataTable
      label="Work orders"
      columns={TABLE_TOOLBAR_ORDER_COLUMNS.map((column) => ({ ...column, sortValue: undefined }))}
      rows={WORK_ORDERS.slice(0, 5)}
      getRowId={tableToolbarOrderId}
    />
  );
}

function TableToolbarSorting() {
  return (
    <DataTable
      label="Work orders, sortable"
      columns={TABLE_TOOLBAR_ORDER_COLUMNS}
      rows={WORK_ORDERS.slice(0, 6)}
      getRowId={tableToolbarOrderId}
      defaultSort={{ columnId: 'due', direction: 'asc' }}
    />
  );
}

function TableToolbarSparklineColumn() {
  const columns: readonly DataTableColumn<Sensor>[] = [
    TABLE_TOOLBAR_TAG_COLUMNS[0],
    TABLE_TOOLBAR_TAG_COLUMNS[1],
    {
      id: 'trend',
      header: 'Last 24 hours',
      width: 'w-40',
      cell: (sensor) => (
        <Sparkline
          values={makeValues({ seed: sensor.seed, points: 24, base: sensor.value, amplitude: sensor.value * 0.03, noise: sensor.value * 0.012 })}
          label={`${sensor.name}, last 24 hours`}
          unit={sensor.unit}
          decimals={sensor.decimals}
          width={128}
          height={24}
          tone={toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit })}
        />
      ),
    },
    TABLE_TOOLBAR_TAG_COLUMNS[3],
    TABLE_TOOLBAR_TAG_COLUMNS[4],
    {
      id: 'high',
      header: 'High limit',
      align: 'end',
      cell: (sensor) => <span className="text-muted-foreground">{formatValue(sensor.highLimit, sensor.decimals)}</span>,
    },
  ];

  return <DataTable label="Compressor readings with trend" columns={columns} rows={SENSORS.slice(0, 6)} getRowId={tableToolbarSensorId} />;
}

function TableToolbarSummaryRow() {
  const areas = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((area) => {
    const orders = WORK_ORDERS.filter((order) => findAsset(order.assetId)?.parentId === area.id);
    return {
      id: area.id,
      name: area.name,
      open: orders.filter((order) => order.status !== 'done').length,
      done: orders.filter((order) => order.status === 'done').length,
      hours: orders.reduce((sum, order) => sum + order.estimatedHours, 0),
    };
  });
  type AreaRow = (typeof areas)[number];
  const total = (pick: (row: AreaRow) => number) => areas.reduce((sum, row) => sum + pick(row), 0);
  const columns: readonly DataTableColumn<AreaRow>[] = [
    { id: 'area', header: 'Area', cell: (row) => <span className="text-base-foreground">{row.name}</span>, footer: 'Total' },
    { id: 'open', header: 'Open', align: 'end', cell: (row) => row.open, sortValue: (row) => row.open, footer: total((row) => row.open) },
    { id: 'done', header: 'Done', align: 'end', cell: (row) => row.done, sortValue: (row) => row.done, footer: total((row) => row.done) },
    {
      id: 'hours',
      header: 'Estimated hours',
      align: 'end',
      cell: (row) => `${row.hours} h`,
      sortValue: (row) => row.hours,
      footer: `${total((row) => row.hours)} h`,
    },
  ];

  return <DataTable label="Work orders by area" columns={columns} rows={areas} getRowId={(row) => row.id} />;
}

function TableToolbarDense() {
  return (
    <DataTable
      label="Alarm log, dense"
      density="dense"
      columns={TABLE_TOOLBAR_ALARM_COLUMNS}
      rows={ALARMS}
      getRowId={tableToolbarAlarmId}
    />
  );
}

function TableToolbarPinnedColumn() {
  const columns: readonly DataTableColumn<Sensor>[] = [
    { ...TABLE_TOOLBAR_TAG_COLUMNS[0], width: 'min-w-36' },
    { ...TABLE_TOOLBAR_TAG_COLUMNS[1], width: 'min-w-56' },
    { ...TABLE_TOOLBAR_TAG_COLUMNS[2], width: 'min-w-56' },
    { ...TABLE_TOOLBAR_TAG_COLUMNS[3], width: 'min-w-28' },
    { id: 'unit', header: 'Unit', width: 'min-w-24', cell: (sensor) => sensor.unit },
    { id: 'low', header: 'Low limit', align: 'end', width: 'min-w-28', cell: (sensor) => formatValue(sensor.lowLimit, sensor.decimals) },
    { id: 'high', header: 'High limit', align: 'end', width: 'min-w-28', cell: (sensor) => formatValue(sensor.highLimit, sensor.decimals) },
    { id: 'min', header: 'Range min', align: 'end', width: 'min-w-28', cell: (sensor) => formatValue(sensor.rangeMin, 0) },
    { id: 'max', header: 'Range max', align: 'end', width: 'min-w-28', cell: (sensor) => formatValue(sensor.rangeMax, 0) },
    { id: 'quality', header: 'Quality', width: 'min-w-32', cell: (sensor) => <StatusIndicator {...qualityStatus(sensor.quality)} size="sm" /> },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <DataTable label="Time series with limits" columns={columns} rows={SENSORS.slice(0, 6)} getRowId={tableToolbarSensorId} pinFirstColumn />
      <p className="text-xs text-muted-foreground">Scroll sideways: the tag stays in view.</p>
    </div>
  );
}

function TableToolbarSearchFilters() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const rows = WORK_ORDERS.filter((order) => tableToolbarMatches(order, query) && (status === 'all' || order.status === status));

  return (
    <div className="flex w-full flex-col gap-4">
      <TableToolbar
        searchLabel="Search work orders"
        searchPlaceholder="Search by id, title or tag"
        query={query}
        onQueryChange={setQuery}
        summary={`${rows.length} of ${WORK_ORDERS.length} work orders`}
        filters={
          <Select items={TABLE_TOOLBAR_STATUS_ITEMS} value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABLE_TOOLBAR_STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <DataTable
        label="Work orders"
        columns={TABLE_TOOLBAR_ORDER_COLUMNS}
        rows={rows}
        getRowId={tableToolbarOrderId}
        empty={<p className="text-center text-sm text-muted-foreground">No work orders match the search and filter.</p>}
      />
    </div>
  );
}

function TableToolbarFilterChips() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({ status: ['open', 'planned'], priority: ['P2'] });
  const chips = TABLE_TOOLBAR_FILTERS.flatMap((group) =>
    (filters[group.id] ?? []).map((optionId) => ({
      id: `${group.id}:${optionId}`,
      label: `${group.label}: ${group.options.find((option) => option.id === optionId)?.label ?? optionId}`,
    }))
  );
  const allows = (groupId: string, value: string) => (filters[groupId] ?? []).length === 0 || (filters[groupId] ?? []).includes(value);
  const rows = WORK_ORDERS.filter(
    (order) => tableToolbarMatches(order, query) && allows('status', order.status) && allows('priority', order.priority)
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <TableToolbar
        searchLabel="Search work orders"
        query={query}
        onQueryChange={setQuery}
        summary={`${rows.length} of ${WORK_ORDERS.length} work orders`}
        filters={<FilterPopover groups={TABLE_TOOLBAR_FILTERS} value={filters} onApply={setFilters} />}
        chips={chips}
        onRemoveChip={(chipId) => {
          const [groupId, optionId] = chipId.split(':');
          setFilters({ ...filters, [groupId]: (filters[groupId] ?? []).filter((id) => id !== optionId) });
        }}
        onClearChips={() => setFilters({})}
      />
      <DataTable
        label="Filtered work orders"
        columns={[TABLE_TOOLBAR_ORDER_ID, TABLE_TOOLBAR_ORDER_TITLE, TABLE_TOOLBAR_ORDER_PRIORITY, TABLE_TOOLBAR_ORDER_STATUS, TABLE_TOOLBAR_ORDER_DUE]}
        rows={rows}
        getRowId={tableToolbarOrderId}
        empty={<p className="text-center text-sm text-muted-foreground">No work orders match these filters.</p>}
      />
    </div>
  );
}

function TableToolbarPageActions() {
  const [query, setQuery] = useState('');
  const optional = [
    { id: 'asset', label: 'Asset', column: TABLE_TOOLBAR_ORDER_ASSET },
    { id: 'priority', label: 'Priority', column: TABLE_TOOLBAR_ORDER_PRIORITY },
    { id: 'assignee', label: 'Assignee', column: TABLE_TOOLBAR_ORDER_ASSIGNEE },
    { id: 'hours', label: 'Estimate', column: TABLE_TOOLBAR_ORDER_HOURS },
  ];
  const [shown, setShown] = useState<readonly string[]>(['asset', 'priority']);
  const rows = WORK_ORDERS.filter((order) => tableToolbarMatches(order, query));

  return (
    <div className="flex w-full flex-col gap-4">
      <TableToolbar
        searchLabel="Search work orders"
        query={query}
        onQueryChange={setQuery}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline">
                    <IconColumns /> Columns
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {optional.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.id}
                    checked={shown.includes(option.id)}
                    onCheckedChange={(checked) =>
                      setShown(checked ? [...shown, option.id] : shown.filter((id) => id !== option.id))
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <IconDownload /> Export
            </Button>
            <Button>
              <IconPlus /> Create work order
            </Button>
          </>
        }
      />
      <DataTable
        label="Work orders with optional columns"
        columns={[
          TABLE_TOOLBAR_ORDER_ID,
          TABLE_TOOLBAR_ORDER_TITLE,
          ...optional.filter((option) => shown.includes(option.id)).map((option) => option.column),
          TABLE_TOOLBAR_ORDER_STATUS,
        ]}
        rows={rows.slice(0, 5)}
        getRowId={tableToolbarOrderId}
      />
    </div>
  );
}

function TableToolbarRowActions() {
  return (
    <DataTable
      label="Work orders with row actions"
      columns={[TABLE_TOOLBAR_ORDER_TITLE, TABLE_TOOLBAR_ORDER_STATUS]}
      rows={WORK_ORDERS.slice(0, 5)}
      getRowId={tableToolbarOrderId}
      rowActions={tableToolbarOrderActions}
    />
  );
}

function TableToolbarExpandableRows() {
  return (
    <DataTable
      label="Work orders with details"
      columns={[TABLE_TOOLBAR_ORDER_ID, TABLE_TOOLBAR_ORDER_TITLE, TABLE_TOOLBAR_ORDER_STATUS, TABLE_TOOLBAR_ORDER_DUE]}
      rows={WORK_ORDERS.slice(0, 5)}
      getRowId={tableToolbarOrderId}
      rowLabel={tableToolbarOrderId}
      defaultExpandedIds={[WORK_ORDERS[0].id]}
      renderExpanded={(order) => (
        <div className="max-w-md">
          <MetadataList
            items={[
              { label: 'Asset', value: findAsset(order.assetId)?.name },
              { label: 'Type', value: TABLE_TOOLBAR_TYPE_LABEL[order.type] },
              { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
              { label: 'Progress', value: `${order.progress}%` },
            ]}
          />
        </div>
      )}
    />
  );
}

function TableToolbarBulkSelection() {
  const rows = WORK_ORDERS.slice(0, 6);
  const selection = useSelection(rows.map(tableToolbarOrderId), [rows[0].id, rows[1].id]);

  return (
    <div className="relative w-full pb-16">
      <DataTable
        label="Selectable work orders"
        columns={[TABLE_TOOLBAR_ORDER_ID, TABLE_TOOLBAR_ORDER_TITLE, TABLE_TOOLBAR_ORDER_STATUS, TABLE_TOOLBAR_ORDER_ASSIGNEE, TABLE_TOOLBAR_ORDER_DUE]}
        rows={rows}
        getRowId={tableToolbarOrderId}
        selection={selection}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={selection.count}
          noun={{ one: 'work order', other: 'work orders' }}
          width="fit"
          actions={[
            { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
            { id: 'export', label: 'Export', icon: <IconDownload />, onSelect: () => undefined },
            { id: 'cancel', label: 'Cancel work orders', icon: <IconTrash />, destructive: true, onSelect: () => undefined },
          ]}
          onClear={selection.clear}
        />
      </div>
    </div>
  );
}

function TableToolbarPagination() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const rows = SENSORS.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable label="Time series, paged" columns={TABLE_TOOLBAR_TAG_COLUMNS} rows={rows} getRowId={tableToolbarSensorId} />
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={SENSORS.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10]}
        itemLabel="time series"
        size="small"
      />
    </div>
  );
}

function TableToolbarInCard() {
  const alarms = ALARMS.filter((alarm) => alarm.state !== 'cleared');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Open alarms</CardTitle>
          <CardDescription>Nordkapp · updated 14:00</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd className="items-center gap-2">
          <Badge variant="secondary">{alarms.length}</Badge>
          <Button variant="outline" size="sm">
            View alarm log
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <DataTable
          label="Open alarms"
          surface="card"
          columns={TABLE_TOOLBAR_ALARM_COLUMNS.filter((column) => column.id !== 'limit')}
          rows={alarms}
          getRowId={tableToolbarAlarmId}
        />
      </CardContent>
    </Card>
  );
}

function TableToolbarWorkOrders() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const matches = WORK_ORDERS.filter((order) => tableToolbarMatches(order, query));
  const rows = matches.slice((page - 1) * pageSize, page * pageSize);
  const selection = useSelection(rows.map(tableToolbarOrderId));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-base-foreground">Work orders</h3>
        <Button>
          <IconPlus /> Create work order
        </Button>
      </div>
      <TableToolbar
        searchLabel="Search work orders"
        searchPlaceholder="Search by id, title or tag"
        query={query}
        onQueryChange={(next) => {
          setQuery(next);
          setPage(1);
        }}
        summary={selection.count > 0 ? `${selection.count} selected` : `${matches.length} work orders`}
        actions={
          <Button variant="outline" disabled={selection.count === 0} title={selection.count === 0 ? 'Select work orders to assign' : undefined}>
            <IconUserPlus /> Assign
          </Button>
        }
      />
      <DataTable
        label="Work orders"
        columns={[
          TABLE_TOOLBAR_ORDER_ID,
          TABLE_TOOLBAR_ORDER_TITLE,
          TABLE_TOOLBAR_ORDER_ASSET,
          TABLE_TOOLBAR_ORDER_PRIORITY,
          TABLE_TOOLBAR_ORDER_STATUS,
          TABLE_TOOLBAR_ORDER_ASSIGNEE,
          TABLE_TOOLBAR_ORDER_DUE,
        ]}
        rows={rows}
        getRowId={tableToolbarOrderId}
        selection={selection}
        rowActions={tableToolbarOrderActions}
        defaultSort={{ columnId: 'priority', direction: 'asc' }}
        empty={<p className="text-center text-sm text-muted-foreground">No work orders match "{query}".</p>}
      />
      <TablePagination page={page} pageSize={pageSize} total={matches.length} onPageChange={setPage} itemLabel="work orders" size="small" />
    </div>
  );
}

function TableToolbarAlarms() {
  const [state, setState] = useState('open');
  const rows = ALARMS.filter((alarm) => (state === 'open' ? alarm.state === 'active' || alarm.state === 'acknowledged' : true));
  const selection = useSelection(rows.map(tableToolbarAlarmId));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select items={TABLE_TOOLBAR_ALARM_VIEWS} value={state} onValueChange={setState}>
          <SelectTrigger aria-label="Alarm state" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TABLE_TOOLBAR_ALARM_VIEWS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span role="status" className="text-sm tabular-nums text-muted-foreground">
          {rows.length} alarms · {rows.filter((alarm) => alarm.state === 'active').length} unacknowledged
          {selection.count === 0 ? ' · select rows to acknowledge or shelve' : ` · ${selection.count} selected`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" disabled={selection.count === 0}>
            <IconBellOff /> Shelve
          </Button>
          <Button disabled={selection.count === 0}>
            <IconCheck /> Acknowledge{selection.count > 0 ? ` ${selection.count}` : ''}
          </Button>
        </div>
      </div>
      <DataTable
        label="Alarms"
        density="dense"
        columns={TABLE_TOOLBAR_ALARM_COLUMNS}
        rows={rows}
        getRowId={tableToolbarAlarmId}
        selection={selection}
        rowLabel={(alarm) => alarm.message}
        defaultSort={{ columnId: 'severity', direction: 'asc' }}
      />
    </div>
  );
}

function TableToolbarTags() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const rows = SENSORS.filter((sensor) => needle === '' || `${sensor.tag} ${sensor.name}`.toLowerCase().includes(needle));
  const columns: readonly DataTableColumn<Sensor>[] = [
    ...TABLE_TOOLBAR_TAG_COLUMNS,
    {
      id: 'quality',
      header: 'Quality',
      cell: (sensor) => <StatusIndicator {...qualityStatus(sensor.quality)} size="sm" />,
      sortValue: (sensor) => sensor.quality,
    },
    {
      id: 'updated',
      header: 'Last value',
      align: 'end',
      cell: (sensor) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(REFERENCE_NOW - sensor.seed * 1000)}</span>,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <TableToolbar
        searchLabel="Search time series"
        searchPlaceholder="Search by tag or name"
        query={query}
        onQueryChange={setQuery}
        summary={`${rows.length} of ${SENSORS.length} time series`}
        actions={
          <Button variant="outline">
            <IconDownload /> Export CSV
          </Button>
        }
      />
      <DataTable
        label="Time series"
        density="dense"
        columns={columns}
        rows={rows}
        getRowId={tableToolbarSensorId}
        defaultSort={{ columnId: 'tag', direction: 'asc' }}
        empty={<p className="text-center text-sm text-muted-foreground">No time series match "{query}".</p>}
      />
    </div>
  );
}

function TableToolbarLoading() {
  return <SkeletonTable rows={5} columns={['Work order', 'Title', 'Status', 'Due']} label="Loading work orders" />;
}

function TableToolbarError() {
  return (
    <div className="flex w-full flex-col">
      <div className="grid grid-cols-4 gap-4 border-b border-default pb-3 text-xs font-medium text-muted-foreground">
        <span>Work order</span>
        <span>Title</span>
        <span>Status</span>
        <span>Due</span>
      </div>
      <RetryBlock
        title="Couldn't load work orders"
        description="The maintenance system did not respond. Nothing has been changed."
        onRetry={() => Promise.reject(new Error('Still unavailable'))}
      />
    </div>
  );
}

function TableToolbarNoResults() {
  const [query, setQuery] = useState('23-KA-9200');
  const rows = WORK_ORDERS.filter((order) => tableToolbarMatches(order, query));

  return (
    <div className="flex w-full flex-col gap-4">
      <TableToolbar
        searchLabel="Search work orders"
        query={query}
        onQueryChange={setQuery}
        summary={`${rows.length} of ${WORK_ORDERS.length}`}
      />
      <DataTable
        label="Work orders"
        columns={[TABLE_TOOLBAR_ORDER_ID, TABLE_TOOLBAR_ORDER_TITLE, TABLE_TOOLBAR_ORDER_STATUS]}
        rows={rows.slice(0, 3)}
        getRowId={tableToolbarOrderId}
        empty={
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-medium text-base-foreground">No work orders match "{query}"</p>
            <p className="text-sm text-muted-foreground">Check the tag, or search by work order id instead.</p>
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </div>
        }
      />
    </div>
  );
}

function TableToolbarFirstUse() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconTool />
      </EmptyStateIcon>
      <EmptyStateTitle as="h3">No work orders yet</EmptyStateTitle>
      <EmptyStateDescription>Connect your maintenance system or create the first work order by hand.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus /> Create work order
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

export default definePage({
  id: 'table-toolbars',
  title: 'Tables and toolbars',
  summary:
    'Tables for comparing records, with the toolbar above and the footer below: search, filters, sorting, selection, row actions and paging. Built on a small semantic table for static data.',
  guidance: {
    use: [
      'Use a table when people compare several attributes across rows or act on many rows.',
      'Right-align numbers in tabular figures and keep units in the header or their own column.',
      'Put search first in the toolbar, filters next to it and page actions at the far end.',
      'Show how many rows match, and keep the header visible when the table is loading, empty or failed.',
    ],
    avoid: [
      'A table for a single attribute per item; use a list.',
      'A strip of buttons on every row; use one menu.',
      'Colour in cells that is not a status.',
      'Pagination for a table that fits on one page.',
    ],
  },
  source,
  sections: [
    {
      id: 'cells',
      title: 'Cells and columns',
      description: 'The table itself: cell types, sorting, a summary row and density.',
      specimens: [
        {
          id: 'TableToolbarPlain',
          title: 'Plain table',
          note: 'The baseline for a short static table: header rule, quiet row dividers, numbers to the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx'],
          Component: TableToolbarPlain,
        },
        {
          id: 'TableToolbarCellTypes',
          title: 'Status, person, date and number cells',
          note: 'One treatment per data type: badge for status, avatar and name for people, tabular figures for dates and numbers.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'display/StatusBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: TableToolbarCellTypes,
        },
        {
          id: 'TableToolbarSorting',
          title: 'Column sorting',
          note: 'Sortable headers cycle ascending, descending and off; the active column shows its direction.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx'],
          Component: TableToolbarSorting,
        },
        {
          id: 'TableToolbarSparklineColumn',
          title: 'Inline sparkline column',
          note: 'Add a small trend per row when the recent shape explains the current value.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'industrial/Sparkline.tsx'],
          Component: TableToolbarSparklineColumn,
        },
        {
          id: 'TableToolbarSummaryRow',
          title: 'Summary row',
          note: 'Totals sit under a stronger rule at the bottom, aligned with the columns they add up.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx'],
          Component: TableToolbarSummaryRow,
        },
        {
          id: 'TableToolbarRowActions',
          title: 'Row actions menu',
          note: 'One menu button at the end of each row holds everything that can be done to it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'data/RowActionsMenu.tsx'],
          Component: TableToolbarRowActions,
        },
        {
          id: 'TableToolbarDense',
          title: 'Dense',
          note: 'Tighter rows for monitoring tables where more rows on screen beats breathing room.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TableToolbarDense,
        },
        {
          id: 'TableToolbarPinnedColumn',
          title: 'Pinned first column',
          note: 'Keep the identifier in view when a wide table has to scroll sideways.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TableToolbarPinnedColumn,
        },
      ],
    },
    {
      id: 'toolbars',
      title: 'Toolbars',
      description: 'The row above the table: find, narrow, then act.',
      specimens: [
        {
          id: 'TableToolbarSearchFilters',
          title: 'Search and filter',
          note: 'Search plus one select for the filter most people use, with a live result count.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/TableToolbar.tsx', 'patterns/collections/DataTable.tsx'],
          Component: TableToolbarSearchFilters,
        },
        {
          id: 'TableToolbarFilterChips',
          title: 'Applied filter chips',
          note: 'Several filters go in a popover; what is applied shows as removable chips under the toolbar.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/TableToolbar.tsx', 'patterns/collections/DataTable.tsx', 'overlays/FilterPopover.tsx'],
          Component: TableToolbarFilterChips,
        },
        {
          id: 'TableToolbarPageActions',
          title: 'Column picker and page actions',
          note: 'View options and export sit at the end, before the single primary action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/TableToolbar.tsx', 'patterns/collections/DataTable.tsx'],
          Component: TableToolbarPageActions,
        },
      ],
    },
    {
      id: 'rows',
      title: 'Selection, expansion and paging',
      description: 'Acting on rows and moving through them.',
      specimens: [
        {
          id: 'TableToolbarBulkSelection',
          title: 'Bulk selection with action toolbar',
          note: 'Checkbox rows and a toolbar that appears at the bottom only while something is selected.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/collections/useSelection.ts', 'actions/SelectionActionBar.tsx'],
          Component: TableToolbarBulkSelection,
        },
        {
          id: 'TableToolbarExpandableRows',
          title: 'Expandable rows',
          note: 'Open a row in place for the few extra fields that do not deserve a column.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'display/MetadataList.tsx'],
          Component: TableToolbarExpandableRows,
        },
        {
          id: 'TableToolbarPagination',
          title: 'Pagination footer',
          note: 'Page links and page size on the left, the visible range on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'navigation/TablePagination.tsx'],
          Component: TableToolbarPagination,
        },
      ],
    },
    {
      id: 'context',
      title: 'Complete tables',
      description: 'Toolbar, table and footer assembled for the tables industrial apps need most.',
      specimens: [
        {
          id: 'TableToolbarWorkOrders',
          title: 'Work order table',
          note: 'A list page in full: title and primary action, search, sortable selectable rows, row menu and paging.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/collections/TableToolbar.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collections/useSelection.ts',
            'navigation/TablePagination.tsx',
            'data/RowActionsMenu.tsx',
          ],
          Component: TableToolbarWorkOrders,
        },
        {
          id: 'TableToolbarAlarms',
          title: 'Alarm table',
          note: 'Dense, sorted by severity, with acknowledge and shelve enabled by the selection.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/collections/useSelection.ts', 'industrial/StatusIndicator.tsx'],
          Component: TableToolbarAlarms,
        },
        {
          id: 'TableToolbarTags',
          title: 'Tag table',
          note: 'Time series with value, unit, quality and last update, searchable by tag or name.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/TableToolbar.tsx', 'patterns/collections/DataTable.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TableToolbarTags,
        },
        {
          id: 'TableToolbarInCard',
          title: 'Table in a card',
          note: 'On a dashboard, a card header names the table and links to the full view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TableToolbarInCard,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Loading, nothing found, nothing yet, and failed.',
      specimens: [
        {
          id: 'TableToolbarLoading',
          title: 'Loading',
          note: 'Real headers over skeleton rows, so the table does not jump when data arrives.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/SkeletonTable.tsx'],
          Component: TableToolbarLoading,
        },
        {
          id: 'TableToolbarNoResults',
          title: 'No results',
          note: 'When search or filters match nothing, say so in the table body and offer to clear them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/TableToolbar.tsx', 'patterns/collections/DataTable.tsx'],
          Component: TableToolbarNoResults,
        },
        {
          id: 'TableToolbarFirstUse',
          title: 'Empty table',
          note: 'Before any data exists, replace the table with an empty state and one way to start.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TableToolbarFirstUse,
        },
        {
          id: 'TableToolbarError',
          title: 'Error with retry',
          note: 'Keep the header, say what failed and whether anything changed, and offer one retry.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/RetryBlock.tsx'],
          Component: TableToolbarError,
        },
      ],
    },
  ],
});
