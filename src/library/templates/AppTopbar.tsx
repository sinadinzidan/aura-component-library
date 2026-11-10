import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import {
  Topbar,
  TopbarBreadcrumbs,
  TopbarCenter,
  TopbarIcon,
  TopbarLeft,
  TopbarMetadata,
  TopbarRight,
} from '@cognite/aura/components/topbar';
import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../display/PersonAvatar';

export type AppTopbarCrumb = {
  id: string;
  label: string;
  /** Makes the crumb a real link. Without it the crumb still calls `onNavigate`. */
  href?: string;
};

type AppTopbarProps = {
  /** The app mark, shown in the small avatar at the start of the bar. */
  icon: ReactNode;
  /** Where the user is, from the app name down. The last crumb is the current page. */
  trail: readonly AppTopbarCrumb[];
  /** Called for every crumb except the current page. */
  onNavigate?: (crumb: AppTopbarCrumb) => void;
  /** Quiet text after the trail: "Saved 2 min ago". */
  metadata?: string;
  /** Global navigation in the middle: a `TabsList` or a `SegmentedControl`. */
  center?: ReactNode;
  /** System controls at the end, as `TopbarAction`s. Not for page actions. */
  actions?: ReactNode;
  /** The signed-in person, shown as an avatar after the actions. */
  userName?: string;
};

/**
 * Aura's Topbar filled from data: app mark and breadcrumb trail on the left, optional global
 * navigation in the middle, system controls and the signed-in person on the right. One bar per
 * screen; page actions belong in the page header underneath.
 */
export function AppTopbar({ icon, trail, onNavigate, metadata, center, actions, userName }: AppTopbarProps) {
  const lastIndex = trail.length - 1;

  return (
    <Topbar>
      <TopbarLeft>
        <TopbarIcon>{icon}</TopbarIcon>
        <TopbarBreadcrumbs>
          <BreadcrumbList>
            {trail.map((crumb, index) => (
              <Fragment key={crumb.id}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {index === lastIndex ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={crumb.href ?? '#'}
                      onClick={(event) => {
                        if (!crumb.href) event.preventDefault();
                        onNavigate?.(crumb);
                      }}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </TopbarBreadcrumbs>
        {metadata ? <TopbarMetadata>{metadata}</TopbarMetadata> : null}
      </TopbarLeft>
      {center ? <TopbarCenter>{center}</TopbarCenter> : null}
      {actions || userName ? (
        <TopbarRight>
          {actions}
          {userName ? <PersonAvatar name={userName} sizes="xxsm" /> : null}
        </TopbarRight>
      ) : null}
    </Topbar>
  );
}
