import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconBuildingFactory2,
  IconChartLine,
  IconCylinder,
  IconDroplet,
  IconEngine,
  IconLayoutGrid,
  IconPropeller,
  IconTool,
  IconWindmill,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { AssetCard } from '../../../library/industrial/operations/AssetCard';
import type { AssetCardReading } from '../../../library/industrial/operations/AssetCard';
import { indexAssetTree, rollUp } from '../../../library/industrial/operations/assetTree';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { healthStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, ASSETS, WORK_ORDERS, childrenOf, findAsset, findPerson, sensorsOf } from '../../data/plant';
import type { Asset, RunState, Severity } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './asset-cards.tsx?raw';

function assetById(id: string): Asset {
  const asset = findAsset(id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

const ASSET_ICONS: Record<Asset['type'], typeof IconEngine> = {
  site: IconBuildingFactory2,
  area: IconLayoutGrid,
  system: IconDroplet,
  compressor: IconEngine,
  pump: IconPropeller,
  separator: IconCylinder,
  exchanger: IconArrowsExchange,
  valve: IconAdjustmentsHorizontal,
  turbine: IconWindmill,
};

const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];
const RUN_STATES: readonly RunState[] = ['running', 'standby', 'stopped', 'tripped', 'maintenance'];

/** Identity props every card starts from. */
function assetIdentity(asset: Asset) {
  const Icon = ASSET_ICONS[asset.type];
  return { tag: asset.tag, name: asset.name, state: asset.state, icon: <Icon aria-hidden="true" /> };
}

/** Live readings from the asset's sensors, coloured only when outside their limits. */
function assetSensorReadings(assetId: string, count = 4): AssetCardReading[] {
  return sensorsOf(assetId)
    .slice(0, count)
    .map((sensor) => ({
      label: sensor.name,
      value: sensor.quality === 'bad' ? null : sensor.value,
      unit: sensor.unit,
      decimals: sensor.decimals,
      tone: toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit }),
    }));
}

/** Open alarms on an asset, with the worst severity among them. */
function assetAlarms(assetId: string): { count: number; severity?: Severity } {
  const open = ALARMS.filter((alarm) => alarm.assetId === assetId && (alarm.state === 'active' || alarm.state === 'acknowledged'));
  return { count: open.length, severity: SEVERITIES.find((severity) => open.some((alarm) => alarm.severity === severity)) };
}

const assetWorkOrders = (assetId: string): number => WORK_ORDERS.filter((order) => order.assetId === assetId && order.status !== 'done').length;

/** Readings that differ per equipment type; the card grammar around them stays the same. */
const TYPE_READINGS: Record<string, readonly AssetCardReading[]> = {
  pump: [
    { label: 'Flow', value: 412, unit: 'm³/h' },
    { label: 'Discharge pressure', value: 18.4, unit: 'barg', decimals: 1 },
    { label: 'Motor current', value: 86.2, unit: 'A', decimals: 1 },
    { label: 'Bearing temperature', value: 61.5, unit: '°C', decimals: 1 },
  ],
  separator: [
    { label: 'Level', value: 54.3, unit: '%', decimals: 1 },
    { label: 'Pressure', value: 13.1, unit: 'barg', decimals: 1 },
    { label: 'Temperature', value: 62.4, unit: '°C', decimals: 1 },
    { label: 'Interface level', value: 31.8, unit: '%', decimals: 1 },
  ],
  valve: [
    { label: 'Position', value: 100, unit: '%' },
    { label: 'Stroke time', value: 4.2, unit: 's', decimals: 1 },
    { label: 'Supply pressure', value: 6.1, unit: 'barg', decimals: 1 },
    { label: 'Cycles', value: 1284 },
  ],
  exchanger: [
    { label: 'Outlet temperature', value: 38.9, unit: '°C', decimals: 1 },
    { label: 'Approach', value: 8.4, unit: '°C', decimals: 1 },
    { label: 'Duty', value: 3.2, unit: 'MW', decimals: 1 },
    { label: 'Pressure drop', value: 0.62, unit: 'bar', decimals: 2, tone: 'warning' },
  ],
  turbine: [
    { label: 'Power', value: 21.4, unit: 'MW', decimals: 1 },
    { label: 'Exhaust temperature', value: 512, unit: '°C' },
    { label: 'Speed', value: 9840, unit: 'rpm' },
    { label: 'Fuel gas', value: 5.1, unit: 't/h', decimals: 1 },
  ],
};

const PRESSURE_TREND = makeValues({ seed: 11, points: 48, base: 47.5, amplitude: 1.2, noise: 0.5, drift: 1.1, cycles: 2, decimals: 1 });

/** The hierarchy with each asset's open alarms attached, so counts roll up to areas and the site. */
const ASSET_INDEX = indexAssetTree(
  ASSETS.map((asset) => ({
    ...asset,
    alarms: ALARMS.filter((alarm) => alarm.assetId === asset.id && (alarm.state === 'active' || alarm.state === 'acknowledged')).map((alarm) => alarm.severity),
  }))
);

function AssetCardCompact() {
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(assetById('27-pa-2001a'))} />
    </div>
  );
}

function AssetCardWithHealth() {
  const asset = assetById('23-ka-9101');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} health={{ score: asset.healthScore, health: asset.health }} />
    </div>
  );
}

function AssetCardWithCriticality() {
  const asset = assetById('20-xv-1105');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} criticality={asset.criticality} stateDetail="open" />
    </div>
  );
}

function AssetCardWithReadings() {
  const asset = assetById('20-va-1001');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={assetSensorReadings(asset.id, 2)} />
    </div>
  );
}

function AssetCardWithSparkline() {
  const asset = assetById('23-ka-9101');
  return (
    <div className="w-full max-w-xs">
      <AssetCard
        {...assetIdentity(asset)}
        readings={[{ label: 'Discharge pressure', value: 48.6, unit: 'barg', decimals: 1 }]}
        trend={{ values: PRESSURE_TREND, label: 'Discharge pressure, last 48 hours', unit: 'barg', limit: 52 }}
      />
    </div>
  );
}

function AssetCardWithCounts() {
  const asset = assetById('23-ka-9101');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardPump() {
  const asset = assetById('27-pa-2001a');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={TYPE_READINGS.pump} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardCompressor() {
  const asset = assetById('23-ka-9101');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={assetSensorReadings(asset.id)} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardSeparator() {
  const asset = assetById('20-va-1001');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={TYPE_READINGS.separator} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardValve() {
  const asset = assetById('20-xv-1105');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} stateDetail="open" readings={TYPE_READINGS.valve} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardExchanger() {
  const asset = assetById('23-ha-9114');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={TYPE_READINGS.exchanger} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardTurbine() {
  const asset = assetById('23-gt-9001');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} readings={TYPE_READINGS.turbine} alarms={assetAlarms(asset.id)} workOrders={assetWorkOrders(asset.id)} />
    </div>
  );
}

function AssetCardTripped() {
  const asset = assetById('23-ka-9103');
  return (
    <div className="w-full max-w-xs">
      <AssetCard
        {...assetIdentity(asset)}
        stateDetail="14 min ago"
        criticality={asset.criticality}
        notice={{ tone: 'critical', text: 'Tripped on high drive-end vibration, 11.6 mm/s' }}
        readings={[
          { label: 'Drive-end vibration', value: 0.2, unit: 'mm/s', decimals: 1 },
          { label: 'Shaft speed', value: 0, unit: 'rpm' },
        ]}
        alarms={assetAlarms(asset.id)}
        workOrders={assetWorkOrders(asset.id)}
      />
    </div>
  );
}

function AssetCardMaintenance() {
  const asset = assetById('40-pa-4001');
  return (
    <div className="w-full max-w-xs">
      <AssetCard
        {...assetIdentity(asset)}
        stateDetail="since 11:00"
        notice={{ tone: 'warning', text: 'Isolated for WO-104479. Back in service 13 Mar' }}
        readings={[
          { label: 'Flow', value: 0, unit: 'm³/h' },
          { label: 'Bearing temperature', value: null, unit: '°C' },
        ]}
        alarms={{ count: 0 }}
        workOrders={assetWorkOrders(asset.id)}
      />
    </div>
  );
}

function AssetCardNoData() {
  const asset = assetById('27-pa-2001b');
  return (
    <div className="w-full max-w-xs">
      <AssetCard
        {...assetIdentity(asset)}
        readings={[
          { label: 'Flow', value: null, unit: 'm³/h' },
          { label: 'Motor current', value: null, unit: 'A' },
        ]}
      >
        <p className="text-xs text-muted-foreground">No readings since 10 Mar, 14:00. Check the historian connection.</p>
      </AssetCard>
    </div>
  );
}

function AssetCardLoading() {
  const asset = assetById('23-ka-9102');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} loading />
    </div>
  );
}

function AssetCardSelectable() {
  const pumps = ['27-pa-2001a', '27-pa-2001b', '40-pa-4001'].map(assetById);
  const [selected, setSelected] = useState(pumps[0].id);
  return (
    <div role="group" aria-label="Pump to compare" className="grid w-full grid-cols-3 gap-4">
      {pumps.map((asset) => (
        <AssetCard
          key={asset.id}
          {...assetIdentity(asset)}
          health={{ score: asset.healthScore, health: asset.health }}
          selected={selected === asset.id}
          onSelect={() => setSelected(asset.id)}
        />
      ))}
    </div>
  );
}

function AssetCardMaintenanceDates() {
  const asset = assetById('23-ha-9114');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)}>
        <MetadataList
          items={[
            { label: 'Last maintenance', value: <span className="tabular-nums">{formatDate(REFERENCE_NOW - 152 * DAY)} 2025</span> },
            { label: 'Next due', value: <span className="tabular-nums">{formatDate(REFERENCE_NOW + 4 * DAY)} 2026</span> },
          ]}
        />
        <LinearGauge label="Interval used" value={97} unit="%" size="sm" tone="warning" />
      </AssetCard>
    </div>
  );
}

function AssetCardResponsible() {
  const asset = assetById('23-ka-9101');
  const owner = findPerson('ak');
  return (
    <div className="w-full max-w-xs">
      <AssetCard {...assetIdentity(asset)} health={{ score: asset.healthScore, health: asset.health }}>
        {owner ? (
          <div className="flex items-center gap-3">
            <PersonAvatar name={owner.name} initials={owner.initials} colorKey={owner.id} sizes="xsm" />
            <div className="min-w-0">
              <p className="truncate text-sm text-base-foreground">{owner.name}</p>
              <p className="truncate text-xs text-muted-foreground">{owner.role}</p>
            </div>
          </div>
        ) : null}
      </AssetCard>
    </div>
  );
}

function AssetCardSite() {
  const site = assetById('nk');
  const summary = rollUp(ASSET_INDEX, site.id);
  const openOrders = WORK_ORDERS.filter((order) => order.status !== 'done').length;
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{site.name}</CardTitle>
          <CardDescription>
            Norwegian Sea · {childrenOf(site.id).length} areas · {summary.equipment} units
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ul className="flex w-full flex-col gap-2">
          {RUN_STATES.filter((state) => summary.states[state] > 0).map((state) => (
            <li key={state} className="flex items-center justify-between">
              <StatusIndicator size="sm" {...runStateStatus(state)} />
              <ValueReadout size="xs" value={summary.states[state]} />
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <SeverityBadge severity={summary.worstSeverity ?? 'low'} count={summary.alarms} label="alarms" />
        <span className="inline-flex items-center gap-1.5 text-xs text-base-foreground tabular-nums">
          <IconTool aria-hidden="true" className="size-3.5 text-muted-foreground" />
          {openOrders} work orders
        </span>
      </div>
    </Card>
  );
}

function AssetCardRow() {
  const assets = ['23-ka-9101', '23-ka-9102', '23-ka-9103'].map(assetById);
  return (
    <div className="flex w-full flex-col gap-3">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          layout="row"
          {...assetIdentity(asset)}
          readings={
            asset.id === '23-ka-9101'
              ? assetSensorReadings(asset.id, 3)
              : asset.id === '23-ka-9102'
                ? [
                    { label: 'Discharge pressure', value: 96.2, unit: 'barg', decimals: 1 },
                    { label: 'Suction pressure', value: 47.9, unit: 'barg', decimals: 1 },
                    { label: 'Discharge temperature', value: 128.4, unit: '°C', decimals: 1 },
                  ]
                : [
                    { label: 'Discharge pressure', value: 0.4, unit: 'barg', decimals: 1 },
                    { label: 'Suction pressure', value: 0.4, unit: 'barg', decimals: 1 },
                    { label: 'Discharge temperature', value: 34.1, unit: '°C', decimals: 1 },
                  ]
          }
          health={{ score: asset.healthScore, health: asset.health }}
          alarms={assetAlarms(asset.id)}
        />
      ))}
    </div>
  );
}

function AssetCardAreaGrid() {
  const area = assetById('nk-23');
  const equipment = childrenOf(area.id);
  return (
    <section aria-label={`${area.name} equipment`} className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h3 className="text-base font-medium text-base-foreground">{area.name}</h3>
          <span className="font-mono text-xs text-muted-foreground">{area.tag}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{equipment.length} units</span>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {equipment.map((asset) => (
          <AssetCard
            key={asset.id}
            tag={asset.tag}
            name={asset.name}
            state={asset.state}
            health={{ score: asset.healthScore, health: asset.health }}
            alarms={assetAlarms(asset.id)}
          />
        ))}
      </div>
    </section>
  );
}

function AssetCardHeaderBlock() {
  const asset = assetById('23-ka-9101');
  const Icon = ASSET_ICONS[asset.type];
  const alarms = assetAlarms(asset.id);
  return (
    <Card className="w-full gap-6">
      <CardHeader>
        <CardHeaderCenter>
          <CardDescription>
            Nordkapp plant / Gas compression / <span className="font-mono">{asset.tag}</span>
          </CardDescription>
          <CardTitle as="h3">
            <span className="inline-flex items-center gap-2">
              <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
              {asset.name}
            </span>
          </CardTitle>
        </CardHeaderCenter>
        <CardHeaderEnd className="gap-2">
          <Button variant="secondary" size="sm">
            <IconChartLine aria-hidden="true" />
            View trends
          </Button>
          <Button size="sm">
            <IconTool aria-hidden="true" />
            Create work order
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatusIndicator variant="badge" {...runStateStatus(asset.state)} detail="for 41 d" />
        <Badge variant="secondary">Criticality {asset.criticality}</Badge>
        <StatusIndicator size="sm" {...healthStatus(asset.health)} label={`${healthStatus(asset.health).label} health`} detail={String(asset.healthScore)} />
        {alarms.count > 0 ? <SeverityBadge severity={alarms.severity ?? 'low'} count={alarms.count} label="open alarms" /> : null}
        <span className="text-xs text-muted-foreground tabular-nums">{assetWorkOrders(asset.id)} open work order</span>
      </div>
      <CardContent>
        <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4 xl:grid-cols-6">
          {sensorsOf(asset.id).map((sensor) => (
            <div key={sensor.id} className="flex min-w-0 flex-col gap-2">
              <dt className="truncate text-xs text-muted-foreground">{sensor.name}</dt>
              <dd>
                <ValueReadout
                  value={sensor.value}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  size="md"
                  tone={toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit })}
                />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'asset-cards',
  title: 'Asset cards',
  summary:
    'One card grammar for every piece of equipment: tag, name and run state first, then health, key readings, a trend, and open alarms and work orders as the screen needs them. A pump and a turbine differ only in their readings.',
  guidance: {
    use: [
      'Lead with the tag in monospace and the name; operators search by one, engineers by the other.',
      'Keep the same parts in the same places across equipment types, so a grid of cards can be scanned.',
      'Say the run state in words with its shaped dot; add a tinted notice only for the reason behind an abnormal state.',
      'Show zero alarms explicitly — the absence is information.',
    ],
    avoid: [
      'More than four readings on a card; link to the detail page for the rest.',
      'Colouring a healthy card. Green everywhere hides the one card that is not.',
      'Mixing card layouts in one grid; pick the parts once and use them for every unit.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'The parts of the card, added one at a time.',
      specimens: [
        {
          id: 'AssetCardCompact',
          title: 'Compact',
          note: 'Pick it for dense grids and pickers where tag, name and run state are enough.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardCompact,
        },
        {
          id: 'AssetCardWithHealth',
          title: 'With health score',
          note: 'Pick it on condition-monitoring screens; the ring takes colour only when health is watch or poor.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/ProgressRing.tsx'],
          align: 'stretch',
          Component: AssetCardWithHealth,
        },
        {
          id: 'AssetCardWithCriticality',
          title: 'With criticality',
          note: 'Pick it where people prioritise: criticality A, B or C sits beside the tag as a neutral badge.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardWithCriticality,
        },
        {
          id: 'AssetCardWithReadings',
          title: 'With key readings',
          note: 'Pick it for operations overviews: two to four live values that say how the unit is doing.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: AssetCardWithReadings,
        },
        {
          id: 'AssetCardWithSparkline',
          title: 'With sparkline',
          note: 'Pick it when the direction of one value matters more than several values at once.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/Sparkline.tsx'],
          align: 'stretch',
          Component: AssetCardWithSparkline,
        },
        {
          id: 'AssetCardWithCounts',
          title: 'With alarms and work orders',
          note: 'Pick it for maintenance and shift views: what is open on this unit, in the colour of the worst alarm.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/operations/SeverityBadge.tsx'],
          align: 'stretch',
          Component: AssetCardWithCounts,
        },
      ],
    },
    {
      id: 'types',
      title: 'Equipment types',
      description: 'Same grammar, different readings.',
      specimens: [
        {
          id: 'AssetCardPump',
          title: 'Pump',
          note: 'Pick flow, discharge pressure, motor current and bearing temperature for a pump.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardPump,
        },
        {
          id: 'AssetCardCompressor',
          title: 'Compressor',
          note: 'Pick pressures, discharge temperature and vibration for a compressor; a value over its limit turns amber.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: AssetCardCompressor,
        },
        {
          id: 'AssetCardSeparator',
          title: 'Separator',
          note: 'Pick level, pressure and temperature for a vessel.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardSeparator,
        },
        {
          id: 'AssetCardValve',
          title: 'Valve',
          note: 'Pick position, stroke time and cycle count for a shutdown or control valve.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardValve,
        },
        {
          id: 'AssetCardExchanger',
          title: 'Heat exchanger',
          note: 'Pick outlet temperature, approach, duty and pressure drop for an exchanger.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardExchanger,
        },
        {
          id: 'AssetCardTurbine',
          title: 'Turbine',
          note: 'Pick power, exhaust temperature, speed and fuel for a gas turbine.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardTurbine,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the card does when the unit is not simply running.',
      specimens: [
        {
          id: 'AssetCardTripped',
          title: 'Tripped',
          note: 'Pick the notice line for a trip: the state says what, the notice says why, the counts say what is being done.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardTripped,
        },
        {
          id: 'AssetCardMaintenance',
          title: 'In maintenance',
          note: 'Pick it for a unit taken out of service on purpose: the work order and the return date explain the state.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardMaintenance,
        },
        {
          id: 'AssetCardNoData',
          title: 'No data',
          note: 'Pick it when the unit is known but its readings are not: dashes keep the layout and one line says since when.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardNoData,
        },
        {
          id: 'AssetCardLoading',
          title: 'Loading',
          note: 'Pick it while readings load; tag and name are already known, so they show at once.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          align: 'stretch',
          Component: AssetCardLoading,
        },
        {
          id: 'AssetCardSelectable',
          title: 'Selectable',
          note: 'Pick it when the card is the choice: comparing units, or choosing what a detail panel shows.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: AssetCardSelectable,
        },
      ],
    },
    {
      id: 'context',
      title: 'Maintenance, people and sites',
      description: 'The card extended with what a planner or a manager asks about.',
      specimens: [
        {
          id: 'AssetCardMaintenanceDates',
          title: 'Last maintenance and next due',
          note: 'Pick it for planners: when the unit was last serviced, when it is due, and how much of the interval is used.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'display/MetadataList.tsx', 'industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: AssetCardMaintenanceDates,
        },
        {
          id: 'AssetCardResponsible',
          title: 'With responsible person',
          note: 'Pick it where the next step is to contact someone: the engineer who owns the equipment.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'display/PersonAvatar.tsx'],
          align: 'stretch',
          Component: AssetCardResponsible,
        },
        {
          id: 'AssetCardSite',
          title: 'Site with roll-up counts',
          note: 'Pick it one level up: a site or area with its units counted by run state, and open alarms and work orders rolled up.',
          origin: 'custom',
          uses: ['industrial/operations/assetTree.ts', 'industrial/operations/SeverityBadge.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: AssetCardSite,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Rows, grids and headers',
      description: 'Cards at the scale of a screen.',
      specimens: [
        {
          id: 'AssetCardRow',
          title: 'Horizontal row cards',
          note: 'Pick rows to compare the same readings across similar units; columns line up from card to card.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AssetCardRow,
        },
        {
          id: 'AssetCardAreaGrid',
          title: 'Area grid',
          note: 'Pick it as the landing view of an area: every unit as the same compact card, health and alarms visible.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AssetCardAreaGrid,
        },
        {
          id: 'AssetCardHeaderBlock',
          title: 'Asset header block',
          note: 'Pick it at the top of an asset detail page: where it sits, what state it is in, its live readings and the two main actions.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/operations/SeverityBadge.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: AssetCardHeaderBlock,
        },
      ],
    },
  ],
});
