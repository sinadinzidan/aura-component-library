import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Search } from '@cognite/aura/components/search';
import {
  IconChartLine,
  IconCircleCheck,
  IconExternalLink,
  IconMessage,
  IconPlugConnected,
  IconPlus,
  IconUpload,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableMessageRow } from '../../../library/primitives/table/TableMessageRow';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ASSETS } from '../../data/plant';
import { definePage } from '../../types';

import source from './empty-state.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

function EmptyStateNewObject() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No dashboards yet</EmptyStateTitle>
      <EmptyStateDescription>Create a dashboard to follow the assets you care about.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus /> Create dashboard
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateNoResults() {
  return (
    <EmptyState type="no-results">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No results for &quot;23-KA-91O1&quot;</EmptyStateTitle>
      <EmptyStateDescription>Check the spelling, or search by asset name.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Clear search
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateNotFound() {
  return (
    <EmptyState type="not-found">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">Work order not found</EmptyStateTitle>
      <EmptyStateDescription>It may have been deleted, or the link is incomplete.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          View all work orders
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateError() {
  return (
    <EmptyState type="error-generic">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">Couldn&apos;t load alarms</EmptyStateTitle>
      <EmptyStateDescription>The alarm service did not answer. Try again.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Try again
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateNoAccess() {
  return (
    <EmptyState type="no-access">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">You don&apos;t have access to this data set</EmptyStateTitle>
      <EmptyStateDescription>Ask an owner for read access to see its time series.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Request access
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateNewChat() {
  return (
    <EmptyState type="new-chat">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">Ask about your plant</EmptyStateTitle>
      <EmptyStateDescription>Try &quot;Which compressors need attention this week?&quot;</EmptyStateDescription>
    </EmptyState>
  );
}

function EmptyStateUnknown() {
  return (
    <EmptyState type="unknown">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">Nothing to show here</EmptyStateTitle>
      <EmptyStateDescription>Select an asset in the tree to see its details.</EmptyStateDescription>
    </EmptyState>
  );
}

function EmptyStateFullFirstUse() {
  return (
    <EmptyState variant="full" type="new-object">
      <EmptyStateIcon />
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">No data sources yet</EmptyStateTitle>
        <EmptyStateDescription>Connect a data source to start exploring your plant.</EmptyStateDescription>
      </div>
      <EmptyStateActions>
        <Button>
          <IconPlugConnected /> Connect data source
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateFullError() {
  return (
    <EmptyState variant="full" type="error-generic">
      <EmptyStateIcon />
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">Couldn&apos;t load this page</EmptyStateTitle>
        <EmptyStateDescription>Something went wrong on our side. Try again in a moment.</EmptyStateDescription>
      </div>
      <EmptyStateActions>
        <Button>Reload page</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateFullNoAccess() {
  const [requested, setRequested] = useState(false);

  return (
    <EmptyState variant="full" type="no-access">
      <EmptyStateIcon />
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">{requested ? 'Access requested' : 'You need access to Gas compression'}</EmptyStateTitle>
        <EmptyStateDescription>
          {requested
            ? 'Liv Wold has been asked. You will get a notification when she answers.'
            : 'This area is limited to the operations group. Ask its owner to add you.'}
        </EmptyStateDescription>
      </div>
      <EmptyStateActions>
        {requested ? (
          <Button variant="ghost" onClick={() => setRequested(false)}>
            Withdraw request
          </Button>
        ) : (
          <Button onClick={() => setRequested(true)}>Request access</Button>
        )}
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateFullNotFound() {
  return (
    <EmptyState variant="full" type="not-found">
      <EmptyStateIcon />
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">Page not found</EmptyStateTitle>
        <EmptyStateDescription>The link may be old, or the dashboard was moved.</EmptyStateDescription>
      </div>
      <EmptyStateActions>
        <Button>Go to home</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateTitleOnly() {
  return (
    <EmptyState>
      <EmptyStateTitle as="h4">No annotations on this chart</EmptyStateTitle>
    </EmptyState>
  );
}

function EmptyStateTextOnly() {
  return (
    <EmptyState>
      <EmptyStateTitle as="h4">No shelved alarms</EmptyStateTitle>
      <EmptyStateDescription>Alarms you shelve appear here until they return.</EmptyStateDescription>
    </EmptyState>
  );
}

function EmptyStateCustomIcon() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconUpload />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No drawings uploaded</EmptyStateTitle>
      <EmptyStateDescription>Upload P&amp;IDs as PDF to link them to assets.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">Upload drawings</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateTwoActions() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No time series in this data set</EmptyStateTitle>
      <EmptyStateDescription>Connect an extractor to bring in live data, or import a file to try it out.</EmptyStateDescription>
      <EmptyStateActions className="flex-row">
        <Button size="sm">Connect extractor</Button>
        <Button variant="ghost" size="sm">
          Import CSV file
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateWithLink() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No transformations yet</EmptyStateTitle>
      <EmptyStateDescription>Transformations shape raw data into your data model on a schedule.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus /> Create transformation
        </Button>
        <Button
          variant="ghost"
          size="sm"
          render={<a href="https://docs.cognite.com/cdf/integration/guides/transformation/transformations" target="_blank" rel="noreferrer" />}
        >
          Read the guide <IconExternalLink />
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function EmptyStateInTable() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filters</span>
        <Badge variant="secondary">Priority: P1</Badge>
        <Badge variant="secondary">Status: Waiting</Badge>
      </div>
      <Table label="Work orders">
        <TableHeader>
          <TableRow>
            <TableHead>Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableMessageRow colSpan={4}>
            <EmptyState type="no-results">
              <EmptyStateIcon />
              <EmptyStateTitle as="h4">No work orders match these filters</EmptyStateTitle>
              <EmptyStateDescription>Remove a filter to see more work orders.</EmptyStateDescription>
              <EmptyStateActions>
                <Button variant="secondary" size="sm">
                  Clear filters
                </Button>
              </EmptyStateActions>
            </EmptyState>
          </TableMessageRow>
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyStateInSidePanel() {
  return (
    <aside className="flex w-full max-w-xs flex-col gap-6">
      <h4 className="text-sm font-medium text-base-foreground">Comments</h4>
      <EmptyState>
        <EmptyStateIcon>
          <IconMessage />
        </EmptyStateIcon>
        <EmptyStateTitle as="h5">No comments yet</EmptyStateTitle>
        <EmptyStateDescription>Leave a note for the next shift.</EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="secondary" size="sm">
            Add comment
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </aside>
  );
}

function EmptyStateSearch() {
  const [query, setQuery] = useState('recompresor');
  const matches = EQUIPMENT.filter((asset) => `${asset.name} ${asset.tag}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <div className="flex h-44 flex-col">
        {matches.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState type="no-results">
              <EmptyStateIcon />
              <EmptyStateTitle as="h4">No equipment matches &quot;{query}&quot;</EmptyStateTitle>
              <EmptyStateDescription>Check the spelling, or search by tag.</EmptyStateDescription>
              <EmptyStateActions>
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              </EmptyStateActions>
            </EmptyState>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 overflow-y-auto text-sm">
            {matches.map((asset) => (
              <li key={asset.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-base-foreground">{asset.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{asset.tag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyStateInChartCard() {
  return (
    <section className="flex w-full max-w-md flex-col rounded-xl border border-default">
      <div className="flex items-baseline justify-between gap-4 p-4">
        <h4 className="text-sm font-medium text-base-foreground">Bearing temperature</h4>
        <span className="text-xs text-muted-foreground">1 to 7 March</span>
      </div>
      <div className="flex justify-center px-4 pt-4 pb-8">
        <EmptyState>
          <EmptyStateIcon>
            <IconChartLine />
          </EmptyStateIcon>
          <EmptyStateTitle as="h5">No data in this time range</EmptyStateTitle>
          <EmptyStateDescription>40-TT-40015 reported no values between 1 and 7 March.</EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="secondary" size="sm">
              Show last 30 days
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </div>
    </section>
  );
}

function EmptyStateAllClear() {
  return (
    <section className="flex w-full max-w-md flex-col rounded-xl border border-default">
      <h4 className="p-4 text-sm font-medium text-base-foreground">Active alarms</h4>
      <div className="flex justify-center px-4 pt-4 pb-8">
        <EmptyState>
          <EmptyStateIcon>
            <IconCircleCheck />
          </EmptyStateIcon>
          <EmptyStateTitle as="h5">No active alarms</EmptyStateTitle>
          <EmptyStateDescription>All 16 assets are within their limits. New alarms appear here.</EmptyStateDescription>
        </EmptyState>
      </div>
    </section>
  );
}

function EmptyStateRetry() {
  const [attempts, setAttempts] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const retry = () =>
    wait(1400).then(() => {
      setAttempts(attempts + 1);
      if (attempts >= 1) {
        setLoaded(true);
        return;
      }
      throw new Error('Service unavailable');
    });

  const reset = () => {
    setAttempts(0);
    setLoaded(false);
  };

  return (
    <section className="flex w-full max-w-md flex-col rounded-xl border border-default">
      <div className="flex items-center justify-between gap-4 p-4">
        <h4 className="text-sm font-medium text-base-foreground">Maintenance history</h4>
        {loaded ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset example
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-44 items-center justify-center px-4 pb-6">
        {loaded ? (
          <p className="text-sm text-muted-foreground">14 maintenance records loaded.</p>
        ) : (
          <RetryBlock
            title="Couldn't load maintenance history"
            description="The maintenance system did not answer. Your filters are kept."
            onRetry={retry}
          />
        )}
      </div>
    </section>
  );
}

export default definePage({
  id: 'empty-state',
  title: 'Empty state',
  summary:
    'An empty state fills the space where content would be. It says why there is nothing, what will appear, and gives the one action that moves things forward.',
  docsSlug: 'empty-state',
  guidance: {
    use: [
      'Lists, tables, charts and pages with nothing to show: first use, no results, error, no access.',
      'A title that names the situation and a description that says what to do.',
      'One clear action when the user can create, import, clear or retry.',
      'Compact inside a card or panel; full when it is the whole page.',
    ],
    avoid: [
      'A blank area or a bare "No data".',
      'The same message for "nothing yet" and "nothing matches"; they need different actions.',
      'An action the user cannot take, such as Create without permission.',
      'More than one illustration or icon tile in the same view.',
    ],
  },
  source,
  sections: [
    {
      id: 'types',
      title: 'Types',
      description: 'Seven situations, each with its own icon. Shown in the compact variant.',
      specimens: [
        {
          id: 'EmptyStateNewObject',
          title: 'New object',
          note: 'Nothing has been created yet; lead with the action that creates the first one.',
          origin: 'aura',
          Component: EmptyStateNewObject,
        },
        {
          id: 'EmptyStateNoResults',
          title: 'No results',
          note: 'A search or filter matched nothing; repeat the query and offer to clear it.',
          origin: 'aura',
          Component: EmptyStateNoResults,
        },
        {
          id: 'EmptyStateNotFound',
          title: 'Not found',
          note: 'A link points to something that no longer exists; offer the nearest place that does.',
          origin: 'aura',
          Component: EmptyStateNotFound,
        },
        {
          id: 'EmptyStateError',
          title: 'Error',
          note: 'Loading failed; say what failed and let the user retry.',
          origin: 'aura',
          Component: EmptyStateError,
        },
        {
          id: 'EmptyStateNoAccess',
          title: 'No access',
          note: 'The content exists but this user cannot see it; say who can grant access.',
          origin: 'aura',
          Component: EmptyStateNoAccess,
        },
        {
          id: 'EmptyStateNewChat',
          title: 'New chat',
          note: 'An empty conversation; suggest what to ask, since the prompt field is the action.',
          origin: 'aura',
          Component: EmptyStateNewChat,
        },
        {
          id: 'EmptyStateUnknown',
          title: 'Unknown',
          note: 'Nothing is selected or the reason is not known; point to the next step.',
          origin: 'aura',
          Component: EmptyStateUnknown,
        },
      ],
    },
    {
      id: 'full',
      title: 'Full page',
      description: 'The full variant for when the empty state is the page: a larger icon tile, larger type, more space.',
      specimens: [
        {
          id: 'EmptyStateFullFirstUse',
          title: 'First use',
          note: 'A new workspace or product area with nothing in it yet.',
          origin: 'aura',
          size: 'md',
          Component: EmptyStateFullFirstUse,
        },
        {
          id: 'EmptyStateFullError',
          title: 'Page error',
          note: 'The whole page failed to load and there is nothing partial to show.',
          origin: 'aura',
          size: 'md',
          Component: EmptyStateFullError,
        },
        {
          id: 'EmptyStateFullNoAccess',
          title: 'No access, with request',
          note: 'A page behind a permission; the request confirms in place. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: EmptyStateFullNoAccess,
        },
        {
          id: 'EmptyStateFullNotFound',
          title: 'Page not found',
          note: 'A dead link to a whole page; send people somewhere that works.',
          origin: 'aura',
          size: 'md',
          Component: EmptyStateFullNotFound,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'How much to say, from one line to a title, description and two actions.',
      specimens: [
        {
          id: 'EmptyStateTitleOnly',
          title: 'Title only',
          note: 'A small widget where the situation is obvious and there is nothing to do.',
          origin: 'aura',
          Component: EmptyStateTitleOnly,
        },
        {
          id: 'EmptyStateTextOnly',
          title: 'Without icon',
          note: 'A secondary panel that should stay quiet next to the main content.',
          origin: 'aura',
          Component: EmptyStateTextOnly,
        },
        {
          id: 'EmptyStateCustomIcon',
          title: 'Custom icon',
          note: 'The icon shows what belongs here, such as uploads, comments or charts.',
          origin: 'aura',
          Component: EmptyStateCustomIcon,
        },
        {
          id: 'EmptyStateTwoActions',
          title: 'Two actions',
          note: 'Two real ways to start: one primary, one quiet alternative beside it.',
          origin: 'aura',
          size: 'md',
          Component: EmptyStateTwoActions,
        },
        {
          id: 'EmptyStateWithLink',
          title: 'With a guide link',
          note: 'A concept people may not know yet: the action first, the guide underneath.',
          origin: 'aura',
          size: 'md',
          Component: EmptyStateWithLink,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Empty states inside the tables, cards and panels they stand in for.',
      specimens: [
        {
          id: 'EmptyStateInTable',
          title: 'Filtered table',
          note: 'Filters removed every row: keep the headers and filters visible and offer to clear them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableMessageRow.tsx'],
          Component: EmptyStateInTable,
        },
        {
          id: 'EmptyStateInSidePanel',
          title: 'Side panel',
          note: 'A narrow panel with nothing in it yet; keep the copy to two short lines.',
          origin: 'custom',
          Component: EmptyStateInSidePanel,
        },
        {
          id: 'EmptyStateSearch',
          title: 'Search with no matches',
          note: 'Live search: the list gives way to the empty state and Clear search brings it back.',
          origin: 'custom',
          size: 'md',
          Component: EmptyStateSearch,
        },
        {
          id: 'EmptyStateInChartCard',
          title: 'Chart with no data',
          note: 'The series exists but has no points in range; offer a range that does.',
          origin: 'custom',
          size: 'md',
          Component: EmptyStateInChartCard,
        },
        {
          id: 'EmptyStateAllClear',
          title: 'All clear',
          note: 'Empty is the good outcome: confirm it and say what would appear here.',
          origin: 'custom',
          size: 'md',
          Component: EmptyStateAllClear,
        },
        {
          id: 'EmptyStateRetry',
          title: 'Error with retry',
          note: 'A region failed to load: retry in place, with progress and a second-failure message. Click to try.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/RetryBlock.tsx'],
          Component: EmptyStateRetry,
        },
      ],
    },
  ],
});
