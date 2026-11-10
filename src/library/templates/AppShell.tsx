import type { ReactNode } from 'react';

type AppShellProps = {
  /** Left column: a `Sidebar`, an icon rail or a filter rail. */
  sidebar?: ReactNode;
  /** The bar at the top: an Aura `Topbar` or `AppTopbar`. */
  topbar?: ReactNode;
  /** A second band under the top bar that stays put: page tabs or a toolbar. */
  subbar?: ReactNode;
  /** The page. It is the only region that scrolls unless `scroll` is off. */
  children: ReactNode;
  /** Right column: a properties panel, an inspector or a docked assistant. */
  inspector?: ReactNode;
  /** A thin strip along the bottom of the window: connection, clock, counts. */
  statusBar?: ReactNode;
  /** Bottom navigation for small screens. Sits under the content, above nothing. */
  bottomBar?: ReactNode;
  /** `window`: the top bar spans the whole width. `content`: it starts after the sidebar. */
  topbarSpan?: 'window' | 'content';
  /** Surface behind the page. `muted` when the page is built from cards. */
  surface?: 'base' | 'muted';
  /** Turn off when the page manages its own scrolling panes. */
  scroll?: boolean;
  /** Accessible name of the content region. */
  contentLabel?: string;
};

/**
 * The frame of an application screen as named slots: sidebar, top bar, content, inspector and
 * status bar. Chrome stays put and only the content scrolls, so navigation never leaves the
 * screen. It fills its parent, so give the parent a height (the viewport in a real app).
 */
export function AppShell({
  sidebar,
  topbar,
  subbar,
  children,
  inspector,
  statusBar,
  bottomBar,
  topbarSpan = 'content',
  surface = 'base',
  scroll = true,
  contentLabel = 'Content',
}: AppShellProps) {
  const acrossWindow = topbarSpan === 'window';
  const bars = (
    <>
      {topbar ? (
        <div data-slot="app-shell-topbar" className="shrink-0">
          {topbar}
        </div>
      ) : null}
      {subbar ? (
        <div data-slot="app-shell-subbar" className="shrink-0 border-b border-default bg-base-background">
          {subbar}
        </div>
      ) : null}
    </>
  );

  return (
    <div data-slot="app-shell" className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-base-background text-base-foreground">
      {acrossWindow ? bars : null}
      <div className="flex min-h-0 min-w-0 flex-1">
        {sidebar ? (
          <div data-slot="app-shell-sidebar" className="flex min-h-0 shrink-0">
            {sidebar}
          </div>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {acrossWindow ? null : bars}
          <div className="flex min-h-0 min-w-0 flex-1">
            <main
              aria-label={contentLabel}
              data-slot="app-shell-content"
              data-surface={surface}
              className={`@container min-h-0 min-w-0 flex-1 ${scroll ? 'overflow-y-auto' : 'flex flex-col overflow-hidden'} ${
                surface === 'muted' ? 'bg-muted-background' : 'bg-base-background'
              }`}
            >
              {children}
            </main>
            {inspector ? (
              <div data-slot="app-shell-inspector" className="flex min-h-0 shrink-0">
                {inspector}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {bottomBar ? (
        <div data-slot="app-shell-bottom-bar" className="shrink-0">
          {bottomBar}
        </div>
      ) : null}
      {statusBar ? (
        <div data-slot="app-shell-status-bar" className="shrink-0">
          {statusBar}
        </div>
      ) : null}
    </div>
  );
}
