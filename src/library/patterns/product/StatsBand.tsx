import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type StatsBandItem = {
  id: string;
  /** Already formatted: "1.4 M", "38". */
  value: string;
  unit?: string;
  /** What the number counts, in a few words. */
  label: string;
  /** Where the number comes from or what period it covers. */
  detail?: ReactNode;
};

export type StatsBandProps = {
  /** Accessible name for the group: "Nordkapp in numbers". */
  label: string;
  /** Three or four facts. Each needs a source someone could check. */
  stats: readonly StatsBandItem[];
  /** `muted` gives the band its own tinted surface; `plain` sits on the page with rules between facts. */
  surface?: 'plain' | 'muted';
  align?: 'start' | 'center';
  className?: string;
};

/**
 * A band of a few factual numbers for a landing or feature page. Marked up as a description list
 * so every number is read with what it counts. Wraps to two columns in a narrow container.
 */
export function StatsBand({ label, stats, surface = 'plain', align = 'start', className }: StatsBandProps) {
  return (
    <div data-slot="stats-band" className={cn('@container w-full', className)}>
      <dl
        aria-label={label}
        className={cn(
          'grid w-full grid-cols-2 gap-x-8 gap-y-6 @2xl:auto-cols-fr @2xl:grid-flow-col @2xl:grid-cols-none',
          surface === 'muted' ? 'rounded-xl bg-muted-background p-6' : 'border-y border-default py-6',
          align === 'center' ? 'text-center' : undefined
        )}
      >
        {stats.map((stat) => (
          <div key={stat.id} data-slot="stats-band-item" className="flex min-w-0 flex-col-reverse gap-1">
            <dt className="text-sm text-medium-foreground">
              {stat.label}
              {stat.detail ? <span className="block text-xs text-muted-foreground">{stat.detail}</span> : null}
            </dt>
            <dd className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">
              {stat.value}
              {stat.unit ? <span className="ml-1 text-base font-normal text-muted-foreground">{stat.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
