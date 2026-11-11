import { Button } from '@cognite/aura/components/button';
import {
  IconActivity,
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBolt,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconCloudOff,
  IconDownload,
  IconFlame,
  IconInbox,
  IconInfoCircle,
  IconLayoutDashboard,
  IconPlayerPause,
  IconRefresh,
  IconSettings,
  IconTool,
  IconTopologyStar3,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { BlockNotice } from '../../../library/kit/dashboard-blocks/BlockNotice';
import { DashFooter } from '../../../library/kit/dashboard-blocks/DashFooter';
import { FilterPills } from '../../../library/kit/dashboard-blocks/FilterPills';
import { LoadingBlock } from '../../../library/kit/dashboard-blocks/LoadingBlock';
import { RangeSwitch } from '../../../library/kit/dashboard-blocks/RangeSwitch';
import { StatusStrip, type StatusStripItem } from '../../../library/kit/dashboard-blocks/StatusStrip';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
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
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, PLANT_KPIS, SENSORS, WORK_ORDERS, childrenOf, findAsset, findPerson, type Alarm, type Asset, type WorkOrder } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatAgo, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-blocks.tsx?raw';

type DbStatProps = ComponentProps<typeof Stat>;

const DB_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const DB_EXPORT_VALUES = [...DB_EXPORT.slice(0, -1).map((point) => point.v), PLANT_KPIS.gasExport.value];

const DB_HOURS = DB_EXPORT.map((point) => formatTime(point.t));

const DB_PRESSURE = makeValues({ seed: 11, points: 25, base: 48.4, amplitude: 1.1, noise: 0.3, cycles: 2 });

const DB_TEMPERATURE = makeValues({ seed: 13, points: 25, base: 136.2, drift: 5, amplitude: 1.5, noise: 0.5, cycles: 2 });

const DB_DAYS = Array.from({ length: 7 }, (_, index) => formatDate(REFERENCE_NOW - (6 - index) * DAY));

const DB_DAILY = [4.41, 4.46, 3.62, 3.98, 4.21, 4.33, 4.38];

const DB_AREAS = childrenOf('nk');

const DB_UNITS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const DB_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const DB_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');

const DB_SEVERITY_TONE: Record<Alarm['severity'], Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const DB_SEVERITY_LABEL: Record<Alarm['severity'], string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const DB_STATE_TONE: Record<Asset['state'], Tone> = { running: 'success', standby: 'info', stopped: 'neutral', tripped: 'critical', maintenance: 'warning' };

const DB_STATE_LABEL: Record<Asset['state'], string> = { running: 'Running', standby: 'Standby', stopped: 'Stopped', tripped: 'Tripped', maintenance: 'Maintenance' };

const DB_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const DB_ORDER_TONE: Record<WorkOrder['status'], Tone> = { open: 'neutral', planned: 'info', 'in-progress': 'success', waiting: 'warning', done: 'neutral' };

const DB_ORDER_LABEL: Record<WorkOrder['status'], string> = { open: 'Open', planned: 'Planned', 'in-progress': 'In progress', waiting: 'Waiting', done: 'Done' };

const DB_KPI_EXPORT: DbStatProps = {
  label: 'Gas export',
  value: PLANT_KPIS.gasExport.value,
  decimals: 2,
  unit: 'MSm³/d',
  icon: <IconFlame />,
  tone: 'blue',
  delta: { value: 0.17, decimals: 2, caption: 'vs yesterday' },
  sparkline: DB_EXPORT_VALUES,
};

const DB_KPI_AVAILABILITY: DbStatProps = {
  label: 'Availability',
  value: PLANT_KPIS.availability.value,
  decimals: 1,
  unit: '%',
  icon: <IconActivity />,
  tone: 'teal',
  delta: { value: -0.7, caption: 'vs last week' },
  sparkline: makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 }),
};

const DB_KPI_ENERGY: DbStatProps = {
  label: 'Energy intensity',
  value: PLANT_KPIS.energyIntensity.value,
  decimals: 1,
  unit: 'kWh/boe',
  icon: <IconBolt />,
  tone: 'purple',
  delta: { value: -1.4, good: 'down', caption: 'vs last week' },
  sparkline: makeValues({ seed: 43, points: 24, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8 }),
};

const DB_KPI_ALARMS: DbStatProps = {
  label: 'Active alarms',
  value: PLANT_KPIS.activeAlarms.value,
  icon: <IconBell />,
  tone: 'critical',
  delta: { value: -3, decimals: 0, good: 'down', caption: 'vs yesterday' },
  sparkline: [7, 6, 6, 8, 7, 5, 6, 5, 4, 5, 6, 4],
};

const DB_KPI_FLARING: DbStatProps = {
  label: 'Flaring',
  value: PLANT_KPIS.flaring.value,
  decimals: 1,
  unit: 'kSm³/d',
  tone: 'amber',
  target: 'Limit 15.0',
};

const DB_KPI_ORDERS: DbStatProps = {
  label: 'Open work orders',
  value: PLANT_KPIS.openWorkOrders.value,
  tone: 'sky',
  delta: { value: -4, decimals: 0, good: 'down', caption: 'vs last week' },
};

const DB_RANGES = [
  { id: '8h', label: '8 h' },
  { id: '24h', label: '24 h' },
  { id: '7d', label: '7 d' },
];

const DB_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', nowrap: true, cell: (unit) => unit.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (unit) => <TagId>{unit.tag}</TagId> },
  { id: 'area', header: 'Area', nowrap: true, muted: true, cell: (unit) => findAsset(unit.parentId ?? '')?.name ?? '' },
  { id: 'state', header: 'State', nowrap: true, cell: (unit) => <StatusPill tone={DB_STATE_TONE[unit.state]}>{DB_STATE_LABEL[unit.state]}</StatusPill> },
  { id: 'crit', header: 'Criticality', align: 'center', cell: (unit) => unit.criticality },
  { id: 'health', header: 'Health', numeric: true, cell: (unit) => `${unit.healthScore} %` },
];

const DB_STRIP: StatusStripItem[] = DB_UNITS.slice(0, 8).map((unit) => ({
  id: unit.id,
  label: unit.name,
  state: DB_STATE_LABEL[unit.state],
  tone: DB_STATE_TONE[unit.state],
  detail: unit.tag,
}));

const DB_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

function DbSheet({ look, children }: { look: LookId; children: ReactNode }) {
  return (
    <LookScope look={look}>
      <Canvas>{children}</Canvas>
    </LookScope>
  );
}

function DbSeverityIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon />;
  if (severity === 'high') return <IconAlertTriangle />;
  if (severity === 'medium') return <IconInfoCircle />;
  return <IconBell />;
}

function DbAlarmRows({ alarms = DB_OPEN_ALARMS }: { alarms?: readonly Alarm[] }) {
  return (
    <ul>
      {alarms.map((alarm) => (
        <ListRow
          key={alarm.id}
          tone={DB_SEVERITY_TONE[alarm.severity]}
          leading={
            <IconChip tone={DB_SEVERITY_TONE[alarm.severity]} size="sm">
              <DbSeverityIcon severity={alarm.severity} />
            </IconChip>
          }
          title={alarm.message}
          meta={
            <>
              <StatusPill tone={DB_SEVERITY_TONE[alarm.severity]} variant="outline">
                {DB_SEVERITY_LABEL[alarm.severity]}
              </StatusPill>
              <TagId>{alarm.sensorTag}</TagId>
              <span>{alarm.value}</span>
            </>
          }
          trailing={formatAgo(alarm.raisedAt)}
        />
      ))}
    </ul>
  );
}

function DbOrderRows({ limit = 5 }: { limit?: number }) {
  return (
    <ul>
      {DB_OPEN_ORDERS.slice(0, limit).map((order) => (
        <ListRow
          key={order.id}
          title={order.title}
          meta={
            <>
              <StatusPill tone={DB_ORDER_TONE[order.status]}>{DB_ORDER_LABEL[order.status]}</StatusPill>
              <span>
                {order.priority} · {findPerson(order.assigneeId)?.name ?? 'Unassigned'}
              </span>
            </>
          }
          trailing={`Due ${formatDate(order.dueAt)}`}
        />
      ))}
    </ul>
  );
}

function DbExportChart({ range = '24h', height = 250, notes }: { range?: string; height?: number; notes?: ReactNode }) {
  if (range === '7d') {
    return (
      <Bars
        label="Gas export per day for the last seven days against the plan"
        categories={DB_DAYS}
        series={[{ id: 'export', label: 'Export', values: DB_DAILY, tone: 'accent' }]}
        unit="MSm³/d"
        decimals={2}
        height={height}
        limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }}
        notes={notes}
      />
    );
  }
  const from = range === '8h' ? 16 : 0;
  return (
    <TrendArea
      label="Gas export against the daily plan"
      labels={DB_HOURS.slice(from)}
      unit="MSm³/d"
      decimals={2}
      height={height}
      series={[{ id: 'export', label: 'Export', values: DB_EXPORT_VALUES.slice(from), tone: 'accent' }]}
      limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
      notes={notes}
    />
  );
}

function DbPressureChart({ height = 230 }: { height?: number }) {
  return (
    <TrendLine
      label="Discharge pressure over the last 24 hours against the high limit"
      labels={DB_HOURS}
      unit="barg"
      height={height}
      series={[{ id: 'pressure', label: 'Discharge pressure', values: DB_PRESSURE, tone: 'accent' }]}
      limits={[{ value: 52, label: 'High', tone: 'critical' }]}
      bands={[{ from: 44, to: 50, tone: 'success' }]}
      yDomain={[42, 54]}
    />
  );
}

function DbDailyBars({ height = 230 }: { height?: number }) {
  return (
    <Bars
      label="Gas export per day for the last seven days against the plan"
      categories={DB_DAYS}
      series={[{ id: 'export', label: 'Export', values: DB_DAILY }]}
      tones={DB_DAILY.map((value) => (value < 4 ? 'critical' : value < 4.3 ? 'warning' : 'accent'))}
      decimals={2}
      showValues
      height={height}
      limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }}
    />
  );
}

function DashBlockKpiFour() {
  return (
    <DbSheet look="studio">
      <StatGroup columns={4} label="Plant KPIs">
        <Stat {...DB_KPI_EXPORT} emphasis="strong" />
        <Stat {...DB_KPI_AVAILABILITY} />
        <Stat {...DB_KPI_ENERGY} />
        <Stat {...DB_KPI_ALARMS} state="Critical" stateIcon={<IconAlertOctagon />} />
      </StatGroup>
    </DbSheet>
  );
}

function DashBlockKpiHero() {
  return (
    <DbSheet look="soft">
      <Grid>
        <Stat className="col-span-6" size="hero" {...DB_KPI_EXPORT} target="Plan 4.50 MSm³/d" />
        <Stat className="col-span-3" size="lg" {...DB_KPI_AVAILABILITY} target="Target 97.5 %" />
        <Stat className="col-span-3" size="lg" {...DB_KPI_ENERGY} target="Target 30.0" />
      </Grid>
    </DbSheet>
  );
}

function DashBlockKpiStrip() {
  return (
    <DbSheet look="console">
      <Panel title="Plant figures" subtitle="Live · 14:00 UTC" padding="none">
        <StatGroup columns={6} joined label="Plant figures">
          <Stat variant="plain" size="sm" {...DB_KPI_EXPORT} icon={undefined} />
          <Stat variant="plain" size="sm" {...DB_KPI_AVAILABILITY} icon={undefined} />
          <Stat variant="plain" size="sm" {...DB_KPI_ENERGY} icon={undefined} />
          <Stat variant="plain" size="sm" {...DB_KPI_FLARING} />
          <Stat variant="plain" size="sm" {...DB_KPI_ALARMS} icon={undefined} />
          <Stat variant="plain" size="sm" {...DB_KPI_ORDERS} />
        </StatGroup>
      </Panel>
    </DbSheet>
  );
}

function DashBlockKpiBlocks() {
  return (
    <DbSheet look="poster">
      <StatGroup columns={3} label="Plant KPIs">
        <Stat size="lg" {...DB_KPI_EXPORT} sparkline={undefined} target="Plan 4.50" />
        <Stat size="lg" {...DB_KPI_AVAILABILITY} sparkline={undefined} tone="green" target="Target 97.5" />
        <Stat size="lg" {...DB_KPI_FLARING} delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} />
      </StatGroup>
    </DbSheet>
  );
}

function DashBlockKpiStates() {
  return (
    <DbSheet look="signal">
      <StatGroup columns={4} label="Plant state">
        <Stat label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" tone="warning" state="Under plan" stateIcon={<IconAlertTriangle />} target="Plan 4.50" />
        <Stat label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" tone="warning" state="Watch" stateIcon={<IconAlertTriangle />} target="Target 97.5" />
        <Stat label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" tone="success" state="Normal" stateIcon={<IconCircleCheck />} target="Limit 15.0" />
        <Stat label="Active alarms" value={PLANT_KPIS.activeAlarms.value} tone="critical" state="Critical" stateIcon={<IconAlertOctagon />} target="1 unacknowledged" />
      </StatGroup>
    </DbSheet>
  );
}

function DashBlockChartAndList() {
  return (
    <DbSheet look="studio">
      <Grid>
        <Panel className="col-span-8" title="Gas export" subtitle="Last 24 hours against the daily plan" icon={<IconChip tone="blue"><IconFlame /></IconChip>}>
          <DbExportChart />
        </Panel>
        <Panel className="col-span-4" title="Open alarms" subtitle="Most severe first" actions={<Button variant="ghost" size="sm">View all</Button>}>
          <DbAlarmRows alarms={DB_OPEN_ALARMS.slice(0, 4)} />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockTwoCharts() {
  return (
    <DbSheet look="glass">
      <Grid>
        <Panel className="col-span-6" title="Discharge pressure" subtitle="23-PT-92531 · green band is normal operation">
          <DbPressureChart />
        </Panel>
        <Panel className="col-span-6" title="Export per day" subtitle="Last seven days against the 4.50 plan">
          <DbDailyBars />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockChartAndTiles() {
  return (
    <DbSheet look="blueprint">
      <Grid>
        <Panel className="col-span-9" title="Discharge temperature" subtitle="23-TT-92532 · °C · 24 h">
          <TrendLine
            label="Discharge temperature over the last 24 hours against the high and trip limits"
            labels={DB_HOURS}
            unit="°C"
            height={300}
            series={[{ id: 'temperature', label: 'Discharge temperature', values: DB_TEMPERATURE, tone: 'accent' }]}
            limits={[
              { value: 145, label: 'High', tone: 'warning' },
              { value: 155, label: 'Trip', tone: 'critical' },
            ]}
            yDomain={[125, 160]}
          />
        </Panel>
        <Grid stack className="col-span-3">
          <Stat label="Now" value={141.2} decimals={1} unit="°C" target="High 145.0" />
          <Stat label="24 h maximum" value={Math.max(...DB_TEMPERATURE)} decimals={1} unit="°C" target="at 12:00" />
          <Stat label="Margin to trip" value={155 - 141.2} decimals={1} unit="°C" target="Trip 155.0" />
        </Grid>
      </Grid>
    </DbSheet>
  );
}

function DashBlockMosaic() {
  return (
    <DbSheet look="soft">
      <Grid>
        <Panel className="col-span-4" tone="purple" title="Order mix" subtitle="Open, by type">
          <Donut
            label="Open work orders by type"
            centerCaption="open"
            segments={[
              { label: 'Corrective', value: 2, tone: 'pink' },
              { label: 'Preventive', value: 2, tone: 'blue' },
              { label: 'Inspection', value: 1, tone: 'teal' },
              { label: 'Modification', value: 1, tone: 'amber' },
            ]}
          />
        </Panel>
        <Panel className="col-span-4" tone="teal" title="Area health" subtitle="Condition score per area">
          <div className="grid grid-cols-2 place-items-center gap-4">
            {DB_AREAS.map((area) => (
              <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={88} tone={DB_HEALTH_TONE[area.health]} />
            ))}
          </div>
        </Panel>
        <Panel className="col-span-4" tone="amber" title="Compression train" subtitle="Against the high limit">
          <div className="flex flex-col gap-5">
            {SENSORS.filter((sensor) => ['pt-92531', 'tt-92532', 'vt-92540'].includes(sensor.id)).map((sensor) => (
              <Meter
                key={sensor.id}
                label={sensor.name}
                value={sensor.value}
                max={sensor.rangeMax}
                unit={sensor.unit}
                decimals={sensor.decimals}
                high={sensor.highLimit}
                target={{ value: sensor.highLimit, label: 'High' }}
                tone={sensor.value / sensor.highLimit > 0.95 ? 'warning' : 'accent'}
                hideScale
              />
            ))}
          </div>
        </Panel>
        <Panel className="col-span-12" title="Alarm load" subtitle="Alarms per hour by area, last 24 hours">
          <HeatStrip
            label="Alarms per hour by area over the last 24 hours"
            size="lg"
            rows={DB_AREAS.map((area, index) => ({
              label: area.name,
              values: makeValues({ seed: 60 + index, points: 24, base: index === 1 ? 5 : 1.5, amplitude: index === 1 ? 3 : 1, noise: 1, min: 0, decimals: 0 }),
              tone: index === 1 ? 'warning' : 'accent',
            }))}
            ticks={['24 h ago', '18 h', '12 h', '6 h', 'Now']}
            scale={{ label: 'Alarms per hour', low: '0', high: '9' }}
            max={9}
          />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockAnnotatedChart() {
  return (
    <DbSheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" eyebrow="Production" title="Export recovered to 97 % of plan after the recompressor trip" size="md" />
        <div className="col-span-9">
          <DbExportChart
            height={280}
            notes={
              <>
                <p>
                  <strong>02:00–08:00.</strong> Export fell to 4.19 MSm³/d while the recompressor was down and gas was recycled.
                </p>
                <p>
                  <strong>10:00.</strong> The second stage took the load; export has climbed since.
                </p>
              </>
            }
          />
        </div>
        <Grid stack className="col-span-3">
          <Stat variant="plain" size="lg" label="Export now" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} />
          <Stat variant="plain" size="md" label="Shortfall today" value={0.12} decimals={2} unit="MSm³" target="2.7 % of plan" />
        </Grid>
      </Grid>
    </DbSheet>
  );
}

function DashBlockTable() {
  return (
    <DbSheet look="console">
      <Panel
        title="Equipment"
        subtitle={`${DB_UNITS.length} units · Nordkapp`}
        padding="none"
        actions={
          <Button variant="outline" size="sm">
            <IconDownload /> Export
          </Button>
        }
        footer="Tripped and maintenance units are marked on the row edge."
      >
        <DataTable
          label="Equipment"
          flush
          columns={DB_UNIT_COLUMNS}
          rows={DB_UNITS}
          rowKey={(unit) => unit.id}
          rowTone={(unit) => (unit.state === 'running' ? undefined : DB_STATE_TONE[unit.state])}
        />
      </Panel>
    </DbSheet>
  );
}

function DashBlockAlarmsAndOrders() {
  return (
    <DbSheet look="studio">
      <Grid>
        <Panel className="col-span-6" title="Open alarms" subtitle={`${DB_OPEN_ALARMS.length} open, most severe first`} icon={<IconChip tone="critical"><IconBell /></IconChip>}>
          <DbAlarmRows />
        </Panel>
        <Panel className="col-span-6" title="Work orders" subtitle="Open and planned, by due date" icon={<IconChip tone="blue"><IconTool /></IconChip>}>
          <DbOrderRows />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockStatusStrip() {
  const [selectedId, setSelectedId] = useState('23-ka-9103');
  const unit = findAsset(selectedId);
  return (
    <DbSheet look="signal">
      <Grid stack>
        <StatusStrip label="Unit states in process order" items={DB_STRIP} selectedId={selectedId} onSelect={setSelectedId} />
        {unit ? (
          <Panel tone={DB_STATE_TONE[unit.state]} padding="tight">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="text-2xl leading-8 font-bold">
                {unit.name} · {DB_STATE_LABEL[unit.state]}
              </p>
              <p className="text-base font-medium">
                {unit.tag} · health {unit.healthScore} % · criticality {unit.criticality}
              </p>
            </div>
          </Panel>
        ) : null}
      </Grid>
    </DbSheet>
  );
}

function DashBlockAreaRanking() {
  return (
    <DbSheet look="poster">
      <Grid>
        <Panel className="col-span-7" title="Area health" subtitle="Condition score out of 100">
          <Bars
            label="Condition score per area"
            orientation="horizontal"
            categories={DB_AREAS.map((area) => area.name)}
            series={[{ id: 'score', label: 'Score', values: DB_AREAS.map((area) => area.healthScore) }]}
            tones={DB_AREAS.map((area) => DB_HEALTH_TONE[area.health])}
            showValues
            height={240}
          />
        </Panel>
        <Grid stack className="col-span-5">
          <Stat size="lg" label="Weakest area" value="Gas compression" tone="warning" target="Score 78 · 4 open alarms" />
          <Stat size="lg" label="Units below 70 %" value={3} tone="critical" target="of 11 units" />
        </Grid>
      </Grid>
    </DbSheet>
  );
}

function DashBlockHeaderRange() {
  const [range, setRange] = useState('24h');
  return (
    <DbSheet look="studio">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="lg"
          eyebrow="Nordkapp"
          title="Production"
          description="Thursday 12 March · updated 14:00 UTC"
          actions={
            <>
              <RangeSwitch label="Time range" options={DB_RANGES} value={range} onChange={setRange} />
              <Button variant="outline" size="sm">
                <IconRefresh /> Refresh
              </Button>
            </>
          }
        />
        <Panel className="col-span-12" title="Gas export" subtitle={range === '7d' ? 'Per day, last seven days' : `Last ${range === '8h' ? '8' : '24'} hours`}>
          <DbExportChart range={range} height={220} />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockHeaderFilters() {
  const [areas, setAreas] = useState<readonly string[]>(['nk-23']);
  const toggle = (id: string) => setAreas((current) => (current.includes(id) ? current.filter((area) => area !== id) : [...current, id]));
  const inArea = (alarm: Alarm) => areas.includes(findAsset(alarm.assetId)?.parentId ?? '');
  const shown = ALARMS.filter(inArea);
  return (
    <DbSheet look="blueprint">
      <Grid>
        <SectionHeader
          className="col-span-12"
          title="Alarms"
          description={`${shown.length} of ${ALARMS.length} alarms in the selected areas`}
          actions={
            <FilterPills
              label="Filter by area"
              items={DB_AREAS.map((area) => ({ id: area.id, label: area.name, count: ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === area.id).length }))}
              selected={areas}
              onToggle={toggle}
            />
          }
        />
        <Panel className="col-span-12" title="Alarm list" subtitle="All states">
          {shown.length > 0 ? (
            <DbAlarmRows alarms={shown} />
          ) : (
            <EmptyPanel icon={<IconInbox />} title="No area selected" description="Switch on at least one area to list its alarms." />
          )}
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockFooter() {
  return (
    <DbSheet look="editorial">
      <Grid stack>
        <SectionHeader eyebrow="Section 2" title="Reliability" description="How often the plant was able to run, and how long between failures." size="sm" />
        <StatGroup columns={3} label="Reliability">
          <Stat variant="plain" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" target="Target 97.5 %" />
          <Stat variant="plain" label="Mean time between failures" value={PLANT_KPIS.mtbf.value} unit="h" delta={{ value: 16, decimals: 0, unit: ' h', caption: 'vs last quarter' }} />
          <Stat variant="plain" label="Days since last incident" value={PLANT_KPIS.daysSinceIncident.value} target="Record 365" />
        </StatGroup>
        <DashFooter
          items={[
            { label: 'Source', value: 'Nordkapp historian' },
            { label: 'Period', value: '6–12 March 2026' },
            { label: 'Refreshed', value: '12 Mar, 14:00 UTC' },
          ]}
          note="Availability excludes planned stops. Figures are preliminary until the daily report is signed."
          actions={
            <Button variant="outline" size="sm">
              <IconDownload /> Export
            </Button>
          }
        />
      </Grid>
    </DbSheet>
  );
}

function DashBlockLoading() {
  return (
    <DbSheet look="studio">
      <Grid>
        <Panel className="col-span-3">
          <LoadingBlock label="Loading gas export" kind="stat" />
        </Panel>
        <Panel className="col-span-5" title="Gas export" subtitle="Loading the last 24 hours">
          <LoadingBlock label="Loading gas export trend" kind="chart" />
        </Panel>
        <Panel className="col-span-4" title="Open alarms" subtitle="Loading">
          <LoadingBlock label="Loading open alarms" kind="list" rows={3} />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockEmptyAndError() {
  return (
    <DbSheet look="glass">
      <Grid>
        <Panel className="col-span-4" title="Open alarms">
          <EmptyPanel icon={<IconCircleCheck />} title="No open alarms" description="Every alarm raised in the last 24 hours has cleared." />
        </Panel>
        <Panel className="col-span-4" title="Work orders">
          <BlockNotice
            variant="block"
            tone="critical"
            icon={<IconCloudOff />}
            title="Could not load work orders"
            detail="The maintenance system did not answer within 10 seconds. Other blocks are unaffected."
            action={
              <Button variant="outline" size="sm">
                <IconRefresh /> Try again
              </Button>
            }
          />
        </Panel>
        <Panel className="col-span-4" title="Lab results">
          <EmptyPanel icon={<IconInbox />} title="No samples this shift" description="Results appear here when the lab releases the first sample." action={<Button size="sm">Request sample</Button>} />
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockStale() {
  return (
    <DbSheet look="console">
      <Grid>
        <Panel className="col-span-4" title="Bearing temperature" subtitle="40-TT-40015">
          <div className="flex flex-col gap-3">
            <BlockNotice tone="critical" icon={<IconCloudOff />} title="Signal lost" detail="Bad quality since 05:02" />
            <Stat variant="plain" size="lg" label="Last good value" value={61.4} decimals={1} unit="°C" target="at 05:01" />
          </div>
        </Panel>
        <Panel className="col-span-4" title="Cooler outlet temperature" subtitle="23-TT-91141">
          <div className="flex flex-col gap-3">
            <BlockNotice tone="warning" icon={<IconAlertTriangle />} title="Uncertain quality" detail="Transmitter drift suspected" />
            <Stat variant="plain" size="lg" label="Reading" value={38.9} decimals={1} unit="°C" target="High 40.0" />
          </div>
        </Panel>
        <Panel className="col-span-4" title="Gas export" subtitle="27-FT-20011">
          <div className="flex flex-col gap-3">
            <BlockNotice tone="info" icon={<IconPlayerPause />} title="Updates paused" detail="Showing 13:12, 48 min old" action={<Button variant="outline" size="sm">Resume</Button>} />
            <Stat variant="plain" size="lg" label="Export at 13:12" value={4.31} decimals={2} unit="MSm³/d" target="Plan 4.50" />
          </div>
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockAssembled() {
  const [range, setRange] = useState('24h');
  return (
    <LookScope look="studio">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={DB_NAV}
        current="overview"
        title="Operations"
        subtitle="Thursday 12 March · updated 14:00 UTC"
        status={
          <StatusPill tone="warning" icon={<IconAlertTriangle />}>
            Reduced capacity
          </StatusPill>
        }
        actions={<RangeSwitch label="Time range" options={DB_RANGES} value={range} onChange={setRange} />}
      >
        <Grid>
          <Stat className="col-span-3" {...DB_KPI_EXPORT} emphasis="strong" />
          <Stat className="col-span-3" {...DB_KPI_AVAILABILITY} />
          <Stat className="col-span-3" {...DB_KPI_ENERGY} />
          <Stat className="col-span-3" {...DB_KPI_ALARMS} />
          <Panel className="col-span-8" title="Gas export" subtitle="Against the daily plan">
            <DbExportChart range={range} height={260} />
          </Panel>
          <Panel className="col-span-4" title="Open alarms" subtitle="Most severe first">
            <DbAlarmRows alarms={DB_OPEN_ALARMS.slice(0, 4)} />
          </Panel>
          <Panel className="col-span-12" title="Unit states" subtitle="In process order">
            <StatusStrip label="Unit states in process order" items={DB_STRIP} />
          </Panel>
          <Panel className="col-span-7" title="Equipment" subtitle={`${DB_UNITS.length} units`} padding="none">
            <DataTable label="Equipment" flush columns={DB_UNIT_COLUMNS.filter((column) => column.id !== 'area')} rows={DB_UNITS.slice(0, 6)} rowKey={(unit) => unit.id} rowTone={(unit) => (unit.state === 'running' ? undefined : DB_STATE_TONE[unit.state])} />
          </Panel>
          <Panel className="col-span-5" title="Work orders" subtitle="Open and planned">
            <DbOrderRows limit={4} />
          </Panel>
          <DashFooter
            className="col-span-12"
            items={[
              { label: 'Source', value: 'Nordkapp historian' },
              { label: 'Refreshed', value: '14:00 UTC' },
            ]}
            note="Availability excludes planned stops."
          />
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function DashBlockAssembledWall() {
  return (
    <DbSheet look="signal">
      <Grid>
        <Stat className="col-span-5" size="hero" label="Plant state" value="Reduced" tone="warning" state="Recompressor tripped 13:46" stateIcon={<IconAlertTriangle />} target="Export at 97 % of plan" />
        <Stat className="col-span-2" size="lg" label="Critical alarms" value={1} tone="critical" state="Act now" stateIcon={<IconAlertOctagon />} />
        <Stat className="col-span-2" size="lg" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" tone="success" state="Normal" stateIcon={<IconCircleCheck />} />
        <Stat className="col-span-3" size="lg" label="Days since incident" value={PLANT_KPIS.daysSinceIncident.value} tone="success" state="On track" stateIcon={<IconCircleCheck />} />
        <StatusStrip className="col-span-12" label="Unit states in process order" items={DB_STRIP} />
        <Panel className="col-span-8" title="Gas export">
          <DbExportChart height={220} />
        </Panel>
        <Panel className="col-span-4" tone="critical" title="Open alarms">
          <ul>
            {DB_OPEN_ALARMS.slice(0, 3).map((alarm) => (
              <ListRow key={alarm.id} title={alarm.message} meta={`${alarm.sensorTag} · ${alarm.value}`} trailing={formatAgo(alarm.raisedAt)} />
            ))}
          </ul>
        </Panel>
      </Grid>
    </DbSheet>
  );
}

function DashBlockAssembledReport() {
  return (
    <LookScope look="editorial">
      <AppFrame brand={{ name: 'Nordkapp weekly', detail: 'Week 11 · 6–12 March 2026' }} nav={[]} title="Production held within 3 % of plan despite two compressor events" subtitle="Prepared by Liv Wold, shift supervisor">
        <Grid>
          <StatGroup className="col-span-12" columns={4} label="Week figures">
            <Stat variant="plain" size="lg" {...DB_KPI_EXPORT} icon={undefined} sparkline={undefined} />
            <Stat variant="plain" size="lg" {...DB_KPI_AVAILABILITY} icon={undefined} sparkline={undefined} />
            <Stat variant="plain" size="lg" {...DB_KPI_ENERGY} icon={undefined} sparkline={undefined} />
            <Stat variant="plain" size="lg" {...DB_KPI_FLARING} />
          </StatGroup>
          <Panel className="col-span-7" title="Export per day" subtitle="MSm³/d against the 4.50 plan">
            <DbDailyBars height={250} />
          </Panel>
          <Panel className="col-span-5" title="What happened">
            <ul>
              {ALARMS.slice(0, 4).map((alarm) => (
                <ListRow key={alarm.id} title={alarm.message} meta={`${findAsset(alarm.assetId)?.name ?? ''} · ${alarm.value}`} trailing={formatAgo(alarm.raisedAt)} />
              ))}
            </ul>
          </Panel>
          <DashFooter
            className="col-span-12"
            items={[
              { label: 'Source', value: 'Nordkapp historian' },
              { label: 'Period', value: '6–12 March 2026' },
              { label: 'Issued', value: '12 Mar, 14:00 UTC' },
            ]}
            note="Figures are preliminary until the weekly report is signed."
          />
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

export default definePage({
  id: 'dashboard-blocks',
  title: 'Dashboard blocks',
  summary:
    'Ready-made rows for a dashboard — KPI rows, chart rows, lists, headers, footers and their loading, empty and error states — each drawn in the look it suits best, then assembled into three boards.',
  guidance: {
    use: [
      'Build a board from whole rows: one KPI row, one or two chart rows, then lists and tables.',
      'Keep every row on the 12-column grid so panels in neighbouring rows share edges.',
      'Give each block its own loading, empty and error state so one failed source does not blank the board.',
      'Close the board with where the data comes from and when it was refreshed.',
    ],
    avoid: [
      'More than six figures in a KPI row; move the rest into a table.',
      'Mixing looks on one board. Pick one and let every block follow it.',
      'A chart without its unit, its plan or limit line and its current value.',
      'Hiding stale data behind a normal-looking figure.',
    ],
  },
  source,
  sections: [
    {
      id: 'kpi-rows',
      title: 'KPI rows',
      description: 'The figures that open a board, in five anatomies.',
      specimens: [
        {
          id: 'DashBlockKpiFour',
          title: 'Four tiles with trends',
          note: 'Pick it as the default opening row: four figures with change and recent trend, the leading one filled.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DashBlockKpiFour,
        },
        {
          id: 'DashBlockKpiHero',
          title: 'One hero and two regular',
          note: 'Pick it when one figure is the reason the board exists and two more qualify it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Grid.tsx', 'looks/LookScope.tsx'],
          Component: DashBlockKpiHero,
        },
        {
          id: 'DashBlockKpiStrip',
          title: 'Joined strip of six',
          note: 'Pick it for an operator console: six figures on one surface divided by hairlines, no tiles.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: DashBlockKpiStrip,
        },
        {
          id: 'DashBlockKpiBlocks',
          title: 'Three colour blocks',
          note: 'Pick it for a lobby or town-hall board where three numbers must carry from a distance.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DashBlockKpiBlocks,
        },
        {
          id: 'DashBlockKpiStates',
          title: 'State tiles',
          note: 'Pick it for a wall screen: the judgement is the headline and the number supports it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DashBlockKpiStates,
        },
      ],
    },
    {
      id: 'chart-rows',
      title: 'Chart rows',
      description: 'A chart with what it needs beside it.',
      specimens: [
        {
          id: 'DashBlockChartAndList',
          title: 'Chart and list, 8 + 4',
          note: 'Pick it for the main row: the leading trend with the list that explains its dips.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: DashBlockChartAndList,
        },
        {
          id: 'DashBlockTwoCharts',
          title: 'Two charts, 6 + 6',
          note: 'Pick it to put a live trend beside a daily summary of equal weight.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: DashBlockTwoCharts,
        },
        {
          id: 'DashBlockChartAndTiles',
          title: 'Chart with a tile column, 9 + 3',
          note: 'Pick it when three derived figures should sit beside the trend they come from.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Stat.tsx', 'kit/Grid.tsx'],
          Component: DashBlockChartAndTiles,
        },
        {
          id: 'DashBlockAnnotatedChart',
          title: 'Annotated chart with figures',
          note: 'Pick it for a report: the chart is read with the notes that explain it and the figures that sum it up.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/SectionHeader.tsx', 'kit/Stat.tsx'],
          Component: DashBlockAnnotatedChart,
        },
        {
          id: 'DashBlockMosaic',
          title: 'Mixed mosaic',
          note: 'Pick it for the supporting row: a split, four shares, three limits and a heat strip across.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/HeatStrip.tsx'],
          Component: DashBlockMosaic,
        },
      ],
    },
    {
      id: 'lists-and-status',
      title: 'Lists, tables and status',
      description: 'Records and states that complete a board.',
      specimens: [
        {
          id: 'DashBlockTable',
          title: 'Table block with header action',
          note: 'Pick it for a register: dense rows, the state on the row edge and one action in the title strip.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: DashBlockTable,
        },
        {
          id: 'DashBlockAlarmsAndOrders',
          title: 'Alarm and work order pair',
          note: 'Pick it to put what is wrong beside what is being done about it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/Panel.tsx', 'kit/IconChip.tsx'],
          Component: DashBlockAlarmsAndOrders,
        },
        {
          id: 'DashBlockStatusStrip',
          title: 'Status strip',
          note: 'Pick it to show every unit in process order; select a cell to read its detail.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/StatusStrip.tsx', 'kit/Panel.tsx'],
          Component: DashBlockStatusStrip,
        },
        {
          id: 'DashBlockAreaRanking',
          title: 'Ranking with call-outs',
          note: 'Pick it to rank a handful of areas and call out the weakest in words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: DashBlockAreaRanking,
        },
      ],
    },
    {
      id: 'headers-and-footers',
      title: 'Headers and footers',
      description: 'What frames a board: its title, its controls and where the data comes from.',
      specimens: [
        {
          id: 'DashBlockHeaderRange',
          title: 'Header with range switch',
          note: 'Pick it when the whole board follows one period; the switch redraws the chart below.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/RangeSwitch.tsx', 'kit/SectionHeader.tsx', 'kit/TrendArea.tsx'],
          Component: DashBlockHeaderRange,
        },
        {
          id: 'DashBlockHeaderFilters',
          title: 'Header with filter pills',
          note: 'Pick it when readers narrow the board by area; each pill carries its count.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/FilterPills.tsx', 'kit/SectionHeader.tsx', 'kit/ListRow.tsx'],
          Component: DashBlockHeaderFilters,
        },
        {
          id: 'DashBlockFooter',
          title: 'Section divider and footer',
          note: 'Pick it to open a band with a title and to close the board with source, period and refresh time.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/DashFooter.tsx', 'kit/SectionHeader.tsx', 'kit/StatGroup.tsx'],
          Component: DashBlockFooter,
        },
      ],
    },
    {
      id: 'row-states',
      title: 'Row states',
      description: 'What a block shows when its data is on the way, absent, failed or old.',
      specimens: [
        {
          id: 'DashBlockLoading',
          title: 'Loading row',
          note: 'Pick it while data is on the way: placeholders in the shape of the figure, the chart and the list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/LoadingBlock.tsx', 'kit/Panel.tsx'],
          Component: DashBlockLoading,
        },
        {
          id: 'DashBlockEmptyAndError',
          title: 'Empty and failed blocks',
          note: 'Pick it to tell "nothing to show" from "could not load": one is good news, the other needs a retry.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/EmptyPanel.tsx', 'kit/dashboard-blocks/BlockNotice.tsx', 'kit/Panel.tsx'],
          Component: DashBlockEmptyAndError,
        },
        {
          id: 'DashBlockStale',
          title: 'Stale and uncertain data',
          note: 'Pick it when a value is old, doubtful or lost: the notice sits above the figure and says since when.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/BlockNotice.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: DashBlockStale,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'The same rows assembled into three boards.',
      specimens: [
        {
          id: 'DashBlockAssembled',
          title: 'Operations board',
          note: 'Pick it as a starting point for a desk dashboard: KPI row, chart and list, status strip, table and footer.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/dashboard-blocks/StatusStrip.tsx', 'kit/dashboard-blocks/RangeSwitch.tsx', 'kit/dashboard-blocks/DashFooter.tsx'],
          Component: DashBlockAssembled,
        },
        {
          id: 'DashBlockAssembledWall',
          title: 'Wall board',
          note: 'Pick it for a control-room wall: the plant state as the hero, every unit in a strip, one trend.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/dashboard-blocks/StatusStrip.tsx', 'kit/TrendArea.tsx'],
          Component: DashBlockAssembledWall,
        },
        {
          id: 'DashBlockAssembledReport',
          title: 'Weekly report',
          note: 'Pick it for a board that is read, not watched: a headline, four figures, one chart and the events behind it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/StatGroup.tsx', 'kit/Bars.tsx', 'kit/dashboard-blocks/DashFooter.tsx'],
          Component: DashBlockAssembledReport,
        },
      ],
    },
  ],
});
