import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type CenteredPageProps = {
  /** Top bar: the product mark on the left, at most one quiet link on the right. */
  header?: ReactNode;
  /** Bottom line: legal links, a status link, the language. */
  footer?: ReactNode;
  /** The one thing the page is about, usually a card. */
  children: ReactNode;
  /** Width cap of the content column. `sm` for a single form, `md` for pickers, `lg` for wizards. */
  width?: 'sm' | 'md' | 'lg';
  /** `center` for a single step; `top` when the content can grow and should not jump. */
  align?: 'center' | 'top';
  /** `muted` puts a card on a grey page; `base` is for content with no surface of its own. */
  surface?: 'base' | 'muted';
  className?: string;
};

const WIDTH: Record<NonNullable<CenteredPageProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/**
 * A page with one centred column and nothing else competing for attention: sign-in, verification,
 * a confirmation, an error. Header and footer stay at the edges; the content sits in the middle of
 * whatever height is left, and the page grows instead of clipping when the content is tall.
 */
export function CenteredPage({ header, footer, children, width = 'sm', align = 'center', surface = 'muted', className }: CenteredPageProps) {
  return (
    <div
      data-slot="centered-page"
      data-surface={surface}
      className={cn(
        'flex min-h-full w-full flex-col',
        surface === 'muted' ? 'bg-muted-background' : 'bg-base-background',
        className
      )}
    >
      {header ? (
        <header data-slot="centered-page-header" className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">
          {header}
        </header>
      ) : null}
      <main
        data-slot="centered-page-main"
        className={cn('flex flex-1 flex-col items-center px-4 py-6', align === 'center' ? 'justify-center' : 'justify-start')}
      >
        <div className={cn('flex w-full flex-col gap-4', WIDTH[width])}>{children}</div>
      </main>
      {footer ? (
        <footer
          data-slot="centered-page-footer"
          className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-3 text-xs text-muted-foreground"
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
