import { Kbd } from '@cognite/aura/components/kbd';
import { useReducer } from 'react';

import {
  createDrillReducer,
  createDrillState,
  currentNode,
  pathNodes,
} from '../../../library/experiences/drilldown/drillReducer';
import { LEVEL_LABEL, buildHierarchy, childSummary, descendantsAt, isAbnormal } from '../../../library/experiences/drilldown/hierarchy';
import type { DrillNode } from '../../../library/experiences/drilldown/hierarchy';
import { LevelLegend } from '../../../library/experiences/drilldown/LevelLegend';
import { NodeList } from '../../../library/experiences/drilldown/NodeList';
import { NodePreview } from '../../../library/experiences/drilldown/NodePreview';
import { PathBar } from '../../../library/experiences/drilldown/PathBar';
import { SunburstChart } from '../../../library/experiences/drilldown/SunburstChart';
import { FULL_CIRCLE, arcCentroid, arcPath, partition, shapeArcs } from '../../../library/experiences/drilldown/sunburstLayout';
import { SvgStatusMark } from '../../../library/experiences/drilldown/SvgStatusMark';
import { TONE_TEXT } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './sunburst-hierarchy.tsx?raw';

/** Measurement points on the machines the shared plant leaves bare, in the same tag style. */
const SUNBURST_EXTRA_SENSORS: readonly Sensor[] = [
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

const SUNBURST_SENSORS: readonly Sensor[] = [...SENSORS, ...SUNBURST_EXTRA_SENSORS];

/** The last 24 hours of a sensor, ending on its current value. A dead or idle signal has no trend. */
function sunburstSeries(sensor: Sensor): SeriesPoint[] {
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

const SUNBURST_TREE = buildHierarchy({
  assets: ASSETS,
  sensors: SUNBURST_SENSORS,
  alarms: ALARMS,
  series: Object.fromEntries(SUNBURST_SENSORS.map((sensor) => [sensor.id, sunburstSeries(sensor)])),
});


const SUNBURST_REDUCER = createDrillReducer(SUNBURST_TREE);

const SUNBURST_LIST_HEADING: Record<DrillNode['level'], string> = {
  site: 'Areas',
  area: 'Equipment',
  equipment: 'Measurement points',
  sensor: '',
};

/** Centre first, then one entry per ring below the node the chart is rooted on. */
function sunburstLegend(node: DrillNode) {
  const items = [{ label: LEVEL_LABEL[node.level], detail: node.name }];
  if (node.level === 'site') items.push({ label: 'Areas', detail: String(node.children.length) });
  if (node.level === 'site' || node.level === 'area') items.push({ label: 'Equipment', detail: String(descendantsAt(node, 'equipment').length) });
  if (node.level !== 'sensor') items.push({ label: 'Sensors', detail: String(descendantsAt(node, 'sensor').length) });
  return items;
}

function SunburstKeys() {
  return (
    <p className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> move
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Enter</Kbd> re-root
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Esc</Kbd> up
      </span>
    </p>
  );
}

function SunburstStateKey() {
  return (
    <ul aria-label="Segment states" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-medium-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-[color-mix(in_oklab,var(--primary-background)_26%,var(--card-background))]" />
        Normal
      </li>
      <li className="flex items-center gap-1.5">
        <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5 rounded-sm bg-warning-background">
          <SvgStatusMark x={7} y={7} size={8} tone="warning" shape="square" />
        </svg>
        Needs attention
      </li>
      <li className="flex items-center gap-1.5">
        <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5 rounded-sm bg-critical-background">
          <SvgStatusMark x={7} y={7} size={9} tone="critical" shape="diamond" />
        </svg>
        Critical
      </li>
    </ul>
  );
}

function SunburstJourney({ startId }: { startId?: string }) {
  const [state, dispatch] = useReducer(SUNBURST_REDUCER, SUNBURST_TREE, (tree) => createDrillState(tree, { startId }));
  const current = currentNode(SUNBURST_TREE, state);
  const nodes = pathNodes(SUNBURST_TREE, state);
  const abnormal = isAbnormal(current.status.tone);

  return (
    <div className="flex h-[44rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex items-center gap-4 border-b border-default px-3 py-2">
        <PathBar nodes={nodes} onSelect={(id) => dispatch({ type: 'jump', id })} className="flex-1" />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_oklab,var(--primary-background)_16%,transparent),transparent_62%)] p-4">
          <div className="min-h-0 flex-1">
            <SunburstChart
              tree={SUNBURST_TREE}
              state={state}
              dispatch={dispatch}
              label={`Sunburst of ${current.name}. Arrow keys move between segments, Enter re-roots, Escape goes up.`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <LevelLegend items={sunburstLegend(current)} />
            <SunburstStateKey />
          </div>
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-default">
          {current.level === 'sensor' ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <NodePreview node={current} formatAge={formatAgo} maxAlarms={2} />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 border-b border-default p-4">
                <span className="text-xs text-muted-foreground">
                  {LEVEL_LABEL[current.level]} · <span className="font-mono">{current.tag}</span>
                </span>
                <span className="text-lg font-semibold text-base-foreground">{current.name}</span>
                <div className="flex items-center justify-between gap-3">
                  <StatusIndicator {...current.status} className={abnormal ? TONE_TEXT[current.status.tone] : undefined} />
                  <ValueReadout value={current.figure.value} unit={current.figure.unit} decimals={current.figure.decimals} size="sm" tone={current.figure.tone} />
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                <span className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                  {SUNBURST_LIST_HEADING[current.level]} · {current.children.length}
                </span>
                <NodeList
                  nodes={current.children}
                  label={`${SUNBURST_LIST_HEADING[current.level]} in ${current.name}`}
                  activeId={state.hoverId ?? null}
                  onSelect={(id) => dispatch({ type: 'drill', id })}
                  onPreview={(id) => dispatch({ type: 'hover', id })}
                  emptyText="No measurement points on this machine"
                  className="px-0"
                />
              </div>
            </>
          )}
          <div className="border-t border-default px-4 py-2.5">
            <SunburstKeys />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SunburstHierarchyJourney() {
  return (
    <ThemeScope preset="neon-dusk" className="w-full">
      <SunburstJourney />
    </ThemeScope>
  );
}

function SunburstHierarchyHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <SunburstJourney startId="nk-23" />
    </ThemeScope>
  );
}

function SunburstHierarchyAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <SunburstJourney startId="23-ka-9101" />
    </ThemeScope>
  );
}

function SunburstHierarchyAreaChart() {
  const [state, dispatch] = useReducer(SUNBURST_REDUCER, SUNBURST_TREE, (tree) => createDrillState(tree, { startId: 'nk-23' }));

  return (
    <div className="h-[26rem] w-full">
      <SunburstChart tree={SUNBURST_TREE} state={state} dispatch={dispatch} label="Sunburst of Gas compression: equipment and sensors" />
    </div>
  );
}

function SunburstHierarchySensorGauge() {
  const [state, dispatch] = useReducer(SUNBURST_REDUCER, SUNBURST_TREE, (tree) => createDrillState(tree, { startId: 'vt-92540' }));

  return (
    <div className="h-[26rem] w-full">
      <SunburstChart tree={SUNBURST_TREE} state={state} dispatch={dispatch} label="Drive-end vibration on its range, with limits" />
    </div>
  );
}

function SunburstHierarchyChildList() {
  const [state, dispatch] = useReducer(SUNBURST_REDUCER, SUNBURST_TREE, (tree) => createDrillState(tree, { startId: 'nk-23' }));
  const current = currentNode(SUNBURST_TREE, state);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <PathBar nodes={pathNodes(SUNBURST_TREE, state)} onSelect={(id) => dispatch({ type: 'jump', id })} />
      <NodeList
        nodes={current.children}
        label={`Children of ${current.name}`}
        activeId={state.hoverId ?? null}
        onSelect={(id) => dispatch({ type: 'drill', id })}
        onPreview={(id) => dispatch({ type: 'hover', id })}
        emptyText={`${current.name} is a measurement: nothing below it. Use the trail to go back up.`}
      />
    </div>
  );
}

function SunburstHierarchyLayout() {
  const area = SUNBURST_TREE.byId.get('nk-23') ?? SUNBURST_TREE.root;
  const shapes = shapeArcs(
    partition(area, { id: (node: DrillNode) => node.id, children: (node: DrillNode) => node.children }),
    { inner: 34, outer: 118, gap: 2 }
  );

  return (
    <div className="flex w-full items-center gap-6">
      <svg role="img" aria-label="Partition of Gas compression: five machines, each as wide as its number of sensors" viewBox="0 0 240 240" className="w-56 shrink-0">
        {shapes.map((shape) => {
          const centre = arcCentroid(120, 120, shape);
          return (
            <g key={shape.id}>
              <path d={arcPath(120, 120, shape.r0, shape.r1, shape.start, shape.end)} strokeWidth={1.5} className="fill-card-background stroke-emphasized" />
              {shape.depth === 1 ? (
                <text x={centre.x} y={centre.y + 4} fontSize={10} textAnchor="middle" className="fill-base-foreground tabular-nums">
                  {Math.round(((shape.end - shape.start) / FULL_CIRCLE) * 360)}°
                </text>
              ) : null}
            </g>
          );
        })}
        <circle cx={120} cy={120} r={30} strokeWidth={1.5} className="fill-muted-background stroke-emphasized" />
      </svg>
      <ul className="flex flex-col gap-1.5 text-xs text-medium-foreground">
        {area.children.map((machine) => (
          <li key={machine.id} className="flex items-baseline gap-2">
            <span className="font-mono text-base-foreground">{machine.tag}</span>
            <span className="tabular-nums">{childSummary(machine)}</span>
          </li>
        ))}
        <li className="pt-1 text-muted-foreground">Every sensor gets the same angle, so a machine is as wide as what hangs under it.</li>
      </ul>
    </div>
  );
}

function SunburstHierarchyRingLegend() {
  return <LevelLegend items={sunburstLegend(SUNBURST_TREE.root)} orientation="vertical" />;
}

function SunburstHierarchyArcStates() {
  const arcs = [
    { tone: 'neutral', shape: 'dot', label: 'Normal: accent tint, lighter per ring', fill: 'fill-[color-mix(in_oklab,var(--primary-background)_26%,var(--card-background))]' },
    { tone: 'warning', shape: 'square', label: 'Needs attention: tint and a square', fill: 'fill-warning-background' },
    { tone: 'critical', shape: 'diamond', label: 'Critical: tint and a diamond', fill: 'fill-critical-background' },
  ] as const;

  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      {arcs.map((arc, index) => {
        const shape = { start: -0.42, end: 0.42, r0: 44, r1: 80 };
        const centre = arcCentroid(40, 92, shape);
        return (
          <li key={arc.label} className="flex items-center gap-3 text-sm text-base-foreground">
            <svg aria-hidden="true" viewBox="0 0 80 52" className="w-20 shrink-0">
              <path d={arcPath(40, 92, shape.r0, shape.r1, shape.start, shape.end)} strokeWidth={1.5} className={`${arc.fill} stroke-base-background`} />
              {index > 0 ? <SvgStatusMark x={centre.x} y={centre.y} size={10} tone={arc.tone} shape={arc.shape} /> : null}
            </svg>
            {arc.label}
          </li>
        );
      })}
    </ul>
  );
}

function SunburstHierarchyKeyboard() {
  return (
    <dl className="grid w-full max-w-xs grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      <dt className="flex gap-1">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </dt>
      <dd className="text-medium-foreground">Step around the first ring; the path lights up</dd>
      <dt className="flex gap-1">
        <Kbd>Enter</Kbd>
      </dt>
      <dd className="text-medium-foreground">Re-root the chart on the highlighted segment</dd>
      <dt className="flex gap-1">
        <Kbd>Esc</Kbd>
      </dt>
      <dd className="text-medium-foreground">Go up one level, same as the centre disc</dd>
      <dt className="flex gap-1">
        <Kbd>Tab</Kbd>
      </dt>
      <dd className="text-medium-foreground">Move to the list, where every row is a button</dd>
    </dl>
  );
}

export default definePage({
  id: 'sunburst-hierarchy',
  title: 'Sunburst hierarchy',
  summary:
    'The plant as rings. The node you are on sits in the centre, each level below it is a ring, and clicking a segment re-roots the chart on it. The centre always says where you are and takes you back up; a list beside the chart carries the same journey in rows.',
  guidance: {
    use: [
      'To show the shape of a hierarchy at a glance: how much hangs under what, and where the trouble is.',
      'When two or three levels should be visible at once without opening anything.',
      'Always with a list of the same nodes, so nobody has to read a ring to act.',
      'On dark, large displays, where the rings can be big enough to label.',
    ],
    avoid: [
      'Reading exact values off arcs. Angles show structure; figures belong in the centre and the list.',
      'More than three rings or more than a few dozen outer segments.',
      'Tint alone for state: abnormal segments also carry a square or a diamond.',
      'Labels squeezed into every segment. Print one only where it fits along its arc; the list has the rest.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Hover a segment to light up its path from the centre, click it to re-root the chart there. Click the centre disc, or press Escape, to go up. The list on the right selects the same nodes; at a sensor the rings become a gauge and the panel shows trend and alarms.',
      specimens: [
        {
          id: 'SunburstHierarchyJourney',
          title: 'Re-rooting sunburst',
          note: 'Pick it when the structure itself is the message and people explore from the whole towards a part.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/drilldown/SunburstChart.tsx',
            'experiences/drilldown/sunburstLayout.ts',
            'experiences/drilldown/drillReducer.ts',
            'experiences/drilldown/hierarchy.ts',
            'experiences/drilldown/NodeList.tsx',
            'experiences/drilldown/LevelLegend.tsx',
            'experiences/drilldown/PathBar.tsx',
            'experiences/drilldown/NodePreview.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: SunburstHierarchyJourney,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same chart in two other presets, rooted on an area and on a machine. Ring tints follow the accent of the theme.',
      specimens: [
        {
          id: 'SunburstHierarchyHologram',
          title: 'Hologram, rooted on an area',
          note: 'Pick it for wall displays that want a softer, teal-on-black look.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/SunburstChart.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: SunburstHierarchyHologram,
        },
        {
          id: 'SunburstHierarchyAura',
          title: 'Aura, rooted on a machine',
          note: 'Pick it inside a regular application page; the rings calm down to neutral greys.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/SunburstChart.tsx', 'experiences/drilldown/drillReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: SunburstHierarchyAura,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own, ready for another radial view.',
      specimens: [
        {
          id: 'SunburstHierarchyAreaChart',
          title: 'Chart on its own',
          note: 'Pick it as a compact overview of one area: equipment in the first ring, sensors in the second.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/SunburstChart.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: SunburstHierarchyAreaChart,
        },
        {
          id: 'SunburstHierarchySensorGauge',
          title: 'Sensor gauge',
          note: 'Pick it for the last level: the value on its range with the operating band and limits marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/SunburstChart.tsx', 'experiences/drilldown/drillReducer.ts'],
          Component: SunburstHierarchySensorGauge,
        },
        {
          id: 'SunburstHierarchyChildList',
          title: 'Child list',
          note: 'Pick it beside any chart of a hierarchy, so the journey also works as plain rows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/NodeList.tsx', 'experiences/drilldown/NodeRow.tsx', 'experiences/drilldown/PathBar.tsx'],
          Component: SunburstHierarchyChildList,
        },
        {
          id: 'SunburstHierarchyLayout',
          title: 'Partition layout',
          note: 'Pick equal angles per leaf when the chart should show structure rather than a quantity.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/sunburstLayout.ts'],
          Component: SunburstHierarchyLayout,
        },
        {
          id: 'SunburstHierarchyRingLegend',
          title: 'Ring legend',
          note: 'Pick it under the chart to say which level each ring holds and how many nodes it has.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/LevelLegend.tsx'],
          Component: SunburstHierarchyRingLegend,
        },
        {
          id: 'SunburstHierarchyArcStates',
          title: 'Segment states',
          note: 'Pick these three treatments so a state never depends on tint alone.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/SvgStatusMark.tsx', 'experiences/drilldown/sunburstLayout.ts'],
          Component: SunburstHierarchyArcStates,
        },
        {
          id: 'SunburstHierarchyKeyboard',
          title: 'Keyboard map',
          note: 'Pick it for a help popover, so the chart is usable without a pointer.',
          origin: 'custom',
          size: 'sm',
          Component: SunburstHierarchyKeyboard,
        },
      ],
    },
  ],
});
