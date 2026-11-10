import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type SiteLink = { id: string; label: string };

export type SitePageProps = {
  /** The product mark at the start of the header. */
  brand: ReactNode;
  /** Top-level destinations. Keep to five or fewer. */
  links?: readonly SiteLink[];
  /** The destination this page belongs to. */
  activeLinkId?: string;
  onNavigate?: (id: string) => void;
  /** End of the header: sign in, one primary action. */
  actions?: ReactNode;
  /** The sections of the page, usually `SiteBand`s. */
  children: ReactNode;
  /** Closing line: copyright, legal links. */
  footer?: ReactNode;
  /** Width cap of the header and footer content. Match the bands on the page. */
  width?: 'md' | 'lg';
  className?: string;
};

const WIDTH: Record<NonNullable<SitePageProps['width']>, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
};

/**
 * The chrome of a public or landing page: a header with the mark, a few destinations and one
 * action that stays in view while the page scrolls, the sections, and a quiet footer. The current
 * destination is marked with `aria-current`; the destinations fold away in a narrow container.
 */
export function SitePage({ brand, links = [], activeLinkId, onNavigate, actions, children, footer, width = 'lg', className }: SitePageProps) {
  return (
    <div data-slot="site-page" className={cn('@container flex min-h-full w-full flex-col bg-base-background', className)}>
      <header data-slot="site-page-header" className="sticky top-0 z-10 shrink-0 border-b border-default bg-base-background">
        <div className={cn('mx-auto flex h-14 w-full items-center gap-6 px-6', WIDTH[width])}>
          <div className="flex min-w-0 shrink-0 items-center">{brand}</div>
          {links.length > 0 ? (
            <nav aria-label="Site" className="hidden min-w-0 items-center gap-1 @2xl:flex">
              {links.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  aria-current={link.id === activeLinkId ? 'page' : undefined}
                  onClick={() => onNavigate?.(link.id)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-sm whitespace-nowrap outline-none transition-colors hover:bg-base-background-hover focus-visible:shadow-focus-ring',
                    link.id === activeLinkId ? 'font-medium text-base-foreground' : 'text-medium-foreground'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          ) : null}
          {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <main data-slot="site-page-main" className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>
      {footer ? (
        <footer data-slot="site-page-footer" className="shrink-0 border-t border-default">
          <div className={cn('mx-auto flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 text-xs text-muted-foreground', WIDTH[width])}>
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
