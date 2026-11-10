import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type SiteBandProps = {
  /** Accessible name of the section, when it has no visible heading of its own. */
  label?: string;
  children: ReactNode;
  /** `muted` tints the full width of the page behind the content; `plain` sits on the page. */
  surface?: 'plain' | 'muted';
  /** Width cap of the content. `md` is a reading column; `lg` holds grids. */
  width?: 'md' | 'lg';
  /** Vertical room. `lg` for the opening band, `md` for sections, `sm` for strips. */
  spacing?: 'sm' | 'md' | 'lg';
  /** Draws a rule above the band. Prefer spacing, or a surface change, to rules. */
  divider?: boolean;
  className?: string;
};

const WIDTH: Record<NonNullable<SiteBandProps['width']>, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
};

const SPACING: Record<NonNullable<SiteBandProps['spacing']>, string> = {
  sm: 'py-6',
  md: 'py-10',
  lg: 'py-16',
};

/**
 * One horizontal section of a landing page: the background spans the page, the content is centred
 * and capped. Stack bands inside a `SitePage` and alternate `plain` and `muted` sparingly, so the
 * change of surface means "new topic" and is not just a stripe.
 */
export function SiteBand({ label, children, surface = 'plain', width = 'lg', spacing = 'md', divider = false, className }: SiteBandProps) {
  return (
    <section
      aria-label={label}
      data-slot="site-band"
      data-surface={surface}
      className={cn('w-full', surface === 'muted' ? 'bg-muted-background' : undefined, divider ? 'border-t border-default' : undefined)}
    >
      <div className={cn('mx-auto flex w-full flex-col gap-6 px-6', WIDTH[width], SPACING[spacing], className)}>{children}</div>
    </section>
  );
}
