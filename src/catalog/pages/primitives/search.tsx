import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Kbd } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Search } from '@cognite/aura/components/search';
import { IconChevronDown, IconFilter, IconHistory, IconPlus, IconX } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

import { DebouncedSearch } from '../../../library/forms/DebouncedSearch';
import { ASSETS, SENSORS, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './search.tsx?raw';

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const SEARCH_SCOPES = ['All of Nordkapp', 'Gas compression', 'Gas export'] as const;

const RECENT_SEARCHES = ['23-KA-9101', 'vibration', 'export pump'] as const;

function matchEquipment(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') return EQUIPMENT;
  return EQUIPMENT.filter((asset) => `${asset.tag} ${asset.name}`.toLowerCase().includes(needle));
}

function matchSensors(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') return SENSORS;
  return SENSORS.filter((sensor) => `${sensor.tag} ${sensor.name}`.toLowerCase().includes(needle));
}

function splitOnMatch(text: string, query: string): [string, string, string] {
  const needle = query.trim().toLowerCase();
  const index = needle === '' ? -1 : text.toLowerCase().indexOf(needle);
  if (index === -1) return [text, '', ''];
  return [text.slice(0, index), text.slice(index, index + needle.length), text.slice(index + needle.length)];
}

type ResultRowProps = {
  tag: string;
  name: string;
};

function ResultRow({ tag, name }: ResultRowProps) {
  return (
    <li className="flex items-baseline gap-3 py-1.5 text-sm">
      <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{tag}</span>
      <span className="truncate text-base-foreground">{name}</span>
    </li>
  );
}

function SearchDefault() {
  return (
    <div className="w-full max-w-sm">
      <Search aria-label="Search assets" placeholder="Search assets" />
    </div>
  );
}

function SearchFilled() {
  return (
    <div className="w-full max-w-sm">
      <Search aria-label="Search assets" placeholder="Search assets" defaultValue="compressor" />
    </div>
  );
}

function SearchControlled() {
  const [query, setQuery] = useState('23-KA');

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search by tag"
        placeholder="Search by tag"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="text-sm text-muted-foreground">
        Query: <span className="font-mono text-base-foreground">{query === '' ? '—' : query}</span>
      </p>
    </div>
  );
}

function SearchWithLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="search-with-label">Find a time series</Label>
      <Search id="search-with-label" placeholder="Tag or name" aria-describedby="search-with-label-hint" />
      <HelperText id="search-with-label-hint">Searches all 1,240 time series on Nordkapp.</HelperText>
    </div>
  );
}

function SearchCompactWidth() {
  return (
    <div className="flex w-full items-center justify-between gap-3 self-start">
      <h3 className="text-base font-semibold text-base-foreground">Work orders</h3>
      <Search className="w-48" aria-label="Search work orders" placeholder="Search" />
    </div>
  );
}

function SearchDisabled() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Search aria-label="Search alarms" placeholder="Search alarms" disabled aria-describedby="search-disabled-hint" />
      <HelperText id="search-disabled-hint">Search is available once the alarm history has loaded.</HelperText>
    </div>
  );
}

function SearchReadOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Search aria-label="Saved view query" readOnly defaultValue="type:compressor health:watch" aria-describedby="search-read-only-hint" />
      <HelperText id="search-read-only-hint">This query belongs to a shared view. Duplicate the view to change it.</HelperText>
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Search aria-label="Search time series" placeholder="Search time series" defaultValue="discharge" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader size={16} />
        Searching 1,240 time series…
      </div>
    </div>
  );
}

function SearchNoResults() {
  const [query, setQuery] = useState('23-KA-9109');
  const results = matchEquipment(query);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {results.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle as="h3">No equipment matches “{query.trim()}”</EmptyStateTitle>
          <EmptyStateDescription>Check the tag, or search by name instead.</EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </EmptyStateActions>
        </EmptyState>
      ) : (
        <p className="text-sm text-muted-foreground" role="status">
          {results.length} of {EQUIPMENT.length} equipment
        </p>
      )}
    </div>
  );
}

function SearchMinLength() {
  const [query, setQuery] = useState('2');
  const tooShort = query.trim().length > 0 && query.trim().length < 3;

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Search
        aria-label="Search the data catalog"
        placeholder="Search the data catalog"
        value={query}
        aria-describedby="search-min-length-hint"
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <HelperText id="search-min-length-hint">
        {tooShort ? 'Type at least 3 characters to search.' : 'Searches names, tags and descriptions.'}
      </HelperText>
    </div>
  );
}

function SearchDebounced() {
  const [query, setQuery] = useState('');
  const [requests, setRequests] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <DebouncedSearch
        aria-label="Search time series"
        placeholder="Search time series"
        onSearch={(next) => {
          setQuery(next);
          setRequests((count) => count + 1);
        }}
      />
      <p className="text-sm text-muted-foreground" role="status">
        {query === '' ? 'All' : matchSensors(query).length} of {SENSORS.length} time series ·{' '}
        <span className="tabular-nums">{requests}</span> {requests === 1 ? 'request' : 'requests'} sent
      </p>
    </div>
  );
}

function SearchSubmitOnEnter() {
  const [draft, setDraft] = useState('bearing');
  const [submitted, setSubmitted] = useState('bearing');
  const matches = WORK_ORDERS.filter((order) => order.title.toLowerCase().includes(submitted.trim().toLowerCase()));

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(draft);
      }}
    >
      <div className="flex gap-2">
        <Search
          aria-label="Search the work order archive"
          placeholder="Search the archive"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onClear={() => setDraft('')}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {matches.length} work orders for “{submitted}”
      </p>
    </form>
  );
}

function SearchSlashToFocus() {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex w-full max-w-sm flex-col gap-2"
      onKeyDown={(event) => {
        if (event.key === '/' && event.target !== searchRef.current) {
          event.preventDefault();
          event.stopPropagation();
          searchRef.current?.focus();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <Search ref={searchRef} aria-label="Search alarms" placeholder="Search alarms" aria-keyshortcuts="/" />
        <Kbd>/</Kbd>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Active
        </Button>
        <Button variant="ghost" size="sm">
          Acknowledged
        </Button>
        <Button variant="ghost" size="sm">
          Shelved
        </Button>
      </div>
    </div>
  );
}

function SearchResultCount() {
  const [query, setQuery] = useState('pump');
  const results = matchEquipment(query);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="text-sm text-muted-foreground" role="status">
        <span className="tabular-nums">{results.length}</span> of{' '}
        <span className="tabular-nums">{EQUIPMENT.length}</span> equipment
      </p>
    </div>
  );
}

function SearchHighlightMatches() {
  const [query, setQuery] = useState('press');
  const results = matchSensors(query).slice(0, 4);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search time series"
        placeholder="Search time series"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <ul className="flex flex-col">
        {results.map((sensor) => {
          const [before, match, after] = splitOnMatch(sensor.name, query);
          return (
            <li key={sensor.id} className="py-1.5 text-sm text-muted-foreground">
              {before}
              <mark className="bg-transparent font-semibold text-base-foreground">{match}</mark>
              {after}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchFilterList() {
  const [query, setQuery] = useState('');
  const results = matchEquipment(query);

  return (
    <div className="flex w-full max-w-md flex-col gap-2 self-start">
      <Search
        aria-label="Filter equipment"
        placeholder="Filter by tag or name"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="text-xs text-muted-foreground" role="status">
        {results.length} of {EQUIPMENT.length} equipment
      </p>
      {results.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No equipment matches. Check the tag or clear the filter.</p>
      ) : (
        <ul className="flex max-h-48 flex-col overflow-y-auto">
          {results.map((asset) => (
            <ResultRow key={asset.id} tag={asset.tag} name={asset.name} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchToolbar() {
  return (
    <div className="flex w-full items-center gap-3 self-start">
      <Search className="max-w-xs" aria-label="Search work orders" placeholder="Search work orders" />
      <Button variant="ghost" size="sm">
        <IconFilter /> Filter
      </Button>
      <Button className="ml-auto" size="sm">
        <IconPlus /> Create work order
      </Button>
    </div>
  );
}

function SearchWithScope() {
  const [scope, setScope] = useState<(typeof SEARCH_SCOPES)[number]>('Gas compression');

  return (
    <div className="flex w-full max-w-md items-center gap-2 self-start">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" aria-label={`Search in: ${scope}`}>
              {scope} <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {SEARCH_SCOPES.map((option) => (
            <DropdownMenuItem key={option} onClick={() => setScope(option)}>
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Search aria-label={`Search in ${scope}`} placeholder="Search equipment" />
    </div>
  );
}

function SearchRecent() {
  const [query, setQuery] = useState('');

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search Nordkapp"
        placeholder="Search Nordkapp"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Recent searches">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconHistory className="size-3.5" aria-hidden /> Recent
        </span>
        {RECENT_SEARCHES.map((recent) => (
          <Button key={recent} variant="outline" size="sm" onClick={() => setQuery(recent)}>
            {recent}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SearchWithActiveFilters() {
  const [filters, setFilters] = useState(['Type: Compressor', 'Health: Watch']);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Search aria-label="Search equipment" placeholder="Search equipment" defaultValue="stage" />
      {filters.length === 0 ? (
        <p className="text-xs text-muted-foreground">No filters applied.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant="secondary"
              size="sm"
              aria-label={`Remove filter ${filter}`}
              onClick={() => setFilters((current) => current.filter((item) => item !== filter))}
            >
              {filter} <IconX />
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setFilters([])}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchPickerPanel() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('pt-92531');
  const results = matchSensors(query);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 self-start">
      <h3 className="text-sm font-semibold text-base-foreground">Add time series</h3>
      <Search
        aria-label="Search time series"
        placeholder="Search by tag or name"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {results.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No time series match “{query.trim()}”.</p>
      ) : (
        <ul className="flex max-h-40 flex-col overflow-y-auto">
          {results.map((sensor) => (
            <li key={sensor.id}>
              <button
                type="button"
                aria-pressed={selected === sensor.id}
                className={`flex w-full flex-col rounded-md px-2 py-1.5 text-left outline-none focus-visible:shadow-focus-ring ${
                  selected === sensor.id ? 'bg-medium-background' : 'hover:bg-muted-background'
                }`}
                onClick={() => setSelected(sensor.id)}
              >
                <span className="text-sm text-base-foreground">{sensor.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchOnMutedSurface() {
  return (
    <div className="w-full max-w-sm">
      <Search aria-label="Search dashboards" placeholder="Search dashboards" />
    </div>
  );
}

function SearchStartPrompt() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const results = matchSensors(debounced).slice(0, 4);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search time series"
        placeholder="Search time series"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {debounced.trim() === '' ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Type a tag or a name to search 1,240 time series.
        </p>
      ) : results.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No time series match “{debounced.trim()}”. Check the tag or try a name.
        </p>
      ) : (
        <ul className="flex flex-col">
          {results.map((sensor) => (
            <ResultRow key={sensor.id} tag={sensor.tag} name={sensor.name} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default definePage({
  id: 'search',
  title: 'Search',
  summary:
    'A text field made for finding things: a search icon, a clear button that appears while it has focus and a value, and the search input type. Use it to filter a list or to query a data set.',
  docsSlug: 'search',
  guidance: {
    use: [
      'Finding or filtering items in a list, table, tree or the whole app.',
      'A placeholder that names the scope: "Search assets", not just "Search".',
      'Debounce live search, and submit on Enter when a query is expensive.',
      'Always show what happened: a result count, or a no-results state with a way out.',
    ],
    avoid: [
      'Search for picking one of a known set of options — use a combobox or select.',
      'Leaving an empty result area with no explanation.',
      'A request on every keystroke.',
      'General text entry; a search field has no label by default and clears with one click.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The field on its own. Focus a filled field to see the clear button.',
      specimens: [
        {
          id: 'SearchDefault',
          title: 'Default',
          note: 'Above a list or table; the placeholder names what is searched and aria-label repeats it.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchDefault,
        },
        {
          id: 'SearchFilled',
          title: 'Filled, uncontrolled',
          note: 'A filter the page does not need to track; the field clears itself. Focus it to try.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchFilled,
        },
        {
          id: 'SearchControlled',
          title: 'Controlled',
          note: 'The query drives other UI or the URL; pass value, onChange and onClear together.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchControlled,
        },
        {
          id: 'SearchWithLabel',
          title: 'With label and helper',
          note: 'Search as a step in a form or dialog, where a bare field would be ambiguous.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchWithLabel,
        },
        {
          id: 'SearchCompactWidth',
          title: 'Compact, in a header',
          note: 'A card or section header with little room; fixed narrow width, short placeholder.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchCompactWidth,
        },
        {
          id: 'SearchOnMutedSurface',
          title: 'On a muted surface',
          note: 'Search placed directly on a grey page background rather than inside a card.',
          origin: 'aura',
          align: 'stretch',
          surface: 'muted',
          Component: SearchOnMutedSurface,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the field and the area under it show while search is unavailable, running or empty.',
      specimens: [
        {
          id: 'SearchDisabled',
          title: 'Disabled with reason',
          note: 'There is nothing to search yet; say what the user is waiting for.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchDisabled,
        },
        {
          id: 'SearchReadOnly',
          title: 'Read-only',
          note: 'A saved or shared query people can read and copy but not change here.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchReadOnly,
        },
        {
          id: 'SearchLoading',
          title: 'Searching',
          note: 'A query that takes longer than a moment; the status sits where results will appear.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchLoading,
        },
        {
          id: 'SearchNoResults',
          title: 'No results',
          note: 'Nothing matched: repeat the query, suggest a fix and offer a way back.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchNoResults,
        },
        {
          id: 'SearchMinLength',
          title: 'Minimum length',
          note: 'Short queries would match too much; a hint, not an error, says when search starts.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchMinLength,
        },
      ],
    },
    {
      id: 'behaviour',
      title: 'Behaviour',
      description: 'When the search runs and how results are reported back.',
      specimens: [
        {
          id: 'SearchDebounced',
          title: 'Debounced',
          note: 'Live search against an API: one request per pause in typing, at once on Enter or clear.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/DebouncedSearch.tsx'],
          Component: SearchDebounced,
        },
        {
          id: 'SearchSubmitOnEnter',
          title: 'Submit on Enter',
          note: 'Slow or costly queries, such as an archive: nothing runs until the user asks.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchSubmitOnEnter,
        },
        {
          id: 'SearchSlashToFocus',
          title: 'Slash to focus',
          note: 'Keyboard-heavy views: a shortcut jumps to search and the hint teaches it. Focus a tab and press /.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchSlashToFocus,
        },
        {
          id: 'SearchResultCount',
          title: 'With result count',
          note: 'Client-side filtering: say how many of the total are showing.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchResultCount,
        },
        {
          id: 'SearchHighlightMatches',
          title: 'Highlighted matches',
          note: 'Results where it is not obvious why a row matched; weight, not colour, marks the match.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchHighlightMatches,
        },
        {
          id: 'SearchStartPrompt',
          title: 'Prompt before typing',
          note: 'The data set is too large to list; say what can be searched until there is a query.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchStartPrompt,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Search with the lists, filters and actions it usually sits beside.',
      specimens: [
        {
          id: 'SearchWithScope',
          title: 'With scope menu',
          note: 'The same search can cover different areas; the scope is explicit and switchable.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SearchWithScope,
        },
        {
          id: 'SearchWithActiveFilters',
          title: 'With active filters',
          note: 'Free text narrows within filters; each filter is visible and removable under the field.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SearchWithActiveFilters,
        },
        {
          id: 'SearchRecent',
          title: 'Recent searches',
          note: 'People repeat a handful of queries; one click runs them again.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchRecent,
        },
        {
          id: 'SearchPickerPanel',
          title: 'Picker panel',
          note: 'Choosing one item from a long list in a popover or side panel.',
          origin: 'custom',
          align: 'stretch',
          Component: SearchPickerPanel,
        },
        {
          id: 'SearchFilterList',
          title: 'Filtering a list',
          note: 'The common case: the field filters the list under it as you type, with a count.',
          origin: 'aura',
          align: 'stretch',
          Component: SearchFilterList,
        },
        {
          id: 'SearchToolbar',
          title: 'In a table toolbar',
          note: 'Search leads the toolbar on the left; filters follow it and the primary action sits right.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: SearchToolbar,
        },
      ],
    },
  ],
});
