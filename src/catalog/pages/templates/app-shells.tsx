import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBolt,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconFlame,
  IconGauge,
  IconHome,
  IconInfoCircle,
  IconLayoutDashboard,
  IconPlus,
  IconRefresh,
  IconSend,
  IconSettings,
  IconSparkles,
  IconTool,
  IconTopologyStar3,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { BottomNav, type BottomNavItem } from '../../../library/kit/app-shells/BottomNav';
import { BrowserFrame } from '../../../library/kit/app-shells/BrowserFrame';
import { ChatBubble } from '../../../library/kit/app-shells/ChatBubble';
import { Crumbs } from '../../../library/kit/app-shells/Crumbs';
import { Pane } from '../../../library/kit/app-shells/Pane';
import { Panes } from '../../../library/kit/app-shells/Panes';
import { PersonChip } from '../../../library/kit/app-shells/PersonChip';
import { PhoneFrame } from '../../../library/kit/app-shells/PhoneFrame';
import { StatusBar } from '../../../library/kit/app-shells/StatusBar';
import { SubNav, type SubNavGroup } from '../../../library/kit/app-shells/SubNav';
import { TabStrip } from '../../../library/kit/app-shells/TabStrip';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut, type DonutSegment } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Activity, type ActivityItem } from '../../../library/kit/list-and-detail/Activity';
import { PickList } from '../../../library/kit/list-and-detail/PickList';
import { Properties } from '../../../library/kit/list-and-detail/Properties';
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
  PEOPLE,
  PLANT_KPIS,
  SENSORS,
  WORK_ORDERS,
  childrenOf,
  findAsset,
  findPerson,
  sensorsOf,
  type Alarm,
  type Asset,
  type Sensor,
  type WorkOrder,
} from '../../data/plant';
import { formatAgo, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './app-shells.tsx?raw';

const SHELLS_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const SHELLS_PHONE_NAV: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: <IconHome aria-hidden="true" /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell aria-hidden="true" />, badge: '4' },
  { id: 'work', label: 'Work', icon: <IconClipboardList aria-hidden="true" /> },
  { id: 'me', label: 'Me', icon: <IconUser aria-hidden="true" /> },
];

const SHELLS_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');

const SHELLS_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const SHELLS_AREAS = childrenOf('nk');

const SHELLS_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const SHELLS_EXPORT_VALUES = [...SHELLS_EXPORT.slice(0, -1).map((point) => point.v), PLANT_KPIS.gasExport.value];

const SHELLS_EXPORT_YESTERDAY = makeValues({ seed: 32, points: 25, base: 4.24, amplitude: 0.1, noise: 0.03, cycles: 1.1, decimals: 2 });

const SHELLS_HOURS = SHELLS_EXPORT.map((point) => formatTime(point.t));

const SHELLS_SEVERITY_TONE: Record<Alarm['severity'], Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const SHELLS_SEVERITY_LABEL: Record<Alarm['severity'], string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const SHELLS_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const SHELLS_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const SHELLS_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const SHELLS_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const SHELLS_ORDER_TONE: Record<WorkOrder['status'], Tone> = {
  open: 'neutral',
  planned: 'info',
  'in-progress': 'success',
  waiting: 'warning',
  done: 'neutral',
};

const SHELLS_ORDER_LABEL: Record<WorkOrder['status'], string> = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
};

const SHELLS_ORDER_MIX: DonutSegment[] = [
  { label: 'Corrective', value: SHELLS_OPEN_ORDERS.filter((order) => order.type === 'corrective').length, tone: 'pink' },
  { label: 'Preventive', value: SHELLS_OPEN_ORDERS.filter((order) => order.type === 'preventive').length, tone: 'blue' },
  { label: 'Inspection', value: SHELLS_OPEN_ORDERS.filter((order) => order.type === 'inspection').length, tone: 'teal' },
  { label: 'Modification', value: SHELLS_OPEN_ORDERS.filter((order) => order.type === 'modification').length, tone: 'amber' },
];

const SHELLS_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  { id: 'order', header: 'Work order', cell: (order) => order.title },
  { id: 'priority', header: 'Priority', nowrap: true, cell: (order) => order.priority },
  { id: 'status', header: 'Status', nowrap: true, cell: (order) => <StatusPill tone={SHELLS_ORDER_TONE[order.status]}>{SHELLS_ORDER_LABEL[order.status]}</StatusPill> },
  { id: 'due', header: 'Due', numeric: true, cell: (order) => formatDate(order.dueAt) },
];

const SHELLS_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', nowrap: true, cell: (unit) => unit.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (unit) => <TagId>{unit.tag}</TagId> },
  { id: 'state', header: 'State', nowrap: true, cell: (unit) => <StatusPill tone={SHELLS_STATE_TONE[unit.state]}>{SHELLS_STATE_LABEL[unit.state]}</StatusPill> },
  { id: 'health', header: 'Health', numeric: true, cell: (unit) => `${unit.healthScore} %` },
];

function ShellsSeverityIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon />;
  if (severity === 'high') return <IconAlertTriangle />;
  if (severity === 'medium') return <IconInfoCircle />;
  return <IconBell />;
}

function ShellsUser({ compact = false }: { compact?: boolean }) {
  return <PersonChip name="Ingrid Haugen" initials="IH" role="Day shift" tone="teal" compact={compact} />;
}

function ShellsAlarmRows({ limit = 4, pills = false, compact = false }: { limit?: number; pills?: boolean; compact?: boolean }) {
  return (
    <ul>
      {SHELLS_OPEN_ALARMS.slice(0, limit).map((alarm) => (
        <ListRow
          key={alarm.id}
          tone={SHELLS_SEVERITY_TONE[alarm.severity]}
          leading={
            pills ? (
              <StatusPill tone={SHELLS_SEVERITY_TONE[alarm.severity]}>{SHELLS_SEVERITY_LABEL[alarm.severity]}</StatusPill>
            ) : (
              <IconChip tone={SHELLS_SEVERITY_TONE[alarm.severity]} size="sm">
                <ShellsSeverityIcon severity={alarm.severity} />
              </IconChip>
            )
          }
          title={alarm.message}
          meta={
            <>
              <TagId>{alarm.sensorTag}</TagId>
              <span>{compact ? formatAgo(alarm.raisedAt) : `${alarm.value} · limit ${alarm.limit}`}</span>
            </>
          }
          trailing={compact ? undefined : formatAgo(alarm.raisedAt)}
        />
      ))}
    </ul>
  );
}

function ShellsOrderRows({ limit = 4 }: { limit?: number }) {
  return (
    <ul>
      {SHELLS_OPEN_ORDERS.slice(0, limit).map((order) => (
        <ListRow
          key={order.id}
          title={order.title}
          meta={
            <>
              <TagId>{order.id}</TagId>
              <span>
                {findPerson(order.assigneeId)?.name ?? 'Unassigned'} · due {formatDate(order.dueAt)}
              </span>
            </>
          }
          trailing={<StatusPill tone={SHELLS_ORDER_TONE[order.status]}>{SHELLS_ORDER_LABEL[order.status]}</StatusPill>}
        />
      ))}
    </ul>
  );
}

function ShellsExportTrend({ height = 240, fill = true }: { height?: number; fill?: boolean }) {
  const Chart = fill ? TrendArea : TrendLine;
  return (
    <Chart
      label="Gas export over the last 24 hours against the daily plan and yesterday"
      labels={SHELLS_HOURS}
      unit="MSm³/d"
      decimals={2}
      height={height}
      highlightLast
      series={[
        { id: 'today', label: 'Today', values: SHELLS_EXPORT_VALUES, tone: 'accent' },
        { id: 'yesterday', label: 'Yesterday', values: SHELLS_EXPORT_YESTERDAY, tone: 'neutral', dashed: true },
      ]}
      limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
    />
  );
}

function shellsSensorTone(sensor: Sensor): Tone {
  if (sensor.quality === 'bad') return 'critical';
  if (sensor.value > sensor.highLimit) return 'critical';
  if (sensor.value > sensor.highLimit * 0.95 || sensor.quality === 'uncertain') return 'warning';
  return 'success';
}

function shellsSensorState(sensor: Sensor): string {
  if (sensor.quality === 'bad') return 'Bad signal';
  if (sensor.value > sensor.highLimit) return 'Above limit';
  if (sensor.value > sensor.highLimit * 0.95) return 'Near limit';
  if (sensor.quality === 'uncertain') return 'Uncertain';
  return 'Normal';
}

function shellsSensorTrend(sensor: Sensor): number[] {
  const span = sensor.rangeMax - sensor.rangeMin;
  const history = makeValues({ seed: sensor.seed, points: 24, base: sensor.value - span * 0.012, amplitude: span * 0.015, noise: span * 0.006, cycles: 1.4, decimals: sensor.decimals });
  return [...history, sensor.value];
}

function ShellsSensorMeter({ sensor }: { sensor: Sensor }) {
  return (
    <Meter
      label={sensor.name}
      value={sensor.value}
      min={sensor.rangeMin}
      max={sensor.rangeMax}
      unit={sensor.unit}
      decimals={sensor.decimals}
      high={sensor.highLimit}
      target={{ value: sensor.highLimit, label: 'High limit' }}
      tone={shellsSensorTone(sensor) === 'success' ? 'accent' : shellsSensorTone(sensor)}
    />
  );
}

function AppShellsSidebar() {
  const [current, setCurrent] = useState('work');
  return (
    <BrowserFrame url="nordkapp.example.test/work-orders" look="studio" tab="Work orders · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={SHELLS_NAV}
        current={current}
        onNavigate={setCurrent}
        tools={<ShellsUser />}
        title="Work orders"
        subtitle="6 open and planned · 1 overdue · 37 hours booked this week"
        actions={
          <>
            <Button variant="outline" size="sm">
              <IconRefresh /> Refresh
            </Button>
            <Button size="sm">
              <IconPlus /> New work order
            </Button>
          </>
        }
      >
        <Grid>
          <Stat className="col-span-3" label="Open" value={6} icon={<IconClipboardList />} tone="accent" emphasis="strong" delta={{ value: -4, decimals: 0, good: 'down', caption: 'vs last week' }} />
          <Stat className="col-span-3" label="In progress" value={1} icon={<IconTool />} tone="teal" target="Recompressor bearing" />
          <Stat className="col-span-3" label="Overdue" value={1} icon={<IconAlertTriangle />} tone="warning" target="Export pump B test" />
          <Stat className="col-span-3" label="Hours booked" value={37} unit="h" icon={<IconBolt />} tone="purple" delta={{ value: 5, decimals: 0, good: 'none', caption: 'vs plan' }} />

          <Panel className="col-span-8" title="Open and planned" subtitle="By priority, then due date" padding="none">
            <DataTable
              label="Open and planned work orders"
              flush
              columns={SHELLS_ORDER_COLUMNS}
              rows={SHELLS_OPEN_ORDERS}
              rowKey={(order) => order.id}
              rowTone={(order) => (order.priority === 'P1' ? 'critical' : undefined)}
            />
          </Panel>
          <Grid stack className="col-span-4">
            <Panel title="Order mix" subtitle="Open, by type">
              <Donut label="Open work orders by type" segments={SHELLS_ORDER_MIX} centerCaption="open" size={112} legend="right" className="w-full" />
            </Panel>
            <Panel title="Hours by owner" subtitle="Booked this week">
              <Bars
                label="Hours booked this week by owner"
                orientation="horizontal"
                categories={['T. Barros', 'M. Solberg', 'J. Nyberg', 'A. Khan']}
                series={[{ id: 'hours', label: 'Hours', values: [8, 16, 3, 10], tone: 'accent' }]}
                unit="h"
                showValues
                height={150}
              />
            </Panel>
          </Grid>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

/** "11.6 mm/s" → "11.6": the figure of a formatted reading. */
function shellsFigure(reading: string): string {
  return reading.split(' ')[0];
}

/** "11.6 mm/s" → "mm/s": the unit of a formatted reading. */
function shellsUnit(reading: string): string {
  return reading.split(' ').slice(1).join(' ');
}

function AppShellsConsoleStatusBar() {
  const [selected, setSelected] = useState(ALARMS[0].id);
  const alarm = ALARMS.find((entry) => entry.id === selected) ?? ALARMS[0];
  const asset = findAsset(alarm.assetId);
  return (
    <BrowserFrame url="control.nordkapp.example.test/alarms" look="console" tab="Control room 1">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Control room 1', mark: <IconFlame /> }}
        nav={SHELLS_NAV.slice(0, 4)}
        current="alarms"
        padding="none"
        tools={<span className="font-medium tabular-nums">14:00:00 UTC</span>}
      >
        <Panes label="Alarm console" columns="23rem minmax(0, 1fr)">
          <Pane title="Alarms" subtitle="8 in 3 days · 5 open" padding="none">
            <PickList
              label="Alarms"
              selected={selected}
              onSelect={setSelected}
              items={ALARMS.map((entry) => ({
                id: entry.id,
                title: entry.message,
                tone: SHELLS_SEVERITY_TONE[entry.severity],
                leading: <StatusPill tone={SHELLS_SEVERITY_TONE[entry.severity]}>{SHELLS_SEVERITY_LABEL[entry.severity]}</StatusPill>,
                meta: (
                  <>
                    <TagId>{entry.sensorTag}</TagId>
                    <span>{entry.value}</span>
                  </>
                ),
                trailing: formatAgo(entry.raisedAt),
              }))}
            />
          </Pane>
          <Pane surface="canvas" padding="none">
            <Grid className="flex-1 grid-rows-[auto_auto_1fr]">
              <div className="col-span-12 flex items-center gap-4 bg-base-background px-3.5 py-3">
                <StatusPill size="lg" tone={SHELLS_SEVERITY_TONE[alarm.severity]}>
                  {SHELLS_SEVERITY_LABEL[alarm.severity]}
                </StatusPill>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-base-foreground">{alarm.message}</p>
                  <p className="text-sm text-medium-foreground">
                    {asset?.name} · <TagId>{alarm.sensorTag}</TagId> · raised {formatAgo(alarm.raisedAt)}
                  </p>
                </div>
                <Button size="sm">Acknowledge</Button>
                <Button size="sm" variant="outline">
                  Shelve
                </Button>
              </div>
              <StatGroup columns={4} label="Alarm reading" className="col-span-12">
                <Stat variant="plain" size="lg" label="Value" value={shellsFigure(alarm.value)} unit={shellsUnit(alarm.value)} tone={SHELLS_SEVERITY_TONE[alarm.severity]} />
                <Stat variant="plain" size="lg" label="Limit" value={shellsFigure(alarm.limit)} unit={shellsUnit(alarm.limit)} />
                <Stat variant="plain" size="lg" label="Asset health" value={asset?.healthScore ?? 0} unit="%" tone={asset ? SHELLS_HEALTH_TONE[asset.health] : 'neutral'} />
                <Stat variant="plain" size="lg" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" target="Plan 4.50" />
              </StatGroup>
              <Panel className="col-span-7" title="Gas export" subtitle="MSm³/d · last 24 h · plan 4.50">
                <ShellsExportTrend height={230} fill={false} />
              </Panel>
              <Panel className="col-span-5" title="Equipment" subtitle="Gas compression" padding="none">
                <DataTable
                  label="Gas compression equipment"
                  flush
                  columns={SHELLS_UNIT_COLUMNS.filter((column) => column.id !== 'tag')}
                  rows={childrenOf('nk-23')}
                  rowKey={(unit) => unit.id}
                  rowTone={(unit) => (unit.state === 'running' ? undefined : SHELLS_STATE_TONE[unit.state])}
                />
              </Panel>
            </Grid>
          </Pane>
        </Panes>
        <StatusBar
          label="System status"
          items={[
            { id: 'plant', label: 'Reduced capacity', tone: 'warning' },
            { id: 'critical', label: '1 critical', tone: 'critical' },
            { id: 'historian', label: 'Historian', value: 'Connected', tone: 'neutral' },
            { id: 'lag', label: 'Data lag', value: '2 s' },
          ]}
          end={[
            { id: 'operator', label: 'Day shift', value: 'I. Haugen' },
            { id: 'station', label: 'Station', value: 'CR1-A' },
          ]}
        />
      </AppFrame>
    </BrowserFrame>
  );
}

function AppShellsIconRail() {
  const [current, setCurrent] = useState('trends');
  const train = SENSORS.filter((sensor) => ['pt-92531', 'tt-92532', 'vt-92540'].includes(sensor.id));
  return (
    <BrowserFrame url="nordkapp.example.test/trends/compression" look="glass" tab="Compression · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={SHELLS_NAV}
        current={current}
        onNavigate={setCurrent}
        tools={<ShellsUser compact />}
        title="Gas compression"
        subtitle="Three stages · live from the historian · updated 14:00 UTC"
        status={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Two of three stages
          </StatusPill>
        }
      >
        <Grid>
          <Panel className="col-span-8" tone="accent" title="Gas export" subtitle="MSm³/d against the daily plan">
            <ShellsExportTrend height={260} />
          </Panel>
          <Panel className="col-span-4" title="Stage health" subtitle="Condition score">
            <div className="grid flex-1 grid-cols-2 place-items-center gap-4">
              {childrenOf('nk-23')
                .slice(0, 4)
                .map((unit) => (
                  <RingGauge key={unit.id} label={unit.name} value={unit.healthScore} unit="" size={84} tone={SHELLS_HEALTH_TONE[unit.health]} />
                ))}
            </div>
          </Panel>
          <Panel className="col-span-5" title="1st stage compressor" subtitle="Live against high limits">
            <div className="flex flex-1 flex-col justify-between gap-4">
              {train.map((sensor) => (
                <ShellsSensorMeter key={sensor.id} sensor={sensor} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-7" title="Open alarms" subtitle="Most severe first">
            <ShellsAlarmRows limit={3} />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function AppShellsTopbarCentred() {
  const [current, setCurrent] = useState('overview');
  return (
    <BrowserFrame url="nordkapp.example.test/home" look="soft" tab="Home · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={SHELLS_NAV.slice(0, 5)}
        current={current}
        onNavigate={setCurrent}
        tools={<ShellsUser compact />}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <SectionHeader
            size="lg"
            level={2}
            eyebrow="Thursday 12 March"
            title="Good afternoon, Ingrid"
            description="The plant is at reduced capacity while the recompressor is inspected. Three things need you before the shift ends."
          />
          <Grid columns={3}>
            <Stat label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" tone="purple" icon={<IconFlame />} sparkline={SHELLS_EXPORT_VALUES} />
            <Stat label="Open alarms" value={4} tone="pink" icon={<IconBell />} delta={{ value: -3, decimals: 0, good: 'down', caption: 'vs yesterday' }} />
            <Stat label="Your work orders" value={2} tone="teal" icon={<IconClipboardList />} target="1 due today" />
          </Grid>
          <Panel title="Needs attention" subtitle="Open alarms on your areas, most severe first">
            <ShellsAlarmRows limit={3} />
          </Panel>
          <Panel
            title="Work in hand"
            subtitle="Open and planned, by due date"
            actions={
              <Button variant="ghost" size="sm">
                Open planner
              </Button>
            }
          >
            <ShellsOrderRows limit={3} />
          </Panel>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const SHELLS_WEEK_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

const SHELLS_PERIODS = {
  day: { title: 'Today', hero: 4.38, heroNote: '0.12 under the 4.50 plan', categories: ['02:00', '06:00', '10:00', '14:00'], values: [4.21, 4.29, 4.46, 4.38], availability: 96.4, alarms: 4 },
  week: { title: 'This week', hero: 4.43, heroNote: '0.07 under plan on average', categories: SHELLS_WEEK_DAYS, values: [4.52, 4.49, 4.55, 4.47, 4.41, 4.21, 4.38], availability: 97.0, alarms: 31 },
  month: { title: 'March', hero: 4.47, heroNote: '0.03 under plan on average', categories: ['Week 10', 'Week 11', 'Week 12'], values: [4.51, 4.48, 4.43], availability: 97.3, alarms: 96 },
} as const;

type ShellsPeriod = keyof typeof SHELLS_PERIODS;

function isShellsPeriod(value: string): value is ShellsPeriod {
  return value in SHELLS_PERIODS;
}

function AppShellsMastheadTabs() {
  const [period, setPeriod] = useState<ShellsPeriod>('week');
  const data = SHELLS_PERIODS[period];
  return (
    <BrowserFrame url="nordkapp.example.test/review" look="poster" tab="Production review">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        nav={SHELLS_NAV.slice(0, 5)}
        current="overview"
        title="Production review"
        subtitle="Nordkapp gas processing. Pick the period; every figure on the page follows it."
        tools={<ShellsUser compact />}
      >
        <div className="flex flex-col gap-5">
          <TabStrip
            label="Review period"
            value={period}
            onChange={(next) => {
              if (isShellsPeriod(next)) setPeriod(next);
            }}
            items={[
              { id: 'day', label: 'Today' },
              { id: 'week', label: 'This week' },
              { id: 'month', label: 'March' },
            ]}
          />
          <Grid>
            <Stat className="col-span-5 row-span-2" size="hero" tone="pink" label={`Gas export · ${data.title.toLowerCase()}`} value={data.hero} decimals={2} unit="MSm³/d" target={data.heroNote} />
            <Stat className="col-span-4" size="lg" tone="amber" label="Availability" value={data.availability} decimals={1} unit="%" target="Target 97.5" />
            <Stat className="col-span-3" size="lg" tone="critical" label="Alarms raised" value={data.alarms} target={period === 'day' ? '7 yesterday' : 'All areas'} />
            <Panel className="col-span-7" title="Export by period" subtitle="MSm³ per day against the 4.50 plan">
              <Bars
                label={`Gas export, ${data.title.toLowerCase()}, against the daily plan`}
                categories={data.categories}
                series={[{ id: 'export', label: 'Export', values: data.values, tone: 'blue' }]}
                tones={data.values.map((value) => (value < 4.4 ? 'pink' : 'blue'))}
                decimals={2}
                limit={{ value: 4.5, label: 'Plan' }}
                showValues
                height={210}
              />
            </Panel>
          </Grid>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

const SHELLS_AREA_GROUPS: SubNavGroup[] = [
  {
    id: 'areas',
    label: 'Nordkapp plant',
    items: SHELLS_AREAS.map((area) => ({
      id: area.id,
      label: area.name,
      hint: area.tag,
      count: String(childrenOf(area.id).length),
      tone: area.health === 'good' ? 'neutral' : SHELLS_HEALTH_TONE[area.health],
    })),
  },
];

function AppShellsThreePanel() {
  const [areaId, setAreaId] = useState('nk-23');
  const units = childrenOf(areaId);
  const [unitId, setUnitId] = useState('23-ka-9101');
  const unit = units.find((entry) => entry.id === unitId) ?? units[0];
  const sensors = sensorsOf(unit.id).slice(0, 3);
  return (
    <BrowserFrame url="nordkapp.example.test/assets/23-KA-9101" look="blueprint" tab="Asset register">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Asset register', mark: <IconFlame /> }}
        nav={SHELLS_NAV.slice(2, 5)}
        current="assets"
        tools={
          <>
            <div>
              <p className="text-xs">Sheet</p>
              <p className="text-sm font-semibold">NK-AR-023</p>
            </div>
            <div>
              <p className="text-xs">Revision</p>
              <p className="text-sm font-semibold">C · 12 Mar 2026</p>
            </div>
          </>
        }
      >
        <Panes label="Asset browser" columns="15rem 19rem minmax(0, 1fr)">
          <Pane title="Areas" subtitle="4 areas" surface="well" padding="tight">
            <SubNav
              label="Plant areas"
              groups={SHELLS_AREA_GROUPS}
              current={areaId}
              onSelect={(next) => {
                setAreaId(next);
                setUnitId(childrenOf(next)[0]?.id ?? '');
              }}
            />
          </Pane>
          <Pane title="Equipment" subtitle={`${units.length} units`} padding="none">
            <PickList
              label="Equipment"
              selected={unit.id}
              onSelect={setUnitId}
              items={units.map((entry) => ({
                id: entry.id,
                title: entry.name,
                meta: <TagId>{entry.tag}</TagId>,
                trailing: <StatusPill tone={SHELLS_STATE_TONE[entry.state]}>{SHELLS_STATE_LABEL[entry.state]}</StatusPill>,
              }))}
            />
          </Pane>
          <Pane
            title={unit.name}
            subtitle={unit.tag}
            actions={<StatusPill tone={SHELLS_HEALTH_TONE[unit.health]}>{SHELLS_HEALTH_LABEL[unit.health]}</StatusPill>}
            footer={
              <>
                <Button size="sm">Create work order</Button>
                <Button size="sm" variant="outline">
                  Open trend
                </Button>
              </>
            }
          >
            <Properties
              label={`${unit.name} properties`}
              layout="stacked"
              columns={4}
              items={[
                { label: 'Type', value: unit.type.charAt(0).toUpperCase() + unit.type.slice(1) },
                { label: 'Criticality', value: unit.criticality },
                { label: 'Run state', value: SHELLS_STATE_LABEL[unit.state] },
                { label: 'Health score', value: `${unit.healthScore} / 100` },
              ]}
            />
            {sensors.length > 0 ? (
              <>
                <TrendLine
                  label={`${sensors[0].name} over the last 24 hours against its high limit`}
                  labels={SHELLS_HOURS}
                  unit={sensors[0].unit}
                  decimals={sensors[0].decimals}
                  height={190}
                  highlightLast
                  series={[{ id: sensors[0].id, label: sensors[0].name, values: shellsSensorTrend(sensors[0]), tone: 'accent' }]}
                  limits={[{ value: sensors[0].highLimit, label: 'High limit', tone: 'warning' }]}
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {sensors.slice(0, 2).map((sensor) => (
                    <ShellsSensorMeter key={sensor.id} sensor={sensor} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-medium-foreground">No instruments are mapped to this unit yet. Map time series in the asset register to see live readings here.</p>
            )}
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const SHELLS_HANDOVER_LOG: ActivityItem[] = [
  { id: 'order', time: '13:52', title: 'Work order WO-104482 raised', actor: 'Liv Wold', tone: 'info', body: 'Drive-end bearing inspection, priority 1, assigned to Tomás Barros.' },
  { id: 'trip', time: '13:46', title: 'Recompressor tripped on high vibration', actor: 'Automatic trip · 23-VT-92740 at 11.6 mm/s', tone: 'critical', body: 'Export dropped to 4.21 MSm³/d and recovered to 4.38 on two stages.' },
  { id: 'temp', time: '13:22', title: 'Discharge temperature high on 1st stage', actor: '23-TT-92532 at 146.3 °C', tone: 'warning', body: 'Load moved to the 2nd stage; temperature is falling again.' },
  { id: 'cooler', time: '09:05', title: 'Interstage cooler outlet running warm', actor: 'Magnus Solberg', tone: 'warning', body: 'Tube bundle cleaning is waiting for scaffolding, WO-104471.' },
  { id: 'start', time: '06:00', title: 'Day shift took over', actor: 'Ingrid Haugen', tone: 'success' },
];

const SHELLS_HANDOVER_CHECKS = [
  { id: 'alarms', label: 'Open alarms reviewed with the outgoing operator' },
  { id: 'permits', label: 'Active work permits checked against the board' },
  { id: 'recompressor', label: 'Recompressor isolation confirmed in the field' },
  { id: 'export', label: 'Export nomination adjusted for two-stage running' },
  { id: 'log', label: 'Shift log read back and signed' },
];

function AppShellsSplitScreen() {
  const [done, setDone] = useState<readonly string[]>(['alarms', 'permits']);
  return (
    <BrowserFrame url="nordkapp.example.test/handover/2026-03-12-day" look="editorial" tab="Shift handover">
      <AppFrame
        brand={{ name: 'Nordkapp handover' }}
        nav={[
          { id: 'handover', label: 'Handover' },
          { id: 'log', label: 'Shift log' },
          { id: 'permits', label: 'Permits', badge: '3 active' },
        ]}
        current="handover"
        title="Day shift hands over at reduced capacity."
        subtitle="Thursday 12 March 2026, 14:00 UTC. The left column is what happened; the right column is what the night shift confirms before taking the desk."
        tools={<span className="text-sm text-medium-foreground">{done.length} of 5 confirmed</span>}
      >
        <Panes label="Shift handover" columns="minmax(0, 1fr) minmax(0, 1fr)">
          <Pane title="Outgoing: day shift" subtitle="Ingrid Haugen, control room operator">
            <Activity label="Day shift log" items={SHELLS_HANDOVER_LOG} />
          </Pane>
          <Pane
            title="Incoming: night shift"
            subtitle="Liv Wold, shift supervisor"
            footer={
              <>
                <Button disabled={done.length < SHELLS_HANDOVER_CHECKS.length}>Accept handover</Button>
                <span className="text-sm text-medium-foreground">
                  {done.length < SHELLS_HANDOVER_CHECKS.length ? `Confirm the remaining ${SHELLS_HANDOVER_CHECKS.length - done.length} to accept.` : 'Everything is confirmed.'}
                </span>
              </>
            }
          >
            <StatGroup columns={3} label="Plant at handover">
              <Stat variant="plain" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" />
              <Stat variant="plain" label="Open alarms" value={5} />
              <Stat variant="plain" label="Active permits" value={3} />
            </StatGroup>
            <div className="flex flex-col gap-3">
              {SHELLS_HANDOVER_CHECKS.map((check) => (
                <CheckboxItem key={check.id}>
                  <CheckboxItemControl
                    checked={done.includes(check.id)}
                    onCheckedChange={(checked) => setDone(checked ? [...done, check.id] : done.filter((id) => id !== check.id))}
                  />
                  <CheckboxItemLabel>{check.label}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </div>
            <Properties
              label="Standing instructions"
              items={[
                { label: 'Export nomination', value: '4.40 MSm³/d until 06:00' },
                { label: 'Recompressor', value: 'Isolated, do not restart' },
                { label: 'Flaring limit', value: '15.0 kSm³/d' },
                { label: 'On call', value: 'Aisha Khan, rotating equipment' },
              ]}
            />
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

const SHELLS_INSPECTOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101' || sensor.assetId === '23-ha-9114');

function AppShellsInspector() {
  const [selected, setSelected] = useState('vt-92540');
  const sensor = SHELLS_INSPECTOR_SENSORS.find((entry) => entry.id === selected) ?? SHELLS_INSPECTOR_SENSORS[0];
  const tone = shellsSensorTone(sensor);
  return (
    <BrowserFrame url="nordkapp.example.test/instruments?asset=23-KA-9101" look="studio" tab="Instruments · Nordkapp">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={SHELLS_NAV.slice(0, 5)}
        current="assets"
        tools={<ShellsUser compact />}
        padding="none"
      >
        <Panes label="Instruments with inspector" columns="minmax(0, 1fr) 23rem">
          <Pane surface="canvas">
            <Crumbs items={['Nordkapp', 'Gas compression', '1st stage compressor', 'Instruments']} />
            <SectionHeader level={2} title="Instruments" description="Select a row to inspect it. The inspector stays open while you move through the list." />
            <Panel padding="none">
              <PickList
                label="Instruments"
                selected={sensor.id}
                onSelect={setSelected}
                items={SHELLS_INSPECTOR_SENSORS.map((entry) => ({
                  id: entry.id,
                  title: entry.name,
                  tone: shellsSensorTone(entry) === 'success' ? 'neutral' : shellsSensorTone(entry),
                  leading: (
                    <IconChip size="sm" tone={shellsSensorTone(entry) === 'success' ? 'blue' : shellsSensorTone(entry)}>
                      <IconGauge />
                    </IconChip>
                  ),
                  meta: <TagId>{entry.tag}</TagId>,
                  trailing: (
                    <>
                      <span className="text-sm font-semibold text-base-foreground">
                        {entry.value.toLocaleString('en-GB', { minimumFractionDigits: entry.decimals, maximumFractionDigits: entry.decimals })} {entry.unit}
                      </span>
                      <StatusPill tone={shellsSensorTone(entry)}>{shellsSensorState(entry)}</StatusPill>
                    </>
                  ),
                }))}
              />
            </Panel>
          </Pane>
          <Pane
            title="Inspector"
            subtitle={sensor.tag}
            surface="well"
            footer={
              <>
                <Button size="sm">Open trend</Button>
                <Button size="sm" variant="outline">
                  Edit limits
                </Button>
              </>
            }
          >
            <div>
              <Stat variant="plain" size="lg" label={`${shellsSensorState(sensor)} · updated 14:00`} value={sensor.value} decimals={sensor.decimals} unit={sensor.unit} tone={tone} sparkline={shellsSensorTrend(sensor)} />
            </div>
            <ShellsSensorMeter sensor={sensor} />
            <Properties
              label={`${sensor.name} properties`}
              items={[
                { label: 'Asset', value: findAsset(sensor.assetId)?.name ?? '' },
                { label: 'Low limit', value: `${sensor.lowLimit} ${sensor.unit}` },
                { label: 'High limit', value: `${sensor.highLimit} ${sensor.unit}` },
                { label: 'Trip limit', value: sensor.highHighLimit ? `${sensor.highHighLimit} ${sensor.unit}` : 'None' },
                { label: 'Signal quality', value: sensor.quality.charAt(0).toUpperCase() + sensor.quality.slice(1) },
              ]}
            />
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

type ShellsMessage = { id: string; from: 'assistant' | 'user'; text: string; time: string };

const SHELLS_THREAD: ShellsMessage[] = [
  { id: 'q1', from: 'user', text: 'Why did the recompressor trip?', time: '13:58' },
  { id: 'a1', from: 'assistant', text: 'Drive-end vibration on 23-VT-92740 reached 11.6 mm/s at 13:46, above the 11.0 mm/s trip limit. It had risen 0.9 mm/s over 24 hours while shaft speed stayed flat, which points at the bearing rather than load.', time: '13:58' },
  { id: 'q2', from: 'user', text: 'Is anyone on it?', time: '13:59' },
  { id: 'a2', from: 'assistant', text: 'Yes. WO-104482, inspect the drive-end bearing, is in progress with Tomás Barros and due at 20:00.', time: '13:59' },
];

const SHELLS_REPLY = 'Export is holding at 4.38 MSm³/d on two stages, 0.12 under plan. Flaring is 12.4 kSm³/d, inside the 15.0 limit.';

function AppShellsAssistant() {
  const [thread, setThread] = useState<readonly ShellsMessage[]>(SHELLS_THREAD);
  const [draft, setDraft] = useState('What does it cost us in export?');
  const send = () => {
    if (draft.trim() === '') return;
    const turn = thread.length;
    setThread([...thread, { id: `q${turn}`, from: 'user', text: draft.trim(), time: '14:00' }, { id: `a${turn}`, from: 'assistant', text: SHELLS_REPLY, time: '14:00' }]);
    setDraft('');
  };
  return (
    <BrowserFrame url="nordkapp.example.test/overview?assistant=open" look="soft" tab="Overview · Nordkapp" minHeight={720}>
      <AppFrame variant="sidebar" brand={{ name: 'Nordkapp', detail: 'Gas plant', mark: <IconFlame /> }} nav={SHELLS_NAV} current="overview" tools={<ShellsUser />}>
        <Panes label="Overview with assistant" columns="minmax(0, 1fr) 21rem">
          <Pane title="Gas export" subtitle="Last 24 hours against the daily plan">
            <div>
              <Stat
                variant="plain"
                size="lg"
                label="Gas export now"
                value={PLANT_KPIS.gasExport.value}
                decimals={2}
                unit="MSm³/d"
                delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'vs yesterday' }}
              />
            </div>
            <ShellsExportTrend height={220} />
            <ShellsAlarmRows limit={2} />
          </Pane>
          <Pane
            title="Assistant"
            subtitle="Answers from plant data"
            surface="well"
            actions={
              <IconChip size="sm" tone="purple">
                <IconSparkles />
              </IconChip>
            }
            footer={
              <form
                className="flex w-full items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
              >
                <Input aria-label="Ask the assistant" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about the plant" />
                <Button type="submit" size="icon" aria-label="Send">
                  <IconSend />
                </Button>
              </form>
            }
          >
            <div className="flex flex-1 flex-col justify-end gap-4" aria-live="polite">
              {thread.slice(-5).map((message) => (
                <ChatBubble key={message.id} from={message.from} name={message.from === 'assistant' ? 'Assistant' : 'Ingrid'} time={message.time}>
                  {message.text}
                </ChatBubble>
              ))}
            </div>
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

function AppShellsWall() {
  return (
    <BrowserFrame url="wall.nordkapp.example.test/control-room-1" look="signal" tab="Wall screen 1">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Nordkapp"
        subtitle="Gas processing · Thursday 12 March · 14:00 UTC"
        status={
          <>
            <StatusPill tone="critical" size="lg">
              1 critical
            </StatusPill>
            <StatusPill tone="warning" size="lg">
              2 high
            </StatusPill>
          </>
        }
      >
        <Grid className="shell-grow grid-rows-[auto_1fr]">
          <Panel className="col-span-7" tone="warning">
            <div className="flex flex-1 items-center gap-5">
              <IconAlertTriangle className="size-16 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-5xl font-extrabold tracking-tight">Reduced capacity</p>
                <p className="mt-2 text-lg">Recompressor tripped at 13:46. Bearing inspection due 20:00.</p>
              </div>
            </div>
          </Panel>
          <Stat className="col-span-5" size="hero" tone="warning" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" target="0.12 under the 4.50 plan" />
          {SHELLS_AREAS.map((area) => (
            <Stat
              key={area.id}
              className="col-span-3"
              size="lg"
              tone={SHELLS_HEALTH_TONE[area.health]}
              label={area.name}
              value={area.healthScore}
              unit="/ 100"
              state={SHELLS_HEALTH_LABEL[area.health]}
              stateIcon={area.health === 'good' ? <IconCircleCheck /> : <IconAlertTriangle />}
            />
          ))}
        </Grid>
        <StatusBar
          label="Wall screen status"
          className="mt-2"
          items={[
            { id: 'feed', label: 'Live', value: 'updated 14:00:00', tone: 'success' },
            { id: 'next', label: 'Next page', value: 'Alarms in 40 s' },
          ]}
          end={[{ id: 'screen', label: 'Screen', value: 'CR1 wall 1 of 3' }]}
        />
      </AppFrame>
    </BrowserFrame>
  );
}

function AppShellsMobile() {
  const [tab, setTab] = useState('home');
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-10 bg-muted-background px-6 py-8">
      <PhoneFrame label="Home, studio" look="studio" footer={<BottomNav label="Primary, studio" items={SHELLS_PHONE_NAV} current={tab} onNavigate={setTab} />}>
        <div className="flex flex-col gap-4">
          <SectionHeader size="sm" level={2} eyebrow="Nordkapp" title="Plant overview" />
          <Stat label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" tone="accent" emphasis="strong" icon={<IconFlame />} sparkline={SHELLS_EXPORT_VALUES} />
          <div className="grid grid-cols-2 gap-3">
            <Stat size="sm" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" />
            <Stat size="sm" label="Alarms" value={4} tone="critical" />
          </div>
          <Panel title="Open alarms" padding="tight">
            <ShellsAlarmRows limit={3} compact />
          </Panel>
        </div>
      </PhoneFrame>
      <PhoneFrame label="Alarms, console" look="console" footer={<BottomNav label="Primary, console" items={SHELLS_PHONE_NAV} current="alarms" />}>
        <div className="-m-4 flex flex-col">
          <div className="flex items-center gap-2 bg-warning-foreground px-3.5 py-3 text-base-background">
            <IconAlertTriangle className="size-5" aria-hidden="true" />
            <span className="text-base font-semibold">Reduced capacity</span>
          </div>
          <Panel title="Alarms" subtitle="8 in 3 days · 5 open" padding="none">
            <ul>
              {ALARMS.map((alarm) => (
                <ListRow
                  key={alarm.id}
                  tone={SHELLS_SEVERITY_TONE[alarm.severity]}
                  title={alarm.message}
                  meta={
                    <>
                      <StatusPill tone={SHELLS_SEVERITY_TONE[alarm.severity]}>{SHELLS_SEVERITY_LABEL[alarm.severity]}</StatusPill>
                      <span>{alarm.value}</span>
                    </>
                  }
                  trailing={formatAgo(alarm.raisedAt)}
                />
              ))}
            </ul>
          </Panel>
        </div>
      </PhoneFrame>
      <PhoneFrame label="Work order, soft" look="soft" footer={<BottomNav label="Primary, soft" items={SHELLS_PHONE_NAV} current="work" />}>
        <div className="flex flex-col gap-4">
          <SectionHeader size="sm" level={2} eyebrow="WO-104482 · P1" title="Inspect recompressor drive-end bearing" />
          <Panel tone="teal" padding="tight">
            <Meter label="Progress" value={35} max={100} unit="%" tone="teal" hideScale />
            <p className="mt-3 text-sm text-medium-foreground">Due today at 20:00 · 8 h estimated</p>
          </Panel>
          <Panel padding="tight">
            <PersonChip name={PEOPLE[3].name} initials={PEOPLE[3].initials} role={PEOPLE[3].role} tone="purple" />
          </Panel>
          <Panel title="Steps" subtitle="1 of 4 done" padding="tight">
            <ul>
              <ListRow tone="success" title="Isolate and lock out" meta="Done 14:05" />
              <ListRow tone="info" title="Open drive-end bearing" meta="In progress" />
              <ListRow title="Inspect pads and journal" meta="Next" />
              <ListRow title="Measure clearance" meta="Then" />
            </ul>
          </Panel>
          <Button className="w-full">Log progress</Button>
          <Button className="w-full" variant="outline">
            Add a photo
          </Button>
        </div>
      </PhoneFrame>
    </div>
  );
}

export default definePage({
  id: 'app-shells',
  title: 'App shells',
  summary:
    'The frame around every page: where navigation lives, how regions divide the window and what stays docked. Eleven shells in eight looks, each in a browser window at real size.',
  guidance: {
    use: [
      'Pick the shell from the job: a sidebar for products with many destinations, a top bar for wide boards, a rail for immersive screens, none for wall displays.',
      'Keep one shell per product; change the page inside it, not the chrome.',
      'Dock what must stay in view — an inspector, an assistant, a status bar — as its own pane.',
    ],
    avoid: [
      'Mixing two primary navigations, such as a sidebar and a top bar that both list destinations.',
      'More than three panes side by side; below 1280 px the middle one becomes unreadable.',
      'Hiding the plant state in the chrome as a small dot: say it in words next to the title.',
    ],
  },
  source,
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar and rail shells',
      description: 'Navigation down the side: full labels for products with many destinations, icons only when the content needs the width.',
      specimens: [
        {
          id: 'AppShellsSidebar',
          title: 'Sidebar and content',
          note: 'Pick it as the default shell of a product with five or more destinations used at a desk.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Stat.tsx', 'kit/DataTable.tsx', 'kit/Donut.tsx'],
          Component: AppShellsSidebar,
        },
        {
          id: 'AppShellsIconRail',
          title: 'Icon rail',
          note: 'Pick it when one chart or scene is the hero and navigation should stay out of the way.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/TrendArea.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx'],
          Component: AppShellsIconRail,
        },
      ],
    },
    {
      id: 'topbar',
      title: 'Top bar and masthead shells',
      description: 'Navigation across the top leaves the full width to the page; a masthead makes the title itself the chrome.',
      specimens: [
        {
          id: 'AppShellsTopbarCentred',
          title: 'Top bar with centred content',
          note: 'Pick it for a personal start page or a reading-width page with few destinations.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/SectionHeader.tsx', 'kit/Stat.tsx', 'kit/ListRow.tsx'],
          Component: AppShellsTopbarCentred,
        },
        {
          id: 'AppShellsMastheadTabs',
          title: 'Masthead with secondary tabs',
          note: 'Pick it for a review page where one switch, such as the period, re-scopes everything below the title.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/BrowserFrame.tsx', 'kit/app-shells/TabStrip.tsx', 'kit/AppFrame.tsx', 'kit/Stat.tsx', 'kit/Bars.tsx'],
          Component: AppShellsMastheadTabs,
        },
      ],
    },
    {
      id: 'panes',
      title: 'Multi-pane shells',
      description: 'The window divided into regions that work together. Select something in one pane and the next one follows.',
      specimens: [
        {
          id: 'AppShellsThreePanel',
          title: 'Three panel',
          note: 'Pick it to browse a hierarchy: areas, the equipment in one, and the record of the unit you chose.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/Panes.tsx', 'kit/app-shells/Pane.tsx', 'kit/app-shells/SubNav.tsx', 'kit/list-and-detail/PickList.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/TrendLine.tsx'],
          Component: AppShellsThreePanel,
        },
        {
          id: 'AppShellsSplitScreen',
          title: 'Split screen',
          note: 'Pick it when two parties or two versions are read against each other, such as a shift handover.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/Panes.tsx', 'kit/app-shells/Pane.tsx', 'kit/list-and-detail/Activity.tsx', 'kit/StatGroup.tsx'],
          Component: AppShellsSplitScreen,
        },
        {
          id: 'AppShellsInspector',
          title: 'Content with inspector',
          note: 'Pick it when people step through many rows and need the detail of each without leaving the list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/Panes.tsx', 'kit/app-shells/Crumbs.tsx', 'kit/list-and-detail/PickList.tsx', 'kit/list-and-detail/Properties.tsx', 'kit/Stat.tsx', 'kit/Meter.tsx'],
          Component: AppShellsInspector,
        },
      ],
    },
    {
      id: 'docked',
      title: 'Shells with docked regions',
      description: 'Something stays in view whatever the page does: a status bar, an assistant, the plant state.',
      specimens: [
        {
          id: 'AppShellsConsoleStatusBar',
          title: 'Console with status bar',
          note: 'Pick it for operator stations where connection, mode and alarm counts must never scroll away.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/StatusBar.tsx', 'kit/app-shells/Panes.tsx', 'kit/list-and-detail/PickList.tsx', 'kit/StatGroup.tsx', 'kit/DataTable.tsx', 'kit/TrendLine.tsx'],
          Component: AppShellsConsoleStatusBar,
        },
        {
          id: 'AppShellsAssistant',
          title: 'Docked assistant',
          note: 'Pick it when an assistant answers questions about the page next to it, without covering it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/ChatBubble.tsx', 'kit/app-shells/Panes.tsx', 'kit/app-shells/PersonChip.tsx', 'kit/AppFrame.tsx', 'kit/TrendArea.tsx'],
          Component: AppShellsAssistant,
        },
        {
          id: 'AppShellsWall',
          title: 'Wall screen without navigation',
          note: 'Pick it for a display nobody touches: no navigation, the state as the page and a ticker saying it is live.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/StatusBar.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx'],
          Component: AppShellsWall,
        },
      ],
    },
    {
      id: 'small',
      title: 'Small screens',
      description: 'The same product on a phone: the sidebar becomes a bottom bar and each screen does one thing.',
      specimens: [
        {
          id: 'AppShellsMobile',
          title: 'Phone with bottom navigation',
          note: 'Pick it for field and on-call use: four destinations at the thumb, one task per screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/PhoneFrame.tsx', 'kit/app-shells/BottomNav.tsx', 'kit/Stat.tsx', 'kit/ListRow.tsx', 'kit/Meter.tsx'],
          Component: AppShellsMobile,
        },
      ],
    },
  ],
});
