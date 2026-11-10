import { cn } from '../../../lib/utils';

import { countByRiskLevel, riskLevel } from './risk';
import type { RiskItem, RiskLevel } from './risk';

export type { RiskItem, RiskLevel } from './risk';

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
                  <th scope="row" className="w-16 pr-2 text-right text-xs leading-tight font-normal text-muted-foreground">
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
                        className={cn('rounded-xs p-0 text-center text-xs', showLabels ? 'h-14' : 'h-10', LEVEL_SURFACE[level])}
                      >
                        <span className="sr-only">{LEVEL_NAME[level]} risk: </span>
                        {showLabels ? (
                          <span className="line-clamp-3 leading-tight tracking-tight wrap-break-word">{inCell.map((item) => item.label).join(', ')}</span>
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
                <td className="w-16" />
                {consequences.map((consequence) => (
                  <th key={consequence} scope="col" className="truncate pt-1 text-center text-xs font-normal text-muted-foreground">
                    {consequence}
                  </th>
                ))}
              </tr>
            </tfoot>
          </table>
          <span aria-hidden="true" className="pl-16 text-center text-xs text-muted-foreground">
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
