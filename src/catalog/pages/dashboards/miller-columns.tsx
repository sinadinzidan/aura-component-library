import { Kbd } from '@cognite/aura/components/kbd';
import { useReducer, useState } from 'react';

import { ColumnList } from '../../../library/experiences/drilldown/ColumnList';
import { buildHierarchy } from '../../../library/experiences/drilldown/hierarchy';
import type { DrillNode } from '../../../library/experiences/drilldown/hierarchy';
import { MillerColumns } from '../../../library/experiences/drilldown/MillerColumns';
import {
  createMillerReducer,
  createMillerState,
  matchesFilter,
  millerSelection,
} from '../../../library/experiences/drilldown/millerReducer';
import { NodePreview } from '../../../library/experiences/drilldown/NodePreview';
import { NodeRow } from '../../../library/experiences/drilldown/NodeRow';
import { PathBar } from '../../../library/experiences/drilldown/PathBar';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, SENSORS, SITES } from '../../data/plant';
import type { Asset, Sensor } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './miller-columns.tsx?raw';

/** Measurement points on the machines the shared plant leaves bare, in the same tag style. */
const MILLER_EXTRA_SENSORS: readonly Sensor[] = [
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

const MILLER_SENSORS: readonly Sensor[] = [...SENSORS, ...MILLER_EXTRA_SENSORS];

/** The last 24 hours of a sensor, ending on its current value. A dead or idle signal has no trend. */
function millerSeries(sensor: Sensor): SeriesPoint[] {
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

const MILLER_TREE = buildHierarchy({
  assets: ASSETS,
  sensors: MILLER_SENSORS,
  alarms: ALARMS,
  series: Object.fromEntries(MILLER_SENSORS.map((sensor) => [sensor.id, millerSeries(sensor)])),
});


/** The other sites of the company: listed, but not modelled below site level yet. */
const MILLER_SITE_FACTS: Readonly<Record<string, { tag: string; healthScore: number }>> = {
  'valhall-sor': { tag: 'VS', healthScore: 93 },
  hammerfest: { tag: 'HF', healthScore: 88 },
  stord: { tag: 'ST', healthScore: 95 },
};

const MILLER_OTHER_SITES: readonly Asset[] = SITES.flatMap((site): Asset[] => {
  const facts = MILLER_SITE_FACTS[site.id];
  if (!facts) return [];
  return [{ id: site.id, tag: facts.tag, name: site.name, type: 'site', parentId: null, state: 'running', health: 'good', healthScore: facts.healthScore, criticality: 'A' }];
});

const MILLER_ROOTS: readonly DrillNode[] = [
  MILLER_TREE.root,
  ...MILLER_OTHER_SITES.map((site) => buildHierarchy({ assets: [site], sensors: [] }).root),
];

const MILLER_REDUCER = createMillerReducer(MILLER_ROOTS);

const MILLER_TITLES = { sensor: 'Tag' } as const;

function MillerKeys() {
  return (
    <p className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> row
      </span>
      <span className="flex items-center gap-1">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> column
      </span>
      <span className="flex items-center gap-1">Type to filter</span>
      <span className="flex items-center gap-1">
        <Kbd>Esc</Kbd> back
      </span>
    </p>
  );
}

function MillerBrowser({ start }: { start?: readonly string[] }) {
  const [state, dispatch] = useReducer(MILLER_REDUCER, MILLER_ROOTS, (roots) => createMillerState(roots, start));
  const selection = millerSelection(MILLER_ROOTS, state);
  const deepest = selection[selection.length - 1];

  return (
    <div className="flex h-[44rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-default px-3 py-2">
        <PathBar
          nodes={selection}
          copyable
          onSelect={(id) => dispatch({ type: 'select', column: state.path.indexOf(id), id })}
          className="flex-1"
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <MillerColumns roots={MILLER_ROOTS} state={state} dispatch={dispatch} titles={MILLER_TITLES} label="Asset browser" className="flex-1" />
        <aside aria-label="Preview" className="w-[23rem] shrink-0 overflow-y-auto border-l border-default bg-card-background p-4">
          {deepest ? (
            <NodePreview
              node={deepest}
              formatAge={formatAgo}
              maxAlarms={2}
              onSelect={(id) => dispatch({ type: 'select', column: state.path.length, id })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Pick a site to start</p>
          )}
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-6 border-t border-default px-4 py-2">
        <p className="text-xs text-muted-foreground">Selecting a row fills the column to its right. The preview shows the deepest selection.</p>
        <MillerKeys />
      </footer>
    </div>
  );
}

function MillerColumnsBrowser() {
  return (
    <ThemeScope preset="schematic" className="w-full">
      <MillerBrowser />
    </ThemeScope>
  );
}

function MillerColumnsAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <MillerBrowser start={['nk', 'nk-23', '23-ka-9101', 'vt-92540']} />
    </ThemeScope>
  );
}

function MillerColumnsTerminal() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <MillerBrowser start={['nk', 'nk-23', '23-ka-9103']} />
    </ThemeScope>
  );
}

function MillerColumnsSingleColumn() {
  const machines = MILLER_TREE.byId.get('nk-23')?.children ?? [];
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('23-ka-9101');

  return (
    <div className="h-96 w-full max-w-64 overflow-hidden rounded-xl border border-default bg-base-background">
      <ColumnList
        title="Equipment"
        items={machines.filter((machine) => matchesFilter(machine, filter))}
        total={machines.length}
        selectedId={selectedId}
        active
        filter={filter}
        onFilterChange={setFilter}
        onSelect={setSelectedId}
        className="h-full"
      />
    </div>
  );
}

function MillerColumnsRowStates() {
  const rows = ['23-ka-9102', '27-pa-2001b', '23-ha-9114', '23-ka-9103'].flatMap((id) => MILLER_TREE.byId.get(id) ?? []);

  return (
    <ul className="flex w-full max-w-64 flex-col">
      {rows.map((node) => (
        <li key={node.id} className="border-t border-default px-1 py-2 first:border-t-0">
          <NodeRow node={node} showChevron />
        </li>
      ))}
    </ul>
  );
}

function MillerColumnsKeyboard() {
  return (
    <dl className="grid w-full max-w-xs grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      <dt className="flex gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
      </dt>
      <dd className="text-medium-foreground">Move within the column</dd>
      <dt className="flex gap-1">
        <Kbd>→</Kbd>
        <Kbd>Enter</Kbd>
      </dt>
      <dd className="text-medium-foreground">Into the next column</dd>
      <dt className="flex gap-1">
        <Kbd>←</Kbd>
        <Kbd>Esc</Kbd>
      </dt>
      <dd className="text-medium-foreground">Back one column</dd>
      <dt className="flex gap-1">
        <Kbd>A</Kbd>
        <Kbd>Z</Kbd>
      </dt>
      <dd className="text-medium-foreground">Type to filter the column; Esc clears it first</dd>
    </dl>
  );
}

function MillerColumnsPathBar() {
  const [state, dispatch] = useReducer(MILLER_REDUCER, MILLER_ROOTS, (roots) => createMillerState(roots, ['nk', 'nk-23', '23-ka-9101', 'pt-92531']));
  const selection = millerSelection(MILLER_ROOTS, state);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="rounded-lg border border-default px-2 py-1.5">
        <PathBar nodes={selection} copyable onSelect={(id) => dispatch({ type: 'select', column: state.path.indexOf(id), id })} />
      </div>
      <p className="text-xs text-muted-foreground">
        Copies as <span className="font-mono text-base-foreground">{selection.map((node) => node.tag).join(' / ')}</span>
      </p>
    </div>
  );
}

function MillerColumnsPreviewTag() {
  const node = MILLER_TREE.byId.get('pt-92531') ?? MILLER_TREE.root;

  return (
    <div className="w-full max-w-md">
      <NodePreview node={node} formatAge={formatAgo} />
    </div>
  );
}

function MillerColumnsPreviewEquipment() {
  const node = MILLER_TREE.byId.get('23-ka-9101') ?? MILLER_TREE.root;

  return (
    <div className="w-full max-w-md">
      <NodePreview node={node} formatAge={formatAgo} maxAlarms={2} />
    </div>
  );
}

function MillerColumnsPreviewArea() {
  const node = MILLER_TREE.byId.get('nk-20') ?? MILLER_TREE.root;

  return (
    <div className="w-full max-w-md">
      <NodePreview node={node} formatAge={formatAgo} maxAlarms={2} />
    </div>
  );
}

export default definePage({
  id: 'miller-columns',
  title: 'Column browser',
  summary:
    'Site, area, equipment and tag side by side. Picking a row in one column fills the next, so the whole path stays on screen while you move through it, and a wide preview shows the deepest thing you have picked.',
  guidance: {
    use: [
      'For people who know the tag structure and want to get to a tag fast, mostly from the keyboard.',
      'When seeing the siblings at every level matters as much as the node itself.',
      'With a preview pane that changes with the level: roll-up, health and readings, or a trend.',
      'When the path is something people copy into a work order or a message.',
    ],
    avoid: [
      'More than four or five columns; deeper trees need a tree view or search.',
      'Rows without state. Every row carries a shape, a state in words and one key figure.',
      'Filters that hide the selection silently: show how many rows the filter kept.',
      'Using it when position in the plant is the way people find things; use the plot plan instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Click a row to fill the column on its right, or focus a column and use the arrow keys: up and down within a column, right and left between columns. Type to filter the column you are in; Escape clears the filter, then steps back. The path at the top can be copied.',
      specimens: [
        {
          id: 'MillerColumnsBrowser',
          title: 'Column browser with preview',
          note: 'Pick it for keyboard-first navigation of a tag hierarchy where the full path should stay visible.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/drilldown/MillerColumns.tsx',
            'experiences/drilldown/millerReducer.ts',
            'experiences/drilldown/ColumnList.tsx',
            'experiences/drilldown/NodeRow.tsx',
            'experiences/drilldown/NodePreview.tsx',
            'experiences/drilldown/PathBar.tsx',
            'experiences/drilldown/hierarchy.ts',
            'themes/ThemeScope.tsx',
          ],
          Component: MillerColumnsBrowser,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same browser in two other presets, opened on a tag and on a tripped machine.',
      specimens: [
        {
          id: 'MillerColumnsAura',
          title: 'Aura, opened on a tag',
          note: 'Pick it inside a regular application page; the preview shows value, limits, trend and alarms.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/MillerColumns.tsx', 'experiences/drilldown/millerReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: MillerColumnsAura,
        },
        {
          id: 'MillerColumnsTerminal',
          title: 'Terminal, opened on a machine',
          note: 'Pick it for engineering consoles: monospaced, dense and dark, with the same keys.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/MillerColumns.tsx', 'experiences/drilldown/millerReducer.ts', 'themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: MillerColumnsTerminal,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own, ready for another browser.',
      specimens: [
        {
          id: 'MillerColumnsSingleColumn',
          title: 'One column',
          note: 'Pick it as a filterable picker when only one level is needed.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/ColumnList.tsx', 'experiences/drilldown/millerReducer.ts'],
          Component: MillerColumnsSingleColumn,
        },
        {
          id: 'MillerColumnsRowStates',
          title: 'Row states',
          note: 'Pick this row wherever a node is listed: shape, state in words and one key figure.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/drilldown/NodeRow.tsx'],
          Component: MillerColumnsRowStates,
        },
        {
          id: 'MillerColumnsKeyboard',
          title: 'Keyboard map',
          note: 'Pick it for a help popover; the browser is built to be driven without a pointer.',
          origin: 'custom',
          size: 'sm',
          Component: MillerColumnsKeyboard,
        },
        {
          id: 'MillerColumnsPreviewTag',
          title: 'Preview of a tag',
          note: 'Pick it for the deepest level: big value, limits bar, trend and last alarms.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/NodePreview.tsx', 'experiences/drilldown/SensorTrend.tsx'],
          Component: MillerColumnsPreviewTag,
        },
        {
          id: 'MillerColumnsPreviewEquipment',
          title: 'Preview of equipment',
          note: 'Pick it one level up: health, what is outside limits and the live readings.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/NodePreview.tsx', 'industrial/ProgressRing.tsx'],
          Component: MillerColumnsPreviewEquipment,
        },
        {
          id: 'MillerColumnsPreviewArea',
          title: 'Preview of an area',
          note: 'Pick it for groups: a roll-up of health, alarms and counts, then what is inside.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/NodePreview.tsx'],
          Component: MillerColumnsPreviewArea,
        },
        {
          id: 'MillerColumnsPathBar',
          title: 'Path you can copy',
          note: 'Pick it when the path goes into work orders and messages; it copies as tags.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/PathBar.tsx', 'actions/CopyButton.tsx'],
          Component: MillerColumnsPathBar,
        },
      ],
    },
  ],
});
