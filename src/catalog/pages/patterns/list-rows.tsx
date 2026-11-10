import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { ItemGroup, ItemSectionHeader, ItemSectionHeaderTitle } from '@cognite/aura/components/item';
import { Progress } from '@cognite/aura/components/progress';
import {
  IconArrowDown,
  IconArrowUp,
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconDatabase,
  IconDownload,
  IconEngine,
  IconFileSpreadsheet,
  IconFileText,
  IconGripVertical,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconTimeline,
  IconTool,
  IconTrash,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { SelectionCheckbox } from '../../../library/data/SelectionCheckbox';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatReading, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatAgo, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './list-rows.tsx?raw';

const LIST_ROW_FILES = [
  { id: 'pid', name: 'P&ID 23-KA-9101 rev C.pdf', kind: 'PDF', size: '2.4 MB', modified: '4 Mar', Icon: IconFileText },
  { id: 'vib', name: 'Vibration survey Q1.xlsx', kind: 'Spreadsheet', size: '318 kB', modified: '28 Feb', Icon: IconFileSpreadsheet },
  { id: 'brg', name: 'Drive-end bearing, borescope.jpg', kind: 'Image', size: '5.1 MB', modified: '12 Mar', Icon: IconPhoto },
  { id: 'proc', name: 'Bearing inspection procedure rev 4.pdf', kind: 'PDF', size: '860 kB', modified: '4 Mar', Icon: IconFileText },
] as const;

const LIST_ROW_DATA_SETS = [
  { id: 'telemetry', name: 'Compressor telemetry', detail: '1,284 time series', updated: '2 min ago' },
  { id: 'sap', name: 'SAP work orders', detail: '48,210 events', updated: '1 h ago' },
  { id: 'docs', name: 'Engineering documents', detail: '6,032 files', updated: '3 d ago' },
  { id: 'hierarchy', name: 'Asset hierarchy', detail: '12,406 assets', updated: '9 d ago' },
] as const;

const LIST_ROW_RUNS = [
  { id: 'run-8841', pipeline: 'SAP work orders', state: 'running', started: '13:58', duration: '2 min', rows: '1,204 rows so far' },
  { id: 'run-8840', pipeline: 'PI time series backfill', state: 'succeeded', started: '13:30', duration: '4 min 12 s', rows: '86,400 rows' },
  { id: 'run-8839', pipeline: 'OPC UA live values', state: 'failed', started: '13:15', duration: '38 s', rows: 'Connection refused' },
  { id: 'run-8838', pipeline: 'Document classifier', state: 'succeeded', started: '12:00', duration: '11 min 3 s', rows: '412 files' },
] as const;

const LIST_ROW_RUN_BADGE = {
  running: { label: 'Running', variant: 'inProgress' },
  succeeded: { label: 'Succeeded', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
} as const;

const LIST_ROW_NOTIFICATIONS = [
  { id: 'n1', text: 'Tomás Barros assigned WO-104482 to you', detail: 'Inspect recompressor drive-end bearing', ago: '14 min ago', unread: true },
  { id: 'n2', text: 'PI time series backfill finished', detail: '86,400 rows written to Compressor telemetry', ago: '30 min ago', unread: true },
  { id: 'n3', text: 'Aisha Khan mentioned you in a comment', detail: 'Vibration survey, 1st stage compressor', ago: '3 h ago', unread: false },
  { id: 'n4', text: 'Your export is ready to download', detail: 'Alarm history, February', ago: '1 d ago', unread: false },
] as const;

const LIST_ROW_COMPRESSION = ASSETS.filter((asset) => asset.parentId === 'nk-23');
const LIST_ROW_SENSORS = SENSORS.slice(0, 5);

function listRowTrend(seed: number, base: number): number[] {
  return makeValues({ seed, points: 32, base, amplitude: base * 0.03, noise: base * 0.012 });
}

function ListRowIconTitle() {
  return (
    <ItemGroup aria-label="Files">
      {LIST_ROW_FILES.map((file) => (
        <EntityRow key={file.id} density="dense" leading={<file.Icon />} title={file.name} />
      ))}
    </ItemGroup>
  );
}

function ListRowTwoLine() {
  return (
    <ItemGroup aria-label="Data sets">
      {LIST_ROW_DATA_SETS.slice(0, 3).map((dataSet) => (
        <EntityRow key={dataSet.id} leading={<IconDatabase />} title={dataSet.name} description={dataSet.detail} />
      ))}
    </ItemGroup>
  );
}

function ListRowPeople() {
  return (
    <ItemGroup aria-label="Shift team">
      {PEOPLE.slice(0, 3).map((person) => (
        <EntityRow
          key={person.id}
          leading={<PersonAvatar name={person.name} initials={person.initials} sizes="xsm" />}
          title={person.name}
          description={person.role}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowMetaRight() {
  return (
    <ItemGroup aria-label="Data sets">
      {LIST_ROW_DATA_SETS.map((dataSet) => (
        <EntityRow
          key={dataSet.id}
          leading={<IconDatabase />}
          title={dataSet.name}
          description={dataSet.detail}
          meta={<span className="tabular-nums">Updated {dataSet.updated}</span>}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowWithBadge() {
  return (
    <ItemGroup aria-label="Gas compression equipment">
      {LIST_ROW_COMPRESSION.slice(0, 4).map((asset) => (
        <EntityRow
          key={asset.id}
          leading={<IconEngine />}
          title={asset.name}
          description={asset.tag}
          meta={<StatusBadge status={asset.state} />}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowFiles() {
  return (
    <ItemGroup aria-label="Attached files">
      {LIST_ROW_FILES.map((file) => (
        <EntityRow
          key={file.id}
          leading={<file.Icon />}
          title={file.name}
          description={`${file.kind} · ${file.size}`}
          meta={<span className="tabular-nums">{file.modified}</span>}
          actions={
            <IconAction label={`Download ${file.name}`}>
              <IconDownload />
            </IconAction>
          }
        />
      ))}
    </ItemGroup>
  );
}

function ListRowPipelineRuns() {
  return (
    <ItemGroup aria-label="Pipeline runs">
      {LIST_ROW_RUNS.map((run) => (
        <EntityRow
          key={run.id}
          title={run.pipeline}
          description={`Started ${run.started} · ${run.duration} · ${run.rows}`}
          meta={<Badge variant={LIST_ROW_RUN_BADGE[run.state].variant}>{LIST_ROW_RUN_BADGE[run.state].label}</Badge>}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowTimeSeries() {
  return (
    <ItemGroup aria-label="Time series">
      {LIST_ROW_SENSORS.map((sensor) => (
        <EntityRow
          key={sensor.id}
          leading={<IconTimeline />}
          title={sensor.name}
          description={<span className="font-mono">{sensor.tag}</span>}
          meta={
            <span className="text-sm tabular-nums text-base-foreground">
              {formatReading(sensor.value, sensor.unit, sensor.decimals)}
            </span>
          }
        />
      ))}
    </ItemGroup>
  );
}

function ListRowAlarms() {
  return (
    <ItemGroup aria-label="Alarms">
      {ALARMS.slice(0, 5).map((alarm) => {
        const severity = severityStatus(alarm.severity);
        return (
          <EntityRow
            key={alarm.id}
            leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
            title={alarm.message}
            description={`${alarm.sensorTag} · ${alarm.value} against ${alarm.limit}`}
            meta={<span className="tabular-nums">{formatAgo(alarm.raisedAt)}</span>}
          />
        );
      })}
    </ItemGroup>
  );
}

function ListRowWorkOrders() {
  return (
    <ItemGroup aria-label="Work orders">
      {WORK_ORDERS.slice(0, 5).map((order) => {
        const assignee = findPerson(order.assigneeId);
        return (
          <EntityRow
            key={order.id}
            leading={<IconTool />}
            title={order.title}
            description={`${order.id} · ${order.priority} · Due ${formatDate(order.dueAt)}`}
            meta={
              <>
                <StatusBadge status={order.status} />
                {assignee ? (
                  <PersonAvatar name={assignee.name} initials={assignee.initials} sizes="xsm" />
                ) : (
                  <span className="w-6 text-center" aria-label="Unassigned">
                    —
                  </span>
                )}
              </>
            }
          />
        );
      })}
    </ItemGroup>
  );
}

function ListRowNotifications() {
  return (
    <ItemGroup aria-label="Notifications">
      {LIST_ROW_NOTIFICATIONS.map((notification) => (
        <EntityRow
          key={notification.id}
          leading={
            notification.unread ? (
              <StatusDot tone="info" label="Unread" />
            ) : (
              <span aria-hidden="true" className="size-2" />
            )
          }
          title={
            <span className={notification.unread ? 'font-medium text-base-foreground' : undefined}>{notification.text}</span>
          }
          description={notification.detail}
          meta={<span className="tabular-nums">{notification.ago}</span>}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowWithSparkline() {
  return (
    <ItemGroup aria-label="Compressor readings">
      {LIST_ROW_SENSORS.map((sensor) => {
        const tone = toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
        return (
          <EntityRow
            key={sensor.id}
            title={sensor.name}
            description={<span className="font-mono">{sensor.tag}</span>}
            meta={
              <>
                <Sparkline
                  values={listRowTrend(sensor.seed, sensor.value)}
                  label={`${sensor.name}, last 32 hours`}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  width={96}
                  height={24}
                  tone={tone}
                />
                <span className="w-24 text-right text-sm tabular-nums text-base-foreground">
                  {formatReading(sensor.value, sensor.unit, sensor.decimals)}
                </span>
              </>
            }
          />
        );
      })}
    </ItemGroup>
  );
}

function ListRowHoverActions() {
  return (
    <ItemGroup aria-label="Saved charts">
      {LIST_ROW_SENSORS.slice(0, 4).map((sensor) => (
        <EntityRow
          key={sensor.id}
          leading={<IconTimeline />}
          title={sensor.name}
          description={<span className="font-mono">{sensor.tag}</span>}
          actions={
            <>
              <IconAction label={`Rename ${sensor.name}`}>
                <IconPencil />
              </IconAction>
              <IconAction label={`Remove ${sensor.name}`}>
                <IconTrash />
              </IconAction>
            </>
          }
        />
      ))}
    </ItemGroup>
  );
}

function ListRowOverflowMenu() {
  return (
    <ItemGroup aria-label="Data sets">
      {LIST_ROW_DATA_SETS.map((dataSet) => (
        <EntityRow
          key={dataSet.id}
          leading={<IconDatabase />}
          title={dataSet.name}
          description={dataSet.detail}
          meta={<span className="tabular-nums">{dataSet.updated}</span>}
          trailing={
            <RowActionsMenu
              label={`Actions for ${dataSet.name}`}
              actions={[
                { id: 'open', label: 'Open data set', onSelect: () => undefined },
                { id: 'access', label: 'Manage access', onSelect: () => undefined },
                { id: 'archive', label: 'Archive data set', destructive: true, onSelect: () => undefined },
              ]}
            />
          }
        />
      ))}
    </ItemGroup>
  );
}

function ListRowClickable() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <ItemGroup aria-label="Gas compression equipment">
        {LIST_ROW_COMPRESSION.slice(0, 4).map((asset) => (
          <EntityRow
            key={asset.id}
            leading={<IconEngine />}
            title={asset.name}
            description={asset.tag}
            meta={<StatusBadge status={asset.state} />}
            onOpen={() => setOpened(asset.name)}
          />
        ))}
      </ItemGroup>
      <p className="px-2 text-xs text-muted-foreground" aria-live="polite">
        {opened ? `Opened ${opened}` : 'Select a row to open the asset.'}
      </p>
    </div>
  );
}

function ListRowSelectable() {
  const orders = WORK_ORDERS.slice(0, 5);
  const selection = useSelection(
    orders.map((order) => order.id),
    [orders[0].id, orders[2].id]
  );

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-2 px-2 py-1">
        <SelectionCheckbox
          label="Select all work orders"
          checked={selection.allSelected}
          indeterminate={selection.partiallySelected}
          onChange={(checked) => selection.toggleAll(checked)}
        />
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {selection.count} of {orders.length} selected
        </span>
      </div>
      <ItemGroup aria-label="Work orders">
        {orders.map((order) => (
          <EntityRow
            key={order.id}
            title={order.title}
            description={`${order.id} · ${findAsset(order.assetId)?.tag ?? ''}`}
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

function ListRowWithProgress() {
  const orders = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

  return (
    <ItemGroup aria-label="Work order progress">
      {orders.map((order) => (
        <EntityRow
          key={order.id}
          title={order.title}
          description={`${order.id} · ${order.estimatedHours} h estimated`}
          meta={<span className="tabular-nums">{order.progress}%</span>}
        >
          <Progress size="sm" value={order.progress} aria-label={`${order.id} progress`} />
        </EntityRow>
      ))}
    </ItemGroup>
  );
}

function ListRowExpandable() {
  const alarms = ALARMS.slice(0, 4);
  const [expanded, setExpanded] = useState<string | null>(alarms[1].id);

  return (
    <ItemGroup aria-label="Alarms">
      {alarms.map((alarm) => {
        const isOpen = expanded === alarm.id;
        const severity = severityStatus(alarm.severity);
        return (
          <EntityRow
            key={alarm.id}
            leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
            title={alarm.message}
            description={alarm.sensorTag}
            meta={<span className="tabular-nums">{formatAgo(alarm.raisedAt)}</span>}
            trailing={
              <IconAction
                label={isOpen ? `Hide details for ${alarm.id}` : `Show details for ${alarm.id}`}
                expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : alarm.id)}
              >
                {isOpen ? <IconChevronDown /> : <IconChevronRight />}
              </IconAction>
            }
          >
            {isOpen ? (
              <dl className="ml-5 grid grid-cols-3 gap-3 rounded-lg bg-muted-background p-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Value</dt>
                  <dd className="font-medium tabular-nums text-base-foreground">{alarm.value}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Limit</dt>
                  <dd className="font-medium tabular-nums text-base-foreground">{alarm.limit}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Asset</dt>
                  <dd className="truncate font-medium text-base-foreground">{findAsset(alarm.assetId)?.name}</dd>
                </div>
              </dl>
            ) : null}
          </EntityRow>
        );
      })}
    </ItemGroup>
  );
}

function ListRowGrouped() {
  const groups = [
    { id: 'active', title: 'Active', alarms: ALARMS.filter((alarm) => alarm.state === 'active') },
    { id: 'acknowledged', title: 'Acknowledged', alarms: ALARMS.filter((alarm) => alarm.state === 'acknowledged') },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      {groups.map((group) => (
        <section key={group.id} aria-label={`${group.title} alarms`}>
          <ItemSectionHeader>
            <ItemSectionHeaderTitle>{group.title}</ItemSectionHeaderTitle>
            <span className="text-xs tabular-nums text-muted-foreground">{group.alarms.length}</span>
          </ItemSectionHeader>
          <ItemGroup>
            {group.alarms.map((alarm) => {
              const severity = severityStatus(alarm.severity);
              return (
                <EntityRow
                  key={alarm.id}
                  density="dense"
                  leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
                  title={alarm.message}
                  meta={<span className="tabular-nums">{formatAgo(alarm.raisedAt)}</span>}
                />
              );
            })}
          </ItemGroup>
        </section>
      ))}
    </div>
  );
}

function ListRowReorder() {
  const [order, setOrder] = useState<readonly string[]>(LIST_ROW_SENSORS.slice(0, 4).map((sensor) => sensor.id));
  const move = (index: number, offset: number) => {
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(index + offset, 0, moved);
    setOrder(next);
  };

  return (
    <ItemGroup aria-label="Chart series, in drawing order">
      {order.map((id, index) => {
        const sensor = LIST_ROW_SENSORS.find((candidate) => candidate.id === id);
        if (!sensor) return null;
        return (
          <EntityRow
            key={id}
            leading={<IconGripVertical aria-hidden="true" className="cursor-grab text-muted-foreground" />}
            title={sensor.name}
            description={<span className="font-mono">{sensor.tag}</span>}
            actions={
              <>
                <IconAction label={`Move ${sensor.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <IconArrowUp />
                </IconAction>
                <IconAction label={`Move ${sensor.name} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>
                  <IconArrowDown />
                </IconAction>
              </>
            }
          />
        );
      })}
    </ItemGroup>
  );
}

function ListRowDense() {
  return (
    <ItemGroup aria-label="Instrument tags">
      {SENSORS.slice(0, 8).map((sensor) => (
        <EntityRow
          key={sensor.id}
          density="dense"
          title={<span className="font-mono text-xs">{sensor.tag}</span>}
          meta={<span className="tabular-nums">{formatReading(sensor.value, sensor.unit, sensor.decimals)}</span>}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowDisabled() {
  return (
    <ItemGroup aria-label="Data sets">
      <EntityRow leading={<IconDatabase />} title="Compressor telemetry" description="1,284 time series" onOpen={() => undefined} />
      <EntityRow
        disabled
        leading={<IconDatabase />}
        title="Maintenance history"
        description="You need read access to open this data set."
        onOpen={() => undefined}
      />
      <EntityRow leading={<IconDatabase />} title="Engineering documents" description="6,032 files" onOpen={() => undefined} />
    </ItemGroup>
  );
}

function ListRowCurrent() {
  const [current, setCurrent] = useState<string>(PEOPLE[1].id);

  return (
    <ItemGroup aria-label="On call this week">
      {PEOPLE.slice(0, 4).map((person) => (
        <EntityRow
          key={person.id}
          density="dense"
          leading={<PersonAvatar name={person.name} initials={person.initials} sizes="xxsm" />}
          title={person.name}
          selected={current === person.id}
          meta={current === person.id ? <IconCheck aria-label="Selected" className="size-4" /> : undefined}
          onOpen={() => setCurrent(person.id)}
        />
      ))}
    </ItemGroup>
  );
}

function ListRowLoading() {
  return <SkeletonList rows={4} trailing label="Loading work orders" />;
}

function ListRowEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconBell />
      </EmptyStateIcon>
      <EmptyStateTitle as="h3">No active alarms</EmptyStateTitle>
      <EmptyStateDescription>Alarms raised on Gas compression appear here as they come in.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          <IconPlus /> Add alarm rule
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function ListRowTruncated() {
  const order = WORK_ORDERS[0];

  return (
    <ItemGroup aria-label="Work orders">
      <EntityRow
        leading={<IconTool />}
        title="Inspect recompressor drive-end bearing after high vibration trip and replace if scoring is found"
        description="WO-104482 · Corrective · Gas compression · Requested by the control room after alarm 4812"
        meta={<StatusBadge status={order.status} />}
      />
      <EntityRow
        leading={<IconFileText />}
        title="Recompressor drive-end bearing inspection procedure rev 4, approved for use offshore.pdf"
        description="Updated by Tomás Barros on 4 March after the last overhaul"
        meta={<span className="tabular-nums">860 kB</span>}
      />
    </ItemGroup>
  );
}

export default definePage({
  id: 'list-rows',
  title: 'List rows',
  summary:
    'Rows for the collections every industrial app lists: people, files, runs, tags, assets, alarms and work orders. One anatomy throughout, so identity sits on the left, state on the right and actions at the end.',
  guidance: {
    use: [
      'Put what the row is on the left and its state or latest value on the right.',
      'Keep one way to open a row; put secondary actions on hover or in an overflow menu.',
      'Use dense rows for long lists people scan, comfortable rows for short lists they read.',
      'Separate groups with section headers and space before reaching for dividers.',
    ],
    avoid: [
      'Rows that compare more than three attributes; that is a table.',
      'A border or card around every row.',
      'Colour without a word or shape to carry the state.',
      'Hover-only actions as the only way to do something.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'The parts of a row, added one at a time.',
      specimens: [
        {
          id: 'ListRowIconTitle',
          title: 'Icon and title',
          note: 'The plainest row, for short lists where the name alone identifies the item.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowIconTitle,
        },
        {
          id: 'ListRowTwoLine',
          title: 'Two lines',
          note: 'Add a second line when one fact is needed to tell similar items apart.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowTwoLine,
        },
        {
          id: 'ListRowPeople',
          title: 'People',
          note: 'Lead with an avatar when the row is a person; the role goes on the second line.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/PersonAvatar.tsx'],
          Component: ListRowPeople,
        },
        {
          id: 'ListRowMetaRight',
          title: 'Metadata on the right',
          note: 'Right-align the one attribute people sort or scan by, such as when it last changed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowMetaRight,
        },
        {
          id: 'ListRowWithBadge',
          title: 'With status badge',
          note: 'End the row with a badge when its state is the reason people look at the list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/StatusBadge.tsx'],
          Component: ListRowWithBadge,
        },
      ],
    },
    {
      id: 'entities',
      title: 'Entity rows',
      description: 'The same anatomy filled in for the things industrial apps list most.',
      specimens: [
        {
          id: 'ListRowFiles',
          title: 'Files',
          note: 'Type icon, name, kind and size, with download on hover for attachments and documents.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: ListRowFiles,
        },
        {
          id: 'ListRowPipelineRuns',
          title: 'Pipeline runs',
          note: 'Run history where the outcome badge is scanned first and timing second.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowPipelineRuns,
        },
        {
          id: 'ListRowTimeSeries',
          title: 'Time series tags',
          note: 'Name over tag with the latest reading right-aligned in tabular figures.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowTimeSeries,
        },
        {
          id: 'ListRowAlarms',
          title: 'Alarms',
          note: 'Severity as a shaped dot, the alarm text as an operator reads it, and its age.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx'],
          Component: ListRowAlarms,
        },
        {
          id: 'ListRowWorkOrders',
          title: 'Work orders',
          note: 'Title over id, priority and due date, ending in status and assignee.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/StatusBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: ListRowWorkOrders,
        },
        {
          id: 'ListRowNotifications',
          title: 'Notifications',
          note: 'Unread rows carry a dot and a stronger title; read rows keep the same alignment.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx'],
          Component: ListRowNotifications,
        },
      ],
    },
    {
      id: 'actions',
      title: 'Actions and selection',
      description: 'Rows that open, select, expand or carry their own actions.',
      specimens: [
        {
          id: 'ListRowClickable',
          title: 'Clickable with chevron',
          note: 'Use when the whole row opens a detail view; the chevron says it navigates.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/StatusBadge.tsx'],
          Component: ListRowClickable,
        },
        {
          id: 'ListRowSelectable',
          title: 'Selectable',
          note: 'Checkbox rows with a select-all and a count, for acting on several items at once.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts', 'data/SelectionCheckbox.tsx'],
          Component: ListRowSelectable,
        },
        {
          id: 'ListRowHoverActions',
          title: 'Hover actions',
          note: 'One or two frequent actions that appear on hover and keyboard focus.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: ListRowHoverActions,
        },
        {
          id: 'ListRowOverflowMenu',
          title: 'Overflow menu',
          note: 'Three or more actions per row go behind one always-visible menu button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'data/RowActionsMenu.tsx'],
          Component: ListRowOverflowMenu,
        },
        {
          id: 'ListRowExpandable',
          title: 'Expandable',
          note: 'Reveal a few more facts in place when opening a detail view would be too much.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/IconAction.tsx', 'industrial/StatusDot.tsx'],
          Component: ListRowExpandable,
        },
        {
          id: 'ListRowReorder',
          title: 'Reorderable',
          note: 'A grip marks rows whose order matters; move buttons make the same change by keyboard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: ListRowReorder,
        },
      ],
    },
    {
      id: 'data',
      title: 'Data in the row',
      description: 'Rows that carry a trend, progress or a grouping.',
      specimens: [
        {
          id: 'ListRowWithSparkline',
          title: 'With sparkline',
          note: 'Show the recent shape beside the latest value when direction matters as much as level.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'industrial/Sparkline.tsx'],
          Component: ListRowWithSparkline,
        },
        {
          id: 'ListRowWithProgress',
          title: 'With progress',
          note: 'A thin bar under the row for work that is part-way done.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowWithProgress,
        },
        {
          id: 'ListRowGrouped',
          title: 'Grouped with section headers',
          note: 'Split a list by state or area with a quiet header and count per group.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx'],
          Component: ListRowGrouped,
        },
        {
          id: 'ListRowDense',
          title: 'Dense',
          note: 'Single-line rows at the smallest height, for long tag lists in side panels.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowDense,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What a list shows when a row is current, unavailable, loading or missing.',
      specimens: [
        {
          id: 'ListRowCurrent',
          title: 'Current row',
          note: 'Highlight the one row whose record is shown elsewhere on the screen.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/PersonAvatar.tsx'],
          Component: ListRowCurrent,
        },
        {
          id: 'ListRowDisabled',
          title: 'Unavailable row',
          note: 'Keep a row the user cannot open in place and say why on its second line.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx'],
          Component: ListRowDisabled,
        },
        {
          id: 'ListRowLoading',
          title: 'Loading rows',
          note: 'Skeleton rows in the list’s own shape while the first page loads.',
          origin: 'custom',
          align: 'stretch',
          uses: ['feedback/SkeletonList.tsx'],
          Component: ListRowLoading,
        },
        {
          id: 'ListRowEmpty',
          title: 'Empty list',
          note: 'Say what will appear here and offer the one action that fills it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ListRowEmpty,
        },
        {
          id: 'ListRowTruncated',
          title: 'Long content',
          note: 'Titles and descriptions truncate to one line each; the right side never wraps.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/StatusBadge.tsx'],
          Component: ListRowTruncated,
        },
      ],
    },
  ],
});
