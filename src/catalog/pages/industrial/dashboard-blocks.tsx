import { chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { Separator } from '@cognite/aura/components/separator';
import { IconDownload, IconPlus, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import type { CategoryRow } from '../../../library/industrial/charts/CategoryChart';
import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { countBySeverity, isOpenAlarm } from '../../../library/industrial/operations/alarms';
import { AlarmSummary } from '../../../library/industrial/operations/AlarmSummary';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { WorkOrderRow } from '../../../library/industrial/operations/WorkOrderRow';
import { isOverdue, sortByPriority } from '../../../library/industrial/operations/workOrders';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { formatReading, healthStatus, runStateStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { FilterChip } from '../../../library/patterns/data-entry/FilterChip';
import { ALARMS, ASSETS, PLANT_KPIS, SENSORS, WORK_ORDERS, childrenOf, findAsset, findPerson, sensorsOf } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-blocks.tsx?raw';

const NOW = REFERENCE_NOW;

const EXPORT_24H = makeSeries({ seed: 31, points: 97, base: 4.32, amplitude: 0.14, noise: 0.03, cycles: 1.2, stepMs: 15 * MINUTE, decimals: 2 }).map((point) => ({ t: point.t, v: point.v }));
const PRESSURE_24H = makeSeries({ seed: 11, points: 97, base: 48.4, amplitude: 1.1, noise: 0.3, cycles: 2, stepMs: 15 * MINUTE }).map((point) => ({ t: point.t, v: point.v }));
const TEMPERATURE_24H = makeSeries({ seed: 13, points: 97, base: 136.2, drift: 5, amplitude: 1.5, noise: 0.5, cycles: 2, stepMs: 15 * MINUTE }).map((point) => ({ t: point.t, v: point.v }));

const DAILY_EXPORT: CategoryRow[] = [4.41, 4.46, 3.62, 3.98, 4.21, 4.33, 4.38].map((actual, index) => ({ category: formatDate(NOW - (6 - index) * DAY), actual }));

const OPEN_ALARMS = ALARMS.filter(isOpenAlarm);
const OPEN_ORDERS = sortByPriority(WORK_ORDERS.filter((order) => order.status !== 'done')).slice(0, 4);
const AREAS = childrenOf('nk');
const EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type)).slice(0, 7);

const HEALTH_SEGMENTS = [
  { id: 'good', label: 'Good', value: ASSETS.filter((asset) => asset.health === 'good').length, tone: 'success' },
  { id: 'watch', label: 'Watch', value: ASSETS.filter((asset) => asset.health === 'watch').length, tone: 'warning' },
  { id: 'poor', label: 'Poor', value: ASSETS.filter((asset) => asset.health === 'poor').length, tone: 'critical' },
] as const;

function DashBlockAvailability() {
  return (
    <KpiTile
      label="Availability"
      value={PLANT_KPIS.availability.value}
      unit="%"
      decimals={1}
      delta={{ reference: PLANT_KPIS.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
      trend={{ values: makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 }) }}
    />
  );
}

function DashBlockGasExport({ size = 'default' }: { size?: 'default' | 'large' }) {
  return (
    <KpiTile
      size={size}
      label="Gas export"
      value={PLANT_KPIS.gasExport.value}
      unit="MSm³/d"
      decimals={2}
      delta={{ reference: PLANT_KPIS.gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
      target={size === 'large' ? { value: PLANT_KPIS.gasExport.target, label: 'Plan' } : undefined}
      trend={{ values: EXPORT_24H.filter((_, index) => index % 4 === 0).map((point) => point.v), label: 'Gas export, last 24 hours' }}
    />
  );
}

function DashBlockEnergy() {
  return (
    <KpiTile
      label="Energy intensity"
      value={PLANT_KPIS.energyIntensity.value}
      unit="kWh/boe"
      decimals={1}
      delta={{ reference: PLANT_KPIS.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
      trend={{ values: makeValues({ seed: 43, points: 24, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8 }) }}
    />
  );
}

function DashBlockAlarmTile() {
  return (
    <KpiTile
      label="Open alarms"
      value={OPEN_ALARMS.length}
      decimals={0}
      tone="critical"
      status={{ tone: 'critical', label: '1 critical', shape: 'diamond' }}
      delta={{ reference: PLANT_KPIS.activeAlarms.previous, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }}
    />
  );
}

function DashBlockExportPanel() {
  const [range, setRange] = useState('24h');
  return (
    <DashboardPanel
      title="Gas export"
      description="Against the daily plan of 4.50 MSm³/d"
      actions={<TimeRangeSwitch value={range} onValueChange={setRange} />}
      footnote="Export averaged 4.33 MSm³/d, 4 % under plan, with the dip following the recompressor trip."
    >
      <TrendChart
        label="Gas export over the last 24 hours, between 4.1 and 4.5 million standard cubic metres per day, under the 4.5 plan"
        series={[{ key: 'export', label: 'Gas export', points: EXPORT_24H, variant: 'area' }]}
        limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan 4.50', tone: 'neutral', align: 'left' }]}
        yDomain={[4, 4.6]}
        yTicks={[4, 4.2, 4.4, 4.6]}
        unit="MSm³/d"
        decimals={2}
      />
    </DashboardPanel>
  );
}

function DashBlockAlarmPanel() {
  return (
    <DashboardPanel
      title="Open alarms"
      description={`${OPEN_ALARMS.length} open, most severe first`}
      actions={
        <Button variant="ghost" size="sm">
          View all
        </Button>
      }
    >
      <AlarmList alarms={OPEN_ALARMS} label="Open alarms" density="compact" formatAge={formatAgo} getAssetName={(alarm) => findAsset(alarm.assetId)?.name} />
    </DashboardPanel>
  );
}

function DashBlockOrderPanel() {
  return (
    <DashboardPanel
      title="Work orders"
      description="Open and planned, most urgent first"
      actions={
        <Button variant="ghost" size="sm">
          Open planner
        </Button>
      }
    >
      <ul aria-label="Open work orders" className="flex w-full min-w-0 flex-col divide-y divide-default">
        {OPEN_ORDERS.map((order) => {
          const person = findPerson(order.assigneeId);
          return (
            <WorkOrderRow
              key={order.id}
              density="compact"
              order={order}
              assetTag={findAsset(order.assetId)?.tag}
              due={formatDate(order.dueAt)}
              overdue={isOverdue(order, NOW)}
              assignee={person ? { id: person.id, name: person.name, initials: person.initials } : undefined}
            />
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function DashBlockAreaPanel() {
  return (
    <DashboardPanel title="Area health" description="Condition score per area">
      <ul className="flex flex-col gap-3">
        {AREAS.map((area) => (
          <li key={area.id} className="flex items-center gap-3">
            <ProgressRing label={`${area.name} health`} value={area.healthScore} unit="" decimals={0} size="sm" tone={healthStatus(area.health).tone} showLabel={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-base-foreground">{area.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{area.tag}</p>
            </div>
            <StatusIndicator {...healthStatus(area.health)} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function DashBlockPressurePanel() {
  return (
    <DashboardPanel title="Discharge pressure" description="23-PT-92531 · last 24 hours" footnote="Steady between 46 and 51 barg, inside the 40 to 52 limits.">
      <TrendChart
        heightClassName="h-48"
        label="Discharge pressure over the last 24 hours, steady between 46 and 51 barg under its high limit of 52"
        series={[{ key: 'pressure', label: 'Discharge pressure', points: PRESSURE_24H }]}
        limits={[{ value: 52, label: 'High 52', tone: 'warning', align: 'left' }]}
        yDomain={[40, 56]}
        yTicks={[40, 44, 48, 52, 56]}
        unit="barg"
      />
    </DashboardPanel>
  );
}

function DashBlockTemperaturePanel() {
  return (
    <DashboardPanel title="Discharge temperature" description="23-TT-92532 · last 24 hours" footnote="Up 5 °C in 24 hours and 3.8 °C under the 145 °C high limit.">
      <TrendChart
        heightClassName="h-48"
        label="Discharge temperature over the last 24 hours, rising 5 degrees to 141.2 against a high limit of 145 degrees Celsius"
        series={[{ key: 'temperature', label: 'Discharge temperature', points: TEMPERATURE_24H, color: chartSeriesColor(2) }]}
        limits={[{ value: 145, label: 'High 145', tone: 'warning', align: 'left' }]}
        yDomain={[125, 150]}
        yTicks={[125, 130, 135, 140, 145, 150]}
        unit="°C"
      />
    </DashboardPanel>
  );
}

function DashBlockDailyPanel() {
  return (
    <DashboardPanel title="Daily export" description="Last 7 days against plan" footnote="Two of seven days met the 4.5 MSm³ plan.">
      <CategoryChart
        heightClassName="h-48"
        label="Gas export per day for the last 7 days against the 4.5 plan; the low of 3.62 on 8 March follows the recompressor trip"
        rows={DAILY_EXPORT}
        series={[{ key: 'actual', label: 'Gas export' }]}
        references={[{ value: 4.5, label: 'Plan 4.5' }]}
        domain={[0, 5]}
        ticks={[0, 1, 2, 3, 4, 5]}
        unit="MSm³"
        decimals={2}
      />
    </DashboardPanel>
  );
}

function DashBlockHealthPanel() {
  return (
    <DashboardPanel title="Fleet health" description={`${ASSETS.length} assets by condition`}>
      <DistributionBar label="Fleet health" segments={HEALTH_SEGMENTS} />
    </DashboardPanel>
  );
}

function DashBlockSensorPanel() {
  const sensors = sensorsOf('23-ka-9101').slice(0, 4);
  return (
    <DashboardPanel title="1st stage compressor" description="23-KA-9101 · key readings">
      <div className="flex flex-col gap-4">
        {sensors.map((sensor) => (
          <LinearGauge
            key={sensor.id}
            size="sm"
            label={sensor.name}
            value={sensor.value}
            min={sensor.rangeMin}
            max={sensor.rangeMax}
            unit={sensor.unit}
            decimals={sensor.decimals}
            limits={{ low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit }}
          />
        ))}
      </div>
    </DashboardPanel>
  );
}

function DashBlockRefresh() {
  return (
    <Button variant="outline" size="sm">
      <IconRefresh aria-hidden="true" /> Refresh
    </Button>
  );
}

function DashBlockKpiThree() {
  return (
    <DashboardGrid>
      <DashboardCell span={4}>
        <DashBlockAvailability />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockGasExport />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockEnergy />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockKpiFour() {
  return (
    <DashboardGrid>
      <DashboardCell span={3}>
        <DashBlockAvailability />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockGasExport />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockEnergy />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockAlarmTile />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockKpiLarge() {
  return (
    <DashboardGrid>
      <DashboardCell span={6}>
        <DashBlockGasExport size="large" />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockAvailability />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockAlarmTile />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockKpiCompact() {
  const tiles = [
    { label: 'Availability', value: PLANT_KPIS.availability.value, unit: '%', decimals: 1 },
    { label: 'OEE', value: PLANT_KPIS.oee.value, unit: '%', decimals: 1 },
    { label: 'Gas export', value: PLANT_KPIS.gasExport.value, unit: 'MSm³/d', decimals: 2 },
    { label: 'Flaring', value: PLANT_KPIS.flaring.value, unit: 'kSm³/d', decimals: 1 },
    { label: 'MTBF', value: PLANT_KPIS.mtbf.value, unit: 'h', decimals: 0 },
    { label: 'Open work orders', value: PLANT_KPIS.openWorkOrders.value, unit: '', decimals: 0 },
  ];
  return (
    <DashboardGrid>
      {tiles.map((tile) => (
        <DashboardCell key={tile.label} span={2}>
          <KpiTile size="compact" label={tile.label} value={tile.value} unit={tile.unit} decimals={tile.decimals} />
        </DashboardCell>
      ))}
    </DashboardGrid>
  );
}

function DashBlockChartAndList() {
  return (
    <DashboardGrid>
      <DashboardCell span={8}>
        <DashBlockExportPanel />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockAreaPanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockTwoCharts() {
  return (
    <DashboardGrid>
      <DashboardCell span={6}>
        <DashBlockPressurePanel />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockTemperaturePanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockThreeUp() {
  return (
    <DashboardGrid>
      <DashboardCell span={4}>
        <DashBlockDailyPanel />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockSensorPanel />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockAreaPanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockMosaic() {
  return (
    <DashboardGrid>
      <DashboardCell span={3}>
        <DashBlockGasExport />
      </DashboardCell>
      <DashboardCell span={3}>
        <DashBlockAlarmTile />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockHealthPanel />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockTemperaturePanel />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockAlarmPanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockSidebar() {
  return (
    <DashboardGrid>
      <DashboardCell span={9}>
        <DashBlockExportPanel />
      </DashboardCell>
      <DashboardCell span={3}>
        <div className="flex flex-col gap-4 [&>*]:flex-1">
          <DashBlockAvailability />
          <DashBlockEnergy />
        </div>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockTable() {
  return (
    <DashboardGrid>
      <DashboardCell span={12}>
        <DashboardPanel
          title="Equipment"
          description={`${EQUIPMENT.length} main units · Nordkapp`}
          actions={
            <>
              <Button variant="secondary" size="sm">
                <IconDownload aria-hidden="true" /> Export CSV
              </Button>
              <IconAction label="Refresh equipment table" variant="outline">
                <IconRefresh />
              </IconAction>
            </>
          }
          footnote="Health score from the condition model, updated 13:55."
        >
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-medium">
                  Equipment
                </th>
                <th scope="col" className="w-32 pb-2 pr-3 font-medium">
                  State
                </th>
                <th scope="col" className="w-28 pb-2 pr-3 font-medium">
                  Health
                </th>
                <th scope="col" className="hidden w-72 pb-2 pr-3 font-medium md:table-cell">
                  Key reading
                </th>
                <th scope="col" className="w-20 pb-2 text-right font-medium">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT.map((asset) => {
                const sensor = SENSORS.find((candidate) => candidate.assetId === asset.id);
                return (
                  <tr key={asset.id} className="border-t border-default">
                    <td className="py-2 pr-3">
                      <p className="truncate text-base-foreground">{asset.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
                    </td>
                    <td className="py-2 pr-3">
                      <StatusIndicator {...healthStatus(asset.health)} size="sm" />
                    </td>
                    <td className="hidden truncate py-2 pr-3 text-medium-foreground md:table-cell">
                      {sensor ? (sensor.quality === 'bad' ? 'No reading' : `${sensor.name} ${formatReading(sensor.value, sensor.unit, sensor.decimals)}`) : '\u2014'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-base-foreground">{asset.healthScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DashboardPanel>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockAlarmsAndOrders() {
  return (
    <DashboardGrid>
      <DashboardCell span={6}>
        <DashBlockAlarmPanel />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockOrderPanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockStatusStrip() {
  return (
    <DashboardGrid>
      <DashboardCell span={12}>
        <Card role="group" aria-label="Plant status">
          <div className="flex w-full flex-wrap items-center gap-x-8 gap-y-3">
            <StatusIndicator tone="warning" shape="square" label="Reduced capacity" detail="since 13:46" />
            <Separator orientation="vertical" className="hidden data-[orientation=vertical]:h-5 lg:block" />
            <ul aria-label="Area states" className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
              {AREAS.map((area) => (
                <li key={area.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{area.name}</span>
                  <StatusIndicator {...healthStatus(area.health)} size="sm" />
                </li>
              ))}
            </ul>
            <AlarmSummary counts={countBySeverity(OPEN_ALARMS)} label="Open alarms by severity" />
          </div>
        </Card>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockHeaderRange() {
  const [range, setRange] = useState('24h');
  return (
    <DashboardFrame
      title="Gas compression"
      subtitle="NK-23 · Nordkapp gas processing plant"
      actions={
        <>
          <TimeRangeSwitch value={range} onValueChange={setRange} />
          <DashBlockRefresh />
        </>
      }
    >
      <DashBlockKpiThree />
    </DashboardFrame>
  );
}

function DashBlockHeaderFilters() {
  const [filters, setFilters] = useState([
    { id: 'area', label: 'Area', value: 'Gas compression' },
    { id: 'criticality', label: 'Criticality', value: 'A' },
  ]);
  return (
    <DashboardFrame
      title="Equipment overview"
      subtitle={filters.length > 0 ? `Showing 5 of ${ASSETS.length} assets` : `Showing all ${ASSETS.length} assets`}
      actions={<DashBlockRefresh />}
      toolbar={
        <>
          {filters.map((filter) => (
            <FilterChip key={filter.id} label={filter.label} value={filter.value} onRemove={() => setFilters((current) => current.filter((entry) => entry.id !== filter.id))} />
          ))}
          <Button variant="ghost" size="sm">
            <IconPlus aria-hidden="true" /> Add filter
          </Button>
        </>
      }
    >
      <DashBlockTwoCharts />
    </DashboardFrame>
  );
}

function DashBlockHeaderStatus() {
  return (
    <DashboardFrame
      title="Plant overview"
      subtitle="Nordkapp gas processing plant · updated 14:00 UTC"
      status={<StatusIndicator variant="badge" tone="warning" label="Reduced capacity" detail="recompressor tripped" />}
      actions={<DashBlockRefresh />}
    >
      <DashBlockKpiFour />
    </DashboardFrame>
  );
}

function DashBlockHeaderPlain() {
  return (
    <DashboardFrame title="Daily production" subtitle="11 March 2026 · read-only snapshot">
      <DashBlockKpiThree />
    </DashboardFrame>
  );
}

function DashBlockSectionDivider() {
  return (
    <DashboardGrid>
      <DashboardCell span={12}>
        <div className="flex items-center gap-3">
          <h4 className="shrink-0 text-sm font-semibold text-base-foreground">Compression train</h4>
          <span className="shrink-0 text-xs text-muted-foreground">2 trends · last 24 hours</span>
          <Separator className="min-w-0 flex-1" />
        </div>
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockPressurePanel />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashBlockTemperaturePanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockFooter() {
  return (
    <DashboardGrid>
      <DashboardCell span={12}>
        <DashBlockStatusFootnote />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockStatusFootnote() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-default pt-3 text-xs text-muted-foreground">
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Project <span className="font-mono">nordkapp-prod</span>
        </span>
        <span className="tabular-nums">14 time series · 8 alarms · 8 work orders</span>
        <span className="tabular-nums">Updated 12 Mar, 14:00 · times in UTC</span>
      </p>
      <StatusIndicator size="sm" tone="success" label="Data is current" detail="refreshes every minute" />
    </footer>
  );
}

function DashBlockLoadingRow() {
  return (
    <DashboardGrid>
      <DashboardCell span={3}>
        <KpiTile loading label="Gas export" value={null} />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile loading label="Availability" value={null} />
      </DashboardCell>
      <DashboardCell span={6}>
        <DashboardPanel title="Open alarms" description="Loading">
          <SkeletonList rows={2} description trailing label="Loading open alarms" />
        </DashboardPanel>
      </DashboardCell>
      <DashboardCell span={12}>
        <DashboardPanel title="Gas export" description="Last 24 hours">
          <ChartPlaceholder state="loading" title="Loading gas export trend" heightClassName="h-40" />
        </DashboardPanel>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockEmpty() {
  return (
    <DashboardGrid>
      <DashboardCell span={6}>
        <DashboardPanel title="Open alarms" description="Gas export · NK-27">
          <AlarmList alarms={[]} label="Open alarms" formatAge={formatAgo} empty="No open alarms in Gas export. The last one cleared 3 days ago." />
        </DashboardPanel>
      </DashboardCell>
      <DashboardCell span={6}>
        <DashboardPanel title="Bearing temperature" description="40-TT-40015 · last 8 hours">
          <ChartPlaceholder
            state="empty"
            title="No data in this period"
            description="The transmitter has reported bad quality since 05:00."
            heightClassName="h-40"
            action={
              <Button variant="secondary" size="sm">
                Show last 7 days
              </Button>
            }
          />
        </DashboardPanel>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockError() {
  return (
    <DashboardGrid>
      <DashboardCell span={8}>
        <DashboardPanel title="Gas export" description="Last 24 hours">
          <ChartPlaceholder
            state="error"
            title="Could not load the trend"
            description="The time series service did not answer. The other panels are not affected."
            heightClassName="h-48"
            action={
              <Button variant="secondary" size="sm">
                Try again
              </Button>
            }
          />
        </DashboardPanel>
      </DashboardCell>
      <DashboardCell span={4}>
        <DashBlockAreaPanel />
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockStale() {
  return (
    <DashboardGrid>
      <DashboardCell span={4}>
        <KpiTile
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          unit="MSm³/d"
          decimals={2}
          status={{ tone: 'warning', label: 'Stale', shape: 'ring' }}
          footnote={`Last value ${formatAgo(NOW - 47 * MINUTE)}; the feed normally updates every minute.`}
        />
      </DashboardCell>
      <DashboardCell span={4}>
        <KpiTile label="Flaring" value={null} unit="kSm³/d" emptyText="No data since 13:13. Metering station 27 is offline." />
      </DashboardCell>
      <DashboardCell span={4}>
        <DashboardPanel title="Separator level" description="20-LT-10012" footnote={`Updated ${formatAgo(NOW - 2 * HOUR)} · connection lost`}>
          <ValueReadout value={54.3} unit="%" decimals={1} size="lg" />
          <StatusIndicator size="sm" tone="warning" shape="ring" label="Stale" detail="showing the last known value" />
        </DashboardPanel>
      </DashboardCell>
    </DashboardGrid>
  );
}

function DashBlockFullPage() {
  return (
    <DashboardFrame
      title="Gas compression"
      subtitle="NK-23 · Nordkapp gas processing plant · updated 14:00 UTC"
      status={<StatusIndicator variant="badge" tone="warning" label="Watch" detail="1 unit tripped" />}
      actions={<DashBlockRefresh />}
    >
      <div className="flex flex-col gap-4">
        <DashBlockKpiFour />
        <DashBlockChartAndList />
        <DashBlockAlarmsAndOrders />
        <DashBlockStatusFootnote />
      </div>
    </DashboardFrame>
  );
}

export default definePage({
  id: 'dashboard-blocks',
  title: 'Dashboard blocks',
  summary:
    'Ready-made rows for assembling a dashboard: headline figures, chart rows, lists, frame headers and the states a row can be in. Every block sits on the same 12-column grid and the same panel, so any two stack without adjustment.',
  guidance: {
    use: [
      'Start with one KPI row, then at most one chart row before the lists people act on.',
      'Keep every panel in a row the same height; the grid cell stretches them for you.',
      'Give each panel one question, a title that names it and a footnote that answers it.',
      'Let a failed or empty panel keep its place so the rest of the dashboard does not move.',
    ],
    avoid: [
      'More than four tiles in a headline row; use the compact row of six for reference figures.',
      'Panels with their own padding, header style or border inside the grid.',
      'A full-page spinner; load row by row with skeletons in the final layout.',
      'Mixing three different column splits on one screen.',
    ],
  },
  source,
  sections: [
    {
      id: 'kpi-rows',
      title: 'KPI rows',
      description: 'The first row of a dashboard: a few figures of one size, most important first.',
      specimens: [
        {
          id: 'DashBlockKpiThree',
          title: 'Three-up KPI row',
          note: 'Pick it for a focused dashboard with three figures that each deserve a sparkline.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: DashBlockKpiThree,
        },
        {
          id: 'DashBlockKpiFour',
          title: 'Four-up KPI row',
          note: 'Pick it as the standard headline row; four is the most a row holds before figures stop being read.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: DashBlockKpiFour,
        },
        {
          id: 'DashBlockKpiLarge',
          title: 'One large and two regular',
          note: 'Pick it when one figure steers the plant: it takes half the row with its plan and trend.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: DashBlockKpiLarge,
        },
        {
          id: 'DashBlockKpiCompact',
          title: 'Compact row of six',
          note: 'Pick it for reference figures that are looked up, not watched: no deltas, no trends.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: DashBlockKpiCompact,
        },
      ],
    },
    {
      id: 'chart-rows',
      title: 'Chart rows',
      description: 'Column splits for trends and the panels beside them.',
      specimens: [
        {
          id: 'DashBlockChartAndList',
          title: 'Chart and list, 8 + 4',
          note: 'Pick it for the main trend with a short ranked list beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/ProgressRing.tsx'],
          Component: DashBlockChartAndList,
        },
        {
          id: 'DashBlockTwoCharts',
          title: 'Two charts, 6 + 6',
          note: 'Pick it for two measurements read together; both share the time range and the plot height.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: DashBlockTwoCharts,
        },
        {
          id: 'DashBlockThreeUp',
          title: 'Three-up cards',
          note: 'Pick it for three equal views of one subject: a chart, readings and a ranking.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/charts/CategoryChart.tsx', 'industrial/LinearGauge.tsx', 'industrial/ProgressRing.tsx'],
          Component: DashBlockThreeUp,
        },
        {
          id: 'DashBlockSidebar',
          title: 'Chart with a tile column, 9 + 3',
          note: 'Pick it when two figures explain the trend: they stack beside it and share its height.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/KpiTile.tsx'],
          Component: DashBlockSidebar,
        },
        {
          id: 'DashBlockMosaic',
          title: 'Mixed mosaic',
          note: 'Pick it for a compact overview: tiles, a distribution, a trend and a list in two rows.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/KpiTile.tsx', 'industrial/operations/DistributionBar.tsx', 'industrial/operations/AlarmList.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: DashBlockMosaic,
        },
      ],
    },
    {
      id: 'lists-and-tables',
      title: 'Lists, tables and status',
      description: 'The blocks people act on, and the strip that says how the plant is.',
      specimens: [
        {
          id: 'DashBlockTable',
          title: 'Table block with header actions',
          note: 'Pick it for the full-width table of a dashboard; export and refresh sit in the panel header.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'patterns/collections/IconAction.tsx'],
          Component: DashBlockTable,
        },
        {
          id: 'DashBlockAlarmsAndOrders',
          title: 'Alarm and work order pair',
          note: 'Pick it under the charts: what is wrong now on the left, what is being done about it on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/operations/AlarmList.tsx', 'industrial/operations/WorkOrderRow.tsx'],
          Component: DashBlockAlarmsAndOrders,
        },
        {
          id: 'DashBlockStatusStrip',
          title: 'Status strip',
          note: 'Pick it directly under the header: plant state, area states and alarm counts on one line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/StatusIndicator.tsx', 'industrial/operations/AlarmSummary.tsx'],
          Component: DashBlockStatusStrip,
        },
      ],
    },
    {
      id: 'frame-headers',
      title: 'Frame headers',
      description: 'Variants of the dashboard header, each shown with a row under it.',
      specimens: [
        {
          id: 'DashBlockHeaderRange',
          title: 'Header with range switch',
          note: 'Pick it when one time range drives every panel; the switch sits in the header, not in each panel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx', 'industrial/charts/TimeRangeSwitch.tsx'],
          Component: DashBlockHeaderRange,
        },
        {
          id: 'DashBlockHeaderFilters',
          title: 'Header with filter toolbar',
          note: 'Pick it when the dashboard is scoped by filters: applied filters are chips under the title.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx', 'patterns/data-entry/FilterChip.tsx'],
          Component: DashBlockHeaderFilters,
        },
        {
          id: 'DashBlockHeaderStatus',
          title: 'Header with status',
          note: 'Pick it when the state of the plant is the headline: it sits beside the title as a badge.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashBlockHeaderStatus,
        },
        {
          id: 'DashBlockHeaderPlain',
          title: 'Plain header',
          note: 'Pick it for a read-only or exported dashboard: title and scope, no controls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx'],
          Component: DashBlockHeaderPlain,
        },
      ],
    },
    {
      id: 'structure',
      title: 'Dividers and footer',
      description: 'What holds a long dashboard together.',
      specimens: [
        {
          id: 'DashBlockSectionDivider',
          title: 'Section divider with title',
          note: 'Pick it on long dashboards to name a group of rows; it spans the grid and takes one line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx'],
          Component: DashBlockSectionDivider,
        },
        {
          id: 'DashBlockFooter',
          title: 'Footer and metadata strip',
          note: 'Pick it as the last row: where the data comes from, how fresh it is and which time zone it uses.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/StatusIndicator.tsx'],
          Component: DashBlockFooter,
        },
      ],
    },
    {
      id: 'states',
      title: 'Row states',
      description: 'Loading, empty, failed and stale, each in the layout of the finished row.',
      specimens: [
        {
          id: 'DashBlockLoadingRow',
          title: 'Loading row',
          note: 'Pick it while data loads: every tile and panel shows a skeleton in its final size.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/KpiTile.tsx', 'feedback/SkeletonList.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: DashBlockLoadingRow,
        },
        {
          id: 'DashBlockEmpty',
          title: 'Empty blocks',
          note: 'Pick it when a panel has nothing to show; an empty alarm list is good news and says so.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/operations/AlarmList.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: DashBlockEmpty,
        },
        {
          id: 'DashBlockError',
          title: 'Error block',
          note: 'Pick it when one panel fails: it keeps its place and offers a retry while its neighbours carry on.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: DashBlockError,
        },
        {
          id: 'DashBlockStale',
          title: 'Stale and missing data',
          note: 'Pick it when a feed stops: the last value stays, marked stale with its age, and a missing value says why.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/KpiTile.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: DashBlockStale,
        },
      ],
    },
    {
      id: 'assembled',
      title: 'Assembled',
      description: 'Four of the blocks above stacked inside a frame, unchanged.',
      specimens: [
        {
          id: 'DashBlockFullPage',
          title: 'Blocks assembled into a dashboard',
          note: 'Pick it as proof of the system: header with status, KPI row, chart row, list pair and footer.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx', 'dashboards/DashboardGrid.tsx', 'dashboards/DashboardPanel.tsx', 'industrial/KpiTile.tsx', 'industrial/operations/AlarmList.tsx', 'industrial/operations/WorkOrderRow.tsx'],
          Component: DashBlockFullPage,
        },
      ],
    },
  ],
});
