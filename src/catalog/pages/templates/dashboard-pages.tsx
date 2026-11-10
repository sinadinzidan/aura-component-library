import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Switch } from '@cognite/aura/components/switch';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconBuildingFactory2, IconChevronRight, IconDownload, IconPlus, IconRefresh, IconX } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { SkeletonTable } from '../../../library/feedback/SkeletonTable';
import { Figure } from '../../../library/industrial/analytics/Figure';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue, healthStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { AppShell } from '../../../library/templates/AppShell';
import { AppTopbar } from '../../../library/templates/AppTopbar';
import type { AppTopbarCrumb } from '../../../library/templates/AppTopbar';
import { ContentContainer } from '../../../library/templates/ContentContainer';
import { TemplateFrame } from '../../../library/templates/TemplateFrame';
import { TwoColumn } from '../../../library/templates/TwoColumn';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, SENSORS, WORK_ORDERS, childrenOf, findAsset } from '../../data/plant';
import type { Asset, RunState } from '../../data/plant';
import { DAY, formatAgo, formatDate, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-pages.tsx?raw';

const DASHBOARD_USER = PEOPLE[0];
const DASHBOARD_AREAS = childrenOf('nk');
const DASHBOARD_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const DASHBOARD_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');
const DASHBOARD_WALL_SENSORS = SENSORS.filter((sensor) => sensor.quality !== 'bad').slice(0, 6);

const DASHBOARD_EXPORT = makeSeries({ seed: 31, points: 48, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2, stepMs: DAY / 48 });
const DASHBOARD_ENERGY = makeSeries({ seed: 43, points: 48, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8, stepMs: DAY / 48 });
const DASHBOARD_FLARING = makeSeries({ seed: 47, points: 48, base: 13.5, amplitude: 2.5, noise: 0.9, drift: -1.5, min: 0, stepMs: DAY / 48 });
const DASHBOARD_AVAILABILITY = makeSeries({ seed: 41, points: 30, base: 96.8, amplitude: 0.6, noise: 0.3, max: 100, stepMs: DAY });
const DASHBOARD_OTHER_SITE_EXPORT = makeSeries({ seed: 91, points: 48, base: 4.46, amplitude: 0.05, noise: 0.03, decimals: 2, stepMs: DAY / 48 });

const DASHBOARD_AREA_OPTIONS = [{ value: 'all', label: 'All areas' }, ...DASHBOARD_AREAS.map((area) => ({ value: area.id, label: area.name }))];

const DASHBOARD_ALARMS_BY_AREA = DASHBOARD_AREAS.map((area) => ({
  id: area.id,
  label: area.name,
  detail: area.tag,
  value: DASHBOARD_OPEN_ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === area.id).length,
}));

/** Downtime over the last 14 days, in hours, split two ways for the analytical page. */
const DASHBOARD_DOWNTIME_DAYS = [0.4, 0, 1.2, 0, 0, 2.6, 0.3, 0, 0, 5.8, 3.1, 0.6, 0, 4.2].map((hours, index) => ({
  day: formatDate(Date.UTC(2026, 1, 27 + index)),
  hours,
}));

const DASHBOARD_DOWNTIME: Record<string, { title: string; items: { id: string; label: string; value: number; detail?: string }[] }> = {
  cause: {
    title: 'By cause',
    items: [
      { id: 'vibration', label: 'High vibration trips', value: 9.4 },
      { id: 'instrument', label: 'Instrument faults', value: 3.9 },
      { id: 'cooling', label: 'Cooling limitations', value: 2.6 },
      { id: 'planned', label: 'Planned maintenance', value: 1.5 },
      { id: 'other', label: 'Other', value: 0.8 },
    ],
  },
  equipment: {
    title: 'By equipment',
    items: [
      { id: '9103', label: 'Recompressor', detail: '23-KA-9103', value: 10.6 },
      { id: '9114', label: 'Interstage cooler', detail: '23-HA-9114', value: 3.2 },
      { id: '4001', label: 'Cooling water pump', detail: '40-PA-4001', value: 2.9 },
      { id: '9101', label: '1st stage compressor', detail: '23-KA-9101', value: 1.5 },
    ],
  },
};

const DASHBOARD_ORDER_STATUS_ROWS = (['open', 'planned', 'in-progress', 'waiting', 'done'] as const).map((status) => ({
  status: { open: 'Open', planned: 'Planned', 'in-progress': 'In progress', waiting: 'Waiting', done: 'Done' }[status],
  count: WORK_ORDERS.filter((order) => order.status === status).length,
}));

const DASHBOARD_RUN_STATES: readonly { value: RunState; label: string }[] = [
  { value: 'running', label: 'Running' },
  { value: 'standby', label: 'Standby' },
  { value: 'tripped', label: 'Tripped' },
  { value: 'maintenance', label: 'Maintenance' },
];

const DASHBOARD_SITES = [
  {
    id: 'nordkapp',
    name: 'Nordkapp',
    region: 'Norwegian Sea',
    status: { tone: 'warning', label: 'Reduced capacity' },
    availability: PLANT_KPIS.availability.value,
    exportRate: PLANT_KPIS.gasExport.value,
    intensity: PLANT_KPIS.energyIntensity.value,
    alarms: DASHBOARD_OPEN_ALARMS.length,
    series: DASHBOARD_EXPORT,
  },
  {
    id: 'hammerfest',
    name: 'Hammerfest LNG',
    region: 'Barents Sea',
    status: { tone: 'success', label: 'Normal operation' },
    availability: 98.9,
    exportRate: 4.46,
    intensity: 28.4,
    alarms: 1,
    series: DASHBOARD_OTHER_SITE_EXPORT,
  },
] as const;

const DASHBOARD_WIDGETS = [
  { id: 'availability', label: 'Availability', noun: 'availability', value: PLANT_KPIS.availability.value, unit: '%', decimals: 1 },
  { id: 'export', label: 'Gas export', noun: 'gas export', value: PLANT_KPIS.gasExport.value, unit: 'MSm³/d', decimals: 2 },
  { id: 'alarms', label: 'Open alarms', noun: 'open alarms', value: DASHBOARD_OPEN_ALARMS.length, unit: '', decimals: 0 },
  { id: 'orders', label: 'Open work orders', noun: 'open work orders', value: PLANT_KPIS.openWorkOrders.value, unit: '', decimals: 0 },
  { id: 'mtbf', label: 'MTBF', noun: 'MTBF', value: PLANT_KPIS.mtbf.value, unit: 'h', decimals: 0 },
  { id: 'flaring', label: 'Flaring', noun: 'flaring', value: PLANT_KPIS.flaring.value, unit: 'kSm³/d', decimals: 1 },
];

const DASHBOARD_EQUIPMENT_COLUMNS: readonly DataTableColumn<Asset>[] = [
  {
    id: 'asset',
    header: 'Equipment',
    cell: (asset) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{asset.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
      </div>
    ),
    sortValue: (asset) => asset.name,
  },
  { id: 'area', header: 'Area', cell: (asset) => findAsset(asset.parentId ?? '')?.name, width: 'w-48' },
  { id: 'state', header: 'State', cell: (asset) => <StatusBadge status={asset.state} />, width: 'w-36' },
  { id: 'health', header: 'Condition', cell: (asset) => <StatusIndicator {...healthStatus(asset.health)} size="sm" />, width: 'w-28' },
  { id: 'score', header: 'Score', align: 'end', cell: (asset) => asset.healthScore, sortValue: (asset) => asset.healthScore, width: 'w-20' },
];

const dashboardTrail = (...labels: string[]): AppTopbarCrumb[] => labels.map((label, index) => ({ id: String(index), label }));

const dashboardToggle = <T extends string>(values: readonly T[], value: T, checked: boolean): T[] =>
  checked ? [...values, value] : values.filter((other) => other !== value);

/** The app chrome around every dashboard here: one top bar, then the page on the base surface. */
function DashboardShell({
  title,
  address,
  trail,
  children,
  sidebar,
  scroll = true,
  onNavigate,
}: {
  title: string;
  address: string;
  trail: readonly AppTopbarCrumb[];
  children: ReactNode;
  sidebar?: ReactNode;
  scroll?: boolean;
  onNavigate?: (crumb: AppTopbarCrumb) => void;
}) {
  return (
    <TemplateFrame title={`${title} · Plant operations`} address={address}>
      <AppShell
        contentLabel={title}
        scroll={scroll}
        sidebar={sidebar}
        topbarSpan="window"
        topbar={<AppTopbar icon={<IconBuildingFactory2 />} trail={trail} onNavigate={onNavigate} userName={DASHBOARD_USER.name} />}
      >
        {children}
      </AppShell>
    </TemplateFrame>
  );
}

/** The headline row: four tiles of one size, most important first. */
function DashboardKpiRow({ loading = false }: { loading?: boolean }) {
  // Placeholders sit on the base surface with an outline: a skeleton on a card disappears in dark themes.
  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading headline figures" className="grid grid-cols-2 gap-4 @4xl:grid-cols-4">
        {['Availability', 'Gas export', 'Energy intensity', 'Open alarms'].map((label) => (
          <div key={label} className="flex flex-col gap-3 rounded-xl border border-default p-4">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 @4xl:grid-cols-4">
      <KpiTile
        label="Availability"
        value={PLANT_KPIS.availability.value}
        unit="%"
        decimals={1}
        delta={{ reference: PLANT_KPIS.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
      />
      <KpiTile
        label="Gas export"
        value={PLANT_KPIS.gasExport.value}
        unit="MSm³/d"
        decimals={2}
        delta={{ reference: PLANT_KPIS.gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
      />
      <KpiTile
        label="Energy intensity"
        value={PLANT_KPIS.energyIntensity.value}
        unit="kWh/boe"
        decimals={1}
        delta={{ reference: PLANT_KPIS.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
      />
      <KpiTile
        label="Open alarms"
        value={DASHBOARD_OPEN_ALARMS.length}
        decimals={0}
        tone="critical"
        status={{ tone: 'critical', label: '1 critical' }}
        delta={{ reference: PLANT_KPIS.activeAlarms.previous, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }}
      />
    </div>
  );
}

/** Gas export against the daily plan: the chart most dashboards here lead with. */
function DashboardExportPanel({ height = 'h-52' }: { height?: string }) {
  return (
    <DashboardPanel title="Gas export" description="Last 24 hours against the daily plan">
      <TrendChart
        label="Gas export over the last 24 hours, between 4.1 and 4.5 million standard cubic metres per day, under the 4.5 plan"
        series={[{ key: 'export', label: 'Gas export', points: DASHBOARD_EXPORT, variant: 'area' }]}
        limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan 4.50', tone: 'neutral' }]}
        yDomain={[4, 4.6]}
        yTicks={[4, 4.2, 4.4, 4.6]}
        unit="MSm³/d"
        decimals={2}
        heightClassName={height}
        maxTicks={5}
        summary="Export averaged 4.33 MSm³/d, 4 % under plan; the dip follows the recompressor trip."
      />
    </DashboardPanel>
  );
}

/** Open alarms, most severe first, as a compact list for a dashboard column. */
function DashboardAlarmList({ limit = 4 }: { limit?: number }) {
  return (
    <ul className="flex w-full flex-col">
      {DASHBOARD_OPEN_ALARMS.slice(0, limit).map((alarm) => (
        <li key={alarm.id} className="flex flex-col gap-1 border-b border-default py-2.5 first:pt-0 last:border-b-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <SeverityBadge severity={alarm.severity} />
            <span className="text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
          </div>
          <p className="text-sm text-base-foreground">{alarm.message}</p>
          <p className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</p>
        </li>
      ))}
    </ul>
  );
}

function DashboardTemplateFullWidth() {
  const [range, setRange] = useState('24h');
  const [area, setArea] = useState('all');
  const rows = DASHBOARD_EQUIPMENT.filter((asset) => area === 'all' || asset.parentId === area);

  return (
    <DashboardShell title="Plant overview" address="/overview" trail={dashboardTrail('Nordkapp', 'Plant overview')}>
      <ContentContainer>
        <PageHeader
          title="Plant overview"
          status={<StatusIndicator tone="warning" label="Reduced capacity" variant="badge" />}
          description="Nordkapp gas processing plant · updated 14:00 UTC"
          actions={
            <>
              <div className="w-48">
                <OptionSelect aria-label="Area" options={DASHBOARD_AREA_OPTIONS} value={area} onValueChange={setArea} />
              </div>
              <TimeRangeSwitch value={range} onValueChange={setRange} />
              <Button variant="outline">
                <IconRefresh /> Refresh
              </Button>
            </>
          }
        />
        <DashboardKpiRow />
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-3">
          <div className="@4xl:col-span-2">
            <DashboardExportPanel />
          </div>
          <DashboardPanel title="Open alarms by area" description={`${DASHBOARD_OPEN_ALARMS.length} open across the plant`}>
            <BreakdownList label="Open alarms by area" items={DASHBOARD_ALARMS_BY_AREA} />
          </DashboardPanel>
        </div>
        <DashboardPanel title="Equipment" description={`${rows.length} of ${DASHBOARD_EQUIPMENT.length} units`}>
          <DataTable
            label="Equipment"
            surface="card"
            columns={DASHBOARD_EQUIPMENT_COLUMNS}
            rows={rows}
            getRowId={(asset) => asset.id}
            defaultSort={{ columnId: 'score', direction: 'asc' }}
          />
        </DashboardPanel>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateFilterRail() {
  const [areas, setAreas] = useState<readonly string[]>(DASHBOARD_AREAS.map((area) => area.id));
  const [states, setStates] = useState<readonly RunState[]>(DASHBOARD_RUN_STATES.map((state) => state.value));
  const rows = DASHBOARD_EQUIPMENT.filter((asset) => areas.includes(asset.parentId ?? '') && states.includes(asset.state));
  const average = rows.length === 0 ? null : rows.reduce((sum, asset) => sum + asset.healthScore, 0) / rows.length;

  return (
    <DashboardShell
      title="Equipment health"
      address="/health"
      trail={dashboardTrail('Nordkapp', 'Equipment health')}
      sidebar={
        <aside aria-label="Filters" className="flex w-56 flex-col gap-6 overflow-y-auto border-r border-default p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-base-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAreas(DASHBOARD_AREAS.map((area) => area.id));
                setStates(DASHBOARD_RUN_STATES.map((state) => state.value));
              }}
            >
              Reset
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <p id="dashboard-filter-area" className="text-xs font-medium text-muted-foreground">
              Area
            </p>
            <CheckboxGroup aria-labelledby="dashboard-filter-area">
              {DASHBOARD_AREAS.map((area) => (
                <CheckboxItem key={area.id}>
                  <CheckboxItemControl checked={areas.includes(area.id)} onCheckedChange={(checked) => setAreas(dashboardToggle(areas, area.id, checked))} />
                  <CheckboxItemLabel>{area.name}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </div>
          <div className="flex flex-col gap-2">
            <p id="dashboard-filter-state" className="text-xs font-medium text-muted-foreground">
              Run state
            </p>
            <CheckboxGroup aria-labelledby="dashboard-filter-state">
              {DASHBOARD_RUN_STATES.map((state) => (
                <CheckboxItem key={state.value}>
                  <CheckboxItemControl checked={states.includes(state.value)} onCheckedChange={(checked) => setStates(dashboardToggle(states, state.value, checked))} />
                  <CheckboxItemLabel>{state.label}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </div>
        </aside>
      }
    >
      <ContentContainer>
        <PageHeader title="Equipment health" description="Condition score of every unit that matches the filters." />
        <StatRow
          label="Summary of the filtered equipment"
          stats={[
            { id: 'units', label: 'Units shown', value: rows.length, detail: `of ${DASHBOARD_EQUIPMENT.length}` },
            { id: 'score', label: 'Average score', value: average === null ? '—' : formatValue(average, 0) },
            { id: 'watch', label: 'Watch or poor', value: rows.filter((asset) => asset.health !== 'good').length },
            { id: 'down', label: 'Not running', value: rows.filter((asset) => asset.state !== 'running').length },
          ]}
        />
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No equipment matches these filters. Tick an area and a run state.</p>
        ) : (
          <DashboardPanel title="Condition score" description="Lowest first. Under 70 needs a look; under 50 needs action.">
            <CategoryChart
              label="Condition score per unit, lowest first, against the watch threshold of 70"
              layout="rows"
              rows={[...rows].sort((a, b) => a.healthScore - b.healthScore).map((asset) => ({ name: asset.name, score: asset.healthScore }))}
              categoryKey="name"
              series={[{ key: 'score', label: 'Condition score' }]}
              references={[{ value: 70, label: 'Watch 70', tone: 'warning' }]}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisWidth={160}
              valueLabels
              heightClassName="h-80"
            />
          </DashboardPanel>
        )}
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateTabbed() {
  const [tab, setTab] = useState('production');

  return (
    <DashboardShell title="Performance" address={`/performance/${tab}`} trail={dashboardTrail('Nordkapp', 'Performance')}>
      <ContentContainer>
        <Tabs
          value={tab}
          onValueChange={(next) => {
            if (typeof next === 'string') setTab(next);
          }}
          className="flex w-full flex-col gap-6"
        >
          <PageHeader
            title="Performance"
            description="March 2026, month to date"
            actions={
              <Button variant="outline">
                <IconDownload /> Export
              </Button>
            }
            tabs={
              <TabsList showSeparator className="w-full">
                <TabsTrigger value="production">Production</TabsTrigger>
                <TabsTrigger value="reliability">Reliability</TabsTrigger>
                <TabsTrigger value="energy">Energy</TabsTrigger>
              </TabsList>
            }
          />
          <TabsPanel value="production" className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <KpiTile label="Gas export" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} target={{ value: PLANT_KPIS.gasExport.target, label: 'Plan' }} />
              <KpiTile label="OEE" value={PLANT_KPIS.oee.value} unit="%" decimals={1} target={{ value: PLANT_KPIS.oee.target }} />
              <KpiTile label="Availability" value={PLANT_KPIS.availability.value} unit="%" decimals={1} target={{ value: PLANT_KPIS.availability.target }} />
            </div>
            <DashboardExportPanel height="h-56" />
          </TabsPanel>
          <TabsPanel value="reliability" className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <KpiTile label="MTBF" value={PLANT_KPIS.mtbf.value} unit="h" target={{ value: PLANT_KPIS.mtbf.target }} />
              <KpiTile label="Open work orders" value={PLANT_KPIS.openWorkOrders.value} delta={{ reference: PLANT_KPIS.openWorkOrders.previous, goodDirection: 'down', caption: 'vs last week' }} />
              <KpiTile label="Days since incident" value={PLANT_KPIS.daysSinceIncident.value} unit="d" />
            </div>
            <DashboardPanel title="Work orders by status" description="Every order touched this month">
              <CategoryChart
                label="Work orders by status this month"
                rows={DASHBOARD_ORDER_STATUS_ROWS}
                categoryKey="status"
                series={[{ key: 'count', label: 'Work orders' }]}
                valueLabels
                heightClassName="h-56"
              />
            </DashboardPanel>
          </TabsPanel>
          <TabsPanel value="energy" className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <KpiTile label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} unit="kWh/boe" decimals={1} target={{ value: PLANT_KPIS.energyIntensity.target }} />
              <KpiTile label="Flaring" value={PLANT_KPIS.flaring.value} unit="kSm³/d" decimals={1} delta={{ reference: PLANT_KPIS.flaring.previous, goodDirection: 'down', caption: 'vs last week' }} />
              <KpiTile label="Fuel gas" value={186} unit="kSm³/d" />
            </div>
            <DashboardPanel title="Energy intensity" description="Last 24 hours against the 30 kWh/boe target">
              <TrendChart
                label="Energy intensity over the last 24 hours, falling from 32 towards the 30 kilowatt hour per barrel target"
                series={[{ key: 'intensity', label: 'Energy intensity', points: DASHBOARD_ENERGY }]}
                limits={[{ value: PLANT_KPIS.energyIntensity.target, label: 'Target 30', tone: 'neutral' }]}
                unit="kWh/boe"
                decimals={1}
                heightClassName="h-56"
                maxTicks={5}
              />
            </DashboardPanel>
          </TabsPanel>
        </Tabs>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplatePinnedSummary() {
  return (
    <DashboardShell title="Production trends" address="/trends" trail={dashboardTrail('Nordkapp', 'Production trends')}>
      <ContentContainer>
        <PageHeader title="Production trends" description="The summary on the right stays in view while the trends scroll." />
        <TwoColumn
          ratio="3:1"
          stickyAside
          asideLabel="Plant summary"
          aside={
            <DashboardPanel title="Right now" description="Updated 14:00 UTC">
              <div className="flex flex-col gap-1">
                <StatusIndicator tone="warning" label="Reduced capacity" />
                <p className="text-xs text-muted-foreground">Recompressor tripped at 13:46.</p>
              </div>
              <dl className="flex flex-col divide-y divide-default">
                {[
                  { label: 'Gas export', value: PLANT_KPIS.gasExport.value, unit: 'MSm³/d', decimals: 2 },
                  { label: 'Availability', value: PLANT_KPIS.availability.value, unit: '%', decimals: 1 },
                  { label: 'Energy intensity', value: PLANT_KPIS.energyIntensity.value, unit: 'kWh/boe', decimals: 1 },
                  { label: 'Flaring', value: PLANT_KPIS.flaring.value, unit: 'kSm³/d', decimals: 1 },
                ].map((figure) => (
                  <div key={figure.label} className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-sm text-muted-foreground">{figure.label}</dt>
                    <dd>
                      <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="sm" />
                    </dd>
                  </div>
                ))}
              </dl>
              <SectionHeader title="Most severe alarm" size="sm" as="h4" />
              <DashboardAlarmList limit={1} />
            </DashboardPanel>
          }
        >
          <DashboardExportPanel height="h-44" />
          <DashboardPanel title="Energy intensity" description="kWh per barrel of oil equivalent">
            <TrendChart
              label="Energy intensity over the last 24 hours, falling from 32 towards 31 kilowatt hours per barrel"
              series={[{ key: 'intensity', label: 'Energy intensity', points: DASHBOARD_ENERGY }]}
              unit="kWh/boe"
              decimals={1}
              heightClassName="h-44"
              maxTicks={5}
            />
          </DashboardPanel>
          <DashboardPanel title="Flaring" description="Thousand standard cubic metres per day">
            <TrendChart
              label="Flaring over the last 24 hours, between 9 and 17 thousand standard cubic metres per day"
              series={[{ key: 'flaring', label: 'Flaring', points: DASHBOARD_FLARING, variant: 'area' }]}
              limits={[{ value: PLANT_KPIS.flaring.target, label: 'Permit 15', tone: 'warning' }]}
              unit="kSm³/d"
              decimals={1}
              heightClassName="h-44"
              maxTicks={5}
            />
          </DashboardPanel>
        </TwoColumn>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateAnalytical() {
  const [split, setSplit] = useState('cause');
  const breakdown = DASHBOARD_DOWNTIME[split];
  const total = DASHBOARD_DOWNTIME_DAYS.reduce((sum, day) => sum + day.hours, 0);

  return (
    <DashboardShell title="Downtime analysis" address={`/analysis/downtime?by=${split}`} trail={dashboardTrail('Nordkapp', 'Analysis', 'Downtime')}>
      <ContentContainer>
        <PageHeader
          title="Downtime analysis"
          description={`${formatValue(total, 1)} hours of lost production in the last 14 days`}
          actions={
            <SegmentedControl
              value={split}
              onValueChange={(next) => {
                if (typeof next === 'string') setSplit(next);
              }}
            >
              <SegmentedControlList size="small" aria-label="Break down by">
                <SegmentedControlButton value="cause">By cause</SegmentedControlButton>
                <SegmentedControlButton value="equipment">By equipment</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        />
        <TwoColumn
          asideLabel="Breakdown"
          aside={
            <section className="flex flex-col gap-4">
              <SectionHeader title={breakdown.title} description="Share of the 14-day total" size="sm" />
              <BreakdownList label={`Downtime ${breakdown.title.toLowerCase()}`} items={breakdown.items} unit="h" decimals={1} ranked showShare scale="total" />
              <p className="text-sm text-muted-foreground">
                {split === 'cause'
                  ? 'Vibration trips on the recompressor account for more than half of the lost hours.'
                  : 'One unit, the recompressor, carries most of the downtime; the cooler and the pump share the rest.'}
              </p>
            </section>
          }
        >
          <section className="flex flex-col gap-4">
            <SectionHeader title="Downtime per day" description="Hours with export below 90 % of plan" size="sm" />
            <CategoryChart
              label="Downtime hours per day for the last 14 days; the worst day is 8 March with 5.8 hours"
              rows={DASHBOARD_DOWNTIME_DAYS}
              categoryKey="day"
              series={[{ key: 'hours', label: 'Downtime' }]}
              references={[{ value: 2, label: 'Tolerance 2 h', tone: 'warning', align: 'left' }]}
              unit="h"
              decimals={1}
              labelEvery={2}
              heightClassName="h-80"
              summary="Four days exceeded the 2 hour tolerance, all after the first vibration alarm on 4 March."
            />
          </section>
        </TwoColumn>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateWall() {
  return (
    <DashboardShell title="Compression wall" address="/wall/compression" trail={dashboardTrail('Nordkapp', 'Walls', 'Gas compression')} scroll={false}>
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-px bg-default">
        {DASHBOARD_WALL_SENSORS.map((sensor) => {
          const limits = { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit };
          const tone = toneFromLimits(sensor.value, limits);
          const span = sensor.highLimit - sensor.lowLimit;
          return (
            <section key={sensor.id} aria-label={sensor.name} className="flex min-h-0 min-w-0 flex-col gap-2 bg-base-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-medium text-base-foreground">{sensor.name}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
                </div>
                <StatusIndicator tone={tone} label={tone === 'neutral' ? 'In range' : 'Outside limits'} size="sm" />
              </div>
              <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="lg" tone={tone} />
              <div className="min-h-0 flex-1">
                <Sparkline
                  values={makeValues({ seed: sensor.seed, points: 60, base: sensor.value - span * 0.05, amplitude: span * 0.06, noise: span * 0.03, drift: span * 0.05, decimals: 2 })}
                  label={`${sensor.name}, last hour`}
                  variant="area"
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  limit={sensor.highLimit}
                  tone={tone}
                  height={132}
                />
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                High limit {formatValue(sensor.highLimit, sensor.decimals)} {sensor.unit}
              </p>
            </section>
          );
        })}
      </div>
    </DashboardShell>
  );
}

function DashboardTemplateDrillDown() {
  const [areaId, setAreaId] = useState<string | null>(null);
  const area = areaId === null ? undefined : findAsset(areaId);
  const units = area ? childrenOf(area.id) : [];
  const trail = area
    ? [
        { id: 'site', label: 'Nordkapp' },
        { id: 'areas', label: 'Areas' },
        { id: area.id, label: area.name },
      ]
    : [
        { id: 'site', label: 'Nordkapp' },
        { id: 'areas', label: 'Areas' },
      ];

  return (
    <DashboardShell
      title={area ? area.name : 'Areas'}
      address={area ? `/areas/${area.id}` : '/areas'}
      trail={trail}
      onNavigate={(crumb) => {
        if (crumb.id === 'areas') setAreaId(null);
      }}
    >
      <ContentContainer>
        {area ? (
          <>
            <PageHeader
              title={area.name}
              status={<StatusIndicator {...healthStatus(area.health)} variant="badge" detail={`score ${area.healthScore}`} />}
              meta={<p className="font-mono text-sm text-muted-foreground">{area.tag}</p>}
              actions={
                <Button variant="outline" onClick={() => setAreaId(null)}>
                  Back to all areas
                </Button>
              }
            />
            <DataTable
              label={`Equipment in ${area.name}`}
              columns={DASHBOARD_EQUIPMENT_COLUMNS.filter((column) => column.id !== 'area')}
              rows={units}
              getRowId={(asset) => asset.id}
              defaultSort={{ columnId: 'score', direction: 'asc' }}
            />
          </>
        ) : (
          <>
            <PageHeader title="Areas" description="Pick an area to see its equipment. The worst condition is listed first." />
            <ul className="flex flex-col gap-3">
              {[...DASHBOARD_AREAS]
                .sort((a, b) => a.healthScore - b.healthScore)
                .map((candidate) => {
                  const alarms = DASHBOARD_OPEN_ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === candidate.id).length;
                  return (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={() => setAreaId(candidate.id)}
                        className="flex w-full items-center gap-4 rounded-xl bg-card-background p-4 text-left outline-none transition-colors hover:bg-card-background-hover focus-visible:shadow-focus-ring"
                      >
                        <ProgressRing
                          label={`${candidate.name} condition`}
                          value={candidate.healthScore}
                          unit=""
                          decimals={0}
                          size="sm"
                          tone={healthStatus(candidate.health).tone}
                          showLabel={false}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-base-foreground">{candidate.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{candidate.tag}</span>
                        </span>
                        <span className="hidden w-28 shrink-0 @3xl:block">
                          <Sparkline
                            values={makeValues({ seed: candidate.healthScore, points: 24, base: candidate.healthScore, amplitude: 2, noise: 1, max: 100 })}
                            label={`${candidate.name} condition, last 24 days`}
                            height={28}
                          />
                        </span>
                        <span className="w-24 shrink-0 text-sm tabular-nums text-medium-foreground">{childrenOf(candidate.id).length} units</span>
                        <span className="w-24 shrink-0 text-sm tabular-nums text-medium-foreground">{alarms === 1 ? '1 alarm' : `${alarms} alarms`}</span>
                        <StatusIndicator {...runStateStatus(candidate.state)} size="sm" />
                        <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateComparison() {
  return (
    <DashboardShell title="Compare sites" address="/compare?sites=nordkapp,hammerfest" trail={dashboardTrail('All sites', 'Compare')}>
      <ContentContainer>
        <PageHeader title="Compare sites" description="The same figures and the same scales, side by side. Last 24 hours." />
        <div className="grid grid-cols-2 gap-6">
          {DASHBOARD_SITES.map((site) => (
            <section key={site.id} aria-label={site.name} className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-default pb-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-base-foreground">{site.name}</h2>
                  <p className="text-xs text-muted-foreground">{site.region}</p>
                </div>
                <StatusIndicator tone={site.status.tone} label={site.status.label} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiTile label="Gas export" value={site.exportRate} unit="MSm³/d" decimals={2} size="compact" />
                <KpiTile label="Availability" value={site.availability} unit="%" decimals={1} size="compact" />
                <KpiTile label="Energy intensity" value={site.intensity} unit="kWh/boe" decimals={1} size="compact" />
                <KpiTile label="Open alarms" value={site.alarms} size="compact" />
              </div>
              <DashboardPanel title="Gas export" description="Against the 4.50 plan">
                <TrendChart
                  label={`Gas export at ${site.name} over the last 24 hours against the 4.5 plan`}
                  series={[{ key: 'export', label: 'Gas export', points: site.series }]}
                  limits={[{ value: 4.5, label: 'Plan 4.50', tone: 'neutral' }]}
                  yDomain={[4, 4.6]}
                  yTicks={[4, 4.2, 4.4, 4.6]}
                  unit="MSm³/d"
                  decimals={2}
                  heightClassName="h-40"
                  maxTicks={4}
                />
              </DashboardPanel>
            </section>
          ))}
        </div>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateReport() {
  return (
    <DashboardShell title="Monthly report" address="/reports/2026-02" trail={dashboardTrail('Nordkapp', 'Reports', 'February 2026')}>
      <ContentContainer width="detail" gap="groups">
        <PageHeader
          title="Operations report, February 2026"
          meta={<p className="text-sm text-muted-foreground">Nordkapp gas processing plant · prepared by {PEOPLE[4].name} · issued 3 Mar 2026</p>}
          actions={
            <Button variant="outline">
              <IconDownload /> Download PDF
            </Button>
          }
          divider
        />
        <StatRow
          label="Month in figures"
          size="large"
          stats={[
            { id: 'availability', label: 'Availability', value: '97.1', unit: '%', detail: 'Target 97.5 %' },
            { id: 'export', label: 'Gas export', value: '121.8', unit: 'MSm³', detail: 'Plan 126.0' },
            { id: 'intensity', label: 'Energy intensity', value: '32.6', unit: 'kWh/boe', detail: 'Target 30.0' },
            { id: 'incidents', label: 'Recordable incidents', value: '0', detail: '206 days without' },
          ]}
        />
        <section className="flex flex-col gap-3">
          <SectionHeader title="Summary" />
          <p className="max-w-prose text-sm text-medium-foreground">
            February closed 3 % under the export plan. Availability held at 97.1 % for most of the month; the shortfall came from two short
            reductions on the compression train while the interstage cooler ran close to its temperature limit. No safety incidents were recorded.
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <SectionHeader title="Production" />
          <p className="max-w-prose text-sm text-medium-foreground">
            Availability stayed inside a one-point band, as figure 1 shows. The two dips line up with the cooler limitation on 9 and 21 February,
            when the 1st stage compressor was held back to keep discharge temperature under 145 °C.
          </p>
          <Figure number={1} caption="Daily availability, last 30 days, against the 97.5 % target." source="Source: production accounting, daily close.">
            <TrendChart
              label="Daily availability over the last 30 days, between 96 and 98 percent against a 97.5 percent target"
              series={[{ key: 'availability', label: 'Availability', points: DASHBOARD_AVAILABILITY }]}
              limits={[{ value: PLANT_KPIS.availability.target, label: 'Target 97.5', tone: 'neutral' }]}
              yDomain={[95, 99]}
              unit="%"
              decimals={1}
              heightClassName="h-48"
              maxTicks={6}
            />
          </Figure>
        </section>
        <section className="flex flex-col gap-3">
          <SectionHeader title="Maintenance" />
          <p className="max-w-prose text-sm text-medium-foreground">
            The backlog fell from 27 to 23 open work orders. Cleaning the cooler tube bundle is planned for the March window and should remove the
            temperature limitation described above.
          </p>
          <Figure number={1} kind="Table" caption="Work orders by status at month end.">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default text-xs text-muted-foreground">
                  <th scope="col" className="py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Work orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {DASHBOARD_ORDER_STATUS_ROWS.map((row) => (
                  <tr key={row.status} className="border-b border-default last:border-b-0">
                    <td className="py-2 text-medium-foreground">{row.status}</td>
                    <td className="py-2 text-right tabular-nums text-base-foreground">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Figure>
        </section>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateEmpty() {
  const [added, setAdded] = useState<readonly string[]>([]);
  const next = DASHBOARD_WIDGETS.find((widget) => !added.includes(widget.id));

  return (
    <DashboardShell title="My dashboard" address="/dashboards/new" trail={dashboardTrail('Dashboards', 'My dashboard')}>
      <ContentContainer>
        <PageHeader
          title="My dashboard"
          description={added.length === 0 ? 'Nothing here yet. Add the figures you check first thing in the morning.' : `${added.length} of ${DASHBOARD_WIDGETS.length} widgets added.`}
          actions={
            <Button disabled={!next} onClick={() => next && setAdded([...added, next.id])}>
              <IconPlus /> Add widget
            </Button>
          }
        />
        <ul className="grid grid-cols-2 gap-4 @4xl:grid-cols-3">
          {DASHBOARD_WIDGETS.map((widget) =>
            added.includes(widget.id) ? (
              <li key={widget.id} className="relative min-w-0">
                <KpiTile label={widget.label} value={widget.value} unit={widget.unit} decimals={widget.decimals} className="h-full" />
                <div className="absolute right-2 top-2">
                  <IconAction label={`Remove ${widget.label}`} onClick={() => setAdded(added.filter((id) => id !== widget.id))}>
                    <IconX />
                  </IconAction>
                </div>
              </li>
            ) : (
              <li key={widget.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setAdded([...added, widget.id])}
                  className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-emphasized p-4 text-sm text-muted-foreground outline-none transition-colors hover:bg-base-background-hover hover:text-base-foreground focus-visible:shadow-focus-ring"
                >
                  <IconPlus aria-hidden="true" className="size-5" />
                  <span>Add {widget.noun}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </ContentContainer>
    </DashboardShell>
  );
}

function DashboardTemplateLoading() {
  const [loaded, setLoaded] = useState(false);

  return (
    <DashboardShell title="Plant overview" address="/overview" trail={dashboardTrail('Nordkapp', 'Plant overview')}>
      <ContentContainer>
        <PageHeader
          title="Plant overview"
          description={loaded ? 'Nordkapp gas processing plant · updated 14:00 UTC' : 'Nordkapp gas processing plant · loading the last 24 hours'}
          actions={<Switch label="Show loaded page" textLeft checked={loaded} onCheckedChange={setLoaded} />}
        />
        <DashboardKpiRow loading={!loaded} />
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-3">
          <div className="@4xl:col-span-2">
            {loaded ? (
              <DashboardExportPanel />
            ) : (
              <div aria-busy="true" aria-label="Loading gas export" className="flex h-full flex-col gap-4 rounded-xl border border-default p-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-52 w-full" />
              </div>
            )}
          </div>
          {loaded ? (
            <DashboardPanel title="Open alarms" description={`${DASHBOARD_OPEN_ALARMS.length} open, most severe first`}>
              <DashboardAlarmList limit={3} />
            </DashboardPanel>
          ) : (
            <div aria-busy="true" aria-label="Loading open alarms" className="flex flex-col gap-4 rounded-xl border border-default p-4">
              <Skeleton className="h-5 w-28" />
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          )}
        </div>
        {loaded ? (
          <DataTable label="Equipment" columns={DASHBOARD_EQUIPMENT_COLUMNS} rows={DASHBOARD_EQUIPMENT.slice(0, 5)} getRowId={(asset) => asset.id} />
        ) : (
          <SkeletonTable rows={5} columns={DASHBOARD_EQUIPMENT_COLUMNS.map((column) => column.header)} label="Loading equipment" />
        )}
      </ContentContainer>
    </DashboardShell>
  );
}

export default definePage({
  id: 'dashboard-pages',
  title: 'Dashboard pages',
  summary:
    'Whole pages of figures, charts and tables: the full-width dashboard from the Aura layout guide and ten ways to arrange it for filtering, comparing, drilling down and reporting.',
  guidance: {
    use: [
      'Lead with one row of headline figures, then the chart people steer by, then the list they act on.',
      'A filter rail when filtering is the main activity; filters in the header when it is occasional.',
      'Tabs to split one subject into views; a drill-down when the views form a hierarchy.',
      'Skeletons that mirror the loaded layout, and a first-run state that offers something to add.',
    ],
    avoid: [
      'More than four tiles in the headline row: the rest belongs in a panel.',
      'Charts without a line of text that says what they show.',
      'Different scales on charts that sit side by side to be compared.',
      'A spinner over the whole page when only one panel is loading.',
    ],
  },
  source,
  sections: [
    {
      id: 'standard',
      title: 'Standard dashboards',
      description: 'The full-width pattern, and two ways to scope it.',
      specimens: [
        {
          id: 'DashboardTemplateFullWidth',
          title: 'Full-width dashboard',
          note: 'Pick it as the default: header with filters, four figures, the main chart beside a breakdown, then a table.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/charts/TimeRangeSwitch.tsx',
            'patterns/collections/BreakdownList.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: DashboardTemplateFullWidth,
        },
        {
          id: 'DashboardTemplateFilterRail',
          title: 'Dashboard with filter rail',
          note: 'Pick it when people slice the same figures many ways: filters stay open on the left and everything follows them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/charts/CategoryChart.tsx',
            'patterns/collections/StatRow.tsx',
          ],
          Component: DashboardTemplateFilterRail,
        },
        {
          id: 'DashboardTemplateTabbed',
          title: 'Tabbed dashboard',
          note: 'Pick it when one subject has three or four views with their own figures; the header and export stay put.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/PageHeader.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/charts/CategoryChart.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: DashboardTemplateTabbed,
        },
      ],
    },
    {
      id: 'analytical',
      title: 'Analytical layouts',
      description: 'Pages built around reading and comparing charts.',
      specimens: [
        {
          id: 'DashboardTemplatePinnedSummary',
          title: 'Pinned summary column',
          note: 'Pick it for a long page of trends: the current state stays beside them while they scroll.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: DashboardTemplatePinnedSummary,
        },
        {
          id: 'DashboardTemplateAnalytical',
          title: 'Chart with breakdown',
          note: 'Pick it to answer one question: the trend on the left, what it is made of on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'templates/TwoColumn.tsx',
            'industrial/charts/CategoryChart.tsx',
            'patterns/collections/BreakdownList.tsx',
          ],
          Component: DashboardTemplateAnalytical,
        },
        {
          id: 'DashboardTemplateComparison',
          title: 'Side-by-side comparison',
          note: 'Pick it to compare two sites, lines or periods: the same panels in the same order on the same scales.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: DashboardTemplateComparison,
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring and drill-down',
      description: 'Watching many things at once, and getting from the plant to one unit.',
      specimens: [
        {
          id: 'DashboardTemplateWall',
          title: 'Monitoring wall',
          note: 'Pick it for a screen nobody scrolls: six panels that fill the window, read from across the room.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates/TemplateFrame.tsx', 'templates/AppShell.tsx', 'industrial/ValueReadout.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashboardTemplateWall,
        },
        {
          id: 'DashboardTemplateDrillDown',
          title: 'Overview with drill-down',
          note: 'Pick it when the data is a hierarchy: a ranked list of areas, each opening the equipment inside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'industrial/ProgressRing.tsx',
            'industrial/Sparkline.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: DashboardTemplateDrillDown,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'A dashboard written to be read from top to bottom.',
      specimens: [
        {
          id: 'DashboardTemplateReport',
          title: 'Report with narrative',
          note: 'Pick it for a monthly or incident report: figures and charts sit inside the text that explains them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/collections/StatRow.tsx',
            'industrial/analytics/Figure.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: DashboardTemplateReport,
        },
      ],
    },
    {
      id: 'states',
      title: 'Dashboard states',
      description: 'Before there is anything to show.',
      specimens: [
        {
          id: 'DashboardTemplateEmpty',
          title: 'Empty dashboard',
          note: 'Pick it for a dashboard people build themselves: placeholders show where widgets go and add one when pressed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates/TemplateFrame.tsx', 'templates/AppShell.tsx', 'templates/ContentContainer.tsx', 'industrial/KpiTile.tsx', 'patterns/collections/IconAction.tsx'],
          Component: DashboardTemplateEmpty,
        },
        {
          id: 'DashboardTemplateLoading',
          title: 'Loading dashboard',
          note: 'Pick it for the first paint: skeletons take the place of each panel, so nothing jumps when data arrives.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'industrial/KpiTile.tsx',
            'feedback/SkeletonTable.tsx',
            'dashboards/DashboardPanel.tsx',
          ],
          Component: DashboardTemplateLoading,
        },
      ],
    },
  ],
});
