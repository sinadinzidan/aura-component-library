import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconDownload,
  IconFilterOff,
  IconFlame,
  IconGauge,
  IconInfoCircle,
  IconLayoutDashboard,
  IconPencil,
  IconPlus,
  IconSettings,
  IconTool,
  IconTopologyStar3,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { BrowserFrame } from '../../../library/kit/app-shells/BrowserFrame';
import { Crumbs } from '../../../library/kit/app-shells/Crumbs';
import { Pane } from '../../../library/kit/app-shells/Pane';
import { Panes } from '../../../library/kit/app-shells/Panes';
import { PersonChip } from '../../../library/kit/app-shells/PersonChip';
import { SubNav, type SubNavGroup } from '../../../library/kit/app-shells/SubNav';
import { TabStrip } from '../../../library/kit/app-shells/TabStrip';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Steps } from '../../../library/kit/form-and-settings/Steps';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Activity, type ActivityItem } from '../../../library/kit/list-and-detail/Activity';
import { FilterChips } from '../../../library/kit/list-and-detail/FilterChips';
import { Pager } from '../../../library/kit/list-and-detail/Pager';
import { PickList } from '../../../library/kit/list-and-detail/PickList';
import { Properties } from '../../../library/kit/list-and-detail/Properties';
import { SelectionBar } from '../../../library/kit/list-and-detail/SelectionBar';
import { SideSheet } from '../../../library/kit/list-and-detail/SideSheet';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import {
  ALARMS,
  ASSETS,
  SENSORS,
  WORK_ORDERS,
  findAsset,
  findPerson,
  sensorsOf,
  type Alarm,
  type Asset,
  type Sensor,
  type WorkOrder,
} from '../../data/plant';
import { HOUR, REFERENCE_NOW, formatAgo, formatDate, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './list-and-detail.tsx?raw';

const LD_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const LD_UNITS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const LD_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(REFERENCE_NOW - (24 - index) * HOUR));

const LD_SEVERITY_TONE: Record<Alarm['severity'], Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const LD_SEVERITY_LABEL: Record<Alarm['severity'], string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const LD_ALARM_STATE: Record<Alarm['state'], string> = { active: 'Active', acknowledged: 'Acknowledged', cleared: 'Cleared', shelved: 'Shelved' };

const LD_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const LD_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const LD_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const LD_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const LD_ORDER_TONE: Record<WorkOrder['status'], Tone> = {
  open: 'neutral',
  planned: 'info',
  'in-progress': 'success',
  waiting: 'warning',
  done: 'neutral',
};

const LD_ORDER_LABEL: Record<WorkOrder['status'], string> = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
};

const LD_TYPE_LABEL: Record<WorkOrder['type'], string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

const LD_FAMILY: Record<Asset['type'], Tone> = {
  site: 'neutral',
  area: 'neutral',
  system: 'neutral',
  compressor: 'purple',
  pump: 'blue',
  separator: 'teal',
  exchanger: 'amber',
  valve: 'pink',
  turbine: 'sky',
};

function ldCapital(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function ldCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function ldOwner(order: WorkOrder): string {
  return findPerson(order.assigneeId)?.name ?? 'Unassigned';
}

function ldReading(sensor: Sensor): string {
  return `${sensor.value.toLocaleString('en-GB', { minimumFractionDigits: sensor.decimals, maximumFractionDigits: sensor.decimals })} ${sensor.unit}`;
}

function ldSensorTone(sensor: Sensor): Tone {
  if (sensor.quality === 'bad' || sensor.value > sensor.highLimit) return 'critical';
  if (sensor.value > sensor.highLimit * 0.95 || sensor.quality === 'uncertain') return 'warning';
  return 'success';
}

function ldSensorState(sensor: Sensor): string {
  if (sensor.quality === 'bad') return 'Bad signal';
  if (sensor.value > sensor.highLimit) return 'Above limit';
  if (sensor.value > sensor.highLimit * 0.95) return 'Near limit';
  return sensor.quality === 'uncertain' ? 'Uncertain' : 'Normal';
}

function ldSensorTrend(sensor: Sensor): number[] {
  const span = sensor.rangeMax - sensor.rangeMin;
  const history = makeValues({ seed: sensor.seed, points: 24, base: sensor.value - span * 0.012, amplitude: span * 0.015, noise: span * 0.006, cycles: 1.4, decimals: sensor.decimals });
  return [...history, sensor.value];
}

function LdUser({ compact = false }: { compact?: boolean }) {
  return <PersonChip name="Magnus Solberg" initials="MS" role="Planner" tone="purple" compact={compact} />;
}

function LdSensorTrend({ sensor, height = 220, fill = false }: { sensor: Sensor; height?: number; fill?: boolean }) {
  const Chart = fill ? TrendArea : TrendLine;
  return (
    <Chart
      label={`${sensor.name} over the last 24 hours against its high limit`}
      labels={LD_HOURS}
      unit={sensor.unit}
      decimals={sensor.decimals}
      height={height}
      highlightLast
      series={[{ id: sensor.id, label: sensor.name, values: ldSensorTrend(sensor), tone: 'accent' }]}
      limits={[{ value: sensor.highLimit, label: 'High limit', tone: 'warning' }]}
    />
  );
}

function LdSeverityIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon />;
  if (severity === 'high') return <IconAlertTriangle />;
  if (severity === 'medium') return <IconInfoCircle />;
  return <IconBell />;
}

function LdAlarmRows({ alarms }: { alarms: readonly Alarm[] }) {
  return (
    <ul>
      {alarms.map((alarm) => (
        <ListRow
          key={alarm.id}
          tone={LD_SEVERITY_TONE[alarm.severity]}
          leading={
            <IconChip tone={LD_SEVERITY_TONE[alarm.severity]} size="sm">
              <LdSeverityIcon severity={alarm.severity} />
            </IconChip>
          }
          title={alarm.message}
          meta={
            <>
              <TagId>{alarm.sensorTag}</TagId>
              <span>
                {alarm.value} · limit {alarm.limit} · {LD_ALARM_STATE[alarm.state]}
              </span>
            </>
          }
          trailing={formatAgo(alarm.raisedAt)}
        />
      ))}
    </ul>
  );
}

const LD_STATUS_FILTERS = [
  { id: 'all', label: 'All', count: WORK_ORDERS.length },
  { id: 'open', label: 'Open', count: WORK_ORDERS.filter((order) => order.status === 'open').length },
  { id: 'planned', label: 'Planned', count: WORK_ORDERS.filter((order) => order.status === 'planned').length },
  { id: 'in-progress', label: 'In progress', count: WORK_ORDERS.filter((order) => order.status === 'in-progress').length },
  { id: 'waiting', label: 'Waiting', count: WORK_ORDERS.filter((order) => order.status === 'waiting').length },
  { id: 'done', label: 'Done', count: WORK_ORDERS.filter((order) => order.status === 'done').length },
];

const LD_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  {
    id: 'order',
    header: 'Work order',
    cell: (order) => (
      <div>
        <p className="font-medium text-base-foreground">{order.title}</p>
        <p className="text-sm text-medium-foreground">
          <TagId>{order.id}</TagId> · {findAsset(order.assetId)?.name}
        </p>
      </div>
    ),
  },
  { id: 'type', header: 'Type', nowrap: true, muted: true, cell: (order) => LD_TYPE_LABEL[order.type] },
  { id: 'priority', header: 'Priority', nowrap: true, cell: (order) => order.priority },
  { id: 'status', header: 'Status', nowrap: true, cell: (order) => <StatusPill tone={LD_ORDER_TONE[order.status]}>{LD_ORDER_LABEL[order.status]}</StatusPill> },
  { id: 'owner', header: 'Owner', nowrap: true, cell: (order) => ldOwner(order) },
  { id: 'due', header: 'Due', numeric: true, nowrap: true, cell: (order) => formatDate(order.dueAt) },
];

function ListDetailTable() {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const matches = WORK_ORDERS.filter((order) => (status === 'all' || order.status === status) && order.title.toLowerCase().includes(query.trim().toLowerCase()));
  const pageSize = 5;
  const shown = matches.slice((page - 1) * pageSize, page * pageSize);
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders" look="studio" tab="Work orders · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={LD_NAV}
        current="work"
        tools={<LdUser />}
        title="Work orders"
        subtitle="Every order on the plant. Filter by status or search the title."
        actions={
          <>
            <Button variant="outline" size="sm">
              <IconDownload /> Export
            </Button>
            <Button size="sm">
              <IconPlus /> New work order
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Grid columns={4}>
            <Stat label="Open and planned" value={6} icon={<IconClipboardList />} tone="accent" delta={{ value: -4, decimals: 0, good: 'down', caption: 'vs last week' }} />
            <Stat label="In progress" value={1} icon={<IconTool />} tone="teal" target="Recompressor bearing" />
            <Stat label="Overdue" value={1} icon={<IconAlertTriangle />} tone="warning" target="Export pump B test" />
            <Stat label="Done this week" value={2} icon={<IconCircleCheck />} tone="green" target="3 hours booked" />
          </Grid>
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips
              label="Filter by status"
              options={LD_STATUS_FILTERS}
              value={status}
              onChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
            />
            <div className="ml-auto w-64">
              <Input
                aria-label="Search work orders"
                placeholder="Search work orders"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <Panel padding="none" footer={<Pager page={page} pageSize={pageSize} total={matches.length} noun="work orders" onPage={setPage} />}>
            {shown.length > 0 ? (
              <DataTable
                label="Work orders"
                flush
                columns={LD_ORDER_COLUMNS}
                rows={shown}
                rowKey={(order) => order.id}
                rowTone={(order) => (order.priority === 'P1' && order.status !== 'done' ? 'critical' : undefined)}
              />
            ) : (
              <EmptyPanel title="No work orders match" description="Try another status or a shorter search." icon={<IconFilterOff />} />
            )}
          </Panel>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_TYPE_FILTERS = [
  { id: 'all', label: 'All equipment', count: LD_UNITS.length },
  { id: 'compressor', label: 'Compressors', count: LD_UNITS.filter((unit) => unit.type === 'compressor').length },
  { id: 'pump', label: 'Pumps', count: LD_UNITS.filter((unit) => unit.type === 'pump').length },
  { id: 'separator', label: 'Separators', count: LD_UNITS.filter((unit) => unit.type === 'separator').length },
];

function ListDetailCardGrid() {
  const [type, setType] = useState('all');
  const units = LD_UNITS.filter((unit) => type === 'all' || unit.type === type).slice(0, 9);
  return (
    <BrowserFrame url="nordkapp.example.test/equipment" look="soft" tab="Equipment · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={LD_NAV.slice(0, 5)}
        current="assets"
        tools={<LdUser compact />}
        title="Equipment"
        subtitle="Eleven units across four areas. Cards lead with condition; open one for its record."
        actions={<FilterChips label="Filter by type" options={LD_TYPE_FILTERS} value={type} onChange={setType} />}
      >
        <Grid>
          {units.map((unit) => (
            <Panel
              key={unit.id}
              className="col-span-4"
              tone={LD_FAMILY[unit.type]}
              title={unit.name}
              subtitle={`${unit.tag} · ${ldCapital(unit.type)}`}
              footer={
                <>
                  <StatusPill tone={LD_STATE_TONE[unit.state]}>{LD_STATE_LABEL[unit.state]}</StatusPill>
                  <span className="ml-auto">Criticality {unit.criticality}</span>
                </>
              }
            >
              <div className="flex flex-1 items-center gap-5">
                <RingGauge label={`${unit.name} health`} value={unit.healthScore} unit="" size={76} tone={LD_HEALTH_TONE[unit.health]} hideLabel />
                <div className="min-w-0">
                  <p className="text-sm text-medium-foreground">Condition</p>
                  <p className="text-xl font-semibold text-base-foreground">{LD_HEALTH_LABEL[unit.health]}</p>
                  <p className="text-sm text-medium-foreground">
                    {ldCount(sensorsOf(unit.id).length, 'instrument')} · {ldCount(WORK_ORDERS.filter((order) => order.assetId === unit.id && order.status !== 'done').length, 'open order')}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function ListDetailBulkSelect() {
  const [selected, setSelected] = useState<readonly string[]>(['WO-104466', 'WO-104458']);
  const open = WORK_ORDERS.filter((order) => order.status !== 'done');
  const toggle = (id: string, checked: boolean) => setSelected(checked ? [...selected, id] : selected.filter((entry) => entry !== id));
  const columns: DataTableColumn<WorkOrder>[] = [
    {
      id: 'select',
      header: 'Pick',
      width: 'w-14',
      cell: (order) => (
        <CheckboxItem>
          <CheckboxItemControl aria-label={`Select ${order.id}`} checked={selected.includes(order.id)} onCheckedChange={(checked) => toggle(order.id, checked === true)} />
        </CheckboxItem>
      ),
    },
    { id: 'id', header: 'Order', nowrap: true, cell: (order) => <TagId>{order.id}</TagId> },
    { id: 'title', header: 'Work order', cell: (order) => order.title },
    { id: 'priority', header: 'Priority', nowrap: true, cell: (order) => order.priority },
    { id: 'status', header: 'Status', nowrap: true, cell: (order) => <StatusPill tone={LD_ORDER_TONE[order.status]}>{LD_ORDER_LABEL[order.status]}</StatusPill> },
    { id: 'owner', header: 'Owner', nowrap: true, cell: (order) => ldOwner(order) },
    { id: 'hours', header: 'Estimate', numeric: true, nowrap: true, cell: (order) => `${order.estimatedHours} h` },
    { id: 'due', header: 'Due', numeric: true, nowrap: true, cell: (order) => formatDate(order.dueAt) },
  ];
  return (
    <BrowserFrame url="control.nordkapp.example.test/work-orders?select=2" look="console" tab="Work planning">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Work planning', mark: <IconFlame /> }}
        nav={LD_NAV.slice(0, 5)}
        current="work"
        padding="none"
        tools={
          <>
            <span>Planner · M. Solberg</span>
            <span className="font-medium tabular-nums">14:00:00 UTC</span>
          </>
        }
      >
        <Grid className="shell-grow grid-rows-[auto_auto_1fr]">
          <StatGroup columns={5} label="Backlog" className="col-span-12">
            <Stat variant="plain" size="lg" label="Open and planned" value={open.length} />
            <Stat variant="plain" size="lg" label="Unassigned" value={open.filter((order) => order.assigneeId === null).length} tone="warning" target="Assign before 16:00" />
            <Stat variant="plain" size="lg" label="Overdue" value={1} tone="critical" target="Export pump B test" />
            <Stat variant="plain" size="lg" label="Hours in backlog" value={open.reduce((sum, order) => sum + order.estimatedHours, 0)} unit="h" />
            <Stat variant="plain" size="lg" label="Selected" value={selected.length} tone="accent" target={`${open.filter((order) => selected.includes(order.id)).reduce((sum, order) => sum + order.estimatedHours, 0)} h of work`} />
          </StatGroup>
          <div className="col-span-12">
            {selected.length > 0 ? (
              <SelectionBar
                count={selected.length}
                noun={['work order', 'work orders']}
                actions={
                  <>
                    <Button size="sm" variant="secondary">
                      <IconUserPlus /> Assign
                    </Button>
                    <Button size="sm" variant="secondary">
                      Set due date
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSelected([])}>
                      Clear selection
                    </Button>
                  </>
                }
              />
            ) : (
              <div className="flex min-h-10 items-center gap-3 bg-base-background px-3.5 text-sm text-medium-foreground">
                <span>Tick rows to assign, reschedule or close several orders at once.</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => setSelected(open.map((order) => order.id))}>
                  Select all {open.length}
                </Button>
              </div>
            )}
          </div>
          <Panel className="col-span-9" title="Backlog" subtitle={`${open.length} open and planned`} padding="none">
            <DataTable
              label="Work order backlog"
              flush
              columns={columns}
              rows={open}
              rowKey={(order) => order.id}
              rowTone={(order) => (selected.includes(order.id) ? 'accent' : order.priority === 'P1' ? 'critical' : undefined)}
            />
          </Panel>
          <Panel className="col-span-3" title="Crew load" subtitle="Hours this week of 37.5">
            <div className="flex flex-col gap-4">
              <Meter label="T. Barros" value={8} max={37.5} unit="h" tone="accent" hideScale />
              <Meter label="M. Solberg" value={16} max={37.5} unit="h" tone="accent" hideScale />
              <Meter label="J. Nyberg" value={3} max={37.5} unit="h" tone="accent" hideScale />
              <Meter label="A. Khan" value={24} max={37.5} unit="h" tone="warning" hideScale />
              <Meter label="Unassigned" value={6} max={37.5} unit="h" tone="critical" hideScale />
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_VIEWS: SubNavGroup[] = [
  {
    id: 'views',
    label: 'Saved views',
    items: [
      { id: 'open', label: 'Open alarms', count: '5', tone: 'critical' },
      { id: 'shelved', label: 'Shelved this shift', count: '1' },
      { id: 'cooling', label: 'Cooling water, critical', count: '0' },
      { id: 'cleared', label: 'Cleared today', count: '1' },
    ],
  },
];

function ListDetailEmpty() {
  const [view, setView] = useState('cooling');
  const alarms =
    view === 'cooling'
      ? []
      : ALARMS.filter((alarm) => (view === 'open' ? alarm.state === 'active' || alarm.state === 'acknowledged' : view === 'shelved' ? alarm.state === 'shelved' : alarm.state === 'cleared')).slice(0, 5);
  return (
    <BrowserFrame url="nordkapp.example.test/alarms?area=NK-40&severity=critical" look="glass" tab="Alarms · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={LD_NAV}
        current="alarms"
        tools={<LdUser compact />}
        title="Alarms"
        subtitle="Saved views keep a filter one click away. An empty view says why it is empty and what to do next."
      >
        <Panes label="Alarm views" columns="17rem minmax(0, 1fr)">
          <Pane title="Views" subtitle="Shared with the control room" surface="well" padding="tight">
            <SubNav label="Saved alarm views" groups={LD_VIEWS} current={view} onSelect={setView} />
          </Pane>
          <Pane
            title={LD_VIEWS[0].items.find((item) => item.id === view)?.label ?? 'Alarms'}
            subtitle={alarms.length === 0 ? 'Area: Cooling water · Severity: Critical · Last 24 hours' : `${alarms.length} in the last 3 days`}
          >
            {alarms.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyPanel
                  title="No critical alarms on cooling water"
                  description="Nothing has crossed a trip limit in this area in the last 24 hours. The bearing temperature signal on 40-TT-40015 is shelved, not critical."
                  icon={<IconCircleCheck />}
                  action={
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setView('shelved')}>
                        Show shelved alarms
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setView('open')}>
                        Clear filters
                      </Button>
                    </div>
                  }
                />
              </div>
            ) : (
              <LdAlarmRows alarms={alarms} />
            )}
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_FIRST_STAGE = findAsset('23-ka-9101') ?? ASSETS[0];

const LD_FIRST_STAGE_SENSORS = sensorsOf('23-ka-9101');

const LD_SENSOR_COLUMNS: DataTableColumn<Sensor>[] = [
  { id: 'name', header: 'Instrument', nowrap: true, cell: (sensor) => sensor.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (sensor) => <TagId>{sensor.tag}</TagId> },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (sensor) => ldReading(sensor) },
  { id: 'limit', header: 'High limit', numeric: true, nowrap: true, muted: true, cell: (sensor) => `${sensor.highLimit.toLocaleString('en-GB')} ${sensor.unit}` },
  { id: 'state', header: 'State', nowrap: true, cell: (sensor) => <StatusPill tone={ldSensorTone(sensor)}>{ldSensorState(sensor)}</StatusPill> },
];

function ListDetailTwoColumn() {
  return (
    <BrowserFrame url="nordkapp.example.test/assets/23-KA-9101" look="studio" tab="1st stage compressor">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={LD_NAV.slice(0, 5)}
        current="assets"
        tools={<LdUser compact />}
      >
        <div className="flex flex-col gap-5">
          <Crumbs items={['Assets', 'Gas compression', LD_FIRST_STAGE.name]} />
          <SectionHeader
            size="lg"
            level={2}
            title={LD_FIRST_STAGE.name}
            description="Centrifugal compressor, first of three stages. Vibration is close to its high limit; a survey is open."
            actions={
              <>
                <StatusPill size="lg" tone={LD_STATE_TONE[LD_FIRST_STAGE.state]}>
                  {LD_STATE_LABEL[LD_FIRST_STAGE.state]}
                </StatusPill>
                <Button variant="outline" size="sm">
                  <IconPencil /> Edit
                </Button>
                <Button size="sm">
                  <IconPlus /> Work order
                </Button>
              </>
            }
          />
          <Grid>
            <Grid stack className="col-span-8">
              <Panel title="Drive-end vibration" subtitle="mm/s · last 24 hours against the high limit" icon={<IconChip tone="amber"><IconGauge /></IconChip>}>
                <LdSensorTrend sensor={LD_FIRST_STAGE_SENSORS[3]} fill />
              </Panel>
              <Panel title="Instruments" subtitle={`${LD_FIRST_STAGE_SENSORS.length} mapped time series`} padding="none">
                <DataTable
                  label="Instruments on the 1st stage compressor"
                  flush
                  columns={LD_SENSOR_COLUMNS}
                  rows={LD_FIRST_STAGE_SENSORS}
                  rowKey={(sensor) => sensor.id}
                  rowTone={(sensor) => (ldSensorTone(sensor) === 'success' ? undefined : ldSensorTone(sensor))}
                />
              </Panel>
            </Grid>
            <Grid stack className="col-span-4">
              <Panel title="Condition" tone="warning">
                <div className="flex items-center gap-5">
                  <RingGauge label="Health score" value={LD_FIRST_STAGE.healthScore} unit="" size={92} tone="warning" hideLabel />
                  <div>
                    <p className="text-2xl font-semibold text-base-foreground">Watch</p>
                    <p className="text-sm text-medium-foreground">Health 72 of 100, down 6 in a week.</p>
                  </div>
                </div>
              </Panel>
              <Panel title="Properties">
                <Properties
                  label="Asset properties"
                  items={[
                    { label: 'Tag', value: <TagId>{LD_FIRST_STAGE.tag}</TagId> },
                    { label: 'Area', value: 'Gas compression' },
                    { label: 'Criticality', value: LD_FIRST_STAGE.criticality },
                    { label: 'Manufacturer', value: 'Nordturbo AS' },
                    { label: 'Commissioned', value: 'June 2014' },
                    { label: 'Running hours', value: '71,240 h' },
                  ]}
                />
              </Panel>
              <Panel
                title="Open work"
                subtitle="1 order"
                actions={
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                }
              >
                <ul>
                  {WORK_ORDERS.filter((order) => order.assetId === LD_FIRST_STAGE.id).map((order) => (
                    <ListRow
                      key={order.id}
                      leading={
                        <IconChip size="sm" tone="blue">
                          <IconTool />
                        </IconChip>
                      }
                      title={order.title}
                      meta={
                        <>
                          <TagId>{order.id}</TagId>
                          <span>due {formatDate(order.dueAt)}</span>
                        </>
                      }
                    />
                  ))}
                </ul>
              </Panel>
            </Grid>
          </Grid>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_RECOMPRESSOR = findAsset('23-ka-9103') ?? ASSETS[0];

const LD_RECOMPRESSOR_ORDERS = WORK_ORDERS.filter((order) => ['23-ka-9103', '23-ka-9101', '23-ha-9114'].includes(order.assetId));

const LD_RECOMPRESSOR_ALARMS = ALARMS.filter((alarm) => ['23-ka-9103', '23-ka-9101'].includes(alarm.assetId));

type LdRecordTab = 'overview' | 'alarms' | 'work';

function isLdRecordTab(value: string): value is LdRecordTab {
  return value === 'overview' || value === 'alarms' || value === 'work';
}

function ListDetailTabs() {
  const [tab, setTab] = useState<LdRecordTab>('overview');
  return (
    <BrowserFrame url="nordkapp.example.test/assets/23-KA-9103" look="poster" tab="Recompressor">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        nav={LD_NAV.slice(0, 5)}
        current="assets"
        title="Recompressor is down."
        subtitle="23-KA-9103 · Gas compression · tripped on high vibration at 13:46, bearing inspection in progress."
        tools={<LdUser compact />}
      >
        <div className="flex flex-col gap-5">
          <TabStrip
            label="Record sections"
            value={tab}
            onChange={(next) => {
              if (isLdRecordTab(next)) setTab(next);
            }}
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'alarms', label: 'Alarms', count: String(LD_RECOMPRESSOR_ALARMS.length) },
              { id: 'work', label: 'Work orders', count: String(LD_RECOMPRESSOR_ORDERS.length) },
            ]}
          />
          {tab === 'overview' ? (
            <Grid>
              <Stat className="col-span-4" size="lg" tone="critical" label="Run state" value="Tripped" target="Since 13:46, 14 minutes" />
              <Stat className="col-span-4" size="lg" tone="amber" label="Health score" value={LD_RECOMPRESSOR.healthScore} unit="/ 100" target="Was 83 last week" />
              <Stat className="col-span-4" size="lg" tone="sky" label="Back in service" value="20:00" target="If the bearing pads are sound" />
              <Panel className="col-span-7" title="What we know" subtitle="From the trip log and the technician">
                <Properties
                  label="Trip facts"
                  items={[
                    { label: 'Trip cause', value: 'Drive-end vibration 11.6 mm/s' },
                    { label: 'Trip limit', value: '11.0 mm/s' },
                    { label: 'Rise before trip', value: '0.9 mm/s in 24 h' },
                    { label: 'Shaft speed', value: 'Flat at 9,840 rpm' },
                    { label: 'Export impact', value: '0.12 MSm³/d under plan' },
                  ]}
                />
              </Panel>
              <Panel className="col-span-5" title="Who is on it" subtitle="Work order WO-104482">
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <PersonChip size="lg" name="Tomás Barros" initials="TB" role="Mechanical technician · on site" tone="teal" />
                  <PersonChip size="lg" name="Aisha Khan" initials="AK" role="Rotating equipment engineer · on call" tone="pink" />
                  <Meter label="Inspection progress" value={35} max={100} unit="%" tone="teal" hideScale />
                </div>
              </Panel>
            </Grid>
          ) : null}
          {tab === 'alarms' ? (
            <Panel title="Alarms on the compression train" subtitle="Last 3 days, newest first">
              <LdAlarmRows alarms={LD_RECOMPRESSOR_ALARMS} />
            </Panel>
          ) : null}
          {tab === 'work' ? (
            <Panel title="Work orders" subtitle="On this unit and its neighbours" padding="none">
              <DataTable label="Work orders on the compression train" flush columns={LD_ORDER_COLUMNS.filter((column) => column.id !== 'type')} rows={LD_RECOMPRESSOR_ORDERS} rowKey={(order) => order.id} />
            </Panel>
          ) : null}
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_ORDER = WORK_ORDERS[0];

const LD_ORDER_HISTORY: ActivityItem[] = [
  { id: 'pads', time: '14:20', title: 'Bearing housing opened', actor: 'Tomás Barros', tone: 'info', body: 'Top pads show light scoring on the loaded side. Journal looks clean. Measuring clearance next.' },
  { id: 'loto', time: '14:05', title: 'Isolation confirmed', actor: 'Liv Wold', tone: 'success', body: 'Lock-out applied at breaker 23-EH-0103, permit PTW-2291 issued.' },
  { id: 'assign', time: '13:54', title: 'Assigned to Tomás Barros', actor: 'Magnus Solberg', tone: 'neutral' },
  { id: 'create', time: '13:52', title: 'Work order created from alarm ALM-4812', actor: 'Liv Wold', tone: 'neutral', body: 'Priority 1, corrective. Recompressor tripped on high vibration at 13:46.' },
  { id: 'alarm', time: '13:46', title: 'Recompressor tripped', actor: '23-VT-92740 at 11.6 mm/s, limit 11.0', tone: 'critical' },
];

function ListDetailActivity() {
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders/WO-104482" look="editorial" tab="WO-104482" minHeight={760}>
      <AppFrame
        brand={{ name: 'Nordkapp work' }}
        nav={[
          { id: 'record', label: 'Record' },
          { id: 'history', label: 'History', badge: '5 entries' },
          { id: 'parts', label: 'Parts' },
          { id: 'permit', label: 'Permit' },
        ]}
        current="history"
        title="Inspect recompressor drive-end bearing"
        subtitle="Work order WO-104482, priority 1, corrective. In progress with Tomás Barros and due today at 20:00."
        tools={<StatusPill tone="success">In progress</StatusPill>}
      >
        <Grid>
          <div className="col-span-8">
            <SectionHeader size="sm" level={3} title="History" description="Newest first. Every entry names who did it." />
            <Activity label="Work order history" items={LD_ORDER_HISTORY} className="mt-4" />
          </div>
          <div className="col-span-4 flex flex-col gap-6">
            <div>
              <Stat variant="plain" size="lg" label="Progress" value={LD_ORDER.progress} unit="%" target="2.8 of 8 hours booked" />
            </div>
            <Properties
              label="Work order facts"
              layout="stacked"
              items={[
                { label: 'Asset', value: 'Recompressor, 23-KA-9103' },
                { label: 'Raised by', value: 'Liv Wold, shift supervisor' },
                { label: 'Permit', value: 'PTW-2291, valid to 22:00' },
                { label: 'Due', value: 'Today, 20:00' },
              ]}
            />
            <div className="flex gap-2">
              <Button size="sm">Add an entry</Button>
              <Button size="sm" variant="outline">
                Close out
              </Button>
            </div>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function ListDetailAssetStatus() {
  const sensors = [...LD_FIRST_STAGE_SENSORS.slice(0, 4)];
  return (
    <BrowserFrame url="wall.nordkapp.example.test/assets/23-KA-9101" look="signal" tab="1st stage compressor">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="1st stage compressor"
        subtitle="23-KA-9101 · Gas compression · updated 14:00 UTC"
        status={
          <>
            <StatusPill tone="success" size="lg">
              Running
            </StatusPill>
            <StatusPill tone="warning" size="lg">
              2 high alarms
            </StatusPill>
          </>
        }
      >
        <Grid className="shell-grow grid-rows-[auto_1fr_auto]">
          <Panel className="col-span-7" tone="warning">
            <div className="flex flex-1 items-center gap-5">
              <IconAlertTriangle className="size-16 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-5xl font-extrabold tracking-tight">Watch</p>
                <p className="mt-2 text-lg">Vibration is 0.3 mm/s under its high limit and discharge temperature is above it.</p>
              </div>
            </div>
          </Panel>
          <Stat className="col-span-5" size="hero" tone="warning" label="Health score" value={LD_FIRST_STAGE.healthScore} unit="/ 100" target="Down 6 in a week" />
          {sensors.map((sensor) => (
            <Stat
              key={sensor.id}
              className="col-span-3"
              size="lg"
              tone={ldSensorTone(sensor)}
              label={sensor.name}
              value={sensor.value}
              decimals={sensor.decimals}
              unit={sensor.unit}
              state={ldSensorTone(sensor) === 'success' ? 'Normal' : 'Watch'}
              stateIcon={ldSensorTone(sensor) === 'success' ? <IconCircleCheck /> : <IconAlertTriangle />}
              target={`High limit ${sensor.highLimit} ${sensor.unit}`}
            />
          ))}
          <Panel className="col-span-12" title="Open on this unit" subtitle="Alarms and work">
            <ul className="grid grid-cols-3 gap-2">
              <ListRow tone="warning" title="Discharge temperature high" meta="146.3 °C · limit 145.0 °C" trailing="38 min ago" />
              <ListRow tone="warning" title="Drive-end vibration approaching limit" meta="6.8 mm/s · limit 7.1 mm/s" trailing="2 h ago" />
              <ListRow tone="info" title="Vibration survey" meta="WO-104466 · unassigned" trailing="due 14 Mar" />
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_ORDER_STEPS = [
  { id: 'isolate', label: 'Isolate', description: 'Done 14:05' },
  { id: 'open', label: 'Open bearing', description: 'Done 14:20' },
  { id: 'inspect', label: 'Inspect', description: 'In progress' },
  { id: 'measure', label: 'Measure' },
  { id: 'close', label: 'Close out' },
];

const LD_ORDER_CHECKS = [
  { id: 'pads', label: 'Photograph the top and bottom pads' },
  { id: 'journal', label: 'Check the journal for scoring' },
  { id: 'clearance', label: 'Measure diametral clearance at three points' },
  { id: 'probe', label: 'Check the proximity probe gap voltage' },
];

function ListDetailWorkOrder() {
  const [done, setDone] = useState<readonly string[]>(['pads']);
  const assignee = findPerson(LD_ORDER.assigneeId);
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders/WO-104482" look="soft" tab="WO-104482 · Nordkapp" minHeight={720}>
      <AppFrame
        variant="sidebar"
        brand={{ name: 'Nordkapp', detail: 'Gas plant', mark: <IconFlame /> }}
        nav={LD_NAV}
        current="work"
        tools={<LdUser />}
        title={LD_ORDER.title}
        subtitle="WO-104482 · Recompressor 23-KA-9103 · due today at 20:00"
        status={
          <StatusPill tone="success" size="lg">
            In progress
          </StatusPill>
        }
        actions={<Button size="sm">Log progress</Button>}
      >
        <Grid>
          <Panel className="col-span-12" tone="teal" title="Where it stands" subtitle="Step 3 of 5">
            <Steps label="Work order steps" items={LD_ORDER_STEPS} current={2} />
          </Panel>
          <Panel className="col-span-7" title="Inspection checklist" subtitle={`${done.length} of ${LD_ORDER_CHECKS.length} done`}>
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                {LD_ORDER_CHECKS.map((check) => (
                  <CheckboxItem key={check.id}>
                    <CheckboxItemControl checked={done.includes(check.id)} onCheckedChange={(checked) => setDone(checked ? [...done, check.id] : done.filter((id) => id !== check.id))} />
                    <CheckboxItemLabel>{check.label}</CheckboxItemLabel>
                  </CheckboxItem>
                ))}
              </div>
              <Meter label="Checklist" value={done.length} max={LD_ORDER_CHECKS.length} unit={`of ${LD_ORDER_CHECKS.length}`} tone="teal" hideScale />
            </div>
          </Panel>
          <Grid stack className="col-span-5">
            <Panel title="People" tone="purple">
              <div className="flex flex-col gap-4">
                <PersonChip name={assignee?.name ?? 'Unassigned'} initials={assignee?.initials ?? '?'} role={`${assignee?.role ?? ''} · assignee`} tone="teal" />
                <PersonChip name="Liv Wold" initials="LW" role="Shift supervisor · raised it" tone="pink" />
              </div>
            </Panel>
            <Panel title="Details">
              <Properties
                label="Work order details"
                items={[
                  { label: 'Priority', value: 'P1' },
                  { label: 'Type', value: 'Corrective' },
                  { label: 'Estimate', value: '8 h' },
                  { label: 'Permit', value: 'PTW-2291' },
                ]}
              />
            </Panel>
          </Grid>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function ListDetailMasterDetail() {
  const [selected, setSelected] = useState(WORK_ORDERS[2].id);
  const order = WORK_ORDERS.find((entry) => entry.id === selected) ?? WORK_ORDERS[0];
  const asset = findAsset(order.assetId);
  const sensor = SENSORS.find((entry) => entry.assetId === order.assetId);
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders?open=WO-104471" look="blueprint" tab="Work register">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Work register', mark: <IconFlame /> }}
        nav={LD_NAV.slice(3, 5)}
        current="work"
        tools={
          <>
            <div>
              <p className="text-xs">Sheet</p>
              <p className="text-sm font-semibold">NK-WR-012</p>
            </div>
            <div>
              <p className="text-xs">Issued</p>
              <p className="text-sm font-semibold">12 Mar 2026 14:00</p>
            </div>
          </>
        }
      >
        <Panes label="Work orders, list and record" columns="24rem minmax(0, 1fr)">
          <Pane title="Work orders" subtitle={`${WORK_ORDERS.length} on register`} padding="none">
            <PickList
              label="Work orders"
              selected={order.id}
              onSelect={setSelected}
              items={WORK_ORDERS.map((entry) => ({
                id: entry.id,
                title: entry.title,
                meta: (
                  <>
                    <TagId>{entry.id}</TagId>
                    <span>
                      {entry.priority} · due {formatDate(entry.dueAt)}
                    </span>
                  </>
                ),
                trailing: <StatusPill tone={LD_ORDER_TONE[entry.status]}>{LD_ORDER_LABEL[entry.status]}</StatusPill>,
              }))}
            />
          </Pane>
          <Pane
            title={order.title}
            subtitle={`${order.id} · ${asset?.name ?? ''}`}
            actions={<StatusPill tone={LD_ORDER_TONE[order.status]}>{LD_ORDER_LABEL[order.status]}</StatusPill>}
            footer={
              <>
                <Button size="sm">Edit work order</Button>
                <Button size="sm" variant="outline">
                  Print job card
                </Button>
              </>
            }
          >
            <Properties
              label="Work order summary"
              layout="stacked"
              columns={4}
              items={[
                { label: 'Priority', value: order.priority },
                { label: 'Type', value: LD_TYPE_LABEL[order.type] },
                { label: 'Owner', value: ldOwner(order) },
                { label: 'Due', value: formatDate(order.dueAt) },
              ]}
            />
            <Meter label={`Progress · ${order.estimatedHours} h estimated`} value={order.progress} max={100} unit="%" tone="accent" hideScale />
            <div className="grid grid-cols-2 gap-8">
              <Properties
                label="Asset"
                items={[
                  { label: 'Asset', value: asset?.name ?? '' },
                  { label: 'Tag', value: <TagId>{asset?.tag ?? ''}</TagId> },
                  { label: 'Run state', value: asset ? LD_STATE_LABEL[asset.state] : '' },
                  { label: 'Health', value: asset ? `${asset.healthScore} / 100` : '' },
                ]}
              />
              {sensor ? (
                <LdSensorTrend sensor={sensor} height={170} />
              ) : (
                <p className="text-sm text-medium-foreground">No instruments are mapped to this asset, so there is no live reading to show beside the order.</p>
              )}
            </div>
            <Activity
              label="Latest entries"
              items={[
                { id: 'status', time: '12 Mar 09:05', title: `Status set to ${LD_ORDER_LABEL[order.status].toLowerCase()}`, actor: ldOwner(order), tone: LD_ORDER_TONE[order.status] },
                { id: 'plan', time: '10 Mar 15:30', title: `Estimated at ${order.estimatedHours} hours`, actor: 'Magnus Solberg, maintenance planner', tone: 'info' },
                { id: 'raise', time: '9 Mar 11:12', title: `${LD_TYPE_LABEL[order.type]} order raised on ${asset?.name ?? 'the asset'}`, actor: 'Liv Wold, shift supervisor' },
              ]}
            />
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const LD_ALARM_COLUMNS: DataTableColumn<Alarm>[] = [
  { id: 'severity', header: 'Severity', nowrap: true, cell: (alarm) => <StatusPill tone={LD_SEVERITY_TONE[alarm.severity]}>{LD_SEVERITY_LABEL[alarm.severity]}</StatusPill> },
  { id: 'message', header: 'Alarm', cell: (alarm) => alarm.message },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (alarm) => <TagId>{alarm.sensorTag}</TagId> },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (alarm) => alarm.value },
  { id: 'state', header: 'State', nowrap: true, muted: true, cell: (alarm) => LD_ALARM_STATE[alarm.state] },
  { id: 'raised', header: 'Raised', numeric: true, nowrap: true, cell: (alarm) => formatAgo(alarm.raisedAt) },
];

function ListDetailSideSheet() {
  const [open, setOpen] = useState(true);
  const alarm = ALARMS[1];
  const sensor = SENSORS.find((entry) => entry.tag === alarm.sensorTag) ?? SENSORS[0];
  return (
    <BrowserFrame url="control.nordkapp.example.test/alarms/ALM-4811" look="console" tab="Alarm journal">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Control room 1', mark: <IconFlame /> }}
        nav={LD_NAV.slice(0, 5)}
        current="alarms"
        padding="none"
        tools={
          <>
            <span>Day shift · I. Haugen</span>
            <span className="font-medium tabular-nums">14:00:00 UTC</span>
          </>
        }
      >
        <div className="shell-grow relative flex flex-col">
          <Panel
            className="flex-1"
            title="Alarm journal"
            subtitle="8 in the last 3 days"
            padding="none"
            actions={
              open ? null : (
                <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                  Open ALM-4811
                </Button>
              )
            }
          >
            <DataTable label="Alarm journal" flush columns={LD_ALARM_COLUMNS} rows={ALARMS} rowKey={(entry) => entry.id} rowTone={(entry) => LD_SEVERITY_TONE[entry.severity]} />
          </Panel>
          {open ? (
            <SideSheet
              title={alarm.message}
              subtitle={`ALM-4811 · ${findAsset(alarm.assetId)?.name ?? ''} · raised ${formatAgo(alarm.raisedAt)}`}
              status={<StatusPill tone="warning">High</StatusPill>}
              onClose={() => setOpen(false)}
              width={460}
              footer={
                <>
                  <Button size="sm" variant="outline">
                    Shelve
                  </Button>
                  <Button size="sm">Acknowledge</Button>
                </>
              }
            >
              <StatGroup columns={2} label="Alarm reading">
                <Stat variant="plain" label="Value when raised" value={146.3} decimals={1} unit="°C" tone="warning" />
                <Stat variant="plain" label="High limit" value={145} decimals={1} unit="°C" target="Trip at 155.0" />
              </StatGroup>
              <LdSensorTrend sensor={sensor} height={170} />
              <Properties
                label="Alarm facts"
                items={[
                  { label: 'Tag', value: <TagId>{alarm.sensorTag}</TagId> },
                  { label: 'State', value: LD_ALARM_STATE[alarm.state] },
                  { label: 'Priority', value: 'High' },
                  { label: 'Suggested action', value: 'Move load to 2nd stage' },
                ]}
              />
            </SideSheet>
          ) : null}
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'list-and-detail',
  title: 'List and detail pages',
  summary:
    'Browsing a collection and reading one record: tables, card grids, bulk selection and empty lists, then detail pages, and the layouts that keep list and record on one screen. Eleven pages in eight looks.',
  guidance: {
    use: [
      'A table when rows are compared column by column; cards when each record is recognised by a picture, a gauge or a state.',
      'Keep the list in view — master-detail or a side sheet — when people work through many records in one sitting.',
      'Lead a detail page with the state and the one figure that matters, then the facts, then the history.',
    ],
    avoid: [
      'An empty list that only says "No results": say why it is empty and offer the next step.',
      'Hiding bulk actions in a menu; show them in the bar that replaces the toolbar while rows are selected.',
      'A detail page that is one long form. Group facts, readings and history into their own regions.',
    ],
  },
  source,
  sections: [
    {
      id: 'lists',
      title: 'List pages',
      description: 'A collection to scan, filter and act on.',
      specimens: [
        {
          id: 'ListDetailTable',
          title: 'Table with filters and pager',
          note: 'Pick it as the default list page: status chips, a search field and a paged table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/FilterChips.tsx', 'kit/list-and-detail/Pager.tsx', 'kit/DataTable.tsx', 'kit/AppFrame.tsx', 'kit/app-shells/BrowserFrame.tsx'],
          Component: ListDetailTable,
        },
        {
          id: 'ListDetailCardGrid',
          title: 'Card grid',
          note: 'Pick it when each record is recognised by its condition at a glance rather than compared column by column.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/FilterChips.tsx', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/StatusPill.tsx'],
          Component: ListDetailCardGrid,
        },
        {
          id: 'ListDetailBulkSelect',
          title: 'Bulk selection',
          note: 'Pick it for planners who assign, reschedule or close several records at once.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/SelectionBar.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx'],
          Component: ListDetailBulkSelect,
        },
        {
          id: 'ListDetailEmpty',
          title: 'Empty list',
          note: 'Pick it for a filtered view with no results: name the filter, say why nothing matches, offer a way out.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/EmptyPanel.tsx', 'kit/app-shells/SubNav.tsx', 'kit/app-shells/Panes.tsx', 'kit/app-shells/Pane.tsx'],
          Component: ListDetailEmpty,
        },
      ],
    },
    {
      id: 'details',
      title: 'Detail pages',
      description: 'One record: its state, its facts and what happened to it.',
      specimens: [
        {
          id: 'ListDetailTwoColumn',
          title: 'Two-column detail',
          note: 'Pick it as the default record page: readings and tables in the wide column, condition and facts in the narrow one.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/Properties.tsx', 'kit/app-shells/Crumbs.tsx', 'kit/SectionHeader.tsx', 'kit/TrendArea.tsx', 'kit/DataTable.tsx', 'kit/RingGauge.tsx'],
          Component: ListDetailTwoColumn,
        },
        {
          id: 'ListDetailTabs',
          title: 'Detail with tabs',
          note: 'Pick it when a record has several bodies of content that are rarely read together.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/TabStrip.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/app-shells/PersonChip.tsx', 'kit/Stat.tsx'],
          Component: ListDetailTabs,
        },
        {
          id: 'ListDetailActivity',
          title: 'Detail with history',
          note: 'Pick it when the story of the record matters more than its fields, such as a work order or an incident.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/Activity.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/Stat.tsx', 'kit/AppFrame.tsx'],
          Component: ListDetailActivity,
        },
      ],
    },
    {
      id: 'plant',
      title: 'Plant records',
      description: 'The two records every plant application has: a piece of equipment and a job on it.',
      specimens: [
        {
          id: 'ListDetailAssetStatus',
          title: 'Asset status page',
          note: 'Pick it for an asset shown on a wall or a tablet in the field, where state must read from a distance.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/AppFrame.tsx'],
          Component: ListDetailAssetStatus,
        },
        {
          id: 'ListDetailWorkOrder',
          title: 'Work order detail',
          note: 'Pick it for a job in progress: where it stands, what is left to do and who is on it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/form-and-settings/Steps.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/app-shells/PersonChip.tsx', 'kit/Meter.tsx'],
          Component: ListDetailWorkOrder,
        },
      ],
    },
    {
      id: 'together',
      title: 'List and record together',
      description: 'The list stays in view while one record is read.',
      specimens: [
        {
          id: 'ListDetailMasterDetail',
          title: 'Master-detail',
          note: 'Pick it when people step through records one after another and each needs more than a row can show.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/PickList.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/app-shells/Panes.tsx', 'kit/Meter.tsx', 'kit/TrendLine.tsx'],
          Component: ListDetailMasterDetail,
        },
        {
          id: 'ListDetailSideSheet',
          title: 'Detail in a side sheet',
          note: 'Pick it for a quick look at one row without losing the place in a long table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/SideSheet.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx', 'kit/TrendLine.tsx'],
          Component: ListDetailSideSheet,
        },
      ],
    },
  ],
});
