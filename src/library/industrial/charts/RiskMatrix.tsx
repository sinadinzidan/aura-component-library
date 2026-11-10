import { cn } from '../../../lib/utils';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskItem = {
  id: string;
  /** What is at risk: an asset, a work order, a finding. */
  label: string;
  /** 1 (least likely) to the number of likelihood steps. */
  likelihood: number;
  /** 1 (least severe) to the number of consequence steps. */
  consequence: number;
};

export type RiskMatrixProps = {
  /** What the matrix covers, with the key finding. Becomes the table's accessible name. */
  label: string;
  items: readonly RiskItem[];
  /** Likelihood step names, least likely first. */
  likelihoods?: readonly string[];
  /** Consequence step names, least severe first. */
  consequences?: readonly string[];
  /** Scores (likelihood × consequence) from which a cell is medium and high. */
  thresholds?: { medium: number; high: number };
  /** Print item labels in the cells instead of counts. For up to about ten items. */
  showLabels?: boolean;
  summary?: string;
  className?: string;
};

const DEFAULT_LIKELIHOODS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'];
const DEFAULT_CONSEQUENCES = ['Minor', 'Moderate', 'Serious', 'Major', 'Severe'];

const LEVEL_SURFACE: Record<RiskLevel, string> = {
  low: 'bg-success-background text-success-foreground',
  medium: 'bg-warning-background text-warning-foreground',
  high: 'bg-critical-background text-critical-foreground',
};

const LEVEL_NAME: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };

/** Risk level of a cell from its score, likelihood × consequence. */
export function riskLevel(likelihood: number, consequence: number, thresholds = { medium: 5, high: 15 }): RiskLevel {
  const score = likelihood * consequence;
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

/** How many items fall on each risk level. */
export function countByRiskLevel(items: readonly RiskItem[], thresholds = { medium: 5, high: 15 }): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const item of items) counts[riskLevel(item.likelihood, item.consequence, thresholds)] += 1;
  return counts;
}

/**
 * Likelihood × consequence matrix. Unlike other heat maps this one is status-coloured on purpose:
 * the cell colour is the risk level, and each cell says how many items sit in it. Consequence runs
 * left to right, likelihood bottom to top, so the worst corner is top right.
 */
export function RiskMatrix({
  label,
  items,
  likelihoods = DEFAULT_LIKELIHOODS,
  consequences = DEFAULT_CONSEQUENCES,
  thresholds = { medium: 5, high: 15 },
  showLabels = false,
  summary,
  className,
}: RiskMatrixProps) {
  const counts = countByRiskLevel(items, thresholds);
  const rowsTopDown = likelihoods.map((name, index) => ({ name, likelihood: index + 1 })).reverse();

  return (
    <figure data-slot="risk-matrix" className={cn('m-0 flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex gap-2">
        <span aria-hidden="true" className="rotate-180 self-center text-xs text-muted-foreground [writing-mode:vertical-rl]">
          Likelihood
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <table aria-label={label} className="w-full table-fixed border-separate border-spacing-0.5">
            <tbody>
              {rowsTopDown.map((row) => (
                <tr key={row.name}>
                  <th scope="row" className="w-24 truncate pr-2 text-right text-xs font-normal text-muted-foreground">
                    {row.name}
                  </th>
                  {consequences.map((consequence, index) => {
                    const level = riskLevel(row.likelihood, index + 1, thresholds);
                    const inCell = items.filter((item) => item.likelihood === row.likelihood && item.consequence === index + 1);
                    return (
                      <td
                        key={consequence}
                        data-slot="risk-cell"
                        data-level={level}
                        title={`${row.name} × ${consequence}: ${LEVEL_NAME[level]} risk, ${inCell.length} ${inCell.length === 1 ? 'item' : 'items'}${inCell.length > 0 ? ` (${inCell.map((item) => item.label).join(', ')})` : ''}`}
                        className={cn('h-10 rounded-xs px-1 text-center text-xs', LEVEL_SURFACE[level])}
                      >
                        <span className="sr-only">{LEVEL_NAME[level]} risk: </span>
                        {showLabels ? (
                          <span className="line-clamp-2 leading-tight">{inCell.map((item) => item.label).join(', ')}</span>
                        ) : inCell.length > 0 ? (
                          <span className="text-sm font-semibold tabular-nums">{inCell.length}</span>
                        ) : (
                          <span className="sr-only">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="w-24" />
                {consequences.map((consequence) => (
                  <th key={consequence} scope="col" className="truncate pt-1 text-center text-xs font-normal text-muted-foreground">
                    {consequence}
                  </th>
                ))}
              </tr>
            </tfoot>
          </table>
          <span aria-hidden="true" className="pl-24 text-center text-xs text-muted-foreground">
            Consequence
          </span>
        </div>
      </div>
      <ul aria-label="Risk levels" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-medium-foreground">
        {(['low', 'medium', 'high'] as const).map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn('size-2.5 rounded-xs', LEVEL_SURFACE[level])} />
            {LEVEL_NAME[level]}
            <span className="text-muted-foreground tabular-nums">{counts[level]}</span>
          </li>
        ))}
      </ul>
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
