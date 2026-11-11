import { useMemo, useState } from 'react';

import { healthStatus } from '../../../library/industrial/status';
import type { Health } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { pivot } from '../../../library/tools/pivot/pivot';
import type { PivotRecord, PivotSpec } from '../../../library/tools/pivot/pivot';
import { PivotControls } from '../../../library/tools/pivot/PivotControls';
import type { PivotField } from '../../../library/tools/pivot/PivotControls';
import { PivotDrillPanel } from '../../../library/tools/pivot/PivotDrillPanel';
import type { DrillColumn } from '../../../library/tools/pivot/PivotDrillPanel';
import { PivotExplorer } from '../../../library/tools/pivot/PivotExplorer';
import { PivotTable } from '../../../library/tools/pivot/PivotTable';
import type { PivotSelection } from '../../../library/tools/pivot/PivotTable';
import { TreeTable } from '../../../library/tools/pivot/TreeTable';
import type { TreeColumn } from '../../../library/tools/pivot/TreeTable';
import type { TreeNodeInput } from '../../../library/tools/pivot/treeTable';
import { ALARMS, ASSETS, WORK_ORDERS } from '../../data/plant';
import type { Asset } from '../../data/plant';
import { createRandom } from '../../data/series';
import { definePage } from '../../types';

import source from './pivot-and-tree-tables.tsx?raw';

/** Hours of unplanned and planned stoppage per asset in the quarter. */
const DOWNTIME_HOURS: Readonly<Record<string, number>> = {
  '20-va-1001': 3.5,
  '20-va-1002': 0,
  '20-xv-1105': 1.5,
  '23-ka-9101': 11,
  '23-ka-9102': 4.5,
  '23-ka-9103': 38,
  '23-ha-9114': 16,
  '23-gt-9001': 6,
  '27-pa-2001a': 2,
  '27-pa-2001b': 0,
  '40-pa-4001': 27.5,
};

const OPEN_STATUSES: readonly string[] = ['open', 'planned', 'in-progress', 'waiting'];

function alarmCount(assetId: string): number {
  return ALARMS.filter((alarm) => alarm.assetId === assetId && alarm.state !== 'cleared').length;
}

function openOrderCount(assetId: string): number {
  return WORK_ORDERS.filter((order) => order.assetId === assetId && OPEN_STATUSES.includes(order.status)).length;
}

function isLeaf(asset: Asset): boolean {
  return !ASSETS.some((other) => other.parentId === asset.id);
}

/** The asset hierarchy as tree rows; only equipment carries figures, branches roll them up. */
function leafValues(asset: Asset): Record<string, number> {
  if (!isLeaf(asset)) return {};
  return { alarms: alarmCount(asset.id), health: asset.healthScore, downtime: DOWNTIME_HOURS[asset.id] ?? 0, orders: openOrderCount(asset.id) };
}

const ASSET_NODES: readonly TreeNodeInput[] = ASSETS.map((asset) => ({
  id: asset.id,
  parentId: asset.parentId,
  label: asset.name,
  code: asset.tag,
  values: leafValues(asset),
}));

const ASSET_ROLLUPS = { alarms: 'sum', health: 'min', downtime: 'sum', orders: 'sum' } as const;

function healthOf(score: number): Health {
  return score >= 80 ? 'good' : score >= 60 ? 'watch' : 'poor';
}

const TREE_COLUMNS: readonly TreeColumn[] = [
  {
    id: 'alarms',
    title: 'Open alarms',
    width: 12,
    render: (value) => (value === null ? '–' : value),
  },
  {
    id: 'health',
    title: 'Health, worst below',
    width: 20,
    render: (value) => {
      if (value === null) return '–';
      const status = healthStatus(healthOf(value));
      return (
        <span className="flex items-center justify-end gap-2">
          <StatusIndicator {...status} size="sm" />
          <span className="w-6 text-right">{value}</span>
        </span>
      );
    },
  },
  {
    id: 'downtime',
    title: 'Downtime h',
    width: 12,
    render: (value) => (value === null ? '–' : value.toFixed(1)),
  },
  {
    id: 'orders',
    title: 'Open orders',
    width: 12,
    render: (value) => (value === null ? '–' : value),
  },
];

const ALARM_ONLY_COLUMNS: readonly TreeColumn[] = [TREE_COLUMNS[0]];
const DOWNTIME_COLUMNS: readonly TreeColumn[] = [TREE_COLUMNS[2], TREE_COLUMNS[3]];

const AREA_NAME: Readonly<Record<string, string>> = { 'nk-20': 'Inlet and separation', 'nk-23': 'Gas compression', 'nk-27': 'Gas export', 'nk-40': 'Cooling water' };
const EQUIPMENT = ASSETS.filter((asset) => isLeaf(asset) && asset.parentId !== null);
const MONTHS = ['Jan', 'Feb', 'Mar'] as const;
const WORK_TYPES = ['Corrective', 'Preventive', 'Inspection', 'Modification'] as const;
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
const CREWS: Readonly<Record<string, string>> = { Corrective: 'Mechanical', Preventive: 'Mechanical', Inspection: 'Instrument', Modification: 'Automation' };

/** 72 work orders over the quarter, with labour and the production downtime each one caused. */
const RECORDS: readonly PivotRecord[] = (() => {
  const random = createRandom(2026);
  return Array.from({ length: 72 }, (_, index) => {
    const asset = EQUIPMENT[Math.floor(random() * EQUIPMENT.length)];
    const typeRoll = random();
    const type = typeRoll < 0.35 ? WORK_TYPES[0] : typeRoll < 0.8 ? WORK_TYPES[1] : typeRoll < 0.95 ? WORK_TYPES[2] : WORK_TYPES[3];
    const priority = type === 'Corrective' ? (random() < 0.4 ? PRIORITIES[0] : PRIORITIES[1]) : PRIORITIES[2 + Math.floor(random() * 2)];
    const hours = Math.round((type === 'Preventive' ? 2 + random() * 10 : 3 + random() * 20) * 2) / 2;
    const downtime = type === 'Corrective' ? Math.round(random() * 18 * 2) / 2 : type === 'Modification' ? Math.round(random() * 6 * 2) / 2 : 0;
    return {
      id: `WO-${104100 + index * 3 + Math.floor(random() * 3)}`,
      asset: asset.tag,
      area: AREA_NAME[asset.parentId ?? ''] ?? 'Plant',
      equipment: asset.type.charAt(0).toUpperCase() + asset.type.slice(1),
      type,
      priority,
      crew: CREWS[type],
      month: MONTHS[Math.floor(random() * MONTHS.length)],
      hours,
      downtime,
    };
  });
})();

const DIMENSIONS: readonly PivotField[] = [
  { id: 'area', label: 'Area' },
  { id: 'equipment', label: 'Equipment type' },
  { id: 'type', label: 'Work type' },
  { id: 'priority', label: 'Priority' },
  { id: 'crew', label: 'Crew' },
  { id: 'month', label: 'Month' },
];

const MEASURES: readonly PivotField[] = [
  { id: 'downtime', label: 'Downtime' },
  { id: 'hours', label: 'Labour hours' },
];

const ORDER: PivotSpec['order'] = { month: [...MONTHS], type: [...WORK_TYPES], priority: [...PRIORITIES] };

const MEASURE_FORMAT = { downtime: { decimals: 1, unit: 'h' }, hours: { decimals: 1, unit: 'h' } } as const;

const DRILL_COLUMNS: readonly DrillColumn[] = [
  { field: 'id', title: 'Work order', mono: true },
  { field: 'asset', title: 'Asset', mono: true },
  { field: 'type', title: 'Type' },
  { field: 'hours', title: 'Labour h', align: 'end', format: (value) => (typeof value === 'number' ? value.toFixed(1) : '') },
  { field: 'downtime', title: 'Downtime h', align: 'end', format: (value) => (typeof value === 'number' ? value.toFixed(1) : '') },
];

const formatHours = (value: number | null): string => (value === null ? '' : `${value.toFixed(1)}\u00a0h`);
const formatCount = (value: number | null): string => (value === null ? '' : String(value));

type PivotTreeStaticProps = {
  spec: PivotSpec;
  label: string;
  measureLabel: string;
  rowFieldLabels: readonly string[];
  columnFieldLabel?: string;
  format?: (value: number | null) => string;
  heat?: boolean;
  density?: 'default' | 'compact';
  records?: readonly PivotRecord[];
  startCollapsed?: readonly string[];
  loading?: boolean;
  onDrill?: (selection: PivotSelection) => void;
  selection?: PivotSelection | null;
};

/** A pivot table that keeps its own collapsed groups, for the specimens that show one table. */
function PivotTreeStatic({ spec, label, measureLabel, rowFieldLabels, columnFieldLabel, format = formatHours, heat, density, records = RECORDS, startCollapsed = [], loading, onDrill, selection }: PivotTreeStaticProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set(startCollapsed));
  const result = useMemo(() => pivot(records, spec), [records, spec]);
  return (
    <PivotTable
      result={result}
      label={label}
      measureLabel={measureLabel}
      rowFieldLabels={rowFieldLabels}
      columnFieldLabel={columnFieldLabel}
      formatValue={format}
      collapsed={collapsed}
      onToggleGroup={(id) => setCollapsed((current) => (current.has(id) ? new Set([...current].filter((entry) => entry !== id)) : new Set([...current, id])))}
      heat={heat}
      density={density}
      loading={loading}
      onDrill={onDrill}
      selection={selection}
    />
  );
}

const TWO_AREAS: readonly PivotRecord[] = RECORDS.filter((record) => record.area === 'Gas compression' || record.area === 'Gas export');
const PUMPS_AND_COMPRESSORS: readonly PivotRecord[] = RECORDS.filter((record) => record.equipment === 'Compressor' || record.equipment === 'Pump');

const DOWNTIME_SPEC: PivotSpec = { rows: ['area', 'type'], column: 'month', measure: 'downtime', aggregation: 'sum', order: ORDER };

function PivotTreeAssetHierarchy() {
  return <TreeTable label="Alarms, health and downtime by asset" rowHeader="Asset" nodes={ASSET_NODES} rollups={ASSET_ROLLUPS} columns={TREE_COLUMNS} initialDepth={2} className="h-112" />;
}

function PivotTreeWorkOrderPivot() {
  return (
    <PivotExplorer
      label="Work orders"
      records={RECORDS}
      dimensions={DIMENSIONS}
      measures={MEASURES}
      initial={{ rows: ['area', 'type'], column: 'month', measure: 'downtime', aggregation: 'sum' }}
      order={ORDER}
      measureFormat={MEASURE_FORMAT}
      drillColumns={DRILL_COLUMNS}
      className="h-160"
    />
  );
}

function PivotTreeFullyExpanded() {
  return <TreeTable label="Downtime and open orders by asset, fully expanded" rowHeader="Asset" nodes={ASSET_NODES} rollups={ASSET_ROLLUPS} columns={DOWNTIME_COLUMNS} initialDepth={3} density="compact" className="h-96" />;
}

function PivotTreeRootsOnly() {
  return <TreeTable label="Open alarms by asset, roots only" rowHeader="Asset" nodes={ASSET_NODES} rollups={ASSET_ROLLUPS} columns={ALARM_ONLY_COLUMNS} initialDepth={0} />;
}

const ALARM_NODES: readonly TreeNodeInput[] = ASSET_NODES.filter((node) => node.id === 'nk' || node.id === 'nk-23' || node.parentId === 'nk-23');

function PivotTreeSingleBranch() {
  return <TreeTable label="Open alarms in gas compression" rowHeader="Asset" nodes={ALARM_NODES} rollups={ASSET_ROLLUPS} columns={ALARM_ONLY_COLUMNS} initialDepth={2} />;
}

function PivotTreeWorstOfHealth() {
  return (
    <TreeTable
      label="Worst health by area"
      rowHeader="Area"
      nodes={ASSET_NODES}
      rollups={{ health: 'min' }}
      columns={[TREE_COLUMNS[1]]}
      initialDepth={1}
    />
  );
}

function PivotTreeSubtotals() {
  return <PivotTreeStatic records={TWO_AREAS} spec={{ rows: ['area', 'type'], column: null, measure: 'downtime', aggregation: 'sum', order: ORDER }} label="Downtime by area and work type" measureLabel="Downtime" rowFieldLabels={['Area', 'Work type']} />;
}

function PivotTreeMultiLevelHeaders() {
  return <PivotTreeStatic records={TWO_AREAS} spec={DOWNTIME_SPEC} label="Downtime by area, work type and month" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={['Area', 'Work type']} />;
}

function PivotTreeHeatShading() {
  return (
    <PivotTreeStatic
      records={PUMPS_AND_COMPRESSORS}
      spec={{ rows: ['equipment', 'priority'], column: 'month', measure: 'downtime', aggregation: 'sum', order: ORDER }}
      label="Downtime heat map by equipment, priority and month"
      measureLabel="Downtime"
      columnFieldLabel="Month"
      rowFieldLabels={['Equipment', 'Priority']}
      heat
    />
  );
}

function PivotTreeCounts() {
  return (
    <PivotTreeStatic
      spec={{ rows: ['area'], column: 'month', measure: 'hours', aggregation: 'count', order: ORDER }}
      label="Work orders by area and month"
      measureLabel="Work orders"
      columnFieldLabel="Month"
      rowFieldLabels={['Area']}
      format={formatCount}
    />
  );
}

function PivotTreeAverages() {
  return (
    <PivotTreeStatic
      spec={{ rows: ['crew'], column: 'priority', measure: 'hours', aggregation: 'average', order: ORDER }}
      label="Average labour by crew and priority"
      measureLabel="Average labour hours"
      columnFieldLabel="Priority"
      rowFieldLabels={['Crew']}
    />
  );
}

function PivotTreeCollapsedGroups() {
  return <PivotTreeStatic records={TWO_AREAS} spec={DOWNTIME_SPEC} label="Downtime with collapsed groups" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={['Area', 'Work type']} startCollapsed={['Gas compression']} />;
}

function PivotTreeGrandTotalOnly() {
  return <PivotTreeStatic spec={{ rows: [], column: 'month', measure: 'downtime', aggregation: 'sum', order: ORDER }} label="Total downtime by month" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={[]} />;
}

function PivotTreeFieldControls() {
  const [rows, setRows] = useState<readonly string[]>(['area', 'type']);
  const [column, setColumn] = useState<string | null>('month');
  const [measure, setMeasure] = useState('downtime');
  const [aggregation, setAggregation] = useState<'sum' | 'count' | 'average'>('sum');
  const [heat, setHeat] = useState(false);
  return (
    <PivotControls
      dimensions={DIMENSIONS}
      measures={MEASURES}
      rows={rows}
      column={column}
      measure={measure}
      aggregation={aggregation}
      heat={heat}
      onRowChange={(level, field) =>
        setRows((current) => {
          if (field === null) return current.slice(0, level);
          const next = [...current];
          next[level] = field;
          return next;
        })
      }
      onColumnChange={setColumn}
      onMeasureChange={setMeasure}
      onAggregationChange={setAggregation}
      onHeatChange={setHeat}
    />
  );
}

const DRILL_RECORDS = RECORDS.filter((record) => record.area === 'Gas compression' && record.month === 'Feb' && record.type === 'Corrective');

function PivotTreeDrillPanel() {
  return <PivotDrillPanel title="Gas compression, Corrective, Feb" records={DRILL_RECORDS} columns={DRILL_COLUMNS} onClose={() => undefined} />;
}

function PivotTreeDrillThrough() {
  const [selection, setSelection] = useState<PivotSelection | null>({ groupId: 'Gas compression/Corrective', columnKey: 'Feb' });
  const records = useMemo(() => {
    const result = pivot(RECORDS, DOWNTIME_SPEC);
    const group = result.groups.flatMap((area) => [area, ...area.children]).find((candidate) => candidate.id === selection?.groupId);
    const index = result.columns.findIndex((column) => column.key === selection?.columnKey);
    const cell = group && index !== -1 ? group.cells[index] : null;
    return cell ? cell.records.map((position) => RECORDS[position]) : [];
  }, [selection]);
  return (
    <div className="grid w-full min-w-0 gap-4 grid-cols-[minmax(0,1fr)_20rem]">
      <PivotTreeStatic spec={DOWNTIME_SPEC} label="Downtime, drill-through" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={['Area', 'Work type']} onDrill={setSelection} selection={selection} />
      {selection ? <PivotDrillPanel title={`${selection.groupId?.split('/').join(', ') ?? 'All records'}${selection.columnKey ? `, ${selection.columnKey}` : ''}`} records={records} columns={DRILL_COLUMNS} onClose={() => setSelection(null)} /> : null}
    </div>
  );
}

function PivotTreeEmptyPivot() {
  return <PivotTreeStatic spec={DOWNTIME_SPEC} records={[]} label="Downtime, no work orders" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={['Area', 'Work type']} />;
}

function PivotTreeLoadingPivot() {
  return <PivotTreeStatic spec={DOWNTIME_SPEC} label="Downtime, loading" measureLabel="Downtime" columnFieldLabel="Month" rowFieldLabels={['Area', 'Work type']} loading />;
}

function PivotTreeDensePivot() {
  return (
    <PivotTreeStatic
      records={TWO_AREAS}
      spec={{ rows: ['area', 'equipment', 'type'], column: 'month', measure: 'downtime', aggregation: 'sum', order: ORDER }}
      label="Downtime, dense"
      measureLabel="Downtime"
      columnFieldLabel="Month"
      rowFieldLabels={['Area', 'Equipment', 'Work type']}
      density="compact"
      heat
    />
  );
}

function PivotTreeLoadingTree() {
  return <TreeTable label="Assets, loading" rowHeader="Asset" nodes={ASSET_NODES} rollups={ASSET_ROLLUPS} columns={DOWNTIME_COLUMNS} loading />;
}

function PivotTreeEmptyTree() {
  return <TreeTable label="Assets, empty" rowHeader="Asset" nodes={[]} rollups={ASSET_ROLLUPS} columns={DOWNTIME_COLUMNS} empty="No assets under Stord terminal yet" />;
}

export default definePage({
  id: 'pivot-and-tree-tables',
  title: 'Pivot and tree tables',
  summary:
    'Two ways to read grouped data: a tree table that follows the asset hierarchy and rolls figures up every branch, and a pivot table that groups work orders and downtime by the fields you choose, with subtotals, a grand total, heat shading and drill-through to the records.',
  guidance: {
    use: [
      'Tree tables when the rows already have a hierarchy and a parent figure means the total of its children.',
      'Pivots when people need to regroup the same records by different fields to find where a number comes from.',
      'Subtotals computed from the records, so an average of a group is never the average of its averages.',
      'Drill-through on every figure: a total nobody can check is a total nobody trusts.',
    ],
    avoid: [
      'Heat shading on small tables or on totals; it hides the numbers it is meant to help find.',
      'More than two row fields in a pivot; past that, filter first.',
      'Indenting without a chevron and a count: people need to see what a collapsed group contains.',
      'Mixing units in one pivot. One measure, one unit.',
    ],
  },
  source,
  sections: [
    {
      id: 'working',
      title: 'Working tables',
      description: 'Use the keyboard in the tree: arrows move, Right and Left open and close. Change the pivot fields, switch heat on, and select any figure to see its records.',
      specimens: [
        {
          id: 'PivotTreeAssetHierarchy',
          title: 'Asset tree table',
          note: 'Pick it for a hierarchy with figures: each branch totals alarms, downtime and orders and shows the worst health below it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx', 'tools/pivot/treeTable.ts'],
          Component: PivotTreeAssetHierarchy,
        },
        {
          id: 'PivotTreeWorkOrderPivot',
          title: 'Work order pivot',
          note: 'Pick it for exploring one set of records from several angles, with controls above the table and drill-through beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pivot/PivotExplorer.tsx', 'tools/pivot/pivot.ts', 'tools/pivot/explorerReducer.ts', 'tools/pivot/PivotControls.tsx', 'tools/pivot/PivotTable.tsx', 'tools/pivot/PivotDrillPanel.tsx'],
          Component: PivotTreeWorkOrderPivot,
        },
      ],
    },
    {
      id: 'tree-parts',
      title: 'Tree table variations',
      description: 'How much of the hierarchy to show and which figures to carry.',
      specimens: [
        {
          id: 'PivotTreeFullyExpanded',
          title: 'Fully expanded, dense',
          note: 'Open every level in compact rows when the reader is hunting for one leaf among many.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx'],
          Component: PivotTreeFullyExpanded,
        },
        {
          id: 'PivotTreeRootsOnly',
          title: 'Roots only',
          note: 'Start closed so the first view is the whole plant in one line; the figures are already totals.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx'],
          Component: PivotTreeRootsOnly,
        },
        {
          id: 'PivotTreeSingleBranch',
          title: 'One metric, one branch',
          note: 'Scope the tree to one area and one figure when the table sits inside a detail panel.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx'],
          Component: PivotTreeSingleBranch,
        },
        {
          id: 'PivotTreeWorstOfHealth',
          title: 'Worst-of roll-up',
          note: 'Roll a condition up as the worst value below, never an average, so one poor machine is not hidden by good ones.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PivotTreeWorstOfHealth,
        },
      ],
    },
    {
      id: 'pivot-parts',
      title: 'Pivot table parts',
      description: 'Groups, headers, shading and the controls that change them.',
      specimens: [
        {
          id: 'PivotTreeSubtotals',
          title: 'Groups with subtotals',
          note: 'Nest rows by two fields; each parent row is the subtotal of its children and the last row is the grand total.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx', 'tools/pivot/pivot.ts'],
          Component: PivotTreeSubtotals,
        },
        {
          id: 'PivotTreeMultiLevelHeaders',
          title: 'Multi-level headers',
          note: 'Spread a second field across the columns; the top header says what is measured, the second names the columns.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeMultiLevelHeaders,
        },
        {
          id: 'PivotTreeHeatShading',
          title: 'Heat shading',
          note: 'Shade the detail cells in four steps to find where the downtime concentrates; subtotals and totals stay plain.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx', 'industrial/charts/heatLevels.ts'],
          Component: PivotTreeHeatShading,
        },
        {
          id: 'PivotTreeCounts',
          title: 'Counting records',
          note: 'Count instead of sum when the question is how many work orders, not how many hours.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeCounts,
        },
        {
          id: 'PivotTreeAverages',
          title: 'Averages',
          note: 'Average a measure per cell; totals are the average of all records, not of the cells.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeAverages,
        },
        {
          id: 'PivotTreeCollapsedGroups',
          title: 'Collapsed groups',
          note: 'Collapse groups you are not reading; the subtotal and the record count stay on the row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeCollapsedGroups,
        },
        {
          id: 'PivotTreeGrandTotalOnly',
          title: 'No row grouping',
          note: 'With no row field the pivot is one line of totals by column, the starting point before grouping.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeGrandTotalOnly,
        },
        {
          id: 'PivotTreeFieldControls',
          title: 'Field controls',
          note: 'Two row fields, a column field, a measure with its aggregation and a heat switch cover most questions.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pivot/PivotControls.tsx'],
          Component: PivotTreeFieldControls,
        },
        {
          id: 'PivotTreeDrillPanel',
          title: 'Drill-through panel',
          note: 'List the records behind one figure with a count and a way to close it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotDrillPanel.tsx'],
          Component: PivotTreeDrillPanel,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'A selected figure, nothing to show, loading, and a dense pivot.',
      specimens: [
        {
          id: 'PivotTreeDrillThrough',
          title: 'Drill-through open',
          note: 'Selecting a figure opens its records beside the table and marks the figure as selected.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx', 'tools/pivot/PivotDrillPanel.tsx'],
          Component: PivotTreeDrillThrough,
        },
        {
          id: 'PivotTreeEmptyPivot',
          title: 'Empty pivot',
          note: 'Keep the headers and say that there are no records, so a filter that removed everything is obvious.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeEmptyPivot,
        },
        {
          id: 'PivotTreeLoadingPivot',
          title: 'Loading pivot',
          note: 'Show the real headers with placeholder rows while the records load.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeLoadingPivot,
        },
        {
          id: 'PivotTreeLoadingTree',
          title: 'Loading tree',
          note: 'Placeholder rows under the real headers; the expand controls wait until there is something to expand.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx'],
          Component: PivotTreeLoadingTree,
        },
        {
          id: 'PivotTreeEmptyTree',
          title: 'Empty tree',
          note: 'Say which branch is empty and, where it helps, what to do about it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pivot/TreeTable.tsx'],
          Component: PivotTreeEmptyTree,
        },
        {
          id: 'PivotTreeDensePivot',
          title: 'Dense, three levels',
          note: 'Compact rows and three row fields for a review where scanning matters more than comfort.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pivot/PivotTable.tsx'],
          Component: PivotTreeDensePivot,
        },
      ],
    },
  ],
});
