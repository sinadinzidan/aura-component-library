import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@cognite/aura/components/input-group';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Switch } from '@cognite/aura/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCircleCheckFilled, IconRefresh, IconSearch } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { Delayed } from '../../../library/feedback/Delayed';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { ALARMS, SENSORS, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './loader.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const FIRST_ALARMS = ALARMS.slice(0, 3);
const FIRST_SENSORS = SENSORS.slice(0, 3);
const FIRST_WORK_ORDERS = WORK_ORDERS.slice(0, 3);

function LoaderInline() {
  return <Loader />;
}

function LoaderSizes() {
  return (
    <div className="flex items-center gap-6 text-base-foreground">
      <Loader size={12} />
      <Loader />
      <Loader size={24} />
      <Loader size={40} />
    </div>
  );
}

function LoaderPage() {
  return <Loader variant="page" header="Loading workspace" />;
}

function LoaderPageWithDescription() {
  return (
    <Loader variant="page" header="Preparing your data model" description="This can take up to a minute the first time." />
  );
}

function LoaderInheritsColour() {
  return (
    <div className="flex items-center gap-6">
      <span className="text-base-foreground">
        <Loader size={20} aria-label="Loading, default text colour" />
      </span>
      <span className="text-muted-foreground">
        <Loader size={20} aria-label="Loading, muted text colour" />
      </span>
      <span className="text-info-foreground-strong">
        <Loader size={20} aria-label="Loading, in-progress status colour" />
      </span>
    </div>
  );
}

function LoaderLabelInline() {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader aria-hidden />
      Loading time series…
    </div>
  );
}

function LoaderLabelStacked() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      <Loader size={32} aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">Calculating health scores</p>
        <p className="text-sm text-muted-foreground">16 assets, last 30 days</p>
      </div>
    </div>
  );
}

function LoaderAccessibleName() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Loader size={24} aria-label="Loading active alarms" />
      <p className="text-xs text-muted-foreground">Announced as &quot;Loading active alarms&quot;</p>
    </div>
  );
}

function LoaderStatusLine() {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = () => {
    setState('saving');
    void wait(1400).then(() => setState('saved'));
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="secondary" size="sm" disabled={state === 'saving'} onClick={save}>
        Edit thresholds
      </Button>
      <div role="status" className="flex min-w-24 items-center gap-2 text-sm text-muted-foreground">
        {state === 'saving' ? <Loader aria-hidden /> : null}
        {state === 'saved' ? <IconCircleCheckFilled className="size-4 text-success-foreground-strong" aria-hidden /> : null}
        {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'No changes'}
      </div>
    </div>
  );
}

function LoaderInButton() {
  return (
    <AsyncButton onAction={() => wait(1600)} pendingLabel="Deploying…">
      Deploy function
    </AsyncButton>
  );
}

function LoaderInIconButton() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    void wait(1400).then(() => setRefreshing(false));
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={refreshing ? 'Refreshing data' : 'Refresh data'}
            aria-busy={refreshing || undefined}
            onClick={refresh}
          >
            {refreshing ? <Loader aria-hidden /> : <IconRefresh />}
          </Button>
        }
      />
      <TooltipContent>{refreshing ? 'Refreshing…' : 'Refresh data'}</TooltipContent>
    </Tooltip>
  );
}

function LoaderInSearchField() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searching) return;
    const handle = window.setTimeout(() => setSearching(false), 900);
    return () => window.clearTimeout(handle);
  }, [searching, query]);

  return (
    <div className="flex w-full max-w-xs flex-col">
      <Label htmlFor="loader-search">Find a time series</Label>
      <InputGroup>
        <InputGroupAddon>
          <IconSearch aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          id="loader-search"
          placeholder="Type a tag, such as 23-PT"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearching(event.target.value !== '');
          }}
        />
        {searching ? (
          <InputGroupAddon align="inline-end">
            <Loader aria-label="Searching" />
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  );
}

function LoaderInBadge() {
  return (
    <Badge variant="inProgress">
      <Loader size={12} aria-hidden /> Running
    </Badge>
  );
}

function LoaderBesideSwitch() {
  const [enabled, setEnabled] = useState(false);
  const [applying, setApplying] = useState(false);

  const change = (next: boolean) => {
    setEnabled(next);
    setApplying(true);
    void wait(1200).then(() => setApplying(false));
  };

  return (
    <div className="flex items-center gap-3">
      <Switch label="Live updates" checked={enabled} disabled={applying} onCheckedChange={change} />
      <span className="flex size-4 items-center text-muted-foreground">{applying ? <Loader aria-label="Applying" /> : null}</span>
    </div>
  );
}

function LoaderInCard() {
  return (
    <section className="flex w-full max-w-sm flex-col rounded-xl border border-default">
      <h4 className="p-4 text-sm font-medium text-base-foreground">Compressor health</h4>
      <div role="status" className="flex h-36 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader size={24} aria-hidden />
        Loading health scores…
      </div>
    </section>
  );
}

function LoaderInTable() {
  return (
    <table className="w-full text-left text-sm" aria-busy>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Tag</th>
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Value</th>
          <th className="py-2 font-medium">Quality</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={4}>
            <div role="status" className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader aria-hidden />
              Loading sensors…
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function LoaderLoadMore() {
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const alarms = ALARMS.slice(0, count);

  const loadMore = () => {
    setLoading(true);
    void wait(1200).then(() => {
      setCount((current) => Math.min(ALARMS.length, current + 3));
      setLoading(false);
    });
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="flex flex-col gap-3 text-sm">
        {alarms.map((alarm) => (
          <li key={alarm.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">{alarm.message}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{alarm.value}</span>
          </li>
        ))}
      </ul>
      {loading ? (
        <div role="status" className="flex h-7 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader aria-hidden />
          Loading more alarms…
        </div>
      ) : count < ALARMS.length ? (
        <Button variant="ghost" size="sm" onClick={loadMore}>
          Show more alarms
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setCount(3)}>
          Show fewer alarms
        </Button>
      )}
    </div>
  );
}

function LoaderOverlay() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    void wait(1600).then(() => setRefreshing(false));
  };

  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">1st stage compressor</h4>
        <Button variant="ghost" size="sm" disabled={refreshing} onClick={refresh}>
          <IconRefresh /> Refresh
        </Button>
      </div>
      <div className="relative">
        <dl aria-busy={refreshing} className={`grid grid-cols-3 gap-4 ${refreshing ? 'opacity-40' : ''}`}>
          {FIRST_SENSORS.map((sensor) => (
            <div key={sensor.id}>
              <dt className="truncate text-xs text-muted-foreground">{sensor.name}</dt>
              <dd className="text-base font-semibold text-base-foreground tabular-nums">
                {sensor.value} <span className="text-xs font-medium text-muted-foreground">{sensor.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
        {refreshing ? (
          <div className="absolute inset-0 flex items-center justify-center text-base-foreground">
            <Loader size={24} aria-label="Refreshing values" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LoaderPageInShell() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-default">
      <div className="flex h-12 items-center bg-muted-background px-4">
        <p className="text-sm text-muted-foreground">
          Nordkapp <span aria-hidden>/</span> <span className="font-medium text-base-foreground">Gas compression</span>
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Loader variant="page" header="Loading gas compression" description="Fetching assets, alarms and the last 24 hours of data." />
      </div>
    </div>
  );
}

function LoaderDelayed() {
  const [run, setRun] = useState(0);
  const [pendingMs, setPendingMs] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(null);

  const request = (ms: number) => {
    setRun(run + 1);
    setPendingMs(ms);
    void wait(ms).then(() => {
      setPendingMs(null);
      setLast(ms);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={pendingMs !== null} onClick={() => request(150)}>
          Respond in 150 ms
        </Button>
        <Button variant="secondary" size="sm" disabled={pendingMs !== null} onClick={() => request(1500)}>
          Respond in 1.5 s
        </Button>
      </div>
      <div className="flex h-5 items-center gap-2 text-sm text-muted-foreground">
        {pendingMs !== null ? (
          <Delayed key={run} delayMs={300}>
            <Loader aria-hidden />
            Loading…
          </Delayed>
        ) : last === null ? (
          'A loader shows only after 300 ms.'
        ) : last < 300 ? (
          'Done. No loader was shown.'
        ) : (
          'Done. The loader showed after 300 ms.'
        )}
      </div>
    </div>
  );
}

function LoaderThenContent() {
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');

  const load = () => {
    setState('loading');
    void wait(1500).then(() => setState('ready'));
  };

  return (
    <section className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Active alarms</h4>
        <Button variant="ghost" size="sm" disabled={state === 'loading'} onClick={state === 'ready' ? () => setState('idle') : load}>
          {state === 'ready' ? 'Reset example' : 'Load alarms'}
        </Button>
      </div>
      <div className="flex h-24 flex-col justify-center" aria-busy={state === 'loading'}>
        {state === 'loading' ? (
          <div role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader aria-hidden />
            Loading alarms…
          </div>
        ) : state === 'ready' ? (
          <ul className="flex flex-col gap-2 text-sm">
            {FIRST_ALARMS.map((alarm) => (
              <li key={alarm.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-base-foreground">{alarm.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{alarm.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Nothing loaded yet.</p>
        )}
      </div>
    </section>
  );
}

function LoaderThenError() {
  const [state, setState] = useState<'idle' | 'loading' | 'failed' | 'ready'>('idle');

  const load = () => {
    setState('loading');
    void wait(1200).then(() => setState('failed'));
  };

  const retry = () => wait(1400).then(() => setState('ready'));

  return (
    <section className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Open work orders</h4>
        {state === 'idle' || state === 'ready' ? (
          <Button variant="ghost" size="sm" onClick={state === 'ready' ? () => setState('idle') : load}>
            {state === 'ready' ? 'Reset example' : 'Load work orders'}
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-36 flex-col items-center justify-center" aria-busy={state === 'loading'}>
        {state === 'loading' ? (
          <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader aria-hidden />
            Loading work orders…
          </div>
        ) : state === 'failed' ? (
          <RetryBlock
            title="Couldn't load work orders"
            description="The maintenance system did not answer. Try again."
            onRetry={retry}
          />
        ) : state === 'ready' ? (
          <ul className="flex w-full flex-col gap-2 text-sm">
            {FIRST_WORK_ORDERS.map((order) => (
              <li key={order.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-base-foreground">{order.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{order.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">The first load fails in this example.</p>
        )}
      </div>
    </section>
  );
}

export default definePage({
  id: 'loader',
  title: 'Loader',
  summary:
    'The loader says "working on it" when the length of the wait and the shape of the result are unknown. Inline for controls and regions, page for a whole view.',
  docsSlug: 'loader',
  guidance: {
    use: [
      'Compact waits inside a button, field, card or table region.',
      'The page variant when a whole view is loading for the first time.',
      'Text next to the loader for any wait people will notice: say what is loading.',
      'An accessible name, or aria-hidden when visible text already says it.',
    ],
    avoid: [
      'A loader where the layout is known; a skeleton prevents the jump.',
      'A loader for measurable work; show progress instead.',
      'Flashing a loader for responses that arrive within about 300 ms.',
      'Several loaders in one view; one per region that is waiting.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Inline at any size, or the page variant with a header and description.',
      specimens: [
        {
          id: 'LoaderInline',
          title: 'Inline',
          note: 'The default 16px loader for controls and single lines of text.',
          origin: 'aura',
          Component: LoaderInline,
        },
        {
          id: 'LoaderSizes',
          title: 'Sizes',
          note: '12px in badges, 16px in controls, 24px in a card, 40px for a large empty region.',
          origin: 'aura',
          Component: LoaderSizes,
        },
        {
          id: 'LoaderInheritsColour',
          title: 'Inherited colour',
          note: 'The loader takes the text colour around it, so it matches the label it sits beside.',
          origin: 'aura',
          Component: LoaderInheritsColour,
        },
        {
          id: 'LoaderPage',
          title: 'Page',
          note: 'A whole view is loading and there is nothing else to show yet.',
          origin: 'aura',
          size: 'md',
          Component: LoaderPage,
        },
        {
          id: 'LoaderPageWithDescription',
          title: 'Page with description',
          note: 'A long first load: set expectations for how long it takes or what is being prepared.',
          origin: 'aura',
          size: 'md',
          Component: LoaderPageWithDescription,
        },
      ],
    },
    {
      id: 'with-text',
      title: 'With text',
      description: 'A loader alone only says "wait". Text says what for.',
      specimens: [
        {
          id: 'LoaderLabelInline',
          title: 'Label beside',
          note: 'One line in a list, table or toolbar that is waiting for data.',
          origin: 'aura',
          Component: LoaderLabelInline,
        },
        {
          id: 'LoaderLabelStacked',
          title: 'Label below',
          note: 'A region with room to spare; the second line scopes what is being worked on.',
          origin: 'aura',
          Component: LoaderLabelStacked,
        },
        {
          id: 'LoaderAccessibleName',
          title: 'Accessible name only',
          note: 'No room for visible text: name the wait for screen readers through aria-label.',
          origin: 'aura',
          Component: LoaderAccessibleName,
        },
        {
          id: 'LoaderStatusLine',
          title: 'Save status',
          note: 'Auto-save: a quiet status line that turns from saving to saved, with no toast.',
          origin: 'custom',
          Component: LoaderStatusLine,
        },
      ],
    },
    {
      id: 'in-controls',
      title: 'In controls',
      description: 'The control that started the work shows that it is working.',
      specimens: [
        {
          id: 'LoaderInButton',
          title: 'In a button',
          note: 'The action takes a moment; the button stays busy and blocks a second click.',
          origin: 'custom',
          uses: ['actions/AsyncButton.tsx'],
          Component: LoaderInButton,
        },
        {
          id: 'LoaderInIconButton',
          title: 'In an icon button',
          note: 'The icon swaps for the loader while a refresh runs. Click to try.',
          origin: 'custom',
          Component: LoaderInIconButton,
        },
        {
          id: 'LoaderInSearchField',
          title: 'In a search field',
          note: 'Results are being fetched as the user types. Type to try.',
          origin: 'custom',
          Component: LoaderInSearchField,
        },
        {
          id: 'LoaderInBadge',
          title: 'In a badge',
          note: 'An entity whose state is "in progress", such as a running pipeline.',
          origin: 'aura',
          Component: LoaderInBadge,
        },
        {
          id: 'LoaderBesideSwitch',
          title: 'Beside a switch',
          note: 'A setting that is applied on the server before it takes effect.',
          origin: 'custom',
          Component: LoaderBesideSwitch,
        },
      ],
    },
    {
      id: 'in-regions',
      title: 'In regions',
      description: 'A part of the page waits while the rest stays usable.',
      specimens: [
        {
          id: 'LoaderInCard',
          title: 'In a card',
          note: 'The card keeps its title and size; only the body waits.',
          origin: 'custom',
          size: 'md',
          Component: LoaderInCard,
        },
        {
          id: 'LoaderOverlay',
          title: 'Over existing content',
          note: 'A refresh: keep the old values visible but dimmed, so nothing jumps. Click Refresh.',
          origin: 'custom',
          size: 'md',
          Component: LoaderOverlay,
        },
        {
          id: 'LoaderLoadMore',
          title: 'Load more',
          note: 'The next page of a list is on its way, below the rows already shown.',
          origin: 'custom',
          size: 'md',
          Component: LoaderLoadMore,
        },
        {
          id: 'LoaderInTable',
          title: 'In a table body',
          note: 'The columns are known but the number of rows is not; headers stay in place.',
          origin: 'custom',
          size: 'md',
          Component: LoaderInTable,
        },
        {
          id: 'LoaderPageInShell',
          title: 'Page in the app shell',
          note: 'Navigation is ready before the page is; the page loader fills the content area.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: LoaderPageInShell,
        },
      ],
    },
    {
      id: 'timing',
      title: 'Timing and outcomes',
      description: 'When the loader appears, and what replaces it.',
      specimens: [
        {
          id: 'LoaderDelayed',
          title: 'Delayed',
          note: 'Fast responses should not flash a loader; hold it back for 300 ms. Try both buttons.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/Delayed.tsx'],
          Component: LoaderDelayed,
        },
        {
          id: 'LoaderThenContent',
          title: 'Then content',
          note: 'The region reserves its height, so the result replaces the loader without a jump.',
          origin: 'custom',
          size: 'md',
          Component: LoaderThenContent,
        },
        {
          id: 'LoaderThenError',
          title: 'Then error with retry',
          note: 'A failed load ends in a message and a retry, never in an endless loader.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/RetryBlock.tsx'],
          Component: LoaderThenError,
        },
      ],
    },
  ],
});
