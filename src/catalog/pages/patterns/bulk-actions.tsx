import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { ItemGroup } from '@cognite/aura/components/item';
import { RadioGroup, RadioGroupItem, RadioGroupItemControl, RadioGroupItemLabel } from '@cognite/aura/components/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import {
  IconArrowBackUp,
  IconBellOff,
  IconCheck,
  IconDownload,
  IconInfoCircle,
  IconPlayerPlay,
  IconRefresh,
  IconTag,
  IconTrash,
  IconUserPlus,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { SelectionActionBar } from '../../../library/actions/SelectionActionBar';
import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { SelectionCheckbox } from '../../../library/data/SelectionCheckbox';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { FormField } from '../../../library/forms/FormField';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TablePagination } from '../../../library/navigation/TablePagination';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { SelectionBanner } from '../../../library/patterns/collections/SelectionBanner';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { Alarm, WorkOrder } from '../../data/plant';
import { formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './bulk-actions.tsx?raw';

const BULK_ACTION_ORDERS = WORK_ORDERS.slice(0, 6);
const BULK_ACTION_ORDER_IDS = BULK_ACTION_ORDERS.map((order) => order.id);
const BULK_ACTION_NOUN = { one: 'work order', other: 'work orders' };

const BULK_ACTION_DATA_SETS = [
  { id: 'telemetry', name: 'Compressor telemetry', detail: '1,284 time series' },
  { id: 'sap', name: 'SAP work orders', detail: '48,210 events' },
  { id: 'docs', name: 'Engineering documents', detail: '6,032 files' },
  { id: 'hierarchy', name: 'Asset hierarchy', detail: '12,406 assets' },
  { id: 'lab', name: 'Lab samples 2025', detail: '912 rows' },
] as const;

const BULK_ACTION_STATUS_ITEMS = [
  { value: 'keep', label: 'Keep existing' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
];

const BULK_ACTION_PRIORITY_ITEMS = [
  { value: 'keep', label: 'Keep existing (mixed)' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

const BULK_ACTION_ASSIGNEE_ITEMS = [
  { value: 'keep', label: 'Keep existing (mixed)' },
  { value: 'none', label: 'Unassigned' },
  ...PEOPLE.map((person) => ({ value: person.id, label: person.name })),
];

const BULK_ACTION_ORDER_COLUMNS: readonly DataTableColumn<WorkOrder>[] = [
  {
    id: 'id',
    header: 'Work order',
    width: 'w-28',
    cell: (order) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{order.id}</span>,
  },
  { id: 'title', header: 'Title', cell: (order) => <span className="text-base-foreground">{order.title}</span> },
  { id: 'status', header: 'Status', cell: (order) => <StatusBadge status={order.status} /> },
  {
    id: 'assignee',
    header: 'Assignee',
    cell: (order) => findPerson(order.assigneeId)?.name ?? <span className="text-muted-foreground">Unassigned</span>,
  },
  { id: 'due', header: 'Due', align: 'end', cell: (order) => <span className="whitespace-nowrap">{formatDate(order.dueAt)}</span> },
];

const BULK_ACTION_ALARM_STATE: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

const bulkActionOrderId = (order: WorkOrder) => order.id;

function bulkActionIsString(value: unknown): value is string {
  return typeof value === 'string';
}

/** The frame of a bulk-action popover or dialog, shown open so its content can be read. */
function BulkActionPanel({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <section aria-label={title} className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-base-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      {children}
      <footer className="flex items-center justify-end gap-2">{footer}</footer>
    </section>
  );
}

function BulkActionSelectAll() {
  const selection = useSelection(BULK_ACTION_ORDER_IDS.slice(0, 5));

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-2 border-b border-default px-2 pb-2">
        <SelectionCheckbox
          label="Select all work orders"
          checked={selection.allSelected}
          indeterminate={selection.partiallySelected}
          onChange={(checked) => selection.toggleAll(checked)}
        />
        <span className="text-sm text-medium-foreground" aria-live="polite">
          {selection.count === 0 ? 'Select all' : `${selection.count} of 5 selected`}
        </span>
      </div>
      <ItemGroup aria-label="Work orders">
        {BULK_ACTION_ORDERS.slice(0, 5).map((order) => (
          <EntityRow
            key={order.id}
            title={order.title}
            description={order.id}
            meta={<StatusBadge status={order.status} />}
            selected={selection.isSelected(order.id)}
            selection={{
              checked: selection.isSelected(order.id),
              onChange: (checked) => selection.toggle(order.id, checked),
              label: `Select ${order.id}`,
            }}
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function BulkActionPartial() {
  const ids = BULK_ACTION_DATA_SETS.map((dataSet) => dataSet.id);
  const selection = useSelection<string>(ids, ['telemetry', 'docs']);

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between gap-2 border-b border-default px-2 pb-2">
        <span className="flex items-center gap-2">
          <SelectionCheckbox
            label="Select all data sets"
            checked={selection.allSelected}
            indeterminate={selection.partiallySelected}
            onChange={(checked) => selection.toggleAll(checked)}
          />
          <span className="text-sm text-medium-foreground" aria-live="polite">
            {selection.count} of {ids.length} selected
          </span>
        </span>
        {selection.partiallySelected ? (
          <Button variant="ghost" size="sm" onClick={() => selection.toggleAll(true)}>
            Select the other {ids.length - selection.count}
          </Button>
        ) : null}
      </div>
      <ItemGroup aria-label="Data sets">
        {BULK_ACTION_DATA_SETS.map((dataSet) => (
          <EntityRow
            key={dataSet.id}
            density="dense"
            title={dataSet.name}
            meta={<span className="tabular-nums">{dataSet.detail}</span>}
            selected={selection.isSelected(dataSet.id)}
            selection={{
              checked: selection.isSelected(dataSet.id),
              onChange: (checked) => selection.toggle(dataSet.id, checked),
              label: `Select ${dataSet.name}`,
            }}
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function BulkActionAcrossPages() {
  const rows = BULK_ACTION_ORDERS.slice(0, 5);
  const selection = useSelection(
    rows.map(bulkActionOrderId),
    rows.map(bulkActionOrderId)
  );
  const [allPages, setAllPages] = useState(false);
  const total = 312;

  return (
    <div className="flex w-full flex-col gap-3">
      {selection.allSelected ? (
        <SelectionBanner
          pageCount={rows.length}
          totalCount={total}
          allPagesSelected={allPages}
          noun={BULK_ACTION_NOUN}
          onSelectAllPages={() => setAllPages(true)}
          onClear={() => {
            setAllPages(false);
            selection.clear();
          }}
        />
      ) : null}
      <DataTable
        label="Work orders, page 1"
        columns={BULK_ACTION_ORDER_COLUMNS}
        rows={rows}
        getRowId={bulkActionOrderId}
        selection={{
          ...selection,
          toggle: (id, checked) => {
            setAllPages(false);
            selection.toggle(id, checked);
          },
          toggleAll: (checked) => {
            setAllPages(false);
            selection.toggleAll(checked);
          },
        }}
      />
      <TablePagination page={1} pageSize={5} total={total} onPageChange={() => undefined} itemLabel="work orders" size="small" />
    </div>
  );
}

function BulkActionCards() {
  const pumps = ASSETS.filter((asset) => asset.type === 'pump' || asset.type === 'separator').slice(0, 4);
  const selection = useSelection(
    pumps.map((asset) => asset.id),
    [pumps[0].id]
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <SelectionCheckbox
          label="Select all assets"
          checked={selection.allSelected}
          indeterminate={selection.partiallySelected}
          onChange={(checked) => selection.toggleAll(checked)}
        />
        <span className="text-sm text-medium-foreground" aria-live="polite">
          {selection.count} of {pumps.length} assets selected
        </span>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        {pumps.map((asset) => (
          <EntityCard
            key={asset.id}
            title={asset.name}
            description={asset.tag}
            selection={{
              checked: selection.isSelected(asset.id),
              onChange: (checked) => selection.toggle(asset.id, checked),
              label: `Select ${asset.name}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BulkActionNonSelectable() {
  const rows = WORK_ORDERS.slice(2, 7);
  const selectable = rows.filter((order) => order.status !== 'done').map((order) => order.id);
  const selection = useSelection(selectable, [selectable[0]]);

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-2 border-b border-default px-2 pb-2">
        <SelectionCheckbox
          label="Select all open work orders"
          checked={selection.allSelected}
          indeterminate={selection.partiallySelected}
          onChange={(checked) => selection.toggleAll(checked)}
        />
        <span className="text-sm text-medium-foreground" aria-live="polite">
          {selection.count} of {selectable.length} selected · {rows.length - selectable.length} cannot be changed
        </span>
      </div>
      <ItemGroup aria-label="Work orders">
        {rows.map((order) => {
          const locked = order.status === 'done';
          return (
            <EntityRow
              key={order.id}
              title={order.title}
              description={locked ? `${order.id} · Completed work orders are locked` : order.id}
              meta={<StatusBadge status={order.status} />}
              disabled={locked}
              selected={selection.isSelected(order.id)}
              selection={{
                checked: selection.isSelected(order.id),
                onChange: (checked) => selection.toggle(order.id, checked),
                label: `Select ${order.id}`,
              }}
            />
          );
        })}
      </ItemGroup>
    </div>
  );
}

function BulkActionFloatingBar() {
  const selection = useSelection(BULK_ACTION_ORDER_IDS, BULK_ACTION_ORDER_IDS.slice(0, 3));

  return (
    <div className="relative w-full pb-16">
      <DataTable
        label="Work orders"
        columns={BULK_ACTION_ORDER_COLUMNS}
        rows={BULK_ACTION_ORDERS}
        getRowId={bulkActionOrderId}
        selection={selection}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={selection.count}
          noun={BULK_ACTION_NOUN}
          width="fit"
          actions={[
            { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
            { id: 'status', label: 'Change status', icon: <IconRefresh />, onSelect: () => undefined },
            { id: 'tag', label: 'Add tags', icon: <IconTag />, onSelect: () => undefined },
            { id: 'export', label: 'Export as CSV', icon: <IconDownload />, onSelect: () => undefined },
            { id: 'delete', label: 'Delete', icon: <IconTrash />, destructive: true, onSelect: () => undefined },
          ]}
          onClear={selection.clear}
        />
      </div>
      {selection.count === 0 ? (
        <p className="absolute inset-x-0 bottom-3 text-center text-sm text-muted-foreground">Select rows to see the actions.</p>
      ) : null}
    </div>
  );
}

function BulkActionInlineToolbar() {
  const rows = BULK_ACTION_ORDERS.slice(0, 5);
  const selection = useSelection(rows.map(bulkActionOrderId), [rows[1].id, rows[3].id]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-h-9 items-center gap-2">
        {selection.count > 0 ? (
          <>
            <span className="text-sm font-medium tabular-nums text-base-foreground" aria-live="polite">
              {selection.count} selected
            </span>
            <Button variant="ghost" size="sm" onClick={selection.clear}>
              Clear
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <IconUserPlus /> Assign
              </Button>
              <Button variant="outline" size="sm">
                <IconRefresh /> Change status
              </Button>
              <Button variant="destructive" size="sm">
                <IconTrash /> Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-base-foreground">Work orders</h3>
            <span className="text-sm tabular-nums text-muted-foreground">{rows.length}</span>
            <Button variant="outline" size="sm" className="ml-auto">
              <IconDownload /> Export
            </Button>
          </>
        )}
      </div>
      <DataTable label="Work orders" columns={BULK_ACTION_ORDER_COLUMNS} rows={rows} getRowId={bulkActionOrderId} selection={selection} />
    </div>
  );
}

function BulkActionOverflow() {
  const [count, setCount] = useState(12);

  return (
    <div className="flex h-14 w-full items-center justify-center">
      <SelectionActionBar
        count={count}
        noun={{ one: 'alarm', other: 'alarms' }}
        maxVisible={2}
        actions={[
          { id: 'ack', label: 'Acknowledge', icon: <IconCheck />, onSelect: () => undefined },
          { id: 'shelve', label: 'Shelve', icon: <IconBellOff />, onSelect: () => undefined },
          { id: 'assign', label: 'Assign to me', icon: <IconUserPlus />, onSelect: () => undefined },
          { id: 'export', label: 'Export as CSV', icon: <IconDownload />, onSelect: () => undefined },
          { id: 'delete', label: 'Delete from log', icon: <IconTrash />, destructive: true, onSelect: () => undefined },
        ]}
        onClear={() => setCount(0)}
      />
      {count === 0 ? (
        <Button variant="outline" onClick={() => setCount(12)}>
          Select 12 alarms again
        </Button>
      ) : null}
    </div>
  );
}

function BulkActionDisabledReason() {
  const rows = [WORK_ORDERS[1], WORK_ORDERS[3], WORK_ORDERS[5]];
  const selection = useSelection(
    rows.map(bulkActionOrderId),
    rows.map(bulkActionOrderId)
  );
  const done = rows.filter((order) => selection.isSelected(order.id) && order.status === 'done');
  const blocked = done.length > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <ItemGroup aria-label="Work orders">
        {rows.map((order) => (
          <EntityRow
            key={order.id}
            title={order.title}
            description={order.id}
            meta={<StatusBadge status={order.status} />}
            selected={selection.isSelected(order.id)}
            selection={{
              checked: selection.isSelected(order.id),
              onChange: (checked) => selection.toggle(order.id, checked),
              label: `Select ${order.id}`,
            }}
          />
        ))}
      </ItemGroup>
      <div className="flex justify-center">
        <SelectionActionBar
          count={selection.count}
          noun={BULK_ACTION_NOUN}
          width="fit"
          actions={[
            { id: 'start', label: 'Start work', icon: <IconPlayerPlay />, disabled: blocked, onSelect: () => undefined },
            { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
          ]}
          onClear={selection.clear}
        />
      </div>
      {blocked ? (
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground" role="status">
          <IconInfoCircle aria-hidden="true" className="size-3.5" />
          Start work is unavailable because {done.length} selected work order is already done.
          <Button variant="ghost" size="sm" onClick={() => done.forEach((order) => selection.toggle(order.id, false))}>
            Deselect it
          </Button>
        </p>
      ) : null}
    </div>
  );
}

function BulkActionAssign() {
  const [assignee, setAssignee] = useState('tb');
  const person = findPerson(assignee);

  return (
    <BulkActionPanel
      title="Assign 4 work orders"
      description="2 are unassigned and 2 are assigned to Jonas Nyberg. Everyone affected is notified."
      footer={
        <>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Assign to {person?.name.split(' ')[0]}</Button>
        </>
      }
    >
      <RadioGroup
        aria-label="Assignee"
        value={assignee}
        onValueChange={(value) => {
          if (bulkActionIsString(value)) setAssignee(value);
        }}
        className="w-full"
      >
        {PEOPLE.slice(2, 6).map((candidate) => (
          <RadioGroupItem key={candidate.id} className="w-full">
            <RadioGroupItemControl value={candidate.id} />
            <RadioGroupItemLabel className="flex items-center gap-2">
              <PersonAvatar name={candidate.name} initials={candidate.initials} sizes="xxsm" />
              {candidate.name}
              <span className="text-xs font-normal text-muted-foreground">{candidate.role}</span>
            </RadioGroupItemLabel>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </BulkActionPanel>
  );
}

function BulkActionChangeStatus() {
  const [status, setStatus] = useState('planned');
  const label = BULK_ACTION_STATUS_ITEMS.find((item) => item.value === status)?.label ?? '';

  return (
    <BulkActionPanel
      title="Change status of 6 work orders"
      description="Currently 3 open, 2 planned and 1 waiting."
      footer={
        <>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Set 6 to {label.toLowerCase()}</Button>
        </>
      }
    >
      <RadioGroup
        aria-label="New status"
        value={status}
        onValueChange={(value) => {
          if (bulkActionIsString(value)) setStatus(value);
        }}
        className="w-full"
      >
        {BULK_ACTION_STATUS_ITEMS.slice(1).map((item) => (
          <RadioGroupItem key={item.value} className="w-full">
            <RadioGroupItemControl value={item.value} />
            <RadioGroupItemLabel>{item.label}</RadioGroupItemLabel>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </BulkActionPanel>
  );
}

function BulkActionTag() {
  const initial: Record<string, number> = { 'Shutdown 2026': 5, 'Rotating equipment': 2, 'Safety critical': 0, 'Awaiting parts': 0 };
  const total = 5;
  const [tags, setTags] = useState<Record<string, number>>(initial);
  const changed = Object.entries(tags).filter(([tag, count]) => count !== initial[tag]).length;

  return (
    <BulkActionPanel
      title="Tag 5 time series"
      description="A dash means only some of the selection has the tag. Tick to add it to all, untick to remove it."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setTags(initial)}>
            Reset
          </Button>
          <Button size="sm" disabled={changed === 0} title={changed === 0 ? 'Change a tag first' : undefined}>
            Apply {changed > 0 ? `${changed} ${changed === 1 ? 'change' : 'changes'}` : 'changes'}
          </Button>
        </>
      }
    >
      <CheckboxGroup aria-label="Tags">
        {Object.entries(tags).map(([tag, count]) => (
          <CheckboxItem key={tag}>
            <CheckboxItemControl
              checked={count === total}
              indeterminate={count > 0 && count < total}
              onCheckedChange={(checked) => setTags({ ...tags, [tag]: checked ? total : 0 })}
            />
            <CheckboxItemLabel>
              {tag}{' '}
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {count} of {total}
              </span>
            </CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </BulkActionPanel>
  );
}

function BulkActionEditForm() {
  const [priority, setPriority] = useState('keep');
  const [assignee, setAssignee] = useState('keep');
  const changes = [priority, assignee].filter((value) => value !== 'keep').length;

  return (
    <BulkActionPanel
      title="Edit 4 work orders"
      description="Only the fields you change are applied. Everything else keeps its current value."
      footer={
        <>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm" disabled={changes === 0} title={changes === 0 ? 'Change at least one field' : undefined}>
            {changes === 0 ? 'Apply changes' : `Apply ${changes} ${changes === 1 ? 'change' : 'changes'} to 4`}
          </Button>
        </>
      }
    >
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4">
        <FormField label="Priority">
          {(control) => (
            <Select items={BULK_ACTION_PRIORITY_ITEMS} value={priority} onValueChange={setPriority}>
              <SelectTrigger id={control.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BULK_ACTION_PRIORITY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField label="Assignee">
          {(control) => (
            <Select items={BULK_ACTION_ASSIGNEE_ITEMS} value={assignee} onValueChange={setAssignee}>
              <SelectTrigger id={control.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BULK_ACTION_ASSIGNEE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
    </BulkActionPanel>
  );
}

function BulkActionDeleteConfirm() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="destructive" disabled={deleted} onClick={() => setOpen(true)}>
        <IconTrash /> Delete 3 work orders
      </Button>
      <p className="text-xs text-muted-foreground" role="status">
        {deleted ? '3 work orders deleted.' : 'Opens a confirmation that repeats the count.'}
      </p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete 3 work orders?"
        description="WO-104466, WO-104458 and WO-104419 are removed for everyone. Their history stays in the audit log."
        confirmLabel="Delete 3 work orders"
        destructive
        onConfirm={() => {
          setDeleted(true);
          setOpen(false);
        }}
      />
    </div>
  );
}

function BulkActionDeleteTyped() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <IconTrash /> Delete all 312 time series
      </Button>
      <p className="text-xs text-muted-foreground">Large deletions ask the user to type the count.</p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete 312 time series?"
        description="This deletes every time series matching the current filter, with all their data points. It cannot be undone."
        confirmLabel="Delete 312 time series"
        confirmText="312"
        destructive
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

function BulkActionKeyboard() {
  const shortcuts = [
    { label: 'Select all', keys: ['mod', 'A'] },
    { label: 'Extend selection', keys: ['shift', '↓'] },
    { label: 'Toggle row', keys: ['Space'] },
    { label: 'Clear selection', keys: ['esc'] },
  ];

  return (
    <dl className="flex w-full max-w-64 flex-col gap-2 text-sm">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.label} className="flex items-center justify-between gap-4">
          <dt className="text-medium-foreground">{shortcut.label}</dt>
          <dd>
            <ShortcutHint keys={shortcut.keys} platform="mac" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BulkActionProgress() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-default p-4">
      <LabelledProgress
        label="Reassigning work orders"
        value={128}
        max={312}
        valueText="128 of 312"
        hint="About 40 seconds left. You can keep working; this continues in the background."
      />
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          Stop after current batch
        </Button>
      </div>
    </div>
  );
}

function BulkActionResult() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-base-foreground">Reassignment finished</h3>
        <p className="text-xs text-muted-foreground">312 work orders processed in 1 min 12 s.</p>
      </div>
      <dl className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">304</dd>
          <dt>
            <StatusIndicator tone="success" label="Succeeded" size="sm" />
          </dt>
        </div>
        <div className="flex flex-col gap-1">
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">5</dd>
          <dt>
            <StatusIndicator tone="critical" shape="diamond" label="Failed" size="sm" />
          </dt>
        </div>
        <div className="flex flex-col gap-1">
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">3</dd>
          <dt>
            <StatusIndicator tone="neutral" shape="ring" label="Skipped" size="sm" />
          </dt>
        </div>
      </dl>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          <IconDownload /> Download report
        </Button>
        <Button variant="secondary" size="sm">
          Review 5 failed
        </Button>
      </div>
    </div>
  );
}

function BulkActionPartialFailure() {
  const failed = [
    { id: 'WO-104471', reason: 'Locked by Magnus Solberg' },
    { id: 'WO-104440', reason: 'Already completed' },
    { id: 'WO-104419', reason: 'You do not have access to Gas compression' },
  ];
  const [retried, setRetried] = useState(false);
  const remaining = retried ? failed.slice(1) : failed;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-base-foreground">
            {remaining.length} of 12 work orders could not be assigned
          </h3>
          <p className="text-xs text-muted-foreground">The other {12 - remaining.length} were assigned to Tomás Barros.</p>
        </div>
        <Button variant="secondary" size="sm" disabled={retried} title={retried ? 'Already retried' : undefined} onClick={() => setRetried(true)}>
          <IconRefresh /> Retry failed
        </Button>
      </div>
      <ul className="flex flex-col" aria-label="Failed work orders">
        {remaining.map((item) => (
          <li key={item.id} className="flex items-center gap-3 border-t border-default py-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
            <span className="text-medium-foreground">{item.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulkActionUndo() {
  const rows = BULK_ACTION_ORDERS.slice(1, 5);
  const [doneIds, setDoneIds] = useState<readonly string[]>([]);
  const selection = useSelection(rows.map(bulkActionOrderId), [rows[0].id, rows[1].id, rows[2].id]);
  const justChanged = doneIds.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <ItemGroup aria-label="Work orders">
        {rows.map((order) => (
          <EntityRow
            key={order.id}
            density="dense"
            title={order.title}
            meta={<StatusBadge status={doneIds.includes(order.id) ? 'done' : order.status} />}
            selected={selection.isSelected(order.id)}
            selection={{
              checked: selection.isSelected(order.id),
              onChange: (checked) => selection.toggle(order.id, checked),
              label: `Select ${order.id}`,
            }}
          />
        ))}
      </ItemGroup>
      {justChanged > 0 ? (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg bg-muted-background px-3 py-1.5 text-sm text-medium-foreground">
          <span>
            {justChanged} {justChanged === 1 ? 'work order' : 'work orders'} marked as done.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setDoneIds([])}>
            <IconArrowBackUp /> Undo
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <span className="text-sm tabular-nums text-muted-foreground">{selection.count} selected</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={selection.count === 0}
            title={selection.count === 0 ? 'Select work orders first' : undefined}
            onClick={() => {
              setDoneIds(selection.selectedIds);
              selection.clear();
            }}
          >
            <IconCheck /> Mark as done
          </Button>
        </div>
      )}
    </div>
  );
}

function BulkActionWorkOrderFlow() {
  const [orders, setOrders] = useState<readonly WorkOrder[]>(BULK_ACTION_ORDERS);
  const [previous, setPrevious] = useState<{ orders: readonly WorkOrder[]; message: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const selection = useSelection(orders.map(bulkActionOrderId), [orders[3].id, orders[4].id]);
  const count = selection.count;
  const words = `${count} ${count === 1 ? BULK_ACTION_NOUN.one : BULK_ACTION_NOUN.other}`;

  const apply = (next: readonly WorkOrder[], message: string) => {
    setPrevious({ orders, message });
    setOrders(next);
    selection.clear();
  };

  return (
    <div className="relative flex w-full flex-col gap-3 pb-16">
      <DataTable label="Work orders" columns={BULK_ACTION_ORDER_COLUMNS} rows={orders} getRowId={bulkActionOrderId} selection={selection} />
      {previous && count === 0 ? (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg bg-muted-background px-3 py-1.5 text-sm text-medium-foreground">
          <span>{previous.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOrders(previous.orders);
              setPrevious(null);
            }}
          >
            <IconArrowBackUp /> Undo
          </Button>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={count}
          noun={BULK_ACTION_NOUN}
          width="fit"
          actions={[
            {
              id: 'assign',
              label: 'Assign to me',
              icon: <IconUserPlus />,
              onSelect: () =>
                apply(
                  orders.map((order) => (selection.isSelected(order.id) ? { ...order, assigneeId: 'ih' } : order)),
                  `${words} assigned to you.`
                ),
            },
            {
              id: 'plan',
              label: 'Mark as planned',
              icon: <IconCheck />,
              onSelect: () =>
                apply(
                  orders.map((order) => (selection.isSelected(order.id) ? { ...order, status: 'planned' } : order)),
                  `${words} marked as planned.`
                ),
            },
            { id: 'delete', label: 'Delete', icon: <IconTrash />, destructive: true, onSelect: () => setConfirming(true) },
          ]}
          maxVisible={3}
          onClear={selection.clear}
        />
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${words}?`}
        description="They are removed for everyone. You can undo this until you leave the page."
        confirmLabel={`Delete ${words}`}
        destructive
        onConfirm={() => {
          apply(
            orders.filter((order) => !selection.isSelected(order.id)),
            `${words} deleted.`
          );
          setConfirming(false);
        }}
      />
    </div>
  );
}

function BulkActionAlarmFlow() {
  const [states, setStates] = useState<Record<string, Alarm['state']>>({});
  const [result, setResult] = useState<string | null>(null);
  const rows = ALARMS.slice(0, 6);
  const stateOf = (alarm: Alarm) => states[alarm.id] ?? alarm.state;
  const selection = useSelection(
    rows.map((alarm) => alarm.id),
    [rows[0].id, rows[1].id, rows[2].id]
  );
  const columns: readonly DataTableColumn<Alarm>[] = [
    { id: 'severity', header: 'Severity', width: 'w-28', cell: (alarm) => <StatusIndicator {...severityStatus(alarm.severity)} size="sm" /> },
    { id: 'message', header: 'Alarm', cell: (alarm) => <span className="text-base-foreground">{alarm.message}</span> },
    { id: 'asset', header: 'Asset', cell: (alarm) => findAsset(alarm.assetId)?.tag },
    {
      id: 'state',
      header: 'State',
      cell: (alarm) => <Badge variant={stateOf(alarm) === 'active' ? 'warning' : 'secondary'}>{BULK_ACTION_ALARM_STATE[stateOf(alarm)]}</Badge>,
    },
    { id: 'raised', header: 'Raised', align: 'end', cell: (alarm) => <span className="whitespace-nowrap">{formatAgo(alarm.raisedAt)}</span> },
  ];

  const acknowledge = () => {
    const picked = rows.filter((alarm) => selection.isSelected(alarm.id));
    const active = picked.filter((alarm) => stateOf(alarm) === 'active');
    setStates({ ...states, ...Object.fromEntries(active.map((alarm) => [alarm.id, 'acknowledged' as const])) });
    const skipped = picked.length - active.length;
    setResult(`${active.length} acknowledged${skipped > 0 ? `, ${skipped} skipped because ${skipped === 1 ? 'it was' : 'they were'} not active` : ''}.`);
    selection.clear();
  };

  return (
    <div className="relative flex w-full flex-col gap-3 pb-16">
      <DataTable
        label="Alarms"
        density="dense"
        columns={columns}
        rows={rows}
        getRowId={(alarm) => alarm.id}
        rowLabel={(alarm) => alarm.message}
        selection={selection}
      />
      <p className="min-h-5 text-sm text-muted-foreground" role="status">
        {selection.count === 0 ? result : null}
      </p>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={selection.count}
          noun={{ one: 'alarm', other: 'alarms' }}
          width="fit"
          actions={[{ id: 'shelve', label: 'Shelve for 1 hour', icon: <IconBellOff />, onSelect: () => undefined }]}
          primaryAction={{ label: 'Acknowledge', onSelect: acknowledge }}
          onClear={selection.clear}
        />
      </div>
    </div>
  );
}

function BulkActionSelectionSummary() {
  const tags = SENSORS.slice(0, 7);
  const selection = useSelection(
    tags.map((sensor) => sensor.id),
    tags.slice(0, 5).map((sensor) => sensor.id)
  );
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium tabular-nums text-base-foreground">{selection.count} time series selected</span>
        <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide selection' : 'Review selection'}
        </Button>
      </div>
      {expanded ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Selected time series">
          {tags
            .filter((sensor) => selection.isSelected(sensor.id))
            .map((sensor) => (
              <Badge
                key={sensor.id}
                variant="closable"
                render={<button type="button" aria-label={`Remove ${sensor.tag} from selection`} />}
                onClick={() => selection.toggle(sensor.id, false)}
              >
                {sensor.tag} <IconX aria-hidden="true" />
              </Badge>
            ))}
          {selection.count === 0 ? <span className="text-sm text-muted-foreground">Nothing selected.</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export default definePage({
  id: 'bulk-actions',
  title: 'Bulk actions',
  summary:
    'Selecting many items and acting on them at once: select all, partial and cross-page selection, the action toolbar, bulk edits, and what the user sees while the action runs and after it finishes.',
  guidance: {
    use: [
      'Show bulk actions only while something is selected, always with the count.',
      'Repeat the count in the confirming button: "Delete 3 work orders".',
      'Report results as succeeded, failed and skipped, and let the user retry what failed.',
      'Offer undo for anything reversible instead of a confirmation.',
    ],
    avoid: [
      'A select-all that silently means "this page" to some users and "everything" to others.',
      'Disabled bulk actions with no reason given.',
      'Destructive bulk actions without confirmation or undo.',
      'Blocking the whole page while a long bulk action runs.',
    ],
  },
  source,
  sections: [
    {
      id: 'selecting',
      title: 'Selecting',
      description: 'How a selection is made, counted and extended.',
      specimens: [
        {
          id: 'BulkActionSelectAll',
          title: 'Select all with count',
          note: 'A header checkbox selects every row and the label next to it always says how many.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/useSelection.ts', 'patterns/collections/EntityRow.tsx', 'data/SelectionCheckbox.tsx'],
          Component: BulkActionSelectAll,
        },
        {
          id: 'BulkActionPartial',
          title: 'Partial selection',
          note: 'The header checkbox shows a dash while only some rows are selected, with a shortcut to the rest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/useSelection.ts', 'patterns/collections/EntityRow.tsx', 'data/SelectionCheckbox.tsx'],
          Component: BulkActionPartial,
        },
        {
          id: 'BulkActionAcrossPages',
          title: 'Select across pages',
          note: 'Once the page is fully selected, a banner offers to extend the selection to every matching row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/collections/SelectionBanner.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collections/useSelection.ts',
            'navigation/TablePagination.tsx',
          ],
          Component: BulkActionAcrossPages,
        },
        {
          id: 'BulkActionCards',
          title: 'Selecting cards',
          note: 'The same select-all and count above a card grid, with an outline on each selected card.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'patterns/collections/useSelection.ts', 'data/SelectionCheckbox.tsx'],
          Component: BulkActionCards,
        },
        {
          id: 'BulkActionNonSelectable',
          title: 'Rows that cannot be selected',
          note: 'Locked rows stay in place with a reason, and select-all counts only what can change.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts', 'data/SelectionCheckbox.tsx'],
          Component: BulkActionNonSelectable,
        },
      ],
    },
    {
      id: 'toolbars',
      title: 'Action toolbars',
      description: 'Where the actions for a selection live.',
      specimens: [
        {
          id: 'BulkActionFloatingBar',
          title: 'Floating action toolbar',
          note: 'The default: a bar at the bottom of the view that appears with the first selected row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx', 'patterns/collections/DataTable.tsx', 'patterns/collections/useSelection.ts'],
          Component: BulkActionFloatingBar,
        },
        {
          id: 'BulkActionInlineToolbar',
          title: 'Toolbar swap',
          note: 'In a card or panel with no room for a floating bar, the selection takes over the header row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/collections/useSelection.ts'],
          Component: BulkActionInlineToolbar,
        },
        {
          id: 'BulkActionOverflow',
          title: 'With overflow',
          note: 'Keep the two most used actions visible and move the rest, destructive last, into a menu.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: BulkActionOverflow,
        },
        {
          id: 'BulkActionSelectionSummary',
          title: 'Review the selection',
          note: 'Let people see and trim what is selected before a bulk action, when rows span pages or filters.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/useSelection.ts'],
          Component: BulkActionSelectionSummary,
        },
        {
          id: 'BulkActionDisabledReason',
          title: 'Disabled for a mixed selection',
          note: 'When an action cannot apply to everything selected, say which rows block it and offer to drop them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx', 'patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts'],
          Component: BulkActionDisabledReason,
        },
        {
          id: 'BulkActionKeyboard',
          title: 'Keyboard selection',
          note: 'List the selection shortcuts near the table for people who work through long lists.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ShortcutHint.tsx'],
          Component: BulkActionKeyboard,
        },
      ],
    },
    {
      id: 'actions',
      title: 'Bulk changes',
      description: 'The panel that opens from a toolbar action, shown open.',
      specimens: [
        {
          id: 'BulkActionAssign',
          title: 'Bulk assign',
          note: 'Pick one person for the whole selection; the summary says who is assigned today.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: BulkActionAssign,
        },
        {
          id: 'BulkActionChangeStatus',
          title: 'Bulk change status',
          note: 'One new status for all, with the current mix stated and the count in the button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BulkActionChangeStatus,
        },
        {
          id: 'BulkActionTag',
          title: 'Bulk tag',
          note: 'Three-state checkboxes show tags on all, some or none of the selection.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BulkActionTag,
        },
        {
          id: 'BulkActionEditForm',
          title: 'Bulk edit form',
          note: 'Every field starts on "Keep existing", so only what the user changes is applied.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: BulkActionEditForm,
        },
        {
          id: 'BulkActionDeleteConfirm',
          title: 'Delete with confirmation count',
          note: 'The dialog title and the confirming button both repeat how many items go.',
          origin: 'custom',
          size: 'md',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: BulkActionDeleteConfirm,
        },
        {
          id: 'BulkActionDeleteTyped',
          title: 'Typed confirmation',
          note: 'For deletions that reach beyond the page, the user types the count to unlock the button.',
          origin: 'custom',
          size: 'md',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: BulkActionDeleteTyped,
        },
      ],
    },
    {
      id: 'results',
      title: 'Progress and results',
      description: 'What happens after the user confirms.',
      specimens: [
        {
          id: 'BulkActionProgress',
          title: 'Bulk progress',
          note: 'A long action reports items done out of the total and can be stopped part-way.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: BulkActionProgress,
        },
        {
          id: 'BulkActionResult',
          title: 'Result summary',
          note: 'Succeeded, failed and skipped as three counts, with a report and a way into the failures.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: BulkActionResult,
        },
        {
          id: 'BulkActionPartialFailure',
          title: 'Partial failure',
          note: 'Name each item that failed and why, and retry only those.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BulkActionPartialFailure,
        },
        {
          id: 'BulkActionUndo',
          title: 'Undo after a bulk action',
          note: 'A reversible change applies at once and leaves an undo in place of the action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts'],
          Component: BulkActionUndo,
        },
      ],
    },
    {
      id: 'flows',
      title: 'Complete flows',
      description: 'Selection, action, confirmation and undo working together.',
      specimens: [
        {
          id: 'BulkActionWorkOrderFlow',
          title: 'Work orders',
          note: 'Assign and re-plan apply at once with undo; delete asks first and repeats the count.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'actions/SelectionActionBar.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collections/useSelection.ts',
            'overlays/ConfirmDialog.tsx',
          ],
          Component: BulkActionWorkOrderFlow,
        },
        {
          id: 'BulkActionAlarmFlow',
          title: 'Alarms',
          note: 'Acknowledge is the primary action; the result line says how many changed and how many were skipped.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx', 'patterns/collections/DataTable.tsx', 'patterns/collections/useSelection.ts'],
          Component: BulkActionAlarmFlow,
        },
      ],
    },
  ],
});
