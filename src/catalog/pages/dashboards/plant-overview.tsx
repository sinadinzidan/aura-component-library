import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconActivity,
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBolt,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconFlame,
  IconGauge,
  IconInfoCircle,
  IconLayoutDashboard,
  IconRefresh,
  IconSettings,
  IconTool,
  IconTopologyStar3,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Delta } from '../../../library/kit/Delta';
import { Donut, type DonutSegment } from '../../../library/kit/Donut';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip, type HeatRow } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import {
  ALARMS,
  ASSETS,
  PLANT_KPIS,
  SENSORS,
  WORK_ORDERS,
  childrenOf,
  findAsset,
  findPerson,
  type Alarm,
  type Asset,
  type WorkOrder,
} from '../../data/plant';
import { formatAgo, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-overview.tsx?raw';

const PO_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const PO_EXPORT_VALUES = [...PO_EXPORT.slice(0, -1).map((point) => point.v), PLANT_KPIS.gasExport.value];

const PO_EXPORT_YESTERDAY = makeValues({ seed: 32, points: 25, base: 4.24, amplitude: 0.1, noise: 0.03, cycles: 1.1, decimals: 2 });

const PO_HOURS = PO_EXPORT.map((point) => formatTime(point.t));

const PO_AVAILABILITY = makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 });

const PO_ENERGY = makeValues({ seed: 43, points: 24, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8 });

const PO_ALARM_COUNT = [7, 6, 6, 8, 7, 5, 6, 5, 4, 5, 6, 4];

const PO_WEEK_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

const PO_WEEK_EXPORT = [4.52, 4.49, 4.55, 4.47, 4.41, 4.21, 4.38];

const PO_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const PO_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');

const PO_AREAS = childrenOf('nk');

const PO_UNITS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const PO_TRAIN = SENSORS.filter((sensor) => ['pt-92531', 'tt-92532', 'vt-92540'].includes(sensor.id));

const PO_SEVERITY_TONE: Record<Alarm['severity'], Tone> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

const PO_SEVERITY_LABEL: Record<Alarm['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PO_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const PO_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const PO_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const PO_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const PO_ORDER_LABEL: Record<WorkOrder['status'], string> = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
};

const PO_ORDER_TONE: Record<WorkOrder['status'], Tone> = {
  open: 'neutral',
  planned: 'info',
  'in-progress': 'success',
  waiting: 'warning',
  done: 'neutral',
};

const PO_ORDER_MIX: DonutSegment[] = [
  { label: 'Corrective', value: PO_OPEN_ORDERS.filter((order) => order.type === 'corrective').length, tone: 'pink' },
  { label: 'Preventive', value: PO_OPEN_ORDERS.filter((order) => order.type === 'preventive').length, tone: 'blue' },
  { label: 'Inspection', value: PO_OPEN_ORDERS.filter((order) => order.type === 'inspection').length, tone: 'teal' },
  { label: 'Modification', value: PO_OPEN_ORDERS.filter((order) => order.type === 'modification').length, tone: 'amber' },
];

const PO_ALARM_LOAD: HeatRow[] = PO_AREAS.map((area, index) => ({
  label: area.name,
  values: makeValues({ seed: 60 + index, points: 24, base: area.health === 'watch' ? 4 : 1.2, amplitude: 1.2, noise: 1.4, cycles: 2, min: 0, decimals: 0 }),
  tone: area.health === 'watch' ? 'warning' : 'accent',
}));

const PO_DAY: readonly [string, string] = ['24 h ago', 'Now'];

const PO_AREA_CHANGE: Record<string, number> = { 'nk-20': 1, 'nk-23': -6, 'nk-27': 0, 'nk-40': -2 };

const PO_AREA_ALARMS: Record<string, number> = Object.fromEntries(
  PO_AREAS.map((area) => [area.id, PO_OPEN_ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === area.id).length])
);

const PO_SIX_HOURS = ['−24 h', '−18 h', '−12 h', '−6 h', 'Now'];

const PO_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const PO_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  { id: 'order', header: 'Work order', cell: (order) => order.title },
  { id: 'id', header: 'Order', nowrap: true, cell: (order) => <TagId>{order.id}</TagId> },
  { id: 'asset', header: 'Asset', nowrap: true, cell: (order) => <TagId>{findAsset(order.assetId)?.tag ?? ''}</TagId> },
  { id: 'priority', header: 'Priority', nowrap: true, cell: (order) => order.priority },
  { id: 'status', header: 'Status', nowrap: true, cell: (order) => <StatusPill tone={PO_ORDER_TONE[order.status]}>{PO_ORDER_LABEL[order.status]}</StatusPill> },
  { id: 'owner', header: 'Owner', nowrap: true, cell: (order) => findPerson(order.assigneeId)?.name ?? 'Unassigned' },
  { id: 'due', header: 'Due', numeric: true, cell: (order) => formatDate(order.dueAt) },
];

const PO_ORDER_COLUMNS_SHORT: DataTableColumn<WorkOrder>[] = [
  { id: 'order', header: 'Work order', cell: (order) => order.title },
  { id: 'status', header: 'Status', nowrap: true, cell: (order) => <StatusPill tone={PO_ORDER_TONE[order.status]}>{PO_ORDER_LABEL[order.status]}</StatusPill> },
  { id: 'due', header: 'Due', numeric: true, cell: (order) => formatDate(order.dueAt) },
];

const PO_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', nowrap: true, cell: (unit) => unit.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (unit) => <TagId>{unit.tag}</TagId> },
  { id: 'state', header: 'State', nowrap: true, cell: (unit) => <StatusPill tone={PO_STATE_TONE[unit.state]}>{PO_STATE_LABEL[unit.state]}</StatusPill> },
  { id: 'health', header: 'Health', numeric: true, cell: (unit) => `${unit.healthScore} %` },
];

function PoShift() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted-background p-3">
      <IconChip tone="teal" size="sm">
        <IconCircleCheck />
      </IconChip>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-base-foreground">Day shift</p>
        <p className="text-medium-foreground">Ingrid Haugen</p>
      </div>
    </div>
  );
}

function PoRange() {
  const [range, setRange] = useState('24h');
  return (
    <SegmentedControl value={range} onValueChange={(next) => setRange(String(next))}>
      <SegmentedControlList size="small" aria-label="Time range">
        <SegmentedControlButton value="8h">8 h</SegmentedControlButton>
        <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
        <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function PoSeverityIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon />;
  if (severity === 'high') return <IconAlertTriangle />;
  if (severity === 'medium') return <IconInfoCircle />;
  return <IconBell />;
}

const PO_ALARM_STATE: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

function PoAlarmRows({ limit = 5, chips = true, all = false }: { limit?: number; chips?: boolean; all?: boolean }) {
  return (
    <ul>
      {(all ? ALARMS : PO_OPEN_ALARMS).slice(0, limit).map((alarm) => (
        <ListRow
          key={alarm.id}
          tone={PO_SEVERITY_TONE[alarm.severity]}
          leading={
            chips ? (
              <IconChip tone={PO_SEVERITY_TONE[alarm.severity]} size="sm">
                <PoSeverityIcon severity={alarm.severity} />
              </IconChip>
            ) : (
              <StatusPill tone={PO_SEVERITY_TONE[alarm.severity]}>{PO_SEVERITY_LABEL[alarm.severity]}</StatusPill>
            )
          }
          title={alarm.message}
          meta={
            <>
              {chips ? <StatusPill tone={PO_SEVERITY_TONE[alarm.severity]} variant="outline">{PO_SEVERITY_LABEL[alarm.severity]}</StatusPill> : null}
              <TagId>{alarm.sensorTag}</TagId>
              <span>
                {alarm.value} · limit {alarm.limit.split(' ')[0]}
                {all ? ` · ${PO_ALARM_STATE[alarm.state]}` : ''}
              </span>
            </>
          }
          trailing={formatAgo(alarm.raisedAt)}
        />
      ))}
    </ul>
  );
}

function PoOrderRows({ limit = 6 }: { limit?: number }) {
  return (
    <ul>
      {PO_OPEN_ORDERS.slice(0, limit).map((order) => (
        <ListRow
          key={order.id}
          title={order.title}
          meta={
            <>
              <StatusPill tone={PO_ORDER_TONE[order.status]}>{PO_ORDER_LABEL[order.status]}</StatusPill>
              <span>
                {findPerson(order.assigneeId)?.name ?? 'Unassigned'} · due {formatDate(order.dueAt)}
              </span>
            </>
          }
        />
      ))}
    </ul>
  );
}

function PoAreaHealth() {
  return (
    <ul className="flex flex-1 flex-col justify-between gap-4">
      {PO_AREAS.map((area) => (
        <li key={area.id} className="flex flex-col gap-2">
          <Meter
            size="lg"
            label={area.name}
            value={area.healthScore}
            max={100}
            target={{ value: 85, label: 'Target' }}
            tone={PO_HEALTH_TONE[area.health]}
            hideScale
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-medium-foreground">
            <StatusPill tone={PO_HEALTH_TONE[area.health]}>{PO_HEALTH_LABEL[area.health]}</StatusPill>
            <Delta value={PO_AREA_CHANGE[area.id] ?? 0} decimals={0} />
            <span className="ml-auto font-medium tabular-nums">
              {PO_AREA_ALARMS[area.id] ?? 0} open {PO_AREA_ALARMS[area.id] === 1 ? 'alarm' : 'alarms'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PoExportHeadline() {
  return (
    <div className="flex items-baseline gap-3">
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
  );
}

function PoExportChart({ height = 260, headline, notes }: { height?: number; headline?: ReactNode; notes?: ReactNode }) {
  return (
    <TrendArea
      notes={notes}
      label="Gas export over the last 24 hours against the daily plan and yesterday"
      labels={PO_HOURS}
      unit="MSm³/d"
      decimals={2}
      height={height}
      headline={headline}
      series={[
        { id: 'today', label: 'Today', values: PO_EXPORT_VALUES, tone: 'accent' },
        { id: 'yesterday', label: 'Yesterday', values: PO_EXPORT_YESTERDAY, tone: 'neutral', dashed: true },
      ]}
      limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
    />
  );
}

function PoAreaRings({ size = 92 }: { size?: number }) {
  return (
    <div className="grid flex-1 grid-cols-2 place-items-center gap-x-4 gap-y-5">
      {PO_AREAS.map((area) => (
        <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={size} tone={PO_HEALTH_TONE[area.health]} />
      ))}
    </div>
  );
}

function PoHealthIcon({ health }: { health: Asset['health'] }) {
  if (health === 'good') return <IconCircleCheck />;
  if (health === 'watch') return <IconAlertTriangle />;
  return <IconAlertOctagon />;
}

function PoTrainMeters() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      {PO_TRAIN.map((sensor) => {
        const share = Math.round((sensor.value / sensor.highLimit) * 100);
        const near = share >= 95;
        return (
          <div key={sensor.id} className="grid grid-cols-[minmax(0,1fr)_5rem] items-end gap-x-4 gap-y-1.5">
            <Meter
              className="col-span-2"
              label={sensor.name}
              value={sensor.value}
              min={sensor.rangeMin}
              max={sensor.rangeMax}
              unit={sensor.unit}
              decimals={sensor.decimals}
              high={sensor.highLimit}
              target={{ value: sensor.highLimit, label: 'High limit' }}
              tone={near ? 'warning' : 'accent'}
              hideScale
            />
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-medium-foreground">
              <StatusPill tone={near ? 'warning' : 'success'}>{near ? 'Near limit' : 'Normal'}</StatusPill>
              <span className="tabular-nums">{share} % of limit</span>
            </div>
            <SparkLine
              className="h-7"
              label={`${sensor.name}, last 24 hours`}
              tone={near ? 'warning' : 'accent'}
              values={makeValues({ seed: sensor.seed, points: 24, base: sensor.value * 0.96, amplitude: sensor.value * 0.02, noise: sensor.value * 0.012, drift: sensor.value * 0.04 })}
            />
          </div>
        );
      })}
      <Legend
        items={[
          { label: 'Reading', tone: 'accent' },
          { label: 'Above the high limit', tone: 'critical' },
        ]}
      />
    </div>
  );
}

function PlantOverviewSignature() {
  return (
    <LookScope look="studio">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={PO_NAV}
        current="overview"
        tools={<PoShift />}
        title="Plant overview"
        subtitle="Thursday 12 March · updated 14:00 UTC"
        actions={
          <>
            <PoRange />
            <Button variant="outline" size="sm">
              <IconRefresh /> Refresh
            </Button>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-12" tone="warning" padding="tight">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <IconChip tone="warning" size="lg">
                <IconAlertTriangle />
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-6 font-semibold">Reduced capacity</p>
                <p className="text-sm text-medium-foreground">
                  Recompressor tripped at 13:46 · export at 97 % of plan
                </p>
              </div>
              <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
                1 critical alarm
              </StatusPill>
              <StatusPill tone="success" size="lg" icon={<IconTool />}>
                Inspection due 20:00
              </StatusPill>
              <Button variant="outline" size="sm">
                Open incident
              </Button>
            </div>
          </Panel>

          <Stat
            className="col-span-3"
            label="Gas export"
            value={PLANT_KPIS.gasExport.value}
            decimals={2}
            unit="MSm³/d"
            icon={<IconFlame />}
            tone="accent"
            emphasis="strong"
            delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'vs yesterday' }}
            target="Plan 4.50 · 97 % of plan"
            sparkline={PO_EXPORT_VALUES}
          />
          <Stat
            className="col-span-3"
            label="Availability"
            value={PLANT_KPIS.availability.value}
            decimals={1}
            unit="%"
            icon={<IconActivity />}
            tone="teal"
            delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'vs last week' }}
            target="Target 97.5 % · 1.1 short"
            sparkline={PO_AVAILABILITY}
          />
          <Stat
            className="col-span-3"
            label="Energy intensity"
            value={PLANT_KPIS.energyIntensity.value}
            decimals={1}
            unit="kWh/boe"
            icon={<IconBolt />}
            tone="purple"
            delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'vs last week' }}
            target="Target 30.0 · 1.2 over"
            sparkline={PO_ENERGY}
          />
          <Stat
            className="col-span-3"
            label="Active alarms"
            value={PLANT_KPIS.activeAlarms.value}
            icon={<IconBell />}
            tone="critical"
            delta={{ value: PLANT_KPIS.activeAlarms.value - PLANT_KPIS.activeAlarms.previous, decimals: 0, good: 'down', caption: 'vs yesterday' }}
            target="1 critical · 2 high"
            sparkline={PO_ALARM_COUNT}
          />

          <Panel className="col-span-7" title="Gas export" subtitle="Last 24 hours against the daily plan">
            <PoExportChart
              height={250}
              headline={
                <p className="max-w-md text-sm text-medium-foreground">
                  Averaged 4.33 MSm³/d, 4 % under plan. The dip follows the recompressor trip at 13:46.
                </p>
              }
            />
          </Panel>
          <Panel className="col-span-5" title="Area health" subtitle="Score out of 100, target 85">
            <PoAreaHealth />
          </Panel>

          <Panel
            className="col-span-7"
            title="Open alarms"
            footer="3 more cleared and 1 shelved in the last three days"
            subtitle="5 open, most severe first"
            actions={
              <Button variant="ghost" size="sm">
                View all
              </Button>
            }
          >
            <PoAlarmRows />
          </Panel>
          <Panel
            className="col-span-5"
            title="Work orders"
            subtitle="6 open, by due date"
            actions={
              <Button variant="ghost" size="sm">
                Open planner
              </Button>
            }
          >
            <PoOrderRows />
          </Panel>

          <Panel className="col-span-4" title="Compression train" subtitle="23-KA-9101, live" icon={<IconChip tone="blue"><IconGauge /></IconChip>}>
            <PoTrainMeters />
          </Panel>
          <Panel className="col-span-5" title="Alarm load" subtitle="Alarms per hour, last 24 hours" icon={<IconChip tone="amber"><IconBell /></IconChip>}>
            <div className="flex flex-1 flex-col justify-between gap-5">
              <div className="grid grid-cols-3 gap-4">
                <Stat variant="plain" size="sm" label="Raised in 24 h" value={71} unit="alarms" />
                <Stat variant="plain" size="sm" label="Busiest hour" value="9" unit="at 13:00" />
                <Stat variant="plain" size="sm" label="Compression share" value={62} unit="%" />
              </div>
              <HeatStrip
                label="Alarms per hour by area over the last 24 hours"
                rows={PO_ALARM_LOAD}
                ticks={PO_SIX_HOURS}
                scale={{ label: 'Alarms per hour', low: '0', high: '9' }}
                size="lg"
              />
            </div>
          </Panel>
          <Panel className="col-span-3" title="Order mix" subtitle="Open, by type" icon={<IconChip tone="pink"><IconTool /></IconChip>}>
            <div className="flex flex-1 items-center">
              <Donut label="Open work orders by type" segments={PO_ORDER_MIX} centerCaption="open" size={124} legend="bottom" className="w-full" />
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewConsole() {
  return (
    <LookScope look="console">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Control room 1', mark: <IconFlame /> }}
        nav={PO_NAV.filter((item) => item.id !== 'assets' && item.id !== 'settings')}
        current="overview"
        padding="none"
        tools={
          <>
            <span>Day shift · I. Haugen</span>
            <span className="font-medium tabular-nums">14:00:00 UTC</span>
          </>
        }
      >
        <Grid>
          <div className="col-span-12 flex items-stretch bg-base-background">
            <div className="flex items-center gap-3 bg-warning-foreground px-4 py-3 text-base-background">
              <IconAlertTriangle className="size-6" aria-hidden="true" />
              <span className="text-xl font-semibold">Reduced capacity</span>
            </div>
            <p className="flex flex-1 items-center px-4 text-sm text-medium-foreground">
              Recompressor 23-KA-9103 tripped on high vibration at 13:46. Export held at 4.38 MSm³/d on two stages.
            </p>
            <div className="flex items-center gap-2 px-4">
              <StatusPill tone="critical">1 critical</StatusPill>
              <StatusPill tone="warning">2 high</StatusPill>
              <StatusPill tone="info">1 medium</StatusPill>
              <StatusPill tone="neutral">1 low</StatusPill>
            </div>
          </div>

          <StatGroup columns={6} label="Plant KPIs" className="col-span-12">
            <Stat variant="plain" size="lg" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" tone="warning" target="Plan 4.50" />
            <Stat variant="plain" size="lg" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" tone="warning" target="Target 97.5" />
            <Stat variant="plain" size="lg" label="OEE" value={PLANT_KPIS.oee.value} decimals={1} unit="%" target="Target 85.0" />
            <Stat variant="plain" size="lg" label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" target="Target 30.0" />
            <Stat variant="plain" size="lg" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" tone="success" target="Limit 15.0" />
            <Stat variant="plain" size="lg" label="Active alarms" value={PLANT_KPIS.activeAlarms.value} tone="critical" target="7 yesterday" />
          </StatGroup>

          <Panel className="col-span-4 row-span-2" title="Alarms" subtitle="8 in the last 3 days, 5 open" padding="none" tone="critical">
            <PoAlarmRows chips={false} all limit={8} />
            <div className="mt-auto flex flex-col gap-4 border-t border-default p-3.5">
              <div className="grid grid-cols-3 gap-3">
                <Stat variant="plain" size="sm" label="Raised in 24 h" value={71} />
                <Stat variant="plain" size="sm" label="Busiest hour" value="9" unit="at 13:00" />
                <Stat variant="plain" size="sm" label="From compression" value={62} unit="%" />
              </div>
              <HeatStrip
                label="Alarms per hour by area over the last 24 hours"
                rows={PO_ALARM_LOAD}
                ticks={PO_SIX_HOURS}
                scale={{ label: 'Alarms per hour', low: '0', high: '9' }}
              />
            </div>
          </Panel>
          <Panel className="col-span-8" title="Gas export" subtitle="MSm³/d · last 24 h · plan 4.50">
            <TrendLine
              label="Gas export over the last 24 hours against the daily plan and yesterday"
              labels={PO_HOURS}
              unit="MSm³/d"
              decimals={2}
              height={236}
              series={[
                { id: 'today', label: 'Today', values: PO_EXPORT_VALUES, tone: 'accent' },
                { id: 'yesterday', label: 'Yesterday', values: PO_EXPORT_YESTERDAY, tone: 'neutral', dashed: true },
              ]}
              limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
            />
          </Panel>
          <Panel className="col-span-5" title="Equipment" subtitle="11 units" padding="none" footer="8 running · 1 standby · 1 tripped · 1 in maintenance">
            <DataTable
              label="Equipment run state"
              flush
              columns={PO_UNIT_COLUMNS}
              rows={PO_UNITS}
              rowKey={(unit) => unit.id}
              rowTone={(unit) => (unit.state === 'running' ? undefined : PO_STATE_TONE[unit.state])}
            />
          </Panel>
          <div className="col-span-3 flex flex-col gap-px">
            <Panel className="h-auto" title="Area status" padding="none">
              <ul>
                {PO_AREAS.map((area) => (
                  <ListRow
                    key={area.id}
                    tone={area.health === 'good' ? 'neutral' : PO_HEALTH_TONE[area.health]}
                    title={area.name}
                    trailing={
                      <>
                        <span className="text-base font-medium text-base-foreground">{area.healthScore}</span>
                        <StatusPill tone={PO_HEALTH_TONE[area.health]}>{PO_HEALTH_LABEL[area.health]}</StatusPill>
                      </>
                    }
                  />
                ))}
              </ul>
            </Panel>
            <Panel className="h-auto flex-1" title="1st stage compressor" subtitle="23-KA-9101">
              <PoTrainMeters />
            </Panel>
          </div>

          <Panel className="col-span-12" title="Work orders" subtitle="6 open and planned" padding="none">
            <DataTable
              label="Work orders"
              flush
              columns={PO_ORDER_COLUMNS}
              rows={PO_OPEN_ORDERS}
              rowKey={(order) => order.id}
              rowTone={(order) => (order.priority === 'P1' ? 'critical' : undefined)}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewPoster() {
  return (
    <LookScope look="poster">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        nav={PO_NAV.slice(0, 5)}
        current="overview"
        title="Nordkapp is running at reduced capacity."
        subtitle="Thursday 12 March, 14:00 UTC. The recompressor tripped on high vibration at 13:46."
        tools={<PoRange />}
      >
        <Grid>
          <Stat
            className="col-span-5 row-span-2"
            size="hero"
            tone="pink"
            label="Gas export today"
            value={PLANT_KPIS.gasExport.value}
            decimals={2}
            unit="MSm³/d"
            delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'on yesterday' }}
            target="0.12 under the 4.50 plan"
          />
          <Stat
            className="col-span-4"
            size="lg"
            tone="amber"
            label="Availability"
            value={PLANT_KPIS.availability.value}
            decimals={1}
            unit="%"
            delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'on last week' }}
          />
          <Stat
            className="col-span-3"
            size="lg"
            tone="critical"
            label="Active alarms"
            value={PLANT_KPIS.activeAlarms.value}
            delta={{ value: PLANT_KPIS.activeAlarms.value - PLANT_KPIS.activeAlarms.previous, decimals: 0, good: 'down', caption: 'on yesterday' }}
          />
          <Stat
            className="col-span-3"
            size="lg"
            tone="teal"
            label="Flaring"
            value={PLANT_KPIS.flaring.value}
            decimals={1}
            unit="kSm³/d"
            delta={{ value: PLANT_KPIS.flaring.value - PLANT_KPIS.flaring.previous, good: 'down', caption: 'on last week' }}
          />
          <Stat
            className="col-span-4"
            size="lg"
            tone="blue"
            label="Energy intensity"
            value={PLANT_KPIS.energyIntensity.value}
            decimals={1}
            unit="kWh/boe"
            delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'on last week' }}
          />

          <Panel className="col-span-7" title="Seven days of export" subtitle="MSm³ per day against the 4.50 plan">
            <Bars
              label="Gas export per day for the last seven days against the plan"
              categories={PO_WEEK_DAYS}
              series={[{ id: 'export', label: 'Export', values: PO_WEEK_EXPORT, tone: 'pink' }]}
              tones={['blue', 'blue', 'blue', 'blue', 'blue', 'pink', 'pink']}
              decimals={2}
              showValues
              height={260}
              limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'accent' }}
            />
          </Panel>
          <Panel className="col-span-5" title="Area health" subtitle="Condition score out of 100">
            <Bars
              label="Condition score per area"
              orientation="horizontal"
              categories={PO_AREAS.map((area) => area.name)}
              series={[{ id: 'score', label: 'Score', values: PO_AREAS.map((area) => area.healthScore) }]}
              tones={PO_AREAS.map((area) => PO_HEALTH_TONE[area.health])}
              showValues
              height={260}
            />
          </Panel>

          <Panel className="col-span-6" title="What is wrong" subtitle="Five open alarms" tone="critical">
            <PoAlarmRows />
          </Panel>
          <Panel className="col-span-6" title="Who is on it" subtitle="Open work orders" tone="amber" padding="none" footer="1 in progress · 2 planned · 1 waiting · 2 open">
            <DataTable label="Work orders" flush columns={PO_ORDER_COLUMNS_SHORT} rows={PO_OPEN_ORDERS} rowKey={(order) => order.id} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewGlass() {
  return (
    <LookScope look="glass">
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={PO_NAV}
        current="overview"
        title="Plant overview"
        subtitle="Nordkapp gas processing · updated 14:00 UTC"
        status={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Reduced capacity
          </StatusPill>
        }
        actions={<PoRange />}
      >
        <Grid>
          <Panel className="col-span-8" tone="accent">
            <PoExportChart height={300} headline={<PoExportHeadline />} />
          </Panel>
          <div className="col-span-4 flex flex-col gap-4">
            <Panel className="h-auto flex-1" title="Area health" subtitle="Condition score per area">
              <div className="grid flex-1 grid-cols-4 place-items-start gap-2">
                {PO_AREAS.map((area) => (
                  <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={64} tone={PO_HEALTH_TONE[area.health]} />
                ))}
              </div>
            </Panel>
            <Panel className="h-auto flex-1" title="Order mix" subtitle="Open work orders by type">
              <div className="flex flex-1 items-center">
                <Donut label="Open work orders by type" segments={PO_ORDER_MIX} centerCaption="open" size={116} className="w-full" />
              </div>
            </Panel>
          </div>

          <Stat
            className="col-span-3"
            label="Availability"
            value={PLANT_KPIS.availability.value}
            decimals={1}
            unit="%"
            icon={<IconActivity />}
            tone="teal"
            delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'vs last week' }}
            sparkline={PO_AVAILABILITY}
          />
          <Stat
            className="col-span-3"
            label="Energy intensity"
            value={PLANT_KPIS.energyIntensity.value}
            decimals={1}
            unit="kWh/boe"
            icon={<IconBolt />}
            tone="purple"
            delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'vs last week' }}
            sparkline={PO_ENERGY}
          />
          <Stat
            className="col-span-3"
            label="Flaring"
            value={PLANT_KPIS.flaring.value}
            decimals={1}
            unit="kSm³/d"
            icon={<IconFlame />}
            tone="amber"
            delta={{ value: PLANT_KPIS.flaring.value - PLANT_KPIS.flaring.previous, good: 'down', caption: 'vs last week' }}
            sparkline={makeValues({ seed: 47, points: 24, base: 15, amplitude: 1.5, noise: 0.8, drift: -3 })}
          />
          <Stat
            className="col-span-3"
            label="Active alarms"
            value={PLANT_KPIS.activeAlarms.value}
            icon={<IconBell />}
            tone="pink"
            delta={{ value: PLANT_KPIS.activeAlarms.value - PLANT_KPIS.activeAlarms.previous, decimals: 0, good: 'down', caption: 'vs yesterday' }}
            sparkline={PO_ALARM_COUNT}
          />

          <Panel className="col-span-7" title="Open alarms" subtitle="Most severe first">
            <PoAlarmRows limit={5} />
          </Panel>
          <Panel className="col-span-5" title="Compression train" subtitle="1st stage compressor, live">
            <PoTrainMeters />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewEditorial() {
  return (
    <LookScope look="editorial">
      <AppFrame
        brand={{ name: 'Nordkapp daily' }}
        nav={[
          { id: 'summary', label: 'Summary' },
          { id: 'export', label: 'Export' },
          { id: 'areas', label: 'Areas' },
          { id: 'alarms', label: 'Alarms', badge: '5 open' },
          { id: 'work', label: 'Work in hand' },
        ]}
        current="summary"
        title="Export held at 4.38 while the recompressor is down."
        subtitle="Nordkapp daily report, Thursday 12 March 2026, 14:00 UTC. The plant is at reduced capacity after a vibration trip at 13:46; two compression stages carry the load and flaring stays well inside its limit."
        tools={<span className="text-sm text-medium-foreground">Issue 71 · Day shift</span>}
      >
        <Grid>
          <StatGroup columns={4} label="Plant KPIs" className="col-span-12">
            <Stat
              variant="plain"
              size="lg"
              label="Gas export"
              value={PLANT_KPIS.gasExport.value}
              decimals={2}
              unit="MSm³/d"
              delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'on yesterday, 0.12 under plan' }}
            />
            <Stat
              variant="plain"
              size="lg"
              label="Availability"
              value={PLANT_KPIS.availability.value}
              decimals={1}
              unit="%"
              delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'on last week, target 97.5' }}
            />
            <Stat
              variant="plain"
              size="lg"
              label="Energy intensity"
              value={PLANT_KPIS.energyIntensity.value}
              decimals={1}
              unit="kWh/boe"
              delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'on last week, target 30.0' }}
            />
            <Stat
              variant="plain"
              size="lg"
              label="Flaring"
              value={PLANT_KPIS.flaring.value}
              decimals={1}
              unit="kSm³/d"
              delta={{ value: PLANT_KPIS.flaring.value - PLANT_KPIS.flaring.previous, good: 'down', caption: 'on last week, limit 15.0' }}
            />
          </StatGroup>

          <Panel className="col-span-8" title="Export ran four per cent under plan" subtitle="Gas export in MSm³ per day over the last 24 hours, against the plan and yesterday.">
            <PoExportChart
              height={330}
              notes={
                <ol className="space-y-4">
                  <li>
                    <strong className="font-semibold text-base-foreground">02:00 to 08:00.</strong> Night dip as inlet pressure eased; within the normal band.
                  </li>
                  <li>
                    <strong className="font-semibold text-base-foreground">13:46.</strong> Recompressor trips on drive-end vibration at 11.6 mm/s.
                  </li>
                  <li>
                    <strong className="font-semibold text-base-foreground">14:00.</strong> Export recovers to 4.38 on two stages, 0.12 under plan.
                  </li>
                </ol>
              }
            />
          </Panel>
          <Panel className="col-span-4" title="Areas" subtitle="Condition score out of 100.">
            <ul className="flex flex-1 flex-col justify-between">
              {PO_AREAS.map((area) => (
                <ListRow
                  key={area.id}
                  title={area.name}
                  meta={<StatusPill tone={PO_HEALTH_TONE[area.health]}>{PO_HEALTH_LABEL[area.health]}</StatusPill>}
                  trailing={<span className="text-4xl font-medium tracking-tight text-base-foreground">{area.healthScore}</span>}
                />
              ))}
            </ul>
          </Panel>

          <Panel className="col-span-6" title="Alarms worth reading" subtitle="Five open, most severe first.">
            <PoAlarmRows chips={false} />
          </Panel>
          <Panel className="col-span-6" title="Work in hand" subtitle="Six orders open or planned.">
            <DataTable label="Work orders" columns={PO_ORDER_COLUMNS_SHORT} rows={PO_OPEN_ORDERS} rowKey={(order) => order.id} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewSoft() {
  return (
    <LookScope look="soft">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={PO_NAV.slice(0, 5)}
        current="overview"
        title="Good afternoon, Ingrid"
        subtitle="Nordkapp is at reduced capacity while the recompressor is inspected. Four things need you today."
        actions={<PoRange />}
        tools={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Reduced capacity
          </StatusPill>
        }
      >
        <Grid>
          <Panel className="col-span-5 row-span-2" tone="purple">
            <PoExportChart height={250} headline={<PoExportHeadline />} />
          </Panel>
          <Stat
            className="col-span-4"
            label="Availability"
            value={PLANT_KPIS.availability.value}
            decimals={1}
            unit="%"
            icon={<IconActivity />}
            tone="teal"
            delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'vs last week' }}
            sparkline={PO_AVAILABILITY}
          />
          <Panel className="col-span-3 row-span-2" title="Order mix" subtitle="Open, by type" tone="pink">
            <div className="flex flex-1 items-center">
              <Donut label="Open work orders by type" segments={PO_ORDER_MIX} centerCaption="open" size={136} legend="bottom" className="w-full" />
            </div>
          </Panel>
          <Stat
            className="col-span-4"
            label="Energy intensity"
            value={PLANT_KPIS.energyIntensity.value}
            decimals={1}
            unit="kWh/boe"
            icon={<IconBolt />}
            tone="amber"
            delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'vs last week' }}
            sparkline={PO_ENERGY}
          />

          <Panel className="col-span-4" title="Area health" subtitle="Condition score" tone="green">
            <PoAreaRings size={96} />
          </Panel>
          <Panel className="col-span-8" title="Needs attention" subtitle="Open alarms, most severe first">
            <PoAlarmRows limit={4} />
          </Panel>

          <Panel className="col-span-7" title="In progress" subtitle="Work orders by due date">
            <PoOrderRows limit={4} />
          </Panel>
          <Panel className="col-span-5" title="Compression train" subtitle="1st stage compressor" tone="blue">
            <PoTrainMeters />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewBlueprint() {
  return (
    <LookScope look="blueprint">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing plant', mark: <IconFlame /> }}
        nav={PO_NAV.slice(0, 3)}
        current="overview"
        tools={
          <>
            <div>
              <p className="text-xs">Drawing</p>
              <p className="text-sm font-semibold">NK-OV-001</p>
            </div>
            <div>
              <p className="text-xs">Revision</p>
              <p className="text-sm font-semibold">C</p>
            </div>
            <div>
              <p className="text-xs">Issued</p>
              <p className="text-sm font-semibold">12 Mar 2026 14:00</p>
            </div>
          </>
        }
      >
        <Grid>
          <Grid stack className="col-span-3">
            <Stat label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" target="Plan 4.50" />
            <Stat label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" target="Target 97.5" />
            <Stat label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" target="Target 30.0" />
            <Stat label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" target="Limit 15.0" />
          </Grid>
          <Panel className="col-span-9" title="Gas export" subtitle="MSm³/d · 24 h · scale 1 h" icon={<IconChartLine className="size-4" />}>
            <TrendLine
              label="Gas export over the last 24 hours against the daily plan"
              labels={PO_HOURS}
              unit="MSm³/d"
              decimals={2}
              height={388}
              showLegend
              series={[
                { id: 'today', label: 'Today', values: PO_EXPORT_VALUES, tone: 'accent' },
                { id: 'yesterday', label: 'Yesterday', values: PO_EXPORT_YESTERDAY, tone: 'neutral', dashed: true },
              ]}
              limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
            />
          </Panel>

          <Panel className="col-span-7" title="Equipment register" subtitle="11 units" icon={<IconTopologyStar3 className="size-4" />}>
            <DataTable label="Equipment register" columns={PO_UNIT_COLUMNS} rows={PO_UNITS} rowKey={(unit) => unit.id} />
          </Panel>
          <Grid stack className="col-span-5">
            <Panel title="1st stage compressor" subtitle="23-KA-9101" icon={<IconGauge className="size-4" />}>
              <PoTrainMeters />
            </Panel>
            <Panel title="Area health" subtitle="Score / 100" icon={<IconActivity className="size-4" />}>
              <div className="grid grid-cols-4 place-items-start gap-2">
                {PO_AREAS.map((area) => (
                  <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={72} tone={PO_HEALTH_TONE[area.health]} />
                ))}
              </div>
            </Panel>
          </Grid>

          <Panel className="col-span-12" title="Open alarms" subtitle="5 open · most severe first" icon={<IconBell className="size-4" />}>
            <PoAlarmRows chips={false} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewSignal() {
  return (
    <LookScope look="signal">
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
            <StatusPill tone="info" size="lg">
              2 other
            </StatusPill>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-8" tone="warning">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <p className="text-lg font-semibold">Plant state</p>
              <div className="flex items-center gap-5">
                <IconAlertTriangle className="size-20 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-7xl leading-none font-extrabold tracking-tighter">Reduced capacity</p>
              </div>
              <p className="max-w-2xl text-xl font-medium">
                Recompressor 23-KA-9103 tripped on high vibration at 13:46. Bearing inspection in progress, due 20:00.
              </p>
            </div>
          </Panel>
          <Stat
            className="col-span-4"
            size="hero"
            tone="warning"
            label="Gas export"
            value={PLANT_KPIS.gasExport.value}
            decimals={2}
            unit="MSm³/d"
            target="0.12 under the 4.50 plan"
          />

          {PO_AREAS.map((area) => (
            <Stat
              key={area.id}
              className="col-span-3"
              size="lg"
              tone={PO_HEALTH_TONE[area.health]}
              label={area.name}
              state={PO_HEALTH_LABEL[area.health]}
              stateIcon={<PoHealthIcon health={area.health} />}
              value={area.healthScore}
              unit="/ 100"
            />
          ))}

          <Panel className="col-span-7" title="Equipment" subtitle="Criticality A and B units">
            <div className="grid flex-1 grid-cols-3 gap-2">
              {PO_UNITS.filter((unit) => unit.criticality !== 'C').map((unit) => (
                <Stat key={unit.id} size="sm" tone={PO_STATE_TONE[unit.state]} label={unit.name} state={PO_STATE_LABEL[unit.state]} value={unit.tag} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-5" title="Alarms" subtitle="5 open">
            <PoAlarmRows chips={false} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PlantOverviewStats() {
  return (
    <Canvas>
      <StatGroup columns={4} label="Plant KPIs">
        <Stat
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          decimals={2}
          unit="MSm³/d"
          icon={<IconFlame />}
          tone="blue"
          delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'vs yesterday' }}
          sparkline={PO_EXPORT_VALUES}
        />
        <Stat
          label="Availability"
          value={PLANT_KPIS.availability.value}
          decimals={1}
          unit="%"
          icon={<IconActivity />}
          tone="teal"
          delta={{ value: PLANT_KPIS.availability.value - PLANT_KPIS.availability.previous, caption: 'vs last week' }}
          sparkline={PO_AVAILABILITY}
        />
        <Stat
          label="Energy intensity"
          value={PLANT_KPIS.energyIntensity.value}
          decimals={1}
          unit="kWh/boe"
          icon={<IconBolt />}
          tone="purple"
          delta={{ value: PLANT_KPIS.energyIntensity.value - PLANT_KPIS.energyIntensity.previous, good: 'down', caption: 'vs last week' }}
          sparkline={PO_ENERGY}
        />
        <Stat
          label="Active alarms"
          value={PLANT_KPIS.activeAlarms.value}
          icon={<IconBell />}
          tone="critical"
          state="Critical"
          stateIcon={<IconAlertOctagon />}
          delta={{ value: PLANT_KPIS.activeAlarms.value - PLANT_KPIS.activeAlarms.previous, decimals: 0, good: 'down', caption: 'vs yesterday' }}
          sparkline={PO_ALARM_COUNT}
        />
      </StatGroup>
    </Canvas>
  );
}

function PlantOverviewStatSizes() {
  return (
    <Canvas>
      <Grid className="items-stretch">
        <Stat className="col-span-2" size="sm" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" target="Limit 15.0" />
        <Stat
          className="col-span-3"
          size="md"
          label="OEE"
          value={PLANT_KPIS.oee.value}
          decimals={1}
          unit="%"
          tone="teal"
          delta={{ value: PLANT_KPIS.oee.value - PLANT_KPIS.oee.previous, caption: 'vs last week' }}
        />
        <Stat
          className="col-span-3"
          size="lg"
          label="Mean time between failures"
          value={PLANT_KPIS.mtbf.value}
          unit="h"
          tone="amber"
          delta={{ value: PLANT_KPIS.mtbf.value - PLANT_KPIS.mtbf.previous, decimals: 0, unit: ' h', caption: 'vs last quarter' }}
        />
        <Stat
          className="col-span-4"
          size="hero"
          label="Days since last incident"
          value={PLANT_KPIS.daysSinceIncident.value}
          tone="success"
          state="On track"
          stateIcon={<IconCircleCheck />}
          target="Record 365 days"
        />
      </Grid>
    </Canvas>
  );
}

function PlantOverviewStatus() {
  return (
    <Canvas>
      <Panel title="Status vocabulary" subtitle="State is a word with a colour and a shape">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="success" icon={<IconCircleCheck />}>
              Running
            </StatusPill>
            <StatusPill tone="info">Standby</StatusPill>
            <StatusPill tone="warning" icon={<IconAlertTriangle />}>
              Maintenance
            </StatusPill>
            <StatusPill tone="critical" icon={<IconAlertOctagon />}>
              Tripped
            </StatusPill>
            <StatusPill tone="neutral">Stopped</StatusPill>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="critical" variant="filled">
              Filled
            </StatusPill>
            <StatusPill tone="critical" variant="soft">
              Soft
            </StatusPill>
            <StatusPill tone="critical" variant="outline">
              Outline
            </StatusPill>
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              Reduced capacity
            </StatusPill>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Delta value={0.17} decimals={2} />
            <Delta value={-0.7} />
            <Delta value={-1.4} good="down" />
            <Delta value={0} />
            <TagId>23-KA-9101</TagId>
            <TagId variant="chip">23-VT-92540</TagId>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <IconChip tone="blue" size="sm">
              <IconFlame />
            </IconChip>
            <IconChip tone="teal">
              <IconActivity />
            </IconChip>
            <IconChip tone="purple">
              <IconBolt />
            </IconChip>
            <IconChip tone="amber">
              <IconTool />
            </IconChip>
            <IconChip tone="pink">
              <IconBell />
            </IconChip>
            <IconChip tone="critical" size="lg">
              <IconAlertOctagon />
            </IconChip>
          </div>
        </div>
      </Panel>
    </Canvas>
  );
}

function PlantOverviewGauges() {
  return (
    <Canvas>
      <Panel title="Meters and gauges" subtitle="A value on its range, with target and limit zones">
        <div className="flex flex-col gap-6">
          <PoTrainMeters />
          <div className="flex justify-between gap-2">
            {PO_AREAS.map((area) => (
              <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={84} tone={PO_HEALTH_TONE[area.health]} />
            ))}
          </div>
        </div>
      </Panel>
    </Canvas>
  );
}

function PlantOverviewTrend() {
  return (
    <Canvas>
      <Panel title="Discharge temperature" subtitle="1st and 2nd stage, last 24 hours">
        <TrendLine
          label="Discharge temperature of the first and second stage over the last 24 hours with the high limit and the normal band"
          labels={PO_HOURS}
          unit="°C"
          decimals={0}
          height={280}
          series={[
            { id: 's1', label: '1st stage', values: makeValues({ seed: 13, points: 25, base: 136, amplitude: 4, noise: 1.5, drift: 5 }), tone: 'accent' },
            { id: 's2', label: '2nd stage', values: makeValues({ seed: 23, points: 25, base: 124, amplitude: 3, noise: 1.2, drift: 1 }), tone: 'teal' },
          ]}
          limits={[{ value: 145, label: 'High limit', tone: 'critical' }]}
          bands={[{ from: 115, to: 135, tone: 'success' }]}
        />
      </Panel>
    </Canvas>
  );
}

function PlantOverviewTrendArea() {
  return (
    <Canvas>
      <Panel title="Gas export" subtitle="Last 24 hours against the daily plan">
        <PoExportChart height={280} headline={<PoExportHeadline />} />
      </Panel>
    </Canvas>
  );
}

function PlantOverviewBars() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-4" title="Export per day" subtitle="Against the 4.50 plan">
          <Bars
            label="Gas export per day for the last seven days against the plan"
            categories={PO_WEEK_DAYS.map((day) => day.slice(0, 3))}
            series={[{ id: 'export', label: 'Export', values: PO_WEEK_EXPORT, tone: 'accent' }]}
            decimals={2}
            height={230}
            limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }}
          />
        </Panel>
        <Panel className="col-span-4" title="Work hours" subtitle="Planned and unplanned, per day">
          <Bars
            label="Planned and unplanned maintenance hours per day"
            categories={PO_WEEK_DAYS.map((day) => day.slice(0, 3))}
            stacked
            series={[
              { id: 'planned', label: 'Planned', values: [22, 8, 6, 26, 24, 20, 18], tone: 'blue' },
              { id: 'unplanned', label: 'Unplanned', values: [4, 2, 0, 6, 3, 9, 14], tone: 'pink' },
            ]}
            unit="h"
            height={230}
          />
        </Panel>
        <Panel className="col-span-4" title="Area health" subtitle="Condition score out of 100">
          <Bars
            label="Condition score per area"
            orientation="horizontal"
            categories={PO_AREAS.map((area) => area.name)}
            series={[{ id: 'score', label: 'Score', values: PO_AREAS.map((area) => area.healthScore) }]}
            tones={PO_AREAS.map((area) => PO_HEALTH_TONE[area.health])}
            showValues
            height={230}
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function PlantOverviewProportions() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-5" title="Order mix" subtitle="Open work orders by type">
          <div className="flex flex-1 items-center">
            <Donut label="Open work orders by type" segments={PO_ORDER_MIX} centerCaption="open" className="w-full" />
          </div>
        </Panel>
        <Panel className="col-span-7" title="Alarm load" subtitle="Alarms per hour by area, last 24 hours">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <HeatStrip label="Alarms per hour by area over the last 24 hours" rows={PO_ALARM_LOAD} axis={PO_DAY} size="lg" />
            <Legend
              items={[
                { label: 'Normal area', tone: 'accent' },
                { label: 'Area on watch', tone: 'warning' },
              ]}
            />
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function PlantOverviewTable() {
  return (
    <Canvas>
      <Panel title="Work orders" subtitle="Open and planned, by due date" padding="none">
        <DataTable
          label="Work orders"
          flush
          columns={PO_ORDER_COLUMNS}
          rows={PO_OPEN_ORDERS}
          rowKey={(order) => order.id}
          rowTone={(order) => (order.priority === 'P1' ? 'critical' : order.status === 'waiting' ? 'warning' : undefined)}
        />
      </Panel>
    </Canvas>
  );
}

function PlantOverviewLists() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-7" title="Open alarms" subtitle="Most severe first" footer="Updated 14:00 UTC · 3 more cleared today">
          <PoAlarmRows limit={4} />
        </Panel>
        <Panel className="col-span-5" title="Shift notes" subtitle="Nothing handed over yet">
          <EmptyPanel
            icon={<IconClipboardList />}
            title="No notes for this shift"
            description="Notes written during the shift appear here and carry over at handover."
            action={
              <Button variant="outline" size="sm">
                Add a note
              </Button>
            }
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function PlantOverviewFrames() {
  return (
    <div className="grid grid-cols-2 gap-4 bg-muted-background p-4">
      <AppFrame variant="sidebar" brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }} nav={PO_NAV.slice(0, 4)} current="overview" title="Sidebar">
        <SectionHeader size="sm" title="Product pages" description="A named product with five or more destinations." />
      </AppFrame>
      <AppFrame variant="topbar" brand={{ name: 'Nordkapp', mark: <IconFlame /> }} nav={PO_NAV.slice(0, 3)} current="overview" title="Top bar">
        <SectionHeader size="sm" title="Wide boards" description="Few destinations; the canvas keeps the full width." />
      </AppFrame>
      <AppFrame variant="rail" brand={{ name: 'Nordkapp', mark: <IconFlame /> }} nav={PO_NAV.slice(0, 4)} current="overview" title="Icon rail">
        <SectionHeader size="sm" title="Immersive screens" description="Navigation stays out of the way; labels live in tooltips." />
      </AppFrame>
      <AppFrame variant="masthead" brand={{ name: 'Nordkapp' }} nav={PO_NAV.slice(0, 3)} current="overview" title="Masthead">
        <SectionHeader size="sm" title="Reports and posters" description="The title is the chrome; sections read like a contents line." />
      </AppFrame>
    </div>
  );
}

export default definePage({
  id: 'plant-overview',
  title: 'Plant overview',
  summary:
    'The whole plant at a glance, built on the kit: one data set shown as eight different screens, one per look, and the parts they are made of.',
  guidance: {
    use: [
      'As the landing page of a plant, site or asset application.',
      'Pick the look for the room: studio for desks, console for operators, signal for wall screens, editorial for reports.',
      'Lead with the one figure or state that decides what the reader does next.',
    ],
    avoid: [
      'Restyling a look per page — change the look, or add to the kit.',
      'Status shown as a small dot: use a pill, an edge bar or a filled tile with the word.',
      'Monospace for tags, numbers or captions; it is for code only.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The default: the studio look in a sidebar frame.',
      specimens: [
        {
          id: 'PlantOverviewSignature',
          title: 'Studio',
          note: 'Pick it as the default landing page of a product used at a desk.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/TrendLine.tsx', 'kit/ListRow.tsx', 'looks/looks.css'],
          Component: PlantOverviewSignature,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same plant in seven other looks',
      description: 'Same data, different screen: each look moves the hero, changes how figures and state are shown, and brings its own chrome.',
      specimens: [
        {
          id: 'PlantOverviewConsole',
          title: 'Console',
          note: 'Pick it for operators who watch the screen all shift and need density and unmistakable state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/StatGroup.tsx', 'kit/DataTable.tsx', 'kit/HeatStrip.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewConsole,
        },
        {
          id: 'PlantOverviewPoster',
          title: 'Poster',
          note: 'Pick it for a team screen or a weekly review where four numbers have to land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewPoster,
        },
        {
          id: 'PlantOverviewGlass',
          title: 'Glass',
          note: 'Pick it for a showpiece or executive view on a dark display where one trend is the hero.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/TrendArea.tsx', 'kit/RingGauge.tsx', 'kit/Donut.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewGlass,
        },
        {
          id: 'PlantOverviewEditorial',
          title: 'Editorial',
          note: 'Pick it for a daily or weekly report that is read top to bottom, on screen or on paper.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/ChartFrame.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewEditorial,
        },
        {
          id: 'PlantOverviewSoft',
          title: 'Soft',
          note: 'Pick it for a personal start page or an internal tool used by occasional users.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Donut.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewSoft,
        },
        {
          id: 'PlantOverviewBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering and configuration tools where the screen should read like a drawing.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/TrendLine.tsx', 'kit/DataTable.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewBlueprint,
        },
        {
          id: 'PlantOverviewSignal',
          title: 'Signal',
          note: 'Pick it for a wall screen read from ten metres, where state matters more than any number.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Panel.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: PlantOverviewSignal,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The kit pieces on their own. They follow the look chosen in the theme menu, so switch it to see each part rebuilt.',
      specimens: [
        {
          id: 'PlantOverviewStats',
          title: 'Stat tiles',
          note: 'Pick a row of four for the figures that summarise the page.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'kit/SparkLine.tsx', 'kit/Delta.tsx'],
          Component: PlantOverviewStats,
        },
        {
          id: 'PlantOverviewStatSizes',
          title: 'Stat sizes',
          note: 'Pick the size by rank: one hero figure, a few large ones, small ones for supporting detail.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Grid.tsx'],
          Component: PlantOverviewStatSizes,
        },
        {
          id: 'PlantOverviewTrendArea',
          title: 'Trend area',
          note: 'Pick it for one quantity over time with its plan and a reference period.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/ChartFrame.tsx', 'kit/Legend.tsx'],
          Component: PlantOverviewTrendArea,
        },
        {
          id: 'PlantOverviewTrend',
          title: 'Trend lines with limits',
          note: 'Pick it to compare series against a limit line and a normal band.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/ChartFrame.tsx'],
          Component: PlantOverviewTrend,
        },
        {
          id: 'PlantOverviewBars',
          title: 'Bars',
          note: 'Pick single bars against a target, stacked bars for a split, horizontal bars for a ranking with long names.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx'],
          Component: PlantOverviewBars,
        },
        {
          id: 'PlantOverviewProportions',
          title: 'Donut and heat strip',
          note: 'Pick a donut for a split of a small whole and a heat strip for when and where something piles up.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/HeatStrip.tsx', 'kit/Legend.tsx'],
          Component: PlantOverviewProportions,
        },
        {
          id: 'PlantOverviewStatus',
          title: 'Status, deltas, tags and chips',
          note: 'Pick these small parts to say state, change and identity the same way on every screen.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/Delta.tsx', 'kit/TagId.tsx', 'kit/IconChip.tsx'],
          Component: PlantOverviewStatus,
        },
        {
          id: 'PlantOverviewGauges',
          title: 'Meters and ring gauges',
          note: 'Pick a meter when the limit matters and a ring when the share of a whole does.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/RingGauge.tsx'],
          Component: PlantOverviewGauges,
        },
        {
          id: 'PlantOverviewTable',
          title: 'Data table',
          note: 'Pick it for records with several comparable columns; the row edge carries the state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'primitives/table/Table.tsx'],
          Component: PlantOverviewTable,
        },
        {
          id: 'PlantOverviewLists',
          title: 'List rows and an empty panel',
          note: 'Pick list rows for records read one at a time, and the empty panel when there is nothing yet.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/EmptyPanel.tsx', 'kit/Panel.tsx'],
          Component: PlantOverviewLists,
        },
        {
          id: 'PlantOverviewFrames',
          title: 'App frames',
          note: 'Pick the chrome by how many destinations there are and how much the canvas needs the width.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/SectionHeader.tsx'],
          Component: PlantOverviewFrames,
        },
      ],
    },
  ],
});
