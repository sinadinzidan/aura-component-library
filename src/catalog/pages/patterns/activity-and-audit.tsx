import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderCenter,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconCircleCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDownload,
  IconHistory,
  IconPlug,
  IconShieldCheck,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { ActivityRow } from '../../../library/patterns/collaboration/ActivityRow';
import { ChangeDiff } from '../../../library/patterns/collaboration/ChangeDiff';
import { groupByDay } from '../../../library/patterns/collaboration/groupByDay';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { FilterBar } from '../../../library/patterns/data-entry/FilterBar';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { PEOPLE, WORK_ORDERS } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './activity-and-audit.tsx?raw';

type ActivityAuditType = 'change' | 'alarm' | 'access' | 'export';

type ActivityAuditEvent = {
  id: string;
  at: number;
  /** A person id from the plant, or `null` for an automated actor named in `system`. */
  actorId: string | null;
  system?: string;
  type: ActivityAuditType;
  verb: string;
  object: string;
  /** What happened, as the audit log words it. */
  action: string;
  field?: string;
  before?: string;
  after?: string;
  source: string;
};

const ACTIVITY_AUDIT_ORDER = WORK_ORDERS[0];

const ACTIVITY_AUDIT_EVENTS: readonly ActivityAuditEvent[] = [
  { id: 'evt-90412', at: REFERENCE_NOW - 14 * MINUTE, actorId: null, system: 'Vibration trip rule', type: 'alarm', verb: 'raised alarm', object: 'alm-4812', action: 'Alarm raised', field: 'State', before: 'Normal', after: 'Active', source: 'Rule engine' },
  { id: 'evt-90408', at: REFERENCE_NOW - 22 * MINUTE, actorId: 'lw', type: 'change', verb: 'changed the priority of', object: 'WO-104482', action: 'Work order updated', field: 'Priority', before: 'P2', after: 'P1', source: 'Web app' },
  { id: 'evt-90401', at: REFERENCE_NOW - 38 * MINUTE, actorId: 'ih', type: 'alarm', verb: 'acknowledged alarm', object: 'alm-4811', action: 'Alarm acknowledged', field: 'State', before: 'Active', after: 'Acknowledged', source: 'Web app' },
  { id: 'evt-90377', at: REFERENCE_NOW - 2 * HOUR, actorId: 'ak', type: 'change', verb: 'changed the high limit of', object: '23-TT-92532', action: 'Limit changed', field: 'High limit', before: '150.0 °C', after: '145.0 °C', source: 'Web app' },
  { id: 'evt-90352', at: REFERENCE_NOW - 3 * HOUR, actorId: 'ms', type: 'change', verb: 'assigned', object: 'WO-104482', action: 'Work order assigned', field: 'Assignee', after: 'Tomás Barros', source: 'Web app' },
  { id: 'evt-90318', at: REFERENCE_NOW - 5 * HOUR, actorId: null, system: 'SAP work order sync', type: 'change', verb: 'updated the status of', object: 'WO-104471', action: 'Work order updated', field: 'Status', before: 'Planned', after: 'Waiting', source: 'SAP sync' },
  { id: 'evt-90290', at: REFERENCE_NOW - 18 * HOUR, actorId: 'jn', type: 'change', verb: 'shelved alarm', object: 'alm-4803', action: 'Alarm shelved', field: 'State', before: 'Active', after: 'Shelved', source: 'Mobile app' },
  { id: 'evt-90274', at: REFERENCE_NOW - 21 * HOUR, actorId: 'ms', type: 'export', verb: 'exported', object: 'Alarm history, February', action: 'Data exported', source: 'Web app' },
  { id: 'evt-90231', at: REFERENCE_NOW - 1 * DAY - 4 * HOUR, actorId: 'tb', type: 'change', verb: 'completed', object: 'WO-104431', action: 'Work order updated', field: 'Status', before: 'In progress', after: 'Done', source: 'Mobile app' },
  { id: 'evt-90188', at: REFERENCE_NOW - 2 * DAY - 2 * HOUR, actorId: 'lw', type: 'access', verb: 'gave Jonas Nyberg access to', object: 'Gas compression', action: 'Access granted', field: 'Role', after: 'Editor', source: 'Web app' },
  { id: 'evt-90102', at: REFERENCE_NOW - 3 * DAY - 6 * HOUR, actorId: null, system: 'Historian API client', type: 'access', verb: 'rotated the token for', object: 'svc-historian', action: 'Token rotated', source: 'API' },
];

const ACTIVITY_AUDIT_TYPE_LABEL: Record<ActivityAuditType, string> = {
  change: 'Change',
  alarm: 'Alarm',
  access: 'Access',
  export: 'Export',
};

const ACTIVITY_AUDIT_SIGN_INS = [
  { id: 's1', device: 'Chrome on Windows', mobile: false, place: 'Nordkapp control room', at: REFERENCE_NOW - 6 * HOUR, method: 'Single sign-on', ok: true, current: true },
  { id: 's2', device: 'Fusion for iOS', mobile: true, place: 'Hammerfest, Norway', at: REFERENCE_NOW - 1 * DAY - 9 * HOUR, method: 'Single sign-on', ok: true, current: false },
  { id: 's3', device: 'Firefox on Linux', mobile: false, place: 'Lisbon, Portugal', at: REFERENCE_NOW - 2 * DAY - 3 * HOUR, method: 'Password', ok: false, current: false },
  { id: 's4', device: 'Chrome on Windows', mobile: false, place: 'Nordkapp control room', at: REFERENCE_NOW - 3 * DAY - 6 * HOUR, method: 'Single sign-on', ok: true, current: false },
] as const;

function activityAuditActor(event: ActivityAuditEvent): string {
  if (event.actorId === null) return event.system ?? 'System';
  return PEOPLE.find((person) => person.id === event.actorId)?.name ?? 'Unknown user';
}

function ActivityAuditFeedRow({ event, timeOnly = true }: { event: ActivityAuditEvent; timeOnly?: boolean }) {
  return (
    <ActivityRow
      actor={activityAuditActor(event)}
      actorKind={event.actorId === null ? 'system' : 'person'}
      colorKey={event.actorId ?? undefined}
      icon={event.source === 'SAP sync' || event.source === 'API' ? <IconPlug /> : undefined}
      verb={event.verb}
      object={event.object}
      time={timeOnly ? formatTime(event.at) : formatDateTime(event.at)}
    />
  );
}

function ActivityAuditWho({ event }: { event: ActivityAuditEvent }) {
  const name = activityAuditActor(event);

  return (
    <span className="flex min-w-0 items-center gap-2">
      {event.actorId === null ? (
        <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted-background text-medium-foreground">
          <IconPlug className="size-3.5" />
        </span>
      ) : (
        <PersonAvatar name={name} colorKey={event.actorId} sizes="xsm" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base-foreground">{name}</span>
        {event.actorId === null ? <span className="text-xs text-muted-foreground">Automated</span> : null}
      </span>
    </span>
  );
}

const ACTIVITY_AUDIT_COLUMNS: readonly DataTableColumn<ActivityAuditEvent>[] = [
  { id: 'when', header: 'When', width: 'w-32', sortValue: (event) => event.at, cell: (event) => <span className="tabular-nums text-medium-foreground">{formatDateTime(event.at)}</span> },
  { id: 'who', header: 'Who', width: 'w-52', sortValue: (event) => activityAuditActor(event), cell: (event) => <ActivityAuditWho event={event} /> },
  {
    id: 'what',
    header: 'What',
    cell: (event) => (
      <span className="flex flex-col">
        <span className="text-base-foreground">{event.action}</span>
        <span className="font-mono text-xs text-muted-foreground">{event.object}</span>
      </span>
    ),
  },
  {
    id: 'change',
    header: 'Before → after',
    cell: (event) =>
      event.field ? (
        <ChangeDiff field={event.field} before={event.before} after={event.after} layout="stacked" />
      ) : (
        <span className="text-muted-foreground">No field change</span>
      ),
  },
  { id: 'source', header: 'Source', width: 'w-28', sortValue: (event) => event.source, cell: (event) => <span className="text-medium-foreground">{event.source}</span> },
];

function ActivityAuditEventDetails({ event }: { event: ActivityAuditEvent }) {
  return (
    <PropertyList
      dense
      items={[
        { label: 'Event ID', value: <span className="font-mono text-xs">{event.id}</span> },
        { label: 'Type', value: ACTIVITY_AUDIT_TYPE_LABEL[event.type] },
        { label: 'Source', value: event.source },
        { label: 'Session', value: event.actorId === null ? undefined : 'Nordkapp control room · 10.42.7.118' },
        { label: 'Recorded', value: `${formatDateTime(event.at)} UTC` },
      ]}
    />
  );
}

function ActivityAuditRowBasic() {
  return (
    <ul aria-label="Recent activity" className="flex w-full max-w-lg flex-col">
      {[ACTIVITY_AUDIT_EVENTS[2], ACTIVITY_AUDIT_EVENTS[4], ACTIVITY_AUDIT_EVENTS[8]].map((event) => (
        <ActivityAuditFeedRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

function ActivityAuditRowSystem() {
  return (
    <ul aria-label="Recent activity" className="flex w-full max-w-lg flex-col">
      {[ACTIVITY_AUDIT_EVENTS[0], ACTIVITY_AUDIT_EVENTS[1], ACTIVITY_AUDIT_EVENTS[5]].map((event) => (
        <ActivityAuditFeedRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

function ActivityAuditRowDiff() {
  const events = [ACTIVITY_AUDIT_EVENTS[1], ACTIVITY_AUDIT_EVENTS[3]];

  return (
    <ul aria-label="Recent changes" className="flex w-full max-w-lg flex-col">
      {events.map((event) => (
        <ActivityRow
          key={event.id}
          actor={activityAuditActor(event)}
          colorKey={event.actorId ?? undefined}
          verb={event.verb}
          object={event.object}
          time={formatTime(event.at)}
          summary={<ChangeDiff field={event.field ?? ''} before={event.before} after={event.after} />}
        />
      ))}
    </ul>
  );
}

function ActivityAuditDiffList() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <p className="text-sm text-medium-foreground">
        <span className="font-medium text-base-foreground">Magnus Solberg</span> edited{' '}
        <span className="font-mono text-xs text-base-foreground">{ACTIVITY_AUDIT_ORDER.id}</span> · 4 fields
      </p>
      <div className="flex flex-col gap-2 rounded-lg bg-muted-background p-3">
        <ChangeDiff field="Priority" before="P2" after="P1" />
        <ChangeDiff field="Assignee" after="Tomás Barros" emptyValue="Unassigned" />
        <ChangeDiff field="Due" before="14 Mar 08:00" after="12 Mar 20:00" />
        <ChangeDiff field="Permit" before="PTW-2291" emptyValue="None" mono />
      </div>
    </div>
  );
}

function ActivityAuditRowExpandable() {
  const events = [ACTIVITY_AUDIT_EVENTS[3], ACTIVITY_AUDIT_EVENTS[6]];

  return (
    <ul aria-label="Recent changes" className="flex w-full max-w-lg flex-col">
      {events.map((event, index) => (
        <ActivityRow
          key={event.id}
          actor={activityAuditActor(event)}
          colorKey={event.actorId ?? undefined}
          verb={event.verb}
          object={event.object}
          time={formatTime(event.at)}
          defaultOpen={index === 0}
          details={<ActivityAuditEventDetails event={event} />}
        />
      ))}
    </ul>
  );
}

function ActivityAuditRowQuote() {
  return (
    <ul aria-label="Recent activity" className="flex w-full max-w-lg flex-col">
      <ActivityRow
        actor="Aisha Khan"
        colorKey="ak"
        verb="commented on"
        object={ACTIVITY_AUDIT_ORDER.id}
        time="11:20"
        summary={
          <p className="border-l-2 border-emphasized pl-3 text-sm text-medium-foreground">
            Spectrum shows a clear 1× peak on the drive end. I suspect unbalance, not the bearing.
          </p>
        }
      />
      <ActivityRow actor="Tomás Barros" colorKey="tb" verb="attached 2 files to" object={ACTIVITY_AUDIT_ORDER.id} time="12:05" />
    </ul>
  );
}

function ActivityAuditGroupedByDay() {
  const groups = groupByDay(ACTIVITY_AUDIT_EVENTS.slice(3, 10), (event) => event.at, REFERENCE_NOW);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col">
          <h4 className="text-xs font-medium text-muted-foreground">{group.label}</h4>
          <ul className="flex flex-col">
            {group.items.map((event) => (
              <ActivityAuditFeedRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ActivityAuditFeedCard() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Activity</CardTitle>
          <CardDescription>Gas compression · last 24 hours</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ul aria-label="Activity in gas compression" className="flex w-full flex-col">
          {ACTIVITY_AUDIT_EVENTS.slice(0, 5).map((event) => (
            <ActivityAuditFeedRow key={event.id} event={event} />
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          View all activity
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActivityAuditSummary() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Gas compression · this week</span>
        <span className="text-2xl font-semibold tabular-nums text-base-foreground">12 changes</span>
        <span className="text-sm text-medium-foreground">by 5 people and 2 integrations</span>
      </div>
      <BreakdownList
        label="Changes this week by type"
        items={[
          { id: 'wo', label: 'Work orders', value: 6 },
          { id: 'limits', label: 'Limits', value: 3 },
          { id: 'alarms', label: 'Alarm states', value: 2 },
          { id: 'access', label: 'Access', value: 1 },
        ]}
      />
    </div>
  );
}

function ActivityAuditEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconHistory />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No activity yet</EmptyStateTitle>
      <EmptyStateDescription>Changes to this work order show up here as they happen.</EmptyStateDescription>
    </EmptyState>
  );
}

function ActivityAuditLoading() {
  return <SkeletonList rows={4} media trailing label="Loading activity" />;
}

function ActivityAuditFilters() {
  const [actor, setActor] = useState('lw');
  const [type, setType] = useState('change');
  const [range, setRange] = useState('7d');

  const actorName = PEOPLE.find((person) => person.id === actor)?.name;
  const chips = [
    ...(actorName ? [{ id: 'actor', label: 'Actor', value: actorName }] : []),
    ...(type !== 'all' ? [{ id: 'type', label: 'Type', value: type === 'change' ? 'Change' : type === 'alarm' ? 'Alarm' : type === 'access' ? 'Access' : 'Export' }] : []),
  ];

  return (
    <FilterBar
      label="Filter the audit log"
      chips={chips}
      onRemoveChip={(id) => (id === 'actor' ? setActor('all') : setType('all'))}
      onClearAll={() => {
        setActor('all');
        setType('all');
      }}
      summary={chips.length === 0 ? '1,284 events' : `${chips.length === 2 ? 3 : 41} of 1,284 events`}
    >
      <span className="block w-44">
        <OptionSelect
          aria-label="Actor"
          size="sm"
          width="compact"
          value={actor}
          onValueChange={setActor}
          options={[{ value: 'all', label: 'Anyone' }, ...PEOPLE.map((person) => ({ value: person.id, label: person.name })), { value: 'system', label: 'Automated' }]}
        />
      </span>
      <span className="block w-44">
        <OptionSelect
          aria-label="Event type"
          size="sm"
          width="compact"
          value={type}
          onValueChange={setType}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'change', label: 'Changes' },
            { value: 'alarm', label: 'Alarms' },
            { value: 'access', label: 'Access' },
            { value: 'export', label: 'Exports' },
          ]}
        />
      </span>
      <span className="block w-44">
        <OptionSelect
          aria-label="Date range"
          size="sm"
          width="compact"
          value={range}
          onValueChange={setRange}
          options={[
            { value: '24h', label: 'Last 24 hours' },
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
        />
      </span>
    </FilterBar>
  );
}

function ActivityAuditLogTable() {
  return (
    <DataTable
      label="Audit log"
      columns={ACTIVITY_AUDIT_COLUMNS}
      rows={ACTIVITY_AUDIT_EVENTS.slice(0, 6)}
      getRowId={(event) => event.id}
      defaultSort={{ columnId: 'when', direction: 'desc' }}
    />
  );
}

function ActivityAuditLogExpandable() {
  return (
    <DataTable
      label="Audit log with details"
      columns={ACTIVITY_AUDIT_COLUMNS.filter((column) => column.id !== 'source')}
      rows={ACTIVITY_AUDIT_EVENTS.slice(1, 5)}
      getRowId={(event) => event.id}
      rowLabel={(event) => `${event.action}, ${event.object}`}
      defaultExpandedIds={['evt-90401']}
      renderExpanded={(event) => (
        <div className="max-w-md py-2">
          <ActivityAuditEventDetails event={event} />
        </div>
      )}
    />
  );
}

function ActivityAuditExport() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              <IconDownload /> Export audit log <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Export filtered events as CSV</DropdownMenuItem>
          <DropdownMenuItem>Export filtered events as Parquet</DropdownMenuItem>
          <DropdownMenuItem>Export all 1,284 events as CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground">
        41 events match the current filters. The export is itself recorded in the log.
      </p>
    </div>
  );
}

function ActivityAuditRetention() {
  return (
    <Alert variant="info" className="w-full">
      <AlertTitle>Events are kept for 13 months</AlertTitle>
      <AlertDescription>
        The oldest event in this log is from 12 Feb 2025. Export older periods before they are removed.
      </AlertDescription>
    </Alert>
  );
}

function ActivityAuditIntegrity() {
  const event = ACTIVITY_AUDIT_EVENTS[3];

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <span className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconShieldCheck aria-hidden="true" className="size-4 text-muted-foreground" />
        Recorded and locked
      </span>
      <p className="text-sm text-medium-foreground">
        Audit events cannot be edited or deleted, by anyone. Quote the event ID when you refer to one.
      </p>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted-background py-1 pr-1 pl-3">
        <span className="font-mono text-sm text-base-foreground">{event.id}</span>
        <CopyButton variant="ghost" size="icon-sm" text={event.id} label="Copy event ID" iconOnly />
      </div>
    </div>
  );
}

function ActivityAuditRecordHistory() {
  const history = ACTIVITY_AUDIT_EVENTS.filter((event) => event.object === ACTIVITY_AUDIT_ORDER.id);

  return (
    <div className="h-96 w-full max-w-lg">
      <SidePanel
        title="History"
        description={`${ACTIVITY_AUDIT_ORDER.id} · ${ACTIVITY_AUDIT_ORDER.title}`}
        leading={<IconHistory aria-hidden="true" className="size-5 text-muted-foreground" />}
        onClose={() => undefined}
        closeLabel="Close history"
      >
        <ul aria-label={`History of ${ACTIVITY_AUDIT_ORDER.id}`} className="flex flex-col">
          {history.map((event) => (
            <ActivityRow
              key={event.id}
              actor={activityAuditActor(event)}
              colorKey={event.actorId ?? undefined}
              verb={event.action.toLowerCase().replace('work order ', '')}
              object="this work order"
              time={formatTime(event.at)}
              summary={event.field ? <ChangeDiff field={event.field} before={event.before} after={event.after} emptyValue="Unassigned" /> : undefined}
            />
          ))}
          <ActivityRow actor="SAP work order sync" actorKind="system" icon={<IconPlug />} verb="created" object="this work order" time="08:02" />
        </ul>
      </SidePanel>
    </div>
  );
}

function ActivityAuditFieldHistory() {
  const versions = [
    { id: 'v3', value: '145.0 °C', by: 'Aisha Khan', when: '12 Mar 12:00', current: true },
    { id: 'v2', value: '150.0 °C', by: 'Aisha Khan', when: '4 Feb 09:14', current: false },
    { id: 'v1', value: '140.0 °C', by: 'Commissioning import', when: '18 Nov 2025', current: false },
  ];

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <SectionHeader title="High limit" description="23-TT-92532 · Discharge temperature" size="sm" as="h4" />
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-default text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Value</th>
            <th scope="col" className="py-2 pr-3 font-medium">Set by</th>
            <th scope="col" className="py-2 text-right font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => (
            <tr key={version.id} className="border-b border-default last:border-b-0">
              <td className="py-2 pr-3">
                <span className="flex items-center gap-2">
                  <span className={`tabular-nums ${version.current ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}>{version.value}</span>
                  {version.current ? <Badge variant="secondary">Current</Badge> : null}
                </span>
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{version.by}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">{version.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityAuditSignInHistory() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <SectionHeader title="Sign-in history" description="Ingrid Haugen · last 7 days" size="sm" as="h4" />
      <ul aria-label="Sign-in history" className="flex flex-col">
        {ACTIVITY_AUDIT_SIGN_INS.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-2">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground">
              {entry.mobile ? <IconDeviceMobile className="size-4" /> : <IconDeviceDesktop className="size-4" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2 text-sm text-base-foreground">
                <span className="truncate">{entry.device}</span>
                {entry.current ? <Badge variant="secondary">This session</Badge> : null}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {entry.place} · {entry.method}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              {entry.ok ? (
                <span className="flex items-center gap-1 text-xs text-medium-foreground">
                  <IconCircleCheck aria-hidden="true" className="size-3.5 text-muted-foreground" />
                  Signed in
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-critical-foreground-strong">
                  <IconAlertTriangle aria-hidden="true" className="size-3.5" />
                  Failed attempt
                </span>
              )}
              <span className="text-xs tabular-nums text-muted-foreground">{formatDateTime(entry.at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityAuditFilteredEmpty() {
  return (
    <EmptyState type="no-results">
      <EmptyStateIcon>
        <IconHistory />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No events match these filters</EmptyStateTitle>
      <EmptyStateDescription>Nobody exported data from gas compression in the last 24 hours.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="outline" size="sm">
          Clear filters
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function ActivityAuditLogPage() {
  const [actor, setActor] = useState('all');
  const [type, setType] = useState('all');

  const rows = ACTIVITY_AUDIT_EVENTS.filter((event) => {
    const actorMatches = actor === 'all' || (actor === 'system' ? event.actorId === null : event.actorId === actor);
    return actorMatches && (type === 'all' || event.type === type);
  });
  const actorLabel = actor === 'system' ? 'Automated' : PEOPLE.find((person) => person.id === actor)?.name;
  const chips = [
    ...(actorLabel ? [{ id: 'actor', label: 'Actor', value: actorLabel }] : []),
    ...(type === 'change' || type === 'alarm' || type === 'access' || type === 'export' ? [{ id: 'type', label: 'Type', value: ACTIVITY_AUDIT_TYPE_LABEL[type] }] : []),
  ];
  const clear = () => {
    setActor('all');
    setType('all');
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader
        title="Audit log"
        description="Every change to data, limits, alarms and access in Nordkapp."
        as="h3"
        actions={
          <Button variant="outline" size="sm">
            <IconDownload /> Export audit log
          </Button>
        }
      />
      <FilterBar
        label="Filter the audit log"
        chips={chips}
        onRemoveChip={(id) => (id === 'actor' ? setActor('all') : setType('all'))}
        onClearAll={clear}
        summary={`${rows.length} of ${ACTIVITY_AUDIT_EVENTS.length} events`}
      >
        <span className="block w-44">
          <OptionSelect
            aria-label="Actor"
            size="sm"
            width="compact"
            value={actor}
            onValueChange={setActor}
            options={[{ value: 'all', label: 'Anyone' }, ...PEOPLE.map((person) => ({ value: person.id, label: person.name })), { value: 'system', label: 'Automated' }]}
          />
        </span>
        <span className="block w-44">
          <OptionSelect
            aria-label="Event type"
            size="sm"
            width="compact"
            value={type}
            onValueChange={setType}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'change', label: 'Changes' },
              { value: 'alarm', label: 'Alarms' },
              { value: 'access', label: 'Access' },
              { value: 'export', label: 'Exports' },
            ]}
          />
        </span>
      </FilterBar>
      <DataTable
        label="Audit log"
        columns={ACTIVITY_AUDIT_COLUMNS}
        rows={rows}
        getRowId={(event) => event.id}
        rowLabel={(event) => `${event.action}, ${event.object}`}
        defaultSort={{ columnId: 'when', direction: 'desc' }}
        renderExpanded={(event) => (
          <div className="max-w-md py-2">
            <ActivityAuditEventDetails event={event} />
          </div>
        )}
        empty={
          <EmptyState type="no-results">
            <EmptyStateTitle as="h4">No events match these filters</EmptyStateTitle>
            <EmptyStateActions>
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            </EmptyStateActions>
          </EmptyState>
        }
      />
      <p className="text-xs text-muted-foreground">Events are kept for 13 months and cannot be edited. Times are in UTC.</p>
    </div>
  );
}

export default definePage({
  id: 'activity-and-audit',
  title: 'Activity and audit',
  summary:
    'Activity feeds say what happened recently in plain sentences; audit logs prove who changed what, from which value to which, when and through which channel. Both use the same order: actor, verb, object, time.',
  guidance: {
    use: [
      'Always the same sentence order: who, did what, to what, when.',
      'Show a change as before → after, with the old value struck through.',
      'Mark automated actors in words and with an icon tile, never with an avatar.',
      'Say how long events are kept, and record exports of the log in the log.',
    ],
    avoid: [
      'Raw JSON as the detail of an event. Show labelled values.',
      'Red and green as the only sign of what was removed and added.',
      'Relative times alone in an audit log. Give the timestamp and the time zone.',
      'Letting anyone edit or delete audit events, including administrators.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Activity rows',
      description: 'One event as a sentence, and the detail it can carry.',
      specimens: [
        {
          id: 'ActivityAuditRowBasic',
          title: 'Activity row',
          note: 'The base sentence for any feed: actor, verb, object, with the time at the end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx'],
          Component: ActivityAuditRowBasic,
        },
        {
          id: 'ActivityAuditRowSystem',
          title: 'System and human events',
          note: 'When rules and integrations act next to people; automated rows get a tile and a label.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx'],
          Component: ActivityAuditRowSystem,
        },
        {
          id: 'ActivityAuditRowDiff',
          title: 'Row with a change',
          note: 'When the value matters as much as the fact that it changed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx', 'patterns/collaboration/ChangeDiff.tsx'],
          Component: ActivityAuditRowDiff,
        },
        {
          id: 'ActivityAuditDiffList',
          title: 'Several fields in one edit',
          note: 'One save that touched many fields: set, changed and cleared values in one aligned block.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ChangeDiff.tsx'],
          Component: ActivityAuditDiffList,
        },
        {
          id: 'ActivityAuditRowExpandable',
          title: 'Expandable details',
          note: 'Event ID, source and session as labelled values behind a toggle, for the few who need them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: ActivityAuditRowExpandable,
        },
        {
          id: 'ActivityAuditRowQuote',
          title: 'Row with a quote',
          note: 'Comments and notes in a feed: the first lines are quoted under the sentence.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx'],
          Component: ActivityAuditRowQuote,
        },
      ],
    },
    {
      id: 'feeds',
      title: 'Feeds',
      description: 'Rows put together for a record, an area or a dashboard.',
      specimens: [
        {
          id: 'ActivityAuditGroupedByDay',
          title: 'Grouped by day',
          note: 'A feed that spans days: day headings carry the date so rows only need the time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx', 'patterns/collaboration/groupByDay.ts'],
          Component: ActivityAuditGroupedByDay,
        },
        {
          id: 'ActivityAuditFeedCard',
          title: 'Activity feed card',
          note: 'The last few events for an area on a dashboard, with a way to the full log.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ActivityRow.tsx'],
          Component: ActivityAuditFeedCard,
        },
        {
          id: 'ActivityAuditSummary',
          title: 'Activity summary',
          note: 'When the reader wants the volume and the mix before the individual events.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/BreakdownList.tsx'],
          Component: ActivityAuditSummary,
        },
        {
          id: 'ActivityAuditEmpty',
          title: 'Empty feed',
          note: 'A new record with no history: say what will appear here.',
          origin: 'custom',
          Component: ActivityAuditEmpty,
        },
        {
          id: 'ActivityAuditLoading',
          title: 'Loading feed',
          note: 'While events load, rows shaped like the feed hold its place.',
          origin: 'custom',
          align: 'stretch',
          uses: ['feedback/SkeletonList.tsx'],
          Component: ActivityAuditLoading,
        },
      ],
    },
    {
      id: 'audit-log',
      title: 'Audit log',
      description: 'The formal record: filterable, exportable and complete.',
      specimens: [
        {
          id: 'ActivityAuditFilters',
          title: 'Filter bar',
          note: 'Actor, event type and date range cover most audit questions; applied filters show as chips.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: ActivityAuditFilters,
        },
        {
          id: 'ActivityAuditLogTable',
          title: 'Audit log table',
          note: 'Who, what, before and after, when and through which channel, sortable by time and actor.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/collaboration/ChangeDiff.tsx', 'display/PersonAvatar.tsx'],
          Component: ActivityAuditLogTable,
        },
        {
          id: 'ActivityAuditLogExpandable',
          title: 'Expandable rows',
          note: 'Keeps the table to five columns and puts the rest of an event behind the row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/structure/PropertyList.tsx', 'patterns/collaboration/ChangeDiff.tsx'],
          Component: ActivityAuditLogExpandable,
        },
        {
          id: 'ActivityAuditExport',
          title: 'Export audit log',
          note: 'The export says how many events it covers and that it is recorded itself.',
          origin: 'custom',
          Component: ActivityAuditExport,
        },
        {
          id: 'ActivityAuditRetention',
          title: 'Retention notice',
          note: 'Above a log with a retention limit, so nobody learns about it when the data is gone.',
          origin: 'custom',
          align: 'stretch',
          Component: ActivityAuditRetention,
        },
        {
          id: 'ActivityAuditIntegrity',
          title: 'Locked event reference',
          note: 'Where people need to cite one event in an investigation or a ticket.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: ActivityAuditIntegrity,
        },
      ],
    },
    {
      id: 'history',
      title: 'History',
      description: 'The same events seen from one record, one field or one person.',
      specimens: [
        {
          id: 'ActivityAuditRecordHistory',
          title: 'Record history panel',
          note: 'Everything that happened to one work order, newest first, beside the record.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/collaboration/ActivityRow.tsx', 'patterns/collaboration/ChangeDiff.tsx'],
          Component: ActivityAuditRecordHistory,
        },
        {
          id: 'ActivityAuditSignInHistory',
          title: 'Sign-in history',
          note: 'On a profile or security page; failed attempts are named and marked, not only tinted.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: ActivityAuditSignInHistory,
        },
        {
          id: 'ActivityAuditFieldHistory',
          title: 'History of one field',
          note: 'For a setting where the previous values matter, such as an alarm limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: ActivityAuditFieldHistory,
        },
        {
          id: 'ActivityAuditFilteredEmpty',
          title: 'No matching events',
          note: 'When filters remove everything: repeat what was asked and offer the way back.',
          origin: 'custom',
          size: 'md',
          Component: ActivityAuditFilteredEmpty,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full block',
      description: 'The audit log as a page section, with working filters.',
      specimens: [
        {
          id: 'ActivityAuditLogPage',
          title: 'Audit log page',
          note: 'Header, filters, table with expandable rows and the retention line. Filter to try the empty state.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/structure/SectionHeader.tsx',
            'patterns/data-entry/FilterBar.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/collaboration/ChangeDiff.tsx',
            'patterns/structure/PropertyList.tsx',
          ],
          Component: ActivityAuditLogPage,
        },
      ],
    },
  ],
});
