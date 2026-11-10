import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import {
  IconArrowRight,
  IconBarrierBlock,
  IconBrowserX,
  IconChevronDown,
  IconChevronRight,
  IconClockPause,
  IconDeviceDesktop,
  IconPlus,
  IconHourglassHigh,
  IconLogin2,
  IconPlugConnected,
  IconRefresh,
  IconServerOff,
  IconTrash,
  IconUserQuestion,
  IconWifiOff,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ErrorPage } from '../../../library/patterns/states/ErrorPage';
import { definePage } from '../../types';

import source from './error-pages.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Stands in for the browser viewport: a fixed height with the error centred in it. */
function ErrorPageFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-112 w-full items-center justify-center overflow-hidden">{children}</div>;
}

/** A short list of facts under the message: times, names, what is affected. */
function ErrorPageFacts({ items }: { items: readonly { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-8">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right tabular-nums text-base-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ErrorPageNotFound() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="not-found"
        code="404"
        title="Page not found"
        description="The link may be old, or the page was moved. Check the address, or start from the overview."
        actions={<Button>Go to overview</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageResourceDeleted() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="not-found"
        icon={<IconTrash />}
        title="This dashboard was deleted"
        description="Compressor vibration was deleted by Magnus Solberg on 10 March. A project admin can restore it until 9 April."
        actions={
          <>
            <Button>View all dashboards</Button>
            <Button variant="ghost">Ask an admin to restore it</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageProjectNotFound() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="not-found"
        title="Project not found"
        description='No project is called "nordkap-prod" in this organisation. Check the address for a typo, or pick a project you belong to.'
        details={
          <ErrorPageFacts
            items={[
              { label: 'Organisation', value: 'Nordkapp Energy' },
              { label: 'Your projects', value: 'nordkapp-production, nordkapp-test' },
            ]}
          />
        }
        actions={<Button>Choose a project</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageMoved() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconArrowRight />}
        title="This page has moved"
        description="Alarm rules now live under Monitoring. Bookmarks to the old address stop working on 1 June."
        actions={<Button>Go to alarm rules</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageAccessDenied() {
  const [requested, setRequested] = useState(false);

  return (
    <ErrorPageFrame>
      <ErrorPage
        type="no-access"
        code="403"
        title={requested ? 'Access requested' : 'You need access to this project'}
        description={
          requested
            ? 'Liv Wold has been asked to add you to nordkapp-production. You get an email when she answers.'
            : 'nordkapp-production is limited to the operations group. Its owner, Liv Wold, can add you.'
        }
        actions={
          requested ? (
            <Button variant="ghost" onClick={() => setRequested(false)}>
              Withdraw request
            </Button>
          ) : (
            <Button onClick={() => setRequested(true)}>Request access</Button>
          )
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageSessionExpired() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="no-access"
        icon={<IconLogin2 />}
        title="Your session has ended"
        description="You were signed out after 8 hours. Sign in to continue. The work order you were editing is kept as a draft."
        actions={<Button>Sign in</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageWrongAccount() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="no-access"
        icon={<IconUserQuestion />}
        title="This account is not a member"
        description="You are signed in with an account that does not belong to Nordkapp Energy. Sign in with your work account to continue."
        details={
          <div className="flex items-center gap-3 text-left">
            <PersonAvatar name="Ingrid Haugen" sizes="xsm" />
            <span className="flex flex-col">
              <span className="text-sm text-base-foreground">Ingrid Haugen</span>
              <span className="text-xs text-muted-foreground">ingrid.haugen@personal.test</span>
            </span>
          </div>
        }
        actions={<Button>Switch account</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageAccessPending() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="no-access"
        icon={<IconHourglassHigh />}
        title="Your access request is waiting"
        description="You asked for access to Gas compression on 11 March. Liv Wold has not answered yet."
        actions={
          <>
            <Button>Send a reminder</Button>
            <Button variant="ghost">Go to overview</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageServerError() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        code="500"
        title="Something went wrong on our side"
        description="The page could not be loaded. Nothing you entered is lost. Try again, and contact support with the reference if it keeps happening."
        actions={
          <AsyncButton pendingLabel="Reloading…" onAction={() => wait(1200)}>
            <IconRefresh /> Try again
          </AsyncButton>
        }
        reference="req-7f3a91c2"
      />
    </ErrorPageFrame>
  );
}

function ErrorPageOffline() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        icon={<IconWifiOff />}
        title="You are offline"
        description="This page needs a connection. Check the network on this device. The page reloads on its own when the connection is back."
        actions={
          <AsyncButton pendingLabel="Checking…" onAction={() => wait(1200)}>
            Check connection
          </AsyncButton>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageRateLimited() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        code="429"
        icon={<IconClockPause />}
        title="Too many requests"
        description="This project has reached its request limit for the moment. Requests are accepted again in about 30 seconds."
        actions={
          <>
            <AsyncButton pendingLabel="Trying…" onAction={() => wait(1200)}>
              Try again
            </AsyncButton>
            <Button variant="ghost">View usage limits</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageTimeout() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        code="504"
        icon={<IconHourglassHigh />}
        title="The request took too long"
        description="Loading 6 years of discharge pressure did not finish in 60 seconds. A shorter time range usually loads at once."
        actions={
          <>
            <Button>Load the last 30 days</Button>
            <Button variant="ghost">Try the full range again</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageAppFailedToLoad() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        title="The app could not start"
        description="Part of the application did not download. This is usually a brief network problem. Reload to try again."
        actions={<Button>Reload app</Button>}
        reference="chunk-41-load"
      />
    </ErrorPageFrame>
  );
}

function ErrorPageServiceUnavailable() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        code="503"
        icon={<IconServerOff />}
        title="Time series are unavailable"
        description="The time series service is not responding. Assets, alarms and work orders still work."
        details={
          <ErrorPageFacts
            items={[
              { label: 'Since', value: '13:42 CET' },
              { label: 'Next update', value: '14:30 CET' },
            ]}
          />
        }
        actions={<Button>Go to alarms</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageMaintenance() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconBarrierBlock />}
        title="Down for scheduled maintenance"
        description="The project is being upgraded. Ingestion continues in the background and catches up when the work is done."
        details={
          <ErrorPageFacts
            items={[
              { label: 'Started', value: 'Sat 14 March, 02:00 CET' },
              { label: 'Expected back', value: 'Sat 14 March, 04:00 CET' },
            ]}
          />
        }
        actions={<Button>View status page</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageBrowserNotSupported() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconBrowserX />}
        title="This browser is not supported"
        description="Charts and 3D views need a current version of Chrome, Edge, Firefox or Safari. Update this browser or open the app in another one."
        actions={
          <>
            <Button>View supported browsers</Button>
            <Button variant="ghost">Continue anyway</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageUpdateRequired() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconRefresh />}
        title="A new version is ready"
        description="This tab is running a version from 3 March that can no longer save changes. Reload to get the current one. Drafts are kept."
        actions={<Button>Reload to update</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageScreenTooSmall() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconDeviceDesktop />}
        title="Open this on a larger screen"
        description="The process overview needs at least 1,024 pixels of width. Alarms and work orders work on this device."
        actions={<Button>Go to alarms</Button>}
      />
    </ErrorPageFrame>
  );
}

function ErrorPageEmptyProject() {
  return (
    <ErrorPageFrame>
      <ErrorPage
        type="unknown"
        icon={<IconPlugConnected />}
        title="This project has no data yet"
        description="nordkapp-test was created on 9 March. Connect a data source to bring in assets and time series."
        actions={
          <>
            <Button>Connect a data source</Button>
            <Button variant="ghost">Load sample data</Button>
          </>
        }
      />
    </ErrorPageFrame>
  );
}

function ErrorPageWithDetails() {
  const [open, setOpen] = useState(false);

  return (
    <ErrorPageFrame>
      <ErrorPage
        type="error-generic"
        title="Couldn't open this work order"
        description="The maintenance system returned an error. Try again in a moment."
        details={
          <div className="flex w-full max-w-sm flex-col items-center gap-2">
            <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? <IconChevronDown /> : <IconChevronRight />} Technical details
            </Button>
            {open ? (
              <pre className="w-full overflow-x-auto rounded-lg bg-muted-background p-3 text-left font-mono text-xs text-medium-foreground">
                {'GET /workorders/WO-104482\nStatus 502 from maintenance-gateway\n2026-03-12 14:00:07 CET'}
              </pre>
            ) : null}
          </div>
        }
        actions={<Button>Try again</Button>}
        reference="req-2c81d04e"
      />
    </ErrorPageFrame>
  );
}

function ErrorPageInShell() {
  return (
    <div className="flex h-112 w-full flex-col overflow-hidden rounded-xl border border-default">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-default px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-medium text-base-foreground">Nordkapp</span>
          <IconChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Dashboards</span>
          <IconChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">Unknown</span>
        </div>
        <PersonAvatar name="Ingrid Haugen" sizes="xsm" />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Example navigation" className="hidden w-44 shrink-0 flex-col gap-1 border-r border-default p-2 sm:flex">
          {['Overview', 'Dashboards', 'Alarms', 'Work orders'].map((item) => (
            <span
              key={item}
              className={`rounded-lg px-2 py-1.5 text-sm ${item === 'Dashboards' ? 'bg-accent-background font-medium text-base-foreground' : 'text-medium-foreground'}`}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          <ErrorPage
            type="not-found"
            title="Dashboard not found"
            description="It may have been deleted, or the link is incomplete. Your other dashboards are one click away."
            actions={<Button>View all dashboards</Button>}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorPageCompact() {
  return (
    <EmptyState type="not-found">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">Chart not found</EmptyStateTitle>
      <EmptyStateDescription>It was removed from this dashboard, or the link is incomplete.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          <IconPlus /> Add a chart
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

export default definePage({
  id: 'error-pages',
  title: 'Error pages',
  summary:
    'What fills the page when the page itself cannot be shown: not found, no access, a server or network failure, planned downtime. Each says what happened in plain words, what is still safe, and offers one clear way forward.',
  guidance: {
    use: [
      'A title that states what happened, and a description that says why and what to do.',
      'One primary action that leads somewhere that works; a quiet second one at most.',
      'A reference the user can copy for support, instead of a stack trace.',
      'The app shell around the error when navigation still works.',
    ],
    avoid: [
      'Blame, jokes, exclamation marks or "Oops".',
      'A bare status code as the headline; it is a detail, not the message.',
      'A dead end with no action, or Try again for something a retry cannot fix.',
      'A full error page when only one region of the page failed.',
    ],
  },
  source,
  sections: [
    {
      id: 'missing',
      title: 'Not found and gone',
      description: 'The address does not lead to anything. Say which kind of nothing, and where the nearest something is.',
      specimens: [
        {
          id: 'ErrorPageNotFound',
          title: 'Not found',
          note: 'An address that matches nothing: say so without guessing why, and offer the overview.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageNotFound,
        },
        {
          id: 'ErrorPageResourceDeleted',
          title: 'Resource deleted',
          note: 'The thing existed and is gone: say who removed it and when, and whether it can come back.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageResourceDeleted,
        },
        {
          id: 'ErrorPageProjectNotFound',
          title: 'Project not found',
          note: 'The project in the address does not exist for this organisation: show which ones do.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageProjectNotFound,
        },
        {
          id: 'ErrorPageMoved',
          title: 'Page moved',
          note: 'An old bookmark to a page that now lives elsewhere: send people to the new place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageMoved,
        },
      ],
    },
    {
      id: 'access',
      title: 'Access and session',
      description: 'The page exists, but not for this person right now. Say who can change that, or how to sign in again.',
      specimens: [
        {
          id: 'ErrorPageAccessDenied',
          title: 'Access denied',
          note: 'A signed-in user without permission: name the owner and confirm the request in place. Click to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageAccessDenied,
        },
        {
          id: 'ErrorPageSessionExpired',
          title: 'Session expired',
          note: 'The session timed out: say that work in progress is safe and offer to sign in.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageSessionExpired,
        },
        {
          id: 'ErrorPageWrongAccount',
          title: 'Wrong account',
          note: 'Signed in, but with an account from outside the organisation: show which account and offer to switch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx', 'display/PersonAvatar.tsx'],
          Component: ErrorPageWrongAccount,
        },
        {
          id: 'ErrorPageAccessPending',
          title: 'Access request pending',
          note: 'A request was already sent: say when and to whom, and offer a reminder instead of a second request.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageAccessPending,
        },
      ],
    },
    {
      id: 'failures',
      title: 'Server and network',
      description: 'Something failed between the browser and the service. Say whose side it is on and whether trying again helps.',
      specimens: [
        {
          id: 'ErrorPageServerError',
          title: 'Server error',
          note: 'An unexpected failure on the server: reassure, offer a retry and give a reference to copy.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx', 'actions/AsyncButton.tsx'],
          Component: ErrorPageServerError,
        },
        {
          id: 'ErrorPageOffline',
          title: 'Offline',
          note: 'The device has no connection and the page has nothing cached: say what to check.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx', 'actions/AsyncButton.tsx'],
          Component: ErrorPageOffline,
        },
        {
          id: 'ErrorPageRateLimited',
          title: 'Rate limited',
          note: 'Too many requests for now: say when it works again and where the limits are explained.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx', 'actions/AsyncButton.tsx'],
          Component: ErrorPageRateLimited,
        },
        {
          id: 'ErrorPageTimeout',
          title: 'Timed out',
          note: 'The request was too heavy: lead with the lighter request that will work, not with the same retry.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageTimeout,
        },
        {
          id: 'ErrorPageAppFailedToLoad',
          title: 'App failed to load',
          note: 'The application itself did not start: a reload is the only action that helps.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageAppFailedToLoad,
        },
        {
          id: 'ErrorPageServiceUnavailable',
          title: 'One service unavailable',
          note: 'A known outage in one service: say what still works and when the next update comes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageServiceUnavailable,
        },
      ],
    },
    {
      id: 'planned',
      title: 'Planned and environment',
      description: 'Nothing is broken: the product is being worked on, or this browser or screen cannot show it.',
      specimens: [
        {
          id: 'ErrorPageMaintenance',
          title: 'Maintenance window',
          note: 'Planned downtime: give start and expected end in local time and say what keeps running.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageMaintenance,
        },
        {
          id: 'ErrorPageBrowserNotSupported',
          title: 'Browser not supported',
          note: 'The browser lacks something the app needs: name what works, and let people continue at their own risk.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageBrowserNotSupported,
        },
        {
          id: 'ErrorPageUpdateRequired',
          title: 'Update required',
          note: 'An old tab that can no longer talk to the server: say that drafts are kept and reload.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageUpdateRequired,
        },
        {
          id: 'ErrorPageScreenTooSmall',
          title: 'Screen too small',
          note: 'A view that cannot work on a small screen: say what it needs and what does work here.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageScreenTooSmall,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'Empty, detailed and in the shell',
      description: 'The same block with more around it: a project with nothing in it, details for support, and the app shell kept in place.',
      specimens: [
        {
          id: 'ErrorPageEmptyProject',
          title: 'Empty project',
          note: 'Not an error: a new project with no data. Lead with the step that brings data in.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageEmptyProject,
        },
        {
          id: 'ErrorPageWithDetails',
          title: 'With technical details',
          note: 'Support will ask what happened: keep the details one click away, below a plain message.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx'],
          Component: ErrorPageWithDetails,
        },
        {
          id: 'ErrorPageInShell',
          title: 'Inside the app shell',
          note: 'Navigation still works: keep the shell and replace only the content, so people can move on.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/states/ErrorPage.tsx', 'display/PersonAvatar.tsx'],
          Component: ErrorPageInShell,
        },
        {
          id: 'ErrorPageCompact',
          title: 'Compact, for a panel',
          note: 'The same message where a page-sized block does not fit: a panel, a card or a dialog.',
          origin: 'custom',
          Component: ErrorPageCompact,
        },
      ],
    },
  ],
});
