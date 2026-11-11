import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconActivity,
  IconAlertTriangle,
  IconBell,
  IconBolt,
  IconChartBar,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconDownload,
  IconFlame,
  IconGauge,
  IconLayoutDashboard,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconTable,
  IconTopologyStar3,
  IconTrendingDown,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { BrowserFrame } from '../../../library/kit/app-shells/BrowserFrame';
import { Crumbs } from '../../../library/kit/app-shells/Crumbs';
import { Pane } from '../../../library/kit/app-shells/Pane';
import { Panes } from '../../../library/kit/app-shells/Panes';
import { PersonChip } from '../../../library/kit/app-shells/PersonChip';
import { TabStrip } from '../../../library/kit/app-shells/TabStrip';
import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Callout } from '../../../library/kit/dashboard-pages/Callout';
import { CompareRow } from '../../../library/kit/dashboard-pages/CompareRow';
import { FilterGroup } from '../../../library/kit/dashboard-pages/FilterGroup';
import { SkeletonBlock } from '../../../library/kit/dashboard-pages/SkeletonBlock';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { ChoiceCards } from '../../../library/kit/form-and-settings/ChoiceCards';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip, type HeatRow } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { PickList } from '../../../library/kit/list-and-detail/PickList';
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
import { ALARMS, ASSETS, PLANT_KPIS, childrenOf, findAsset, type Alarm, type Asset } from '../../data/plant';
import { formatAgo, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-pages.tsx?raw';

const DP_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const DP_AREAS = childrenOf('nk');

const DP_UNITS = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const DP_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const DP_EXPORT_VALUES = [...DP_EXPORT.slice(0, -1).map((point) => point.v), PLANT_KPIS.gasExport.value];

const DP_EXPORT_YESTERDAY = makeValues({ seed: 32, points: 25, base: 4.24, amplitude: 0.1, noise: 0.03, cycles: 1.1, decimals: 2 });

const DP_HOURS = DP_EXPORT.map((point) => formatTime(point.t));

const DP_AVAILABILITY = [...makeValues({ seed: 41, points: 24, base: 96.9, amplitude: 0.5, noise: 0.2 }), PLANT_KPIS.availability.value];

const DP_ENERGY = [...makeValues({ seed: 43, points: 24, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8 }), PLANT_KPIS.energyIntensity.value];

const DP_FLARING = [...makeValues({ seed: 47, points: 24, base: 13.6, amplitude: 2.4, noise: 0.8, cycles: 1.5, drift: -2, min: 6 }), PLANT_KPIS.flaring.value];

const DP_PLANT_HEALTH = [...makeValues({ seed: 71, points: 24, base: 92.4, amplitude: 0.8, noise: 0.3, drift: -1.6, decimals: 1 }), 91];

const DP_WEEK_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

const DP_WEEK_EXPORT = [4.52, 4.49, 4.55, 4.47, 4.41, 4.21, 4.38];

const DP_WEEK_ALARMS = {
  critical: [0, 0, 1, 0, 0, 1, 1],
  high: [2, 1, 2, 3, 2, 4, 2],
  other: [5, 4, 4, 6, 5, 7, 5],
};

const DP_ALARM_LOAD: HeatRow[] = DP_AREAS.map((area, index) => ({
  label: area.name,
  values: makeValues({ seed: 60 + index, points: 24, base: area.health === 'watch' ? 4 : 1.2, amplitude: 1.2, noise: 1.4, cycles: 2, min: 0, decimals: 0 }),
  tone: area.health === 'watch' ? 'warning' : 'accent',
}));

const DP_DAY: readonly [string, string] = ['24 h ago', 'Now'];

const DP_SEVERITY_TONE: Record<Alarm['severity'], Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const DP_SEVERITY_LABEL: Record<Alarm['severity'], string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const DP_ALARM_STATE: Record<Alarm['state'], string> = { active: 'Active', acknowledged: 'Acknowledged', cleared: 'Cleared', shelved: 'Shelved' };

const DP_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const DP_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const DP_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const DP_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const DP_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', nowrap: true, cell: (unit) => unit.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (unit) => <TagId>{unit.tag}</TagId> },
  { id: 'state', header: 'State', nowrap: true, cell: (unit) => <StatusPill tone={DP_STATE_TONE[unit.state]}>{DP_STATE_LABEL[unit.state]}</StatusPill> },
  { id: 'health', header: 'Health', numeric: true, nowrap: true, cell: (unit) => `${unit.healthScore} %` },
];

const DP_ALARM_COLUMNS: DataTableColumn<Alarm>[] = [
  { id: 'severity', header: 'Severity', nowrap: true, cell: (alarm) => <StatusPill tone={DP_SEVERITY_TONE[alarm.severity]}>{DP_SEVERITY_LABEL[alarm.severity]}</StatusPill> },
  { id: 'message', header: 'Alarm', cell: (alarm) => alarm.message },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (alarm) => <TagId>{alarm.sensorTag}</TagId> },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (alarm) => alarm.value },
  { id: 'state', header: 'State', nowrap: true, muted: true, cell: (alarm) => DP_ALARM_STATE[alarm.state] },
  { id: 'raised', header: 'Raised', numeric: true, nowrap: true, cell: (alarm) => formatAgo(alarm.raisedAt) },
];

function DpUser({ compact = false }: { compact?: boolean }) {
  return <PersonChip name="Liv Wold" initials="LW" role="Shift supervisor" tone="blue" compact={compact} />;
}

function DpRange() {
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

function DpExportTrend({ height = 240, fill = true }: { height?: number; fill?: boolean }) {
  const Chart = fill ? TrendArea : TrendLine;
  return (
    <Chart
      label="Gas export over the last 24 hours against the daily plan and yesterday"
      labels={DP_HOURS}
      unit="MSm³/d"
      decimals={2}
      height={height}
      highlightLast
      series={[
        { id: 'today', label: 'Today', values: DP_EXPORT_VALUES, tone: 'accent' },
        { id: 'yesterday', label: 'Yesterday', values: DP_EXPORT_YESTERDAY, tone: 'neutral', dashed: true },
      ]}
      limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
    />
  );
}

function DpWeekBars({ height = 220, compact = false }: { height?: number; compact?: boolean }) {
  return (
    <Bars
      label="Gas export per day over the last seven days against the plan"
      categories={compact ? DP_WEEK_DAYS.map((day) => day.split(' ')[0]) : DP_WEEK_DAYS}
      series={[{ id: 'export', label: 'Export', values: DP_WEEK_EXPORT, tone: 'accent' }]}
      tones={DP_WEEK_EXPORT.map((value) => (value < 4.4 ? 'warning' : 'accent'))}
      decimals={2}
      limit={{ value: 4.5, label: 'Plan' }}
      showValues={!compact}
      height={height}
    />
  );
}

function DpAlarmBars({ height = 220 }: { height?: number }) {
  return (
    <Bars
      label="Alarms raised per day over the last seven days by severity"
      categories={DP_WEEK_DAYS}
      stacked
      showLegend
      series={[
        { id: 'critical', label: 'Critical', values: DP_WEEK_ALARMS.critical, tone: 'critical' },
        { id: 'high', label: 'High', values: DP_WEEK_ALARMS.high, tone: 'warning' },
        { id: 'other', label: 'Medium and low', values: DP_WEEK_ALARMS.other, tone: 'info' },
      ]}
      height={height}
    />
  );
}

function DashPagesFullWidth() {
  return (
    <BrowserFrame url="nordkapp.example.test/dashboards/production" look="studio" tab="Production · Nordkapp">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={DP_NAV.slice(0, 5)}
        current="overview"
        tools={<DpUser compact />}
        title="Production"
        subtitle="Thursday 12 March · updated 14:00 UTC"
        status={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Reduced capacity
          </StatusPill>
        }
        actions={
          <>
            <DpRange />
            <Button variant="outline" size="sm">
              <IconRefresh /> Refresh
            </Button>
          </>
        }
      >
        <Grid>
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
            sparkline={DP_EXPORT_VALUES}
          />
          <Stat className="col-span-3" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" icon={<IconActivity />} tone="teal" delta={{ value: -0.7, caption: 'vs last week' }} sparkline={DP_AVAILABILITY} />
          <Stat className="col-span-3" label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" icon={<IconBolt />} tone="purple" delta={{ value: -1.4, good: 'down', caption: 'vs last week' }} sparkline={DP_ENERGY} />
          <Stat className="col-span-3" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" icon={<IconTrendingDown />} tone="amber" delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} sparkline={DP_FLARING} />

          <Panel className="col-span-8" title="Gas export" subtitle="Last 24 hours against the daily plan and yesterday">
            <DpExportTrend height={250} />
          </Panel>
          <Panel className="col-span-4" title="Seven days" subtitle="MSm³ per day against the 4.50 plan">
            <DpWeekBars height={250} compact />
          </Panel>

          <Panel className="col-span-5" title="Alarm load" subtitle="Alarms per hour by area, last 24 hours" icon={<IconChip tone="amber"><IconBell /></IconChip>}>
            <div className="flex flex-1 flex-col justify-between gap-5">
              <div className="flex gap-8">
                <Stat variant="plain" size="sm" label="Raised" value={71} />
                <Stat variant="plain" size="sm" label="Peak hour" value="9" unit="at 13:00" />
                <Stat variant="plain" size="sm" label="From compression" value={62} unit="%" />
              </div>
              <HeatStrip label="Alarms per hour by area over the last 24 hours" rows={DP_ALARM_LOAD} axis={DP_DAY} size="lg" />
            </div>
          </Panel>
          <Panel className="col-span-7" title="Equipment" subtitle="Gas compression" padding="none" icon={<IconChip tone="blue"><IconGauge /></IconChip>}>
            <DataTable label="Gas compression equipment" flush columns={DP_UNIT_COLUMNS} rows={childrenOf('nk-23')} rowKey={(unit) => unit.id} rowTone={(unit) => (unit.state === 'running' ? undefined : DP_STATE_TONE[unit.state])} />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const DP_SEVERITY_OPTIONS = [
  { id: 'critical', label: 'Critical', tone: 'critical' as const, count: ALARMS.filter((alarm) => alarm.severity === 'critical').length },
  { id: 'high', label: 'High', tone: 'warning' as const, count: ALARMS.filter((alarm) => alarm.severity === 'high').length },
  { id: 'medium', label: 'Medium', tone: 'info' as const, count: ALARMS.filter((alarm) => alarm.severity === 'medium').length },
  { id: 'low', label: 'Low', count: ALARMS.filter((alarm) => alarm.severity === 'low').length },
];

const DP_AREA_OPTIONS = DP_AREAS.map((area) => ({
  id: area.id,
  label: area.name,
  count: ALARMS.filter((alarm) => findAsset(alarm.assetId)?.parentId === area.id).length,
}));

const DP_STATE_OPTIONS = [
  { id: 'active', label: 'Active', count: ALARMS.filter((alarm) => alarm.state === 'active').length },
  { id: 'acknowledged', label: 'Acknowledged', count: ALARMS.filter((alarm) => alarm.state === 'acknowledged').length },
  { id: 'shelved', label: 'Shelved', count: ALARMS.filter((alarm) => alarm.state === 'shelved').length },
  { id: 'cleared', label: 'Cleared', count: ALARMS.filter((alarm) => alarm.state === 'cleared').length },
];

function DashPagesFilterRail() {
  const [severities, setSeverities] = useState<string[]>(['critical', 'high', 'medium']);
  const [areas, setAreas] = useState<string[]>(DP_AREAS.map((area) => area.id));
  const [states, setStates] = useState<string[]>(['active', 'acknowledged', 'shelved']);
  const shown = ALARMS.filter((alarm) => severities.includes(alarm.severity) && states.includes(alarm.state) && areas.includes(findAsset(alarm.assetId)?.parentId ?? ''));
  return (
    <BrowserFrame url="control.nordkapp.example.test/dashboards/alarms" look="console" tab="Alarm performance">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Alarm performance', mark: <IconFlame /> }}
        nav={DP_NAV.slice(0, 4)}
        current="alarms"
        padding="none"
        tools={<span className="font-medium tabular-nums">14:00:00 UTC</span>}
      >
        <Panes label="Alarm dashboard with filters" columns="15rem minmax(0, 1fr)">
          <Pane
            title="Filters"
            subtitle={`${shown.length} of ${ALARMS.length}`}
            footer={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSeverities(DP_SEVERITY_OPTIONS.map((option) => option.id));
                  setAreas(DP_AREAS.map((area) => area.id));
                  setStates(DP_STATE_OPTIONS.map((option) => option.id));
                }}
              >
                Show everything
              </Button>
            }
          >
            <FilterGroup title="Severity" options={DP_SEVERITY_OPTIONS} value={severities} onChange={setSeverities} />
            <FilterGroup title="Area" options={DP_AREA_OPTIONS} value={areas} onChange={setAreas} />
            <FilterGroup title="State" options={DP_STATE_OPTIONS} value={states} onChange={setStates} />
          </Pane>
          <Pane surface="canvas" padding="none">
            <Grid className="flex-1 grid-rows-[auto_auto_1fr]">
              <StatGroup columns={4} label="Alarm figures" className="col-span-12">
                <Stat variant="plain" size="lg" label="Matching alarms" value={shown.length} tone="accent" target={`of ${ALARMS.length} in 3 days`} />
                <Stat variant="plain" size="lg" label="Critical" value={shown.filter((alarm) => alarm.severity === 'critical').length} tone="critical" target="Target 0" />
                <Stat variant="plain" size="lg" label="Per operator hour" value={5.9} decimals={1} tone="warning" target="Target under 6.0" />
                <Stat variant="plain" size="lg" label="Standing over 24 h" value={2} target="Export pump B, motor current" />
              </StatGroup>
              <Panel className="col-span-7" title="Raised per day" subtitle="Last 7 days by severity">
                <DpAlarmBars height={190} />
              </Panel>
              <Panel className="col-span-5" title="Load by area" subtitle="Alarms per hour, last 24 h">
                <HeatStrip label="Alarms per hour by area over the last 24 hours" rows={DP_ALARM_LOAD.filter((_, index) => areas.includes(DP_AREAS[index].id))} axis={DP_DAY} />
              </Panel>
              <Panel className="col-span-12" title="Alarms" subtitle={`${shown.length} match the filters`} padding="none">
                {shown.length > 0 ? (
                  <DataTable label="Alarms matching the filters" flush columns={DP_ALARM_COLUMNS} rows={shown} rowKey={(alarm) => alarm.id} rowTone={(alarm) => DP_SEVERITY_TONE[alarm.severity]} />
                ) : (
                  <EmptyPanel title="No alarms match" description="Tick a severity, an area and a state to see alarms here." />
                )}
              </Panel>
            </Grid>
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

type DpTab = 'production' | 'reliability' | 'energy';

function isDpTab(value: string): value is DpTab {
  return value === 'production' || value === 'reliability' || value === 'energy';
}

function DashPagesTabbed() {
  const [tab, setTab] = useState<DpTab>('reliability');
  return (
    <BrowserFrame url={`nordkapp.example.test/dashboards/plant?tab=${tab}`} look="soft" tab="Plant dashboard">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={DP_NAV.slice(0, 5)}
        current="overview"
        tools={<DpUser compact />}
        title="Plant dashboard"
        subtitle="Three views of the same plant. Each tab is one question."
        actions={
          <TabStrip
            label="Dashboard views"
            value={tab}
            onChange={(next) => {
              if (isDpTab(next)) setTab(next);
            }}
            items={[
              { id: 'production', label: 'Production' },
              { id: 'reliability', label: 'Reliability' },
              { id: 'energy', label: 'Energy' },
            ]}
          />
        }
      >
        {tab === 'production' ? (
          <Grid>
            <Panel className="col-span-8" tone="purple" title="Gas export" subtitle="Last 24 hours against the plan">
              <DpExportTrend height={250} />
            </Panel>
            <Grid stack className="col-span-4">
              <Stat label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" tone="purple" icon={<IconFlame />} delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} />
              <Stat label="OEE" value={PLANT_KPIS.oee.value} decimals={1} unit="%" tone="teal" icon={<IconActivity />} target="Target 85.0" />
            </Grid>
            <Panel className="col-span-12" title="Seven days" subtitle="MSm³ per day against the 4.50 plan">
              <DpWeekBars height={190} />
            </Panel>
          </Grid>
        ) : null}
        {tab === 'reliability' ? (
          <Grid>
            <Panel className="col-span-5" tone="teal" title="Area health" subtitle="Condition score out of 100">
              <div className="grid flex-1 grid-cols-2 place-items-center gap-5">
                {DP_AREAS.map((area) => (
                  <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={96} tone={DP_HEALTH_TONE[area.health]} />
                ))}
              </div>
            </Panel>
            <Grid stack className="col-span-7">
              <Grid columns={3}>
                <Stat label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" tone="teal" icon={<IconActivity />} target="Target 97.5" />
                <Stat label="Time between failures" value={PLANT_KPIS.mtbf.value} unit="h" tone="amber" icon={<IconGauge />} target="Target 450" />
                <Stat label="Units out" value={2} tone="pink" icon={<IconAlertTriangle />} target="Of 11" />
              </Grid>
              <Panel title="Availability" subtitle="Per cent, last 24 hours against the target">
                <TrendArea
                  label="Availability over the last 24 hours against the target"
                  labels={DP_HOURS}
                  unit="%"
                  decimals={1}
                  height={200}
                  highlightLast
                  yDomain={[95.5, 98.5]}
                  series={[{ id: 'availability', label: 'Availability', values: DP_AVAILABILITY, tone: 'teal' }]}
                  limits={[{ value: PLANT_KPIS.availability.target, label: 'Target', tone: 'neutral' }]}
                />
              </Panel>
            </Grid>
          </Grid>
        ) : null}
        {tab === 'energy' ? (
          <Grid>
            <Stat className="col-span-4" label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" tone="amber" icon={<IconBolt />} delta={{ value: -1.4, good: 'down', caption: 'vs last week' }} sparkline={DP_ENERGY} />
            <Stat className="col-span-4" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" tone="pink" icon={<IconFlame />} delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} sparkline={DP_FLARING} />
            <Panel className="col-span-4" tone="teal" title="Where the power goes">
              <Donut
                label="Power use by consumer"
                size={104}
                legend="right"
                centerCaption="MW"
                segments={[
                  { label: 'Compression', value: 28, tone: 'purple' },
                  { label: 'Pumps', value: 6, tone: 'blue' },
                  { label: 'Cooling', value: 4, tone: 'teal' },
                  { label: 'Utilities', value: 3, tone: 'amber' },
                ]}
              />
            </Panel>
            <Panel className="col-span-12" title="Energy intensity" subtitle="kWh per barrel of oil equivalent against the 30.0 target">
              <TrendArea
                label="Energy intensity over the last 24 hours against the target"
                labels={DP_HOURS}
                unit="kWh/boe"
                decimals={1}
                height={220}
                highlightLast
                series={[{ id: 'energy', label: 'Energy intensity', values: DP_ENERGY, tone: 'amber' }]}
                limits={[{ value: 30, label: 'Target', tone: 'neutral' }]}
              />
            </Panel>
          </Grid>
        ) : null}
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesPinnedSummary() {
  return (
    <BrowserFrame url="nordkapp.example.test/dashboards/trends" look="glass" tab="Production trends" minHeight={760}>
      <AppFrame
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={DP_NAV}
        current="trends"
        tools={<DpUser compact />}
        title="Production trends"
        subtitle="The summary on the right stays in view while the trends on the left scroll."
        actions={<DpRange />}
      >
        <Panes label="Trends with pinned summary" columns="minmax(0, 1fr) 19rem">
          <div className="flex min-w-0 flex-col gap-4">
              <Panel tone="accent" title="Gas export" subtitle="MSm³/d against the plan and yesterday">
                <DpExportTrend height={210} />
              </Panel>
              <Panel title="Availability" subtitle="Per cent against the 97.5 target">
                <TrendLine
                  label="Availability over the last 24 hours against the target"
                  labels={DP_HOURS}
                  unit="%"
                  decimals={1}
                  height={150}
                  highlightLast
                  yDomain={[95.5, 98.5]}
                  series={[{ id: 'availability', label: 'Availability', values: DP_AVAILABILITY, tone: 'teal' }]}
                  limits={[{ value: 97.5, label: 'Target', tone: 'neutral' }]}
                />
              </Panel>
              <Panel title="Flaring" subtitle="kSm³/d against the 15.0 limit">
                <TrendLine
                  label="Flaring over the last 24 hours against the limit"
                  labels={DP_HOURS}
                  unit="kSm³/d"
                  decimals={1}
                  height={150}
                  highlightLast
                  series={[{ id: 'flaring', label: 'Flaring', values: DP_FLARING, tone: 'amber' }]}
                  limits={[{ value: 15, label: 'Limit', tone: 'critical' }]}
                />
              </Panel>
          </div>
          <Pane title="Right now" subtitle="Updated 14:00 UTC" surface="well">
            <div>
              <Stat variant="plain" size="lg" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} />
            </div>
            <div className="grid grid-cols-2 place-items-center gap-4">
              <RingGauge label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" size={96} tone="teal" />
              <RingGauge label="OEE" value={PLANT_KPIS.oee.value} decimals={1} unit="%" size={96} tone="purple" />
            </div>
            <Meter label="Flaring" value={PLANT_KPIS.flaring.value} max={20} unit="kSm³/d" decimals={1} high={15} target={{ value: 15, label: 'Limit' }} tone="amber" />
            <Callout tone="warning" icon={<IconAlertTriangle />} title="0.12 under plan">
              The recompressor tripped at 13:46. Two stages carry the load until the bearing is inspected.
            </Callout>
          </Pane>
        </Panes>
      </AppFrame>
    </BrowserFrame>
  );
}

type DpBreakdown = { id: string; area: string; flared: number; share: number; change: number };

const DP_FLARE_BREAKDOWN: DpBreakdown[] = [
  { id: 'nk-23', area: 'Gas compression', flared: 7.9, share: 64, change: -4.8 },
  { id: 'nk-20', area: 'Inlet and separation', flared: 2.6, share: 21, change: -1.1 },
  { id: 'nk-27', area: 'Gas export', flared: 1.4, share: 11, change: -0.5 },
  { id: 'nk-40', area: 'Cooling water', flared: 0.5, share: 4, change: -0.1 },
];

const DP_FLARE_COLUMNS: DataTableColumn<DpBreakdown>[] = [
  { id: 'area', header: 'Area', nowrap: true, cell: (row) => row.area },
  { id: 'flared', header: 'kSm³/d', numeric: true, cell: (row) => row.flared.toFixed(1) },
  { id: 'share', header: 'Share', numeric: true, cell: (row) => `${row.share} %` },
  { id: 'change', header: 'Week on week', numeric: true, cell: (row) => row.change.toFixed(1) },
];

function DashPagesAnalytical() {
  return (
    <BrowserFrame url="nordkapp.example.test/analysis/flaring" look="blueprint" tab="Flaring analysis">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Flaring analysis', mark: <IconFlame /> }}
        nav={[
          { id: 'chart', label: 'Chart', icon: <IconChartLine /> },
          { id: 'table', label: 'Table', icon: <IconTable /> },
        ]}
        current="chart"
        tools={
          <>
            <div>
              <p className="text-xs">Sheet</p>
              <p className="text-sm font-semibold">NK-FL-007</p>
            </div>
            <div>
              <p className="text-xs">Period</p>
              <p className="text-sm font-semibold">11–12 Mar 2026</p>
            </div>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-8" title="Flaring" subtitle="kSm³/d · 24 h · limit 15.0" icon={<IconChartLine className="size-4" />}>
            <TrendLine
              label="Flaring over the last 24 hours against the daily limit"
              labels={DP_HOURS}
              unit="kSm³/d"
              decimals={1}
              height={300}
              highlightLast
              series={[{ id: 'flaring', label: 'Flaring', values: DP_FLARING, tone: 'accent' }]}
              limits={[{ value: 15, label: 'Limit', tone: 'warning' }]}
            />
          </Panel>
          <Grid stack className="col-span-4">
            <Stat label="Flared today" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" target="Limit 15.0" />
            <Stat label="Week on week" value={-6.5} decimals={1} unit="kSm³/d" target="Was 18.9" />
            <Stat label="Hours above limit" value={DP_FLARING.filter((value) => value > 15).length} unit="of 24" target="Tolerance 2" />
          </Grid>
          <Panel className="col-span-7" title="Breakdown by area" subtitle="Share of today’s total" icon={<IconTable className="size-4" />}>
            <DataTable label="Flaring by area" columns={DP_FLARE_COLUMNS} rows={DP_FLARE_BREAKDOWN} rowKey={(row) => row.id} />
          </Panel>
          <Panel className="col-span-5" title="Ranked" subtitle="kSm³/d by area" icon={<IconChartBar className="size-4" />}>
            <Bars
              label="Flaring by area, ranked"
              orientation="horizontal"
              categories={DP_FLARE_BREAKDOWN.map((row) => row.area)}
              series={[{ id: 'flared', label: 'Flared', values: DP_FLARE_BREAKDOWN.map((row) => row.flared), tone: 'accent' }]}
              decimals={1}
              showValues
              height={190}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesComparison() {
  return (
    <BrowserFrame url="nordkapp.example.test/compare?a=23-KA-9101&b=23-KA-9102" look="poster" tab="Compare stages">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        nav={DP_NAV.slice(0, 5)}
        current="trends"
        title="1st stage against 2nd stage."
        subtitle="Two compressors, the same six measures, mirrored around their names. The longer bar is the larger value; the better figure is underlined in green."
        tools={<DpUser compact />}
      >
        <Grid>
          <Stat className="col-span-6" size="lg" tone="blue" label="1st stage compressor · 23-KA-9101" value={72} unit="/ 100 health" target="Watch · vibration near its limit" />
          <Stat className="col-span-6" size="lg" tone="purple" label="2nd stage compressor · 23-KA-9102" value={88} unit="/ 100 health" target="Good · carrying extra load" />
          <Panel className="col-span-12" title="Measure by measure" subtitle="Now, 14:00 UTC">
            <CompareRow label="Discharge pressure" unit="barg" a={48.6} b={96.2} decimals={1} better="none" />
            <CompareRow label="Discharge temperature" unit="°C · lower is better" a={141.2} b={128.4} decimals={1} better="lower" />
            <CompareRow label="Drive-end vibration" unit="mm/s · lower is better" a={6.8} b={3.9} decimals={1} better="lower" />
            <CompareRow label="Polytropic efficiency" unit="% · higher is better" a={78.4} b={82.1} decimals={1} max={100} better="higher" />
            <CompareRow label="Running hours" unit="h since overhaul" a={14210} b={6880} better="none" />
            <CompareRow label="Open alarms" unit="lower is better" a={2} b={0} better="lower" />
          </Panel>
          <Panel className="col-span-7" title="Vibration, seven days" subtitle="mm/s per day, both stages">
            <Bars
              label="Drive-end vibration per day for both stages"
              categories={DP_WEEK_DAYS}
              showLegend
              series={[
                { id: 'a', label: '1st stage', values: [5.9, 6.0, 6.1, 6.3, 6.4, 6.6, 6.8], tone: 'blue' },
                { id: 'b', label: '2nd stage', values: [3.8, 3.8, 3.9, 3.8, 3.9, 3.9, 3.9], tone: 'purple' },
              ]}
              decimals={1}
              limit={{ value: 7.1, label: 'High limit' }}
              height={200}
            />
          </Panel>
          <Callout className="col-span-5" tone="amber" icon={<IconAlertTriangle />} title="The 1st stage is the one to watch.">
            It runs 12.8 °C hotter and vibrates 2.9 mm/s more than its twin, with twice the hours since overhaul. A vibration survey, WO-104466, is open and unassigned.
          </Callout>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesWall() {
  return (
    <BrowserFrame url="wall.nordkapp.example.test/equipment" look="signal" tab="Wall screen 2">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Equipment"
        subtitle="11 units · Thursday 12 March · 14:00 UTC"
        status={
          <>
            <StatusPill tone="success" size="lg">
              7 running
            </StatusPill>
            <StatusPill tone="info" size="lg">
              2 standby
            </StatusPill>
            <StatusPill tone="warning" size="lg">
              1 maintenance
            </StatusPill>
            <StatusPill tone="critical" size="lg">
              1 tripped
            </StatusPill>
          </>
        }
      >
        <Grid className="shell-grow grid-rows-[1fr_1fr_1fr_auto]">
          {DP_UNITS.slice(0, 11).map((unit) => (
            <Stat
              key={unit.id}
              className={unit.state === 'tripped' ? 'col-span-6' : 'col-span-3'}
              size={unit.state === 'tripped' ? 'hero' : 'md'}
              tone={DP_STATE_TONE[unit.state]}
              label={unit.name}
              value={unit.healthScore}
              unit="/ 100"
              state={DP_STATE_LABEL[unit.state]}
              stateIcon={unit.state === 'tripped' ? <IconAlertTriangle /> : unit.state === 'running' ? <IconCircleCheck /> : undefined}
              target={unit.tag}
            />
          ))}
          <Panel className="col-span-12" tone="critical">
            <p className="text-xl font-bold">Recompressor tripped on high vibration at 13:46 · bearing inspection in progress · due 20:00</p>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesDrillDown() {
  const [areaId, setAreaId] = useState<string | null>('nk-23');
  const area = DP_AREAS.find((entry) => entry.id === areaId);
  const units = area ? childrenOf(area.id) : [];
  return (
    <BrowserFrame url={`nordkapp.example.test/dashboards/health${area ? `/${area.tag}` : ''}`} look="studio" tab="Asset health · Nordkapp">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={DP_NAV}
        current="assets"
        tools={<DpUser />}
        title="Asset health"
        subtitle="Pick an area to drill into it. The trail above the detail leads back."
      >
        <Grid>
          <Panel className="col-span-5" title="Areas" subtitle="Condition score, worst first" padding="none">
            <PickList
              label="Plant areas"
              selected={areaId ?? undefined}
              onSelect={setAreaId}
              items={[...DP_AREAS]
                .sort((a, b) => a.healthScore - b.healthScore)
                .map((entry) => ({
                  id: entry.id,
                  title: entry.name,
                  tone: entry.health === 'good' ? 'neutral' : DP_HEALTH_TONE[entry.health],
                  leading: <RingGauge label={`${entry.name} health`} value={entry.healthScore} unit="" size={44} tone={DP_HEALTH_TONE[entry.health]} hideLabel />,
                  meta: `${childrenOf(entry.id).length === 1 ? '1 unit' : `${childrenOf(entry.id).length} units`} · ${entry.tag}`,
                  trailing: <StatusPill tone={DP_HEALTH_TONE[entry.health]}>{DP_HEALTH_LABEL[entry.health]}</StatusPill>,
                }))}
            />
          </Panel>
          <Panel className="col-span-7" title="Plant health" subtitle="Average score, last 24 hours">
            <TrendArea
              label="Plant health score over the last 24 hours"
              labels={DP_HOURS}
              decimals={1}
              height={210}
              yDomain={[88, 95]}
              highlightLast
              series={[{ id: 'health', label: 'Health score', values: DP_PLANT_HEALTH, tone: 'accent' }]}
              limits={[{ value: 90, label: 'Target', tone: 'neutral' }]}
            />
          </Panel>
          {area ? (
            <Panel
              className="col-span-12"
              tone={DP_HEALTH_TONE[area.health]}
              title={area.name}
              subtitle={`${units.length} units · health ${area.healthScore} of 100`}
              padding="none"
              actions={
                <Button variant="ghost" size="sm" onClick={() => setAreaId(null)}>
                  Close
                </Button>
              }
            >
              <div className="px-5 pb-3">
                <Crumbs items={['Nordkapp plant', area.name]} />
              </div>
              <DataTable label={`Units in ${area.name}`} flush columns={DP_UNIT_COLUMNS} rows={units} rowKey={(unit) => unit.id} rowTone={(unit) => (unit.health === 'good' ? undefined : DP_HEALTH_TONE[unit.health])} />
            </Panel>
          ) : (
            <Panel className="col-span-12">
              <EmptyPanel title="No area selected" description="Pick an area on the left to see its units, their state and their health." icon={<IconTopologyStar3 />} />
            </Panel>
          )}
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesReport() {
  return (
    <BrowserFrame url="nordkapp.example.test/reports/weekly/2026-11" look="editorial" tab="Weekly report, week 11" minHeight={760}>
      <AppFrame
        brand={{ name: 'Nordkapp weekly' }}
        nav={[
          { id: 'summary', label: 'Summary' },
          { id: 'export', label: 'Export' },
          { id: 'alarms', label: 'Alarms' },
          { id: 'outlook', label: 'Outlook' },
        ]}
        current="summary"
        title="A good week until Wednesday."
        subtitle="Nordkapp weekly report, week 11, 6 to 12 March 2026. Export ran above plan for three days, then lost 0.3 MSm³/d to a cooler restriction and a recompressor trip."
        tools={
          <Button variant="outline" size="sm">
            <IconDownload /> Download as PDF
          </Button>
        }
      >
        <Grid>
          <StatGroup columns={4} label="Week in figures" className="col-span-12">
            <Stat variant="plain" size="lg" label="Average export" value={4.43} decimals={2} unit="MSm³/d" delta={{ value: -0.07, decimals: 2, caption: 'against plan' }} />
            <Stat variant="plain" size="lg" label="Availability" value={97.0} decimals={1} unit="%" delta={{ value: -0.5, caption: 'against target' }} />
            <Stat variant="plain" size="lg" label="Alarms raised" value={55} delta={{ value: 9, decimals: 0, good: 'down', caption: 'on last week' }} />
            <Stat variant="plain" size="lg" label="Flaring" value={12.4} decimals={1} unit="kSm³/d" delta={{ value: -6.5, good: 'down', caption: 'on last week' }} />
          </StatGroup>
          <div className="col-span-7">
            <SectionHeader size="sm" level={3} title="Export fell on Wednesday and half recovered" description="MSm³ per day against the 4.50 plan." />
            <div className="mt-4">
              <DpWeekBars height={230} />
            </div>
          </div>
          <div className="col-span-5 flex flex-col gap-5">
            <p className="text-base leading-7 text-base-foreground">
              Friday to Sunday ran at or above plan. On Wednesday the interstage cooler outlet climbed past 40 °C and the compression train was held back; export dropped to 4.21 MSm³/d.
            </p>
            <Callout tone="warning" title="One trip cost 0.12 MSm³/d on Thursday.">
              The recompressor tripped on vibration at 13:46 after a 24 hour rise that no limit flagged. A tighter limit is proposed in MOC-0412.
            </Callout>
            <p className="text-base leading-7 text-base-foreground">Two stages now carry the load. Flaring stayed inside its limit all week and fell by a third.</p>
          </div>
          <div className="col-span-12">
            <SectionHeader size="sm" level={3} title="Alarms rose with the load" description="Raised per day by severity. Wednesday was the busiest day of the month." />
            <div className="mt-4">
              <DpAlarmBars height={190} />
            </div>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

const DP_STARTERS = [
  { id: 'production', label: 'Production', description: 'Export, availability and plan for one site.', icon: <IconFlame /> },
  { id: 'alarms', label: 'Alarm performance', description: 'Rates, standing alarms and load by area.', icon: <IconBell /> },
  { id: 'health', label: 'Asset health', description: 'Condition scores with drill-down to units.', icon: <IconGauge /> },
];

function DashPagesEmpty() {
  const [starter, setStarter] = useState('production');
  return (
    <BrowserFrame url="nordkapp.example.test/dashboards/new" look="soft" tab="New dashboard">
      <AppFrame
        variant="sidebar"
        brand={{ name: 'Nordkapp', detail: 'Gas plant', mark: <IconFlame /> }}
        nav={DP_NAV}
        current="overview"
        tools={<DpUser />}
        title="Untitled dashboard"
        subtitle="Created just now · only you can see it"
        actions={
          <Button size="sm">
            <IconPlus /> Add a panel
          </Button>
        }
      >
        <div className="shell-grow flex flex-col gap-5">
          <Panel className="flex-1">
            <div className="flex flex-1 items-center justify-center">
              <EmptyPanel
                icon={<IconLayoutDashboard />}
                title="This dashboard has no panels yet"
                description="Add a panel to start from nothing, or pick a starter below and change it once it has your data."
                action={
                  <Button size="sm">
                    <IconPlus /> Add a panel
                  </Button>
                }
              />
            </div>
          </Panel>
          <Panel
            tone="purple"
            title="Start from a layout"
            subtitle="Each one comes filled with Nordkapp data"
            actions={
              <Button size="sm" variant="outline">
                Use {DP_STARTERS.find((entry) => entry.id === starter)?.label.toLowerCase()}
              </Button>
            }
          >
            <ChoiceCards label="Starter layout" options={DP_STARTERS} value={starter} onChange={setStarter} />
          </Panel>
        </div>
      </AppFrame>
    </BrowserFrame>
  );
}

function DashPagesLoading() {
  return (
    <BrowserFrame url="nordkapp.example.test/dashboards/production" look="studio" tab="Production · Nordkapp">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Gas processing', mark: <IconFlame /> }}
        nav={DP_NAV.slice(0, 5)}
        current="overview"
        tools={<DpUser compact />}
        title="Production"
        subtitle="Loading the last 24 hours from the historian"
        status={<StatusPill tone="info">Loading</StatusPill>}
        actions={
          <Button variant="outline" size="sm" disabled>
            <IconRefresh /> Refresh
          </Button>
        }
      >
        <Grid>
          <Panel className="col-span-3">
            <SkeletonBlock label="Loading gas export" shape="stat" animate={false} />
          </Panel>
          <Panel className="col-span-3">
            <SkeletonBlock label="Loading availability" shape="stat" animate={false} />
          </Panel>
          <Panel className="col-span-3">
            <SkeletonBlock label="Loading energy intensity" shape="stat" animate={false} />
          </Panel>
          <Stat className="col-span-3" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" icon={<IconTrendingDown />} tone="amber" delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} />
          <Panel className="col-span-8" title="Gas export" subtitle="Last 24 hours against the daily plan and yesterday">
            <SkeletonBlock label="Loading the gas export trend" shape="chart" height={250} animate={false} />
          </Panel>
          <Panel className="col-span-4" title="Seven days" subtitle="MSm³ per day against the 4.50 plan">
            <SkeletonBlock label="Loading seven days of export" shape="chart" count={7} height={250} animate={false} />
          </Panel>
          <Panel className="col-span-12" title="Equipment" subtitle="Gas compression">
            <SkeletonBlock label="Loading equipment" shape="rows" count={4} animate={false} />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'dashboard-pages',
  title: 'Dashboard pages',
  summary:
    'Whole dashboards as page layouts: where the figures, charts, filters and tables go, and how the page behaves when it is empty or loading. Eleven pages in eight looks, each on the same Nordkapp data.',
  guidance: {
    use: [
      'One question per dashboard. If the title needs "and", split it into tabs or pages.',
      'Figures first, then the chart that explains them, then the table that lets people act.',
      'Keep filters in a rail or in the title bar, never scattered across panels.',
    ],
    avoid: [
      'A wall of equal tiles: decide which figure leads and make it larger.',
      'A spinner over the whole page while it loads; keep the layout and fill it in.',
      'Charts without a plan, target or limit line. A trend alone does not say if it is good.',
    ],
  },
  source,
  sections: [
    {
      id: 'standard',
      title: 'Standard dashboards',
      description: 'The layouts most dashboards start from.',
      specimens: [
        {
          id: 'DashPagesFullWidth',
          title: 'Full-width dashboard',
          note: 'Pick it as the default: a row of figures, the main trend beside its weekly view, then detail.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Stat.tsx', 'kit/TrendArea.tsx', 'kit/Bars.tsx', 'kit/HeatStrip.tsx', 'kit/DataTable.tsx'],
          Component: DashPagesFullWidth,
        },
        {
          id: 'DashPagesFilterRail',
          title: 'Dashboard with filter rail',
          note: 'Pick it when people slice one data set many ways and every panel must follow the same filters.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-pages/FilterGroup.tsx', 'kit/app-shells/Panes.tsx', 'kit/app-shells/Pane.tsx', 'kit/StatGroup.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx'],
          Component: DashPagesFilterRail,
        },
        {
          id: 'DashPagesTabbed',
          title: 'Tabbed dashboard',
          note: 'Pick it when one audience asks a few separate questions of the same plant.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/app-shells/TabStrip.tsx', 'kit/RingGauge.tsx', 'kit/TrendArea.tsx', 'kit/Stat.tsx', 'kit/Donut.tsx'],
          Component: DashPagesTabbed,
        },
      ],
    },
    {
      id: 'analytical',
      title: 'Analytical layouts',
      description: 'For reading one thing closely or two things against each other.',
      specimens: [
        {
          id: 'DashPagesPinnedSummary',
          title: 'Pinned summary column',
          note: 'Pick it for a long column of trends where the current figures should never scroll away.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-pages/Callout.tsx', 'kit/app-shells/Panes.tsx', 'kit/TrendLine.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx'],
          Component: DashPagesPinnedSummary,
        },
        {
          id: 'DashPagesAnalytical',
          title: 'Chart with breakdown',
          note: 'Pick it to explain one measure: the trend large, then the same total broken down as a table and ranked.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: DashPagesAnalytical,
        },
        {
          id: 'DashPagesComparison',
          title: 'Side-by-side comparison',
          note: 'Pick it to judge two units, sites or periods on the same measures.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-pages/CompareRow.tsx', 'kit/dashboard-pages/Callout.tsx', 'kit/Bars.tsx', 'kit/Stat.tsx'],
          Component: DashPagesComparison,
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring and drill-down',
      description: 'State at a glance, and the way from the whole to one part.',
      specimens: [
        {
          id: 'DashPagesWall',
          title: 'Monitoring wall',
          note: 'Pick it for a screen read from across the room: one tile per unit, filled with its state, the fault largest.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Panel.tsx', 'kit/AppFrame.tsx', 'kit/StatusPill.tsx'],
          Component: DashPagesWall,
        },
        {
          id: 'DashPagesDrillDown',
          title: 'Overview with drill-down',
          note: 'Pick it when the overview is a list of parts and people open one without leaving the page.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/list-and-detail/PickList.tsx', 'kit/app-shells/Crumbs.tsx', 'kit/TrendArea.tsx', 'kit/DataTable.tsx', 'kit/RingGauge.tsx'],
          Component: DashPagesDrillDown,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'A dashboard that is read once, top to bottom, and then filed.',
      specimens: [
        {
          id: 'DashPagesReport',
          title: 'Report with narrative',
          note: 'Pick it for a weekly or monthly report: headlines that state the finding, charts beside the words that explain them.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-pages/Callout.tsx', 'kit/StatGroup.tsx', 'kit/Bars.tsx', 'kit/SectionHeader.tsx', 'kit/AppFrame.tsx'],
          Component: DashPagesReport,
        },
      ],
    },
    {
      id: 'states',
      title: 'Dashboard states',
      description: 'What the page looks like before there is anything to show.',
      specimens: [
        {
          id: 'DashPagesEmpty',
          title: 'Empty dashboard',
          note: 'Pick it for a dashboard nobody has built yet: say so, and offer a filled starter as the fastest way in.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/EmptyPanel.tsx', 'kit/form-and-settings/ChoiceCards.tsx', 'kit/Panel.tsx', 'kit/AppFrame.tsx'],
          Component: DashPagesEmpty,
        },
        {
          id: 'DashPagesLoading',
          title: 'Loading dashboard',
          note: 'Pick it while data arrives: the real layout with placeholders in the shape of each panel, and anything already loaded shown.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-pages/SkeletonBlock.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/AppFrame.tsx'],
          Component: DashPagesLoading,
        },
      ],
    },
  ],
});
