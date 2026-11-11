import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { DatePicker } from '@cognite/aura/components/date-time-pickers';
import { Input } from '@cognite/aura/components/input';
import { Switch } from '@cognite/aura/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconLock, IconPlus } from '@cognite/aura/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { MetadataList } from '../../../library/display/MetadataList';
import { FormField } from '../../../library/forms/FormField';
import { InlineEditText } from '../../../library/forms/InlineEditText';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { EditableCell } from '../../../library/patterns/data-entry/EditableCell';
import { EditableDescription } from '../../../library/patterns/data-entry/EditableDescription';
import { EditableTagList } from '../../../library/patterns/data-entry/EditableTagList';
import { EditableTitle } from '../../../library/patterns/data-entry/EditableTitle';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { SaveBar } from '../../../library/patterns/data-entry/SaveBar';
import { SaveStatus } from '../../../library/patterns/data-entry/SaveStatus';
import type { SaveState } from '../../../library/patterns/data-entry/SaveStatus';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { TableSelectionCell } from '../../../library/primitives/table/TableSelectionCell';
import { PEOPLE, SENSORS, WORK_ORDERS, findAsset } from '../../data/plant';
import { REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './inline-editing.tsx?raw';

const ROW = 'border-t border-default';

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
];

const PEOPLE_OPTIONS = PEOPLE.map((person) => ({ value: person.id, label: person.name }));

const COMPRESSOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 4);

const DASHBOARD_NAMES = ['Gas compression', 'Alarm overview', 'Export metering'];

/** The fixed "today" of the catalog, 12 March 2026, as a local date so every time zone agrees. */
function referenceToday(): Dayjs {
  const date = new Date(REFERENCE_NOW);
  return dayjs(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const TODAY = referenceToday();

function isNumber(text: string): boolean {
  return text !== '' && !Number.isNaN(Number(text));
}

function numberInRange(min: number, max: number, unit: string) {
  return (text: string) => {
    if (!isNumber(text)) return 'Enter a number.';
    const value = Number(text);
    return value < min || value > max ? `Enter a value from ${min} to ${max} ${unit}.` : null;
  };
}

function InlineEditClickToEdit() {
  const [name, setName] = useState('Compressor overview');
  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <span className="text-xs text-muted-foreground">Dashboard name</span>
      <InlineEditText value={name} label="dashboard name" onSave={setName} />
    </div>
  );
}

function InlineEditValidationError() {
  const [value, setValue] = useState('52.0');
  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <span className="px-2 text-xs text-muted-foreground">High limit, 23-PT-92531</span>
      <EditableCell
        value={value}
        defaultDraft="72"
        unit="barg"
        inputMode="decimal"
        label="High limit for 23-PT-92531"
        validate={numberInRange(0, 60, 'barg')}
        onSave={setValue}
      />
    </div>
  );
}

function InlineEditKeyboardHints() {
  const [saved, setSaved] = useState('1st stage compressor');
  const [draft, setDraft] = useState('1st stage compressor A');
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Input
        aria-label="Asset name"
        aria-describedby="inline-edit-keyboard-hints"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') setSaved(draft.trim());
          if (event.key === 'Escape') setDraft(saved);
        }}
      />
      <div id="inline-edit-keyboard-hints" className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShortcutHint keys={['enter']} /> to save
        </span>
        <span className="flex items-center gap-1">
          <ShortcutHint keys={['esc']} /> to cancel
        </span>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {draft.trim() === saved ? 'Saved' : 'Not saved yet'}
      </p>
    </div>
  );
}

function InlineEditPageTitle() {
  const [title, setTitle] = useState('Gas compression');
  return (
    <header className="flex w-full flex-col gap-2">
      <span className="text-xs text-muted-foreground">Dashboards / Nordkapp</span>
      <div className="flex items-center justify-between gap-4">
        <EditableTitle
          value={title}
          label="dashboard"
          validate={(next) =>
            DASHBOARD_NAMES.some((name) => name !== title && name.toLowerCase() === next.toLowerCase())
              ? `A dashboard named “${next}” already exists.`
              : null
          }
          onSave={setTitle}
        />
        <Button variant="secondary" size="sm">
          Share
        </Button>
      </div>
      <span className="text-sm text-muted-foreground">Edited 12 Mar by Aisha Khan · 6 charts</span>
    </header>
  );
}

function InlineEditDescription() {
  const [text, setText] = useState(
    'Vibration on the drive end rose after the last start. Inspect the bearing and compare with the 2025 baseline.'
  );
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Description</span>
      <EditableDescription value={text} label="work order description" maxLength={280} onSave={setText} />
    </div>
  );
}

type LimitRecord = {
  tag: string;
  name: string;
  high: string;
  unit: string;
  severity: string;
  calibration: Dayjs | null;
};

function InlineEditTableCells() {
  const [rows, setRows] = useState<LimitRecord[]>(
    COMPRESSOR_SENSORS.map((sensor, index) => ({
      tag: sensor.tag,
      name: sensor.name,
      high: sensor.highLimit.toFixed(sensor.decimals),
      unit: sensor.unit,
      severity: index === 0 ? 'critical' : 'high',
      calibration: TODAY.add(20 + index * 14, 'day'),
    }))
  );
  const update = (tag: string, patch: Partial<LimitRecord>) =>
    setRows((current) => current.map((row) => (row.tag === tag ? { ...row, ...patch } : row)));

  return (
    <Table label="High limits of the compressor sensors" layout="fixed" density="compact">
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">Tag</TableHead>
          <TableHead>Name</TableHead>
          <TableHead numeric className="w-40">High limit</TableHead>
          <TableHead className="w-40">Severity</TableHead>
          <TableHead className="w-44">Next calibration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.tag}>
            <TableCell rowHeader wrap="nowrap">
              {row.tag}
            </TableCell>
            <TableCell>
              <EditableCell
                value={row.name}
                label={`Name of ${row.tag}`}
                validate={(text) => (text === '' ? 'Enter a name.' : null)}
                onSave={(name) => update(row.tag, { name })}
              />
            </TableCell>
            <TableCell>
              <EditableCell
                value={row.high}
                unit={row.unit}
                align="end"
                inputMode="decimal"
                label={`High limit for ${row.tag}`}
                validate={(text) => (isNumber(text) ? null : 'Enter a number.')}
                onSave={(high) => update(row.tag, { high })}
              />
            </TableCell>
            <TableCell>
              <OptionSelect
                aria-label={`Severity for ${row.tag}`}
                size="sm"
                options={SEVERITY_OPTIONS}
                value={row.severity}
                onValueChange={(severity) => update(row.tag, { severity })}
                width="compact"
              />
            </TableCell>
            <TableCell>
              <div role="group" aria-label={`Next calibration for ${row.tag}`}>
                <DatePicker
                  value={row.calibration}
                  onChange={(calibration) => update(row.tag, { calibration })}
                  format="D MMM YYYY"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type OrderDraft = { title: string; priority: string; hours: number | null };

function InlineEditRowMode() {
  const [orders, setOrders] = useState<{ id: string; title: string; priority: string; hours: number }[]>(
    WORK_ORDERS.slice(0, 3).map((order) => ({
      id: order.id,
      title: order.title,
      priority: order.priority,
      hours: order.estimatedHours,
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(orders[1].id);
  const [draft, setDraft] = useState<OrderDraft>({
    title: orders[1].title,
    priority: orders[1].priority,
    hours: orders[1].hours,
  });
  const titleError = draft.title.trim() === '' ? 'Enter a title.' : null;

  return (
    <div className="flex w-full flex-col gap-2">
      <Table label="Work orders" layout="fixed" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-28">Priority</TableHead>
            <TableHead className="w-32">Estimate</TableHead>
            <TableHead srOnly className="w-40">
                Actions
              </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) =>
            order.id === editingId ? (
              <TableRow key={order.id} current>
                <TableCell rowHeader wrap="nowrap">
                {order.id}
              </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Title of ${order.id}`}
                    aria-invalid={titleError ? true : undefined}
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    aria-label={`Priority of ${order.id}`}
                    options={PRIORITY_OPTIONS}
                    value={draft.priority}
                    onValueChange={(priority) => setDraft({ ...draft, priority })}
                    width="compact"
                  />
                </TableCell>
                <TableCell>
                  <UnitNumberInput
                    aria-label={`Estimate for ${order.id}`}
                    value={draft.hours}
                    onValueChange={(hours) => setDraft({ ...draft, hours })}
                    unit="h"
                    min={1}
                    max={40}
                    hideStepper
                  />
                </TableCell>
                <TableCell align="end">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (titleError) return;
                        setOrders((current) =>
                          current.map((item) =>
                            item.id === order.id
                              ? {
                                  ...item,
                                  title: draft.title.trim(),
                                  priority: draft.priority,
                                  hours: draft.hours ?? item.hours,
                                }
                              : item
                          )
                        );
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={order.id}>
                <TableCell rowHeader wrap="nowrap" className="h-10">
                  {order.id}
                </TableCell>
                <TableCell wrap="truncate">{order.title}</TableCell>
                <TableCell>{order.priority}</TableCell>
                <TableCell>
                  <span className="tabular-nums">{order.hours} h</span>
                </TableCell>
                <TableCell align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${order.id}`}
                    disabled={editingId !== null}
                    onClick={() => {
                      setDraft({ title: order.title, priority: order.priority, hours: order.hours });
                      setEditingId(order.id);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
      <p aria-live="polite" className="px-2 text-xs text-muted-foreground">
        {editingId === null
          ? 'Select Edit to change a row.'
          : (titleError ?? `Editing ${editingId}. Save or cancel before you edit another row.`)}
      </p>
    </div>
  );
}

type Shelving = { id: string; tag: string; hours: string };

function InlineEditAddRow() {
  const nextId = useRef(3);
  const [rows, setRows] = useState<Shelving[]>([
    { id: 'rule-1', tag: '40-TT-40015', hours: '8' },
    { id: 'rule-2', tag: '23-TT-91141', hours: '4' },
  ]);
  const [adding, setAdding] = useState(true);
  const [tag, setTag] = useState('');
  const [hours, setHours] = useState('8');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (tag.trim() === '') {
      setError('Enter the tag to shelve.');
      return;
    }
    if (!isNumber(hours)) {
      setError('Enter the number of hours.');
      return;
    }
    setRows((current) => [...current, { id: `rule-${nextId.current}`, tag: tag.trim(), hours }]);
    nextId.current += 1;
    setTag('');
    setError(null);
    setAdding(false);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Table label="Shelving rules" layout="fixed" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Shelved tag</TableHead>
            <TableHead className="w-32">Hours</TableHead>
            <TableHead srOnly className="w-44">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell rowHeader className="h-10">
                {row.tag}
              </TableCell>
              <TableCell>
                <span className="tabular-nums">{row.hours} h</span>
              </TableCell>
              <TableCell align="end">
                <ConfirmButton
                  size="sm"
                  confirmLabel="Remove rule"
                  aria-label={`Remove rule for ${row.tag}`}
                  onConfirm={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                >
                  Remove
                </ConfirmButton>
              </TableCell>
            </TableRow>
          ))}
          {adding ? (
            <TableRow>
              <TableCell>
                <Input
                  aria-label="Tag to shelve"
                  aria-invalid={error !== null && tag.trim() === '' ? true : undefined}
                  placeholder="23-PT-92531"
                  value={tag}
                  onChange={(event) => {
                    setTag(event.target.value);
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') add();
                    if (event.key === 'Escape') setAdding(false);
                  }}
                />
              </TableCell>
              <TableCell>
                <Input
                  aria-label="Hours to shelve"
                  inputMode="numeric"
                  value={hours}
                  onChange={(event) => {
                    setHours(event.target.value);
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') add();
                    if (event.key === 'Escape') setAdding(false);
                  }}
                />
              </TableCell>
              <TableCell align="end">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={add}>
                    Add rule
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {adding ? (
        <p role="alert" className="px-2 text-sm text-critical-foreground-strong empty:hidden">
          {error}
        </p>
      ) : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <IconPlus /> Add rule
          </Button>
        </div>
      )}
    </div>
  );
}

function InlineEditToggleRow() {
  const [enabled, setEnabled] = useState(true);
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-base-foreground">
        Alarm enabled
        <Switch
          checked={enabled}
          onCheckedChange={(next) => {
            setEnabled(next);
            setState('saving');
            if (timer.current !== null) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setState('saved'), 700);
          }}
        />
      </label>
      <SaveStatus state={state} idleText="23-PT-92531 high limit" />
    </div>
  );
}

function InlineEditBulk() {
  const [orders, setOrders] = useState<{ id: string; title: string; priority: string }[]>(
    WORK_ORDERS.slice(0, 4).map((order) => ({ id: order.id, title: order.title, priority: order.priority }))
  );
  const [selected, setSelected] = useState<string[]>([orders[1].id, orders[3].id]);
  const [priority, setPriority] = useState('P1');
  const allSelected = selected.length === orders.length;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-9 items-center gap-3">
        {selected.length > 0 ? (
          <>
            <span aria-live="polite" className="text-sm font-medium tabular-nums text-base-foreground">
              {selected.length} selected
            </span>
            <span className="text-sm text-muted-foreground">Set priority to</span>
            <div className="w-36">
              <OptionSelect
                aria-label="Priority for selected work orders"
                size="sm"
                options={PRIORITY_OPTIONS}
                value={priority}
                onValueChange={setPriority}
                width="compact"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setOrders((current) =>
                  current.map((order) => (selected.includes(order.id) ? { ...order, priority } : order))
                );
                setSelected([]);
              }}
            >
              Apply to {selected.length}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Select rows to change them together.</span>
        )}
      </div>
      <Table label="Work orders">
        <TableHeader>
          <TableRow>
            <TableSelectionCell
              label="Select all work orders"
              checked={allSelected}
              indeterminate={selected.length > 0 && !allSelected}
              onCheckedChange={(checked) => setSelected(checked ? orders.map((order) => order.id) : [])}
            />
            <TableHead className="w-28">Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-24">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} selected={selected.includes(order.id)}>
              <TableSelectionCell
                label={`Select ${order.id}`}
                checked={selected.includes(order.id)}
                onCheckedChange={(checked) =>
                  setSelected((current) => (checked ? [...current, order.id] : current.filter((id) => id !== order.id)))
                }
              />
              <TableCell rowHeader wrap="nowrap">
              {order.id}
            </TableCell>
              <TableCell wrap="truncate">{order.title}</TableCell>
              <TableCell>{order.priority}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InlineEditKeyValue() {
  const [values, setValues] = useState({
    manufacturer: 'Siemens Energy',
    model: 'STC-SV 08-6-A',
    serial: 'SE-2019-04417',
    power: '12.5',
  });
  return (
    <dl className="flex w-full max-w-md flex-col">
      <div className="flex items-center gap-4 border-b border-default py-1">
        <dt className="w-32 shrink-0 text-sm text-muted-foreground">Manufacturer</dt>
        <dd className="min-w-0 flex-1">
          <EditableCell
            affordance="always"
            value={values.manufacturer}
            label="Manufacturer"
            onSave={(manufacturer) => setValues({ ...values, manufacturer })}
          />
        </dd>
      </div>
      <div className="flex items-center gap-4 border-b border-default py-1">
        <dt className="w-32 shrink-0 text-sm text-muted-foreground">Model</dt>
        <dd className="min-w-0 flex-1">
          <EditableCell
            affordance="always"
            value={values.model}
            label="Model"
            onSave={(model) => setValues({ ...values, model })}
          />
        </dd>
      </div>
      <div className="flex items-center gap-4 border-b border-default py-1">
        <dt className="w-32 shrink-0 text-sm text-muted-foreground">Serial number</dt>
        <dd className="min-w-0 flex-1">
          <EditableCell
            affordance="always"
            value={values.serial}
            label="Serial number"
            onSave={(serial) => setValues({ ...values, serial })}
          />
        </dd>
      </div>
      <div className="flex items-center gap-4 py-1">
        <dt className="w-32 shrink-0 text-sm text-muted-foreground">Rated power</dt>
        <dd className="min-w-0 flex-1">
          <EditableCell
            affordance="always"
            value={values.power}
            unit="MW"
            inputMode="decimal"
            label="Rated power"
            validate={numberInRange(0, 50, 'MW')}
            onSave={(power) => setValues({ ...values, power })}
          />
        </dd>
      </div>
    </dl>
  );
}

function InlineEditTags() {
  const [tags, setTags] = useState(['rotating', 'criticality A', 'gas compression']);
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Labels</span>
      <EditableTagList
        tags={tags}
        label="Labels for 23-KA-9101"
        addLabel="Add label"
        maxTags={6}
        validate={(tag) => (tag.length > 24 ? 'Use 24 characters or fewer.' : null)}
        onChange={setTags}
      />
    </div>
  );
}

function InlineEditReadEditCard() {
  const [saved, setSaved] = useState({ assignee: 'tb', hours: 8 });
  const [editing, setEditing] = useState(false);
  const [assignee, setAssignee] = useState(saved.assignee);
  const [hours, setHours] = useState<number | null>(saved.hours);
  const order = WORK_ORDERS[0];
  const assigneeName = PEOPLE.find((person) => person.id === saved.assignee)?.name;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Planning</CardTitle>
          <CardDescription>{order.id}</CardDescription>
        </CardHeaderCenter>
        {editing ? null : (
          <CardHeaderEnd>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Edit planning"
              onClick={() => {
                setAssignee(saved.assignee);
                setHours(saved.hours);
                setEditing(true);
              }}
            >
              Edit
            </Button>
          </CardHeaderEnd>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="grid w-full grid-cols-2 gap-4">
            <FormField label="Assignee">
              {(control) => (
                <OptionSelect
                  {...control}
                  options={PEOPLE_OPTIONS}
                  value={assignee}
                  onValueChange={setAssignee}
                  width="compact"
                />
              )}
            </FormField>
            <FormField label="Estimate">
              {(control) => (
                <UnitNumberInput {...control} value={hours} onValueChange={setHours} unit="h" min={1} max={40} />
              )}
            </FormField>
          </div>
        ) : (
          <div className="w-full">
            <MetadataList
              items={[
                { label: 'Assignee', value: assigneeName },
                { label: 'Estimate', value: `${saved.hours} h` },
                { label: 'Asset', value: findAsset(order.assetId)?.tag },
              ]}
            />
          </div>
        )}
      </CardContent>
      {editing ? (
        <CardFooter>
          <CardFooterStart />
          <CardFooterEnd className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSaved({ assignee, hours: hours ?? saved.hours });
                setEditing(false);
              }}
            >
              Save planning
            </Button>
          </CardFooterEnd>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function InlineEditPickersInRow() {
  const [rows, setRows] = useState<{ id: string; title: string; status: string }[]>(
    WORK_ORDERS.slice(3, 6).map((order) => ({ id: order.id, title: order.title, status: order.status }))
  );
  return (
    <ul className="flex w-full list-none flex-col">
      {rows.map((row, index) => (
        <li key={row.id} className={`flex items-center gap-3 py-2 ${index === 0 ? '' : ROW}`}>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-base-foreground">{row.title}</span>
            <span className="text-xs text-muted-foreground">{row.id}</span>
          </div>
          <div className="w-36 shrink-0">
            <OptionSelect
              aria-label={`Status of ${row.id}`}
              size="sm"
              options={STATUS_OPTIONS}
              value={row.status}
              onValueChange={(status) =>
                setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)))
              }
              width="compact"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InlineEditEmptyValue() {
  const [text, setText] = useState('');
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Handover note</span>
      <EditableDescription
        value={text}
        label="handover note"
        emptyText="No note yet. Add what the next shift needs to know."
        rows={3}
        onSave={setText}
      />
    </div>
  );
}

function InlineEditRenameList() {
  const [views, setViews] = useState([
    { id: 'view-1', name: 'My open work orders' },
    { id: 'view-2', name: 'P1 this week' },
    { id: 'view-3', name: 'Gas compression backlog' },
  ]);
  return (
    <ul className="flex w-full max-w-md list-none flex-col" aria-label="Saved views">
      {views.map((view, index) => (
        <li key={view.id} className={`flex min-h-12 items-center justify-between gap-3 py-1 ${index === 0 ? '' : ROW}`}>
          <div className="min-w-0 flex-1">
            <InlineEditText
              value={view.name}
              label={`name of ${view.name}`}
              validate={(next) =>
                next === ''
                  ? 'Enter a name.'
                  : views.some((item) => item.id !== view.id && item.name.toLowerCase() === next.toLowerCase())
                    ? 'Another view has this name.'
                    : null
              }
              onSave={(name) =>
                setViews((current) => current.map((item) => (item.id === view.id ? { ...item, name } : item)))
              }
            />
          </div>
          <ConfirmButton
            size="sm"
            confirmLabel="Delete view"
            aria-label={`Delete ${view.name}`}
            onConfirm={() => setViews((current) => current.filter((item) => item.id !== view.id))}
          >
            Delete
          </ConfirmButton>
        </li>
      ))}
      {views.length === 0 ? <li className="py-3 text-sm text-muted-foreground">No saved views.</li> : null}
    </ul>
  );
}

function InlineEditOptimisticUndo() {
  const [priority, setPriority] = useState('P1');
  const [previous, setPrevious] = useState<string | null>('P2');
  const order = WORK_ORDERS[3];
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-base-foreground">{order.title}</span>
          <span className="text-xs text-muted-foreground">{order.id}</span>
        </div>
        <div className="w-24 shrink-0">
          <OptionSelect
            aria-label={`Priority of ${order.id}`}
            size="sm"
            options={PRIORITY_OPTIONS}
            value={priority}
            onValueChange={(next) => {
              if (next !== priority) setPrevious(priority);
              setPriority(next);
            }}
            width="compact"
          />
        </div>
      </div>
      <div
        role="status"
        className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-muted-background px-3 py-1 text-sm text-base-foreground empty:hidden"
      >
        {previous === null ? null : (
          <>
            <span>
              Priority changed from {previous} to {priority}.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPriority(previous);
                setPrevious(null);
              }}
            >
              Undo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function InlineEditFailedSave() {
  const [state, setState] = useState<SaveState>('error');
  const [limit, setLimit] = useState<number | null>(53.5);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  const retry = () => {
    setState('saving');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('saved'), 900);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-1">
      <FormField
        label="High limit, 23-PT-92531"
        helper="Your value is kept until it is saved. The stored limit is still 52.0 barg."
      >
        {(control) => (
          <UnitNumberInput
            {...control}
            value={limit}
            onValueChange={(next) => {
              setLimit(next);
              setState('error');
            }}
            unit="barg"
            step={0.5}
          />
        )}
      </FormField>
      <SaveStatus state={state} errorText="Couldn't save. Connection lost." onRetry={retry} />
    </div>
  );
}

function InlineEditUnsavedBar() {
  const saved: Record<string, string> = { '23-PT-92531': '52.0', '23-TT-92532': '145.0', '23-VT-92540': '7.1' };
  const units: Record<string, string> = { '23-PT-92531': 'barg', '23-TT-92532': '°C', '23-VT-92540': 'mm/s' };
  const [values, setValues] = useState<Record<string, string>>({
    ...saved,
    '23-PT-92531': '53.5',
    '23-VT-92540': '6.8',
  });
  const tags = Object.keys(saved);
  const dirtyCount = tags.filter((tag) => values[tag] !== saved[tag]).length;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Table label="High limits" layout="fixed" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead numeric className="w-40">High limit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag}>
              <TableCell rowHeader>
                {tag}
                {values[tag] === saved[tag] ? null : (
                  <span className="pl-2 text-xs font-normal text-muted-foreground">was {saved[tag]}</span>
                )}
              </TableCell>
              <TableCell>
                <EditableCell
                  value={values[tag] ?? ''}
                  unit={units[tag]}
                  align="end"
                  inputMode="decimal"
                  label={`High limit for ${tag}`}
                  validate={(text) => (isNumber(text) ? null : 'Enter a number.')}
                  onSave={(next) => setValues((current) => ({ ...current, [tag]: next }))}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SaveBar
        dirtyCount={dirtyCount}
        cleanText="All limits saved"
        saveLabel="Save limits"
        onSave={() => setValues({ ...saved })}
        onDiscard={() => setValues({ ...saved })}
      />
    </div>
  );
}

function InlineEditConflict() {
  const [resolved, setResolved] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">High limit, 23-PT-92531</span>
        <span className="text-sm font-medium tabular-nums text-base-foreground">{resolved ?? '53.5'} barg</span>
      </div>
      {resolved === null ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg bg-warning-background p-3 text-sm text-warning-foreground"
        >
          <p>
            Aisha Khan changed this limit to <span className="font-medium tabular-nums">52.5 barg</span> while you were
            editing. Your value, 53.5 barg, is not saved yet.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setResolved('53.5')}>
              Save my value
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setResolved('52.5')}>
              Keep 52.5 barg
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <SaveStatus state="saved" savedText={`Saved ${resolved} barg`} />
          <Button variant="ghost" size="sm" onClick={() => setResolved(null)}>
            Show the conflict again
          </Button>
        </div>
      )}
    </div>
  );
}

function InlineEditSaveStates() {
  return (
    <div className="flex flex-col gap-2">
      <SaveStatus state="saving" />
      <SaveStatus state="saved" savedText="Saved 14:00" />
      <SaveStatus state="error" onRetry={() => undefined} />
    </div>
  );
}

function InlineEditLockedValue() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <span className="text-xs text-muted-foreground">Trip limit, 23-PT-92531</span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium tabular-nums text-base-foreground">55.0 barg</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Why the trip limit is locked">
                <IconLock />
              </Button>
            }
          />
          <TooltipContent>Trip limits are changed through a management of change request.</TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground">Locked. Change it with an MoC request.</p>
    </div>
  );
}

function InlineEditSetpoint() {
  const [setpoint, setSetpoint] = useState<number | null>(13.1);
  const [applied, setApplied] = useState<number | null>(13.1);
  const changed = setpoint !== applied;
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <FormField label="Separator pressure setpoint">
        {(control) => (
          <UnitNumberInput
            {...control}
            value={setpoint}
            onValueChange={setSetpoint}
            unit="barg"
            min={11}
            max={15}
            step={0.1}
          />
        )}
      </FormField>
      <div className="flex min-h-8 items-center justify-between gap-2">
        <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
          {changed ? `Applied: ${applied ?? '—'} barg` : 'Applied'}
        </span>
        {changed ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setSetpoint(applied)}>
              Revert
            </Button>
            <Button size="sm" disabled={setpoint === null} onClick={() => setApplied(setpoint)}>
              Apply
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default definePage({
  id: 'inline-editing',
  title: 'Inline editing',
  summary:
    'Changing a value where it is shown, without opening a form: titles, table cells, rows, lists and cards. Inline editing trades a page of fields for speed, so every specimen here answers the same three questions: how do I start, how do I save or back out, and how do I know it saved.',
  guidance: {
    use: [
      'One or two values that people correct often and can check at a glance.',
      'Enter to save and Escape to cancel, everywhere, with focus returning to where the edit started.',
      'Save on blur for single cells; explicit Save and Cancel when a whole row or card is edited.',
      'A quiet "Saved" next to the value, and Undo for changes that were applied at once.',
    ],
    avoid: [
      'Inline editing for values that depend on each other; use a form.',
      'Saving an invalid value silently, or discarding what was typed after a failed save.',
      'Edit affordances that only appear on hover, with no keyboard or touch way in.',
      'More than one row in edit mode at a time.',
    ],
  },
  source,
  sections: [
    {
      id: 'text',
      title: 'Text in place',
      description: 'Names, titles and descriptions that turn into a field where they stand.',
      specimens: [
        {
          id: 'InlineEditClickToEdit',
          title: 'Click to edit',
          note: 'For a single name or label: a pencil opens an input in place, with save and cancel beside it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/InlineEditText.tsx'],
          Component: InlineEditClickToEdit,
        },
        {
          id: 'InlineEditValidationError',
          title: 'Inline validation error',
          note: 'When the typed value is not allowed: the field stays open, says what is allowed and nothing is saved.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableCell.tsx'],
          Component: InlineEditValidationError,
        },
        {
          id: 'InlineEditKeyboardHints',
          title: 'Keyboard hints',
          note: 'Where the save and cancel buttons are left out to save room, spell out Enter and Escape under the field.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['actions/ShortcutHint.tsx'],
          Component: InlineEditKeyboardHints,
        },
        {
          id: 'InlineEditPageTitle',
          title: 'Title in a page header',
          note: 'For renaming the thing the page is about without leaving it; the heading keeps its place and size.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableTitle.tsx'],
          Component: InlineEditPageTitle,
        },
        {
          id: 'InlineEditDescription',
          title: 'Description as a textarea',
          note: 'For multi-line text: Enter makes a new line, so saving is a button or Ctrl/⌘ + Enter and the keys are shown.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableDescription.tsx', 'actions/ShortcutHint.tsx'],
          Component: InlineEditDescription,
        },
      ],
    },
    {
      id: 'tables',
      title: 'Cells and rows',
      description: 'Editing inside a table, one cell, one row or many rows at a time.',
      specimens: [
        {
          id: 'InlineEditTableCells',
          title: 'Editable table cells',
          note: 'For spreadsheet-like correction: text and numbers open on click, selects and dates are always live.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'patterns/data-entry/EditableCell.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: InlineEditTableCells,
        },
        {
          id: 'InlineEditRowMode',
          title: 'Row edit mode',
          note: 'When several cells of a record change together: one row at a time opens, with Save and Cancel at its end.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'patterns/data-entry/OptionSelect.tsx', 'forms/UnitNumberInput.tsx'],
          Component: InlineEditRowMode,
        },
        {
          id: 'InlineEditAddRow',
          title: 'Inline add row',
          note: 'For adding short records to a list without a dialog; the new row sits where the record will appear.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'actions/ConfirmButton.tsx'],
          Component: InlineEditAddRow,
        },
        {
          id: 'InlineEditToggleRow',
          title: 'Toggle that saves at once',
          note: 'For a switch in a row: it applies immediately and a quiet status next to it confirms the save.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/data-entry/SaveStatus.tsx'],
          Component: InlineEditToggleRow,
        },
        {
          id: 'InlineEditBulk',
          title: 'Bulk inline edit',
          note: 'When the same change applies to many rows: select them, set the value once and say how many it will change.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableSelectionCell.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: InlineEditBulk,
        },
      ],
    },
    {
      id: 'lists-and-cards',
      title: 'Lists and cards',
      description: 'Properties, tags and cards that switch between reading and editing.',
      specimens: [
        {
          id: 'InlineEditKeyValue',
          title: 'Editable key-value list',
          note: 'For a property panel where any value may need correcting; values read as text until one is opened.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableCell.tsx'],
          Component: InlineEditKeyValue,
        },
        {
          id: 'InlineEditTags',
          title: 'Editable tag list',
          note: 'For labels: remove with the cross, add in the same row, and reject duplicates with a reason.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableTagList.tsx'],
          Component: InlineEditTags,
        },
        {
          id: 'InlineEditReadEditCard',
          title: 'Read and edit mode card',
          note: 'When a group of values is edited together but rarely: the card reads as text and Edit swaps in the fields.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'display/MetadataList.tsx',
            'forms/FormField.tsx',
            'forms/UnitNumberInput.tsx',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: InlineEditReadEditCard,
        },
        {
          id: 'InlineEditPickersInRow',
          title: 'Select in a list row',
          note: 'For a status people change many times a day: the select is always live and applies on pick.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx'],
          Component: InlineEditPickersInRow,
        },
        {
          id: 'InlineEditEmptyValue',
          title: 'Empty value',
          note: 'When nothing is filled in yet: say so in words and keep the same Edit action, so the way in never moves.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableDescription.tsx'],
          Component: InlineEditEmptyValue,
        },
        {
          id: 'InlineEditRenameList',
          title: 'Rename items in a list',
          note: 'For managing a short list of named things: rename in place, with a two-step delete at the end of each row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/InlineEditText.tsx', 'actions/ConfirmButton.tsx'],
          Component: InlineEditRenameList,
        },
      ],
    },
    {
      id: 'saving',
      title: 'Saving feedback',
      description: 'Telling the user a change was applied, and what to do when it was not.',
      specimens: [
        {
          id: 'InlineEditOptimisticUndo',
          title: 'Optimistic save with undo',
          note: 'For cheap, reversible changes: apply at once and offer Undo, instead of asking before every change.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx'],
          Component: InlineEditOptimisticUndo,
        },
        {
          id: 'InlineEditFailedSave',
          title: 'Failed save keeps the value',
          note: 'When a save fails: keep what was typed, say the stored value is unchanged and offer Retry next to the field.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SaveStatus.tsx', 'forms/FormField.tsx', 'forms/UnitNumberInput.tsx'],
          Component: InlineEditFailedSave,
        },
        {
          id: 'InlineEditUnsavedBar',
          title: 'Batch edits with a save bar',
          note: 'When cell edits should be reviewed before they apply: changed rows show the old value and one bar saves all.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'patterns/data-entry/EditableCell.tsx', 'patterns/data-entry/SaveBar.tsx'],
          Component: InlineEditUnsavedBar,
        },
        {
          id: 'InlineEditConflict',
          title: 'Edit conflict',
          note: 'When someone else changed the value during the edit: show both values and let the user choose, never overwrite silently.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SaveStatus.tsx'],
          Component: InlineEditConflict,
        },
        {
          id: 'InlineEditSaveStates',
          title: 'Save status states',
          note: 'A reference for the indicator next to anything that saves on change: saving, saved, and failed with Retry.',
          origin: 'custom',
          size: 'sm',
          uses: ['patterns/data-entry/SaveStatus.tsx'],
          Component: InlineEditSaveStates,
        },
        {
          id: 'InlineEditLockedValue',
          title: 'Locked value with a reason',
          note: 'When a value looks editable but is not: show it as text with a lock and say how it can be changed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: InlineEditLockedValue,
        },
        {
          id: 'InlineEditSetpoint',
          title: 'Setpoint with apply',
          note: 'For values that act on the process: typing never applies by itself; Apply and Revert appear once it differs.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/UnitNumberInput.tsx'],
          Component: InlineEditSetpoint,
        },
      ],
    },
  ],
});
