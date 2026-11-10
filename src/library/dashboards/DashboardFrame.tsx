import type { ReactNode } from 'react';

type DashboardFrameProps = {
  /** Dashboard name, for example "Plant overview". */
  title: string;
  /** Scope line under the title: site, system or period. */
  subtitle?: string;
  /** Status chips beside the title: plant state, data freshness. */
  status?: ReactNode;
  /** Controls on the right: time range, refresh, share. */
  actions?: ReactNode;
  /** Optional strip under the header, for filters or tabs. */
  toolbar?: ReactNode;
  children: ReactNode;
};

/**
 * The outer frame every dashboard shares: one header row, an optional toolbar, then the grid.
 * It paints the base surface, so panels (Aura cards) read as the next layer up in any theme.
 */
export function DashboardFrame({ title, subtitle, status, actions, toolbar, children }: DashboardFrameProps) {
  return (
    <section aria-label={title} className="w-full rounded-xl bg-base-background p-6 text-base-foreground">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-2xl font-semibold text-base-foreground">{title}</h3>
            {status}
          </div>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {toolbar ? <div className="mt-4 flex flex-wrap items-center gap-3">{toolbar}</div> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
