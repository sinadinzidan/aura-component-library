import type { ReactNode } from 'react';

type PageHeaderProps = {
  /** Names the page or the record: "Work orders", "1st stage compressor". */
  title: string;
  /** One or two sentences under the title. Kept to a readable line length. */
  description?: ReactNode;
  /** A breadcrumb trail above the title. Do not combine with a back button in `leading`. */
  breadcrumb?: ReactNode;
  /** Left of the title: a back button, an avatar or a record icon. */
  leading?: ReactNode;
  /** Sits on the title line, usually one status badge. */
  status?: ReactNode;
  /** A quiet row under the title: owner, last updated, identifiers. */
  meta?: ReactNode;
  /** Page actions, right-aligned. One primary action at most. */
  actions?: ReactNode;
  /** A band between the title and the tabs: KPI strip, search and filters. */
  children?: ReactNode;
  /** A tab list or view switch that closes the header. Bring its own bottom rule. */
  tabs?: ReactNode;
  /** `compact` for sticky bars and panels where the header must not take a third of the height. */
  size?: 'default' | 'compact';
  /** Draws a rule under the header. Leave off when `tabs` already draws one. */
  divider?: boolean;
  /** Heading element. A page has one `h1`; use `h2` when the header sits inside another page. */
  as?: 'h1' | 'h2' | 'h3';
};

/**
 * The top of a page: where am I (breadcrumb, title, status), what is it (description, metadata)
 * and what can I do (actions), in that reading order. Every part is a slot, so list pages, record
 * pages and editors share one skeleton and line up when people move between them.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  leading,
  status,
  meta,
  actions,
  children,
  tabs,
  size = 'default',
  divider = false,
  as: Heading = 'h1',
}: PageHeaderProps) {
  const compact = size === 'compact';

  return (
    <header
      data-slot="page-header"
      className={`flex w-full min-w-0 flex-col ${compact ? 'gap-2' : 'gap-4'} ${divider ? 'border-b border-default pb-4' : ''}`}
    >
      {/* Pulls the trail left by the padding of its first link, so its text lines up with the title. */}
      {breadcrumb ? <div className="-ml-1.5">{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className={`flex min-w-0 flex-1 gap-3 ${compact ? 'basis-40 items-center' : 'basis-64 items-start'}`}>
          {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-3">
              <Heading
                className={`min-w-0 truncate font-semibold text-base-foreground ${compact ? 'text-base' : 'text-2xl tracking-tight'}`}
              >
                {title}
              </Heading>
              {status ? <div className="flex shrink-0 items-center gap-2">{status}</div> : null}
            </div>
            {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
            {meta ? <div className={compact ? '' : 'pt-1'}>{meta}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
      {tabs}
    </header>
  );
}
