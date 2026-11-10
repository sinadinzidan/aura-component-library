import { chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { IconChevronDown, IconDownload, IconX } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { Histogram } from '../../../library/industrial/charts/Histogram';
import { ParetoChart } from '../../../library/industrial/charts/ParetoChart';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { TONE_MARK_BG, TONE_SURFACE, formatDelta, formatValue, healthStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ASSETS } from '../../data/plant';
import type { Asset, Health } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './asset-performance.tsx?raw';

/** Twelve months of reliability records per main unit: failures, unplanned downtime, cost index and health change. */
const PERF_RECORDS: Record<string, { failures: number; downtime: number; cost: number; change: number; seed: number }> = {
  '23-ka-9103': { failures: 6, downtime: 212, cost: 100, change: -31, seed: 71 },
  '40-pa-4001': { failures: 4, downtime: 96, cost: 37, change: -18, seed: 72 },
  '23-ka-9101': { failures: 3, downtime: 64, cost: 58, change: -14, seed: 73 },
  '23-ha-9114': { failures: 2, downtime: 48, cost: 31, change: -12, seed: 74 },
  '23-gt-9001': { failures: 2, downtime: 38, cost: 44, change: -4, seed: 75 },
  '23-ka-9102': { failures: 1, downtime: 22, cost: 26, change: -3, seed: 76 },
  '27-pa-2001a': { failures: 1, downtime: 12, cost: 9, change: -1, seed: 77 },
  '27-pa-2001b': { failures: 1, downtime: 8, cost: 6, change: -2, seed: 78 },
  '20-xv-1105': { failures: 1, downtime: 6, cost: 5, change: 1, seed: 79 },
  '20-va-1002': { failures: 0, downtime: 0, cost: 1, change: -1, seed: 80 },
  '20-va-1001': { failures: 0, downtime: 0, cost: 2, change: 0, seed: 81 },
};

type PerfRow = {
  asset: Asset;
  failures: number;
  downtime: number;
  cost: number;
  change: number;
  /** Health score per month, oldest first, ending on today's score. */
  trend: number[];
};

const PERF_ROWS: readonly PerfRow[] = ASSETS.flatMap((asset) => {
  const record = PERF_RECORDS[asset.id];
  if (!record) return [];
  const trend = makeValues({ seed: record.seed, points: 12, base: asset.healthScore - record.change, drift: record.change, noise: 1.2, max: 100, decimals: 0 });
  return [{ asset, ...record, trend: [...trend.slice(0, -1), asset.healthScore] }];
});

const PERF_MAX_DOWNTIME = Math.max(...PERF_ROWS.map((row) => row.downtime));

type PerfSortKey = 'failures' | 'downtime' | 'cost' | 'change';

const PERF_SORTS: readonly { key: PerfSortKey; label: string }[] = [
  { key: 'failures', label: 'Failures' },
  { key: 'downtime', label: 'Downtime' },
  { key: 'cost', label: 'Cost' },
  { key: 'change', label: 'Health' },
];

/** Worst first: most failures, downtime and cost, or the largest fall in health. */
function perfSort(rows: readonly PerfRow[], key: PerfSortKey): PerfRow[] {
  return [...rows].sort((a, b) => (key === 'change' ? a.change - b.change : b[key] - a[key]) || b.downtime - a.downtime);
}

type PerfCell = { criticality: Asset['criticality']; health: Health };

const PERF_CRITICALITIES = ['A', 'B', 'C'] as const;
const PERF_CONDITIONS = ['good', 'watch', 'poor'] as const;

const PERF_RISK: Record<string, { label: string; tone: Tone }> = {
  'A-poor': { label: 'High', tone: 'critical' },
  'A-watch': { label: 'Medium', tone: 'warning' },
  'B-poor': { label: 'Medium', tone: 'warning' },
};

const perfRisk = (cell: PerfCell): { label: string; tone: Tone } => PERF_RISK[`${cell.criticality}-${cell.health}`] ?? { label: 'Low', tone: 'neutral' };

const perfInCell = (row: PerfRow, cell: PerfCell | null): boolean =>
  cell === null || (row.asset.criticality === cell.criticality && row.asset.health === cell.health);

const perfCellName = (cell: PerfCell): string => `Criticality ${cell.criticality}, ${healthStatus(cell.health).label.toLowerCase()} condition`;

const PERF_FIGURES = [
  { id: 'availability', label: 'Availability', value: 96.4, unit: '%', decimals: 1, reference: 97.5, goodDirection: 'up', caption: 'vs target' },
  { id: 'mtbf', label: 'MTBF', value: 412, unit: 'h', decimals: 0, reference: 396, goodDirection: 'up', caption: 'vs last year' },
  { id: 'mttr', label: 'MTTR', value: 6.8, unit: 'h', decimals: 1, reference: 7.4, goodDirection: 'down', caption: 'vs last year' },
  { id: 'downtime', label: 'Unplanned downtime', value: 506, unit: 'h', decimals: 0, reference: 448, goodDirection: 'down', caption: 'vs last year' },
] as const;

const PERF_CAUSES = [
  { label: 'Bearing failure', value: 148 },
  { label: 'Instrument fault', value: 96 },
  { label: 'Seal leak', value: 82 },
  { label: 'Fouling', value: 64 },
  { label: 'Control system', value: 48 },
  { label: 'Electrical', value: 38 },
  { label: 'Other', value: 30 },
];

const PERF_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const PERF_AVAILABILITY = [97.8, 97.6, 98.1, 97.9, 97.2, 97.7, 98.0, 97.4, 97.1, 96.9, 97.1, 96.4].map((availability, index) => ({
  month: PERF_MONTHS[index] ?? '',
  availability,
}));

const PERF_AVAILABILITY_SERIES = [{ key: 'availability', label: 'Availability', type: 'line', color: chartSeriesColor(1) }] as const;

const PERF_AVAILABILITY_TARGET = [{ value: 97.5, label: 'Target 97.5', tone: 'neutral', align: 'right' }] as const;

const PERF_CLASSES = [
  { id: 'compressor', name: 'Compressors', units: 3, availability: 93.8, mtbf: 286, failures: 10 },
  { id: 'pump', name: 'Pumps', units: 3, availability: 96.9, mtbf: 402, failures: 6 },
  { id: 'exchanger', name: 'Heat exchangers', units: 1, availability: 97.4, mtbf: 520, failures: 2 },
  { id: 'turbine', name: 'Turbines', units: 1, availability: 98.1, mtbf: 640, failures: 2 },
  { id: 'static', name: 'Separators and valves', units: 3, availability: 99.6, mtbf: 2180, failures: 1 },
];

const PERF_HEALTH_SEGMENTS = [
  { id: 'good', label: 'Good', value: 7, tone: 'neutral' },
  { id: 'watch', label: 'Watch', value: 3, tone: 'warning' },
  { id: 'poor', label: 'Poor', value: 1, tone: 'critical' },
] as const;

const PERF_HEALTH_BINS = [40, 50, 60, 70, 80, 90].map((from) => ({
  from,
  to: from + 10,
  count: PERF_ROWS.filter((row) => row.asset.healthScore >= from && row.asset.healthScore < from + 10).length,
}));

const PERF_HEALTH_LIMITS = [
  { value: 60, label: 'Poor below 60', tone: 'critical' },
  { value: 80, label: 'Watch below 80', tone: 'warning' },
] as const;

type PerfTableProps = {
  sortKey: PerfSortKey;
  onSort: (key: PerfSortKey) => void;
  cell: PerfCell | null;
  onClearCell: () => void;
};

/** The spine of the dashboard: every unit ranked, with a sort on each measure and the matrix as filter. */
function PerfBadActorsPanel({ sortKey, onSort, cell, onClearCell }: PerfTableProps) {
  const matching = perfSort(
    PERF_ROWS.filter((row) => perfInCell(row, cell)),
    sortKey
  );
  const rows = matching.slice(0, 8);

  return (
    <DashboardPanel
      title="Bad actors"
      description="Main units over the last 12 months, worst first. Select a column to rank by it."
      footnote={`Showing ${rows.length} of ${matching.length} units. Cost is an index where the most expensive unit is 100.`}
    >
      <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-muted-foreground">Filter</span>
        {cell ? (
          <>
            <span className="font-medium text-base-foreground">{perfCellName(cell)}</span>
            <Button variant="ghost" size="sm" onClick={onClearCell}>
              <IconX /> Clear filter
            </Button>
          </>
        ) : (
          <span className="text-medium-foreground">All units. Select a cell in the risk matrix to narrow the list.</span>
        )}
      </div>
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Unit
            </th>
            <th scope="col" className="w-10 pb-2 pr-3 font-medium">
              Crit.
            </th>
            {PERF_SORTS.map((sort) => (
              <th
                key={sort.key}
                scope="col"
                aria-sort={sortKey === sort.key ? 'descending' : 'none'}
                className={`pb-2 font-medium ${sort.key === 'change' ? 'w-36' : sort.key === 'downtime' ? 'w-28 pr-3' : 'w-20 pr-3'}`}
              >
                <button
                  type="button"
                  onClick={() => onSort(sort.key)}
                  className={`flex w-full cursor-pointer items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-ring-default ${sort.key === 'change' ? 'justify-start' : 'justify-end'} ${sortKey === sort.key ? 'font-semibold text-base-foreground' : ''}`}
                >
                  {sort.label}
                  <IconChevronDown aria-hidden="true" className={`size-3 shrink-0 ${sortKey === sort.key ? '' : 'opacity-30'}`} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.asset.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{row.asset.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.asset.tag}</p>
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{row.asset.criticality}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{row.failures}</td>
              <td className="py-2 pr-3">
                <p className="text-right tabular-nums text-base-foreground">{formatValue(row.downtime)} h</p>
                <span aria-hidden="true" className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-chart-neutral-100">
                  <span className={`block h-full rounded-full ${TONE_MARK_BG.neutral}`} style={{ width: `${(row.downtime / PERF_MAX_DOWNTIME) * 100}%` }} />
                </span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{row.cost}</td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <Sparkline
                    values={row.trend}
                    label={`${row.asset.name} health score, last 12 months`}
                    height={24}
                    domain={[30, 100]}
                    tone={row.asset.health === 'poor' ? 'critical' : row.asset.health === 'watch' ? 'warning' : 'neutral'}
                    className="w-14 shrink-0"
                  />
                  <span className="w-6 text-right tabular-nums text-base-foreground">{row.asset.healthScore}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{formatDelta(row.change)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="text-sm text-medium-foreground">No units in this cell.</p> : null}
    </DashboardPanel>
  );
}

type PerfMatrixProps = { cell: PerfCell | null; onSelectCell: (cell: PerfCell | null) => void };

/** Criticality against condition, with the number of units in each cell. A cell filters the table. */
function PerfMatrixPanel({ cell, onSelectCell }: PerfMatrixProps) {
  return (
    <DashboardPanel
      title="Risk matrix"
      description="Units by criticality and condition. Select a cell to filter."
      footnote="One unit is high risk: the recompressor, criticality A in poor condition."
    >
      <table className="w-full table-fixed border-separate border-spacing-1 text-sm" aria-label="Units by criticality and condition">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-10 font-medium">
              <span className="sr-only">Criticality</span>
            </th>
            {PERF_CONDITIONS.map((condition) => (
              <th key={condition} scope="col" className="pb-1 text-center font-medium">
                {healthStatus(condition).label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERF_CRITICALITIES.map((criticality) => (
            <tr key={criticality}>
              <th scope="row" className="text-left text-xs font-medium text-muted-foreground">
                {criticality}
              </th>
              {PERF_CONDITIONS.map((health) => {
                const candidate = { criticality, health };
                const count = PERF_ROWS.filter((row) => perfInCell(row, candidate)).length;
                const risk = perfRisk(candidate);
                const selected = cell?.criticality === criticality && cell.health === health;
                const body = (
                  <>
                    <span className="text-xl font-semibold tabular-nums">{count}</span>
                    <span className="text-xs">{risk.label}</span>
                  </>
                );
                return (
                  <td key={health} className="p-0">
                    {count === 0 ? (
                      <div className="flex h-16 flex-col items-center justify-center rounded-md bg-muted-background text-muted-foreground">{body}</div>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${perfCellName(candidate)}: ${count} ${count === 1 ? 'unit' : 'units'}, ${risk.label.toLowerCase()} risk`}
                        onClick={() => onSelectCell(selected ? null : candidate)}
                        className={`flex h-16 w-full cursor-pointer flex-col items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring-default ${TONE_SURFACE[risk.tone]} ${selected ? 'outline-2 outline-offset-1 outline-base-foreground' : ''}`}
                      >
                        {body}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function PerfFiguresPanel() {
  return (
    <DashboardPanel title="Fleet reliability" description="Rolling 12 months, 11 main units">
      <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4">
        {PERF_FIGURES.map((figure) => (
          <div key={figure.id} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd>
              <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="md" />
            </dd>
            <TrendDelta
              value={figure.value}
              reference={figure.reference}
              goodDirection={figure.goodDirection}
              caption={figure.caption}
              decimals={figure.decimals}
              size="sm"
            />
          </div>
        ))}
      </dl>
    </DashboardPanel>
  );
}

function PerfParetoPanel() {
  return (
    <DashboardPanel title="Downtime by cause" description="Unplanned hours, last 12 months, with cumulative share">
      <ParetoChart label="Unplanned downtime by cause, last 12 months" rows={PERF_CAUSES} unit="h" valueLabel="Downtime" wrapLabels heightClassName="h-64" className="w-full" />
    </DashboardPanel>
  );
}

function PerfAvailabilityPanel() {
  return (
    <DashboardPanel
      title="Availability"
      description="Fleet, by month, against the 97.5% target"
      footnote="Availability met the target in 6 of 12 months and has been under it since December, ending at 96.4%."
    >
      <CategoryChart
        label="Fleet availability by month over the last 12 months, between 96.4 and 98.1 percent, under the 97.5 target since December"
        rows={PERF_AVAILABILITY}
        categoryKey="month"
        series={PERF_AVAILABILITY_SERIES}
        references={PERF_AVAILABILITY_TARGET}
        unit="%"
        decimals={1}
        domain={[95, 99]}
        ticks={[95, 96, 97, 98, 99]}
        heightClassName="h-56"
        className="w-full"
      />
    </DashboardPanel>
  );
}

function PerfClassesPanel() {
  return (
    <DashboardPanel title="Equipment classes" description="Availability, lowest first">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Class
            </th>
            <th scope="col" className="w-14 pb-2 pr-3 text-right font-medium">
              Units
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 text-right font-medium">
              Availability
            </th>
            <th scope="col" className="w-20 pb-2 pr-3 text-right font-medium">
              MTBF
            </th>
            <th scope="col" className="w-20 pb-2 text-right font-medium">
              Failures
            </th>
          </tr>
        </thead>
        <tbody>
          {PERF_CLASSES.map((entry) => (
            <tr key={entry.id} className="border-t border-default align-top">
              <td className="py-2 pr-3 text-base-foreground">{entry.name}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{entry.units}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">
                <span className="inline-flex items-center justify-end gap-1.5">
                  {entry.availability < 95 ? <StatusDot tone="warning" shape="square" size="sm" /> : null}
                  {formatValue(entry.availability, 1)}%
                </span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{formatValue(entry.mtbf)} h</td>
              <td className="py-2 text-right tabular-nums text-medium-foreground">{entry.failures}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function PerfHealthPanel() {
  return (
    <DashboardPanel
      title="Health distribution"
      description="Health score of the 11 units today"
      footnote="Seven units are in good condition; four sit under 80 and one under 60."
    >
      <DistributionBar label="Units by condition" segments={PERF_HEALTH_SEGMENTS} />
      <Histogram
        label="Units by health score: most are above 80, one is below 60"
        bins={PERF_HEALTH_BINS}
        countLabel="units"
        limits={PERF_HEALTH_LIMITS}
        outside={{ low: 60, tone: 'critical' }}
        heightClassName="h-32"
        className="w-full"
      />
    </DashboardPanel>
  );
}

/**
 * Archetype: table-first with a matrix as its filter.
 * Dominant element: the ranked bad-actors table with inline bars and sparklines.
 * Interaction: column headers re-rank the table; a risk matrix cell filters it and can be cleared.
 */
function PerfDashboard() {
  const [sortKey, setSortKey] = useState<PerfSortKey>('downtime');
  const [cell, setCell] = useState<PerfCell | null>(null);

  return (
    <DashboardFrame
      title="Asset performance"
      subtitle="Nordkapp · 11 main units · April 2025 to March 2026"
      status={<StatusIndicator tone="warning" shape="square" label="Availability under target" detail="96.4% of 97.5%" />}
      actions={
        <Button variant="outline" size="sm">
          <IconDownload /> Export report
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <DashboardGrid>
          <DashboardCell span={8}>
            <PerfBadActorsPanel sortKey={sortKey} onSort={setSortKey} cell={cell} onClearCell={() => setCell(null)} />
          </DashboardCell>
          <DashboardCell span={4}>
            <div className="flex flex-col gap-4 [&>*]:flex-1">
              <PerfMatrixPanel cell={cell} onSelectCell={setCell} />
              <PerfFiguresPanel />
            </div>
          </DashboardCell>
          <DashboardCell span={7}>
            <PerfParetoPanel />
          </DashboardCell>
          <DashboardCell span={5}>
            <PerfAvailabilityPanel />
          </DashboardCell>
          <DashboardCell span={7}>
            <PerfClassesPanel />
          </DashboardCell>
          <DashboardCell span={5}>
            <PerfHealthPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function AssetPerfDashSignature() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <PerfDashboard />
    </ThemeScope>
  );
}

function AssetPerfDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <PerfDashboard />
    </ThemeScope>
  );
}

function AssetPerfDashBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <PerfDashboard />
    </ThemeScope>
  );
}

function AssetPerfDashControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <PerfDashboard />
    </ThemeScope>
  );
}

function AssetPerfDashBadActors() {
  const [sortKey, setSortKey] = useState<PerfSortKey>('change');
  return <PerfBadActorsPanel sortKey={sortKey} onSort={setSortKey} cell={null} onClearCell={() => undefined} />;
}

function AssetPerfDashMatrix() {
  const [cell, setCell] = useState<PerfCell | null>({ criticality: 'A', health: 'watch' });
  return <PerfMatrixPanel cell={cell} onSelectCell={setCell} />;
}

function AssetPerfDashFigures() {
  return <PerfFiguresPanel />;
}

function AssetPerfDashPareto() {
  return <PerfParetoPanel />;
}

function AssetPerfDashAvailability() {
  return <PerfAvailabilityPanel />;
}

function AssetPerfDashClasses() {
  return <PerfClassesPanel />;
}

function AssetPerfDashHealth() {
  return <PerfHealthPanel />;
}

export default definePage({
  id: 'asset-performance',
  title: 'Asset performance',
  summary:
    'Fleet reliability as a ranked table: which units fail most, cost most and are degrading fastest. A risk matrix filters the table, and a Pareto of causes, the availability trend and the class comparison explain it.',
  guidance: {
    use: [
      'For the monthly reliability review and for choosing where improvement money goes.',
      'When the fleet is small enough to rank in one table and the question is which units, not which plant.',
      'Let the matrix filter the table, so criticality and condition narrow the list in one click.',
      'Rank worst first on every measure, and show the trend beside the score.',
    ],
    avoid: [
      'Tiles for every unit; a table ranks and compares, tiles do not.',
      'A risk matrix that is only a picture; if it shows counts it should lead to the units.',
      'Status colour on every row; only watch and poor units are coloured.',
      'A Pareto without the cumulative line, or with more than eight causes.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Dense data theme. Table-first: the ranked table is the spine, the risk matrix beside it is its filter, and the charts underneath explain the ranking.',
      specimens: [
        {
          id: 'AssetPerfDashSignature',
          title: 'Asset performance',
          note: 'Pick it for a reliability engineer who ranks a fleet and drills into the worst units.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/charts/CategoryChart.tsx',
            'industrial/charts/Histogram.tsx',
            'industrial/charts/ParetoChart.tsx',
            'industrial/operations/DistributionBar.tsx',
            'industrial/Sparkline.tsx',
            'industrial/StatusDot.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/TrendDelta.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: AssetPerfDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'AssetPerfDashAura',
          title: 'Aura',
          note: 'Pick it when the review is read in a product on the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AssetPerfDashAura,
        },
        {
          id: 'AssetPerfDashBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering users: blue accents, tinted panels and sharp corners.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AssetPerfDashBlueprint,
        },
        {
          id: 'AssetPerfDashControlRoom',
          title: 'Control room',
          note: 'Pick it when the ranking is kept on a dark console beside live operations.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AssetPerfDashControlRoom,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'AssetPerfDashBadActors',
          title: 'Ranked table',
          note: 'Pick it to rank units on several measures, with a bar and a trend in the row.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/Sparkline.tsx'],
          Component: AssetPerfDashBadActors,
        },
        {
          id: 'AssetPerfDashMatrix',
          title: 'Risk matrix filter',
          note: 'Pick it when criticality and condition together decide which units to look at.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: AssetPerfDashMatrix,
        },
        {
          id: 'AssetPerfDashPareto',
          title: 'Pareto of causes',
          note: 'Pick it to show the few causes behind most of the lost hours.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/ParetoChart.tsx'],
          Component: AssetPerfDashPareto,
        },
        {
          id: 'AssetPerfDashFigures',
          title: 'Figure block',
          note: 'Pick it for four fleet figures in a side column, each against its reference.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx'],
          Component: AssetPerfDashFigures,
        },
        {
          id: 'AssetPerfDashAvailability',
          title: 'Trend against target',
          note: 'Pick it for a monthly figure where the months under target are the message.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: AssetPerfDashAvailability,
        },
        {
          id: 'AssetPerfDashHealth',
          title: 'Health distribution',
          note: 'Pick it to show how a fleet spreads across condition, in shares and in scores.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/DistributionBar.tsx', 'industrial/charts/Histogram.tsx'],
          Component: AssetPerfDashHealth,
        },
        {
          id: 'AssetPerfDashClasses',
          title: 'Class comparison',
          note: 'Pick it to compare equipment classes on the same few reliability measures.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusDot.tsx'],
          Component: AssetPerfDashClasses,
        },
      ],
    },
  ],
});
