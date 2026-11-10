import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { PLANT_KPIS, SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { DAY, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './kpi-tiles.tsx?raw';

const KPI = PLANT_KPIS;

/** 30 daily values that end on the KPI's current value. */
const kpiTrend = (seed: number, from: number, to: number, noise: number, decimals = 1): number[] => [
  ...makeValues({ seed, points: 29, base: from, drift: to - from, noise, stepMs: DAY, decimals }),
  to,
];

const AVAILABILITY_TREND = kpiTrend(31, 97.3, KPI.availability.value, 0.25);
const OEE_TREND = kpiTrend(32, 80.6, KPI.oee.value, 0.5);
const EXPORT_TREND = kpiTrend(33, 4.1, KPI.gasExport.value, 0.06, 2);
const ENERGY_TREND = kpiTrend(34, 33.4, KPI.energyIntensity.value, 0.4);
const FLARING_TREND = kpiTrend(35, 19.5, KPI.flaring.value, 1.6);
const ALARM_TREND = [3, 5, 2, 6, 7, 4, 9, 8, 5, 3, 6, 7, 5, 4];

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

/** 48 hourly values that end on the sensor's current value. */
const sensorTrend = (sensor: Sensor, drift = 0): number[] => [
  ...makeValues({
    seed: sensor.seed,
    points: 47,
    base: sensor.value - drift,
    drift,
    amplitude: (sensor.highLimit - sensor.lowLimit) * 0.04,
    noise: (sensor.highLimit - sensor.lowLimit) * 0.03,
    cycles: 2,
    decimals: sensor.decimals,
  }),
  sensor.value,
];

function KpiTilePlain() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label="Availability" value={KPI.availability.value} unit="%" decimals={1} />
    </div>
  );
}

function KpiTileWithDelta() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="OEE"
        value={KPI.oee.value}
        unit="%"
        decimals={1}
        delta={{ reference: KPI.oee.previous, goodDirection: 'up', caption: 'vs last week' }}
      />
    </div>
  );
}

function KpiTileWithTarget() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label="Gas export" value={KPI.gasExport.value} unit={KPI.gasExport.unit} decimals={2} target={{ value: KPI.gasExport.target }} />
    </div>
  );
}

function KpiTileWithSparkline() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Energy intensity"
        value={KPI.energyIntensity.value}
        unit={KPI.energyIntensity.unit}
        decimals={1}
        trend={{ values: ENERGY_TREND, label: 'Energy intensity, last 30 days' }}
      />
    </div>
  );
}

function KpiTileWithStatus() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Flaring"
        value={KPI.flaring.value}
        unit={KPI.flaring.unit}
        decimals={1}
        status={{ tone: 'success', label: 'Within permit' }}
      />
    </div>
  );
}

function KpiTileComplete() {
  return (
    <div className="w-full self-center max-w-sm">
      <KpiTile
        label="Availability"
        value={KPI.availability.value}
        unit="%"
        decimals={1}
        status={{ tone: 'warning', label: 'Below target', shape: 'square' }}
        delta={{ reference: KPI.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
        target={{ value: KPI.availability.target }}
        trend={{ values: AVAILABILITY_TREND, label: 'Availability, last 30 days' }}
        footnote="Rolling 30 days, all production trains"
      />
    </div>
  );
}

function KpiTileCompact() {
  return (
    <div className="w-full self-center max-w-56">
      <KpiTile
        size="compact"
        label="MTBF"
        value={KPI.mtbf.value}
        unit="h"
        delta={{ reference: KPI.mtbf.previous, goodDirection: 'up', format: 'percent' }}
      />
    </div>
  );
}

function KpiTileLarge() {
  return (
    <div className="w-full self-center max-w-md">
      <KpiTile
        size="large"
        label="Gas export"
        value={KPI.gasExport.value}
        unit={KPI.gasExport.unit}
        decimals={2}
        delta={{ reference: KPI.gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
        target={{ value: KPI.gasExport.target }}
        trend={{ values: EXPORT_TREND, label: 'Gas export, last 30 days' }}
      />
    </div>
  );
}

function KpiTileCount() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Open work orders"
        value={KPI.openWorkOrders.value}
        delta={{ reference: KPI.openWorkOrders.previous, goodDirection: 'down', caption: 'vs last week', decimals: 0 }}
      />
    </div>
  );
}

function KpiTileLongValue() {
  const flow = findSensor('ft-92510');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label={`${flow.name} · ${flow.tag}`} value={flow.value} unit={flow.unit} delta={{ reference: 179800, format: 'percent', caption: 'vs 1 h ago' }} />
    </div>
  );
}

function KpiTileWithFootnote() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label="Days since incident" value={KPI.daysSinceIncident.value} unit="d" footnote="Last recordable incident 6 Aug 2025" />
    </div>
  );
}

function KpiTileBarTrend() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Active alarms"
        value={KPI.activeAlarms.value}
        delta={{ reference: KPI.activeAlarms.previous, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }}
        trend={{ values: [...ALARM_TREND, KPI.activeAlarms.value], variant: 'bar', label: 'Active alarms per day, last 15 days' }}
      />
    </div>
  );
}

function KpiTileWithTargetBar() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label="MTBF" value={KPI.mtbf.value} unit="h" target={{ value: KPI.mtbf.target }}>
        <LinearGauge label="MTBF against target" value={KPI.mtbf.value} max={500} target={KPI.mtbf.target} unit="h" size="sm" showHeader={false} />
      </KpiTile>
    </div>
  );
}

function KpiTileHigherIsBetter() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Availability"
        value={KPI.availability.value}
        unit="%"
        decimals={1}
        delta={{ reference: KPI.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
      />
    </div>
  );
}

function KpiTileLowerIsBetter() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Flaring"
        value={KPI.flaring.value}
        unit={KPI.flaring.unit}
        decimals={1}
        delta={{ reference: KPI.flaring.previous, goodDirection: 'down', caption: 'vs last week' }}
        trend={{ values: FLARING_TREND, label: 'Flaring, last 30 days' }}
      />
    </div>
  );
}

function KpiTileNeutralDelta() {
  const speed = findSensor('st-92501');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label={speed.name} value={speed.value} unit={speed.unit} delta={{ reference: 9790, caption: 'vs 1 h ago', decimals: 0 }} />
    </div>
  );
}

function KpiTileWarningValue() {
  const temperature = findSensor('tt-92532');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label={temperature.name}
        value={146.3}
        unit={temperature.unit}
        decimals={1}
        tone="warning"
        status={{ tone: 'warning', label: 'High', shape: 'square' }}
        target={{ value: temperature.highLimit, label: 'Limit' }}
        trend={{ values: [...sensorTrend(temperature, 9).slice(0, -1), 146.3], limit: temperature.highLimit, label: 'Discharge temperature, last 48 hours' }}
      />
    </div>
  );
}

function KpiTileCriticalValue() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Recompressor vibration"
        value={11.6}
        unit="mm/s"
        decimals={1}
        tone="critical"
        status={{ tone: 'critical', label: 'Tripped', shape: 'diamond' }}
        target={{ value: 11, label: 'Trip limit' }}
        footnote="23-VT-92740 · tripped 14 min ago"
      />
    </div>
  );
}

function KpiTileOnTarget() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label="Flaring"
        value={KPI.flaring.value}
        unit={KPI.flaring.unit}
        decimals={1}
        status={{ tone: 'success', label: 'On target' }}
        target={{ value: KPI.flaring.target, label: 'Permit' }}
      />
    </div>
  );
}

function KpiTileLoading() {
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label="Availability" value={null} loading />
    </div>
  );
}

function KpiTileLoadingLarge() {
  return (
    <div className="w-full self-center max-w-md">
      <KpiTile size="large" label="Gas export" value={null} loading />
    </div>
  );
}

function KpiTileNoData() {
  const bearing = findSensor('tt-40015');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile label={bearing.name} value={null} unit={bearing.unit} emptyText="No data in the last 24 h" />
    </div>
  );
}

function KpiTileBadSignal() {
  const bearing = findSensor('tt-40015');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label={bearing.name}
        value={null}
        unit={bearing.unit}
        status={{ tone: 'critical', label: 'Bad quality', shape: 'diamond' }}
        emptyText="Signal lost 9 h ago"
        footnote={`${bearing.tag} · WO-104479 planned`}
      />
    </div>
  );
}

function KpiTileStaleData() {
  const cooler = findSensor('tt-91141');
  return (
    <div className="w-full self-center max-w-64">
      <KpiTile
        label={cooler.name}
        value={cooler.value}
        unit={cooler.unit}
        decimals={1}
        status={{ tone: 'warning', label: 'Uncertain', shape: 'ring' }}
        footnote="Last good value 13:42 UTC"
      />
    </div>
  );
}

function KpiTilePlantRow() {
  return (
    <div className="grid w-full self-center grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="Availability"
        value={KPI.availability.value}
        unit="%"
        decimals={1}
        delta={{ reference: KPI.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
        trend={{ values: AVAILABILITY_TREND, label: 'Availability, last 30 days' }}
      />
      <KpiTile
        label="OEE"
        value={KPI.oee.value}
        unit="%"
        decimals={1}
        delta={{ reference: KPI.oee.previous, goodDirection: 'up', caption: 'vs last week' }}
        trend={{ values: OEE_TREND, label: 'OEE, last 30 days' }}
      />
      <KpiTile
        label="Gas export"
        value={KPI.gasExport.value}
        unit={KPI.gasExport.unit}
        decimals={2}
        delta={{ reference: KPI.gasExport.previous, goodDirection: 'up', caption: 'vs last week', decimals: 2 }}
        trend={{ values: EXPORT_TREND, label: 'Gas export, last 30 days' }}
      />
      <KpiTile
        label="Flaring"
        value={KPI.flaring.value}
        unit={KPI.flaring.unit}
        decimals={1}
        delta={{ reference: KPI.flaring.previous, goodDirection: 'down', caption: 'vs last week' }}
        trend={{ values: FLARING_TREND, label: 'Flaring, last 30 days' }}
      />
    </div>
  );
}

function KpiTileCompactGrid() {
  const sensors = ['pt-92530', 'pt-92531', 'tt-92532', 'vt-92540', 'st-92501', 'ft-92510'].map(findSensor);
  return (
    <section aria-label="1st stage compressor readings" className="flex w-full flex-col gap-3 self-center">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-medium text-base-foreground">1st stage compressor</h3>
        <span className="text-xs text-muted-foreground">23-KA-9101</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {sensors.map((sensor) => (
          <KpiTile
            key={sensor.id}
            size="compact"
            label={sensor.name}
            value={sensor.value}
            unit={sensor.unit}
            decimals={sensor.decimals}
            trend={{ values: sensorTrend(sensor), label: `${sensor.name}, last 48 hours` }}
          />
        ))}
      </div>
    </section>
  );
}

function KpiTileHeroWithSupport() {
  return (
    <div className="grid w-full self-center grid-cols-1 gap-4 md:grid-cols-3">
      <KpiTile
        size="large"
        className="md:col-span-2"
        label="Gas export"
        value={KPI.gasExport.value}
        unit={KPI.gasExport.unit}
        decimals={2}
        status={{ tone: 'warning', label: 'Below plan', shape: 'square' }}
        delta={{ reference: KPI.gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
        target={{ value: KPI.gasExport.target, label: 'Plan' }}
        trend={{ values: EXPORT_TREND, label: 'Gas export, last 30 days' }}
      />
      <div className="flex flex-col gap-4">
        <KpiTile
          size="compact"
          className="flex-1"
          label="Energy intensity"
          value={KPI.energyIntensity.value}
          unit={KPI.energyIntensity.unit}
          decimals={1}
          delta={{ reference: KPI.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
        />
        <KpiTile
          size="compact"
          className="flex-1"
          label="Flaring"
          value={KPI.flaring.value}
          unit={KPI.flaring.unit}
          decimals={1}
          delta={{ reference: KPI.flaring.previous, goodDirection: 'down', caption: 'vs last week' }}
        />
      </div>
    </div>
  );
}

function KpiTileMixedStates() {
  const bearing = findSensor('tt-40015');
  return (
    <div className="grid w-full self-center grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="Active alarms"
        value={KPI.activeAlarms.value}
        tone="critical"
        status={{ tone: 'critical', label: '1 critical', shape: 'diamond' }}
        delta={{ reference: KPI.activeAlarms.previous, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }}
      />
      <KpiTile
        label="Open work orders"
        value={KPI.openWorkOrders.value}
        delta={{ reference: KPI.openWorkOrders.previous, goodDirection: 'down', caption: 'vs last week', decimals: 0 }}
        target={{ value: KPI.openWorkOrders.target }}
      />
      <KpiTile label="MTBF" value={null} loading />
      <KpiTile label={bearing.name} value={null} unit={bearing.unit} emptyText="Signal lost 9 h ago" />
    </div>
  );
}

export default definePage({
  id: 'kpi-tiles',
  title: 'KPI tiles',
  summary:
    'One number that answers one question: its label, value and unit, and optionally its change, target, trend and state. Tiles are the first row of every operational dashboard.',
  guidance: {
    use: [
      'Lead a dashboard with 3–6 tiles of one size, most important first.',
      'Say which direction is good, so the change colour means better or worse.',
      'Keep the number neutral; colour it only when the KPI itself is in an abnormal state.',
      'Show the skeleton while loading and say why when there is no data.',
    ],
    avoid: [
      'More than one number per tile — use a table or a chart instead.',
      'A sparkline, delta, target and status on every tile; add only what changes a decision.',
      'Decorative colour or icons to tell tiles apart; the label does that.',
      'Mixing tile sizes in one row.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'Start with label, value and unit, then add one supporting element at a time.',
      specimens: [
        {
          id: 'KpiTilePlain',
          title: 'Plain',
          note: 'Pick it when the number speaks for itself and people know what good looks like.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTilePlain,
        },
        {
          id: 'KpiTileWithDelta',
          title: 'With change',
          note: 'Pick it when the movement since the last period matters as much as the level.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/TrendDelta.tsx'],
          align: 'stretch',
          Component: KpiTileWithDelta,
        },
        {
          id: 'KpiTileWithTarget',
          title: 'With target',
          note: 'Pick it when the KPI is managed against a plan or budget figure.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileWithTarget,
        },
        {
          id: 'KpiTileWithSparkline',
          title: 'With sparkline',
          note: 'Pick it when the shape of the last period explains the number.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          align: 'stretch',
          Component: KpiTileWithSparkline,
        },
        {
          id: 'KpiTileWithStatus',
          title: 'With status',
          note: 'Pick it when the KPI has a judged state that should be read before the number.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: KpiTileWithStatus,
        },
        {
          id: 'KpiTileComplete',
          title: 'Everything on',
          note: 'Pick it for the one KPI a view is about; it is too much for a whole row.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'md',
          align: 'stretch',
          Component: KpiTileComplete,
        },
      ],
    },
    {
      id: 'sizes-and-content',
      title: 'Sizes and content',
      description: 'Three sizes, and how the tile holds counts, long values and extra content.',
      specimens: [
        {
          id: 'KpiTileCompact',
          title: 'Compact',
          note: 'Pick it for dense grids and side panels where six or more figures share the space.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileCompact,
        },
        {
          id: 'KpiTileLarge',
          title: 'Large',
          note: 'Pick it for the headline figure of a wallboard or a page; the trend gets the full width.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'md',
          align: 'stretch',
          Component: KpiTileLarge,
        },
        {
          id: 'KpiTileCount',
          title: 'Count without unit',
          note: 'Pick it for things that are counted — work orders, alarms, assets — where a unit adds nothing.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileCount,
        },
        {
          id: 'KpiTileLongValue',
          title: 'Long value and unit',
          note: 'Pick it to check a tile holds six-digit readings and compound units without wrapping.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileLongValue,
        },
        {
          id: 'KpiTileWithFootnote',
          title: 'With footnote',
          note: 'Pick it when the number needs its basis stated: the period, the scope or the source.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileWithFootnote,
        },
        {
          id: 'KpiTileBarTrend',
          title: 'With bar trend',
          note: 'Pick it for counts per period, where each bar is a day or a shift rather than a continuous signal.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          align: 'stretch',
          Component: KpiTileBarTrend,
        },
        {
          id: 'KpiTileWithTargetBar',
          title: 'With target bar',
          note: 'Pick it when distance to the target should be seen, not calculated.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: KpiTileWithTargetBar,
        },
      ],
    },
    {
      id: 'direction-and-state',
      title: 'Direction and state',
      description: 'Colour appears only for a judged change or an abnormal value.',
      specimens: [
        {
          id: 'KpiTileHigherIsBetter',
          title: 'Higher is better',
          note: 'Pick it for availability, OEE and output: a fall reads as worse.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/TrendDelta.tsx'],
          align: 'stretch',
          Component: KpiTileHigherIsBetter,
        },
        {
          id: 'KpiTileLowerIsBetter',
          title: 'Lower is better',
          note: 'Pick it for flaring, energy use and alarm counts: a fall reads as better.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/TrendDelta.tsx'],
          align: 'stretch',
          Component: KpiTileLowerIsBetter,
        },
        {
          id: 'KpiTileNeutralDelta',
          title: 'Change without judgement',
          note: 'Pick it for process values such as speed or flow, where a change is neither good nor bad.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/TrendDelta.tsx'],
          align: 'stretch',
          Component: KpiTileNeutralDelta,
        },
        {
          id: 'KpiTileOnTarget',
          title: 'On target',
          note: 'Pick it when confirming a KPI is inside its permit or plan is itself the message.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileOnTarget,
        },
        {
          id: 'KpiTileWarningValue',
          title: 'Value above limit',
          note: 'Pick it when the reading has crossed its operating limit and needs attention soon.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          align: 'stretch',
          Component: KpiTileWarningValue,
        },
        {
          id: 'KpiTileCriticalValue',
          title: 'Value at trip limit',
          note: 'Pick it when the reading has reached a trip limit and someone must act now.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileCriticalValue,
        },
      ],
    },
    {
      id: 'loading-and-missing',
      title: 'Loading and missing data',
      description: 'A tile keeps its place and says what is going on when it has no number to show.',
      specimens: [
        {
          id: 'KpiTileLoading',
          title: 'Loading',
          note: 'Pick it while the figure is being fetched, so the row does not jump when it arrives.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileLoading,
        },
        {
          id: 'KpiTileLoadingLarge',
          title: 'Loading, large',
          note: 'Pick it for the headline tile; the skeleton reserves the trend area too.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'md',
          align: 'stretch',
          Component: KpiTileLoadingLarge,
        },
        {
          id: 'KpiTileNoData',
          title: 'No data',
          note: 'Pick it when the query worked but returned nothing for the period.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileNoData,
        },
        {
          id: 'KpiTileBadSignal',
          title: 'Bad signal',
          note: 'Pick it when the instrument itself has failed, and point to the work that fixes it.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileBadSignal,
        },
        {
          id: 'KpiTileStaleData',
          title: 'Uncertain value',
          note: 'Pick it when a value is still shown but its quality is in doubt or it has stopped updating.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: KpiTileStaleData,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Rows and groups',
      description: 'How tiles sit together on a real screen.',
      specimens: [
        {
          id: 'KpiTilePlantRow',
          title: 'Plant KPI row',
          note: 'Pick it as the first row of a plant or site dashboard: four tiles, one size, same parts.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'full',
          align: 'stretch',
          Component: KpiTilePlantRow,
        },
        {
          id: 'KpiTileHeroWithSupport',
          title: 'Headline with supporting tiles',
          note: 'Pick it when one KPI leads and two others explain it.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: KpiTileHeroWithSupport,
        },
        {
          id: 'KpiTileCompactGrid',
          title: 'Equipment readings grid',
          note: 'Pick it on an asset page to show every live reading of one machine at a glance.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: KpiTileCompactGrid,
        },
        {
          id: 'KpiTileMixedStates',
          title: 'Row with mixed states',
          note: 'Pick it to check a row stays aligned when tiles are abnormal, loading or without data.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'full',
          align: 'stretch',
          Component: KpiTileMixedStates,
        },
      ],
    },
  ],
});
