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
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconCloudOff,
  IconFlame,
  IconGauge,
  IconShieldCheck,
  IconTool,
  IconWind,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { judgeAgainstTarget } from '../../../library/kit/kpi-tiles/progress';
import { StatPlaceholder } from '../../../library/kit/kpi-tiles/StatPlaceholder';
import { TargetProgress } from '../../../library/kit/kpi-tiles/TargetProgress';
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
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { useLook } from '../../../library/looks/useLook';
import { PLANT_KPIS, SENSORS, type Sensor } from '../../data/plant';
import { formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './kpi-tiles.tsx?raw';

const KPI_TILES_EXPORT_TREND = makeValues({ seed: 31, points: 24, base: 4.3, amplitude: 0.12, noise: 0.04, cycles: 1.2, decimals: 2 });

const KPI_TILES_AVAILABILITY_TREND = makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2, decimals: 1 });

const KPI_TILES_ENERGY_TREND = makeValues({ seed: 52, points: 24, base: 31.8, amplitude: 0.9, noise: 0.3, drift: -1, decimals: 1 });

const KPI_TILES_FLARING_TREND = makeValues({ seed: 63, points: 24, base: 15, amplitude: 2.4, noise: 0.8, drift: -5, decimals: 1 });

const KPI_TILES_ALARM_TREND = makeValues({ seed: 74, points: 24, base: 6, amplitude: 2, noise: 0.8, drift: -3, min: 0, decimals: 0 });

const KPI_TILES_RANGES = {
  '8 h': { points: 17, label: 'Last 8 hours', step: 30 },
  '24 h': { points: 25, label: 'Last 24 hours', step: 60 },
  '7 d': { points: 29, label: 'Last 7 days', step: 360 },
} as const;

type KpiTilesRange = keyof typeof KPI_TILES_RANGES;

function isKpiTilesRange(value: string): value is KpiTilesRange {
  return value in KPI_TILES_RANGES;
}

const KPI_TILES_COMPRESSOR = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101');

function kpiTilesSensorTone(sensor: Sensor): Tone {
  if (sensor.highHighLimit !== undefined && sensor.value >= sensor.highHighLimit) return 'critical';
  if (sensor.value > sensor.highLimit || sensor.value < sensor.lowLimit) return 'critical';
  if (sensor.value >= sensor.highLimit * 0.95) return 'warning';
  return 'success';
}

const KPI_TILES_TONE_WORD: Partial<Record<Tone, string>> = {
  success: 'Normal',
  warning: 'Near limit',
  critical: 'Above limit',
};

type KpiTilesAreaRow = { area: string; tag: string; availability: number; target: number; export: number; alarms: number };

const KPI_TILES_AREAS: KpiTilesAreaRow[] = [
  { area: 'Inlet and separation', tag: 'NK-20', availability: 99.1, target: 97.5, export: 4.61, alarms: 0 },
  { area: 'Gas compression', tag: 'NK-23', availability: 91.8, target: 97.5, export: 4.38, alarms: 3 },
  { area: 'Gas export', tag: 'NK-27', availability: 98.4, target: 97.5, export: 4.38, alarms: 1 },
  { area: 'Cooling water', tag: 'NK-40', availability: 96.2, target: 97.5, export: 0, alarms: 0 },
];

const KPI_TILES_AREA_COLUMNS: DataTableColumn<KpiTilesAreaRow>[] = [
  {
    id: 'area',
    header: 'Area',
    cell: (row) => (
      <span className="flex flex-col">
        <span className="font-medium">{row.area}</span>
        <TagId>{row.tag}</TagId>
      </span>
    ),
  },
  { id: 'availability', header: 'Availability', numeric: true, cell: (row) => `${row.availability.toFixed(1)} %` },
  { id: 'target', header: 'Target', numeric: true, muted: true, cell: (row) => `${row.target.toFixed(1)} %` },
  { id: 'alarms', header: 'Alarms', numeric: true, cell: (row) => row.alarms },
  {
    id: 'state',
    header: 'State',
    nowrap: true,
    cell: (row) => {
      const judgement = judgeAgainstTarget(row.availability, row.target, 'up', 0.02);
      return <StatusPill tone={judgement.tone}>{judgement.word}</StatusPill>;
    },
  },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function KpiTilesSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function KpiTilesAnatomy() {
  return (
    <KpiTilesSheet>
      <Grid>
        <Stat className="col-span-3" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" />
        <Stat
          className="col-span-3"
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          decimals={2}
          unit="MSm³/d"
          delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
        />
        <Stat
          className="col-span-3"
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          decimals={2}
          unit="MSm³/d"
          icon={<IconFlame />}
          tone="blue"
          delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
          target="Target 4.50"
        />
        <Stat
          className="col-span-3"
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          decimals={2}
          unit="MSm³/d"
          icon={<IconFlame />}
          tone="blue"
          delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
          target="Target 4.50"
          sparkline={KPI_TILES_EXPORT_TREND}
        />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesSizes() {
  return (
    <KpiTilesSheet>
      <Grid className="items-stretch">
        <Stat className="col-span-2" size="sm" label="Open work orders" value={PLANT_KPIS.openWorkOrders.value} delta={{ value: -4, decimals: 0, good: 'down' }} />
        <Stat
          className="col-span-3"
          size="md"
          label="Availability"
          value={PLANT_KPIS.availability.value}
          decimals={1}
          unit="%"
          icon={<IconActivity />}
          tone="teal"
          delta={{ value: -0.7, unit: ' pts', caption: 'vs last week' }}
        />
        <Stat
          className="col-span-3"
          size="lg"
          label="OEE"
          value={PLANT_KPIS.oee.value}
          decimals={1}
          unit="%"
          icon={<IconGauge />}
          tone="purple"
          delta={{ value: 0.8, unit: ' pts', caption: 'vs last week' }}
          target="Target 85.0 %"
        />
        <Stat
          className="col-span-4"
          size="hero"
          label="Days since last incident"
          value={PLANT_KPIS.daysSinceIncident.value}
          unit="days"
          icon={<IconShieldCheck />}
          tone="success"
          target="Site record 365 days"
        />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesFamilies() {
  return (
    <KpiTilesSheet>
      <Grid>
        <Stat
          className="col-span-3"
          emphasis="strong"
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          decimals={2}
          unit="MSm³/d"
          icon={<IconFlame />}
          tone="accent"
          delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
          sparkline={KPI_TILES_EXPORT_TREND}
        />
        <Stat
          className="col-span-3"
          label="Availability"
          value={PLANT_KPIS.availability.value}
          decimals={1}
          unit="%"
          icon={<IconActivity />}
          tone="teal"
          delta={{ value: -0.7, unit: ' pts', caption: 'vs last week' }}
          sparkline={KPI_TILES_AVAILABILITY_TREND}
        />
        <Stat
          className="col-span-3"
          label="Energy intensity"
          value={PLANT_KPIS.energyIntensity.value}
          decimals={1}
          unit="kWh/boe"
          icon={<IconBolt />}
          tone="purple"
          delta={{ value: -1.4, good: 'down', caption: 'vs last week' }}
          sparkline={KPI_TILES_ENERGY_TREND}
        />
        <Stat
          className="col-span-3"
          label="Flaring"
          value={PLANT_KPIS.flaring.value}
          decimals={1}
          unit="kSm³/d"
          icon={<IconWind />}
          tone="amber"
          delta={{ value: -6.5, good: 'down', caption: 'vs last week' }}
          sparkline={KPI_TILES_FLARING_TREND}
        />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesJoined() {
  return (
    <KpiTilesSheet>
      <StatGroup joined columns={5} label="Plant KPIs, joined">
        <Stat variant="plain" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2 }} />
        <Stat variant="plain" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" delta={{ value: -0.7 }} />
        <Stat variant="plain" label="OEE" value={PLANT_KPIS.oee.value} decimals={1} unit="%" delta={{ value: 0.8 }} />
        <Stat variant="plain" label="MTBF" value={PLANT_KPIS.mtbf.value} unit="h" delta={{ value: 16, decimals: 0 }} />
        <Stat variant="plain" label="Open work orders" value={PLANT_KPIS.openWorkOrders.value} delta={{ value: -4, decimals: 0, good: 'down' }} />
      </StatGroup>
    </KpiTilesSheet>
  );
}

function KpiTilesDirection() {
  return (
    <KpiTilesSheet>
      <Grid>
        <Stat
          className="col-span-4"
          label="Availability"
          value={97.9}
          decimals={1}
          unit="%"
          icon={<IconActivity />}
          tone="teal"
          delta={{ value: 0.8, unit: ' pts', good: 'up', caption: 'higher is better' }}
        />
        <Stat
          className="col-span-4"
          label="Flaring"
          value={PLANT_KPIS.flaring.value}
          decimals={1}
          unit="kSm³/d"
          icon={<IconWind />}
          tone="amber"
          delta={{ value: -6.5, good: 'down', caption: 'lower is better' }}
        />
        <Stat
          className="col-span-4"
          label="Gas flow"
          value={182400}
          unit="Sm³/h"
          icon={<IconGauge />}
          tone="blue"
          delta={{ value: 3200, decimals: 0, good: 'none', caption: 'no judgement' }}
        />
      </Grid>
    </KpiTilesSheet>
  );
}

/** A watched figure: the state is the headline in signal and sits with the limit everywhere else. */
function KpiTilesWatched({ label, value, unit, tone, state, limit, icon, change }: { label: string; value: number; unit: string; tone: Tone; state: string; limit: string; icon: ReactNode; change: number }) {
  const look = useLook();
  return (
    <Stat
      className="col-span-4"
      label={label}
      value={value}
      decimals={1}
      unit={unit}
      tone={tone}
      icon={icon}
      state={state}
      stateIcon={icon}
      target={look === 'signal' ? limit : `${state} · ${limit}`}
      delta={{ value: change, good: 'down', caption: 'in 2 hours' }}
    />
  );
}

function KpiTilesStates() {
  return (
    <KpiTilesSheet>
      <Grid>
        <KpiTilesWatched label="Flaring" value={12.4} unit="kSm³/d" tone="success" state="On target" limit="limit 15.0 kSm³/d" icon={<IconCircleCheck />} change={-1.2} />
        <KpiTilesWatched label="Drive-end vibration" value={6.8} unit="mm/s" tone="warning" state="Near limit" limit="high limit 7.1 mm/s" icon={<IconAlertTriangle />} change={0.9} />
        <KpiTilesWatched label="Discharge temperature" value={146.3} unit="°C" tone="critical" state="Above limit" limit="high limit 145.0 °C" icon={<IconCircleX />} change={5.1} />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesMissing() {
  return (
    <KpiTilesSheet>
      <Grid>
        <StatPlaceholder className="col-span-3" label="Availability" kind="loading" />
        <StatPlaceholder className="col-span-3" label="Test separator flow" kind="empty" message="No readings in the last 24 hours." />
        <StatPlaceholder
          className="col-span-3"
          label="Bearing temperature"
          kind="bad"
          icon={<IconAlertTriangle />}
          lastValue="61.4 °C"
          message="Signal lost at 05:02."
        />
        <StatPlaceholder
          className="col-span-3"
          label="Export flow"
          kind="stale"
          icon={<IconCloudOff />}
          lastValue="412 m³/h"
          message="Last update 42 min ago."
          action={
            <Button size="sm" variant="secondary">
              Reconnect
            </Button>
          }
        />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesTargetBars() {
  return (
    <KpiTilesSheet>
      <Panel title="Against target" subtitle="Month to date" icon={<IconGauge />}>
        <div className="flex flex-col gap-6">
          <TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} tone="warning" variant="bar" />
          <TargetProgress label="Availability" value={96.4} target={97.5} unit="%" decimals={1} tone="warning" variant="bar" />
          <TargetProgress label="Days without incident" value={218} target={365} max={365} unit="days" tone="success" variant="bar" />
        </div>
      </Panel>
    </KpiTilesSheet>
  );
}

function KpiTilesTargetBlocks() {
  return (
    <KpiTilesSheet>
      <Panel title="Blocks and ruled scale" subtitle="The same three figures, drawn two other ways">
        <div className="flex flex-col gap-6">
          <TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} tone="warning" variant="blocks" />
          <TargetProgress label="Availability" value={96.4} target={97.5} unit="%" decimals={1} tone="warning" variant="scale" />
          <TargetProgress label="Days without incident" value={218} target={365} max={365} unit="days" tone="success" variant="blocks" />
        </div>
      </Panel>
    </KpiTilesSheet>
  );
}

function KpiTilesRingTiles() {
  return (
    <KpiTilesSheet>
      <Grid>
        <Panel className="col-span-4" title="Availability" subtitle="Target 97.5 %">
          <div className="flex items-center gap-5">
            <RingGauge label="Availability" hideLabel value={96.4} decimals={1} tone="warning" size={120} />
            <div className="flex min-w-0 flex-col gap-2">
              <StatusPill className="self-start" tone="warning" icon={<IconAlertTriangle />}>
                Watch
              </StatusPill>
              <p className="text-sm text-(--kit-text-2)">1.1 points under target after the recompressor trip.</p>
            </div>
          </div>
        </Panel>
        <Panel className="col-span-4" title="OEE" subtitle="Target 85.0 %">
          <div className="flex items-center gap-5">
            <RingGauge label="OEE" hideLabel value={82.7} decimals={1} tone="warning" size={120} />
            <div className="flex min-w-0 flex-col gap-2">
              <StatusPill className="self-start" tone="warning" icon={<IconAlertTriangle />}>
                Watch
              </StatusPill>
              <p className="text-sm text-(--kit-text-2)">Up 0.8 points on last week, 2.3 points to go.</p>
            </div>
          </div>
        </Panel>
        <Panel className="col-span-4" title="Preventive work done" subtitle="Target 90 %">
          <div className="flex items-center gap-5">
            <RingGauge label="Preventive work done" hideLabel value={94} tone="success" size={120} />
            <div className="flex min-w-0 flex-col gap-2">
              <StatusPill className="self-start" tone="success" icon={<IconCircleCheck />}>
                On target
              </StatusPill>
              <p className="text-sm text-(--kit-text-2)">47 of 50 planned jobs closed this month.</p>
            </div>
          </div>
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesConsole() {
  return (
    <KpiTilesSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={4} label="Plant KPIs">
          <Stat variant="plain" size="lg" label="Gas export" value={4.38} decimals={2} unit="MSm³/d" tone="warning" state="Under plan" target="Under plan · plan 4.50" />
          <Stat variant="plain" size="lg" label="Availability" value={96.4} decimals={1} unit="%" tone="warning" state="Watch" target="Watch · target 97.5" />
          <Stat variant="plain" size="lg" label="Flaring" value={12.4} decimals={1} unit="kSm³/d" tone="success" state="Normal" target="Normal · limit 15.0" />
          <Stat variant="plain" size="lg" label="Active alarms" value={4} tone="critical" state="1 critical" target="1 critical · 3 fewer than yesterday" />
        </StatGroup>
        <Panel className="col-span-12" title="Areas" subtitle="Availability against target, this shift" padding="none">
          <DataTable
            label="Area KPIs"
            flush
            columns={KPI_TILES_AREA_COLUMNS}
            rows={KPI_TILES_AREAS}
            rowKey={(row) => row.tag}
            rowTone={(row) => {
              const tone = judgeAgainstTarget(row.availability, row.target, 'up', 0.02).tone;
              return tone === 'success' ? undefined : tone;
            }}
          />
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesPoster() {
  return (
    <KpiTilesSheet look="poster">
      <Grid>
        <Stat className="col-span-6" size="hero" tone="blue" label="Gas export" value={4.38} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} />
        <Stat className="col-span-6" size="hero" tone="green" label="Availability" value={96.4} decimals={1} unit="%" delta={{ value: -0.7, caption: 'vs last week' }} />
        <Stat className="col-span-4" size="lg" tone="amber" label="Flaring" value={12.4} decimals={1} unit="kSm³/d" />
        <Stat className="col-span-4" size="lg" tone="pink" label="Active alarms" value={4} />
        <Stat className="col-span-4" size="lg" tone="purple" label="Open work orders" value={23} />
        <Panel className="col-span-12" title="Against plan">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} tone="blue" />
            <TargetProgress label="Availability" value={96.4} target={97.5} unit="%" decimals={1} tone="green" />
          </div>
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesGlass() {
  return (
    <KpiTilesSheet look="glass">
      <Grid>
        <Stat
          className="col-span-5"
          size="hero"
          label="Gas export"
          value={4.38}
          decimals={2}
          unit="MSm³/d"
          icon={<IconFlame />}
          tone="sky"
          delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
          sparkline={KPI_TILES_EXPORT_TREND}
        />
        <Panel className="col-span-7" title="Performance" subtitle="Share of target reached">
          <div className="flex h-full items-center justify-around gap-4">
            <RingGauge label="Availability" value={96.4} decimals={1} tone="teal" size={132} />
            <RingGauge label="OEE" value={82.7} decimals={1} tone="purple" size={132} />
            <RingGauge label="Energy" value={96} tone="amber" size={132} />
          </div>
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesEditorial() {
  return (
    <KpiTilesSheet look="editorial">
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="Nordkapp · week 11"
          title="Export held up; availability did not"
          description="The recompressor trip on Thursday cost 1.1 points of availability. Flaring stayed well under the permit limit."
        />
        <StatGroup className="col-span-12" columns={3} label="Weekly headline figures">
          <Stat variant="plain" size="hero" label="Gas export" value={4.38} decimals={2} unit="MSm³/d" delta={{ value: 0.17, decimals: 2, caption: 'vs last week' }} target="Plan 4.50" />
          <Stat variant="plain" size="hero" label="Availability" value={96.4} decimals={1} unit="%" delta={{ value: -0.7, caption: 'vs last week' }} target="Target 97.5" />
          <Stat variant="plain" size="hero" label="Flaring" value={12.4} decimals={1} unit="kSm³/d" delta={{ value: -6.5, good: 'down', caption: 'vs last week' }} target="Limit 15.0" />
        </StatGroup>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesSoft() {
  return (
    <KpiTilesSheet look="soft">
      <Grid>
        <Stat className="col-span-4" tone="blue" label="Gas export" value={4.38} decimals={2} unit="MSm³/d" icon={<IconFlame />} delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }} sparkline={KPI_TILES_EXPORT_TREND} />
        <Stat className="col-span-4" tone="green" label="Availability" value={96.4} decimals={1} unit="%" icon={<IconActivity />} delta={{ value: -0.7, caption: 'vs last week' }} sparkline={KPI_TILES_AVAILABILITY_TREND} />
        <Stat className="col-span-4" tone="pink" label="Active alarms" value={4} icon={<IconBell />} delta={{ value: -3, decimals: 0, good: 'down', caption: 'vs yesterday' }} sparkline={KPI_TILES_ALARM_TREND} />
        <Panel className="col-span-12" tone="purple" title="This month" subtitle="How far each goal has come">
          <div className="grid grid-cols-3 gap-8">
            <TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} tone="blue" />
            <TargetProgress label="Preventive work" value={47} target={50} max={50} unit="jobs" tone="green" />
            <TargetProgress label="Days without incident" value={218} target={365} max={365} unit="days" tone="purple" />
          </div>
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesBlueprint() {
  return (
    <KpiTilesSheet look="blueprint">
      <Grid>
        <Stat className="col-span-4" label="Gas export" value={4.38} decimals={2} unit="MSm³/d" target="Plan 4.50" delta={{ value: 0.17, decimals: 2 }} />
        <Stat className="col-span-4" label="Availability" value={96.4} decimals={1} unit="%" target="Target 97.5" delta={{ value: -0.7 }} />
        <Stat className="col-span-4" label="MTBF" value={412} unit="h" target="Target 450" delta={{ value: 16, decimals: 0 }} />
        <Panel className="col-span-12" title="Measured against target" subtitle="Sheet 2 of 4 · scale ends at 125 % of target">
          <div className="grid grid-cols-3 gap-10">
            <TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} />
            <TargetProgress label="Availability" value={96.4} target={97.5} unit="%" decimals={1} />
            <TargetProgress label="MTBF" value={412} target={450} unit="h" />
          </div>
        </Panel>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesSignal() {
  return (
    <KpiTilesSheet look="signal">
      <Grid>
        <Stat className="col-span-3" size="lg" tone="warning" state="Low" stateIcon={<IconAlertTriangle />} label="Gas export" value={4.38} decimals={2} unit="MSm³/d" target="Plan 4.50" />
        <Stat className="col-span-3" size="lg" tone="warning" state="Watch" stateIcon={<IconAlertTriangle />} label="Availability" value={96.4} decimals={1} unit="%" target="Target 97.5" />
        <Stat className="col-span-3" size="lg" tone="success" state="Normal" stateIcon={<IconCircleCheck />} label="Flaring" value={12.4} decimals={1} unit="kSm³/d" target="Limit 15.0" />
        <Stat className="col-span-3" size="lg" tone="critical" state="Critical" stateIcon={<IconCircleX />} label="Active alarms" value={4} target="1 trip, 2 high" />
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesHeadline() {
  const [range, setRange] = useState<KpiTilesRange>('24 h');
  const { points, label, step } = KPI_TILES_RANGES[range];
  const series = makeSeries({ seed: 31, points, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2, stepMs: step * 60_000 });
  const values = series.map((point) => point.v);
  const latest = values[values.length - 1] ?? 0;
  const first = values[0] ?? 0;

  return (
    <KpiTilesSheet>
      <Grid>
        <Panel
          className="col-span-8"
          title="Gas export"
          subtitle={`${label} against the daily plan`}
          icon={<IconFlame />}
          actions={
            <SegmentedControl
              value={range}
              onValueChange={(value: string) => {
                if (isKpiTilesRange(value)) setRange(value);
              }}
            >
              <SegmentedControlList aria-label="Range">
                <SegmentedControlButton value="8 h">8 h</SegmentedControlButton>
                <SegmentedControlButton value="24 h">24 h</SegmentedControlButton>
                <SegmentedControlButton value="7 d">7 d</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <TrendArea
            label={`Gas export, ${label.toLowerCase()}, against the plan`}
            labels={series.map((point) => formatTime(point.t))}
            unit="MSm³/d"
            decimals={2}
            height={230}
            series={[{ id: 'export', label: 'Export', values, tone: 'accent' }]}
            limits={[{ value: 4.5, label: 'Plan', tone: 'warning' }]}
            headline={<Stat variant="plain" size="hero" label="Now" value={latest} decimals={2} unit="MSm³/d" delta={{ value: latest - first, decimals: 2, caption: `over ${range}` }} />}
          />
        </Panel>
        <div className="col-span-4 flex flex-col gap-(--kit-gap)">
          <Stat
            className="flex-1"
            label="Availability"
            value={PLANT_KPIS.availability.value}
            decimals={1}
            unit="%"
            icon={<IconActivity />}
            tone="teal"
            delta={{ value: -0.7, unit: ' pts', caption: 'vs last week' }}
            target="Target 97.5 %"
          />
          <Stat
            className="flex-1"
            label="Energy intensity"
            value={PLANT_KPIS.energyIntensity.value}
            decimals={1}
            unit="kWh/boe"
            icon={<IconBolt />}
            tone="purple"
            delta={{ value: -1.4, good: 'down', caption: 'vs last week' }}
            target="Target 30.0"
          />
          <Stat
            className="flex-1"
            label="Active alarms"
            value={PLANT_KPIS.activeAlarms.value}
            icon={<IconBell />}
            tone="critical"
            delta={{ value: -3, decimals: 0, good: 'down', caption: 'vs yesterday' }}
            target="1 critical"
          />
        </div>
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesEquipmentGrid() {
  return (
    <KpiTilesSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="1st stage compressor"
          description="23-KA-9101 · live readings against operating limits"
          actions={
            <StatusPill tone="warning" icon={<IconAlertTriangle />}>
              2 near limit
            </StatusPill>
          }
        />
        {KPI_TILES_COMPRESSOR.map((sensor) => {
          const tone = kpiTilesSensorTone(sensor);
          return (
            <Panel
              key={sensor.id}
              className="col-span-4"
              title={sensor.name}
              subtitle={sensor.tag}
              actions={<StatusPill tone={tone}>{KPI_TILES_TONE_WORD[tone] ?? 'Normal'}</StatusPill>}
            >
              <Meter
                size="lg"
                label="Now"
                value={sensor.value}
                min={sensor.rangeMin}
                max={sensor.rangeMax}
                unit={sensor.unit}
                decimals={sensor.decimals}
                high={sensor.highLimit}
                low={sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined}
                tone={tone}
              />
            </Panel>
          );
        })}
      </Grid>
    </KpiTilesSheet>
  );
}

function KpiTilesWallRow() {
  return (
    <KpiTilesSheet look="signal">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="lg"
          level={4}
          title="Nordkapp"
          description="Day shift · 14:00 UTC"
          actions={
            <StatusPill size="lg" tone="warning" icon={<IconAlertTriangle />}>
              Reduced capacity
            </StatusPill>
          }
        />
        <Stat className="col-span-6" size="hero" tone="warning" state="Under plan" stateIcon={<IconAlertTriangle />} label="Gas export" value={4.38} decimals={2} unit="MSm³/d" target="Plan 4.50 MSm³/d" sparkline={KPI_TILES_EXPORT_TREND} />
        <Stat className="col-span-3" size="lg" tone="critical" state="Tripped" stateIcon={<IconCircleX />} label="Recompressor" value="14 min" target="High vibration, 11.6 mm/s" />
        <Stat className="col-span-3" size="lg" tone="success" state="Safe" stateIcon={<IconShieldCheck />} label="Days since incident" value={218} target="Record 365" />
        <Stat className="col-span-3" tone="success" state="Normal" stateIcon={<IconCircleCheck />} label="Flaring" value={12.4} decimals={1} unit="kSm³/d" />
        <Stat className="col-span-3" tone="warning" state="Watch" stateIcon={<IconAlertTriangle />} label="Availability" value={96.4} decimals={1} unit="%" />
        <Stat className="col-span-3" tone="info" state="In progress" stateIcon={<IconTool />} label="Work orders today" value="3 of 7" />
        <Stat className="col-span-3" tone="neutral" state="Next handover" stateIcon={<IconClock />} label="Shift" value="19:00" />
      </Grid>
    </KpiTilesSheet>
  );
}

export default definePage({
  id: 'kpi-tiles',
  title: 'KPI tiles',
  summary:
    'One number with its unit, change, target and trend. The tile is the kit Stat; the look decides whether it is an elevated card, a strip in a console, a solid poster block or a tile filled with its state.',
  guidance: {
    use: [
      'Give every figure a unit, and a reference: a change, a target or a limit.',
      'Say which direction is good so the change is judged correctly.',
      'Keep the footprint when data is loading, missing or bad, and say why.',
      'Lead a row with one emphasised tile; keep the rest quiet.',
    ],
    avoid: [
      'A tile for a number nobody acts on.',
      'Colour as the only sign of state: add the word.',
      'More than five tiles in one row.',
      'A trend without saying what period it covers.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'What a tile is made of, in the look chosen for the app.',
      specimens: [
        {
          id: 'KpiTilesAnatomy',
          title: 'Building up a tile',
          note: 'Start plain and add only the change, target or trend that helps someone act on the figure.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Grid.tsx', 'kit/Canvas.tsx'],
          Component: KpiTilesAnatomy,
        },
        {
          id: 'KpiTilesSizes',
          title: 'Four sizes',
          note: 'Size a tile by how far away it is read: small in a toolbar, hero for the one figure a screen is about.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx'],
          Component: KpiTilesSizes,
        },
        {
          id: 'KpiTilesFamilies',
          title: 'Lead tile and colour families',
          note: 'Use a filled lead tile for the headline and a colour family per measure so each is found again at a glance.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/SparkLine.tsx'],
          Component: KpiTilesFamilies,
        },
        {
          id: 'KpiTilesJoined',
          title: 'Joined strip',
          note: 'Join the figures on one surface when they are read as a set and space is short.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/Stat.tsx'],
          Component: KpiTilesJoined,
        },
      ],
    },
    {
      id: 'direction-and-state',
      title: 'Direction and state',
      description: 'How a tile judges its figure, and what it shows when there is none.',
      specimens: [
        {
          id: 'KpiTilesDirection',
          title: 'Which way is good',
          note: 'Set the good direction per measure: a fall in flaring is good news, a change in flow is neither.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Delta.tsx'],
          Component: KpiTilesDirection,
        },
        {
          id: 'KpiTilesStates',
          title: 'On target, near limit, above limit',
          note: 'Add the state word and its limit when the figure is watched against one.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx'],
          Component: KpiTilesStates,
        },
        {
          id: 'KpiTilesMissing',
          title: 'Loading, no data, bad signal, stale',
          note: 'Keep the tile in place and say what is wrong; never show a stale number as if it were live.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/kpi-tiles/StatPlaceholder.tsx'],
          Component: KpiTilesMissing,
        },
      ],
    },
    {
      id: 'against-a-target',
      title: 'Against a target',
      description: 'When the distance to the goal matters more than the trend.',
      specimens: [
        {
          id: 'KpiTilesTargetBars',
          title: 'Target bars',
          note: 'Pick bars when several goals with different units are compared by how far each has come.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/kpi-tiles/TargetProgress.tsx', 'kit/Panel.tsx'],
          Component: KpiTilesTargetBars,
        },
        {
          id: 'KpiTilesTargetBlocks',
          title: 'Blocks and ruled scale',
          note: 'Pick blocks for a screen read from a distance and the ruled scale for a printed engineering sheet.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/kpi-tiles/TargetProgress.tsx', 'kit/kpi-tiles/progress.ts'],
          Component: KpiTilesTargetBlocks,
        },
        {
          id: 'KpiTilesRingTiles',
          title: 'Ring tiles',
          note: 'Pick a ring when the figure is a share of a whole and a sentence explains the gap.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: KpiTilesRingTiles,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same figures as different anatomy: strips, blocks, rings, columns, scales and state fills.',
      specimens: [
        {
          id: 'KpiTilesConsole',
          title: 'Console strip',
          note: 'Pick it for a control room: figures in a hairline strip with the state as a block, above the table they summarise.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesConsole,
        },
        {
          id: 'KpiTilesPoster',
          title: 'Poster blocks',
          note: 'Pick it for a team screen where two numbers have to land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/kpi-tiles/TargetProgress.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesPoster,
        },
        {
          id: 'KpiTilesSoft',
          title: 'Soft pastel tiles',
          note: 'Pick it for a friendly internal tool where each measure keeps its own colour.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/kpi-tiles/TargetProgress.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesSoft,
        },
        {
          id: 'KpiTilesGlass',
          title: 'Glass rings',
          note: 'Pick it for an executive view on a dark display: one hero figure and shares as glowing rings.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesGlass,
        },
        {
          id: 'KpiTilesEditorial',
          title: 'Editorial columns',
          note: 'Pick it for a weekly report: no cards, a headline that reads the numbers and figures in very large type.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesEditorial,
        },
        {
          id: 'KpiTilesBlueprint',
          title: 'Blueprint scales',
          note: 'Pick it for an engineering sheet: outlined tiles and each figure dimensioned on a ruled scale.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/kpi-tiles/TargetProgress.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesBlueprint,
        },
        {
          id: 'KpiTilesSignal',
          title: 'Signal tiles',
          note: 'Pick it for a wall screen: the tile is filled with its state and the state word is the headline.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesSignal,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'KpiTilesHeadline',
          title: 'Headline with supporting tiles',
          note: 'Pick it at the top of an overview: one figure with its trend and range switch, three more beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TrendArea.tsx', 'kit/Stat.tsx'],
          Component: KpiTilesHeadline,
        },
        {
          id: 'KpiTilesEquipmentGrid',
          title: 'Equipment readings grid',
          note: 'Pick it on an asset page: every live reading against its limits, with the state in words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx', 'kit/SectionHeader.tsx'],
          Component: KpiTilesEquipmentGrid,
        },
        {
          id: 'KpiTilesWallRow',
          title: 'Wall board',
          note: 'Pick it for the screen by the control room door: the plant in eight tiles, state first.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: KpiTilesWallRow,
        },
      ],
    },
  ],
});
