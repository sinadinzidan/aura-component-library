import type { ReactNode } from 'react';

export type Stat = {
  id: string;
  label: string;
  /** Already formatted: "96.4", "1,284", "4 h 12 min". */
  value: ReactNode;
  unit?: string;
  /** Line under the value: a delta, a target, a sparkline or a status. */
  detail?: ReactNode;
};

type StatRowProps = {
  /** Accessible name for the group, for example "Plant summary, last 24 hours". */
  label: string;
  /** Three to five figures. More than that belongs in a table. */
  stats: readonly Stat[];
  /** `large` for the summary at the top of a page; `default` inside cards. */
  size?: 'default' | 'large';
  /** Thin rules between the figures. Turn off when each figure already sits in its own card. */
  dividers?: boolean;
};

const VALUE_SIZE = { default: 'text-2xl', large: 'text-3xl' } as const;

/**
 * A row of three to five headline figures with equal columns: label on top, number underneath,
 * one optional line of context. Marked up as a description list so each number is read with its
 * label. Figures stay neutral; put judgement in `detail`.
 */
export function StatRow({ label, stats, size = 'default', dividers = true }: StatRowProps) {
  return (
    <dl aria-label={label} className="grid w-full auto-cols-fr grid-flow-col gap-x-6">
      {stats.map((stat, index) => (
        <div
          key={stat.id}
          data-slot="stat"
          className={`flex min-w-0 flex-col gap-1 ${dividers && index > 0 ? 'border-l border-default pl-6' : ''}`}
        >
          <dt className="truncate text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="flex min-w-0 flex-col gap-1">
            <span className={`truncate font-semibold tabular-nums text-base-foreground ${VALUE_SIZE[size]}`}>
              {stat.value}
              {stat.unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span> : null}
            </span>
            {stat.detail ? <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{stat.detail}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
