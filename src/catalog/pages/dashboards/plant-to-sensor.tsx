import { Button } from '@cognite/aura/components/button';
import { Kbd } from '@cognite/aura/components/kbd';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconArrowUp } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';

import type { SymbolKind } from '../../../library/industrial/diagrams/symbolPaths';
import { formatLimit, formatReading } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import {
  createDrillReducer,
  createDrillState,
  currentNode,
  levelSteps,
  pathNodes,
} from '../../../library/experiences/drilldown/drillReducer';
import { buildHierarchy, descendantsAt, isAbnormal } from '../../../library/experiences/drilldown/hierarchy';
import type { DrillNode } from '../../../library/experiences/drilldown/hierarchy';
import { MiniMap } from '../../../library/experiences/drilldown/MiniMap';
import { NodePreview } from '../../../library/experiences/drilldown/NodePreview';
import { PathBar } from '../../../library/experiences/drilldown/PathBar';
import { layoutPlan, viewportFor } from '../../../library/experiences/drilldown/planLayout';
import { PlotPlan } from '../../../library/experiences/drilldown/PlotPlan';
import { SvgStatusMark } from '../../../library/experiences/drilldown/SvgStatusMark';
import { ZoomRail } from '../../../library/experiences/drilldown/ZoomRail';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-to-sensor.tsx?raw';

/** Measurement points on the machines the shared plant leaves bare, in the same tag style. */
const PLAN_EXTRA_SENSORS: readonly Sensor[] = [
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

const PLAN_SENSORS: readonly Sensor[] = [...SENSORS, ...PLAN_EXTRA_SENSORS];

/** The last 24 hours of a sensor, ending on its current value. A dead or idle signal has no trend. */
function planSeries(sensor: Sensor): SeriesPoint[] {
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

const PLAN_TREE = buildHierarchy({
  assets: ASSETS,
  sensors: PLAN_SENSORS,
  alarms: ALARMS,
  series: Object.fromEntries(PLAN_SENSORS.map((sensor) => [sensor.id, planSeries(sensor)])),
});

const PLAN_LAYOUT = layoutPlan(PLAN_TREE, { height: 700 });

const PLAN_REDUCER = createDrillReducer(PLAN_TREE);

const PLAN_LINKS = [
  { from: 'nk-20', to: 'nk-23' },
  { from: 'nk-23', to: 'nk-40', dashed: true },
  { from: 'nk-27', to: 'nk-40', dashed: true },
  { from: 'nk-20', to: 'nk-27' },
] as const;

const PLAN_SYMBOLS: Readonly<Record<string, SymbolKind>> = {
  compressor: 'compressor',
  pump: 'centrifugal-pump',
  separator: 'horizontal-separator',
  exchanger: 'heat-exchanger',
  valve: 'shutdown-valve',
  turbine: 'gas-turbine',
};

const PLAN_REGIONS = PLAN_TREE.root.children.flatMap((area) => {
  const place = PLAN_LAYOUT.places.get(area.id);
  return place ? [{ id: area.id, label: `${area.tag} ${area.name}`, tone: area.status.tone, ...place.rect }] : [];
});

const PLAN_STATES = [
  { tone: 'neutral', shape: 'dot', label: 'Running or normal' },
  { tone: 'neutral', shape: 'ring', label: 'Standby' },
  { tone: 'warning', shape: 'square', label: 'Needs attention' },
  { tone: 'critical', shape: 'diamond', label: 'Tripped or beyond trip limit' },
] as const;

/** One line for the footer, different at every altitude. */
function planSummary(node: DrillNode): string[] {
  const openAlarms = node.metrics.openAlarms ?? 0;
  const alarms = `${openAlarms} open ${openAlarms === 1 ? 'alarm' : 'alarms'}`;
  if (node.level === 'site') {
    return [`${node.children.length} areas`, `${descendantsAt(node, 'equipment').length} equipment`, `${descendantsAt(node, 'sensor').length} sensors`, alarms];
  }
  if (node.level === 'area') {
    const abnormal = node.children.filter((child) => isAbnormal(child.status.tone)).length;
    return [`${node.children.length} equipment`, `${abnormal} need attention`, alarms];
  }
  if (node.level === 'equipment') {
    const outside = node.children.filter((child) => isAbnormal(child.status.tone)).length;
    return [`${node.children.length} measurement points`, `${outside} outside limits or in alarm`, `Health ${node.healthScore ?? 0} %`];
  }
  const reading = node.reading;
  if (!reading) return [node.status.label];
  return [
    reading.value === null ? 'No value' : formatReading(reading.value, reading.unit, reading.decimals),
    `Operating band ${formatLimit(reading.limits.low ?? reading.rangeMin, reading.decimals)} to ${formatLimit(reading.limits.high ?? reading.rangeMax, reading.decimals)} ${reading.unit}`,
    alarms,
  ];
}

const PLAN_HINT: Record<DrillNode['level'], string> = {
  site: 'Click an area to zoom in',
  area: 'Click a machine to see its measurement points',
  equipment: 'Click a point to open its trend',
  sensor: 'Deepest level: trend, limits and alarms',
};

function PlanSensorCard({ node }: { node: DrillNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-emphasized bg-card-background p-4">
      <NodePreview node={node} formatAge={formatAgo} maxAlarms={2} />
    </div>
  );
}

function PlanStateLegend() {
  return (
    <ul aria-label="States" className="flex flex-col gap-1.5">
      {PLAN_STATES.map((state) => (
        <li key={state.label}>
          <StatusIndicator size="sm" tone={state.tone} shape={state.shape} label={state.label} />
        </li>
      ))}
    </ul>
  );
}

function PlanKeys() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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

function PlanJourney({ startId }: { startId?: string }) {
  const [state, dispatch] = useReducer(PLAN_REDUCER, PLAN_TREE, (tree) => createDrillState(tree, { startId }));
  const current = currentNode(PLAN_TREE, state);
  const nodes = pathNodes(PLAN_TREE, state);
  const parent = nodes[nodes.length - 2];

  return (
    <div className="flex h-[44rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-default px-3 py-2">
        <PathBar nodes={nodes} onSelect={(id) => dispatch({ type: 'jump', id })} className="flex-1" />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-52 shrink-0 flex-col gap-4 border-r border-default p-3">
          <ZoomRail steps={levelSteps(PLAN_TREE, state)} onSelect={(depth) => dispatch({ type: 'depth', depth })} emptyText="Pick one on the plan" className="flex-1" />
          <PlanStateLegend />
        </aside>

        <div className="relative min-w-0 flex-1 bg-muted-background">
          <PlotPlan
            tree={PLAN_TREE}
            layout={PLAN_LAYOUT}
            state={state}
            dispatch={dispatch}
            links={PLAN_LINKS}
            symbols={PLAN_SYMBOLS}
            label="Nordkapp plot plan. Arrow keys move, Enter zooms in, Escape goes up."
            sensorCard={(node) => <PlanSensorCard node={node} />}
          >
            {parent ? (
              <div className="absolute left-3 top-3">
                <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'up' })}>
                  <IconArrowUp /> Up to {parent.name}
                </Button>
              </div>
            ) : null}
            {current.level === 'sensor' ? null : (
              <p className="pointer-events-none absolute right-3 top-3 rounded-md bg-card-background px-2 py-1 text-xs text-muted-foreground">
                {PLAN_HINT[current.level]}
              </p>
            )}
            {parent ? (
              <MiniMap
                world={PLAN_LAYOUT.world}
                regions={PLAN_REGIONS}
                viewport={viewportFor(PLAN_LAYOUT, current)}
                label={`Overview: showing ${current.name}`}
                onSelectRegion={(id) => dispatch({ type: 'jump', id })}
                className="absolute bottom-3 left-3"
              />
            ) : null}
          </PlotPlan>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-default px-4 py-2 text-xs">
        <p className="flex flex-wrap items-center gap-x-2 text-medium-foreground tabular-nums">
          <span className="font-medium text-base-foreground">{current.name}</span>
          {planSummary(current).map((part) => (
            <span key={part}>· {part}</span>
          ))}
        </p>
        <PlanKeys />
      </footer>
    </div>
  );
}

function PlantToSensorJourney() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <PlanJourney />
    </ThemeScope>
  );
}

function PlantToSensorControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <PlanJourney startId="nk-23" />
    </ThemeScope>
  );
}

function PlantToSensorBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <PlanJourney startId="23-ka-9101" />
    </ThemeScope>
  );
}

function PlantToSensorZoomRail() {
  const [state, dispatch] = useReducer(PLAN_REDUCER, PLAN_TREE, (tree) => createDrillState(tree, { startId: '23-ka-9101' }));

  return (
    <ZoomRail
      steps={levelSteps(PLAN_TREE, state)}
      onSelect={(depth) => dispatch({ type: 'depth', depth })}
      emptyText="Pick one on the plan"
      className="h-72 w-full max-w-56"
    />
  );
}

function PlantToSensorMiniMap() {
  const [target, setTarget] = useState('nk-23');
  const node = PLAN_TREE.byId.get(target) ?? PLAN_TREE.root;

  return (
    <div className="flex flex-col items-center gap-4">
      <MiniMap
        world={PLAN_LAYOUT.world}
        regions={PLAN_REGIONS}
        viewport={viewportFor(PLAN_LAYOUT, node)}
        label={`Overview: showing ${node.name}`}
        onSelectRegion={setTarget}
        className="w-56"
      />
      <SegmentedControl value={target} onValueChange={(value) => setTarget(String(value))}>
        <SegmentedControlList size="small" aria-label="Viewport">
          <SegmentedControlButton value="nk">Site</SegmentedControlButton>
          <SegmentedControlButton value="nk-23">Area</SegmentedControlButton>
          <SegmentedControlButton value="23-ka-9101">Machine</SegmentedControlButton>
          <SegmentedControlButton value="tt-92532">Point</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
    </div>
  );
}

function PlantToSensorStatusMarks() {
  return (
    <div className="flex flex-col gap-4">
      <svg role="img" aria-label="Status marks: dot, ring, square and diamond" viewBox="0 0 160 28" className="h-7 w-40">
        {PLAN_STATES.map((state, index) => (
          <g key={state.label}>
            <circle cx={20 + index * 40} cy={14} r={11} strokeWidth={1.5} className="fill-card-background stroke-emphasized" />
            <SvgStatusMark x={20 + index * 40} y={14} size={11} tone={state.tone} shape={state.shape} />
          </g>
        ))}
      </svg>
      <PlanStateLegend />
    </div>
  );
}

function PlantToSensorPathBar() {
  const [state, dispatch] = useReducer(PLAN_REDUCER, PLAN_TREE, (tree) => createDrillState(tree, { startId: 'tt-92532' }));

  return (
    <div className="flex w-full flex-col gap-3">
      <PathBar nodes={pathNodes(PLAN_TREE, state)} onSelect={(id) => dispatch({ type: 'jump', id })} />
      <div>
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'jump', id: 'tt-92532' })}>
          Return to the sensor
        </Button>
      </div>
    </div>
  );
}

function PlantToSensorMachineView() {
  const [state, dispatch] = useReducer(PLAN_REDUCER, PLAN_TREE, (tree) => createDrillState(tree, { startId: '23-ka-9101' }));

  return (
    <div className="h-96 w-full overflow-hidden rounded-xl border border-default bg-muted-background">
      <PlotPlan
        tree={PLAN_TREE}
        layout={PLAN_LAYOUT}
        state={state}
        dispatch={dispatch}
        symbols={PLAN_SYMBOLS}
        label="1st stage compressor with its measurement points"
        sensorCard={(node) => <PlanSensorCard node={node} />}
      />
    </div>
  );
}

function PlantToSensorKeyboard() {
  return (
    <dl className="grid w-full max-w-xs grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      <dt className="flex gap-1">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </dt>
      <dd className="text-medium-foreground">Move between the children of the current level</dd>
      <dt className="flex gap-1">
        <Kbd>Enter</Kbd>
      </dt>
      <dd className="text-medium-foreground">Zoom into the highlighted one</dd>
      <dt className="flex gap-1">
        <Kbd>Esc</Kbd>
      </dt>
      <dd className="text-medium-foreground">Go up one level</dd>
      <dt className="flex gap-1">
        <Kbd>Home</Kbd>
      </dt>
      <dd className="text-medium-foreground">Back to the whole plant</dd>
    </dl>
  );
}

function PlantToSensorSensorCard() {
  const node = PLAN_TREE.byId.get('tt-92532') ?? PLAN_TREE.root;

  return (
    <div className="flex w-full max-w-lg">
      <PlanSensorCard node={node} />
    </div>
  );
}

function PlantToSensorLevelSummary() {
  const stops = ['nk', 'nk-23', '23-ka-9101', 'tt-92532'].flatMap((id) => PLAN_TREE.byId.get(id) ?? []);

  return (
    <ul className="flex w-full flex-col">
      {stops.map((node) => (
        <li key={node.id} className="flex flex-col gap-0.5 border-t border-default py-2.5 first:border-t-0">
          <span className="text-sm font-medium text-base-foreground">{node.name}</span>
          <span className="text-xs text-medium-foreground tabular-nums">{planSummary(node).join(' · ')}</span>
          <span className="text-xs text-muted-foreground">{PLAN_HINT[node.level]}</span>
        </li>
      ))}
    </ul>
  );
}

export default definePage({
  id: 'plant-to-sensor',
  title: 'Plant to sensor',
  summary:
    'One plot plan, four altitudes. The canvas flies from the whole site into an area, a machine and a single measurement point, and shows more the closer it gets: roll-up figures, then equipment and its state, then live values, then a trend with limits and alarms.',
  guidance: {
    use: [
      'When people think of the plant as a place and find things by where they are.',
      'For a journey that must keep its bearings: the rail, the trail and the mini-map all say where you are.',
      'When each level deserves different content, not the same list with fewer rows.',
      'On large screens, where the canvas can stay at least 800 pixels wide.',
    ],
    avoid: [
      'Showing every label at every zoom. Reveal detail only when there is room to read it.',
      'Hiding the way back: keep one-click up, the trail and Escape working at every level.',
      'Colour as the only sign of a state. Marks change shape and carry a label.',
      'Using it for flat lists of tags without a physical layout; use the column browser instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Click an area, then a machine, then a measurement point. The rail on the left jumps between levels, the mini-map shows what is on screen, and Escape or the Up button takes you back. With the plan focused, arrow keys move and Enter zooms in.',
      specimens: [
        {
          id: 'PlantToSensorJourney',
          title: 'Semantic zoom plot plan',
          note: 'Pick it when location is how people find equipment and every level needs its own content.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/drilldown/PlotPlan.tsx',
            'experiences/drilldown/planLayout.ts',
            'experiences/drilldown/drillReducer.ts',
            'experiences/drilldown/hierarchy.ts',
            'experiences/drilldown/ZoomRail.tsx',
            'experiences/drilldown/MiniMap.tsx',
            'experiences/drilldown/PathBar.tsx',
            'experiences/drilldown/NodePreview.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: PlantToSensorJourney,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same plan in two other presets, each opened at a different level. Colours come from tokens, so nothing is redrawn.',
      specimens: [
        {
          id: 'PlantToSensorControlRoom',
          title: 'Control room, at area level',
          note: 'Pick it for dark rooms: equipment symbols and states stay readable on low-glare surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/PlotPlan.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PlantToSensorControlRoom,
        },
        {
          id: 'PlantToSensorBlueprint',
          title: 'Blueprint, at equipment level',
          note: 'Pick it for engineering tools where the plan should read as a drawing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/PlotPlan.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PlantToSensorBlueprint,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own, ready for another zoomable view.',
      specimens: [
        {
          id: 'PlantToSensorZoomRail',
          title: 'Zoom rail',
          note: 'Pick it to show depth as stops on a line, with the way back up and back down one click away.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/ZoomRail.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: PlantToSensorZoomRail,
        },
        {
          id: 'PlantToSensorMiniMap',
          title: 'Mini-map',
          note: 'Pick it whenever a canvas can zoom far enough to lose sight of the whole.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/MiniMap.tsx', 'experiences/drilldown/planLayout.ts'],
          Component: PlantToSensorMiniMap,
        },
        {
          id: 'PlantToSensorStatusMarks',
          title: 'Status marks',
          note: 'Pick them for states inside a drawing: shape repeats what colour says.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/SvgStatusMark.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PlantToSensorStatusMarks,
        },
        {
          id: 'PlantToSensorMachineView',
          title: 'Plan opened on a machine',
          note: 'Pick it to embed the plan in an equipment page, already zoomed to that machine.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/drilldown/PlotPlan.tsx', 'experiences/drilldown/planLayout.ts', 'experiences/drilldown/drillReducer.ts'],
          Component: PlantToSensorMachineView,
        },
        {
          id: 'PlantToSensorKeyboard',
          title: 'Keyboard map',
          note: 'Pick it for a help popover, so the journey is discoverable without a pointer.',
          origin: 'custom',
          size: 'sm',
          Component: PlantToSensorKeyboard,
        },
        {
          id: 'PlantToSensorSensorCard',
          title: 'Sensor card',
          note: 'Pick it as the last stop of any journey: value on its limits, trend and last alarms.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/NodePreview.tsx', 'experiences/drilldown/SensorTrend.tsx'],
          Component: PlantToSensorSensorCard,
        },
        {
          id: 'PlantToSensorPathBar',
          title: 'Trail',
          note: 'Pick it to show the full path with every ancestor one click away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/PathBar.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: PlantToSensorPathBar,
        },
        {
          id: 'PlantToSensorLevelSummary',
          title: 'Summary per level',
          note: 'Pick it to decide what one line says at each altitude before drawing anything.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PlantToSensorLevelSummary,
        },
      ],
    },
  ],
});
