import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cognite/aura/components/command';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Kbd } from '@cognite/aura/components/kbd';
import { Loader } from '@cognite/aura/components/loader';
import { Search } from '@cognite/aura/components/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowRight,
  IconBell,
  IconBookmark,
  IconBox,
  IconChartLine,
  IconFileText,
  IconHistory,
  IconPlus,
  IconSearch,
  IconTool,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { CommandPalette } from '../../../library/navigation/CommandPalette';
import { SearchResultGroup } from '../../../library/patterns/states/SearchResultGroup';
import type { SearchResult } from '../../../library/patterns/states/SearchResultGroup';
import { ASSETS, SENSORS, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './search-experiences.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const DOCUMENTS = [
  {
    id: 'pid-0012',
    title: 'P&ID, gas compression, 1st stage',
    number: 'NK-23-PID-0012',
    kind: 'P&ID',
    revision: 'Rev 7',
    snippet: 'Suction scrubber to 1st stage compressor 23-KA-9101, with anti-surge recycle to the interstage cooler.',
    where: 'Sheet 2 of 4',
  },
  {
    id: 'ds-9101',
    title: 'Compressor datasheet, 23-KA-9101',
    number: 'NK-23-DS-9101',
    kind: 'Datasheet',
    revision: 'Rev 3',
    snippet: 'Centrifugal compressor, rated 9,840 rpm. Vibration alarm at 7.1 mm/s and trip at 11.0 mm/s.',
    where: 'Page 4',
  },
  {
    id: 'op-0004',
    title: 'Start-up procedure, gas compression',
    number: 'NK-23-OP-0004',
    kind: 'Procedure',
    revision: 'Rev 12',
    snippet: 'Confirm seal gas pressure before the compressor is rolled. Hold at 3,000 rpm for 10 minutes.',
    where: 'Step 14',
  },
] as const;

const RECENT_SEARCHES = ['23-KA-9103', 'discharge pressure', 'start-up procedure', 'cooler outlet'] as const;

const SCOPE_ITEMS = [
  { value: 'nk', label: 'All of Nordkapp' },
  { value: 'nk-23', label: 'Gas compression' },
  { value: 'nk-20', label: 'Inlet and separation' },
  { value: 'nk-27', label: 'Gas export' },
];

const SORT_ITEMS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name, A to Z' },
];

const areaOf = (assetId: string) => findAsset(findAsset(assetId)?.parentId ?? '')?.name ?? 'Nordkapp';

const includes = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());

function assetResults(query: string): SearchResult[] {
  return EQUIPMENT.filter((asset) => includes(`${asset.name} ${asset.tag}`, query)).map((asset) => ({
    id: asset.id,
    title: asset.name,
    context: `Nordkapp · ${areaOf(asset.id)}`,
    meta: asset.tag,
    icon: <IconBox />,
  }));
}

function seriesResults(query: string): SearchResult[] {
  return SENSORS.filter((sensor) => includes(`${sensor.name} ${sensor.tag} ${findAsset(sensor.assetId)?.name}`, query)).map(
    (sensor) => ({
      id: sensor.id,
      title: sensor.name,
      context: `${findAsset(sensor.assetId)?.name} · ${sensor.unit}`,
      meta: sensor.tag,
      icon: <IconChartLine />,
    })
  );
}

function documentResults(query: string): SearchResult[] {
  return DOCUMENTS.filter((document) => includes(`${document.title} ${document.snippet}`, query)).map((document) => ({
    id: document.id,
    title: document.title,
    context: `${document.kind} · ${document.revision}`,
    meta: document.number,
    icon: <IconFileText />,
  }));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** The surface that hangs under a search field. Flat here because it is shown open, in the page. */
function SearchExperiencePanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col rounded-xl border border-default p-2">
      {children}
    </div>
  );
}

function SearchExperienceRow({
  icon,
  title,
  meta,
  onSelect,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  meta?: string;
  onSelect: () => void;
  trailing?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-1 rounded-lg transition-colors hover:bg-accent-background">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none focus-visible:shadow-focus-ring"
      >
        <span aria-hidden className="flex shrink-0 text-muted-foreground [&>svg]:size-4">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{title}</span>
        {meta ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </button>
      {trailing}
    </li>
  );
}

function SearchExperienceRecent() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<readonly string[]>(RECENT_SEARCHES);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Search
        aria-label="Search Nordkapp"
        placeholder="Search assets, time series and documents"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <SearchExperiencePanel label="Recent searches">
        <div className="flex min-h-7 items-center justify-between gap-4 px-2">
          <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
          {recent.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setRecent([])}>
              Clear all
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setRecent(RECENT_SEARCHES)}>
              Reset example
            </Button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">Your searches appear here.</p>
        ) : (
          <ul className="flex flex-col">
            {recent.map((term) => (
              <SearchExperienceRow
                key={term}
                icon={<IconHistory />}
                title={term}
                onSelect={() => setQuery(term)}
                trailing={
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${term} from recent searches`}
                          onClick={() => setRecent(recent.filter((other) => other !== term))}
                        >
                          <IconX />
                        </Button>
                      }
                    />
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                }
              />
            ))}
          </ul>
        )}
      </SearchExperiencePanel>
    </div>
  );
}

function SearchExperienceSuggestions() {
  const [query, setQuery] = useState('comp');
  const suggestions = query.trim().length < 2 ? [] : [...assetResults(query).slice(0, 3), ...seriesResults(query).slice(0, 2)];

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Search
        aria-label="Search Nordkapp"
        placeholder="Search assets and time series"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <div className="min-h-56">
        {query.trim().length < 2 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">Type two or more characters to see suggestions.</p>
        ) : (
          <SearchExperiencePanel label="Suggestions">
            {suggestions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">No suggestions. Press Enter to search everything.</p>
            ) : (
              <ul className="flex flex-col">
                {suggestions.map((suggestion) => (
                  <SearchExperienceRow
                    key={suggestion.id}
                    icon={suggestion.icon}
                    title={suggestion.title}
                    meta={suggestion.meta}
                    onSelect={() => setQuery(suggestion.title)}
                  />
                ))}
              </ul>
            )}
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-default px-2 pt-2">
              <span className="truncate text-xs text-muted-foreground">Search everything for &quot;{query.trim()}&quot;</span>
              <ShortcutHint keys={['enter']} />
            </div>
          </SearchExperiencePanel>
        )}
      </div>
    </div>
  );
}

function SearchExperienceScoped() {
  const [scope, setScope] = useState('nk-23');
  const [query, setQuery] = useState('pressure');
  const scopeLabel = SCOPE_ITEMS.find((item) => item.value === scope)?.label ?? 'Nordkapp';
  const matches = SENSORS.filter(
    (sensor) => includes(`${sensor.name} ${sensor.tag}`, query) && (scope === 'nk' || findAsset(sensor.assetId)?.parentId === scope)
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select items={SCOPE_ITEMS} value={scope} onValueChange={setScope}>
          <SelectTrigger aria-label="Search in" className="w-44 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Search
          aria-label={`Search time series in ${scopeLabel}`}
          placeholder="Search time series"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
        />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {matches.length} time series in {scopeLabel}
      </p>
      <ul className="flex h-28 flex-col gap-3 overflow-y-auto text-sm">
        {matches.map((sensor) => (
          <li key={sensor.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">
              {sensor.name} <span className="text-muted-foreground">· {findAsset(sensor.assetId)?.name}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{sensor.tag}</span>
          </li>
        ))}
        {matches.length === 0 && scope !== 'nk' ? (
          <li className="flex items-center justify-between gap-4 text-muted-foreground">
            Nothing in {scopeLabel}.
            <Button variant="secondary" size="sm" onClick={() => setScope('nk')}>
              Search all of Nordkapp
            </Button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SearchExperienceKeyboardHints() {
  const results = assetResults('compressor').slice(0, 3);
  const [active, setActive] = useState(0);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center gap-2">
        <Search
          aria-label="Search equipment"
          placeholder="Search equipment"
          defaultValue="compressor"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') setActive((active + 1) % results.length);
            if (event.key === 'ArrowUp') setActive((active + results.length - 1) % results.length);
          }}
        />
      </div>
      <SearchExperiencePanel label="Results">
        <ul className="flex flex-col">
          {results.map((result, index) => (
            <li
              key={result.id}
              aria-current={index === active ? 'true' : undefined}
              className={`flex items-center gap-3 rounded-lg px-2 py-2 ${index === active ? 'bg-accent-background' : ''}`}
            >
              <span aria-hidden className="flex shrink-0 text-muted-foreground [&>svg]:size-4">
                {result.icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{result.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{result.meta}</span>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-default px-2 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShortcutHint keys={['up']} />
            <ShortcutHint keys={['down']} /> Move
          </span>
          <span className="flex items-center gap-2">
            <ShortcutHint keys={['enter']} /> Open
          </span>
          <span className="flex items-center gap-2">
            <ShortcutHint keys={['esc']} /> Close
          </span>
          <span className="ml-auto flex items-center gap-2">
            <Kbd>/</Kbd> Focus search
          </span>
        </div>
      </SearchExperiencePanel>
    </div>
  );
}

function SearchExperienceGroupedResults() {
  const [query, setQuery] = useState('compressor');
  const [opened, setOpened] = useState<string | null>(null);
  const assets = assetResults(query);
  const series = seriesResults(query);
  const documents = documentResults(query);
  const total = assets.length + series.length + documents.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <Search
        aria-label="Search Nordkapp"
        placeholder="Search assets, time series and documents"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="px-2 text-xs text-muted-foreground" aria-live="polite">
        {total === 0 ? `No results for "${query}"` : `${total} results in 3 kinds`}
        {opened ? ` · Opened ${opened}` : ''}
      </p>
      <div className="flex flex-col gap-4">
        <SearchResultGroup
          heading="Assets"
          total={assets.length}
          results={assets.slice(0, 3)}
          onSelect={setOpened}
          onViewAll={() => undefined}
        />
        <SearchResultGroup
          heading="Time series"
          total={series.length}
          results={series.slice(0, 3)}
          onSelect={setOpened}
          onViewAll={() => undefined}
        />
        <SearchResultGroup heading="Documents" results={documents.slice(0, 2)} onSelect={setOpened} />
      </div>
    </div>
  );
}

function SearchExperienceExactMatch() {
  const asset = findAsset('23-ka-9103');

  return (
    <div className="flex w-full flex-col gap-3">
      <Search aria-label="Search by tag" placeholder="Search by tag" defaultValue="23-KA-9103" />
      <section className="flex flex-col gap-3 rounded-xl border border-default p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Exact tag match</span>
          <StatusBadge status={asset?.state ?? 'tripped'} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium tabular-nums text-base-foreground">{asset?.tag}</span>
          <span className="text-sm text-muted-foreground">
            {asset?.name} · {areaOf('23-ka-9103')}
          </span>
        </div>
        <div>
          <Button size="sm">
            Open asset <IconArrowRight />
          </Button>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">4 more results mention this tag.</p>
    </div>
  );
}

function SearchExperienceResultHeader() {
  const [sort, setSort] = useState('relevance');
  const [kind, setKind] = useState('all');
  const counts = { all: 42, assets: 9, series: 27, documents: 6 };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="truncate text-xl font-semibold text-base-foreground">Results for &quot;compressor&quot;</h4>
          <p className="text-sm tabular-nums text-muted-foreground">
            {kind === 'all' ? `${counts.all} results in Nordkapp` : `Filtered from ${counts.all} results in Nordkapp`}
          </p>
        </div>
        <Select items={SORT_ITEMS} value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Sort results" size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs
        value={kind}
        onValueChange={(value) => {
          if (isString(value)) setKind(value);
        }}
      >
        <TabsList showSeparator aria-label="Result kind">
          <TabsTrigger value="all" badge={counts.all}>
            All
          </TabsTrigger>
          <TabsTrigger value="assets" badge={counts.assets}>
            Assets
          </TabsTrigger>
          <TabsTrigger value="series" badge={counts.series}>
            Time series
          </TabsTrigger>
          <TabsTrigger value="documents" badge={counts.documents}>
            Documents
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function SearchExperienceAssetRows() {
  const assets = EQUIPMENT.filter((asset) => includes(asset.name, 'compressor'));

  return (
    <ul className="flex w-full flex-col">
      {assets.map((asset) => (
        <li key={asset.id} className="flex items-center gap-4 border-b border-default py-3 last:border-b-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-base-foreground">{asset.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              Nordkapp · {areaOf(asset.id)} · Criticality {asset.criticality}
            </span>
          </div>
          <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{asset.tag}</span>
          <StatusBadge status={asset.state} outline />
        </li>
      ))}
    </ul>
  );
}

function SearchExperienceSeriesRows() {
  const sensors = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 4);

  return (
    <ul className="flex w-full flex-col">
      {sensors.map((sensor) => (
        <li key={sensor.id} className="flex items-center gap-4 border-b border-default py-3 last:border-b-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-base-foreground">{sensor.name}</span>
            <span className="truncate text-xs tabular-nums text-muted-foreground">
              {sensor.tag} · {findAsset(sensor.assetId)?.name}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm tabular-nums text-base-foreground">
              {sensor.value.toLocaleString('en-US', { maximumFractionDigits: sensor.decimals })} {sensor.unit}
            </span>
            <span className="text-xs text-muted-foreground">Latest value, 14:00</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SearchExperienceDocumentRows() {
  return (
    <ul className="flex w-full flex-col">
      {DOCUMENTS.map((document) => (
        <li key={document.id} className="flex flex-col gap-2 border-b border-default py-3 last:border-b-0">
          <div className="flex items-center gap-2">
            <IconFileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground">{document.title}</span>
            <Badge variant="secondary">{document.kind}</Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{document.snippet}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            Found on {document.where.toLowerCase()} · {document.number} · {document.revision}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SearchExperienceFilterChips() {
  const [query, setQuery] = useState('temperature');
  const [areas, setAreas] = useState<readonly string[]>(['nk-23']);
  const [goodOnly, setGoodOnly] = useState(false);
  const areaOptions = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');

  const matches = SENSORS.filter((sensor) => {
    const parent = findAsset(sensor.assetId)?.parentId ?? '';
    return (
      includes(`${sensor.name} ${sensor.tag}`, query) &&
      (areas.length === 0 || areas.includes(parent)) &&
      (!goodOnly || sensor.quality === 'good')
    );
  });

  const toggleArea = (id: string) => setAreas(areas.includes(id) ? areas.filter((other) => other !== id) : [...areas, id]);
  const filtered = areas.length > 0 || goodOnly;

  return (
    <div className="flex w-full flex-col gap-3">
      <Search
        aria-label="Search time series"
        placeholder="Search time series"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {areaOptions.map((area) => (
          <Button
            key={area.id}
            variant={areas.includes(area.id) ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={areas.includes(area.id)}
            onClick={() => toggleArea(area.id)}
          >
            {area.name}
          </Button>
        ))}
        <Button
          variant={goodOnly ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={goodOnly}
          onClick={() => setGoodOnly(!goodOnly)}
        >
          Good quality only
        </Button>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAreas([]);
              setGoodOnly(false);
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {matches.length} of {SENSORS.length} time series
      </p>
      <ul className="flex h-36 flex-col gap-3 overflow-y-auto text-sm">
        {matches.map((sensor) => (
          <li key={sensor.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">
              {sensor.name} <span className="text-muted-foreground">· {findAsset(sensor.assetId)?.name}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{sensor.tag}</span>
          </li>
        ))}
        {matches.length === 0 ? <li className="text-muted-foreground">No time series match. Remove a filter to see more.</li> : null}
      </ul>
    </div>
  );
}

function SearchExperienceSavedSearches() {
  const initial = [
    { id: 's1', name: 'Tripped equipment', count: 1 },
    { id: 's2', name: 'Bad quality signals', count: 1 },
    { id: 's3', name: 'Overdue work orders', count: 1 },
  ];
  const [saved, setSaved] = useState(initial);
  const hasCurrent = saved.some((search) => search.id === 'current');

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-base-foreground">Saved searches</h4>
        {hasCurrent ? (
          <Button variant="ghost" size="sm" onClick={() => setSaved(initial)}>
            Reset
          </Button>
        ) : null}
      </div>
      <ul className="flex flex-col">
        {saved.map((search) => (
          <SearchExperienceRow
            key={search.id}
            icon={<IconBookmark />}
            title={search.name}
            meta={String(search.count)}
            onSelect={() => undefined}
          />
        ))}
      </ul>
      {hasCurrent ? null : (
        <div className="px-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSaved([...saved, { id: 'current', name: 'Compressor temperatures', count: 2 }])}
          >
            <IconPlus /> Save current search
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchExperienceTypeTabs() {
  const [kind, setKind] = useState('assets');
  const groups: Record<string, SearchResult[]> = {
    assets: assetResults('pump'),
    series: seriesResults('pump'),
    documents: documentResults('compressor').slice(0, 0),
  };
  const shown = groups[kind] ?? [];

  return (
    <div className="flex w-full flex-col gap-3">
      <Tabs
        value={kind}
        onValueChange={(value) => {
          if (isString(value)) setKind(value);
        }}
      >
        <TabsList size="small" showSeparator aria-label="Result kind">
          <TabsTrigger value="assets" badge={groups.assets.length}>
            Assets
          </TabsTrigger>
          <TabsTrigger value="series" badge={groups.series.length}>
            Time series
          </TabsTrigger>
          <TabsTrigger value="documents" badge={0}>
            Documents
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex min-h-36 flex-col">
        {shown.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            No documents mention &quot;pump&quot;. Assets and time series do.
          </p>
        ) : (
          <SearchResultGroup heading={kind === 'assets' ? 'Assets' : 'Time series'} results={shown.slice(0, 3)} onSelect={() => undefined} />
        )}
      </div>
    </div>
  );
}

function SearchExperienceLoadMore() {
  const all = SENSORS;
  const [shown, setShown] = useState(4);
  const [loading, setLoading] = useState(false);

  const more = () => {
    setLoading(true);
    void wait(900).then(() => {
      setShown(Math.min(shown + 4, all.length));
      setLoading(false);
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <ul className="flex h-36 flex-col gap-3 overflow-y-auto text-sm" aria-busy={loading}>
        {all.slice(0, shown).map((sensor) => (
          <li key={sensor.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">{sensor.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{sensor.tag}</span>
          </li>
        ))}
      </ul>
      <div className="flex min-h-7 items-center justify-between gap-4 border-t border-default pt-3">
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          Showing {shown} of {all.length} time series
        </span>
        {shown < all.length ? (
          <Button variant="secondary" size="sm" aria-busy={loading || undefined} disabled={loading} onClick={more}>
            {loading ? <Loader size={16} aria-hidden /> : null}
            {loading ? 'Loading…' : 'Show 4 more'}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShown(4)}>
            Reset example
          </Button>
        )}
      </div>
    </div>
  );
}

function SearchExperienceLoading() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Search aria-label="Search time series" placeholder="Search time series" defaultValue="vibration" />
      <div className="flex min-h-7 items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          {loading ? (
            <>
              <Loader variant="inline" size={14} /> Searching 1,284 time series…
            </>
          ) : (
            '1 time series'
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLoading(!loading)}>
          {loading ? 'Show results' : 'Show loading'}
        </Button>
      </div>
      <div className="flex min-h-36 flex-col">
        {loading ? (
          <SkeletonList rows={3} media={false} trailing label="Loading results" />
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {SENSORS.filter((sensor) => includes(sensor.name, 'vibration')).map((sensor) => (
              <li key={sensor.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-base-foreground">{sensor.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{sensor.tag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SearchExperienceNoResults() {
  const [query, setQuery] = useState('23-KA-91O1');
  const matches = assetResults(query);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {matches.length > 0 || query.trim() === '' ? (
        <p className="min-h-56 text-sm text-muted-foreground" aria-live="polite">
          {query.trim() === '' ? 'Type a tag or a name.' : `${matches.length} equipment found.`}
        </p>
      ) : (
        <div className="flex min-h-56 flex-col items-center gap-4">
          <EmptyState type="no-results">
            <EmptyStateIcon />
            <EmptyStateTitle as="h4">No equipment matches &quot;{query}&quot;</EmptyStateTitle>
            <EmptyStateDescription>The search covers tags and names in Nordkapp.</EmptyStateDescription>
            <EmptyStateActions className="flex-row">
              <Button variant="secondary" size="sm" onClick={() => setQuery('23-KA-9101')}>
                Search for 23-KA-9101
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </EmptyStateActions>
          </EmptyState>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            <li>Check for a letter O in place of a zero.</li>
            <li>Search by part of the tag, such as 23-KA.</li>
            <li>Try the equipment name, such as compressor.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchExperienceStartPrompt() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Search aria-label="Search Nordkapp" placeholder="Search Nordkapp" />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">You can search by</span>
        <ul className="flex flex-col gap-2 text-sm text-medium-foreground">
          <li className="flex items-baseline justify-between gap-4">
            Tag <span className="text-xs tabular-nums text-muted-foreground">23-KA-9101</span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            Name <span className="text-xs text-muted-foreground">recompressor</span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            Document number <span className="text-xs tabular-nums text-muted-foreground">NK-23-PID-0012</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SearchExperienceDidYouMean() {
  const [query, setQuery] = useState('recompresor');
  const corrected = query === 'recompressor';

  return (
    <div className="flex w-full flex-col gap-3">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {corrected ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">1 result</p>
          <Button variant="ghost" size="sm" onClick={() => setQuery('recompresor')}>
            Reset
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No results. Did you mean{' '}
          <button
            type="button"
            className="cursor-pointer rounded-sm font-medium text-base-foreground underline underline-offset-2 outline-none focus-visible:shadow-focus-ring"
            onClick={() => setQuery('recompressor')}
          >
            recompressor
          </button>
          ?
        </p>
      )}
      {corrected ? (
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-base-foreground">Recompressor</span>
          <span className="text-xs tabular-nums text-muted-foreground">23-KA-9103</span>
        </div>
      ) : null}
    </div>
  );
}

function SearchExperienceError() {
  const [attempts, setAttempts] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const retry = () =>
    wait(1200).then(() => {
      setAttempts(attempts + 1);
      if (attempts >= 1) {
        setLoaded(true);
        return;
      }
      throw new Error('Search unavailable');
    });

  if (loaded) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">9 results loaded.</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLoaded(false);
            setAttempts(0);
          }}
        >
          Reset example
        </Button>
      </div>
    );
  }

  return (
    <RetryBlock
      title="Couldn't search"
      description="The search service did not answer. Your query is kept."
      retryLabel="Search again"
      retryingLabel="Searching…"
      onRetry={retry}
    />
  );
}

function SearchExperienceCommandPalette() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2">
      <CommandPalette
        hotkey="k"
        triggerLabel="Search or run a command"
        groups={[
          {
            id: 'go',
            heading: 'Go to',
            items: [
              { id: 'alarms', label: 'Go to alarms', icon: <IconBell />, shortcut: 'G A', onSelect: () => setLast('Go to alarms') },
              { id: 'orders', label: 'Go to work orders', icon: <IconTool />, shortcut: 'G W', onSelect: () => setLast('Go to work orders') },
            ],
          },
          {
            id: 'actions',
            heading: 'Actions',
            items: [
              { id: 'create', label: 'Create work order', icon: <IconPlus />, shortcut: 'C W', onSelect: () => setLast('Create work order') },
              { id: 'chart', label: 'Create chart', icon: <IconChartLine />, onSelect: () => setLast('Create chart') },
            ],
          },
        ]}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last ? `Last command: ${last}` : 'Opens with the button or the shortcut.'}
      </p>
    </div>
  );
}

function SearchExperienceQuickSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('23-ka-9101');

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconSearch /> Open asset switcher
      </Button>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Viewing {findAsset(current)?.name}
      </p>
      <CommandDialog open={open} onOpenChange={setOpen} title="Go to asset" description="Search equipment by tag or name">
        <CommandInput placeholder="Go to asset by tag or name" />
        <CommandList>
          <CommandEmpty>No equipment by that tag or name.</CommandEmpty>
          <CommandGroup heading="Gas compression">
            {EQUIPMENT.filter((asset) => asset.parentId === 'nk-23').map((asset) => (
              <CommandItem
                key={asset.id}
                value={`${asset.tag} ${asset.name}`}
                onSelect={() => {
                  setCurrent(asset.id);
                  setOpen(false);
                }}
              >
                <IconBox />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{asset.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{asset.tag}</span>
                </span>
                {asset.id === current ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Other areas">
            {EQUIPMENT.filter((asset) => asset.parentId !== 'nk-23').map((asset) => (
              <CommandItem
                key={asset.id}
                value={`${asset.tag} ${asset.name}`}
                onSelect={() => {
                  setCurrent(asset.id);
                  setOpen(false);
                }}
              >
                <IconBox />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{asset.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{asset.tag}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

function SearchExperiencePrefixes() {
  const prefixes = [
    { key: '>', label: 'Run a command', example: '> create work order' },
    { key: '@', label: 'Find a person', example: '@ aisha' },
    { key: ':', label: 'Jump to a tag', example: ': 23-KA-9103' },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-xs font-medium text-muted-foreground">Start with a prefix to narrow the palette</span>
      <ul className="flex flex-col gap-3">
        {prefixes.map((prefix) => (
          <li key={prefix.key} className="flex items-center gap-3">
            <Kbd>{prefix.key}</Kbd>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{prefix.label}</span>
              <span className="truncate text-xs text-muted-foreground">{prefix.example}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default definePage({
  id: 'search-experiences',
  title: 'Search experiences',
  summary:
    'Search beyond the field: what appears before, while and after typing. Recent searches and suggestions, results grouped by kind, ways to narrow them, the states in between, and the command palette.',
  guidance: {
    use: [
      'A placeholder and a scope that say what is being searched.',
      'Results grouped by kind, each row with its tag and where it lives.',
      'A count that updates as the query and filters change.',
      'A no-results state that repeats the query and suggests a fix.',
    ],
    avoid: [
      'An empty panel before the user types; show recent searches or what can be searched.',
      'One flat list mixing assets, time series and documents.',
      'Highlighting alone to explain a match; say where it was found.',
      'The command palette for searching content; it is for commands and jumps.',
    ],
  },
  source,
  sections: [
    {
      id: 'fields',
      title: 'Search fields',
      description: 'The field and what hangs under it. Panels are shown open, in the page, so they can be compared.',
      specimens: [
        {
          id: 'SearchExperienceRecent',
          title: 'Recent searches',
          note: 'The field has focus and is empty: offer the last searches, each removable. Click one to reuse it.',
          origin: 'custom',
          size: 'md',
          Component: SearchExperienceRecent,
        },
        {
          id: 'SearchExperienceSuggestions',
          title: 'Suggestions',
          note: 'While typing: a few likely targets with their tags, and Enter to search everything. Type to try.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ShortcutHint.tsx'],
          Component: SearchExperienceSuggestions,
        },
        {
          id: 'SearchExperienceScoped',
          title: 'Scoped search',
          note: 'The same query means different things per area: the scope sits beside the field and widens in one click.',
          origin: 'custom',
          size: 'md',
          Component: SearchExperienceScoped,
        },
        {
          id: 'SearchExperienceKeyboardHints',
          title: 'Keyboard hints',
          note: 'A search people live in: the panel footer teaches the keys. Focus the field and use the arrows.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ShortcutHint.tsx'],
          Component: SearchExperienceKeyboardHints,
        },
      ],
    },
    {
      id: 'results',
      title: 'Results',
      description: 'How matches are listed: grouped by kind, and with the facts that make each kind recognisable.',
      specimens: [
        {
          id: 'SearchExperienceGroupedResults',
          title: 'Grouped results',
          note: 'A search across kinds: top matches per kind with counts and a way to see all. Type to try.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/states/SearchResultGroup.tsx'],
          Component: SearchExperienceGroupedResults,
        },
        {
          id: 'SearchExperienceExactMatch',
          title: 'Exact tag match',
          note: 'The query is a complete tag: lift that one result above the rest with its state and an open action.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: SearchExperienceExactMatch,
        },
        {
          id: 'SearchExperienceResultHeader',
          title: 'Results page header',
          note: 'A full results page: the query, the count, tabs per kind with counts, and the sort order.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SearchExperienceResultHeader,
        },
        {
          id: 'SearchExperienceAssetRows',
          title: 'Asset results',
          note: 'Rows for equipment: name, where it sits, tag and current state.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: SearchExperienceAssetRows,
        },
        {
          id: 'SearchExperienceSeriesRows',
          title: 'Time series results',
          note: 'Rows for signals: name, tag and parent, with the latest value so the right one is easy to spot.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SearchExperienceSeriesRows,
        },
        {
          id: 'SearchExperienceDocumentRows',
          title: 'Document results with context',
          note: 'Rows for documents: the passage that matched and where it is, in words instead of highlighting.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SearchExperienceDocumentRows,
        },
      ],
    },
    {
      id: 'refining',
      title: 'Refining',
      description: 'Narrowing a result set and coming back to it later.',
      specimens: [
        {
          id: 'SearchExperienceFilterChips',
          title: 'Search with filter chips',
          note: 'A few common filters next to the query: toggle chips, with a live count and one way to clear them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: SearchExperienceFilterChips,
        },
        {
          id: 'SearchExperienceSavedSearches',
          title: 'Saved searches',
          note: 'Queries people run every shift: saved with a name and the current number of matches.',
          origin: 'custom',
          align: 'stretch',
          Component: SearchExperienceSavedSearches,
        },
        {
          id: 'SearchExperienceTypeTabs',
          title: 'Results by kind',
          note: 'One kind at a time: tabs with counts, including the kinds that have none.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/SearchResultGroup.tsx'],
          Component: SearchExperienceTypeTabs,
        },
        {
          id: 'SearchExperienceLoadMore',
          title: 'Load more results',
          note: 'A long result list: say how many are shown and load the next batch on request. Click to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SearchExperienceLoadMore,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the results area shows when there are no results to show yet, or at all.',
      specimens: [
        {
          id: 'SearchExperienceLoading',
          title: 'Loading results',
          note: 'The search takes a moment: say how much is being searched and reserve the rows.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SearchExperienceLoading,
        },
        {
          id: 'SearchExperienceNoResults',
          title: 'No results, with tips',
          note: 'Nothing matched: repeat the query, offer the likely fix as an action and list what else to try.',
          origin: 'custom',
          size: 'md',
          Component: SearchExperienceNoResults,
        },
        {
          id: 'SearchExperienceStartPrompt',
          title: 'Before typing',
          note: 'A new user with no recent searches: show what the search understands.',
          origin: 'custom',
          align: 'stretch',
          Component: SearchExperienceStartPrompt,
        },
        {
          id: 'SearchExperienceDidYouMean',
          title: 'Did you mean',
          note: 'A likely typo: offer the corrected query as a link in the sentence. Click to try.',
          origin: 'custom',
          align: 'stretch',
          Component: SearchExperienceDidYouMean,
        },
        {
          id: 'SearchExperienceError',
          title: 'Search failed',
          note: 'The search service failed: keep the query and retry in place. The first retry fails.',
          origin: 'custom',
          uses: ['feedback/RetryBlock.tsx'],
          Component: SearchExperienceError,
        },
      ],
    },
    {
      id: 'palette',
      title: 'Command palette',
      description: 'Keyboard-first search for commands and jumps. Each button opens a palette.',
      specimens: [
        {
          id: 'SearchExperienceCommandPalette',
          title: 'Command palette',
          note: 'Commands and destinations across the app: a search-shaped button that shows its shortcut.',
          origin: 'custom',
          uses: ['navigation/CommandPalette.tsx'],
          Component: SearchExperienceCommandPalette,
        },
        {
          id: 'SearchExperienceQuickSwitcher',
          title: 'Asset switcher',
          note: 'Jumping between equipment by tag: two-line items, grouped by area, with the current one marked.',
          origin: 'custom',
          Component: SearchExperienceQuickSwitcher,
        },
        {
          id: 'SearchExperiencePrefixes',
          title: 'Palette prefixes',
          note: 'One palette for several jobs: a prefix narrows it, and the empty palette lists the prefixes.',
          origin: 'custom',
          align: 'stretch',
          Component: SearchExperiencePrefixes,
        },
      ],
    },
  ],
});
