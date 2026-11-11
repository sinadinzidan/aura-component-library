import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { DropdownMenuItem } from '@cognite/aura/components/dropdown-menu';
import { IconAlertTriangle, IconDownload, IconEye, IconPencil, IconRefresh, IconTrash, IconUserPlus } from '@cognite/aura/icons';
import { useState } from 'react';

import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { formatValue, qualityStatus, severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableDetailRow } from '../../../library/primitives/table/TableDetailRow';
import { TableExpandCell } from '../../../library/primitives/table/TableExpandCell';
import { TableFooter } from '../../../library/primitives/table/TableFooter';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableMessageRow } from '../../../library/primitives/table/TableMessageRow';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { TableRowAction } from '../../../library/primitives/table/TableRowAction';
import { TableSectionRow } from '../../../library/primitives/table/TableSectionRow';
import { TableSelectionCell } from '../../../library/primitives/table/TableSelectionCell';
import { TableSkeletonRows } from '../../../library/primitives/table/TableSkeletonRows';
import { useTableSelection } from '../../../library/primitives/table/useTableSelection';
import { useTableSort } from '../../../library/primitives/table/useTableSort';
import type { Alarm, Sensor, WorkOrder } from '../../data/plant';
import { ALARMS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatAgo, formatDate, REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './table.tsx?raw';

const FIRST_ORDERS = WORK_ORDERS.slice(0, 5);
const ALL_ORDER_IDS = WORK_ORDERS.map((order) => order.id);

const ORDER_ACCESSORS = {
  id: (order: WorkOrder) => order.id,
  title: (order: WorkOrder) => order.title,
  priority: (order: WorkOrder) => order.priority,
  hours: (order: WorkOrder) => order.estimatedHours,
  due: (order: WorkOrder) => order.dueAt,
};

const SENSOR_ACCESSORS = {
  tag: (sensor: Sensor) => sensor.tag,
  value: (sensor: Sensor) => sensor.value / sensor.highLimit,
};

function PrimAssetTag({ assetId }: { assetId: string }) {
  return <>{findAsset(assetId)?.tag ?? assetId}</>;
}

function PrimPerson({ personId }: { personId: string | null }) {
  const person = findPerson(personId);
  if (!person) return <span className="text-muted-foreground">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <PersonAvatar name={person.name} initials={person.initials} sizes="xsm" />
      {person.name}
    </span>
  );
}

function PrimDue({ order }: { order: WorkOrder }) {
  const overdue = order.status !== 'done' && order.dueAt < REFERENCE_NOW;
  return overdue ? (
    <span className="inline-flex items-center gap-1 text-critical-foreground-strong">
      <IconAlertTriangle aria-hidden="true" className="size-3.5" />
      {formatDate(order.dueAt)}
      <span className="sr-only">, overdue</span>
    </span>
  ) : (
    <>{formatDate(order.dueAt)}</>
  );
}

function PrimOrderHead({ withStatus = true }: { withStatus?: boolean }) {
  return (
    <TableRow>
      <TableHead>Work order</TableHead>
      <TableHead>Title</TableHead>
      <TableHead>Asset</TableHead>
      <TableHead>Priority</TableHead>
      {withStatus ? <TableHead>Status</TableHead> : null}
      <TableHead numeric>Hours</TableHead>
    </TableRow>
  );
}

function PrimOrderRow({ order, withStatus = true }: { order: WorkOrder; withStatus?: boolean }) {
  return (
    <TableRow>
      <TableCell mono>{order.id}</TableCell>
      <TableCell>{order.title}</TableCell>
      <TableCell mono muted>
        <PrimAssetTag assetId={order.assetId} />
      </TableCell>
      <TableCell>{order.priority}</TableCell>
      {withStatus ? (
        <TableCell>
          <StatusBadge status={order.status} />
        </TableCell>
      ) : null}
      <TableCell numeric>{order.estimatedHours}</TableCell>
    </TableRow>
  );
}

function TablePrimBasic() {
  return (
    <Table label="Work orders">
      <TableHeader>
        <PrimOrderHead />
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.map((order) => (
          <PrimOrderRow key={order.id} order={order} />
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimCompact() {
  return (
    <Table label="Work orders, compact" density="compact">
      <TableHeader>
        <PrimOrderHead />
      </TableHeader>
      <TableBody>
        {WORK_ORDERS.map((order) => (
          <PrimOrderRow key={order.id} order={order} />
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimComfortable() {
  return (
    <Table label="Work orders, comfortable" density="comfortable">
      <TableHeader>
        <PrimOrderHead withStatus={false} />
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => (
          <PrimOrderRow key={order.id} order={order} withStatus={false} />
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimAlignments() {
  return (
    <Table label="Compressor readings, alignment">
      <TableHeader>
        <TableRow>
          <TableHead>Tag</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead align="center">Unit</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead numeric>High limit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SENSORS.slice(0, 5).map((sensor) => (
          <TableRow key={sensor.id}>
            <TableCell mono>{sensor.tag}</TableCell>
            <TableCell>{qualityStatus(sensor.quality).label}</TableCell>
            <TableCell align="center" muted>
              {sensor.unit}
            </TableCell>
            <TableCell numeric>{formatValue(sensor.value, sensor.decimals)}</TableCell>
            <TableCell numeric muted>
              {formatValue(sensor.highLimit, sensor.decimals)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimCaption() {
  return (
    <Table label="Open work orders">
      <TableCaption side="top">Open work orders, Nordkapp</TableCaption>
      <TableHeader>
        <PrimOrderHead withStatus={false} />
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => (
          <PrimOrderRow key={order.id} order={order} withStatus={false} />
        ))}
      </TableBody>
      <TableCaption>Source: maintenance system, 12 Mar 14:00</TableCaption>
    </Table>
  );
}

function TablePrimSortable() {
  const sort = useTableSort({
    rows: WORK_ORDERS,
    accessors: ORDER_ACCESSORS,
    defaultSort: { columnId: 'due', direction: 'asc' },
  });
  return (
    <Table label="Work orders, sortable">
      <TableHeader>
        <TableRow>
          <TableHead {...sort.headProps('id')}>Work order</TableHead>
          <TableHead {...sort.headProps('title')}>Title</TableHead>
          <TableHead {...sort.headProps('priority')}>Priority</TableHead>
          <TableHead numeric {...sort.headProps('hours')}>
            Hours
          </TableHead>
          <TableHead numeric {...sort.headProps('due')}>
            Due
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sort.rows.map((order) => (
          <TableRow key={order.id}>
            <TableCell mono>{order.id}</TableCell>
            <TableCell>{order.title}</TableCell>
            <TableCell>{order.priority}</TableCell>
            <TableCell numeric>{order.estimatedHours}</TableCell>
            <TableCell numeric>
              <PrimDue order={order} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimSelectable() {
  const selection = useTableSelection(ALL_ORDER_IDS, ['WO-104479']);
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {selection.count} of {ALL_ORDER_IDS.length} selected
      </p>
      <Table label="Work orders, selectable">
        <TableHeader>
          <TableRow>
            <TableSelectionCell label="Select all work orders" {...selection.headerProps} />
            <TableHead>Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WORK_ORDERS.slice(0, 6).map((order) => (
            <TableRow key={order.id} selected={selection.isSelected(order.id)}>
              <TableSelectionCell label={`Select ${order.id}`} {...selection.rowProps(order.id)} />
              <TableCell mono>{order.id}</TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TablePrimRowActions() {
  const [log, setLog] = useState('No action yet');
  return (
    <div className="flex w-full flex-col gap-3">
      <Table label="Work orders with actions">
        <TableHeader>
          <TableRow>
            <TableHead>Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead srOnly>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FIRST_ORDERS.slice(0, 4).map((order) => (
            <TableRow key={order.id}>
              <TableCell mono>{order.id}</TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell actions>
                <RowActionsMenu
                  label={`Actions for ${order.id}`}
                  actions={[
                    {
                      id: 'open',
                      label: 'Open',
                      icon: <IconEye />,
                      onSelect: () => setLog(`Opened ${order.id}`),
                    },
                    {
                      id: 'assign',
                      label: 'Assign',
                      icon: <IconUserPlus />,
                      onSelect: () => setLog(`Assigned ${order.id}`),
                    },
                    {
                      id: 'cancel',
                      label: 'Cancel order',
                      icon: <IconTrash />,
                      destructive: true,
                      onSelect: () => setLog(`Cancelled ${order.id}`),
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {log}
      </p>
    </div>
  );
}

function TablePrimRowLink() {
  return (
    <Table label="Work orders as links">
      <TableHeader>
        <TableRow>
          <TableHead>Work order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => (
          <TableRow key={order.id} interactive>
            <TableCell mono>
              <TableRowAction href={`#${order.id}`}>{order.id}</TableRowAction>
            </TableCell>
            <TableCell>{order.title}</TableCell>
            <TableCell>
              <StatusBadge status={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimRowButton() {
  const [currentId, setCurrentId] = useState<string | null>('WO-104479');
  const current = WORK_ORDERS.find((order) => order.id === currentId);
  return (
    <div className="flex w-full flex-col gap-3">
      <Table label="Work orders, pick one">
        <TableHeader>
          <TableRow>
            <TableHead>Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FIRST_ORDERS.slice(0, 4).map((order) => (
            <TableRow key={order.id} interactive current={order.id === currentId}>
              <TableCell mono>
                <TableRowAction onClick={() => setCurrentId(order.id)}>{order.id}</TableRowAction>
              </TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell>
                <PrimPerson personId={order.assigneeId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {current ? `Details open for ${current.id}` : 'Pick a row to open its details'}
      </p>
    </div>
  );
}

function TablePrimExpandable() {
  const [openId, setOpenId] = useState<string | null>('WO-104482');
  return (
    <Table label="Work orders with details">
      <TableHeader>
        <TableRow>
          <TableHead srOnly>Details</TableHead>
          <TableHead>Work order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead numeric>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => {
          const open = openId === order.id;
          return <PrimExpandableRows key={order.id} order={order} open={open} onOpenChange={(next) => setOpenId(next ? order.id : null)} />;
        })}
      </TableBody>
    </Table>
  );
}

function PrimExpandableRows({ order, open, onOpenChange }: { order: WorkOrder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const detailId = `detail-${order.id}`;
  return (
    <>
      <TableRow>
        <TableExpandCell expanded={open} onExpandedChange={onOpenChange} label={order.id} controls={detailId} />
        <TableCell mono>{order.id}</TableCell>
        <TableCell>{order.title}</TableCell>
        <TableCell numeric>{order.progress} %</TableCell>
      </TableRow>
      {open ? (
        <TableDetailRow colSpan={4} id={detailId}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Asset</dt>
            <dd className="font-mono text-xs leading-5">
              <PrimAssetTag assetId={order.assetId} /> · {findAsset(order.assetId)?.name}
            </dd>
            <dt className="text-muted-foreground">Assignee</dt>
            <dd>
              <PrimPerson personId={order.assigneeId} />
            </dd>
            <dt className="text-muted-foreground">Estimate</dt>
            <dd className="tabular-nums">{order.estimatedHours} h</dd>
          </dl>
        </TableDetailRow>
      ) : null}
    </>
  );
}

function TablePrimCellTypes() {
  return (
    <Table label="Work orders, cell types">
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead numeric>Estimate</TableHead>
          <TableHead numeric>Progress</TableHead>
          <TableHead numeric>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <StatusBadge status={order.status} outline />
            </TableCell>
            <TableCell>
              <PrimPerson personId={order.assigneeId} />
            </TableCell>
            <TableCell numeric>{order.estimatedHours} h</TableCell>
            <TableCell numeric>{order.progress} %</TableCell>
            <TableCell numeric>
              <PrimDue order={order} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimFooterTotals() {
  const hours = WORK_ORDERS.reduce((sum, order) => sum + order.estimatedHours, 0);
  const open = WORK_ORDERS.filter((order) => order.status !== 'done').length;
  return (
    <Table label="Planned effort">
      <TableHeader>
        <TableRow>
          <TableHead>Work order</TableHead>
          <TableHead>Type</TableHead>
          <TableHead numeric>Estimate (h)</TableHead>
          <TableHead numeric>Progress (%)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {WORK_ORDERS.map((order) => (
          <TableRow key={order.id}>
            <TableCell mono>{order.id}</TableCell>
            <TableCell muted>{order.type}</TableCell>
            <TableCell numeric>{order.estimatedHours}</TableCell>
            <TableCell numeric>{order.progress}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>
            Total, {open} open of {WORK_ORDERS.length}
          </TableCell>
          <TableCell numeric>{hours}</TableCell>
          <TableCell numeric>{Math.round(WORK_ORDERS.reduce((sum, order) => sum + order.progress, 0) / WORK_ORDERS.length)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function TablePrimWrap() {
  return (
    <Table label="Alarms, wrapping">
      <TableHeader>
        <TableRow>
          <TableHead>Alarm</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ALARMS.slice(0, 4).map((alarm) => (
          <TableRow key={alarm.id}>
            <TableCell mono className="align-top">
              {alarm.id}
            </TableCell>
            <TableCell className="max-w-48">
              {alarm.message} on {findAsset(alarm.assetId)?.name}, last value {alarm.value} against a limit of {alarm.limit}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimTruncate() {
  return (
    <Table label="Work orders, truncated" layout="fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Work order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="w-24">Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => (
          <TableRow key={order.id}>
            <TableCell mono>{order.id}</TableCell>
            <TableCell wrap="truncate" title={order.title}>
              {order.title}
            </TableCell>
            <TableCell>{order.priority}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimStickyHeader() {
  return (
    <Table label="Sensors" stickyHeader className="max-h-64">
      <TableHeader>
        <TableRow>
          <TableHead>Tag</TableHead>
          <TableHead>Name</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead>Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SENSORS.map((sensor) => (
          <TableRow key={sensor.id}>
            <TableCell mono>{sensor.tag}</TableCell>
            <TableCell>{sensor.name}</TableCell>
            <TableCell numeric>{formatValue(sensor.value, sensor.decimals)}</TableCell>
            <TableCell muted>{sensor.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimPinnedColumn() {
  return (
    <Table label="Sensor limits" pinFirstColumn tableClassName="min-w-3xl">
      <TableHeader>
        <TableRow>
          <TableHead>Tag</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead numeric>Low limit</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead numeric>High limit</TableHead>
          <TableHead numeric>Trip limit</TableHead>
          <TableHead>Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SENSORS.slice(0, 6).map((sensor) => (
          <TableRow key={sensor.id}>
            <TableCell mono>{sensor.tag}</TableCell>
            <TableCell>{sensor.name}</TableCell>
            <TableCell mono muted>
              <PrimAssetTag assetId={sensor.assetId} />
            </TableCell>
            <TableCell numeric muted>
              {formatValue(sensor.lowLimit, sensor.decimals)}
            </TableCell>
            <TableCell numeric>{formatValue(sensor.value, sensor.decimals)}</TableCell>
            <TableCell numeric muted>
              {formatValue(sensor.highLimit, sensor.decimals)}
            </TableCell>
            <TableCell numeric muted>
              {sensor.highHighLimit === undefined ? '—' : formatValue(sensor.highHighLimit, sensor.decimals)}
            </TableCell>
            <TableCell muted>{sensor.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const ALARM_GROUPS = [
  { id: 'active', title: 'Active' },
  { id: 'acknowledged', title: 'Acknowledged' },
  { id: 'cleared', title: 'Cleared' },
] as const;

function PrimSeverity({ alarm }: { alarm: Alarm }) {
  const status = severityStatus(alarm.severity);
  return (
    <span className="inline-flex items-center gap-2">
      <StatusDot tone={status.tone} shape={status.shape} />
      {status.label}
    </span>
  );
}

function TablePrimGrouped() {
  return (
    <Table label="Alarms by state">
      <TableHeader>
        <TableRow>
          <TableHead>Severity</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Sensor</TableHead>
          <TableHead numeric>Raised</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ALARM_GROUPS.map((group) => {
          const alarms = ALARMS.filter((alarm) => alarm.state === group.id);
          return <PrimGroupRows key={group.id} title={group.title} alarms={alarms} />;
        })}
      </TableBody>
    </Table>
  );
}

function PrimGroupRows({ title, alarms }: { title: string; alarms: readonly Alarm[] }) {
  return (
    <>
      <TableSectionRow colSpan={4} count={alarms.length}>
        {title}
      </TableSectionRow>
      {alarms.map((alarm) => (
        <TableRow key={alarm.id}>
          <TableCell>
            <PrimSeverity alarm={alarm} />
          </TableCell>
          <TableCell>{alarm.message}</TableCell>
          <TableCell mono muted>
            {alarm.sensorTag}
          </TableCell>
          <TableCell numeric muted>
            {formatAgo(alarm.raisedAt)}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TablePrimEmpty() {
  return (
    <Table label="Alarms, none active">
      <TableHeader>
        <TableRow>
          <TableHead>Severity</TableHead>
          <TableHead>Message</TableHead>
          <TableHead numeric>Raised</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableMessageRow colSpan={3}>
          <p className="font-medium text-base-foreground">No active alarms</p>
          <p>Alarms that need attention show here as they are raised.</p>
        </TableMessageRow>
      </TableBody>
    </Table>
  );
}

function TablePrimLoading() {
  return (
    <Table label="Work orders, loading">
      <TableHeader>
        <PrimOrderHead />
      </TableHeader>
      <TableBody>
        <TableSkeletonRows rows={4} columns={6} label="Loading work orders" />
      </TableBody>
    </Table>
  );
}

function TablePrimError() {
  const [attempts, setAttempts] = useState(0);
  return (
    <Table label="Work orders, failed to load">
      <TableHeader>
        <PrimOrderHead />
      </TableHeader>
      <TableBody>
        <TableMessageRow colSpan={6}>
          <IconAlertTriangle aria-hidden="true" className="size-5 text-critical-foreground-strong" />
          <p role="alert" className="font-medium text-base-foreground">
            Work orders did not load
          </p>
          <p>The maintenance system did not answer. Your filters are unchanged.</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempts(attempts + 1)}>
            <IconRefresh /> Try again
          </Button>
          {attempts > 0 ? (
            <p aria-live="polite">
              Tried {attempts} time{attempts === 1 ? '' : 's'}, still no answer.
            </p>
          ) : null}
        </TableMessageRow>
      </TableBody>
    </Table>
  );
}

function TablePrimDisabledRows() {
  return (
    <Table label="Work orders, some locked">
      <TableHeader>
        <TableRow>
          <TableHead>Work order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => {
          const locked = order.status === 'waiting';
          return (
            <TableRow key={order.id} disabled={locked}>
              <TableCell mono>{order.id}</TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell>{locked ? 'Locked while parts are on order' : ''}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TablePrimSurfaceCard() {
  return (
    <Table label="Work orders on a card" surface="card">
      <TableHeader>
        <PrimOrderHead withStatus={false} />
      </TableHeader>
      <TableBody>
        {FIRST_ORDERS.slice(0, 4).map((order) => (
          <PrimOrderRow key={order.id} order={order} withStatus={false} />
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimInCard() {
  const sort = useTableSort({
    rows: WORK_ORDERS,
    accessors: ORDER_ACCESSORS,
    defaultSort: { columnId: 'priority', direction: 'asc' },
  });
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Work orders</CardTitle>
          <CardDescription>{WORK_ORDERS.length} orders at Nordkapp</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="secondary" size="sm">
            <IconDownload /> Export
          </Button>
          <CardActions>
            <DropdownMenuItem>
              <IconPencil /> Edit columns
            </DropdownMenuItem>
          </CardActions>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent className="w-full">
        <Table label="Work orders in a card" surface="card" density="compact">
          <TableHeader>
            <TableRow>
              <TableHead {...sort.headProps('id')}>Work order</TableHead>
              <TableHead {...sort.headProps('title')}>Title</TableHead>
              <TableHead {...sort.headProps('priority')}>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead numeric {...sort.headProps('due')}>
                Due
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sort.rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell mono>{order.id}</TableCell>
                <TableCell>{order.title}</TableCell>
                <TableCell>{order.priority}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} outline />
                </TableCell>
                <TableCell numeric>
                  <PrimDue order={order} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TablePrimWorkOrders() {
  const sort = useTableSort({
    rows: WORK_ORDERS,
    accessors: ORDER_ACCESSORS,
    defaultSort: { columnId: 'due', direction: 'asc' },
  });
  const selection = useTableSelection(ALL_ORDER_IDS);
  const [message, setMessage] = useState('');
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex h-7 items-center gap-3">
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {selection.count > 0 ? `${selection.count} selected` : `${WORK_ORDERS.length} work orders`}
        </p>
        {selection.count > 0 ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMessage(`Assigned ${selection.count} work orders`);
                selection.clear();
              }}
            >
              <IconUserPlus /> Assign
            </Button>
            <Button variant="ghost" size="sm" onClick={selection.clear}>
              Clear selection
            </Button>
          </>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
          {message}
        </span>
      </div>
      <Table label="Work orders">
        <TableHeader>
          <TableRow>
            <TableSelectionCell label="Select all work orders" {...selection.headerProps} />
            <TableHead {...sort.headProps('id')}>Work order</TableHead>
            <TableHead {...sort.headProps('title')}>Title</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead {...sort.headProps('priority')}>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead numeric {...sort.headProps('due')}>
              Due
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sort.rows.map((order) => (
            <TableRow key={order.id} selected={selection.isSelected(order.id)}>
              <TableSelectionCell label={`Select ${order.id}`} {...selection.rowProps(order.id)} />
              <TableCell mono>{order.id}</TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell mono muted>
                <PrimAssetTag assetId={order.assetId} />
              </TableCell>
              <TableCell>{order.priority}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} outline />
              </TableCell>
              <TableCell>
                <PrimPerson personId={order.assigneeId} />
              </TableCell>
              <TableCell numeric>
                <PrimDue order={order} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TablePrimAlarmList() {
  return (
    <Table label="Alarm list" density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Severity</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>State</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead numeric>Limit</TableHead>
          <TableHead numeric>Raised</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ALARMS.map((alarm) => (
          <TableRow key={alarm.id} className={alarm.state === 'cleared' ? 'text-muted-foreground' : undefined}>
            <TableCell>
              <PrimSeverity alarm={alarm} />
            </TableCell>
            <TableCell>{alarm.message}</TableCell>
            <TableCell mono muted>
              <PrimAssetTag assetId={alarm.assetId} />
            </TableCell>
            <TableCell>
              <Badge variant={alarm.state === 'active' ? 'error' : 'archived'} outline>
                {alarm.state === 'active'
                  ? 'Active'
                  : alarm.state === 'acknowledged'
                    ? 'Acknowledged'
                    : alarm.state === 'shelved'
                      ? 'Shelved'
                      : 'Cleared'}
              </Badge>
            </TableCell>
            <TableCell numeric>{alarm.value}</TableCell>
            <TableCell numeric muted>
              {alarm.limit}
            </TableCell>
            <TableCell numeric muted>
              {formatAgo(alarm.raisedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TablePrimTagList() {
  const sort = useTableSort({
    rows: SENSORS,
    accessors: SENSOR_ACCESSORS,
    defaultSort: { columnId: 'value', direction: 'desc' },
  });
  return (
    <Table label="Instrument tags" density="compact">
      <TableHeader>
        <TableRow>
          <TableHead {...sort.headProps('tag')}>Tag</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead numeric {...sort.headProps('value')}>
            Of high limit
          </TableHead>
          <TableHead>Quality</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sort.rows.map((sensor) => {
          const quality = qualityStatus(sensor.quality);
          return (
            <TableRow key={sensor.id}>
              <TableCell mono>{sensor.tag}</TableCell>
              <TableCell>{sensor.name}</TableCell>
              <TableCell mono muted>
                <PrimAssetTag assetId={sensor.assetId} />
              </TableCell>
              <TableCell numeric>{formatValue(sensor.value, sensor.decimals)}</TableCell>
              <TableCell muted>{sensor.unit}</TableCell>
              <TableCell numeric>{Math.round((sensor.value / sensor.highLimit) * 100)} %</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={quality.tone} shape={quality.shape} />
                  {quality.label}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default definePage({
  id: 'table',
  title: 'Table',
  summary:
    'The one static table: semantic markup with density, sorting, selection, pinned and expandable rows, totals and every empty, loading and error state. Aura ships no table primitive; use the data grid when rows are virtualised or fetched by page.',
  guidance: {
    use: [
      'Compact rows for monitoring many records, default for most lists, comfortable for reading.',
      'Right-align numbers and give the column a unit in its header, so values line up.',
      'A real sortable header: it announces the order through aria-sort and shows the arrow.',
      'Keep the header in place for loading, empty and error, and say what happened in the body.',
    ],
    avoid: [
      'Zebra stripes or a border around every cell; rows are separated by one hairline and a hover.',
      'Truncating the column that identifies the row; truncate secondary text and keep the full text in a title.',
      'A clickable row without a link or button inside it; keyboard and screen reader users need one.',
      'Status by colour alone; pair every status cell with a word or a shape.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Structure and density',
      description: 'The compound parts, and the three row heights that match Aura controls.',
      specimens: [
        {
          id: 'TablePrimBasic',
          title: 'Basic',
          note: 'The default for a short list: 36 px rows, hairline dividers, hover only.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: [
            'primitives/table/Table.tsx',
            'primitives/table/TableRow.tsx',
            'primitives/table/TableCell.tsx',
            'display/StatusBadge.tsx',
          ],
          Component: TablePrimBasic,
        },
        {
          id: 'TablePrimCompact',
          title: 'Compact',
          note: 'Monitoring tables where many rows must be on screen at once.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'display/StatusBadge.tsx'],
          Component: TablePrimCompact,
        },
        {
          id: 'TablePrimComfortable',
          title: 'Comfortable',
          note: 'Reading and review screens with few rows and room to breathe.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimComfortable,
        },
        {
          id: 'TablePrimAlignments',
          title: 'Alignment',
          note: 'Text starts left, numbers and their headers end right, short codes centre.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'industrial/status.ts'],
          Component: TablePrimAlignments,
        },
        {
          id: 'TablePrimCaption',
          title: 'Caption and source',
          note: 'A visible title above and a source note below, which also name the table.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: TablePrimCaption,
        },
        {
          id: 'TablePrimSurfaceCard',
          title: 'On a card surface',
          note: 'Hover and sticky cells match a card background instead of the page.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimSurfaceCard,
        },
      ],
    },
    {
      id: 'interaction',
      title: 'Sorting, selection and rows',
      description: 'Everything a person can do to a column or a row, all by keyboard as well.',
      specimens: [
        {
          id: 'TablePrimSortable',
          title: 'Sortable columns',
          note: 'Click a header to sort ascending, again for descending, a third time to clear.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/useTableSort.ts'],
          Component: TablePrimSortable,
        },
        {
          id: 'TablePrimSelectable',
          title: 'Selectable with select all',
          note: 'The header checkbox is indeterminate while only some rows are selected.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableSelectionCell.tsx', 'primitives/table/useTableSelection.ts'],
          Component: TablePrimSelectable,
        },
        {
          id: 'TablePrimRowActions',
          title: 'Row actions',
          note: 'One quiet menu per row instead of a strip of buttons; destructive last.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'data/RowActionsMenu.tsx'],
          Component: TablePrimRowActions,
        },
        {
          id: 'TablePrimRowLink',
          title: 'Row as link',
          note: 'The whole row navigates; the identifier is the real link that keyboards reach.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableRowAction.tsx'],
          Component: TablePrimRowLink,
        },
        {
          id: 'TablePrimRowButton',
          title: 'Row as button, current row',
          note: 'Picking a row opens its details elsewhere; the open row stays highlighted.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableRowAction.tsx', 'display/PersonAvatar.tsx'],
          Component: TablePrimRowButton,
        },
        {
          id: 'TablePrimExpandable',
          title: 'Expandable rows',
          note: 'Secondary facts under the row, so the table keeps its columns.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'primitives/table/Table.tsx',
            'primitives/table/TableExpandCell.tsx',
            'primitives/table/TableDetailRow.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: TablePrimExpandable,
        },
      ],
    },
    {
      id: 'content',
      title: 'Cells and text',
      description: 'Status, number, date and person cells, totals, and what to do with long text.',
      specimens: [
        {
          id: 'TablePrimCellTypes',
          title: 'Status, person, number, date',
          note: 'The four cell types most tables repeat, each aligned for its content.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'display/StatusBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: TablePrimCellTypes,
        },
        {
          id: 'TablePrimFooterTotals',
          title: 'Footer totals',
          note: 'A summary row set off by a stronger rule, in the same columns as the data.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableFooter.tsx'],
          Component: TablePrimFooterTotals,
        },
        {
          id: 'TablePrimWrap',
          title: 'Wrapping long text',
          note: 'Descriptions and messages that people must read in full take the lines they need.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimWrap,
        },
        {
          id: 'TablePrimTruncate',
          title: 'Truncating long text',
          note: 'Secondary text on one line with an ellipsis; the full text stays in the title.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimTruncate,
        },
        {
          id: 'TablePrimDisabledRows',
          title: 'Locked rows',
          note: 'A record that cannot be acted on is greyed out, and its row says why.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimDisabledRows,
        },
      ],
    },
    {
      id: 'layout',
      title: 'Scrolling and grouping',
      description: 'Tables taller or wider than their frame, and rows with section headers.',
      specimens: [
        {
          id: 'TablePrimStickyHeader',
          title: 'Sticky header',
          note: 'A long table in a fixed height keeps its column names in view.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimStickyHeader,
        },
        {
          id: 'TablePrimPinnedColumn',
          title: 'Pinned first column',
          note: 'A wide table scrolls sideways while the tag stays in view.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: TablePrimPinnedColumn,
        },
        {
          id: 'TablePrimGrouped',
          title: 'Grouped rows',
          note: 'Section rows with counts split a list by state without splitting the table.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableSectionRow.tsx', 'industrial/StatusDot.tsx', 'industrial/status.ts'],
          Component: TablePrimGrouped,
        },
      ],
    },
    {
      id: 'states',
      title: 'Empty, loading and error',
      description: 'The header stays; the body says what is going on.',
      specimens: [
        {
          id: 'TablePrimEmpty',
          title: 'Empty',
          note: 'Good news or nothing yet: say which, and where results will appear.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableMessageRow.tsx'],
          Component: TablePrimEmpty,
        },
        {
          id: 'TablePrimLoading',
          title: 'Loading',
          note: 'Skeleton rows under the real header, so nothing moves when data arrives.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableSkeletonRows.tsx'],
          Component: TablePrimLoading,
        },
        {
          id: 'TablePrimError',
          title: 'Error with retry',
          note: 'Say what failed, that nothing was lost, and offer the one next step.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableMessageRow.tsx'],
          Component: TablePrimError,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Tables as they appear on plant screens.',
      specimens: [
        {
          id: 'TablePrimInCard',
          title: 'In a card with header',
          note: 'A titled table with an export action, on a card surface.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/useTableSort.ts', 'display/StatusBadge.tsx'],
          Component: TablePrimInCard,
        },
        {
          id: 'TablePrimTagList',
          title: 'Instrument tags',
          note: 'Tags in monospace, readings as numbers with units, quality with a shape and a word.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/useTableSort.ts', 'industrial/StatusDot.tsx', 'industrial/status.ts'],
          Component: TablePrimTagList,
        },
        {
          id: 'TablePrimAlarmList',
          title: 'Alarm list',
          note: 'Severity by shape and word; cleared alarms recede.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'industrial/StatusDot.tsx', 'industrial/status.ts'],
          Component: TablePrimAlarmList,
        },
        {
          id: 'TablePrimWorkOrders',
          title: 'Work order table',
          note: 'Sorting, selection with a bulk action, overdue dates and assignees together.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'primitives/table/Table.tsx',
            'primitives/table/TableSelectionCell.tsx',
            'primitives/table/useTableSelection.ts',
            'primitives/table/useTableSort.ts',
            'display/StatusBadge.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: TablePrimWorkOrders,
        },
      ],
    },
  ],
});
