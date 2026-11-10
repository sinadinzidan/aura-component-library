import { Button } from '@cognite/aura/components/button';
import { Kbd } from '@cognite/aura/components/kbd';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertOctagon, IconAlertTriangle, IconArrowUp } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';

import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { TONE_TEXT, severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import {
  createDrillReducer,
  createDrillState,
  currentNode,
  pathNodes,
} from '../../../library/experiences/drilldown/drillReducer';
import { buildHierarchy, isAbnormal } from '../../../library/experiences/drilldown/hierarchy';
import type { DrillMetric, DrillNode } from '../../../library/experiences/drilldown/hierarchy';
import { NodeDetailStrip } from '../../../library/experiences/drilldown/NodeDetailStrip';
import { PathBar } from '../../../library/experiences/drilldown/PathBar';
import { SensorTrend } from '../../../library/experiences/drilldown/SensorTrend';
import { TreemapCanvas } from '../../../library/experiences/drilldown/TreemapCanvas';
import { aspectRatio, squarify } from '../../../library/experiences/drilldown/treemapLayout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import type { Asset, Sensor } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './treemap-explorer.tsx?raw';

/** Measurement points on the machines the shared plant leaves bare, in the same tag style. */
const TREEMAP_EXTRA_SENSORS: readonly Sensor[] = [
  { id: 'lt-10022', tag: '20-LT-10022', name: 'Separator level', assetId: '20-va-1002', unit: '%', value: 12.5, lowLimit: 0, highLimit: 70, highHighLimit: 85, rangeMin: 0, rangeMax: 100, decimals: 1, quality: 'good', seed: 51 },
  { id: 'zt-11051', tag: '20-ZT-11051', name: 'Valve position', assetId: '20-xv-1105', unit: '%', value: 100, lowLimit: 95, highLimit: 100, rangeMin: 0, rangeMax: 100, decimals: 0, quality: 'good', seed: 52 },
  { id: 'pt-92631', tag: '23-PT-92631', name: 'Discharge pressure', assetId: '23-ka-9102', unit: 'barg', value: 96.4, lowLimit: 85, highLimit: 102, highHighLimit: 108, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 53 },
  { id: 'tt-92632', tag: '23-TT-92632', name: 'Discharge temperature', assetId: '23-ka-9102', unit: '°C', value: 128.5, lowLimit: 90, highLimit: 145, highHighLimit: 155, rangeMin: 0, rangeMax: 180, decimals: 1, quality: 'good', seed: 54 },
  { id: 'vt-92640', tag: '23-VT-92640', name: 'Drive-end vibration', assetId: '23-ka-9102', unit: 'mm/s', value: 3.2, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 55 },
  { id: 'vt-92740', tag: '23-VT-92740', name: 'Drive-end vibration', assetId: '23-ka-9103', unit: 'mm/s', value: 11.6, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 56 },
  { id: 'st-92701', tag: '23-ST-92701', name: 'Shaft speed', assetId: '23-ka-9103', unit: 'rpm', value: 0, lowLimit: 0, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 57 },
  { id: 'tt-90011', tag: '23-TT-90011', name: 'Exhaust temperature', assetId: '23-gt-9001', unit: '°C', value: 512, lowLimit: 400, highLimit: 540, highHighLimit: 560, rangeMin: 0, rangeMax: 650, decimals: 0, quality: 'good', seed: 58 },
  { id: 'st-90001', tag: '23-ST-90001', name: 'Turbine speed', assetId: '23-gt-9001', unit: 'rpm', value: 9840, lowLimit: 7000, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 59 },
  { id: 'it-20023', tag: '27-IT-20023', name: 'Motor current', assetId: '27-pa-2001b', unit: 'A', value: 0, lowLimit: 0, highLimit: 95, highHighLimit: 105, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 60 },
];

const TREEMAP_SENSORS: readonly Sensor[] = [...SENSORS, ...TREEMAP_EXTRA_SENSORS];

/** Last 30 days per machine: hours out of service and a maintenance cost index (100 = plant average). */
const TREEMAP_MACHINE_FIGURES: Readonly<Record<string, { downtimeHours: number; maintenanceCost: number }>> = {
  '20-va-1001': { downtimeHours: 2, maintenanceCost: 38 },
  '20-va-1002': { downtimeHours: 0, maintenanceCost: 12 },
  '20-xv-1105': { downtimeHours: 1, maintenanceCost: 22 },
  '23-ka-9101': { downtimeHours: 9, maintenanceCost: 148 },
  '23-ka-9102': { downtimeHours: 3, maintenanceCost: 96 },
  '23-ka-9103': { downtimeHours: 41, maintenanceCost: 214 },
  '23-ha-9114': { downtimeHours: 14, maintenanceCost: 121 },
  '23-gt-9001': { downtimeHours: 6, maintenanceCost: 172 },
  '27-pa-2001a': { downtimeHours: 2, maintenanceCost: 54 },
  '27-pa-2001b': { downtimeHours: 0, maintenanceCost: 31 },
  '40-pa-4001': { downtimeHours: 26, maintenanceCost: 67 },
};

/** The same two figures per instrument: hours without a good signal, and calibration and repair cost. */
function treemapSensorFigures(sensor: Sensor): { downtimeHours: number; maintenanceCost: number } {
  const downtimeHours = sensor.quality === 'bad' ? 9 : sensor.quality === 'uncertain' ? 3 : sensor.seed % 3 === 0 ? 1 : 0;
  return { downtimeHours, maintenanceCost: 4 + ((sensor.seed * 7) % 14) };
}

/** The last 24 hours of a sensor, ending on its current value. A dead or idle signal has no trend. */
function treemapSensorSeries(sensor: Sensor): SeriesPoint[] {
  if (sensor.quality === 'bad') return [];
  const band = sensor.highLimit - sensor.lowLimit;
  const idle = sensor.value === 0;
  const raw = makeSeries({
    seed: sensor.seed,
    points: 49,
    base: sensor.value,
    amplitude: idle ? 0 : band * 0.06,
    noise: idle ? 0 : band * 0.025,
    cycles: 2,
    stepMs: 30 * MINUTE,
    decimals: sensor.decimals,
  });
  const offset = sensor.value - (raw[raw.length - 1]?.v ?? sensor.value);
  return raw.map((point) => ({ t: point.t, v: Number(Math.max(sensor.rangeMin, point.v + offset).toFixed(sensor.decimals)) }));
}

/** Health score of an asset over the last 24 hours, ending on today's score. */
function treemapHealthSeries(asset: Asset, index: number): SeriesPoint[] {
  const slipping = asset.health !== 'good';
  const raw = makeSeries({ seed: 70 + index, points: 25, base: asset.healthScore + (slipping ? 5 : 0), amplitude: 0.8, noise: 0.4, cycles: 1.5, drift: slipping ? -5 : 0, decimals: 1, min: 0, max: 100 });
  const offset = asset.healthScore - (raw[raw.length - 1]?.v ?? asset.healthScore);
  return raw.map((point) => ({ t: point.t, v: Math.min(100, Number((point.v + offset).toFixed(1))) }));
}

const TREEMAP_TREE = buildHierarchy({
  assets: ASSETS,
  sensors: TREEMAP_SENSORS,
  alarms: ALARMS,
  metrics: { ...TREEMAP_MACHINE_FIGURES, ...Object.fromEntries(TREEMAP_SENSORS.map((sensor) => [sensor.id, treemapSensorFigures(sensor)])) },
  series: {
    ...Object.fromEntries(ASSETS.map((asset, index) => [asset.id, treemapHealthSeries(asset, index)])),
    ...Object.fromEntries(TREEMAP_SENSORS.map((sensor) => [sensor.id, treemapSensorSeries(sensor)])),
  },
});

const TREEMAP_REDUCER = createDrillReducer(TREEMAP_TREE);

const TREEMAP_METRICS: readonly DrillMetric[] = [
  { key: 'openAlarms', label: 'Open alarms' },
  { key: 'downtimeHours', label: 'Downtime', unit: 'h' },
  { key: 'maintenanceCost', label: 'Maintenance cost index' },
  { key: 'healthDeficit', label: 'Health deficit', unit: 'pts' },
];

const TREEMAP_DEFAULT_METRIC: DrillMetric = { key: 'openAlarms', label: 'Open alarms' };

const treemapMetric = (key: string): DrillMetric => TREEMAP_METRICS.find((metric) => metric.key === key) ?? TREEMAP_DEFAULT_METRIC;

function TreemapMetricSwitch({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <SegmentedControl value={value} onValueChange={(next) => onChange(String(next))}>
      <SegmentedControlList size="small" aria-label="Size rectangles by">
        {TREEMAP_METRICS.map((metric) => (
          <SegmentedControlButton key={metric.key} value={metric.key}>
            {metric.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** The tile a sensor becomes at the bottom of the tree: the whole canvas as one trend. */
function TreemapSensorTile({ node }: { node: DrillNode }) {
  const reading = node.reading;
  const abnormal = isAbnormal(node.status.tone);
  const alarms = node.alarms.slice(0, 2);

  return (
    <div className="flex size-full min-h-0 gap-6 overflow-hidden rounded-md border border-default bg-card-background p-4">
      <div className="flex w-64 shrink-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{node.tag}</span>
          <span className="text-lg font-semibold text-base-foreground">{node.name}</span>
          <StatusIndicator {...node.status} className={abnormal ? TONE_TEXT[node.status.tone] : undefined} />
        </div>
        {reading ? (
          <>
            <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} size="xl" tone={node.figure.tone} />
            <RangeIndicator
              label={node.name}
              value={reading.value}
              min={reading.rangeMin}
              max={reading.rangeMax}
              limits={reading.limits}
              unit={reading.unit}
              decimals={reading.decimals}
              tone={node.figure.tone}
              showHeader={false}
            />
          </>
        ) : null}
        <div className="mt-auto flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Last alarms</span>
          {alarms.length === 0 ? <span className="text-sm text-muted-foreground">No alarms in the last 7 days</span> : null}
          {alarms.map((alarm) => (
            <div key={alarm.id} className="flex items-start gap-2">
              <span className="flex h-5 items-center">
                <StatusDot tone={severityStatus(alarm.severity).tone} shape={severityStatus(alarm.severity).shape} size="sm" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm leading-5 text-base-foreground">{alarm.message}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {severityStatus(alarm.severity).label} · {alarm.value} · {formatAgo(alarm.raisedAt)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Trend, last 24 hours</span>
        <SensorTrend node={node} heightClassName="h-96" maxTicks={7} />
      </div>
    </div>
  );
}

function TreemapToneKey() {
  return (
    <ul aria-label="Rectangle states" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-medium-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-3.5 rounded-sm border border-default bg-card-background" />
        Normal
      </li>
      <li className="flex items-center gap-1.5">
        <span className="flex size-3.5 items-center justify-center rounded-sm bg-warning-background text-warning-foreground">
          <IconAlertTriangle aria-hidden="true" className="size-3" />
        </span>
        Needs attention
      </li>
      <li className="flex items-center gap-1.5">
        <span className="flex size-3.5 items-center justify-center rounded-sm bg-critical-background text-critical-foreground">
          <IconAlertOctagon aria-hidden="true" className="size-3" />
        </span>
        Critical
      </li>
    </ul>
  );
}

function TreemapKeys() {
  return (
    <p className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> move
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Enter</Kbd> zoom in
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Esc</Kbd> up
      </span>
    </p>
  );
}

function TreemapJourney({ startId, lens = 'openAlarms' }: { startId?: string; lens?: string }) {
  const [state, dispatch] = useReducer(TREEMAP_REDUCER, TREEMAP_TREE, (tree) => createDrillState(tree, { startId, lens }));
  const current = currentNode(TREEMAP_TREE, state);
  const nodes = pathNodes(TREEMAP_TREE, state);
  const parent = nodes[nodes.length - 2];
  const metric = treemapMetric(state.lens);
  const shown = (state.hoverId ? TREEMAP_TREE.byId.get(state.hoverId) : undefined) ?? current;

  return (
    <div className="flex h-[44rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex items-center gap-2 border-b border-default px-3 py-2">
        {parent ? (
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'up' })}>
            <IconArrowUp /> Up
          </Button>
        ) : null}
        <PathBar nodes={nodes} onSelect={(id) => dispatch({ type: 'jump', id })} className="flex-1" />
        <TreemapKeys />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Size by</span>
          <TreemapMetricSwitch value={state.lens} onChange={(key) => dispatch({ type: 'lens', lens: key })} />
        </div>
        <TreemapToneKey />
      </div>

      <div className="min-h-0 flex-1 bg-muted-background p-2">
        <TreemapCanvas
          tree={TREEMAP_TREE}
          state={state}
          dispatch={dispatch}
          metric={metric}
          label={`Treemap of ${current.name}, sized by ${metric.label.toLowerCase()}. Arrow keys move, Enter zooms in, Escape goes up.`}
          renderLeaf={(node) => <TreemapSensorTile node={node} />}
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring-default"
        />
      </div>

      <footer className="flex items-center gap-6 border-t border-default px-4 py-3">
        <NodeDetailStrip node={shown} metrics={TREEMAP_METRICS} activeMetric={metric.key} className="flex-1" />
      </footer>
    </div>
  );
}

function TreemapExplorerJourney() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <TreemapJourney />
    </ThemeScope>
  );
}

function TreemapExplorerNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <TreemapJourney startId="nk-23" lens="downtimeHours" />
    </ThemeScope>
  );
}

function TreemapExplorerSandstone() {
  return (
    <ThemeScope preset="sandstone" className="w-full">
      <TreemapJourney startId="23-ka-9101" lens="healthDeficit" />
    </ThemeScope>
  );
}

function TreemapExplorerMetricSwitch() {
  const [state, dispatch] = useReducer(TREEMAP_REDUCER, TREEMAP_TREE, (tree) => createDrillState(tree, { startId: 'nk-23', lens: 'downtimeHours' }));
  const metric = treemapMetric(state.lens);

  return (
    <div className="flex w-full flex-col gap-3">
      <TreemapMetricSwitch value={state.lens} onChange={(key) => dispatch({ type: 'lens', lens: key })} />
      <div className="h-72 w-full">
        <TreemapCanvas tree={TREEMAP_TREE} state={state} dispatch={dispatch} metric={metric} label={`Gas compression equipment sized by ${metric.label.toLowerCase()}`} />
      </div>
    </div>
  );
}

function TreemapExplorerTileStates() {
  const tiles = [
    { tone: 'neutral', tag: '23-KA-9102', name: '2nd stage compressor', state: '3 sensors', value: '3' },
    { tone: 'warning', tag: '23-KA-9101', name: '1st stage compressor', state: 'Running, watch', value: '9' },
    { tone: 'critical', tag: '23-KA-9103', name: 'Recompressor', state: 'Tripped', value: '41' },
  ] as const;
  const surface = {
    neutral: 'border-default bg-card-background text-base-foreground',
    warning: 'border-transparent bg-warning-background text-warning-foreground',
    critical: 'border-transparent bg-critical-background text-critical-foreground',
  } as const;

  return (
    <div className="grid w-full grid-cols-3 gap-1">
      {tiles.map((tile) => (
        <div key={tile.tag} className={`flex h-44 flex-col justify-between rounded-md border p-3 ${surface[tile.tone]}`}>
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs opacity-80">{tile.tag}</span>
              {tile.tone === 'critical' ? <IconAlertOctagon aria-hidden="true" className="size-4" /> : null}
              {tile.tone === 'warning' ? <IconAlertTriangle aria-hidden="true" className="size-4" /> : null}
            </span>
            <span className="text-sm font-medium leading-5">{tile.name}</span>
            <span className={tile.tone === 'neutral' ? 'text-xs opacity-70' : 'text-xs font-medium'}>{tile.state}</span>
          </span>
          <span className="flex flex-col">
            <span className="text-xs opacity-70">Downtime</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {tile.value}
              <span className="ml-1 text-sm font-normal opacity-70">h</span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TreemapExplorerSensorTile() {
  const node = TREEMAP_TREE.byId.get('pt-92531') ?? TREEMAP_TREE.root;

  return (
    <div className="h-[30rem] w-full">
      <TreemapSensorTile node={node} />
    </div>
  );
}

function TreemapExplorerStateLegend() {
  return (
    <ul aria-label="Rectangle states" className="flex w-full max-w-xs flex-col gap-3 text-sm">
      <li className="flex items-center gap-3">
        <span className="size-8 shrink-0 rounded-md border border-default bg-card-background" />
        <span className="text-base-foreground">Normal: no colour, no icon</span>
      </li>
      <li className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-warning-background text-warning-foreground">
          <IconAlertTriangle aria-hidden="true" className="size-4" />
        </span>
        <span className="text-base-foreground">Needs attention: watch, maintenance, outside limits</span>
      </li>
      <li className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-critical-background text-critical-foreground">
          <IconAlertOctagon aria-hidden="true" className="size-4" />
        </span>
        <span className="text-base-foreground">Critical: tripped, poor health, beyond trip limit</span>
      </li>
      <li className="text-xs text-muted-foreground">Area shows the chosen metric. A rectangle never shrinks below 6% of the canvas, so zero values stay clickable.</li>
    </ul>
  );
}

function TreemapExplorerDetailStrip() {
  const [id, setId] = useState('23-ka-9103');
  const node = TREEMAP_TREE.byId.get(id) ?? TREEMAP_TREE.root;

  return (
    <div className="flex w-full flex-col gap-4">
      <SegmentedControl value={id} onValueChange={(value) => setId(String(value))}>
        <SegmentedControlList size="small" aria-label="Node">
          <SegmentedControlButton value="nk">Site</SegmentedControlButton>
          <SegmentedControlButton value="nk-23">Area</SegmentedControlButton>
          <SegmentedControlButton value="23-ka-9103">Equipment</SegmentedControlButton>
          <SegmentedControlButton value="pt-92531">Sensor</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <div className="rounded-xl border border-default bg-base-background px-4 py-3">
        <NodeDetailStrip node={node} metrics={TREEMAP_METRICS} activeMetric="downtimeHours" />
      </div>
    </div>
  );
}

function TreemapExplorerPathBar() {
  const [state, dispatch] = useReducer(TREEMAP_REDUCER, TREEMAP_TREE, (tree) => createDrillState(tree, { startId: '23-ka-9103' }));

  return (
    <div className="flex w-full flex-col gap-3">
      <PathBar nodes={pathNodes(TREEMAP_TREE, state)} onSelect={(id) => dispatch({ type: 'jump', id })} />
      <div>
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'jump', id: '23-ka-9103' })}>
          Return to the recompressor
        </Button>
      </div>
    </div>
  );
}

function TreemapExplorerLayout() {
  const machines = TREEMAP_TREE.byId.get('nk-23')?.children ?? [];
  const rects = squarify(
    machines.map((machine) => ({ id: machine.id, value: machine.metrics.maintenanceCost ?? 0 })),
    { x: 0, y: 0, width: 320, height: 200 }
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <svg role="img" aria-label="Squarified layout of five machines by maintenance cost index" viewBox="0 0 320 200" className="w-full">
        {rects.map((rect) => (
          <g key={rect.id}>
            <rect x={rect.x + 1} y={rect.y + 1} width={rect.width - 2} height={rect.height - 2} rx={4} strokeWidth={1} className="fill-card-background stroke-emphasized" />
            <text x={rect.x + 10} y={rect.y + 20} fontSize={11} className="fill-base-foreground font-mono">
              {TREEMAP_TREE.byId.get(rect.id)?.tag}
            </text>
            <text x={rect.x + 10} y={rect.y + 36} fontSize={11} className="fill-muted-foreground tabular-nums">
              {Math.round(rect.share * 100)}% · ratio {aspectRatio(rect).toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted-foreground">Each rectangle shows its share of the area and its aspect ratio; the layout keeps ratios close to 1.</p>
    </div>
  );
}

export default definePage({
  id: 'treemap-explorer',
  title: 'Treemap explorer',
  summary:
    'A treemap you click into. Rectangles are sized by the figure you choose and toned only when something is wrong; each click zooms one rectangle to fill the canvas and shows what is inside, down to a sensor that becomes a full trend.',
  guidance: {
    use: [
      'When the question is "where is most of it?": alarms, downtime, cost or health deficit.',
      'For hierarchies where size matters more than position or order.',
      'When people should be able to change the question without leaving the view.',
      'With a trail above and a detail strip below, so the canvas never has to carry everything.',
    ],
    avoid: [
      'Colour as the sizing metric and the state at once. Size is the metric; tone is the state.',
      'Letting zero values vanish. Give every rectangle a minimum share and print the real value.',
      'Labels that do not fit. Small rectangles drop to tag and value, then to an icon.',
      'More than a few dozen rectangles per level; group them first.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Pick what the rectangles are sized by, then click one to zoom into it. The trail and the Up button take you back; the strip at the bottom follows the rectangle under the pointer. With the treemap focused, arrow keys move, Enter zooms in and Escape goes up.',
      specimens: [
        {
          id: 'TreemapExplorerJourney',
          title: 'Zoomable treemap',
          note: 'Pick it when the first question is where most of the alarms, downtime or cost sits.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/drilldown/TreemapCanvas.tsx',
            'experiences/drilldown/treemapLayout.ts',
            'experiences/drilldown/drillReducer.ts',
            'experiences/drilldown/hierarchy.ts',
            'experiences/drilldown/NodeDetailStrip.tsx',
            'experiences/drilldown/PathBar.tsx',
            'experiences/drilldown/SensorTrend.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: TreemapExplorerJourney,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same treemap in two other presets, opened one and two levels down and sized by other figures.',
      specimens: [
        {
          id: 'TreemapExplorerNordicNight',
          title: 'Nordic night, an area by downtime',
          note: 'Pick it for dark dashboards: tinted status surfaces still stand out from neutral rectangles.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/TreemapCanvas.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TreemapExplorerNordicNight,
        },
        {
          id: 'TreemapExplorerSandstone',
          title: 'Sandstone, a machine by health deficit',
          note: 'Pick it for reports and reviews, where a warm, quiet surface suits longer reading.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/TreemapCanvas.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TreemapExplorerSandstone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own, ready for another sized view.',
      specimens: [
        {
          id: 'TreemapExplorerMetricSwitch',
          title: 'Metric switch',
          note: 'Pick it to let people change the question; rectangles glide to their new sizes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/TreemapCanvas.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: TreemapExplorerMetricSwitch,
        },
        {
          id: 'TreemapExplorerTileStates',
          title: 'Rectangle states',
          note: 'Pick these three treatments: neutral when normal, tinted with an icon and words when not.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TreemapExplorerTileStates,
        },
        {
          id: 'TreemapExplorerSensorTile',
          title: 'Sensor as a full trend',
          note: 'Pick it as the last level: the rectangle becomes the trend with limits and last alarms.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/drilldown/SensorTrend.tsx', 'industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: TreemapExplorerSensorTile,
        },
        {
          id: 'TreemapExplorerStateLegend',
          title: 'Legend',
          note: 'Pick it beside the treemap the first time people meet it.',
          origin: 'custom',
          size: 'sm',
          Component: TreemapExplorerStateLegend,
        },
        {
          id: 'TreemapExplorerDetailStrip',
          title: 'Detail strip',
          note: 'Pick it under any chart to print the figures of the node under the pointer.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['experiences/drilldown/NodeDetailStrip.tsx', 'industrial/Sparkline.tsx'],
          Component: TreemapExplorerDetailStrip,
        },
        {
          id: 'TreemapExplorerLayout',
          title: 'Layout function',
          note: 'Pick the squarified layout when rectangles must stay readable; it keeps them close to square.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/treemapLayout.ts'],
          Component: TreemapExplorerLayout,
        },
        {
          id: 'TreemapExplorerPathBar',
          title: 'Trail',
          note: 'Pick it above the canvas so every level you came through stays one click away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/PathBar.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: TreemapExplorerPathBar,
        },
      ],
    },
  ],
});
