import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Sidebar } from '../patterns/structure/Sidebar';
import { SidebarNav } from '../patterns/structure/SidebarNav';
import type { SidebarNavGroup } from '../patterns/structure/SidebarNav';

import { BrandMark } from './BrandMark';

export type ShellPageProps = {
  /** Product name in the sidebar header. */
  product: string;
  /** Destinations in the sidebar. */
  nav: readonly SidebarNavGroup[];
  /** The page the shell is showing. */
  activeId?: string;
  onNavigate?: (id: string) => void;
  /** Narrow icon rail instead of the full sidebar. */
  collapsed?: boolean;
  /** Where the page sits, outermost first. The last entry is the current page. */
  trail: readonly string[];
  /** End of the top bar: search, help, the user. */
  topbarEnd?: ReactNode;
  /** Bottom of the sidebar: the user, a help link. */
  sidebarFooter?: ReactNode;
  /** A full-width strip between the top bar and the page: offline, read-only, maintenance. */
  banner?: ReactNode;
  /** The page. */
  children: ReactNode;
  /** `center` puts a whole-page state in the middle of the content area. */
  contentAlign?: 'start' | 'center';
  /** Removes the content padding, for pages that draw their own edges. */
  flush?: boolean;
  className?: string;
};

/**
 * A page inside the app shell: sidebar, a top bar with the breadcrumb trail, an optional banner
 * strip and the content area, which is the only part that scrolls. Whole-page states are shown in
 * the content area so the navigation stays usable when a page is loading, empty or broken.
 */
export function ShellPage({
  product,
  nav,
  activeId,
  onNavigate,
  collapsed = false,
  trail,
  topbarEnd,
  sidebarFooter,
  banner,
  children,
  contentAlign = 'start',
  flush = false,
  className,
}: ShellPageProps) {
  return (
    <div data-slot="shell-page" className={cn('flex h-full min-h-0 w-full min-w-0 bg-base-background', className)}>
      <Sidebar
        label="Sidebar"
        collapsed={collapsed}
        header={
          <div className="flex h-8 items-center px-1">
            <BrandMark name={product} size="sm" markOnly={collapsed} />
          </div>
        }
        footer={sidebarFooter}
      >
        <SidebarNav label="Main" groups={nav} activeId={activeId} onSelect={onNavigate} collapsed={collapsed} />
      </Sidebar>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header data-slot="shell-page-topbar" className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-default px-4">
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              {trail.map((crumb, index) => (
                <Fragment key={`${index}-${crumb}`}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {index === trail.length - 1 ? <BreadcrumbPage>{crumb}</BreadcrumbPage> : <span>{crumb}</span>}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          {topbarEnd ? <div className="flex shrink-0 items-center gap-2">{topbarEnd}</div> : null}
        </header>
        {banner ? (
          <div data-slot="shell-page-banner" className="shrink-0">
            {banner}
          </div>
        ) : null}
        <main
          data-slot="shell-page-content"
          data-align={contentAlign}
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto',
            flush ? undefined : 'p-6',
            contentAlign === 'center' ? 'items-center justify-center' : undefined
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
