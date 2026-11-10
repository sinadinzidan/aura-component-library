import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { DataGrid, DataGridPagination, dataGridArrHasFilterFn } from '@cognite/aura/data-grid';
import type { ColumnDef, DataGridHandle } from '@cognite/aura/data-grid';
import { IconCopy, IconDownload, IconPencil, IconPlus, IconTrash, IconUserPlus } from '@cognite/aura/icons';
import { useRef, useState } from 'react';

import { DataTableToolbar } from '../../../library/data/DataTableToolbar';
import { NumberCell } from '../../../library/data/NumberCell';
import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { selectionColumn } from '../../../library/data/selectionColumn';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS, childrenOf, findAsset, findPerson } from '../../data/plant';
import type { Alarm, Asset, Sensor, Severity, WorkOrder } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatDate, formatDateTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './data-grid.tsx?raw';

type AssetRow = Asset & { subRows?: AssetRow[] };

type Datapoint = { id: string; timestamp: number; value: number; quality: 'Good' | 'Uncertain' };

const GRID_EQUIPMENT: Asset[] = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const GRID_SENSORS: Sensor[] = [...SENSORS];

const GRID_WORK_ORDERS: WorkOrder[] = [...WORK_ORDERS];

const GRID_ALARMS: Alarm[] = [...ALARMS];

function gridAssetRow(asset: Asset): AssetRow {
  const children = childrenOf(asset.id);
  return children.length > 0 ? { ...asset, subRows: children.map(gridAssetRow) } : asset;
}

/** Areas with their equipment nested as sub rows. */
const GRID_ASSET_TREE: AssetRow[] = childrenOf('nk').map(gridAssetRow);

/** 48 hourly datapoints of discharge pressure, newest first. */
const GRID_DATAPOINTS: Datapoint[] = makeSeries({ seed: 11, points: 48, base: 48.2, amplitude: 1.8, noise: 0.5 })
  .map((point, index) => ({
    id: `dp-${point.t}`,
    timestamp: point.t,
    value: point.v,
    quality: index % 17 === 9 ? ('Uncertain' as const) : ('Good' as const),
  }))
  .reverse();

const GRID_TYPE_LABELS: Record<Asset['type'], string> = {
  site: 'Site',
  area: 'Area',
  system: 'System',
  compressor: 'Compressor',
  pump: 'Pump',
  separator: 'Separator',
  exchanger: 'Heat exchanger',
  valve: 'Valve',
  turbine: 'Turbine',
};

const GRID_ORDER_TYPE_LABELS: Record<WorkOrder['type'], string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

const GRID_SEVERITY: Record<Severity, { label: string; variant: 'error' | 'warning' | 'secondary' | 'archived' }> = {
  critical: { label: 'Critical', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'secondary' },
  low: { label: 'Low', variant: 'archived' },
};

const GRID_ALARM_STATE: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

const GRID_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const GRID_PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

const gridAssetId = (asset: Asset) => asset.id;
const gridOrderId = (order: WorkOrder) => order.id;
const gridAssigneeName = (order: WorkOrder) => findPerson(order.assigneeId)?.name ?? '';
const gridAssetName = (row: { assetId: string }) => findAsset(row.assetId)?.name ?? '';

function GridTag({ children }: { children: string }) {
  return <span className="font-mono text-xs text-medium-foreground">{children}</span>;
}

function GridPerson({ order }: { order: WorkOrder }) {
  const person = findPerson(order.assigneeId);
  if (!person) return <span className="text-muted-foreground">Unassigned</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PersonAvatar name={person.name} initials={person.initials} colorKey={person.id} sizes="xxsm" />
      <span className="truncate">{person.name}</span>
    </span>
  );
}

function GridDueDate({ order }: { order: WorkOrder }) {
  const overdue = order.status !== 'done' && order.dueAt < REFERENCE_NOW;
  return overdue ? (
    <span className="tabular-nums font-medium text-critical-foreground-strong">{formatDate(order.dueAt)}, overdue</span>
  ) : (
    <span className="tabular-nums">{formatDate(order.dueAt)}</span>
  );
}

function GridOrderActions({ order }: { order: WorkOrder }) {
  return (
    <RowActionsMenu
      label={`Actions for ${order.id}`}
      actions={[
        { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
        { id: 'edit', label: 'Edit', icon: <IconPencil />, onSelect: () => undefined },
        { id: 'duplicate', label: 'Duplicate', icon: <IconCopy />, onSelect: () => undefined },
        { id: 'delete', label: 'Delete', icon: <IconTrash />, onSelect: () => undefined, destructive: true },
      ]}
    />
  );
}

const GRID_ASSET_COLUMNS: ColumnDef<Asset>[] = [
  { accessorKey: 'tag', header: 'Tag', size: 140 },
  { accessorKey: 'name', header: 'Name' },
  { accessorFn: (asset) => GRID_TYPE_LABELS[asset.type], id: 'type', header: 'Type', size: 160 },
  { accessorKey: 'criticality', header: 'Criticality', size: 120 },
];

const GRID_ASSET_STATUS_COLUMNS: ColumnDef<Asset>[] = [
  { accessorKey: 'tag', header: 'Tag', size: 140, cell: ({ row }) => <GridTag>{row.original.tag}</GridTag> },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'state',
    header: 'State',
    size: 160,
    cell: ({ row }) => <StatusBadge status={row.original.state} />,
  },
  {
    accessorKey: 'healthScore',
    header: 'Health',
    size: 120,
    cell: ({ row }) => <NumberCell value={row.original.healthScore} width={3} />,
  },
];

const GRID_ORDER_COLUMNS: ColumnDef<WorkOrder>[] = [
  { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <GridTag>{row.original.id}</GridTag> },
  { accessorKey: 'title', header: 'Title', size: 300 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) => <StatusBadge status={row.original.status} showIcon={false} />,
  },
  { accessorKey: 'priority', header: 'Priority', size: 100 },
];

const GRID_SENSOR_COLUMNS: ColumnDef<Sensor>[] = [
  { accessorKey: 'tag', header: 'Tag', size: 130, cell: ({ row }) => <GridTag>{row.original.tag}</GridTag> },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'value',
    header: 'Value',
    size: 150,
    cell: ({ row }) => {
      const sensor = row.original;
      const high = sensor.value > sensor.highLimit;
      return (
        <NumberCell
          value={sensor.quality === 'bad' ? null : sensor.value}
          decimals={sensor.decimals}
          unit={sensor.unit}
          width={7}
          tone={high ? 'critical' : 'default'}
          toneLabel={high ? 'Above high limit' : undefined}
        />
      );
    },
  },
  {
    accessorKey: 'lowLimit',
    header: 'Low limit',
    size: 110,
    cell: ({ row }) => <NumberCell value={row.original.lowLimit} width={7} />,
  },
  {
    accessorKey: 'highLimit',
    header: 'High limit',
    size: 110,
    cell: ({ row }) => <NumberCell value={row.original.highLimit} width={7} />,
  },
];

function DataGridBasic() {
  return <DataGrid data={GRID_EQUIPMENT} columns={GRID_ASSET_COLUMNS} getRowId={gridAssetId} aria-label="Equipment" />;
}

function DataGridSortable() {
  return (
    <DataGrid
      data={GRID_EQUIPMENT}
      columns={GRID_ASSET_COLUMNS}
      getRowId={gridAssetId}
      enableSorting
      defaultSorting={[{ id: 'name', desc: false }]}
      aria-label="Equipment, sortable"
    />
  );
}

function DataGridCompact() {
  return (
    <DataGrid
      data={GRID_EQUIPMENT}
      columns={GRID_ASSET_COLUMNS}
      getRowId={gridAssetId}
      size="compact"
      aria-label="Equipment, compact rows"
    />
  );
}

function DataGridStriped() {
  return (
    <DataGrid
      data={GRID_EQUIPMENT}
      columns={GRID_ASSET_COLUMNS}
      getRowId={gridAssetId}
      striped
      emphasizeHeader
      aria-label="Equipment, striped rows"
    />
  );
}

function DataGridWrappedCells() {
  return (
    <DataGrid
      data={GRID_ALARMS}
      columns={[
        { accessorKey: 'sensorTag', header: 'Tag', size: 130 },
        { accessorKey: 'message', header: 'Alarm', size: 180 },
        { accessorFn: gridAssetName, id: 'asset', header: 'Equipment', size: 150 },
        { accessorKey: 'value', header: 'Value', size: 110 },
      ]}
      getRowId={(alarm) => alarm.id}
      wrapCells
      aria-label="Alarms with wrapped text"
    />
  );
}

function DataGridFixedHeight() {
  return (
    <div className="h-64 w-full">
      <DataGrid
        className="h-full"
        data={GRID_SENSORS}
        columns={GRID_SENSOR_COLUMNS}
        getRowId={(sensor) => sensor.id}
        aria-label="Sensors in a fixed-height panel"
      />
    </div>
  );
}

function DataGridPinnedColumn() {
  return (
    <DataGrid
      data={GRID_SENSORS}
      columns={[
        { accessorKey: 'tag', header: 'Tag', size: 140, cell: ({ row }) => <GridTag>{row.original.tag}</GridTag> },
        { accessorKey: 'name', header: 'Name', size: 220 },
        { accessorFn: gridAssetName, id: 'asset', header: 'Equipment', size: 200 },
        { accessorKey: 'unit', header: 'Unit', size: 100 },
        { accessorKey: 'value', header: 'Value', size: 120, cell: ({ row }) => <NumberCell value={row.original.value} decimals={row.original.decimals} width={7} /> },
        { accessorKey: 'lowLimit', header: 'Low limit', size: 120, cell: ({ row }) => <NumberCell value={row.original.lowLimit} width={7} /> },
        { accessorKey: 'highLimit', header: 'High limit', size: 120, cell: ({ row }) => <NumberCell value={row.original.highLimit} width={7} /> },
        { accessorKey: 'rangeMax', header: 'Range max', size: 120, cell: ({ row }) => <NumberCell value={row.original.rangeMax} width={7} /> },
        { accessorKey: 'quality', header: 'Quality', size: 120 },
      ]}
      getRowId={(sensor) => sensor.id}
      pinnedColumns={['tag']}
      aria-label="Sensors with a pinned tag column"
    />
  );
}

function DataGridResizableColumns() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={GRID_ORDER_COLUMNS}
      getRowId={gridOrderId}
      enableColumnResizing
      defaultColumnSizing={{ title: 220 }}
      aria-label="Work orders with resizable columns"
    />
  );
}

function DataGridStatusCells() {
  return (
    <DataGrid
      data={GRID_EQUIPMENT}
      columns={GRID_ASSET_STATUS_COLUMNS}
      getRowId={gridAssetId}
      aria-label="Equipment with run state"
    />
  );
}

function DataGridNumberCells() {
  return (
    <DataGrid
      data={GRID_SENSORS}
      columns={GRID_SENSOR_COLUMNS}
      getRowId={(sensor) => sensor.id}
      enableSorting
      aria-label="Sensor values and limits"
    />
  );
}

function DataGridPersonCells() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[
        { accessorKey: 'title', header: 'Work order' },
        {
          accessorFn: gridAssigneeName,
          id: 'assignee',
          header: 'Assignee',
          size: 200,
          cell: ({ row }) => <GridPerson order={row.original} />,
        },
        {
          accessorKey: 'dueAt',
          header: 'Due',
          size: 170,
          cell: ({ row }) => <GridDueDate order={row.original} />,
        },
      ]}
      getRowId={gridOrderId}
      aria-label="Work orders with assignee and due date"
    />
  );
}

function DataGridProgressCells() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[
        { accessorKey: 'title', header: 'Work order' },
        {
          accessorKey: 'estimatedHours',
          header: 'Estimate',
          size: 110,
          cell: ({ row }) => <NumberCell value={row.original.estimatedHours} unit="h" width={2} />,
        },
        {
          accessorKey: 'progress',
          header: 'Progress',
          size: 200,
          cell: ({ row }) => (
            <span className="flex items-center gap-3">
              <Progress
                value={row.original.progress}
                size="sm"
                className="w-24"
                aria-label={`${row.original.id} progress`}
              />
              <span className="tabular-nums text-medium-foreground">{row.original.progress}%</span>
            </span>
          ),
        },
      ]}
      getRowId={gridOrderId}
      aria-label="Work orders with progress"
    />
  );
}

function DataGridRowActions() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[
        ...GRID_ORDER_COLUMNS.slice(0, 3),
        {
          id: 'actions',
          header: () => <span className="sr-only">Actions</span>,
          size: 56,
          cell: ({ row }) => <GridOrderActions order={row.original} />,
        },
      ]}
      getRowId={gridOrderId}
      aria-label="Work orders with row actions"
    />
  );
}

function DataGridClickableRows() {
  const [opened, setOpened] = useState<WorkOrder | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <DataGrid
        data={GRID_WORK_ORDERS}
        columns={GRID_ORDER_COLUMNS}
        getRowId={gridOrderId}
        onRowClick={(row) => setOpened(row.original)}
        aria-label="Work orders; select a row to open it"
      />
      <p role="status" className="px-4 text-sm text-muted-foreground">
        {opened ? `Opened ${opened.id}: ${opened.title}.` : 'Click a row, or focus it and press Enter, to open it.'}
      </p>
    </div>
  );
}

function DataGridRowSelection() {
  const [message, setMessage] = useState('Two rows are selected to show the action toolbar.');

  return (
    <div className="flex w-full flex-col gap-3">
      <DataGrid
        data={GRID_WORK_ORDERS}
        columns={[selectionColumn<WorkOrder>({ getRowLabel: gridOrderId }), ...GRID_ORDER_COLUMNS]}
        getRowId={gridOrderId}
        enableRowSelection
        defaultRowSelection={{ 'WO-104479': true, 'WO-104466': true }}
        selectionActions={{
          primaryAction: {
            label: 'Assign',
            onClick: (selection) => setMessage(`Assigning ${Object.keys(selection).length} work orders.`),
          },
          secondaryActions: [
            {
              label: 'Export',
              icon: <IconDownload />,
              onClick: (selection) => setMessage(`Exporting ${Object.keys(selection).length} work orders.`),
            },
          ],
          menuActions: [{ label: 'Delete', icon: <IconTrash />, onClick: () => setMessage('Delete asks for confirmation first.') }],
        }}
        aria-label="Work orders with row selection"
      />
      <p role="status" className="px-4 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function DataGridSelectableSubset() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[selectionColumn<WorkOrder>({ getRowLabel: gridOrderId }), ...GRID_ORDER_COLUMNS]}
      getRowId={gridOrderId}
      enableRowSelection={(row) => row.original.status !== 'done'}
      aria-label="Work orders; completed ones cannot be selected"
    />
  );
}

function DataGridExpandableRows() {
  return (
    <DataGrid
      data={GRID_ASSET_TREE}
      columns={[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'tag', header: 'Tag', size: 140, cell: ({ row }) => <GridTag>{row.original.tag}</GridTag> },
        {
          accessorKey: 'state',
          header: 'State',
          size: 160,
          cell: ({ row }) => <StatusBadge status={row.original.state} showIcon={false} />,
        },
        {
          accessorKey: 'healthScore',
          header: 'Health',
          size: 100,
          cell: ({ row }) => <NumberCell value={row.original.healthScore} width={3} />,
        },
      ]}
      getRowId={gridAssetId}
      getSubRows={(row) => row.subRows}
      defaultExpanded={{ 'nk-23': true }}
      aria-label="Areas with their equipment"
    />
  );
}

function DataGridPaginated() {
  return (
    <DataGrid
      data={GRID_DATAPOINTS}
      columns={[
        {
          accessorKey: 'timestamp',
          header: 'Time',
          cell: ({ row }) => <span className="tabular-nums">{formatDateTime(row.original.timestamp)}</span>,
        },
        {
          accessorKey: 'value',
          header: 'Discharge pressure',
          size: 200,
          cell: ({ row }) => <NumberCell value={row.original.value} decimals={1} unit="barg" width={5} />,
        },
        { accessorKey: 'quality', header: 'Quality', size: 140 },
      ]}
      getRowId={(datapoint) => datapoint.id}
      defaultPagination={{ pageIndex: 0, pageSize: 5 }}
      aria-label="Discharge pressure datapoints"
    >
      <DataGridPagination pageSizeOptions={[5, 10, 25]} />
    </DataGrid>
  );
}

function DataGridWithSearch() {
  return (
    <DataGrid
      data={GRID_EQUIPMENT}
      columns={GRID_ASSET_STATUS_COLUMNS}
      getRowId={gridAssetId}
      defaultSearchValue="compressor"
      aria-label="Equipment"
    >
      <DataTableToolbar
        title="Equipment"
        noun={['piece of equipment', 'pieces of equipment']}
        searchLabel="Search equipment"
        searchPlaceholder="Search by tag or name"
      />
    </DataGrid>
  );
}

function DataGridColumnFilters() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[
        { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <GridTag>{row.original.id}</GridTag> },
        { accessorKey: 'title', header: 'Title' },
        {
          accessorKey: 'status',
          header: 'Status',
          size: 160,
          filterFn: dataGridArrHasFilterFn,
          cell: ({ row }) => <StatusBadge status={row.original.status} showIcon={false} />,
        },
        { accessorKey: 'priority', header: 'Priority', size: 130, filterFn: dataGridArrHasFilterFn },
      ]}
      getRowId={gridOrderId}
      enableSorting
      columnFilterOptions={{ status: GRID_STATUS_OPTIONS, priority: GRID_PRIORITY_OPTIONS }}
      defaultColumnFilters={[{ id: 'status', value: ['open', 'planned', 'in-progress'] }]}
      aria-label="Work orders filtered by status"
    />
  );
}

function DataGridLoading() {
  return (
    <DataGrid
      data={[]}
      columns={GRID_ORDER_COLUMNS}
      getRowId={gridOrderId}
      loading
      loadingRowCount={5}
      aria-label="Work orders, loading"
    />
  );
}

function DataGridEmpty() {
  return (
    <DataGrid
      data={[]}
      columns={GRID_ORDER_COLUMNS}
      getRowId={gridOrderId}
      emptyState={{
        title: 'No work orders yet',
        description: 'Work orders appear here when they are created or synced from SAP.',
        action: (
          <Button size="sm">
            <IconPlus /> Create work order
          </Button>
        ),
      }}
      aria-label="Work orders, empty"
    />
  );
}

function DataGridNoResults() {
  const gridRef = useRef<DataGridHandle>(null);

  return (
    <DataGrid
      gridRef={gridRef}
      data={GRID_WORK_ORDERS}
      columns={GRID_ORDER_COLUMNS}
      getRowId={gridOrderId}
      defaultSearchValue="gearbox"
      onClearSearch={() => gridRef.current?.resetSearch()}
      aria-label="Work orders, no search results"
    >
      <DataTableToolbar title="Work orders" noun={['work order', 'work orders']} searchLabel="Search work orders" />
    </DataGrid>
  );
}

function DataGridWorkOrders() {
  return (
    <DataGrid
      data={GRID_WORK_ORDERS}
      columns={[
        selectionColumn<WorkOrder>({ getRowLabel: gridOrderId }),
        { accessorKey: 'id', header: 'ID', size: 110, cell: ({ row }) => <GridTag>{row.original.id}</GridTag> },
        { accessorKey: 'title', header: 'Title', size: 280 },
        { accessorFn: gridAssetName, id: 'asset', header: 'Equipment', size: 180 },
        {
          accessorFn: (order) => GRID_ORDER_TYPE_LABELS[order.type],
          id: 'type',
          header: 'Type',
          size: 120,
        },
        { accessorKey: 'priority', header: 'Priority', size: 110, filterFn: dataGridArrHasFilterFn },
        {
          accessorKey: 'status',
          header: 'Status',
          size: 140,
          filterFn: dataGridArrHasFilterFn,
          cell: ({ row }) => <StatusBadge status={row.original.status} showIcon={false} />,
        },
        {
          accessorFn: gridAssigneeName,
          id: 'assignee',
          header: 'Assignee',
          size: 180,
          cell: ({ row }) => <GridPerson order={row.original} />,
        },
        { accessorKey: 'dueAt', header: 'Due', size: 160, cell: ({ row }) => <GridDueDate order={row.original} /> },
        {
          accessorKey: 'estimatedHours',
          header: 'Estimate',
          size: 110,
          cell: ({ row }) => <NumberCell value={row.original.estimatedHours} unit="h" width={2} />,
        },
        {
          id: 'actions',
          header: () => <span className="sr-only">Actions</span>,
          size: 56,
          enableSorting: false,
          cell: ({ row }) => <GridOrderActions order={row.original} />,
        },
      ]}
      getRowId={gridOrderId}
      size="compact"
      enableSorting
      enableRowSelection
      pinnedColumns={['select', 'id']}
      defaultSorting={[{ id: 'dueAt', desc: false }]}
      columnFilterOptions={{ status: GRID_STATUS_OPTIONS, priority: GRID_PRIORITY_OPTIONS }}
      defaultPagination={{ pageIndex: 0, pageSize: 5 }}
      selectionActions={{
        primaryAction: { label: 'Assign', onClick: () => undefined },
        secondaryActions: [{ label: 'Export', icon: <IconDownload />, onClick: () => undefined }],
      }}
      aria-label="Work orders"
    >
      <DataTableToolbar
        title="Work orders"
        noun={['work order', 'work orders']}
        searchLabel="Search work orders"
        actions={
          <Button size="sm">
            <IconPlus /> Create work order
          </Button>
        }
      />
      <DataGridPagination pageSizeOptions={[5, 10, 25]} />
    </DataGrid>
  );
}

function DataGridAlarms() {
  return (
    <DataGrid<Alarm>
      data={GRID_ALARMS}
      columns={[
        {
          accessorKey: 'severity',
          header: 'Severity',
          size: 110,
          filterFn: dataGridArrHasFilterFn,
          cell: ({ row }) => (
            <Badge variant={GRID_SEVERITY[row.original.severity].variant}>{GRID_SEVERITY[row.original.severity].label}</Badge>
          ),
        },
        { accessorKey: 'message', header: 'Alarm', size: 300 },
        {
          accessorKey: 'sensorTag',
          header: 'Tag',
          size: 130,
          cell: ({ row }) => <GridTag>{row.original.sensorTag}</GridTag>,
        },
        { accessorFn: gridAssetName, id: 'asset', header: 'Equipment', size: 180 },
        { accessorKey: 'value', header: 'Value', size: 110 },
        { accessorKey: 'limit', header: 'Limit', size: 110 },
        {
          accessorKey: 'raisedAt',
          header: 'Raised',
          size: 120,
          cell: ({ row }) => (
            <span className="tabular-nums" title={formatDateTime(row.original.raisedAt)}>
              {formatAgo(row.original.raisedAt)}
            </span>
          ),
        },
        {
          accessorFn: (alarm) => GRID_ALARM_STATE[alarm.state],
          id: 'state',
          header: 'State',
          size: 130,
        },
      ]}
      getRowId={(alarm) => alarm.id}
      size="compact"
      striped
      enableSorting
      defaultSorting={[{ id: 'raisedAt', desc: true }]}
      columnFilterOptions={{
        severity: [
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ],
      }}
      aria-label="Alarms"
    >
      <DataTableToolbar title="Alarms" noun={['alarm', 'alarms']} searchLabel="Search alarms" />
    </DataGrid>
  );
}

export default definePage({
  id: 'data-grid',
  title: 'Data grid',
  summary:
    'A data grid is a virtualised table for dense, scannable data. It sorts, filters, searches and pages in the browser or against a server, pins columns, nests rows and tracks selection with an action toolbar.',
  docsSlug: 'data-grid',
  guidance: {
    use: [
      'Comparing rows across several attributes, or acting on many rows at once.',
      'Give every grid an aria-label and stable row IDs with getRowId.',
      'Fixed sizes for short columns and one flexible column for the name or title.',
      'Custom cells for status, numbers and people so they read the same in every table.',
    ],
    avoid: [
      'A handful of items with one or two attributes; use an item list or cards.',
      'More than one primary action per row; put the rest in a row menu.',
      'Hiding the only identifier when columns scroll; pin it.',
      'A blank body: always set loading, empty and no-results states.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The grid on its own: density, sorting, wrapping and how it handles more columns or rows than fit.',
      specimens: [
        {
          id: 'DataGridBasic',
          title: 'Basic',
          note: 'Read-only rows from column definitions, with one flexible column.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridBasic,
        },
        {
          id: 'DataGridSortable',
          title: 'Sortable',
          note: 'Any table people scan for the highest, lowest or latest; one column starts sorted.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridSortable,
        },
        {
          id: 'DataGridCompact',
          title: 'Compact rows',
          note: '32px rows for dense operational tables and side panels.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridCompact,
        },
        {
          id: 'DataGridStriped',
          title: 'Striped with emphasised header',
          note: 'Long read-only tables where the eye needs help staying on a row.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridStriped,
        },
        {
          id: 'DataGridWrappedCells',
          title: 'Wrapped cells',
          note: 'Text that must be read in full, such as alarm messages; rows grow to fit.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridWrappedCells,
        },
        {
          id: 'DataGridFixedHeight',
          title: 'Fixed height',
          note: 'A grid in a panel: the header stays put and the rows scroll under it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/NumberCell.tsx'],
          Component: DataGridFixedHeight,
        },
        {
          id: 'DataGridPinnedColumn',
          title: 'Pinned column',
          note: 'Wide tables: the identifier stays visible while the other columns scroll sideways.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/NumberCell.tsx'],
          Component: DataGridPinnedColumn,
        },
        {
          id: 'DataGridResizableColumns',
          title: 'Resizable columns',
          note: 'Tables people tune to their own data; drag the edge of a column header.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: DataGridResizableColumns,
        },
      ],
    },
    {
      id: 'cells',
      title: 'Cell renderers',
      description: 'Typed cells so status, numbers, people and actions look the same in every table.',
      specimens: [
        {
          id: 'DataGridStatusCells',
          title: 'Status cells',
          note: 'One status per row as a badge with icon and text, never colour alone.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'data/NumberCell.tsx'],
          Component: DataGridStatusCells,
        },
        {
          id: 'DataGridNumberCells',
          title: 'Number cells',
          note: 'Tabular digits, fixed decimals and units; an out-of-limit value is marked and explained.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/NumberCell.tsx'],
          Component: DataGridNumberCells,
        },
        {
          id: 'DataGridPersonCells',
          title: 'Person and date cells',
          note: 'Avatar with name, a clear "Unassigned", and overdue dates called out in words.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: DataGridPersonCells,
        },
        {
          id: 'DataGridProgressCells',
          title: 'Progress cells',
          note: 'Completion as a small bar with the percentage beside it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/NumberCell.tsx'],
          Component: DataGridProgressCells,
        },
        {
          id: 'DataGridRowActions',
          title: 'Row actions menu',
          note: 'Several actions per row behind one quiet button in a narrow last column.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/RowActionsMenu.tsx', 'display/StatusBadge.tsx'],
          Component: DataGridRowActions,
        },
      ],
    },
    {
      id: 'interaction',
      title: 'Interaction',
      description: 'Opening, selecting, nesting, paging, searching and filtering rows.',
      specimens: [
        {
          id: 'DataGridClickableRows',
          title: 'Clickable rows',
          note: 'The whole row opens the record; rows are focusable and respond to Enter.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: DataGridClickableRows,
        },
        {
          id: 'DataGridRowSelection',
          title: 'Row selection with actions',
          note: 'Bulk work: checking rows brings up a toolbar with one primary action and a few others.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/selectionColumn.tsx', 'data/SelectionCheckbox.tsx'],
          Component: DataGridRowSelection,
        },
        {
          id: 'DataGridSelectableSubset',
          title: 'Rows that cannot be selected',
          note: 'Only some rows qualify for the bulk action; the rest have a disabled checkbox.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/selectionColumn.tsx', 'data/SelectionCheckbox.tsx'],
          Component: DataGridSelectableSubset,
        },
        {
          id: 'DataGridExpandableRows',
          title: 'Expandable rows',
          note: 'Hierarchies that still need columns: parents expand to show their children indented.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'data/NumberCell.tsx'],
          Component: DataGridExpandableRows,
        },
        {
          id: 'DataGridPaginated',
          title: 'Paginated',
          note: 'More rows than anyone scrolls: numbered pages, a page size picker and a status line.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/NumberCell.tsx'],
          Component: DataGridPaginated,
        },
        {
          id: 'DataGridWithSearch',
          title: 'Header with search',
          note: 'A title, a live count and a search field that filters across every column.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/DataTableToolbar.tsx', 'display/StatusBadge.tsx'],
          Component: DataGridWithSearch,
        },
        {
          id: 'DataGridColumnFilters',
          title: 'Column filters',
          note: 'Filter by the values of a column from its header menu; active filters show as removable badges.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: DataGridColumnFilters,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the body shows while loading, before there is data, and when nothing matches.',
      specimens: [
        {
          id: 'DataGridLoading',
          title: 'Loading',
          note: 'Skeleton rows under the real header while the first page loads.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridLoading,
        },
        {
          id: 'DataGridEmpty',
          title: 'Empty',
          note: 'No rows exist yet: say what belongs here and offer the first step.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: DataGridEmpty,
        },
        {
          id: 'DataGridNoResults',
          title: 'No results',
          note: 'Rows exist but the search hides them all; offer to clear the search.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['data/DataTableToolbar.tsx'],
          Component: DataGridNoResults,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Complete operational tables built from the pieces above.',
      specimens: [
        {
          id: 'DataGridWorkOrders',
          title: 'Work order table',
          note: 'The full pattern: toolbar, pinned ID, sorting, filters, selection, row actions and paging.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'data/DataTableToolbar.tsx',
            'data/selectionColumn.tsx',
            'data/SelectionCheckbox.tsx',
            'data/NumberCell.tsx',
            'data/RowActionsMenu.tsx',
            'display/StatusBadge.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: DataGridWorkOrders,
        },
        {
          id: 'DataGridAlarms',
          title: 'Alarm list',
          note: 'A dense, striped read-only list sorted by newest, with severity filter and search.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['data/DataTableToolbar.tsx'],
          Component: DataGridAlarms,
        },
      ],
    },
  ],
});
